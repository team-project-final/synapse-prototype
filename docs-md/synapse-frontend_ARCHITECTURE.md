# synapse-frontend — ARCHITECTURE

> **Synapse Wiki**: [03_프로젝트_아키텍처_정의서](https://github.com/team-project-final/documents/wiki/03_%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8_%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98_%EC%A0%95%EC%9D%98%EC%84%9C) 기준선
> **Version**: v1.0 | **Updated**: 2026-05-18

---

## 1. 책임 범위

Synapse 플랫폼의 **유일한 클라이언트 애플리케이션**. Web / iOS / Android 3개 플랫폼을 단일 Flutter 코드베이스로 지원.

| 항목 | 내용 |
|------|------|
| 플랫폼 | Flutter Web (CanvasKit) / iOS / Android |
| 배포 | Web → Cloudflare Pages, iOS → App Store, Android → Google Play |
| 주요 화면 | 로그인/회원가입, 노트 편집, 카드 학습, 그래프 시각화, 커뮤니티, 설정 |
| 호출 대상 | Spring Cloud Gateway 1곳 (직접 호출 서비스 없음) |
| 인증 | JWT (Access 15min) + Refresh httpOnly Cookie |

---

## 2. 레포 구조

```
synapse-frontend/
├── lib/
│   ├── main.dart                      # 앱 진입점
│   ├── app/                           # 앱 전역 (라우터, 테마, 로컬라이제이션)
│   │   ├── router.dart                # GoRouter 설정
│   │   ├── theme/
│   │   └── localization/
│   ├── core/                          # 공통 기능
│   │   ├── network/                   # Dio 클라이언트, 인터셉터
│   │   ├── storage/                   # Hive, SecureStorage
│   │   ├── auth/                      # 토큰 관리
│   │   ├── error/                     # 공통 에러 처리
│   │   ├── observability/             # 로그, Sentry
│   │   └── widgets/                   # 공통 위젯 (Button, Dialog, ...)
│   └── features/                      # 기능별 모듈 (Vertical Slice)
│       ├── auth/
│       │   ├── data/                  # repository, datasource, DTO
│       │   ├── domain/                # entity, usecase
│       │   └── presentation/          # screen, widget, controller (Riverpod)
│       ├── note/
│       ├── card/
│       ├── graph/
│       ├── community/
│       ├── gamification/
│       └── notification/
├── assets/
├── test/
├── integration_test/
├── web/                                # Web 빌드 진입점
├── ios/
├── android/
├── pubspec.yaml
└── analysis_options.yaml
```

### 아키텍처 패턴

**Feature-based + Clean Architecture (Lite)**

```
presentation (UI + Riverpod Controller)
     ↓ 호출
   domain (UseCase, Entity)
     ↓ 호출
    data (Repository, DataSource, DTO)
     ↓
  core/network → Gateway
```

---

## 3. 핵심 의존성

| 카테고리 | 라이브러리 | 용도 |
|----------|-----------|------|
| 라우팅 | `go_router` ^14.x | 선언적 라우팅, Deep Link |
| 상태관리 | `flutter_riverpod` ^3.x | Provider 기반 상태 + DI |
| 코드 생성 | `riverpod_generator`, `freezed`, `json_serializable` | 보일러플레이트 제거 |
| HTTP | `dio` ^5.x | 인터셉터, 재시도 |
| WebSocket | `web_socket_channel` | 실시간 알림/그래프 |
| 로컬 저장 | `hive` + `flutter_secure_storage` | 노트 캐시 / 토큰 |
| 마크다운 | `flutter_markdown`, `markdown` | 노트 렌더링 |
| 그래프 시각화 | `graphview` 또는 직접 구현 (Web: D3.js bridge) | 노트 그래프 |
| 차트 | `fl_chart` | 학습 통계 |
| 모니터링 | `sentry_flutter` | 에러 추적 |
| OAuth | `flutter_appauth`, `sign_in_with_apple`, `google_sign_in` | 외부 IdP |

---

## 4. 외부 인터페이스

### 4.1 Gateway REST API 호출

`core/network/api_client.dart`에서 Dio 인스턴스 단일화:

```dart
final apiClient = Dio(BaseOptions(
  baseUrl: const String.fromEnvironment('API_BASE_URL'),
  connectTimeout: const Duration(seconds: 10),
  receiveTimeout: const Duration(seconds: 30),
));

apiClient.interceptors.addAll([
  AuthInterceptor(),                      // JWT 자동 첨부 + Refresh 처리
  TraceIdInterceptor(),                   // traceparent 헤더 주입
  ErrorInterceptor(),                     // RFC 7807 → Exception 변환
  LoggingInterceptor(),
]);
```

### 4.2 WebSocket

- `/ws/notifications` → 인앱 알림 푸시
- `/ws/graph` → 그래프 협업 (Phase 2)

연결 관리: 재연결, 백오프, traceparent 헤더 포함.

### 4.3 인증 흐름

```
1. 로그인 (이메일/OAuth)
   POST /api/v1/auth/login → accessToken (응답) + refreshToken (httpOnly Cookie)
2. 이후 모든 요청: Authorization: Bearer {accessToken}
3. 401 응답 시:
   - AuthInterceptor가 자동으로 POST /api/v1/auth/refresh 호출
   - Refresh Token Cookie는 브라우저/WebView가 자동 첨부
   - 새 accessToken 받아서 원 요청 재시도
4. Refresh 실패 → 로그인 화면으로 강제 이동
```

⚠️ **Flutter Web에서 httpOnly Cookie 사용**: CORS + SameSite + Credentials 설정 필수. `dio.options.extra['withCredentials'] = true`.

---

## 5. 상태관리 패턴 (Riverpod 3.x)

### 5.1 Provider 분류

| Provider | 용도 |
|----------|------|
| `Provider` | 불변 의존성 (Dio, Repository 등) |
| `NotifierProvider` | 변경 가능한 상태 (화면 상태) |
| `AsyncNotifierProvider` | 비동기 상태 (API 호출) |
| `StreamProvider` | WebSocket 등 스트림 |
| `FutureProvider` | 일회성 비동기 (Splash) |

### 5.2 코드 생성 표준

```dart
// note_list_controller.dart
@riverpod
class NoteListController extends _$NoteListController {
  @override
  Future<List<NoteSummary>> build() async {
    final repo = ref.read(noteRepositoryProvider);
    return repo.getRecent();
  }
  
  Future<void> createNote(String title) async {
    final repo = ref.read(noteRepositoryProvider);
    final created = await repo.create(title);
    state = AsyncData([created, ...state.value ?? []]);
  }
}
```

빌드 시 `dart run build_runner build`로 `.g.dart` 생성.

---

## 6. 로컬 저장소 전략

| 데이터 | 저장소 | 이유 |
|--------|--------|------|
| Access Token (메모리) | Riverpod state | 페이지 새로고침 시 Refresh로 재발급 |
| Refresh Token | httpOnly Cookie (Web) / SecureStorage (Mobile) | XSS 방지 |
| 노트 초안 (오프라인) | Hive | 동기화 전 임시 저장 |
| 최근 본 노트 캐시 | Hive (LRU 100개) | 빠른 로드 |
| 학습 통계 캐시 | Hive (TTL 5분) | API 호출 최소화 |
| 사용자 설정 | SharedPreferences | 가벼운 키-값 |

---

## 7. 라우팅 (GoRouter)

```dart
final router = GoRouter(
  initialLocation: '/',
  redirect: authGuard,                    // 비인증 사용자는 /login으로
  routes: [
    GoRoute(path: '/login', builder: ...),
    GoRoute(path: '/signup', builder: ...),
    ShellRoute(                            // 인증 후 진입하는 셸
      builder: (ctx, state, child) => MainShell(child: child),
      routes: [
        GoRoute(path: '/notes', ...),
        GoRoute(path: '/notes/:id', ...),
        GoRoute(path: '/cards', ...),
        GoRoute(path: '/graph', ...),
        GoRoute(path: '/community', ...),
        GoRoute(path: '/settings', ...),
      ],
    ),
  ],
  errorBuilder: (ctx, state) => NotFoundScreen(),
);
```

Deep Link: `synapse://notes/{id}` (모바일) / `https://synapse.app/notes/{id}` (Web).

---

## 8. 빌드 / 배포

### 8.1 환경 분리

```bash
# Development
flutter run --dart-define=API_BASE_URL=http://localhost:8080 \
            --dart-define=ENV=dev

# Staging
flutter build web --dart-define=API_BASE_URL=https://api-staging.synapse.app \
                  --dart-define=ENV=staging

# Production
flutter build web --release \
                  --dart-define=API_BASE_URL=https://api.synapse.app \
                  --dart-define=ENV=prod \
                  --web-renderer canvaskit
```

### 8.2 CI/CD (GitHub Actions)

```yaml
# .github/workflows/web.yml
on:
  push:
    branches: [main]
jobs:
  build-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
      - run: flutter pub get
      - run: dart run build_runner build --delete-conflicting-outputs
      - run: flutter analyze
      - run: flutter test --coverage
      - run: flutter build web --release \
            --dart-define=API_BASE_URL=${{ secrets.PROD_API_URL }}
      - uses: cloudflare/wrangler-action@v3
        with:
          command: pages deploy build/web --project-name=synapse-frontend
```

| 플랫폼 | 배포 도구 | 트리거 |
|--------|----------|--------|
| Web | Cloudflare Pages | `main` 푸시 |
| Android | Fastlane → Google Play | Git Tag `v*` |
| iOS | Fastlane → App Store Connect | Git Tag `v*` |

---

## 9. 관측성

### 9.1 분산 추적

- 모든 요청에 `traceparent` 헤더 자동 주입 (Dio 인터셉터)
- Sentry 트랜잭션과 OTel trace ID 연결

### 9.2 에러 추적

- Sentry SDK 활성화 (prod/staging)
- Riverpod Provider Observer로 모든 상태 변경 로깅 (dev only)
- 사용자 ID + tenant ID는 Sentry user context에 설정

### 9.3 성능

- Flutter DevTools로 frame rate 측정
- Web: Lighthouse CI (PR마다 자동)
- 목표: First Contentful Paint < 1.5s, Time to Interactive < 3s

---

## 10. 보안

| 항목 | 구현 |
|------|------|
| 토큰 저장 (Web) | Refresh Token은 httpOnly Cookie, Access Token은 메모리만 |
| 토큰 저장 (Mobile) | flutter_secure_storage (Keychain / EncryptedSharedPreferences) |
| 인증서 핀닝 (Mobile) | Dio + http_certificate_pinning |
| 코드 난독화 | `flutter build --obfuscate --split-debug-info` (Mobile only) |
| 외부 링크 | `url_launcher` 사용 시 사용자 확인 다이얼로그 |
| 마크다운 XSS | `flutter_markdown` 기본 sanitize, 커스텀 HTML 비활성 |
| 딥링크 검증 | 외부에서 들어오는 ID는 서버 권한 재검증 |

---

## 11. 로컬 개발

### 11.1 사전 준비

```bash
# Flutter 3.x + Dart 3.x (FVM 권장)
fvm install 3.27.0
fvm use 3.27.0

# 의존성 설치
flutter pub get

# 코드 생성 (변경 시마다)
dart run build_runner watch --delete-conflicting-outputs
```

### 11.2 백엔드 연동

```bash
# 백엔드 docker compose 기동 (별도 레포)
# Gateway가 localhost:8080에서 listening

flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:8080
```

### 11.3 테스트

```bash
flutter test                           # 단위 + 위젯
flutter test integration_test/         # E2E
flutter test --coverage                # 커버리지
```

목표 커버리지: 도메인/UseCase 80%+, Repository 70%+, Widget 60%+.

---

## 12. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| Web에서 Cookie 미전송 | CORS `withCredentials` 누락 | Dio: `extra['withCredentials'] = true`, Gateway: `Access-Control-Allow-Credentials: true` |
| Hot reload 후 Provider 상태 꼬임 | `ref.read` 남용 | `ref.watch` / `ref.listen` 우선 사용 |
| CanvasKit 로딩 느림 | CDN 미사용 | Flutter 빌드 시 `--web-renderer canvaskit-experimental` + Cloudflare 캐시 |
| Mobile에서 Cookie 미적용 | Cookie Jar 미설정 | `dio_cookie_manager` + `PersistCookieJar` 추가 |

---

## 13. 참고 문서

- **Wiki 03_프로젝트_아키텍처_정의서** — 전체 시스템 아키텍처
- **Wiki 04_API_명세서** — 호출 대상 API
- **Wiki 05_화면_흐름_시퀀스_다이어그램** — 화면 플로우
- **Wiki 06_화면_기능_정의서** — 화면별 기능
- **03-A_통신_운영_상세서** — 백엔드 통신 SLO
- **03-B_내부외부_경계_보안_명세** — JWT/Cookie 정책
