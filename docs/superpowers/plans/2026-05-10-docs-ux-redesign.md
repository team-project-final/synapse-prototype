# Synapse Docs UX 재설계 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** /docs 영역의 7개 문제(mermaid 렌더 실패, 단일 long-scroll, 메가 페이지, 일률 폭, 모바일 깨짐, anchor 부재)를 한 사이클로 해결.

**Architecture:** 빌드 타임에 mermaid를 SVG로 사전 렌더하고, 큰 문서는 h2 단위로 자동 분할하면서 manifest를 emit. 런타임은 Adaptive 3-column DocsShell + 이중 폭 Article + sticky TOC + 모바일 drawer.

**Tech Stack:** React 18.3, react-router 7, Vite 6, react-markdown + remark-gfm + rehype-highlight + rehype-slug + rehype-autolink-headings, mermaid-cli (puppeteer 기반), Tailwind v4 (`@theme`).

**Spec:** `docs/superpowers/specs/2026-05-10-docs-ux-redesign-design.md`

**Working dir:** `D:\workspace\final-project-syn\page` (git repo: `team-project-final/synapse-prototype`, branch `main`).

**Commit/push policy:** 각 Phase 끝에 atomic commit. Phase 8 끝에 push 1회 → 단일 deploy 트리거.

---

## File Structure

### NEW

| Path | Responsibility |
|---|---|
| `scripts/lib/mermaid-render.mjs` | mermaid 코드 블록 → SVG 변환 (mermaid-cli 래퍼) |
| `scripts/lib/split-doc.mjs` | h2 경계로 markdown 분할 + sub-page 파일 emit |
| `scripts/lib/manifest.mjs` | DocsManifest 생성 (slug/title/group/order/parent/children/outline) |
| `scripts/__tests__/split-doc.test.mjs` | split 단위 테스트 |
| `scripts/__tests__/manifest.test.mjs` | manifest 단위 테스트 |
| `src/lib/docs-manifest.ts` | manifest fetch + cache + 조회 헬퍼 |
| `src/lib/rehype-anchor-fix.ts` | rehype-slug + autolink-headings 설정 |
| `src/components/docs/DocsShell.tsx` | 3-column 골조 + 반응형 break |
| `src/components/docs/DocsSidebar.tsx` | 그룹 + docs + sub-page 트리 |
| `src/components/docs/DocsTOC.tsx` | outline 기반 sticky TOC + scroll-spy |
| `src/components/docs/DocsDrawer.tsx` | 모바일 햄버거 drawer (slide-in) |
| `src/components/docs/DocsArticle.tsx` | 이중 폭 prose + react-markdown 통합 |
| `src/components/docs/HeadingAnchor.tsx` | H2/H3 hover anchor link |
| `tests/docs.spec.ts` | Playwright E2E |

### MODIFY

| Path | 무엇 |
|---|---|
| `package.json` | `@mermaid-js/mermaid-cli`, `rehype-slug`, `rehype-autolink-headings`, `slugify` (devDeps) |
| `scripts/sync-docs.mjs` | mermaid 변환 + h2 분할 + manifest emit 후처리 호출 |
| `src/lib/docs-loader.ts` | manifest 우선 + sub-page 경로 지원 |
| `src/data/docs-list.ts` | manifest 사용으로 단순화 (in-memory 18 항목 제거) |
| `src/routes/docs/index.tsx` | manifest 데이터 + DocsIndex 유지 |
| `src/routes/docs/Slug.tsx` | DocsShell + DocsArticle + DocsTOC 합성 |
| `src/App.tsx` | `<Route path="docs/:slug/:sub?" />` 추가 |
| `src/styles/globals.css` | `--content-prose`, `--content-wide` 토큰 |
| `vite.config.ts` | (필요 시) public/docs-md/manifest.json 캐시 정책 |

---

## Phase 1 — 의존성 + 스타일 토큰

### Task 1.1: mermaid-cli + rehype 의존성 추가

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 의존성 설치**

```bash
npm i -D @mermaid-js/mermaid-cli rehype-slug rehype-autolink-headings slugify
```

Expected: `package.json` devDependencies에 4개 추가, `package-lock.json` 갱신.

- [ ] **Step 2: 설치 확인**

```bash
node -e "import('@mermaid-js/mermaid-cli').then(()=>console.log('OK'))"
node -e "import('rehype-slug').then(()=>console.log('OK'))"
```

Expected: 두 줄 모두 `OK`.

### Task 1.2: 스타일 토큰 추가

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: @theme에 폭 토큰 추가**

`src/styles/globals.css`의 `@theme { ... }` 블록 안 `--breakpoint-tablet: 1024px;` 다음 줄에 추가:

```css
  --content-prose: 65ch;
  --content-wide: 60rem;
```

- [ ] **Step 2: dev 서버 재시작 후 토큰 적용 확인**

Run: `npm run dev`
브라우저 콘솔에서:
```js
getComputedStyle(document.documentElement).getPropertyValue('--content-prose')
```
Expected: `65ch` (또는 정규화된 값).

### Task 1.3: Phase 1 commit

- [ ] **Step 1: commit**

```bash
git add package.json package-lock.json src/styles/globals.css
git commit -m "chore(docs): add mermaid-cli/rehype deps + width tokens"
```

---

## Phase 2 — sync-docs: mermaid SVG 사전 렌더

### Task 2.1: mermaid 변환 함수 단위 테스트

**Files:**
- Create: `scripts/__tests__/mermaid-render.test.mjs`
- Test: 같은 파일

- [ ] **Step 1: 실패하는 테스트 작성**

