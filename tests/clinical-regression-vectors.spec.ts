import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

type Action = { type: 'fill' | 'select' | 'check' | 'click'; selector: string; value?: string };
type Assertion = { selector: string; contains: string };
type Vector = {
  name: string;
  route: string;
  tab?: string;
  basis: string;
  actions: Action[];
  assertions: Assertion[];
};

const vectorPath = fileURLToPath(new URL('./clinical-regression-vectors.json', import.meta.url));
const vectors: Vector[] = JSON.parse(readFileSync(vectorPath, 'utf8'));

async function perform(page: Page, action: Action) {
  const target = page.locator(action.selector);
  if (action.type === 'fill') await target.fill(action.value ?? '');
  if (action.type === 'select') await target.selectOption(action.value ?? '');
  if (action.type === 'check') await target.check();
  if (action.type === 'click') await target.click();
}

test.describe('Independent clinical regression vectors', () => {
  for (const vector of vectors) {
    test(`${vector.name} — ${vector.basis}`, async ({ page }) => {
      await page.goto(vector.route);
      if (vector.tab) await page.getByRole('tab', { name: vector.tab, exact: true }).click();
      for (const action of vector.actions) await perform(page, action);
      for (const assertion of vector.assertions) {
        await expect(page.locator(assertion.selector)).toContainText(assertion.contains);
      }
    });
  }
});
