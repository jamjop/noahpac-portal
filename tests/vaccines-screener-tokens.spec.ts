/**
 * Token-consolidation verification for the screener and vaccines pages.
 *
 * After --women, --men, --print-border, and --blue were moved from page-local
 * :root blocks into shared.css, this spec confirms that:
 *
 *   1. .tag.women chips show correct pink backgrounds/text in light AND dark mode
 *   2. .tag.men chips show correct blue backgrounds/text in light AND dark mode
 *   3. The vaccines page --teal-soft override (#E0F7FA, warmer) is preserved
 *   4. Print-border tokens are accessible via CSS custom properties on both pages
 *   5. No bright-white backgrounds appear in dark mode on either page
 *
 * Screener page renders .tag.women / .tag.men dynamically via app.js when
 * recommendations are available.  The default state (female, age 50) should
 * already produce women-tagged items; clicking the male button produces
 * men-tagged items.
 */

import { test, expect } from '@playwright/test';

// ── Colour helpers ────────────────────────────────────────────────────────────

function parseRgb(color: string): [number, number, number] | null {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

function isTransparent(color: string): boolean {
  return /rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(color) || color === 'transparent';
}

function isDark(rgb: [number, number, number]): boolean {
  return Math.max(rgb[0], rgb[1], rgb[2]) < 200;
}

/** Resolve a CSS custom property on the document root. */
async function getCssProp(
  page: import('@playwright/test').Page,
  prop: string,
): Promise<string> {
  return page.evaluate(
    (p: string) => getComputedStyle(document.documentElement).getPropertyValue(p).trim(),
    prop,
  );
}

/** Get a computed style property (e.g. backgroundColor, color) for a selector. */
async function getComputedProp(
  page: import('@playwright/test').Page,
  selector: string,
  prop: 'backgroundColor' | 'color',
): Promise<string | null> {
  const el = await page.$(selector);
  if (!el) return null;
  return el.evaluate(
    (node: Element, p: string) => getComputedStyle(node)[p as 'backgroundColor'],
    prop,
  );
}

async function assertBgIsDark(
  page: import('@playwright/test').Page,
  selector: string,
  label: string,
): Promise<void> {
  const color = await getComputedProp(page, selector, 'backgroundColor');
  if (!color || isTransparent(color)) return;
  const rgb = parseRgb(color);
  expect(rgb, `${label}: could not parse background "${color}"`).not.toBeNull();
  expect(
    isDark(rgb!),
    `${label}: background "${color}" is too bright for dark mode (max channel ${Math.max(...rgb!)} ≥ 200)`,
  ).toBe(true);
}

/** Parses a hex color string (#rrggbb) into [r, g, b]. */
function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.trim().replace('#', '');
  if (h.length !== 6) return null;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

// ── Screener: light mode ──────────────────────────────────────────────────────

test.describe('Screener page – light mode tag tokens', () => {
  test.use({ colorScheme: 'light' });

  test('.tag.women shows pink background and text from --women / --women-soft', async ({ page }) => {
    await page.goto('/screener/');
    // Default: female, age 50 — women-tagged recommendations should render
    await page.waitForFunction(
      () => !!document.querySelector('.tag.women'),
      { timeout: 10_000 },
    );

    const bg = await getComputedProp(page, '.tag.women', 'backgroundColor');
    const fg = await getComputedProp(page, '.tag.women', 'color');

    expect(bg, '.tag.women background should be defined').not.toBeNull();
    expect(fg, '.tag.women text color should be defined').not.toBeNull();

    // --women-soft: #FCE7F3 → rgb(252, 231, 243) — pink-ish
    const bgRgb = parseRgb(bg!);
    expect(bgRgb, `.tag.women bg: could not parse "${bg}"`).not.toBeNull();
    // Red channel should dominate (pink family: R > G and R > B)
    expect(bgRgb![0], `.tag.women bg: R channel should dominate (pink background), got "${bg}"`).toBeGreaterThan(bgRgb![2]);

    // --women: #BE185D → rgb(190, 24, 93) — deep pink text
    const fgRgb = parseRgb(fg!);
    expect(fgRgb, `.tag.women text: could not parse "${fg}"`).not.toBeNull();
    // Red channel should be dominant for text color too
    expect(fgRgb![0], `.tag.women text: R should dominate (pink text), got "${fg}"`).toBeGreaterThan(fgRgb![2]);
  });

  test('.tag.men shows blue background and text from --men / --men-soft', async ({ page }) => {
    await page.goto('/screener/');
    // Set age to 60 so the male-only PSA recommendation (ages 55–69) is in range,
    // then click male to trigger .tag.men chips.
    await page.waitForSelector('#age');
    await page.fill('#age', '60');
    await page.locator('[data-sex="male"]').click();
    await page.waitForFunction(
      () => !!document.querySelector('.tag.men'),
      { timeout: 10_000 },
    );

    const bg = await getComputedProp(page, '.tag.men', 'backgroundColor');
    const fg = await getComputedProp(page, '.tag.men', 'color');

    expect(bg, '.tag.men background should be defined').not.toBeNull();
    expect(fg, '.tag.men text color should be defined').not.toBeNull();

    // --men-soft: #E0F2FE → rgb(224, 242, 254) — blue-ish tint
    const bgRgb = parseRgb(bg!);
    expect(bgRgb, `.tag.men bg: could not parse "${bg}"`).not.toBeNull();
    // Blue channel should dominate (cyan-blue family: B > R)
    expect(bgRgb![2], `.tag.men bg: B channel should dominate (blue background), got "${bg}"`).toBeGreaterThan(bgRgb![0]);

    // --men: #0369A1 → rgb(3, 105, 161) — deep blue text
    const fgRgb = parseRgb(fg!);
    expect(fgRgb, `.tag.men text: could not parse "${fg}"`).not.toBeNull();
    expect(fgRgb![2], `.tag.men text: B channel should dominate (blue text), got "${fg}"`).toBeGreaterThan(fgRgb![0]);
  });

  test('print-border tokens are defined on screener page', async ({ page }) => {
    await page.goto('/screener/');
    await page.waitForLoadState('domcontentloaded');

    const printBorder = await getCssProp(page, '--print-border');
    const printBorderDim = await getCssProp(page, '--print-border-dim');
    const printBorderSoft = await getCssProp(page, '--print-border-soft');

    expect(printBorder, '--print-border should be defined by shared.css').not.toBe('');
    expect(printBorderDim, '--print-border-dim should be defined by shared.css').not.toBe('');
    expect(printBorderSoft, '--print-border-soft should be defined by shared.css').not.toBe('');

    // Verify the specific values match shared.css definitions
    expect(printBorder).toBe('#ccc');
    expect(printBorderDim).toBe('#999');
    expect(printBorderSoft).toBe('#eee');
  });
});

// ── Screener: dark mode ───────────────────────────────────────────────────────

test.describe('Screener page – dark mode tag tokens', () => {
  test.use({ colorScheme: 'dark' });

  test('body and structural elements are dark in dark mode', async ({ page }) => {
    await page.goto('/screener/');
    await page.waitForLoadState('domcontentloaded');
    await assertBgIsDark(page, 'body', 'screener body');
    await assertBgIsDark(page, 'header.app-header', 'screener header');
  });

  test('.tag.women shows correct dark-mode pink token values', async ({ page }) => {
    await page.goto('/screener/');
    await page.waitForFunction(
      () => !!document.querySelector('.tag.women'),
      { timeout: 10_000 },
    );

    // Verify the dark-mode token value for --women-soft (#4a0e2d) is dark
    const womenSoft = await getCssProp(page, '--women-soft');
    const womenSoftRgb = hexToRgb(womenSoft);
    expect(womenSoftRgb, `--women-soft in dark mode should parse as hex, got "${womenSoft}"`).not.toBeNull();
    expect(
      isDark(womenSoftRgb!),
      `--women-soft in dark mode should be dark, got "${womenSoft}" (max channel ${Math.max(...womenSoftRgb!)} ≥ 200)`,
    ).toBe(true);

    // Verify the tag itself has a dark background (not bright white)
    const bg = await getComputedProp(page, '.tag.women', 'backgroundColor');
    if (bg && !isTransparent(bg)) {
      const rgb = parseRgb(bg);
      if (rgb) {
        expect(
          isDark(rgb),
          `.tag.women background in dark mode should be dark, got "${bg}"`,
        ).toBe(true);
      }
    }
  });

  test('.tag.men shows correct dark-mode blue token values', async ({ page }) => {
    await page.goto('/screener/');
    // Set age to 60 so PSA recommendation (ages 55–69) is in range before switching to male
    await page.waitForSelector('#age');
    await page.fill('#age', '60');
    await page.locator('[data-sex="male"]').click();
    await page.waitForFunction(
      () => !!document.querySelector('.tag.men'),
      { timeout: 10_000 },
    );

    // Verify the dark-mode token value for --men-soft (#0c2a42) is dark
    const menSoft = await getCssProp(page, '--men-soft');
    const menSoftRgb = hexToRgb(menSoft);
    expect(menSoftRgb, `--men-soft in dark mode should parse as hex, got "${menSoft}"`).not.toBeNull();
    expect(
      isDark(menSoftRgb!),
      `--men-soft in dark mode should be dark, got "${menSoft}" (max channel ${Math.max(...menSoftRgb!)} ≥ 200)`,
    ).toBe(true);

    // The tag background should also be dark
    const bg = await getComputedProp(page, '.tag.men', 'backgroundColor');
    if (bg && !isTransparent(bg)) {
      const rgb = parseRgb(bg);
      if (rgb) {
        expect(
          isDark(rgb),
          `.tag.men background in dark mode should be dark, got "${bg}"`,
        ).toBe(true);
      }
    }
  });
});

// ── Vaccines: light mode ──────────────────────────────────────────────────────

test.describe('Vaccines page – light mode token checks', () => {
  test.use({ colorScheme: 'light' });

  test('--teal-soft override is the warmer vaccines value, not the shared value', async ({ page }) => {
    await page.goto('/vaccines/');
    await page.waitForLoadState('domcontentloaded');

    const tealSoft = await getCssProp(page, '--teal-soft');
    // vaccines/style.css overrides --teal-soft to #E0F7FA (warmer cyan),
    // distinct from shared.css's #e0f2fe (cooler blue-cyan).
    // Both are similar but distinct; ensure the vaccines override wins.
    expect(tealSoft.toLowerCase(), '--teal-soft should be overridden to vaccines-specific value').toBe('#e0f7fa');
  });

  test('print-border tokens are defined on vaccines page', async ({ page }) => {
    await page.goto('/vaccines/');
    await page.waitForLoadState('domcontentloaded');

    const printBorder = await getCssProp(page, '--print-border');
    const printBorderDim = await getCssProp(page, '--print-border-dim');
    const printBorderSoft = await getCssProp(page, '--print-border-soft');

    expect(printBorder, '--print-border should be defined by shared.css').toBe('#ccc');
    expect(printBorderDim, '--print-border-dim should be defined by shared.css').toBe('#999');
    expect(printBorderSoft, '--print-border-soft should be defined by shared.css').toBe('#eee');
  });

  test('--women and --men tokens have correct light-mode values on vaccines page', async ({ page }) => {
    await page.goto('/vaccines/');
    await page.waitForLoadState('domcontentloaded');

    const women = await getCssProp(page, '--women');
    const womenSoft = await getCssProp(page, '--women-soft');
    const men = await getCssProp(page, '--men');
    const menSoft = await getCssProp(page, '--men-soft');

    // Verify shared.css light-mode values
    expect(women.toLowerCase()).toBe('#be185d');
    expect(womenSoft.toLowerCase()).toBe('#fce7f3');
    expect(men.toLowerCase()).toBe('#0369a1');
    expect(menSoft.toLowerCase()).toBe('#e0f2fe');
  });

  test('--blue and --blue-soft tokens are defined on vaccines page', async ({ page }) => {
    await page.goto('/vaccines/');
    await page.waitForLoadState('domcontentloaded');

    const blue = await getCssProp(page, '--blue');
    const blueSoft = await getCssProp(page, '--blue-soft');

    expect(blue, '--blue should be defined by shared.css').not.toBe('');
    expect(blueSoft, '--blue-soft should be defined by shared.css').not.toBe('');
    expect(blue.toLowerCase()).toBe('#1b5faf');
    expect(blueSoft.toLowerCase()).toBe('#dbeafe');
  });

  test('.tag.women and .tag.men CSS rules apply correct colors on vaccines page', async ({ page }) => {
    // vaccines/app.js recRow() does not render .tag.women / .tag.men elements at
    // runtime, so we inject test nodes to verify the vaccines/style.css rules
    // resolve correctly against the shared.css tokens.
    await page.goto('/vaccines/');
    await page.waitForLoadState('domcontentloaded');

    // Inject a .tag.women and .tag.men chip into the live document
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = '__token-test-chips';
      container.innerHTML =
        '<span class="tag women" id="__tw">W</span>' +
        '<span class="tag men"   id="__tm">M</span>';
      document.body.appendChild(container);
    });

    const womenBg = await getComputedProp(page, '#__tw', 'backgroundColor');
    const womenFg = await getComputedProp(page, '#__tw', 'color');
    const menBg   = await getComputedProp(page, '#__tm', 'backgroundColor');
    const menFg   = await getComputedProp(page, '#__tm', 'color');

    // .tag.women { background: var(--women-soft); color: var(--women) }
    // Light mode: --women-soft:#FCE7F3 (pink), --women:#BE185D (deep pink)
    const wBgRgb = parseRgb(womenBg!);
    const wFgRgb = parseRgb(womenFg!);
    expect(wBgRgb, `vaccines .tag.women bg: could not parse "${womenBg}"`).not.toBeNull();
    expect(wFgRgb, `vaccines .tag.women fg: could not parse "${womenFg}"`).not.toBeNull();
    expect(wBgRgb![0], `vaccines .tag.women bg: R should dominate (pink #FCE7F3), got "${womenBg}"`).toBeGreaterThan(wBgRgb![2]);
    expect(wFgRgb![0], `vaccines .tag.women fg: R should dominate (pink #BE185D), got "${womenFg}"`).toBeGreaterThan(wFgRgb![2]);

    // .tag.men { background: var(--men-soft); color: var(--men) }
    // Light mode: --men-soft:#E0F2FE (blue-tint), --men:#0369A1 (deep blue)
    const mBgRgb = parseRgb(menBg!);
    const mFgRgb = parseRgb(menFg!);
    expect(mBgRgb, `vaccines .tag.men bg: could not parse "${menBg}"`).not.toBeNull();
    expect(mFgRgb, `vaccines .tag.men fg: could not parse "${menFg}"`).not.toBeNull();
    expect(mBgRgb![2], `vaccines .tag.men bg: B should dominate (blue #E0F2FE), got "${menBg}"`).toBeGreaterThan(mBgRgb![0]);
    expect(mFgRgb![2], `vaccines .tag.men fg: B should dominate (blue #0369A1), got "${menFg}"`).toBeGreaterThan(mFgRgb![0]);
  });
});

