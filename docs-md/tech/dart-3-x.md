
#### 개요
Google이 개발한 정적 타입, AOT/JIT 컴파일 지원 프로그래밍 언어로 Flutter의 기본 언어이다.

#### 역할
Synapse 클라이언트 전체 비즈니스 로직, UI 코드, 상태 관리, API 통신 레이어를 구현하는 언어이다. Null Safety, Records, Patterns(Dart 3.0+) 등의 현대적 언어 기능을 활용하여 안전하고 간결한 코드를 작성한다.

#### 선택 이유
Flutter를 선택한 이상 Dart는 필수적이다. 그러나 언어 자체도 Null Safety 강제, 강타입 시스템, async/await 내장 지원, AOT 컴파일 등 클라이언트 앱 개발에 적합한 특성을 다수 보유한다. Dart 3.0의 Records와 Pattern Matching은 BLoC 상태 모델링에 직접적으로 유용하다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Dart 3.x** | Flutter 전용 최적화, Null Safety, AOT 컴파일 | 생태계 제한적 (Flutter 외) | ✅ 선택 (Flutter 선택에 따른 필수) |
| TypeScript | 대형 생태계, 웹 표준 | React Native와 연계 필요, Flutter 미지원 | ❌ |
| Kotlin | 멀티플랫폼 가능성 | Flutter 미지원, KMP 성숙도 낮음 | ❌ |
| Swift | iOS 최고 성능 | 크로스플랫폼 불가 | ❌ |

#### 기술적 이점
- **Null Safety**: 컴파일 타임 null 오류 방지로 런타임 NPE 제거
- **Records (Dart 3.0+)**: 경량 불변 데이터 묶음 — `(String id, int score)` 형식
- **Pattern Matching**: switch 표현식에서 복잡한 구조 분해
- **Isolate 기반 동시성**: 메모리 공유 없는 안전한 멀티스레딩
- **Extension Methods**: 기존 타입에 메서드 추가 (코드 가독성 향상)

#### 핵심 기능
- **Sound Null Safety**: 전체 타입 시스템에서 nullable과 non-nullable 구분
- **async/await + Stream**: Future와 Stream 기반 비동기 프로그래밍
- **Generics**: 타입 안전한 컬렉션 및 API 응답 모델링
- **Mixins**: 다중 상속 없이 기능 조합
- **const 생성자**: 컴파일 타임 상수로 위젯 재빌드 최적화

#### 프로젝트 내 사용 위치
- 모든 `syn/lib/**/*.dart` 파일
- `syn/lib/core/models/` — 도메인 모델 (Freezed 생성)
- `syn/lib/core/repositories/` — API 통신 레이어
- `syn/lib/features/*/bloc/` — BLoC 이벤트/상태 정의

#### 설정 가이드

```dart
// analysis_options.yaml — 엄격한 린트 설정
include: package:flutter_lints/flutter.yaml

analyzer:
  strong-mode:
    implicit-casts: false
    implicit-dynamic: false
  errors:
    missing_required_param: error
    missing_return: error
    todo: warning

linter:
  rules:
    - always_declare_return_types
    - avoid_dynamic_calls
    - avoid_empty_else
    - avoid_print
    - prefer_const_constructors
    - prefer_final_fields
    - require_trailing_commas
    - sort_pub_dependencies
```

```dart
// Dart 3.x Records + Pattern Matching 활용 예시
// lib/core/models/review_result.dart
typedef ReviewOutcome = (CardId id, int newInterval, double easeFactor);

ReviewOutcome processReview(Card card, Rating rating) {
  return switch (rating) {
    Rating.again => (card.id, 1, max(1.3, card.easeFactor - 0.2)),
    Rating.hard  => (card.id, card.interval, card.easeFactor - 0.15),
    Rating.good  => (card.id, card.interval * card.easeFactor ~/ 1, card.easeFactor),
    Rating.easy  => (card.id, card.interval * card.easeFactor ~/ 1 * 2, card.easeFactor + 0.15),
  };
}
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| `Null check operator used on a null value` | Null Safety 미준수 코드 | `?.` 연산자 또는 `!` 사용 전 null 확인 |
| Isolate 통신 오류 | SendPort로 non-primitive 타입 전송 | `Isolate.run()` 사용 또는 직렬화 처리 |
| freezed 코드 생성 실패 | build_runner 캐시 오염 | `flutter pub run build_runner clean && build_runner build` |
| Stream 메모리 누수 | StreamSubscription cancel 미호출 | BLoC의 `close()` 메서드에서 subscription.cancel() |
| Late initialization error | `late` 변수 초기화 전 접근 | 초기화 순서 검토 또는 nullable로 변경 |

#### 참고 자료
- Dart 공식 문서: https://dart.dev/guides
- Dart 3.0 새 기능: https://dart.dev/language/records
- Null Safety 마이그레이션: https://dart.dev/null-safety/migration-guide
- Effective Dart: https://dart.dev/effective-dart

---
