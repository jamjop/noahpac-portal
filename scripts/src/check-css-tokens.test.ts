import { describe, it, expect } from "vitest";
import {
  stripVarDefs,
  findHardcodedHexColors,
  findHardcodedNonHexColors,
  isAllowedRgba,
  extractDefinedTokens,
  extractUsedTokens,
  extractRootBlock,
  extractDarkRootBlock,
  parseTokenBlock,
} from "./check-css-tokens.lib.js";

// ── stripVarDefs ──────────────────────────────────────────────────────────────

describe("stripVarDefs", () => {
  it("strips a single var-def leaving surrounding structure", () => {
    expect(stripVarDefs(":root{--color:#ff0000}")).toBe(":root{}");
  });

  it("strips multiple var-defs on one minified line", () => {
    expect(stripVarDefs(":root{--a:#ff0000;--b:#00ff00}")).toBe(":root{;}");
  });

  it("strips rgba value inside a var-def", () => {
    expect(stripVarDefs(":root{--shadow:rgba(0,0,128,0.5)}")).toBe(":root{}");
  });

  it("strips hsl value inside a var-def", () => {
    expect(stripVarDefs(":root{--c:hsl(200,100%,50%)}")).toBe(":root{}");
  });

  it("strips multi-value shorthand inside a var-def (box-shadow)", () => {
    const input = ":root{--shadow:0 4px 8px rgba(0,0,128,0.3),inset 0 1px rgba(255,255,255,0.2)}";
    expect(stripVarDefs(input)).toBe(":root{}");
  });

  it("does NOT strip a rule-body property that starts with a plain name", () => {
    const input = ".foo{color:#ff0000}";
    expect(stripVarDefs(input)).toBe(".foo{color:#ff0000}");
  });

  it("strips var-def but leaves adjacent rule-body property", () => {
    const input = ":root{--c:#ff0000}.foo{color:#aabbcc}";
    const result = stripVarDefs(input);
    expect(result).toContain("#aabbcc");
    expect(result).not.toContain("#ff0000");
  });

  it("strips var-def with spaces around colon", () => {
    expect(stripVarDefs(":root{--c : rgba(0,0,0,0.5)}")).toBe(":root{}");
  });

  it("handles last var-def without trailing semicolon before closing brace", () => {
    expect(stripVarDefs(":root{--warn-soft:rgba(254,252,232,1)}")).toBe(":root{}");
  });

  it("strips multiple minified var-defs with rgba values", () => {
    const input = ":root{--warn-soft:rgba(254,252,232,1);--ok-soft:rgba(240,253,244,1)}";
    const result = stripVarDefs(input);
    expect(result).toBe(":root{;}");
    expect(result).not.toContain("rgba");
  });
});

// ── isAllowedRgba ─────────────────────────────────────────────────────────────

describe("isAllowedRgba", () => {
  it("allows rgb(0,0,0)", () => expect(isAllowedRgba("rgb(0,0,0)")).toBe(true));
  it("allows rgba(0,0,0,0.5)", () => expect(isAllowedRgba("rgba(0,0,0,0.5)")).toBe(true));
  it("allows rgb(255,255,255)", () => expect(isAllowedRgba("rgb(255,255,255)")).toBe(true));
  it("allows rgba(255,255,255,0.1)", () => expect(isAllowedRgba("rgba(255,255,255,0.1)")).toBe(true));
  it("rejects rgba(0,0,128,0.5)", () => expect(isAllowedRgba("rgba(0,0,128,0.5)")).toBe(false));
  it("rejects rgb(255,0,0)", () => expect(isAllowedRgba("rgb(255,0,0)")).toBe(false));
  it("handles spaces around values", () => expect(isAllowedRgba("rgba( 0, 0, 0, 0.3 )")).toBe(true));
});

// ── findHardcodedHexColors ────────────────────────────────────────────────────

