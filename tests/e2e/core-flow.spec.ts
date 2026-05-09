import { test, expect } from '@playwright/test';

test.describe('Core PKM-SRS-AI Loop', () => {
  test('user can navigate from landing to dashboard with seed data', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /노트를 쓰면 AI가/i })).toBeVisible();
    await page.getByRole('link', { name: /데모 시작하기/i }).first().click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByText('지식 탐험가')).toBeVisible();
  });

  test('user can create a new note', async ({ page }) => {
    await page.goto('/app/notes');
    await page.getByRole('link', { name: /\+ 새 노트/i }).first().click();
    await page.getByPlaceholder('제목').fill('E2E 테스트 노트');
    await page.locator('textarea').fill('# 테스트\n\n이 노트는 [[과적합]] 관련입니다.');
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByRole('heading', { name: 'E2E 테스트 노트' })).toBeVisible();
  });

  test('reset button restores seed data', async ({ page }) => {
    await page.goto('/app');
    page.on('dialog', (d) => d.accept());
    await page.getByRole('button', { name: '초기화' }).click();
    await expect(page.getByText('지식 탐험가')).toBeVisible({ timeout: 5000 });
  });
});
