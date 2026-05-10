# 기술 스택 섹션 설계

- **날짜**: 2026-05-10
- **상태**: draft (구현 전 합의 완료)
- **트리거**: `https://team-project-final.github.io/synapse-prototype/docs/18_기술_스택_정의서` 의 내용을 상단 내비게이션의 데모/프로젝트/아키텍처/문서/GitHub와 동등한 레벨로 올리고, 내부 내용을 각 기술별로 분리해 "사이트 진입 → 기술 문서 → 기술 목록 → 선택 → 상세"의 구조를 부여한다.

## 1. 목표 / 비목표

### 목표
- 18번 위키 문서(`18_기술_스택_정의서.md`, ≈304 KB)의 내용을 **별도 섹션**(`/tech`)으로 끌어올린다.
- 각 기술(h3 단위)이 **독립 페이지**를 가져 직접 링크/공유 가능하게 한다.
- 위키 단일 소스(single source of truth)를 유지하면서, 사이트의 정보 구조를 사용자 멘탈 모델에 맞춘다.
- `/architecture`(시퀀스/동작 흐름)와 `/tech`(컴포넌트/구성 요소)를 의미 페어로 정렬한다.

### 비목표
- 위키 콘텐츠를 사이트 저장소로 복제/이전하지 않는다 (sync-docs 파이프라인 유지).
- 기술 카드에 회사 로고/공식 아이콘을 사용하지 않는다 (라이선스/유지보수 비용).
- v1에서는 기술 검색 UI를 별도로 만들지 않는다 (필요 시 기존 `lib/search.ts` minisearch 코퍼스에 추가하는 확장 지점만 남김).
- `/docs/18_기술_스택_정의서` URL은 보존하되, docs 사이드바와 `/docs` 인덱스에서는 숨긴다 (콘텐츠 중복 노출 회피).
- `SiteHeader` 활성 상태 표시, 모바일 햄버거 메뉴 등은 본 작업 범위 밖.

## 2. 의사결정 요약

| 갈래 | 결정 | 근거 |
|------|------|------|
| 기존 18번과의 관계 | **B**: `/tech` 신설, docs 사이드바/인덱스에서 18번 숨김 (라우트는 유지) | 위키 단일 소스, 옛 링크 보존, 검색·내비게이션 중복 제거 |
| 정보 구조 깊이 | **B**: 2-tier 평탄 (`/tech` → `/tech/:slug`) | 카테고리 매개 없이 기술명을 직접 URL에 노출, 첫 화면에서 전체 조망 |
| split 위치 | **A**: `sync-docs.mjs` 빌드 시점 split | 기존 mermaid 사전 렌더 패턴과 정합, 페이지당 5–30 KB 청크 |
| 허브 페이지 구성 | **B**: 풍부한 랜딩 (개요 + 다이어그램 + 선정 기준 + 카드 그리드 + 부록) | 평탄 구조의 "맥락 부족"을 허브가 흡수, 18번 §1 자산 재활용 |
| 상세 페이지 셸 | **C**: 3컬럼 셸(기존 `DocsShell` 재사용) + 메타 박스 | docs UX 일관성, 형제 기술 빠른 전환, 메타로 "위키 본문 토막"이 아니라 "기술 카드의 펼침" 톤 |
| 상단 nav 위치/라벨 | **B**: 아키텍처 옆 + "기술 스택" | `/architecture` ↔ `/tech` 의미 페어, 위키 정의서 명칭과 일치 |
| 카드 시각 | **B**: 좌측 4 px 색상 액센트 바 + 레이어 배지 | 시각 풍부성과 운영 비용의 균형, 다이어그램과 색상 어휘 공유 |

## 3. 사용자 흐름

