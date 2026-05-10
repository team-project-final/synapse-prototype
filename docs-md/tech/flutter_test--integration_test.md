
#### 개요
Flutter SDK에 내장된 단위/위젯 테스트 프레임워크(flutter_test)와 실제 디바이스/에뮬레이터에서 End-to-End 테스트를 실행하는 통합 테스트 패키지(integration_test)이다.

#### 역할
Synapse 클라이언트의 테스트 커버리지를 담당한다. Widget 렌더링 테스트, BLoC 단위 테스트, 노트 에디터 입력 시나리오, SRS 복습 플로우 E2E 테스트를 포함한다. CI/CD 파이프라인에서 PR 머지 전 자동 실행된다.

#### 선택 이유
Flutter SDK 내장 패키지로 별도 설치 없이 사용 가능하며, `WidgetTester` API로 실제 사용자 인터랙션(탭, 텍스트 입력, 스크롤)을 시뮬레이션할 수 있다. integration_test는 Firebase Test Lab, BrowserStack 등 클라우드 테스트 플랫폼과 통합된다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **flutter_test + integration_test** | Flutter SDK 내장, 공식 지원, WidgetTester API | 느린 통합 테스트 실행 | ✅ 선택 |
| Patrol | 네이티브 UI 상호작용, 더 강력한 E2E | 추가 설정 복잡, 유료 클라우드 | 보조 사용 |
| Appium | 크로스플랫폼 E2E, 다양한 언어 | Flutter와 통합 복잡, 유지보수 비용 | ❌ |

#### 기술적 이점
- **WidgetTester**: 실제 위젯 렌더링 검증 (`findsOneWidget`, `findsNothing`)
- **pump/pumpAndSettle**: 애니메이션 완료 대기 제어
- **Mock HTTP**: `HttpOverrides`로 API 응답 모킹
- **Golden Test**: 스크린샷 기반 픽셀 퍼펙트 회귀 테스트

#### 핵심 기능
- `testWidgets()` — 위젯 테스트
- `WidgetTester.tap()` / `enterText()` — 사용자 인터랙션 시뮬레이션
- `IntegrationTestWidgetsFlutterBinding` — 실제 디바이스 테스트
- `expect(find.text('...'), findsOneWidget)` — 위젯 존재 검증

#### 프로젝트 내 사용 위치
- `syn/test/` — 단위/위젯 테스트
- `syn/integration_test/` — E2E 통합 테스트
- `syn/test/features/cards/review_session_test.dart` — SRS 복습 플로우 테스트

#### 설정 가이드

```dart
// test/features/notes/note_editor_widget_test.dart
void main() {
  group('NoteEditorWidget', () {
    testWidgets('마크다운 입력 시 실시간 프리뷰 업데이트', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider(
            create: (_) => MockNoteEditorBloc(),
            child: const NoteEditorScreen(noteId: 'test-note'),
          ),
        ),
      );

      // 에디터에 마크다운 입력
      await tester.enterText(
        find.byKey(const Key('markdown-editor')),
        '# 제목\n\n본문 내용',
      );
      await tester.pumpAndSettle();

      // 프리뷰에 렌더링된 제목 확인
      expect(find.text('제목'), findsOneWidget);
    });
  });
}

// integration_test/srs_review_flow_test.dart
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('SRS 복습 완료 플로우', (tester) async {
    app.main();
    await tester.pumpAndSettle();

    // 로그인
    await tester.tap(find.byKey(const Key('login-button')));
    await tester.pumpAndSettle();

    // 복습 시작
    await tester.tap(find.byKey(const Key('start-review-button')));
    await tester.pumpAndSettle();

    // 카드 평가
    await tester.tap(find.byKey(const Key('rating-good')));
    await tester.pumpAndSettle();

    expect(find.text('복습 완료'), findsOneWidget);
  });
}
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| `pumpAndSettle` 타임아웃 | 무한 애니메이션 존재 | `tester.pump(Duration(seconds: 3))` 직접 호출 |
| Golden test 실패 (CI) | 플랫폼별 폰트 렌더링 차이 | Docker 이미지에서 테스트 또는 `--update-goldens` |
| Integration test iOS 실패 | Simulator 권한 문제 | `NSCameraUsageDescription` 등 Info.plist 권한 추가 |
| BLoC mock 상태 미반영 | `whenListen` 설정 누락 | `bloc_test`의 `when` + `MockBloc` 올바르게 설정 |

#### 참고 자료
- flutter_test: https://docs.flutter.dev/testing/overview
- integration_test: https://docs.flutter.dev/testing/integration-tests
- Widget Testing 쿡북: https://docs.flutter.dev/cookbook/testing/widget/introduction

---
