import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..", "..");

function extractDefinedTokens(css: string): Set<string> {
  const defined = new Set<string>();
  const re = /--([\w-]+)\s*:/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    defined.add(`--${m[1]}`);
  }
  return defined;
}

function extractUsedTokens(css: string): Set<string> {
  const used = new Set<string>();
  const re = /var\((--[\w-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    used.add(m[1]);
  }
  return used;
}

function findPageStylesheets(root: string): string[] {
  const results: string[] = [];
  const ignored = new Set(["node_modules", ".local", "artifacts", "scripts", "var", "assets"]);
  for (const entry of readdirSync(root)) {
    if (ignored.has(entry)) continue;
    const full = join(root, entry);
    try {
      if (statSync(full).isDirectory()) {
        const candidate = join(full, "style.css");
        try {
          statSync(candidate);
          results.push(candidate);
        } catch {
          // no style.css in this dir
        }
      }
    } catch {
      // skip unreadable entries
    }
  }
  return results.sort();
}

// ── Check 1: undefined token references ─────────────────────────────────────

const sharedCssPath = join(projectRoot, "shared.css");
let sharedCss: string;
try {
  sharedCss = readFileSync(sharedCssPath, "utf8");
} catch {
  console.error(`ERROR: Cannot read shared.css at ${sharedCssPath}`);
  process.exit(1);
}

const sharedTokens = extractDefinedTokens(sharedCss);
const stylesheets = findPageStylesheets(projectRoot);

if (stylesheets.length === 0) {
  console.error("ERROR: No page style.css files found — check the project root path.");
  process.exit(1);
}

console.log(`shared.css defines ${sharedTokens.size} tokens.`);
console.log(`Checking ${stylesheets.length} page stylesheets...\n`);

let totalErrors = 0;
const errorLines: string[] = [];

for (const sheet of stylesheets) {
  const rel = sheet.replace(projectRoot + "/", "");
  let css: string;
  try {
    css = readFileSync(sheet, "utf8");
  } catch {
    console.warn(`  WARN: Could not read ${rel} — skipping`);
    continue;
  }

  const localTokens = extractDefinedTokens(css);
  const available = new Set([...sharedTokens, ...localTokens]);

  const used = extractUsedTokens(css);
  const missing: string[] = [];
  for (const token of used) {
    if (!available.has(token)) {
      missing.push(token);
    }
  }

  if (missing.length > 0) {
    missing.sort();
    errorLines.push(`  ${rel}`);
    for (const t of missing) {
      errorLines.push(`    ✗ ${t}  (used but not defined in shared.css or ${rel})`);
    }
    totalErrors += missing.length;
  } else {
    console.log(`  ✓  ${rel}`);
  }
}

if (totalErrors > 0) {
  console.log("\nMISSING TOKENS DETECTED:\n");
  for (const line of errorLines) {
    console.log(line);
  }
  const fileCount = errorLines.filter((l) => !l.startsWith("    ")).length;
  console.log(`\n${totalErrors} missing token(s) found across ${fileCount} file(s).`);
  console.log(
    "Either define the token(s) in shared.css, add them to the page's own style.css :root block, or remove the var() references."
  );
  process.exit(1);
} else {
  console.log("\nAll CSS token references are satisfied (shared.css or page-local definitions).");
}

// ── Check 2: hardcoded hex color values ──────────────────────────────────────

/**
 * Hex colors that are acceptable without a CSS variable:
 *   #fff / #ffffff  – pure white (contrast on fixed-color backgrounds)
 *   #000 / #000000  – pure black
 * Everything else must be expressed as var(--token).
 */
const ALLOWED_HEX = new Set(["#fff", "#ffffff", "#000", "#000000"]);

/** Matches CSS hex colours: #RGB, #RGBA, #RRGGBB, #RRGGBBAA */
const HEX_RE = /#[0-9a-fA-F]{3,8}/g;

/** Matches a CSS *variable definition* – the property name starts with -- */
const VAR_DEF_RE = /--[\w-]+\s*:/;

interface HardcodedHit {
  file: string;
  lineNo: number;
  hex: string;
  lineText: string;
}

function findHardcodedHexColors(cssText: string): HardcodedHit[] {
  const hits: HardcodedHit[] = [];
  const lines = cssText.split("\n");
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Track multi-line block comments
    if (inBlockComment) {
      if (line.includes("*/")) {
        line = line.slice(line.indexOf("*/") + 2);
        inBlockComment = false;
      } else {
        continue;
      }
    }

    // Strip inline block comments  /* … */
    line = line.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, "");

    // Open a new block comment that hasn't closed yet
    if (line.includes("/*")) {
      line = line.slice(0, line.indexOf("/*"));
      inBlockComment = true;
    }

    // Skip lines that only contain CSS variable definitions (--var: value)
    // e.g.  :root{--preg:#BE185D;--preg-soft:#FCE7F3}
    // If every color-bearing segment of the line is a var def, it's safe.
    // Simple heuristic: if the stripped line has no property assignment that
    // doesn't begin with --, skip it.  We check by removing all var-def
    // segments and then looking for any remaining hex.
    const withoutVarDefs = line.replace(/--[\w-]+\s*:\s*[^;{}]*/g, "");
    if (!withoutVarDefs.includes("#")) {
      continue;
    }

    // If the only hex colours left are in var() definitions on this line, skip.
    if (!VAR_DEF_RE.test(withoutVarDefs) && VAR_DEF_RE.test(line)) {
      // All hex colors were inside variable definitions
      continue;
    }

    // Find hex colours in the "non-var-def" portion
    HEX_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = HEX_RE.exec(withoutVarDefs)) !== null) {
      const hex = match[0].toLowerCase();
      // Normalise 3-digit shorthand for allowlist check
      const normalised =
        hex.length === 4
          ? "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
          : hex;
      if (ALLOWED_HEX.has(normalised)) continue;
      hits.push({ file: "", lineNo: i + 1, hex: match[0], lineText: lines[i].trim() });
    }
  }

  return hits;
}

