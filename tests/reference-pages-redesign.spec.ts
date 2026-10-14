import { test, expect } from '@playwright/test';

const FDA_LABEL = {
  results: [{
    openfda: {
      generic_name: ['WARFARIN SODIUM'],
      brand_name: ['COUMADIN'],
      route: ['ORAL'],
    },
    boxed_warning: ['Warfarin can cause major or fatal bleeding.'],
    indications_and_usage: ['Warfarin is indicated for anticoagulation. '.repeat(24)],
    contraindications: ['Contraindicated when the risk of hemorrhage is greater than the potential benefit.'],
  }],
};

const FDA_RECALLS = {
  results: [{
    classification: 'Class II',
    recall_initiation_date: '20260115',
    status: 'Ongoing',
    reason_for_recall: 'Test recall reason',
    product_description: 'Warfarin sodium tablets',
  }],
};

test.describe('Searchable reference redesign', () => {
  test('FDA Label Search returns FDA content and exposes keyboard-operable label sections', async ({ page }) => {
    await page.route('**/drug/label.json?**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FDA_LABEL),
    }));
    await page.route('**/drug/enforcement.json?**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FDA_RECALLS),
    }));

    await page.goto('/drugref/');
    await page.getByLabel('Generic or brand name').fill('warfarin');
    await page.getByRole('button', { name: 'Search', exact: true }).click();

    await expect(page).toHaveURL(/\?q=warfarin/);
    await expect(page.getByRole('button', { name: 'Clear', exact: true })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Warfarin Sodium', exact: true })).toBeVisible();
    await expect(page.getByText('Warfarin can cause major or fatal bleeding.')).toBeVisible();
    await expect(page.getByText('Warfarin sodium tablets')).toBeVisible();

    const section = page.getByRole('button', { name: 'Indications & Usage' });
    await expect(section).toHaveAttribute('aria-expanded', 'false');
    await section.focus();
    await section.press('Enter');
    await expect(section).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#sec-indications_and_usage')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Show full section' })).toBeVisible();
  });

  test('FDA Label Search restores a linked search and clear returns to its initial state', async ({ page }) => {
    await page.route('**/drug/label.json?**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FDA_LABEL),
    }));
    await page.route('**/drug/enforcement.json?**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [] }),
    }));

    await page.goto('/drugref/?q=warfarin');
    await expect(page.getByRole('heading', { name: 'Warfarin Sodium', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(page).not.toHaveURL(/\?q=/);
    await expect(page.getByText('Enter a drug name to retrieve FDA label data and recent recalls.')).toBeVisible();
  });

  test('Code & Terminology Lookup supports tab keyboard navigation and RxTerms results', async ({ page }) => {
    await page.route('**/api/rxterms/v3/search?**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([1, ['metformin 500 MG Oral Tablet'], { RXCUI: ['860975'], ROUTE: ['Oral'] }]),
    }));

    await page.goto('/lookup/');
    const icdTab = page.getByRole('tab', { name: 'ICD-10-CM' });
    const drugTab = page.getByRole('tab', { name: 'Drugs' });
    await expect(page.getByRole('tab')).toHaveCount(4);
    await icdTab.focus();
    await icdTab.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'HCPCS II' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(drugTab).toBeFocused();
    await expect(drugTab).toHaveAttribute('aria-selected', 'true');

    await page.getByLabel('Search RxTerms drug names').fill('metformin');
    await expect(page).toHaveURL(/type=drug/);
    await expect(page).toHaveURL(/q=metformin/);
    await expect(page.getByText('metformin 500 MG Oral Tablet')).toBeVisible();
    await expect(page.getByText('RxCUI 860975')).toBeVisible();
    await expect(page.getByText('Oral', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /FDA label/ })).toBeVisible();
  });

  test('Code & Terminology Lookup restores linked terminology and query state', async ({ page }) => {
    await page.route('**/api/loinc_items/v3/search?**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([1, [], {}, [['2951-2', 'Sodium [Moles/volume] in Serum or Plasma', 'CHEM']]]),
    }));

    await page.goto('/lookup/?type=loinc&q=sodium');
    await expect(page.getByRole('tab', { name: 'LOINC' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel('Search LOINC laboratory terms')).toHaveValue('sodium');
    await expect(page.getByText('2951-2', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(page).not.toHaveURL(/q=/);
  });

  test('Lab Value DDx exposes grouped search state and stable laboratory links', async ({ page }) => {
    await page.goto('/ddx/?lab=potassium');
    await expect(page.getByRole('heading', { name: 'Potassium (K⁺)', exact: true })).toBeVisible();
    await expect(page.locator('.cat-nav .tab-btn.active')).toHaveText('Potassium (K⁺)');
    await expect(page.locator('#ddxResultCount')).toContainText('test');

    await page.getByLabel('Find a laboratory value').fill('ferritin');
    await expect(page.locator('.cat-nav .tab-btn')).toHaveCount(1);
    await expect(page.locator('#ddxResultCount')).toHaveText('1 test');
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(page.locator('.cat-nav .tab-btn')).toHaveCount(41);
  });

  test('Code & Terminology Lookup searches official HCPCS Level II data without presenting it as CPT', async ({ page }) => {
    await page.route('**/api/hcpcs/v3/search?**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([1, ['E0114'], { obsolete: [false] }, [['E0114', 'Crutches underarm other than wood pair']]]),
    }));

    await page.goto('/lookup/');
    await page.getByRole('tab', { name: 'HCPCS II' }).click();
    await page.getByLabel('Search HCPCS Level II').fill('crutches');
    await expect(page.getByText('E0114', { exact: true })).toBeVisible();
    await expect(page.getByText('Crutches underarm other than wood pair')).toBeVisible();
    await expect(page.getByText(/HCPCS Level II is not the AMA CPT code set/)).toBeVisible();
  });

  test('Laboratory Reference filters locally and retains clinical notes on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/labs/');

    await expect(page.locator('#catFilters .tab-btn')).toHaveCount(15);
    const cardiac = page.getByRole('button', { name: 'Cardiac', exact: true });
    await cardiac.click();
    await expect(cardiac).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.lab-section')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Cardiac', exact: true })).toBeVisible();

    await page.getByLabel('Search laboratory reference').fill('troponin');
    await expect(page.locator('.td-name').filter({ hasText: /Troponin/i }).first()).toBeVisible();
    const troponinRow = page.locator('.td-name').filter({ hasText: /Troponin/i }).first().locator('..');
    await troponinRow.getByRole('button', { name: 'Details' }).click();
    const note = troponinRow.locator('.td-note');
    await expect(note).toBeVisible();
    await expect(note).not.toHaveCSS('display', 'none');
    await expect(page.locator('#labResultSummary')).toContainText(/test/);
  });

  test('all three pages fit phone and tablet viewports without horizontal document overflow', async ({ page }) => {
    for (const width of [375, 768]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/drugref/', '/lookup/', '/labs/', '/ddx/?lab=sodium']) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${path} overflow at ${width}px`).toBeLessThanOrEqual(1);
      }
    }
  });

  test('theme selection persists across the reference pages', async ({ page }) => {
    await page.goto('/drugref/');
    await page.getByLabel('Color theme').selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.goto('/lookup/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByLabel('Color theme')).toHaveValue('dark');

    await page.goto('/labs/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByLabel('Color theme')).toHaveValue('dark');
  });
});
