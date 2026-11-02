import { test, expect } from '@playwright/test';

const NAVIGATION_CONTROLS = [
  ['/tccc/', '.protocol-tab[aria-selected="true"]'],
  ['/als/', '.protocol-tab[aria-selected="true"]'],
  ['/pals/', '.protocol-tab[aria-selected="true"]'],
  ['/calculators/', '.calc-chooser-toggle'],
  ['/labs/', '.cat-nav .tab-btn.active'],
  ['/ddx/', '.ddx-chooser-toggle'],
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

const HEADER_RAILS = [
  ['/abx/', '.tool-family-nav', '.tool-family-nav__inner'],
  ['/allergy/', '.tool-family-nav', '.tool-family-nav__inner'],
  ['/antibiogram/', '.tool-family-nav', '.tool-family-nav__inner'],
  ['/empiric/', '.tool-family-nav', '.tool-family-nav__inner'],
  ['/peds/', '.tool-section-nav', '.tool-section-nav__inner'],
  ['/sepsis/', '.section-nav', '.section-nav__inner'],
  ['/triage/', '.section-nav', '.section-nav__inner'],
  ['/readiness/', '.workflow-nav', '.workflow-tabs'],
] as const;

test('under-header navigation rails stay contained on desktop and simplify on mobile', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const [route, outerSelector, innerSelector] of HEADER_RAILS) {
      await page.goto(route);
      const outer = page.locator(outerSelector).first();
      const inner = page.locator(innerSelector).first();
      await expect(inner, `${route} has a visible contained header rail`).toBeVisible();

      const geometry = await inner.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          left: rect.left,
          right: window.innerWidth - rect.right,
          radius: Number.parseFloat(style.borderTopLeftRadius),
          borderTopWidth: Number.parseFloat(style.borderTopWidth),
          borderBottomWidth: Number.parseFloat(style.borderBottomWidth),
          background: style.backgroundColor,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      if (viewport.width > 700) {
        expect(geometry.left, `${route} desktop left edge uses a page gutter`).toBeGreaterThanOrEqual(13);
        expect(geometry.right, `${route} desktop right edge uses a page gutter`).toBeGreaterThanOrEqual(13);
        expect(geometry.radius, `${route} desktop rail is visibly contained`).toBeGreaterThanOrEqual(9);
        expect(geometry.borderTopWidth, `${route} desktop rail has a quiet boundary`).toBeGreaterThanOrEqual(1);
      } else {
        expect(geometry.left, `${route} mobile rail uses the full usable width`).toBeLessThanOrEqual(1);
        expect(geometry.right, `${route} mobile rail uses the full usable width`).toBeLessThanOrEqual(1);
        expect(geometry.radius, `${route} mobile rail avoids nested-card styling`).toBe(0);
        expect(geometry.borderTopWidth, `${route} mobile rail avoids a redundant top rule`).toBe(0);
      }
      expect(Math.abs(geometry.left - geometry.right), `${route} is centered`).toBeLessThanOrEqual(2);
      expect(geometry.borderBottomWidth, `${route} rail retains a quiet lower boundary`).toBeGreaterThanOrEqual(1);
      expect(geometry.background, `${route} rail retains its shaded surface`).not.toBe('rgba(0, 0, 0, 0)');
      expect(geometry.overflow, `${route} does not create horizontal page overflow`).toBe(0);
      await expect(outer, `${route} no longer shades the full viewport`).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    }
  }
});

test('antimicrobial mobile navigation shows all four destinations without clipping', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ['/abx/', '/allergy/', '/antibiogram/', '/empiric/']) {
      await page.goto(route);
      await expect(page.locator('.tool-family-nav__identity')).toBeHidden();
      const geometry = await page.locator('.tool-family-nav__links').evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        links: [...element.querySelectorAll('a')].map((link) => {
          const rect = link.getBoundingClientRect();
          return { left: rect.left, right: rect.right, shortLabel: getComputedStyle(link, '::after').content };
        }),
      }));
      expect(geometry.scrollWidth, `${route} family navigation fits at ${width}px`).toBeLessThanOrEqual(geometry.clientWidth);
      expect(geometry.links).toHaveLength(4);
      for (const link of geometry.links) {
        expect(link.left, `${route} link remains onscreen at ${width}px`).toBeGreaterThanOrEqual(0);
        expect(link.right, `${route} link remains onscreen at ${width}px`).toBeLessThanOrEqual(width);
        expect(link.shortLabel, `${route} link has a concise mobile label`).not.toBe('none');
      }
    }
  }
});

test('antibiotic search header stays compact on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/abx/');
  const header = page.locator('.abx-search-panel .reference-search-panel__header');
  await expect(header).toHaveCSS('flex-direction', 'row');
  const headerHeight = await header.evaluate((element) => element.getBoundingClientRect().height);
  expect(headerHeight).toBeLessThan(80);
});

test('mobile reference search card is visually separated from its condition menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/abx/');
  const searchPanel = page.locator('.reference-search-panel').first();
  const conditionMenu = page.locator('.cat-nav').first();
  const searchBox = await searchPanel.boundingBox();
  const menuBox = await conditionMenu.boundingBox();
  expect(searchBox).not.toBeNull();
  expect(menuBox).not.toBeNull();
  const gap = menuBox!.y - (searchBox!.y + searchBox!.height);
  expect(gap, 'the condition menu has a deliberate gap below search').toBeGreaterThanOrEqual(12);
  expect(gap, 'the search and condition menu remain visually related').toBeLessThanOrEqual(24);
});

test('clinical status pills remain semantically distinct', async ({ page }) => {
  await page.goto('/wound/');
  await expect(page.locator('.pill').first()).toHaveCSS('border-radius', '50px');
});
