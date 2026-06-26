#!/usr/bin/env python3
"""
update_uspstf.py — refresh data/uspstf.json from the USPSTF Prevention TaskForce API.

The Prevention TaskForce API (formerly ePSS) returns USPSTF recommendations as
JSON, searchable by age/sex/risk factors. AHRQ recommends caching the full
dataset locally and refreshing roughly weekly — which is what this script does.

API access requires a free key: email uspstfpda@ahrq.gov with your contact
info and a brief description of use. See:
https://www.uspreventiveservicestaskforce.org/apps/api.jsp

Usage:
    USPSTF_API_KEY=yourkey ./update_uspstf.py [output_path]

Default output: ./data/uspstf.json (relative to this script).
Stdlib only — no pip dependencies. Exits nonzero on failure and leaves the
previous data file untouched, so the app keeps serving the last good dataset.

Cron example (weekly, Monday 04:17):
    17 4 * * 1 USPSTF_API_KEY=xxx /usr/bin/python3 /var/www/uspstf-screener/update_uspstf.py
"""

import json
import os
import re
import sys
import tempfile
import urllib.request
from datetime import date
from pathlib import Path

API_URL       = "https://data.uspreventiveservicestaskforce.org/api/json"
KEEP_GRADES   = {"A", "B", "C"}
SCREENER_URL  = "https://noahpac.com/screener/"
REPORT_PREFIX = "uspstf-report"


def _write_report_result(status: str, findings: list) -> None:
    import datetime as _dt
    report_file = Path(f"/tmp/{REPORT_PREFIX}-{_dt.date.today()}.json")
    try:
        existing = json.loads(report_file.read_text()) if report_file.exists() else []
        existing.append({
            'app_id': 'uspstf', 'app_name': 'USPSTF Screener',
            'app_url': SCREENER_URL, 'status': status, 'findings': findings,
            'ran_at': _dt.datetime.now().isoformat(timespec='minutes'),
        })
        report_file.write_text(json.dumps(existing, indent=2))
    except Exception as exc:
        print(f"WARNING: could not write report: {exc}", file=sys.stderr)

# Map API flag fields -> the app's risk-factor flag ids
FLAG_MAP = {
    "pregnant": "pregnant",
    "tobacco": "everSmoked",
    "sexuallyActive": "sexuallyActive",
}


def strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = re.sub(r"&nbsp;?", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def to_int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def map_sex(value: str) -> str:
    v = (value or "").strip().lower()
    if v in ("women", "female", "females"):
        return "female"
    if v in ("men", "male", "males"):
        return "male"
    return "any"


def transform(raw: dict) -> dict:
    """Map the API's specificRecommendations into the app schema."""
    specs = raw.get("specificRecommendations") or raw.get("specificRecommendation") or []
    if not specs:
        raise ValueError("API response contained no specificRecommendations — "
                         "schema may have changed; inspect data/uspstf_raw.json")

    generals = {g.get("id"): g for g in (raw.get("generalRecommendations") or [])
                if isinstance(g, dict)}

    recs = []
    for s in specs:
        grade = (s.get("grade") or "").strip().upper()
        if grade not in KEEP_GRADES:
            continue

        age_range = s.get("ageRange") or [0, 120]
        min_age = to_int(age_range[0] if len(age_range) > 0 else 0, 0)
        max_age = to_int(age_range[1] if len(age_range) > 1 else 120, 120)

        requires = []
        for api_field, flag in FLAG_MAP.items():
            if str(s.get(api_field, "")).strip().upper() == "Y":
                requires.append(flag)
        risk_text = ""
        if str(s.get("risk", "")).strip().upper() == "Y":
            requires.append("stiRisk")  # generic "increased risk" bucket
            risk_text = strip_html(s.get("riskText") or s.get("riskName") or "")

        general = generals.get(s.get("general"), {})
        freq = strip_html(s.get("servFreq") or "")
        if len(freq) > 80:
            freq = freq[:77].rstrip() + "…"
        detail = strip_html(s.get("text") or "")
        if len(detail) > 380:
            detail = detail[:377].rstrip() + "…"
        if risk_text:
            detail = (detail + f" Risk group: {risk_text}").strip()

        recs.append({
            "name": strip_html(s.get("title") or general.get("title") or "Untitled"),
            "grade": grade,
            "sex": map_sex(s.get("sex")),
            "minAge": min_age,
            "maxAge": max_age,
            "freq": freq,
            "detail": detail,
            "requires": requires or None,
        })

    # drop None requires for cleanliness
    for r in recs:
        if r["requires"] is None:
            del r["requires"]

    # deduplicate: API emits separate entries per pathogen for combined recs
    seen = set()
    unique = []
    for r in recs:
        key = (r["name"], r["grade"], r["sex"], r["minAge"], r["maxAge"])
        if key not in seen:
            seen.add(key)
            unique.append(r)
    recs = unique

    return {
        "meta": {
            "source": "uspstf-prevention-taskforce-api",
            "updated": date.today().isoformat(),
            "count": len(recs),
        },
        "recs": recs,
    }


def main() -> int:
    key = os.environ.get("USPSTF_API_KEY", "").strip()
    if not key:
        print("ERROR: set USPSTF_API_KEY (request one from uspstfpda@ahrq.gov)",
              file=sys.stderr)
        return 2

    script_dir = Path(__file__).resolve().parent
    out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else script_dir / "data" / "uspstf.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    url = f"{API_URL}?key={key}"
    print(f"Fetching {API_URL} …")
    req = urllib.request.Request(url, headers={"User-Agent": "uspstf-screener/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = json.loads(resp.read().decode("utf-8"))

    # keep raw copy for debugging / schema drift
    raw_path = out_path.parent / "uspstf_raw.json"
    raw_path.write_text(json.dumps(raw, indent=1))
    raw_path.chmod(0o644)

    data = transform(raw)

    # atomic write: never leave a half-written file for nginx to serve
    fd, tmp = tempfile.mkstemp(dir=out_path.parent, suffix=".tmp")
    with os.fdopen(fd, "w") as f:
        json.dump(data, f, indent=1)
    os.chmod(tmp, 0o644)
    os.replace(tmp, out_path)

    count = data['meta']['count']
    print(f"OK: wrote {count} recommendations -> {out_path}")
    _write_report_result('no_change', [
        {'detail': f"Refreshed {count} A/B/C-grade USPSTF recommendations from Prevention TaskForce API"},
    ])
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        _write_report_result('error', [{'detail': str(exc)}])
        sys.exit(1)
