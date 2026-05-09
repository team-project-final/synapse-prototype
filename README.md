# Synapse Prototype

> Synapse 팀 프로젝트의 인터랙티브 시뮬레이터 + Living Documentation 사이트.

**배포 URL**: https://team-project-final.github.io/synapse-prototype/ (M7 이후)

## 빠른 시작

```bash
npm install
npm run dev      # http://localhost:5173/synapse-prototype/
```

## 스크립트

- `npm run dev` — 개발 서버
- `npm run build` — 프로덕션 빌드 (dist/)
- `npm run preview` — 빌드 결과 미리보기
- `npm run typecheck` — TypeScript strict 검증
- `npm run test` — Vitest 단위/통합
- `npm run test:e2e` — Playwright E2E
- `npm run lint` — ESLint
- `npm run sync-docs` — `documents.wiki` → `public/docs-md/` 동기화

## 디자인 시스템

`syn/DESIGN.md`의 Warm Intellectual 미학을 Tailwind v4 `@theme`으로 옮김. Warm Amber #D97706 액센트, Fraunces 세리프 디스플레이, Plus Jakarta Sans 본문, Geist Mono 코드.

## 문서

- 설계: `docs/superpowers/specs/2026-05-09-synapse-prototype-design.md`
- 구현 계획: `docs/superpowers/plans/2026-05-09-synapse-prototype-implementation.md`
