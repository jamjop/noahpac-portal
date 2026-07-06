import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractDefinedTokens,
  extractUsedTokens,
  extractRootBlock,
  extractDarkRootBlock,
  findHardcodedHexColors,
  findHardcodedNonHexColors,
  ALLOWED_HEX,
} from "./check-css-tokens.lib.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..", "..");

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

console.log("\n──────────────────────────────────────────────────────────────");
console.log("Checking for hardcoded rgba/hsl/named colors in shared.css and page stylesheets...\n");

let nonHexErrors = 0;
const nonHexErrorLines: string[] = [];

{
  const sharedHits = findHardcodedNonHexColors(sharedCss);
  if (sharedHits.length === 0) {
    console.log("  ✓  shared.css");
  } else {
    nonHexErrorLines.push("  shared.css");
    for (const h of sharedHits) {
      nonHexErrorLines.push(`    ✗ line ${h.lineNo} [${h.kind}]: ${h.value}  →  ${h.lineText}`);
    }
    nonHexErrors += sharedHits.length;
  }
}

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

console.log("\n──────────────────────────────────────────────────────────────");
console.log("Checking for cross-page duplicate token definitions...\n");

/**
 * Extract all CSS custom-property definitions as composite-keyed { name:mode, value } pairs,
 * tracking light-mode and dark-mode values separately.
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
  const baseName = compositeKey.slice(0, modeIdx);
  const mode     = compositeKey.slice(modeIdx + 1);

  const uniqueValues = new Set(entries.map((e) => e.value));
  if (uniqueValues.size === 1) {
    const value = [...uniqueValues][0];
    crossErrorLines.push(`  ${baseName}  [${mode}]  (value: ${value})`);
    for (const e of entries) {
      crossErrorLines.push(`    defined in: ${e.file}`);
    }
    crossErrors++;
  } else {
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

console.log("\n──────────────────────────────────────────────────────────────");
console.log("Checking index.css fallback tokens against shared.css...\n");

const HOME_TOKEN_MAP: Record<string, string> = {
  "--bg":       "--bg",
  "--surface":  "--surface",
  "--ink":      "--ink",
  "--ink-soft": "--ink-soft",
  "--ink-muted":"--ink-muted",
  "--line":     "--line",
  "--accent":   "--purple",
};

const indexCssPath = join(projectRoot, "index.css");
let indexCss: string;
try {
  indexCss = readFileSync(indexCssPath, "utf8");
} catch {
  console.error(`ERROR: Cannot read index.css at ${indexCssPath}`);
  process.exit(1);
}

const homeLight  = extractRootBlock(indexCss);
const homeDark   = extractDarkRootBlock(indexCss);
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

// Satisfy TypeScript: ALLOWED_HEX is imported but only used in the lib; re-export
// via a dead reference so the import is not pruned by aggressive type checkers.
void ALLOWED_HEX;
