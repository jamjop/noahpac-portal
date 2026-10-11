import { expect, test } from '@playwright/test';

const STEWARDSHIP_PAGES = [
  ['/abx/', 'Guideline regimens'],
  ['/empiric/', 'Empiric + susceptibility'],
  ['/antibiogram/', 'Local antibiograms'],
  ['/allergy/', 'Allergy cross-reactivity'],
] as const;

test('live-data tools use names that accurately describe their scope', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /FDA Label Search/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Code & Terminology Lookup/ })).toBeVisible();

  await page.goto('/drugref/');
  await expect(page.getByRole('heading', { name: 'FDA Label Search', level: 1 })).toBeVisible();
  await expect(page.getByText(/Not a prescribing reference/)).toBeVisible();

  await page.goto('/lookup/');
  await expect(page.getByRole('heading', { name: 'Code & Terminology Lookup', level: 1 })).toBeVisible();
  await expect(page.getByText(/ICD-10-CM, RxTerms, and LOINC/)).toBeVisible();
});

test('antimicrobial tools expose one consistent family navigator', async ({ page }) => {
  for (const [path, currentLabel] of STEWARDSHIP_PAGES) {
    await page.goto(path);
    const nav = page.getByRole('navigation', { name: 'Antimicrobial stewardship tools' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link')).toHaveCount(4);
    await expect(nav.getByRole('link', { name: currentLabel, exact: true })).toHaveAttribute('aria-current', 'page');
  }
});

test('the stewardship family rail remains usable on a phone in dark mode', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/abx/');
  await page.getByLabel('Color theme').selectOption('dark');

  for (const [path] of STEWARDSHIP_PAGES) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('navigation', { name: 'Antimicrobial stewardship tools' })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} document overflow`).toBeLessThanOrEqual(1);
  }
});