describe("findHardcodedHexColors", () => {
  it("returns no hits for clean CSS with only var-defs", () => {
    const css = ":root{\n  --color: #BE185D;\n  --soft: #FCE7F3;\n}";
    expect(findHardcodedHexColors(css)).toHaveLength(0);
  });

  it("returns no hits for minified var-defs only", () => {
    const css = ":root{--preg:#BE185D;--preg-soft:#FCE7F3}";
    expect(findHardcodedHexColors(css)).toHaveLength(0);
  });

  it("returns no hits for many minified var-defs on one line", () => {
    const css = ":root{--a:#111;--b:#222;--c:#333;--d:#444}";
    expect(findHardcodedHexColors(css)).toHaveLength(0);
  });

  it("flags a hardcoded hex in a rule body", () => {
    const css = ".foo { color: #BE185D; }";
    const hits = findHardcodedHexColors(css);
    expect(hits).toHaveLength(1);
    expect(hits[0].hex).toBe("#BE185D");
  });

  it("does NOT flag #fff or #000 in rule bodies", () => {
    const css = ".foo { color: #fff; background: #000; }";
    expect(findHardcodedHexColors(css)).toHaveLength(0);
  });

  it("does NOT flag #ffffff or #000000 in rule bodies", () => {
    const css = ".foo { color: #ffffff; background: #000000; }";
    expect(findHardcodedHexColors(css)).toHaveLength(0);
  });

  it("flags hardcoded hex in a rule body on a minified line that also contains var-defs", () => {
    // Regression: the old second-check heuristic used to skip this line,
    // producing a false negative when a minified line mixed var-defs with
    // rule-body hex colors.
    const css = ":root{--c:#ff0000}.foo{color:#aabbcc}";
    const hits = findHardcodedHexColors(css);
    expect(hits.some((h) => h.hex === "#aabbcc")).toBe(true);
  });

  it("does not flag a var-def rgba-lookalike: hex directly after var-def on same line", () => {
    const css = ":root{--tok:#BE185D;--tok2:#FCE7F3}.bar{border:1px solid #fff}";
    const hits = findHardcodedHexColors(css);
    expect(hits.every((h) => h.hex.toLowerCase() === "#fff")).toBe(true);
    expect(findHardcodedHexColors(css)).toHaveLength(0);
  });

  it("skips commented-out hex colors", () => {
    const css = "/* .foo { color: #BE185D; } */\n.bar { color: var(--c); }";
    expect(findHardcodedHexColors(css)).toHaveLength(0);
  });

  it("handles multi-line block comments spanning hex lines", () => {
    const css = "/*\n  color: #BE185D;\n*/\n.bar { color: var(--c); }";
    expect(findHardcodedHexColors(css)).toHaveLength(0);
  });

  it("reports the correct line number", () => {
    const css = ".a { color: var(--c); }\n.b { color: #aabbcc; }";
    const hits = findHardcodedHexColors(css);
    expect(hits[0].lineNo).toBe(2);
  });

  it("flags multiple hardcoded hex values on the same line", () => {
    const css = ".foo { border: 1px solid #aabbcc; background: #112233; }";
    const hits = findHardcodedHexColors(css);
    expect(hits).toHaveLength(2);
  });
});

// ── findHardcodedNonHexColors ─────────────────────────────────────────────────

