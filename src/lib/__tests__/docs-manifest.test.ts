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
    const docs = groups[0]!.docs;
    expect(docs[0]!.slug).toBe('a');
    expect(docs[1]!.slug).toBe('b');
    expect(docs[1]!.children).toEqual(['b/01_x']);
  });
});

const withTech: DocMeta[] = [
  ...sample,
  { slug: '18_기술_스택_정의서', title: '18. 기술 스택 정의서', group: 'G2', order: 18, outline: [] },
];

describe('docs-manifest hides tech doc from sidebar', () => {
  it('groupManifest excludes 18_기술_스택_정의서', () => {
    const groups = groupManifest(withTech);
    const slugs = groups.flatMap((g) => g.docs.map((d) => d.slug));
    expect(slugs).not.toContain('18_기술_스택_정의서');
  });
  it('findEntry still returns 18번 when looked up directly', () => {
    expect(findEntry(withTech, '18_기술_스택_정의서')?.title).toBe('18. 기술 스택 정의서');
  });
});
