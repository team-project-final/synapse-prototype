
#### 개요
D3.js는 데이터 기반 동적 SVG/Canvas 시각화 라이브러리이며, force_directed는 노드-링크 그래프의 물리 기반 레이아웃 알고리즘이다.

#### 역할
Synapse의 지식 그래프 뷰어에서 노트 간 백링크 관계를 인터랙티브 네트워크 그래프로 시각화한다. 노드(노트)는 크기로 중요도(PageRank)를 표현하고, 링크(백링크)는 연결 강도를 표현한다. 드래그, 줌, 클러스터링, 태그 기반 필터링을 지원한다.

#### 선택 이유
Flutter Web에서 D3.js를 WebView 또는 `dart:js_interop`을 통해 통합한다. D3.js force simulation은 수백~수천 개의 노트를 실시간으로 레이아웃하는 데 검증된 솔루션이며, Obsidian, Roam Research 등 주요 PKM 도구도 동일한 접근법을 사용한다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **D3.js force** | 가장 유연한 그래프 레이아웃, 대규모 노드 처리 검증 | Flutter와 통합 복잡도 | ✅ 선택 |
| Cytoscape.js | 그래프 특화, 다양한 레이아웃 | D3 대비 낮은 커스터마이징 | ❌ |
| Flutter CustomPainter | 순수 Flutter, 통합 용이 | 복잡한 force 시뮬레이션 직접 구현 필요 | ❌ |
| vis.js | 쉬운 API | 대규모 그래프 성능 낮음 | ❌ |
| Three.js (3D) | 3D 그래프 가능 | 과도한 복잡성, UX 학습 곡선 | ❌ |

#### 기술적 이점
- **Force Simulation**: 물리 기반 레이아웃으로 자연스러운 클러스터링
- **PageRank 시각화**: 노드 크기로 중요도 직관적 표현
- **실시간 업데이트**: 노트 추가/삭제 시 그래프 동적 재계산
- **성능**: WebWorker에서 시뮬레이션 실행으로 UI 스레드 비차단

#### 핵심 기능
- `d3.forceSimulation()` — 물리 기반 노드 배치
- `d3.forceManyBody()` — 노드 간 척력/인력
- `d3.forceLink()` — 링크 기반 인력
- `d3.zoom()` — 줌/팬 인터랙션
- `d3.drag()` — 노드 드래그

#### 프로젝트 내 사용 위치
- `syn/lib/features/graph/widgets/knowledge_graph_widget.dart`
- `syn/web/js/graph_worker.js` — Web Worker에서 D3 시뮬레이션 실행
- Graph Service API → 노드/엣지 데이터 제공

#### 설정 가이드

```javascript
// web/js/graph_worker.js — Web Worker에서 D3 force 시뮬레이션
importScripts('https://d3js.org/d3.v7.min.js');

let simulation;

self.onmessage = function(e) {
  const { type, nodes, links } = e.data;

  if (type === 'init') {
    simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(d => 80 / Math.sqrt(d.strength || 1)))
      .force('charge', d3.forceManyBody()
        .strength(d => -200 * Math.log(d.pageRank + 1)))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide()
        .radius(d => 10 + d.pageRank * 5))
      .on('tick', () => {
        self.postMessage({
          type: 'tick',
          nodes: nodes.map(n => ({ id: n.id, x: n.x, y: n.y }))
        });
      });
  }
};
```

```dart
// lib/features/graph/widgets/knowledge_graph_widget.dart
// Flutter에서 HtmlElementView로 D3 캔버스 통합 (Web only)
class KnowledgeGraphWidget extends StatefulWidget {
  final List<GraphNode> nodes;
  final List<GraphEdge> edges;

  @override
  Widget build(BuildContext context) {
    if (kIsWeb) {
      return HtmlElementView(viewType: 'knowledge-graph-canvas');
    }
    // Mobile: Flutter CustomPainter fallback
    return GraphCanvasWidget(nodes: nodes, edges: edges);
  }
}
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| 그래프 레이아웃 수렴 안 됨 | alphaDecay 너무 낮음 | `simulation.alphaDecay(0.03)` 조정 |
| 1000+ 노드 성능 저하 | 메인 스레드에서 시뮬레이션 | Web Worker로 시뮬레이션 분리 |
| Flutter Web에서 이벤트 충돌 | D3 이벤트와 Flutter 제스처 충돌 | `pointer-events: none` CSS + Flutter GestureDetector 분리 |
| 모바일에서 D3 미사용 | 순수 Flutter가 필요 | CustomPainter + AnimationController로 대체 구현 |

#### 참고 자료
- D3.js 공식: https://d3js.org
- D3 Force: https://d3js.org/d3-force
- Flutter Web JS Interop: https://dart.dev/interop/js-interop

---
