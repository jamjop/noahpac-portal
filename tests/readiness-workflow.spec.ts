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
});
