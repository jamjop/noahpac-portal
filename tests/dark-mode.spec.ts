/**
 * Dark-mode visual regression tests for all reference pages.
 *
 * Each test navigates to a page with `prefers-color-scheme: dark` emulated,
 * then asserts that the key structural elements (body, header, cards, callouts,
 * table headers) do NOT have bright/white backgrounds.
 *
 * A background is considered "bright" when all three RGB channels exceed 200,
 * i.e. close to white (255, 255, 255). Transparent backgrounds are skipped —
 * they inherit the dark body colour and are not a problem.
 *
 * Pages covered: als, pals, tccc, sepsis, opioids, vaccines, labs, empiric,
 * lookup, allergy.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ADDING A NEW PAGE
 * ─────────────────────────────────────────────────────────────────────────────
 * Option A (automatic — zero changes needed):
 *   Any page directory that ships with both `index.html` and `style.css` is
 *   automatically covered by `dark-mode-new-pages.spec.ts`.  No edit required.
 *
 * Option B (explicit one-liner):
 *   Import `smokeTestPageDarkMode` from `./dark-mode-helpers.js` and call it
 *   at module scope:
 *
 *     import { smokeTestPageDarkMode } from './dark-mode-helpers.js';
 *     smokeTestPageDarkMode('my-new-page');
 *
 * Option C (full custom suite):
 *   Use the shared helpers below (assertBgIsDark, assertBgCompliant, etc.) to
 *   write detailed per-page interaction tests, just like the blocks below.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import {
  parseRgb,
  isTransparent,
  assertBgIsDark,
  assertBgCompliant,
  waitForSelector,
  waitForChildren,
} from './dark-mode-helpers.js';

// ── shared setup ─────────────────────────────────────────────────────────────

test.use({ colorScheme: 'dark' });

// ── ALS ──────────────────────────────────────────────────────────────────────

test.describe('ALS page – dark mode', () => {
  test('body and header have dark backgrounds', async ({ page }) => {
    await page.goto('/als/');
    await page.waitForLoadState('domcontentloaded');
    await assertBgIsDark(page, 'body', 'als body');
    await assertBgIsDark(page, 'header.app-header', 'als header');
  });

  test('step cards and callouts have dark backgrounds after tab click', async ({ page }) => {
    await page.goto('/als/');
    // Wait for app.js to inject at least one tab button into #tabNav
    await waitForChildren(page, '#tabNav');
    await page.locator('#tabNav .tab-btn').first().click();
    // Wait for content pane to have rendered children
    await waitForChildren(page, '#content');

    const stepCards = page.locator('.steps li');
    if (await stepCards.count() > 0) {
      await assertBgIsDark(page, '.steps li', 'als .steps li');
    }

    const callouts = page.locator('.callout');
    if (await callouts.count() > 0) {
      const color: string = await callouts.first().evaluate(el => getComputedStyle(el).backgroundColor);
      if (!isTransparent(color)) {
        const rgb = parseRgb(color);
        expect(rgb).not.toBeNull();
        expect(rgb![0] < 200 && rgb![1] < 200 && rgb![2] < 200, `als .callout: background "${color}" is too bright`).toBe(true);
      }
    }
  });
});

// ── PALS ─────────────────────────────────────────────────────────────────────

test.describe('PALS page – dark mode', () => {
  test('body and header have dark backgrounds', async ({ page }) => {
    await page.goto('/pals/');
    await page.waitForLoadState('domcontentloaded');
    await assertBgIsDark(page, 'body', 'pals body');
    await assertBgIsDark(page, 'header.app-header', 'pals header');
  });

  test('drug-table th has dark background after content loads', async ({ page }) => {
    await page.goto('/pals/');
    await waitForChildren(page, '#tabNav');
    await page.locator('#tabNav .tab-btn').first().click();
    await waitForChildren(page, '#content');

    const th = page.locator('.drug-table th');
    if (await th.count() > 0) {
      await assertBgIsDark(page, '.drug-table th', 'pals .drug-table th');
    }
  });
});

// ── TCCC ─────────────────────────────────────────────────────────────────────

test.describe('TCCC page – dark mode', () => {
  test('body and header have dark backgrounds', async ({ page }) => {
    await page.goto('/tccc/');
    await page.waitForLoadState('domcontentloaded');
    await assertBgIsDark(page, 'body', 'tccc body');
    await assertBgIsDark(page, 'header.app-header', 'tccc header');
  });

  test('sec-letter badges have dark backgrounds after content loads', async ({ page }) => {
    await page.goto('/tccc/');
    await waitForChildren(page, '#tabNav');
    await page.locator('#tabNav .tab-btn').first().click();
    await waitForChildren(page, '#content');

    const badge = page.locator('.sec-letter');
    if (await badge.count() > 0) {
      await assertBgIsDark(page, '.sec-letter', 'tccc .sec-letter');
    }
  });
});

// ── SEPSIS ───────────────────────────────────────────────────────────────────

test.describe('Sepsis page – dark mode', () => {
  test('body and header have dark backgrounds', async ({ page }) => {
    await page.goto('/sepsis/');
    await page.waitForLoadState('domcontentloaded');
    await assertBgIsDark(page, 'body', 'sepsis body');
    await assertBgIsDark(page, 'header.app-header', 'sepsis header');
  });

  test('result box uses dark soft-colour background after checkbox interaction', async ({ page }) => {
    await page.goto('/sepsis/');
    // Wait for the criterion checkboxes to exist (static HTML)
    await waitForSelector(page, '#q-rr');
    await page.check('#q-rr');
    await page.check('#q-ams');

    // Wait for result box to be rendered with content
    await page.waitForFunction(
      () => {
        const el = document.querySelector('#qsofa-result');
        return el && el.textContent && el.textContent.trim().length > 0;
      },
      { timeout: 5_000 },
    );

    const color: string = await page.$eval('#qsofa-result', el => getComputedStyle(el).backgroundColor);
    if (!isTransparent(color)) {
      const rgb = parseRgb(color);
      expect(rgb, `sepsis #qsofa-result: could not parse "${color}"`).not.toBeNull();
      expect(rgb![0] < 200 && rgb![1] < 200 && rgb![2] < 200, `sepsis #qsofa-result: background "${color}" is too bright`).toBe(true);
    }
  });
});

// ── OPIOIDS ──────────────────────────────────────────────────────────────────

test.describe('Opioids page – dark mode', () => {
  test('body and header have dark backgrounds', async ({ page }) => {
    await page.goto('/opioids/');
    await page.waitForLoadState('domcontentloaded');
    await assertBgIsDark(page, 'body', 'opioids body');
    await assertBgIsDark(page, 'header.app-header', 'opioids header');
  });

  test('form select inputs have dark backgrounds in dark mode', async ({ page }) => {
    await page.goto('/opioids/');
    // Wait for app.js to populate #fromDrug options
    await page.waitForFunction(
      () => (document.querySelector('#fromDrug')?.childElementCount ?? 0) > 0,
      { timeout: 10_000 },
    );
    // .field select → background:var(--surface) override in dark mode
    await assertBgIsDark(page, '.field select', 'opioids .field select');
  });
});

// ── VACCINES ─────────────────────────────────────────────────────────────────

test.describe('Vaccines page – dark mode', () => {
  test('body and panel have dark backgrounds', async ({ page }) => {
    await page.goto('/vaccines/');
    await page.waitForLoadState('domcontentloaded');
    await assertBgIsDark(page, 'body', 'vaccines body');
    // .wrap and .panel are in static HTML
    await waitForSelector(page, '.panel');
    await assertBgIsDark(page, '.panel', 'vaccines .panel');
  });

  test('unit-toggle has dark background in dark mode', async ({ page }) => {
    await page.goto('/vaccines/');
    await waitForSelector(page, '.unit-toggle');
    // .unit-toggle → background:var(--surface) in dark mode
    await assertBgIsDark(page, '.unit-toggle', 'vaccines .unit-toggle');
  });
});

// ── LABS ─────────────────────────────────────────────────────────────────────

test.describe('Labs page – dark mode', () => {
  test('body and header have dark backgrounds', async ({ page }) => {
    await page.goto('/labs/');
    await page.waitForLoadState('domcontentloaded');
    await assertBgIsDark(page, 'body', 'labs body');
    await assertBgIsDark(page, 'header.app-header', 'labs header');
  });

  test('lab-table th has dark background after content renders', async ({ page }) => {
    await page.goto('/labs/');
    // app.js renders LABS data into #labContent on DOMContentLoaded
    await waitForChildren(page, '#labContent');

    const th = page.locator('.lab-table th');
    if (await th.count() > 0) {
      // .lab-table th → background:var(--surface) override in dark mode
      await assertBgIsDark(page, '.lab-table th', 'labs .lab-table th');
    }
  });
});

// ── EMPIRIC ──────────────────────────────────────────────────────────────────

const EMPIRIC_MANIFEST = JSON.stringify({ facilities: ['fac_a'] });
const EMPIRIC_FAC_A = JSON.stringify({
  id: 'fac_a',
  name: 'Test Hospital A',
  location: 'Test City, ND',
  period: '2024',
  organisms: [
    { name: 'E. coli', s: { cip: 72, sxt: 68 } },
  ],
});

test.describe('Empiric page – dark mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/antibiogram/data/manifest.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: EMPIRIC_MANIFEST }),
    );
    await page.route('**/antibiogram/data/fac_a.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: EMPIRIC_FAC_A }),
    );
  });

  test('body has dark background', async ({ page }) => {
    await page.goto('/empiric/');
    await page.waitForLoadState('domcontentloaded');
    await assertBgIsDark(page, 'body', 'empiric body');
  });

  test('reg-tbl th has dark background', async ({ page }) => {
    await page.goto('/empiric/');
    await waitForSelector(page, '.reg-tbl');
    // .reg-tbl th → background:var(--surface) override in dark mode
    await assertBgIsDark(page, '.reg-tbl th', 'empiric .reg-tbl th');
  });

  test('susceptibility cells have dark soft-colour backgrounds after organism selection', async ({ page }) => {
    await page.goto('/empiric/');
    await waitForSelector(page, '.org-btn');
    await page.locator('.org-btn').first().click();

    await page.waitForFunction(
      () => !!document.querySelector('.susc-hi, .susc-mid, .susc-lo'),
      { timeout: 5_000 },
    );

    const color: string = await page.$eval(
      '.susc-hi, .susc-mid, .susc-lo',
      el => getComputedStyle(el).backgroundColor,
    );
    if (!isTransparent(color)) {
      const rgb = parseRgb(color);
      expect(rgb, `empiric susc cell: could not parse "${color}"`).not.toBeNull();
      expect(rgb![0] < 200 && rgb![1] < 200 && rgb![2] < 200, `empiric susc cell: background "${color}" is too bright`).toBe(true);
    }
  });
});