console.log("\n──────────────────────────────────────────────────────────────");
console.log("Checking for hardcoded hex colors in page stylesheets...\n");

let hexErrors = 0;
const hexErrorLines: string[] = [];

for (const sheet of stylesheets) {
  const rel = sheet.replace(projectRoot + "/", "");
  let css: string;
  try {
    css = readFileSync(sheet, "utf8");
  } catch {
    console.warn(`  WARN: Could not read ${rel} — skipping`);
    continue;
  }

  const hits = findHardcodedHexColors(css);
  if (hits.length === 0) {
    console.log(`  ✓  ${rel}`);
  } else {
    hexErrorLines.push(`  ${rel}`);
    for (const h of hits) {
      hexErrorLines.push(`    ✗ line ${h.lineNo}: ${h.hex}  →  ${h.lineText}`);
    }
    hexErrors += hits.length;
  }
}

if (hexErrors > 0) {
  console.log("\nHARDCODED HEX COLORS DETECTED:\n");
  for (const line of hexErrorLines) {
    console.log(line);
  }
  const fileCount = hexErrorLines.filter((l) => !l.startsWith("    ")).length;
  console.log(`\n${hexErrors} hardcoded hex color(s) found across ${fileCount} file(s).`);
  console.log(
    "Define each color as a CSS custom property in shared.css or the page's own :root block,\n" +
    "then reference it via var(--token-name). Only #fff and #000 are exempt."
  );
  process.exit(1);
} else {
  console.log("\nNo hardcoded hex colors found in page stylesheets.");
}

// ── Check 3: hardcoded rgba/rgb, hsl/hsla, and named colors ──────────────────
//
// Hardcoded rgba/rgb, hsl/hsla, or named CSS color values in rule bodies are
// equally problematic for dark-mode as hex colors.
//
// Allowlisted exceptions (do not require tokenisation):
//   rgba(0,0,0,…)       – pure-black alpha overlay (shadows, borders) — inherently scheme-aware
//   rgba(255,255,255,…)  – pure-white alpha overlay (glassy overlays on dark surfaces) — scheme-aware
//   rgb(0,0,0)           – equivalent to #000
//   rgb(255,255,255)     – equivalent to #fff
//   black / white        – equivalent to #000/#fff
//   transparent          – not a chromatic color
//   currentcolor         – computed from inherited color, not hardcoded
//   inherit/initial/unset/revert – CSS-wide keywords

/** rgba() values whose color components are pure black or pure white are allowed. */
function isAllowedRgba(raw: string): boolean {
  const s = raw.replace(/\s+/g, "").toLowerCase();
  return /^rgba?\((0,0,0|255,255,255)(,[.\d]+)?\)$/.test(s);
}

