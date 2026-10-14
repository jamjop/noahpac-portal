import { test, expect } from '@playwright/test';

test.describe('Screening guidance workflow', () => {
  test('renders guidance immediately with a clear profile and hierarchy', async ({ page }) => {
    await page.goto('/screener/');
    await expect(page.getByRole('heading', { name: 'Applicable screening guidance' })).toBeVisible();
    await expect(page.locator('.rec').first()).toBeVisible();
    await expect(page.locator('#profileSummary')).toContainText('50-year-old female');
    await expect(page.getByRole('heading', { name: /Recommended · Grades A\/B/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy guidance' })).toBeVisible();
  });

  test('groups optional risks and updates profile and recommendations', async ({ page }) => {
    await page.goto('/screener/');
    await page.getByText('Additional risk factors', { exact: true }).click();
    await page.getByLabel('Overweight or obesity (BMI ≥25)').check();
    await expect(page.locator('#selectedCount')).toHaveText('1 selected');
    await expect(page.locator('#profileSummary')).toContainText('BMI ≥25');
    await expect(page.getByText('Prediabetes & type 2 diabetes', { exact: true })).toBeVisible();
  });

  test('supports inline conditional-risk actions and expanded clinical detail', async ({ page }) => {
    await page.goto('/screener/');
    const conditional = page.locator('.rec').filter({ hasText: 'Prediabetes & type 2 diabetes' });
    await conditional.locator('summary').click();
    await conditional.getByRole('button', { name: 'Mark as BMI ≥25' }).click();
    await expect(page.getByLabel('Overweight or obesity (BMI ≥25)')).toBeChecked();
    const recommended = page.locator('.rec').filter({ hasText: 'Prediabetes & type 2 diabetes' });
    await recommended.locator('summary').click();
    await expect(recommended.locator('.rec-detail')).toBeVisible();
  });

  test('keeps sex controls accessible and hides inapplicable reproductive inputs', async ({ page }) => {
    await page.goto('/screener/');
    const female = page.getByRole('button', { name: /Female/ });
    const male = page.getByRole('button', { name: /Male/ });
    await expect(female).toHaveAttribute('aria-pressed', 'true');
    await male.click();
    await expect(male).toHaveAttribute('aria-pressed', 'true');
    await page.getByText('Additional risk factors', { exact: true }).click();
    await expect(page.getByText('Pregnancy & reproductive status')).toBeHidden();
  });

  test('fits a phone viewport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/screener/');
    await expect(page.locator('.profile-summary')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