// ── LOOKUP ───────────────────────────────────────────────────────────────────

test.describe('Lookup page – dark mode', () => {
  test('body and search panel have dark backgrounds', async ({ page }) => {
    await page.goto('/lookup/');
    await page.waitForLoadState('domcontentloaded');
    await assertBgIsDark(page, 'body', 'lookup body');
    await waitForSelector(page, '.search-panel');
    await assertBgIsDark(page, '.search-panel', 'lookup .search-panel');
  });

  test('initial state message has dark background', async ({ page }) => {
    await page.goto('/lookup/');
    await waitForSelector(page, '#results .state');
    await assertBgIsDark(page, '#results .state', 'lookup #results .state');
  });
});

// ── ALLERGY ──────────────────────────────────────────────────────────────────

test.describe('Allergy page – dark mode', () => {
  test('body and header have dark backgrounds', async ({ page }) => {
    await page.goto('/allergy/');
    await page.waitForLoadState('domcontentloaded');
    await assertBgIsDark(page, 'body', 'allergy body');
    await assertBgIsDark(page, 'header.app-header', 'allergy header');
  });

  test('cross-reactivity reference table th has dark background', async ({ page }) => {
    await page.goto('/allergy/');
    await waitForSelector(page, '.ref-tbl th');
    await assertBgIsDark(page, '.ref-tbl th', 'allergy .ref-tbl th');
  });

  test('result boxes use dark soft-colour backgrounds after selection', async ({ page }) => {
    await page.goto('/allergy/');
    // Wait for seg buttons (populated by app.js)
    await waitForChildren(page, '#seg-allergy');
    await waitForChildren(page, '#seg-proposed');

    await page.locator('#seg-allergy .seg-btn').first().click();
    await page.locator('#seg-proposed .seg-btn').first().click();

    await page.waitForFunction(
      () => !!document.querySelector('.res-ok, .res-warn, .res-crit'),
      { timeout: 5_000 },
    );

    const color: string = await page.$eval(
      '.res-ok, .res-warn, .res-crit',
      el => getComputedStyle(el).backgroundColor,
    );
    if (!isTransparent(color)) {
      const rgb = parseRgb(color);
      expect(rgb, `allergy result box: could not parse "${color}"`).not.toBeNull();
      expect(rgb![0] < 200 && rgb![1] < 200 && rgb![2] < 200, `allergy result box: background "${color}" is too bright`).toBe(true);
    }
  });
});