const RGBA_RE = /\brgba?\s*\([^)]*\)/gi;
const HSL_RE = /\bhsla?\s*\([^)]*\)/gi;

/**
 * Full W3C CSS named-color keyword list (excluding black/white which are
 * explicitly allowed above).  Any of these appearing in a rule body is a flag.
 */
const CSS_NAMED_COLORS = new Set([
  "aliceblue","antiquewhite","aqua","aquamarine","azure","beige","bisque",
  "blanchedalmond","blue","blueviolet","brown","burlywood","cadetblue",
  "chartreuse","chocolate","coral","cornflowerblue","cornsilk","crimson",
  "cyan","darkblue","darkcyan","darkgoldenrod","darkgray","darkgreen",
  "darkgrey","darkkhaki","darkmagenta","darkolivegreen","darkorange",
  "darkorchid","darkred","darksalmon","darkseagreen","darkslateblue",
  "darkslategray","darkslategrey","darkturquoise","darkviolet","deeppink",
  "deepskyblue","dimgray","dimgrey","dodgerblue","firebrick","floralwhite",
  "forestgreen","fuchsia","gainsboro","ghostwhite","gold","goldenrod","gray",
  "green","greenyellow","grey","honeydew","hotpink","indianred","indigo",
  "ivory","khaki","lavender","lavenderblush","lawngreen","lemonchiffon",
  "lightblue","lightcoral","lightcyan","lightgoldenrodyellow","lightgray",
  "lightgreen","lightgrey","lightpink","lightsalmon","lightseagreen",
  "lightskyblue","lightslategray","lightslategrey","lightsteelblue",
  "lightyellow","lime","limegreen","linen","magenta","maroon",
  "mediumaquamarine","mediumblue","mediumorchid","mediumpurple",
  "mediumseagreen","mediumslateblue","mediumspringgreen","mediumturquoise",
  "mediumvioletred","midnightblue","mintcream","mistyrose","moccasin",
  "navajowhite","navy","oldlace","olive","olivedrab","orange","orangered",
  "orchid","palegoldenrod","palegreen","paleturquoise","palevioletred",
  "papayawhip","peachpuff","peru","pink","plum","powderblue","purple",
  "rebeccapurple","red","rosybrown","royalblue","saddlebrown","salmon",
  "sandybrown","seagreen","seashell","sienna","silver","skyblue","slateblue",
  "slategray","slategrey","snow","springgreen","steelblue","tan","teal",
  "thistle","tomato","turquoise","violet","wheat","yellow","yellowgreen",
]);

/** CSS-wide keywords and color-scheme-safe named values that are always allowed. */
const ALLOWED_NAMED_COLORS = new Set([
  "black","white","transparent","currentcolor","inherit","initial","unset","revert",
]);

/** Matches any CSS named color or allowed keyword as a whole word. */
const NAMED_COLOR_RE = new RegExp(
  `\\b(${[...CSS_NAMED_COLORS, ...ALLOWED_NAMED_COLORS].join("|")})\\b`,
  "gi"
);

interface NonHexColorHit {
  file: string;
  lineNo: number;
  value: string;
  kind: "rgba" | "hsl" | "named";
  lineText: string;
}

