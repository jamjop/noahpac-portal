import { test, expect } from '@playwright/test';

const PROTOCOLS = [
  { path: '/als/', title: 'Advanced Life Support', tabs: 8 },
  { path: '/pals/', title: 'Pediatric Advanced Life Support', tabs: 8 },
  { path: '/tccc/', title: 'TCCC / MARCH PAWS', tabs: 10 },
];

test.describe('Emergency protocol redesign', () => {
  test('all protocol pages use the shared shell and semantic tab pattern', async ({ page }) => {
    for (const protocol of PROTOCOLS) {
      await page.goto(protocol.path);
      await expect(page.getByRole('heading', { name: protocol.title, level: 1 })).toBeVisible();
      await expect(page.locator('body')).toHaveClass(/protocol-app/);
      await expect(page.getByRole('tab')).toHaveCount(protocol.tabs);
      await expect(page.getByRole('tab').first()).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('#content')).toHaveAttribute('role', 'tabpanel');
      await expect(page.locator('#content')).toHaveAttribute('aria-labelledby', /protocol-tab-/);
      await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
      await expect(page.locator('footer.app-footer')).toBeVisible();

      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).not.toContain('user-scalable=no');
    }
  });

  test('tabs support arrow, Home, and End keys while updating the active panel', async ({ page }) => {
    for (const protocol of PROTOCOLS) {
      await page.goto(protocol.path);
      const tabs = page.getByRole('tab');
      await tabs.first().focus();
      await tabs.first().press('ArrowRight');
      await expect(tabs.nth(1)).toBeFocused();
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
      const secondId = await tabs.nth(1).getAttribute('data-id');
      await expect(page.locator('#content')).toHaveAttribute('data-section', secondId!);

      await tabs.nth(1).press('End');
      await expect(tabs.last()).toBeFocused();
      await expect(tabs.last()).toHaveAttribute('aria-selected', 'true');
      await tabs.last().press('Home');
      await expect(tabs.first()).toBeFocused();
      await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('representative ALS, PALS, and TCCC clinical content remains available', async ({ page }) => {
    await page.goto('/als/');
    await expect(page.getByText('CPR Quality Targets')).toBeVisible();
    await page.getByRole('tab', { name: 'Stroke' }).click();
    await expect(page.getByText('IV tPA Absolute Contraindications')).toBeVisible();
    await expect(page.getByText(/SBP <185/).first()).toBeVisible();

    await page.goto('/pals/');
    await expect(page.getByText('Key Differences from Adult ALS')).toBeVisible();
    await page.getByRole('tab', { name: 'Medications' }).click();
    await expect(page.locator('.protocol-table-wrap')).toBeVisible();
    await expect(page.locator('.drug-table')).toContainText('Epinephrine');
    await expect(page.locator('.drug-table')).toContainText('0.01 mg/kg');

    await page.goto('/tccc/');
    await expect(page.getByText('Tourniquet Conversion Timeline')).toBeVisible();
    await page.getByRole('tab', { name: '℞ Drugs' }).click();
    await expect(page.getByText('TXA — Tranexamic Acid')).toBeVisible();
    await expect(page.getByText(/NOT later than 3 h after injury/).first()).toBeVisible();
  });

  test('phone and tablet layouts avoid document overflow and retain local table scrolling', async ({ page }) => {
    for (const width of [375, 768]) {
      await page.setViewportSize({ width, height: 900 });
      for (const protocol of PROTOCOLS) {
        await page.goto(protocol.path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${protocol.path} overflow at ${width}px`).toBeLessThanOrEqual(1);
        const firstTabHeight = await page.getByRole('tab').first().evaluate(el => el.getBoundingClientRect().height);
        expect(firstTabHeight).toBeGreaterThanOrEqual(44);
      }
    }

    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/pals/');
    await page.getByRole('tab', { name: 'Medications' }).click();
    const tableState = await page.locator('.protocol-table-wrap').evaluate(el => ({
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      tabIndex: (el as HTMLElement).tabIndex,
    }));
    expect(tableState.scrollWidth).toBeGreaterThan(tableState.clientWidth);
    expect(tableState.tabIndex).toBe(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('explicit dark theme persists throughout the protocol family', async ({ page }) => {
    await page.goto('/als/');
    await page.getByLabel('Color theme').selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.goto('/pals/');
    await expect(page.getByLabel('Color theme')).toHaveValue('dark');
    await page.goto('/tccc/');
    await expect(page.getByLabel('Color theme')).toHaveValue('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