```
홈 (/)
  └─ 상단 "기술 스택" 클릭
       └─ /tech (허브)
            ├─ 개요 인트로
            ├─ 시스템 아키텍처 다이어그램 (mermaid SVG, 사전 렌더)
            ├─ 선정 기준 카드 그리드
            ├─ 레이어별 기술 카드 그리드 (9개 sub-layer 섹션, 약 40개 카드)
            └─ 부록 (요약 매트릭스 / 버전 호환성, details 토글)
                 │ (카드 클릭)
                 ▼
       /tech/:slug (상세)
            ├─ 좌측: 기술 사이드바 (레이어별 그룹, 현재 항목 강조)
            ├─ 중앙: 메타 박스 + 본문(h3 chunk) + prev/next 페이저
            └─ 우측: 본문 안 h4 TOC
```

상호 링크:
- `/tech` 헤더 → `/docs/18_기술_스택_정의서` (출처)
- `/tech/:slug` 메타 박스 → `/docs/18_기술_스택_정의서#<chunkAnchor>`
- `/docs` 인덱스: "운영/배포" 그룹 상단에 callout — "기술 스택은 별도 페이지에서 보기 →"

## 4. 데이터 흐름 / 빌드 파이프라인

```
documents.wiki/18_기술_스택_정의서.md
         │
         ▼ CI: "Sync wiki docs"
   scripts/sync-docs.mjs
         ├─ renderMermaidBlocks()       (기존: ```mermaid → SVG 사전 렌더)
         ├─ buildManifestEntry()         (기존: docs manifest 항목 생성)
         └─ NEW: splitTechDoc()          (18번 전용 분기)
                  ├─ extractOverview()   (h2 "1. 개요" → TechOverview)
                  └─ extractTechs()      (h2 레이어 + h3 기술 chunk)
                       │
                       ▼
                public/docs-md/tech/
                  ├─ overview.md
                  ├─ matrix.md
                  ├─ <slug>.md × ≈40
                  └─ tech-manifest.json
                       │
                       ▼ (런타임)
            React 라우트 /tech, /tech/:slug
                       │
                       └─ 기존 docs-loader.ts 재사용 fetch
```

원칙:
- 18번 원본도 docs-md/에 그대로 저장 → 출처 링크 보존.
- mermaid는 sync-docs 단계에서 SVG로 인라인 치환 완료된 상태에서 split → split 후에도 코드블럭 깨짐 없음.
- 위키 clone 실패 시(현 동작 호환) `public/docs-md/tech/`가 비어 있어도 빌드는 성공한다 (런타임은 fallback 안내 표시).

## 5. 데이터 모델

### 5.1 `tech-manifest.json` 스키마

```ts
// src/lib/tech-manifest.ts (신규)
export interface TechMeta {
  slug: string;          // URL 슬러그, 예: "flutter-3-x"
  title: string;         // 표시명, 예: "Flutter"
  version: string | null;// 버전 토큰, 예: "3.x", "21 LTS", null
  layer: string;         // 한글 레이어명, 예: "Client Layer"
  layerSlug: string;     // 레이어 슬러그, 예: "client"
  layerOrder: number;    // 레이어 정렬용 (h2 등장 순서)
  techOrder: number;     // 레이어 내 정렬용 (h3 등장 순서)
  summary: string;       // 1줄 요약 (≤120자), h3 다음 첫 단락에서 추출
  outline: Outline[];    // chunk 안의 h4 항목 (TOC용)
  originalSection: string | null; // 위키 원문 번호 (예: "2.1"), 없으면 null
  chunkAnchor: string;   // 18번 단일 페이지에서의 h3 슬러그 (출처 링크용)
}

export interface Outline {
  level: 4;
  text: string;
  slug: string;          // github-slugger
}

export interface TechOverview {
  intro: string;         // 1.1 문서 목적의 인트로 단락(들)
  diagramHtml: string;   // 1.2 아키텍처 다이어그램 — sync-docs에서 mermaid → SVG 치환된 HTML 단편
  principles: Principle[]; // 1.3 기술 선택 기준 → 4~5개 카드
  tableMd: string;       // 1.4 전체 기술 스택 목록 표 (마크다운 그대로)
}

export interface Principle {
  title: string;
  body: string;
}

