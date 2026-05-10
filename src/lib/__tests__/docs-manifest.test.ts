import { describe, it, expect } from 'vitest';
import { groupManifest, findEntry, type DocMeta } from '../docs-manifest';

const sample: DocMeta[] = [
  { slug: 'a', title: 'A', group: 'G1', order: 1, outline: [] },
  { slug: 'b/01_x', title: 'X', group: 'G1', order: 2.01, parent: 'b', outline: [] },
  { slug: 'b', title: 'B', group: 'G1', order: 2, children: ['b/01_x'], outline: [] },
];

describe('docs-manifest', () => {
  it('finds entry by slug (with sub-paths)', () => {
    expect(findEntry(sample, 'b/01_x')?.title).toBe('X');
  });
  it('groups by group field, sub-pages nested under parent', () => {
    const groups = groupManifest(sample);
    expect(groups).toHaveLength(1);
    const docs = groups[0].docs;
    expect(docs[0].slug).toBe('a');
    expect(docs[1].slug).toBe('b');
    expect(docs[1].children).toEqual(['b/01_x']);
  });
});
