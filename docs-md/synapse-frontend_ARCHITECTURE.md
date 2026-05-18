# synapse-frontend — ARCHITECTURE

> **Wiki 03번** 기준선 + **03-D 어댑터 표준** 적용
> **Version**: v2.0 | **Updated**: 2026-05-18
> 본 문서는 레포의 실제 코드 구조(README + service-boundary 모델)를 기반으로 작성됨

---

## 1. 책임 범위

Synapse 플랫폼의 **유일한 클라이언트 애플리케이션**. Flutter 단일 코드베이스로 Web / iOS / Android 3개 플랫폼 지원.

- 호출 대상: API Gateway 1곳 (백엔드 svc 직접 호출 없음)
- 인증: JWT (Access) + Refresh
- 환경 분리: `APP_ENV=dev|staging|prod` Dart define

---

## 2. 레포 구조 (실제)

```
synapse-frontend/
├── docs/                                   # 아키텍처 / 가이드 문서
├── lib/
│   ├── main.dart
│   ├── app.dart
│   ├── core/
│   │   ├── constants/                      # AppRoutes 등 공통 상수
│   │   ├── network/                        # Dio 클라이언트, 환경 선택
│   │   ├── router/                         # GoRouter 라우트 테이블
│   │   ├── services/                       # ServiceBoundary 레지스트리
│   │   └── theme/                          # 디자인 토큰, ThemeData
│   ├── services/                           # ★ 서비스 경계별 디렉토리
│   │   ├── platform/                       # → synapse-platform-svc
│   │   │   ├── auth/
│   │   │   ├── billing/
│   │   │   ├── notifications/
│   │   │   ├── settings/
│   │   │   └── admin/
│   │   ├── engagement/                     # → synapse-engagement-svc
│   │   │   ├── community/
│   │   │   └── gamification/
│   │   ├── knowledge/                      # → synapse-knowledge-svc
│   │   │   ├── notes/
│   │   │   ├── graph/
│   │   │   └── search/
│   │   └── learning/                       # → synapse-learning-svc
│   │       ├── cards/
│   │       ├── srs/
│   │       └── ai/
│   └── shared/                             # 여러 boundary 공통
│       ├── features/                       # dashboard 등 cross-service
│       └── widgets/                        # 재사용 위젯
├── android/
├── ios/
├── web/
├── test/
├── pubspec.yaml
├── analysis_options.yaml
├── README.md
└── SECRETS.md
```

### 2.1 각 feature의 내부 구조 (Clean Architecture Lite)

```
services/<boundary>/<feature>/
├── data/                                   # Repository 구현, DataSource, DTO
│   ├── datasources/
│   ├── models/                             # DTO (Dio 응답 매핑)
│   └── repositories/                       # Repository 인터페이스 구현
├── domain/                                 # Entity, UseCase, Repository 인터페이스(Port)
│   ├── entities/
│   ├── repositories/                       # ★ Port (abstract class)
│   └── usecases/
├── presentation/
│   └── screens/                            # UI Widget
└── providers/                              # Riverpod 3 manual providers
```

### 2.2 핵심 패턴 매핑 (03-D Repository = Port)

| 03-D 개념 | Flutter 구현 |
|----------|------------|
| **Outbound Port** | `domain/repositories/XxxRepository` (abstract class) |
| **Adapter** | `data/repositories/XxxRepositoryImpl` |
| **DTO** | `data/models/XxxDto` |
| **Mapper** | DTO → Entity 변환 (boundary methods 또는 별도 mapper) |
| **UseCase** | `domain/usecases/XxxUseCase` — Repository에만 의존 |
| **DI** | Riverpod manual `Provider` |
| **Inbound Adapter** | `presentation/screens` (UI) — controller가 UseCase 호출 |

---

## 3. 기술 스택 (실제)

| 영역 | 선택 |
|------|------|
| Framework | Flutter 3.x |
| Language | Dart `>=3.11.0 <4.0.0` |
| 상태관리 | **Riverpod 3 manual providers** (codegen 사용 안 함) |
| 라우팅 | GoRouter |
| HTTP | Dio |
| 로컬 저장 | Hive Flutter |
| 폰트 | google_fonts |
| 테스트 | flutter_test, integration_test, mockito |
| 린팅 | flutter_lints + `analysis_options.yaml` |

⚠️ **codegen 미사용**이므로 `riverpod_generator`, `freezed`, `json_serializable`은 도입하지 않음. 모든 Provider는 손으로 `Provider(...)` / `NotifierProvider(...)` 직접 작성.

---

## 4. 외부 인터페이스

### 4.1 Gateway 호출 (유일한 외부 인터페이스)

| 환경 | Base URL |
|------|---------|
| `dev` | `http://localhost:8080` |
| `staging` | `https://api-staging.synapse.app` |
| `prod` | `https://api.synapse.app` |

