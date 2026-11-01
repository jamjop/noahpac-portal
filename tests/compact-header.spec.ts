import { test, expect } from '@playwright/test';

const ROUTES = [
  '/calculators/', '/sepsis/', '/opioids/', '/steroids/', '/peds/',
  '/drugref/', '/lookup/', '/labs/', '/als/', '/pals/', '/tccc/',
  '/abx/', '/allergy/', '/antibiogram/', '/anticoag/', '/clinical-assistant/',
  '/clinical-review/', '/ddx/', '/documents/', '/empiric/', '/naloxone/',
  '/readiness/', '/reportable/', '/screener/', '/sti-guide/', '/toxicology/',
  '/triage/', '/updates/', '/vaccines/', '/wound/',
];

for (const width of [375, 1440]) {
  test(`shared application headers stay compact and collision-free at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });

    for (const route of ROUTES) {
      await page.goto(route);
      const geometry = await page.evaluate(() => {
        const header = document.querySelector('.app-header--unified')!.getBoundingClientRect();
        const controls = document.querySelector('.app-header__bar')!.getBoundingClientRect();
        const title = document.querySelector('.app-header__title h1')!.getBoundingClientRect();
        const inner = document.querySelector('.app-header__inner')!.getBoundingClientRect();
        const accent = getComputedStyle(document.querySelector('.app-header__inner')!, '::after');
        const canvasProbe = document.createElement('span');
        const surfaceProbe = document.createElement('span');
        canvasProbe.style.backgroundColor = 'var(--app-canvas)';
        surfaceProbe.style.backgroundColor = 'var(--app-surface)';
        document.body.append(canvasProbe, surfaceProbe);
        const bodyBackground = getComputedStyle(document.body).backgroundColor;
        const canvasBackground = getComputedStyle(canvasProbe).backgroundColor;
        const surfaceBackground = getComputedStyle(surfaceProbe).backgroundColor;
        canvasProbe.remove();
        surfaceProbe.remove();
        return {
          headerHeight: header.height,
          controlsBottom: controls.bottom,
          titleTop: title.top,
          innerWidth: inner.width,
          accentWidth: Number.parseFloat(accent.width),
          headerBorderBottom: Number.parseFloat(getComputedStyle(document.querySelector('.app-header--unified')!).borderBottomWidth),
          bodyBackground,
          canvasBackground,
          surfaceBackground,
          documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });

      expect(geometry.controlsBottom, `${route} controls overlap its title`).toBeLessThanOrEqual(geometry.titleTop + 1);
      expect(geometry.headerHeight, `${route} header is still too tall`).toBeLessThanOrEqual(width === 375 ? 225 : 205);
      expect(Math.abs(geometry.accentWidth - geometry.innerWidth), `${route} accent aligns with the header content`).toBeLessThanOrEqual(1);
      expect(geometry.headerBorderBottom, `${route} does not retain a full-width bottom rule`).toBe(0);
      expect(geometry.bodyBackground, `${route} uses the shared page canvas`).toBe(geometry.canvasBackground);
      expect(geometry.canvasBackground, `${route} canvas remains distinct from white working surfaces`).not.toBe(geometry.surfaceBackground);
      expect(geometry.documentOverflow, `${route} has horizontal overflow`).toBeLessThanOrEqual(1);
      await expect(page.getByLabel('Color theme')).toBeVisible();
      await expect(page.locator('.app-brand__mark')).toHaveText('PA');
      await expect(page.locator('.app-header__family-icon svg')).toBeVisible();
      const mobileHome = page.locator('.app-mobile-home');
      await expect(mobileHome).toHaveAttribute('href', '/');
      await expect(mobileHome).toHaveAttribute('aria-label', 'Return to Clinical Tools');
      if (width === 375) await expect(mobileHome).toBeVisible();
      else await expect(mobileHome).toBeHidden();
    }
  });
}

test('mobile home control returns to the Clinical Tools landing page', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/calculators/');
  await page.getByRole('link', { name: 'Return to Clinical Tools' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Clinical Tools', level: 1 })).toBeVisible();
});

test('all clinical pages preserve the canvas and surface hierarchy in dark mode', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ROUTES) {
    await page.goto(route);
    await page.getByLabel('Color theme').selectOption('dark');
    const colors = await page.evaluate(() => {
      const canvasProbe = document.createElement('span');
      const surfaceProbe = document.createElement('span');
      canvasProbe.style.backgroundColor = 'var(--app-canvas)';
      surfaceProbe.style.backgroundColor = 'var(--app-surface)';
      document.body.append(canvasProbe, surfaceProbe);
      const result = {
        body: getComputedStyle(document.body).backgroundColor,
        canvas: getComputedStyle(canvasProbe).backgroundColor,
        surface: getComputedStyle(surfaceProbe).backgroundColor,
      };
      canvasProbe.remove();
      surfaceProbe.remove();
      return result;
    });
    expect(colors.body, `${route} uses the dark shared canvas`).toBe(colors.canvas);
    expect(colors.canvas, `${route} dark canvas remains distinct from working surfaces`).not.toBe(colors.surface);
  }
});