function findHardcodedNonHexColors(cssText: string): NonHexColorHit[] {
  const hits: NonHexColorHit[] = [];
  const lines = cssText.split("\n");
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (inBlockComment) {
      if (line.includes("*/")) {
        line = line.slice(line.indexOf("*/") + 2);
        inBlockComment = false;
      } else {
        continue;
      }
    }

    line = line.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, "");

    if (line.includes("/*")) {
      line = line.slice(0, line.indexOf("/*"));
      inBlockComment = true;
    }

    // Strip variable-definition segments so we don't flag colors inside --token: value
    const withoutVarDefs = line.replace(/--[\w-]+\s*:\s*[^;{}]*/g, "");

    // ── rgba / rgb ────────────────────────────────────────────────────────────
    RGBA_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = RGBA_RE.exec(withoutVarDefs)) !== null) {
      if (!isAllowedRgba(m[0])) {
        hits.push({ file: "", lineNo: i + 1, value: m[0].trim(), kind: "rgba", lineText: lines[i].trim() });
      }
    }

    // ── hsl / hsla ────────────────────────────────────────────────────────────
    HSL_RE.lastIndex = 0;
    while ((m = HSL_RE.exec(withoutVarDefs)) !== null) {
      hits.push({ file: "", lineNo: i + 1, value: m[0].trim(), kind: "hsl", lineText: lines[i].trim() });
    }

    // ── named colors ─────────────────────────────────────────────────────────
    // Only flag named colors that appear in a property-value context:
    // the stripped line must contain a colon (i.e. be inside a rule body),
    // and the match must appear after the colon (right-hand side of a declaration).
    const colonIdx = withoutVarDefs.indexOf(":");
    if (colonIdx === -1) continue;
    // Strip var(…) calls so color words inside token names (var(--purple), var(--teal))
    // are not mistakenly flagged as hardcoded named colors.
    const rhs = withoutVarDefs.slice(colonIdx + 1).replace(/var\([^)]*\)/g, "");

    NAMED_COLOR_RE.lastIndex = 0;
    while ((m = NAMED_COLOR_RE.exec(rhs)) !== null) {
      const word = m[1].toLowerCase();
      if (!ALLOWED_NAMED_COLORS.has(word)) {
        hits.push({ file: "", lineNo: i + 1, value: m[1], kind: "named", lineText: lines[i].trim() });
      }
    }
  }

  return hits;
}

console.log("\n──────────────────────────────────────────────────────────────");
console.log("Checking for hardcoded rgba/hsl/named colors in page stylesheets...\n");

let nonHexErrors = 0;
const nonHexErrorLines: string[] = [];

for (const sheet of stylesheets) {
  const rel = sheet.replace(projectRoot + "/", "");
  let css: string;
  try {
    css = readFileSync(sheet, "utf8");
  } catch {
    console.warn(`  WARN: Could not read ${rel} — skipping`);
    continue;
  }

  const hits = findHardcodedNonHexColors(css);
  if (hits.length === 0) {
    console.log(`  ✓  ${rel}`);
  } else {
    nonHexErrorLines.push(`  ${rel}`);
    for (const h of hits) {
      nonHexErrorLines.push(`    ✗ line ${h.lineNo} [${h.kind}]: ${h.value}  →  ${h.lineText}`);
    }
    nonHexErrors += hits.length;
  }
}

if (nonHexErrors > 0) {
  console.log("\nHARDCODED NON-HEX COLORS DETECTED:\n");
  for (const line of nonHexErrorLines) {
    console.log(line);
  }
  const fileCount = nonHexErrorLines.filter((l) => !l.startsWith("    ")).length;
  console.log(`\n${nonHexErrors} hardcoded non-hex color(s) found across ${fileCount} file(s).`);
  console.log(
    "Define each color as a CSS custom property in shared.css or the page's own :root block,\n" +
    "then reference it via var(--token-name).\n" +
    "Exceptions: rgba/rgb with pure black/white components (0,0,0 or 255,255,255),\n" +
    "the keywords transparent/currentcolor/inherit/initial/unset, and black/white."
  );
  process.exit(1);
} else {
  console.log("\nNo hardcoded rgba/hsl/named colors found in page stylesheets.");
}

// ── Check 4: cross-page duplicate token definitions ───────────────────────────
//
// Detects CSS custom properties that are defined in two or more page stylesheets.
// These should either be consolidated into shared.css (when values are identical)
// or have a comment in each file explaining why the values intentionally differ.
//
// Tokens that exist in shared.css are excluded from this check — page-level
// redefinitions of shared tokens are acceptable fallbacks (see peds/style.css).

console.log("\n──────────────────────────────────────────────────────────────");
console.log("Checking for cross-page duplicate token definitions...\n");

/**
 * Extract all CSS custom-property definitions as composite-keyed { name:mode, value } pairs,
 * tracking light-mode and dark-mode values separately.
 *
 * Light-mode tokens (from the top-level :root block, outside any @media rule) are
 * keyed as "--token:light".  Dark-mode tokens (from :root inside
 * @media (prefers-color-scheme: dark)) are keyed as "--token:dark".
 *
 * This allows Check 4 to detect drift in dark-mode values even when two pages
 * share identical light-mode values for the same token.
 *
 * Depends on extractRootBlock / extractDarkRootBlock / parseTokenBlock which are
 * defined later in this file; function declarations are hoisted so the call order
 * is safe.
 */
