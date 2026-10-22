import { test, expect } from '@playwright/test';

const ROUTES = [
  '/calculators/', '/sepsis/', '/opioids/', '/steroids/', '/peds/',
  '/drugref/', '/lookup/', '/labs/', '/als/', '/pals/', '/tccc/',
  '/abx/', '/allergy/', '/antibiogram/', '/anticoag/', '/clinical-assistant/',
  '/ddx/', '/documents/', '/empiric/', '/naloxone/', '/readiness/', '/reportable/',
  '/screener/', '/sti-guide/', '/toxicology/', '/triage/', '/vaccines/', '/wound/',
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
        return {
          headerHeight: header.height,
          controlsBottom: controls.bottom,
          titleTop: title.top,
          documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });

      expect(geometry.controlsBottom, `${route} controls overlap its title`).toBeLessThanOrEqual(geometry.titleTop + 1);
      expect(geometry.headerHeight, `${route} header is still too tall`).toBeLessThanOrEqual(width === 375 ? 225 : 205);
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
