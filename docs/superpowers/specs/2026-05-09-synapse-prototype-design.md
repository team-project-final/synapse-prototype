# Synapse 인터랙티브 프로토타입 사이트 — 설계 문서

| 항목 | 값 |
|------|----|
| 문서 ID | 2026-05-09-synapse-prototype-design |
| 작성일 | 2026-05-09 |
| 상태 | Draft (사용자 리뷰 대기) |
| 대상 레포 | https://github.com/team-project-final/synapse-prototype.git |
| 배포 URL (예정) | https://team-project-final.github.io/synapse-prototype/ |
| 소스 위치 | `D:\workspace\final-project-syn\page\` |
| 참조 자료 | `documents.wiki/` (18개 위키 문서), `syn/DESIGN.md` (디자인 시스템), `syn/CLAUDE.md` |

---

## 1. 목표와 정체성

### 1.1 한 줄 정의

Synapse 팀 프로젝트의 핵심 가치를 5분 안에 직접 체험·이해할 수 있는, GitHub Pages에 배포되는 단일 React SPA.

### 1.2 3대 청중 / 사용 시나리오

| 청중 | 시나리오 | 진입 경로 |
|------|----------|-----------|
| 발표 평가자 | 랜딩 → 30초 컨텍스트 → /app 5분 데모 → /architecture로 마무리 | 가이드형 |
| 잠재 사용자 / 동료 | 랜딩 Hero에 끌려 "데모 시작" → 자유 탐색 | 자율 탐색형 |
| 신규 팀원 / 기여자 | /docs로 18개 위키 문서 탐색 → /architecture로 시퀀스 학습 | 학습형 |

### 1.3 핵심 메시지 — 3중 시연

`syn/DESIGN.md`에 정의된 메모러블 카피:
> "노트를 쓰면 AI가 카드를 만들어주고, 복습하면 노트가 다시 살아난다"

이 메시지를 다음 세 곳에서 반복적으로 시연한다:
- (a) 랜딩 Hero 카피
- (b) `/app`의 시뮬레이션 가능한 동선 (노트 작성 → AI 카드 → 복습)
- (c) `/architecture`의 시퀀스 다이어그램 (5.3 노트 작성 / 5.4 AI 카드 / 5.5 복습)

### 1.4 비목표 (Out of Scope)

- 실제 백엔드 호출 — 전부 클라이언트 사이드 mock
- 인증 / 결제 / 멀티테넌시 실구현 — UI만 시연
- 모바일 네이티브 빌드 — Web 반응형으로 모바일 시연
- 실제 OpenAI / Stripe / OAuth 연동
- SEO 최적화 (subpath 배포 + SPA 특성상 우선순위 낮음)

### 1.5 옵션 의사결정 요약 (대화 이력)

| 결정 사항 | 선택 |
|----------|------|
| 사이트 정체성 | A 쇼케이스 + B 클릭형 프로토타입 + C Living Docs 통합 (옵션 D) |
| 깊이/우선순위 | B를 메인으로, A·C는 보조 (옵션 2) |
| 화면 범위 | 핵심 + 차별화 12~13 화면 (Tier B) |
| 시뮬레이션 모드 | 자유 탐색 (모드 B) |
| 상태 지속성 | 레벨 2 — localStorage 기반 세션 상태 |
| 레포 전략 | 새 레포 생성 (옵션 B) — `synapse-prototype` |
| 기술 스택 | Vite + React 18 + Tailwind + TypeScript |
| 뷰포트 | 반응형 단일 설계 (옵션 2) |
| IA / 진입 흐름 | 랜딩 → /app 진입형 (옵션 2) |
| 로그인 처리 | 스킵, 바로 대시보드 (a-2) |
| /about, /architecture | 분리 (b-1) |

---

## 2. 정보 아키텍처

### 2.1 URL 구조

```
/                              랜딩 페이지 (Hero + 차별점 3섹션 + CTA)
/app                           시뮬레이터 — 메인 대시보드 (로그인 스킵)
/app/notes                     노트 목록
/app/notes/new                 노트 신규 작성
/app/notes/:id                 노트 상세 (백링크 패널)
/app/notes/:id/edit            노트 에디터 (위키링크 자동완성)
/app/decks                     덱 목록 ([복습 시작] 클릭 시 /review로 직행)
/app/decks/:id/review          복습 세션 (스와이프 + 난이도)
/app/decks/:id/review/result   세션 결과 + XP/레벨업
/app/ai/generate?noteId=:id    AI 카드 생성 (mock 지연 + 미리보기)
/app/graph                     그래프 뷰 (D3.js, 동적)
/app/search                    통합 검색 + AI Q&A
/app/profile                   게이미피케이션 프로필
/app/groups                    스터디 그룹 목록
/about                         프로젝트 소개 (기획서/KPI/페르소나/비즈니스 모델)
/architecture                  시스템 아키텍처 + ERD + 시퀀스 다이어그램 (인터랙티브)
/docs                          위키 문서 인덱스 (18개)
/docs/:slug                    개별 위키 문서 (마크다운 + mermaid 인라인)
```

### 2.2 전역 네비게이션 (반응형)

| 영역 | Desktop (>1024px) | Tablet (640~1024) | Mobile (<640) |
|------|-------------------|-------------------|---------------|
| `/` 랜딩 | 상단 메뉴: Synapse 로고 / 데모 / 프로젝트 / 아키텍처 / 문서 / GitHub | 동일 (압축) | 햄버거 메뉴 |
| `/app/*` | 좌측 고정 사이드바 240px (수납 시 56px) + 상단바 (검색/알림/프로필) | 접이식 사이드바 + 상단바 | 바텀 네비 4탭 (홈/노트/복습/더보기) + 상단바 |
| `/about`, `/architecture`, `/docs/*` | 상단 메뉴 + 좌측 TOC 사이드바 | 동일 | 햄버거 + 본문 |

### 2.3 전역 컴포넌트

- 우상단 토글: `[ 자유 탐색 모드 ON ]` ↔ `[ 데모 초기화 ]`
- `/app` 첫 진입 시 토스트: "데모 모드 — 자유롭게 둘러보세요. 우상단에서 초기화 가능."
- 어디서든 "데모 모드 보기"로 인증 화면(SCR-W-AUTH-*)도 한 번 시연 가능 (선택 토글)
- 알림 drawer: 우상단 🔔 클릭 → 우측 슬라이드인

---

## 3. 시뮬레이터 화면 목록 (13개)

화면 정의서(06번)의 화면 ID를 기준으로 선정. 모든 화면은 자유 탐색 가능, localStorage 상태 반영.

### 3.1 Tier 1 — 핵심 PKM-SRS-AI 루프 (8개)

| # | URL | 화면 | 핵심 인터랙션 |
|---|-----|------|--------------|
| 1 | `/app` | 메인 대시보드 (SCR-W-DASH-001) | 오늘의 복습 카드 수 (실시간), 학습 통계 (XP/스트릭), 최근 노트 5개 / 첫 진입 시 온보딩 체크리스트 (3단계: 첫 노트→첫 카드→첫 복습) |
| 2 | `/app/notes` | 노트 목록 (SCR-W-NOTE-001) | 검색·태그 필터·정렬, 사용자가 만든 노트 즉시 반영 |
| 3 | `/app/notes/new`, `/app/notes/:id/edit` | 노트 에디터 (SCR-W-NOTE-002) | 마크다운 입력, `[[` 입력 시 위키링크 자동완성, 저장 시 백링크 자동 갱신, 3초 디바운스 자동 저장 |
| 4 | `/app/notes/:id` | 노트 상세 (SCR-W-NOTE-003) | 마크다운 렌더링 (코드 하이라이팅), 우측 백링크 패널, [🤖 AI 카드 생성] CTA |
| 5 | `/app/ai/generate?noteId=...` | AI 카드 생성 (SCR-W-CARD-004) | 노트 선택 → 로딩 스켈레턴 (2~3초 mock 지연) → 5장 미리보기 → 체크박스 선택 → 덱에 저장 |
| 6 | `/app/decks` | 덱 목록 (SCR-W-CARD-001) | 덱 카드 + 진행도 바, [복습 시작] 버튼 |
| 7 | `/app/decks/:id/review` | 복습 세션 (SCR-W-CARD-005) | 카드 앞면 → [답 보기] → 뒷면 + 4단계 난이도 (Again/Hard/Good/Easy), SM-2 알고리즘 실제 계산 → 다음 카드. Mobile = 좌우 스와이프, Desktop = 1/2/3/4 키보드 단축키 |
| 8 | `/app/decks/:id/review/result` | 세션 결과 (SCR-W-CARD-006) | 정확도/소요시간/다음 복습 예정, XP 적립 애니메이션, 레벨업 시 축하 모달 (LevelUpCelebration) |

### 3.2 Tier 2 — 차별화 기능 (3개)

| # | URL | 화면 | 핵심 인터랙션 |
|---|-----|------|--------------|
| 9 | `/app/graph` | 그래프 뷰 (SCR-W-GRAPH-001) | D3.js force layout, 사용자 노트의 실제 백링크로 동적 생성, 노드 클릭 시 하단 패널 (PageRank/연결수/카드수), 줌/패닝 |
| 10 | `/app/search` | 통합 검색 + AI Q&A (SCR-W-SEARCH-001) | 키워드 매칭 + 시맨틱 점수 (cosine 유사도 — 미리 계산된 시드 임베딩), 하이브리드 RRF 결합 결과. AI Q&A 탭은 미리 정의된 답변 스트리밍 시뮬레이션 |
| 11 | `/app/profile` | 게이미피케이션 프로필 (SCR-W-GAME-001) | 레벨/XP 바, 배지 갤러리 (획득/미획득 grayscale), 스트릭 🔥, 이번 주 학습 현황 |

### 3.3 Tier 3 — 커뮤니티 (1개) + 알림 (Drawer)

| # | URL | 화면 | 핵심 인터랙션 |
|---|-----|------|--------------|
| 12 | `/app/groups` | 스터디 그룹 목록 (SCR-W-COMM-001) | 내 그룹 + 그룹 탐색 탭, 그룹 카드 (멤버 수/공유 덱/마지막 활동). [입장하기] 클릭 시 안내 페이지: "이 화면은 데모에서 미구현 — 06_화면_기능_정의서 참조" |
| 13 | (전역 drawer) | 알림 센터 (SCR-W-NOTI-001) | 우상단 🔔 클릭 → 우측 슬라이드인 drawer. 카테고리 탭 (전체/복습/커뮤니티/성취). 시드 알림 5~7개 + 사용자 행동에 따라 동적 추가 (예: 레벨업 시 알림 1개 추가) |

### 3.4 시뮬레이션 깊이 매트릭스

| 화면 / 기능 | 현실감 |
|------------|--------|
| 노트 작성 / 저장 / 위키링크 | ★★★★★ (실제 동작) |
| AI 카드 생성 | ★★★★ (mock 지연 + 시드 노트는 큐레이션, 신규 노트는 동적 생성) |
| SM-2 복습 | ★★★★★ (알고리즘 정식 구현) |
| 그래프 뷰 | ★★★★★ (사용자 노트로 동적 생성) |
| 시맨틱 검색 | ★★★ (시드 코퍼스는 임베딩+키워드 결합, 신규 노트는 키워드만) |
| 스터디 그룹 (입장 후) | ★ (안내 페이지) |

Tier 3의 의도된 깊이 차이: 발표 5분 안에 "왜 Synapse가 다른가"를 보이려면 핵심 루프(★★★★★)에 화력 집중, 커뮤니티는 "기능이 설계되어 있다"는 시연으로 충분.

---

## 4. 기술 스택 & 폴더 구조

### 4.1 의존성

```
런타임:
- Vite 5
- React 18 + TypeScript 5 (strict)
- React Router v7 (data router 모드)
- Zustand 5 (상태 관리, persist middleware로 localStorage)
- Tailwind CSS v4 (@theme directive로 DESIGN.md 토큰 매핑)
- @fontsource/fraunces, @fontsource/plus-jakarta-sans, @fontsource/geist-mono
- D3.js v7 (그래프 뷰)
- mermaid v11 (/architecture, /docs 다이어그램)
- react-markdown + remark-gfm + rehype-highlight (마크다운 렌더링)
- minisearch (한국어 친화 클라이언트 사이드 검색)
- date-fns (날짜 포맷)
- ulid (ID 생성)

개발 / 품질:
- Vitest + @testing-library/react (단위/통합 테스트)
- Playwright (E2E — 핵심 플로우 1~2개)
- ESLint + Prettier
- TypeScript strict mode
```

### 4.2 폴더 구조

```
page/
├── .github/workflows/deploy.yml      GitHub Actions: build → gh-pages
├── public/
│   ├── fonts/                        @fontsource 빌드 시 자동 복사
│   └── docs-md/                      18개 위키 *.md 빌드 타임 sync (스크립트)
├── src/
│   ├── main.tsx                      진입점
│   ├── App.tsx                       Router 정의
│   ├── routes/
│   │   ├── landing.tsx               /
│   │   ├── about.tsx                 /about
│   │   ├── architecture.tsx          /architecture
│   │   ├── docs/
│   │   │   ├── index.tsx             /docs
│   │   │   └── [slug].tsx            /docs/:slug
│   │   └── app/
│   │       ├── layout.tsx            사이드바/바텀네비 공통 셸
│   │       ├── dashboard.tsx         /app
│   │       ├── notes/{list,new,[id]/{view,edit}}.tsx
│   │       ├── decks/{list,[id]/{review,result}}.tsx
│   │       ├── ai/generate.tsx
│   │       ├── graph.tsx
│   │       ├── search.tsx
│   │       ├── profile.tsx
│   │       └── groups.tsx
│   ├── components/
│   │   ├── ds/                       Button, Card, Input, Badge, Toast, Dialog (디자인 시스템)
│   │   ├── shell/                    AppShell, Sidebar, BottomNav, AppBar, NotificationDrawer
│   │   ├── feature/                  WikilinkAutocomplete, FlashCard, GraphCanvas, XPProgressBar, BadgeIcon, StreakFlame, CelebrationParticles
│   │   └── shared/                   MarkdownRenderer, MermaidDiagram, DemoModeToast, ResetButton
│   ├── stores/                       Zustand stores (각각 persist)
│   │   ├── use-notes.ts
│   │   ├── use-decks-cards.ts
│   │   ├── use-reviews.ts            세션 + 카드별 SRS 상태
│   │   ├── use-game.ts               XP/레벨/배지/스트릭
│   │   ├── use-notifications.ts
│   │   ├── use-groups.ts
│   │   └── use-demo.ts               데모 모드 / 초기화
│   ├── data/
│   │   ├── seed.ts                   P1 "개발자 김시냅스" 페르소나 시드
│   │   ├── ai-templates.ts           시드 노트별 큐레이션된 카드 + 동적 fallback 템플릿
│   │   ├── search-corpus.ts          검색 시드 코퍼스 + TF-IDF 근사 임베딩
│   │   └── notifications-seed.ts
│   ├── lib/
│   │   ├── sm2.ts                    SM-2 알고리즘
│   │   ├── wikilink.ts               [[…]] 파서 + 백링크 추출
│   │   ├── graph.ts                  노트 → 노드/엣지 변환
│   │   ├── xp.ts                     XP/레벨/배지 평가
│   │   └── markdown.ts               마크다운 → HTML
│   └── styles/globals.css            Tailwind directives + @theme 토큰
├── scripts/
│   └── sync-docs.mjs                 documents.wiki/*.md → public/docs-md/ 복사
├── tests/                            Vitest + Playwright
├── index.html
├── vite.config.ts                    base: "/synapse-prototype/"
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### 4.3 핵심 설계 원칙

1. **Routes = Pages**, **Stores = Domain**, **Components = UI building blocks** — 명확한 3축 분리
2. **Zustand persist + localStorage**: 각 store가 독립 키 (`synapse:notes`, `synapse:decks` 등) 로 저장, 데모 초기화 시 일괄 clear
3. **시드 데이터 분리**: `data/seed.ts`는 페르소나 P1 (개발자 김시냅스) 기준 — 진입 시 빈 상태 회피
4. **18개 위키 문서**: 빌드 타임에 `public/docs-md/`로 sync (스크립트), 런타임 fetch
5. **Vite `base` = repo 이름** (`/synapse-prototype/`) — GitHub Pages subpath 대응

---

## 5. 상태 / 데이터 모델 / Mock 로직

### 5.1 Zustand Stores

각 store는 `persist` middleware로 localStorage에 자동 저장. 키 prefix `synapse:`.

```typescript
// use-notes.ts
type Note = {
  id: string;                  // ulid
  title: string;
  contentMd: string;
  tags: string[];
  outgoingLinks: string[];     // wikilink target IDs
  createdAt: number;
  updatedAt: number;
};
type NotesStore = {
  notes: Record<string, Note>;
  upsert(note): void;
  remove(id): void;
  byTag(tag): Note[];
  backlinksOf(noteId): Note[]; // outgoingLinks 역추적
};

// use-decks-cards.ts
type Card = {
  id: string;
  deckId: string;
  type: 'basic' | 'cloze';
  front: string;
  back: string;
  sourceNoteId?: string;
  srs: {
    ef: number;            // easiness factor (default 2.5)
    interval: number;      // days
    due: number;           // timestamp
    repetitions: number;
    lastReviewed: number | null;
  };
  status: 'new' | 'learning' | 'review';
};
type Deck = { id: string; name: string; description: string };

// use-reviews.ts
type Session = {
  id: string;
  deckId: string;
  cardIds: string[];
  currentIndex: number;
  ratings: Array<{ cardId: string; rating: 1 | 2 | 3 | 4; timeMs: number }>;
  startedAt: number;
  endedAt: number | null;
};

// use-game.ts
type GameState = {
  xp: number;
  level: number;
  title: string;
  streak: { current: number; longest: number; lastActiveDate: string };
  badges: Record<string, { earnedAt: number | null }>;
  weeklyStats: { reviewed: number; notesCreated: number; xpGained: number };
};

// use-notifications.ts — drawer
// use-groups.ts — Tier 3 정적 시드
// use-demo.ts — 데모 모드 토글 / reset()
```

### 5.2 시드 데이터 (페르소나 P1 "개발자 김시냅스")

`data/seed.ts`. `/app` 첫 진입 시 store가 비어있으면 시드 주입.

```
시드 노트 (10개) — 백링크가 자연스럽게 형성되도록 설계
  - "ML 정규화 기법" → [[과적합]], [[L1 정규화]], [[L2 정규화]], [[드롭아웃]]
  - "과적합" → [[정규화]], [[교차검증]]
  - "TCP/UDP 비교" (단독)
  - "디자인 패턴" → [[싱글톤]], [[옵저버 패턴]]
  - 기타 6개

시드 덱 (3개)
  - "프로그래밍" (12장)
  - "ML 기초" (8장)
  - "AWS SAA" (10장)

시드 카드 (30장)
  - 일부 due_date < now (오늘 복습 대상 25장 — 06번 화면 정의서 목업과 일치)
  - 각 카드는 sourceNoteId 연결되어 "출처 노트" 클릭 가능

시드 게임 상태
  - XP 3,240 / 레벨 7 / 칭호 "지식 탐험가" (스토리보드 P1 일치)
  - 연속 학습 14일
  - 획득 배지 12 / 30

시드 알림 (5~7개)
  - "🏆 레벨업! 지식 탐험가" 1시간 전
  - "📚 AWS 자격증 스터디에 새 덱 공유됨" 3시간 전
  - "🔔 오늘 복습 25장" 오전 9시
```

### 5.3 핵심 Mock 로직

| 기능 | 구현 |
|------|------|
| 위키링크 자동완성 | `[[` 입력 감지 → notes 스토어 검색 → 드롭다운. 미존재 제목 입력 시 "+ 새 노트로 만들기" 옵션 |
| 백링크 갱신 | 노트 저장 시 `lib/wikilink.ts`가 outgoingLinks 추출 → store update → `backlinksOf()` 자동 반영 |
| AI 카드 생성 | (1) 시드 노트는 `data/ai-templates.ts`에 큐레이션된 결과 우선 사용 (발표 임팩트 보장). (2) Fallback: 노트 본문 H2/H3 + 첫 문단을 정규식 추출 → 5쌍 Q/A 동적 생성. (3) 정의 패턴 ("X는 …이다") 발견 시 cloze 카드. (4) 2~3초 지연 시뮬레이션 + 스켈레턴 UI |
| SM-2 SRS | `lib/sm2.ts` 정식 구현. rating에 따라 EF/interval/repetitions 계산 → 카드 store 업데이트 |
| 시맨틱 검색 | (1) 시드 코퍼스에 미리 계산된 임베딩 (TF-IDF 기반 8차원 근사). (2) 사용자 쿼리도 동일 방식 벡터화 → cosine 유사도. (3) BM25 키워드 결과는 minisearch가 담당. (4) RRF로 결합. (5) 사용자 신규 노트는 키워드 매칭만 |
| 그래프 뷰 | `lib/graph.ts`가 notes의 outgoingLinks → D3 force layout 노드/엣지로 변환. 노드 크기 = 연결 수, 색상 = 카드 보유 여부. 사용자 변경 시 즉시 반영 |
| 레벨업 / 배지 | `use-game.ts`가 review submit 이벤트 구독 → XP +5, 레벨 정의 매트릭스 조회 → 레벨업 시 LevelUpCelebration 모달 트리거 + 알림 추가. 배지는 criteria 평가 함수 (예: "연속 학습 7일") |
| 데모 초기화 | `use-demo.ts`의 `reset()` → 모든 store clear → seed 재주입 → toast "데모가 초기화되었습니다" |

### 5.4 데이터 흐름

```
사용자 액션 → Zustand action → React UI 즉시 반영
                 │ persist
                 ▼
           localStorage (synapse:*)

특수 흐름:
- 노트 저장 → wikilink 파싱 → outgoingLinks 갱신 → backlinksOf() 즉시 반영 → 그래프 자동 재계산
- 복습 카드 submit → SM-2 계산 → 카드 store 업데이트 → use-game이 이벤트 받아 XP/레벨 계산 → 알림 추가
```

---

## 6. 레포 셋업 / GitHub Actions / 배포

### 6.1 레포

- **이름**: `team-project-final/synapse-prototype`
- **URL**: https://github.com/team-project-final/synapse-prototype.git
- **공개**: Public (포트폴리오 가치)

### 6.2 발행 전략

```
main 브랜치    → 소스 코드 (page/ 폴더의 모든 파일이 main의 root에 위치)
gh-pages 브랜치 → 빌드 산출물 (Vite dist/)

GitHub Pages 설정:
  Settings > Pages > Source: "Deploy from a branch"
  Branch: gh-pages, /(root)

배포 URL: https://team-project-final.github.io/synapse-prototype/
```

**왜 gh-pages 브랜치 분리?**
- main = 깨끗한 소스 코드 (PR 리뷰 대상)
- gh-pages = 자동 푸시되는 산출물 (커밋 히스토리 신경 안 써도 됨)
- 추후 GitHub Actions Pages 직접 배포로 마이그레이션 옵션 보존

### 6.3 GitHub Actions 워크플로우

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: write
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run sync-docs       # documents.wiki에서 *.md 가져오기 (6.4)
      - run: npm run typecheck
      - run: npm run test            # vitest --run
      - run: npm run build           # vite build → dist/
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: gh-pages
```

### 6.4 18개 위키 문서 동기화 — 옵션 B (빌드 시 git clone)

`scripts/sync-docs.mjs`가 GitHub Actions 안에서:
1. `git clone https://github.com/team-project-final/documents.wiki.git /tmp/synapse-wiki`
2. `*.md` 파일을 `public/docs-md/`로 복사 (frontmatter 자동 추가: slug, title)
3. `Home.md`는 `index.md`로 변환 (라우팅 정리)
4. `documents.wiki`가 private이면 PAT 필요 — 현재 public 가정 (사용자 확인 항목)

### 6.5 SPA 라우팅 / 404 처리

GitHub Pages 정적 호스팅 한계 우회:

```
build 후 dist/index.html을 dist/404.html로 복사
→ /app/notes/123 새로고침 시 GitHub Pages가 404.html 반환
→ index.html과 동일하므로 SPA 부팅
→ React Router가 URL 처리
```

`package.json`의 build script에 `cp dist/index.html dist/404.html` 포함.

### 6.6 핵심 빌드 설정

```typescript
// vite.config.ts
export default defineConfig({
  base: '/synapse-prototype/',
  build: { outDir: 'dist', sourcemap: true },
  // ...
});
```

```json
// package.json scripts
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build && cp dist/index.html dist/404.html",
  "preview": "vite preview --base /synapse-prototype/",
  "sync-docs": "node scripts/sync-docs.mjs",
  "typecheck": "tsc --noEmit",
  "test": "vitest --run",
  "lint": "eslint . --ext ts,tsx"
}
```

### 6.7 첫 배포 체크리스트

```
1. team-project-final organization에서 synapse-prototype 레포 생성 (Public)
2. 로컬 page/ 폴더를 git init → remote 연결 → main push
3. Settings > Pages > Source: gh-pages branch / (root)
4. 첫 push 시 GitHub Actions 자동 실행 → gh-pages 브랜치 자동 생성
5. 약 2~3분 후 https://team-project-final.github.io/synapse-prototype/ 접속 확인
6. /app, /about, /architecture, /docs 모든 라우트 새로고침해도 정상 동작 확인 (404.html SPA fallback)
7. README.md에 데모 URL + 로컬 개발 방법 추가
```

---

## 7. 테스트 전략

### 7.1 단위 테스트 (Vitest)

- `lib/sm2.ts` — SM-2 알고리즘 (rating별 EF/interval 계산 검증)
- `lib/wikilink.ts` — `[[…]]` 파서 + 백링크 추출
- `lib/graph.ts` — 노트 → 노드/엣지 변환
- `lib/xp.ts` — XP/레벨/배지 평가
- `stores/*` — Zustand action별 상태 변화 (특히 노트 저장 시 백링크 자동 갱신)

### 7.2 통합 테스트 (@testing-library/react)

- 노트 작성 → 저장 → 노트 목록에 즉시 반영
- 위키링크 자동완성 동작
- AI 카드 생성 → 미리보기 → 덱에 저장
- 복습 세션 → 난이도 선택 → 다음 카드 진행 → 결과 화면 XP 적립

### 7.3 E2E (Playwright, 선택적)

- 핵심 플로우 1: 노트 작성 → AI 카드 생성 → 복습 1사이클 (Tier 1 전체)
- 핵심 플로우 2: 그래프 뷰에서 노드 클릭 → 노트 상세 이동

### 7.4 시각/접근성

- DESIGN.md 일치 검증: Tailwind `@theme` 토큰이 DESIGN.md 색상/타이포 정확히 반영
- WCAG 2.1 AA 색 대비 (4.5:1) — Stone neutrals + Warm Amber 조합 자동 검증 가능
- 키보드 탐색 (복습 화면 1/2/3/4 단축키 포함)

---

## 8. 리스크 및 완화

| 리스크 | 영향 | 완화 |
|--------|------|------|
| documents.wiki가 private → CI clone 실패 | 빌드 실패 | PAT를 GitHub secret에 등록, sync-docs.mjs가 토큰 사용 |
| D3.js 그래프 노드 수 증가 시 성능 저하 | 그래프 뷰 끊김 | 시드 노트 10개 + 사용자 추가 분 합쳐 50개 미만 가정. 초과 시 force simulation alpha decay 조정 |
| 발표 시 데모 데이터 오염 | 즉흥 데모 실패 | 우상단 [데모 초기화] 버튼 항상 노출, 발표 직전 새로고침으로 시드 보장 |
| LocalStorage 용량 (5~10MB) 초과 | 데이터 손실 | 노트 본문 큰 노트 제한 안내, 텍스트만 저장 (이미지 X) |
| GitHub Pages subpath 라우팅 실수 | 404 | Vite base + Router basename + 404.html fallback 3중 안전망 |
| AI 카드 생성 동적 fallback 품질 낮음 | 발표 인상 약화 | 시드 노트는 100% 큐레이션, 사용자 신규 노트만 동적 — 발표 시나리오는 시드 노트로 시연 |

---

## 9. 다음 단계

이 spec 문서가 사용자 검토를 통과하면 `superpowers:writing-plans` 스킬로 넘어가 단계별 구현 계획서를 작성한다. 구현 계획서는 다음을 포함한다:

- 마일스톤별 작업 단위 (예: M1 셋업 / M2 디자인 시스템 / M3 Tier 1 화면 / M4 Tier 2 / M5 Tier 3 + Drawer / M6 보조 페이지 / M7 배포 및 폴리싱)
- 각 단위의 acceptance criteria
- 의존성 / 순서
- 테스트 시점

---

## 변경 이력

| 버전 | 날짜 | 변경 |
|------|------|------|
| 0.1 | 2026-05-09 | 최초 Draft (브레인스토밍 세션 산출물) |
