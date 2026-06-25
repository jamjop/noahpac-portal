#!/usr/bin/env python3
"""
pdf_to_js.py — convert an antibiogram PDF into JavaScript for app.js.

Sends each page to Claude vision API to extract susceptibility data, then
prints a FACILITIES entry ready to paste into /var/www/antibiogram/app.js.

Usage:
    ANTHROPIC_API_KEY=sk-... python3 pdf_to_js.py <file.pdf> [options]

Options:
    --name      Facility name override  (e.g. "Trinity Hospital")
    --location  Location override       (e.g. "Minot, ND")
    --period    Period override         (e.g. "2024")
    --id        Facility ID override    (e.g. "trinity")
    --model     Claude model to use     (default: claude-haiku-4-5-20251001)
    --dpi       Image render DPI        (default: 200)
"""

import argparse
import base64
import json
import os
import re
import sys
import tempfile
from pathlib import Path

import anthropic
from pdf2image import convert_from_path


# ── Canonical antibiotic ID → display name ────────────────────────────────
ABX_MAP = {
    "pen": "Penicillin G",
    "amp": "Ampicillin",
    "oxa": "Oxacillin",
    "ams": "Ampicillin/Sulbactam",
    "ptz": "Pip/Tazobactam",
    "cfz": "Cefazolin",
    "cfz_u": "Cefazolin (urine)",
    "cfx": "Cefoxitin",
    "cxm": "Cefuroxime",
    "cro": "Ceftriaxone",
    "caz": "Ceftazidime",
    "fep": "Cefepime",
    "mem": "Meropenem",
    "gen": "Gentamicin",
    "tob": "Tobramycin",
    "cip": "Ciprofloxacin",
    "lvx": "Levofloxacin",
    "van": "Vancomycin",
    "tet": "Tetracycline",
    "dox": "Doxycycline",
    "cli": "Clindamycin",
    "ery": "Erythromycin",
    "azi": "Azithromycin",
    "sxt": "TMP/SMX",
    "rif": "Rifampin",
    "dap": "Daptomycin",
    "lzd": "Linezolid",
    "nit": "Nitrofurantoin (urine)",
}

EXTRACT_PROMPT = """
You are an antibiogram data extractor. Extract ALL susceptibility data from this antibiogram table image.

Return ONLY valid JSON in this exact structure (no markdown, no explanation):
{
  "facility": "facility name or empty string",
  "location": "city, state or empty string",
  "period": "year or date range",
  "organisms": [
    {
      "name": "organism name",
      "gram": "positive" or "negative",
      "isolates": integer or null,
      "note": "footnote text or null",
      "s": {
        "<abx_id>": <integer 0-100> or "nr" or null
      }
    }
  ]
}

Antibiotic ID mapping — use ONLY these exact IDs as keys in "s":
  pen   = Penicillin G / Penicillin IV
  amp   = Ampicillin
  oxa   = Oxacillin / Nafcillin
  ams   = Ampicillin/Sulbactam
  ptz   = Piperacillin/Tazobactam (Pip/Tazo, Zosyn)
  cfz   = Cefazolin (systemic)
  cfz_u = Cefazolin (urine-only breakpoints)
  cfx   = Cefoxitin
  cxm   = Cefuroxime
  cro   = Ceftriaxone OR Cefotaxime (map both to cro)
  caz   = Ceftazidime
  fep   = Cefepime
  mem   = Meropenem, Ertapenem, or Imipenem (use mem for all carbapenems)
  gen   = Gentamicin
  tob   = Tobramycin
  cip   = Ciprofloxacin
  lvx   = Levofloxacin
  van   = Vancomycin
  tet   = Tetracycline
  dox   = Doxycycline / Doxycycline-Tetracycline combined column
  cli   = Clindamycin
  ery   = Erythromycin
  azi   = Azithromycin
  sxt   = TMP/SMX (Trimethoprim/Sulfamethoxazole, Co-trimoxazole)
  rif   = Rifampin / Rifampicin
  dap   = Daptomycin
  lzd   = Linezolid
  nit   = Nitrofurantoin (urine)

Extraction rules:
- Values are integers 0-100 (% susceptible). Strip arrows (↑↓↑↑↓↓) and % signs.
- "nr" for cells explicitly labeled Not Recommended, NR, ~, or shaded dark gray.
- null for blank/not-tested cells.
- Orange-highlighted cells still have numeric values — record them.
- If a column header says "urine only" or "urine breakpoints", use cfz_u not cfz.
- Ignore any %SDD or "Susceptible Dose Dependent" columns.
- If two carbapenem columns exist (e.g. Ertapenem + Meropenem), use meropenem value.
- If combined values appear (e.g. "98/93" or "100/98"), use the lower (more conservative) value.
- Identify gram stain from table section headers (blue/purple = gram-positive, red/pink = gram-negative),
  or from organism names (Staph/Strep/Enterococcus = positive; E.coli/Klebsiella etc = negative).
- If the page has NO antibiogram table (e.g. cost comparison, text only), return {"organisms": []}.
- Include ALL organisms visible in the table.
""".strip()


