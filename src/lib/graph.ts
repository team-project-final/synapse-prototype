export interface GraphNote {
  id: string;
  title: string;
  outgoingLinks: string[];
}

export interface GraphNode {
  id: string;
  title: string;
  degree: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildGraph(notes: GraphNote[]): Graph {
  const titleToId = new Map<string, string>();
  for (const n of notes) titleToId.set(n.title, n.id);

  const edges: GraphEdge[] = [];
  for (const n of notes) {
    for (const target of n.outgoingLinks) {
      const tid = titleToId.get(target);
      if (tid) edges.push({ source: n.id, target: tid });
    }
  }

  const degree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }

  const nodes: GraphNode[] = notes.map((n) => ({
    id: n.id,
    title: n.title,
    degree: degree.get(n.id) ?? 0,
  }));

  return { nodes, edges };
}