describe("findHardcodedNonHexColors", () => {
  // ── rgba / rgb ──────────────────────────────────────────────────────────────

  it("returns no hits when all rgba values are inside var-defs (pretty-printed)", () => {
    const css = ":root {\n  --warn-soft: rgba(254,252,232,1);\n  --ok-soft: rgba(240,253,244,1);\n}";
    expect(findHardcodedNonHexColors(css)).toHaveLength(0);
  });

  it("returns no hits when all rgba values are inside var-defs (minified, single line)", () => {
    const css = ":root{--warn-soft:rgba(254,252,232,1);--ok-soft:rgba(240,253,244,1)}";
    expect(findHardcodedNonHexColors(css)).toHaveLength(0);
  });

  it("returns no hits for var-def with multi-value shorthand containing rgba", () => {
    const css = ":root{--shadow:0 4px 8px rgba(0,0,128,0.3),inset 0 1px rgba(255,255,255,0.2)}";
    expect(findHardcodedNonHexColors(css)).toHaveLength(0);
  });

  it("returns no hits for minified last var-def with rgba (no trailing semicolon)", () => {
    const css = ":root{--warn-soft:rgba(254,252,232,1)}";
    expect(findHardcodedNonHexColors(css)).toHaveLength(0);
  });

  it("flags rgba in a rule body", () => {
    const css = ".foo { color: rgba(0,0,128,0.5); }";
    const hits = findHardcodedNonHexColors(css);
    expect(hits).toHaveLength(1);
    expect(hits[0].kind).toBe("rgba");
  });

  it("does NOT flag rgba(0,0,0,…) or rgba(255,255,255,…) in rule bodies", () => {
    const css = ".foo { box-shadow: 0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2); }";
    expect(findHardcodedNonHexColors(css)).toHaveLength(0);
  });

  it("flags rgba in a rule body on a minified line that also contains var-defs", () => {
    const css = ":root{--c:#fff}.foo{color:rgba(0,0,128,0.5)}";
    const hits = findHardcodedNonHexColors(css);
    expect(hits.some((h) => h.kind === "rgba")).toBe(true);
  });

  it("flags rgba inside a multi-declaration minified rule body", () => {
    const css = ".a{color:red;background:rgba(0,128,0,0.5)}";
    const hits = findHardcodedNonHexColors(css);
    expect(hits.some((h) => h.kind === "rgba")).toBe(true);
  });

  // ── hsl / hsla ──────────────────────────────────────────────────────────────

  it("returns no hits when hsl value is inside a var-def (minified)", () => {
    const css = ":root{--c:hsl(200,100%,50%)}";
    expect(findHardcodedNonHexColors(css)).toHaveLength(0);
  });

  it("flags hsl in a rule body", () => {
    const css = ".foo { color: hsl(200,100%,50%); }";
    const hits = findHardcodedNonHexColors(css);
    expect(hits).toHaveLength(1);
    expect(hits[0].kind).toBe("hsl");
  });

  it("returns no hits for hsl inside var-def and rgba(0,0,0,…) in rule body", () => {
    const css = ":root{--c:hsl(200,100%,50%)}.bar{box-shadow:0 2px rgba(0,0,0,0.3)}";
    expect(findHardcodedNonHexColors(css)).toHaveLength(0);
  });

  // ── named colors ────────────────────────────────────────────────────────────

  it("does NOT flag black, white, transparent, currentcolor", () => {
    const css = ".foo { color: black; background: white; border-color: transparent; fill: currentcolor; }";
    expect(findHardcodedNonHexColors(css)).toHaveLength(0);
  });

  it("flags a named color in a rule body", () => {
    const css = ".foo { color: red; }";
    const hits = findHardcodedNonHexColors(css);
    expect(hits.some((h) => h.kind === "named" && h.value.toLowerCase() === "red")).toBe(true);
  });

  it("does NOT flag a named color inside a var() token name", () => {
    const css = ".foo { color: var(--purple); }";
    expect(findHardcodedNonHexColors(css)).toHaveLength(0);
  });

  it("does NOT flag named colors inside var-defs (e.g. a token whose value is a named color)", () => {
    const css = ":root{--c:teal}";
    expect(findHardcodedNonHexColors(css)).toHaveLength(0);
  });

  // ── mixed / multi-declaration minified lines ─────────────────────────────────

  it("handles a minified line with var-defs, rule bodies, and rgba values correctly", () => {
    // var-def rgba should be ignored; rule-body rgba should be flagged
    const css = ":root{--shadow:rgba(0,0,0,0.5)}.foo{color:rgba(0,0,128,0.5)}";
    const hits = findHardcodedNonHexColors(css);
    expect(hits).toHaveLength(1);
    expect(hits[0].kind).toBe("rgba");
    expect(hits[0].value).toContain("rgba(0,0,128,0.5)");
  });

  it("returns no hits when line is entirely var-defs with various color formats", () => {
    const css = ":root{--a:rgba(254,252,232,1);--b:hsl(60,100%,97%);--c:#fefce8}";
    expect(findHardcodedNonHexColors(css)).toHaveLength(0);
  });

  it("reports the correct line number for a hit", () => {
    const css = ":root { --c: rgba(0,0,0,0.5); }\n.foo { color: rgba(0,0,128,0.5); }";
    const hits = findHardcodedNonHexColors(css);
    expect(hits[0].lineNo).toBe(2);
  });
});