def pdf_to_images(pdf_path: str, dpi: int = 200) -> list:
    """Convert PDF pages to PIL images."""
    print(f"  Converting PDF to images at {dpi} DPI…", file=sys.stderr)
    return convert_from_path(pdf_path, dpi=dpi)


def image_to_b64(img) -> str:
    """Encode PIL image as base64 PNG."""
    import io
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.standard_b64encode(buf.getvalue()).decode()


def extract_page(client: anthropic.Anthropic, img, model: str, page_num: int) -> dict:
    """Send one page image to Claude and return parsed JSON."""
    print(f"  Extracting page {page_num}…", file=sys.stderr)
    b64 = image_to_b64(img)

    message = client.messages.create(
        model=model,
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": b64,
                    },
                },
                {
                    "type": "text",
                    "text": EXTRACT_PROMPT,
                },
            ],
        }],
    )

    raw = message.content[0].text.strip()

    # Strip markdown code fences if model added them
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"  WARNING: JSON parse error on page {page_num}: {e}", file=sys.stderr)
        print(f"  Raw response: {raw[:500]}", file=sys.stderr)
        return {"organisms": []}


def merge_results(pages: list) -> dict:
    """Merge multi-page extractions into a single result."""
    merged = {"facility": "", "location": "", "period": "", "organisms": []}
    for p in pages:
        if p.get("facility") and not merged["facility"]:
            merged["facility"] = p["facility"]
        if p.get("location") and not merged["location"]:
            merged["location"] = p["location"]
        if p.get("period") and not merged["period"]:
            merged["period"] = p["period"]
        merged["organisms"].extend(p.get("organisms", []))
    return merged


def slugify(s: str) -> str:
    """Convert a string to a safe JS identifier."""
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = s.strip("_")
    return s or "facility"


def js_value(v) -> str:
    """Format a susceptibility value as JS literal."""
    if v is None:
        return "null"
    if v == "nr":
        return '"nr"'
    return str(int(v))


def format_s_dict(s: dict) -> str:
    """Format susceptibility dict as compact JS object literal."""
    if not s:
        return "{}"
    pairs = [f"{k}:{js_value(v)}" for k, v in s.items() if v is not None or True]
    # Filter out all-null entries to keep it clean
    pairs = [f"{k}:{js_value(v)}" for k, v in s.items()]
    return "{" + ",".join(pairs) + "}"


