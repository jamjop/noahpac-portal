import { test, expect } from '@playwright/test';

test.describe('Review cadence labels', () => {
  test('explains the quarterly cadence below the page description at every size', async ({ page }) => {
    await page.goto('/calculators/');
    const cadence = page.locator('.app-header__title > .review-status');
    await expect(cadence).toBeVisible();
    await expect(cadence).toHaveText('References reviewed quarterly');
    await expect(cadence.locator('.review-status__dot')).toBeVisible();
    await expect(cadence.locator('svg')).toHaveCount(0);
    await expect(cadence.evaluate((node) => node.previousElementSibling?.classList.contains('app-header__lede'))).resolves.toBe(true);

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(cadence).toBeVisible();
    await expect(cadence).toHaveText('References reviewed quarterly');
  });

  test('distinguishes weekly updates and live data sources', async ({ page }) => {
    await page.goto('/screener/');
    await expect(page.locator('.app-header__title > .review-status')).toHaveText('Recommendations updated weekly');

    await page.goto('/drugref/');
    await expect(page.locator('.app-header__title > .review-status')).toHaveText('Uses live FDA data');

    await page.goto('/lookup/');
    await expect(page.locator('.app-header__title > .review-status')).toHaveText('Uses live NLM data');
  });

  test('does not imply a cadence on pages that never declared one', async ({ page }) => {
    for (const path of ['/ddx/', '/documents/', '/clinical-assistant/']) {
      await page.goto(path);
      await expect(page.locator('.app-header__title > .review-status')).toHaveCount(0);
    }
  });

  test('uses amber only when a page is overdue', async ({ page }) => {
    await page.route('**/calculators/last_checked.json', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ date: '2020-01-01' }),
    }));
    await page.goto('/calculators/');
    const cadence = page.locator('.app-header__title > .review-status');
    await expect(cadence).toHaveClass(/stale/);
    await expect(cadence.locator('.review-status__dot')).toBeVisible();
    await expect(cadence).toHaveAttribute('title', /Last checked for updates/);
  });
});
