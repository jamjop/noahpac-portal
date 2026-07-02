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
    const cardCount = await page.locator('.dose-card').count();
    expect(cardCount).toBeGreaterThanOrEqual(20);
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

  // ── 7. Succinylcholine infant vs child dose differs ───────────────────────
  //
  // infant (<10 kg): 2 mg/kg  →  5 kg → clamp(10, 5, 150) = 10 mg  → "10"
  // child  (≥10 kg): 1.5 mg/kg → 15 kg → clamp(22.5, 5, 150) = 22.5 mg → fmt(22.5,0)="23"

  test('succinylcholine dose for a 5 kg infant (10 mg) differs from a 15 kg child (23 mg)', async ({ page }) => {
    // ── infant: 5 kg ──────────────────────────────────────────────────────────
    await page.fill('#wtKg', '5');
    await page.click('#calcBtn');

    const infantDose = await getDoseVal(page, 'Succinylcholine');
    expect(infantDose!.trim(), 'Infant sux dose should be 10 mg (2 mg/kg × 5 kg)').toBe('10');

    // ── child: 15 kg ─────────────────────────────────────────────────────────
    await page.fill('#wtKg', '15');
    await page.click('#calcBtn');

    const childDose = await getDoseVal(page, 'Succinylcholine');
    expect(childDose!.trim(), 'Child sux dose should be 23 mg (1.5 mg/kg × 15 kg, rounded)').toBe('23');

    // The two doses must differ — catches formula regression where both branches
    // would use the same multiplier
    expect(infantDose!.trim()).not.toBe(childDose!.trim());
  });

  // ── 8. Epinephrine cardiac-arrest dose is clamped to 1 mg above 100 kg ──
  //
  // Formula: clamp(wt * 0.01, 0.01, 1)  max = 1 mg
  // At 150 kg: 150 * 0.01 = 1.5 → clamped to 1 → fmt(1, 2) = "1"

  test('epinephrine (cardiac arrest) is clamped to 1 mg at supra-adult weight (150 kg)', async ({ page }) => {
    await page.fill('#wtKg', '150');
    await page.click('#calcBtn');

    const epiDose = await getDoseVal(page, 'Epinephrine (cardiac arrest)');
    expect(epiDose!.trim(), 'Epi dose must be clamped to 1 mg, not 1.5 mg').toBe('1');
  });

  // ── 9. Edge case: age 0 (newborn) does not crash ─────────────────────────

  test('age 0 years does not crash and renders content', async ({ page }) => {
    await page.fill('#wtKg', '');
    await page.fill('#ageNum', '0');
    await page.selectOption('#ageUnit', 'yr');
    await page.click('#calcBtn');

    // Either a valid render or a clear error message — never a blank #content
    const content = await page.locator('#content').textContent();
    expect(content!.trim().length).toBeGreaterThan(0);
  });

  // ── 10. Age-estimated weight (2 mo → 4 kg) uses infant succinylcholine branch
  //
  // estimateWeight(2, 'mo'): ageNum=2 < 3 → 4 kg (infant, <10 kg)
  // Succinylcholine: 2 mg/kg → clamp(4×2, 5, 150) = 8 mg → "8"
  //   note must say "2 mg/kg (infant)" confirming the infant branch fired
  // Epinephrine (cardiac arrest): clamp(4×0.01, 0.01, 1) = 0.04 → "0.04"
  // #broseWeight must display the estimated weight "4 kg"

  test('age 2 months → estimated 4 kg → succinylcholine infant branch (8 mg) and correct epi dose (0.04 mg)', async ({ page }) => {
    // Clear weight, enter 2 months
    await page.fill('#wtKg', '');
    await page.fill('#ageNum', '2');
    await page.selectOption('#ageUnit', 'mo');
    await page.click('#calcBtn');

    // Estimated weight must appear in #broseWeight as "4 kg"
    const wtText = await page.locator('#broseWeight').textContent();
    expect(wtText!.trim(), 'Estimated weight for 2 months should be 4 kg').toBe('4 kg');

    // Succinylcholine must use infant branch: 2 mg/kg × 4 kg = 8 mg
    const suxDose = await getDoseVal(page, 'Succinylcholine');
    expect(suxDose!.trim(), 'Infant sux dose (2 mo, 4 kg) should be 8 mg (2 mg/kg)').toBe('8');

    // The dose note must confirm the infant 2 mg/kg branch — not the child 1.5 mg/kg branch
    const suxCard = page.locator('.dose-card', { hasText: 'Succinylcholine' }).first();
    const suxNote = await suxCard.locator('.dose-note').first().textContent();
    expect(suxNote, 'Sux note should say 2 mg/kg (infant)').toContain('2 mg/kg');
    expect(suxNote, 'Sux note should identify the infant branch').toContain('infant');

    // Epinephrine (cardiac arrest) must equal 0.04 mg at 4 kg (0.01 mg/kg, unclamped)
    const epiDose = await getDoseVal(page, 'Epinephrine (cardiac arrest)');
    expect(epiDose!.trim(), 'Epi dose (2 mo, 4 kg) should be 0.04 mg (0.01 mg/kg)').toBe('0.04');
  });

  // ── 11. Age-estimated weight just below 10 kg still uses infant sux branch ─
  //
  // 12 months: estimateWeight(12, 'mo') → ageNum=12 ≤ 12 → (12+9)/2 = 10.5 kg
  // That crosses into the child (≥10 kg) branch.
  // Use 6 months instead: (6+9)/2 = 7.5 kg → infant branch
  // Succinylcholine: clamp(7.5×2, 5, 150) = 15 mg → "15"
  // Epinephrine: clamp(7.5×0.01, 0.01, 1) = 0.075 → fmt(0.075,2) = "0.08" (toFixed rounds)
  //
  // This confirms age-path doesn't silently reuse a stale weight or bypass infant logic.

  test('age 6 months → estimated 7.5 kg → still infant succinylcholine branch (15 mg)', async ({ page }) => {
    await page.fill('#wtKg', '');
    await page.fill('#ageNum', '6');
    await page.selectOption('#ageUnit', 'mo');
    await page.click('#calcBtn');

    // estimateWeight(6, 'mo'): ageNum=6, 3 < 6 ≤ 12 → round((6+9)/2 × 10)/10 = round(7.5) = 7.5 kg
    const wtText = await page.locator('#broseWeight').textContent();
    expect(wtText!.trim(), 'Estimated weight for 6 months should be 7.5 kg').toBe('7.5 kg');

    // Infant branch: 2 mg/kg × 7.5 = 15 mg
    const suxDose = await getDoseVal(page, 'Succinylcholine');
    expect(suxDose!.trim(), 'Sux dose (6 mo, 7.5 kg) should be 15 mg (infant 2 mg/kg)').toBe('15');

    const suxCard = page.locator('.dose-card', { hasText: 'Succinylcholine' }).first();
    const suxNote = await suxCard.locator('.dose-note').first().textContent();
    expect(suxNote, 'Sux note should confirm infant branch for 7.5 kg').toContain('infant');
  });

  // ── 12. Dose cards stay legible when shared.css fails to load ─────────────
  //
  // Simulates a slow/broken connection by aborting the /shared.css network
  // request.  peds/style.css defines its own fallback :root tokens so the
  // page must remain fully functional: dose-val elements visible, Calculate
  // button clickable, and #content updated with real numeric values.

  test('dose cards are legible and Calculate works when shared.css fails to load', async ({ page }) => {
    // Abort any request for shared.css before the page even starts loading
    await page.route('**/shared.css', route => route.abort());

    await page.goto(PEDS_URL);

    // Skeleton must appear — #content rendered even without shared.css tokens
    await expect(page.locator('#content')).toBeVisible();

    // Initial skeleton dose-val elements must be visible (not invisible due to
    // missing --purple token or missing layout from shared.css)
    const skeletonVals = page.locator('.dose-val');
    await expect(skeletonVals.first()).toBeVisible();

    // Calculate button must be visible and clickable
    const calcBtn = page.locator('#calcBtn');
    await expect(calcBtn).toBeVisible();
    await expect(calcBtn).toBeEnabled();

    // Enter a weight and calculate
    await page.fill('#wtKg', '15');
    await calcBtn.click();

    // #content must update: at least one dose-val must now be numeric
    const updatedVals = await page.locator('.dose-val').allTextContents();
    const numericCount = updatedVals.filter(v => v.trim() !== '—').length;
    expect(
      numericCount,
      `Expected numeric dose values after CSS failure, got ${numericCount} out of ${updatedVals.length}`
    ).toBeGreaterThan(10);

    // Spot-check: a critical card (Epinephrine cardiac arrest) must have a
    // visible, legible dose-val — not hidden by a missing color token
    const epiVal = await getDoseVal(page, 'Epinephrine (cardiac arrest)');
    expect(isNumeric(epiVal), `Epi dose-val "${epiVal}" should be numeric without shared.css`).toBe(true);
  });

});
