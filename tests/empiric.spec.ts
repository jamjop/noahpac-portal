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

// A facility whose period ended well over 60 days ago (Q1 2020 = Mar 31 2020).
const STALE_FAC_A = JSON.stringify({
  id: 'fac_a',
  name: 'Test Hospital A',
  location: 'Test City, ND',
  period: '2020-Q1',
  organisms: [
    { name: 'E. coli', s: { cip: 72, sxt: 68 } },
  ],
});

// Build a period string that is current (within 60 days of today) so we can
// confirm NO stale banner for fresh data.  We use a YYYY-Q# value whose end
// date is at most a few days ago by computing this quarter.
function currentQuarterPeriod(): string {
  const now  = new Date();
  const year = now.getFullYear();
  const q    = Math.ceil((now.getMonth() + 1) / 3);
  return `${year}-Q${q}`;
}

const FRESH_FAC_A = JSON.stringify({
  id: 'fac_a',
  name: 'Test Hospital A',
  location: 'Test City, ND',
  period: currentQuarterPeriod(),
  organisms: [
    { name: 'E. coli', s: { cip: 72, sxt: 68 } },
  ],
});

const FRESH_FAC_B = JSON.stringify({
  id: 'fac_b',
  name: 'Test Hospital B',
  location: 'Other City, ND',
  period: currentQuarterPeriod(),
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

test.describe('Empiric Therapy Tool – stale-data warning', () => {

  // ── 6. Old period → stale-data banner visible ────────────────────────────

  test('shows stale-data warning when a facility period is more than 60 days old', async ({ page }) => {
    await page.route('**/antibiogram/data/manifest.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: VALID_MANIFEST })
    );
    // fac_a has period '2020-Q1' (ended Mar 31 2020 — well over 60 days ago)
    await page.route('**/antibiogram/data/fac_a.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: STALE_FAC_A })
    );
    await page.route('**/antibiogram/data/fac_b.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: VALID_FAC_B })
    );

    await page.goto(EMPIRIC_URL);

    const staleEl = page.locator('#stale-warning');
    await expect(staleEl).toBeVisible({ timeout: 10_000 });
    const text = await staleEl.textContent();
    expect(text!.toLowerCase()).toMatch(/outdated/);
    expect(text).toContain('Test Hospital A');
  });

  // ── 7. Both facilities stale → banner lists both ─────────────────────────

  test('lists all stale facilities in the warning banner', async ({ page }) => {
    const STALE_FAC_B = JSON.stringify({
      id: 'fac_b',
      name: 'Test Hospital B',
      location: 'Other City, ND',
      period: '2019',
      organisms: [{ name: 'E. coli', s: { cip: 80 } }],
    });

    await page.route('**/antibiogram/data/manifest.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: VALID_MANIFEST })
    );
    await page.route('**/antibiogram/data/fac_a.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: STALE_FAC_A })
    );
    await page.route('**/antibiogram/data/fac_b.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: STALE_FAC_B })
    );

    await page.goto(EMPIRIC_URL);

    const staleEl = page.locator('#stale-warning');
    await expect(staleEl).toBeVisible({ timeout: 10_000 });
    const text = await staleEl.textContent();
    expect(text).toContain('Test Hospital A');
    expect(text).toContain('Test Hospital B');
  });

  // ── 8. Current-quarter period → no stale banner ──────────────────────────

  test('does NOT show stale-data warning when facility period is within 60 days', async ({ page }) => {
    await page.route('**/antibiogram/data/manifest.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: VALID_MANIFEST })
    );
    await page.route('**/antibiogram/data/fac_a.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: FRESH_FAC_A })
    );
    await page.route('**/antibiogram/data/fac_b.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: FRESH_FAC_B })
    );

    await page.goto(EMPIRIC_URL);

    await expect(page.locator('.reg-tbl')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#stale-warning')).not.toBeVisible();
  });

  // ── shared.css failure resilience ─────────────────────────────────────────
  //
  // Simulates a broken connection to shared.css by aborting the network
  // request.  empiric/style.css defines its own fallback :root tokens so the
  // page must remain functional: key structural panels visible and the
  // facility / site selectors still usable.

  test('page stays usable when shared.css fails to load', async ({ page }) => {
    await page.route('**/shared.css', route => route.abort());
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

    // Key structural panels must be visible without shared.css tokens
    await expect(page.locator('.page-body')).toBeVisible();
    await expect(page.locator('.criteria-col')).toBeVisible();

    // Facility and site selectors must render and be interactive
    await expect(page.locator('#fac-sel')).toBeVisible();
    await expect(page.locator('#site-sel')).toBeVisible();
  });

});
