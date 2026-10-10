import { test, expect } from '@playwright/test';

test.describe('Calculator proof of concept', () => {
  test('keeps all calculators available and preserves a known calculation', async ({ page }) => {
    await page.goto('/calculators/');

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(20);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');

    await page.getByRole('tab', { name: 'Creatinine Clearance' }).click();
    await expect(page.locator('#crcl-result')).toContainText('83 mL/min');
    await expect(page.locator('#crcl-result')).toContainText('G2 — Mildly decreased');
    await expect(page.locator('#crcl-result')).toHaveAttribute('role', 'status');
  });

  test('filters calculator navigation without changing calculations', async ({ page }) => {
    await page.goto('/calculators/');
    await page.getByLabel('Find a calculator').fill('heart');

    const visibleTabs = page.locator('.tab-btn:visible');
    await expect(visibleTabs).toHaveCount(1);
    await expect(visibleTabs).toHaveText('HEART Score');
  });

  test('renders every calculator without a client-side exception', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/calculators/');

    const tabs = page.getByRole('tab');
    for (let index = 0; index < await tabs.count(); index++) {
      await tabs.nth(index).click();
      await expect(page.locator('.calc-title')).toBeVisible();
      await expect(page.locator('.result-panel')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('supports an explicit persistent dark theme', async ({ page }) => {
    await page.goto('/calculators/');
    await page.getByLabel('Color theme').selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(page.getByLabel('Color theme')).toHaveValue('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('Sepsis proof of concept', () => {
  test('preserves qSOFA, SOFA, and shock scoring', async ({ page }) => {
    await page.goto('/sepsis/');

    await page.check('#q-rr');
    await page.check('#q-ams');
    await expect(page.locator('#qsofa-badge')).toHaveText('2 / 3');
    await expect(page.locator('#qsofa-result')).toContainText('qSOFA positive');
    await expect(page.locator('#summary-qsofa-status')).toHaveText('Positive — evaluate further');

    await page.locator('#seg-resp [data-val="2"]').click();
    await expect(page.locator('#sofa-badge')).toHaveText('2');
    await expect(page.locator('#sofa-result')).toContainText('Organ dysfunction');
    await expect(page.locator('#seg-resp [data-val="2"]')).toHaveAttribute('aria-checked', 'true');

    await page.check('#sh-vaso');
    await page.check('#sh-lac');
    await expect(page.locator('#shock-result')).toContainText('Septic shock criteria met');
    await expect(page.locator('#summary-shock')).toHaveClass(/is-critical/);
  });

  test('supports arrow-key selection in SOFA radio groups', async ({ page }) => {
    await page.goto('/sepsis/');
    const first = page.locator('#seg-plt button').first();
    await first.focus();
    await first.press('ArrowRight');
    await expect(page.locator('#seg-plt [data-val="1"]')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#sofa-badge')).toHaveText('1');
  });
});

for (const route of ['/calculators/', '/sepsis/']) {
  test(`${route} has no page-level horizontal overflow at 375px`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