// ── Vaccines: dark mode ───────────────────────────────────────────────────────

test.describe('Vaccines page – dark mode token checks', () => {
  test.use({ colorScheme: 'dark' });

  test('body and panel have dark backgrounds', async ({ page }) => {
    await page.goto('/vaccines/');
    await page.waitForLoadState('domcontentloaded');
    await assertBgIsDark(page, 'body', 'vaccines body');
    await page.waitForSelector('.panel');
    await assertBgIsDark(page, '.panel', 'vaccines .panel');
  });

  test('--women-soft and --men-soft have dark values in dark mode on vaccines page', async ({ page }) => {
    await page.goto('/vaccines/');
    await page.waitForLoadState('domcontentloaded');

    const womenSoft = await getCssProp(page, '--women-soft');
    const menSoft = await getCssProp(page, '--men-soft');

    const womenSoftRgb = hexToRgb(womenSoft);
    const menSoftRgb = hexToRgb(menSoft);

    expect(womenSoftRgb, `--women-soft dark: could not parse "${womenSoft}"`).not.toBeNull();
    expect(menSoftRgb, `--men-soft dark: could not parse "${menSoft}"`).not.toBeNull();

    expect(
      isDark(womenSoftRgb!),
      `--women-soft in dark mode should be dark (#4a0e2d), got "${womenSoft}"`,
    ).toBe(true);
    expect(
      isDark(menSoftRgb!),
      `--men-soft in dark mode should be dark (#0c2a42), got "${menSoft}"`,
    ).toBe(true);
  });

  test('--teal-soft vaccines override persists in dark mode (unconditional :root wins)', async ({ page }) => {
    await page.goto('/vaccines/');
    await page.waitForLoadState('domcontentloaded');

    // vaccines/style.css sets --teal-soft:#E0F7FA in an unconditional :root block,
    // which loads AFTER shared.css in the cascade.  Because it has the same
    // specificity as shared.css's dark-mode :root but comes later in source order,
    // the vaccines value wins even in dark mode.  This is intentional: the warmer
    // teal-soft is a visual identity choice for the vaccines page, and no dark-mode
    // override is needed because --teal-soft is not used as a background on this page.
    const tealSoft = await getCssProp(page, '--teal-soft');
    expect(tealSoft.toLowerCase(), '--teal-soft should remain the vaccines override in dark mode').toBe('#e0f7fa');
  });
});

