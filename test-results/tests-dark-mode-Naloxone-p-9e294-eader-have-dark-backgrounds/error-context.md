# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/dark-mode.spec.ts >> Naloxone page – dark mode >> body and header have dark backgrounds
- Location: tests/dark-mode.spec.ts:351:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/naloxone/", waiting until "load"

```

# Test source

```ts
  252 | 
  253 |   test('body has dark background', async ({ page }) => {
  254 |     await page.goto('/empiric/');
  255 |     await page.waitForLoadState('domcontentloaded');
  256 |     await assertBgIsDark(page, 'body', 'empiric body');
  257 |   });
  258 | 
  259 |   test('reg-tbl th has dark background', async ({ page }) => {
  260 |     await page.goto('/empiric/');
  261 |     await waitForSelector(page, '.reg-tbl');
  262 |     // .reg-tbl th → background:var(--surface) override in dark mode
  263 |     await assertBgIsDark(page, '.reg-tbl th', 'empiric .reg-tbl th');
  264 |   });
  265 | 
  266 |   test('susceptibility cells have dark soft-colour backgrounds after organism selection', async ({ page }) => {
  267 |     await page.goto('/empiric/');
  268 |     await waitForSelector(page, '.org-btn');
  269 |     await page.locator('.org-btn').first().click();
  270 | 
  271 |     await page.waitForFunction(
  272 |       () => !!document.querySelector('.susc-hi, .susc-mid, .susc-lo'),
  273 |       { timeout: 5_000 },
  274 |     );
  275 | 
  276 |     const color: string = await page.$eval(
  277 |       '.susc-hi, .susc-mid, .susc-lo',
  278 |       el => getComputedStyle(el).backgroundColor,
  279 |     );
  280 |     if (!isTransparent(color)) {
  281 |       const rgb = parseRgb(color);
  282 |       expect(rgb, `empiric susc cell: could not parse "${color}"`).not.toBeNull();
  283 |       expect(rgb![0] < 200 && rgb![1] < 200 && rgb![2] < 200, `empiric susc cell: background "${color}" is too bright`).toBe(true);
  284 |     }
  285 |   });
  286 | });
  287 | 
  288 | // ── LOOKUP ───────────────────────────────────────────────────────────────────
  289 | 
  290 | test.describe('Lookup page – dark mode', () => {
  291 |   test('body and search panel have dark backgrounds', async ({ page }) => {
  292 |     await page.goto('/lookup/');
  293 |     await page.waitForLoadState('domcontentloaded');
  294 |     await assertBgIsDark(page, 'body', 'lookup body');
  295 |     await waitForSelector(page, '.search-panel');
  296 |     await assertBgIsDark(page, '.search-panel', 'lookup .search-panel');
  297 |   });
  298 | 
  299 |   test('initial state message has dark background', async ({ page }) => {
  300 |     await page.goto('/lookup/');
  301 |     await waitForSelector(page, '#results .state');
  302 |     await assertBgIsDark(page, '#results .state', 'lookup #results .state');
  303 |   });
  304 | });
  305 | 
  306 | // ── ALLERGY ──────────────────────────────────────────────────────────────────
  307 | 
  308 | test.describe('Allergy page – dark mode', () => {
  309 |   test('body and header have dark backgrounds', async ({ page }) => {
  310 |     await page.goto('/allergy/');
  311 |     await page.waitForLoadState('domcontentloaded');
  312 |     await assertBgIsDark(page, 'body', 'allergy body');
  313 |     await assertBgIsDark(page, 'header.app-header', 'allergy header');
  314 |   });
  315 | 
  316 |   test('cross-reactivity reference table th has dark background', async ({ page }) => {
  317 |     await page.goto('/allergy/');
  318 |     await waitForSelector(page, '.ref-tbl th');
  319 |     await assertBgIsDark(page, '.ref-tbl th', 'allergy .ref-tbl th');
  320 |   });
  321 | 
  322 |   test('result boxes use dark soft-colour backgrounds after selection', async ({ page }) => {
  323 |     await page.goto('/allergy/');
  324 |     // Wait for seg buttons (populated by app.js)
  325 |     await waitForChildren(page, '#seg-allergy');
  326 |     await waitForChildren(page, '#seg-proposed');
  327 | 
  328 |     await page.locator('#seg-allergy .seg-btn').first().click();
  329 |     await page.locator('#seg-proposed .seg-btn').first().click();
  330 | 
  331 |     await page.waitForFunction(
  332 |       () => !!document.querySelector('.res-ok, .res-warn, .res-crit'),
  333 |       { timeout: 5_000 },
  334 |     );
  335 | 
  336 |     const color: string = await page.$eval(
  337 |       '.res-ok, .res-warn, .res-crit',
  338 |       el => getComputedStyle(el).backgroundColor,
  339 |     );
  340 |     if (!isTransparent(color)) {
  341 |       const rgb = parseRgb(color);
  342 |       expect(rgb, `allergy result box: could not parse "${color}"`).not.toBeNull();
  343 |       expect(rgb![0] < 200 && rgb![1] < 200 && rgb![2] < 200, `allergy result box: background "${color}" is too bright`).toBe(true);
  344 |     }
  345 |   });
  346 | });
  347 | 
  348 | // ── NALOXONE ─────────────────────────────────────────────────────────────────
  349 | 
  350 | test.describe('Naloxone page – dark mode', () => {
  351 |   test('body and header have dark backgrounds', async ({ page }) => {
> 352 |     await page.goto('/naloxone/');
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  353 |     await page.waitForLoadState('domcontentloaded');
  354 |     await assertBgIsDark(page, 'body', 'naloxone body');
  355 |     await assertBgIsDark(page, 'header.app-header', 'naloxone header');
  356 |   });
  357 | 
  358 |   test('dose-card has dark background in dark mode', async ({ page }) => {
  359 |     await page.goto('/naloxone/');
  360 |     // .dose-card elements are static HTML — no tab click or data fetch needed.
  361 |     await waitForSelector(page, '.dose-card');
  362 |     // .dose-card → background:var(--bg); dark token is #0f1117
  363 |     await assertBgIsDark(page, '.dose-card', 'naloxone .dose-card');
  364 |   });
  365 | });
  366 | 
  367 | // ── ANTIBIOGRAM ───────────────────────────────────────────────────────────────
  368 | 
  369 | test.describe('Antibiogram page – dark mode', () => {
  370 |   test('body and header have dark backgrounds', async ({ page }) => {
  371 |     await page.goto('/antibiogram/');
  372 |     await page.waitForLoadState('domcontentloaded');
  373 |     await assertBgIsDark(page, 'body', 'antibiogram body');
  374 |     await assertBgIsDark(page, 'header.app-header', 'antibiogram header');
  375 |   });
  376 | 
  377 |   test('abgram table th has dark background after data renders', async ({ page }) => {
  378 |     await page.goto('/antibiogram/');
  379 |     // Facility data is bundled in app.js — no network mock needed.
  380 |     // Wait for app.js to inject column headers into #thead.
  381 |     await waitForChildren(page, '#thead');
  382 |     // .abgram th → background:var(--bg); dark token is #0f1117
  383 |     await assertBgIsDark(page, '.abgram th', 'antibiogram .abgram th');
  384 |   });
  385 | });
  386 | 
  387 | // ── EXAMPLE: adding new pages with a single call ──────────────────────────────
  388 | //
  389 | // The pages below were added with `smokeTestPageDarkMode('slug')`.
  390 | // This is Option B from the ADDING A NEW PAGE instructions at the top.
  391 | // Each call registers two tests (structural + component backgrounds).
  392 | //
  393 | // Pages already covered by auto-discovery in dark-mode-new-pages.spec.ts don't
  394 | // *need* to be listed here, but adding them explicitly gives them a stable,
  395 | // named test entry that appears clearly in CI output.
  396 | 
  397 | import { smokeTestPageDarkMode } from './dark-mode-helpers.js';
  398 | 
  399 | // Naloxone reference page — static content, no mocking required.
  400 | // The smoke test below provides generic body/header/component checks;
  401 | // the explicit describe block above adds the dose-card element check.
  402 | smokeTestPageDarkMode('naloxone');
  403 | 
  404 | // ABx (antibiotic quick-reference) page.
  405 | smokeTestPageDarkMode('abx');
  406 | 
  407 | // Wound care reference page.
  408 | smokeTestPageDarkMode('wound');
  409 | 
```