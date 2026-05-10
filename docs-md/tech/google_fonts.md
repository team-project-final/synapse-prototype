
#### 개요
Google Fonts를 Flutter 앱에서 런타임에 동적으로 로드하거나 번들에 포함하는 Flutter 패키지이다.

#### 역할
Synapse의 타이포그래피 시스템을 구현한다. 브랜드 폰트 3종 — **Fraunces**(제목/로고), **Plus Jakarta Sans**(본문 UI), **Geist Mono**(코드 블록) — 을 일관되게 적용한다. 다크/라이트 테마와 플랫폼(Web/iOS/Android)에서 동일한 폰트 렌더링을 보장한다.

#### 선택 이유
Synapse의 디자인 시스템은 프리미엄 학습 도구 이미지를 위해 커스텀 타이포그래피를 요구한다. google_fonts 패키지는 Google Fonts의 1,000개 이상 폰트를 코드 한 줄로 적용 가능하며, 오프라인 번들링도 지원한다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **google_fonts** | 간편한 API, 1000+ 폰트, 오프라인 지원 | 런타임 다운로드 지연 (미리 번들링으로 해결) | ✅ 선택 |
| 직접 폰트 번들 | 완전한 제어권, 오프라인 보장 | pubspec.yaml 설정 복잡, 파일 크기 관리 | ❌ |
| System fonts | 번들 크기 0, 빠른 렌더링 | 플랫폼별 폰트 차이, 브랜드 일관성 부족 | ❌ |

#### 기술적 이점
- **런타임/번들 선택**: 개발 시 런타임 로드, 프로덕션 빌드 시 번들 포함
- **TextTheme 통합**: Flutter Material TextTheme과 완벽 통합
- **캐싱**: 폰트 다운로드 후 로컬 캐싱으로 재요청 불필요

#### 핵심 기능
- `GoogleFonts.fraunces()` 형식의 직관적 API
- `GoogleFonts.plusJakartaSansTextTheme()` — 전체 TextTheme 교체
- `asMap()` — 모든 폰트 목록 조회

#### 프로젝트 내 사용 위치
- `syn/lib/core/theme/app_theme.dart` — 전역 테마 정의
- `syn/lib/core/theme/text_styles.dart` — 재사용 텍스트 스타일

#### 설정 가이드

```dart
// lib/core/theme/app_theme.dart
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static ThemeData lightTheme = ThemeData(
    colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6366F1)),
    textTheme: _buildTextTheme(Brightness.light),
  );

  static ThemeData darkTheme = ThemeData.dark().copyWith(
    textTheme: _buildTextTheme(Brightness.dark),
  );

  static TextTheme _buildTextTheme(Brightness brightness) {
    final baseColor = brightness == Brightness.light
        ? const Color(0xFF1E1B4B)
        : const Color(0xFFF8F8FF);

    return TextTheme(
      // 제목: Fraunces (세리프, 프리미엄 느낌)
      displayLarge: GoogleFonts.fraunces(
        fontSize: 57, fontWeight: FontWeight.w400, color: baseColor,
      ),
      headlineMedium: GoogleFonts.fraunces(
        fontSize: 28, fontWeight: FontWeight.w600, color: baseColor,
      ),
      // 본문: Plus Jakarta Sans (가독성 우수)
      bodyLarge: GoogleFonts.plusJakartaSans(
        fontSize: 16, fontWeight: FontWeight.w400, color: baseColor,
      ),
      bodyMedium: GoogleFonts.plusJakartaSans(
        fontSize: 14, color: baseColor,
      ),
      // 코드: Geist Mono (개발자 친화적 모노스페이스)
      labelSmall: GoogleFonts.geistMono(
        fontSize: 12, color: baseColor,
      ),
    );
  }
}

// 코드 블록 전용 스타일
static TextStyle get codeStyle => GoogleFonts.geistMono(
  fontSize: 13,
  height: 1.6,
  backgroundColor: const Color(0xFF1E1E2E),
  color: const Color(0xFFCDD6F4),
);
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| 폰트 깜빡임 (FOUT) | 런타임 다운로드 지연 | `GoogleFonts.config.allowRuntimeFetching = false` + 번들 포함 |
| Web에서 폰트 미적용 | CanvasKit과 폰트 로딩 타이밍 | `flutter_web_plugins`에서 폰트 preload 설정 |
| 오프라인 환경에서 기본 폰트 표시 | 네트워크 없이 런타임 로드 시도 | `pubspec.yaml`에 폰트 assets 직접 번들링 |

#### 참고 자료
- pub.dev: https://pub.dev/packages/google_fonts
- Google Fonts: https://fonts.google.com
- Flutter 폰트 가이드: https://docs.flutter.dev/cookbook/design/fonts

---
