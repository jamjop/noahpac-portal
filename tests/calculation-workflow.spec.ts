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
    await expect(page.getByRole('tab')).toHaveCount(34);
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

  test('height converter synchronizes inches, feet and inches, and centimeters', async ({ page }) => {
    await page.goto('/calculators/?calc=height');
    await expect(page.getByRole('tab', { name: 'Height Converter' })).toHaveAttribute('aria-selected', 'true');

    await page.getByLabel('Height in inches').fill('71');
    await expect(page.getByLabel('Feet', { exact: true })).toHaveValue('5');
    await expect(page.getByLabel('Inches', { exact: true })).toHaveValue('11');
    await expect(page.getByLabel('Height in centimeters')).toHaveValue('180.34');
    await expect(page.locator('#height-result')).toContainText('5′ 11″');

    await page.getByLabel('Height in centimeters').fill('170');
    await expect(page.getByLabel('Height in inches')).toHaveValue('66.93');
    await expect(page.getByLabel('Feet', { exact: true })).toHaveValue('5');
    await expect(page.getByLabel('Inches', { exact: true })).toHaveValue('6.93');

    await page.getByLabel('Feet', { exact: true }).fill('6');
    await page.getByLabel('Inches', { exact: true }).fill('2');
    await expect(page.getByLabel('Height in inches')).toHaveValue('74');
    await expect(page.getByLabel('Height in centimeters')).toHaveValue('187.96');
    await expect(page.locator('#height-result')).toContainText('6′ 2″');
  });

  test('outpatient calculator expansion preserves published equations and criteria', async ({ page }) => {
    await page.goto('/calculators/?calc=anthropometrics');
    await expect(page.locator('#anthropometrics-result')).toContainText('24.2 kg/m²');
    await expect(page.locator('#anthropometrics-result')).toContainText('1.82 m²');

    await page.goto('/calculators/?calc=smoking');
    await expect(page.locator('#smoking-result')).toContainText('20.0 pack-years');
    await expect(page.locator('#smoking-result')).toContainText('Meets USPSTF history criteria');

    await page.goto('/calculators/?calc=a1c-eag');
    await expect(page.getByLabel('Estimated average glucose', { exact: true }).first()).toHaveValue('154.2');
    await expect(page.locator('#a1c-eag-result')).toContainText('154 mg/dL');

    await page.goto('/calculators/?calc=bp-average');
    await expect(page.locator('#bp-average-result')).toContainText('119/77 mm Hg');
    await expect(page.locator('#bp-average-result')).toContainText('Normal');

    await page.goto('/calculators/?calc=prevent');
    await page.getByLabel('Age').fill('50');
    await page.getByLabel('Total cholesterol').fill('240');
    await page.getByLabel('HDL cholesterol').fill('55');
    await page.getByLabel('Systolic BP').fill('160');
    await page.getByLabel('Taking antihypertensive medication').check();
    await expect(page.locator('#prevent-result')).toContainText('5.4%');
    await expect(page.locator('#prevent-result')).toContainText('3.6%');

    await page.goto('/calculators/?calc=orthostatic');
    await expect(page.locator('#orthostatic-result')).toContainText('20/10 mm Hg drop');
    await expect(page.locator('#orthostatic-result')).toContainText('Meets orthostatic BP-drop threshold');
  });

  test('anthropometrics and weight change support metric and imperial workflows', async ({ page }) => {
    await page.goto('/calculators/?calc=anthropometrics');
    await page.locator('.unit-switch label', { hasText: 'Imperial' }).click();
    await expect(page.locator('#anthro-height-ft')).toHaveValue('5');
    await expect(page.locator('#anthro-height-in')).toHaveValue('6.93');
    await expect(page.locator('#anthro-weight-lb')).toHaveValue('154.32');
    await expect(page.locator('#anthropometrics-result')).toContainText('24.2 kg/m²');

    await page.goto('/calculators/?calc=weight-change');
    await page.locator('#wt-base').fill('100');
    await page.locator('#wt-curr').fill('90');
    await page.locator('#wt-height').fill('170');
    await expect(page.locator('#weight-change-result')).toContainText('−10.0%');
    await expect(page.locator('#weight-change-result')).toContainText('Baseline BMI 34.6 kg/m²');
    await expect(page.locator('#weight-change-result')).toContainText('Current BMI 31.1 kg/m²');
    await page.locator('.unit-switch label', { hasText: 'Imperial' }).click();
    await expect(page.locator('#weight-change-result')).toContainText('220.5 lb');
    await expect(page.locator('#weight-change-result')).toContainText('198.4 lb');
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
