/**
 * Pure, side-effect-free helper functions for check-css-tokens.ts.
 * Extracted into a separate module so they can be unit-tested without
 * pulling in the Node file-system operations or process.exit() calls
 * from the main script.
 */

// ── Token extraction ──────────────────────────────────────────────────────────

export function extractDefinedTokens(css: string): Set<string> {
  const defined = new Set<string>();
  const re = /--([\w-]+)\s*:/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    defined.add(`--${m[1]}`);
  }
  return defined;
}

export function extractUsedTokens(css: string): Set<string> {
  const used = new Set<string>();
  const re = /var\((--[\w-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    used.add(m[1]);
  }
  return used;
}

// ── Root-block parsers ────────────────────────────────────────────────────────

export function parseTokenBlock(block: string): Map<string, string> {
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

/**
 * Extract CSS custom-property definitions from the FIRST top-level :root {}
 * block (outside any @media rule).  Returns a map of name → normalised value.
 */
export function extractRootBlock(css: string): Map<string, string> {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
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
 * Same as extractRootBlock but targets the :root block inside
 * @media (prefers-color-scheme: dark) { … }.
 */
export function extractDarkRootBlock(css: string): Map<string, string> {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const mediaIdx = stripped.search(/@media\s*\([^)]*prefers-color-scheme\s*:\s*dark/);
  if (mediaIdx === -1) return new Map();
  const mediaOpen = stripped.indexOf("{", mediaIdx);
  if (mediaOpen === -1) return new Map();
  const afterMedia = stripped.slice(mediaOpen + 1);
  return extractRootBlock(afterMedia);
}

// ── Hardcoded hex color detection ─────────────────────────────────────────────

/**
 * Hex colors that are acceptable without a CSS variable:
 *   #fff / #ffffff  – pure white
 *   #000 / #000000  – pure black
 */
export const ALLOWED_HEX = new Set(["#fff", "#ffffff", "#000", "#000000"]);

/** Matches CSS hex colours: #RGB, #RGBA, #RRGGBB, #RRGGBBAA */
export const HEX_RE = /#[0-9a-fA-F]{3,8}/g;

/**
 * Strip the value portion of all CSS custom-property declarations from a
 * single CSS line (or a fragment of one), leaving the surrounding structure
 * intact.  This prevents colors that appear inside `--token: <value>`
 * definitions from being mistaken for hardcoded colors in rule bodies.
 *
 * The regex `--[\w-]+\s*:\s*[^;{}]*` consumes everything up to the next
 * `;`, `{`, or `}`, which correctly handles:
 *   • pretty-printed CSS:  `--color: rgba(0, 128, 0, 0.5);\n`
 *   • minified CSS:        `--color:rgba(0,128,0,0.5);--other:#fff`
 *   • last-prop (no `;`):  `--color:rgba(0,128,0,0.5)}`
 *
 * rgba/hsl/hex color functions do not contain `;`, `{`, or `}`, so the
 * full value is always consumed in one match even in minified CSS.
 */
export function stripVarDefs(line: string): string {
  return line.replace(/--[\w-]+\s*:\s*[^;{}]*/g, "");
}

export interface HardcodedHit {
  file: string;
  lineNo: number;
  hex: string;
  lineText: string;
}

export function findHardcodedHexColors(cssText: string): HardcodedHit[] {
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

    // Remove all CSS custom-property declaration values so colors defined
    // inside `--token: <value>` are not flagged as hardcoded rule-body colors.
    const withoutVarDefs = stripVarDefs(line);

    // Fast exit: no hex character remaining after stripping var-defs.
    if (!withoutVarDefs.includes("#")) {
      continue;
    }

    // Scan the stripped text for hex color values.
    const hexRe = /#[0-9a-fA-F]{3,8}/g;
    let match: RegExpExecArray | null;
    while ((match = hexRe.exec(withoutVarDefs)) !== null) {
      const hex = match[0].toLowerCase();
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

// ── Hardcoded rgba/hsl/named color detection ──────────────────────────────────

/** rgba() values whose color components are pure black or pure white are allowed. */
export function isAllowedRgba(raw: string): boolean {
  const s = raw.replace(/\s+/g, "").toLowerCase();
  return /^rgba?\((0,0,0|255,255,255)(,[.\d]+)?\)$/.test(s);
}

export const RGBA_RE = /\brgba?\s*\([^)]*\)/gi;
export const HSL_RE = /\bhsla?\s*\([^)]*\)/gi;

/**
 * Full W3C CSS named-color keyword list (excluding black/white which are
 * explicitly allowed above).  Any of these appearing in a rule body is a flag.
 */
export const CSS_NAMED_COLORS = new Set([
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
export const ALLOWED_NAMED_COLORS = new Set([
  "black","white","transparent","currentcolor","inherit","initial","unset","revert",
]);

/** Matches any CSS named color or allowed keyword as a whole word. */
export const NAMED_COLOR_RE = new RegExp(
  `\\b(${[...CSS_NAMED_COLORS, ...ALLOWED_NAMED_COLORS].join("|")})\\b`,
  "gi"
);

export interface NonHexColorHit {
  file: string;
  lineNo: number;
  value: string;
  kind: "rgba" | "hsl" | "named";
  lineText: string;
}

export function findHardcodedNonHexColors(cssText: string): NonHexColorHit[] {
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

    // Remove all CSS custom-property declaration values so colors defined
    // inside `--token: <value>` are not flagged as hardcoded rule-body colors.
    const withoutVarDefs = stripVarDefs(line);

    // ── rgba / rgb ────────────────────────────────────────────────────────────
    const rgbaRe = /\brgba?\s*\([^)]*\)/gi;
    let m: RegExpExecArray | null;
    while ((m = rgbaRe.exec(withoutVarDefs)) !== null) {
      if (!isAllowedRgba(m[0])) {
        hits.push({ file: "", lineNo: i + 1, value: m[0].trim(), kind: "rgba", lineText: lines[i].trim() });
      }
    }

    // ── hsl / hsla ────────────────────────────────────────────────────────────
    const hslRe = /\bhsla?\s*\([^)]*\)/gi;
    while ((m = hslRe.exec(withoutVarDefs)) !== null) {
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

    const namedRe = new RegExp(
      `\\b(${[...CSS_NAMED_COLORS, ...ALLOWED_NAMED_COLORS].join("|")})\\b`,
      "gi"
    );
    while ((m = namedRe.exec(rhs)) !== null) {
      const word = m[1].toLowerCase();
      if (!ALLOWED_NAMED_COLORS.has(word)) {
        hits.push({ file: "", lineNo: i + 1, value: m[1], kind: "named", lineText: lines[i].trim() });
      }
    }
  }

  return hits;
}