// ── extractDefinedTokens / extractUsedTokens ─────────────────────────────────

describe("extractDefinedTokens", () => {
  it("finds all --token names in pretty-printed CSS", () => {
    const css = ":root {\n  --color: red;\n  --bg: blue;\n}";
    const tokens = extractDefinedTokens(css);
    expect(tokens.has("--color")).toBe(true);
    expect(tokens.has("--bg")).toBe(true);
    expect(tokens.size).toBe(2);
  });

  it("finds all --token names in minified CSS", () => {
    const css = ":root{--a:#111;--b:#222}";
    const tokens = extractDefinedTokens(css);
    expect(tokens.has("--a")).toBe(true);
    expect(tokens.has("--b")).toBe(true);
    expect(tokens.size).toBe(2);
  });
});

describe("extractUsedTokens", () => {
  it("finds var() references", () => {
    const css = ".foo { color: var(--color); background: var(--bg); }";
    const tokens = extractUsedTokens(css);
    expect(tokens.has("--color")).toBe(true);
    expect(tokens.has("--bg")).toBe(true);
    expect(tokens.size).toBe(2);
  });
});

// ── parseTokenBlock / extractRootBlock / extractDarkRootBlock ─────────────────

describe("parseTokenBlock", () => {
  it("parses simple token declarations", () => {
    const block = "--color: #ff0000; --bg: #ffffff;";
    const map = parseTokenBlock(block);
    expect(map.get("--color")).toBe("#ff0000");
    expect(map.get("--bg")).toBe("#ffffff");
  });

  it("parses minified block without spaces", () => {
    const block = "--a:#111;--b:#222";
    const map = parseTokenBlock(block);
    expect(map.get("--a")).toBe("#111");
    expect(map.get("--b")).toBe("#222");
  });

  it("normalises whitespace in values", () => {
    const block = "--shadow: 0  4px  8px  rgba(0,0,0,0.5);";
    const map = parseTokenBlock(block);
    expect(map.get("--shadow")).toBe("0 4px 8px rgba(0,0,0,0.5)");
  });
});

describe("extractRootBlock", () => {
  it("returns empty map when :root is absent", () => {
    expect(extractRootBlock(".foo { color: red; }")).toEqual(new Map());
  });

  it("extracts tokens from a :root block", () => {
    const css = ":root { --a: #111; --b: #222; }\n.foo { color: var(--a); }";
    const map = extractRootBlock(css);
    expect(map.get("--a")).toBe("#111");
    expect(map.get("--b")).toBe("#222");
  });

  it("does NOT extract tokens from inside @media dark block", () => {
    const css = ":root { --a: #fff; }\n@media (prefers-color-scheme: dark) { :root { --a: #000; } }";
    const map = extractRootBlock(css);
    expect(map.get("--a")).toBe("#fff");
  });
});

describe("extractDarkRootBlock", () => {
  it("returns empty map when no dark @media block exists", () => {
    expect(extractDarkRootBlock(":root { --a: #fff; }")).toEqual(new Map());
  });

  it("extracts tokens from the dark @media :root block", () => {
    const css = ":root { --a: #fff; }\n@media (prefers-color-scheme: dark) { :root { --a: #000; --b: #111; } }";
    const map = extractDarkRootBlock(css);
    expect(map.get("--a")).toBe("#000");
    expect(map.get("--b")).toBe("#111");
  });
});
