
#### 개요
WebAssembly로 컴파일된 Skia 그래픽 엔진 기반의 Flutter Web 렌더러로, 네이티브와 동일한 픽셀 퍼펙트 렌더링을 웹 브라우저에서 구현한다.

#### 역할
Synapse Web 버전의 렌더링 백엔드이다. 마크다운 에디터의 수식 렌더링(LaTeX), 지식 그래프 애니메이션, SRS 카드 플립 애니메이션 등 시각적으로 복잡한 UI를 Web에서도 Mobile과 동일한 품질로 렌더링한다.

#### 선택 이유
Synapse의 노트 에디터는 수식(KaTeX), 코드 하이라이팅, 복잡한 레이아웃을 포함한다. HTML 렌더러는 이런 복잡한 UI에서 렌더링 불일치가 발생한다. CanvasKit은 플랫폼 의존 없이 일관된 픽셀 퍼펙트 렌더링을 보장한다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **CanvasKit** | 픽셀 퍼펙트, 플랫폼 일관성, 복잡한 그래픽 지원 | 초기 다운로드 크기 (~2MB WASM), SEO 불리 | ✅ 선택 |
| HTML Renderer | 번들 작음, SEO 유리, 접근성 | 플랫폼별 렌더링 차이, 복잡한 위젯 제한 | ❌ |
| Auto (기본) | 기기별 자동 선택 | 예측 불가능한 렌더링, 테스트 복잡 | ❌ |

#### 기술적 이점
- **픽셀 퍼펙트**: Mobile과 완전히 동일한 렌더링 결과
- **커스텀 셰이더**: Flutter custom painter로 고품질 그래픽 효과
- **텍스트 렌더링**: 복잡한 Unicode, RTL, 수식 등 정확한 렌더링

#### 핵심 기능
- WebAssembly 기반 Skia 그래픽 엔진
- `dart:ui` API 완전 지원
- Web Worker에서 렌더링 오프로드 지원

#### 프로젝트 내 사용 위치
- `syn/web/index.html` — 렌더러 설정
- Flutter build 파이프라인 (`--web-renderer canvaskit`)

#### 설정 가이드

```html
<!-- web/index.html — CanvasKit 렌더러 강제 설정 -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Synapse</title>
  <!-- CanvasKit WASM 프리로드로 초기 로딩 개선 -->
  <link rel="preload" 
        href="canvaskit/canvaskit.wasm" 
        as="fetch" 
        crossorigin="anonymous">
</head>
<body>
  <script>
    window.flutterConfiguration = {
      renderer: "canvaskit",
      // 서비스 워커로 WASM 캐싱
      serviceWorkerVersion: "{{flutter_service_worker_version}}"
    };
  </script>
  <script src="flutter_bootstrap.js" async></script>
</body>
</html>
```

```yaml
# CI/CD 빌드 명령 (GitHub Actions)
- name: Flutter Web Build
  run: |
    flutter build web \
      --web-renderer canvaskit \
      --release \
      --dart-define=FLUTTER_WEB_CANVASKIT_URL=https://cdn.synapse.app/canvaskit/
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| 첫 로딩 5초+ | WASM 2MB 다운로드 | CDN 캐싱 + Preload + 로딩 스플래시 화면 |
| 텍스트 선택 불가 | CanvasKit은 DOM 텍스트 아님 | `SelectionArea` 위젯 사용 |
| 복사/붙여넣기 불가 | 클립보드 API 제한 | `flutter_web_clipboard` 패키지 적용 |
| Safari 렌더링 오류 | WebAssembly SIMD 미지원 | `--no-wasm-opt` 플래그 또는 폴백 로직 |

#### 참고 자료
- Flutter Web 렌더러: https://docs.flutter.dev/platform-integration/web/renderers
- CanvasKit GitHub: https://skia.googlesource.com/skia/+/HEAD/modules/canvaskit

---
