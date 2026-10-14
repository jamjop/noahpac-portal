import { test, expect } from '@playwright/test';

test.describe('STI Guide task-oriented UI', () => {
  test('starts with searchable compact treatment cards', async ({ page }) => {
    await page.goto('/sti-guide/');

    await expect(page.getByRole('tab', { name: 'STI treatment' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: 'STI treatment' })).toBeVisible();
    await expect(page.getByRole('tabpanel', { name: /HIV prevention/ })).toBeHidden();
    await expect(page.locator('#result-count')).toHaveText('25 regimens');
    await expect(page.locator('.guide-card')).toHaveCount(25);
    await expect(page.locator('.card-toggle').first()).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.card-body').first()).toBeHidden();
    await expect(page.locator('.card-summary').first()).toBeVisible();
  });

  test('searches, expands matches, clears filters, and keeps URL state shareable', async ({ page }) => {
    await page.goto('/sti-guide/');
    const search = page.getByLabel('Diagnosis, medication, or population');
    await search.fill('ceftriaxone');

    await expect(page.locator('#result-count')).not.toHaveText('25 regimens');
    await expect(page.locator('.guide-card').first()).toContainText('Ceftriaxone');
    await expect(page.locator('.card-toggle').first()).toHaveAttribute('aria-expanded', 'true');
    await expect(page).toHaveURL(/q=ceftriaxone/);

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(search).toHaveValue('');
    await expect(page.locator('#result-count')).toHaveText('25 regimens');
    await expect(page).not.toHaveURL(/q=/);
  });

  test('supports grouped category filtering and deep-linked cards', async ({ page }) => {
    await page.goto('/sti-guide/?cat=Vaginitis');
    await expect(page.locator('#active-filter-summary')).toContainText('Vaginitis');
    await expect(page.locator('.guide-card')).toHaveCount(4);

    await page.goto('/sti-guide/?open=gonorrhea-uncomplicated-urogenital-rectal-or-pharyngeal');
    const gonorrhea = page.locator('#gonorrhea-uncomplicated-urogenital-rectal-or-pharyngeal');
    await expect(gonorrhea.locator('.card-toggle')).toHaveAttribute('aria-expanded', 'true');
    await expect(gonorrhea.locator('.card-body')).toBeVisible();
    await expect(gonorrhea.getByRole('button', { name: /Copy Gonorrhea.*regimen/i })).toBeVisible();
  });

  test('switches to PrEP/PEP with keyboard-operable tabs', async ({ page }) => {
    await page.goto('/sti-guide/');
    const treatment = page.getByRole('tab', { name: 'STI treatment' });
    await treatment.focus();
    await treatment.press('ArrowRight');

    const hiv = page.getByRole('tab', { name: /HIV prevention/ });
    await expect(hiv).toBeFocused();
    await expect(hiv).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#hiv-panel')).toBeVisible();
    await expect(page).toHaveURL(/mode=hiv/);
  });

  test('uses the mobile select and avoids horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/sti-guide/');

    await expect(page.locator('#category-rail')).toBeHidden();
    await expect(page.getByLabel('Filter by category')).toBeVisible();
    await page.getByLabel('Filter by category').selectOption('Syphilis');
    await expect(page.locator('#active-filter-summary')).toContainText('Syphilis');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  });

  test('labels later source updates and clinically important warnings', async ({ page }) => {
    await page.goto('/sti-guide/?q=Bicillin');
    const card = page.locator('.guide-card').first();
    await expect(card.locator('.card-badge.source')).toHaveText('CDC update 2026');
    await expect(card.locator('.guide-notes')).toHaveClass(/warning/);

    await page.goto('/sti-guide/?q=Doxy-PEP');
    await expect(page.locator('.card-badge.source')).toHaveText('CDC 2024');
    await expect(page.getByRole('button', { name: 'Print results' })).toBeVisible();
  });

  test('prints the filtered treatment set with full regimen details', async ({ page }) => {
    await page.goto('/sti-guide/?cat=Syphilis');
    await expect(page.locator('.card-body').first()).toBeHidden();
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.card-body').first()).toBeVisible();
    await expect(page.locator('.guide-controls')).toBeHidden();
  });
});
