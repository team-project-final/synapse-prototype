# Synapse Prototype 개발 저널

> 단일 세션에서 spec → plan → autopilot 5-phase → 라이브 배포까지 완주한 기록.

| 항목 | 값 |
|------|----|
| 세션 일자 | 2026-05-09 |
| 최종 commit | `380dfb9` (이후 추가 커밋은 변경 이력 참조) |
| 라이브 URL | https://team-project-final.github.io/synapse-prototype/ |
| 레포 | https://github.com/team-project-final/synapse-prototype |
| 소스 | `D:\workspace\final-project-syn\page\` |
| 참조 자료 | `documents.wiki/` (Synapse 위키 18개 문서), `syn/DESIGN.md` (디자인 시스템) |

---

## 1. 시작 컨텍스트

`final-project-syn` 워크스페이스에 다음이 존재했다:
- `documents.wiki/` — Synapse 팀 프로젝트의 GitHub 위키 (기획/설계/운영 18개 문서)
- `syn/` — 메인 Flutter+Spring Boot 앱 레포 (DESIGN.md, CLAUDE.md 포함)
- `page/` — 빈 디렉토리, 사용자가 "여기에서 페이지 소스 코드 관리"라고 요청

사용자 최초 요청:
> @documents.wiki @syn 문서 내용 기반으로 인터렉티브 시뮬레이터 형식으로 깃허브의 페이지로 배포 구성 검토. 배포 page 소스 코드 관리는 @page 폴더에서 진행하며, 실제 배포할 깃허브의 레포를 https://github.com/team-project-final/documents 여기로 할지 아니면 새로운 레포를 생성하여 거기서 배포할지도 같이 검토.

---

## 2. 단계 1 — 브레인스토밍 (superpowers:brainstorming)

총 8개의 명확화 질문을 거쳐 다음 의사결정을 수렴.

| # | 결정 사항 | 선택 |
|---|----------|------|
| Q1 | 사이트 정체성 | A 쇼케이스 + B 클릭형 프로토타입 + C Living Docs 전부 통합 |
| Q2 | 깊이/우선순위 | 옵션 2 — B를 메인으로, A·C는 보조 |
| Q3 | 화면 범위 | 12~13 화면 (핵심 + 차별화), 자유 탐색 모드 |
| Q4 | 상태 지속성 | 레벨 2 — localStorage 기반 세션 상태 |
| Q5 | 레포 전략 | 옵션 B — 신규 레포 `synapse-prototype` |
| Q6 | 기술 스택 | 옵션 B — Vite + React 18 + Tailwind + TypeScript |
| Q7 | 뷰포트 | 옵션 2 — 반응형 단일 설계 (Mobile/Tablet/Desktop) |
| Q8 | IA / 진입 흐름 | 옵션 2 — 랜딩 → /app 진입형, 로그인 스킵, /about & /architecture 분리 |

**최종 산출물**: `docs/superpowers/specs/2026-05-09-synapse-prototype-design.md` (9개 섹션, ~580 줄)

---

## 3. 단계 2 — 구현 계획서 (superpowers:writing-plans)

7개 마일스톤 × 평균 5~7개 태스크 × 5스텝 TDD 사이클로 구조화. 각 태스크에 정확한 파일 경로, 코드 블록, 검증 명령, 커밋 메시지 포함.

**최종 산출물**: `docs/superpowers/plans/2026-05-09-synapse-prototype-implementation.md` (~6,043 줄, 7 마일스톤, ~43 태스크)

---

## 4. 단계 3 — 실행 (Autopilot Phase 2)

`oh-my-claudecode:autopilot` 스킬 + 마일스톤 단위 직접 실행 혼합 전략.

### 마일스톤별 결과

| M | 제목 | 커밋 | 핵심 산출물 |
|---|------|------|-------------|
| 1 | Project Setup & Tooling | `e2977c8`, `1ce6801`, `b0e888f`, `df7f161`, `03bb25e` | Vite 6 + React 18 + TS strict + Tailwind v4 + ESLint + Vitest, GitHub Actions skeleton, README |
| 2 | Design System & App Shell | `18b1823`, `0d87592`, `e3ca53e` | 6 ds primitives (Button/Card/Input/Badge/Toaster/Dialog), AppShell 반응형, 19 라우트 placeholder |
| 3 | Domain Lib & Stores & Seed | `ac28050`, `a3db689`, `3c93e83` | SM-2/wikilink/graph/xp lib (TDD), 7 Zustand stores (persist), P1 김시냅스 시드 + SeedGuard |
| 4 | Tier 1 Screens (Core Loop) | `caa8441` | 대시보드 / 노트 목록·에디터·상세·신규 / AI 카드 생성 / 덱 목록 / 복습 세션 / 세션 결과 + 레벨업 모달 |
| 5 | Tier 2 Screens (Differentiators) | `3a20484` | D3 force-directed 그래프 뷰, 하이브리드 검색 (semantic+BM25+RRF) + AI Q&A, 게이미피케이션 프로필 |
| 6 | Tier 3 + Drawer + Supporting Pages | `7a0e221`, `c648827` | 스터디 그룹, 알림 drawer, 데모 모드 토글, 랜딩, /about, /architecture (mermaid 인터랙티브), /docs |
| 7 | Wiki Sync, E2E, Deployment | `9526d84`, `c2eb1b6` | sync-docs.mjs (documents.wiki 빌드 타임 git clone), full Actions 파이프라인, Playwright E2E 3종 |

### 실행 중 발견하고 즉시 수정한 setup 이슈

- `vite.config.ts`의 `__dirname` 미정의 → `fileURLToPath(import.meta.url)`
- vitest의 `test` 속성 타입 인식 실패 → `vitest.config.ts` 분리 + `mergeConfig`
- ESLint가 `process`/`console`/`document` 미정의로 표시 → TypeScript가 처리하도록 `no-undef` off
- `import.meta.env` 타입 누락 → `src/vite-env.d.ts`에 `/// <reference types="vite/client" />`
- `.omc/state/*`가 잘못 git에 추가됨 → `.gitignore`에 `.omc/`, `*.tsbuildinfo`, `public/docs-md/` 추가 + `git rm --cached`

