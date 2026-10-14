import { test, expect } from '@playwright/test';

test.describe('Decision-support workflow refinements', () => {
  test('sepsis assessment copies a complete summary and resets all inputs', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/sepsis/');
    await page.check('#s-temp');
    await page.check('#s-hr');
    await page.locator('#seg-resp [data-val="2"]').click();
    await page.getByRole('button', { name: 'Copy assessment' }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('SIRS: 2 / 4');
    expect(copied).toContain('SOFA: 2');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#sirs-badge')).toHaveText('0 / 4');
    await expect(page.locator('#sofa-badge')).toHaveText('0');
    await expect(page.locator('.sepsis-app input:checked')).toHaveCount(0);
  });

  test('wound tabs are linkable and the visible recommendation can be copied', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/wound/?section=bites');
    await expect(page.getByRole('tab', { name: 'Bites' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-bites')).toBeVisible();
    await page.locator('#animal-grid [data-animal="bat"]').click();
    await page.locator('#panel-bites').getByRole('button', { name: 'Copy recommendation' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('PEP indicated');
    await page.getByRole('tab', { name: 'Closure' }).click();
    await expect(page).toHaveURL(/section=closure/);
  });

  test('allergy assessment foregrounds phenotype limits and supports copy/reset', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/allergy/');
    await expect(page.getByText('Reaction phenotype is not assessed.')).toBeVisible();
    await page.locator('#seg-allergy').selectOption({ label: 'Ceftazidime' });
    await page.locator('#seg-proposed').selectOption({ label: 'Aztreonam' });
    await expect(page.locator('.result-card')).toContainText('High cross-reactivity risk');
    await page.getByRole('button', { name: 'Copy assessment' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Reaction phenotype is not assessed');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#seg-allergy')).toHaveValue('Penicillin G / V');
    await expect(page.locator('#seg-proposed')).toHaveValue('Ceftriaxone');
  });

  test('all three tools remain overflow-free on phones', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of ['/sepsis/', '/wound/', '/allergy/']) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), path).toBeLessThanOrEqual(1);
    }
    await page.goto('/allergy/');
    await expect(page.locator('.ref-tbl tbody tr').first()).toBeVisible();
    await expect(page.locator('.ref-tbl tbody td').first()).toHaveAttribute('data-label', 'Allergy');
  });
});
