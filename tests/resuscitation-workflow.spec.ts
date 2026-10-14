import { test, expect } from '@playwright/test';

test.describe('ALS and PALS field workflows', () => {
  test('use complete mobile section scrollers and stable deep links', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/als/#stroke');
    await expect(page.getByRole('tab', { name: 'Stroke' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#content')).toHaveAttribute('data-section', 'stroke');
    await expect(page.locator('#tabNav [role="tab"]')).toHaveCount(8);
    await page.goto('/pals/#respiratory');
    await expect(page.getByRole('tab', { name: 'Respiratory' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tabNav [role="tab"]')).toHaveCount(8);
    await expect(page.locator('#tabNav')).toHaveCSS('overflow-x', 'auto');
    await page.goto('/pals/#medications');
    await expect.poll(async()=>{
      const box = await page.getByRole('tab', { name: 'Medications' }).boundingBox();
      return box ? box.x + box.width : 9999;
    }).toBeLessThanOrEqual(390);
  });

  test('presents algorithm priorities and compact reference detail', async ({ page }) => {
    await page.goto('/als/#vf-pvt');
    await expect(page.locator('.algorithm-overview')).toContainText('Defibrillate');
    await expect(page.locator('.algorithm-cycle')).toHaveCount(1);
    await expect(page.locator('.drug-detail').first()).not.toHaveAttribute('open', '');
    await expect(page.locator('.subsection-jumps')).toBeVisible();
    const firstLink = page.locator('.subsection-jumps a').first();
    const target = await firstLink.getAttribute('data-target');
    await firstLink.click();
    await expect(page).toHaveURL(new RegExp(`--${target}$`));
    await page.reload();
    await expect(page.locator(`#${target}`)).toBeVisible();
  });

  test('finds ALS medications across sections', async ({ page }) => {
    await page.goto('/als/');
    await page.locator('.med-finder').getByText('Medication finder').click();
    await page.getByLabel('Search medication or indication').fill('naloxone');
    const result = page.locator('#alsMedResults button').filter({ hasText: 'Naloxone' });
    await expect(result).toBeVisible();
    await result.click();
    await expect(page.locator('#content')).toHaveAttribute('data-section', 'opioid');
  });

  test('never estimates pediatric weight and calculates only after measured weight entry', async ({ page }) => {
    await page.goto('/pals/#medications');
    await expect(page.locator('.weight-context')).toContainText('No weight entered');
    await expect(page.locator('.calculated-dose')).toHaveCount(0);
    await page.getByRole('spinbutton', { name: 'Measured weight' }).fill('20');
    await page.getByRole('spinbutton', { name: 'Measured weight' }).press('Tab');
    await expect(page.locator('.weight-context')).toContainText('20 kg');
    const epi = page.locator('.med-card').filter({ hasText: 'Epinephrine (cardiac arrest)' });
    await expect(epi.locator('.calculated-dose')).toContainText('0.2 mg');
    await expect(epi.locator('.calculated-dose')).toContainText('2 mL');
    await expect(epi).toContainText('0.01 mg/kg');
    await expect(epi).toContainText('0.1 mg/mL');

    await page.getByRole('spinbutton', { name: 'Measured weight' }).fill('120');
    await page.getByRole('spinbutton', { name: 'Measured weight' }).press('Tab');
    const cappedEpi = page.locator('.med-card').filter({ hasText: 'Epinephrine (cardiac arrest)' });
    await expect(cappedEpi.locator('.calculated-dose')).toContainText('1 mg');
    await expect(cappedEpi.locator('.calculated-dose')).toContainText('10 mL');
    const adenosine = page.locator('.med-card').filter({ hasText: 'Adenosine' });
    await expect(adenosine.locator('.calculated-dose')).toContainText('6 mg first dose');
    await expect(adenosine.locator('.calculated-dose')).toContainText('12 mg second dose');
  });

  test('searches the responsive PALS medication cards', async ({ page }) => {
    await page.goto('/pals/#medications');
    await page.getByLabel('Search medication or indication').fill('adenosine');
    await expect(page.locator('.med-card:visible')).toHaveCount(1);
    await expect(page.locator('.med-card:visible')).toContainText('Adenosine');
  });

  for (const route of ['/als/', '/pals/']) {
    test(`${route} remains available after its offline cache is prepared`, async ({ page, context }) => {
      await page.goto(route);
      await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
      await page.reload();
      await context.setOffline(true);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('#content')).not.toBeEmpty();
      await expect(page.locator('#cacheStatus')).toContainText('Offline');
      await context.setOffline(false);
    });
  }
});