function extractTokenDefinitions(css: string): Map<string, string> {
  const defs = new Map<string, string>();
  const lightTokens = extractRootBlock(css);
  const darkTokens  = extractDarkRootBlock(css);
  for (const [name, value] of lightTokens) {
    defs.set(`${name}:light`, value);
  }
  for (const [name, value] of darkTokens) {
    defs.set(`${name}:dark`, value);
  }
  return defs;
}

// Build map: compositeKey ("--token:light" | "--token:dark") → list of { file, value }
const crossPageMap = new Map<string, Array<{ file: string; value: string }>>();

for (const sheet of stylesheets) {
  const rel = sheet.replace(projectRoot + "/", "");
  let css: string;
  try {
    css = readFileSync(sheet, "utf8");
  } catch {
    continue;
  }
  const defs = extractTokenDefinitions(css);
  for (const [compositeKey, value] of defs) {
    // compositeKey is "--token:light" or "--token:dark"
    // Extract base token name (everything before the last colon) for the
    // shared.css lookup — shared tokens are expected fallback redefinitions.
    const modeIdx = compositeKey.lastIndexOf(":");
    const baseName = compositeKey.slice(0, modeIdx);
    if (sharedTokens.has(baseName)) continue;
    if (!crossPageMap.has(compositeKey)) {
      crossPageMap.set(compositeKey, []);
    }
    crossPageMap.get(compositeKey)!.push({ file: rel, value });
  }
}

let crossErrors = 0;
const crossErrorLines: string[] = [];
const crossWarnLines: string[] = [];

for (const [compositeKey, entries] of crossPageMap) {
  if (entries.length < 2) continue;
  const modeIdx = compositeKey.lastIndexOf(":");
  const baseName = compositeKey.slice(0, modeIdx);   // "--token"
  const mode     = compositeKey.slice(modeIdx + 1);  // "light" or "dark"

  const uniqueValues = new Set(entries.map((e) => e.value));
  if (uniqueValues.size === 1) {
    // All pages agree on the value → should be in shared.css
    const value = [...uniqueValues][0];
    crossErrorLines.push(`  ${baseName}  [${mode}]  (value: ${value})`);
    for (const e of entries) {
      crossErrorLines.push(`    defined in: ${e.file}`);
    }
    crossErrors++;
  } else {
    // Values differ → possible unintentional drift
    crossWarnLines.push(`  ${baseName}  [${mode}]  (values differ across pages)`);
    for (const e of entries) {
      crossWarnLines.push(`    ${e.file}  →  ${e.value}`);
    }
  }
}

if (crossWarnLines.length > 0) {
  console.log("TOKENS WITH DIFFERING VALUES ACROSS PAGES (review for drift):\n");
  for (const line of crossWarnLines) {
    console.log(line);
  }
  console.log(
    "\nIf the difference is intentional, add a comment in each page's :root block\n" +
    "explaining why the value diverges from the other page(s).\n"
  );
}

if (crossErrors > 0) {
  console.log("CROSS-PAGE DUPLICATE TOKENS DETECTED (identical value in multiple pages):\n");
  for (const line of crossErrorLines) {
    console.log(line);
  }
  console.log(
    `\n${crossErrors} token(s) with identical values found in multiple page stylesheets.`
  );
  console.log(
    "Move these tokens into shared.css so they are defined once and cannot drift.\n" +
    "If a page intentionally diverges, add a comment in its :root block and the\n" +
    "values will appear under the 'differing values' warning above instead."
  );
  process.exit(1);
} else if (crossWarnLines.length === 0) {
  console.log("No cross-page duplicate token definitions found.");
}

// ── Check 5: index.css fallback tokens vs shared.css ────────────────────────
//
// The home page (index.css at the project root) embeds a fallback :root block
// that mirrors key tokens from shared.css.  Because the two files are edited
// independently, values can silently drift.  This check extracts matching
// tokens from both files — comparing light-mode and dark-mode values
// separately — and fails if any value diverges.
//
// Token name mapping:
//   index.css --accent  ↔  shared.css --purple
//   All other bridged tokens share the same name in both files.

console.log("\n──────────────────────────────────────────────────────────────");
console.log("Checking index.css fallback tokens against shared.css...\n");

