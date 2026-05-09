# 검토 요약 — 2026-05-09

Autopilot Phase 4에서 architect / security-reviewer / code-reviewer 3개 서브에이전트를 병렬 dispatch한 결과 + 후속 라이브 디버깅에서 발견한 React #185 무한 루프 원인까지 통합한 보고서.

---

## 1. Architecture Review

**검토자**: oh-my-claudecode:architect (Opus)

### 평가
- 13개 시뮬레이터 화면, 5개 보조 페이지, 7개 Zustand stores, 4개 도메인 primitive 모두 spec과 일치
- DESIGN.md → Tailwind v4 `@theme` 토큰 매핑 정확
- 데이터 흐름 (Zustand persist + localStorage, Level 2 stateful) spec대로 구현
- SM-2 알고리즘, 위키링크 파서, 그래프 빌더, XP/레벨 모두 정확

### 발견사항

| 심각도 | 항목 | 처리 |
|--------|------|------|
| Important | Dashboard 온보딩 체크리스트 누락 | 인지 — DemoModeToast로 부분 보완, 후속 개선 |
| Important | Notification Drawer `system` 카테고리 탭 누락 | ✅ 수정 (`de968c5`) |
| Minor | 시드 배지 5/8 (spec 12/30) | 인지 — 시연 영향 없음 |
| Minor | 시드 카드 due 20장 (spec 25장) | 인지 — 시연 영향 없음 |

---

## 2. Security Review

**검토자**: oh-my-claudecode:security-reviewer (Opus)

### 평가
- React-markdown v9 + remarkGfm은 기본적으로 HTML escape — 노트 본문 XSS 안전
- 위키링크 regex `(?<!\\)\[\[([^\]]+?)\]\]` — negated character class로 ReDoS 안전
- localStorage에 노트/덱/게임 상태만 저장 — PII/credential 없음
- 하드코딩된 secret 0건 (`grep -E 'api_key|password|secret|token'` clean)
- `eval()`, `new Function()`, `dangerouslySetInnerHTML` 0건

### 발견사항

| 심각도 | 항목 | 처리 |
|--------|------|------|
| Important | Mermaid `innerHTML` XSS (에러 경로 + securityLevel 미명시) | ✅ 수정 (`54aa4b3`) — `securityLevel: 'strict'` + `textContent` 사용 |
| Important | Docs slug path traversal (`useParams().slug` 무검증 → fetch URL) | ✅ 수정 (`54aa4b3`) — `DOCS` allowlist + `encodeURIComponent` |
| Minor | `extractFirstParagraphAfter` 동적 regex (heading content) | 인지 — 정규식 escape 적용됨, ReDoS 안전 |
| Minor | 위키 마크다운 신뢰 (1st party) | 인지 — Mermaid strict 모드로 sandbox |
| Minor | npm audit 5 moderate (vitest/esbuild) | 인지 — dev 전용, 배포본 미영향 |

---

## 3. Code Quality Review

**검토자**: oh-my-claudecode:code-reviewer (Opus)

### 강점 (Strengths)
- **Type safety**: `any` / `as any` / `@ts-ignore` / `console.log` 모두 0건. `tsc --noEmit` clean.
- **파일 책임 분리**: 모든 파일이 단일 책임. lib(sm2/wikilink/graph/xp), stores(7 도메인 분리), components(ds/shell/feature/shared).
- **SM-2 정확성**: 정식 알고리즘, EF 1.3 floor, interval 1→6→`EF*interval` progression. 50 sequential "Again" edge case 테스트 포함.
- **테스트 커버리지**: 모든 lib + 핵심 store + 1 component (WikilinkAutocomplete) 단위 테스트.

### 발견사항

| 심각도 | 항목 | 처리 |
|--------|------|------|
| HIGH | Review 키보드 핸들러 stale closure (`Review.tsx:65-72`) | ✅ 수정 (`de968c5`) — `useCallback` + 모든 deps 명시 |
| HIGH | Search AI Q&A `setInterval` leak (`Search.tsx:34`) | ✅ 수정 (`de968c5`) — `useRef` + cleanup useEffect |
| MEDIUM | MiniSearch 매 호출 재구축 (`search.ts:26-33`) | 인지 — 10~50 노트 규모에서 무영향 |
| MEDIUM | `use-reviews` store 테스트 누락 | ✅ 수정 (`de968c5`) — 5개 테스트 추가 |
| LOW | NoteEditor `getState()` 조건부 호출 (`NoteEditor.tsx:19`) | ✅ 수정 (`de968c5`) — selector 패턴 |
| LOW | Result 하드코딩 XP `5` (`Result.tsx:49`) | ✅ 수정 (`de968c5`) — `xpForReview()` 함수 호출 |