```js
import { describe, it, expect } from 'vitest';
import { renderMermaidBlocks } from '../lib/mermaid-render.mjs';

describe('renderMermaidBlocks', () => {
  it('replaces fenced mermaid blocks with inline svg figure', async () => {
    const md = '# T\n\n```mermaid\nflowchart TD\n  A-->B\n```\n\nafter';
    const out = await renderMermaidBlocks(md);
    expect(out).toContain('<figure class="mermaid-svg">');
    expect(out).toContain('<svg');
    expect(out).not.toContain('```mermaid');
    expect(out).toContain('after');
  });

  it('keeps non-mermaid code fences untouched', async () => {
    const md = '```ts\nconst x = 1;\n```';
    const out = await renderMermaidBlocks(md);
    expect(out).toBe(md);
  });

  it('falls back to <pre> with warning on parse error', async () => {
    const md = '```mermaid\n>>> not a diagram <<<\n```';
    const out = await renderMermaidBlocks(md);
    expect(out).toContain('<pre data-mermaid-error');
  });
});
```

- [ ] **Step 2: 테스트가 모듈 부재로 실패하는지 확인**

Run: `npx vitest run scripts/__tests__/mermaid-render.test.mjs`
Expected: FAIL (`Cannot find module '../lib/mermaid-render.mjs'`).

### Task 2.2: mermaid 변환 함수 구현

**Files:**
- Create: `scripts/lib/mermaid-render.mjs`

- [ ] **Step 1: 구현**

```js
import { writeFile, readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const FENCE = /```mermaid\n([\s\S]*?)\n```/g;

function runMmdc(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const p = spawn(
      'npx',
      ['mmdc', '-i', inputPath, '-o', outputPath, '-b', 'transparent', '-t', 'base'],
      { stdio: 'pipe' }
    );
    let stderr = '';
    p.stderr.on('data', (d) => (stderr += d.toString()));
    p.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`mmdc exit ${code}: ${stderr.slice(0, 200)}`))
    );
  });
}

