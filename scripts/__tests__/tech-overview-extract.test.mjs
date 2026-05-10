import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { extractOverview } from '../lib/tech-overview-extract.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, 'fixtures', 'tech-fixture.md');

describe('extractOverview', () => {
  it('captures intro from §1.1 first paragraph', async () => {
    const md = await readFile(FIXTURE, 'utf8');
    const out = extractOverview(md);
    expect(out.intro).toContain('기술 스택을 정의한다');
  });
  it('captures diagram html from §1.2 figure block', async () => {
    const md = await readFile(FIXTURE, 'utf8');
    const out = extractOverview(md);
    expect(out.diagramHtml).toContain('<figure class="mermaid-svg">');
    expect(out.diagramHtml).toContain('overview-diagram');
  });
  it('parses principles bullet list from §1.3', async () => {
    const md = await readFile(FIXTURE, 'utf8');
    const out = extractOverview(md);
    expect(out.principles).toEqual([
      { title: 'Production-ready', body: '운영 검증된 기술만 채택한다.' },
      { title: 'Type-safe', body: '타입 안전성 우선.' },
      { title: 'Observable', body: '모니터링이 가능해야 한다.' },
    ]);
  });
  it('preserves §1.4 table markdown', async () => {
    const md = await readFile(FIXTURE, 'utf8');
    const out = extractOverview(md);
    expect(out.tableMd).toContain('| 레이어 | 기술 |');
    expect(out.tableMd).toContain('| Client | Flutter |');
  });
  it('returns empty TechOverview when §1 is absent', () => {
    const out = extractOverview('# Title\n\n## 2. Other\n');
    expect(out).toEqual({ intro: '', diagramHtml: '', principles: [], tableMd: '', bodyMd: '' });
  });
});