---

## 5. 단계 4 — 검증 (Autopilot Phase 4 — 3-agent 병렬 review)

architect / security-reviewer / code-reviewer 서브에이전트를 병렬 dispatch.

### Architecture Review (oh-my-claudecode:architect)

- **Critical**: 0
- **Important**: 2
  - Dashboard 온보딩 체크리스트 누락 (DemoModeToast로 부분 보완 — 후속 개선 항목으로 인지)
  - Notification Drawer `system` 카테고리 탭 누락 → ✅ 수정
- **Minor**: 2 (시드 배지/카드 수 미세 차이 — 시연 영향 없음으로 인지)

### Security Review (oh-my-claudecode:security-reviewer)

- **Critical**: 0
- **Important**: 2 → ✅ 모두 수정 (`54aa4b3`)
  - **Mermaid `innerHTML` XSS** (`src/components/shared/MermaidDiagram.tsx`):
    - `mermaid.initialize`에 `securityLevel: 'strict'` 명시
    - 에러 메시지를 `innerHTML` 대신 `textContent`로 (XSS 방지)
  - **Docs slug path traversal** (`src/lib/docs-loader.ts`):
    - `DOCS` allowlist 검증 후 fetch
    - `encodeURIComponent(slug)` 적용
- **Minor**: 3 (regex ReDoS는 negated 클래스로 안전, npm audit 5 dev-only는 배포본 미영향, wiki 콘텐츠 신뢰 — 1st party 레포)

### Code Quality Review (oh-my-claudecode:code-reviewer)

- **Critical**: 0
- **HIGH**: 2 → ✅ 수정 (`de968c5`)
  - Review 키보드 핸들러 stale closure → `useCallback` + 모든 deps 명시
  - Search AI Q&A 인터벌 leak → `useRef` + cleanup useEffect
- **MEDIUM**: 2 → 1 수정 (use-reviews store 테스트 추가, 5 tests), 1 인지 (MiniSearch 매번 재구축은 10~50 노트 규모에서 무영향)
- **LOW**: 2 → ✅ 모두 수정
  - NoteEditor `getState()` 조건부 호출 → selector 패턴
  - Result 하드코딩 XP `5` → `xpForReview()` 함수 호출

### 종합

15+ 개 발견사항 중 12개 즉시 수정, 3개 인지(시연 영향 없음 / 후속 개선). 모든 수정 후 typecheck/lint/test 0 errors, 52/52 tests pass.

---

## 6. 단계 5 — 배포 (Phase 4 후속)

### 첫 배포 시도

1. `git remote add origin https://github.com/team-project-final/synapse-prototype.git`
2. `git push -u origin main` → 모든 commits 업로드
3. **첫 Actions 실행 실패** (`feat(m7)` 커밋 기준) — vitest가 Playwright e2e 파일을 시도했기 때문 → ✅ vitest config에 `exclude: ['tests/e2e/**']` 추가 (`c2eb1b6`)
4. 이후 Actions 모두 성공

### Pages 활성화 이슈

- gh-pages 브랜치는 자동 생성되었으나 **Pages 자체가 비활성화** 상태였음
- `gh api -X POST .../pages -f source[branch]=gh-pages` 로 직접 활성화
- 약 1~2분 후 라이브 URL 정상 응답

---

## 7. 단계 6 — 라이브 디버깅 (React #185 Maximum Update Depth)

배포 직후 사용자가 콘솔 에러 보고:
```
react-dom.production.min.js:188 Error: Minified React error #185
    at gi → fC → uC → Mh → Ro → nI → Ns → l1 → $a → Ro
```

### 1차 시도 (b88acbd) — 부분 수정

- `useGameStore()` (no-arg) → 명시적 primitive selectors (`(s) => s.xp`, `(s) => s.level`)
- `(s) => s.unreadCount()` (메소드 호출 selector) → `(s) => s.items.filter((i) => !i.read).length`

→ 에러 잔존. 근본 원인 미해결.

