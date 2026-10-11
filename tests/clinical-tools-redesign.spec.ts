import { test, expect } from '@playwright/test';

test.describe('Medication tool redesign', () => {
  test('preserves opioid MME while avoiding replacement-dose prescribing', async ({ page }) => {
    await page.goto('/opioids/');
    await page.locator('#fromDose').fill('10');

    await expect(page.locator('#currentMme')).toContainText('20.0');
    await expect(page.locator('#currentMme')).toContainText('MME / day');
    await expect(page.locator('#convResult')).toHaveCount(0);
    await expect(page.locator('#toDrug')).toHaveCount(0);
    await expect(page.getByText('Do not use MME to set a replacement opioid dose.')).toBeVisible();

    await page.locator('#fromDose').fill('50');
    await expect(page.locator('#currentMme')).toContainText('100.0');
    await expect(page.locator('#currentMme .mme-flag')).toContainText('high risk threshold');
  });

  test('preserves steroid equivalency and conversion without generating a prescription', async ({ page }) => {
    await page.goto('/steroids/');
    await page.locator('#fromDose').fill('10');

    await expect(page.locator('#currentEquiv')).toContainText('40.0');
    await expect(page.locator('#currentEquiv')).toContainText('10.0 mg/day prednisone-equivalent');
    await expect(page.locator('#convResult')).toContainText('40.00 mg/day total');
    await expect(page.locator('#taperResult')).toContainText('Supraphysiologic dose');
    await expect(page.locator('#taperResult')).toContainText('No patient-specific taper or prescription is generated');
    await expect(page.locator('#taperResult .taper-sched')).toHaveCount(0);
    await expect(page.locator('#copySigBtn')).toHaveCount(0);
  });

  for (const route of ['/opioids/', '/steroids/', '/peds/']) {
    test(`${route} uses the shared shell without phone or tablet overflow`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(route);

      await expect(page.locator('body')).toHaveClass(/clinical-app/);
      await expect(page.getByLabel('Color theme')).toBeVisible();
      await expect(page.locator('.app-footer')).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

      await page.setViewportSize({ width: 768, height: 1024 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }

  test('steroid conversion remains usable if shared.css is unavailable', async ({ page }) => {
    await page.route('**/shared.css', route => route.abort());
    await page.goto('/steroids/');
    await page.locator('#fromDose').fill('10');

    await expect(page.locator('#fromDrug')).toBeVisible();
    await expect(page.locator('#currentEquiv')).toContainText('40.0');
    await expect(page.locator('#taperResult')).toContainText('Supraphysiologic dose');
  });

  test('explicit dark theme persists across redesigned clinical tools', async ({ page }) => {
    await page.goto('/opioids/');
    await page.getByLabel('Color theme').selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.goto('/steroids/');
    await expect(page.getByLabel('Color theme')).toHaveValue('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('Pediatric reference redesign', () => {
  test('provides navigable section landmarks without changing dose output', async ({ page }) => {
    await page.goto('/peds/');

    await expect(page.getByRole('navigation', { name: 'Pediatric dosing sections' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Airway & Equipment' })).toHaveAttribute('id', 'airway');
    await expect(page.locator('.dose-card')).toHaveCount(37);

    await page.locator('#wtKg').fill('15');
    await page.getByRole('button', { name: 'Calculate doses' }).click();
    await expect(page.locator('#broseLabel')).toContainText('Blue');
    await expect(page.locator('.dose-card').filter({ hasText: 'Epinephrine (cardiac arrest)' }).locator('.dose-val')).toHaveText('0.15');
  });
});
