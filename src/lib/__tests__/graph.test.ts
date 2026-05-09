import { describe, it, expect } from 'vitest';
import { buildGraph, type GraphNote } from '../graph';

const notes: GraphNote[] = [
  { id: 'n1', title: 'A', outgoingLinks: ['B'] },
  { id: 'n2', title: 'B', outgoingLinks: ['C'] },
  { id: 'n3', title: 'C', outgoingLinks: [] },
  { id: 'n4', title: 'orphan', outgoingLinks: [] },
];

describe('buildGraph', () => {
  it('creates one node per note', () => {
    const g = buildGraph(notes);
    expect(g.nodes).toHaveLength(4);
    expect(g.nodes.map((n) => n.id).sort()).toEqual(['n1', 'n2', 'n3', 'n4']);
  });

  it('resolves outgoingLinks (title-based) to edges', () => {
    const g = buildGraph(notes);
    expect(g.edges).toEqual(
      expect.arrayContaining([
        { source: 'n1', target: 'n2' },
        { source: 'n2', target: 'n3' },
      ]),
    );
    expect(g.edges).toHaveLength(2);
  });

  it('drops outgoing links to non-existent titles', () => {
    const g = buildGraph([{ id: 'n1', title: 'A', outgoingLinks: ['ghost'] }]);
    expect(g.edges).toHaveLength(0);
  });

  it('node degree reflects connection count', () => {
    const g = buildGraph(notes);
    const b = g.nodes.find((n) => n.id === 'n2')!;
    expect(b.degree).toBe(2);
  });
});
