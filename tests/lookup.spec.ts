/**
 * Code & Drug Lookup Tool – Playwright regression tests.
 *
 * Covers the shared.css failure resilience requirement: lookup/style.css
 * defines its own fallback :root tokens so the page must remain fully usable
 * (search input visible, tab pills rendered) even when shared.css fails to
 * load.
 */

import { test, expect } from '@playwright/test';

const LOOKUP_URL = '/lookup/';

test.describe('Code & Drug Lookup – shared.css failure resilience', () => {

  // ── shared.css failure resilience ─────────────────────────────────────────
  //
  // Simulates a broken connection to shared.css by aborting the network
  // request.  lookup/style.css defines its own fallback :root tokens so the
  // page must remain functional: the search panel, input, and tab pills all
  // visible and the input interactive.

  test('page stays usable when shared.css fails to load', async ({ page }) => {
    await page.route('**/shared.css', route => route.abort());

    await page.goto(LOOKUP_URL);

    // Main content area must be visible without shared.css tokens
    await expect(page.locator('.content')).toBeVisible();

    // Search input must render and accept focus
    await expect(page.locator('#q')).toBeVisible();
    await expect(page.locator('#q')).toBeEnabled();

    // Tab pills (ICD-10 / RxTerms / LOINC) must render
    await expect(page.locator('#tabs')).toBeVisible();
  });

});
