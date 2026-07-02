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

// ── Check 3: cross-page duplicate token definitions ───────────────────────────
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
 * Extract all CSS custom-property definitions as { name, value } pairs.
 * Strips comments before scanning so commented-out definitions are ignored.
 * Captures only the *first* value token per definition (stops at ; or }).
 */
function extractTokenDefinitions(css: string): Map<string, string> {
  const defs = new Map<string, string>();
  // Remove block comments
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const re = /--([\w-]+)\s*:\s*([^;{}]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) !== null) {
    const name = `--${m[1]}`;
    // Normalise: collapse whitespace, lowercase
    const value = m[2].trim().replace(/\s+/g, " ").toLowerCase();
    if (!defs.has(name)) {
      defs.set(name, value);
    }
  }
  return defs;
}

// Build map: tokenName → list of { file, value }
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
  for (const [name, value] of defs) {
    // Skip tokens that are already defined in shared.css — local redefinitions
    // of shared tokens are expected as offline/load-failure fallbacks.
    if (sharedTokens.has(name)) continue;
    if (!crossPageMap.has(name)) {
      crossPageMap.set(name, []);
    }
    crossPageMap.get(name)!.push({ file: rel, value });
  }
}

let crossErrors = 0;
const crossErrorLines: string[] = [];
const crossWarnLines: string[] = [];

for (const [token, entries] of crossPageMap) {
  if (entries.length < 2) continue;
  const uniqueValues = new Set(entries.map((e) => e.value));
  if (uniqueValues.size === 1) {
    // All pages agree on the value → should be in shared.css
    const value = [...uniqueValues][0];
    crossErrorLines.push(`  ${token}  (value: ${value})`);
    for (const e of entries) {
      crossErrorLines.push(`    defined in: ${e.file}`);
    }
    crossErrors++;
  } else {
    // Values differ → possible unintentional drift
    crossWarnLines.push(`  ${token}  (values differ across pages)`);
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
