import { describe, it, expect } from 'vitest';
import { extractOutline, buildManifestEntry } from '../lib/manifest.mjs';

describe('extractOutline', () => {
  it('returns h2/h3 list with slugified anchor ids', () => {
    const md = '# T\n\n## First section\nbody\n\n### Sub\nx\n\n## Second\n';
    const out = extractOutline(md);
    expect(out).toEqual([
      { level: 2, text: 'First section', slug: expect.any(String) },
      { level: 3, text: 'Sub', slug: expect.any(String) },
      { level: 2, text: 'Second', slug: expect.any(String) },
    ]);
  });

  it('disambiguates duplicate heading slugs', () => {
    const md = '## Notes\n\n## Notes\n\n### Notes';
    const out = extractOutline(md);
    expect(out.map((o) => o.slug)).toEqual(['notes', 'notes-1', 'notes-2']);
  });
});

describe('buildManifestEntry', () => {
  it('infers group/order from filename pattern', () => {
    const e = buildManifestEntry('01_프로젝트_계획서.md', '# 01 프로젝트 계획서\n');
    expect(e.slug).toBe('01_프로젝트_계획서');
    expect(e.order).toBe(1);
    expect(e.title).toContain('프로젝트 계획서');
  });
});
