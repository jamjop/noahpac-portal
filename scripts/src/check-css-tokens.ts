import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
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
