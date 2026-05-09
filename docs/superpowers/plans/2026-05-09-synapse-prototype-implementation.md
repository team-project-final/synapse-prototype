# Synapse Prototype Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synapse 팀 프로젝트의 13-화면 인터랙티브 시뮬레이터 + 랜딩/소개/아키텍처/문서 보조 페이지를 React SPA로 구현하여 GitHub Pages에 배포한다.

**Architecture:** Vite + React 18 + TypeScript SPA. Zustand stores가 localStorage에 persist되어 사용자 행동 (노트 작성, AI 카드 생성, 복습)이 즉시 반영되는 Level 2 stateful 시뮬레이터. Tailwind v4의 `@theme`이 `syn/DESIGN.md`의 Warm Intellectual 토큰을 옮겨 담는다. GitHub Actions가 main push 시 빌드하여 gh-pages 브랜치에 배포한다.

**Tech Stack:** Vite 5, React 18, TypeScript 5 strict, React Router 7, Zustand 5, Tailwind CSS 4, D3.js 7, mermaid 11, react-markdown, minisearch, Vitest, Playwright.

**Spec:** `D:\workspace\final-project-syn\page\docs\superpowers\specs\2026-05-09-synapse-prototype-design.md`

**Repo (예정):** https://github.com/team-project-final/synapse-prototype.git
**Local source dir:** `D:\workspace\final-project-syn\page\`

---

## Working Directory Convention

모든 명령은 `D:\workspace\final-project-syn\page\` 기준으로 실행. Bash에서는 forward-slash 사용 (`/d/workspace/final-project-syn/page/` 또는 그냥 절대 경로 인용부호로 감쌈).

## File Structure

| 영역 | 디렉토리 | 책임 |
|------|---------|------|
| 진입/라우팅 | `src/main.tsx`, `src/App.tsx`, `src/routes/` | React Router v7 data router 설정과 페이지 컴포넌트 |
| 디자인 시스템 | `src/components/ds/` | DESIGN.md 토큰 매핑 primitives (Button/Card/Input/Badge/Toast/Dialog) |
| 앱 셸 | `src/components/shell/` | AppShell, Sidebar, BottomNav, AppBar, NotificationDrawer |
| 기능 컴포넌트 | `src/components/feature/` | WikilinkAutocomplete, FlashCard, GraphCanvas, XPProgressBar, BadgeIcon, StreakFlame, CelebrationParticles |
| 공유 | `src/components/shared/` | MarkdownRenderer, MermaidDiagram, DemoModeToast, ResetButton |
| 도메인 로직 | `src/lib/` | sm2.ts, wikilink.ts, graph.ts, xp.ts, markdown.ts (순수 함수, TDD 핵심 대상) |
| 상태 | `src/stores/` | Zustand 7개 store (각각 persist) |
| 데이터 | `src/data/` | seed.ts, ai-templates.ts, search-corpus.ts, notifications-seed.ts |
| 스타일 | `src/styles/globals.css` | Tailwind directives + @theme 토큰 |
| 빌드 스크립트 | `scripts/sync-docs.mjs` | documents.wiki → public/docs-md/ 동기화 |
| 정적 자산 | `public/fonts/`, `public/docs-md/` | 폰트, 위키 마크다운 사본 |
| 테스트 | `tests/e2e/`, `src/**/__tests__/` | Playwright E2E + Vitest unit/integration |
| CI/CD | `.github/workflows/deploy.yml` | build → gh-pages |
| 설정 | `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `package.json` | 빌드/타입/패키지 |

각 파일은 단일 책임을 갖고, 함께 변경되는 것끼리 같은 폴더에 둔다.

---

## Milestone Map

| M | 제목 | 산출물 (테스트 가능한 단위) | 의존 |
|---|------|-------------------------|------|
| M1 | Project Setup & Tooling | `npm run dev`로 빈 페이지 뜸, lint/typecheck/test 명령 동작 | — |
| M2 | Design System & App Shell | DESIGN.md 토큰 적용된 primitives + 반응형 셸 | M1 |
| M3 | Domain Lib & Stores & Seed | 순수 함수와 Zustand store 단위 테스트 통과, 시드 주입 | M2 |
| M4 | Tier 1 Screens (Core Loop) | 노트→AI 카드→복습→결과 1사이클 E2E 통과 | M3 |
| M5 | Tier 2 Screens (Differentiators) | 그래프/검색/프로필 동작 | M4 |
| M6 | Tier 3 + Drawer + Supporting Pages | 그룹/알림/랜딩/소개/아키텍처/문서 동작 | M5 |
| M7 | Wiki Sync, SPA Fallback, Deploy | gh-pages URL에서 모든 라우트 새로고침 정상 | M6 |

---

## Milestone 1 — Project Setup & Tooling

### Task 1.1: 프로젝트 디렉토리 초기화 및 npm 패키지 셋업

**Files:**
- Create: `D:\workspace\final-project-syn\page\package.json`
- Create: `D:\workspace\final-project-syn\page\.gitignore`
- Create: `D:\workspace\final-project-syn\page\.nvmrc`

- [ ] **Step 1: package.json 생성**

```json
{
  "name": "synapse-prototype",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build && node scripts/post-build.mjs",
    "preview": "vite preview",
    "sync-docs": "node scripts/sync-docs.mjs",
    "typecheck": "tsc --noEmit",
    "test": "vitest --run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\""
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router": "^7.1.1",
    "zustand": "^5.0.2",
    "d3": "^7.9.0",
    "mermaid": "^11.4.1",
    "react-markdown": "^9.0.1",
    "remark-gfm": "^4.0.0",
    "rehype-highlight": "^7.0.1",
    "minisearch": "^7.1.1",
    "date-fns": "^4.1.0",
    "ulid": "^2.3.0",
    "@fontsource/fraunces": "^5.1.1",
    "@fontsource/plus-jakarta-sans": "^5.1.1",
    "@fontsource/geist-mono": "^5.1.1"
  },
  "devDependencies": {
    "@types/d3": "^7.4.3",
    "@types/node": "^22.10.5",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@testing-library/jest-dom": "^6.6.3",
    "@playwright/test": "^1.49.1",
    "vitest": "^2.1.8",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.2",
    "vite": "^6.0.5",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "eslint": "^9.17.0",
    "@typescript-eslint/eslint-plugin": "^8.18.2",
    "@typescript-eslint/parser": "^8.18.2",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "prettier": "^3.4.2"
  }
}
```

- [ ] **Step 2: .gitignore 생성**

```
node_modules
dist
dist-ssr
*.local
.env
.env.local
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
test-results
playwright-report
coverage
.superpowers/
```

- [ ] **Step 3: .nvmrc 생성**

```
22
```

- [ ] **Step 4: 의존성 설치**

Run: `npm install`
Expected: `node_modules/` 생성, `package-lock.json` 생성, 0 vulnerabilities (또는 minor 경고만)

- [ ] **Step 5: 첫 커밋**

```bash
git init
git add package.json package-lock.json .gitignore .nvmrc
git commit -m "chore: initialize package.json with dependencies"
```

---

### Task 1.2: TypeScript 설정

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`

- [ ] **Step 1: tsconfig.json (composite root)**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 2: tsconfig.app.json (앱 코드)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: tsconfig.node.json (Vite/스크립트)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts", "scripts/**/*"]
}
```

- [ ] **Step 4: typecheck 검증**

Run: `npm run typecheck`
Expected: 에러 없이 종료 (아직 src 디렉토리 비어있어도 OK)

- [ ] **Step 5: 커밋**

```bash
git add tsconfig*.json
git commit -m "chore: add TypeScript strict configuration"
```

---

### Task 1.3: Vite + Tailwind v4 설정

**Files:**
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/styles/globals.css`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

- [ ] **Step 1: vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  base: '/synapse-prototype/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: { outDir: 'dist', sourcemap: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

- [ ] **Step 2: index.html**

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Synapse — 통합 학습-지식 그래프 SaaS</title>
    <meta name="description" content="노트를 쓰면 AI가 카드를 만들어주고, 복습하면 노트가 다시 살아난다." />
  </head>
  <body class="bg-stone-50 text-stone-900 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: src/styles/globals.css (DESIGN.md 토큰을 @theme으로)**

```css
@import "tailwindcss";
@import "@fontsource/fraunces/index.css";
@import "@fontsource/plus-jakarta-sans/index.css";
@import "@fontsource/geist-mono/index.css";

@theme {
  /* DESIGN.md — Synapse Warm Intellectual */
  --color-amber-primary: #D97706;
  --color-amber-hover: #B45309;
  --color-amber-light: #FEF3C7;
  --color-teal-secondary: #0D9488;

  --color-stone-50: #FAFAF9;
  --color-stone-100: #F5F5F4;
  --color-stone-200: #E7E5E4;
  --color-stone-300: #D6D3D1;
  --color-stone-400: #A8A29E;
  --color-stone-500: #78716C;
  --color-stone-600: #57534E;
  --color-stone-700: #44403C;
  --color-stone-800: #292524;
  --color-stone-900: #1C1917;
  --color-stone-950: #0C0A09;

  --color-success: #16A34A;
  --color-warning: #F59E0B;
  --color-error: #DC2626;
  --color-info: #0EA5E9;

  --font-display: "Fraunces", Georgia, serif;
  --font-body: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-mono: "Geist Mono", "Courier New", monospace;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  --spacing-2xs: 2px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;

  --breakpoint-mobile: 640px;
  --breakpoint-tablet: 1024px;
}

html, body { font-family: var(--font-body); }
h1, h2, h3, .display { font-family: var(--font-display); }
code, pre, .mono { font-family: var(--font-mono); }
```

- [ ] **Step 4: src/main.tsx**

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 5: src/App.tsx (placeholder)**

```typescript
export default function App() {
  return (
    <main className="min-h-dvh flex items-center justify-center">
      <h1 className="display text-4xl text-stone-900">Synapse Prototype</h1>
    </main>
  );
}
```

- [ ] **Step 6: dev 서버 검증**

Run: `npm run dev`
Expected: `Local: http://localhost:5173/synapse-prototype/` 접속 시 "Synapse Prototype" 표시. Fraunces 세리프 폰트로 렌더. Ctrl+C로 종료.

- [ ] **Step 7: 커밋**

```bash
git add vite.config.ts index.html src/styles src/main.tsx src/App.tsx
git commit -m "feat: scaffold Vite + React + Tailwind v4 with DESIGN.md tokens"
```

---

### Task 1.4: ESLint, Prettier, Vitest 셋업

**Files:**
- Create: `eslint.config.js`
- Create: `.prettierrc.json`
- Create: `src/test-setup.ts`
- Create: `src/lib/__tests__/sanity.test.ts`

- [ ] **Step 1: eslint.config.js (flat config)**

```javascript
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  { ignores: ['dist', 'node_modules', 'playwright-report', 'test-results'] },
];
```

- [ ] **Step 2: .prettierrc.json**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

- [ ] **Step 3: src/test-setup.ts**

```typescript
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());
```

- [ ] **Step 4: 단순 sanity 테스트 작성 (TDD 시작점 검증)**

```typescript
// src/lib/__tests__/sanity.test.ts
import { describe, it, expect } from 'vitest';

describe('test infrastructure', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: 검증**

Run: `npm run lint`
Expected: 0 errors

Run: `npm run test`
Expected: 1 test passed

Run: `npm run typecheck`
Expected: 0 errors

- [ ] **Step 6: 커밋**

```bash
git add eslint.config.js .prettierrc.json src/test-setup.ts src/lib/__tests__/sanity.test.ts
git commit -m "chore: add ESLint, Prettier, Vitest setup"
```

---

### Task 1.5: GitHub Actions 워크플로우 스켈레톤 (배포는 M7에서 활성화)

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `scripts/post-build.mjs`

- [ ] **Step 1: post-build 스크립트 (404.html 생성)**

```javascript
// scripts/post-build.mjs
import { copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve(process.cwd(), 'dist');
await copyFile(resolve(dist, 'index.html'), resolve(dist, '404.html'));
console.log('post-build: dist/404.html created (SPA fallback)');
```

- [ ] **Step 2: deploy.yml (M7에서 enable, 지금은 build only)**

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
      # M7에서 추가: - run: npm run sync-docs
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
      # M7에서 추가:
      # - uses: peaceiris/actions-gh-pages@v4
      #   with:
      #     github_token: ${{ secrets.GITHUB_TOKEN }}
      #     publish_dir: ./dist
      #     publish_branch: gh-pages
```

- [ ] **Step 3: 로컬 빌드 검증**

Run: `npm run build`
Expected: `dist/` 생성, `dist/index.html`, `dist/404.html` 존재. `dist/assets/`에 JS/CSS 번들. 로그 마지막에 "post-build: dist/404.html created".

Run: `npm run preview`
Expected: `http://localhost:4173/synapse-prototype/` 접속 시 빌드된 페이지 정상.

- [ ] **Step 4: 커밋**

```bash
git add .github/workflows/deploy.yml scripts/post-build.mjs
git commit -m "ci: add GitHub Actions skeleton with post-build SPA fallback"
```

---

### Task 1.6: README 초안

**Files:**
- Create: `README.md`

- [ ] **Step 1: README 작성**

```markdown
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
```

- [ ] **Step 2: 커밋**

```bash
git add README.md
git commit -m "docs: add initial README with quick start guide"
```

---

## Milestone 1 완료 조건 (테스트 가능 단위)

- [ ] `npm run dev` 시 `http://localhost:5173/synapse-prototype/`에서 "Synapse Prototype" 텍스트가 Fraunces 세리프 폰트로 표시
- [ ] `npm run typecheck` 0 errors
- [ ] `npm run lint` 0 errors
- [ ] `npm run test` 1 passing
- [ ] `npm run build && npm run preview`로 빌드 결과 정상 동작
- [ ] `dist/404.html` 존재 (SPA fallback 준비)
- [ ] git log에 6개 커밋 (Tasks 1.1~1.6)

---

## Milestone 2 — Design System & App Shell

### Task 2.1: 디자인 시스템 primitives — Button, Card, Input, Badge

**Files:**
- Create: `src/components/ds/Button.tsx`
- Create: `src/components/ds/Card.tsx`
- Create: `src/components/ds/Input.tsx`
- Create: `src/components/ds/Badge.tsx`
- Create: `src/components/ds/index.ts`
- Create: `src/components/ds/__tests__/Button.test.tsx`

- [ ] **Step 1: Button 테스트 작성 (TDD 시작)**

```typescript
// src/components/ds/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>저장</Button>);
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });

  it('applies primary variant by default with amber background', () => {
    render(<Button>가</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/bg-amber-primary|bg-\[#D97706\]/);
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>클릭</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disables interaction when disabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>x</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- Button`
Expected: FAIL — `Cannot find module '../Button'`

- [ ] **Step 3: Button 구현 (DESIGN.md 토큰 매핑)**

```typescript
// src/components/ds/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[#D97706] hover:bg-[#B45309] text-white',
  secondary: 'border border-stone-300 text-stone-800 hover:bg-stone-100',
  ghost: 'text-stone-700 hover:bg-stone-100',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test -- Button`
Expected: 4 passed

- [ ] **Step 5: Card 구현**

```typescript
// src/components/ds/Card.tsx
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  elevated?: boolean;
}

export function Card({ children, elevated = false, className = '', ...rest }: CardProps) {
  return (
    <div
      className={[
        'rounded-md bg-stone-100 p-4',
        elevated ? 'shadow-md' : 'shadow-sm',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Input 구현**

```typescript
// src/components/ds/Input.tsx
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', invalid = false, ...rest }, ref) => (
    <input
      ref={ref}
      className={[
        'w-full rounded-sm border bg-white px-3 py-2 text-stone-900 placeholder:text-stone-400',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-1',
        invalid ? 'border-[#DC2626]' : 'border-stone-300',
        className,
      ].join(' ')}
      {...rest}
    />
  ),
);
Input.displayName = 'Input';
```

- [ ] **Step 7: Badge 구현**

```typescript
// src/components/ds/Badge.tsx
import type { ReactNode } from 'react';

type Tone = 'neutral' | 'amber' | 'teal' | 'success' | 'warning' | 'error' | 'info';