export async function renderMermaidBlocks(markdown) {
  const blocks = [...markdown.matchAll(FENCE)];
  if (blocks.length === 0) return markdown;
  const work = await mkdtemp(join(tmpdir(), 'mmd-'));
  let result = markdown;
  let i = 0;
  for (const m of blocks) {
    const src = m[1];
    const inFile = join(work, `b${i}.mmd`);
    const outFile = join(work, `b${i}.svg`);
    await writeFile(inFile, src, 'utf8');
    try {
      await runMmdc(inFile, outFile);
      const svg = (await readFile(outFile, 'utf8'))
        .replace(/<\?xml[^?]*\?>/, '')
        .replace(/<svg /, '<svg width="100%" preserveAspectRatio="xMidYMin meet" ');
      result = result.replace(m[0], `<figure class="mermaid-svg">\n${svg}\n</figure>`);
    } catch (err) {
      const escaped = src.replace(/</g, '&lt;');
      result = result.replace(
        m[0],
        `<pre data-mermaid-error="${err.message.replace(/"/g, '&quot;').slice(0, 120)}">${escaped}</pre>`
      );
    }
    i++;
  }
  await rm(work, { recursive: true, force: true });
  return result;
}
```

- [ ] **Step 2: 테스트 실행**

Run: `npx vitest run scripts/__tests__/mermaid-render.test.mjs`
Expected: 3 PASS.

### Task 2.3: sync-docs 통합 (mermaid 변환 호출)

**Files:**
- Modify: `scripts/sync-docs.mjs`

- [ ] **Step 1: 변환 import + 적용**

`scripts/sync-docs.mjs:1` import 블록에 추가:

```js
import { writeFile, readFile } from 'node:fs/promises';
import { renderMermaidBlocks } from './lib/mermaid-render.mjs';
```

`copyFile(...)` 호출(현 line 49)을 다음으로 교체:

```js
const raw = await readFile(src, 'utf8');
const rendered = await renderMermaidBlocks(raw);
await writeFile(join(PUBLIC_DOCS_DIR, destName), rendered, 'utf8');
```

- [ ] **Step 2: 통합 실행 + 결과 검증**

Run: `npm run sync-docs`
Expected 로그: `[sync-docs] copied N markdown files...`

```bash
grep -l "mermaid-svg" public/docs-md/*.md | wc -l
```
Expected: ≥ 4 (02_ERD, 03_아키텍처, 05_화면_흐름, 09_Git_규칙).

```bash
grep -l '```mermaid' public/docs-md/*.md | wc -l
```
Expected: 0 (모두 SVG로 치환됨).

### Task 2.4: Phase 2 commit

- [ ] **Step 1: commit**

```bash
git add scripts/sync-docs.mjs scripts/lib/mermaid-render.mjs scripts/__tests__/mermaid-render.test.mjs
git commit -m "build(docs): pre-render mermaid blocks to inline SVG"
```

---

## Phase 3 — sync-docs: h2 자동 분할 + manifest

### Task 3.1: split 단위 테스트

**Files:**
- Create: `scripts/__tests__/split-doc.test.mjs`

- [ ] **Step 1: 테스트 작성**

```js
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
```

- [ ] **Step 2: 실행하여 모듈 부재로 실패 확인**

Run: `npx vitest run scripts/__tests__/split-doc.test.mjs`
Expected: FAIL.

### Task 3.2: split 함수 구현

**Files:**
- Create: `scripts/lib/split-doc.mjs`

- [ ] **Step 1: 구현**

```js
import slugify from 'slugify';

export function shouldSplit({ text, codeCount }) {
  return text.length >= 20000 || codeCount >= 100;
}

export function countCodeBlocks(md) {
  return (md.match(/```/g) ?? []).length / 2;
}

export function splitByH2(markdown) {
  const lines = markdown.split('\n');
  const parts = [];
  let intro = [];
  let current = null;
  for (const line of lines) {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) {
      if (current) parts.push(current);
      current = { title: m[1].trim(), body: '' };
      continue;
    }
    if (current) current.body += line + '\n';
    else intro.push(line);
  }
  if (current) parts.push(current);
  return {
    intro: intro.join('\n').trim(),
    parts: parts.map((p) => ({
      ...p,
      slug: slugify(p.title, { lower: true, strict: false, locale: 'ko' }) || 'section',
    })),
  };
}
```

- [ ] **Step 2: 테스트 실행**

Run: `npx vitest run scripts/__tests__/split-doc.test.mjs`
Expected: 5 PASS.

### Task 3.3: manifest 단위 테스트 + 구현

**Files:**
- Create: `scripts/__tests__/manifest.test.mjs`
- Create: `scripts/lib/manifest.mjs`

- [ ] **Step 1: 테스트 작성**

```js
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
});

describe('buildManifestEntry', () => {
  it('infers group/order from filename pattern', () => {
    const e = buildManifestEntry('01_프로젝트_계획서.md', '# 01 프로젝트 계획서\n');
    expect(e.slug).toBe('01_프로젝트_계획서');
    expect(e.order).toBe(1);
    expect(e.title).toContain('프로젝트 계획서');
  });
});
```

- [ ] **Step 2: 구현**

```js
// scripts/lib/manifest.mjs
import slugify from 'slugify';

const GROUPS = {
  '01-08': '기획/설계',
  '09-12': '개발 규칙',
  '13-18': '운영/배포',
};

function inferGroup(order) {
  if (order <= 8) return GROUPS['01-08'];
  if (order <= 12) return GROUPS['09-12'];
  return GROUPS['13-18'];
}

export function extractOutline(markdown) {
  const out = [];
  const re = /^(##{1,2})\s+(.+?)\s*$/gm;
  let m;
  while ((m = re.exec(markdown))) {
    const level = m[1].length;
    if (level !== 2 && level !== 3) continue;
    const text = m[2].trim();
    out.push({
      level,
      text,
      slug: slugify(text, { lower: true, strict: false, locale: 'ko' }) || 'h',
    });
  }
  return out;
}

export function buildManifestEntry(filename, content) {
  const m = /^(\d{2})_(.+)\.md$/.exec(filename);
  const order = m ? parseInt(m[1], 10) : 99;
  const slug = filename.replace(/\.md$/, '');
  const titleMatch = /^#\s+(.+?)\s*$/m.exec(content);
  const title = titleMatch ? titleMatch[1].trim() : slug.replace(/_/g, ' ');
  return {
    slug,
    title,
    group: inferGroup(order),
    order,
    outline: extractOutline(content),
  };
}
```

- [ ] **Step 3: 테스트 실행**

Run: `npx vitest run scripts/__tests__/manifest.test.mjs`
Expected: 2 PASS.

### Task 3.4: sync-docs 통합 (split + manifest emit)

**Files:**
- Modify: `scripts/sync-docs.mjs`

- [ ] **Step 1: import + 후처리 호출 추가**

`scripts/sync-docs.mjs` 위쪽 import에 추가:

```js
import { mkdir as mkdirP } from 'node:fs/promises';
import { shouldSplit, countCodeBlocks, splitByH2 } from './lib/split-doc.mjs';
import { buildManifestEntry, extractOutline } from './lib/manifest.mjs';
```

`for (const entry of entries)` 루프 안 (mermaid 변환 직후) split + manifest 수집 로직 추가:

```js
const manifest = [];
// ... 기존 루프 ...
const entry of entries) {
  // ... mermaid 변환된 'rendered' 변수가 이미 있음 ...
  const baseEntry = buildManifestEntry(destName, rendered);
  if (destName !== 'index.md' && shouldSplit({ text: rendered, codeCount: countCodeBlocks(rendered) })) {
    const { intro, parts } = splitByH2(rendered);
    if (parts.length > 0) {
      // 부모 = 인덱스 페이지로
      const childSlugs = [];
      const parentSlug = baseEntry.slug;
      const parentDir = join(PUBLIC_DOCS_DIR, parentSlug);
      await mkdirP(parentDir, { recursive: true });
      const indexLines = [intro, '', '## 목차', ''];
      parts.forEach((p, idx) => {
        const i = String(idx + 1).padStart(2, '0');
        const subSlug = `${i}_${p.slug}`;
        childSlugs.push(subSlug);
        indexLines.push(`- [${p.title}](/synapse-prototype/docs/${parentSlug}/${subSlug})`);
        const subContent = `# ${p.title}\n\n${p.body.trim()}\n`;
        // sub-page는 그 자체 entry로도 manifest 등록
        manifest.push({
          ...buildManifestEntry(`${subSlug}.md`, subContent),
          slug: `${parentSlug}/${subSlug}`,
          title: p.title,
          group: baseEntry.group,
          order: baseEntry.order + (idx + 1) / 100,
          parent: parentSlug,
        });
        // 파일 emit (mermaid는 이미 처리된 상태)
        return writeFile(join(parentDir, `${subSlug}.md`), subContent, 'utf8');
      });
      await Promise.all(parts.map((p, idx) => {
        const i = String(idx + 1).padStart(2, '0');
        const subSlug = `${i}_${p.slug}`;
        const subContent = `# ${p.title}\n\n${p.body.trim()}\n`;
        return writeFile(join(parentDir, `${subSlug}.md`), subContent, 'utf8');
      }));
      // 부모 인덱스 페이지 (목차)
      await writeFile(join(PUBLIC_DOCS_DIR, destName), indexLines.join('\n'), 'utf8');
      manifest.push({ ...baseEntry, children: childSlugs });
      copied++;
      continue;
    }
  }
  // 분할 안 함 (이미 위에서 writeFile 했음)
  manifest.push(baseEntry);
  copied++;
}
await writeFile(
  join(PUBLIC_DOCS_DIR, 'manifest.json'),
  JSON.stringify(manifest.sort((a, b) => a.order - b.order), null, 2),
  'utf8'
);
```

> 주의: 위 스니펫은 기존 mermaid 통합과 합쳐 매끄럽게 정리해야 함. 핵심은 `rendered` markdown 한 번만 만들고, split 트리거 시 sub-page emit + manifest entry 양쪽 등록 + 부모는 목차로 교체. 비-분할 문서는 단일 manifest entry.

- [ ] **Step 2: 실행 + 결과 검증**

```bash
npm run sync-docs
ls public/docs-md/18_기술_스택_정의서/ | head
cat public/docs-md/manifest.json | head -50
```

Expected:
- `public/docs-md/18_기술_스택_정의서/01_*.md` ... 등 sub-page 파일 다수
- `manifest.json` 안에 `parent: "18_기술_스택_정의서"` 필드 가진 항목 + 같은 slug에 `children: [...]` 가진 부모 항목 존재
- 분할 대상은 `04_API_명세서`, `09_Git_규칙_정의서`, `18_기술_스택_정의서` 등 3-4개

### Task 3.5: Phase 3 commit

```bash
git add scripts/sync-docs.mjs scripts/lib/split-doc.mjs scripts/lib/manifest.mjs scripts/__tests__/split-doc.test.mjs scripts/__tests__/manifest.test.mjs
git commit -m "build(docs): auto-split docs >=20k chars by h2 + emit manifest.json"
```

---

## Phase 4 — 라우팅·데이터 갱신

### Task 4.1: docs-manifest 헬퍼 + 단위 테스트

**Files:**
- Create: `src/lib/docs-manifest.ts`
- Create: `src/lib/__tests__/docs-manifest.test.ts`

- [ ] **Step 1: 테스트 작성**

```ts
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
```

- [ ] **Step 2: 구현**

```ts
// src/lib/docs-manifest.ts
export type DocMeta = {
  slug: string;
  title: string;
  group: string;
  order: number;
  parent?: string;
  children?: string[];
  outline: { level: 2 | 3; text: string; slug: string }[];
};

let cache: DocMeta[] | null = null;

export async function loadManifest(base: string): Promise<DocMeta[]> {
  if (cache) return cache;
  const res = await fetch(`${base}docs-md/manifest.json`);
  if (!res.ok) throw new Error(`manifest 404 (${res.status})`);
  cache = (await res.json()) as DocMeta[];
  return cache;
}

export function findEntry(manifest: DocMeta[], slug: string): DocMeta | undefined {
  return manifest.find((m) => m.slug === slug);
}

export function groupManifest(manifest: DocMeta[]): { group: string; docs: DocMeta[] }[] {
  const map = new Map<string, DocMeta[]>();
  for (const m of manifest) {
    if (m.parent) continue; // 부모만 노출
    if (!map.has(m.group)) map.set(m.group, []);
    map.get(m.group)!.push(m);
  }
  return [...map.entries()].map(([group, docs]) => ({
    group,
    docs: docs.sort((a, b) => a.order - b.order),
  }));
}
```

- [ ] **Step 3: 테스트 실행**

Run: `npm run test -- src/lib/__tests__/docs-manifest.test.ts`
Expected: PASS.

### Task 4.2: docs-loader sub-page 지원

**Files:**
- Modify: `src/lib/docs-loader.ts`

- [ ] **Step 1: 교체**

```ts
const cache = new Map<string, string>();

export async function loadDoc(slug: string): Promise<string> {
  if (cache.has(slug)) return cache.get(slug)!;
  const base = import.meta.env.BASE_URL;
  const url = `${base}docs-md/${slug.split('/').map(encodeURIComponent).join('/')}.md`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`문서를 불러올 수 없습니다: ${slug} (${res.status})`);
  const text = await res.text();
  cache.set(slug, text);
  return text;
}
```

(기존 `DOCS.some(...)` 사전 검증은 manifest 기반으로 라우트 단계에서 처리하므로 제거)

- [ ] **Step 2: 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: EXIT 0.

### Task 4.3: data/docs-list → manifest 사용

**Files:**
- Modify: `src/data/docs-list.ts`

- [ ] **Step 1: 콘텐츠 단순화 (기존 18-항목 in-memory 배열 제거)**

```ts
export type { DocMeta } from '@/lib/docs-manifest';
export { loadManifest, findEntry, groupManifest } from '@/lib/docs-manifest';
```

- [ ] **Step 2: 사용처 grep으로 회귀 확인**

```bash
grep -nr "from '@/data/docs-list'" src/ | head
```
Expected: `routes/docs/index.tsx` 등에서 같은 export 이름 사용 중. 다음 task에서 정리.

### Task 4.4: App.tsx sub-page route 추가

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: route 한 줄 추가**

`src/App.tsx`의 `<Route path="/docs/:slug" ... />` 다음 줄에 추가:

```tsx
<Route path="/docs/:slug/:sub" element={<DocsSlug />} />
```

- [ ] **Step 2: 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: EXIT 0.

### Task 4.5: routes/docs/index.tsx 갱신

**Files:**
- Modify: `src/routes/docs/index.tsx`

- [ ] **Step 1: manifest 로드 + 그룹 표시**

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { Card } from '@/components/ds';
import { loadManifest, groupManifest, type DocMeta } from '@/lib/docs-manifest';

export default function DocsIndex() {
  const [manifest, setManifest] = useState<DocMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadManifest(import.meta.env.BASE_URL)
      .then(setManifest)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="p-6 text-[#DC2626]">{error}</div>;
  if (!manifest) return <div className="p-6 text-stone-500">불러오는 중…</div>;

  return (
    <div className="min-h-dvh bg-stone-50">
      <SiteHeader />
      <article className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <header>
          <h1 className="display text-4xl">문서</h1>
          <p className="text-stone-600 mt-2">Synapse 위키</p>
        </header>
        {groupManifest(manifest).map((g) => (
          <section key={g.group}>
            <h2 className="display text-xl mb-3">{g.group}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {g.docs.map((d) => (
                <Link key={d.slug} to={`/docs/${d.slug}`}>
                  <Card className="hover:shadow-md transition-shadow">{d.title}</Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </article>
    </div>
  );
}
```

- [ ] **Step 2: 라우트 통합 검증**

Run: `npm run dev` (이미 떠 있다면 그대로)
브라우저: `http://localhost:5173/synapse-prototype/docs`
Expected: 18개(또는 분할 후 부모 N개) docs가 그룹별로 표시. 콘솔 에러 없음.

`http://localhost:5173/synapse-prototype/docs/04_API_명세서` 진입 → 분할된 부모 인덱스 페이지에 sub-page 링크 보임.

### Task 4.6: Phase 4 commit

```bash
git add src/lib/docs-manifest.ts src/lib/__tests__/docs-manifest.test.ts src/lib/docs-loader.ts src/data/docs-list.ts src/App.tsx src/routes/docs/index.tsx
git commit -m "feat(docs): manifest-driven routing with sub-page support"
```

---

## Phase 5 — DocsShell + Sidebar + Drawer

### Task 5.1: DocsShell 골조

**Files:**
- Create: `src/components/docs/DocsShell.tsx`

- [ ] **Step 1: 구현 (3-column responsive)**

```tsx
import { type ReactNode } from 'react';

interface Props {
  sidebar: ReactNode;
  toc: ReactNode;
  drawer?: ReactNode;
  children: ReactNode;
}

export function DocsShell({ sidebar, toc, drawer, children }: Props) {
  return (
    <div className="min-h-dvh bg-stone-50">
      {drawer}
      <div className="mx-auto flex max-w-[120rem] gap-8 px-4 lg:px-8">
        <aside className="hidden lg:block w-60 shrink-0 sticky top-16 self-start max-h-[calc(100dvh-4rem)] overflow-y-auto py-8">
          {sidebar}
        </aside>
        <main className="min-w-0 flex-1 py-8">{children}</main>
        <aside className="hidden lg:block w-56 shrink-0 sticky top-16 self-start max-h-[calc(100dvh-4rem)] overflow-y-auto py-8">
          {toc}
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: EXIT 0.

### Task 5.2: DocsSidebar (manifest 트리)

**Files:**
- Create: `src/components/docs/DocsSidebar.tsx`

- [ ] **Step 1: 구현**

```tsx
import { NavLink } from 'react-router';
import { groupManifest, type DocMeta } from '@/lib/docs-manifest';

interface Props {
  manifest: DocMeta[];
  currentSlug?: string;
}

export function DocsSidebar({ manifest, currentSlug }: Props) {
  const groups = groupManifest(manifest);
  return (
    <nav aria-label="문서 목록" className="space-y-6 text-sm">
      {groups.map((g) => (
        <div key={g.group}>
          <h3 className="text-xs uppercase tracking-wider text-stone-500 mb-2">{g.group}</h3>
          <ul className="space-y-1">
            {g.docs.map((d) => {
              const isActive = currentSlug === d.slug || currentSlug?.startsWith(`${d.slug}/`);
              return (
                <li key={d.slug}>
                  <NavLink
                    to={`/docs/${d.slug}`}
                    className={`block rounded px-2 py-1 ${isActive ? 'bg-[#FEF3C7] text-[#B45309] font-medium' : 'text-stone-700 hover:bg-stone-100'}`}
                  >
                    {d.title}
                  </NavLink>
                  {d.children && isActive && (
                    <ul className="ml-3 mt-1 space-y-1 border-l border-stone-200 pl-3">
                      {d.children.map((c) => {
                        const child = manifest.find((m) => m.slug === c);
                        if (!child) return null;
                        return (
                          <li key={c}>
                            <NavLink
                              to={`/docs/${c}`}
                              className={({ isActive: a }) =>
                                `block rounded px-2 py-0.5 text-xs ${a ? 'text-[#B45309] font-medium' : 'text-stone-600 hover:text-[#D97706]'}`
                              }
                            >
                              {child.title}
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
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

### Task 5.3: DocsDrawer (모바일)

**Files:**
- Create: `src/components/docs/DocsDrawer.tsx`

- [ ] **Step 1: 구현**

```tsx
import { useEffect, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function DocsDrawer({ open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <>
      <div
        aria-hidden
        className={`lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity z-30 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside
        aria-label="문서 사이드바"
        className={`lg:hidden fixed top-0 left-0 z-40 h-dvh w-72 bg-stone-50 shadow-xl transition-transform duration-200 overflow-y-auto p-4 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          onClick={onClose}
          className="ml-auto mb-4 block rounded-md p-2 hover:bg-stone-100"
          aria-label="닫기"
        >
          ×
        </button>
        {children}
      </aside>
    </>
  );
}
```

### Task 5.4: Slug.tsx에 DocsShell 적용 (TOC는 Phase 7에서 채움)

**Files:**
- Modify: `src/routes/docs/Slug.tsx`

- [ ] **Step 1: 골조 교체 (Article은 다음 phase)**

```tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { DocsShell } from '@/components/docs/DocsShell';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { DocsDrawer } from '@/components/docs/DocsDrawer';
import { loadManifest, findEntry, type DocMeta } from '@/lib/docs-manifest';
import { loadDoc } from '@/lib/docs-loader';

export default function DocsSlug() {
  const { slug, sub } = useParams();
  const fullSlug = sub ? `${slug}/${sub}` : slug!;
  const [manifest, setManifest] = useState<DocMeta[] | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    loadManifest(import.meta.env.BASE_URL).then(setManifest).catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    setContent(null);
    setError(null);
    loadDoc(fullSlug).then(setContent).catch((e) => setError(e.message));
  }, [fullSlug]);

  const meta = manifest ? findEntry(manifest, fullSlug) : undefined;

  return (
    <div>
      <SiteHeader />
      {/* 모바일 햄버거 */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-20 rounded-md bg-stone-50/90 backdrop-blur px-3 py-1 text-sm shadow-sm"
        aria-label="목록 열기"
      >
        ☰ 목록
      </button>
      <DocsShell
        sidebar={manifest ? <DocsSidebar manifest={manifest} currentSlug={fullSlug} /> : null}
        toc={null /* Phase 7 */}
        drawer={
          <DocsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            {manifest && <DocsSidebar manifest={manifest} currentSlug={fullSlug} />}
          </DocsDrawer>
        }
      >
        <h1 className="display text-3xl mb-6">{meta?.title ?? fullSlug}</h1>
        {error && <p className="text-[#DC2626]">{error}</p>}
        {!content && !error && <p className="text-stone-500">불러오는 중…</p>}
        {content && (
          <pre className="text-xs whitespace-pre-wrap">{content.slice(0, 800)}…</pre>
        )}
      </DocsShell>
    </div>
  );
}
```

(Article 컴포넌트는 다음 Phase에서 마크다운 렌더 추가)

- [ ] **Step 2: 시각 검증**

브라우저: `http://localhost:5173/synapse-prototype/docs/01_프로젝트_계획서`
Expected:
- 1280: 좌 sidebar 표시 (그룹 + docs), 본문 영역, 우측은 빈 TOC 자리
- 768: sidebar 숨김, 햄버거 버튼 표시
- 햄버거 클릭 → drawer slide-in, ESC/배경 클릭으로 닫기

