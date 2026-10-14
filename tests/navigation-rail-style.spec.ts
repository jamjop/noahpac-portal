import { test, expect } from '@playwright/test';

const NAVIGATION_CONTROLS = [
  ['/tccc/', '.mobile-protocol-nav select'],
  ['/als/', '.mobile-protocol-nav select'],
  ['/pals/', '.mobile-protocol-nav select'],
  ['/calculators/', '.cat-nav .tab-btn.active'],
  ['/labs/', '.cat-nav .tab-btn.active'],
  ['/ddx/', '.cat-nav .tab-btn.active'],
  ['/lookup/', '.reference-tab[aria-selected="true"]'],
  ['/wound/', '.tab-bar .tab-btn[aria-selected="true"]'],
  ['/antibiogram/', '.gram-tab[aria-selected="true"]'],
] as const;

test('navigation rails use compact rectangular controls on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });

  for (const [route, selector] of NAVIGATION_CONTROLS) {
    await page.goto(route);
    // DDx intentionally opens without a selected lab; choose one before
    // validating its selected navigation state.
    if (route === '/ddx/') await page.locator('.cat-nav .tab-btn').first().click();
    const control = page.locator(selector).first();
    await expect(control, `${route} has an active navigation control`).toBeVisible();
    const geometry = await control.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        borderRadius: Number.parseFloat(style.borderTopLeftRadius),
        height: rect.height,
        background: style.backgroundColor,
        color: style.color,
      };
    });
    expect(geometry.borderRadius, `${route} navigation should not be pill-shaped`).toBeLessThanOrEqual(9);
    expect(geometry.height, `${route} navigation needs a touch-friendly target`).toBeGreaterThanOrEqual(40);
    expect(geometry.background, `${route} selected navigation needs a visible surface`).not.toBe('rgba(0, 0, 0, 0)');
    expect(geometry.color, `${route} selected navigation needs visible text`).not.toBe(geometry.background);
  }
});

test('section navigation uses the same restrained rectangular language', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  for (const [route, selector] of [
    ['/sepsis/', '.section-nav a'],
    ['/peds/', '.tool-section-nav a'],
  ] as const) {
    await page.goto(route);
    const link = page.locator(selector).first();
    await expect(link).toBeVisible();
    const geometry = await link.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderRadius: Number.parseFloat(style.borderTopLeftRadius),
        height: element.getBoundingClientRect().height,
      };
    });
    expect(geometry.borderRadius).toBeLessThanOrEqual(9);
    expect(geometry.height).toBeGreaterThanOrEqual(44);
  }
});

test('clinical status pills remain semantically distinct', async ({ page }) => {
  await page.goto('/wound/');
  await expect(page.locator('.pill').first()).toHaveCSS('border-radius', '50px');
});
