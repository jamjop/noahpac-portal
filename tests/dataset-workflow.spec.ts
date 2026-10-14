import { test, expect } from '@playwright/test';

test.describe('Large clinical dataset workflows', () => {
  test('laboratory filters, compact details, and shareable state work', async ({ page }) => {
    await page.goto('/labs/');
    await page.getByLabel('Search laboratory reference').fill('troponin');
    await expect(page.locator('#labResultSummary')).toContainText('test');
    await expect(page).toHaveURL(/q=troponin/);
    const first = page.locator('[data-lab-card]').first();
    await expect(first).toContainText(/Troponin/i);
    await page.setViewportSize({ width: 390, height: 844 });
    await first.getByRole('button', { name: 'Details' }).click();
    await expect(first.locator('.td-note')).toBeVisible();
    await expect(page).toHaveURL(/lab=/);
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.getByLabel('Search laboratory reference')).toHaveValue('');
  });

  test('reportable conditions expose jurisdiction, filters, and instructions', async ({ page }) => {
    await page.goto('/reportable/');
    await expect(page.getByText('North Dakota', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Immediate' }).click();
    await expect(page).toHaveURL(/timing=Immediate/);
    await page.getByLabel('Search reportable conditions').fill('anthrax');
    const item = page.locator('.cond-item', { hasText: 'Anthrax' });
    await expect(item).toBeVisible();
    await item.getByRole('button', { name: 'Instructions' }).click();
    await expect(item.locator('.cond-note')).toBeVisible();
    await expect(page).toHaveURL(/condition=anthrax/);
  });

  test('pediatric results retain measured weight while filtering cards', async ({ page }) => {
    await page.goto('/peds/');
    await page.fill('#wtKg', '15');
    await page.click('#calcBtn');
    await expect(page.locator('#broseWeight')).toHaveText('15 kg');
    await page.getByLabel('Search pediatric dosing results').fill('ceftriaxone');
    await expect(page.locator('.dose-card:visible')).toHaveCount(1);
    await expect(page.locator('.dose-card:visible')).toContainText('Ceftriaxone');
    await expect(page.locator('#doseResultSummary')).toHaveText('1 matching result');
    await expect(page.locator('#dose-ceftriaxone')).toBeVisible();
  });

  test('all three workflows avoid phone overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of ['/labs/', '/reportable/', '/peds/']) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), path).toBeLessThanOrEqual(1);
    }
  });
});