export interface TechManifest {
  overview: TechOverview;
  techs: TechMeta[];
  extras: {
    matrixSlug: 'matrix.md' | null;   // 10. 요약 매트릭스
    auditSlug: string | null;         // 12. 버전 호환성 (선택)
  };
}
```

### 5.2 파싱 규칙

| 항목 | 규칙 |
|------|------|
| `slug` | h3 텍스트(예: `2.1 Flutter 3.x`)에서 `숫자.숫자(.숫자)?` 접두 제거 후 `github-slugger` 적용 → `flutter-3-x` |
| `title` | h3 텍스트에서 번호 접두 제거 + 끝의 버전 토큰 분리 → `Flutter` |
| `version` | h3 끝부분에서 버전 토큰 추출. 정규식 `(\d+(?:\.x|\.[\dx]+)*)\s*(?:\(\s*LTS\s*\))?\s*$` (예: `3.x` → "3.x", `21 (LTS)` → "21 LTS", `8` → "8"). 매칭 실패 시 `null` |
| `layer`, `layerSlug` | sub-layer 규칙 (5.2-1 참조) — 단일 h2 레이어는 h2에서, 분기 레이어(현재 4번)는 sub-layer h3에서 |
| `summary` | h3 직후 첫 비어있지 않은 단락(코드/표/h4 등장 시까지). trim 후 120자 cut + ellipsis |
| `outline` | h3 chunk 안의 `^####\s+` 라인만 수집 |
| `originalSection` | h3 텍스트의 번호 접두(예: "2.1", "4.1.1") |
| `chunkAnchor` | 18번 원본에서의 h3 슬러그 (`extractOutline`이 만들 슬러그와 동일하게 계산) |

#### 5.2-1 sub-layer 규칙 (h2 안에 두 단계 깊이가 섞이는 경우)

위키 18번의 h2/h3 구조는 두 가지 패턴이 혼재:

- **단일 h2 패턴 (대부분 레이어)**: `## N. <Layer>` 아래에 `### N.M <Tech>`만 등장. 예) Client/Gateway/Data/AI·ML/Infra/Observability/External.
- **분기 패턴 (현재 §4 Backend Services Layer만)**: `## 4. Backend Services Layer` 아래에 sub-layer 헤더 `### 4.1 Java/Spring Ecosystem`, `### 4.2 Python/FastAPI Ecosystem`이 있고, 그 아래로 같은 h3 레벨에 `### 4.1.1 Java 21 (LTS)`, `### 4.1.2 Spring Boot 4`, …, `### 4.2.1 Python 3.12`, … 가 평탄하게 나열됨.

판정 알고리즘 (`splitTechDoc` 안):

1. h2 chunk를 잘라낸다.
2. 그 안의 h3 라인을 순회하며 번호 토큰을 본다.
   - 모든 h3가 `N.M` (두 자리)면 **단일 h2 패턴**: `layer = h2 텍스트의 번호 제거`, `layerSlug = github-slugger(layer)`. 모든 h3 chunk가 tech가 됨.
   - h3 중 `N.M.K` (세 자리)가 하나라도 등장하면 **분기 패턴**: 가장 가까운 직전 `N.M` h3가 sub-layer 헤더가 되어 `layer = h2 텍스트 + ' / ' + 그 h3 텍스트의 번호 제거`(예: `Backend Services Layer / Java/Spring Ecosystem`), `layerSlug = github-slugger(<h2 슬러그>-<h3 슬러그>)`(예: `backend-services-layer-java-spring-ecosystem`). `N.M` h3는 tech가 아니라 sub-layer 헤더로만 쓰이고 split 산출물에서 제외(본문은 sub-layer의 인트로로 사용 가능하지만 v1에서는 무시). `N.M.K` h3들이 tech chunk가 됨.