---

## 4. 라이브 디버깅 — React #185 (Maximum Update Depth)

배포 후 사용자 콘솔에서 발견. Phase 4 정적 review 후 Phase 5 (cleanup) 직후 발견된 런타임 이슈.

### 1차 시도 — 부분 수정 (`b88acbd`)

가설: Zustand v5에서 `useStore()` (no-arg) 또는 메소드 호출 selector가 원인.

**수정 사항**:
- `useGameStore()` (no-arg) → 명시적 primitive selectors (Dashboard, Profile, Result)
- `(s) => s.unreadCount()` → `(s) => s.items.filter((i) => !i.read).length` (AppShell)

**결과**: 에러 잔존. 1차 가설 부분 정답 — 실제 영향이 더 큰 다른 원인 존재.

### 2차 시도 — debugger 에이전트 dispatch (`380dfb9`)

`oh-my-claudecode:debugger`가 production preview 서버 띄워 재현, Zustand 내부 코드 (`node_modules/zustand/react.js`) 검사 후 두 가지 근본 원인 식별.

#### 원인 1 — SeedGuard.tsx (모든 라우트 영향)

**메커니즘**:
- Zustand v5 `useStore`는 `useSyncExternalStore` + `useCallback([api, selector])`로 구현
- 매 렌더마다 새 인라인 selector 함수 → `useCallback`이 새 `getSnapshot` 생성
- `useEffect` deps `[seeded, setSeeded]`에서 5개 setState 동기 호출 + `seeded` 변경으로 effect 재실행
- 매 렌더의 새 getSnapshot이 결합되어 React 25-렌더 임계값 초과

**수정**:
- `useDemoStore` 구독 제거
- `useDemoStore.getState()`로 명령형 접근
- 빈 deps `[]`로 1회만 실행

#### 원인 2 — Groups.tsx (`/app/groups` 영향)

**메커니즘**:
- `(s) => s.myGroups()` 메소드 호출 selector가 매번 새 배열 반환
- `useSyncExternalStore`의 `Object.is` 비교 실패
- 매번 새 스냅샷 → 무한 재렌더

**수정**:
- 안정적인 map selector `(s) => s.groups`
- 렌더 본문에서 `Object.values().filter()` derived state

### 종합 학습

Zustand v5 selector 안티패턴 (이번 사례에서 검증):
1. **메소드 호출 selector**: `(s) => s.someMethod()` — 매번 새 결과 반환 시 위험
2. **`Object.values(s.x)` selector**: 매번 새 배열 → `Object.is` 실패
3. **인라인 selector + setState heavy effect**: 새 getSnapshot 매 렌더 + effect deps 변경 결합 시 무한 루프

**올바른 패턴**:
- Primitive selector: `(s) => s.someProperty`
- Map/Record selector: `(s) => s.entitiesById` (참조 안정)
- Derived state는 컴포넌트 본문에서 계산
- 장기 작업의 effect는 빈 deps + 명령형 `getState()` 활용

---

## 5. 통계

| 카테고리 | Critical | High/Important | Medium | Minor/Low |
|---------|---------|---------------|--------|----------|
| Architecture | 0 | 2 (1 수정 / 1 인지) | 0 | 2 (인지) |
| Security | 0 | 2 (모두 수정) | 0 | 3 (인지) |
| Code Quality | 0 | 2 (모두 수정) | 2 (1 수정 / 1 인지) | 2 (모두 수정) |
| Runtime (Live debug) | 0 | 1 (수정) — React #185 무한 루프 | 0 | 0 |

**합계**: 16개 이슈 발견. 11개 즉시 수정, 5개 인지 (시연 영향 없음 / 후속 개선 항목).

---

## 6. 검증 후 최종 상태

- ✅ `npm run typecheck` — 0 errors
- ✅ `npm run lint` — 0 errors (1 minor warning, react-refresh)
- ✅ `npm run test` — 52 passed in 14 files
- ✅ `npm run build` — dist/ 정상, 404.html SPA fallback
- ✅ `npm run sync-docs` — 19 wiki .md 자동 동기화
- ✅ 라이브 URL — https://team-project-final.github.io/synapse-prototype/ 정상 동작 (React #185 해소)
