import { test, expect } from '@playwright/test';

test.describe('Review cadence labels', () => {
  test('shows the recovered quarterly cadence with compact mobile copy', async ({ page }) => {
    await page.goto('/calculators/');
    const cadence = page.locator('.app-header__eyebrow .review-status');
    await expect(cadence).toBeVisible();
    await expect(cadence.locator('.review-status__full')).toHaveText('Quarterly review');

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(cadence.locator('.review-status__full')).toBeHidden();
    await expect(cadence.locator('.review-status__compact')).toHaveText('Quarterly');
  });

  test('distinguishes weekly updates and live data sources', async ({ page }) => {
    await page.goto('/screener/');
    await expect(page.locator('.review-status__full')).toHaveText('Weekly update');

    await page.goto('/drugref/');
    await expect(page.locator('.review-status__full')).toHaveText('Live FDA data');

    await page.goto('/lookup/');
    await expect(page.locator('.review-status__full')).toHaveText('Live NLM data');
  });

  test('does not imply a cadence on pages that never declared one', async ({ page }) => {
    for (const path of ['/ddx/', '/documents/', '/clinical-assistant/']) {
      await page.goto(path);
      await expect(page.locator('.app-header__eyebrow .review-status')).toHaveCount(0);
    }
  });

  test('uses amber only when a page is overdue', async ({ page }) => {
    await page.route('**/calculators/last_checked.json', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ date: '2020-01-01' }),
    }));
    await page.goto('/calculators/');
    const cadence = page.locator('.app-header__eyebrow .review-status');
    await expect(cadence).toHaveClass(/stale/);
    await expect(cadence).toHaveAttribute('title', /Last checked for updates/);
  });
});
