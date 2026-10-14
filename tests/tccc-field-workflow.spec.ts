import { test, expect } from '@playwright/test';

test.describe('TCCC field workflow', () => {
  test('groups navigation and presents immediate priorities before detail', async ({ page }) => {
    await page.goto('/tccc/#hemorrhage');
    await expect(page.locator('.nav-group-label')).toHaveText(['MARCH', 'PAWS', 'Reference']);
    await expect(page.locator('.scope-badge')).toContainText('All responders');
    await expect(page.locator('.section-overview')).toContainText('Tourniquet');
    await expect(page.getByRole('heading', { name: 'Care Under Fire (CUF)' })).toBeVisible();
    await expect(page.locator('#sub-wound-packing-technique')).not.toHaveAttribute('open', '');
  });

  test('supports stable section and subsection deep links', async ({ page }) => {
    await page.goto('/tccc/#antibiotics');
    await expect(page.locator('#content')).toHaveAttribute('data-section', 'ABX');
    await expect(page.locator('#sectionSelect')).toHaveValue('ABX');
    await page.goto('/tccc/#hemorrhage--sub-wound-packing-technique');
    await expect(page.locator('#sub-wound-packing-technique')).toHaveAttribute('open', '');
  });

  test('mobile section selector exposes every MARCH PAWS and reference section', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tccc/');
    await expect(page.locator('#sectionSelect option')).toHaveCount(10);
    await page.locator('#sectionSelect').selectOption('R');
    await expect(page.locator('#content')).toHaveAttribute('data-section', 'R');
    await expect(page).toHaveURL(/#respiration$/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('searches and filters compact medication cards', async ({ page }) => {
    await page.goto('/tccc/#drugs');
    await expect(page.locator('.drug-card')).toHaveCount(7);
    await page.getByLabel('Search medication or indication').fill('seizure');
    await expect(page.locator('.drug-card:visible')).toHaveCount(1);
    await expect(page.locator('#drug-midazolam')).toBeVisible();
    await expect(page.locator('#drug-midazolam')).toHaveAttribute('open', '');
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await page.getByRole('button', { name: 'Antibiotics', exact: true }).click();
    await expect(page.locator('.drug-card:visible')).toHaveCount(2);
  });

  test('opens individual drug deep links and reports offline-cache state', async ({ page }) => {
    await page.goto('/tccc/#drug-ketamine');
    await expect(page.locator('#content')).toHaveAttribute('data-section', 'DRUGS');
    await expect(page.locator('#drug-ketamine')).toHaveAttribute('open', '');
    await expect(page.locator('#cacheStatus')).not.toBeEmpty();
  });

  test('remains available after the offline cache is prepared', async ({ page, context }) => {
    await page.goto('/tccc/#airway');
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    await page.reload();
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'TCCC / MARCH PAWS' })).toBeVisible();
    await expect(page.locator('#content')).toHaveAttribute('data-section', 'A1');
    await expect(page.locator('#cacheStatus')).toContainText('Offline');
    await context.setOffline(false);
  });
});
