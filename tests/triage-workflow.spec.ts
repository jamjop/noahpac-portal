import { test, expect } from '@playwright/test';

const URL = '/triage/';

async function enterReassuringVitals(page: import('@playwright/test').Page) {
  await page.locator('#rr').fill('16');
  await page.locator('#spo2').fill('98');
  await page.locator('#sbp').fill('122');
  await page.locator('#hr').fill('72');
  await page.locator('#temp').fill('37');
  await page.locator('#mental').selectOption('alert');
}

test.describe('Adult Urgency & Disposition workflow', () => {
  test('starts incomplete and never treats blank fields as normal', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('#urgency-state')).toContainText('Assessment incomplete');
    await expect(page.locator('#urgency-state')).toContainText('Lower urgency cannot be supported yet');
  });

  test('an immediate threat overrides the remainder of the assessment', async ({ page }) => {
    await page.goto(URL);
    await page.locator('[data-label^="Threatened airway"]').check();
    await expect(page.locator('#urgency-state')).toContainText('Emergency response');
    await expect(page.locator('#urgency-state')).toContainText('ED evaluation now');
  });

  test('a marked vital sign or risk modifier produces same-day escalation', async ({ page }) => {
    await page.goto(URL);
    await page.locator('#spo2').fill('90');
    await expect(page.locator('#urgency-state')).toContainText('Same-day escalation');
    await expect(page.locator('#vital-note')).toContainText('SpO₂ 90 %');

    await page.locator('#reset-assessment').click();
    await page.locator('[data-label^="Immunocompromised"]').check();
    await expect(page.locator('#urgency-state')).toContainText('Same-day escalation');
  });

  test('only displays a lower-acuity pathway after complete vitals and every safeguard', async ({ page }) => {
    await page.goto(URL);
    await enterReassuringVitals(page);
    await expect(page.locator('#urgency-state')).toContainText('Assessment incomplete');

    for (const checkbox of await page.locator('.safeguard').all()) await checkbox.check();
    await expect(page.locator('#urgency-state')).toContainText('Lower-acuity pathway');
    await expect(page.locator('#urgency-state')).toContainText('does not establish that home care is safe');

    await page.locator('#rr').fill('');
    await expect(page.locator('#urgency-state')).toContainText('Assessment incomplete');
  });

  test('copies a documentation summary containing guidance, findings, and vital signs', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(URL);
    await page.locator('[data-label^="Possible ACS"]').check();
    await page.locator('#copy-summary').click();
    await expect(page.locator('#copy-summary')).toHaveText('Copied');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('Emergency response');
    expect(copied).toContain('Possible ACS');
    expect(copied).toContain('Respiratory rate: not entered');
  });

  test('has no horizontal overflow at a narrow mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(URL);
    const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
    const spacing = await page.evaluate(() => {
      const guidance = document.querySelector('#urgency-state')!.getBoundingClientRect();
      const copy = document.querySelector('#copy-summary')!.getBoundingClientRect();
      return copy.top - guidance.bottom;
    });
    expect(spacing).toBeGreaterThanOrEqual(16);
  });
});
