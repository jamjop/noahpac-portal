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
 *
 * HOW TO ADD A NEW PAGE
 * ─────────────────────
 * Option A (automatic — zero changes needed):
 *   Create `<page>/index.html` and `<page>/style.css`.  The page is discovered
 *   and tested on the next test run.  No edit to this file is required.
 *
 * Option B (explicit named smoke test — one call):
 *   In any *.spec.ts file, import `smokeTestPageDarkMode` from
 *   `./dark-mode-helpers.js` and call it at module scope:
 *
 *     import { smokeTestPageDarkMode } from './dark-mode-helpers.js';
 *     smokeTestPageDarkMode('my-new-page');
 *
 * Option C (custom interaction tests):
 *   Import helpers from `./dark-mode-helpers.js` and write a full
 *   `test.describe` block, just like the blocks in `dark-mode.spec.ts`.
 */

import { test, expect } from '@playwright/test';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  type ColorScheme,
  assertBgCompliant,
  assertFgCompliant,
} from './dark-mode-helpers.js';

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
