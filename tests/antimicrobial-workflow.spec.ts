import { test, expect } from '@playwright/test';

test.describe('Antimicrobial stewardship workflow refinement', () => {
  test('Antibiotic Reference restores linked conditions and reports filtered matches', async ({ page }) => {
    await page.goto('/abx/?condition=cap-outpatient');
    await expect(page).toHaveURL(/condition=cap-outpatient/);
    await expect(page.locator('.abx-title')).toBeVisible();
    await expect(page.locator('.cat-nav .tab-btn.active')).toHaveAttribute('aria-current', 'true');

    await page.getByLabel('Find a condition').fill('Lyme');
    await expect(page.locator('#abxResultCount')).toHaveText('1 condition');
    await expect(page.locator('.cat-nav .tab-btn')).toHaveCount(1);
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(page.locator('#abxResultCount')).toContainText('conditions');
  });

  test('Empiric Therapy preserves linked selection and renders mobile regimen cards', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/empiric/?site=uti&facility=trinity&organism=E.%20coli');
    await expect(page.locator('#site-sel')).toHaveValue('uti');
    await expect(page.locator('.org-btn.active')).toContainText('E. coli');
    await expect(page).toHaveURL(/site=uti/);
    await expect(page).toHaveURL(/organism=E(\.|%2E)(\+|%20)coli/);
    await expect(page.locator('.reg-tbl tbody tr').first()).toBeVisible();
    await expect(page.locator('.reg-tbl tbody tr').first()).toHaveCSS('display', 'block');
    await expect(page.getByRole('button', { name: 'Copy summary' })).toBeVisible();
  });

  test('Antibiogram preserves facility and gram state with keyboard-operable tabs', async ({ page }) => {
    await page.goto('/antibiogram/?facility=minot_afb&gram=negative');
    await expect(page.locator('#facility-select')).toHaveValue('minot_afb');
    const negative = page.getByRole('tab', { name: 'Gram-negative' });
    await expect(negative).toHaveAttribute('aria-selected', 'true');
    await negative.press('ArrowLeft');
    await expect(page.getByRole('tab', { name: 'Gram-positive' })).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/gram=positive/);
    await expect(page.locator('#result-summary')).toContainText(/organism/);
    const notes = await page.locator('.antibiogram-footer__notes').boundingBox();
    const meta = await page.locator('.antibiogram-app .app-footer__meta').boundingBox();
    expect(notes).not.toBeNull();
    expect(meta).not.toBeNull();
    expect((notes?.x || 0) + (notes?.width || 0)).toBeLessThanOrEqual((meta?.x || 0) + 1);
  });

  test('all three pages remain free of document overflow on phones and tablets', async ({ page }) => {
    for (const width of [375, 768]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['/abx/?condition=cap-outpatient', '/empiric/', '/antibiogram/']) {
        await page.goto(route);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${route} overflow at ${width}px`).toBeLessThanOrEqual(1);
      }
    }
  });
});
