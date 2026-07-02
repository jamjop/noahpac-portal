/**
 * Dark-mode contrast tests for ALS and PALS pages.
 *
 * Checks that key text elements (step numbers, sec-badge labels, callout text)
 * maintain a minimum WCAG AA contrast ratio (4.5:1) against their effective
 * backgrounds in dark mode.
 *
 * A future change to --badge-danger-dark, --teal, --ink, or any callout-ink
 * token that drops readability will be caught here before it ships.
 *
 * Elements covered:
 *   - .step-num       (color: --teal, effective bg: --surface from .steps li)
 *   - .sec-badge      (color: #fff,   bg: --badge-*-dark)
 *   - .callout.danger (color: --callout-danger-ink, bg: --risk-soft)
 *   - .callout.warn   (color: --callout-warn-ink,   bg: --warn-soft)
 *   - .callout.info   (color: --callout-info-ink,   bg: --teal-soft)
 *   - .drug-table th  (PALS only — color: --ink-muted, bg: --surface in dark)
 */

import { test, expect } from '@playwright/test';

// ── WCAG contrast helpers ────────────────────────────────────────────────────

/** Parse a computed `rgb(…)` / `rgba(…)` string into [r, g, b] or null. */
function parseRgb(color: string): [number, number, number] | null {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

/** Returns true when the background channel is fully transparent. */
function isTransparent(color: string): boolean {
  return /rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(color) || color === 'transparent';
}

/** Convert 0–255 sRGB channel to linear-light value per WCAG 2.1. */
function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of an [r, g, b] triplet (0–255 each). */
function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours. Always ≥ 1. */
function contrastRatio(
  fg: [number, number, number],
  bg: [number, number, number],
): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const WCAG_AA = 4.5; // minimum contrast ratio for normal text

/**
 * Assert that the foreground `color` of `fgSelector` against the
 * `backgroundColor` of `bgSelector` meets `minContrast`.
 *
 * Skips silently when either selector returns no element or when the
 * background resolves to transparent (the element inherits a dark surface
 * and is not itself a contrast risk).
 */
async function assertContrastOk(
  page: import('@playwright/test').Page,
  fgSelector: string,
  bgSelector: string,
  label: string,
  minContrast = WCAG_AA,
): Promise<void> {
  const fgEl = page.locator(fgSelector).first();
  const bgEl = page.locator(bgSelector).first();

  if ((await fgEl.count()) === 0 || (await bgEl.count()) === 0) return;

  const fg: string = await fgEl.evaluate(el => getComputedStyle(el).color);
  const bg: string = await bgEl.evaluate(el => getComputedStyle(el).backgroundColor);

  if (isTransparent(bg)) return;

  const fgRgb = parseRgb(fg);
  const bgRgb = parseRgb(bg);

  expect(
    fgRgb,
    `${label}: could not parse foreground colour "${fg}"`,
  ).not.toBeNull();
  expect(
    bgRgb,
    `${label}: could not parse background colour "${bg}"`,
  ).not.toBeNull();

  const ratio = contrastRatio(fgRgb!, bgRgb!);
  expect(
    ratio,
    `${label}: contrast ratio ${ratio.toFixed(2)}:1 is below WCAG AA ${minContrast}:1` +
      ` (fg="${fg}" bg="${bg}") — check --badge-danger-dark / --ink / callout-ink tokens in shared.css`,
  ).toBeGreaterThanOrEqual(minContrast);
}

/** Wait for at least one child to appear inside `parentSelector`. */
async function waitForChildren(
  page: import('@playwright/test').Page,
  parentSelector: string,
  timeout = 10_000,
): Promise<void> {
  await page.waitForFunction(
    (sel: string) => (document.querySelector(sel)?.childElementCount ?? 0) > 0,
    parentSelector,
    { timeout },
  );
}

// ── shared setup ─────────────────────────────────────────────────────────────

test.use({ colorScheme: 'dark' });

// ── ALS page ─────────────────────────────────────────────────────────────────

test.describe('ALS page – dark mode contrast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/als/');
    await waitForChildren(page, '#tabNav');
    await page.locator('#tabNav .tab-btn').first().click();
    await waitForChildren(page, '#content');
  });

  test('step numbers (.step-num) have sufficient contrast against card background', async ({
    page,
  }) => {
    // .step-num has color:var(--teal); its background is transparent — effective
    // background is the parent .steps li which carries var(--surface).
    await assertContrastOk(
      page,
      '.step-num',
      '.steps li',
      'als .step-num / .steps li',
    );
  });

  test('sec-badge text has sufficient contrast against badge background', async ({
    page,
  }) => {
    // In dark mode: .sec-badge background → var(--badge-danger-dark); color → #fff
    await assertContrastOk(
      page,
      '.sec-badge',
      '.sec-badge',
      'als .sec-badge (default/danger)',
    );
  });

  test('danger callout text has sufficient contrast', async ({ page }) => {
    // color: var(--callout-danger-ink)  bg: var(--risk-soft)
    await assertContrastOk(
      page,
      '.callout.danger',
      '.callout.danger',
      'als .callout.danger',
    );
  });

  test('warn callout text has sufficient contrast', async ({ page }) => {
    // color: var(--callout-warn-ink)  bg: var(--warn-soft)
    await assertContrastOk(
      page,
      '.callout.warn',
      '.callout.warn',
      'als .callout.warn',
    );
  });

  test('info callout text has sufficient contrast', async ({ page }) => {
    // color: var(--callout-info-ink)  bg: var(--teal-soft)
    await assertContrastOk(
      page,
      '.callout.info',
      '.callout.info',
      'als .callout.info',
    );
  });
});

// ── PALS page ─────────────────────────────────────────────────────────────────

test.describe('PALS page – dark mode contrast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pals/');
    await waitForChildren(page, '#tabNav');
    await page.locator('#tabNav .tab-btn').first().click();
    await waitForChildren(page, '#content');
  });

  test('step numbers (.step-num) have sufficient contrast against card background', async ({
    page,
  }) => {
    await assertContrastOk(
      page,
      '.step-num',
      '.steps li',
      'pals .step-num / .steps li',
    );
  });

  test('sec-badge text has sufficient contrast against badge background', async ({
    page,
  }) => {
    await assertContrastOk(
      page,
      '.sec-badge',
      '.sec-badge',
      'pals .sec-badge (default/danger)',
    );
  });

  test('danger callout text has sufficient contrast', async ({ page }) => {
    await assertContrastOk(
      page,
      '.callout.danger',
      '.callout.danger',
      'pals .callout.danger',
    );
  });

  test('warn callout text has sufficient contrast', async ({ page }) => {
    await assertContrastOk(
      page,
      '.callout.warn',
      '.callout.warn',
      'pals .callout.warn',
    );
  });

  test('info callout text has sufficient contrast', async ({ page }) => {
    await assertContrastOk(
      page,
      '.callout.info',
      '.callout.info',
      'pals .callout.info',
    );
  });

  test('drug-table th text has sufficient contrast against header background', async ({
    page,
  }) => {
    // In dark mode: .drug-table th background → var(--surface); color → var(--ink-muted)
    await assertContrastOk(
      page,
      '.drug-table th',
      '.drug-table th',
      'pals .drug-table th',
    );
  });
});