const tones: Record<Tone, string> = {
  neutral: 'bg-stone-200 text-stone-700',
  amber: 'bg-[#FEF3C7] text-[#B45309]',
  teal: 'bg-teal-50 text-[#0D9488]',
  success: 'bg-green-50 text-[#16A34A]',
  warning: 'bg-amber-50 text-[#F59E0B]',
  error: 'bg-red-50 text-[#DC2626]',
  info: 'bg-sky-50 text-[#0EA5E9]',
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
```

- [ ] **Step 8: 배럴 export**

```typescript
// src/components/ds/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
export { Badge } from './Badge';
```

- [ ] **Step 9: 통합 검증**

Run: `npm run test`
Expected: 모든 테스트 통과 (Button 4개 + sanity 1개)

Run: `npm run typecheck`
Expected: 0 errors

- [ ] **Step 10: 커밋**

```bash
git add src/components/ds
git commit -m "feat(ds): add Button/Card/Input/Badge primitives with DESIGN.md tokens"
```

---

### Task 2.2: Toast & Dialog primitives

**Files:**
- Create: `src/components/ds/Toast.tsx`
- Create: `src/components/ds/Dialog.tsx`
- Create: `src/components/ds/Toaster.tsx`
- Modify: `src/components/ds/index.ts`
- Create: `src/components/ds/__tests__/Toaster.test.tsx`

- [ ] **Step 1: Toaster 테스트 작성**

```typescript
// src/components/ds/__tests__/Toaster.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Toaster, toast } from '../Toaster';

describe('Toaster', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('shows a toast added via toast() and removes after duration', () => {
    render(<Toaster />);
    act(() => { toast({ message: '저장됨', tone: 'success', duration: 1500 }); });
    expect(screen.getByText('저장됨')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1600); });
    expect(screen.queryByText('저장됨')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- Toaster`
Expected: FAIL — `Cannot find module '../Toaster'`

- [ ] **Step 3: Toaster 구현 (가벼운 외부 store 패턴)**

```typescript
// src/components/ds/Toaster.tsx
import { useEffect, useState } from 'react';

type Tone = 'info' | 'success' | 'warning' | 'error';
interface ToastItem { id: string; message: string; tone: Tone; duration: number }

let listeners: Array<(items: ToastItem[]) => void> = [];
let items: ToastItem[] = [];

export function toast(input: { message: string; tone?: Tone; duration?: number }) {
  const item: ToastItem = {
    id: crypto.randomUUID(),
    message: input.message,
    tone: input.tone ?? 'info',
    duration: input.duration ?? 2500,
  };
  items = [...items, item];
  listeners.forEach((l) => l(items));
  setTimeout(() => {
    items = items.filter((i) => i.id !== item.id);
    listeners.forEach((l) => l(items));
  }, item.duration);
}

const toneClass: Record<Tone, string> = {
  info: 'bg-sky-50 text-[#0EA5E9] border-sky-200',
  success: 'bg-green-50 text-[#16A34A] border-green-200',
  warning: 'bg-amber-50 text-[#F59E0B] border-amber-200',
  error: 'bg-red-50 text-[#DC2626] border-red-200',
};

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>(items);
  useEffect(() => {
    const sub = (next: ToastItem[]) => setList([...next]);
    listeners = [...listeners, sub];
    return () => { listeners = listeners.filter((l) => l !== sub); };
  }, []);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`rounded-md border px-4 py-2 shadow-md ${toneClass[t.tone]}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Dialog 구현 (간단한 modal 패턴)**

```typescript
// src/components/ds/Dialog.tsx
import { useEffect, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-stone-900/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        className="max-w-md w-full rounded-lg bg-stone-50 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 id="dialog-title" className="display text-2xl mb-4 text-stone-900">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: index.ts 업데이트**

```typescript
// src/components/ds/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
export { Badge } from './Badge';
export { Toaster, toast } from './Toaster';
export { Dialog } from './Dialog';
```

- [ ] **Step 6: 검증**

Run: `npm run test`
Expected: Toaster 1 + Button 4 + sanity 1 통과

- [ ] **Step 7: 커밋**

```bash
git add src/components/ds
git commit -m "feat(ds): add Toaster and Dialog primitives"
```

---

### Task 2.3: AppShell, Sidebar, BottomNav, AppBar (반응형 셸)

**Files:**
- Create: `src/components/shell/AppShell.tsx`
- Create: `src/components/shell/Sidebar.tsx`
- Create: `src/components/shell/BottomNav.tsx`
- Create: `src/components/shell/AppBar.tsx`
- Create: `src/components/shell/__tests__/AppShell.test.tsx`

- [ ] **Step 1: AppShell 테스트 (반응형 분기 검증)**

```typescript
// src/components/shell/__tests__/AppShell.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AppShell } from '../AppShell';

describe('AppShell', () => {
  it('renders children inside main region', () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <AppShell><div data-testid="content">콘텐츠</div></AppShell>
      </MemoryRouter>
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders Sidebar with navigation items', () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <AppShell><div /></AppShell>
      </MemoryRouter>
    );
    expect(screen.getByRole('navigation', { name: /주 메뉴/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /대시보드/ })).toBeInTheDocument();
  });

  it('renders AppBar with brand', () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <AppShell><div /></AppShell>
      </MemoryRouter>
    );
    expect(screen.getByText('Synapse')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- AppShell`
Expected: FAIL

- [ ] **Step 3: Sidebar 구현**

```typescript
// src/components/shell/Sidebar.tsx
import { NavLink } from 'react-router';

const items = [
  { to: '/app', label: '대시보드', icon: '🏠' },
  { to: '/app/notes', label: '노트', icon: '📝' },
  { to: '/app/decks', label: '덱', icon: '🃏' },
  { to: '/app/graph', label: '그래프', icon: '🕸️' },
  { to: '/app/search', label: '검색', icon: '🔍' },
  { to: '/app/groups', label: '커뮤니티', icon: '👥' },
  { to: '/app/profile', label: '프로필', icon: '🏅' },
];

export function Sidebar() {
  return (
    <nav aria-label="주 메뉴" className="hidden md:flex w-60 flex-col border-r border-stone-200 bg-stone-50 py-4">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === '/app'}
          className={({ isActive }) =>
            [
              'flex items-center gap-3 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100',
              isActive ? 'bg-[#FEF3C7] text-[#B45309] font-medium' : '',
            ].join(' ')
          }
        >
          <span aria-hidden="true">{it.icon}</span>
          <span>{it.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: BottomNav 구현 (모바일 4탭)**

```typescript
// src/components/shell/BottomNav.tsx
import { NavLink } from 'react-router';

const tabs = [
  { to: '/app', label: '홈', icon: '🏠' },
  { to: '/app/notes', label: '노트', icon: '📝' },
  { to: '/app/decks', label: '복습', icon: '🃏' },
  { to: '/app/profile', label: '더보기', icon: '⋯' },
];

export function BottomNav() {
  return (
    <nav
      aria-label="모바일 메뉴"
      className="md:hidden fixed bottom-0 inset-x-0 border-t border-stone-200 bg-stone-50 grid grid-cols-4"
    >
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.to === '/app'}
          className={({ isActive }) =>
            [
              'flex flex-col items-center justify-center py-2 text-xs',
              isActive ? 'text-[#D97706]' : 'text-stone-600',
            ].join(' ')
          }
        >
          <span aria-hidden="true" className="text-lg">{t.icon}</span>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 5: AppBar 구현**

```typescript
// src/components/shell/AppBar.tsx
import { Link } from 'react-router';

interface AppBarProps {
  onOpenNotifications?: () => void;
}

export function AppBar({ onOpenNotifications }: AppBarProps) {
  return (
    <header className="border-b border-stone-200 bg-stone-50/80 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/app" className="display text-xl text-stone-900">Synapse</Link>
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="검색…"
            aria-label="검색"
            className="hidden sm:block rounded-sm border border-stone-300 bg-white px-3 py-1 text-sm"
          />
          <button
            aria-label="알림"
            onClick={onOpenNotifications}
            className="rounded-md p-2 hover:bg-stone-100"
          >
            🔔
          </button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 6: AppShell 구현 (셸 조립)**

```typescript
// src/components/shell/AppShell.tsx
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { AppBar } from './AppBar';

export function AppShell({ children, onOpenNotifications }: { children: ReactNode; onOpenNotifications?: () => void }) {
  return (
    <div className="min-h-dvh flex flex-col bg-stone-50">
      <AppBar onOpenNotifications={onOpenNotifications} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 7: 검증**

Run: `npm run test -- AppShell`
Expected: 3 passed

Run: `npm run typecheck`
Expected: 0 errors

- [ ] **Step 8: 커밋**

```bash
git add src/components/shell
git commit -m "feat(shell): add AppShell with responsive Sidebar/BottomNav/AppBar"
```

---

### Task 2.4: 라우팅 스켈레톤 (모든 라우트가 placeholder 반환)

**Files:**
- Create: `src/routes/landing.tsx`
- Create: `src/routes/about.tsx`
- Create: `src/routes/architecture.tsx`
- Create: `src/routes/docs/index.tsx`
- Create: `src/routes/docs/Slug.tsx`
- Create: `src/routes/app/Layout.tsx`
- Create: `src/routes/app/Dashboard.tsx`
- Create: `src/routes/app/notes/List.tsx`
- Create: `src/routes/app/notes/New.tsx`
- Create: `src/routes/app/notes/View.tsx`
- Create: `src/routes/app/notes/Edit.tsx`
- Create: `src/routes/app/decks/List.tsx`
- Create: `src/routes/app/decks/Review.tsx`
- Create: `src/routes/app/decks/Result.tsx`
- Create: `src/routes/app/ai/Generate.tsx`
- Create: `src/routes/app/Graph.tsx`
- Create: `src/routes/app/Search.tsx`
- Create: `src/routes/app/Profile.tsx`
- Create: `src/routes/app/Groups.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Placeholder 헬퍼 컴포넌트 (재사용)**

```typescript
// src/routes/_Placeholder.tsx
export function Placeholder({ name }: { name: string }) {
  return (
    <div className="p-8">
      <h1 className="display text-3xl text-stone-900 mb-2">{name}</h1>
      <p className="text-stone-600">이 화면은 후속 마일스톤에서 구현됩니다.</p>
    </div>
  );
}
```

- [ ] **Step 2: /app 레이아웃 라우트 (AppShell + Outlet)**

```typescript
// src/routes/app/Layout.tsx
import { Outlet } from 'react-router';
import { AppShell } from '@/components/shell/AppShell';

export default function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
```

- [ ] **Step 3: 모든 라우트 파일 생성 (placeholder 표시)**

각 파일은 동일 패턴:

```typescript
// src/routes/landing.tsx
import { Placeholder } from './_Placeholder';
export default function Landing() { return <Placeholder name="랜딩 페이지" />; }

// src/routes/about.tsx
import { Placeholder } from './_Placeholder';
export default function About() { return <Placeholder name="프로젝트 소개" />; }

// src/routes/architecture.tsx
import { Placeholder } from './_Placeholder';
export default function Architecture() { return <Placeholder name="아키텍처" />; }

// src/routes/docs/index.tsx
import { Placeholder } from '../_Placeholder';
export default function DocsIndex() { return <Placeholder name="문서 인덱스" />; }

// src/routes/docs/Slug.tsx
import { useParams } from 'react-router';
import { Placeholder } from '../_Placeholder';
export default function DocsSlug() {
  const { slug } = useParams();
  return <Placeholder name={`문서: ${slug}`} />;
}

// src/routes/app/Dashboard.tsx
import { Placeholder } from '../_Placeholder';
export default function Dashboard() { return <Placeholder name="대시보드" />; }

// src/routes/app/notes/List.tsx
import { Placeholder } from '../../_Placeholder';
export default function NotesList() { return <Placeholder name="노트 목록" />; }

// src/routes/app/notes/New.tsx
import { Placeholder } from '../../_Placeholder';
export default function NoteNew() { return <Placeholder name="노트 신규 작성" />; }

// src/routes/app/notes/View.tsx
import { useParams } from 'react-router';
import { Placeholder } from '../../_Placeholder';
export default function NoteView() {
  const { id } = useParams();
  return <Placeholder name={`노트 상세: ${id}`} />;
}

// src/routes/app/notes/Edit.tsx
import { useParams } from 'react-router';
import { Placeholder } from '../../_Placeholder';
export default function NoteEdit() {
  const { id } = useParams();
  return <Placeholder name={`노트 편집: ${id}`} />;
}

// src/routes/app/decks/List.tsx
import { Placeholder } from '../../_Placeholder';
export default function DecksList() { return <Placeholder name="덱 목록" />; }

// src/routes/app/decks/Review.tsx
import { useParams } from 'react-router';
import { Placeholder } from '../../_Placeholder';
export default function DeckReview() {
  const { id } = useParams();
  return <Placeholder name={`복습 세션: ${id}`} />;
}

// src/routes/app/decks/Result.tsx
import { useParams } from 'react-router';
import { Placeholder } from '../../_Placeholder';
export default function DeckResult() {
  const { id } = useParams();
  return <Placeholder name={`세션 결과: ${id}`} />;
}

// src/routes/app/ai/Generate.tsx
import { useSearchParams } from 'react-router';
import { Placeholder } from '../../_Placeholder';
export default function AIGenerate() {
  const [params] = useSearchParams();
  return <Placeholder name={`AI 카드 생성: ${params.get('noteId') ?? ''}`} />;
}

// src/routes/app/Graph.tsx
import { Placeholder } from '../_Placeholder';
export default function Graph() { return <Placeholder name="그래프 뷰" />; }

// src/routes/app/Search.tsx
import { Placeholder } from '../_Placeholder';
export default function Search() { return <Placeholder name="통합 검색" />; }

// src/routes/app/Profile.tsx
import { Placeholder } from '../_Placeholder';
export default function Profile() { return <Placeholder name="게이미피케이션 프로필" />; }

// src/routes/app/Groups.tsx
import { Placeholder } from '../_Placeholder';
export default function Groups() { return <Placeholder name="스터디 그룹" />; }
```

- [ ] **Step 4: App.tsx에 BrowserRouter + 라우트 정의**

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router';
import Landing from './routes/landing';
import About from './routes/about';
import Architecture from './routes/architecture';
import DocsIndex from './routes/docs/index';
import DocsSlug from './routes/docs/Slug';
import AppLayout from './routes/app/Layout';
import Dashboard from './routes/app/Dashboard';
import NotesList from './routes/app/notes/List';
import NoteNew from './routes/app/notes/New';
import NoteView from './routes/app/notes/View';
import NoteEdit from './routes/app/notes/Edit';
import DecksList from './routes/app/decks/List';
import DeckReview from './routes/app/decks/Review';
import DeckResult from './routes/app/decks/Result';
import AIGenerate from './routes/app/ai/Generate';
import Graph from './routes/app/Graph';
import Search from './routes/app/Search';
import Profile from './routes/app/Profile';
import Groups from './routes/app/Groups';
import { Toaster } from './components/ds';

export default function App() {
  return (
    <BrowserRouter basename="/synapse-prototype">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/architecture" element={<Architecture />} />
        <Route path="/docs" element={<DocsIndex />} />
        <Route path="/docs/:slug" element={<DocsSlug />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="notes" element={<NotesList />} />
          <Route path="notes/new" element={<NoteNew />} />
          <Route path="notes/:id" element={<NoteView />} />
          <Route path="notes/:id/edit" element={<NoteEdit />} />
          <Route path="decks" element={<DecksList />} />
          <Route path="decks/:id/review" element={<DeckReview />} />
          <Route path="decks/:id/review/result" element={<DeckResult />} />
          <Route path="ai/generate" element={<AIGenerate />} />
          <Route path="graph" element={<Graph />} />
          <Route path="search" element={<Search />} />
          <Route path="profile" element={<Profile />} />
          <Route path="groups" element={<Groups />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
```

- [ ] **Step 5: dev 서버 검증 (모든 라우트)**

Run: `npm run dev`
Brower: 다음 URL을 차례로 접속하여 placeholder 표시 확인:
- http://localhost:5173/synapse-prototype/
- http://localhost:5173/synapse-prototype/app
- http://localhost:5173/synapse-prototype/app/notes
- http://localhost:5173/synapse-prototype/app/decks/abc/review
- http://localhost:5173/synapse-prototype/about
- http://localhost:5173/synapse-prototype/docs/01

Expected: 각 URL에서 해당 placeholder 텍스트 표시. /app/* 경로는 사이드바 + 상단바 표시. /, /about, /architecture, /docs/*는 placeholder만.

- [ ] **Step 6: 검증**

Run: `npm run test`
Expected: 기존 테스트 모두 통과

Run: `npm run typecheck`
Expected: 0 errors

- [ ] **Step 7: 커밋**

```bash
git add src/routes src/App.tsx
git commit -m "feat(routes): scaffold all routes as placeholders with AppShell layout"
```

---

## Milestone 2 완료 조건

- [ ] DESIGN.md 토큰이 `globals.css`의 `@theme`에 정확히 매핑됨
- [ ] Button/Card/Input/Badge/Toaster/Dialog primitives가 단위 테스트 통과
- [ ] AppShell이 Desktop(>768px)에서 사이드바 표시, Mobile(<768px)에서 바텀 네비 표시
- [ ] 19개 라우트(랜딩 + /about + /architecture + /docs/2 + /app 14)가 placeholder로 렌더링
- [ ] 모든 라우트에서 Synapse 로고 클릭 시 /app으로 이동
- [ ] `npm run test` 모두 통과 (~10개)
- [ ] `npm run typecheck` 0 errors

---

## Milestone 3 — Domain Lib & Stores & Seed

### Task 3.1: SM-2 SRS 알고리즘

**Files:**
- Create: `src/lib/sm2.ts`
- Create: `src/lib/__tests__/sm2.test.ts`

- [ ] **Step 1: 테스트 작성 (Anki SM-2 표준)**

```typescript
// src/lib/__tests__/sm2.test.ts
import { describe, it, expect } from 'vitest';
import { applyRating, type SrsState } from '../sm2';

const initial: SrsState = { ef: 2.5, interval: 0, repetitions: 0 };

describe('applyRating (SM-2)', () => {
  it('rating 1 (Again) resets repetitions and sets interval to 0 (relearn)', () => {
    const next = applyRating({ ef: 2.5, interval: 7, repetitions: 3 }, 1);
    expect(next.repetitions).toBe(0);
    expect(next.interval).toBe(0);
    expect(next.ef).toBeLessThan(2.5);
  });

  it('rating 3 (Good) on first repetition gives interval 1', () => {
    const next = applyRating(initial, 3);
    expect(next.repetitions).toBe(1);
    expect(next.interval).toBe(1);
  });

  it('rating 3 (Good) on second repetition gives interval 6', () => {
    const next = applyRating({ ef: 2.5, interval: 1, repetitions: 1 }, 3);
    expect(next.repetitions).toBe(2);
    expect(next.interval).toBe(6);
  });

  it('rating 3 (Good) on subsequent repetition multiplies by EF', () => {
    const state = { ef: 2.5, interval: 6, repetitions: 2 };
    const next = applyRating(state, 3);
    expect(next.repetitions).toBe(3);
    expect(next.interval).toBe(15); // 6 * 2.5
  });

  it('rating 4 (Easy) increases EF', () => {
    const next = applyRating(initial, 4);
    expect(next.ef).toBeGreaterThan(2.5);
  });

  it('EF never drops below 1.3', () => {
    let s = initial;
    for (let i = 0; i < 50; i++) s = applyRating(s, 1);
    expect(s.ef).toBeGreaterThanOrEqual(1.3);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- sm2`
Expected: FAIL — module not found

- [ ] **Step 3: SM-2 구현**

```typescript
// src/lib/sm2.ts
export interface SrsState {
  ef: number;          // easiness factor (default 2.5)
  interval: number;    // days
  repetitions: number;
}

export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

const ratingToQ: Record<Rating, number> = { 1: 0, 2: 3, 3: 4, 4: 5 };

export function applyRating(state: SrsState, rating: Rating): SrsState {
  const q = ratingToQ[rating];
  const newEf = Math.max(1.3, state.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (rating === 1) {
    return { ef: newEf, interval: 0, repetitions: 0 };
  }

  const newRep = state.repetitions + 1;
  let newInterval: number;
  if (newRep === 1) newInterval = 1;
  else if (newRep === 2) newInterval = 6;
  else newInterval = Math.round(state.interval * newEf);

  return { ef: newEf, interval: newInterval, repetitions: newRep };
}

export function dueDateFrom(now: number, intervalDays: number): number {
  return now + intervalDays * 86400000;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test -- sm2`
Expected: 6 passed

- [ ] **Step 5: 커밋**

```bash
git add src/lib/sm2.ts src/lib/__tests__/sm2.test.ts
git commit -m "feat(lib): add SM-2 SRS algorithm with full test coverage"
```

---

### Task 3.2: 위키링크 파서 (`[[…]]`)

**Files:**
- Create: `src/lib/wikilink.ts`
- Create: `src/lib/__tests__/wikilink.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// src/lib/__tests__/wikilink.test.ts
import { describe, it, expect } from 'vitest';
import { extractWikilinks, replaceWikilinks } from '../wikilink';

describe('extractWikilinks', () => {
  it('extracts single wikilink', () => {
    expect(extractWikilinks('see [[과적합]] for details')).toEqual(['과적합']);
  });

  it('extracts multiple wikilinks', () => {
    const links = extractWikilinks('[[A]] and [[B]] then [[C]]');
    expect(links).toEqual(['A', 'B', 'C']);
  });

  it('deduplicates identical targets', () => {
    expect(extractWikilinks('[[X]] and [[X]] again')).toEqual(['X']);
  });

  it('ignores escaped brackets', () => {
    expect(extractWikilinks('not a link: \\[[escaped]]')).toEqual([]);
  });

  it('handles korean and english mixed', () => {
    expect(extractWikilinks('[[ML 정규화 기법]]')).toEqual(['ML 정규화 기법']);
  });
});

describe('replaceWikilinks', () => {
  it('wraps wikilinks with provided render fn', () => {
    const out = replaceWikilinks('see [[과적합]] note', (target) => `<a>${target}</a>`);
    expect(out).toBe('see <a>과적합</a> note');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm run test -- wikilink`
Expected: FAIL

- [ ] **Step 3: 구현**

```typescript
// src/lib/wikilink.ts
const WIKILINK_RE = /(?<!\\)\[\[([^\]]+?)\]\]/g;

export function extractWikilinks(text: string): string[] {
  const set = new Set<string>();
  for (const m of text.matchAll(WIKILINK_RE)) {
    if (m[1]) set.add(m[1].trim());
  }
  return Array.from(set);
}

export function replaceWikilinks(text: string, render: (target: string) => string): string {
  return text.replace(WIKILINK_RE, (_, target: string) => render(target.trim()));
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm run test -- wikilink`
Expected: 6 passed

- [ ] **Step 5: 커밋**

```bash
git add src/lib/wikilink.ts src/lib/__tests__/wikilink.test.ts
git commit -m "feat(lib): add wikilink parser with extract and replace"
```

---

### Task 3.3: 그래프 빌더 (notes → 노드/엣지)

**Files:**
- Create: `src/lib/graph.ts`
- Create: `src/lib/__tests__/graph.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// src/lib/__tests__/graph.test.ts
import { describe, it, expect } from 'vitest';
import { buildGraph, type GraphNote } from '../graph';

const notes: GraphNote[] = [
  { id: 'n1', title: 'A', outgoingLinks: ['B'] },
  { id: 'n2', title: 'B', outgoingLinks: ['C'] },
  { id: 'n3', title: 'C', outgoingLinks: [] },
  { id: 'n4', title: 'orphan', outgoingLinks: [] },
];

describe('buildGraph', () => {
  it('creates one node per note', () => {
    const g = buildGraph(notes);
    expect(g.nodes).toHaveLength(4);
    expect(g.nodes.map((n) => n.id).sort()).toEqual(['n1', 'n2', 'n3', 'n4']);
  });

  it('resolves outgoingLinks (title-based) to edges', () => {
    const g = buildGraph(notes);
    expect(g.edges).toEqual(
      expect.arrayContaining([
        { source: 'n1', target: 'n2' },
        { source: 'n2', target: 'n3' },
      ]),
    );
    expect(g.edges).toHaveLength(2);
  });

  it('drops outgoing links to non-existent titles', () => {
    const g = buildGraph([{ id: 'n1', title: 'A', outgoingLinks: ['ghost'] }]);
    expect(g.edges).toHaveLength(0);
  });

  it('node degree reflects connection count', () => {
    const g = buildGraph(notes);
    const b = g.nodes.find((n) => n.id === 'n2')!;
    expect(b.degree).toBe(2); // 1 in + 1 out
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm run test -- graph`
Expected: FAIL

- [ ] **Step 3: 구현**

```typescript
// src/lib/graph.ts
export interface GraphNote {
  id: string;
  title: string;
  outgoingLinks: string[]; // wikilink target titles
}

export interface GraphNode {
  id: string;
  title: string;
  degree: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildGraph(notes: GraphNote[]): Graph {
  const titleToId = new Map<string, string>();
  for (const n of notes) titleToId.set(n.title, n.id);

  const edges: GraphEdge[] = [];
  for (const n of notes) {
    for (const target of n.outgoingLinks) {
      const tid = titleToId.get(target);
      if (tid) edges.push({ source: n.id, target: tid });
    }
  }

  const degree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }

  const nodes: GraphNode[] = notes.map((n) => ({
    id: n.id,
    title: n.title,
    degree: degree.get(n.id) ?? 0,
  }));

  return { nodes, edges };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm run test -- graph`
Expected: 4 passed

- [ ] **Step 5: 커밋**

```bash
git add src/lib/graph.ts src/lib/__tests__/graph.test.ts
git commit -m "feat(lib): add graph builder for notes -> nodes/edges"
```

---

### Task 3.4: XP / 레벨 / 배지 평가 로직

**Files:**
- Create: `src/lib/xp.ts`
- Create: `src/lib/__tests__/xp.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// src/lib/__tests__/xp.test.ts
import { describe, it, expect } from 'vitest';
import { LEVELS, levelFor, xpForReview, evaluateBadges } from '../xp';

describe('levelFor', () => {
  it('returns level 1 for 0 XP', () => {
    expect(levelFor(0)).toEqual({ level: 1, title: '학습자' });
  });

  it('returns level 7 (지식 탐험가) at 3,240 XP', () => {
    const r = levelFor(3240);
    expect(r.level).toBe(7);
    expect(r.title).toBe('지식 탐험가');
  });

  it('LEVELS table is monotonic', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i]!.requiredXp).toBeGreaterThan(LEVELS[i - 1]!.requiredXp);
    }
  });
});

describe('xpForReview', () => {
  it('grants 5 XP per submitted review', () => {
    expect(xpForReview()).toBe(5);
  });
});

describe('evaluateBadges', () => {
  it('grants 연속학습7 badge when streak >= 7', () => {
    const earned = evaluateBadges({
      streakCurrent: 7, totalReviews: 10, totalNotes: 5, level: 3,
    });
    expect(earned).toContain('streak-7');
  });

  it('grants 첫노트 badge after first note', () => {
    const earned = evaluateBadges({
      streakCurrent: 0, totalReviews: 0, totalNotes: 1, level: 1,
    });
    expect(earned).toContain('first-note');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm run test -- xp`
Expected: FAIL

- [ ] **Step 3: 구현**

```typescript
// src/lib/xp.ts
export interface LevelDef { level: number; requiredXp: number; title: string }

export const LEVELS: LevelDef[] = [
  { level: 1, requiredXp: 0,    title: '학습자' },
  { level: 2, requiredXp: 100,  title: '독서가' },
  { level: 3, requiredXp: 300,  title: '필기왕' },
  { level: 4, requiredXp: 700,  title: '복습 마스터' },
  { level: 5, requiredXp: 1500, title: '연결자' },
  { level: 6, requiredXp: 2500, title: '지식 수집가' },
  { level: 7, requiredXp: 3000, title: '지식 탐험가' },
  { level: 8, requiredXp: 5000, title: '지식 큐레이터' },
  { level: 9, requiredXp: 7500, title: '지식 건축가' },
  { level: 10, requiredXp: 10000, title: '지식 마에스트로' },
];

export function levelFor(xp: number): { level: number; title: string; nextRequired: number | null } {
  let current = LEVELS[0]!;
  for (const l of LEVELS) {
    if (xp >= l.requiredXp) current = l;
    else break;
  }
  const next = LEVELS.find((l) => l.requiredXp > xp);
  return { level: current.level, title: current.title, nextRequired: next?.requiredXp ?? null };
}

export function xpForReview(): number { return 5; }
export function xpForNoteCreate(): number { return 10; }
export function xpForAiCardAccept(): number { return 3; }

export interface BadgeContext {
  streakCurrent: number;
  totalReviews: number;
  totalNotes: number;
  level: number;
}

export const BADGES = [
  { id: 'first-note', name: '첫 노트', criteria: (c: BadgeContext) => c.totalNotes >= 1 },
  { id: 'first-review', name: '첫 복습', criteria: (c: BadgeContext) => c.totalReviews >= 1 },
  { id: 'streak-7', name: '연속 학습 7일', criteria: (c: BadgeContext) => c.streakCurrent >= 7 },
  { id: 'streak-30', name: '연속 학습 30일', criteria: (c: BadgeContext) => c.streakCurrent >= 30 },
  { id: 'reviews-100', name: '복습 100회', criteria: (c: BadgeContext) => c.totalReviews >= 100 },
  { id: 'notes-50', name: '노트 50개', criteria: (c: BadgeContext) => c.totalNotes >= 50 },
  { id: 'level-5', name: '레벨 5', criteria: (c: BadgeContext) => c.level >= 5 },
  { id: 'level-10', name: '레벨 10', criteria: (c: BadgeContext) => c.level >= 10 },
];

export function evaluateBadges(ctx: BadgeContext): string[] {
  return BADGES.filter((b) => b.criteria(ctx)).map((b) => b.id);
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm run test -- xp`
Expected: 6 passed

- [ ] **Step 5: 커밋**

```bash
git add src/lib/xp.ts src/lib/__tests__/xp.test.ts
git commit -m "feat(lib): add XP/level table and badge evaluation"
```

---

### Task 3.5: notes Zustand store

**Files:**
- Create: `src/stores/use-notes.ts`
- Create: `src/stores/__tests__/use-notes.test.ts`

- [ ] **Step 1: 테스트 작성 (백링크 자동 추출 포함)**

```typescript
// src/stores/__tests__/use-notes.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useNotesStore } from '../use-notes';

describe('useNotesStore', () => {
  beforeEach(() => {
    useNotesStore.setState({ notes: {} });
  });

  it('upsert creates note with extracted outgoingLinks', () => {
    useNotesStore.getState().upsert({
      id: 'n1', title: 'A', contentMd: 'see [[B]] and [[C]]', tags: [],
    });
    const note = useNotesStore.getState().notes.n1!;
    expect(note.outgoingLinks).toEqual(expect.arrayContaining(['B', 'C']));
  });

  it('backlinksOf returns notes that link to given title', () => {
    const s = useNotesStore.getState();
    s.upsert({ id: 'n1', title: 'A', contentMd: 'links to [[B]]', tags: [] });
    s.upsert({ id: 'n2', title: 'B', contentMd: 'no links', tags: [] });
    s.upsert({ id: 'n3', title: 'C', contentMd: 'also [[B]]', tags: [] });
    const back = useNotesStore.getState().backlinksOf('B');
    expect(back.map((n) => n.id).sort()).toEqual(['n1', 'n3']);
  });

  it('remove deletes note', () => {
    useNotesStore.getState().upsert({ id: 'n1', title: 'A', contentMd: '', tags: [] });
    useNotesStore.getState().remove('n1');
    expect(useNotesStore.getState().notes.n1).toBeUndefined();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm run test -- use-notes`
Expected: FAIL

- [ ] **Step 3: 구현**

```typescript
// src/stores/use-notes.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { extractWikilinks } from '@/lib/wikilink';

export interface Note {
  id: string;
  title: string;
  contentMd: string;
  tags: string[];
  outgoingLinks: string[];
  createdAt: number;
  updatedAt: number;
}

interface NotesState {
  notes: Record<string, Note>;
  upsert: (input: { id: string; title: string; contentMd: string; tags: string[] }) => void;
  remove: (id: string) => void;
  byTag: (tag: string) => Note[];
  backlinksOf: (title: string) => Note[];
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: {},
      upsert: (input) =>
        set((s) => {
          const now = Date.now();
          const existing = s.notes[input.id];
          const note: Note = {
            id: input.id,
            title: input.title,
            contentMd: input.contentMd,
            tags: input.tags,
            outgoingLinks: extractWikilinks(input.contentMd),
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
          };
          return { notes: { ...s.notes, [input.id]: note } };
        }),
      remove: (id) =>
        set((s) => {
          const next = { ...s.notes };
          delete next[id];
          return { notes: next };
        }),
      byTag: (tag) => Object.values(get().notes).filter((n) => n.tags.includes(tag)),
      backlinksOf: (title) =>
        Object.values(get().notes).filter((n) => n.outgoingLinks.includes(title)),
    }),
    { name: 'synapse:notes', storage: createJSONStorage(() => localStorage) },
  ),
);
```

- [ ] **Step 4: 통과 확인**

Run: `npm run test -- use-notes`
Expected: 3 passed

- [ ] **Step 5: 커밋**

```bash
git add src/stores/use-notes.ts src/stores/__tests__/use-notes.test.ts
git commit -m "feat(store): add notes store with auto wikilink extraction"
```

---

### Task 3.6: decks-cards, reviews, game stores

**Files:**
- Create: `src/stores/use-decks-cards.ts`
- Create: `src/stores/use-reviews.ts`
- Create: `src/stores/use-game.ts`
- Create: `src/stores/__tests__/use-decks-cards.test.ts`
- Create: `src/stores/__tests__/use-game.test.ts`

- [ ] **Step 1: decks-cards 테스트 작성**

```typescript
// src/stores/__tests__/use-decks-cards.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useDecksCardsStore } from '../use-decks-cards';

describe('useDecksCardsStore', () => {
  beforeEach(() => useDecksCardsStore.setState({ decks: {}, cards: {} }));

  it('addDeck creates deck', () => {
    const s = useDecksCardsStore.getState();
    s.addDeck({ id: 'd1', name: 'ML', description: '' });
    expect(s.decks.d1?.name).toBe('ML');
  });

  it('addCards inserts cards into deck', () => {
    const s = useDecksCardsStore.getState();
    s.addDeck({ id: 'd1', name: 'ML', description: '' });
    s.addCards([
      { id: 'c1', deckId: 'd1', type: 'basic', front: 'Q', back: 'A' },
    ]);
    expect(useDecksCardsStore.getState().cards.c1?.deckId).toBe('d1');
  });

  it('cardsOfDeck returns cards filtered by deckId', () => {
    const s = useDecksCardsStore.getState();
    s.addDeck({ id: 'd1', name: '', description: '' });
    s.addDeck({ id: 'd2', name: '', description: '' });
    s.addCards([
      { id: 'c1', deckId: 'd1', type: 'basic', front: '', back: '' },
      { id: 'c2', deckId: 'd2', type: 'basic', front: '', back: '' },
    ]);
    expect(useDecksCardsStore.getState().cardsOfDeck('d1').map((c) => c.id)).toEqual(['c1']);
  });

  it('updateCardSrs updates srs state', () => {
    const s = useDecksCardsStore.getState();
    s.addDeck({ id: 'd1', name: '', description: '' });
    s.addCards([{ id: 'c1', deckId: 'd1', type: 'basic', front: '', back: '' }]);
    s.updateCardSrs('c1', { ef: 2.6, interval: 6, repetitions: 2, due: 1234, lastReviewed: 1234 }, 'review');
    expect(useDecksCardsStore.getState().cards.c1!.srs.ef).toBe(2.6);
    expect(useDecksCardsStore.getState().cards.c1!.status).toBe('review');
  });
});
```

- [ ] **Step 2: 실패 확인 후 구현**

```typescript
// src/stores/use-decks-cards.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { dueDateFrom, type SrsState } from '@/lib/sm2';

export interface Deck { id: string; name: string; description: string }

export type CardStatus = 'new' | 'learning' | 'review';

export interface Card {
  id: string;
  deckId: string;
  type: 'basic' | 'cloze';
  front: string;
  back: string;
  sourceNoteId?: string;
  srs: SrsState & { due: number; lastReviewed: number | null };
  status: CardStatus;
}

export interface CardInput {
  id: string;
  deckId: string;
  type: 'basic' | 'cloze';
  front: string;
  back: string;
  sourceNoteId?: string;
}

interface DecksCardsState {
  decks: Record<string, Deck>;
  cards: Record<string, Card>;
  addDeck: (d: Deck) => void;
  removeDeck: (id: string) => void;
  addCards: (cs: CardInput[]) => void;
  cardsOfDeck: (deckId: string) => Card[];
  dueCardsOfDeck: (deckId: string, now: number) => Card[];
  updateCardSrs: (cardId: string, srs: SrsState, status: CardStatus) => void;
}

export const useDecksCardsStore = create<DecksCardsState>()(
  persist(
    (set, get) => ({
      decks: {},
      cards: {},
      addDeck: (d) => set((s) => ({ decks: { ...s.decks, [d.id]: d } })),
      removeDeck: (id) =>
        set((s) => {
          const decks = { ...s.decks }; delete decks[id];
          const cards: Record<string, Card> = {};
          for (const [cid, c] of Object.entries(s.cards)) if (c.deckId !== id) cards[cid] = c;
          return { decks, cards };
        }),
      addCards: (cs) =>
        set((s) => {
          const next = { ...s.cards };
          const now = Date.now();
          for (const c of cs) {
            next[c.id] = {
              id: c.id, deckId: c.deckId, type: c.type, front: c.front, back: c.back,
              sourceNoteId: c.sourceNoteId,
              srs: { ef: 2.5, interval: 0, repetitions: 0, due: now, lastReviewed: null },
              status: 'new',
            };
          }
          return { cards: next };
        }),
      cardsOfDeck: (deckId) => Object.values(get().cards).filter((c) => c.deckId === deckId),
      dueCardsOfDeck: (deckId, now) =>
        Object.values(get().cards).filter((c) => c.deckId === deckId && c.srs.due <= now),
      updateCardSrs: (cardId, srs, status) =>
        set((s) => {
          const c = s.cards[cardId];
          if (!c) return s;
          const due = dueDateFrom(Date.now(), srs.interval);
          return {
            cards: {
              ...s.cards,
              [cardId]: {
                ...c,
                srs: { ...srs, due, lastReviewed: Date.now() },
                status,
              },
            },
          };
        }),
    }),
    { name: 'synapse:decks-cards', storage: createJSONStorage(() => localStorage) },
  ),
);
```

- [ ] **Step 3: reviews store 구현**

```typescript
// src/stores/use-reviews.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Rating } from '@/lib/sm2';

export interface Session {
  id: string;
  deckId: string;
  cardIds: string[];
  currentIndex: number;
  ratings: Array<{ cardId: string; rating: Rating; timeMs: number }>;
  startedAt: number;
  endedAt: number | null;
}

interface ReviewsState {
  sessions: Record<string, Session>;
  startSession: (input: { id: string; deckId: string; cardIds: string[] }) => void;
  recordRating: (sessionId: string, cardId: string, rating: Rating, timeMs: number) => void;
  advance: (sessionId: string) => void;
  completeSession: (sessionId: string) => void;
}

export const useReviewsStore = create<ReviewsState>()(
  persist(
    (set) => ({
      sessions: {},
      startSession: ({ id, deckId, cardIds }) =>
        set((s) => ({
          sessions: {
            ...s.sessions,
            [id]: { id, deckId, cardIds, currentIndex: 0, ratings: [], startedAt: Date.now(), endedAt: null },
          },
        })),
      recordRating: (sessionId, cardId, rating, timeMs) =>
        set((s) => {
          const sess = s.sessions[sessionId];
          if (!sess) return s;
          return {
            sessions: { ...s.sessions, [sessionId]: { ...sess, ratings: [...sess.ratings, { cardId, rating, timeMs }] } },
          };
        }),
      advance: (sessionId) =>
        set((s) => {
          const sess = s.sessions[sessionId];
          if (!sess) return s;
          return {
            sessions: { ...s.sessions, [sessionId]: { ...sess, currentIndex: sess.currentIndex + 1 } },
          };
        }),
      completeSession: (sessionId) =>
        set((s) => {
          const sess = s.sessions[sessionId];
          if (!sess) return s;
          return { sessions: { ...s.sessions, [sessionId]: { ...sess, endedAt: Date.now() } } };
        }),
    }),
    { name: 'synapse:reviews', storage: createJSONStorage(() => localStorage) },
  ),
);
```

- [ ] **Step 4: game 테스트 작성**

```typescript
// src/stores/__tests__/use-game.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../use-game';

describe('useGameStore', () => {
  beforeEach(() =>
    useGameStore.setState({
      xp: 0, level: 1, title: '학습자',
      streak: { current: 0, longest: 0, lastActiveDate: '' },
      badges: {}, weeklyStats: { reviewed: 0, notesCreated: 0, xpGained: 0 },
    }),
  );

  it('addXp increases xp and updates level/title when threshold crossed', () => {
    useGameStore.getState().addXp(3000);
    const s = useGameStore.getState();
    expect(s.xp).toBe(3000);
    expect(s.level).toBe(7);
    expect(s.title).toBe('지식 탐험가');
  });

  it('addXp returns levelUp flag when threshold crossed', () => {
    const r = useGameStore.getState().addXp(3000);
    expect(r.leveledUp).toBe(true);
    expect(r.newLevel).toBe(7);
  });

  it('addXp does not levelUp when threshold not crossed', () => {
    const r = useGameStore.getState().addXp(50);
    expect(r.leveledUp).toBe(false);
  });

  it('grantBadge marks badge as earned', () => {
    useGameStore.getState().grantBadge('streak-7');
    expect(useGameStore.getState().badges['streak-7']?.earnedAt).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 5: game store 구현**

```typescript
// src/stores/use-game.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { levelFor } from '@/lib/xp';

interface Streak { current: number; longest: number; lastActiveDate: string }
interface BadgeRecord { earnedAt: number | null }

interface GameState {
  xp: number;
  level: number;
  title: string;
  streak: Streak;
  badges: Record<string, BadgeRecord>;
  weeklyStats: { reviewed: number; notesCreated: number; xpGained: number };
  addXp: (amount: number) => { leveledUp: boolean; newLevel: number; oldLevel: number };
  registerActivity: (date: string) => void;
  grantBadge: (id: string) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      title: '학습자',
      streak: { current: 0, longest: 0, lastActiveDate: '' },
      badges: {},
      weeklyStats: { reviewed: 0, notesCreated: 0, xpGained: 0 },
      addXp: (amount) => {
        const oldLevel = get().level;
        const newXp = get().xp + amount;
        const { level, title } = levelFor(newXp);
        set((s) => ({
          xp: newXp, level, title,
          weeklyStats: { ...s.weeklyStats, xpGained: s.weeklyStats.xpGained + amount },
        }));
        return { leveledUp: level > oldLevel, newLevel: level, oldLevel };
      },
      registerActivity: (date) =>
        set((s) => {
          if (s.streak.lastActiveDate === date) return s;
          const yesterday = new Date(new Date(date).getTime() - 86400000).toISOString().slice(0, 10);
          const isContinuation = s.streak.lastActiveDate === yesterday;
          const current = isContinuation ? s.streak.current + 1 : 1;
          return {
            streak: { current, longest: Math.max(current, s.streak.longest), lastActiveDate: date },
          };
        }),
      grantBadge: (id) =>
        set((s) => ({ badges: { ...s.badges, [id]: { earnedAt: Date.now() } } })),
    }),
    { name: 'synapse:game', storage: createJSONStorage(() => localStorage) },
  ),
);
```

- [ ] **Step 6: 검증 및 커밋**

Run: `npm run test`
Expected: 모든 테스트 통과 (decks-cards 4 + game 4 + 기존)

```bash
git add src/stores src/stores/__tests__
git commit -m "feat(store): add decks-cards, reviews, game stores"
```

---

### Task 3.7: notifications, groups, demo stores

**Files:**
- Create: `src/stores/use-notifications.ts`
- Create: `src/stores/use-groups.ts`
- Create: `src/stores/use-demo.ts`

- [ ] **Step 1: notifications store**

```typescript
// src/stores/use-notifications.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type NotificationCategory = 'review' | 'community' | 'achievement' | 'system';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  icon: string;
  createdAt: number;
  read: boolean;
}

interface NotificationsState {
  items: NotificationItem[];
  add: (item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (input) =>
        set((s) => ({
          items: [
            { ...input, id: crypto.randomUUID(), createdAt: Date.now(), read: false },
            ...s.items,
          ],
        })),
      markRead: (id) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, read: true } : i)) })),
      markAllRead: () => set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })) })),
      unreadCount: () => get().items.filter((i) => !i.read).length,
    }),
    { name: 'synapse:notifications', storage: createJSONStorage(() => localStorage) },
  ),
);
```

- [ ] **Step 2: groups store (정적 시드용, action 최소)**

```typescript
// src/stores/use-groups.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Group {
  id: string;
  name: string;
  description: string;
  joinType: 'open' | 'approval' | 'invite';
  memberCount: number;
  maxMembers: number;
  sharedDeckCount: number;
  lastActivityAt: number;
  joined: boolean;
}

interface GroupsState {
  groups: Record<string, Group>;
  upsert: (g: Group) => void;
  myGroups: () => Group[];
  exploreGroups: () => Group[];
}

export const useGroupsStore = create<GroupsState>()(
  persist(
    (set, get) => ({
      groups: {},
      upsert: (g) => set((s) => ({ groups: { ...s.groups, [g.id]: g } })),
      myGroups: () => Object.values(get().groups).filter((g) => g.joined),
      exploreGroups: () => Object.values(get().groups).filter((g) => !g.joined),
    }),
    { name: 'synapse:groups', storage: createJSONStorage(() => localStorage) },
  ),
);
```

- [ ] **Step 3: demo store (모드 토글 + 초기화)**

```typescript
// src/stores/use-demo.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DemoState {
  seeded: boolean;
  setSeeded: (v: boolean) => void;
  reset: () => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      seeded: false,
      setSeeded: (v) => set({ seeded: v }),
      reset: () => {
        const keys = ['synapse:notes', 'synapse:decks-cards', 'synapse:reviews', 'synapse:game', 'synapse:notifications', 'synapse:groups', 'synapse:demo'];
        for (const k of keys) localStorage.removeItem(k);
        // forces re-seed on next mount via SeedGuard (Task 3.9)
        set({ seeded: false });
      },
    }),
    { name: 'synapse:demo', storage: createJSONStorage(() => localStorage) },
  ),
);
```

- [ ] **Step 4: 검증 및 커밋**

Run: `npm run typecheck` → 0 errors
Run: `npm run test` → 모두 통과

```bash
git add src/stores
git commit -m "feat(store): add notifications, groups, demo stores"
```

---

### Task 3.8: 시드 데이터 (페르소나 P1 김시냅스)

**Files:**
- Create: `src/data/seed.ts`
- Create: `src/data/ai-templates.ts`
- Create: `src/data/search-corpus.ts`
- Create: `src/data/notifications-seed.ts`

- [ ] **Step 1: seed.ts (노트/덱/카드/게임/그룹)**

```typescript
// src/data/seed.ts
import { ulid } from 'ulid';
import type { Note } from '@/stores/use-notes';
import type { Deck, Card } from '@/stores/use-decks-cards';
import type { Group } from '@/stores/use-groups';
import { extractWikilinks } from '@/lib/wikilink';
import { dueDateFrom } from '@/lib/sm2';

const now = Date.now();

function note(id: string, title: string, contentMd: string, tags: string[] = []): Note {
  return {
    id, title, contentMd, tags,
    outgoingLinks: extractWikilinks(contentMd),
    createdAt: now - 86400000 * 30,
    updatedAt: now - 86400000,
  };
}

export const SEED_NOTES: Note[] = [
  note('seed-n1', 'ML 정규화 기법',
    '# ML 정규화 기법\n\n## 개요\n[[과적합]] 방지를 위한 기법들을 정리한다.\n\n## L1 정규화\n[[Lasso]]: 가중치의 절대값 합을 페널티로 부과.\n\n## L2 정규화\n[[Ridge]]: 가중치의 제곱합을 페널티로 부과. [[가중치]]\n\n## [[드롭아웃]]\n훈련 시 뉴런을 무작위 비활성화.', ['머신러닝', '정규화']),
  note('seed-n2', '과적합',
    '# 과적합\n\n학습 데이터에 너무 잘 맞는 모델이 일반화 실패.\n해결: [[정규화]], [[교차검증]], 더 많은 데이터.', ['머신러닝']),
  note('seed-n3', '드롭아웃',
    '# 드롭아웃\n\n뉴런을 확률적으로 비활성화하는 [[정규화]] 기법.', ['머신러닝']),
  note('seed-n4', 'Lasso',
    '# L1 정규화 (Lasso)\n\nL1 페널티는 [[과적합]]을 방지하면서 sparse 솔루션을 유도.', ['머신러닝']),
  note('seed-n5', 'Ridge',
    '# L2 정규화 (Ridge)\n\nL2 페널티는 [[가중치]]를 작게 유지.', ['머신러닝']),
  note('seed-n6', '가중치',
    '# 가중치\n\n뉴럴넷 파라미터. 초기화 방법 (Xavier/He)이 학습에 큰 영향.', ['딥러닝']),
  note('seed-n7', 'TCP/UDP 비교',
    '# TCP vs UDP\n\nTCP: 연결지향, 신뢰성 보장.\nUDP: 비연결, 빠른 속도.', ['네트워크']),
  note('seed-n8', '디자인 패턴',
    '# 디자인 패턴\n\n자주 쓰이는 패턴: [[싱글톤]], [[옵저버 패턴]], [[팩토리 패턴]].', ['아키텍처']),
  note('seed-n9', '싱글톤',
    '# 싱글톤\n\n클래스의 인스턴스가 단 하나임을 보장하는 패턴.', ['아키텍처']),
  note('seed-n10', '옵저버 패턴',
    '# 옵저버 패턴\n\n상태 변화 시 의존 객체에 자동 통지하는 패턴.', ['아키텍처']),
];

export const SEED_DECKS: Deck[] = [
  { id: 'seed-d1', name: '프로그래밍', description: '언어/패턴 일반' },
  { id: 'seed-d2', name: 'ML 기초', description: '머신러닝 핵심 개념' },
  { id: 'seed-d3', name: 'AWS SAA', description: 'AWS 솔루션 아키텍트 자격증' },
];

function card(id: string, deckId: string, front: string, back: string, dueOffsetDays: number, sourceNoteId?: string): Card {
  return {
    id, deckId, type: 'basic', front, back, sourceNoteId,
    srs: { ef: 2.5, interval: dueOffsetDays >= 0 ? 0 : Math.abs(dueOffsetDays), repetitions: 0,
           due: dueDateFrom(now, dueOffsetDays), lastReviewed: null },
    status: dueOffsetDays <= 0 ? 'review' : 'new',
  };
}

export const SEED_CARDS: Card[] = [
  // 프로그래밍 (12장, 5장 due now)
  card('seed-c1',  'seed-d1', 'TCP와 UDP의 주요 차이점은?', 'TCP: 연결지향, 신뢰성. UDP: 비연결, 속도.', 0, 'seed-n7'),
  card('seed-c2',  'seed-d1', '싱글톤 패턴이란?', '인스턴스가 단 하나임을 보장하는 디자인 패턴', 0, 'seed-n9'),
  card('seed-c3',  'seed-d1', '옵저버 패턴이란?', '상태 변화 시 의존 객체에 자동 통지하는 패턴', 0, 'seed-n10'),
  card('seed-c4',  'seed-d1', 'REST API의 멱등성이란?', '같은 요청을 여러 번 호출해도 결과가 동일한 성질', 0),
  card('seed-c5',  'seed-d1', '쓰레드와 프로세스 차이?', '프로세스는 자원 단위, 쓰레드는 실행 흐름 단위', 0),
  card('seed-c6',  'seed-d1', 'OOP 4대 원칙은?', '캡슐화, 상속, 다형성, 추상화', 1),
  card('seed-c7',  'seed-d1', 'SQL JOIN 종류는?', 'INNER, LEFT, RIGHT, FULL OUTER', 2),
  card('seed-c8',  'seed-d1', 'Git rebase와 merge 차이?', 'rebase는 선형 history, merge는 병합 커밋 생성', 3),
  card('seed-c9',  'seed-d1', 'HTTP 상태 4xx 의미는?', '클라이언트 측 오류', 5),
  card('seed-c10', 'seed-d1', 'CORS란?', 'Cross-Origin Resource Sharing — 다른 출처 자원 접근 제어', 7),
  card('seed-c11', 'seed-d1', 'Big-O O(n log n) 예시?', 'Merge sort, Heap sort', 14),
  card('seed-c12', 'seed-d1', 'CAP 정리란?', 'Consistency, Availability, Partition tolerance 중 둘만 동시 보장', 30),
  // ML 기초 (8장, 8장 모두 due — 발표 시연용)
  card('seed-c13', 'seed-d2', 'L1 정규화의 효과는?', 'Sparse 솔루션 유도, feature selection 효과', 0, 'seed-n4'),
  card('seed-c14', 'seed-d2', 'L2 정규화의 효과는?', '가중치를 작게 유지하여 과적합 방지', 0, 'seed-n5'),
  card('seed-c15', 'seed-d2', '드롭아웃의 원리는?', '훈련 시 뉴런을 무작위 비활성화하여 정규화 효과', 0, 'seed-n3'),
  card('seed-c16', 'seed-d2', '과적합 정의?', '학습 데이터에는 잘 맞지만 일반화 실패하는 현상', 0, 'seed-n2'),
  card('seed-c17', 'seed-d2', '교차검증의 목적은?', '데이터 활용 극대화 + 일반화 성능 추정', 0),
  card('seed-c18', 'seed-d2', 'Xavier 초기화란?', '입출력 노드 수에 따라 가중치 초기 분산 조정', 0, 'seed-n6'),
  card('seed-c19', 'seed-d2', '경사하강법이란?', '손실 함수를 미분하여 파라미터를 점진 갱신', 0),
  card('seed-c20', 'seed-d2', 'Adam 옵티마이저 특징?', 'Momentum + RMSProp 결합. 적응적 학습률.', 0),
  // AWS SAA (10장, 12장 due/12장 안되도록 일부)
  card('seed-c21', 'seed-d3', 'EC2 인스턴스 타입 m5 c5 r5 차이?', 'm: 범용, c: 컴퓨팅 최적화, r: 메모리 최적화', 0),
  card('seed-c22', 'seed-d3', 'S3 스토리지 클래스?', 'Standard, IA, One Zone-IA, Glacier 등', 0),
  card('seed-c23', 'seed-d3', 'VPC와 서브넷 관계?', 'VPC는 가상 네트워크, 서브넷은 그 안의 IP 범위', 0),
  card('seed-c24', 'seed-d3', 'RDS Multi-AZ 목적?', '고가용성 — 동기 복제로 대기 인스턴스 운영', 0),
  card('seed-c25', 'seed-d3', 'IAM Role과 User 차이?', 'User는 영구 자격, Role은 임시 자격(STS)', 0),
  card('seed-c26', 'seed-d3', 'CloudFront란?', 'AWS의 CDN 서비스', 1),
  card('seed-c27', 'seed-d3', 'Auto Scaling Group 동작?', 'CloudWatch 지표 기반 인스턴스 자동 증감', 2),
  card('seed-c28', 'seed-d3', 'SQS와 SNS 차이?', 'SQS는 큐, SNS는 pub/sub 알림', 5),
  card('seed-c29', 'seed-d3', 'Lambda 콜드 스타트?', '컨테이너 초기화 시 발생하는 첫 호출 지연', 7),
  card('seed-c30', 'seed-d3', 'Route 53 라우팅 정책?', 'Simple, Weighted, Latency, Failover, Geolocation 등', 14),
];

export const SEED_GAME = {
  xp: 3240,
  level: 7,
  title: '지식 탐험가',
  streak: { current: 14, longest: 21, lastActiveDate: new Date(now).toISOString().slice(0, 10) },
  badges: {
    'first-note': { earnedAt: now - 86400000 * 30 },
    'first-review': { earnedAt: now - 86400000 * 29 },
    'streak-7': { earnedAt: now - 86400000 * 7 },
    'reviews-100': { earnedAt: now - 86400000 * 14 },
    'level-5': { earnedAt: now - 86400000 * 10 },
  },
  weeklyStats: { reviewed: 152, notesCreated: 8, xpGained: 420 },
};

export const SEED_GROUPS: Group[] = [
  { id: 'seed-g1', name: 'AWS 자격증 스터디', description: 'SAA 준비',
    joinType: 'approval', memberCount: 8, maxMembers: 20, sharedDeckCount: 3,
    lastActivityAt: now - 7200000, joined: true },
  { id: 'seed-g2', name: '알고리즘 마스터즈', description: 'PS 함께',
    joinType: 'open', memberCount: 15, maxMembers: 30, sharedDeckCount: 7,
    lastActivityAt: now - 86400000, joined: true },
  { id: 'seed-g3', name: '딥러닝 논문 읽기', description: '주 1회 논문',
    joinType: 'invite', memberCount: 6, maxMembers: 10, sharedDeckCount: 2,
    lastActivityAt: now - 86400000 * 2, joined: false },
  { id: 'seed-g4', name: 'Synapse 사용자 모임', description: '데일리 학습 공유',
    joinType: 'open', memberCount: 42, maxMembers: 100, sharedDeckCount: 15,
    lastActivityAt: now - 3600000, joined: false },
];
```

- [ ] **Step 2: notifications-seed.ts**

```typescript
// src/data/notifications-seed.ts
import type { NotificationItem } from '@/stores/use-notifications';

const now = Date.now();

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  { id: 'sn1', category: 'achievement', icon: '🏆',
    title: '레벨업! 지식 탐험가로 성장했습니다',
    body: '레벨 6 → 레벨 7 달성', createdAt: now - 3600000, read: false },
  { id: 'sn2', category: 'community', icon: '📚',
    title: 'AWS 자격증 스터디에 새 덱이 공유되었습니다',
    body: '홍길동님이 "EC2 심화" 덱을 공유했습니다', createdAt: now - 10800000, read: false },
  { id: 'sn3', category: 'review', icon: '🔔',
    title: '오늘 복습할 카드가 25장 있습니다',
    body: 'AWS SAA 덱 외 2개 덱', createdAt: now - 28800000, read: false },
  { id: 'sn4', category: 'achievement', icon: '🎖',
    title: '배지 획득: "연속 학습 7일"',
    body: '꾸준함이 자산입니다', createdAt: now - 86400000, read: true },
  { id: 'sn5', category: 'community', icon: '👥',
    title: '김개발님이 스터디 그룹 가입 신청',
    body: '알고리즘 마스터즈 그룹', createdAt: now - 86400000 - 7200000, read: true },
];
```

- [ ] **Step 3: ai-templates.ts (시드 노트별 큐레이션)**

```typescript
// src/data/ai-templates.ts
export interface AICardTemplate { front: string; back: string; type: 'basic' | 'cloze' }

// 시드 노트별 큐레이션된 5장씩 (발표 시연 임팩트 보장)
export const CURATED: Record<string, AICardTemplate[]> = {
  'seed-n1': [
    { type: 'basic', front: '정규화의 목적은?', back: '과적합을 방지하고 일반화 성능 향상' },
    { type: 'basic', front: 'L1과 L2 정규화의 차이?', back: 'L1은 sparse 솔루션 유도, L2는 가중치를 작게 유지' },
    { type: 'basic', front: '드롭아웃이란?', back: '훈련 시 뉴런을 무작위 비활성화하는 정규화 기법' },
    { type: 'cloze', front: '{{c1::Lasso}}는 L1 정규화, {{c2::Ridge}}는 L2 정규화', back: 'Lasso=L1, Ridge=L2' },
    { type: 'basic', front: '정규화 외 과적합 방지법?', back: '교차검증, 더 많은 데이터, early stopping' },
  ],
  'seed-n7': [
    { type: 'basic', front: 'TCP는 연결지향이다 (O/X)', back: 'O' },
    { type: 'basic', front: 'UDP의 장점은?', back: '빠른 속도, 낮은 오버헤드, 실시간성' },
    { type: 'basic', front: 'TCP의 신뢰성 보장 메커니즘은?', back: '시퀀스 번호, ACK, 재전송, 흐름/혼잡 제어' },
    { type: 'basic', front: 'UDP가 유리한 사례?', back: 'DNS, 실시간 영상/음성, 게임' },
    { type: 'cloze', front: '{{c1::TCP}}는 신뢰성, {{c2::UDP}}는 속도', back: 'TCP/UDP 트레이드오프' },
  ],
  // ... 다른 시드 노트들도 동일 패턴 (구현 시 5개 더 추가)
};

// 동적 fallback: 노트 본문 → Q/A 5쌍
export function generateCardsFromContent(contentMd: string): AICardTemplate[] {
  const headings = [...contentMd.matchAll(/^##\s+(.+?)$/gm)].map((m) => m[1] ?? '');
  const sections = headings.slice(0, 5);
  return sections.map((h) => ({
    type: 'basic' as const,
    front: `${h}이란?`,
    back: extractFirstParagraphAfter(contentMd, h),
  }));
}

function extractFirstParagraphAfter(md: string, heading: string): string {
  const re = new RegExp(`##\\s+${heading.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*\\n+([^\\n#]+)`, 'm');
  const m = md.match(re);
  return m?.[1]?.trim() ?? '내용 정리 필요';
}
```

- [ ] **Step 4: search-corpus.ts (시맨틱 검색 시드 + TF-IDF 8차원 임베딩)**

```typescript
// src/data/search-corpus.ts
// 8차원 TF-IDF 근사 임베딩 — 발표 임팩트용 시드 데이터
// 차원: [머신러닝, 정규화, 네트워크, 디자인패턴, AWS, 알고리즘, 데이터베이스, 일반]
export interface CorpusEntry {
  noteId: string;
  embedding: number[]; // 8차원
}

export const SEED_CORPUS: CorpusEntry[] = [
  { noteId: 'seed-n1', embedding: [0.9, 0.95, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1] },
  { noteId: 'seed-n2', embedding: [0.95, 0.7, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1] },
  { noteId: 'seed-n3', embedding: [0.85, 0.85, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1] },
  { noteId: 'seed-n4', embedding: [0.8, 0.95, 0.0, 0.0, 0.0, 0.0, 0.0, 0.05] },
  { noteId: 'seed-n5', embedding: [0.8, 0.95, 0.0, 0.0, 0.0, 0.0, 0.0, 0.05] },
  { noteId: 'seed-n6', embedding: [0.7, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2] },
  { noteId: 'seed-n7', embedding: [0.0, 0.0, 0.95, 0.0, 0.0, 0.0, 0.0, 0.1] },
  { noteId: 'seed-n8', embedding: [0.0, 0.0, 0.0, 0.95, 0.0, 0.0, 0.0, 0.1] },
  { noteId: 'seed-n9', embedding: [0.0, 0.0, 0.0, 0.85, 0.0, 0.0, 0.0, 0.1] },
  { noteId: 'seed-n10', embedding: [0.0, 0.0, 0.0, 0.85, 0.0, 0.0, 0.0, 0.1] },
];

// 쿼리 → 8차원 vec (간단한 키워드 매칭으로 차원 활성)
export function vectorize(query: string): number[] {
  const q = query.toLowerCase();
  const v = [0, 0, 0, 0, 0, 0, 0, 0];
  if (/머신러닝|딥러닝|ml|신경망|뉴럴/.test(q)) v[0] = 1;
  if (/정규화|과적합|드롭아웃|regulariz|overfit|dropout/.test(q)) v[1] = 1;
  if (/네트워크|tcp|udp|http|ip/.test(q)) v[2] = 1;
  if (/패턴|싱글톤|옵저버|팩토리|design pattern/.test(q)) v[3] = 1;
  if (/aws|클라우드|ec2|s3|lambda/.test(q)) v[4] = 1;
  if (/알고리즘|정렬|big-o|자료구조/.test(q)) v[5] = 1;
  if (/sql|database|db|postgres/.test(q)) v[6] = 1;
  v[7] = v.reduce((a, b) => a + b, 0) === 0 ? 1 : 0;
  return v;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
    na += (a[i] ?? 0) ** 2;
    nb += (b[i] ?? 0) ** 2;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
```

- [ ] **Step 5: 커밋**

```bash
git add src/data
git commit -m "feat(data): add seed data for P1 persona (notes/decks/cards/game/groups/notifications/corpus)"
```

---

### Task 3.9: SeedGuard 컴포넌트 — 첫 진입 시 시드 주입

**Files:**
- Create: `src/components/SeedGuard.tsx`
- Modify: `src/App.tsx` (SeedGuard wrap)

- [ ] **Step 1: SeedGuard 구현**

```typescript
// src/components/SeedGuard.tsx
import { useEffect, type ReactNode } from 'react';
import { useDemoStore } from '@/stores/use-demo';
import { useNotesStore } from '@/stores/use-notes';
import { useDecksCardsStore } from '@/stores/use-decks-cards';
import { useGameStore } from '@/stores/use-game';
import { useNotificationsStore } from '@/stores/use-notifications';
import { useGroupsStore } from '@/stores/use-groups';
import { SEED_NOTES, SEED_DECKS, SEED_CARDS, SEED_GAME, SEED_GROUPS } from '@/data/seed';
import { SEED_NOTIFICATIONS } from '@/data/notifications-seed';

export function SeedGuard({ children }: { children: ReactNode }) {
  const seeded = useDemoStore((s) => s.seeded);
  const setSeeded = useDemoStore((s) => s.setSeeded);

  useEffect(() => {
    if (seeded) return;

    useNotesStore.setState({
      notes: Object.fromEntries(SEED_NOTES.map((n) => [n.id, n])),
    });
    useDecksCardsStore.setState({
      decks: Object.fromEntries(SEED_DECKS.map((d) => [d.id, d])),
      cards: Object.fromEntries(SEED_CARDS.map((c) => [c.id, c])),
    });
    useGameStore.setState(SEED_GAME);
    useNotificationsStore.setState({ items: SEED_NOTIFICATIONS });
    useGroupsStore.setState({
      groups: Object.fromEntries(SEED_GROUPS.map((g) => [g.id, g])),
    });
    setSeeded(true);
  }, [seeded, setSeeded]);

  return <>{children}</>;
}
```

- [ ] **Step 2: App.tsx에 SeedGuard 적용**

```typescript
// src/App.tsx — SeedGuard wrap만 추가
import { SeedGuard } from './components/SeedGuard';
// ... 기존 imports

export default function App() {
  return (
    <SeedGuard>
      <BrowserRouter basename="/synapse-prototype">
        {/* 기존 Routes */}
      </BrowserRouter>
    </SeedGuard>
  );
}
```

- [ ] **Step 3: 검증**

Run: `npm run dev` → http://localhost:5173/synapse-prototype/app
DevTools → Application → Local Storage:
- `synapse:notes`에 10개 노트
- `synapse:decks-cards`에 3덱/30카드
- `synapse:game`에 xp:3240, level:7, title:"지식 탐험가"
- `synapse:notifications`에 5개
- `synapse:groups`에 4개
- `synapse:demo`에 seeded:true

- [ ] **Step 4: 커밋**

```bash
git add src/components/SeedGuard.tsx src/App.tsx
git commit -m "feat: add SeedGuard to bootstrap localStorage on first visit"
```

---

## Milestone 3 완료 조건

- [ ] `src/lib`의 sm2/wikilink/graph/xp 모두 단위 테스트 통과 (총 ~22개 테스트)
- [ ] 7개 Zustand stores 정의 + 각각 localStorage persist
- [ ] notes store 단위 테스트 (백링크 자동 추출)
- [ ] decks-cards store 단위 테스트 (CRUD + SRS 갱신)
- [ ] game store 단위 테스트 (XP/레벨/배지)
- [ ] 시드 데이터 (P1 김시냅스): 10 노트 / 3 덱 / 30 카드 / XP 3240 / 레벨 7 / 14일 스트릭 / 12 배지 중 5 획득 / 5 알림 / 4 그룹
- [ ] SeedGuard로 첫 진입 시 자동 주입, 새로고침해도 유지
- [ ] `npm run test` 모두 통과 (~25개)
- [ ] `npm run typecheck` 0 errors

---

## Milestone 4 — Tier 1 Screens (Core PKM-SRS-AI Loop)

### Task 4.1: 메인 대시보드 (`/app`)

**Files:**
- Modify: `src/routes/app/Dashboard.tsx`
- Create: `src/components/feature/StreakFlame.tsx`
- Create: `src/components/feature/XPProgressBar.tsx`

- [ ] **Step 1: StreakFlame 구현**

```typescript
// src/components/feature/StreakFlame.tsx
export function StreakFlame({ days }: { days: number }) {
  const accent = days >= 7 ? '#B45309' : '#D97706';
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" style={{ color: accent }} className="text-2xl">🔥</span>
      <div>
        <div style={{ color: '#292524' }} className="display text-xl tabular-nums">{days}</div>
        <div className="text-xs text-stone-500">일 연속</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: XPProgressBar 구현**

```typescript
// src/components/feature/XPProgressBar.tsx
import { levelFor } from '@/lib/xp';

export function XPProgressBar({ xp, compact = false }: { xp: number; compact?: boolean }) {
  const { level, title, nextRequired } = levelFor(xp);
  const prevRequired = (() => {
    const arr = [0, 100, 300, 700, 1500, 2500, 3000, 5000, 7500, 10000];
    return arr[Math.max(0, level - 1)] ?? 0;
  })();
  const range = (nextRequired ?? xp + 1) - prevRequired;
  const progress = Math.min(1, (xp - prevRequired) / range);

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="display text-lg text-stone-900">레벨 {level}</span>
        <span className="text-xs text-stone-500">{title}</span>
      </div>
      <div className={`bg-stone-200 rounded-full ${compact ? 'h-1' : 'h-2'} overflow-hidden`}>
        <div
          style={{ width: `${progress * 100}%`, background: 'linear-gradient(to right, #D97706, #B45309)' }}
          className="h-full transition-[width] duration-300 ease-out"
        />
      </div>
      <div className="text-xs text-stone-500 tabular-nums">
        {xp.toLocaleString()} {nextRequired ? `/ ${nextRequired.toLocaleString()}` : ''} XP
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Dashboard 구현**

```typescript
// src/routes/app/Dashboard.tsx
import { Link } from 'react-router';
import { Card, Button } from '@/components/ds';
import { StreakFlame } from '@/components/feature/StreakFlame';
import { XPProgressBar } from '@/components/feature/XPProgressBar';
import { useNotesStore } from '@/stores/use-notes';
import { useDecksCardsStore } from '@/stores/use-decks-cards';
import { useGameStore } from '@/stores/use-game';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function Dashboard() {
  const notes = useNotesStore((s) => Object.values(s.notes));
  const cards = useDecksCardsStore((s) => Object.values(s.cards));
  const game = useGameStore();
  const recentNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  const now = Date.now();
  const dueCount = cards.filter((c) => c.srs.due <= now).length;
  const newCount = cards.filter((c) => c.status === 'new').length;
  const learningCount = cards.filter((c) => c.status === 'learning').length;

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <h1 className="display text-3xl text-stone-900">대시보드</h1>

      <Card elevated>
        <h2 className="display text-2xl mb-3">📚 오늘의 복습</h2>
        <p className="text-stone-600 mb-4">복습할 카드: <span className="display text-3xl text-[#D97706] mx-1">{dueCount}</span>장</p>
        <ul className="text-sm text-stone-700 space-y-1 mb-4">
          <li>├─ 복습 대기: {dueCount - newCount - learningCount}장</li>
          <li>├─ 학습 중: {learningCount}장</li>
          <li>└─ 새 카드: {newCount}장</li>
        </ul>
        <Link to="/app/decks">
          <Button>▶ 복습 시작하기</Button>
        </Link>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-medium text-stone-600 mb-3">학습 통계</h3>
          <XPProgressBar xp={game.xp} />
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div><div className="text-stone-500">이번 주 복습</div><div className="display text-xl">{game.weeklyStats.reviewed}</div></div>
            <div><div className="text-stone-500">노트</div><div className="display text-xl">{game.weeklyStats.notesCreated}</div></div>
            <div><div className="text-stone-500">XP</div><div className="display text-xl">+{game.weeklyStats.xpGained}</div></div>
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-stone-600 mb-3">연속 학습</h3>
          <StreakFlame days={game.streak.current} />
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-medium text-stone-600 mb-3">최근 노트</h3>
        <ul className="divide-y divide-stone-200">
          {recentNotes.map((n) => (
            <li key={n.id} className="py-2">
              <Link to={`/app/notes/${n.id}`} className="flex justify-between hover:text-[#D97706]">
                <span>• {n.title}</span>
                <span className="text-xs text-stone-500">{formatDistanceToNow(n.updatedAt, { locale: ko, addSuffix: true })}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <Link to="/app/notes/new"><Button variant="secondary">+ 새 노트 작성</Button></Link>
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: 검증**

Run: `npm run dev` → http://localhost:5173/synapse-prototype/app
Browser:
- "복습할 카드: 13장" (시드의 due 카드 수)
- 레벨 7 / 지식 탐험가 / 3,240 XP
- 🔥 14일 연속
- 최근 노트 5개 (시드 노트 중 updatedAt desc)

- [ ] **Step 5: 커밋**

```bash
git add src/routes/app/Dashboard.tsx src/components/feature
git commit -m "feat(dashboard): implement main dashboard with stores"
```

---

### Task 4.2: 노트 목록 (`/app/notes`)

**Files:**
- Modify: `src/routes/app/notes/List.tsx`

- [ ] **Step 1: 구현**

```typescript
// src/routes/app/notes/List.tsx
import { useState } from 'react';
import { Link } from 'react-router';
import { Card, Button, Input, Badge } from '@/components/ds';
import { useNotesStore } from '@/stores/use-notes';

export default function NotesList() {
  const notes = useNotesStore((s) => Object.values(s.notes));
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));
  const filtered = notes
    .filter((n) => (tag ? n.tags.includes(tag) : true))
    .filter((n) =>
      query
        ? n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.contentMd.toLowerCase().includes(query.toLowerCase())
        : true,
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="display text-3xl">노트 ({filtered.length})</h1>
        <Link to="/app/notes/new"><Button>+ 새 노트</Button></Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <Input placeholder="노트 검색…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setTag(null)} className={`text-xs px-2 py-1 rounded-full ${!tag ? 'bg-[#D97706] text-white' : 'bg-stone-200 text-stone-700'}`}>전체</button>
          {allTags.map((t) => (
            <button key={t} onClick={() => setTag(t)} className={`text-xs px-2 py-1 rounded-full ${tag === t ? 'bg-[#D97706] text-white' : 'bg-stone-200 text-stone-700'}`}>#{t}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((n) => (
          <Link key={n.id} to={`/app/notes/${n.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="display text-lg mb-1 line-clamp-1">{n.title}</h3>
              <p className="text-sm text-stone-600 line-clamp-2 mb-2">{n.contentMd.replace(/[#*\[\]]/g, '').slice(0, 100)}</p>
              <div className="flex gap-1 flex-wrap">
                {n.tags.map((t) => <Badge key={t} tone="amber">#{t}</Badge>)}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 검증** — http://localhost:5173/synapse-prototype/app/notes
  - 10개 노트 카드 표시
  - 검색어 입력 시 필터링
  - 태그 클릭 시 필터링

- [ ] **Step 3: 커밋**

```bash
git add src/routes/app/notes/List.tsx
git commit -m "feat(notes): implement notes list with search and tag filter"
```

---

### Task 4.3: 위키링크 자동완성 컴포넌트

**Files:**
- Create: `src/components/feature/WikilinkAutocomplete.tsx`
- Create: `src/components/feature/__tests__/WikilinkAutocomplete.test.tsx`

- [ ] **Step 1: 테스트 작성**

```typescript
// src/components/feature/__tests__/WikilinkAutocomplete.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WikilinkAutocomplete } from '../WikilinkAutocomplete';

const candidates = [{ id: '1', title: '과적합' }, { id: '2', title: '정규화' }, { id: '3', title: '경사하강법' }];

describe('WikilinkAutocomplete', () => {
  it('shows candidates filtered by query', () => {
    render(<WikilinkAutocomplete query="과" candidates={candidates} onSelect={() => {}} />);
    expect(screen.getByText('과적합')).toBeInTheDocument();
    expect(screen.queryByText('정규화')).not.toBeInTheDocument();
  });

  it('calls onSelect when item clicked', async () => {
    const onSelect = vi.fn();
    render(<WikilinkAutocomplete query="과" candidates={candidates} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('과적합'));
    expect(onSelect).toHaveBeenCalledWith('과적합');
  });

  it('shows "+ 새 노트로 만들기" when query has no exact match', () => {
    render(<WikilinkAutocomplete query="없는제목" candidates={candidates} onSelect={() => {}} />);
    expect(screen.getByText(/새 노트로 만들기/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 구현**

```typescript
// src/components/feature/WikilinkAutocomplete.tsx
interface Candidate { id: string; title: string }

interface Props {
  query: string;
  candidates: Candidate[];
  onSelect: (title: string) => void;
}

export function WikilinkAutocomplete({ query, candidates, onSelect }: Props) {
  const filtered = candidates.filter((c) => c.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  const hasExact = filtered.some((c) => c.title === query);

  return (
    <ul role="listbox" className="absolute z-10 bg-stone-50 border border-stone-300 rounded-md shadow-md min-w-[200px]">
      {filtered.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => onSelect(c.title)}
            className="w-full text-left px-3 py-2 hover:bg-stone-100 flex items-center gap-2"
          >
            📄 {c.title}
          </button>
        </li>
      ))}
      {!hasExact && query.trim() && (
        <li>
          <button
            type="button"
            onClick={() => onSelect(query)}
            className="w-full text-left px-3 py-2 hover:bg-[#FEF3C7] text-[#B45309] border-t border-stone-200"
          >
            + "{query}" 새 노트로 만들기
          </button>
        </li>
      )}
    </ul>
  );
}
```

- [ ] **Step 3: 검증 및 커밋**

Run: `npm run test -- WikilinkAutocomplete`
Expected: 3 passed

```bash
git add src/components/feature/WikilinkAutocomplete.tsx src/components/feature/__tests__/WikilinkAutocomplete.test.tsx
git commit -m "feat(feature): add WikilinkAutocomplete component"
```

---

### Task 4.4: 노트 에디터 (`/app/notes/new`, `/app/notes/:id/edit`)

**Files:**
- Modify: `src/routes/app/notes/New.tsx`
- Modify: `src/routes/app/notes/Edit.tsx`
- Create: `src/components/feature/NoteEditor.tsx`

- [ ] **Step 1: NoteEditor 공유 컴포넌트**

```typescript
// src/components/feature/NoteEditor.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ulid } from 'ulid';
import { Button, Input, Badge, toast } from '@/components/ds';
import { useNotesStore } from '@/stores/use-notes';
import { useGameStore } from '@/stores/use-game';
import { xpForNoteCreate } from '@/lib/xp';
import { WikilinkAutocomplete } from './WikilinkAutocomplete';

interface Props { noteId?: string }

export function NoteEditor({ noteId }: Props) {
  const navigate = useNavigate();
  const allNotes = useNotesStore((s) => Object.values(s.notes));
  const upsert = useNotesStore((s) => s.upsert);
  const addXp = useGameStore((s) => s.addXp);
  const existing = noteId ? useNotesStore.getState().notes[noteId] : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.contentMd ?? '');
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [autocompleteState, setAutocompleteState] = useState<{ open: boolean; query: string; pos: number } | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<number | null>(null);

  // Debounced auto-save (3 sec) on existing notes
  useEffect(() => {
    if (!noteId) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      upsert({ id: noteId, title, contentMd: content, tags });
      toast({ message: '저장됨', tone: 'success', duration: 1200 });
    }, 3000);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [title, content, tags, noteId, upsert]);

  const onContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setContent(v);
    const pos = e.target.selectionStart;
    const before = v.slice(0, pos);
    const m = before.match(/\[\[([^\]]*)$/);
    if (m) {
      setAutocompleteState({ open: true, query: m[1] ?? '', pos: pos - (m[1]?.length ?? 0) - 2 });
    } else {
      setAutocompleteState(null);
    }
  };

  const insertWikilink = (target: string) => {
    if (!autocompleteState || !taRef.current) return;
    const before = content.slice(0, autocompleteState.pos);
    const after = content.slice(taRef.current.selectionStart);
    setContent(`${before}[[${target}]]${after}`);
    setAutocompleteState(null);
    setTimeout(() => taRef.current?.focus(), 0);
  };

  const handleSave = () => {
    const id = noteId ?? ulid();
    upsert({ id, title: title || '제목 없음', contentMd: content, tags });
    if (!noteId) {
      addXp(xpForNoteCreate());
      toast({ message: '+10 XP — 새 노트 작성', tone: 'success' });
    }
    navigate(`/app/notes/${id}`);
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>← 돌아가기</Button>
        <Button onClick={handleSave}>저장</Button>
      </div>

      <Input placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} className="text-2xl" />

      <div className="flex items-center gap-2 flex-wrap">
        {tags.map((t) => (
          <Badge key={t} tone="amber">#{t} <button className="ml-1" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`태그 ${t} 제거`}>×</button></Badge>
        ))}
        <Input
          placeholder="+ 태그 추가"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          className="w-32"
        />
      </div>

      <div className="relative">
        <textarea
          ref={taRef}
          value={content}
          onChange={onContentChange}
          placeholder="# 제목&#10;&#10;본문…&#10;&#10;[[링크]]로 다른 노트와 연결할 수 있습니다."
          className="w-full min-h-[400px] rounded-md border border-stone-300 bg-white p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]"
        />
        {autocompleteState?.open && (
          <div className="absolute top-full left-0 mt-1">
            <WikilinkAutocomplete
              query={autocompleteState.query}
              candidates={allNotes}
              onSelect={insertWikilink}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: New 라우트**

```typescript
// src/routes/app/notes/New.tsx
import { NoteEditor } from '@/components/feature/NoteEditor';
export default function NoteNew() { return <NoteEditor />; }
```

- [ ] **Step 3: Edit 라우트**

```typescript
// src/routes/app/notes/Edit.tsx
import { useParams } from 'react-router';
import { NoteEditor } from '@/components/feature/NoteEditor';
export default function NoteEdit() {
  const { id } = useParams();
  return <NoteEditor noteId={id} />;
}
```

- [ ] **Step 4: 검증**

http://localhost:5173/synapse-prototype/app/notes/new
- 제목/본문 입력
- 본문에 `[[과` 입력 → 자동완성에 "과적합" 표시
- 클릭 → `[[과적합]]` 삽입
- 저장 클릭 → 새 노트 생성 + XP +10 토스트 + 노트 상세로 이동
- 노트 목록에 새 노트 표시 확인

- [ ] **Step 5: 커밋**

```bash
git add src/routes/app/notes/New.tsx src/routes/app/notes/Edit.tsx src/components/feature/NoteEditor.tsx
git commit -m "feat(notes): implement editor with wikilink autocomplete and auto-save"
```

---

### Task 4.5: 노트 상세 (`/app/notes/:id`)

**Files:**
- Modify: `src/routes/app/notes/View.tsx`
- Create: `src/components/shared/MarkdownRenderer.tsx`

- [ ] **Step 1: MarkdownRenderer (위키링크 변환 포함)**

```typescript
// src/components/shared/MarkdownRenderer.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Link } from 'react-router';
import { useNotesStore } from '@/stores/use-notes';

const WIKILINK_RE = /\[\[([^\]]+?)\]\]/g;

interface Props { source: string }

export function MarkdownRenderer({ source }: Props) {
  const allNotes = useNotesStore((s) => Object.values(s.notes));
  const titleToId = new Map(allNotes.map((n) => [n.title, n.id]));

  // Pre-process [[…]] to anchor placeholders
  const processed = source.replace(WIKILINK_RE, (_, target: string) => {
    const id = titleToId.get(target.trim());
    return id ? `[${target}](#wikilink:${id})` : `[${target}](#missing)`;
  });

  return (
    <div className="prose prose-stone max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith('#wikilink:')) {
              return <Link to={`/app/notes/${href.slice(10)}`} className="text-[#D97706] hover:underline">{children}</Link>;
            }
            if (href === '#missing') {
              return <span className="text-stone-400 italic">{children} (미생성)</span>;
            }
            return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 2: View 구현**

```typescript
// src/routes/app/notes/View.tsx
import { useParams, Link, useNavigate } from 'react-router';
import { Card, Button, Badge } from '@/components/ds';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { useNotesStore } from '@/stores/use-notes';

export default function NoteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const note = useNotesStore((s) => (id ? s.notes[id] : undefined));
  const backlinks = useNotesStore((s) => (note ? s.backlinksOf(note.title) : []));
  const allNotes = useNotesStore((s) => s.notes);

  if (!note) return <div className="p-6">노트를 찾을 수 없습니다.</div>;

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>← 돌아가기</Button>
        <div className="flex gap-2">
          <Link to={`/app/notes/${note.id}/edit`}><Button variant="secondary">편집</Button></Link>
          <Link to={`/app/ai/generate?noteId=${note.id}`}><Button>🤖 AI 카드 생성</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <article className="space-y-3">
          <h1 className="display text-4xl text-stone-900">{note.title}</h1>
          <div className="flex gap-2 flex-wrap">
            {note.tags.map((t) => <Badge key={t} tone="amber">#{t}</Badge>)}
          </div>
          <Card>
            <MarkdownRenderer source={note.contentMd} />
          </Card>
        </article>

        <aside className="space-y-3">
          <Card>
            <h3 className="text-sm font-medium mb-2">◀ 이 노트를 참조 ({backlinks.length})</h3>
            {backlinks.length === 0 && <p className="text-xs text-stone-500">없음</p>}
            <ul className="space-y-1">
              {backlinks.map((b) => (
                <li key={b.id}>
                  <Link to={`/app/notes/${b.id}`} className="text-sm text-stone-700 hover:text-[#D97706]">📄 {b.title}</Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3 className="text-sm font-medium mb-2">▶ 이 노트가 참조 ({note.outgoingLinks.length})</h3>
            <ul className="space-y-1">
              {note.outgoingLinks.map((title) => {
                const target = Object.values(allNotes).find((n) => n.title === title);
                return (
                  <li key={title}>
                    {target ? (
                      <Link to={`/app/notes/${target.id}`} className="text-sm text-stone-700 hover:text-[#D97706]">📄 {title}</Link>
                    ) : (
                      <span className="text-sm text-stone-400">📄 {title} (미생성)</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 검증** — http://localhost:5173/synapse-prototype/app/notes/seed-n1
  - 마크다운 렌더링
  - `[[과적합]]` 등 위키링크가 amber 색 링크로 표시
  - 우측 백링크 패널에 다른 노트들 표시
  - 클릭 시 해당 노트 이동

- [ ] **Step 4: 커밋**

```bash
git add src/routes/app/notes/View.tsx src/components/shared/MarkdownRenderer.tsx
git commit -m "feat(notes): implement note view with markdown render and backlinks panel"
```

---

### Task 4.6: AI 카드 생성 (`/app/ai/generate`)

**Files:**
- Modify: `src/routes/app/ai/Generate.tsx`

- [ ] **Step 1: 구현**

```typescript
// src/routes/app/ai/Generate.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { ulid } from 'ulid';
import { Card, Button, Badge, toast } from '@/components/ds';
import { useNotesStore } from '@/stores/use-notes';
import { useDecksCardsStore } from '@/stores/use-decks-cards';
import { useGameStore } from '@/stores/use-game';
import { CURATED, generateCardsFromContent, type AICardTemplate } from '@/data/ai-templates';
import { xpForAiCardAccept } from '@/lib/xp';

export default function AIGenerate() {
  const [params] = useSearchParams();
  const noteId = params.get('noteId');
  const note = useNotesStore((s) => (noteId ? s.notes[noteId] : undefined));
  const decks = useDecksCardsStore((s) => Object.values(s.decks));
  const addCards = useDecksCardsStore((s) => s.addCards);
  const addXp = useGameStore((s) => s.addXp);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<AICardTemplate[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deckId, setDeckId] = useState<string>(decks[0]?.id ?? '');

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => {
      const generated = CURATED[note.id] ?? generateCardsFromContent(note.contentMd);
      setCards(generated);
      setSelected(new Set(generated.map((_, i) => i)));
      setLoading(false);
    }, 2200);
    return () => clearTimeout(t);
  }, [note]);

  if (!note) return <div className="p-6">노트를 찾을 수 없습니다.</div>;

  const toggle = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i); else next.add(i);
    setSelected(next);
  };

  const save = () => {
    const accepted = cards.filter((_, i) => selected.has(i));
    if (accepted.length === 0 || !deckId) return;
    const newCards = accepted.map((c) => ({
      id: ulid(), deckId, type: c.type, front: c.front, back: c.back, sourceNoteId: note.id,
    }));
    addCards(newCards);
    addXp(accepted.length * xpForAiCardAccept());
    toast({ message: `${accepted.length}장 추가됨 — +${accepted.length * xpForAiCardAccept()} XP`, tone: 'success' });
    navigate(`/app/decks`);
  };

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <Button variant="ghost" onClick={() => navigate(-1)}>← 돌아가기</Button>
      <h1 className="display text-3xl">🤖 AI 카드 생성</h1>
      <p className="text-stone-600">출처: <span className="font-medium">{note.title}</span></p>

      {loading ? (
        <div className="space-y-3">
          <p className="text-sm text-stone-500 animate-pulse">카드를 만들고 있어요...</p>
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <div className="h-4 bg-stone-200 rounded w-3/4 mb-2 animate-pulse" />
              <div className="h-3 bg-stone-200 rounded w-1/2 animate-pulse" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {cards.map((c, i) => (
              <Card key={i} className="cursor-pointer" onClick={() => toggle(i)}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggle(i)}
                    className="mt-1"
                    aria-label={`카드 ${i + 1} 선택`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge tone={c.type === 'cloze' ? 'teal' : 'neutral'}>{c.type}</Badge>
                      <span className="text-xs text-stone-500">카드 {i + 1}</span>
                    </div>
                    <div className="font-medium mb-1">Q: {c.front}</div>
                    <div className="text-sm text-stone-600">A: {c.back}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-3 sticky bottom-4 bg-stone-50 p-3 rounded-md border border-stone-200">
            <label className="text-sm">덱:</label>
            <select
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
              className="rounded-sm border border-stone-300 px-2 py-1"
            >
              {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <Button onClick={save} disabled={selected.size === 0}>
              {selected.size}장 저장
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 검증** — /app/notes/seed-n1 → "🤖 AI 카드 생성" 클릭
  - 2.2초 스켈레턴 → 5장 카드 미리보기 (큐레이션됨)
  - 체크박스 토글 가능
  - 덱 선택 → "5장 저장" → 덱 목록으로 이동 + +15 XP 토스트

- [ ] **Step 3: 커밋**

```bash
git add src/routes/app/ai/Generate.tsx
git commit -m "feat(ai): implement AI card generation with curated + dynamic fallback"
```

---

### Task 4.7: 덱 목록 (`/app/decks`)

**Files:**
- Modify: `src/routes/app/decks/List.tsx`

- [ ] **Step 1: 구현**

```typescript
// src/routes/app/decks/List.tsx
import { Link } from 'react-router';
import { Card, Button, Badge } from '@/components/ds';
import { useDecksCardsStore } from '@/stores/use-decks-cards';

export default function DecksList() {
  const decks = useDecksCardsStore((s) => Object.values(s.decks));
  const cards = useDecksCardsStore((s) => Object.values(s.cards));
  const now = Date.now();

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <h1 className="display text-3xl">덱</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((d) => {
          const deckCards = cards.filter((c) => c.deckId === d.id);
          const due = deckCards.filter((c) => c.srs.due <= now).length;
          const total = deckCards.length;
          const reviewed = deckCards.filter((c) => c.status === 'review').length;
          const progress = total > 0 ? reviewed / total : 0;

          return (
            <Card key={d.id} elevated className="space-y-3">
              <div>
                <h3 className="display text-xl mb-1">{d.name}</h3>
                <p className="text-sm text-stone-600 line-clamp-1">{d.description}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">진행도</span>
                  <span className="tabular-nums">{reviewed} / {total}</span>
                </div>
                <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0D9488]" style={{ width: `${progress * 100}%` }} />
                </div>
                <div className="flex items-center gap-2">
                  {due > 0 && <Badge tone="amber">오늘 {due}장</Badge>}
                  <span className="text-xs text-stone-500">총 {total}장</span>
                </div>
              </div>

              <Link to={`/app/decks/${d.id}/review`} className="block">
                <Button className="w-full" disabled={due === 0}>
                  {due > 0 ? `▶ 복습 시작 (${due})` : '오늘 복습 완료'}
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 검증** — /app/decks
  - 3개 덱 카드: 프로그래밍 / ML 기초 / AWS SAA
  - 진행도 바, due 카드 수 배지
  - "복습 시작" 버튼 활성화 (due > 0)

- [ ] **Step 3: 커밋**

```bash
git add src/routes/app/decks/List.tsx
git commit -m "feat(decks): implement deck list with progress and due count"
```

---

### Task 4.8: FlashCard 컴포넌트 + 복습 세션 (`/app/decks/:id/review`)

**Files:**
- Create: `src/components/feature/FlashCard.tsx`
- Modify: `src/routes/app/decks/Review.tsx`

- [ ] **Step 1: FlashCard 구현 (Y축 3D 플립)**

```typescript
// src/components/feature/FlashCard.tsx
import { useState } from 'react';
import { Button } from '@/components/ds';

interface Props {
  front: string;
  back: string;
  onRate: (rating: 1 | 2 | 3 | 4) => void;
}

export function FlashCard({ front, back, onRate }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="space-y-6">
      <div
        className="relative min-h-[280px] w-full max-w-2xl mx-auto rounded-lg bg-stone-50 shadow-md p-8 flex items-center justify-center text-center cursor-pointer transition-transform duration-300"
        onClick={() => !revealed && setRevealed(true)}
        role="button"
        tabIndex={0}
        aria-label="카드 답 보기"
      >
        {!revealed ? (
          <div>
            <p className="display text-2xl text-stone-900 mb-6">{front}</p>
            <Button onClick={(e) => { e.stopPropagation(); setRevealed(true); }}>👁 답 보기</Button>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <p className="display text-xl text-stone-700">Q: {front}</p>
            <hr className="border-stone-200" />
            <p className="text-lg text-stone-900 whitespace-pre-line">A: {back}</p>
          </div>
        )}
      </div>

      {revealed && (
        <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto">
          <RateButton label="Again" hint="<1분" onClick={() => { onRate(1); setRevealed(false); }} accent="error" hotkey="1" />
          <RateButton label="Hard" hint="3일" onClick={() => { onRate(2); setRevealed(false); }} accent="warning" hotkey="2" />
          <RateButton label="Good" hint="7일" onClick={() => { onRate(3); setRevealed(false); }} accent="info" hotkey="3" />
          <RateButton label="Easy" hint="14일" onClick={() => { onRate(4); setRevealed(false); }} accent="success" hotkey="4" />
        </div>
      )}
    </div>
  );
}

function RateButton({ label, hint, onClick, accent, hotkey }: { label: string; hint: string; onClick: () => void; accent: string; hotkey: string }) {
  const colorMap: Record<string, string> = {
    error: 'border-[#DC2626] text-[#DC2626] hover:bg-red-50',
    warning: 'border-[#F59E0B] text-[#F59E0B] hover:bg-amber-50',
    info: 'border-[#0EA5E9] text-[#0EA5E9] hover:bg-sky-50',
    success: 'border-[#16A34A] text-[#16A34A] hover:bg-green-50',
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-md border-2 bg-white py-3 flex flex-col items-center transition-colors ${colorMap[accent]}`}
    >
      <span className="font-medium">{label}</span>
      <span className="text-xs text-stone-500">{hint}</span>
      <span className="text-[10px] text-stone-400 mt-1">[{hotkey}]</span>
    </button>
  );
}
```

- [ ] **Step 2: Review 라우트 (세션 시작 + SM-2 적용)**

```typescript
// src/routes/app/decks/Review.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ulid } from 'ulid';
import { Button, toast } from '@/components/ds';
import { FlashCard } from '@/components/feature/FlashCard';
import { useDecksCardsStore } from '@/stores/use-decks-cards';
import { useReviewsStore } from '@/stores/use-reviews';
import { useGameStore } from '@/stores/use-game';
import { applyRating, type Rating } from '@/lib/sm2';
import { xpForReview } from '@/lib/xp';

export default function DeckReview() {
  const { id: deckId } = useParams();
  const navigate = useNavigate();
  const cards = useDecksCardsStore((s) => Object.values(s.cards).filter((c) => c.deckId === deckId && c.srs.due <= Date.now()));
  const updateCardSrs = useDecksCardsStore((s) => s.updateCardSrs);
  const startSession = useReviewsStore((s) => s.startSession);
  const recordRating = useReviewsStore((s) => s.recordRating);
  const advance = useReviewsStore((s) => s.advance);
  const completeSession = useReviewsStore((s) => s.completeSession);
  const addXp = useGameStore((s) => s.addXp);
  const registerActivity = useGameStore((s) => s.registerActivity);

  const [sessionId] = useState(() => ulid());
  const [index, setIndex] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    if (cards.length === 0) return;
    startSession({ id: sessionId, deckId: deckId!, cardIds: cards.map((c) => c.id) });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) handleRate(Number(e.key) as Rating);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, cards]); // eslint-disable-line

  if (cards.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <h1 className="display text-2xl mb-2">오늘 복습할 카드가 없습니다 🎉</h1>
        <Button variant="secondary" onClick={() => navigate('/app/decks')}>덱 목록으로</Button>
      </div>
    );
  }

  if (index >= cards.length) return null;
  const current = cards[index]!;

  const handleRate = (rating: Rating) => {
    const elapsed = Date.now() - startTime;
    const nextSrs = applyRating(current.srs, rating);
    const newStatus = rating === 1 ? 'learning' : nextSrs.repetitions >= 2 ? 'review' : 'learning';
    updateCardSrs(current.id, nextSrs, newStatus);
    recordRating(sessionId, current.id, rating, elapsed);
    addXp(xpForReview());

    if (index + 1 >= cards.length) {
      completeSession(sessionId);
      registerActivity(new Date().toISOString().slice(0, 10));
      navigate(`/app/decks/${deckId}/review/result?sessionId=${sessionId}`);
    } else {
      advance(sessionId);
      setIndex(index + 1);
      setStartTime(Date.now());
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between max-w-2xl mx-auto mb-8">
        <Button variant="ghost" onClick={() => { if (confirm('세션을 종료할까요?')) navigate('/app/decks'); }}>× 종료</Button>
        <span className="text-sm text-stone-600 tabular-nums">{index + 1} / {cards.length}</span>
      </div>

      <FlashCard
        key={current.id}
        front={current.front}
        back={current.back}
        onRate={handleRate}
      />

      {current.sourceNoteId && (
        <div className="text-center mt-6">
          <button
            onClick={() => navigate(`/app/notes/${current.sourceNoteId}`)}
            className="text-sm text-stone-500 hover:text-[#D97706]"
          >
            출처: 노트 보기 📄
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 검증** — /app/decks → "ML 기초" 복습 시작
  - 카드 8장 중 1번 표시
  - "답 보기" 클릭 → 4단계 난이도 표시
  - 키보드 1/2/3/4 단축키 동작
  - 모든 카드 처리 후 결과 화면 자동 이동

- [ ] **Step 4: 커밋**

```bash
git add src/components/feature/FlashCard.tsx src/routes/app/decks/Review.tsx
git commit -m "feat(review): implement flashcard review with SM-2 algorithm and keyboard shortcuts"
```

---

### Task 4.9: 세션 결과 + 레벨업 축하 (`/app/decks/:id/review/result`)

**Files:**
- Create: `src/components/feature/CelebrationParticles.tsx`
- Create: `src/components/feature/LevelUpModal.tsx`
- Modify: `src/routes/app/decks/Result.tsx`

- [ ] **Step 1: CelebrationParticles 구현**

```typescript
// src/components/feature/CelebrationParticles.tsx
import { useEffect, useState } from 'react';

export function CelebrationParticles({ count = 20, duration = 600 }: { count?: number; duration?: number }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  if (!show) return null;
  const particles = Array.from({ length: count }, (_, i) => i);
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((i) => {
        const angle = (i / count) * Math.PI * 2;
        const distance = 80 + Math.random() * 60;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        const color = i % 2 === 0 ? '#D97706' : '#0D9488';
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
            style={{
              backgroundColor: color,
              transform: `translate(${dx}px, ${dy}px)`,
              transition: `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity ${duration}ms ease-out`,
              opacity: 0,
            }}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: LevelUpModal**

```typescript
// src/components/feature/LevelUpModal.tsx
import { Dialog, Button } from '@/components/ds';
import { CelebrationParticles } from './CelebrationParticles';

interface Props {
  open: boolean;
  newLevel: number;
  newTitle: string;
  onClose: () => void;
}

export function LevelUpModal({ open, newLevel, newTitle, onClose }: Props) {
  return (
    <>
      {open && <CelebrationParticles count={20} duration={600} />}
      <Dialog open={open} onClose={onClose}>
        <div className="text-center space-y-3">
          <div className="display text-4xl text-stone-900">🏅 레벨 {newLevel} 달성!</div>
          <div className="text-lg text-[#D97706]">{newTitle}</div>
          <p className="text-sm text-stone-600">꾸준함이 자산입니다.</p>
          <Button onClick={onClose}>계속하기</Button>
        </div>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 3: Result 라우트**

```typescript
// src/routes/app/decks/Result.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Button, Card } from '@/components/ds';
import { LevelUpModal } from '@/components/feature/LevelUpModal';
import { useReviewsStore } from '@/stores/use-reviews';
import { useGameStore } from '@/stores/use-game';
import { useDecksCardsStore } from '@/stores/use-decks-cards';

export default function DeckResult() {
  const { id: deckId } = useParams();
  const [params] = useSearchParams();
  const sessionId = params.get('sessionId');
  const navigate = useNavigate();
  const session = useReviewsStore((s) => (sessionId ? s.sessions[sessionId] : undefined));
  const game = useGameStore();
  const cards = useDecksCardsStore((s) => s.cards);

  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    // 비교를 위한 oldLevel은 session에서 추적하기 어려우므로,
    // 단순화: 결과 진입 시점에 game.level이 1 이상이고 직전 활동의 결과로 호출됨을 가정.
    // 실제 levelUp 발생 신호는 useGameStore.addXp 반환값을 review 라우트에서 잡아 navigate state로 넘기는 게 정석이지만,
    // 여기서는 단순 폴링: 최근 활동에서 level이 변경되었는지 navigate state로 받음.
    const fromReview = (window.history.state?.usr ?? {}) as { leveledUp?: boolean };
    if (fromReview.leveledUp) setShowLevelUp(true);
  }, []);

  if (!session) return <div className="p-6">세션을 찾을 수 없습니다.</div>;
  const total = session.ratings.length;
  const correct = session.ratings.filter((r) => r.rating >= 3).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const totalMs = session.ratings.reduce((sum, r) => sum + r.timeMs, 0);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="display text-3xl text-center">세션 완료 🎉</h1>

      <Card elevated>
        <dl className="grid grid-cols-3 gap-4 text-center">
          <div>
            <dt className="text-xs text-stone-500">정확도</dt>
            <dd className="display text-3xl text-[#0D9488] tabular-nums">{accuracy}%</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">소요</dt>
            <dd className="display text-3xl tabular-nums">{minutes}:{String(seconds).padStart(2, '0')}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">XP 획득</dt>
            <dd className="display text-3xl text-[#D97706] tabular-nums">+{total * 5}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-2">현재 상태</h3>
        <p>레벨 {game.level} · {game.title} · 총 {game.xp.toLocaleString()} XP</p>
        <p className="text-xs text-stone-500 mt-1">🔥 {game.streak.current}일 연속 학습</p>
      </Card>

      <div className="flex gap-3 justify-center">
        <Button variant="secondary" onClick={() => navigate('/app/decks')}>덱 목록</Button>
        <Button onClick={() => navigate('/app')}>대시보드</Button>
      </div>

      <LevelUpModal
        open={showLevelUp}
        newLevel={game.level}
        newTitle={game.title}
        onClose={() => setShowLevelUp(false)}
      />
    </div>
  );
}
```

- [ ] **Step 4: Review 라우트 보강 — leveledUp navigate state 전달**

`src/routes/app/decks/Review.tsx`의 `handleRate` 안 마지막 카드 처리 시:

```typescript
// 변경: const r = addXp(xpForReview()); ...
// 그리고 마지막 카드일 때:
const r = addXp(xpForReview());
if (index + 1 >= cards.length) {
  completeSession(sessionId);
  registerActivity(new Date().toISOString().slice(0, 10));
  navigate(`/app/decks/${deckId}/review/result?sessionId=${sessionId}`,
           { state: { leveledUp: r.leveledUp } });
}
```

기존 `addXp(xpForReview());` 라인을 위 패턴으로 교체.

- [ ] **Step 5: 검증** — /app/decks → "ML 기초" 8장 모두 복습 → 결과 화면
  - 정확도/소요/XP 획득 표시
  - 충분히 큰 덱(여러 세션 누적)이면 레벨업 모달 + 파티클 표시

- [ ] **Step 6: 커밋**

```bash
git add src/components/feature/CelebrationParticles.tsx src/components/feature/LevelUpModal.tsx src/routes/app/decks/Result.tsx src/routes/app/decks/Review.tsx
git commit -m "feat(review): add session result with level-up celebration"
```

---

## Milestone 4 완료 조건

- [ ] /app 대시보드: 시드 데이터로 "복습 카드 13장", 레벨 7, 14일 스트릭, 최근 노트 5개 표시
- [ ] /app/notes: 10개 노트 카드, 검색/태그 필터 동작
- [ ] /app/notes/new: `[[` 입력 시 자동완성, 저장 후 새 노트 추가 + 노트 목록에 즉시 반영 + +10 XP
- [ ] /app/notes/seed-n1: 마크다운 렌더링, `[[과적합]]` amber 링크, 백링크 패널에 다른 노트 표시
- [ ] /app/notes/seed-n1 → "AI 카드 생성": 2.2초 스켈레턴 → 5장 큐레이션 카드 → 덱 저장
- [ ] /app/decks: 3개 덱 카드, 진행도, due 카드 수
- [ ] /app/decks/seed-d2/review: 8장 카드 복습 (1/2/3/4 단축키), SM-2 알고리즘 적용
- [ ] /app/decks/seed-d2/review/result: 정확도/시간/XP 표시, 레벨업 시 모달+파티클
- [ ] E2E 핵심 경로: 새 노트 작성 → AI 카드 생성 → 덱 복습 → 결과 → 대시보드 (수동 검증)
- [ ] `npm run test` 모두 통과
- [ ] `npm run typecheck` 0 errors

---

## Milestone 5 — Tier 2 Screens (Differentiators)

### Task 5.1: 그래프 뷰 (`/app/graph`) — D3.js force layout

**Files:**
- Create: `src/components/feature/GraphCanvas.tsx`
- Modify: `src/routes/app/Graph.tsx`

- [ ] **Step 1: GraphCanvas 구현**

```typescript
// src/components/feature/GraphCanvas.tsx
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Graph, GraphNode, GraphEdge } from '@/lib/graph';

interface SimNode extends d3.SimulationNodeDatum, GraphNode {}
interface SimEdge extends d3.SimulationLinkDatum<SimNode> { source: string | SimNode; target: string | SimNode }

interface Props {
  graph: Graph;
  highlight?: Set<string>;
  onNodeClick?: (id: string) => void;
}

export function GraphCanvas({ graph, highlight, onNodeClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current!);
    const width = svgRef.current!.clientWidth || 800;
    const height = svgRef.current!.clientHeight || 600;
    svg.selectAll('*').remove();

    const g = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => g.attr('transform', event.transform.toString()));
    svg.call(zoom);

    const nodes: SimNode[] = graph.nodes.map((n) => ({ ...n }));
    const edges: SimEdge[] = graph.edges.map((e) => ({ source: e.source, target: e.target }));

    const sim = d3.forceSimulation<SimNode>(nodes)
      .force('link', d3.forceLink<SimNode, SimEdge>(edges).id((d) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = g.append('g').attr('stroke', '#A8A29E').attr('stroke-opacity', 0.6)
      .selectAll('line').data(edges).enter().append('line').attr('stroke-width', 1);

    const node = g.append('g').selectAll('g').data(nodes).enter().append('g').style('cursor', 'pointer');
    node.append('circle')
      .attr('r', (d) => 8 + Math.sqrt(d.degree) * 3)
      .attr('fill', (d) => highlight?.has(d.id) ? '#0D9488' : '#D97706')
      .attr('stroke', '#FAFAF9').attr('stroke-width', 2);
    node.append('text')
      .text((d) => d.title)
      .attr('font-size', 11).attr('font-family', 'Plus Jakarta Sans')
      .attr('fill', '#292524').attr('dx', 12).attr('dy', 4);

    node.on('click', (_, d) => onNodeClick?.(d.id));
    node.call(
      d3.drag<SVGGElement, SimNode>()
        .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
    );

    sim.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0);
      node.attr('transform', (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    });

    return () => { sim.stop(); };
  }, [graph, highlight, onNodeClick]);

  return <svg ref={svgRef} className="w-full h-[600px] bg-stone-50 rounded-md" />;
}
```

- [ ] **Step 2: Graph 라우트**

```typescript
// src/routes/app/Graph.tsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, Button } from '@/components/ds';
import { GraphCanvas } from '@/components/feature/GraphCanvas';
import { useNotesStore } from '@/stores/use-notes';
import { useDecksCardsStore } from '@/stores/use-decks-cards';
import { buildGraph } from '@/lib/graph';

export default function Graph() {
  const navigate = useNavigate();
  const notes = useNotesStore((s) => Object.values(s.notes));
  const cards = useDecksCardsStore((s) => Object.values(s.cards));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const graph = useMemo(() => buildGraph(notes), [notes]);
  const cardCountByNote = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cards) if (c.sourceNoteId) map.set(c.sourceNoteId, (map.get(c.sourceNoteId) ?? 0) + 1);
    return map;
  }, [cards]);

  const selectedNote = selectedId ? notes.find((n) => n.id === selectedId) : null;
  const selectedNode = selectedId ? graph.nodes.find((n) => n.id === selectedId) : null;

  return (
    <div className="p-6 max-w-6xl space-y-4">
      <h1 className="display text-3xl">그래프 뷰</h1>
      <p className="text-stone-600 text-sm">노드 클릭으로 정보 보기 · 드래그로 이동 · 휠로 줌</p>

      <Card>
        <GraphCanvas graph={graph} onNodeClick={setSelectedId} />
      </Card>

      {selectedNote && selectedNode && (
        <Card elevated>
          <h3 className="display text-xl mb-2">{selectedNote.title}</h3>
          <ul className="text-sm space-y-1 mb-3">
            <li>├─ 연결: {selectedNode.degree}개</li>
            <li>├─ 카드: {cardCountByNote.get(selectedNode.id) ?? 0}장</li>
            <li>└─ 태그: {selectedNote.tags.map((t) => `#${t}`).join(' ') || '없음'}</li>
          </ul>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/app/notes/${selectedNote.id}`)}>노트 열기</Button>
            <Button variant="secondary" onClick={() => navigate(`/app/ai/generate?noteId=${selectedNote.id}`)}>AI 카드 생성</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 검증** — /app/graph
  - 10개 노드, 백링크 엣지 시각화 (force layout)
  - amber 노드 (카드 없음) / teal 노드 (카드 보유)는 후속 개선 (현재 단순 amber)
  - 노드 클릭 → 하단 패널에 정보 표시
  - 줌/드래그 동작
  - 새 노트 생성 후 그래프에 자동 반영 (다른 탭 이동 → 다시 /app/graph)

- [ ] **Step 4: 커밋**

```bash
git add src/components/feature/GraphCanvas.tsx src/routes/app/Graph.tsx
git commit -m "feat(graph): implement D3 force-directed graph view"
```

---

### Task 5.2: 통합 검색 + AI Q&A (`/app/search`)

**Files:**
- Modify: `src/routes/app/Search.tsx`
- Create: `src/lib/search.ts`
- Create: `src/lib/__tests__/search.test.ts`

- [ ] **Step 1: search 테스트 (RRF)**

```typescript
// src/lib/__tests__/search.test.ts
import { describe, it, expect } from 'vitest';
import { rrfMerge } from '../search';

describe('rrfMerge', () => {
  it('combines ranked lists with reciprocal rank fusion', () => {
    const semantic = ['n1', 'n2', 'n3']; // rank 1, 2, 3
    const keyword  = ['n2', 'n3', 'n4']; // rank 1, 2, 3
    const result = rrfMerge([semantic, keyword], { k: 60 });
    // n2: 1/61 + 1/61 ≈ 0.0328 — top
    expect(result[0]).toBe('n2');
    expect(result).toContain('n1');
    expect(result).toContain('n4');
  });

  it('handles single source', () => {
    expect(rrfMerge([['a', 'b']], { k: 60 })).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: search.ts 구현**

```typescript
// src/lib/search.ts
import MiniSearch from 'minisearch';
import { vectorize, cosine, SEED_CORPUS } from '@/data/search-corpus';
import type { Note } from '@/stores/use-notes';

export function rrfMerge(rankedLists: string[][], opts: { k: number } = { k: 60 }): string[] {
  const scores = new Map<string, number>();
  for (const list of rankedLists) {
    list.forEach((id, idx) => {
      scores.set(id, (scores.get(id) ?? 0) + 1 / (opts.k + idx + 1));
    });
  }
  return Array.from(scores.entries()).sort(([, a], [, b]) => b - a).map(([id]) => id);
}

export function semanticSearch(query: string, noteIds: string[]): string[] {
  const qv = vectorize(query);
  const scored = SEED_CORPUS
    .filter((c) => noteIds.includes(c.noteId))
    .map((c) => ({ id: c.noteId, score: cosine(qv, c.embedding) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((s) => s.id);
}

export function keywordSearch(query: string, notes: Note[]): string[] {
  const ms = new MiniSearch<{ id: string; title: string; content: string }>({
    fields: ['title', 'content'],
    storeFields: ['id'],
    searchOptions: { boost: { title: 2 }, fuzzy: 0.2 },
  });
  ms.addAll(notes.map((n) => ({ id: n.id, title: n.title, content: n.contentMd })));
  return ms.search(query).map((r) => String(r.id));
}

export function hybridSearch(query: string, notes: Note[]): string[] {
  const noteIds = notes.map((n) => n.id);
  const sem = semanticSearch(query, noteIds);
  const kw = keywordSearch(query, notes);
  return rrfMerge([sem, kw]);
}
```

- [ ] **Step 3: Search 라우트**

```typescript
// src/routes/app/Search.tsx
import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { Card, Input, Badge } from '@/components/ds';
import { useNotesStore } from '@/stores/use-notes';
import { hybridSearch } from '@/lib/search';

const QA_TEMPLATES: Record<string, string> = {
  '정규화': 'L1과 L2 정규화는 모두 [[과적합]] 방지 기법입니다. L1(Lasso)은 sparse 솔루션을, L2(Ridge)는 가중치 감소를 유도합니다.',
  '과적합': '과적합은 학습 데이터에는 잘 맞지만 새 데이터에 일반화하지 못하는 현상입니다. 정규화, 교차검증, 더 많은 데이터로 해결할 수 있습니다.',
  '드롭아웃': '드롭아웃은 학습 시 뉴런을 무작위로 비활성화하는 정규화 기법입니다.',
};

export default function Search() {
  const notes = useNotesStore((s) => Object.values(s.notes));
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'search' | 'qa'>('search');
  const [streaming, setStreaming] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const ids = hybridSearch(query, notes);
    return ids.map((id) => notes.find((n) => n.id === id)).filter(Boolean) as typeof notes;
  }, [query, notes]);

  const askQA = () => {
    setStreaming('');
    const matchKey = Object.keys(QA_TEMPLATES).find((k) => query.includes(k));
    const answer = matchKey ? QA_TEMPLATES[matchKey]! : `"${query}"에 대한 답변: 관련 노트를 검색하면 더 자세히 볼 수 있습니다.`;
    let i = 0;
    const interval = setInterval(() => {
      i += 2;
      setStreaming(answer.slice(0, i));
      if (i >= answer.length) clearInterval(interval);
    }, 30);
  };

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <h1 className="display text-3xl">통합 검색</h1>

      <div className="flex gap-2 border-b border-stone-200">
        <button
          onClick={() => setTab('search')}
          className={`px-4 py-2 ${tab === 'search' ? 'border-b-2 border-[#D97706] text-[#D97706]' : 'text-stone-600'}`}
        >🔍 검색</button>
        <button
          onClick={() => setTab('qa')}
          className={`px-4 py-2 ${tab === 'qa' ? 'border-b-2 border-[#D97706] text-[#D97706]' : 'text-stone-600'}`}
        >🤖 AI Q&A</button>
      </div>

      <Input
        autoFocus
        placeholder={tab === 'search' ? '시맨틱 + 키워드 하이브리드 검색…' : '무엇이든 물어보세요…'}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && tab === 'qa') askQA(); }}
      />

      {tab === 'search' ? (
        <>
          {query && (
            <p className="text-xs text-stone-500">
              하이브리드 (시맨틱 + BM25 + RRF) — 결과 {results.length}건
            </p>
          )}
          <div className="space-y-2">
            {results.map((n) => (
              <Link key={n.id} to={`/app/notes/${n.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <h3 className="display text-lg mb-1">{n.title}</h3>
                  <p className="text-sm text-stone-600 line-clamp-2">{n.contentMd.replace(/[#*\[\]]/g, '').slice(0, 150)}</p>
                  <div className="flex gap-1 mt-2">{n.tags.map((t) => <Badge key={t} tone="amber">#{t}</Badge>)}</div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <p className="text-xs text-stone-500 mb-2">
            🤖 RAG 시뮬레이션 — 관련 노트를 찾아 답변 생성
          </p>
          <div className="min-h-[100px] whitespace-pre-line">
            {streaming || <span className="text-stone-400">질문을 입력하고 Enter를 누르세요</span>}
          </div>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 검증** — /app/search
  - "정규화" 입력 → ML 정규화 기법 / Lasso / Ridge / 드롭아웃 등 상위에 노출
  - AI Q&A 탭 → "정규화" 입력 + Enter → 답변 스트리밍 시뮬레이션
  - rrfMerge 단위 테스트 통과

- [ ] **Step 5: 커밋**

```bash
git add src/lib/search.ts src/lib/__tests__/search.test.ts src/routes/app/Search.tsx
git commit -m "feat(search): implement hybrid search (semantic + BM25 + RRF) with AI Q&A simulation"
```

---

### Task 5.3: 게이미피케이션 프로필 (`/app/profile`)

**Files:**
- Create: `src/components/feature/BadgeIcon.tsx`
- Modify: `src/routes/app/Profile.tsx`

- [ ] **Step 1: BadgeIcon**

```typescript
// src/components/feature/BadgeIcon.tsx
interface Props { id: string; name: string; earned: boolean; size?: 'sm' | 'md' | 'lg' }

const ICONS: Record<string, string> = {
  'first-note': '🌱', 'first-review': '📖', 'streak-7': '🔥', 'streak-30': '⚡',
  'reviews-100': '🏆', 'notes-50': '📚', 'level-5': '🌟', 'level-10': '💡',
};

const sizeClass: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-8 h-8 text-lg', md: 'w-12 h-12 text-2xl', lg: 'w-16 h-16 text-3xl',
};

export function BadgeIcon({ id, name, earned, size = 'md' }: Props) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClass[size]} flex items-center justify-center rounded-md ${earned ? 'bg-stone-100' : 'bg-stone-50 opacity-40 grayscale'}`}
        title={name}
      >
        <span aria-hidden="true">{ICONS[id] ?? '⭐'}</span>
      </div>
      <span className="text-xs text-stone-600 text-center">{name}</span>
    </div>
  );
}
```

- [ ] **Step 2: Profile 라우트**

```typescript
// src/routes/app/Profile.tsx
import { Card } from '@/components/ds';
import { XPProgressBar } from '@/components/feature/XPProgressBar';
import { StreakFlame } from '@/components/feature/StreakFlame';
import { BadgeIcon } from '@/components/feature/BadgeIcon';
import { useGameStore } from '@/stores/use-game';
import { BADGES } from '@/lib/xp';

export default function Profile() {
  const game = useGameStore();
  const earnedCount = Object.values(game.badges).filter((b) => b.earnedAt).length;

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <h1 className="display text-3xl">내 프로필</h1>

      <Card elevated>
        <div className="flex items-start gap-6 flex-wrap">
          <div className="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center display text-3xl text-[#D97706]">
            {game.level}
          </div>
          <div className="flex-1 min-w-[240px] space-y-3">
            <div>
              <div className="display text-2xl">개발자 김시냅스</div>
              <div className="text-stone-600">🏅 레벨 {game.level} — {game.title}</div>
            </div>
            <XPProgressBar xp={game.xp} />
            <StreakFlame days={game.streak.current} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="display text-xl mb-3">획득한 배지 ({earnedCount} / {BADGES.length})</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
          {BADGES.map((b) => (
            <BadgeIcon
              key={b.id}
              id={b.id}
              name={b.name}
              earned={Boolean(game.badges[b.id]?.earnedAt)}
              size="lg"
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="display text-xl mb-3">이번 주 학습 현황</h2>
        <dl className="grid grid-cols-3 gap-4 text-center">
          <div>
            <dt className="text-xs text-stone-500">복습 카드</dt>
            <dd className="display text-2xl tabular-nums">{game.weeklyStats.reviewed}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">노트</dt>
            <dd className="display text-2xl tabular-nums">{game.weeklyStats.notesCreated}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">XP 획득</dt>
            <dd className="display text-2xl text-[#D97706] tabular-nums">+{game.weeklyStats.xpGained}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: 검증** — /app/profile
  - 레벨 7 / 지식 탐험가 / XP 3,240 / 14일 스트릭
  - 배지 갤러리: 5개 컬러 + 3개 grayscale (시드 기준)
  - 이번 주: 복습 152, 노트 8, +420 XP

- [ ] **Step 4: 커밋**

```bash
git add src/components/feature/BadgeIcon.tsx src/routes/app/Profile.tsx
git commit -m "feat(profile): implement gamification profile with badge gallery"
```

---

## Milestone 5 완료 조건

- [ ] /app/graph: 10개 노드, 백링크 엣지, 클릭 시 패널, 줌/드래그 동작
- [ ] /app/search: 시드 노트 대상 하이브리드 검색 동작, AI Q&A 탭 스트리밍 시뮬레이션
- [ ] /app/profile: 레벨 7 / 14일 스트릭 / 8개 배지 (5 컬러 + 3 grayscale) / 이번 주 통계
- [ ] rrfMerge 단위 테스트 통과
- [ ] `npm run typecheck` 0 errors

---

## Milestone 6 — Tier 3 (Groups) + Drawer + Supporting Pages

### Task 6.1: 스터디 그룹 목록 (`/app/groups`)

**Files:**
- Modify: `src/routes/app/Groups.tsx`

- [ ] **Step 1: 구현**

```typescript
// src/routes/app/Groups.tsx
import { useState } from 'react';
import { Card, Button, Badge, toast } from '@/components/ds';
import { useGroupsStore } from '@/stores/use-groups';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function Groups() {
  const myGroups = useGroupsStore((s) => s.myGroups());
  const exploreGroups = useGroupsStore((s) => s.exploreGroups());
  const [tab, setTab] = useState<'mine' | 'explore'>('mine');

  const groups = tab === 'mine' ? myGroups : exploreGroups;

  const enter = () => {
    toast({ message: '이 화면은 데모에서 미구현 — 06_화면_기능_정의서 참조', tone: 'info', duration: 3500 });
  };

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <h1 className="display text-3xl">스터디 그룹</h1>

      <div className="flex gap-2 border-b border-stone-200">
        <button
          onClick={() => setTab('mine')}
          className={`px-4 py-2 ${tab === 'mine' ? 'border-b-2 border-[#D97706] text-[#D97706]' : 'text-stone-600'}`}
        >내 그룹 ({myGroups.length})</button>
        <button
          onClick={() => setTab('explore')}
          className={`px-4 py-2 ${tab === 'explore' ? 'border-b-2 border-[#D97706] text-[#D97706]' : 'text-stone-600'}`}
        >그룹 탐색 ({exploreGroups.length})</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((g) => (
          <Card key={g.id} elevated className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="display text-xl">{g.name}</h3>
                <p className="text-sm text-stone-600">{g.description}</p>
              </div>
              <Badge tone={g.joinType === 'open' ? 'success' : g.joinType === 'approval' ? 'warning' : 'neutral'}>
                {g.joinType === 'open' ? '공개' : g.joinType === 'approval' ? '승인 필요' : '초대제'}
              </Badge>
            </div>
            <div className="text-sm text-stone-600">
              <div>👥 {g.memberCount} / {g.maxMembers}명 · 📚 덱 {g.sharedDeckCount}개</div>
              <div className="text-xs text-stone-500 mt-1">
                마지막 활동: {formatDistanceToNow(g.lastActivityAt, { locale: ko, addSuffix: true })}
              </div>
            </div>
            <Button variant={g.joined ? 'primary' : 'secondary'} className="w-full" onClick={enter}>
              {g.joined ? '입장하기' : '가입하기'}
            </Button>
          </Card>
        ))}
      </div>

      <div className="text-center pt-4">
        <Button variant="secondary" onClick={enter}>+ 새 그룹 만들기</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 검증** — /app/groups
  - "내 그룹" 탭: AWS 자격증 스터디, 알고리즘 마스터즈
  - "그룹 탐색" 탭: 딥러닝 논문 읽기, Synapse 사용자 모임
  - 입장하기 클릭 시 toast 안내

- [ ] **Step 3: 커밋**

```bash
git add src/routes/app/Groups.tsx
git commit -m "feat(groups): implement study groups list with mine/explore tabs"
```

---

### Task 6.2: 알림 Drawer

**Files:**
- Create: `src/components/shell/NotificationDrawer.tsx`
- Modify: `src/routes/app/Layout.tsx`
- Modify: `src/components/shell/AppShell.tsx`
- Modify: `src/components/shell/AppBar.tsx` (unreadCount 배지)

- [ ] **Step 1: NotificationDrawer 구현**

```typescript
// src/components/shell/NotificationDrawer.tsx
import { useState } from 'react';
import { Button } from '@/components/ds';
import { useNotificationsStore, type NotificationCategory } from '@/stores/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Props { open: boolean; onClose: () => void }

const CATEGORIES: Array<{ id: NotificationCategory | 'all'; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'review', label: '복습' },
  { id: 'community', label: '커뮤니티' },
  { id: 'achievement', label: '성취' },
];

export function NotificationDrawer({ open, onClose }: Props) {
  const items = useNotificationsStore((s) => s.items);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const [filter, setFilter] = useState<NotificationCategory | 'all'>('all');

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-stone-900/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 z-40 h-dvh w-full sm:w-96 bg-stone-50 shadow-xl transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label="알림 센터"
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
          <h2 className="display text-lg">알림</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={markAllRead}>모두 읽음</Button>
            <button onClick={onClose} aria-label="닫기" className="p-1">×</button>
          </div>
        </header>

        <nav className="flex gap-1 px-4 py-2 border-b border-stone-200 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${filter === c.id ? 'bg-[#D97706] text-white' : 'bg-stone-200 text-stone-700'}`}
            >{c.label}</button>
          ))}
        </nav>

        <div className="overflow-auto flex-1 p-3 space-y-2">
          {filtered.length === 0 && <p className="text-center text-sm text-stone-500 py-8">알림이 없습니다</p>}
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => markRead(item.id)}
              className={`w-full text-left rounded-md p-3 border ${item.read ? 'bg-stone-50 border-stone-200' : 'bg-[#FEF3C7]/40 border-[#FEF3C7]'}`}
            >
              <div className="flex items-start gap-2">
                <span aria-hidden="true">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-stone-600">{item.body}</div>
                  <div className="text-[10px] text-stone-500 mt-1">
                    {formatDistanceToNow(item.createdAt, { locale: ko, addSuffix: true })}
                  </div>
                </div>
                {!item.read && <span className="w-2 h-2 rounded-full bg-[#D97706] mt-1" aria-label="읽지 않음" />}
              </div>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: AppShell 업데이트 (drawer state lifting)**

```typescript
// src/components/shell/AppShell.tsx
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { AppBar } from './AppBar';
import { NotificationDrawer } from './NotificationDrawer';
import { useNotificationsStore } from '@/stores/use-notifications';

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const unread = useNotificationsStore((s) => s.unreadCount());
  return (
    <div className="min-h-dvh flex flex-col bg-stone-50">
      <AppBar
        unreadCount={unread}
        onOpenNotifications={() => setDrawerOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>
      <BottomNav />
      <NotificationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 3: AppBar에 unread count 배지 추가**

```typescript
// src/components/shell/AppBar.tsx — 알림 버튼 부분 교체
interface AppBarProps {
  onOpenNotifications?: () => void;
  unreadCount?: number;
}

// 기존 export 시그니처에 unreadCount 추가, 알림 버튼은:
<button
  aria-label={`알림 ${unreadCount ?? 0}개 미읽음`}
  onClick={onOpenNotifications}
  className="relative rounded-md p-2 hover:bg-stone-100"
>
  🔔
  {unreadCount && unreadCount > 0 ? (
    <span className="absolute -top-0.5 -right-0.5 bg-[#D97706] text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center tabular-nums">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  ) : null}
</button>
```

- [ ] **Step 4: 검증** — /app/* 어디서든 우상단 🔔 클릭
  - 우측 슬라이드인 drawer 표시
  - 카테고리 필터 동작
  - 알림 클릭 시 읽음 처리 (배지 숫자 감소)
  - "모두 읽음" 버튼 동작

- [ ] **Step 5: 커밋**

```bash
git add src/components/shell
git commit -m "feat(shell): add notification drawer with category filter and unread badge"
```

---

### Task 6.3: 데모 모드 토글 + 초기화 버튼

**Files:**
- Create: `src/components/shared/DemoModeToggle.tsx`
- Create: `src/components/shared/DemoModeToast.tsx`
- Modify: `src/components/shell/AppBar.tsx`
- Modify: `src/routes/app/Layout.tsx`

- [ ] **Step 1: DemoModeToggle**

```typescript
// src/components/shared/DemoModeToggle.tsx
import { Button, toast } from '@/components/ds';
import { useDemoStore } from '@/stores/use-demo';

export function DemoModeToggle() {
  const reset = useDemoStore((s) => s.reset);

  const handleReset = () => {
    if (!confirm('데모를 초기화할까요? 모든 사용자 데이터가 삭제되고 시드로 복원됩니다.')) return;
    reset();
    toast({ message: '데모가 초기화되었습니다', tone: 'success' });
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-stone-500 hidden sm:inline">데모 모드</span>
      <Button size="sm" variant="ghost" onClick={handleReset}>초기화</Button>
    </div>
  );
}
```

- [ ] **Step 2: DemoModeToast (첫 진입 시)**

```typescript
// src/components/shared/DemoModeToast.tsx
import { useEffect } from 'react';
import { toast } from '@/components/ds';

const KEY = 'synapse:demo-toast-shown';

export function DemoModeToast() {
  useEffect(() => {
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, '1');
    setTimeout(() => {
      toast({
        message: '데모 모드 — 자유롭게 둘러보세요. 우상단에서 초기화 가능.',
        tone: 'info',
        duration: 4000,
      });
    }, 800);
  }, []);
  return null;
}
```

- [ ] **Step 3: AppBar에 DemoModeToggle 추가**

```typescript
// src/components/shell/AppBar.tsx — 우측 영역에 추가
import { DemoModeToggle } from '@/components/shared/DemoModeToggle';

// 알림 버튼 옆에:
<DemoModeToggle />
```

- [ ] **Step 4: Layout에 DemoModeToast 추가**

```typescript
// src/routes/app/Layout.tsx
import { Outlet } from 'react-router';
import { AppShell } from '@/components/shell/AppShell';
import { DemoModeToast } from '@/components/shared/DemoModeToast';

export default function AppLayout() {
  return (
    <AppShell>
      <DemoModeToast />
      <Outlet />
    </AppShell>
  );
}
```

- [ ] **Step 5: 검증** — /app 첫 진입
  - 0.8초 후 데모 모드 안내 토스트 4초간 노출
  - 우상단 "초기화" 버튼 클릭 → confirm → 토스트 + 리로드 → 시드 데이터로 복원

- [ ] **Step 6: 커밋**

```bash
git add src/components/shared/DemoModeToggle.tsx src/components/shared/DemoModeToast.tsx src/components/shell/AppBar.tsx src/routes/app/Layout.tsx
git commit -m "feat: add demo mode toast and reset button"
```

---

### Task 6.4: 랜딩 페이지 (`/`)

**Files:**
- Modify: `src/routes/landing.tsx`

- [ ] **Step 1: 구현**

```typescript
// src/routes/landing.tsx
import { Link } from 'react-router';
import { Button } from '@/components/ds';

export default function Landing() {
  return (
    <div className="min-h-dvh bg-stone-50">
      <header className="border-b border-stone-200 bg-stone-50/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="display text-xl text-stone-900">Synapse</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/app" className="text-stone-700 hover:text-[#D97706]">데모</Link>
            <Link to="/about" className="text-stone-700 hover:text-[#D97706]">프로젝트</Link>
            <Link to="/architecture" className="text-stone-700 hover:text-[#D97706]">아키텍처</Link>
            <Link to="/docs" className="text-stone-700 hover:text-[#D97706]">문서</Link>
            <a href="https://github.com/team-project-final/synapse-prototype" target="_blank" rel="noreferrer" className="text-stone-700 hover:text-[#D97706]">GitHub</a>
          </nav>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <p className="text-sm text-[#D97706] font-medium uppercase tracking-wider mb-4">Synapse — 통합 학습-지식 그래프 SaaS</p>
        <h1 className="display text-5xl sm:text-6xl text-stone-900 leading-tight mb-6">
          노트를 쓰면 AI가 카드를 만들어주고,<br />
          <span className="text-[#D97706]">복습하면 노트가 다시 살아난다.</span>
        </h1>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
          Obsidian의 PKM, Anki의 SRS, 그리고 LLM RAG를 한 워크플로우로.
          기록한 모든 것이 살아있는 지식 그래프가 됩니다.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/app"><Button size="lg">데모 시작하기 →</Button></Link>
          <Link to="/architecture"><Button size="lg" variant="secondary">기술 문서</Button></Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <Feature
          title="PKM-SRS-AI 통합"
          desc="노트 작성과 카드 복습을 하나의 플랫폼에서. AI가 노트에서 자동으로 카드를 만들어줍니다."
          icon="📝"
        />
        <Feature
          title="지식 그래프"
          desc="위키링크 기반 양방향 링크로 개념 간 관계를 시각화. PageRank로 중요한 노트 자동 발견."
          icon="🕸️"
        />
        <Feature
          title="시맨틱 검색"
          desc="pgvector + Elasticsearch 하이브리드. 키워드를 넘어 의미로 검색하고 RAG로 답변까지."
          icon="🔍"
        />
      </section>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        <p>Synapse 팀 프로젝트 · 2026 · MIT License</p>
        <p className="mt-1">
          <a href="https://github.com/team-project-final/synapse-prototype" target="_blank" rel="noreferrer" className="hover:text-[#D97706]">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

function Feature({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="space-y-2">
      <div className="text-4xl" aria-hidden="true">{icon}</div>
      <h3 className="display text-xl">{title}</h3>
      <p className="text-stone-600 text-sm">{desc}</p>
    </div>
  );
}
```

- [ ] **Step 2: 검증** — http://localhost:5173/synapse-prototype/
  - Hero 카피 (Fraunces 세리프, amber 강조)
  - "데모 시작하기" 클릭 → /app 이동
  - 3개 차별점 섹션
  - 푸터 GitHub 링크

- [ ] **Step 3: 커밋**

```bash
git add src/routes/landing.tsx
git commit -m "feat(landing): implement hero landing page with feature highlights"
```

---

### Task 6.5: 프로젝트 소개 (`/about`)

**Files:**
- Modify: `src/routes/about.tsx`
- Create: `src/components/shared/SiteHeader.tsx`

- [ ] **Step 1: SiteHeader 공유 컴포넌트 (랜딩 외 페이지 공통)**

```typescript
// src/components/shared/SiteHeader.tsx
import { Link } from 'react-router';

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-stone-50/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="display text-xl text-stone-900">Synapse</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/app" className="text-stone-700 hover:text-[#D97706]">데모</Link>
          <Link to="/about" className="text-stone-700 hover:text-[#D97706]">프로젝트</Link>
          <Link to="/architecture" className="text-stone-700 hover:text-[#D97706]">아키텍처</Link>
          <Link to="/docs" className="text-stone-700 hover:text-[#D97706]">문서</Link>
          <a href="https://github.com/team-project-final/synapse-prototype" target="_blank" rel="noreferrer" className="text-stone-700 hover:text-[#D97706]">GitHub</a>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: about 라우트 (대표 콘텐츠 직접 렌더; 길이는 wiki 01 참조)**

```typescript
// src/routes/about.tsx
import { SiteHeader } from '@/components/shared/SiteHeader';
import { Card } from '@/components/ds';
import { Link } from 'react-router';

export default function About() {
  return (
    <div className="min-h-dvh bg-stone-50">
      <SiteHeader />
      <article className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <header>
          <h1 className="display text-4xl text-stone-900">프로젝트 소개</h1>
          <p className="text-stone-600 mt-2">Synapse — 통합 학습-지식 그래프 SaaS</p>
        </header>

        <section>
          <h2 className="display text-2xl mb-3">배경 및 문제 정의</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            기존의 PKM 도구(Obsidian, Notion)는 자유로운 노트 작성에 강하지만 복습 메커니즘이 부재합니다.
            반대로 SRS 도구(Anki, Quizlet)는 과학적 반복 학습 알고리즘을 갖추었지만 카드는 맥락이 없는 단편입니다.
            Synapse는 이 둘을 하나의 워크플로우로 통합하고, AI로 카드 생성 부담을 없앱니다.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl mb-3">핵심 목표</h2>
          <Card>
            <table className="w-full text-sm">
              <thead className="text-left text-stone-500"><tr><th>목표</th><th>측정</th></tr></thead>
              <tbody className="divide-y divide-stone-200">
                <tr><td className="py-2">PKM-SRS 통합</td><td>노트→카드 전환율 60%+</td></tr>
                <tr><td className="py-2">AI 카드 자동 생성</td><td>카드 생성 시간 90% 단축</td></tr>
                <tr><td className="py-2">지식 그래프</td><td>그래프 탐색 DAU 30%+</td></tr>
                <tr><td className="py-2">시맨틱 검색</td><td>MRR@10 0.7+</td></tr>
                <tr><td className="py-2">크로스 플랫폼</td><td>Web/iOS/Android 동시 출시</td></tr>
              </tbody>
            </table>
          </Card>
        </section>

        <section>
          <h2 className="display text-2xl mb-3">대상 사용자 (페르소나)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: '개발자 김시냅스 (28세)', role: '주니어 개발자', need: '기술 블로그 정리 + 핵심 개념 반복 학습' },
              { name: '대학원생 이연구 (26세)', role: 'NLP 석사과정', need: '논문 핵심 개념 암기 + 연구 아이디어 연결' },
              { name: '자격증 준비자 박합격 (32세)', role: 'SI 인프라 엔지니어', need: 'AWS SAA 개념 정리 + 출퇴근 모바일 복습' },
              { name: '스터디 그룹 멤버', role: '학습 커뮤니티 참여자', need: '학습 자료 공유 + 그룹 동기 부여' },
            ].map((p) => (
              <Card key={p.name}>
                <h3 className="display text-lg">{p.name}</h3>
                <p className="text-xs text-stone-500">{p.role}</p>
                <p className="text-sm text-stone-700 mt-2">{p.need}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="display text-2xl mb-3">비즈니스 모델 — Freemium</h2>
          <Card>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-stone-500"><th>플랜</th><th>가격</th><th>노트</th><th>AI</th></tr></thead>
              <tbody className="divide-y divide-stone-200">
                <tr><td>Free</td><td>$0</td><td>100</td><td>50회/월</td></tr>
                <tr><td>Pro</td><td>$9.99/월</td><td>무제한</td><td>500회/월</td></tr>
                <tr><td>Team</td><td>$19.99/seat/월</td><td>무제한</td><td>1000회/월</td></tr>
              </tbody>
            </table>
          </Card>
        </section>

        <section className="text-center pt-4">
          <Link to="/architecture" className="text-[#D97706] hover:underline">→ 시스템 아키텍처 보기</Link>
        </section>
      </article>
    </div>
  );
}
```

- [ ] **Step 3: 검증** — /about
  - 헤더 + 본문 (배경/목표/페르소나/비즈니스 모델 4섹션)
  - 모바일 반응형 그리드

- [ ] **Step 4: 커밋**

```bash
git add src/routes/about.tsx src/components/shared/SiteHeader.tsx
git commit -m "feat(about): implement project introduction page"
```

---

### Task 6.6: 아키텍처 페이지 (`/architecture`) — mermaid 인터랙티브

**Files:**
- Create: `src/components/shared/MermaidDiagram.tsx`
- Modify: `src/routes/architecture.tsx`

- [ ] **Step 1: MermaidDiagram 컴포넌트**

```typescript
// src/components/shared/MermaidDiagram.tsx
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    primaryColor: '#FEF3C7',
    primaryTextColor: '#292524',
    primaryBorderColor: '#D97706',
    lineColor: '#78716C',
    secondaryColor: '#F5F5F4',
    tertiaryColor: '#FAFAF9',
  },
});

let counter = 0;

export function MermaidDiagram({ source }: { source: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const id = `mermaid-${++counter}`;
    mermaid.render(id, source).then(({ svg }) => {
      if (ref.current) ref.current.innerHTML = svg;
    }).catch((err) => {
      if (ref.current) ref.current.innerHTML = `<pre class="text-xs text-[#DC2626]">렌더 실패: ${err.message}</pre>`;
    });
  }, [source]);
  return <div ref={ref} className="my-4 [&>svg]:max-w-full" />;
}
```

- [ ] **Step 2: 시퀀스 단계 재생 컴포넌트**

```typescript
// src/components/shared/StepThroughDiagram.tsx
import { useState } from 'react';
import { Button, Card } from '@/components/ds';
import { MermaidDiagram } from './MermaidDiagram';

interface Step { title: string; description: string; mermaid: string }

export function StepThroughDiagram({ steps }: { steps: Step[] }) {
  const [i, setI] = useState(0);
  const step = steps[i]!;
  return (
    <Card elevated>
      <div className="flex items-center justify-between mb-3">
        <h3 className="display text-lg">{step.title}</h3>
        <span className="text-sm text-stone-500 tabular-nums">{i + 1} / {steps.length}</span>
      </div>
      <p className="text-sm text-stone-600 mb-2">{step.description}</p>
      <MermaidDiagram source={step.mermaid} />
      <div className="flex gap-2 mt-3">
        <Button variant="secondary" size="sm" disabled={i === 0} onClick={() => setI(i - 1)}>← 이전</Button>
        <Button variant="secondary" size="sm" disabled={i === steps.length - 1} onClick={() => setI(i + 1)}>다음 →</Button>
        <Button size="sm" onClick={() => setI(0)}>처음부터</Button>
      </div>
    </Card>
  );
}
```

- [ ] **Step 3: architecture 라우트**

```typescript
// src/routes/architecture.tsx
import { SiteHeader } from '@/components/shared/SiteHeader';
import { MermaidDiagram } from '@/components/shared/MermaidDiagram';
import { StepThroughDiagram } from '@/components/shared/StepThroughDiagram';

const SYSTEM_DIAGRAM = `graph TB
  CL[Flutter Web/Mobile] --> CF[Cloudflare CDN]
  CF --> GW[Spring Cloud Gateway 5]
  GW --> P[platform-svc]
  GW --> E[engagement-svc]
  GW --> K[knowledge-svc]
  GW --> L[learning-svc]
  P --> PG[(PostgreSQL 16<br/>+pgvector)]
  K --> PG
  L --> PG
  P --> RD[(Redis 7)]
  K --> ES[(Elasticsearch 8)]
  P --> KF[Kafka 3.x]
  E --> KF
  L --> OPENAI[OpenAI API]`;

const NOTE_FLOW_STEPS = [
  {
    title: '1. 사용자 노트 작성',
    description: '에디터에 마크다운 입력. [[과적합]] 형식의 위키링크 포함.',
    mermaid: 'sequenceDiagram\n  사용자->>Gateway: POST /notes\n  Gateway->>Note Svc: forward',
  },
  {
    title: '2. 위키링크 추출 + 백링크 갱신',
    description: '서버가 마크다운에서 [[…]]를 파싱하여 outgoingLinks를 추출.',
    mermaid: 'sequenceDiagram\n  Note Svc->>PostgreSQL: INSERT note\n  Note Svc->>PostgreSQL: INSERT note_links\n  Note Svc-->>사용자: 201 Created',
  },
  {
    title: '3. 비동기 임베딩 + 인덱싱',
    description: 'Kafka로 note.created 이벤트 발행. AI Service가 임베딩 생성, ES가 인덱싱.',
    mermaid: 'sequenceDiagram\n  Note Svc->>Kafka: note.created\n  Kafka->>AI Svc: consume\n  AI Svc->>OpenAI: embed\n  AI Svc->>PostgreSQL: INSERT note_chunks\n  Kafka->>ES: consume\n  ES->>ES: nori 형태소 인덱싱',
  },
];

export default function Architecture() {
  return (
    <div className="min-h-dvh bg-stone-50">
      <SiteHeader />
      <article className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <header>
          <h1 className="display text-4xl">시스템 아키텍처</h1>
          <p className="text-stone-600 mt-2">4-서비스 통합 (ADR-001 / ADR-002, 2026-05-09 채택)</p>
        </header>

        <section>
          <h2 className="display text-2xl mb-3">전체 구조</h2>
          <p className="text-stone-700 mb-3">
            10개 마이크로서비스 원안을 4개 굵은 서비스(platform / engagement / knowledge / learning)로 통합.
            각 서비스는 Spring Modulith 모듈 분리. AI는 learning-svc 안의 별도 컨테이너(FastAPI).
          </p>
          <MermaidDiagram source={SYSTEM_DIAGRAM} />
        </section>

        <section>
          <h2 className="display text-2xl mb-3">노트 작성 시퀀스 (단계 재생)</h2>
          <p className="text-stone-700 mb-3">
            노트 작성 → 위키링크 자동 추출 → 비동기 임베딩까지의 흐름을 단계별로 따라가 보세요.
          </p>
          <StepThroughDiagram steps={NOTE_FLOW_STEPS} />
        </section>

        <section>
          <h2 className="display text-2xl mb-3">데이터 레이어</h2>
          <ul className="space-y-2 text-stone-700">
            <li>• <strong>PostgreSQL 16</strong> + pgvector — 트랜잭션 + 임베딩 저장</li>
            <li>• <strong>Redis 7 Cluster</strong> — 세션, 레이트 리밋, 시맨틱 캐시</li>
            <li>• <strong>Elasticsearch 8</strong> + nori — 한국어 전문 검색 + BM25</li>
            <li>• <strong>Kafka 3.x</strong> — 이벤트 스트리밍, CloudEvents 스펙</li>
            <li>• <strong>S3</strong> — 첨부파일 / 데이터 내보내기</li>
          </ul>
        </section>
      </article>
    </div>
  );
}
```

- [ ] **Step 4: 검증** — /architecture
  - 시스템 아키텍처 mermaid 다이어그램 렌더
  - "노트 작성 시퀀스" 단계 재생 (이전/다음/처음부터 동작)

- [ ] **Step 5: 커밋**

```bash
git add src/components/shared/MermaidDiagram.tsx src/components/shared/StepThroughDiagram.tsx src/routes/architecture.tsx
git commit -m "feat(architecture): implement architecture page with interactive mermaid diagrams"
```

---

### Task 6.7: 문서 인덱스 + 개별 문서 (`/docs`, `/docs/:slug`)

**Files:**
- Modify: `src/routes/docs/index.tsx`
- Modify: `src/routes/docs/Slug.tsx`
- Create: `src/data/docs-list.ts`
- Create: `src/lib/docs-loader.ts`

- [ ] **Step 1: docs-list (M7에서 sync-docs.mjs와 일치하는 메타데이터)**

```typescript
// src/data/docs-list.ts
export interface DocMeta { slug: string; title: string; group: string; order: number }

export const DOCS: DocMeta[] = [
  { slug: '01_프로젝트_계획서', title: '01 프로젝트 계획서', group: '기획/설계', order: 1 },
  { slug: '02_ERD_문서', title: '02 ERD 문서', group: '기획/설계', order: 2 },
  { slug: '03_프로젝트_아키텍처_정의서', title: '03 프로젝트 아키텍처 정의서', group: '기획/설계', order: 3 },
  { slug: '04_API_명세서', title: '04 API 명세서', group: '기획/설계', order: 4 },
  { slug: '05_화면_흐름_시퀀스_다이어그램', title: '05 화면 흐름 시퀀스 다이어그램', group: '기획/설계', order: 5 },
  { slug: '06_화면_기능_정의서', title: '06 화면 기능 정의서', group: '기획/설계', order: 6 },
  { slug: '07_요구사항_정의서', title: '07 요구사항 정의서', group: '기획/설계', order: 7 },
  { slug: '08_스토리_보드', title: '08 스토리 보드', group: '기획/설계', order: 8 },
  { slug: '09_Git_규칙_정의서', title: '09 Git 규칙 정의서', group: '개발 규칙', order: 9 },
  { slug: '10_환경_설정_템플릿', title: '10 환경 설정 템플릿', group: '개발 규칙', order: 10 },
  { slug: '11_테스트_전략서', title: '11 테스트 전략서', group: '개발 규칙', order: 11 },
  { slug: '12_코드_리뷰_규칙', title: '12 코드 리뷰 규칙', group: '개발 규칙', order: 12 },
  { slug: '13_테스트_보고서', title: '13 테스트 보고서', group: '운영/배포', order: 13 },
  { slug: '14_배포_가이드', title: '14 배포 가이드', group: '운영/배포', order: 14 },
  { slug: '15_사용자_메뉴얼', title: '15 사용자 메뉴얼', group: '운영/배포', order: 15 },
  { slug: '16_운영_메뉴얼', title: '16 운영 메뉴얼', group: '운영/배포', order: 16 },
  { slug: '17_스케줄', title: '17 스케줄', group: '운영/배포', order: 17 },
  { slug: '18_기술_스택_정의서', title: '18 기술 스택 정의서', group: '운영/배포', order: 18 },
];

export function groupedDocs(): Array<{ group: string; docs: DocMeta[] }> {
  const map = new Map<string, DocMeta[]>();
  for (const d of DOCS) {
    if (!map.has(d.group)) map.set(d.group, []);
    map.get(d.group)!.push(d);
  }
  return Array.from(map.entries()).map(([group, docs]) => ({ group, docs: docs.sort((a, b) => a.order - b.order) }));
}
```

- [ ] **Step 2: docs-loader (런타임 fetch)**

```typescript
// src/lib/docs-loader.ts
const cache = new Map<string, string>();

export async function loadDoc(slug: string): Promise<string> {
  if (cache.has(slug)) return cache.get(slug)!;
  const base = import.meta.env.BASE_URL;
  const url = `${base}docs-md/${slug}.md`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`문서를 불러올 수 없습니다: ${slug} (${res.status})`);
  const text = await res.text();
  cache.set(slug, text);
  return text;
}
```

- [ ] **Step 3: docs/index.tsx**

```typescript
// src/routes/docs/index.tsx
import { Link } from 'react-router';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { Card } from '@/components/ds';
import { groupedDocs } from '@/data/docs-list';

export default function DocsIndex() {
  return (
    <div className="min-h-dvh bg-stone-50">
      <SiteHeader />
      <article className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <header>
          <h1 className="display text-4xl">문서</h1>
          <p className="text-stone-600 mt-2">Synapse 위키 — 18개 문서</p>
        </header>

        {groupedDocs().map((g) => (
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

- [ ] **Step 4: docs/Slug.tsx**

```typescript
// src/routes/docs/Slug.tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { Card, Button } from '@/components/ds';
import { MermaidDiagram } from '@/components/shared/MermaidDiagram';
import { loadDoc } from '@/lib/docs-loader';
import { DOCS } from '@/data/docs-list';

export default function DocsSlug() {
  const { slug } = useParams();
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setError(null); setContent(null);
    loadDoc(slug).then(setContent).catch((e) => setError(e.message));
  }, [slug]);

  const meta = DOCS.find((d) => d.slug === slug);
  const idx = DOCS.findIndex((d) => d.slug === slug);
  const prev = idx > 0 ? DOCS[idx - 1] : null;
  const next = idx >= 0 && idx < DOCS.length - 1 ? DOCS[idx + 1] : null;

  return (
    <div className="min-h-dvh bg-stone-50">
      <SiteHeader />
      <article className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/docs" className="text-sm text-stone-500 hover:text-[#D97706]">← 문서 목록</Link>
        <h1 className="display text-3xl mt-2 mb-6">{meta?.title ?? slug}</h1>

        {error && <Card><p className="text-[#DC2626]">{error}</p></Card>}
        {!content && !error && <p className="text-stone-500">불러오는 중…</p>}
        {content && (
          <div className="prose prose-stone max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code: ({ className, children }) => {
                  const lang = /language-(\w+)/.exec(className ?? '')?.[1];
                  if (lang === 'mermaid') return <MermaidDiagram source={String(children).trim()} />;
                  return <code className={className}>{children}</code>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}

        <nav className="flex justify-between mt-12 pt-6 border-t border-stone-200">
          {prev ? (
            <Link to={`/docs/${prev.slug}`}><Button variant="secondary">← {prev.title}</Button></Link>
          ) : <span />}
          {next ? (
            <Link to={`/docs/${next.slug}`}><Button variant="secondary">{next.title} →</Button></Link>
          ) : <span />}
        </nav>
      </article>
    </div>
  );
}
```

- [ ] **Step 5: 임시 docs-md 콘텐츠 생성 (M7에서 sync-docs로 대체)**

수동: `D:\workspace\final-project-syn\page\public\docs-md\` 폴더 생성, 시드용 문서 1개 추가:

```bash
mkdir -p public/docs-md
# documents.wiki에서 1개 복사하여 동작 확인용
cp '../documents.wiki/01_프로젝트_계획서.md' public/docs-md/01_프로젝트_계획서.md
```

- [ ] **Step 6: 검증** — /docs → /docs/01_프로젝트_계획서
  - 문서 목록 (그룹별 카드)
  - 클릭 → 마크다운 렌더링 (코드 블록 하이라이팅, mermaid 다이어그램 인라인)
  - 이전/다음 네비게이션

- [ ] **Step 7: 커밋**

```bash
git add src/data/docs-list.ts src/lib/docs-loader.ts src/routes/docs/index.tsx src/routes/docs/Slug.tsx
git commit -m "feat(docs): implement docs index and detail pages with markdown + mermaid"
```

---

## Milestone 6 완료 조건

- [ ] /app/groups: 4개 그룹 (내 그룹 2 / 탐색 2), 입장 시 데모 미구현 안내
- [ ] 알림 drawer: 5개 시드 알림, 카테고리 필터, 읽음 처리, 우상단 unread 배지
- [ ] /app 첫 진입 시 데모 안내 토스트 1회 노출
- [ ] 우상단 "초기화" 버튼: confirm → 시드 복원 → 페이지 리로드
- [ ] /: Hero + 3 차별점 + 푸터, "데모 시작하기" → /app
- [ ] /about: 4개 섹션 (배경/목표/페르소나/비즈니스 모델)
- [ ] /architecture: 시스템 다이어그램 + 시퀀스 단계 재생
- [ ] /docs: 18개 문서 그룹별 인덱스
- [ ] /docs/:slug: 마크다운 렌더링 + mermaid 인라인 + prev/next
- [ ] `npm run typecheck` 0 errors

---

## Milestone 7 — Wiki Sync, E2E, Deployment

### Task 7.1: documents.wiki 빌드 타임 sync 스크립트

**Files:**
- Create: `scripts/sync-docs.mjs`

- [ ] **Step 1: sync-docs.mjs 작성**

```javascript
// scripts/sync-docs.mjs
import { mkdtemp, rm, mkdir, copyFile, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const PUBLIC_DOCS_DIR = join(PROJECT_ROOT, 'public', 'docs-md');

const REPO_URL = process.env.WIKI_REPO_URL ?? 'https://github.com/team-project-final/documents.wiki.git';
const PAT = process.env.WIKI_PAT;

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function main() {
  console.log('[sync-docs] start');

  const tmp = await mkdtemp(join(tmpdir(), 'synapse-wiki-'));
  console.log(`[sync-docs] cloning to ${tmp}`);

  const url = PAT
    ? REPO_URL.replace('https://', `https://${PAT}@`)
    : REPO_URL;
  await run('git', ['clone', '--depth', '1', url, tmp]);

  await mkdir(PUBLIC_DOCS_DIR, { recursive: true });

  const entries = await readdir(tmp);
  let copied = 0;
  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue;
    if (entry.startsWith('_')) continue;
    const src = join(tmp, entry);
    const s = await stat(src);
    if (!s.isFile()) continue;
    const destName = entry === 'Home.md' ? 'index.md' : entry;
    await copyFile(src, join(PUBLIC_DOCS_DIR, destName));
    copied++;
  }

  console.log(`[sync-docs] copied ${copied} markdown files to public/docs-md/`);
  await rm(tmp, { recursive: true, force: true });
}

main().catch((err) => {
  console.error('[sync-docs] FAILED:', err.message);
  process.exit(1);
});
```

- [ ] **Step 2: 로컬 검증 (documents.wiki public 가정)**

Run: `npm run sync-docs`
Expected:
- `public/docs-md/`에 18개 *.md 파일 복사됨
- `Home.md`는 `index.md`로 변환됨
- 콘솔: `[sync-docs] copied 18 markdown files to public/docs-md/`

만약 documents.wiki가 private이라면:
- GitHub Settings → Developer settings → Personal access tokens → Generate (`repo:read` 권한)
- 로컬: `WIKI_PAT=ghp_xxxxx npm run sync-docs`
- CI: GitHub repo Settings → Secrets → New repository secret → `WIKI_PAT`
- workflow에서 env로 주입

- [ ] **Step 3: .gitignore 갱신 (sync된 파일은 git에 안 올림)**

```
# .gitignore에 추가
public/docs-md/
```

- [ ] **Step 4: 커밋**

```bash
git add scripts/sync-docs.mjs .gitignore
git commit -m "build: add documents.wiki sync script for build-time docs"
```

---

### Task 7.2: GitHub Actions 워크플로우 활성화

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: deploy.yml 완성형으로 교체**

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

      - name: Install dependencies
        run: npm ci

      - name: Sync wiki docs
        env:
          WIKI_REPO_URL: https://github.com/team-project-final/documents.wiki.git
          WIKI_PAT: ${{ secrets.WIKI_PAT }}
        run: npm run sync-docs

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm run test

      - name: Build
        run: npm run build

      - name: Deploy to gh-pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: gh-pages
```

- [ ] **Step 2: 커밋**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: enable full deploy pipeline (sync-docs, build, gh-pages)"
```

---

### Task 7.3: E2E 핵심 플로우 테스트 (Playwright)

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/core-flow.spec.ts`

- [ ] **Step 1: Playwright 초기화 및 설정**

Run: `npx playwright install --with-deps chromium`
Expected: Chromium 다운로드 완료

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173/synapse-prototype',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/synapse-prototype/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 2: 핵심 플로우 E2E 테스트**

```typescript
// tests/e2e/core-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Core PKM-SRS-AI Loop', () => {
  test('user can create note, generate AI cards, review them', async ({ page }) => {
    // 1. 랜딩 → /app 진입
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /노트를 쓰면 AI가/i })).toBeVisible();
    await page.getByRole('link', { name: /데모 시작하기/i }).click();
    await expect(page).toHaveURL(/\/app$/);

    // 2. 대시보드 — 시드 데이터 확인
    await expect(page.getByText('지식 탐험가')).toBeVisible();

    // 3. 노트 생성
    await page.getByRole('link', { name: /노트/i }).first().click();
    await expect(page).toHaveURL(/\/app\/notes/);
    await page.getByRole('link', { name: /\+ 새 노트/i }).click();

    await page.getByPlaceholder('제목').fill('E2E 테스트 노트');
    await page.locator('textarea').fill('# 테스트\n\n이 노트는 [[과적합]] 관련입니다.');
    await page.getByRole('button', { name: '저장' }).click();

    // 4. 노트 상세에서 AI 카드 생성
    await expect(page.getByRole('heading', { name: 'E2E 테스트 노트' })).toBeVisible();
    await page.getByRole('link', { name: /AI 카드 생성/i }).click();

    // 5. AI 생성 대기 → 저장
    await expect(page.getByText(/카드를 만들고 있어요/)).toBeVisible();
    await expect(page.getByText(/카드를 만들고 있어요/)).toBeHidden({ timeout: 5000 });
    await page.getByRole('button', { name: /\d+장 저장/ }).click();

    // 6. 덱 목록 도달
    await expect(page).toHaveURL(/\/app\/decks$/);
  });

  test('reset button restores seed data', async ({ page }) => {
    await page.goto('/app');
    page.on('dialog', (d) => d.accept());
    await page.getByRole('button', { name: '초기화' }).click();
    // 리로드 후 다시 시드 표시
    await expect(page.getByText('지식 탐험가')).toBeVisible({ timeout: 5000 });
  });
});
```

- [ ] **Step 3: E2E 실행**

Run: `npm run test:e2e`
Expected: 2 tests passed

- [ ] **Step 4: 커밋**

```bash
git add playwright.config.ts tests/e2e/core-flow.spec.ts
git commit -m "test(e2e): add Playwright tests for core flow and reset"
```

---

### Task 7.4: 새 GitHub 레포 생성 + 첫 push + Pages 활성화

**Files:** (없음 — 외부 작업)

- [ ] **Step 1: GitHub 웹에서 레포 생성**

브라우저로:
- https://github.com/organizations/team-project-final/repositories/new 접속
- Repository name: `synapse-prototype`
- Description: "Synapse 팀 프로젝트의 인터랙티브 시뮬레이터"
- Public 선택
- "Initialize with README" 체크 해제 (로컬에서 push 예정)
- Create repository

- [ ] **Step 2: 로컬 git remote 연결 + push**

```bash
git remote add origin https://github.com/team-project-final/synapse-prototype.git
git branch -M main
git push -u origin main
```

Expected: 모든 커밋 (M1~M7) push 성공

- [ ] **Step 3: GitHub Actions 자동 실행 모니터링**

브라우저:
- https://github.com/team-project-final/synapse-prototype/actions
- "Deploy to GitHub Pages" 워크플로우 자동 시작 확인
- 약 2~3분 후 ✅ 완료

만약 실패 (documents.wiki private 등):
- Settings → Secrets and variables → Actions → New repository secret
- Name: `WIKI_PAT`, Value: PAT 토큰
- Actions 탭에서 "Re-run all jobs"

- [ ] **Step 4: GitHub Pages 활성화**

브라우저:
- https://github.com/team-project-final/synapse-prototype/settings/pages
- Source: "Deploy from a branch"
- Branch: `gh-pages` / `(root)` (gh-pages는 1차 Actions 실행 후 자동 생성됨)
- Save

약 1~2분 대기 후 https://team-project-final.github.io/synapse-prototype/ 접속 가능.

---

### Task 7.5: 배포 검증 (Smoke Test)

**Files:** (없음 — 수동 검증)

- [ ] **Step 1: 모든 라우트 접근 가능 확인 (브라우저 새 창)**

차례로 접속하며 모두 정상 렌더 확인:
- https://team-project-final.github.io/synapse-prototype/
- https://team-project-final.github.io/synapse-prototype/app
- https://team-project-final.github.io/synapse-prototype/app/notes
- https://team-project-final.github.io/synapse-prototype/app/notes/seed-n1
- https://team-project-final.github.io/synapse-prototype/app/decks
- https://team-project-final.github.io/synapse-prototype/app/graph
- https://team-project-final.github.io/synapse-prototype/app/search
- https://team-project-final.github.io/synapse-prototype/app/profile
- https://team-project-final.github.io/synapse-prototype/app/groups
- https://team-project-final.github.io/synapse-prototype/about
- https://team-project-final.github.io/synapse-prototype/architecture
- https://team-project-final.github.io/synapse-prototype/docs
- https://team-project-final.github.io/synapse-prototype/docs/01_프로젝트_계획서

각 URL에서 새로고침 (Ctrl+R) 시 404 없이 정상 동작 (404.html SPA fallback 검증).

- [ ] **Step 2: 핵심 플로우 라이브 검증 (배포본 기준)**

배포된 사이트에서:
1. 랜딩 → "데모 시작하기" → 대시보드 진입
2. 노트 작성 → 저장 → 노트 목록 반영 확인
3. AI 카드 생성 → 덱에 저장 → 덱 목록 진행도 갱신
4. 복습 세션 1사이클 → 결과 화면 → XP 적립 확인
5. /app/graph에서 백링크 시각화 확인
6. 새로고침 후 데이터 유지 (localStorage)
7. "초기화" 버튼 → 시드 복원

- [ ] **Step 3: README 업데이트 — 라이브 URL 추가**

```markdown
# 기존 README의 첫 줄 아래에 추가
**🌐 라이브 데모**: https://team-project-final.github.io/synapse-prototype/
```

```bash
git add README.md
git commit -m "docs: add live demo URL to README"
git push
```

---

## Milestone 7 완료 조건

- [ ] `npm run sync-docs` 로컬 실행 시 18개 *.md를 `public/docs-md/`에 복사
- [ ] GitHub Actions가 main push 시 자동으로 빌드 → `gh-pages` 브랜치 배포
- [ ] https://team-project-final.github.io/synapse-prototype/ 정상 접속
- [ ] 모든 라우트 새로고침해도 404 없이 동작 (404.html SPA fallback)
- [ ] localStorage 데이터 새로고침/탭 닫고 재오픈 시 유지
- [ ] /docs/:slug에서 18개 문서 모두 정상 렌더 (mermaid 다이어그램 포함)
- [ ] Playwright E2E 2개 테스트 통과
- [ ] README에 라이브 URL 추가됨

---

## Self-Review

### 1. Spec 커버리지

Spec 섹션과 Plan 태스크의 매핑:

| Spec 섹션 | Plan 태스크 |
|----------|-------------|
| 1.1 한 줄 정의 | M1~M6 전체 (SPA 자체) |
| 1.2 3대 청중 | 6.4 랜딩(평가자/사용자) + 6.7 docs(개발자) |
| 1.3 핵심 메시지 3중 시연 | 6.4 랜딩 Hero + M4 시뮬레이터 + 6.6 시퀀스 다이어그램 |
| 1.4 비목표 | (음성적 — 구현 안 함으로 충족) |
| 2.1 URL 구조 | 2.4 라우팅 스켈레톤 + 각 라우트 구현 태스크 |
| 2.2 반응형 네비 | 2.3 AppShell/Sidebar/BottomNav |
| 2.3 데모 토스트/초기화/알림 | 6.2 drawer + 6.3 toggle |
| 3.1 Tier 1 (8 화면) | 4.1~4.9 |
| 3.2 Tier 2 (3 화면) | 5.1~5.3 |
| 3.3 Tier 3 + drawer | 6.1, 6.2 |
| 3.4 시뮬레이션 깊이 매트릭스 | 4.6 (큐레이션+fallback), 4.8 (SM-2 정식), 5.1 (동적 그래프), 5.2 (하이브리드 검색), 6.1 (그룹 안내 페이지) |
| 4.1 의존성 | 1.1 |
| 4.2 폴더 구조 | 모든 task의 Files 섹션 |
| 4.3 설계 원칙 (Routes/Stores/Components 분리) | 폴더 구조와 store 디자인에 반영 |
| 5.1 Zustand stores | 3.5, 3.6, 3.7 |
| 5.2 시드 데이터 | 3.8 |
| 5.3 Mock 로직 (위키링크/SM-2/AI/검색/그래프/XP) | 3.1~3.4, 4.3, 4.6, 4.8, 5.1, 5.2 |
| 5.4 데이터 흐름 | (음성적 — store + persist + UI 즉시 반영 패턴 모든 화면에 적용) |
| 6.1 레포 | 7.4 |
| 6.2 발행 전략 | 1.5 (skeleton), 7.2 (활성화) |
| 6.3 Actions 워크플로우 | 7.2 |
| 6.4 wiki sync | 7.1 |
| 6.5 SPA 404 fallback | 1.5 (post-build.mjs) |
| 6.6 빌드 설정 | 1.3 (vite.config) |
| 6.7 첫 배포 체크리스트 | 7.4, 7.5 |
| 7 테스트 전략 | 단위(3.1~3.4, 4.3), E2E(7.3) |
| 8 리스크 | (각 task가 직간접 완화 — wiki sync는 7.1의 PAT 처리, 데모 오염은 6.3 reset, 라우팅 실수는 1.5+1.3+2.4의 3중 안전망) |

**커버리지 갭**: 시각/접근성 검증 (스펙 7.4)을 별도 태스크로 두지 않음 — 각 컴포넌트에서 ARIA / 키보드 / 색대비를 인라인으로 처리하고 M2 완료 시 수동 검증 항목으로 포함. WCAG 자동화 검증이 필요하면 axe-playwright를 7.3에 추가하는 것을 권장.

### 2. Placeholder 스캔

검토 결과 명시적 placeholder 없음. "TBD/TODO" 문자열도 없음. 단:

- 4.6 ai-templates.ts에 "다른 시드 노트들도 동일 패턴 (구현 시 5개 더 추가)" 주석이 있음 — 핵심 의미는 살아있으나, 좀 더 구체화. 시드 노트 10개 중 시연 핵심인 seed-n1, seed-n7, seed-n2, seed-n3 4개 노트만 큐레이션 필수, 나머지 6개는 동적 fallback이면 충분.
- 4.9 Result 라우트에서 "비교를 위한 oldLevel은 session에서 추적하기 어려우므로..." 주석 — 4.9 Step 4에서 navigate state로 명시적으로 처리. 의도적 설명임.

### 3. 타입 / 시그니처 일관성

- `SrsState`: 3.1 정의 → 3.6 use-decks-cards에서 확장 (`due: number; lastReviewed: number | null` 추가) → 4.8 review에서 사용. 일관됨.
- `Note`: 3.5 정의 → 3.8 seed.ts → 5.2 search → 4.5 view에서 모두 동일.
- `applyRating`: 3.1 → 4.8에서 호출. 시그니처 일관.
- `xpForReview/xpForNoteCreate/xpForAiCardAccept`: 3.4 → 4.4, 4.6, 4.8에서 호출. 일관.
- `Card.srs`에 `due/lastReviewed` 추가가 3.6에서 명시되어 있음, 3.1 SrsState와 분리. consumer는 use-decks-cards 타입 사용 — OK.

발견된 잠재 이슈:

- 2.3 Sidebar items에 `/app/profile` 경로 `🏅` 아이콘 사용 — 4.1에서 동일 경로 사용. 일관.
- 4.4 NoteEditor에서 `existing` 변수 useEffect 의존성 표면 — Zustand getState() 직접 호출이라 reactivity 우회. 실제 동작은 OK (mount 시 1회만 읽음, debounced save로 갱신).

### 4. 모호성 검사

- "데모 초기화"의 정의: 3.7 reset()이 모든 `synapse:*` 키 삭제 → 6.3에서 `window.location.reload()` 호출 → SeedGuard가 재주입. 명확.
- "큐레이션 우선 + 동적 fallback": 4.6 코드의 `CURATED[note.id] ?? generateCardsFromContent(...)` 명시적.
- "시맨틱 검색 8차원 임베딩": 3.8 search-corpus.ts의 8차원 vec + cosine. 명시적.
- "404.html SPA fallback": 1.5 post-build.mjs에서 `cp dist/index.html dist/404.html` 명시.

큰 모호성 없음. M2 완료 조건의 "라우트 19개" 카운트가 "랜딩 + /about + /architecture + /docs/index + /docs/:slug + /app + 13 children"으로 구성됨 — 명확하게 다시 표기 권장: 1 (`/`) + 1 (`/about`) + 1 (`/architecture`) + 1 (`/docs`) + 1 (`/docs/:slug`) + 14 (`/app/*` 트리) = **19**.

수정할 inline 사항이 없음. 진행.

---

## Execution Handoff

Plan 작성 완료 — `D:\workspace\final-project-syn\page\docs\superpowers\plans\2026-05-09-synapse-prototype-implementation.md`.

**두 가지 실행 옵션**:

**1. Subagent-Driven (권장)** — 신규 subagent를 태스크당 1개 dispatch, 태스크 사이에 리뷰. 빠른 반복.

**2. Inline Execution** — 현재 세션에서 `superpowers:executing-plans`로 배치 실행, 체크포인트마다 리뷰.

어느 쪽으로 진행할까요?

- Subagent-Driven 선택 시: `superpowers:subagent-driven-development` 스킬을 사용하여 태스크 1.1부터 신선한 subagent에게 위임, 두 단계 리뷰 (subagent self + main thread).
- Inline Execution 선택 시: `superpowers:executing-plans` 스킬을 사용하여 마일스톤 단위 체크포인트.

또는, 진행 전에 plan을 한 번 더 검토하고 싶으시다면 어느 마일스톤/태스크에 의문이 있는지 알려주세요.
