import { test, expect } from '@playwright/test';

test.describe('Clinical safety updates', () => {
  test('pediatric doses require measured weight and ETT sizing requires age', async ({ page }) => {
    await page.goto('/peds/');
    await page.locator('#ageNum').fill('5');
    await page.getByRole('button', { name: 'Calculate doses' }).click();
    await expect(page.locator('#content')).toContainText('measured weight');

    await page.locator('#wtKg').fill('18');
    await page.locator('#ageNum').fill('');
    await page.getByRole('button', { name: 'Calculate doses' }).click();
    await expect(page.locator('.dose-card', { hasText: 'ETT sizing' })).toContainText('not inferred from weight');
  });

  test('opioid tool calculates current MME but never proposes a replacement dose', async ({ page }) => {
    await page.goto('/opioids/');
    await page.locator('#fromDose').fill('10');
    await expect(page.locator('#currentMme')).toContainText('20.0');
    await expect(page.locator('#toDrug, #reduction, #convResult')).toHaveCount(0);
    await expect(page.getByText('Do not use MME to set a replacement opioid dose.')).toBeVisible();
  });

  test('steroid tool gives guideline context without a generated taper or SIG', async ({ page }) => {
    await page.goto('/steroids/');
    await page.locator('#fromDose').fill('20');
    await expect(page.locator('#taperResult')).toContainText('No patient-specific taper');
    await expect(page.locator('#copySigBtn, .taper-sched')).toHaveCount(0);
  });

  test('sepsis tool prioritizes SIRS over qSOFA-only screening', async ({ page }) => {
    await page.goto('/sepsis/');
    await expect(page.locator('#sirs')).toBeVisible();
    await expect(page.locator('#qsofa')).toContainText('Do not use qSOFA alone');
    await page.check('#s-temp');
    await page.check('#s-wbc');
    await expect(page.locator('#sirs-result')).toContainText('Screen positive');
  });

  test('vaccine tool distinguishes CDC shared decision-making from AAP routine infant guidance', async ({ page }) => {
    await page.goto('/vaccines/');
    await page.locator('#age').fill('1');
    await expect(page.locator('.rec', { hasText: 'COVID-19' })).toContainText('SCDM');
    await page.locator('[data-source="aap"]').click();
    await expect(page.locator('.rec', { hasText: 'COVID-19' })).toContainText('AAP universal recommendation');
  });

  test('ALS and PALS identify the current 2025 guideline family', async ({ page }) => {
    await page.goto('/als/');
    await expect(page.locator('.source-note')).toContainText('2025 American Heart Association');
    await page.goto('/pals/');
    await expect(page.locator('.source-note')).toContainText('2025 American Heart Association');
  });
});
