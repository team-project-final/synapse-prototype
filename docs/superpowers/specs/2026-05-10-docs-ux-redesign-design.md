# Synapse Docs UX 재설계 — 설계 문서

- **작성일**: 2026-05-10
- **상태**: 설계 승인됨, 구현 계획 대기
- **범위**: `/docs` 영역 전반 (라우팅·정보 구조·빌드 파이프라인·렌더링·스타일)
- **연관**: `2026-05-09-synapse-prototype-design.md` (전체 프로토타입 설계)

---

## 1. 배경 & 문제 정의

`/docs` 영역에서 다음 7개 문제가 라이브에서 확인됨.

| # | 영역 | 증상 | 추정 원인 | 임팩트 |
|---|---|---|---|---|
| 1 | mermaid lazy chunk | `assets/erDiagram-*.js` 등 404 → "렌더 실패" | mermaid v11 dynamic import / vite chunk 경로 | CRITICAL |
| 2 | mermaid syntax | "Syntax error in text" (v11.14.0) | strict 한글 라벨/공백 처리 | HIGH |
| 3 | 정보 구조 | TOC·사이드바·anchor 부재. 단일 long-scroll | UX 누락 | HIGH |
| 4 | 메가 페이지 | `18_기술_스택_정의서` 17 MB 단일 페이지 | 분할/접기 없음 | HIGH |
| 5 | typography | prose 미세조정 부족 (행간·헤딩 마진·코드 무게) | tailwind 기본 그대로 | MEDIUM |
| 6 | 모바일 | 표·코드 가로 스크롤 강제, 본문 폭 일률 | breakpoint별 max-w 미분리 | MEDIUM |
| 7 | 검색·딥링크 | 헤딩 anchor 없음, 한글 slug URL 인코딩 깨짐 | 후처리 누락 | LOW |

사용자 표현: "전체적으로 가독성이 최악". 한 사이클(이 spec)에서 ①~⑦ 모두 해결.

## 2. 목표 & Non-goal

**목표**

1. mermaid 렌더 실패 0 (모든 docs 페이지 정상 표시).
2. 1280 데스크탑·768 태블릿·375 모바일 세 viewport에서 정보 구조와 가독성 모두 만족.
3. 17 MB급 메가 페이지가 빠르게 첫 페인트 + 위치 파악 + 점프 가능.
4. 문서 작성자(`documents.wiki` 편집자)의 워크플로 변경 0.

**Non-goal**

- `/docs` 외 다른 라우트 (`/app`, `/architecture` 등) UX 변경.
- documents.wiki 콘텐츠(markdown 본문) 편집.
- 검색 기능 추가 (별도 사이클).
- 다국어·i18n.
- 다크 모드.

## 3. 설계 결정 (브레인스토밍 결과)

| Q | 결정 | 대안 | 사유 |
|---|---|---|---|
| Q1 mermaid 처리 | **빌드 타임 SVG 사전 렌더** | 런타임 chunk fix, PNG export | docs는 정적 콘텐츠. 런타임 mermaid 의존 0으로 401·syntax error 자체가 불가능. 페이지 무게 ↓ |
| Q2 정보 구조 | **Adaptive 3-column** (데스크탑) → 1-column + drawer (모바일) | 2-column, top-bar dropdown | 데스크탑·모바일 모두에서 명확히 좋아져야 체감됨 |
| Q3 메가 페이지 분할 | **빌드 타임 자동 h2 분할 (threshold 본문 ≥ 20,000자)** | source 분할, collapsible, virtual scroll | 작성자 워크플로 무영향 + URL 깔끔 + 페이지 가벼움 |
| Q4 본문 폭 정책 | **이중 폭** — prose `65ch`, 표/코드/mermaid wide(`60rem`) | 단일 좁은/넓은 폭 | GitBook/Stripe 패턴. 두 콘텐츠 타입 모두 최적 |
| Q5 헤딩 anchor + URL | **rehype-slug + autolink, 한글 그대로 유지** | 영문 transliteration, hash slug, dual-alias | 기존 라이브 URL 호환, 작성자 무영향 |

## 4. 아키텍처 개요

```
┌─ build time (scripts/sync-docs.mjs) ───────────────────────┐
│ documents.wiki/*.md                                        │
│   1. mermaid 블록 → SVG 사전 렌더 (mermaid-cli)             │
│   2. 본문 ≥ 20,000자 문서는 h2 단위 자동 분할               │
│   3. DocsManifest 생성 (slug, sub-pages, h2/h3 outline)    │
│ → public/docs-md/<slug>.md (또는 <parent>/<sub>.md)        │
│ → public/docs-md/manifest.json                             │
└────────────────────────────────────────────────────────────┘
                       ▼
┌─ runtime (DocsShell) ──────────────────────────────────────┐
│ Sidebar (그룹+sub-page) │ Article (이중 폭 prose) │ TOC      │
│  데스크탑 ≥1024 — 3-column                                  │
│  태블릿 768~1023 — sidebar 접힘 + Article + TOC sticky     │
│  모바일 <768 — Article만, drawer + TOC 토글                 │
└────────────────────────────────────────────────────────────┘
```