### 2차 시도 (380dfb9) — debugger 에이전트 dispatch로 근본 원인 추적

`oh-my-claudecode:debugger` 에이전트가 production preview 서버를 띄워 재현하고 두 가지 근본 원인 식별:

**원인 1 — `SeedGuard.tsx`** (모든 라우트 영향)

Zustand v5의 `useStore`는 내부적으로 `useSyncExternalStore` + `useCallback([api, selector])`로 구현. 매 렌더마다 새 인라인 selector 함수 → 새 `getSnapshot` 함수 → React가 매번 새 스냅샷으로 인식.

```typescript
// 문제 패턴
const seeded = useDemoStore((s) => s.seeded);
const setSeeded = useDemoStore((s) => s.setSeeded);
useEffect(() => {
  // 5개 store에 setState
  setSeeded(true);
}, [seeded, setSeeded]);
```

5번의 동기 setState + `seeded` deps 변경으로 effect 재실행 + 매 렌더 새 getSnapshot이 결합되어 React의 25-렌더 임계값 초과.

**수정**: 구독 제거, 명령형 `useDemoStore.getState()` 사용, 빈 deps `[]`.

**원인 2 — `Groups.tsx`** (`/app/groups` 영향)

```typescript
// 문제: 매 호출마다 새 배열 반환
const myGroups = useGroupsStore((s) => s.myGroups());
const exploreGroups = useGroupsStore((s) => s.exploreGroups());
```

`useSyncExternalStore`는 `Object.is`로 스냅샷 비교 → 새 배열 ≠ 이전 배열 → 매번 재렌더 강제 → 무한 루프.

**수정**: 안정적인 map selector + 렌더 본문에서 derived state 계산.

```typescript
const groupsMap = useGroupsStore((s) => s.groups);
const myGroups = Object.values(groupsMap).filter((g) => g.joined);
const exploreGroups = Object.values(groupsMap).filter((g) => !g.joined);
```

### 결과

`380dfb9` push → Actions 자동 빌드 → gh-pages 배포 → React #185 해소.

---

## 8. 최종 통계

| 항목 | 값 |
|------|----|
| Git 커밋 | 22+ (지속 추가 가능) |
| 소스 파일 (TS/TSX) | 80+ |
| 단위/통합 테스트 | 52 (Vitest) |
| E2E 테스트 | 3 (Playwright) |
| Zustand stores | 7 (notes/decks-cards/reviews/game/notifications/groups/demo) |
| 디자인 시스템 primitives | 6 |
| 라우트 | 19 (랜딩 + about + architecture + docs index/slug + 14 /app/*) |
| 위키 문서 | 19개 빌드 타임 자동 동기화 |
| 빌드 산출물 | ~150 파일 (`dist/`) |
| 번들 사이즈 | JS ~200KB (gzip ~65KB) |

---

## 9. 핵심 학습 / 회고

### Zustand v5 selector 안티패턴 (이번에 부딪힌 것)

Zustand v5의 `useStore` 구현 때문에 다음 패턴은 무한 업데이트 루프를 일으킨다:

1. **메소드 호출 selector**: `(s) => s.someMethod()` — 매번 새 결과 반환 시 위험
2. **`Object.values(s.x)` selector**: 매번 새 배열 → `Object.is` 실패
3. **인라인 selector + setState heavy effect**: 새 getSnapshot 매 렌더 + effect deps 변경 결합

**올바른 패턴**:
- Primitive selector: `(s) => s.someProperty`
- Map/Record selector: `(s) => s.entitiesById` (참조 안정)
- Derived state는 컴포넌트 본문에서 계산
- 장기 작업의 effect는 빈 deps + 명령형 `getState()` 활용

### Autopilot 5-Phase 흐름

`oh-my-claudecode:autopilot`이 spec/plan을 자동 감지하고 Phase 0/1을 스킵, Phase 2 Execution으로 직행. Phase 4 Validation에서 architect+security+code-reviewer를 병렬 dispatch한 게 가장 가치 높았음 — 3 관점에서 동시 검토를 통해 보안 2건/품질 4건 즉시 발견.

### 발표 시연 시나리오

1. 랜딩 (/) → Hero 카피 30초
2. "데모 시작하기" → /app (P1 김시냅스 자동 시드)
3. 대시보드에서 due 카드 13장 → "복습 시작"
4. ML 기초 덱 8장 SM-2 복습 (1/2/3/4 키보드 단축키)
5. 결과 화면 — XP 적립, 레벨업 시 파티클 + 모달
6. /app/notes/seed-n1 → "🤖 AI 카드 생성" → 큐레이션 5장 시연
7. /app/graph → 백링크 그래프 인터랙티브
8. /architecture → 시퀀스 단계 재생 다이어그램
9. /docs/05_화면_흐름_시퀀스_다이어그램 → 위키 문서 mermaid 인라인 렌더

---

## 10. 변경 이력

| 버전 | 날짜 | 비고 |
|------|------|------|
| 1.0 | 2026-05-09 | 자율 실행 1회차 — spec/plan/구현/리뷰/배포/디버깅 완주 |