3. `layerSlug`는 너무 길어지지 않도록 짧은 alias 매핑 테이블을 둔다(허브 색상 토큰과 카드 라벨용):

   | layerSlug (정규) | display layer | 짧은 키 (CSS 변수 매핑용) |
   |---|---|---|
   | `client-layer` | `Client Layer` | `client` |
   | `gateway-layer` | `Gateway Layer` | `gateway` |
   | `backend-services-layer-java-spring-ecosystem` | `Backend / Java·Spring` | `backend-java` |
   | `backend-services-layer-python-fastapi-ecosystem` | `Backend / Python·FastAPI` | `backend-python` |
   | `data-layer` | `Data Layer` | `data` |
   | `ai-ml-레이어` | `AI/ML 레이어` | `aiml` |
   | `인프라-레이어` | `인프라 레이어` | `infra` |
   | `모니터링-관측성-레이어` | `모니터링 & 관측성 레이어` | `observability` |
   | `외부-서비스-레이어` | `외부 서비스 레이어` | `external` |

   매핑은 `getLayerColor(layerSlug)`이 짧은 키로 변환 후 CSS 변수(`--tech-<short>`)를 반환. 매핑에 없으면 `--tech-infra`로 fallback.
4. `display layer`는 카드 배지/메타 박스/사이드바 헤더 텍스트로 사용. `layer` 필드(원본 매핑 전 한글)는 manifest에 그대로 보존하되, UI는 `display layer`만 사용.

이 규칙으로 위키에 새 sub-layer가 등장해도(예: 미래에 Edge Compute Layer 추가) 매핑 테이블에 한 줄 추가만으로 색·짧은 키를 부여 가능. 매핑이 없으면 fallback 색으로 자동 렌더되어 빌드는 깨지지 않음.

### 5.3 split에서 제외하는 h2

| h2 | 처리 |
|----|------|
| `## 1. 개요` | `tech-overview.md` + `TechOverview` 구조화 |
| `## 10. 기술 선택 요약 매트릭스` | `tech/matrix.md` (마크다운 그대로) — 부록 details에 노출 |
| `## 11. 변경 이력` | 무시 |
| `## 12. 버전 호환성 감사 보고서` | `tech/audit.md`(선택) — 부록 details에 노출 |

`extras.matrixSlug` / `extras.auditSlug`로 manifest에 슬러그만 기록, 본문 마크다운은 펼치는 시점에 lazy fetch.

### 5.4 슬러그 충돌 처리

서로 다른 h3가 같은 슬러그를 만들면 (예: 다른 레이어의 동명 항목), `<slug>-2`, `<slug>-3` 같은 접미를 부여한다. `github-slugger` 인스턴스가 자동 처리하므로 `extractTechs` 한 패스 안에서 단일 인스턴스를 공유한다.

## 6. UI 설계

### 6.1 허브 (`/tech`)

페이지 구조 (top → bottom):

1. **`<SiteHeader />`**
2. **헤더 영역** (`<TechHero />`)
   - `<h1>` "기술 스택"
   - 1줄 부제 + "출처: 위키 18. 기술 스택 정의서 →" 링크
3. **§ 시스템 아키텍처** (`<TechOverviewDiagram />`)
   - `overview.diagramHtml`을 `dangerouslySetInnerHTML`로 인라인 (sync-docs가 신뢰된 출처에서 만든 SVG)
   - `overflow-x-auto` 래퍼로 큰 다이어그램 모바일 처리
4. **§ 선정 기준** (`<PrinciplesGrid />`)
   - 2열 카드 그리드, 각 카드에 title + body
5. **§ 기술 목록** (`<TechLayerSection />` × 9)
   - h2 (`id={layerSlug}`, `scroll-mt-16`) + 그리드 `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3`
   - 각 카드: `<TechCard />`
6. **§ 부록** (`<AppendixDocs />`)
   - `<details>10. 기술 선택 요약 매트릭스</details>`
   - `<details>12. 버전 호환성 감사 보고서</details>` (있을 때만)
   - 펼치는 시점에 `loadDoc('tech/matrix')` lazy fetch

### 6.2 상세 (`/tech/:slug`)

기존 `DocsShell`을 재사용:

| 슬롯 | 내용 |
|------|------|
| `sidebar` | `<TechSidebar />` — manifest를 layer별로 그룹핑한 nav, 현재 항목 active highlight (warm amber) |
| `toc` | `<TechTOC outline={meta.outline} />` — 일반화된 `DocsTOC`(level 2/3/4 받음) 재사용 |
| `drawer` | 모바일에서 좌측 사이드바를 그대로 드로어로 |
| `children` | `<TechMetaPanel />` + `<DocsArticle source={chunkMd} />` + `<TechPager />` |

`<TechMetaPanel />` 마크업:
```tsx
<header className="mb-8 rounded-md border border-stone-200 bg-white border-l-4"
        style={{ borderLeftColor: layerColor }}>
  <div className="px-4 py-3 space-y-1">
    <div className="flex items-center gap-2 text-xs">
      <Link to={`/tech#${layerSlug}`}>{layer}</Link>
      {version && <Badge>{version}</Badge>}
    </div>
    <h1 className="display text-3xl">{title}</h1>
    <p className="text-stone-600">{summary}</p>
    <a href={`/docs/18_기술_스택_정의서#${chunkAnchor}`}
       className="text-xs text-stone-500 hover:text-[#D97706]">
       출처: 위키 18. 기술 스택 정의서 §{originalSection ?? '—'} →
    </a>
  </div>
</header>
```

`<TechPager />` 동작:
- prev/next는 **레이어를 가로지르는 평탄 순서** (Client 마지막 → Gateway 첫 번째 등).
- 경계에서 슬롯이 없으면 `aria-disabled` + `opacity-50`.
- 본문 끝 + 모바일에서도 노출.

### 6.3 카드 시각 토큰 (질문 6-2 B안)

`src/styles/globals.css`의 `@theme`에 추가:

```css
@theme {
  --tech-client: #D97706;          /* warm amber, 기본 액센트와 동일 */
  --tech-gateway: #0EA5E9;
  --tech-backend-java: #7C3AED;
  --tech-backend-python: #2563EB;
  --tech-data: #059669;
  --tech-aiml: #DB2777;
  --tech-infra: #475569;
  --tech-observability: #EA580C;
  --tech-external: #525252;
}
```

`getLayerColor(layerSlug)` 헬퍼가 layerSlug → CSS 변수명 매핑. 미등록 layerSlug는 `--tech-infra`로 fallback.

### 6.4 컴포넌트 인벤토리

| 컴포넌트 | 책임 | 위치 |
|---------|------|------|
| `routes/tech/index.tsx` | tech-manifest fetch, 허브 섹션 조립 | 신규 |
| `routes/tech/Slug.tsx` | manifest + chunk fetch, 셸 조립 | 신규 |
| `components/tech/TechHero.tsx` | 페이지 타이틀 + 출처 링크 | 신규 |
| `components/tech/TechOverviewDiagram.tsx` | overview.diagramHtml 인라인 렌더 | 신규 |
| `components/tech/PrinciplesGrid.tsx` | principles 카드 그리드 | 신규 |
| `components/tech/TechLayerSection.tsx` | h2(layer) + TechCard 그리드 | 신규 |
| `components/tech/TechCard.tsx` | 단일 기술 카드 (액센트 + 배지 + 요약) | 신규 |
| `components/tech/AppendixDocs.tsx` | 부록 details (lazy fetch) | 신규 |
| `components/tech/TechSidebar.tsx` | layer별 nav (DocsSidebar 패턴 차용) | 신규 |
| `components/tech/TechMetaPanel.tsx` | 상세 메타 박스 | 신규 |
| `components/tech/TechPager.tsx` | 본문 끝 prev/next | 신규 |
| `components/docs/DocsTOC.tsx` | level 2/3/4 받게 일반화 | 수정 |
| `components/docs/DocsShell.tsx` | (변경 없음) — 재사용 | — |
| `components/docs/DocsArticle.tsx` | (변경 없음) — 재사용 | — |
| `lib/tech-manifest.ts` | 클라이언트 로더, `groupTechsByLayer`, `flattenForPager`, `findTechBySlug`, `getLayerColor` | 신규 |
| `lib/docs-manifest.ts` | `groupManifest`에 hidden set 적용 | 수정 |
| `App.tsx` | `/tech`, `/tech/:slug` 라우트 추가 | 수정 |
| `components/shared/SiteHeader.tsx` | "기술 스택" 링크 추가 | 수정 |

## 7. 라우팅 / 내비게이션 변경

### 7.1 `SiteHeader.tsx`

```diff
  <nav className="hidden sm:flex items-center gap-4 text-sm">
    <Link to="/app" ...>데모</Link>
    <Link to="/about" ...>프로젝트</Link>
    <Link to="/architecture" ...>아키텍처</Link>
