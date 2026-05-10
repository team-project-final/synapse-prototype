
#### 개요
Google이 개발한 오픈소스 크로스플랫폼 UI 프레임워크로, 단일 코드베이스로 Web, iOS, Android, Desktop 앱을 빌드한다.

#### 역할
Synapse의 모든 사용자 인터페이스를 담당한다. 노트 에디터(마크다운 + 수식 + 코드블록), SRS 카드 복습 UI, 지식 그래프 뷰어, 학습 대시보드 등을 Web/iOS/Android에서 동일한 UX로 제공한다. CanvasKit 렌더러를 사용하여 Web에서도 네이티브 수준의 렌더링 품질을 달성한다.

#### 선택 이유
Synapse는 "PKM(데스크톱 위주) + SRS(모바일 위주)"를 동시에 커버해야 하므로, 단일 코드베이스로 3개 플랫폼을 지원하는 것이 팀 생산성과 UX 일관성 측면에서 필수적이다. React Native 대비 독자 렌더링 엔진(Skia/Impeller)을 사용하므로 플랫폼 네이티브 위젯 의존성이 없어 UI 일관성이 보장된다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Flutter 3.x** | 단일 코드베이스, 독자 렌더러, 강력한 위젯 시스템, Dart AOT 컴파일 | Web SEO 한계, 초기 번들 크기 | ✅ 선택 |
| React Native | JS 생태계 풍부, 네이티브 컴포넌트 재사용 | 플랫폼별 UI 차이, Bridge 성능 오버헤드 | ❌ |
| React (Web only) | 생태계 최대, SEO 우수 | 모바일 별도 개발 필요, 코드 중복 | ❌ |
| Kotlin Multiplatform | 네이티브 성능, 비즈니스 로직 공유 | UI 레이어 별도 구현, 성숙도 낮음 | ❌ |
| Ionic / Capacitor | 웹 기술 재사용 | 성능 낮음, 복잡한 네이티브 기능 제한 | ❌ |

#### 기술적 이점
- **코드 재사용률 95%+**: Web/iOS/Android 간 비즈니스 로직과 UI를 거의 동일하게 사용
- **AOT 컴파일**: Dart AOT 컴파일로 앱 시작 시간 최소화 (모바일 cold start < 1s)
- **60/120fps 렌더링**: Impeller 렌더러로 애니메이션 및 전환 효과 부드러움
- **Hot Reload**: 개발 생산성 — UI 변경사항 < 1초 반영
- **타입 안전성**: Dart 강타입 + null safety로 런타임 오류 감소

#### 핵심 기능
- **Widget 트리**: Everything is a Widget 패턴으로 UI 구성
- **Impeller 렌더러**: iOS/Android용 차세대 그래픽 엔진 (Flutter 3.10+)
- **CanvasKit**: Web용 WebAssembly 기반 Skia 렌더러
- **Platform Channels**: 네이티브 기능 접근 (카메라, 파일시스템, 생체인증)
- **Isolates**: Dart 멀티스레딩 모델 (UI Isolate + Worker Isolate 분리)

#### 프로젝트 내 사용 위치
- `syn/lib/` — 전체 Flutter 앱 루트
- `syn/lib/features/notes/` — 노트 에디터 UI
- `syn/lib/features/cards/` — SRS 카드 복습 UI
- `syn/lib/features/graph/` — 지식 그래프 뷰어
- `syn/lib/features/auth/` — 로그인/회원가입 화면
- `syn/lib/core/` — 공통 위젯, 테마, 라우팅

#### 설정 가이드

```yaml
# pubspec.yaml — 핵심 의존성
name: synapse
description: PKM + SRS + AI 통합 학습 플랫폼
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'
  flutter: '>=3.10.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^3.0.0    # 상태 관리
  riverpod_annotation: ^3.0.0 # 코드 생성 어노테이션
  go_router: ^14.0.0          # 선언형 라우팅
  dio: ^5.4.0                 # HTTP 클라이언트
  google_fonts: ^6.1.0        # 타이포그래피
  flutter_markdown: ^0.6.18   # 마크다운 렌더링
  hive_ce_flutter: ^latest     # 로컬 캐시 (hive_flutter 대체 — 원본 패키지 미유지보수)
  freezed_annotation: ^3.1.0  # 불변 데이터 클래스
  json_annotation: ^4.8.1     # JSON 직렬화

dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter
  build_runner: ^2.10.4
  freezed: ^3.2.3
  json_serializable: ^6.7.1
  mockito: ^5.4.4
```

```yaml
# flutter 빌드 설정 — Web CanvasKit 렌더러 강제
# web/index.html
<script>
  window.flutterConfiguration = {
    renderer: "canvaskit"
  };
</script>

# 빌드 명령
# flutter build web --web-renderer canvaskit --release
# flutter build ios --release
# flutter build apk --release --split-per-abi
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| Web 초기 로딩 느림 (> 5s) | CanvasKit WASM 다운로드 크기 | CDN 캐싱 헤더 설정, Preload 링크 추가 |
| iOS Impeller 렌더링 깨짐 | Impeller 버그 (특정 shader) | `--no-enable-impeller` 플래그로 Skia 폴백 |
| Android 텍스트 렌더링 흐림 | 디바이스 픽셀 비율 미적용 | `MediaQuery.devicePixelRatio` 확인 |
| Hot Reload 후 상태 초기화 | BLoC 상태가 위젯 트리 외부에 위치 | `BlocProvider` 위치를 MaterialApp 상위로 이동 |
| 웹 빌드 시 CORS 오류 | Flutter Web에서 직접 API 호출 | Gateway에 `Access-Control-Allow-Origin` 설정 |

#### 참고 자료
- 공식 문서: https://docs.flutter.dev
- Flutter Web 렌더러: https://docs.flutter.dev/platform-integration/web/renderers
- Impeller 엔진: https://github.com/flutter/flutter/wiki/Impeller
- Flutter 3.x 릴리스 노트: https://docs.flutter.dev/release/release-notes

---