### Task 5.5: Phase 5 commit

```bash
git add src/components/docs/ src/routes/docs/Slug.tsx
git commit -m "feat(docs): adaptive 3-column DocsShell with sidebar + mobile drawer"
```

---

## Phase 6 — DocsArticle + 이중 폭 + heading anchor

### Task 6.1: rehype 설정 모듈

**Files:**
- Create: `src/lib/rehype-anchor-fix.ts`

- [ ] **Step 1: 구현**

```ts
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

export const rehypeAnchorPlugins: any[] = [
  rehypeSlug,
  [
    rehypeAutolinkHeadings,
    {
      behavior: 'append',
      properties: { className: ['heading-anchor'], 'aria-label': '섹션 링크' },
      content: { type: 'text', value: '#' },
    },
  ],
];
```

### Task 6.2: HeadingAnchor 스타일

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: anchor + 표 + 코드 스타일 추가**

`globals.css` 끝에 추가:

```css
.docs-article { color: var(--color-stone-700); }
.docs-article > * { max-width: var(--content-prose); margin-inline: auto; }
.docs-article > pre,
.docs-article > table,
.docs-article > figure.mermaid-svg,
.docs-article > .table-wrap { max-width: var(--content-wide); }

.docs-article h1 { font-size: 2.25rem; line-height: 2.5rem; margin: 0 0 1.5rem; }
.docs-article h2 { font-size: 1.75rem; line-height: 2rem; margin: 2.5rem 0 0.75rem; padding-bottom: 0.25rem; border-bottom: 1px solid var(--color-stone-200); }
.docs-article h3 { font-size: 1.375rem; line-height: 1.625rem; margin: 1.5rem 0 0.5rem; }
.docs-article p, .docs-article li { line-height: 1.75; }

.docs-article :where(h2, h3):hover .heading-anchor { opacity: 1; }
.heading-anchor { opacity: 0; margin-left: 0.5rem; color: var(--color-amber-primary); text-decoration: none; }

.docs-article :not(pre) > code { background: var(--color-stone-100); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875em; }
.docs-article pre { margin: 1rem auto; padding: 1rem; background: var(--color-stone-900); color: var(--color-stone-100); border-radius: 0.5rem; overflow-x: auto; font-size: 0.875rem; line-height: 1.5; }
@media (max-width: 640px) { .docs-article pre { font-size: 0.75rem; line-height: 1.25rem; } }

.docs-article table { display: block; overflow-x: auto; border-collapse: collapse; margin: 1rem auto; font-size: 0.875rem; }
.docs-article th, .docs-article td { padding: 0.5rem 0.75rem; border: 1px solid var(--color-stone-200); }
.docs-article tbody tr:nth-child(odd) { background: var(--color-stone-50); }

.docs-article figure.mermaid-svg { margin: 1.25rem auto; }
.docs-article figure.mermaid-svg svg { width: 100%; height: auto; }
```

