import { test, expect } from '@playwright/test';

const DEVICES = [
  { name: 'small iPhone', width: 375, height: 667 },
  { name: 'modern iPhone', width: 390, height: 844 },
  { name: 'Android phone', width: 412, height: 915 },
  { name: 'small tablet', width: 768, height: 1024 },
] as const;

const ROUTES = ['/', '/calculators/', '/labs/', '/vaccines/', '/anticoag/', '/als/'];

for (const device of DEVICES) {
  test(`${device.name} layout remains usable at ${device.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height });
    for (const route of ROUTES) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} overflows on ${device.name}`).toBeLessThanOrEqual(1);
      await expect(page.locator('h1')).toBeVisible();
    }

    await page.goto('/vaccines/');
    await page.getByLabel('Color theme').selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const themeTarget = await page.getByLabel('Color theme').evaluate((node) => {
      const box = node.getBoundingClientRect();
      return { width: box.width, height: box.height };
    });
    expect(themeTarget.width).toBeGreaterThanOrEqual(44);
    expect(themeTarget.height).toBeGreaterThanOrEqual(38);
  });
}
