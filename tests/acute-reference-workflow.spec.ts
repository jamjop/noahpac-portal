import { test, expect } from '@playwright/test';

const PAGES = [
  { route: '/anticoag/', title: 'Anticoagulation Reversal', query: 'dabigatran', result: 'Dabigatran (Pradaxa)' },
  { route: '/toxicology/', title: 'Toxicology / Antidote Reference', query: 'digoxin', result: 'Digoxin' },
  { route: '/naloxone/', title: 'Naloxone Reference', query: 'intravenous', result: 'Intravenous (IV)' },
];

test.describe('Acute reference workflows', () => {
  test('preserves urgent guidance and exposes section navigation before compact detail', async ({ page }) => {
    await page.goto('/anticoag/');
    await expect(page.locator('.alert-urgent')).toContainText('Do not wait for labs');
    await expect(page.locator('.sev-row.sev-urgent')).toContainText('4F-PCC');
    await expect(page.locator('.acute-section-nav a')).toHaveCount(4);
    const warfarin = page.locator('details.dose-card').filter({ hasText: 'Warfarin' });
    await expect(warfarin).not.toHaveAttribute('open', '');
    await expect(warfarin.locator('summary')).toContainText('4F-PCC + Vitamin K 10 mg IV');
  });

  for (const item of PAGES) {
    test(`${item.title} searches compact quick-reference cards`, async ({ page }) => {
      await page.goto(item.route);
      const cards = page.locator('details.dose-card');
      const total = await cards.count();
      expect(total).toBeGreaterThan(0);
      await page.getByLabel('Find an agent, route, or antidote').fill(item.query);
      await expect(page.locator('details.dose-card:visible')).toHaveCount(1);
      await expect(page.locator('details.dose-card:visible')).toContainText(item.result);
      await expect(page.locator('details.dose-card:visible')).toHaveAttribute('open', '');
      await page.getByRole('button', { name: 'Clear' }).click();
      await expect(page.locator('details.dose-card:visible')).toHaveCount(total);
    });
  }

  test('supports stable item links and opens the requested detail', async ({ page }) => {
    await page.goto('/toxicology/#toxicology-antidote-item-methanol-ethylene-glycol');
    const card = page.locator('#toxicology-antidote-item-methanol-ethylene-glycol');
    await expect(card).toHaveAttribute('open', '');
    await expect(card).toContainText('Fomepizole 15 mg/kg IV load');
    await card.locator('summary').click();
    await card.locator('summary').click();
    await expect(page).toHaveURL(/#toxicology-antidote-item-methanol-ethylene-glycol$/);
  });

  test('mobile layouts use a touch-friendly scroller without document overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const item of PAGES) {
      await page.goto(item.route);
      await expect(page.locator('.acute-section-nav')).toHaveCSS('overflow-x', 'auto');
      const navLink = page.locator('.acute-section-nav a').first();
      expect(await navLink.evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(42);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${item.route} document overflow`).toBeLessThanOrEqual(1);
    }
  });

  test('dark mode preserves the shared shell and clinical warnings', async ({ page }) => {
    await page.goto('/toxicology/');
    await page.getByLabel('Color theme').selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('.alert-urgent')).toBeVisible();
    await expect(page.locator('.acute-tools')).toBeVisible();
  });
});
