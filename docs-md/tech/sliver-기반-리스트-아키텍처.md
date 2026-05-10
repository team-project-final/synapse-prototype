
#### 개요
Flutter의 Sliver 시스템은 `CustomScrollView` 내에서 다양한 스크롤 가능 요소(리스트, 그리드, 고정 헤더, 접히는 앱바 등)를 하나의 스크롤 컨텍스트에서 조합할 수 있는 고성능 스크롤 프레임워크이다.

#### 역할
Synapse의 모든 리스트 화면에서 `ListView`/`GridView` 대신 `CustomScrollView` + `Sliver` 위젯 조합을 사용한다. 노트 목록, 카드 목록, 공유 덱 탐색, 리더보드, 알림 센터, 스터디 그룹 목록 등 앱 전체의 스크롤 가능 화면에 일관된 패턴을 적용하여 성능과 UX를 보장한다.

#### 선택 이유
Synapse는 리스트 위에 접히는 앱바, 검색/필터 바, 통계 카드 등 다양한 고정/스크롤 요소를 조합해야 한다. 일반 `ListView`는 앱바와 별도 스크롤 컨텍스트를 가지므로 `SliverAppBar`와 연동이 불가능하다. Sliver는 이 모든 요소를 하나의 스크롤 컨텍스트에 통합하여 자연스러운 스크롤 경험을 제공한다. 또한 `SliverList`의 lazy building은 1,000개 이상의 카드/노트 목록에서도 메모리를 절약한다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **CustomScrollView + Slivers** | 스크롤 컨텍스트 통합, 고성능, 유연한 레이아웃 조합 | 학습 곡선, 코드량 증가 | ✅ 선택 |
| ListView | 단순, 빠른 구현 | SliverAppBar 연동 불가, 복합 레이아웃 한계 | ❌ |
| SingleChildScrollView + Column | 매우 단순 | 전체 자식을 한번에 빌드 (성능 문제), 대량 데이터 부적합 | ❌ |
| NestedScrollView | 내부/외부 스크롤 분리 | 탭 뷰 전용, 범용성 부족, 스크롤 충돌 가능 | ❌ (탭 뷰에만 제한적 사용) |

#### 기술적 이점
- **단일 스크롤 컨텍스트**: SliverAppBar + 필터 바 + 리스트가 하나의 스크롤로 동작. 자연스러운 스크롤 UX.
- **Lazy Building**: `SliverList`/`SliverGrid`는 화면에 보이는 항목만 빌드. 1,000개 노트도 메모리 효율적.
- **SliverAppBar**: 스크롤 시 접히는 앱바 (Warm Intellectual 미학의 여유로운 헤더 → 컴팩트 전환)
- **SliverPersistentHeader**: 검색/필터 바를 고정 헤더로 유지. 스크롤해도 항상 접근 가능.
- **혼합 레이아웃**: 같은 CustomScrollView 안에 SliverList + SliverGrid + SliverToBoxAdapter를 자유롭게 조합.
- **SliverAnimatedList**: 항목 추가/삭제 시 애니메이션 (노트 삭제, 알림 읽음 처리)
- **Web/Mobile 일관성**: 동일한 Sliver 코드가 Web과 Mobile에서 동일하게 동작.

#### 핵심 기능
- **CustomScrollView**: Sliver 위젯들의 컨테이너. 모든 Sliver 화면의 루트.
- **SliverAppBar**: 접히는/고정 앱바. `floating`, `pinned`, `snap` 옵션.
- **SliverList / SliverList.builder**: lazy building 리스트. `itemCount` + `itemBuilder` 패턴.
- **SliverGrid**: 그리드 레이아웃 (공유 덱 탐색 카드형).
- **SliverPersistentHeader**: 고정 헤더 (검색 바, 필터 칩).
- **SliverToBoxAdapter**: 일반 위젯을 Sliver 안에 배치 (통계 카드, 빈 상태).
- **SliverFillRemaining**: 나머지 공간 채우기 (빈 상태 메시지 중앙 배치).
- **SliverPadding**: Sliver에 패딩 적용.

#### 프로젝트 내 사용 위치 (전체 리스트 화면)

