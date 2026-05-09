# Synapse Prototype

> Synapse 팀 프로젝트의 인터랙티브 시뮬레이터 + Living Documentation 사이트.

**🌐 라이브 데모**: https://team-project-final.github.io/synapse-prototype/

## 빠른 시작

```bash
npm install
npm run dev      # http://localhost:5173/synapse-prototype/
```

## 무엇이 있나

- **/** — 랜딩 페이지 (Hero + 차별점 3섹션 + CTA)
- **/app** — 시뮬레이터 진입 (P1 김시냅스 시드 자동 주입, 자유 탐색)
  - `/app` 대시보드 / `/app/notes` 노트 목록·에디터·상세 / `/app/decks` 덱·복습·결과
  - `/app/ai/generate` AI 카드 생성 / `/app/graph` D3 백링크 그래프
  - `/app/search` 시맨틱+키워드 하이브리드 검색 + AI Q&A
  - `/app/profile` 게이미피케이션 / `/app/groups` 스터디 그룹
- **/about** — 프로젝트 소개 (배경 / 목표 / 페르소나 / 비즈니스 모델)
- **/architecture** — 시스템 아키텍처 + 시퀀스 단계 재생 (mermaid 인터랙티브)
- **/docs/:slug** — 18개 위키 문서 (빌드 타임 동기화, mermaid 인라인 렌더)

## 시뮬레이션 깊이

- **Level 2 stateful**: localStorage 영속화. 노트 작성·AI 카드 생성·복습·XP 적립이 실제로 동작하고 새로고침해도 유지됨.
- **데모 초기화**: 우상단 "초기화" 버튼으로 시드 데이터로 복원.

## 스크립트

```
npm run dev          개발 서버
npm run build        프로덕션 빌드 (dist/, post-build로 404.html SPA fallback 생성)
npm run preview      빌드 결과 미리보기
npm run typecheck    TypeScript strict 검증
npm run test         Vitest 단위/통합 (47 + 5 reviews = 52 tests)
npm run test:e2e     Playwright E2E (3 tests)
npm run lint         ESLint
npm run sync-docs    documents.wiki → public/docs-md/ 동기화 (18 markdown)
```

## 기술 스택

- **런타임**: Vite 6, React 18.3, TypeScript 5 strict
- **라우팅**: React Router 7 (unified package)
- **상태**: Zustand 5 with persist + localStorage
- **스타일**: Tailwind CSS v4 (`@theme`로 DESIGN.md 토큰)
- **시각화**: D3.js v7 (force-directed graph), mermaid v11 (sequence diagrams)
- **마크다운**: react-markdown + remark-gfm + rehype-highlight
- **검색**: minisearch (BM25) + 시드 임베딩 cosine + RRF
- **폰트**: @fontsource (Fraunces / Plus Jakarta Sans / Geist Mono)
- **테스트**: Vitest + @testing-library/react + Playwright

## 디자인 시스템

`syn/DESIGN.md`의 Warm Intellectual 미학을 Tailwind v4 `@theme`으로 옮김. Warm Amber #D97706 액센트, Fraunces 세리프 디스플레이, Plus Jakarta Sans 본문, Geist Mono 코드. 6개 ds primitives (Button/Card/Input/Badge/Toaster/Dialog) + 반응형 AppShell (Sidebar Desktop / BottomNav Mobile).

## 배포

`main` 브랜치에 push 시 GitHub Actions가:
1. `documents.wiki` git clone → `public/docs-md/` 동기화
2. `npm run typecheck && npm run lint && npm run test && npm run build`
3. `dist/`를 `gh-pages` 브랜치에 푸시

GitHub Pages는 `gh-pages` 브랜치를 source로 자동 발행. SPA 라우팅은 `dist/index.html` → `dist/404.html` 복사로 처리 (post-build 스크립트).

## 문서

| 문서 | 위치 |
|------|------|
| 설계 (spec) | `docs/superpowers/specs/2026-05-09-synapse-prototype-design.md` |
| 구현 계획 (plan) | `docs/superpowers/plans/2026-05-09-synapse-prototype-implementation.md` |
| 개발 저널 | `docs/superpowers/JOURNAL.md` |
| 검토 요약 | `docs/superpowers/reviews/2026-05-09-review-summary.md` |

## 라이센스

MIT — 발표 후 포트폴리오 가치 보존.
