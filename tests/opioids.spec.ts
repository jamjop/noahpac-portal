/**
 * Opioid Conversion Tool – Playwright regression tests.
 *
 * Covers the shared.css failure resilience requirement: opioids/style.css
 * defines its own fallback :root tokens so the page must remain fully usable
 * (key structural elements visible, form fields interactive) even when
 * shared.css fails to load.
 */

import { test, expect } from '@playwright/test';

const OPIOIDS_URL = '/opioids/';

test.describe('Opioid Conversion – shared.css failure resilience', () => {

  // ── shared.css failure resilience ─────────────────────────────────────────
  //
  // Simulates a broken connection to shared.css by aborting the network
  // request.  opioids/style.css defines its own fallback :root tokens so the
  // page must remain functional: key structural panels visible and the
  // drug / dose fields still usable.

  test('page stays usable when shared.css fails to load', async ({ page }) => {
    await page.route('**/shared.css', route => route.abort());

    await page.goto(OPIOIDS_URL);

    // Main layout panel must be visible without shared.css tokens
    await expect(page.locator('.page-body')).toBeVisible();

    // Current-medication selects and dose input must render and be interactive
    await expect(page.locator('#fromDrug')).toBeVisible();
    await expect(page.locator('#fromDrug')).toBeEnabled();
    await expect(page.locator('#fromDose')).toBeVisible();
    await expect(page.locator('#fromDose')).toBeEnabled();

    // Result panels must be visible (not hidden by missing color tokens)
    await expect(page.locator('#currentMme')).toBeVisible();
    await expect(page.locator('#convResult')).toBeVisible();
  });

});