def to_js(data: dict, fac_id: str, name: str, location: str, period: str) -> str:
    """Render extracted data as a FACILITIES entry JS block."""
    source = f"ND HHS Archive · {name} {period}"

    lines = [
        "  {",
        f'    id: "{fac_id}",',
        f'    name: "{name}",',
        f'    location: "{location}",',
        f'    period: "{period}",',
        f'    sourceNote: "{source} · % susceptible, 1st isolate/patient/year",',
        "    organisms: [",
    ]

    gpos = [o for o in data["organisms"] if o.get("gram") == "positive"]
    gneg = [o for o in data["organisms"] if o.get("gram") == "negative"]
    unknown = [o for o in data["organisms"] if o.get("gram") not in ("positive", "negative")]

    if gpos:
        lines.append("      // ── Gram-positive ──")
    for org in gpos:
        lines.append(_org_line(org))

    if gneg:
        lines.append("      // ── Gram-negative ──")
    for org in gneg:
        lines.append(_org_line(org))

    if unknown:
        lines.append("      // ── Gram stain unknown ──")
    for org in unknown:
        lines.append(_org_line(org))

    lines += ["    ]", "  },"]
    return "\n".join(lines)


def _org_line(org: dict) -> str:
    name     = org.get("name", "Unknown").replace('"', '\\"')
    gram     = org.get("gram", "unknown")
    isolates = org.get("isolates") or 0
    note     = org.get("note")
    s        = org.get("s", {})

    # Validate and clean susceptibility values
    clean_s = {}
    for abx_id, val in s.items():
        if abx_id not in ABX_MAP:
            print(f"  WARNING: unknown abx ID '{abx_id}' — skipping", file=sys.stderr)
            continue
        clean_s[abx_id] = val

    note_str = f', note:"{note.replace(chr(34), "")}"' if note else ""
    return (f'      {{ name:"{name}", gram:"{gram}", isolates:{isolates}'
            f'{note_str}, s:{format_s_dict(clean_s)}}},')


def main():
    parser = argparse.ArgumentParser(description="Convert antibiogram PDF to app.js JavaScript")
    parser.add_argument("pdf", help="Path to antibiogram PDF")
    parser.add_argument("--name",     default="", help="Facility name")
    parser.add_argument("--location", default="", help="City, State")
    parser.add_argument("--period",   default="", help="Year or date range")
    parser.add_argument("--id",       default="", help="JS identifier (e.g. trinity)")
    parser.add_argument("--model",    default="claude-haiku-4-5-20251001",
                        help="Claude model (default: claude-haiku-4-5-20251001)")
    parser.add_argument("--dpi",      default=200, type=int, help="Render DPI (default: 200)")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        print("ERROR: set ANTHROPIC_API_KEY", file=sys.stderr)
        sys.exit(2)

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"ERROR: file not found: {pdf_path}", file=sys.stderr)
        sys.exit(2)

    print(f"Processing: {pdf_path.name}", file=sys.stderr)
    client = anthropic.Anthropic(api_key=api_key)

    images = pdf_to_images(str(pdf_path), dpi=args.dpi)
    print(f"  {len(images)} page(s) found", file=sys.stderr)

    page_results = []
    for i, img in enumerate(images, 1):
        result = extract_page(client, img, args.model, i)
        orgs = result.get("organisms", [])
        print(f"  Page {i}: {len(orgs)} organism(s) found", file=sys.stderr)
        page_results.append(result)

    data = merge_results(page_results)

    # Apply overrides or fall back to extracted values
    name     = args.name     or data.get("facility") or pdf_path.stem
    location = args.location or data.get("location") or "ND"
    period   = args.period   or data.get("period")   or ""
    fac_id   = args.id       or slugify(name + "_" + period)

    total = len(data["organisms"])
    gpos  = sum(1 for o in data["organisms"] if o.get("gram") == "positive")
    gneg  = sum(1 for o in data["organisms"] if o.get("gram") == "negative")
    print(f"\nExtracted {total} organism(s): {gpos} gram-positive, {gneg} gram-negative",
          file=sys.stderr)
    print(f"Facility : {name} — {location} ({period})", file=sys.stderr)
    print("-" * 60, file=sys.stderr)

    print("\n// ── Paste into FACILITIES array in app.js ──────────────────")
    print(to_js(data, fac_id, name, location, period))


if __name__ == "__main__":
    main()
