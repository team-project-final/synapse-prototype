import { describe, it, expect } from 'vitest';
import { extractWikilinks, replaceWikilinks } from '../wikilink';

describe('extractWikilinks', () => {
  it('extracts single wikilink', () => {
    expect(extractWikilinks('see [[과적합]] for details')).toEqual(['과적합']);
  });

  it('extracts multiple wikilinks', () => {
    const links = extractWikilinks('[[A]] and [[B]] then [[C]]');
    expect(links).toEqual(['A', 'B', 'C']);
  });

  it('deduplicates identical targets', () => {
    expect(extractWikilinks('[[X]] and [[X]] again')).toEqual(['X']);
  });

  it('ignores escaped brackets', () => {
    expect(extractWikilinks('not a link: \\[[escaped]]')).toEqual([]);
  });

  it('handles korean and english mixed', () => {
    expect(extractWikilinks('[[ML 정규화 기법]]')).toEqual(['ML 정규화 기법']);
  });
});

describe('replaceWikilinks', () => {
  it('wraps wikilinks with provided render fn', () => {
    const out = replaceWikilinks('see [[과적합]] note', (target) => `<a>${target}</a>`);
    expect(out).toBe('see <a>과적합</a> note');
  });
});