```dart
// core/network/api_client.dart 패턴
final apiClient = Dio(BaseOptions(
  baseUrl: _resolveBaseUrl(),                // APP_ENV로 결정
  connectTimeout: const Duration(seconds: 10),
  receiveTimeout: const Duration(seconds: 30),
));

apiClient.interceptors.addAll([
  AuthInterceptor(),       // JWT 자동 첨부 + 401 시 refresh
  TraceIdInterceptor(),    // W3C traceparent 주입
  ErrorInterceptor(),      // RFC 7807 → AppException 변환
  LoggingInterceptor(),
]);
```

### 4.2 인증 흐름

- 로그인 → `accessToken` (응답) + `refreshToken` (httpOnly Cookie — Web) / `flutter_secure_storage` (Mobile)
- 모든 요청에 `Authorization: Bearer {accessToken}` 헤더
- 401 응답 시 `AuthInterceptor`가 자동으로 `POST /api/v1/auth/refresh` 호출 후 재시도
- Web에서 `withCredentials: true` 설정 필수

### 4.3 WebSocket (Phase 2)

- `/ws/notifications` — 인앱 실시간 알림
- 토큰은 query parameter 또는 첫 메시지로 전달

---

## 5. 03-D Port/Adapter 적용 예시

### 5.1 Notes feature

```dart
// services/knowledge/notes/domain/repositories/note_repository.dart
abstract class NoteRepository {
  Future<List<NoteSummary>> getRecent({int limit = 20});
  Future<Note> getById(NoteId id);
  Future<Note> create({required String title, String? content});
  Future<void> update(NoteId id, NoteUpdateInput input);
  Future<void> delete(NoteId id);
}

// services/knowledge/notes/data/repositories/note_repository_impl.dart
class NoteRepositoryImpl implements NoteRepository {
  NoteRepositoryImpl(this._apiClient, this._mapper);
  
  final ApiClient _apiClient;
  final NoteMapper _mapper;
  
  @override
  Future<List<NoteSummary>> getRecent({int limit = 20}) async {
    try {
      final response = await _apiClient.get(
        '/api/v1/notes',
        queryParameters: {'limit': limit},
      );
      return (response.data['data'] as List)
          .map((json) => _mapper.toSummary(json as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (e) {
      throw NoteRepositoryException.fromDio(e);
    }
  }
  // ...
}

// services/knowledge/notes/data/models/note_dto.dart
class NoteDto {
  // JSON 직접 매핑 (codegen 사용 안 함)
  NoteDto.fromJson(Map<String, dynamic> json)
      : id = json['id'] as String,
        title = json['title'] as String,
        // ...
}

// services/knowledge/notes/providers/note_providers.dart
final noteApiClientProvider = Provider<ApiClient>((ref) =>
    ref.watch(coreApiClientProvider));

final noteMapperProvider = Provider<NoteMapper>((ref) => NoteMapper());

final noteRepositoryProvider = Provider<NoteRepository>((ref) =>
    NoteRepositoryImpl(
      ref.watch(noteApiClientProvider),
      ref.watch(noteMapperProvider),
    ));

final recentNotesProvider = FutureProvider<List<NoteSummary>>((ref) async {
  final repo = ref.watch(noteRepositoryProvider);
  return repo.getRecent();
});
```

### 5.2 5개 boundary × 주요 Repository 매핑

| Boundary | feature | Repository |
|----------|---------|-----------|
| platform | auth | `AuthRepository`, `OAuthRepository`, `MfaRepository` |
| platform | billing | `BillingRepository`, `SubscriptionRepository` |
| platform | notifications | `NotificationRepository` (REST) + WebSocket Adapter |
| platform | settings | `UserSettingsRepository` |
| platform | admin | `AuditRepository` (관리자 전용 화면) |
| engagement | community | `StudyGroupRepository`, `ShareRepository`, `ReportRepository` |
| engagement | gamification | `XpRepository`, `BadgeRepository`, `LeaderboardRepository`, `StreakRepository` |
| knowledge | notes | `NoteRepository`, `AttachmentRepository` |
| knowledge | graph | `GraphRepository` (백링크/이웃/PageRank) |
| knowledge | search | `SearchRepository` (text + semantic) |
| learning | cards | `CardRepository`, `DeckRepository` |
| learning | srs | `ReviewRepository`, `SessionRepository` |
| learning | ai | `AiCardGenerationRepository` (SSE), `AiQaRepository` (SSE) |

---

## 6. 라우팅 + 인증 가드

