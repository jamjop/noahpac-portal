import { test, expect } from '@playwright/test';

test.describe('Calculation and conversion workflows', () => {
  test('selected calculator is linkable and search feedback can be cleared', async ({ page }) => {
    await page.goto('/calculators/?calc=heart');
    await expect(page.getByRole('tab', { name: 'HEART Score' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.calc-title')).toHaveText('HEART Score');
    await page.getByLabel('Find a calculator').fill('renal');
    await expect(page.locator('#calcFilterSummary')).toContainText('calculator');
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(page.getByLabel('Find a calculator')).toHaveValue('');
    await expect(page.getByRole('tab')).toHaveCount(24);
  });

  test('mobile calculator chooser expands, filters, selects, and collapses', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/calculators/?calc=heart');

    const chooser = page.locator('#calcChooserToggle');
    await expect(chooser).toHaveAttribute('aria-expanded', 'false');
    await chooser.click();
    await expect(chooser).toHaveAttribute('aria-expanded', 'true');

    await page.getByLabel('Find a calculator').fill('renal');
    await expect(page.locator('.tab-btn:visible')).toHaveCount(2);
    await page.getByRole('tab', { name: 'Creatinine Clearance' }).click();

    await expect(chooser).toContainText('Creatinine Clearance');
    await expect(chooser).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.calc-title')).toHaveText('Creatinine Clearance');
  });

  test('opioid summary exposes the regimen math, copies, and resets safely', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/opioids/');
    await page.locator('#fromDrug').selectOption('oxycodone');
    await page.locator('#fromDose').fill('10');
    await expect(page.locator('#currentMme')).toContainText('Oxycodone 10 mg × 2/day · factor 1.5');
    await page.getByRole('button', { name: 'Copy summary' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('30.0');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#fromDrug')).toHaveValue('morphine');
    await expect(page.locator('#fromDose')).toHaveValue('');
  });

  test('steroid summary exposes current daily regimen, copies, and resets', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/steroids/');
    await page.locator('#fromDose').fill('10');
    await expect(page.locator('#currentEquiv')).toContainText('Prednisone 10 mg × 1/day = 10.00 mg/day');
    await page.getByRole('button', { name: 'Copy summary' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('40.0');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#fromDose')).toHaveValue('');
    await expect(page.locator('#toDrug')).toHaveValue('hydrocortisone');
  });

  test('conversion reference tables become readable cards without phone overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of ['/opioids/', '/steroids/']) {
      await page.goto(path);
      const firstDataRow = page.locator('#refTable tr').nth(1);
      await expect(firstDataRow).toBeVisible();
      await expect(firstDataRow.locator('td').first()).toHaveAttribute('data-label');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), path).toBeLessThanOrEqual(1);
    }
  });
});
