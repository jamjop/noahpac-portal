/**
 * Dark-mode AND light-mode floor check — auto-discovered pages.
 *
 * This file is intentionally generic: it auto-discovers every page directory
 * that contains both `index.html` and `style.css`, then for each page runs two
 * passes — one with `prefers-color-scheme: dark` and one with `light` — and
 * asserts that key structural and component-level elements have backgrounds AND
 * foreground text colors appropriate for the active scheme.
 *
 * WHY THIS EXISTS
 * ───────────────
 * `dark-mode.spec.ts` has detailed per-page tests for the known page set, but
 * it requires a manual update when a new page is added.  This file is the
 * safety net: any new page directory with HTML + CSS is automatically included,
 * so missing `@media (prefers-color-scheme: dark)` blocks — or token cascades
 * that silently undo shared.css's overrides — are caught before they ship.
 *
 * WHAT IS CHECKED
 * ───────────────
 * Structural selectors — background only, checked on every discovered page:
 *   body, header.app-header, header
 *
 * Component selectors — background + foreground text, checked when present:
 *   .callout               – clinical callout / alert boxes
 *   .card, .dose-card,     – card / panel surfaces
 *   .criterion, .panel
 *   .tag, .drug-tag        – drug / label tags
 *   .badge, .sec-badge,    – section-letter / category badges
 *   .sec-letter
 *
 * THRESHOLDS
 * ──────────
 * Background (both schemes):
 *   dark  mode → max RGB channel < 200  (≥ 200 → too close to white, FAIL)
 *   light mode → max RGB channel > 100  (≤ 100 → too close to black, FAIL)
 *
 * Foreground text (dark mode only):
 *   dark  mode → max RGB channel > 80   (≤ 80  → near-black text invisible on dark bg, FAIL)
 *   light mode → NOT checked — badge/tag chips intentionally use white text on
 *                dark-colored backgrounds in both schemes, so any fixed threshold
 *                would produce false positives without a full contrast-ratio check.
 *
 * Transparent (rgba(0,0,0,0)) values are always skipped.
 *
 * IGNORED DIRECTORIES
 * ───────────────────
 * Build/tooling dirs and pages that require API mocking (empiric — covered by
 * dark-mode.spec.ts) are excluded.
 */

import { test, expect } from '@playwright/test';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Filesystem discovery ──────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const IGNORED_DIRS = new Set([
  'node_modules', '.local', 'artifacts', 'scripts', 'var', 'assets',
  'tests', 'test', 'lib', '.git', 'mockup', 'attached_assets',
  '.agents', '.cache', '.config', '.github',
]);

/** Pages that require network mocking or special setup; covered by dark-mode.spec.ts. */
const SKIP_PAGES = new Set(['empiric']);

function discoverPages(root: string): string[] {
  const pages: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(root);
  } catch {
    return pages;
  }
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry) || entry.startsWith('.')) continue;
    const full = join(root, entry);
    try {
      if (!statSync(full).isDirectory()) continue;
    } catch {
      continue;
    }
    if (SKIP_PAGES.has(entry)) continue;
    if (existsSync(join(full, 'index.html')) && existsSync(join(full, 'style.css'))) {
      pages.push(entry);
    }
  }
  return pages.sort();
}

const discoveredPages = discoverPages(projectRoot);

// ── Colour helpers ────────────────────────────────────────────────────────────

type ColorScheme = 'light' | 'dark';

function parseRgb(color: string): [number, number, number] | null {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

function isTransparent(color: string): boolean {
  return /rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(color) || color === 'transparent';
}

/**
 * True when the background is appropriate for the scheme:
 *   dark  → max channel < 200 (not near-white)
 *   light → max channel > 100 (not near-black)
 */
function bgIsCompliant(rgb: [number, number, number], scheme: ColorScheme): boolean {
  const max = Math.max(...rgb);
  return scheme === 'dark' ? max < 200 : max > 100;
}

/**
 * True when the foreground text color is readable for the scheme:
 *   dark  → max channel > 80  (near-black text is invisible on dark bg)
 *   light → max channel < 240 (near-white text is invisible on light bg)
 */
function fgIsCompliant(rgb: [number, number, number], scheme: ColorScheme): boolean {
  const max = Math.max(...rgb);
  return scheme === 'dark' ? max > 80 : max < 240;
}

/** Evaluate a CSS property on the first matching element, or null if absent. */
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

/**
 * Assert background-color of `selector` is scheme-appropriate.
 * Silently skips if the element is absent or transparent.
 */
async function assertBgCompliant(
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
  const direction = scheme === 'dark'
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
 * Assert text color (foreground) of `selector` is readable for the scheme.
 * Silently skips if the element is absent, transparent, or not present.
 */
async function assertFgCompliant(
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
  const direction = scheme === 'dark'
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

// ── Selector lists ────────────────────────────────────────────────────────────

/** Structural selectors expected on every page — background only. */
const STRUCTURAL_SELECTORS: Array<[string, string]> = [
  ['body', 'body'],
  ['header.app-header', 'header.app-header'],
  ['header:not(.app-header)', 'header (generic)'],
];

/**
 * Component selectors probed for both background AND foreground text.
 * All are best-effort — silently skipped when the element is absent.
 * These are the classes most likely to expose bright-background or
 * invisible-text regressions when a token value changes.
 */
const COMPONENT_SELECTORS: Array<[string, string]> = [
  // Clinical callout / alert boxes
  ['.callout', '.callout'],
  // Card / panel surfaces
  ['.card', '.card'],
  ['.dose-card', '.dose-card'],
  ['.criterion', '.criterion'],
  ['.panel', '.panel'],
  // Drug / label tags
  ['.tag', '.tag'],
  ['.drug-tag', '.drug-tag'],
  // Category / section badges
  ['.badge', '.badge'],
  ['.sec-badge', '.sec-badge'],
  ['.sec-letter', '.sec-letter'],
];

// ── Tests (generated per discovered page × color scheme) ─────────────────────

const SCHEMES: ColorScheme[] = ['light', 'dark'];

for (const slug of discoveredPages) {
  for (const scheme of SCHEMES) {
    test.describe(`${slug} – ${scheme}-mode floor check`, () => {
      test.use({ colorScheme: scheme });

      test('structural backgrounds are scheme-appropriate', async ({ page }) => {
        await page.goto(`/${slug}/`);
        await page.waitForLoadState('domcontentloaded');
        for (const [sel, label] of STRUCTURAL_SELECTORS) {
          await assertBgCompliant(page, sel, `${slug} ${label}`, scheme);
        }
      });

      test('component backgrounds and text colors are scheme-appropriate when present', async ({ page }) => {
        await page.goto(`/${slug}/`);
        await page.waitForLoadState('domcontentloaded');
        // Allow JS-driven pages a short window to inject dynamic elements.
        await page.waitForTimeout(800);

        for (const [sel, label] of COMPONENT_SELECTORS) {
          await assertBgCompliant(page, sel, `${slug} ${label}`, scheme);
          // Foreground text is only checked in dark mode.
          // Badge/tag chips intentionally use white text on dark-colored backgrounds
          // in both schemes, so a light-mode foreground threshold would produce false
          // positives.  The real risk — dark text becoming invisible on a dark bg —
          // only exists in dark mode.
          if (scheme === 'dark') {
            await assertFgCompliant(page, sel, `${slug} ${label}`, scheme);
          }
        }
      });
    });
  }
}