```dart
// core/router/app_router.dart 패턴
final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  
  return GoRouter(
    initialLocation: AppRoutes.home,
    redirect: (context, state) {
      final isLoggedIn = authState.value?.isAuthenticated ?? false;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');
      
      if (!isLoggedIn && !isAuthRoute) return AppRoutes.login;
      if (isLoggedIn && isAuthRoute) return AppRoutes.home;
      return null;
    },
    routes: [
      // platform
      GoRoute(path: '/auth/login', ...),
      // knowledge
      GoRoute(path: '/notes', ...),
      GoRoute(path: '/notes/:id', ...),
      // learning
      GoRoute(path: '/cards', ...),
      // engagement
      GoRoute(path: '/community', ...),
      // shared
      GoRoute(path: '/', ...),                  // dashboard
    ],
  );
});
```

---

## 7. 로컬 저장 전략

| 데이터 | 저장소 | 이유 |
|--------|--------|------|
| Access Token | Riverpod state (메모리) | 새로고침 시 Refresh로 재발급 |
| Refresh Token (Web) | httpOnly Cookie | XSS 방지 |
| Refresh Token (Mobile) | `flutter_secure_storage` (Keychain/Keystore) | XSS 방지 |
| 노트 초안 (오프라인) | Hive | 동기화 전 임시 저장 |
| 최근 노트 캐시 | Hive (LRU) | 빠른 로드 |
| 사용자 설정 | Hive 또는 SharedPreferences | 경량 키-값 |

---

## 8. 빌드 / 배포

### 8.1 개발 실행

```bash
flutter pub get
flutter run -d chrome --dart-define=APP_ENV=dev
# 또는 웹서버:
flutter run -d web-server --web-hostname 127.0.0.1 --web-port 8088
```

### 8.2 검증

```bash
flutter analyze
flutter test
flutter pub outdated
```

### 8.3 빌드

```bash
# Web
flutter build web --release --dart-define=APP_ENV=prod

# Android
flutter build appbundle --release --dart-define=APP_ENV=prod --obfuscate \
  --split-debug-info=build/symbols/

# iOS
flutter build ipa --release --dart-define=APP_ENV=prod --obfuscate \
  --split-debug-info=build/symbols/
```

### 8.4 배포 (예상)

| 플랫폼 | 도구 |
|--------|------|
| Web | Cloudflare Pages |
| Android | Google Play (Fastlane) |
| iOS | App Store Connect (Fastlane) |

---

## 9. 관측성

- 분산 추적: 모든 요청에 `traceparent` 헤더 주입 (Dio interceptor)
- 에러 추적: Sentry (도입 시점 별도 검토)
- 로그: 개발 환경에서는 console, prod는 Sentry breadcrumbs

---

## 10. 보안

| 항목 | 구현 |
|------|------|
| 토큰 저장 (Web) | Access는 메모리, Refresh는 httpOnly Cookie |
| 토큰 저장 (Mobile) | `flutter_secure_storage` |
| Web `withCredentials` | Dio extra `withCredentials: true` + Gateway CORS 허용 |
| 코드 난독화 (Mobile) | `--obfuscate --split-debug-info` |
| 마크다운 XSS | `flutter_markdown` 기본 sanitize, 커스텀 HTML 비활성 |
| 외부 링크 | `url_launcher` 사용 시 확인 다이얼로그 |

---

## 11. 안티패턴 (03-D 위반 사례)

- ❌ Screen / Widget이 Dio 직접 호출 — 항상 Repository(Port) 경유
- ❌ DTO를 Widget까지 전달 — Entity로 변환해서 전달
- ❌ Repository 인터페이스가 `dio` import — 도메인은 HTTP 라이브러리 무지
- ❌ Provider 안에서 비즈니스 로직 — UseCase로 추출
- ❌ 한 Repository가 여러 boundary를 조합 — boundary 간 조합은 `shared/`에서

---

## 12. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| Web에서 Cookie 미전송 | `withCredentials` 미설정 | Dio + Gateway CORS 양쪽 설정 |
| 401 무한 루프 | Refresh 호출도 401 반환 | `/auth/refresh`는 AuthInterceptor 대상에서 제외 |
| Riverpod state 안 갱신 | `ref.read` 남용 | `ref.watch` / `ref.listen` 우선 |
| Hot reload 후 Provider 꼬임 | 의존성 그래프 변경 | `ref.invalidate(...)` 또는 앱 재시작 |

---

## 13. 참고

- **README.md** — 빠른 시작
- **Wiki 03** — 전체 아키텍처
- **Wiki 04** — 호출 대상 API 명세
- **03-A** — 통신 SLO
- **03-B** — JWT/Cookie 정책
- **03-D** — Port/Adapter 표준

---

## 14. 현재 상태

> Repository README 명시: "placeholder screens for the wiki-defined domains. API integration and production UI details are expected to be added inside each service feature boundary."

- 도메인/서비스-바운더리 아키텍처 + GoRouter 라우트 등록 완료
- placeholder 화면 단계
- API 연동과 production UI는 각 서비스 feature boundary 안에서 추가 예정
