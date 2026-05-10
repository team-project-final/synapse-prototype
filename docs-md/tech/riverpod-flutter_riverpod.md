
#### 개요
Flutter의 차세대 상태 관리 라이브러리로, Provider 패키지의 완전한 재설계 버전이다. 컴파일 타임 안전성, 위젯 트리 독립적 의존성 주입, 코드 생성 기반의 간결한 선언을 제공한다.

#### 역할
Synapse 클라이언트의 모든 상태 관리를 담당한다. 노트 편집 상태, SRS 복습 세션 진행, 지식 그래프 필터링, 사용자 인증 상태, 구독 플랜 상태, 커뮤니티 그룹 데이터, 게이미피케이션 XP/레벨 등을 Provider로 관리한다. `@riverpod` 어노테이션으로 Provider를 선언하고, `ref.watch`/`ref.read`로 상태를 구독하여 UI와 비즈니스 로직을 분리한다.

#### 선택 이유
Synapse는 11개 백엔드 서비스와 통신하는 복잡한 클라이언트 앱이다. Riverpod는 BLoC 대비 보일러플레이트가 적고, `@riverpod` 코드 생성으로 타입 안전한 Provider를 빠르게 작성할 수 있다. 또한 Provider 간 의존성 자동 관리, 자동 dispose, 비동기 데이터 로딩(`AsyncValue`)이 내장되어 API 호출이 많은 SaaS 앱에 적합하다. 7명 팀에서 4주 내 30+ 화면을 구현해야 하므로 생산성이 핵심이다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Riverpod** | 적은 보일러플레이트, 코드 생성, 컴파일 타임 안전, 자동 dispose | 코드 생성 빌드 필요 (build_runner) | ✅ 선택 |
| flutter_bloc | 명시적 이벤트/상태, 테스트 용이 | 보일러플레이트 많음 (Event/State/BLoC 3파일), 학습 곡선 높음 | ❌ |
| Provider | 간단, Flutter 팀 초기 권장 | Riverpod에 의해 대체됨, 위젯 트리 의존, 런타임 에러 가능 | ❌ |
| GetX | 최소 코드, 라우팅 통합 | 과도한 마법(magic), 테스트 어려움, 안티패턴 조장 | ❌ |
| MobX | 반응형 프로그래밍, 직관적 | Flutter와 이질적, 코드 생성 필요 | ❌ |

#### 기술적 이점
- **보일러플레이트 감소**: BLoC 대비 60-70% 적은 코드. Event/State 파일 분리 불필요.
- **컴파일 타임 안전성**: Provider를 잘못 사용하면 빌드 시점에 에러. 런타임 `ProviderNotFoundException` 없음.
- **자동 dispose**: Provider가 더 이상 구독되지 않으면 자동으로 리소스 해제. 메모리 누수 방지.
- **AsyncValue 내장**: API 호출 결과를 `loading`/`data`/`error` 3상태로 자동 관리. 로딩 UI 처리가 쉬움.
- **Provider 간 의존성**: `ref.watch`로 다른 Provider를 구독하면 자동 갱신. 수동 의존성 관리 불필요.
- **테스트 용이**: `ProviderContainer`로 위젯 없이 Provider 단위 테스트 가능. `overrides`로 목(mock) 주입.
- **DevTools 지원**: Riverpod DevTools로 Provider 상태 실시간 확인.

#### 핵심 기능
- **@riverpod 코드 생성**: `riverpod_generator` + `build_runner`로 Provider 자동 생성
- **StateNotifierProvider**: 복잡한 상태 전환이 필요한 경우 (노트 에디터, 복습 세션)
- **FutureProvider / StreamProvider**: API 호출, 실시간 데이터 구독
- **AsyncNotifierProvider**: 비동기 초기화가 필요한 상태 (인증, 사용자 프로필)
- **Provider scoping**: `ProviderScope`의 `overrides`로 테넌트별 설정 주입
- **자동 캐싱 + 재검증**: `ref.invalidate()`로 캐시 무효화, 자동 재요청
- **keepAlive**: 특정 Provider를 dispose하지 않고 유지 (인증 상태 등)

#### 프로젝트 내 사용 위치
- `syn/lib/features/notes/providers/note_editor_provider.dart` — 노트 편집 상태
- `syn/lib/features/cards/providers/review_session_provider.dart` — SRS 복습 세션
- `syn/lib/features/graph/providers/graph_provider.dart` — 지식 그래프 필터/렌더링
- `syn/lib/features/auth/providers/auth_provider.dart` — 인증 상태
- `syn/lib/features/billing/providers/subscription_provider.dart` — 구독 플랜 상태
- `syn/lib/features/community/providers/group_provider.dart` — 스터디 그룹 상태
- `syn/lib/features/gamification/providers/xp_provider.dart` — XP/레벨 상태
- `syn/lib/features/notifications/providers/notification_provider.dart` — 알림 상태

