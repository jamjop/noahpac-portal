import { expect, test } from '@playwright/test';

const payload = {
  authenticated_user: 'noah.pa',
  generated_at: '2026-10-11T12:00:00Z',
  counts: {pending: 1, second_review: 0, error: 0, not_checked: 0, current: 0, reviewed: 0},
  topics: [{
    id: 'sepsis', title: 'Sepsis Screening', path: '/sepsis/', risk_tier: 'high', cadence: 'monthly',
    state: 'pending', status: 'changed', status_date: '2026-10-11', reviewer: null, reviewed_at: null,
    review_note: null, review_decision: null, revision: '0123456789abcdef',
    sources: [{id: 'ssc_2026', title: 'Surviving Sepsis Campaign', url: 'https://example.org/ssc'}],
    claims: [{id:'sepsis-guidance',scope:'Sepsis recognition, escalation, and resuscitation guidance',review_priority:'critical',independent_review:'required',source_ids:['ssc_2026']}],
    independent_review_required: true, independent_review_pending: false, next_review_due: null,
  }],
};

test('review portal displays the queue and submits a source-backed acknowledgement', async ({ page }) => {
  let submission: Record<string, unknown> | null = null;
  await page.route('**/review/api/status', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)}));
  await page.route('**/review/api/reviews', async route => {
    submission = route.request().postDataJSON();
    await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({ok:true,topic:'sepsis'})});
  });
  await page.goto('/clinical-review/');
  await expect(page.getByText('Signed in: noah.pa')).toBeVisible();
  await expect(page.getByRole('heading', {name:'Sepsis Screening'})).toBeVisible();
  await expect(page.getByText(/1 requiring attention/)).toBeVisible();
  await page.getByRole('button', {name:'Review topic'}).click();
  await page.getByLabel(/Sepsis recognition/).check();
  await page.getByLabel(/Surviving Sepsis Campaign/).check();
  await page.getByLabel(/No change required/).check();
  await page.getByLabel('Source versions or publication dates').fill('SSC guideline accessed October 17, 2026.');
  await page.getByLabel('Known limitations or unresolved questions').fill('None identified.');
  await page.getByLabel('Review note').fill('Compared the deployed content with the complete current guideline.');
  await page.getByLabel(/I personally compared/).check();
  await page.getByRole('button', {name:'Record review'}).click();
  await expect.poll(() => submission).not.toBeNull();
  expect(submission).toMatchObject({topic:'sepsis',decision:'no-change',review_stage:'primary',source_ids:['ssc_2026'],claim_ids:['sepsis-guidance'],source_versions:'SSC guideline accessed October 17, 2026.',confirmed:true,expected_revision:'0123456789abcdef'});
});

test('review portal fits a phone and retains dark mode', async ({ page }) => {
  await page.route('**/review/api/status', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)}));
  await page.setViewportSize({width:375,height:812});
  await page.goto('/clinical-review/');
  await page.getByLabel('Color theme').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