+   <Link to="/tech" ...>기술 스택</Link>
    <Link to="/docs" ...>문서</Link>
    <a href="https://github.com/team-project-final/synapse-prototype" ...>GitHub</a>
  </nav>
```

순서: 데모 / 프로젝트 / 아키텍처 / **기술 스택** / 문서 / GitHub

### 7.2 `App.tsx`

```diff
+ import TechHub from './routes/tech/index';
+ import TechSlug from './routes/tech/Slug';

  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/about" element={<About />} />
    <Route path="/architecture" element={<Architecture />} />
+   <Route path="/tech" element={<TechHub />} />
+   <Route path="/tech/:slug" element={<TechSlug />} />
    <Route path="/docs" element={<DocsIndex />} />
    <Route path="/docs/:slug" element={<DocsSlug />} />
    <Route path="/docs/:slug/:sub" element={<DocsSlug />} />
    ...
  </Routes>
```

### 7.3 `lib/docs-manifest.ts`

```diff
+ const HIDDEN_FROM_DOCS_SIDEBAR = new Set(['18_기술_스택_정의서']);

  export function groupManifest(manifest: DocMeta[]): { group: string; docs: DocMeta[] }[] {
    const map = new Map<string, DocMeta[]>();
    for (const m of manifest) {
      if (m.parent) continue;
+     if (HIDDEN_FROM_DOCS_SIDEBAR.has(m.slug)) continue;
      if (!map.has(m.group)) map.set(m.group, []);
      map.get(m.group)!.push(m);
    }
    ...
  }
```

`findEntry()`는 변경 없음 → `/docs/18_기술_스택_정의서` URL은 그대로 유효.

### 7.4 `/docs` 인덱스 callout

`routes/docs/index.tsx`에서 "운영/배포" 그룹 헤더 옆/아래에 작은 안내:

```tsx
<p className="text-sm text-stone-500">
  기술 스택은 <Link to="/tech" className="text-[#D97706] underline">별도 페이지</Link>에서 봅니다.
</p>
```

## 8. 빌드 자산 / 스크립트

```
scripts/
  ├─ sync-docs.mjs                       [수정] 18번 처리 분기
  └─ lib/
      ├─ tech-split.mjs                  [신규] h2/h3 chunk 추출 + 메타 파싱
      ├─ tech-overview-extract.mjs       [신규] §1 → TechOverview
      └─ __tests__/
          ├─ tech-split.test.mjs          [신규]
          └─ tech-overview-extract.test.mjs [신규]
```

`sync-docs.mjs`의 핵심 변경(의사코드):

```js
const TECH_DOC_SLUG = '18_기술_스택_정의서';
const TECH_OUT_DIR = join(PUBLIC_DOCS_DIR, 'tech');