// ── NALOXONE ─────────────────────────────────────────────────────────────────

test.describe('Naloxone page – dark mode', () => {
  test('body and header have dark backgrounds', async ({ page }) => {
    await page.goto('/naloxone/');
    await page.waitForLoadState('domcontentloaded');
    await assertBgIsDark(page, 'body', 'naloxone body');
    await assertBgIsDark(page, 'header.app-header', 'naloxone header');
  });

  test('dose-card has dark background in dark mode', async ({ page }) => {
    await page.goto('/naloxone/');
    // .dose-card elements are static HTML — no tab click or data fetch needed.
    await waitForSelector(page, '.dose-card');
    // .dose-card → background:var(--bg); dark token is #0f1117
    await assertBgIsDark(page, '.dose-card', 'naloxone .dose-card');
  });
});

// ── ANTIBIOGRAM ───────────────────────────────────────────────────────────────

test.describe('Antibiogram page – dark mode', () => {
  test('body and header have dark backgrounds', async ({ page }) => {
    await page.goto('/antibiogram/');
    await page.waitForLoadState('domcontentloaded');
    await assertBgIsDark(page, 'body', 'antibiogram body');
    await assertBgIsDark(page, 'header.app-header', 'antibiogram header');
  });

  test('abgram table th has dark background after data renders', async ({ page }) => {
    await page.goto('/antibiogram/');
    // Facility data is bundled in app.js — no network mock needed.
    // Wait for app.js to inject column headers into #thead.
    await waitForChildren(page, '#thead');
    // .abgram th → background:var(--bg); dark token is #0f1117
    await assertBgIsDark(page, '.abgram th', 'antibiogram .abgram th');
  });
});

// ── EXAMPLE: adding new pages with a single call ──────────────────────────────
//
// The pages below were added with `smokeTestPageDarkMode('slug')`.
// This is Option B from the ADDING A NEW PAGE instructions at the top.
// Each call registers two tests (structural + component backgrounds).
//
// Pages already covered by auto-discovery in dark-mode-new-pages.spec.ts don't
// *need* to be listed here, but adding them explicitly gives them a stable,
// named test entry that appears clearly in CI output.

import { smokeTestPageDarkMode } from './dark-mode-helpers.js';

// Naloxone reference page — static content, no mocking required.
// The smoke test below provides generic body/header/component checks;
// the explicit describe block above adds the dose-card element check.
smokeTestPageDarkMode('naloxone');

// ABx (antibiotic quick-reference) page.
smokeTestPageDarkMode('abx');

// Wound care reference page.
smokeTestPageDarkMode('wound');
