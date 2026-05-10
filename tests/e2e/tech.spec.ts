import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const manifestPath = resolve(__dirname, '../../public/docs-md/tech/tech-manifest.json');
const hasTechManifest = existsSync(manifestPath);

test.describe('tech section', () => {
  test.skip(!hasTechManifest, 'tech-manifest.json missing — run `npm run sync-docs` with WIKI_PAT');

  test('nav → hub → detail → pager → source → /docs hides 18번', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: '기술 스택' }).click();
    await expect(page).toHaveURL(/\/tech$/);
    await expect(page.getByRole('heading', { name: '기술 스택', level: 1 })).toBeVisible();

    const firstCard = page.locator('section a[href^="/synapse-prototype/tech/"]').first();
    const firstHref = await firstCard.getAttribute('href');
    await firstCard.click();
    await expect(page).toHaveURL(new RegExp(firstHref!));

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const next = page.getByText(/다음 →/);
    await expect(next).toBeVisible();

    const source = page.getByRole('link', { name: /출처: 위키 18\. 기술 스택 정의서/ });
    await expect(source.first()).toHaveAttribute('href', /\/docs\/18_/);

    await page.goto('/docs');
    const techDocLink = page.locator('a[href*="/docs/18_"]');
    await expect(techDocLink).toHaveCount(0);
  });
});
