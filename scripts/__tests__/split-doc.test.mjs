import { describe, it, expect } from 'vitest';
import { splitByH2, shouldSplit } from '../lib/split-doc.mjs';

describe('shouldSplit', () => {
  it('triggers when body length >= 20000', () => {
    expect(shouldSplit({ text: 'a'.repeat(20000), codeCount: 0 })).toBe(true);
  });
  it('triggers when codeCount >= 100', () => {
    expect(shouldSplit({ text: 'a', codeCount: 100 })).toBe(true);
  });
  it('does not trigger for small docs', () => {
    expect(shouldSplit({ text: 'a'.repeat(1000), codeCount: 5 })).toBe(false);
  });
});

describe('splitByH2', () => {
  it('emits intro + sub-pages keyed by h2 slug', () => {
    const md = '# Title\n\nintro line\n\n## First\nfirst body\n\n## Second\nsecond body\n';
    const { intro, parts } = splitByH2(md);
    expect(intro).toContain('intro line');
    expect(parts).toHaveLength(2);
    expect(parts[0].title).toBe('First');
    expect(parts[0].body).toContain('first body');
    expect(parts[1].title).toBe('Second');
  });

  it('returns empty parts when no h2 present', () => {
    const { parts } = splitByH2('# Only h1\nbody');
    expect(parts).toHaveLength(0);
  });
});
