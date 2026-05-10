import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173/synapse-prototype';

test('docs index lists all groups', async ({ page }) => {
  await page.goto(`${BASE}/docs`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: '문서' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '기획/설계' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '운영/배포' })).toBeVisible();
});

test('mermaid svg renders inline on ERD page', async ({ page }) => {
  await page.goto(`${BASE}/docs/02_ERD_문서/02_2.2-erd`);
  await page.waitForLoadState('networkidle');
  const svg = page.locator('figure.mermaid-svg svg').first();
  await expect(svg).toBeVisible({ timeout: 10000 });
});

test('mega doc 18 splits into sub-pages with parent index', async ({ page }) => {
  await page.goto(`${BASE}/docs/18_기술_스택_정의서`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: '목차' })).toBeVisible();
  const subLinkCount = await page.evaluate(() =>
    [...document.querySelectorAll('article a[href]')].filter(
      (a) => (a as HTMLAnchorElement).pathname.includes('/docs/') &&
              !(a as HTMLAnchorElement).getAttribute('href')!.startsWith('#')
    ).length
  );
  expect(subLinkCount).toBeGreaterThan(0);
});

test('heading anchor link copies hash', async ({ page }) => {
  await page.goto(`${BASE}/docs/03_프로젝트_아키텍처_정의서`);
  await page.waitForLoadState('networkidle');
  await page.locator('article h2 a.heading-anchor, article h3 a.heading-anchor').first().click();
  await expect(page).toHaveURL(/#/);
});
