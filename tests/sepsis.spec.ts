/**
 * Sepsis Screening Tool – Playwright regression tests.
 *
 * Covers the shared.css failure resilience requirement: sepsis/style.css
 * defines its own fallback :root tokens so the page must remain fully usable
 * (qSOFA / SOFA panels visible, checkboxes interactive) even when shared.css
 * fails to load.
 */

import { test, expect } from '@playwright/test';

const SEPSIS_URL = '/sepsis/';

test.describe('Sepsis Screening – shared.css failure resilience', () => {

  // ── shared.css failure resilience ─────────────────────────────────────────
  //
  // Simulates a broken connection to shared.css by aborting the network
  // request.  sepsis/style.css defines its own fallback :root tokens so the
  // page must remain functional: key structural panels visible and the
  // qSOFA / SOFA controls still interactive.

  test('page stays usable when shared.css fails to load', async ({ page }) => {
    await page.route('**/shared.css', route => route.abort());

    await page.goto(SEPSIS_URL);

    // Main layout panel must be visible without shared.css tokens
    await expect(page.locator('.page-body')).toBeVisible();

    // qSOFA score badge must be visible (not hidden by missing color tokens)
    await expect(page.locator('#qsofa-badge')).toBeVisible();

    // qSOFA checkbox list must render and checkboxes must be interactive
    await expect(page.locator('#qsofa-checks')).toBeVisible();
    const firstCheck = page.locator('#qsofa-checks input[type=checkbox]').first();
    await expect(firstCheck).toBeVisible();
    await expect(firstCheck).toBeEnabled();

    // SOFA score badge must also be visible
    await expect(page.locator('#sofa-badge')).toBeVisible();
  });

});