// ── Print-media emulation: both pages ────────────────────────────────────────
//
// Validates that the print-border tokens from shared.css are actually applied
// to concrete elements when the browser is in print mode.  Uses
// page.emulateMedia({ media: 'print' }) to activate @media print rules before
// checking computed border colors.

test.describe('Screener page – print border colors', () => {
  test('criterion cards and rec rows use shared print-border token in print mode', async ({ page }) => {
    await page.goto('/screener/');
    // Wait for recommendations to render (female, age 50 default)
    await page.waitForFunction(
      () => (document.querySelector('#results')?.childElementCount ?? 0) > 0,
      { timeout: 10_000 },
    );

    await page.emulateMedia({ media: 'print' });

    // screener @media print: .criterion { border: 1px solid var(--print-border) }
    const criterionBorder = await page.$eval('.criterion', el =>
      getComputedStyle(el).borderTopColor,
    );
    const criterionRgb = parseRgb(criterionBorder);
    expect(criterionRgb, `screener .criterion print border: could not parse "${criterionBorder}"`).not.toBeNull();
    // --print-border:#ccc → rgb(204,204,204) — grey; all channels equal and around 200
    const [r, g, b] = criterionRgb!;
    expect(Math.abs(r - g), 'screener .criterion print border should be grey (R≈G)').toBeLessThan(10);
    expect(Math.abs(g - b), 'screener .criterion print border should be grey (G≈B)').toBeLessThan(10);
    // Value should be close to #ccc (204)
    expect(r, `screener .criterion print border R should be ~204 for #ccc, got "${criterionBorder}"`).toBeGreaterThan(180);

    // screener @media print: .rec { border: 1px solid var(--print-border-soft) }
    const recBorder = await page.$eval('.rec', el =>
      getComputedStyle(el).borderTopColor,
    );
    const recRgb = parseRgb(recBorder);
    expect(recRgb, `screener .rec print border: could not parse "${recBorder}"`).not.toBeNull();
    // --print-border-soft:#eee → rgb(238,238,238) — light grey; close to white but not 255
    const [rr, gg, bb] = recRgb!;
    expect(Math.abs(rr - gg), 'screener .rec print border should be grey (R≈G)').toBeLessThan(10);
    expect(rr, `screener .rec print border R should be ~238 for #eee, got "${recBorder}"`).toBeGreaterThan(210);
  });
});