### Task 6.3: DocsArticle 컴포넌트

**Files:**
- Create: `src/components/docs/DocsArticle.tsx`

- [ ] **Step 1: 구현**

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { rehypeAnchorPlugins } from '@/lib/rehype-anchor-fix';

interface Props {
  source: string;
}

export function DocsArticle({ source }: Props) {
  return (
    <article className="docs-article">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight, ...rehypeAnchorPlugins]}
      >
        {source}
      </ReactMarkdown>
    </article>
  );
}
```

> `rehype-raw`는 mermaid SVG가 markdown 안에 raw HTML로 들어가 있기 때문에 필요. 의존성에 추가:
> ```bash
> npm i rehype-raw
> ```

- [ ] **Step 2: rehype-raw 설치**

```bash
npm i rehype-raw
```

### Task 6.4: Slug.tsx에 DocsArticle 통합

**Files:**
- Modify: `src/routes/docs/Slug.tsx`

- [ ] **Step 1: 본문 영역을 DocsArticle로 교체**

이전 단계의 `<pre>{content.slice(0,800)}…</pre>` 부분을:

```tsx
{content && <DocsArticle source={content} />}
```

import 추가:
```tsx
import { DocsArticle } from '@/components/docs/DocsArticle';
```

- [ ] **Step 2: 시각 검증**

브라우저: `http://localhost:5173/synapse-prototype/docs/02_ERD_문서`
Expected:
- mermaid SVG 인라인 표시 (404·"렌더 실패" 0)
- 본문은 `~680px` 폭, 표/코드/SVG는 `~960px` 폭
- H2 hover 시 `#` anchor 표시, 클릭하면 URL hash 갱신