## 5. 빌드 파이프라인 (`scripts/sync-docs.mjs` 확장)

기존 wiki 동기화에 **3단계 후처리** 추가.

### 5.1 Mermaid → SVG 사전 렌더

- 의존성: `@mermaid-js/mermaid-cli` (devDependency). puppeteer를 내부에서 사용.
- 처리: 각 `.md`에서 ` ```mermaid ` 코드 블록을 추출 → SVG 변환 → 인라인 `<figure class="mermaid-svg">...svg...</figure>` 로 교체.
- SVG 안의 텍스트는 viewport-친화적이도록 `<svg width="100%" preserveAspectRatio="xMidYMin meet">` 보정.
- 변환 실패 시: 원본 코드 블록을 `<pre>` 로 보존 + 경고 로그 (빌드는 실패하지 않음). CI 로그에서 추적.
- `/architecture` 페이지의 인터랙티브 다이어그램은 source가 `src/data/`에 하드코딩 → 영향 없음.

### 5.2 자동 h2 분할

- 트리거: 본문 ≥ 20,000자 OR 코드 블록 ≥ 100.
- 분할 단위: 최상위 h2 경계 (h1은 페이지 제목). h2가 없으면 분할하지 않음 (경고 로그).
- 결과: `<slug>/<index>_<h2-slug>.md` (예: `18_기술_스택_정의서/01_언어.md`). index는 1부터 zero-pad.
- 원본 `<slug>.md`는 첫 h2 직전까지의 도입부 + sub-page 링크 인덱스로 대체 (목차 페이지 역할).

### 5.3 Manifest 생성

- 경로: `public/docs-md/manifest.json`
- 스키마:
  ```ts
  type DocMeta = {
    slug: string;
    title: string;
    group: string;
    order: number;
    parent?: string;        // sub-page일 때 부모 slug
    children?: string[];    // 부모일 때 sub-page slug 배열
    outline: { level: 2 | 3; text: string; slug: string }[];
  };
  ```
- 빌드 시간 영향: 18개 docs + mermaid 변환 ~5-15s. CI runner 충분.

## 6. 라우팅 & 데이터

| URL | 컴포넌트 | 데이터 |
|---|---|---|
| `/docs` | `DocsIndex` (현행 그리드 유지) | manifest 그룹별 |
| `/docs/<slug>` | `DocsPage` | manifest item + `<slug>.md` |
| `/docs/<parent>/<sub>` | `DocsPage` | manifest item + `<parent>/<sub>.md` |

- `src/lib/docs-loader.ts`: manifest 우선 로드 → 콘텐츠 fetch. cache는 manifest + content 별도.
- `src/data/docs-list.ts`: 빌드 결과 manifest 사용으로 대체. 기존 in-memory 18-항목 배열 제거.
- 라우터 (`src/App.tsx`): `<Route path="docs/:slug/:sub?" element={<DocsPage />} />` 한 줄 추가.

## 7. 컴포넌트

### 신규 (`src/components/docs/`)

- `DocsShell.tsx` — 3-column flex/grid + 반응형 break.
- `DocsSidebar.tsx` — manifest 그룹 → 문서 → sub-page 트리. 활성 항목 amber bg.
- `DocsTOC.tsx` — outline scroll-spy. IntersectionObserver로 현재 보이는 H2 highlight, sticky `top: 5rem`.
- `DocsDrawer.tsx` — 모바일 햄버거용 sidebar slide-in. backdrop blur + ESC 닫기.
- `DocsArticle.tsx` — 이중 폭 prose + heading anchor + react-markdown 통합.
- `HeadingAnchor.tsx` — H2/H3 hover 시 `#` link 표시 (rehype-autolink-headings 기반).

### 변경

- `src/routes/docs/index.tsx` — `DocsIndex`로 분리 (현재 `index.tsx` 유지, manifest 사용).
- `src/routes/docs/Slug.tsx` — `DocsPage`로 리네임, `DocsShell` 안에서 `DocsArticle` + `DocsTOC`.

### 보조 (`src/lib/`)

- `docs-manifest.ts` — manifest 로드/조회 헬퍼.
- `rehype-anchor-fix.ts` — rehype-slug + autolink-headings 설정 (한글 slug 보존).

## 8. 스타일 정책

### 8.1 폭 토큰 (`globals.css`)

```css
@theme {
  --content-prose: 65ch;   /* ~680px */
  --content-wide:  60rem;  /* 960px */
}
```

### 8.2 이중 폭 적용

`<article class="docs-article">` 안에서:

```css
.docs-article > * { max-width: var(--content-prose); margin-inline: auto; }
.docs-article > pre,
.docs-article > table,
.docs-article > figure.mermaid-svg { max-width: var(--content-wide); }
```

prose는 좁고, pre/table/figure는 wide로 자연스럽게 break-out.

### 8.3 Typography 스케일

