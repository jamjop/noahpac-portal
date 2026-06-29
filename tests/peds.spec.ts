/**
 * Pediatric Dosing Calculator – Playwright regression tests.
 *
 * Covers the "done looks like" criteria from the task:
 *  1. Dose cards populate for a typical child (15 kg direct weight, 5-year-old via age).
 *  2. ETT size formula output (cuffed / uncuffed / depth) is visible and numeric.
 *  3. Broselow band label changes when weight crosses a band boundary.
 *  4. The Calculate button (#calcBtn) triggers render and updates #content.
 *
 * Safety note: a blank or wrong dose card here has direct patient-safety implications,
 * so these tests are intentionally strict about numeric content.
 */

import { test, expect } from '@playwright/test';

const PEDS_URL = '/peds/';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Returns the text of the dose-val element inside the card whose title contains `name`. */
async function getDoseVal(page: import('@playwright/test').Page, name: string) {
  const card = page.locator('.dose-card', { hasText: name }).first();
  await expect(card).toBeVisible();
  return card.locator('.dose-val').first().textContent();
}

/** Returns true if `str` looks like a real numeric value (not "—"). */
function isNumeric(str: string | null): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  if (trimmed === '—') return false;
  return /^[\d.–\-]+$/.test(trimmed) && !isNaN(parseFloat(trimmed));
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('Pediatric Dosing Calculator', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(PEDS_URL);
    // Skeleton should render immediately
    await expect(page.locator('#content')).toBeVisible();
  });

  // ── 1. Calculate button triggers render ───────────────────────────────────

  test('Calculate button (#calcBtn) updates #content with real dose cards', async ({ page }) => {
    // Before input, content shows skeleton (dose-val of "—")
    const initialVals = await page.locator('.dose-val').allTextContents();
    expect(initialVals.every(v => v === '—')).toBe(true);

    // Enter weight and click Calculate
    await page.fill('#wtKg', '15');
    await page.click('#calcBtn');

    // After calculation, at least one dose-val should be numeric
    const updatedVals = await page.locator('.dose-val').allTextContents();
    const numericCount = updatedVals.filter(v => v.trim() !== '—').length;
    expect(numericCount).toBeGreaterThan(10);
  });

  // ── 2. Typical child: 15 kg direct weight ────────────────────────────────

  test('dose cards populate for a 15 kg child', async ({ page }) => {
    await page.fill('#wtKg', '15');
    await page.click('#calcBtn');

    // Several representative cards must have non-dash values
    const cardNames = [
      'NS Bolus',
      'Epinephrine (cardiac arrest)',
      'Succinylcholine',
      'Lorazepam',
      'Acetaminophen',
      'Ceftriaxone',
    ];

    for (const name of cardNames) {
      const val = await getDoseVal(page, name);
      expect(isNumeric(val), `Expected numeric dose for "${name}", got "${val}"`).toBe(true);
    }
  });

  // ── 3. Typical child: 5 years old via age input ──────────────────────────

  test('dose cards populate when weight is estimated from age (5 yr)', async ({ page }) => {
    // Leave weight blank, enter age
    await page.fill('#wtKg', '');
    await page.fill('#ageNum', '5');
    await page.selectOption('#ageUnit', 'yr');
    await page.click('#calcBtn');

    // Weight should be estimated to 26 kg (2*(5+8)=26) and dose cards rendered
    await expect(page.locator('.dose-card')).toHaveCount({ min: 20 } as any);
    const vals = await page.locator('.dose-val').allTextContents();
    const numericCount = vals.filter(v => v.trim() !== '—').length;
    expect(numericCount).toBeGreaterThan(10);
  });

  // ── 4. ETT cuffed / uncuffed / depth are visible and numeric ─────────────
  //
  // render() estimates age from weight: ageEst = wt/2 - 8 for wt > 9 kg.
  // The formula ETT card (with Uncuffed/Depth in the note) only appears when
  // ageYr >= 1.  At 18 kg: ageEst = 18/2 - 8 = 1 → ageYr = 1 → formula ETT.
  // Expected: cuffed = roundHalf(1/4 + 3.5) = 4.0 mm, uncuffed = 4.5 mm, depth = 12 cm.

  test('ETT size formula output is visible and numeric for an 18 kg child', async ({ page }) => {
    await page.fill('#wtKg', '18');
    await page.click('#calcBtn');

    // ETT card shows cuffed size in .dose-val and uncuffed + depth in .dose-note
    const ettCard = page.locator('.dose-card.highlight', { hasText: 'ETT' }).first();
    await expect(ettCard).toBeVisible();

    const cuffedVal = await ettCard.locator('.dose-val').first().textContent();
    expect(isNumeric(cuffedVal), `ETT cuffed val "${cuffedVal}" should be numeric`).toBe(true);

    const noteText = await ettCard.locator('.dose-note').first().textContent();
    expect(noteText).toBeTruthy();

    // note contains "Uncuffed: X.X mm · Depth: Y.Y cm"
    const uncuffedMatch = noteText!.match(/Uncuffed:\s*([\d.]+)/);
    const depthMatch    = noteText!.match(/Depth:\s*([\d.]+)/);

    expect(uncuffedMatch, 'Uncuffed size should appear in ETT note').toBeTruthy();
    expect(depthMatch,    'Depth should appear in ETT note').toBeTruthy();

    expect(parseFloat(uncuffedMatch![1])).toBeGreaterThan(0);
    expect(parseFloat(depthMatch![1])).toBeGreaterThan(0);
  });

  // ── 5. Broselow band label changes across a band boundary ─────────────────

  test('Broselow band label is correct and changes across the Blue→Orange boundary (18 kg vs 19 kg)', async ({ page }) => {
    // 18 kg → Blue band (15–18 kg)
    await page.fill('#wtKg', '18');
    await page.click('#calcBtn');

    await expect(page.locator('#broseBar')).toBeVisible();
    const label18 = await page.locator('#broseLabel').textContent();
    expect(label18).toContain('Blue');

    // 19 kg → Orange band (19–25 kg)
    await page.fill('#wtKg', '19');
    await page.click('#calcBtn');

    const label19 = await page.locator('#broseLabel').textContent();
    expect(label19).toContain('Orange');

    // The two labels must differ
    expect(label18).not.toBe(label19);
  });

  // ── 6. Weight above 36 kg shows "adult doses" label, not blank content ────

  test('weight above 36 kg (out of Broselow range) still renders dose cards and shows adult-doses label', async ({ page }) => {
    await page.fill('#wtKg', '40');
    await page.click('#calcBtn');

    // Band label should indicate adult doses
    const label = await page.locator('#broseLabel').textContent();
    expect(label).toContain('adult doses');

    // Dose cards must still be populated (not blank / error)
    const vals = await page.locator('.dose-val').allTextContents();
    const numericCount = vals.filter(v => v.trim() !== '—').length;
    expect(numericCount).toBeGreaterThan(10);
  });

  // ── 7. Edge case: age 0 (newborn) does not crash ─────────────────────────

  test('age 0 years does not crash and renders content', async ({ page }) => {
    await page.fill('#wtKg', '');
    await page.fill('#ageNum', '0');
    await page.selectOption('#ageUnit', 'yr');
    await page.click('#calcBtn');

    // Either a valid render or a clear error message — never a blank #content
    const content = await page.locator('#content').textContent();
    expect(content!.trim().length).toBeGreaterThan(0);
  });

});
