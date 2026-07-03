/**
 * Shared helpers for dark-mode (and light-mode) background tests.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO ADD A NEW PAGE TO THE DARK-MODE TEST SUITE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * OPTION A — automatic (zero changes needed)
 *   Any page directory that contains both `index.html` and `style.css` is
 *   already picked up by `dark-mode-new-pages.spec.ts` at test-run time.
 *   Just ship the page; the auto-discovery handles the rest.
 *
 * OPTION B — explicit named smoke test (one call)
 *   Use `smokeTestPageDarkMode` or `smokeTestPage` in any spec file:
 *
 *     import { smokeTestPageDarkMode } from './dark-mode-helpers.js';
 *     smokeTestPageDarkMode('my-new-page');
 *
 *   This registers a `test.describe` block that checks body + header
 *   backgrounds in dark mode.  The function must be called at module scope
 *   (not inside another test or describe block).
 *
 * OPTION C — detailed per-page tests
 *   Import the individual helpers (`assertBgCompliant`, `assertFgCompliant`,
 *   `waitForSelector`, `waitForChildren`) and write custom interactions, just
 *   like the existing blocks in `dark-mode.spec.ts`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ColorScheme = 'light' | 'dark';

// ── Colour parsing ────────────────────────────────────────────────────────────

/** Parse a computed `rgb(…)` / `rgba(…)` string into [r, g, b] or null. */
export function parseRgb(color: string): [number, number, number] | null {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

/** Returns true when the alpha channel is 0 (element is see-through). */
export function isTransparent(color: string): boolean {
  return /rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(color) || color === 'transparent';
}

// ── Compliance checks ─────────────────────────────────────────────────────────

/**
 * True when the background colour is appropriate for the given scheme:
 *   dark  → max channel < 200  (not near-white)
 *   light → max channel > 100  (not near-black)
 */
export function bgIsCompliant(rgb: [number, number, number], scheme: ColorScheme): boolean {
  const max = Math.max(...rgb);
  return scheme === 'dark' ? max < 200 : max > 100;
}

/**
 * True when the foreground text colour is readable for the given scheme:
 *   dark  → max channel > 80   (near-black text is invisible on a dark bg)
 *   light → max channel < 240  (near-white text is invisible on a light bg)
 */
export function fgIsCompliant(rgb: [number, number, number], scheme: ColorScheme): boolean {
  const max = Math.max(...rgb);
  return scheme === 'dark' ? max > 80 : max < 240;
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

/** Wait for a CSS selector to exist in the DOM (not necessarily visible). */
export async function waitForSelector(
  page: import('@playwright/test').Page,
  selector: string,
  timeout = 10_000,
): Promise<void> {
  await page.waitForFunction(
    (sel: string) => !!document.querySelector(sel),
    selector,
    { timeout },
  );
}

/** Wait for at least one child element to appear inside `parentSelector`. */
export async function waitForChildren(
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

/** Evaluate a CSS property on the first matching element, or null if absent. */
export async function getComputedProp(
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

// ── Assertion helpers ─────────────────────────────────────────────────────────

/**
 * Assert that the background-color of `selector` is appropriate for `scheme`.
 * Silently skips when the element is absent or its background is transparent.
 */
export async function assertBgCompliant(
  page: import('@playwright/test').Page,
  selector: string,
  label: string,
  scheme: ColorScheme,
): Promise<void> {
  const color = await getComputedProp(page, selector, 'backgroundColor');
  if (!color || isTransparent(color)) return;
  const rgb = parseRgb(color);
  expect(rgb, `${label} bg: could not parse "${color}"`).not.toBeNull();
  const max = Math.max(...rgb!);
  const direction =
    scheme === 'dark'
      ? `too bright for dark mode (max channel ${max} ≥ 200)`
      : `too dark for light mode (max channel ${max} ≤ 100)`;
  expect(
    bgIsCompliant(rgb!, scheme),
    `${label}: background "${color}" is ${direction}. ` +
      (scheme === 'dark'
        ? 'Add @media (prefers-color-scheme: dark) token overrides.'
        : 'Ensure dark-mode token overrides are not leaking into light mode.'),
  ).toBe(true);
}

/**
 * Assert that the text color of `selector` is readable for `scheme`.
 * Silently skips when the element is absent or its color is transparent.
 */
export async function assertFgCompliant(
  page: import('@playwright/test').Page,
  selector: string,
  label: string,
  scheme: ColorScheme,
): Promise<void> {
  const color = await getComputedProp(page, selector, 'color');
  if (!color || isTransparent(color)) return;
  const rgb = parseRgb(color);
  expect(rgb, `${label} fg: could not parse "${color}"`).not.toBeNull();
  const max = Math.max(...rgb!);
  const direction =
    scheme === 'dark'
      ? `near-black text in dark mode (max channel ${max} ≤ 80) — invisible on dark bg`
      : `near-white text in light mode (max channel ${max} ≥ 240) — invisible on light bg`;
  expect(
    fgIsCompliant(rgb!, scheme),
    `${label}: text color "${color}" is ${direction}. ` +
      (scheme === 'dark'
        ? 'Check --ink / color token dark-mode overrides.'
        : 'Ensure light-mode text tokens are not overridden by dark values.'),
  ).toBe(true);
}

/**
 * Backwards-compatible alias used by dark-mode.spec.ts.
 * Asserts that background of `selector` is dark (max channel < 200),
 * or transparent (which is acceptable — it inherits the dark body colour).
 */
export async function assertBgIsDark(
  page: import('@playwright/test').Page,
  selector: string,
  label: string,
): Promise<void> {
  const color: string = await page.$eval(selector, el =>
    getComputedStyle(el).backgroundColor,
  );
  if (isTransparent(color)) return;
  const rgb = parseRgb(color);
  expect(rgb, `${label}: could not parse background colour "${color}"`).not.toBeNull();
  expect(
    rgb![0] < 200 && rgb![1] < 200 && rgb![2] < 200,
    `${label}: background "${color}" is too bright for dark mode ` +
      `(max channel ${Math.max(...rgb!)} ≥ 200)`,
  ).toBe(true);
}

// ── Parameterised smoke-test factories ────────────────────────────────────────

/**
 * Register a two-test dark-mode smoke check for `slug`.
 *
 * Call this at module scope in any `*.spec.ts` file — it expands to a
 * `test.describe` block with a `colorScheme: 'dark'` override and two tests:
 *   1. body + header backgrounds are dark
 *   2. common component backgrounds are dark (best-effort, skips if absent)
 *
 * Example (add a new page in one line):
 *
 *   smokeTestPageDarkMode('my-new-page');
 *
 * The slug is used as the URL path (`/my-new-page/`) and as the test label.
 */
export function smokeTestPageDarkMode(slug: string): void {
  const COMPONENT_SELECTORS: Array<[string, string]> = [
    ['.callout', '.callout'],
    ['.card', '.card'],
    ['.dose-card', '.dose-card'],
    ['.panel', '.panel'],
    ['.criterion', '.criterion'],
    ['.tag', '.tag'],
    ['.drug-tag', '.drug-tag'],
    ['.badge', '.badge'],
    ['.sec-letter', '.sec-letter'],
  ];

  test.describe(`${slug} – dark-mode smoke test`, () => {
    test.use({ colorScheme: 'dark' });

    test('body and header have dark backgrounds', async ({ page }) => {
      await page.goto(`/${slug}/`);
      await page.waitForLoadState('domcontentloaded');
      await assertBgCompliant(page, 'body', `${slug} body`, 'dark');
      await assertBgCompliant(page, 'header.app-header', `${slug} header.app-header`, 'dark');
      await assertBgCompliant(page, 'header:not(.app-header)', `${slug} header (generic)`, 'dark');
    });

    test('component backgrounds are dark when present', async ({ page }) => {
      await page.goto(`/${slug}/`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(800);
      for (const [sel, label] of COMPONENT_SELECTORS) {
        await assertBgCompliant(page, sel, `${slug} ${label}`, 'dark');
      }
    });
  });
}

/**
 * Register dark-mode AND light-mode smoke checks for `slug`.
 *
 * This is the dual-scheme variant of `smokeTestPageDarkMode`.  It checks that:
 *   • In dark mode  — backgrounds are not near-white (max channel < 200)
 *   • In light mode — backgrounds are not near-black (max channel > 100)
 *
 * Example:
 *
 *   smokeTestPage('my-new-page');
 */
export function smokeTestPage(slug: string): void {
  const SCHEMES: ColorScheme[] = ['dark', 'light'];
  const COMPONENT_SELECTORS: Array<[string, string]> = [
    ['.callout', '.callout'],
    ['.card', '.card'],
    ['.dose-card', '.dose-card'],
    ['.panel', '.panel'],
    ['.criterion', '.criterion'],
    ['.tag', '.tag'],
    ['.drug-tag', '.drug-tag'],
    ['.badge', '.badge'],
    ['.sec-letter', '.sec-letter'],
  ];

  for (const scheme of SCHEMES) {
    test.describe(`${slug} – ${scheme}-mode smoke test`, () => {
      test.use({ colorScheme: scheme });

      test('body and header backgrounds are scheme-appropriate', async ({ page }) => {
        await page.goto(`/${slug}/`);
        await page.waitForLoadState('domcontentloaded');
        await assertBgCompliant(page, 'body', `${slug} body`, scheme);
        await assertBgCompliant(page, 'header.app-header', `${slug} header.app-header`, scheme);
        await assertBgCompliant(page, 'header:not(.app-header)', `${slug} header (generic)`, scheme);
      });

      test('component backgrounds are scheme-appropriate when present', async ({ page }) => {
        await page.goto(`/${slug}/`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(800);
        for (const [sel, label] of COMPONENT_SELECTORS) {
          await assertBgCompliant(page, sel, `${slug} ${label}`, scheme);
        }
      });
    });
  }
}
