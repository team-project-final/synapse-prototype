# Tech Stack Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the wiki document `18_기술_스택_정의서` to a top-level `/tech` section that splits the single 304 KB markdown into per-technology pages, with a rich hub (`/tech`) and per-tech detail (`/tech/:slug`) reusing the existing docs shell.

**Architecture:**
- **Build-time split** in `scripts/sync-docs.mjs`: parses `18_…md` → emits `public/docs-md/tech/<slug>.md` files + `tech-manifest.json` (overview + per-tech metadata).
- **Runtime fetch** reusing existing `docs-loader` patterns. New routes `/tech` (hub) and `/tech/:slug` (detail), latter reusing `DocsShell` (3-column with sidebar + TOC).
- **18번 stays in `public/docs-md/`** for source-link integrity, but is hidden from the `/docs` sidebar/index via a small denylist.

**Tech Stack:** Vite 6, React 18.3, React Router 7, Tailwind CSS v4 (`@theme`), Zustand (n/a here), `react-markdown` + `remark-gfm` + `rehype-*`, vitest + @testing-library/react, Playwright. Build-time: Node 22, `github-slugger`, `slugify`, `@mermaid-js/mermaid-cli`.

**Spec:** `docs/superpowers/specs/2026-05-10-tech-stack-section-design.md`

---

## Phase 1 — Build Pipeline (split scripts)

All Phase 1 tasks live under `scripts/lib/` and `scripts/__tests__/`. Tests run via `npm run test` (vitest already picks them up — see `vitest.config.ts` exclude list).

### Task 1: Create fixture markdown for tech-split tests

**Files:**
- Create: `scripts/__tests__/fixtures/tech-fixture.md`

A small markdown file that reproduces the **shape** of `18_기술_스택_정의서.md` after `renderMermaidBlocks` has run (mermaid blocks already replaced with `<figure class="mermaid-svg">…</figure>`). Two simple-pattern layers, one nested-pattern layer, plus §1/§10/§11.

- [ ] **Step 1: Create the fixture file**

```markdown
# 18. 기술 스택 정의서

## 1. 개요

### 1.1 문서 목적

본 문서는 기술 스택을 정의한다.

### 1.2 전체 시스템 아키텍처

<figure class="mermaid-svg">
<svg data-stub="overview-diagram"></svg>
</figure>

### 1.3 기술 선택 기준

- **Production-ready** — 운영 검증된 기술만 채택한다.
- **Type-safe** — 타입 안전성 우선.
- **Observable** — 모니터링이 가능해야 한다.

### 1.4 기술 스택 전체 목록

| 레이어 | 기술 |
|--------|------|
| Client | Flutter |
| Backend | Spring Boot |

## 2. Client Layer

### 2.1 Flutter 3.x

크로스플랫폼 UI 프레임워크.

#### 설치

설치 가이드.

### 2.2 Dart 3.x

Flutter의 언어. null-safety.

## 4. Backend Services Layer

### 4.1 Java/Spring Ecosystem

JVM 기반 마이크로서비스.

### 4.1.1 Java 21 (LTS)

LTS 릴리즈, virtual threads.

### 4.1.2 Spring Boot 4

자동 설정 프레임워크.

### 4.2 Python/FastAPI Ecosystem

AI 서비스용.

### 4.2.1 Python 3.12

타입 힌트.

## 10. 기술 선택 요약 매트릭스

| 항목 | 결정 |
|------|------|
| 채택 | A |

## 11. 변경 이력

- v1
```

- [ ] **Step 2: Commit fixture**

```bash
git add scripts/__tests__/fixtures/tech-fixture.md
git commit -m "test(tech-split): add wiki-shape fixture for split tests"
```

---

### Task 2: Implement `parseTechHeading` helper

**Files:**
- Create: `scripts/lib/tech-split.mjs`
- Create: `scripts/__tests__/tech-split.test.mjs`

Parses an h3 heading text like `2.1 Flutter 3.x` or `4.1.1 Java 21 (LTS)` into `{ originalSection, title, version }`.

- [ ] **Step 1: Write the failing test**

```js
// scripts/__tests__/tech-split.test.mjs
import { describe, it, expect } from 'vitest';
import { parseTechHeading } from '../lib/tech-split.mjs';

describe('parseTechHeading', () => {
  it('extracts section/title/version from "2.1 Flutter 3.x"', () => {
    expect(parseTechHeading('2.1 Flutter 3.x')).toEqual({
      originalSection: '2.1',
      title: 'Flutter',
      version: '3.x',
    });
  });
  it('handles three-number sections like "4.1.1 Java 21 (LTS)"', () => {
    expect(parseTechHeading('4.1.1 Java 21 (LTS)')).toEqual({
      originalSection: '4.1.1',
      title: 'Java',
      version: '21 LTS',
    });
  });
  it('returns null version when no version-like trailing token', () => {
    expect(parseTechHeading('5.5 Confluent Schema Registry')).toEqual({
      originalSection: '5.5',
      title: 'Confluent Schema Registry',
      version: null,
    });
  });
  it('returns null originalSection when no number prefix', () => {
    expect(parseTechHeading('Flutter')).toEqual({
      originalSection: null,
      title: 'Flutter',
      version: null,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/__tests__/tech-split.test.mjs`
Expected: FAIL with "parseTechHeading is not a function" or import error.

- [ ] **Step 3: Implement parseTechHeading**

```js
// scripts/lib/tech-split.mjs
const HEADING_RE = /^(?:(\d+(?:\.\d+){0,2})\s+)?(.*?)(?:\s+(\d+(?:\.x|\.[\dx]+)*)(?:\s*\(\s*LTS\s*\))?)?\s*$/;

export function parseTechHeading(text) {
  const m = HEADING_RE.exec(text.trim());
  if (!m) return { originalSection: null, title: text.trim(), version: null };
  const [, section, title, version] = m;
  const isLts = /\(\s*LTS\s*\)\s*$/.test(text);
  return {
    originalSection: section ?? null,
    title: (title ?? '').trim(),
    version: version ? (isLts ? `${version} LTS` : version) : null,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/__tests__/tech-split.test.mjs`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/tech-split.mjs scripts/__tests__/tech-split.test.mjs
git commit -m "feat(tech-split): parseTechHeading extracts section/title/version"
```

---

### Task 3: Implement `extractSummary` helper

**Files:**
- Modify: `scripts/lib/tech-split.mjs`
- Modify: `scripts/__tests__/tech-split.test.mjs`

Returns the first non-empty paragraph after a heading, stopping at code/table/heading/figure boundaries, trimmed and capped at 120 chars + ellipsis.

- [ ] **Step 1: Write the failing tests (append to existing test file)**

```js
import { extractSummary } from '../lib/tech-split.mjs';

