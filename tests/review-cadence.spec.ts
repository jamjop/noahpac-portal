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

  // Not /calculators/: that page is under a clinical-review gate (REVIEW_REQUIRED_AFTER in assets/last-checked.js),
  // so any check dated before the gate, or without clinically_reviewed, shows "review pending" and can never be
  // merely overdue. Use a quarterly page that has no gate.
  test('uses amber only when a page is overdue', async ({ page }) => {
    await page.route('**/sepsis/last_checked.json', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ date: '2020-01-01' }),
    }));
    await page.goto('/sepsis/');
    const cadence = page.locator('.app-header__title > .review-status');
    await expect(cadence).toHaveClass(/stale/);
    await expect(cadence).not.toHaveClass(/needs-review/);
    await expect(cadence.locator('.review-status__dot')).toBeVisible();
    await expect(cadence).toHaveAttribute('title', /Last checked for updates/);
  });

  test('keeps a clinically gated page pending when its last check predates the review requirement, however old', async ({ page }) => {
    await page.route('**/calculators/last_checked.json', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ date: '2020-01-01' }),
    }));
    await page.goto('/calculators/');
    const cadence = page.locator('.app-header__title > .review-status');
    await expect(cadence).toHaveClass(/needs-review/);
    await expect(cadence).not.toHaveClass(/stale/);
    await expect(cadence).toContainText('Clinical update review pending');
  });

  test('keeps a clinically gated page pending until a clinical review is recorded', async ({ page }) => {
    await page.route('**/calculators/last_checked.json', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ date: '2026-10-15', status: 'no_change', review_pending: false }),
    }));
    await page.goto('/calculators/');
    await expect(page.locator('.app-header__title > .review-status')).toHaveClass(/needs-review/);
  });

  test('clears the clinical gate only when a review is recorded on or after the requirement date', async ({ page }) => {
    await page.route('**/calculators/last_checked.json', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ date: '2026-10-15', status: 'no_change', review_pending: false, clinically_reviewed: true }),
    }));
    await page.goto('/calculators/');
    const cadence = page.locator('.app-header__title > .review-status');
    await expect(cadence).not.toHaveClass(/needs-review/);
    await expect(cadence).toHaveText('References reviewed quarterly');
  });

  test('shows an explicit pending state when a source change awaits review', async ({ page }) => {
    await page.route('**/calculators/last_checked.json', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ date: '2026-10-10', status: 'changed' }),
    }));
    await page.goto('/calculators/');
    const cadence = page.locator('.app-header__title > .review-status');
    await expect(cadence).toHaveClass(/needs-review/);
    await expect(cadence).toContainText('Clinical update review pending');
    await expect(cadence).not.toHaveClass(/stale/);
  });

  test('shows a distinct error state when the automated check fails', async ({ page }) => {
    await page.route('**/calculators/last_checked.json', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ date: '2026-10-10', status: 'error' }),
    }));
    await page.goto('/calculators/');
    const cadence = page.locator('.app-header__title > .review-status');
    await expect(cadence).toHaveClass(/check-error/);
    await expect(cadence).toContainText('Update check needs attention');
  });
});