#### 설정 가이드

```yaml
# pubspec.yaml
dependencies:
  flutter_riverpod: ^3.0.0
  riverpod_annotation: ^3.0.0

dev_dependencies:
  riverpod_generator: ^3.0.0
  build_runner: ^2.10.4
```

```dart
// note_editor_provider.dart — 노트 에디터 Provider 예시
import 'package:riverpod_annotation/riverpod_annotation.dart';
part 'note_editor_provider.g.dart';

@freezed
class NoteEditorState with _$NoteEditorState {
  const factory NoteEditorState({
    required String noteId,
    required String content,
    @Default(false) bool isDirty,
    @Default(false) bool isSaving,
  }) = _NoteEditorState;
}

@riverpod
class NoteEditor extends _$NoteEditor {
  Timer? _autoSaveTimer;

  @override
  NoteEditorState build(String noteId) {
    // 자동 dispose 시 타이머 정리
    ref.onDispose(() => _autoSaveTimer?.cancel());
    return NoteEditorState(noteId: noteId, content: '');
  }

  Future<void> loadNote() async {
    final repo = ref.read(noteRepositoryProvider);
    final note = await repo.getNote(state.noteId);
    state = state.copyWith(content: note.content);
  }

  void updateContent(String content) {
    state = state.copyWith(content: content, isDirty: true);
    // 3초 디바운스 자동저장
    _autoSaveTimer?.cancel();
    _autoSaveTimer = Timer(const Duration(seconds: 3), () => save());
  }

  Future<void> save() async {
    if (!state.isDirty) return;
    state = state.copyWith(isSaving: true);
    final repo = ref.read(noteRepositoryProvider);
    await repo.updateNote(state.noteId, state.content);
    state = state.copyWith(isDirty: false, isSaving: false);
  }
}

// 사용 예시 (위젯)
class NoteEditorPage extends ConsumerWidget {
  final String noteId;
  const NoteEditorPage({required this.noteId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final editorState = ref.watch(noteEditorProvider(noteId));
    return Column(
      children: [
        if (editorState.isSaving) const AutoSaveIndicator(),
        TextField(
          onChanged: (value) =>
            ref.read(noteEditorProvider(noteId).notifier).updateContent(value),
        ),
      ],
    );
  }
}

// Provider 단위 테스트
void main() {
  test('콘텐츠 변경 시 isDirty=true로 전환', () {
    final container = ProviderContainer(
      overrides: [
        noteRepositoryProvider.overrideWithValue(MockNoteRepository()),
      ],
    );
    final notifier = container.read(noteEditorProvider('test').notifier);
    notifier.updateContent('새 내용');
    
    final state = container.read(noteEditorProvider('test'));
    expect(state.isDirty, true);
    expect(state.content, '새 내용');
  });
}
```

```bash
# 코드 생성 실행
dart run build_runner build --delete-conflicting-outputs
# 또는 watch 모드 (개발 중 자동 생성)
dart run build_runner watch --delete-conflicting-outputs
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| `*.g.dart` 파일 없음 에러 | build_runner 미실행 | `dart run build_runner build` 실행 |
| Provider 상태 변경 후 UI 미갱신 | `ref.read` 대신 `ref.watch` 필요 | 위젯 build에서는 `ref.watch`, 콜백에서는 `ref.read` 사용 |
| Provider가 너무 빨리 dispose | autoDispose 기본 동작 | `@Riverpod(keepAlive: true)` 또는 `ref.keepAlive()` 사용 |
| 순환 의존성 에러 | Provider A가 B를 watch, B가 A를 watch | 의존성 방향 재설계. 공통 Provider 분리 |
| AsyncValue.when에서 로딩 깜빡임 | 데이터 갱신 시 매번 loading 상태 경유 | `skipLoadingOnRefresh: true` 또는 `ref.invalidate()` 대신 `state =` 직접 설정 |
| Hot Reload 후 Provider 상태 초기화 | autoDispose Provider의 정상 동작 | `keepAlive: true`로 변경하거나, 상태 복원 로직 추가 |

#### 참고 자료
- Riverpod 공식 문서: https://riverpod.dev
- riverpod_generator 가이드: https://riverpod.dev/docs/concepts/about_code_generation
- Riverpod 마이그레이션 가이드: https://riverpod.dev/docs/migration/from_state_notifier

---