test.describe('Vaccines page – print border colors', () => {
  test('panel and rec rows use shared print-border token in print mode', async ({ page }) => {
    await page.goto('/vaccines/');
    // Allow JS to render recommendations
    await page.waitForFunction(
      () => (document.querySelector('#results')?.childElementCount ?? 0) > 0,
      { timeout: 10_000 },
    );

    await page.emulateMedia({ media: 'print' });

    // vaccines @media print: .panel { border: 1px solid var(--print-border) }
    const panelBorder = await page.$eval('.panel', el =>
      getComputedStyle(el).borderTopColor,
    );
    const panelRgb = parseRgb(panelBorder);
    expect(panelRgb, `vaccines .panel print border: could not parse "${panelBorder}"`).not.toBeNull();
    // --print-border:#ccc → rgb(204,204,204)
    const [r, g, b] = panelRgb!;
    expect(Math.abs(r - g), 'vaccines .panel print border should be grey (R≈G)').toBeLessThan(10);
    expect(r, `vaccines .panel print border R should be ~204 for #ccc, got "${panelBorder}"`).toBeGreaterThan(180);

    // vaccines @media print: .rec { border: 1px solid var(--print-border-soft) }
    const recBorder = await page.$eval('.rec', el =>
      getComputedStyle(el).borderTopColor,
    );
    const recRgb = parseRgb(recBorder);
    expect(recRgb, `vaccines .rec print border: could not parse "${recBorder}"`).not.toBeNull();
    // --print-border-soft:#eee → rgb(238,238,238)
    const [rr, gg, bb] = recRgb!;
    expect(Math.abs(rr - gg), 'vaccines .rec print border should be grey (R≈G)').toBeLessThan(10);
    expect(rr, `vaccines .rec print border R should be ~238 for #eee, got "${recBorder}"`).toBeGreaterThan(210);
  });
});