/**
 * Tokens that must stay in sync between index.css and shared.css.
 * Key   = token name as it appears in index.css
 * Value = token name as it appears in shared.css
 */
const HOME_TOKEN_MAP: Record<string, string> = {
  "--bg":       "--bg",
  "--surface":  "--surface",
  "--ink":      "--ink",
  "--ink-soft": "--ink-soft",
  "--ink-muted":"--ink-muted",
  "--line":     "--line",
  "--accent":   "--purple",
};

/**
 * Extract all CSS custom-property definitions from a block of CSS text,
 * restricted to the content of the FIRST top-level :root {} block found
 * (i.e. outside any @media rule).  Returns a map of name → normalised value.
 */
function extractRootBlock(css: string): Map<string, string> {
  // Strip comments first
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  // Find :root { ... } — scan for the block, handling nested braces
  const rootIdx = stripped.search(/:root\s*\{/);
  if (rootIdx === -1) return new Map();
  const openBrace = stripped.indexOf("{", rootIdx);
  if (openBrace === -1) return new Map();
  let depth = 1;
  let pos = openBrace + 1;
  while (pos < stripped.length && depth > 0) {
    if (stripped[pos] === "{") depth++;
    else if (stripped[pos] === "}") depth--;
    pos++;
  }
  return parseTokenBlock(stripped.slice(openBrace + 1, pos - 1));
}

/**
 * Same as extractRootBlock but for the :root block inside
 * @media (prefers-color-scheme: dark) { ... }.
 */
function extractDarkRootBlock(css: string): Map<string, string> {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const mediaIdx = stripped.search(/@media\s*\([^)]*prefers-color-scheme\s*:\s*dark/);
  if (mediaIdx === -1) return new Map();
  // Find the opening brace of the @media block
  const mediaOpen = stripped.indexOf("{", mediaIdx);
  if (mediaOpen === -1) return new Map();
  // Now find :root inside that @media block
  const afterMedia = stripped.slice(mediaOpen + 1);
  return extractRootBlock(afterMedia);
}

function parseTokenBlock(block: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /--([\w-]+)\s*:\s*([^;{}]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    const name = `--${m[1]}`;
    const value = m[2].trim().replace(/\s+/g, " ").toLowerCase();
    if (!map.has(name)) map.set(name, value);
  }
  return map;
}

const indexCssPath = join(projectRoot, "index.css");
let indexCss: string;
try {
  indexCss = readFileSync(indexCssPath, "utf8");
} catch {
  console.error(`ERROR: Cannot read index.css at ${indexCssPath}`);
  process.exit(1);
}

const homeLight = extractRootBlock(indexCss);
const homeDark  = extractDarkRootBlock(indexCss);
const sharedLight = extractRootBlock(sharedCss);
const sharedDark  = extractDarkRootBlock(sharedCss);

let syncErrors = 0;
const syncErrorLines: string[] = [];

for (const [homeToken, sharedToken] of Object.entries(HOME_TOKEN_MAP)) {
  for (const mode of ["light", "dark"] as const) {
    const homeMap   = mode === "light" ? homeLight  : homeDark;
    const sharedMap = mode === "light" ? sharedLight : sharedDark;

    const homeVal   = homeMap.get(homeToken);
    const sharedVal = sharedMap.get(sharedToken);

    if (homeVal === undefined && sharedVal === undefined) continue;

    if (homeVal === undefined) {
      syncErrorLines.push(
        `  ✗ [${mode}] index.css missing ${homeToken}` +
        `  (shared.css ${sharedToken} = ${sharedVal})`
      );
      syncErrors++;
    } else if (sharedVal === undefined) {
      syncErrorLines.push(
        `  ✗ [${mode}] shared.css missing ${sharedToken}` +
        `  (index.css ${homeToken} = ${homeVal})`
      );
      syncErrors++;
    } else if (homeVal !== sharedVal) {
      const sharedLabel = sharedToken !== homeToken
        ? `${sharedToken} (shared.css)`
        : `${sharedToken}`;
      syncErrorLines.push(
        `  ✗ [${mode}] ${homeToken} diverged:`
      );
      syncErrorLines.push(`      index.css  : ${homeVal}`);
      syncErrorLines.push(`      shared.css ${sharedLabel}: ${sharedVal}`);
      syncErrors++;
    } else {
      console.log(`  ✓  [${mode}] ${homeToken}${sharedToken !== homeToken ? ` (↔ ${sharedToken})` : ""}`);
    }
  }
}

if (syncErrors > 0) {
  console.log("\nINDEX.CSS / SHARED.CSS TOKEN DRIFT DETECTED:\n");
  for (const line of syncErrorLines) {
    console.log(line);
  }
  console.log(
    `\n${syncErrors} diverged token(s) between index.css and shared.css.`
  );
  console.log(
    "Update the matching token in index.css to re-sync with shared.css.\n" +
    "Token mapping: index.css --accent ↔ shared.css --purple;\n" +
    "all other bridged tokens share the same name in both files."
  );
  process.exit(1);
} else {
  console.log("\nindex.css fallback tokens are in sync with shared.css.");
}

// ── Check 6: page :root tokens missing dark-mode overrides ───────────────────
//
// Any CSS custom property defined in a page's top-level :root block cascades
// AFTER shared.css (which is loaded first).  This means the page's light-mode
// :root value silently overrides shared.css's @media(prefers-color-scheme:dark)
// value for the same token — breaking dark mode without any error.
//
// Every token defined in a page-level :root must therefore have a matching
// entry in the same file's @media(prefers-color-scheme:dark) :root block so
// that the correct dark value is restored when dark mode is active.
//
// The peds-style "full mirror" pattern (all shared tokens in both light and
// dark blocks) already satisfies this rule and will pass unchanged.

console.log("\n──────────────────────────────────────────────────────────────");
console.log("Checking page :root tokens for missing dark-mode overrides...\n");

let darkOverrideErrors = 0;
const darkOverrideErrorLines: string[] = [];

for (const sheet of stylesheets) {
  const rel = sheet.replace(projectRoot + "/", "");
  let css: string;
  try {
    css = readFileSync(sheet, "utf8");
  } catch {
    console.warn(`  WARN: Could not read ${rel} — skipping`);
    continue;
  }

  const lightRootTokens = extractRootBlock(css);
  if (lightRootTokens.size === 0) {
    console.log(`  ✓  ${rel}  (no :root tokens)`);
    continue;
  }

  // Only flag tokens whose values are chromatic colors (contain a # hex code).
  // Non-color tokens such as border-radius (--r:8px), spacing, or box-shadow
  // values that use only pure-black/white rgba() do not need dark-mode overrides.
  const colorRootTokens = new Map<string, string>();
  for (const [name, value] of lightRootTokens) {
    if (value.includes("#")) {
      colorRootTokens.set(name, value);
    }
  }
  if (colorRootTokens.size === 0) {
    console.log(`  ✓  ${rel}  (no color :root tokens)`);
    continue;
  }

  const darkRootTokens = extractDarkRootBlock(css);
  const missing: string[] = [];
  for (const tokenName of colorRootTokens.keys()) {
    if (!darkRootTokens.has(tokenName)) {
      missing.push(tokenName);
    }
  }

  if (missing.length > 0) {
    missing.sort();
    darkOverrideErrorLines.push(`  ${rel}`);
    for (const t of missing) {
      darkOverrideErrorLines.push(
        `    ✗ ${t}  (in :root but missing from @media(prefers-color-scheme:dark) :root)`
      );
    }
    darkOverrideErrors += missing.length;
  } else {
    console.log(`  ✓  ${rel}`);
  }
}

if (darkOverrideErrors > 0) {
  console.log("\nPAGE :ROOT TOKENS WITHOUT DARK-MODE OVERRIDES DETECTED:\n");
  for (const line of darkOverrideErrorLines) {
    console.log(line);
  }
  const fileCount = darkOverrideErrorLines.filter((l) => !l.startsWith("    ")).length;
  console.log(`\n${darkOverrideErrors} token(s) missing dark-mode overrides across ${fileCount} file(s).`);
  console.log(
    "Each token defined in a page's :root must also appear in a\n" +
    "@media (prefers-color-scheme: dark) { :root { ... } } block in the same file.\n" +
    "Without a dark-mode override, the page's light value silences shared.css's\n" +
    "dark value and breaks dark mode for that token."
  );
  process.exit(1);
} else {
  console.log("\nAll page :root tokens have corresponding dark-mode overrides.");
}