describe('extractSummary', () => {
  it('returns first paragraph trimmed', () => {
    const md = '\n크로스플랫폼 UI 프레임워크.\n\n#### 설치\n';
    expect(extractSummary(md)).toBe('크로스플랫폼 UI 프레임워크.');
  });
  it('caps at 120 chars + ellipsis', () => {
    const long = '가'.repeat(200);
    const md = `\n${long}\n`;
    const out = extractSummary(md);
    expect(out.length).toBe(121);
    expect(out.endsWith('…')).toBe(true);
  });
  it('skips leading blank lines', () => {
    const md = '\n\n\n첫 단락.\n';
    expect(extractSummary(md)).toBe('첫 단락.');
  });
  it('stops before code fence', () => {
    const md = '\n첫 단락.\n\n```js\ncode\n```\n';
    expect(extractSummary(md)).toBe('첫 단락.');
  });
  it('returns empty string when no paragraph', () => {
    expect(extractSummary('\n#### Heading only\n')).toBe('');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run scripts/__tests__/tech-split.test.mjs`
Expected: FAIL on the 5 new tests.

- [ ] **Step 3: Implement extractSummary**

Append to `scripts/lib/tech-split.mjs`:

```js
export function extractSummary(chunkBody) {
  const lines = chunkBody.split('\n');
  let paragraph = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (paragraph.length === 0) {
      if (trimmed === '') continue;
      if (/^(#{1,6}\s|```|<figure|\||-{3,}|>\s)/.test(trimmed)) return '';
      paragraph.push(trimmed);
    } else {
      if (trimmed === '' || /^(#{1,6}\s|```|<figure|\||-{3,}|>\s)/.test(trimmed)) break;
      paragraph.push(trimmed);
    }
  }
  const joined = paragraph.join(' ').replace(/\s+/g, ' ').trim();
  if (joined.length === 0) return '';
  if (joined.length <= 120) return joined;
  return joined.slice(0, 120) + '…';
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run scripts/__tests__/tech-split.test.mjs`
Expected: PASS (all 9 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/tech-split.mjs scripts/__tests__/tech-split.test.mjs
git commit -m "feat(tech-split): extractSummary picks first paragraph (≤120ch + …)"
```

---

### Task 4: Layer slug normalization map

**Files:**
- Modify: `scripts/lib/tech-split.mjs`
- Modify: `scripts/__tests__/tech-split.test.mjs`

Maps long generated slugs (e.g. `backend-services-layer-java-spring-ecosystem`) to short keys (`backend-java`) used for CSS variable lookup. Returns the **short key** as `layerSlug` written to the manifest. Display label kept separately.

- [ ] **Step 1: Write the failing tests**

```js
import { normalizeLayer } from '../lib/tech-split.mjs';

describe('normalizeLayer', () => {
  it('maps simple layer name', () => {
    expect(normalizeLayer('Client Layer', null)).toEqual({
      layer: 'Client Layer',
      layerSlug: 'client',
    });
  });
  it('maps nested backend java sub-layer', () => {
    expect(normalizeLayer('Backend Services Layer', 'Java/Spring Ecosystem')).toEqual({
      layer: 'Backend / Java·Spring',
      layerSlug: 'backend-java',
    });
  });
  it('maps nested backend python sub-layer', () => {
    expect(normalizeLayer('Backend Services Layer', 'Python/FastAPI Ecosystem')).toEqual({
      layer: 'Backend / Python·FastAPI',
      layerSlug: 'backend-python',
    });
  });
  it('handles korean layers', () => {
    expect(normalizeLayer('AI/ML 레이어', null)).toEqual({
      layer: 'AI/ML 레이어',
      layerSlug: 'aiml',
    });
    expect(normalizeLayer('인프라 레이어', null)).toEqual({
      layer: '인프라 레이어',
      layerSlug: 'infra',
    });
    expect(normalizeLayer('모니터링 & 관측성 레이어', null)).toEqual({
      layer: '모니터링 & 관측성 레이어',
      layerSlug: 'observability',
    });
    expect(normalizeLayer('외부 서비스 레이어', null)).toEqual({
      layer: '외부 서비스 레이어',
      layerSlug: 'external',
    });
  });
  it('falls back to infra for unmapped layer', () => {
    expect(normalizeLayer('Edge Compute Layer', null)).toEqual({
      layer: 'Edge Compute Layer',
      layerSlug: 'infra',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/__tests__/tech-split.test.mjs`
Expected: FAIL on `normalizeLayer is not exported`.

- [ ] **Step 3: Implement normalizeLayer**

Append to `scripts/lib/tech-split.mjs`:

```js
const LAYER_MAP = [
  // [predicate(h2, h3sub), layer label, short slug]
  [(h2) => /client/i.test(h2), () => ({ layer: 'Client Layer', layerSlug: 'client' })],
  [(h2) => /gateway/i.test(h2), () => ({ layer: 'Gateway Layer', layerSlug: 'gateway' })],
  [(h2, h3) => /backend/i.test(h2) && /java|spring/i.test(h3 ?? ''), () => ({ layer: 'Backend / Java·Spring', layerSlug: 'backend-java' })],
  [(h2, h3) => /backend/i.test(h2) && /python|fastapi/i.test(h3 ?? ''), () => ({ layer: 'Backend / Python·FastAPI', layerSlug: 'backend-python' })],
  [(h2) => /^data\b/i.test(h2), () => ({ layer: 'Data Layer', layerSlug: 'data' })],
  [(h2) => /ai\/?ml|ai·ml|머신|에이아이/i.test(h2), () => ({ layer: 'AI/ML 레이어', layerSlug: 'aiml' })],
  [(h2) => /인프라|infra/i.test(h2), () => ({ layer: '인프라 레이어', layerSlug: 'infra' })],
  [(h2) => /모니터링|관측|observab/i.test(h2), () => ({ layer: '모니터링 & 관측성 레이어', layerSlug: 'observability' })],
  [(h2) => /외부|external/i.test(h2), () => ({ layer: '외부 서비스 레이어', layerSlug: 'external' })],
];

export function normalizeLayer(h2Text, h3SubText) {
  for (const [pred, build] of LAYER_MAP) {
    if (pred(h2Text, h3SubText)) return build();
  }
  return { layer: h2Text, layerSlug: 'infra' };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run scripts/__tests__/tech-split.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/tech-split.mjs scripts/__tests__/tech-split.test.mjs
git commit -m "feat(tech-split): normalizeLayer maps h2/sub to short layerSlug + display label"
```

---

### Task 5: `extractTechs` — full layer/tech split

**Files:**
- Modify: `scripts/lib/tech-split.mjs`
- Modify: `scripts/__tests__/tech-split.test.mjs`

Walks h2/h3 boundaries: for simple layers each h3 is a tech; for nested layers (h3 with `N.M.K`), the preceding `N.M` h3 is the sub-layer header (skipped as a tech), and `N.M.K` h3s are techs assigned to that sub-layer.

- [ ] **Step 1: Write the failing test using fixture**

```js
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { extractTechs } from '../lib/tech-split.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, 'fixtures', 'tech-fixture.md');

describe('extractTechs (fixture)', () => {
  it('emits 5 techs across 3 sub-layers', async () => {
    const md = await readFile(FIXTURE, 'utf8');
    const { techs } = extractTechs(md);
    const slugs = techs.map((t) => t.slug);
    expect(slugs).toEqual([
      'flutter-3-x',
      'dart-3-x',
      'java-21-lts',
      'spring-boot-4',
      'python-3-12',
    ]);
  });

  it('assigns layer/layerSlug correctly across simple + nested', async () => {
    const md = await readFile(FIXTURE, 'utf8');
    const { techs } = extractTechs(md);
    const t = (s) => techs.find((x) => x.slug === s);
    expect(t('flutter-3-x').layerSlug).toBe('client');
    expect(t('flutter-3-x').layer).toBe('Client Layer');
    expect(t('java-21-lts').layerSlug).toBe('backend-java');
    expect(t('java-21-lts').layer).toBe('Backend / Java·Spring');
    expect(t('python-3-12').layerSlug).toBe('backend-python');
  });

  it('captures version + originalSection + summary', async () => {
    const md = await readFile(FIXTURE, 'utf8');
    const { techs } = extractTechs(md);
    const flutter = techs.find((t) => t.slug === 'flutter-3-x');
    expect(flutter.version).toBe('3.x');
    expect(flutter.originalSection).toBe('2.1');
    expect(flutter.summary).toBe('크로스플랫폼 UI 프레임워크.');
  });

  it('preserves chunk content including h4 children', async () => {
    const md = await readFile(FIXTURE, 'utf8');
    const { techs } = extractTechs(md);
    const flutter = techs.find((t) => t.slug === 'flutter-3-x');
    expect(flutter.content).toContain('#### 설치');
    expect(flutter.content).toContain('설치 가이드.');
  });

  it('records chunkAnchor matching original h3 slug', async () => {
    const md = await readFile(FIXTURE, 'utf8');
    const { techs } = extractTechs(md);
    const flutter = techs.find((t) => t.slug === 'flutter-3-x');
    // github-slugger applied to "2.1 Flutter 3.x" → "21-flutter-3x"
    expect(flutter.chunkAnchor).toBe('21-flutter-3x');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/__tests__/tech-split.test.mjs`
Expected: FAIL on `extractTechs is not exported`.

- [ ] **Step 3: Implement extractTechs**

Add the import at the **top** of `scripts/lib/tech-split.mjs` (above all existing exports):

```js
import GithubSlugger from 'github-slugger';
```

Append the rest at the **bottom** of `scripts/lib/tech-split.mjs`:

```js
const H2_RE = /^##\s+(.+?)\s*$/;
const H3_RE = /^###\s+(.+?)\s*$/;

function stripSectionPrefix(text) {
  return text.replace(/^\d+(?:\.\d+){0,2}\s+/, '').trim();
}
function countDots(section) {
  if (!section) return 0;
  return (section.match(/\./g) ?? []).length;
}

export function extractTechs(markdown) {
  const lines = markdown.split('\n');
  const layers = []; // { h2Text, h3Blocks: [{ rawHeading, body }] }
  let currentLayer = null;
  let currentH3 = null;

  for (const line of lines) {
    const h2 = H2_RE.exec(line);
    const h3 = H3_RE.exec(line);
    if (h2) {
      if (currentLayer && currentH3) currentLayer.h3Blocks.push(currentH3);
      currentH3 = null;
      const text = h2[1].trim();
      // Skip non-layer h2s (excluded sections)
      if (/^(?:1\.\s|10\.\s|11\.\s|12\.\s)/.test(text)) {
        currentLayer = null;
        continue;
      }
      currentLayer = { h2Text: stripSectionPrefix(text), h3Blocks: [] };
      layers.push(currentLayer);
      continue;
    }
    if (!currentLayer) continue;
    if (h3) {
      if (currentH3) currentLayer.h3Blocks.push(currentH3);
      currentH3 = { rawHeading: h3[1].trim(), body: '' };
      continue;
    }
    if (currentH3) currentH3.body += line + '\n';
  }
  if (currentLayer && currentH3) currentLayer.h3Blocks.push(currentH3);

  const techs = [];
  const techSlugger = new GithubSlugger();
  const anchorSlugger = new GithubSlugger();

  let layerOrder = 0;
  for (const layer of layers) {
    layerOrder += 1;
    const h3s = layer.h3Blocks;
    const hasNested = h3s.some((b) => countDots(parseTechHeading(b.rawHeading).originalSection) === 2);

    if (!hasNested) {
      let techOrder = 0;
      for (const block of h3s) {
        const meta = parseTechHeading(block.rawHeading);
        techOrder += 1;
        const slugInput = stripSectionPrefix(block.rawHeading).replace(/\./g, '-');
        const slug = techSlugger.slug(slugInput);
        const norm = normalizeLayer(layer.h2Text, null);
        techs.push({
          slug,
          title: meta.title,
          version: meta.version,
          layer: norm.layer,
          layerSlug: norm.layerSlug,
          layerOrder,
          techOrder,
          summary: extractSummary(block.body),
          originalSection: meta.originalSection,
          chunkAnchor: anchorSlugger.slug(block.rawHeading),
          content: block.body.trimEnd() + '\n',
          outline: extractH4Outline(block.body),
        });
      }
    } else {
      // Nested: a header h3 (N.M) introduces a sub-layer for following N.M.K h3s.
      let currentSub = null;
      let techOrder = 0;
      for (const block of h3s) {
        const meta = parseTechHeading(block.rawHeading);
        const dots = countDots(meta.originalSection);
        if (dots === 1) {
          currentSub = meta.title;
          techOrder = 0;
          continue;
        }
        if (dots === 2 && currentSub) {
          techOrder += 1;
          const slugInput = stripSectionPrefix(block.rawHeading).replace(/\./g, '-');
          const slug = techSlugger.slug(slugInput);
          const norm = normalizeLayer(layer.h2Text, currentSub);
          techs.push({
            slug,
            title: meta.title,
            version: meta.version,
            layer: norm.layer,
            layerSlug: norm.layerSlug,
            layerOrder,
            techOrder,
            summary: extractSummary(block.body),
            originalSection: meta.originalSection,
            chunkAnchor: anchorSlugger.slug(block.rawHeading),
            content: block.body.trimEnd() + '\n',
            outline: extractH4Outline(block.body),
          });
        }
      }
    }
  }

  return { techs };
}

function extractH4Outline(body) {
  const slugger = new GithubSlugger();
  const out = [];
  const re = /^####\s+(.+?)\s*$/gm;
  let m;
  while ((m = re.exec(body))) {
    const text = m[1].trim();
    out.push({ level: 4, text, slug: slugger.slug(text) });
  }
  return out;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run scripts/__tests__/tech-split.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/tech-split.mjs scripts/__tests__/tech-split.test.mjs
git commit -m "feat(tech-split): extractTechs supports simple + nested h2/h3 patterns"
```

---

### Task 6: `extractOverview` — §1 → TechOverview

**Files:**
- Create: `scripts/lib/tech-overview-extract.mjs`
- Create: `scripts/__tests__/tech-overview-extract.test.mjs`

Pulls `## 1. 개요` block and structures it into `{ intro, diagramHtml, principles[], tableMd, bodyMd }`.

- [ ] **Step 1: Write the failing tests**

```js
// scripts/__tests__/tech-overview-extract.test.mjs
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
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run scripts/__tests__/tech-overview-extract.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement extractOverview**

```js
// scripts/lib/tech-overview-extract.mjs
const SECTION_RE = /^###\s+1\.(\d+)\b\s*(.*?)\s*$/;
const STOP_H2 = /^##\s+\d/;

export function extractOverview(markdown) {
  const lines = markdown.split('\n');
  let inOverview = false;
  let currentIdx = null;
  const buckets = { 1: [], 2: [], 3: [], 4: [] };
  const headerSeenOverview = /^##\s+1\.\s/;

  for (const line of lines) {
    if (headerSeenOverview.test(line)) {
      inOverview = true;
      currentIdx = null;
      continue;
    }
    if (!inOverview) continue;
    if (STOP_H2.test(line)) break;
    const sub = SECTION_RE.exec(line);
    if (sub) {
      currentIdx = Number(sub[1]);
      continue;
    }
    if (currentIdx && buckets[currentIdx]) buckets[currentIdx].push(line);
  }

  const join = (arr) => arr.join('\n').trim();
  const intro = firstParagraph(join(buckets[1]));
  const diagramHtml = pickFigureBlock(join(buckets[2]));
  const principles = parsePrincipleBullets(join(buckets[3]));
  const tableMd = pickTableBlock(join(buckets[4]));
  const bodyMd = [intro, diagramHtml, '', tableMd].filter(Boolean).join('\n\n');

  if (!intro && !diagramHtml && principles.length === 0 && !tableMd) {
    return { intro: '', diagramHtml: '', principles: [], tableMd: '', bodyMd: '' };
  }
  return { intro, diagramHtml, principles, tableMd, bodyMd };
}

function firstParagraph(text) {
  const lines = text.split('\n');
  const para = [];
  for (const l of lines) {
    if (l.trim() === '') {
      if (para.length) break;
      continue;
    }
    para.push(l.trim());
  }
  return para.join(' ');
}

function pickFigureBlock(text) {
  const m = /<figure[^>]*>[\s\S]*?<\/figure>/.exec(text);
  return m ? m[0] : '';
}

function pickTableBlock(text) {
  const m = /(^\|[^\n]+\|\n\|[\s\-|:]+\|\n(?:\|[^\n]+\|\n?)+)/m.exec(text);
  return m ? m[1].trimEnd() : '';
}

function parsePrincipleBullets(text) {
  const out = [];
  const re = /^-\s+\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/gm;
  let m;
  while ((m = re.exec(text))) {
    out.push({ title: m[1].trim(), body: m[2].trim() });
  }
  return out;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run scripts/__tests__/tech-overview-extract.test.mjs`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/tech-overview-extract.mjs scripts/__tests__/tech-overview-extract.test.mjs
git commit -m "feat(tech-overview): extractOverview structures §1 into intro/diagram/principles/table"
```

---

### Task 7: `splitTechDoc` orchestrator + manifest assembly

**Files:**
- Modify: `scripts/lib/tech-split.mjs`
- Modify: `scripts/__tests__/tech-split.test.mjs`

Top-level function returning `{ overview, techs, extras, manifest }` where `manifest` is the JSON-serializable shape stored in `tech-manifest.json`. Also extracts `## 10` and `## 12` as `matrixMd` / `auditMd`.

- [ ] **Step 1: Write the failing test**

Append to `scripts/__tests__/tech-split.test.mjs`:

```js
import { splitTechDoc } from '../lib/tech-split.mjs';

describe('splitTechDoc (fixture)', () => {
  it('returns overview + techs + extras + manifest', async () => {
    const md = await readFile(FIXTURE, 'utf8');
    const out = splitTechDoc(md);
    expect(out.overview.principles).toHaveLength(3);
    expect(out.techs).toHaveLength(5);
    expect(out.extras.matrixMd).toContain('| 항목 | 결정 |');
    expect(out.extras.auditMd).toBeNull();
    expect(out.manifest.overview.principles).toHaveLength(3);
    expect(out.manifest.techs[0].slug).toBe('flutter-3-x');
    expect(out.manifest.techs[0]).not.toHaveProperty('content');
    expect(out.manifest.extras).toEqual({ matrixSlug: 'matrix', auditSlug: null });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run scripts/__tests__/tech-split.test.mjs`
Expected: FAIL on missing export.

- [ ] **Step 3: Implement splitTechDoc**

Add the import at the **top** of `scripts/lib/tech-split.mjs`:

```js
import { extractOverview } from './tech-overview-extract.mjs';
```

Append the rest at the **bottom** of `scripts/lib/tech-split.mjs`:

```js
function extractNumberedH2(markdown, num) {
  const startRe = new RegExp(`^##\\s+${num}\\.\\s+.*$`, 'm');
  const startMatch = startRe.exec(markdown);
  if (!startMatch) return null;
  const startIdx = startMatch.index + startMatch[0].length;
  const rest = markdown.slice(startIdx);
  const nextRe = /^##\s+\d+\.\s+/m;
  const endMatch = nextRe.exec(rest);
  const body = endMatch ? rest.slice(0, endMatch.index) : rest;
  const trimmed = body.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function splitTechDoc(markdown) {
  const overview = extractOverview(markdown);
  const { techs } = extractTechs(markdown);
  const matrixMd = extractNumberedH2(markdown, 10);
  const auditMd = extractNumberedH2(markdown, 12);
  const extras = { matrixMd, auditMd };
  const manifest = {
    overview: {
      intro: overview.intro,
      diagramHtml: overview.diagramHtml,
      principles: overview.principles,
      tableMd: overview.tableMd,
    },
    techs: techs.map((t) => {
      const meta = { ...t };
      delete meta.content;
      return meta;
    }),
    extras: {
      matrixSlug: matrixMd ? 'matrix' : null,
      auditSlug: auditMd ? 'audit' : null,
    },
  };
  return { overview, techs, extras, manifest };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run scripts/__tests__/tech-split.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/tech-split.mjs scripts/__tests__/tech-split.test.mjs
git commit -m "feat(tech-split): splitTechDoc orchestrates overview + techs + matrix/audit extras"
```

---

### Task 8: Wire `splitTechDoc` into `sync-docs.mjs`

**Files:**
- Modify: `scripts/sync-docs.mjs`

When the wiki entry being processed is `18_기술_스택_정의서.md`, also write `public/docs-md/tech/<slug>.md`, `tech/overview.md`, `tech/matrix.md`, `tech/audit.md` (latter two only if present), and `tech/tech-manifest.json`. The 18번 itself is still written into `public/docs-md/` and added to the docs manifest as before.

- [ ] **Step 1: Modify sync-docs.mjs**

Add the import at top:

```js
import { splitTechDoc } from './lib/tech-split.mjs';
```

Add after `const PUBLIC_DOCS_DIR = …`:

```js
const TECH_DOC_SLUG = '18_기술_스택_정의서';
const TECH_OUT_DIR = join(PUBLIC_DOCS_DIR, 'tech');
```

Inside the `for (const entry of entries)` loop, **after** the existing block that writes `destName` and pushes `manifest.push(buildManifestEntry(...))`, add:

```js
    if (destName.replace(/\.md$/, '') === TECH_DOC_SLUG) {
      await mkdir(TECH_OUT_DIR, { recursive: true });
      const out = splitTechDoc(rendered);
      for (const t of out.techs) {
        await writeFile(join(TECH_OUT_DIR, `${t.slug}.md`), t.content, 'utf8');
      }
      if (out.overview.bodyMd) {
        await writeFile(join(TECH_OUT_DIR, 'overview.md'), out.overview.bodyMd, 'utf8');
      }
      if (out.extras.matrixMd) {
        await writeFile(join(TECH_OUT_DIR, 'matrix.md'), out.extras.matrixMd, 'utf8');
      }
      if (out.extras.auditMd) {
        await writeFile(join(TECH_OUT_DIR, 'audit.md'), out.extras.auditMd, 'utf8');
      }
      await writeFile(
        join(TECH_OUT_DIR, 'tech-manifest.json'),
        JSON.stringify(out.manifest, null, 2),
        'utf8',
      );
      console.log(`[sync-docs] tech split: ${out.techs.length} techs → ${TECH_OUT_DIR}`);
    }
```

- [ ] **Step 2: Manually run sync-docs against fixture (smoke test)**

There is no easy way to test sync-docs in CI without WIKI_PAT. Instead, run the existing test suite to ensure no regressions:

Run: `npm run test`
Expected: PASS (all existing tests + new tech-split / tech-overview-extract).

- [ ] **Step 3: Commit**

```bash
git add scripts/sync-docs.mjs
git commit -m "feat(sync-docs): split 18번 위키를 public/docs-md/tech/<slug>.md + tech-manifest.json으로 산출"
```

---

## Phase 2 — Client lib + shared mods

### Task 9: `src/lib/tech-manifest.ts` types + loader + helpers

**Files:**
- Create: `src/lib/tech-manifest.ts`
- Create: `src/lib/__tests__/tech-manifest.test.ts`

Defines `TechMeta`, `TechManifest`, `loadTechManifest()`, `groupTechsByLayer()`, `flattenForPager()`, `findTechBySlug()`, `getLayerColor()`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/__tests__/tech-manifest.test.ts
import { describe, it, expect } from 'vitest';
import {
  groupTechsByLayer,
  flattenForPager,
  findTechBySlug,
  getLayerColor,
  type TechMeta,
} from '../tech-manifest';

const sample: TechMeta[] = [
  { slug: 'flutter-3-x', title: 'Flutter', version: '3.x', layer: 'Client Layer',
    layerSlug: 'client', layerOrder: 1, techOrder: 1, summary: '...',
    outline: [], originalSection: '2.1', chunkAnchor: '21-flutter-3x' },
  { slug: 'dart-3-x', title: 'Dart', version: '3.x', layer: 'Client Layer',
    layerSlug: 'client', layerOrder: 1, techOrder: 2, summary: '...',
    outline: [], originalSection: '2.2', chunkAnchor: '22-dart-3x' },
  { slug: 'java-21-lts', title: 'Java', version: '21 LTS', layer: 'Backend / Java·Spring',
    layerSlug: 'backend-java', layerOrder: 3, techOrder: 1, summary: '...',
    outline: [], originalSection: '4.1.1', chunkAnchor: '411-java-21-lts' },
];

describe('groupTechsByLayer', () => {
  it('preserves layer order then tech order', () => {
    const groups = groupTechsByLayer(sample);
    expect(groups.map((g) => g.layerSlug)).toEqual(['client', 'backend-java']);
    expect(groups[0].techs.map((t) => t.slug)).toEqual(['flutter-3-x', 'dart-3-x']);
  });
});

describe('flattenForPager', () => {
  it('produces single ordered list across layers', () => {
    expect(flattenForPager(sample).map((t) => t.slug)).toEqual([
      'flutter-3-x', 'dart-3-x', 'java-21-lts',
    ]);
  });
});

describe('findTechBySlug', () => {
  it('finds existing tech', () => {
    expect(findTechBySlug(sample, 'dart-3-x')?.title).toBe('Dart');
  });
  it('returns undefined for missing slug', () => {
    expect(findTechBySlug(sample, 'nope')).toBeUndefined();
  });
});

describe('getLayerColor', () => {
  it('returns CSS variable for known slug', () => {
    expect(getLayerColor('client')).toBe('var(--tech-client)');
    expect(getLayerColor('backend-java')).toBe('var(--tech-backend-java)');
  });
  it('falls back to --tech-infra for unknown slug', () => {
    expect(getLayerColor('zzz')).toBe('var(--tech-infra)');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/lib/__tests__/tech-manifest.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement tech-manifest.ts**

```ts
// src/lib/tech-manifest.ts
export interface Outline {
  level: 4;
  text: string;
  slug: string;
}

export interface TechMeta {
  slug: string;
  title: string;
  version: string | null;
  layer: string;
  layerSlug: string;
  layerOrder: number;
  techOrder: number;
  summary: string;
  outline: Outline[];
  originalSection: string | null;
  chunkAnchor: string;
}

export interface Principle {
  title: string;
  body: string;
}

export interface TechOverview {
  intro: string;
  diagramHtml: string;
  principles: Principle[];
  tableMd: string;
}

export interface TechManifest {
  overview: TechOverview;
  techs: TechMeta[];
  extras: { matrixSlug: string | null; auditSlug: string | null };
}

const KNOWN_LAYERS = new Set([
  'client', 'gateway', 'backend-java', 'backend-python',
  'data', 'aiml', 'infra', 'observability', 'external',
]);

let cache: TechManifest | null = null;

export async function loadTechManifest(base: string): Promise<TechManifest> {
  if (cache) return cache;
  const res = await fetch(`${base}docs-md/tech/tech-manifest.json`);
  if (!res.ok) throw new Error(`tech-manifest 404 (${res.status})`);
  cache = (await res.json()) as TechManifest;
  return cache;
}

export function groupTechsByLayer(techs: TechMeta[]): { layer: string; layerSlug: string; techs: TechMeta[] }[] {
  const map = new Map<string, { layer: string; layerSlug: string; layerOrder: number; techs: TechMeta[] }>();
  for (const t of techs) {
    const cur = map.get(t.layerSlug);
    if (cur) cur.techs.push(t);
    else map.set(t.layerSlug, { layer: t.layer, layerSlug: t.layerSlug, layerOrder: t.layerOrder, techs: [t] });
  }
  return [...map.values()]
    .sort((a, b) => a.layerOrder - b.layerOrder)
    .map((g) => ({
      layer: g.layer,
      layerSlug: g.layerSlug,
      techs: g.techs.sort((a, b) => a.techOrder - b.techOrder),
    }));
}

export function flattenForPager(techs: TechMeta[]): TechMeta[] {
  return [...techs].sort((a, b) =>
    a.layerOrder - b.layerOrder || a.techOrder - b.techOrder,
  );
}

export function findTechBySlug(techs: TechMeta[], slug: string): TechMeta | undefined {
  return techs.find((t) => t.slug === slug);
}

export function getLayerColor(layerSlug: string): string {
  if (KNOWN_LAYERS.has(layerSlug)) return `var(--tech-${layerSlug})`;
  return 'var(--tech-infra)';
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/__tests__/tech-manifest.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/tech-manifest.ts src/lib/__tests__/tech-manifest.test.ts
git commit -m "feat(tech): tech-manifest types + loader + helpers"
```

---

### Task 10: Hide 18번 from docs sidebar/index

**Files:**
- Modify: `src/lib/docs-manifest.ts`
- Modify: `src/lib/__tests__/docs-manifest.test.ts`

Add hidden set; `groupManifest` filters; `findEntry` unchanged so direct URL still works.

- [ ] **Step 1: Add failing test**

Append to `src/lib/__tests__/docs-manifest.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/lib/__tests__/docs-manifest.test.ts`
Expected: FAIL — `18_…` is grouped.

- [ ] **Step 3: Implement hidden set**

Edit `src/lib/docs-manifest.ts`:

```ts
const HIDDEN_FROM_DOCS_SIDEBAR = new Set(['18_기술_스택_정의서']);

export function groupManifest(manifest: DocMeta[]): { group: string; docs: DocMeta[] }[] {
  const map = new Map<string, DocMeta[]>();
  for (const m of manifest) {
    if (m.parent) continue;
    if (HIDDEN_FROM_DOCS_SIDEBAR.has(m.slug)) continue;
    if (!map.has(m.group)) map.set(m.group, []);
    map.get(m.group)!.push(m);
  }
  return [...map.entries()].map(([group, docs]) => ({
    group,
    docs: docs.sort((a, b) => a.order - b.order),
  }));
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/__tests__/docs-manifest.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/docs-manifest.ts src/lib/__tests__/docs-manifest.test.ts
git commit -m "feat(docs): hide 18번 from docs sidebar/index (URL still resolves for source links)"
```

---

### Task 11: Generalize `DocsTOC` to accept level 4

**Files:**
- Modify: `src/components/docs/DocsTOC.tsx`

Currently typed to `level: 2 | 3`. We need it to also accept `4` for tech detail pages (chunk has h4 only). No test changes needed — UI unaffected for existing pages because `extractOutline` still emits 2/3. Indent `level === 4` like `level === 3`.

- [ ] **Step 1: Edit type union**

Replace:

```ts
interface Outline {
  level: 2 | 3;
  text: string;
  slug: string;
}
```

with:

```ts
interface Outline {
  level: 2 | 3 | 4;
  text: string;
  slug: string;
}
```

- [ ] **Step 2: Update padding logic in render**

Replace:

```tsx
<li key={o.slug} style={{ paddingLeft: o.level === 3 ? '1.5rem' : 0 }}>
```

with:

```tsx
<li key={o.slug} style={{ paddingLeft: o.level >= 3 ? '1.5rem' : 0 }}>
```

- [ ] **Step 3: Verify type check**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/docs/DocsTOC.tsx
git commit -m "refactor(docs-toc): accept level 4 outlines (tech detail h4 chunks)"
```

---

## Phase 3 — Design tokens

### Task 12: Add tech color tokens to `globals.css`

**Files:**
- Modify: `src/styles/globals.css`

Adds 9 CSS variables under `@theme`. No test (visual only).

- [ ] **Step 1: Edit globals.css**

Inside the existing `@theme { … }` block (after `--color-info: …;` line), insert:

```css
  --tech-client: #D97706;
  --tech-gateway: #0EA5E9;
  --tech-backend-java: #7C3AED;
  --tech-backend-python: #2563EB;
  --tech-data: #059669;
  --tech-aiml: #DB2777;
  --tech-infra: #475569;
  --tech-observability: #EA580C;
  --tech-external: #525252;
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat(theme): tech layer color tokens (--tech-client … --tech-external)"
```

---

## Phase 4 — Hub UI

### Task 13: `TechCard` component

**Files:**
- Create: `src/components/tech/TechCard.tsx`
- Create: `src/components/tech/__tests__/TechCard.test.tsx`

Single tech card with left 4 px accent bar (color from `getLayerColor`) + title + version Badge + clamped summary.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/tech/__tests__/TechCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TechCard } from '../TechCard';
import type { TechMeta } from '@/lib/tech-manifest';

const t: TechMeta = {
  slug: 'flutter-3-x', title: 'Flutter', version: '3.x',
  layer: 'Client Layer', layerSlug: 'client', layerOrder: 1, techOrder: 1,
  summary: '크로스플랫폼 UI 프레임워크.', outline: [],
  originalSection: '2.1', chunkAnchor: '21-flutter-3x',
};

describe('TechCard', () => {
  it('renders title, version badge, summary', () => {
    render(
      <MemoryRouter>
        <TechCard tech={t} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Flutter' })).toBeInTheDocument();
    expect(screen.getByText('3.x')).toBeInTheDocument();
    expect(screen.getByText('크로스플랫폼 UI 프레임워크.')).toBeInTheDocument();
  });

  it('omits version badge when version is null', () => {
    render(
      <MemoryRouter>
        <TechCard tech={{ ...t, version: null }} />
      </MemoryRouter>,
    );
    expect(screen.queryByText('3.x')).not.toBeInTheDocument();
  });

  it('applies layer color to the accent bar via inline style', () => {
    const { container } = render(
      <MemoryRouter>
        <TechCard tech={t} />
      </MemoryRouter>,
    );
    const link = container.querySelector('a')!;
    expect(link.getAttribute('style')).toContain('var(--tech-client)');
  });

  it('links to /tech/<slug>', () => {
    render(
      <MemoryRouter>
        <TechCard tech={t} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link').getAttribute('href')).toBe('/tech/flutter-3-x');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/components/tech/__tests__/TechCard.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement TechCard**

```tsx
// src/components/tech/TechCard.tsx
import { Link } from 'react-router';
import { Badge } from '@/components/ds';
import { getLayerColor, type TechMeta } from '@/lib/tech-manifest';

export function TechCard({ tech }: { tech: TechMeta }) {
  return (
    <Link
      to={`/tech/${tech.slug}`}
      className="block rounded-md bg-stone-100 border-l-4 p-4 shadow-sm hover:shadow-md transition-shadow"
      style={{ borderLeftColor: getLayerColor(tech.layerSlug) }}
    >
      <div className="flex items-baseline gap-2 mb-1">
        <h3 className="display text-lg text-stone-900">{tech.title}</h3>
        {tech.version && <Badge tone="neutral">{tech.version}</Badge>}
      </div>
      <p className="text-sm text-stone-600 line-clamp-2">{tech.summary}</p>
    </Link>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/tech/__tests__/TechCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/tech/TechCard.tsx src/components/tech/__tests__/TechCard.test.tsx
git commit -m "feat(tech): TechCard with layer accent bar + version badge + clamped summary"
```

---

### Task 14: `TechLayerSection` component

**Files:**
- Create: `src/components/tech/TechLayerSection.tsx`

Section heading (h2 with `id={layerSlug}` + `scroll-mt-16`) + responsive grid of TechCards. No test (pure layout wrapper, covered by hub integration test in Task 25).

- [ ] **Step 1: Implement TechLayerSection**

```tsx
// src/components/tech/TechLayerSection.tsx
import type { TechMeta } from '@/lib/tech-manifest';
import { TechCard } from './TechCard';

interface Props {
  layer: string;
  layerSlug: string;
  techs: TechMeta[];
}

export function TechLayerSection({ layer, layerSlug, techs }: Props) {
  return (
    <section className="space-y-3">
      <h2 id={layerSlug} className="display text-xl scroll-mt-16">{layer}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {techs.map((t) => (
          <TechCard key={t.slug} tech={t} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/tech/TechLayerSection.tsx
git commit -m "feat(tech): TechLayerSection groups cards under layer heading"
```

---

### Task 15: `PrinciplesGrid` component

**Files:**
- Create: `src/components/tech/PrinciplesGrid.tsx`

2-column card grid.

- [ ] **Step 1: Implement**

```tsx
// src/components/tech/PrinciplesGrid.tsx
import { Card } from '@/components/ds';
import type { Principle } from '@/lib/tech-manifest';

export function PrinciplesGrid({ principles }: { principles: Principle[] }) {
  if (principles.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {principles.map((p) => (
        <Card key={p.title} className="space-y-1">
          <h3 className="display text-base text-stone-900">{p.title}</h3>
          <p className="text-sm text-stone-600">{p.body}</p>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/tech/PrinciplesGrid.tsx
git commit -m "feat(tech): PrinciplesGrid renders selection criteria as cards"
```

---

### Task 16: `TechOverviewDiagram` component

**Files:**
- Create: `src/components/tech/TechOverviewDiagram.tsx`

Renders pre-rendered SVG figure HTML inside an `overflow-x-auto` wrapper.

- [ ] **Step 1: Implement**

```tsx
// src/components/tech/TechOverviewDiagram.tsx
export function TechOverviewDiagram({ html }: { html: string }) {
  if (!html) return null;
  return (
    <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/tech/TechOverviewDiagram.tsx
git commit -m "feat(tech): TechOverviewDiagram inlines pre-rendered mermaid SVG"
```

---

### Task 17: `AppendixDocs` component (lazy-loaded details)

**Files:**
- Create: `src/components/tech/AppendixDocs.tsx`

`<details>` blocks that fetch markdown only when first opened, then render with `DocsArticle`.

- [ ] **Step 1: Implement**

```tsx
// src/components/tech/AppendixDocs.tsx
import { useState } from 'react';
import { loadDoc } from '@/lib/docs-loader';
import { DocsArticle } from '@/components/docs/DocsArticle';

interface AppendixItem {
  title: string;
  slug: string; // relative to docs-md/, e.g. 'tech/matrix'
}

export function AppendixDocs({ items }: { items: AppendixItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <AppendixDetail key={item.slug} item={item} />
      ))}
    </div>
  );
}

function AppendixDetail({ item }: { item: AppendixItem }) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (!e.currentTarget.open || content || error) return;
    loadDoc(item.slug).then(setContent).catch((err: Error) => setError(err.message));
  };

  return (
    <details className="rounded-md border border-stone-200 bg-white" onToggle={onToggle}>
      <summary className="cursor-pointer px-4 py-2 text-sm font-medium">{item.title}</summary>
      <div className="px-4 py-3 border-t border-stone-200">
        {error && <p className="text-[#DC2626] text-sm">{error}</p>}
        {!content && !error && <p className="text-stone-500 text-sm">불러오는 중…</p>}
        {content && <DocsArticle source={content} />}
      </div>
    </details>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/tech/AppendixDocs.tsx
git commit -m "feat(tech): AppendixDocs lazy-loads matrix/audit markdown on first open"
```

---

### Task 18: `TechHero` component

**Files:**
- Create: `src/components/tech/TechHero.tsx`

Page title + subtitle + source link.

- [ ] **Step 1: Implement**

```tsx
// src/components/tech/TechHero.tsx
import { Link } from 'react-router';

export function TechHero({ techCount }: { techCount: number }) {
  return (
    <header className="space-y-2">
      <h1 className="display text-4xl text-stone-900">기술 스택</h1>
      <p className="text-stone-600">
        Synapse를 구성하는 {techCount}개 기술 — 레이어별 구성과 선정 기준.{' '}
        <Link to="/docs/18_기술_스택_정의서" className="text-[#D97706] hover:text-[#B45309] underline">
          출처: 위키 18. 기술 스택 정의서 →
        </Link>
      </p>
    </header>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/tech/TechHero.tsx
git commit -m "feat(tech): TechHero with title + subtitle + wiki source link"
```

---

### Task 19: `routes/tech/index.tsx` hub assembly

**Files:**
- Create: `src/routes/tech/index.tsx`
- Create: `src/routes/tech/__tests__/index.test.tsx`

Composes hub: SiteHeader + TechHero + TechOverviewDiagram + PrinciplesGrid + 9 TechLayerSection + AppendixDocs.

- [ ] **Step 1: Write the failing test**

```tsx
// src/routes/tech/__tests__/index.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import TechHub from '../index';
import * as manifestMod from '@/lib/tech-manifest';
import type { TechManifest } from '@/lib/tech-manifest';

const fakeManifest: TechManifest = {
  overview: {
    intro: 'Intro text',
    diagramHtml: '<figure class="mermaid-svg"><svg data-stub="hub"></svg></figure>',
    principles: [{ title: 'Production-ready', body: '운영 검증.' }],
    tableMd: '| L | T |\n|---|---|\n| Client | Flutter |',
  },
  techs: [
    { slug: 'flutter-3-x', title: 'Flutter', version: '3.x', layer: 'Client Layer',
      layerSlug: 'client', layerOrder: 1, techOrder: 1, summary: 'UI', outline: [],
      originalSection: '2.1', chunkAnchor: '21-flutter-3x' },
  ],
  extras: { matrixSlug: 'matrix', auditSlug: null },
};

describe('TechHub', () => {
  beforeEach(() => {
    vi.spyOn(manifestMod, 'loadTechManifest').mockResolvedValue(fakeManifest);
  });

  it('renders hero, diagram, principles, layer section, appendix', async () => {
    render(
      <MemoryRouter>
        <TechHub />
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByRole('heading', { level: 1, name: '기술 스택' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Client Layer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Flutter' })).toBeInTheDocument();
    expect(screen.getByText('Production-ready')).toBeInTheDocument();
    expect(document.querySelector('[data-stub="hub"]')).toBeInTheDocument();
    expect(screen.getByText('10. 기술 선택 요약 매트릭스')).toBeInTheDocument();
  });

  it('shows fallback message when manifest fetch fails', async () => {
    vi.spyOn(manifestMod, 'loadTechManifest').mockRejectedValueOnce(new Error('manifest 404 (404)'));
    render(
      <MemoryRouter>
        <TechHub />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByText(/기술 스택을 불러올 수 없습니다/)).toBeInTheDocument(),
    );
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/routes/tech/__tests__/index.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement TechHub**

```tsx
// src/routes/tech/index.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { TechHero } from '@/components/tech/TechHero';
import { TechOverviewDiagram } from '@/components/tech/TechOverviewDiagram';
import { PrinciplesGrid } from '@/components/tech/PrinciplesGrid';
import { TechLayerSection } from '@/components/tech/TechLayerSection';
import { AppendixDocs } from '@/components/tech/AppendixDocs';
import { groupTechsByLayer, loadTechManifest, type TechManifest } from '@/lib/tech-manifest';

export default function TechHub() {
  const [manifest, setManifest] = useState<TechManifest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTechManifest(import.meta.env.BASE_URL)
      .then(setManifest)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="min-h-dvh bg-stone-50">
        <SiteHeader />
        <div className="max-w-3xl mx-auto px-6 py-12 space-y-3">
          <h1 className="display text-3xl">기술 스택을 불러올 수 없습니다</h1>
          <p className="text-stone-600">위키 동기화가 필요할 수 있습니다 ({error}).</p>
          <p>
            <Link to="/docs/18_기술_스택_정의서" className="text-[#D97706] underline">
              위키 원본 보기 →
            </Link>
          </p>
        </div>
      </div>
    );
  }
  if (!manifest) {
    return (
      <div className="min-h-dvh bg-stone-50">
        <SiteHeader />
        <p className="max-w-3xl mx-auto px-6 py-12 text-stone-500">불러오는 중…</p>
      </div>
    );
  }

  const groups = groupTechsByLayer(manifest.techs);
  const appendix = [
    manifest.extras.matrixSlug && {
      title: '10. 기술 선택 요약 매트릭스',
      slug: `tech/${manifest.extras.matrixSlug}`,
    },
    manifest.extras.auditSlug && {
      title: '12. 버전 호환성 감사 보고서',
      slug: `tech/${manifest.extras.auditSlug}`,
    },
  ].filter(Boolean) as { title: string; slug: string }[];

  return (
    <div className="min-h-dvh bg-stone-50">
      <SiteHeader />
      <article className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <TechHero techCount={manifest.techs.length} />

        {manifest.overview.diagramHtml && (
          <section className="space-y-3">
            <h2 className="display text-xl">시스템 아키텍처</h2>
            <TechOverviewDiagram html={manifest.overview.diagramHtml} />
          </section>
        )}

        {manifest.overview.principles.length > 0 && (
          <section className="space-y-3">
            <h2 className="display text-xl">선정 기준</h2>
            <PrinciplesGrid principles={manifest.overview.principles} />
          </section>
        )}

        <section className="space-y-8">
          <h2 className="display text-xl">기술 목록</h2>
          {groups.map((g) => (
            <TechLayerSection
              key={g.layerSlug}
              layer={g.layer}
              layerSlug={g.layerSlug}
              techs={g.techs}
            />
          ))}
        </section>

        {appendix.length > 0 && (
          <section className="space-y-3">
            <h2 className="display text-xl">부록</h2>
            <AppendixDocs items={appendix} />
          </section>
        )}
      </article>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/routes/tech/__tests__/index.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/tech/index.tsx src/routes/tech/__tests__/index.test.tsx
git commit -m "feat(tech): /tech hub assembling hero/diagram/principles/layers/appendix"
```

---

## Phase 5 — Detail UI

### Task 20: `TechSidebar` component

**Files:**
- Create: `src/components/tech/TechSidebar.tsx`
- Create: `src/components/tech/__tests__/TechSidebar.test.tsx`

Layer-grouped nav of all techs, current item highlighted.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/tech/__tests__/TechSidebar.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TechSidebar } from '../TechSidebar';
import type { TechMeta } from '@/lib/tech-manifest';

const techs: TechMeta[] = [
  { slug: 'flutter-3-x', title: 'Flutter', version: '3.x', layer: 'Client Layer',
    layerSlug: 'client', layerOrder: 1, techOrder: 1, summary: '', outline: [],
    originalSection: '2.1', chunkAnchor: 'a' },
  { slug: 'dart-3-x', title: 'Dart', version: '3.x', layer: 'Client Layer',
    layerSlug: 'client', layerOrder: 1, techOrder: 2, summary: '', outline: [],
    originalSection: '2.2', chunkAnchor: 'b' },
];

describe('TechSidebar', () => {
  it('renders layer header + tech links', () => {
    render(
      <MemoryRouter>
        <TechSidebar techs={techs} currentSlug="flutter-3-x" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Client Layer')).toBeInTheDocument();
    expect(screen.getByText('Flutter')).toBeInTheDocument();
    expect(screen.getByText('Dart')).toBeInTheDocument();
  });
  it('marks current item with aria-current', () => {
    render(
      <MemoryRouter>
        <TechSidebar techs={techs} currentSlug="dart-3-x" />
      </MemoryRouter>,
    );
    const current = screen.getByText('Dart').closest('a')!;
    expect(current.getAttribute('aria-current')).toBe('page');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/components/tech/__tests__/TechSidebar.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement TechSidebar**

```tsx
// src/components/tech/TechSidebar.tsx
import { Link } from 'react-router';
import { groupTechsByLayer, type TechMeta } from '@/lib/tech-manifest';

interface Props {
  techs: TechMeta[];
  currentSlug?: string;
}

export function TechSidebar({ techs, currentSlug }: Props) {
  const groups = groupTechsByLayer(techs);
  return (
    <nav aria-label="기술 목록" className="space-y-6 text-sm">
      {groups.map((g) => (
        <div key={g.layerSlug}>
          <h3 className="text-xs uppercase tracking-wider text-stone-500 mb-2">{g.layer}</h3>
          <ul className="space-y-1">
            {g.techs.map((t) => {
              const isActive = currentSlug === t.slug;
              return (
                <li key={t.slug}>
                  <Link
                    to={`/tech/${t.slug}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`block rounded px-2 py-1 ${
                      isActive
                        ? 'bg-[#FEF3C7] text-[#B45309] font-medium'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {t.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/tech/__tests__/TechSidebar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/tech/TechSidebar.tsx src/components/tech/__tests__/TechSidebar.test.tsx
git commit -m "feat(tech): TechSidebar layer-grouped nav with current-item highlight"
```

---

### Task 21: `TechMetaPanel` component

**Files:**
- Create: `src/components/tech/TechMetaPanel.tsx`

Meta box: layer link → `/tech#<layerSlug>`, version Badge, h1 title, summary, source link to 18번 with `chunkAnchor`. URL-encode the Korean filename for the source link.

- [ ] **Step 1: Implement**

```tsx
// src/components/tech/TechMetaPanel.tsx
import { Link } from 'react-router';
import { Badge } from '@/components/ds';
import { getLayerColor, type TechMeta } from '@/lib/tech-manifest';

const SOURCE_DOC = '18_기술_스택_정의서';

export function TechMetaPanel({ tech }: { tech: TechMeta }) {
  const sourceHref = `/docs/${encodeURIComponent(SOURCE_DOC)}#${tech.chunkAnchor}`;
  return (
    <header
      className="mb-8 rounded-md border border-stone-200 bg-white border-l-4"
      style={{ borderLeftColor: getLayerColor(tech.layerSlug) }}
    >
      <div className="px-4 py-3 space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <Link to={`/tech#${tech.layerSlug}`} className="text-stone-600 hover:text-[#D97706]">
            {tech.layer}
          </Link>
          {tech.version && <Badge tone="neutral">{tech.version}</Badge>}
        </div>
        <h1 className="display text-3xl text-stone-900">{tech.title}</h1>
        {tech.summary && <p className="text-stone-600">{tech.summary}</p>}
        <Link
          to={sourceHref}
          className="inline-block text-xs text-stone-500 hover:text-[#D97706]"
        >
          출처: 위키 18. 기술 스택 정의서 §{tech.originalSection ?? '—'} →
        </Link>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/tech/TechMetaPanel.tsx
git commit -m "feat(tech): TechMetaPanel header with layer/version/summary + 위키 source link"
```

---

### Task 22: `TechPager` component

**Files:**
- Create: `src/components/tech/TechPager.tsx`
- Create: `src/components/tech/__tests__/TechPager.test.tsx`

Computes prev/next from a flat list. Disabled at boundaries.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/tech/__tests__/TechPager.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TechPager } from '../TechPager';
import type { TechMeta } from '@/lib/tech-manifest';

const list: TechMeta[] = [
  { slug: 'a', title: 'A', version: null, layer: 'L', layerSlug: 'client',
    layerOrder: 1, techOrder: 1, summary: '', outline: [], originalSection: null, chunkAnchor: 'a' },
  { slug: 'b', title: 'B', version: null, layer: 'L', layerSlug: 'client',
    layerOrder: 1, techOrder: 2, summary: '', outline: [], originalSection: null, chunkAnchor: 'b' },
  { slug: 'c', title: 'C', version: null, layer: 'L2', layerSlug: 'gateway',
    layerOrder: 2, techOrder: 1, summary: '', outline: [], originalSection: null, chunkAnchor: 'c' },
];

describe('TechPager', () => {
  it('shows next only on first item', () => {
    render(
      <MemoryRouter>
        <TechPager techs={list} currentSlug="a" />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/← 이전/)).not.toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
  it('shows both prev and next in the middle, crossing layers', () => {
    render(
      <MemoryRouter>
        <TechPager techs={list} currentSlug="b" />
      </MemoryRouter>,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });
  it('shows prev only on last item', () => {
    render(
      <MemoryRouter>
        <TechPager techs={list} currentSlug="c" />
      </MemoryRouter>,
    );
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByText(/다음 →/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/components/tech/__tests__/TechPager.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement TechPager**

```tsx
// src/components/tech/TechPager.tsx
import { Link } from 'react-router';
import { flattenForPager, type TechMeta } from '@/lib/tech-manifest';

interface Props {
  techs: TechMeta[];
  currentSlug: string;
}

export function TechPager({ techs, currentSlug }: Props) {
  const flat = flattenForPager(techs);
  const idx = flat.findIndex((t) => t.slug === currentSlug);
  if (idx === -1) return null;
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;
  return (
    <nav className="mt-12 flex items-stretch justify-between gap-3 border-t border-stone-200 pt-6 text-sm">
      <div className="flex-1">
        {prev && (
          <Link
            to={`/tech/${prev.slug}`}
            className="block rounded-md border border-stone-200 px-3 py-2 hover:border-[#D97706]"
          >
            <span className="block text-xs text-stone-500">← 이전</span>
            <span className="block text-stone-900">{prev.title}</span>
          </Link>
        )}
      </div>
      <div className="flex-1 text-right">
        {next && (
          <Link
            to={`/tech/${next.slug}`}
            className="block rounded-md border border-stone-200 px-3 py-2 hover:border-[#D97706]"
          >
            <span className="block text-xs text-stone-500">다음 →</span>
            <span className="block text-stone-900">{next.title}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/tech/__tests__/TechPager.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/tech/TechPager.tsx src/components/tech/__tests__/TechPager.test.tsx
git commit -m "feat(tech): TechPager prev/next across layer boundaries"
```

---

### Task 23: `routes/tech/Slug.tsx` detail assembly

**Files:**
- Create: `src/routes/tech/Slug.tsx`
- Create: `src/routes/tech/__tests__/Slug.test.tsx`

Reuses `DocsShell` (left sidebar = TechSidebar, right = DocsTOC) + meta panel + DocsArticle + TechPager. Mobile drawer like `routes/docs/Slug.tsx`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/routes/tech/__tests__/Slug.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import TechSlug from '../Slug';
import * as manifestMod from '@/lib/tech-manifest';
import * as loaderMod from '@/lib/docs-loader';
import type { TechManifest } from '@/lib/tech-manifest';

const fakeManifest: TechManifest = {
  overview: { intro: '', diagramHtml: '', principles: [], tableMd: '' },
  techs: [
    { slug: 'flutter-3-x', title: 'Flutter', version: '3.x', layer: 'Client Layer',
      layerSlug: 'client', layerOrder: 1, techOrder: 1, summary: 'UI framework.',
      outline: [{ level: 4, text: 'Install', slug: 'install' }],
      originalSection: '2.1', chunkAnchor: '21-flutter-3x' },
  ],
  extras: { matrixSlug: null, auditSlug: null },
};

function renderAt(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/tech/${slug}`]}>
      <Routes>
        <Route path="/tech/:slug" element={<TechSlug />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TechSlug', () => {
  beforeEach(() => {
    vi.spyOn(manifestMod, 'loadTechManifest').mockResolvedValue(fakeManifest);
    vi.spyOn(loaderMod, 'loadDoc').mockResolvedValue('#### Install\n\nGuide.\n');
  });

  it('renders meta panel + article + sidebar entry', async () => {
    renderAt('flutter-3-x');
    await waitFor(() => screen.getByRole('heading', { level: 1, name: 'Flutter' }));
    expect(screen.getByText('Client Layer')).toBeInTheDocument();
    expect(screen.getByText('UI framework.')).toBeInTheDocument();
    expect(screen.getByText('Install')).toBeInTheDocument(); // from h4 article body
  });

  it('shows fallback for unknown slug', async () => {
    renderAt('zzz');
    await waitFor(() =>
      expect(screen.getByText(/기술을 찾을 수 없습니다/)).toBeInTheDocument(),
    );
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/routes/tech/__tests__/Slug.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement TechSlug**

```tsx
// src/routes/tech/Slug.tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { DocsShell } from '@/components/docs/DocsShell';
import { DocsDrawer } from '@/components/docs/DocsDrawer';
import { DocsArticle } from '@/components/docs/DocsArticle';
import { DocsTOC } from '@/components/docs/DocsTOC';
import { TechSidebar } from '@/components/tech/TechSidebar';
import { TechMetaPanel } from '@/components/tech/TechMetaPanel';
import { TechPager } from '@/components/tech/TechPager';
import { findTechBySlug, loadTechManifest, type TechManifest } from '@/lib/tech-manifest';
import { loadDoc } from '@/lib/docs-loader';

export default function TechSlug() {
  const { slug } = useParams();
  const fullSlug = slug!;
  const [manifest, setManifest] = useState<TechManifest | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    loadTechManifest(import.meta.env.BASE_URL)
      .then(setManifest)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!manifest) return;
    const tech = findTechBySlug(manifest.techs, fullSlug);
    if (!tech) {
      setContent(null);
      return;
    }
    setContent(null);
    loadDoc(`tech/${tech.slug}`).then(setContent).catch((e: Error) => setError(e.message));
  }, [manifest, fullSlug]);

  if (error) {
    return (
      <div>
        <SiteHeader />
        <div className="max-w-3xl mx-auto px-6 py-12 text-[#DC2626]">{error}</div>
      </div>
    );
  }
  if (!manifest) {
    return (
      <div>
        <SiteHeader />
        <p className="max-w-3xl mx-auto px-6 py-12 text-stone-500">불러오는 중…</p>
      </div>
    );
  }

  const tech = findTechBySlug(manifest.techs, fullSlug);
  if (!tech) {
    return (
      <div>
        <SiteHeader />
        <div className="max-w-3xl mx-auto px-6 py-12 space-y-3">
          <h1 className="display text-3xl">기술을 찾을 수 없습니다</h1>
          <p>
            <Link to="/tech" className="text-[#D97706] underline">기술 스택 허브로 →</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SiteHeader />
      <button
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-20 rounded-md bg-stone-50/90 backdrop-blur px-3 py-1 text-sm shadow-sm"
        aria-label="기술 목록 열기"
      >
        ☰ 목록
      </button>
      <DocsShell
        sidebar={<TechSidebar techs={manifest.techs} currentSlug={fullSlug} />}
        toc={tech.outline.length > 0 ? <DocsTOC outline={tech.outline} /> : null}
        drawer={
          <DocsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            <TechSidebar techs={manifest.techs} currentSlug={fullSlug} />
          </DocsDrawer>
        }
      >
        <TechMetaPanel tech={tech} />
        {tech.outline.length > 0 && (
          <details className="lg:hidden mb-6 rounded-md border border-stone-200 bg-white">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium">On this page</summary>
            <div className="px-3 py-2 border-t border-stone-200">
              <DocsTOC outline={tech.outline} />
            </div>
          </details>
        )}
        {!content && <p className="text-stone-500">불러오는 중…</p>}
        {content && <DocsArticle source={content} />}
        <TechPager techs={manifest.techs} currentSlug={fullSlug} />
      </DocsShell>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/routes/tech/__tests__/Slug.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/tech/Slug.tsx src/routes/tech/__tests__/Slug.test.tsx
git commit -m "feat(tech): /tech/:slug detail with sidebar/meta/article/pager via DocsShell"
```

---

## Phase 6 — Wiring

### Task 24: Add routes to `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add imports + routes**

After existing `import DocsSlug …;` add:

```ts
import TechHub from './routes/tech/index';
import TechSlug from './routes/tech/Slug';
```

Inside `<Routes>`, after `<Route path="/architecture" … />` add:

```tsx
<Route path="/tech" element={<TechHub />} />
<Route path="/tech/:slug" element={<TechSlug />} />
```

- [ ] **Step 2: Verify typecheck + tests**

Run: `npm run typecheck && npm run test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(routing): /tech and /tech/:slug routes"
```

---

### Task 25: Add "기술 스택" link to `SiteHeader`

**Files:**
- Modify: `src/components/shared/SiteHeader.tsx`

- [ ] **Step 1: Insert link between 아키텍처 and 문서**

Replace the nav block:

```tsx
<nav className="hidden sm:flex items-center gap-4 text-sm">
  <Link to="/app" className="text-stone-700 hover:text-[#D97706]">데모</Link>
  <Link to="/about" className="text-stone-700 hover:text-[#D97706]">프로젝트</Link>
  <Link to="/architecture" className="text-stone-700 hover:text-[#D97706]">아키텍처</Link>
  <Link to="/tech" className="text-stone-700 hover:text-[#D97706]">기술 스택</Link>
  <Link to="/docs" className="text-stone-700 hover:text-[#D97706]">문서</Link>
  <a
    href="https://github.com/team-project-final/synapse-prototype"
    target="_blank"
    rel="noreferrer"
    className="text-stone-700 hover:text-[#D97706]"
  >
    GitHub
  </a>
</nav>
```

- [ ] **Step 2: Verify typecheck + tests**

Run: `npm run typecheck && npm run test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/SiteHeader.tsx
git commit -m "feat(nav): top-level 기술 스택 link between 아키텍처 and 문서"
```

---

### Task 26: `/docs` index callout pointing to `/tech`

**Files:**
- Modify: `src/routes/docs/index.tsx`

- [ ] **Step 1: Add callout under page header**

Inside the JSX, replace the `<header>` block with:

```tsx
<header className="space-y-2">
  <h1 className="display text-4xl">문서</h1>
  <p className="text-stone-600">Synapse 위키</p>
  <p className="text-sm text-stone-500">
    기술 스택은{' '}
    <Link to="/tech" className="text-[#D97706] underline">별도 페이지</Link>에서 봅니다.
  </p>
</header>
```

- [ ] **Step 2: Verify typecheck + tests**

Run: `npm run typecheck && npm run test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/routes/docs/index.tsx
git commit -m "docs(index): callout linking to /tech (18번 위키 카드 숨김 보완)"
```

---

## Phase 7 — End-to-End

### Task 27: Playwright E2E happy path + regression guard

**Files:**
- Create: `tests/e2e/tech.spec.ts`

Covers: nav click → hub diagram visible → first card → detail visible → pager next → source link → `/docs` doesn't include 18번 card.

This test requires the wiki to be synced (so `tech-manifest.json` exists). To avoid CI flakiness when WIKI_PAT is not set, the spec uses fixtures: it reads `tech-manifest.json` if present and skips otherwise.

- [ ] **Step 1: Implement E2E**

```ts
// tests/e2e/tech.spec.ts
import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const manifestPath = resolve(__dirname, '../../public/docs-md/tech/tech-manifest.json');
const hasTechManifest = existsSync(manifestPath);

test.describe('tech section', () => {
  test.skip(!hasTechManifest, 'tech-manifest.json missing — run `npm run sync-docs` with WIKI_PAT');

  test('nav → hub → detail → pager → source → /docs hides 18번', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: '기술 스택' }).click();
    await expect(page).toHaveURL(/\/tech$/);
    await expect(page.getByRole('heading', { name: '기술 스택', level: 1 })).toBeVisible();

    // Hub: at least one layer section + first tech card
    const firstCard = page.locator('section a[href^="/synapse-prototype/tech/"]').first();
    const firstHref = await firstCard.getAttribute('href');
    await firstCard.click();
    await expect(page).toHaveURL(new RegExp(firstHref!));

    // Detail: meta panel visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Pager next exists for first item
    const next = page.getByText(/다음 →/);
    await expect(next).toBeVisible();

    // Source link points back to /docs/18_…
    const source = page.getByRole('link', { name: /출처: 위키 18\. 기술 스택 정의서/ });
    await expect(source.first()).toHaveAttribute('href', /\/docs\/18_/);

    // Regression: /docs index should NOT have a card linking to 18_…
    await page.goto('/docs');
    const techDocLink = page.locator('a[href*="/docs/18_"]');
    await expect(techDocLink).toHaveCount(0);
  });
});
```

- [ ] **Step 2: Run E2E locally (only if you have a synced wiki)**

Run: `npm run test:e2e -- tech`
Expected: PASS or SKIP (skip is acceptable when manifest absent).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/tech.spec.ts
git commit -m "test(e2e): tech section happy path + 18번 docs hide regression"
```

---

## Phase 8 — Final verification

### Task 28: Full quality gate

**Files:** none (verification only)

- [ ] **Step 1: Run full check chain**

Run: `npm run typecheck && npm run lint && npm run test && npm run build`
Expected: all PASS. `dist/` is produced. `dist/index.html` and `dist/404.html` both exist.

- [ ] **Step 2: Smoke-test build locally if possible**

Run: `npm run preview`
Open: `http://localhost:4173/synapse-prototype/tech`
Verify: hub renders, click into a tech, click pager, click source, click "기술 스택" in header from anywhere.

- [ ] **Step 3: No commit needed** (verification only). If anything fails, fix in a follow-up commit.

---

## Notes / Conventions

- **Korean characters in `git commit` messages**: pass via HEREDOC `'…'` to avoid shell-interpolation issues. Existing repo commits already use Korean (see `git log`).
- **TDD discipline**: every task that adds/modifies logic shows the failing test first, then the minimal implementation. Don't merge tasks; one TDD cycle per commit keeps `git bisect` useful.
- **18번 fixture vs real wiki**: tests in Phase 1 use the small fixture only. Real-wiki integration is verified manually after a sync-docs run with `WIKI_PAT` (or in CI from a PR that runs the deploy workflow).
- **Performance budgets** (informational): each per-tech `.md` ≤ 30 KB; `tech-manifest.json` ≤ 50 KB. Hub loads manifest once + diagram inline (no extra RTT). Detail loads manifest (cached) + chunk md.
- **YAGNI**: no search UI in this plan. The `lib/search.ts` integration is a future extension when usage justifies it.