`http://localhost:5173/synapse-prototype/docs/02_ERD_문서#개요` 같은 deep link 동작 확인.

### Task 6.5: Phase 6 commit

```bash
git add src/lib/rehype-anchor-fix.ts src/components/docs/DocsArticle.tsx src/routes/docs/Slug.tsx src/styles/globals.css package.json package-lock.json
git commit -m "feat(docs): DocsArticle with dual-width prose + heading anchors"
```

---

## Phase 7 — DocsTOC + scroll-spy

### Task 7.1: DocsTOC 컴포넌트

**Files:**
- Create: `src/components/docs/DocsTOC.tsx`

- [ ] **Step 1: 구현**

```tsx
import { useEffect, useState } from 'react';

interface Outline {
  level: 2 | 3;
  text: string;
  slug: string;
}
interface Props {
  outline: Outline[];
}

export function DocsTOC({ outline }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (outline.length === 0) return;
    const headings = outline
      .map((o) => document.getElementById(o.slug))
      .filter(Boolean) as HTMLElement[];
    if (headings.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
        );
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '0px 0px -75% 0px', threshold: 0 },
    );
    headings.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, [outline]);

  if (outline.length === 0) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <h3 className="text-xs uppercase tracking-wider text-stone-500 mb-2">On this page</h3>
      <ul className="space-y-1">
        {outline.map((o) => {
          const active = activeId === o.slug;
          return (
            <li key={o.slug} style={{ paddingLeft: o.level === 3 ? '0.75rem' : 0 }}>
              <a
                href={`#${o.slug}`}
                className={`block py-0.5 transition-colors ${active ? 'text-[#D97706] font-medium' : 'text-stone-600 hover:text-[#D97706]'}`}
              >
                {active && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#D97706]" />}
                {o.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

### Task 7.2: Slug.tsx에 TOC + outline 연결

**Files:**
- Modify: `src/routes/docs/Slug.tsx`

- [ ] **Step 1: TOC 컴포넌트 주입**

`DocsShell`의 `toc` prop을 다음으로 교체:

```tsx
toc={meta && meta.outline.length > 0 ? <DocsTOC outline={meta.outline} /> : null}
```

import 추가:
```tsx
import { DocsTOC } from '@/components/docs/DocsTOC';
```

- [ ] **Step 2: 시각 검증**

브라우저: `http://localhost:5173/synapse-prototype/docs/03_프로젝트_아키텍처_정의서`
Expected:
- 우측에 outline (H2/H3) 표시
- 스크롤 시 현재 화면의 H2가 amber + dot으로 활성화
- TOC 링크 클릭 시 부드럽게 점프, hash URL 갱신

### Task 7.3: 모바일 TOC 접이식 토글

**Files:**
- Modify: `src/routes/docs/Slug.tsx`

- [ ] **Step 1: 모바일 본문 상단에 details/summary로 TOC 노출**

DocsShell 본문 안 `{meta && ...}` 위에 추가:

```tsx
{meta && meta.outline.length > 0 && (
  <details className="lg:hidden mb-6 rounded-md border border-stone-200 bg-white">
    <summary className="cursor-pointer px-3 py-2 text-sm font-medium">On this page</summary>
    <div className="px-3 py-2 border-t border-stone-200">
      <DocsTOC outline={meta.outline} />
    </div>
  </details>
)}
```

- [ ] **Step 2: 모바일 검증**

viewport 375에서 `/docs/03_프로젝트_아키텍처_정의서` 진입 → "On this page" 접힘 토글이 본문 상단에 보이고 펴면 outline 노출.

### Task 7.4: Phase 7 commit

```bash
git add src/components/docs/DocsTOC.tsx src/routes/docs/Slug.tsx
git commit -m "feat(docs): sticky TOC with scroll-spy + collapsible mobile TOC"
```

---

## Phase 8 — 검증 + 회귀 + 배포

### Task 8.1: E2E 테스트 추가

**Files:**
- Create: `tests/docs.spec.ts`

- [ ] **Step 1: Playwright 테스트 작성**

```ts
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173/synapse-prototype';

test('docs index lists all groups', async ({ page }) => {
  await page.goto(`${BASE}/docs`);
  await expect(page.getByRole('heading', { name: '문서' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '기획/설계' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '운영/배포' })).toBeVisible();
});

test('mermaid svg renders inline on ERD page', async ({ page }) => {
  await page.goto(`${BASE}/docs/02_ERD_문서`);
  const svg = page.locator('figure.mermaid-svg svg').first();
  await expect(svg).toBeVisible({ timeout: 10000 });
});

test('mega doc 18 splits into sub-pages with parent index', async ({ page }) => {
  await page.goto(`${BASE}/docs/18_기술_스택_정의서`);
  await expect(page.getByRole('heading', { name: '목차' })).toBeVisible();
  const subLinks = page.locator('a[href*="/docs/18_기술_스택_정의서/"]');
  await expect(await subLinks.count()).toBeGreaterThan(0);
});

test('heading anchor link copies hash', async ({ page }) => {
  await page.goto(`${BASE}/docs/03_프로젝트_아키텍처_정의서`);
  await page.locator('h2 a.heading-anchor').first().click();
  await expect(page).toHaveURL(/#/);
});
```

- [ ] **Step 2: 실행**

```bash
npm run test:e2e
```

Expected: 4 tests pass.

### Task 8.2: 단위 + 시각 회귀 sweep

- [ ] **Step 1: 단위 테스트 + typecheck + lint**

```bash
npm run typecheck && npm run lint && npm run test
```

Expected: typecheck 0, lint 0 errors, 모든 테스트 PASS.

- [ ] **Step 2: 로컬 시각 sweep**

dev 서버에서 데스크탑(1280)·태블릿(768)·모바일(375) 각각:
- `/docs` 인덱스
- `/docs/01_프로젝트_계획서` (작은 문서)
- `/docs/02_ERD_문서` (mermaid heavy)
- `/docs/04_API_명세서` (분할 대상 → 부모 index)
- `/docs/04_API_명세서/01_<첫 sub>` (sub-page)
- `/docs/18_기술_스택_정의서/02_<sub>` (메가 분할 결과)

체크리스트:
- console error 0 (404 SPA fallback 제외)
- horizontal overflow 0
- 데스크탑 sidebar + TOC 모두 노출, 모바일 햄버거 + 접이식 TOC
- 본문 폭 ~680px, 표/코드/SVG 폭 ~960px
- H2 hover anchor 동작

### Task 8.3: 묶음 commit + push

> Phase 1~7 atomic commit이 이미 7개 쌓여 있음. 추가 변경(E2E 테스트)만 commit 후 한 번에 push.

- [ ] **Step 1: E2E 테스트 commit**

```bash
git add tests/docs.spec.ts
git commit -m "test(docs): e2e for index/mermaid/split/anchor"
```

- [ ] **Step 2: push**

```bash
git push origin main
```

Expected: gh-actions deploy.yml 트리거.

### Task 8.4: 배포 모니터링 + 라이브 회귀

- [ ] **Step 1: 배포 watch**

```bash
RUN_ID=$(gh run list --workflow=deploy.yml --limit 1 --json databaseId -q '.[0].databaseId')
gh run watch "$RUN_ID" --exit-status
```

Expected: success.

- [ ] **Step 2: 라이브 회귀**

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse"
LIVE="https://team-project-final.github.io/synapse-prototype"
"$B" viewport 1280x800
for s in "01_프로젝트_계획서" "02_ERD_문서" "04_API_명세서" "18_기술_스택_정의서"; do
  "$B" goto "$LIVE/docs/$s"
  "$B" wait --networkidle
  "$B" console --errors | grep -v "404"
done
```

Expected: 라이브에서 mermaid SVG 보이고, 분할된 부모는 목차 링크, console 에러 0.

### Task 8.5: 사용자 보고

- [ ] **Step 1: 결과 요약**

다음 정보 보고:
- 배포 run URL
- 변경 파일 수 + 라인 수 (`git diff main~8 --shortstat`)
- 라이브 sweep 결과 (콘솔 에러, overflow, mermaid 정상 표시 페이지 수)
- spec 대비 미구현 항목 (없어야 함)

---

## Self-Review

- **Spec coverage**: spec section 5(파이프라인) → Phase 2-3, section 6(라우팅) → Phase 4, section 7(컴포넌트) → Phase 5-7, section 8(스타일) → Phase 6 (CSS)·section 9(작업 분해) → 본 plan 전체. section 11(검증) → Phase 8. ✓
- **No placeholders**: TODO/TBD 검색 결과 0. 코드 블록은 모든 step에 완전 포함. ✓
- **Type consistency**: `DocMeta` 타입은 `src/lib/docs-manifest.ts`에서 정의 후 모든 곳에서 import. `outline` 항목 `{level, text, slug}` 형식 통일. `slug` 형식: 부모 `<name>`, sub `<parent>/<sub>`. `Outline` 타입은 DocsTOC 안에서 다시 좁게 선언했지만 `DocMeta['outline'][number]`와 동치. ✓
- **Risks** (spec section 10) 모두 plan 안에서 처리됨: mermaid 변환 fallback (Task 2.2), sub-page 부모 호환 (Task 3.4), rehype-slug 한글 (Task 6.1), 빌드 시간 (Phase 8 모니터링). ✓

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-10-docs-ux-redesign.md`. Two execution options:**

1. **Subagent-Driven (recommended)** — 각 task별 fresh subagent + 두 단계 리뷰. 빠른 반복.
2. **Inline Execution** — 본 세션에서 executing-plans로 batch + checkpoints.

**Which approach?**