| 화면 | Sliver 구성 |
|------|-------------|
| SCR-W-NOTE-001 (노트 목록) | SliverAppBar + SliverPersistentHeader(검색/필터) + SliverList(노트 카드) |
| SCR-W-CARD-001 (덱 목록) | SliverAppBar + SliverGrid(덱 카드, 진행도 바) |
| SCR-W-CARD-002 (카드 목록) | SliverAppBar + SliverList(카드 브라우저) |
| SCR-W-COMM-001 (그룹 목록) | SliverAppBar + SliverPersistentHeader(탭: 내 그룹/탐색) + SliverList(그룹 카드) |
| SCR-W-COMM-004 (공유 덱) | SliverAppBar + SliverPersistentHeader(검색/필터/정렬) + SliverGrid(공유 덱 카드) |
| SCR-W-GAME-002 (배지 갤러리) | SliverAppBar + SliverGrid(배지 아이콘, 획득/미획득) |
| SCR-W-GAME-003 (리더보드) | SliverAppBar + SliverPersistentHeader(전체/그룹/주간/월간 탭) + SliverList(순위 행) |
| SCR-W-NOTI-001 (알림 센터) | SliverAppBar + SliverPersistentHeader(카테고리 필터) + SliverAnimatedList(알림) |
| SCR-W-DASH-001 (대시보드) | SliverAppBar + SliverToBoxAdapter(통계) + SliverList(최근 노트) |
| SCR-W-SEARCH-001 (검색) | SliverAppBar(검색 입력) + SliverList(검색 결과) |

#### 설정 가이드

```dart
// 노트 목록 화면 — Sliver 패턴 예시
class NoteListPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notes = ref.watch(noteListProvider);

    return CustomScrollView(
      slivers: [
        // 1. 접히는 앱바
        SliverAppBar(
          expandedHeight: 120,
          floating: true,
          snap: true,
          pinned: false,
          flexibleSpace: FlexibleSpaceBar(
            title: Text('노트', style: TextStyle(
              fontFamily: 'Fraunces', // Warm Intellectual
              color: AppColors.stone900,
            )),
          ),
        ),
        
        // 2. 고정 검색/필터 바
        SliverPersistentHeader(
          pinned: true,
          delegate: _SearchFilterHeaderDelegate(
            child: SearchFilterBar(
              onSearch: (q) => ref.read(noteListProvider.notifier).search(q),
              onFilter: (tags) => ref.read(noteListProvider.notifier).filter(tags),
            ),
          ),
        ),
        
        // 3. 노트 리스트 (lazy building)
        notes.when(
          loading: () => const SliverFillRemaining(
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (e, _) => SliverFillRemaining(
            child: Center(child: Text('오류: $e')),
          ),
          data: (noteList) => noteList.isEmpty
            ? const SliverFillRemaining(
                child: EmptyState(message: '첫 노트를 작성해보세요'),
              )
            : SliverList.builder(
                itemCount: noteList.length,
                itemBuilder: (context, index) => NoteCard(note: noteList[index]),
              ),
        ),
      ],
    );
  }
}

// SliverPersistentHeader delegate
class _SearchFilterHeaderDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;
  _SearchFilterHeaderDelegate({required this.child});

  @override double get maxExtent => 56;
  @override double get minExtent => 56;
  @override bool shouldRebuild(covariant _SearchFilterHeaderDelegate oldDelegate) => false;
  
  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: AppColors.stone50, // Warm Stone neutral
      child: child,
    );
  }
}
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| "A RenderSliver expected a child of type RenderBox" | 일반 위젯을 CustomScrollView에 직접 배치 | `SliverToBoxAdapter`로 감싸기 |
| SliverAppBar가 안 접힘 | `CustomScrollView`가 아닌 `Scaffold.body`에 직접 배치 | `CustomScrollView` 안에 배치 확인 |
| SliverList 성능 저하 (대량 데이터) | `SliverList(children: [...])` 사용 | `SliverList.builder` 사용하여 lazy building |
| SliverGrid 간격 문제 | `crossAxisSpacing`/`mainAxisSpacing` 누락 | `SliverGridDelegateWithFixedCrossAxisCount`에 spacing 명시 |
| 빈 상태에서 "no size" 에러 | SliverList에 0개 항목 + SliverFillRemaining 없음 | 빈 상태 시 `SliverFillRemaining` 사용 |
| 중첩 스크롤 충돌 | CustomScrollView 안에 또 다른 스크롤 위젯 | `NeverScrollableScrollPhysics()` 적용 또는 `SliverToBoxAdapter`로 고정 높이 지정 |

#### 참고 자료
- Flutter Sliver 공식 가이드: https://docs.flutter.dev/ui/layout/scrolling/slivers
- CustomScrollView API: https://api.flutter.dev/flutter/widgets/CustomScrollView-class.html
- SliverAppBar 상세 가이드: https://api.flutter.dev/flutter/material/SliverAppBar-class.html

---
