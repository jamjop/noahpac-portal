/**
 * ND Antibiogram – Playwright regression tests.
 *
 * Covers the shared.css failure resilience requirement: antibiogram/style.css
 * defines its own fallback :root tokens so the page must remain fully usable
 * (facility selector, gram-stain tabs, and susceptibility table visible) even
 * when shared.css fails to load.
 */

import { test, expect } from '@playwright/test';

const ANTIBIOGRAM_URL = '/antibiogram/';

test.describe('ND Antibiogram – shared.css failure resilience', () => {

  // ── shared.css failure resilience ─────────────────────────────────────────
  //
  // Simulates a broken connection to shared.css by aborting the network
  // request.  antibiogram/style.css defines its own fallback :root tokens so
  // the page must remain functional: facility select, gram tabs, and the table
  // wrapper all visible without the shared token definitions.

  test('page stays usable when shared.css fails to load', async ({ page }) => {
    await page.route('**/shared.css', route => route.abort());

    await page.goto(ANTIBIOGRAM_URL);

    // Facility selector must render and be interactive
    await expect(page.locator('#facility-select')).toBeVisible();
    await expect(page.locator('#facility-select')).toBeEnabled();

    // Gram-stain tab strip must render (depends on --line / --purple tokens)
    await expect(page.locator('.gram-tabs')).toBeVisible();

    // Susceptibility table container must be visible (depends on --surface /
    // --sh tokens for background and shadow — invisible if tokens are missing)
    await expect(page.locator('.tbl-wrap')).toBeVisible();
  });

});
