import { test, expect } from '@playwright/test';

const URL = '/readiness/';

test.describe('Active-Duty Visit Support', () => {
  test('starts without a readiness conclusion and explains the privacy boundary', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('#readiness-state')).toContainText('No conclusion');
    await expect(page.locator('#readiness-state')).toContainText('Unchecked fields are not interpreted as normal or absent');
    await expect(page.getByText('No identifiers, storage, or automatic disposition.')).toBeVisible();
  });

  test('surfaces selected duty-impact facts without assigning a disposition', async ({ page }) => {
    await page.goto(URL);
    await page.getByText('Sedation or impaired alertness', { exact: true }).click();
    await page.getByText('Safety-sensitive task performance', { exact: true }).click();
    await expect(page.locator('#readiness-state')).toContainText('Potential duty-impact factors documented');
    await expect(page.locator('#readiness-state')).toContainText('Selection does not determine disposition');
    await expect(page.locator('#finding-list')).toContainText('Sedation, somnolence, slowed reaction time, or impaired alertness');
    await expect(page.locator('#finding-list')).toContainText('Driving, machinery, weapons, or other safety-sensitive task performance requires review');
  });

  test('copies neutral documentation and omits patient identifiers', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(URL);
    await page.getByText('Medication or treatment change', { exact: true }).click();
    await page.locator('#plan').selectOption({ label: 'Review with the appropriate CMA or local PRAP process' });
    await page.locator('#followup').selectOption({ label: 'Within 1 week' });
    await page.locator('#copy-summary').click();
    await expect(page.locator('#copy-summary')).toHaveText('Copied');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('Medication or treatment started, stopped, or changed');
    expect(copied).toContain('does not determine PRAP qualification');
    expect(copied).not.toMatch(/name:|dod id|unit:|duty position:/i);
  });

  test('reset clears all selections and mobile layout has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(URL);
    await page.getByText('Sleep or fatigue effect', { exact: true }).click();
    await page.locator('#reset-workflow').click();
    await expect(page.locator('input[type="checkbox"]:checked')).toHaveCount(0);
    await expect(page.locator('#readiness-state')).toContainText('No conclusion');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });

  test('PHA companion deep-links, distinguishes unreviewed domains, and surfaces follow-up', async ({ page }) => {
    await page.goto(`${URL}?workflow=pha`);
    await expect(page.getByRole('tab', { name: 'PHA / IMR' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#pha-state')).toContainText('Review not started');
    await page.locator('select[data-summary-label="Vision"]').selectOption({ label: 'Follow-up needed' });
    await expect(page.locator('#pha-state')).toContainText('One or more readiness domains need follow-up');
    await expect(page.locator('#pha-finding-list')).toContainText('Vision: Follow-up needed');
    await expect(page.getByRole('link', { name: 'USPSTF Screener' })).toHaveAttribute('href', '/screener/');
  });

  test('sleep workflow prioritizes selected safety concerns without diagnosing', async ({ page }) => {
    await page.goto(`${URL}?workflow=sleep`);
    await page.getByText('Unintended sleep or near-miss', { exact: true }).click();
    await expect(page.locator('#sleep-state')).toContainText('Prompt safety review');
    await expect(page.locator('#sleep-state')).toContainText('appropriate urgent, emergency, behavioral-health, and duty-safety pathways');
    await expect(page.locator('#sleep-finding-list')).toContainText('Unintended sleep or near-miss while driving');
    await expect(page.getByText('This summary does not diagnose insomnia, OSA')).toBeVisible();
  });

  test('functional helper copies limitation-focused language without a profile determination', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`${URL}?workflow=function`);
    await page.getByText('Lifting, carrying, pushing, or pulling', { exact: true }).click();
    await page.getByLabel('Anticipated duration').selectOption({ label: '8–30 days' });
    await page.getByLabel('Reassessment timing').selectOption({ label: 'Within 1–2 weeks' });
    await page.locator('#function-copy-summary').click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('Lifting, carrying, pushing, pulling, or repetitive load is limited');
    expect(copied).toContain('Anticipated duration: 8–30 days');
    expect(copied).toContain('does not create an AF Form 469');
    expect(copied).not.toMatch(/fit for duty|cleared for duty/i);
  });

  test('workflow tabs support keyboard navigation and stable URL state', async ({ page }) => {
    await page.goto(URL);
    const visit = page.getByRole('tab', { name: 'Visit support' });
    await visit.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'PHA / IMR' })).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/workflow=pha/);
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: 'Functional limits' })).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/workflow=function/);
  });

  test('every added workflow remains usable on a phone in dark mode', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const workflow of ['pha', 'sleep', 'function']) {
      await page.goto(`${URL}?workflow=${workflow}`);
      await page.locator('[data-theme-select]').selectOption('dark');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await expect(page.locator(`[data-workflow-panel="${workflow}"]`)).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    }
  });
});
