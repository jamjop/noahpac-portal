# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/dark-mode.spec.ts >> naloxone – dark-mode smoke test >> component backgrounds are dark when present
- Location: tests/dark-mode-helpers.ts:236:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/naloxone/", waiting until "load"

```

# Test source

```ts
  137 |     bgIsCompliant(rgb!, scheme),
  138 |     `${label}: background "${color}" is ${direction}. ` +
  139 |       (scheme === 'dark'
  140 |         ? 'Add @media (prefers-color-scheme: dark) token overrides.'
  141 |         : 'Ensure dark-mode token overrides are not leaking into light mode.'),
  142 |   ).toBe(true);
  143 | }
  144 | 
  145 | /**
  146 |  * Assert that the text color of `selector` is readable for `scheme`.
  147 |  * Silently skips when the element is absent or its color is transparent.
  148 |  */
  149 | export async function assertFgCompliant(
  150 |   page: import('@playwright/test').Page,
  151 |   selector: string,
  152 |   label: string,
  153 |   scheme: ColorScheme,
  154 | ): Promise<void> {
  155 |   const color = await getComputedProp(page, selector, 'color');
  156 |   if (!color || isTransparent(color)) return;
  157 |   const rgb = parseRgb(color);
  158 |   expect(rgb, `${label} fg: could not parse "${color}"`).not.toBeNull();
  159 |   const max = Math.max(...rgb!);
  160 |   const direction =
  161 |     scheme === 'dark'
  162 |       ? `near-black text in dark mode (max channel ${max} ≤ 80) — invisible on dark bg`
  163 |       : `near-white text in light mode (max channel ${max} ≥ 240) — invisible on light bg`;
  164 |   expect(
  165 |     fgIsCompliant(rgb!, scheme),
  166 |     `${label}: text color "${color}" is ${direction}. ` +
  167 |       (scheme === 'dark'
  168 |         ? 'Check --ink / color token dark-mode overrides.'
  169 |         : 'Ensure light-mode text tokens are not overridden by dark values.'),
  170 |   ).toBe(true);
  171 | }
  172 | 
  173 | /**
  174 |  * Backwards-compatible alias used by dark-mode.spec.ts.
  175 |  * Asserts that background of `selector` is dark (max channel < 200),
  176 |  * or transparent (which is acceptable — it inherits the dark body colour).
  177 |  */
  178 | export async function assertBgIsDark(
  179 |   page: import('@playwright/test').Page,
  180 |   selector: string,
  181 |   label: string,
  182 | ): Promise<void> {
  183 |   const color: string = await page.$eval(selector, el =>
  184 |     getComputedStyle(el).backgroundColor,
  185 |   );
  186 |   if (isTransparent(color)) return;
  187 |   const rgb = parseRgb(color);
  188 |   expect(rgb, `${label}: could not parse background colour "${color}"`).not.toBeNull();
  189 |   expect(
  190 |     rgb![0] < 200 && rgb![1] < 200 && rgb![2] < 200,
  191 |     `${label}: background "${color}" is too bright for dark mode ` +
  192 |       `(max channel ${Math.max(...rgb!)} ≥ 200)`,
  193 |   ).toBe(true);
  194 | }
  195 | 
  196 | // ── Parameterised smoke-test factories ────────────────────────────────────────
  197 | 
  198 | /**
  199 |  * Register a two-test dark-mode smoke check for `slug`.
  200 |  *
  201 |  * Call this at module scope in any `*.spec.ts` file — it expands to a
  202 |  * `test.describe` block with a `colorScheme: 'dark'` override and two tests:
  203 |  *   1. body + header backgrounds are dark
  204 |  *   2. common component backgrounds are dark (best-effort, skips if absent)
  205 |  *
  206 |  * Example (add a new page in one line):
  207 |  *
  208 |  *   smokeTestPageDarkMode('my-new-page');
  209 |  *
  210 |  * The slug is used as the URL path (`/my-new-page/`) and as the test label.
  211 |  */
  212 | export function smokeTestPageDarkMode(slug: string): void {
  213 |   const COMPONENT_SELECTORS: Array<[string, string]> = [
  214 |     ['.callout', '.callout'],
  215 |     ['.card', '.card'],
  216 |     ['.dose-card', '.dose-card'],
  217 |     ['.panel', '.panel'],
  218 |     ['.criterion', '.criterion'],
  219 |     ['.tag', '.tag'],
  220 |     ['.drug-tag', '.drug-tag'],
  221 |     ['.badge', '.badge'],
  222 |     ['.sec-letter', '.sec-letter'],
  223 |   ];
  224 | 
  225 |   test.describe(`${slug} – dark-mode smoke test`, () => {
  226 |     test.use({ colorScheme: 'dark' });
  227 | 
  228 |     test('body and header have dark backgrounds', async ({ page }) => {
  229 |       await page.goto(`/${slug}/`);
  230 |       await page.waitForLoadState('domcontentloaded');
  231 |       await assertBgCompliant(page, 'body', `${slug} body`, 'dark');
  232 |       await assertBgCompliant(page, 'header.app-header', `${slug} header.app-header`, 'dark');
  233 |       await assertBgCompliant(page, 'header:not(.app-header)', `${slug} header (generic)`, 'dark');
  234 |     });
  235 | 
  236 |     test('component backgrounds are dark when present', async ({ page }) => {
> 237 |       await page.goto(`/${slug}/`);
      |                  ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  238 |       await page.waitForLoadState('domcontentloaded');
  239 |       await page.waitForTimeout(800);
  240 |       for (const [sel, label] of COMPONENT_SELECTORS) {
  241 |         await assertBgCompliant(page, sel, `${slug} ${label}`, 'dark');
  242 |       }
  243 |     });
  244 |   });
  245 | }
  246 | 
  247 | /**
  248 |  * Register dark-mode AND light-mode smoke checks for `slug`.
  249 |  *
  250 |  * This is the dual-scheme variant of `smokeTestPageDarkMode`.  It checks that:
  251 |  *   • In dark mode  — backgrounds are not near-white (max channel < 200)
  252 |  *   • In light mode — backgrounds are not near-black (max channel > 100)
  253 |  *
  254 |  * Example:
  255 |  *
  256 |  *   smokeTestPage('my-new-page');
  257 |  */
  258 | export function smokeTestPage(slug: string): void {
  259 |   const SCHEMES: ColorScheme[] = ['dark', 'light'];
  260 |   const COMPONENT_SELECTORS: Array<[string, string]> = [
  261 |     ['.callout', '.callout'],
  262 |     ['.card', '.card'],
  263 |     ['.dose-card', '.dose-card'],
  264 |     ['.panel', '.panel'],
  265 |     ['.criterion', '.criterion'],
  266 |     ['.tag', '.tag'],
  267 |     ['.drug-tag', '.drug-tag'],
  268 |     ['.badge', '.badge'],
  269 |     ['.sec-letter', '.sec-letter'],
  270 |   ];
  271 | 
  272 |   for (const scheme of SCHEMES) {
  273 |     test.describe(`${slug} – ${scheme}-mode smoke test`, () => {
  274 |       test.use({ colorScheme: scheme });
  275 | 
  276 |       test('body and header backgrounds are scheme-appropriate', async ({ page }) => {
  277 |         await page.goto(`/${slug}/`);
  278 |         await page.waitForLoadState('domcontentloaded');
  279 |         await assertBgCompliant(page, 'body', `${slug} body`, scheme);
  280 |         await assertBgCompliant(page, 'header.app-header', `${slug} header.app-header`, scheme);
  281 |         await assertBgCompliant(page, 'header:not(.app-header)', `${slug} header (generic)`, scheme);
  282 |       });
  283 | 
  284 |       test('component backgrounds are scheme-appropriate when present', async ({ page }) => {
  285 |         await page.goto(`/${slug}/`);
  286 |         await page.waitForLoadState('domcontentloaded');
  287 |         await page.waitForTimeout(800);
  288 |         for (const [sel, label] of COMPONENT_SELECTORS) {
  289 |           await assertBgCompliant(page, sel, `${slug} ${label}`, scheme);
  290 |         }
  291 |       });
  292 |     });
  293 |   }
  294 | }
  295 | 
```