| 요소 | size/leading | margin |
|---|---|---|
| h1 | 36 / 40 | mt-0 mb-6 |
| h2 | 28 / 32 | mt-10 mb-3, border-b stone-200 pb-1 |
| h3 | 22 / 26 | mt-6 mb-2 |
| body | 16 / 28 | (prose 기본) |
| inline code | 14 | bg-stone-100 px-1.5 py-0.5 rounded |
| pre | 14 / 22 (모바일 12 / 20) | my-4 |

### 8.4 표·코드·mermaid 모바일 처리

- table: 컨테이너 `overflow-x-auto`, 첫 컬럼 `position: sticky; left: 0`, 우측에 `linear-gradient` 그라디언트 힌트 (`mask-image`).
- pre: `overflow-x-auto`, 모바일 12px, 줄 번호는 옵션 (`pre[data-line-numbers]`).
- mermaid SVG: `width: 100%; height: auto`, 작은 viewport에서 가로 스크롤은 SVG 자체 스크롤.

### 8.5 TOC & Sidebar

- TOC: 현재 섹션 amber 좌측 dot + amber underline. 비활성 stone-500.
- Sidebar: 그룹 헤더 small caps (`text-xs uppercase tracking-wider text-stone-500`), 활성 항목 `bg-amber-light text-amber-hover font-medium`.

## 9. 작업 분해

| 단계 | 산출물 | 검증 |
|---|---|---|
| 1. 빌드 — mermaid SVG | `sync-docs.mjs` 후처리, mermaid-cli 의존성, 변환 실패 시 fallback | 18개 docs sweep, console에 `렌더 실패` 0, 모든 mermaid SVG 인라인 |
| 2. 빌드 — h2 split + manifest | split 로직, manifest emit, 작은 docs는 단일 페이지 | `04_API`, `09_Git`, `18_기술_스택` 분할 결과 spot check, manifest schema 검증 |
| 3. 라우팅 + 데이터 | `docs-loader`, `data/docs-list` → manifest, sub-page route | 모든 docs 페이지 200 + 콘텐츠 표시 |
| 4. DocsShell + Sidebar + Drawer | 3-column 골조, 반응형, 햄버거 drawer | 1280·768·375 시각 검증 (sidebar 표시·접힘·drawer 동작) |
| 5. DocsArticle + 이중 폭 + anchor | typography 스케일, rehype-slug + autolink, 표/코드 처리 | prose 폭 ~680px, 표/코드 폭 ~960px, H2 hover anchor `#`, 한글 slug deep-link 동작 |
| 6. DocsTOC + scroll-spy | outline 기반 sticky TOC, 활성 헤딩 highlight | 스크롤 시 TOC dot 정확히 추적, sub-page 진입 시 reset |

각 단계 끝에서 로컬 dev (`http://localhost:5173/synapse-prototype/`) 시각 검증. 6단계 모두 끝난 뒤 한 묶음 commit·push.

## 10. 위험 & 완화

| 위험 | 완화 |
|---|---|
| `mermaid-cli`가 puppeteer 다운로드 (~150 MB)로 CI 빌드 시간·캐시 영향 | `puppeteer-cache` GitHub Actions cache 또는 `@sparticuz/chromium` 가벼운 대안. 캐시 미스 시도 +30s 수준이면 수용 |
| h2 분할 시 그룹 안 콘텐츠가 어색하게 끊기는 케이스 | sub-page 첫 줄에 "본 절은 부모 문서 X의 일부" breadcrumb 추가 |
| sub-page 라우트 변경으로 기존 라이브 deep link 깨짐 | 부모 slug `/<parent>`는 그대로 유지(목차 페이지) → 기존 외부 링크 호환. sub-page는 추가 경로 |
| Adaptive 3-column이 1280에서 본문 폭 더 좁아짐 | 본문 폭은 `var(--content-prose)`로 고정. column 폭은 sidebar 16rem + TOC 14rem로 잡고 본문 영역은 가변 |
| rehype-autolink-headings가 한글 slug에서 충돌 | rehype-slug `unique` 옵션 사용 → 동일 헤딩 텍스트는 `-1`, `-2` 접미사 |
| 빌드 시간 증가로 deploy.yml 5분 SLA 초과 | 현재 ~46s → mermaid +10s + split +2s = ~1분 예상. SLA 충분 |

## 11. 검증

- **단위 테스트**: split 로직, manifest 생성, mermaid 변환 fallback (`scripts/__tests__/`).
- **E2E (Playwright)**: docs 첫 페이지 + sub-page + TOC 스크롤 + Sidebar 활성 항목 확인 (`tests/docs.spec.ts`).
- **시각 회귀**: 라이브 배포 후 18 docs × 3 viewport sweep, console error·overflow 0.
- **성능**: `18_기술_스택` 메가 페이지가 sub-page 분할 후 각 ≤ 2 MB, LCP < 2s 목표.

## 12. Out of scope (다음 사이클)

- 사이트 내 docs 검색 (minisearch + manifest outline 인덱싱)
- print 스타일시트
- 다크 모드 토큰
- documents.wiki 작성 가이드 (mermaid 권장 패턴, h2 단위 작성 권장)
