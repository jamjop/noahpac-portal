import { test, expect } from '@playwright/test';

const PAGES = [
  ['/abx/', 'Antibiotic Reference'],
  ['/allergy/', 'Antibiotic Allergy'],
  ['/antibiogram/', 'ND Antibiogram'],
  ['/anticoag/', 'Anticoagulation Reversal'],
  ['/clinical-assistant/', 'Clinical Assistant'],
  ['/ddx/', 'Lab Value DDx'],
  ['/documents/', 'Clinical Documents'],
  ['/empiric/', 'Empiric + Susceptibility'],
  ['/naloxone/', 'Naloxone Reference'],
  ['/reportable/', 'Reportable Conditions'],
  ['/screener/', 'Screening Recommendations'],
  ['/sti-guide/', 'STI Guidelines'],
  ['/toxicology/', 'Toxicology / Antidote Reference'],
  ['/vaccines/', 'Vaccine Schedule Guidance'],
  ['/wound/', 'Wound Care'],
] as const;

test.describe('Remaining-page redesign', () => {
  test('all pages use the compact shared shell without client-side exceptions', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    for (const [path, title] of PAGES) {
      await page.goto(path);
      await expect(page.locator('body')).toHaveClass(/clinical-app/);
      await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
      await expect(page.getByLabel('Color theme')).toBeVisible();
      await expect(page.locator('footer.app-footer')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('phone and tablet layouts avoid document-level horizontal overflow', async ({ page }) => {
    for (const width of [375, 768]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [path] of PAGES) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${path} overflow at ${width}px`).toBeLessThanOrEqual(1);
      }
    }
  });

  test('search and decision-support workflows retain representative behavior', async ({ page }) => {
    await page.goto('/abx/');
    await page.getByLabel('Find a condition').fill('meningitis');
    await expect(page.locator('#tabNav .tab-btn')).not.toHaveCount(0);
    await page.locator('#tabNav .tab-btn').first().click();
    await expect(page.locator('.drug').first()).toBeVisible();

    await page.goto('/allergy/');
    await page.locator('#seg-allergy').selectOption({ label: 'Ceftazidime' });
    await page.locator('#seg-proposed').selectOption({ label: 'Aztreonam' });
    await expect(page.locator('.result-card')).toContainText('High cross-reactivity risk');

    await page.goto('/ddx/');
    await page.getByLabel('Find a laboratory value').fill('sodium');
    await page.locator('#tabNav .tab-btn').first().click();
    await expect(page.locator('.ddx-name')).toContainText('Sodium');

    await page.goto('/documents/');
    await page.getByLabel('Find a document').fill('carpal tunnel');
    await expect(page.getByText('Carpal Tunnel Syndrome', { exact: true })).toBeVisible();
    await expect(page.getByText('Shoulder — General Program')).toBeHidden();

    await page.goto('/reportable/');
    await page.getByLabel('Search reportable conditions').fill('anthrax');
    await expect(page.locator('.cond-name').filter({ hasText: /Anthrax/i })).toBeVisible();

    await page.goto('/sti-guide/');
    await page.getByLabel('Search STI treatment guidance').fill('gonorrhea');
    await expect(page.locator('.guide-card').first()).toContainText(/gonorrhea/i);
  });

  test('screeners and complex tools retain representative content and controls', async ({ page }) => {
    await page.goto('/antibiogram/');
    await expect(page.locator('#facility-select')).toBeVisible();
    await expect(page.locator('.abgram tbody tr').first()).toBeVisible();

    await page.goto('/screener/');
    await page.locator('#age').fill('65');
    await expect(page.locator('.rec').first()).toBeVisible();

    await page.goto('/vaccines/');
    await page.locator('#age').fill('65');
    await expect(page.locator('.rec').first()).toBeVisible();

    await page.goto('/clinical-assistant/');
    await expect(page.getByLabel('Clinical question')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ask' })).toBeVisible();

    await page.goto('/wound/');
    const tetanus = page.getByRole('tab', { name: 'Tetanus' });
    await tetanus.focus();
    await tetanus.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Closure' })).toBeFocused();
    await expect(page.locator('#panel-closure')).toBeVisible();
    await page.getByRole('tab', { name: 'Bites' }).click();
    await expect(page.locator('#bite-output')).toContainText('Observe');

    await page.goto('/anticoag/');
    await expect(page.getByText('4F-PCC + Vitamin K 10 mg IV')).toBeVisible();
    await page.goto('/naloxone/');
    await expect(page.getByText(/1-800-662-4357/).first()).toBeVisible();
    await page.goto('/toxicology/');
    await expect(page.getByText(/Poison Control/).first()).toBeVisible();
  });

  test('explicit dark theme persists across the completed site family', async ({ page }) => {
    await page.goto('/abx/');
    await page.getByLabel('Color theme').selectOption('dark');
    await page.goto('/documents/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByLabel('Color theme')).toHaveValue('dark');
    await page.goto('/vaccines/');
    await expect(page.getByLabel('Color theme')).toHaveValue('dark');
  });

  test('landing brand and long-reference navigation use the polished shared language', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-brand-mark')).toHaveText('PA');
    await expect(page.getByRole('heading', { name: 'Clinical Tools', level: 1 })).toBeVisible();
    await expect(page.locator('.tool-icon svg').first()).toBeVisible();
    const reviewLink = page.getByRole('link', { name: 'Clinical review' });
    await expect(reviewLink).toBeVisible();
    await expect(reviewLink).toHaveAttribute('href', '/review/');
    await expect(reviewLink.locator('svg')).toBeVisible();

    for (const path of ['/anticoag/', '/naloxone/', '/toxicology/']) {
      await page.goto(path);
      const outline = page.getByRole('navigation', { name: 'On this page' });
      await expect(outline).toBeVisible();
      expect(await outline.getByRole('link').count()).toBeGreaterThanOrEqual(3);
    }
  });
});
