#!/usr/bin/env python3
"""
build_app.py — assemble app.js from app_template.js + data/*.json

Usage:
    python3 build_app.py [--out app.js]

Reads data/{facility_id}.json in FACILITY_ORDER, serialises as a JS
const FACILITIES array, and splices it into app_template.js at the
/* __FACILITIES__ */ marker. Writes to --out (default: app.js in same dir).
"""

import argparse
import json
import re
import sys
from pathlib import Path

DIR = Path(__file__).resolve().parent

FACILITY_ORDER = ["trinity", "sanford_bismarck", "altru", "chi_bismarck"]


def load_facilities() -> list:
    facilities = []
    for fid in FACILITY_ORDER:
        p = DIR / "data" / f"{fid}.json"
        if not p.exists():
            print(f"WARNING: {p} not found — skipping", file=sys.stderr)
            continue
        facilities.append(json.loads(p.read_text()))
    # Include any extra facilities not in the fixed order
    extra = sorted(
        p.stem for p in (DIR / "data").glob("*.json") if p.stem not in FACILITY_ORDER
    )
    for fid in extra:
        facilities.append(json.loads((DIR / "data" / f"{fid}.json").read_text()))
    return facilities


def facilities_to_js(facilities: list) -> str:
    lines = ["["]
    for i, f in enumerate(facilities):
        blob = json.dumps(f, indent=2)
        # indent two extra spaces so it sits inside `const FACILITIES = [`
        indented = "\n".join("  " + l for l in blob.splitlines())
        lines.append(indented + ("," if i < len(facilities) - 1 else ""))
    lines.append("]")
    return "\n".join(lines)


def build(out_path: Path) -> None:
    template = (DIR / "app_template.js").read_text()
    if "/* __FACILITIES__ */" not in template:
        sys.exit("ERROR: app_template.js missing /* __FACILITIES__ */ marker")

    facilities = load_facilities()
    if not facilities:
        sys.exit("ERROR: no facility JSON files found in data/")

    js_block = facilities_to_js(facilities)
    result = template.replace("/* __FACILITIES__ */", js_block)

    out_path.write_text(result)
    print(f"Built {out_path} ({len(facilities)} facilities, {len(result):,} bytes)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=str(DIR / "app.js"))
    args = parser.parse_args()
    build(Path(args.out))
