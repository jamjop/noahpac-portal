import { test, expect } from '@playwright/test';

test.describe('Vaccine schedule guidance UI', () => {
  test('presents a verifiable patient profile and accessible guidance controls', async ({ page }) => {
    await page.goto('/vaccines/');

    await expect(page.getByRole('heading', { name: 'Vaccine Schedule Guidance', level: 1 })).toBeVisible();
    await expect(page.locator('#patientSummary')).toHaveText(/2-year-old female · ACIP · routine schedule · no special conditions/i);
    await expect(page.locator('#unitYr')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-source="acip"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#sourceContext')).toContainText('baseline schedule');
    await expect(page.locator('#catchupBtn')).toHaveAttribute('aria-pressed', 'false');

    await page.locator('[data-source="aap"]').click();
    await expect(page.locator('[data-source="aap"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-source="acip"]')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#patientSummary')).toContainText('AAP');
    await expect(page.locator('#sourceContext')).toContainText('COVID-19, influenza, and HPV');

    await page.locator('#catchupBtn').click();
    await expect(page.locator('#catchupBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#patientSummary')).toContainText('catch-up included');
  });

  test('applies source-specific AAP and ACOG recommendations', async ({ page }) => {
    await page.goto('/vaccines/');

    await page.locator('#age').fill('9');
    await page.locator('[data-source="aap"]').click();
    await expect(page.locator('.rec', { hasText: 'Human Papillomavirus' })).toContainText('AAP recommends initiating HPV vaccination at age 9');

    await page.locator('#age').fill('20');
    await page.locator('[data-source="acog"]').click();
    await expect(page.locator('#sourceContext')).toContainText('pregnancy-specific guidance');
    await page.getByText('Special conditions', { exact: true }).click();
    await page.locator('#f_pregnant').check();
    await expect(page.locator('.rec', { hasText: 'RSV Vaccine — Maternal' })).toBeVisible();
    await expect(page.locator('.rec', { hasText: 'Tdap / Td' })).toContainText('ideally at 27–32 weeks');
  });

  test('shows MenB as shared decision-making through age 23 for every source', async ({ page }) => {
    await page.goto('/vaccines/');
    await page.locator('#age').fill('20');

    for (const source of ['acip', 'aap', 'acog']) {
      await page.locator(`[data-source="${source}"]`).click();
      await expect(page.locator('.rec', { hasText: 'Meningococcal B' })).toContainText('Shared decision');
    }
  });

  test('summarizes selected conditions and explains recommendation categories', async ({ page }) => {
    await page.goto('/vaccines/');
    await expect(page.locator('.chip.shared')).toHaveText('Shared decision');
    await page.getByText('Special conditions', { exact: true }).click();
    await page.locator('#f_immunocompromised').check();

    await expect(page.locator('#flagCount')).toHaveText('1 selected');
    await expect(page.locator('#patientSummary')).toContainText('immunocompromised');
    await expect(page.locator('.rec-name').first()).toBeVisible();
    await expect(page.locator('.timing').first()).toContainText('Timing');
    await expect(page.locator('.rec-detail-label').first()).toHaveText('Clinical guidance');
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Print' })).toBeVisible();
  });

  test('keeps the source selector balanced and avoids horizontal overflow on phones', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/vaccines/');

    const sourceButtons = page.locator('#sourceSeg button');
    await expect(sourceButtons).toHaveCount(3);
    const tops = await sourceButtons.evaluateAll(buttons => buttons.map(button => Math.round(button.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflows).toBe(false);
  });

  test('prints a focused vaccine guidance summary instead of the interactive page', async ({ page }) => {
    await page.goto('/vaccines/');
    await page.locator('#age').fill('20');
    await page.locator('[data-sex="male"]').click();
    await page.locator('[data-source="aap"]').click();
    await page.getByText('Special conditions', { exact: true }).click();
    await page.locator('#f_hcw').check();
    await page.emulateMedia({ media: 'print' });

    await expect(page.locator('.print-report')).toBeVisible();
    await expect(page.locator('#printAge')).toHaveText('20 years');
    await expect(page.locator('#printSex')).toHaveText('Male');
    await expect(page.locator('#printSource')).toHaveText('AAP with ACIP base');
    await expect(page.locator('#printConditions')).toHaveText('healthcare worker');
    await expect(page.locator('.results')).toBeVisible();
    await expect(page.locator('.panel')).toBeHidden();
    await expect(page.locator('.result-toolbar')).toBeHidden();
    await expect(page.locator('.app-header')).toBeHidden();
    await expect(page.locator('.app-footer')).toBeHidden();
  });

  test('shows one resolved update state instead of a transient success state', async ({ page }) => {
    await page.route('**/vaccines/last_checked.json', route => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ date: '2026-07-15', status: 'error' }),
    }));
    await page.goto('/vaccines/');

    const status = page.locator('.app-header__title > .review-status');
    await expect(status).toHaveClass(/check-error/);
    await expect(status).not.toHaveClass(/is-pending/);
    await expect(status).toContainText('Update check needs attention');
    await expect(page.locator('footer .last-checked')).toContainText('Update check failed');
  });
});
