import { expect, test } from '@playwright/test';

test('clinical updates are rendered from the structured record', async ({ page }) => {
  const changelogResponse = await page.request.get('/clinical-changelog.json');
  const changelog = await changelogResponse.json();
  const updateCount = changelog.entries.length;
  await page.goto('/updates/');
  await expect(page.getByRole('heading', { name: 'Clinical updates', exact: true })).toBeVisible();
  const cards = page.locator('.update-card');
  await expect(cards).toHaveCount(updateCount);
  await expect(cards.first()).toContainText(changelog.entries[0].title);
  await expect(page.getByText('HCPCS Level II terminology search')).toBeVisible();
  await expect(page.getByText('Focused primary-care tools and safety controls')).toBeVisible();
  await expect(page.getByText('Clearer tool names and connected stewardship workflows')).toBeVisible();
  await expect(page.getByText('Clinical monitoring reliability')).toBeVisible();
  await expect(page.getByText('Clinical guidance and safety review')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Advanced Life Support', exact: true })).toHaveAttribute('href', '/als/');
  await expect(page.getByRole('link', { name: 'AHA 2025 Adult Advanced Life Support', exact: true }).first()).toHaveAttribute('href', /cpr\.heart\.org/);
  await page.getByLabel('Change type').selectOption('governance');
  await expect(page.locator('.update-card')).toHaveCount(
    changelog.entries.filter((entry: { type: string }) => entry.type === 'governance').length,
  );
  await expect(page).toHaveURL(/type=governance/);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.update-card')).toHaveCount(updateCount);
});

test('clinical updates remain usable on a phone in dark mode', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/updates/');
  await page.locator('[data-theme-select]').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('article').first()).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
