/**
 * Empiric Therapy Tool – Playwright regression tests.
 *
 * Covers the "done looks like" criteria from the task:
 *  1. When ALL facility data files return HTTP errors, a visible error message appears.
 *  2. When SOME facility files fail (others succeed), a visible warning appears.
 *  3. When a facility file returns malformed JSON, the tool shows a visible warning
 *     (not a silent empty table or uncaught crash).
 *  4. The manifest failure path still shows an error (regression guard).
 *
 * These tests route requests via page.route() so no real server data is needed.
 */

import { test, expect } from '@playwright/test';

const EMPIRIC_URL = '/empiric/';

const VALID_MANIFEST = JSON.stringify({ facilities: ['fac_a', 'fac_b'] });

const VALID_FAC_A = JSON.stringify({
  id: 'fac_a',
  name: 'Test Hospital A',
  location: 'Test City, ND',
  period: '2024',
  organisms: [
    { name: 'E. coli', s: { cip: 72, sxt: 68 } },
  ],
});

const VALID_FAC_B = JSON.stringify({
  id: 'fac_b',
  name: 'Test Hospital B',
  location: 'Other City, ND',
  period: '2024',
  organisms: [
    { name: 'E. coli', s: { cip: 80, sxt: 75 } },
  ],
});

test.describe('Empiric Therapy Tool – data-load error states', () => {

  // ── 1. All facility files fail → visible error ───────────────────────────

  test('shows visible error when ALL facility data files fail to load', async ({ page }) => {
    await page.route('**/antibiogram/data/manifest.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: VALID_MANIFEST })
    );
    await page.route('**/antibiogram/data/fac_a.json', route =>
      route.fulfill({ status: 500 })
    );
    await page.route('**/antibiogram/data/fac_b.json', route =>
      route.fulfill({ status: 404 })
    );

    await page.goto(EMPIRIC_URL);

    const errEl = page.locator('.state.err');
    await expect(errEl).toBeVisible({ timeout: 10_000 });
    const text = await errEl.textContent();
    expect(text!.toLowerCase()).toMatch(/could not load/);
  });

  // ── 2. Some facility files fail → visible warning ────────────────────────

  test('shows visible warning when SOME facility data files fail to load', async ({ page }) => {
    await page.route('**/antibiogram/data/manifest.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: VALID_MANIFEST })
    );
    await page.route('**/antibiogram/data/fac_a.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: VALID_FAC_A })
    );
    await page.route('**/antibiogram/data/fac_b.json', route =>
      route.fulfill({ status: 500 })
    );

    await page.goto(EMPIRIC_URL);

    const warnEl = page.locator('#load-warning');
    await expect(warnEl).toBeVisible({ timeout: 10_000 });
    const text = await warnEl.textContent();
    expect(text).toContain('fac_b');
  });

  // ── 3. Malformed JSON → warning (not crash / silent empty table) ──────────

  test('shows visible warning when a facility file returns malformed JSON', async ({ page }) => {
    await page.route('**/antibiogram/data/manifest.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: VALID_MANIFEST })
    );
    await page.route('**/antibiogram/data/fac_a.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: VALID_FAC_A })
    );
    await page.route('**/antibiogram/data/fac_b.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"broken":true}' })
    );

    await page.goto(EMPIRIC_URL);

    const warnEl = page.locator('#load-warning');
    await expect(warnEl).toBeVisible({ timeout: 10_000 });
    const text = await warnEl.textContent();
    expect(text).toContain('fac_b');
  });

  // ── 4. Manifest failure → visible error (regression guard) ───────────────

  test('shows visible error when the manifest itself fails to load', async ({ page }) => {
    await page.route('**/antibiogram/data/manifest.json', route =>
      route.fulfill({ status: 503 })
    );

    await page.goto(EMPIRIC_URL);

    const errEl = page.locator('.state.err');
    await expect(errEl).toBeVisible({ timeout: 10_000 });
    const text = await errEl.textContent();
    expect(text!.toLowerCase()).toMatch(/manifest/);
  });

  // ── 5. Happy path: normal load renders the regimen table ─────────────────

  test('renders the regimen table when both facility files load successfully', async ({ page }) => {
    await page.route('**/antibiogram/data/manifest.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: VALID_MANIFEST })
    );
    await page.route('**/antibiogram/data/fac_a.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: VALID_FAC_A })
    );
    await page.route('**/antibiogram/data/fac_b.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: VALID_FAC_B })
    );

    await page.goto(EMPIRIC_URL);

    await expect(page.locator('.reg-tbl')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#load-warning')).not.toBeVisible();
  });

});
