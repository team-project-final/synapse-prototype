
#### 개요
Flutter 공식 권장 선언형 라우팅 패키지로, URL 기반 네비게이션, 딥링크, 리다이렉트, 중첩 라우팅을 지원한다.

#### 역할
Synapse의 전체 페이지 네비게이션을 관리한다. Web URL 라우팅(SEO 친화적), 모바일 딥링크, 인증 상태에 따른 리다이렉트(미로그인 시 /login으로), 중첩 레이아웃(사이드바 + 콘텐츠 영역), 쿼리 파라미터 처리(검색 결과 URL 공유) 등을 담당한다.

#### 선택 이유
Synapse는 Flutter Web + Mobile을 동시 지원하므로 URL 기반 라우팅이 필수다. GoRouter는 Flutter 팀이 공식 관리하며, Navigator 2.0의 복잡성을 추상화한다. Web에서 `/notes/uuid`, `/community/groups/uuid` 같은 직접 URL 접근이 가능하고, 모바일에서 푸시 알림 클릭 시 해당 화면으로 딥링크할 수 있다. Riverpod과의 통합(인증 상태 기반 리다이렉트)도 자연스럽다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **go_router** | 공식 권장, URL 기반, 딥링크, Navigator 2.0 추상화 | 복잡한 중첩 시 설정 증가 | ✅ 선택 |
| auto_route | 코드 생성 기반, 타입 안전 | 외부 패키지 의존, 빌드 시간 증가 | ❌ |
| Navigator 1.0 | 간단, 내장 | URL 라우팅 미지원, Web 부적합 | ❌ |
| Beamer | 유연한 URL 패턴 | 학습 곡선, 커뮤니티 작음 | ❌ |
| GetX Router | GetX 통합, 간단 | GetX 생태계 의존, 테스트 어려움 | ❌ |

#### 기술적 이점
- **URL 기반 라우팅**: Web에서 `/notes/{id}`, `/community/groups/{id}` 직접 접근 가능
- **딥링크**: 모바일 푸시 알림 클릭 → 해당 화면 직접 이동 (복습 리마인더 → 복습 화면)
- **인증 리다이렉트**: Riverpod의 인증 Provider를 watch하여 미로그인 시 자동 /login 리다이렉트
- **ShellRoute**: 사이드바/BottomNav 같은 공통 레이아웃을 유지하면서 내부 콘텐츠만 전환
- **쿼리 파라미터**: `/search?q=머신러닝&tags=AI` 같은 검색 URL 공유 가능
- **StatefulShellRoute**: 탭별 네비게이션 상태 보존 (모바일 BottomNav)

#### 핵심 기능
- **GoRoute**: 개별 라우트 정의 (path, builder, redirect)
- **ShellRoute**: 공통 레이아웃 wrapper (사이드바, AppBar)
- **StatefulShellRoute**: 탭별 상태 보존 (모바일 BottomNav)
- **redirect**: 전역/개별 리다이렉트 (인증, 권한 체크)
- **pathParameters / queryParameters**: URL 파라미터 추출
- **push / go / replace**: 네비게이션 액션 (스택 push vs 교체)
- **GoRouterState**: 현재 라우트 상태, extra 데이터 전달

#### 프로젝트 내 사용 위치
- `syn/lib/app/router.dart` — 전체 라우트 정의
- `syn/lib/app/shell_layout.dart` — ShellRoute (사이드바/BottomNav)
- `syn/lib/features/auth/providers/auth_redirect.dart` — 인증 리다이렉트
- 모든 화면 (`/notes`, `/cards`, `/graph`, `/community`, `/gamification`, `/notifications`, `/settings`, `/admin`)

#### 설정 가이드

```dart
// router.dart — Synapse 라우터 정의
final goRouter = GoRouter(
  initialLocation: '/dashboard',
  debugLogDiagnostics: kDebugMode,
  redirect: (context, state) {
    final isLoggedIn = /* ref.read(authProvider).isLoggedIn */;
    final isAuthRoute = state.matchedLocation.startsWith('/auth');
    
    if (!isLoggedIn && !isAuthRoute) return '/auth/login';
    if (isLoggedIn && isAuthRoute) return '/dashboard';
    return null; // 리다이렉트 없음
  },
  routes: [
    // 인증 라우트 (사이드바 없음)
    GoRoute(path: '/auth/login', builder: (_, __) => const LoginPage()),
    GoRoute(path: '/auth/signup', builder: (_, __) => const SignupPage()),
    
    // 메인 앱 (ShellRoute로 사이드바/BottomNav 공유)
    StatefulShellRoute.indexedStack(
      builder: (_, __, child) => AppShellLayout(child: child),
      branches: [
        StatefulShellBranch(routes: [
          GoRoute(path: '/dashboard', builder: (_, __) => const DashboardPage()),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(path: '/notes', builder: (_, __) => const NoteListPage()),
          GoRoute(path: '/notes/:id', builder: (_, state) => 
            NoteEditorPage(noteId: state.pathParameters['id']!)),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(path: '/cards', builder: (_, __) => const DeckListPage()),
          GoRoute(path: '/review', builder: (_, __) => const ReviewPage()),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(path: '/community', builder: (_, __) => const CommunityPage()),
          GoRoute(path: '/community/groups/:id', builder: (_, state) =>
            GroupDetailPage(groupId: state.pathParameters['id']!)),
        ]),
      ],
    ),
  ],
);
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| Web에서 새로고침 시 404 | 서버에서 SPA fallback 미설정 | Cloudflare Pages `_redirects` 또는 nginx `try_files` 설정 |
| ShellRoute 안에서 전체 화면 전환 안 됨 | ShellRoute 밖에 라우트 필요 | 전체 화면 (로그인 등)은 ShellRoute 밖에 정의 |
| 뒤로가기 시 상태 초기화 | StatefulShellRoute 미사용 | `StatefulShellRoute.indexedStack` 사용하여 탭 상태 보존 |
| 딥링크 동작 안 함 (모바일) | AndroidManifest / Info.plist 설정 누락 | intent-filter (Android) / Associated Domains (iOS) 설정 |
| pathParameters 빈값 | 라우트 path에 `:id` 미정의 | GoRoute path에 파라미터 정의 확인 |

#### 참고 자료
- go_router 공식 문서: https://pub.dev/packages/go_router
- Flutter 네비게이션 가이드: https://docs.flutter.dev/ui/navigation
- ShellRoute 가이드: https://pub.dev/documentation/go_router/latest/topics/shell-route

---