// 기존 루프 안에서:
if (slugFromFilename(entry) === TECH_DOC_SLUG) {
  await mkdir(TECH_OUT_DIR, { recursive: true });
  const { overview, techs, extras } = await splitTechDoc(rendered); // rendered = mermaid 사전 렌더 완료된 마크다운
  for (const t of techs) {
    await writeFile(join(TECH_OUT_DIR, `${t.slug}.md`), t.content, 'utf8');
  }
  if (extras.matrixMd) {
    await writeFile(join(TECH_OUT_DIR, 'matrix.md'), extras.matrixMd, 'utf8');
  }
  if (extras.auditMd) {
    await writeFile(join(TECH_OUT_DIR, 'audit.md'), extras.auditMd, 'utf8');
  }
  if (overview.bodyMd) {
    await writeFile(join(TECH_OUT_DIR, 'overview.md'), overview.bodyMd, 'utf8');
  }
  const techManifest = {
    overview: { intro: overview.intro, diagramHtml: overview.diagramHtml,
                principles: overview.principles, tableMd: overview.tableMd },
    techs: techs.map(toMeta),
    extras: { matrixSlug: extras.matrixMd ? 'matrix' : null,
              auditSlug: extras.auditMd ? 'audit' : null },
  };
  await writeFile(join(TECH_OUT_DIR, 'tech-manifest.json'),
                  JSON.stringify(techManifest, null, 2), 'utf8');
}
```

`.gitignore`는 이미 `public/docs-md/`를 ignore하므로 추가 변경 없음. CI 워크플로(`deploy.yml`)도 변경 없음 — sync-docs가 산출물에 함께 포함시킨다.

## 9. 실패 / 엣지 케이스

| 케이스 | 동작 |
|--------|------|
| 위키 clone 실패 | 기존 동작과 동일하게 빌드는 성공. `public/docs-md/tech/`가 없을 수 있음. 런타임에서 `tech-manifest.json` fetch 실패 → "기술 스택을 불러올 수 없습니다 (위키 동기화 필요)" + `/docs/18_기술_스택_정의서` 링크. |
| 위키 18번이 사라짐 | 기존 docs 파이프라인은 그대로 (해당 파일 없음). `/tech`는 위와 같은 fallback. `/docs/18_기술_스택_정의서`는 docs-loader fetch 404 → 기존 에러 메시지. |
| h3 번호 패턴이 깨짐 (예: "Flutter (3.x)") | `originalSection`/`version`이 `null`로 기록, 슬러그는 `github-slugger` 단독으로 생성, 페이지는 정상 렌더. 단위 테스트에 픽스처 1건 포함. |
| 슬러그 충돌 | 단일 `github-slugger` 인스턴스가 `-2`/`-3` 접미 자동 부여. |
| 알 수 없는 layerSlug (위키에 새 레이어 추가) | `getLayerColor` fallback `--tech-infra`로 렌더, 카드와 페이지 모두 정상. |
| 잘못된 `/tech/:slug` URL | 본문에 "기술을 찾을 수 없습니다 — 허브로" 링크. |
| 본문에 h2/h3가 chunk 안에 있는 경우 (split 버그) | 단위 테스트에서 차단. 실 환경에서 재현 시 우측 TOC가 비고 본문은 그대로 렌더 (degrade 가능). |

## 10. 테스트 전략

### 유닛 (vitest)

| 파일 | 검증 |
|------|------|
| `scripts/__tests__/tech-split.test.mjs` | h3 chunk 분리, h4 보존, h2 경계, 1/10/11/12 h2 제외, version 정규식, summary 120자 cut, 슬러그 충돌, 비표준 h3 패턴 fallback |
| `scripts/__tests__/tech-overview-extract.test.mjs` | 1.2 mermaid SVG가 diagramHtml에 들어감, 1.3 원칙 카드 N개, 1.4 표 마크다운 보존 |
| `scripts/__tests__/manifest.test.mjs` (기존) | 회귀: 18번이 docs manifest에는 그대로 들어감 |
| `src/lib/__tests__/tech-manifest.test.ts` | `groupTechsByLayer`, `flattenForPager`(인덱스 ±1), `findTechBySlug`, `getLayerColor`(fallback) |
| `src/lib/__tests__/docs-manifest.test.ts` | 회귀: `groupManifest`가 18번을 사이드바 그룹에서 제외, `findEntry`는 여전히 찾음 |

### 컴포넌트 (vitest + @testing-library/react)

| 파일 | 검증 |
|------|------|
| `components/tech/__tests__/TechCard.test.tsx` | 액센트바 색상이 layer에 맞게 적용, version 배지 조건부 렌더, summary line-clamp |
| `components/tech/__tests__/TechPager.test.tsx` | 첫/마지막 기술에서 prev/next disabled, 경계 넘기 (Client 끝 → Gateway 시작) |
| `components/tech/__tests__/TechSidebar.test.tsx` | active highlight, layer 헤더 정렬 |
| `routes/tech/__tests__/Slug.test.tsx` | 메타 박스/사이드바/TOC/본문 렌더, 잘못된 slug 시 fallback |

### E2E (Playwright, `tests/e2e/tech.spec.ts` 신규)

1. SiteHeader → "기술 스택" 클릭 → `/tech` 도달.
2. 허브에서 시스템 아키텍처 SVG 가시.
3. Client Layer의 첫 카드 클릭 → `/tech/<slug>` 도달, 메타 박스 노출.
4. 우측 TOC 첫 항목 클릭 → 페이지 내 스크롤 (해당 h4가 viewport 진입).
5. 페이저 next 클릭 → 다음 기술 도달, URL 변경.
6. 메타 박스 "출처" 링크 → `/docs/18_기술_스택_정의서` 도달 (h3 앵커 포함).
7. `/docs` 인덱스에 18번 카드가 **없어야** 함 (회귀 가드).

## 11. 비기능 / 운영 메모

- **번들 크기**: 코드만 추가, 마크다운/manifest는 런타임 fetch라 번들 영향 없음.
- **빌드 시간**: split은 단일 파일 정규식 패스 + ≈40개 파일 write → 수백 ms 추가. mermaid 렌더가 이미 큰 비용을 차지하므로 체감 변화 없음.
- **첫 진입 비용**: 허브에서 `tech-manifest.json` 1회 fetch (≈수 KB JSON). overview.diagramHtml은 manifest 안에 인라인되어 추가 RTT 없음. 부록은 lazy.
- **상세 페이지 비용**: `/tech/:slug`는 manifest + 해당 chunk md 두 fetch. 평균 5–30 KB.
- **위키에 새 기술 추가 시**: 사이트 코드 변경 없이 다음 sync-docs 실행에서 자동으로 카드 + 페이지 등장.
- **검색 통합 확장 지점**: v2에서 `lib/search.ts`의 minisearch 코퍼스에 `techs.map(t => ({ id: 'tech:'+slug, title, body: summary, route: '/tech/'+slug }))`를 추가하면 `/app/search`에서 자동으로 기술 결과 노출. 본 spec 범위 외.

## 12. 점진 도입 순서 (구현 단계 가이드)

> 상세는 implementation plan에서 다룸.

1. `tech-split.mjs` + 픽스처 기반 단위 테스트.
2. `tech-overview-extract.mjs` + 단위 테스트.
3. `sync-docs.mjs` 통합, `tech-manifest.json` 산출 검증.
4. `lib/tech-manifest.ts` 클라이언트 로더 + 단위 테스트.
5. `routes/tech/index.tsx` 허브 + 컴포넌트 (TechHero/TechOverviewDiagram/PrinciplesGrid/TechLayerSection/TechCard/AppendixDocs).
6. `routes/tech/Slug.tsx` 상세 + 컴포넌트 (TechMetaPanel/TechSidebar/TechPager) + DocsTOC 일반화.
7. `App.tsx` 라우트 + `SiteHeader` 링크 + `docs-manifest` hidden set + `/docs` 인덱스 callout.
8. E2E + 회귀 테스트.

## 13. 미해결 / 후속 후보

- 모바일 햄버거 메뉴 — 현재 `sm` 미만에서 nav 숨김. 별도 작업.
- `SiteHeader` 활성 상태 표시 — 별도 작업.
- 기술 검색 UI — v2 (minisearch 코퍼스 통합).
- `/architecture` 페이지에서 `/tech`로의 인바운드 링크 강화 — 별도 작업.
