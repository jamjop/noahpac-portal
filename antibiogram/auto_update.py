#!/usr/bin/env python3
"""
auto_update.py — detect new ND HHS antibiogram PDFs, extract them via
Claude vision, update data/*.json, rebuild app.js, deploy, and notify.

Run monthly (same cron slot as check_updates.py — replaces it).

Env vars required:
    ANTHROPIC_API_KEY   — Anthropic API key
    PUSHOVER_USER       — Pushover user key
    PUSHOVER_TOKEN      — Pushover API token
"""

import json
import os
import re
import subprocess
import sys
import urllib.request
from datetime import date
from pathlib import Path

DIR = Path(__file__).resolve().parent
LIVE_DIR = Path("/var/www/noahpac-portal/antibiogram")
REPO_DIR = LIVE_DIR

ANTIBIOGRAM_URL = "https://noahpac.com/antibiogram/"
REPORT_PREFIX   = "antibiogram-report"


def _write_report_result(status: str, findings: list) -> None:
    import datetime as _dt
    entry = {
        'app_id': 'antibiogram', 'app_name': 'ND Antibiogram',
        'app_url': ANTIBIOGRAM_URL, 'status': status, 'findings': findings,
        'ran_at': _dt.datetime.now().isoformat(timespec='minutes'),
    }
    today = _dt.date.today()
    for prefix in [REPORT_PREFIX, "quarterly-report"]:
        report_file = Path(f"/tmp/{prefix}-{today}.json")
        try:
            existing = json.loads(report_file.read_text()) if report_file.exists() else []
            existing.append(entry)
            report_file.write_text(json.dumps(existing, indent=2))
        except Exception as exc:
            print(f"WARNING: could not write report ({prefix}): {exc}", file=sys.stderr)


def _write_last_checked(status: str) -> None:
    """Record that a check ran, for the frontend's 'last checked' tag."""
    import datetime as _dt
    f = LIVE_DIR / "last_checked.json"
    try:
        f.write_text(json.dumps({
            "date": _dt.date.today().isoformat(),
            "status": status,
        }, indent=2))
        f.chmod(0o644)
    except Exception as exc:
        print(f"WARNING: could not write last_checked.json: {exc}", file=sys.stderr)


def _write_heartbeat() -> None:
    import time as _time
    dst = Path("/var/lib/node_exporter/textfile_collector/cron_antibiogram.prom")
    if not dst.parent.exists():
        return
    tmp = dst.with_suffix(".prom.tmp")
    try:
        tmp.write_text(
            f'# HELP cron_last_success_timestamp_seconds Unix timestamp of last successful run\n'
            f'# TYPE cron_last_success_timestamp_seconds gauge\n'
            f'cron_last_success_timestamp_seconds{{job="antibiogram"}} {int(_time.time())}\n'
        )
        tmp.rename(dst)
    except Exception as exc:
        print(f"WARNING: could not write heartbeat: {exc}", file=sys.stderr)


PAGE_URL = (
    "https://www.hhs.nd.gov/health/diseases-conditions-and-immunization/"
    "antibiotic-resistance-and-antimicrobial-stewardship/"
    "antibiotic-resistance-and-antimicrobial-stewardship/antibiograms"
)
PUSHOVER_API = "https://api.pushover.net/1/messages.json"
STATE_FILE   = DIR / "known_files.json"

# ── Facility matching rules ────────────────────────────────────────────────
# keywords and exclude_keywords are matched against the lowercase filename.
TRACKED = [
    {
        "id":               "trinity",
        "name":             "Trinity Hospital",
        "location":         "Minot, ND",
        "keywords":         ["trinity"],
        "exclude_keywords": [],
    },
    {
        "id":               "sanford_bismarck",
        "name":             "Sanford Health",
        "location":         "Bismarck, ND",
        "keywords":         ["sanford-bismarck", "sanford_bismarck"],
        "exclude_keywords": ["fargo", "outpatient", "peds", "inpatient"],
    },
    {
        "id":               "altru",
        "name":             "Altru Health System",
        "location":         "Grand Forks, ND",
        "keywords":         ["altru"],
        "exclude_keywords": [],
    },
    {
        "id":               "chi_bismarck",
        "name":             "CHI St. Alexius Health",
        "location":         "Bismarck, ND",
        "keywords":         ["chi-stalexius-bismarck", "chi-st-alexius-bismarck",
                             "chi-stale", "chist-alexius-bismarck"],
        "exclude_keywords": ["carrington", "dickinson", "devilslake", "devils",
                             "valley", "williston", "lisbon"],
    },
    {
        "id":               "chi_devilslake",
        "name":             "CHI St. Alexius Health",
        "location":         "Devils Lake, ND",
        "keywords":         ["devilslake", "devils-lake"],
        "exclude_keywords": [],
    },
    {
        "id":               "essentia",
        "name":             "Essentia West Market",
        "location":         "Fargo, ND",
        "keywords":         ["essentia-west-grampositive", "essentia-west-gram-positive",
                             "essentia-west-gramnegative", "essentia-west-gram-negative",
                             "essentia_west_grampositive", "essentia_west_gramnegative"],
        "exclude_keywords": [],
        "multi_pdf":        True,
    },
    {
        "id":               "jamestown_rmc",
        "name":             "Jamestown Regional Medical Center",
        "location":         "Jamestown, ND",
        "keywords":         ["jamestown"],
        "exclude_keywords": [],
    },
    {
        "id":               "west_river_urine",
        "name":             "West River Health Services (Urine)",
        "location":         "Hettinger, ND",
        "keywords":         ["west-river-urine", "west_river_urine"],
        "exclude_keywords": [],
    },
    {
        "id":               "west_river_nonurine",
        "name":             "West River Health Services (Non-Urine)",
        "location":         "Hettinger, ND",
        "keywords":         ["west-river-nonurine", "west_river_nonurine"],
        "exclude_keywords": [],
    },
]


# ── Helpers ────────────────────────────────────────────────────────────────

def fetch_page(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "nd-antibiogram-monitor/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def extract_links(html: str) -> set[str]:
    pattern = r'href="([^"]+\.(?:pdf|xlsx))"'
    return {
        m.group(1).strip()
        for m in re.finditer(pattern, html, re.IGNORECASE)
        if "Antimicrobial" in m.group(1) or "antibiogram" in m.group(1).lower()
    }


def load_state() -> set[str]:
    if STATE_FILE.exists():
        return set(json.loads(STATE_FILE.read_text()))
    return set()


def save_state(links: set[str]) -> None:
    STATE_FILE.write_text(json.dumps(sorted(links), indent=1))
    STATE_FILE.chmod(0o644)


def year_from_url(url: str) -> int | None:
    m = re.search(r'/(20\d\d)-', url)
    return int(m.group(1)) if m else None


def facility_for_url(url: str) -> dict | None:
    fname = url.split("/")[-1].lower()
    for fac in TRACKED:
        if any(kw in fname for kw in fac["keywords"]):
            if not any(ex in fname for ex in fac["exclude_keywords"]):
                return fac
    return None


def current_period_year(fac_id: str) -> int | None:
    p = DIR / "data" / f"{fac_id}.json"
    if not p.exists():
        return None
    try:
        return int(json.loads(p.read_text()).get("period", 0))
    except (ValueError, TypeError):
        return None


def push_notify(user: str, token: str, title: str, message: str) -> None:
    payload = json.dumps({
        "token":     token,
        "user":      user,
        "title":     title,
        "message":   message,
        "url":       PAGE_URL,
        "url_title": "ND HHS Antibiograms",
        "priority":  0,
    }).encode()
    req = urllib.request.Request(
        PUSHOVER_API, data=payload,
        headers={"Content-Type": "application/json"}, method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        if result.get("status") != 1:
            print(f"Pushover warning: {result}", file=sys.stderr)


# ── Extraction ─────────────────────────────────────────────────────────────

def _extract_one_pdf(client, url: str) -> list:
    """Download one PDF, run Claude extraction, return list of page result dicts."""
    sys.path.insert(0, str(DIR))
    from pdf_to_js import EXTRACT_PROMPT
    import base64, io, tempfile, urllib.request
    from pdf2image import convert_from_path

    print(f"  Downloading {url} …")
    req = urllib.request.Request(url, headers={"User-Agent": "nd-antibiogram-import/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        pdf_bytes = resp.read(30 * 1024 * 1024)

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name

    try:
        images = convert_from_path(tmp_path, dpi=200)
        print(f"  {len(images)} page(s)")
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    page_results = []
    for i, img in enumerate(images, 1):
        print(f"  Extracting page {i}/{len(images)} …")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        b64 = base64.standard_b64encode(buf.getvalue()).decode()
        msg = client.messages.create(
            model=os.environ.get("EXTRACT_MODEL", "claude-haiku-4-5-20251001"),
            max_tokens=4096,
            messages=[{"role": "user", "content": [
                {"type": "image", "source": {"type": "base64",
                                              "media_type": "image/png", "data": b64}},
                {"type": "text", "text": EXTRACT_PROMPT},
            ]}],
        )
        raw = msg.content[0].text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        try:
            page_results.append(json.loads(raw))
        except json.JSONDecodeError:
            page_results.append({"organisms": []})
    return page_results


def _dedup_organisms(organisms: list) -> list:
    """Deduplicate by name, keeping entry with more non-null susceptibility data."""
    seen: dict[str, dict] = {}
    for org in organisms:
        name = org["name"]
        if name not in seen:
            seen[name] = org
        else:
            existing = seen[name]
            if sum(1 for v in org.get("s", {}).values() if v is not None) > \
               sum(1 for v in existing.get("s", {}).values() if v is not None):
                seen[name] = org
    return list(seen.values())


def extract_facility(urls: list[str], fac: dict, year: int) -> dict | None:
    """Download one or more PDFs, extract, merge, and return facility dict."""
    sys.path.insert(0, str(DIR))
    from pdf_to_js import merge_results
    import anthropic

    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set", file=sys.stderr)
        return None

    client = anthropic.Anthropic(api_key=api_key)

    all_page_results = []
    for url in urls:
        page_results = _extract_one_pdf(client, url)
        all_page_results.extend(page_results)

    data = merge_results(all_page_results)
    organisms = _dedup_organisms(data.get("organisms", []))
    year_str = str(year)

    return {
        "id":         fac["id"],
        "name":       fac["name"],
        "location":   fac["location"],
        "period":     year_str,
        "sourceNote": (
            f"ND HHS Archive · {fac['name']} Antibiogram {year_str} · "
            f"% susceptible, 1st isolate/patient/year"
        ),
        "sourceUrl":  urls[0],
        "organisms":  organisms,
    }


# ── Main ───────────────────────────────────────────────────────────────────

def main() -> int:
    pushover_user  = os.environ.get("PUSHOVER_USER", "").strip()
    pushover_token = os.environ.get("PUSHOVER_TOKEN", "").strip()
    api_key        = os.environ.get("ANTHROPIC_API_KEY", "").strip()

    if not pushover_user or not pushover_token:
        print("ERROR: set PUSHOVER_USER and PUSHOVER_TOKEN", file=sys.stderr)
        return 2
    if not api_key:
        print("ERROR: set ANTHROPIC_API_KEY", file=sys.stderr)
        return 2

    print(f"Fetching {PAGE_URL} …")
    html    = fetch_page(PAGE_URL)
    current = extract_links(html)
    known   = load_state()
    new_urls = current - known
    print(f"Total files on page: {len(current)} — new since last run: {len(new_urls)}")

    # Find facilities with new PDFs that have a newer year.
    # For multi_pdf facilities: when ANY matching URL is new, collect ALL matching
    # URLs for that year from current (not just new_urls) so we extract and merge them.
    seen_fac_years: set[tuple[str, int]] = set()
    to_update: list[tuple[list[str], dict, int]] = []
    for url in sorted(new_urls):
        fac  = facility_for_url(url)
        year = year_from_url(url)
        if not fac or not year:
            continue
        cur_year = current_period_year(fac["id"])
        if cur_year is not None and year <= cur_year:
            print(f"  → {fac['id']}: {year} PDF found but not newer than {cur_year}, skipping")
            continue
        key = (fac["id"], year)
        if key in seen_fac_years:
            continue  # already queued this facility+year
        seen_fac_years.add(key)
        if fac.get("multi_pdf"):
            # Collect ALL current URLs matching this facility for this year
            year_prefix = f"/{year}-"
            urls = sorted(u for u in current
                          if year_prefix in u and facility_for_url(u) == fac)
            print(f"  → {fac['id']}: {len(urls)} PDF(s) for {year} (current: {cur_year})")
        else:
            urls = [url]
            print(f"  → {fac['id']}: new {year} PDF found (current: {cur_year})")
        to_update.append((urls, fac, year))

    if not to_update:
        print(f"No facility updates needed ({date.today()})")
        save_state(current)
        _write_report_result('no_change', [])
        _write_last_checked('no_change')
        _write_heartbeat()
        return 0

    updated_names = []
    failed_names  = []

    for urls, fac, year in to_update:
        print(f"\nUpdating {fac['id']} ({year}) from {len(urls)} PDF(s) …")
        try:
            facility_data = extract_facility(urls, fac, year)
            if facility_data is None:
                failed_names.append(fac["id"])
                continue
            data_path = DIR / "data" / f"{fac['id']}.json"
            data_path.write_text(json.dumps(facility_data, indent=2))
            print(f"  Saved {data_path}")
            updated_names.append(f"{fac['name']} ({year})")
        except Exception as exc:
            print(f"  ERROR extracting {fac['id']}: {exc}", file=sys.stderr)
            failed_names.append(fac["id"])

    if not updated_names:
        print("All extractions failed — not rebuilding app.js")
        save_state(current)
        _write_report_result('error', [
            {'detail': f"Extraction failed for: {', '.join(failed_names)}"}
        ])
        _write_last_checked('error')
        return 1

    # Rebuild app.js
    print("\nRebuilding app.js …")
    result = subprocess.run(
        [sys.executable, str(DIR / "build_app.py"), "--out", str(DIR / "app.js")],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print("build_app.py failed:", result.stderr, file=sys.stderr)
        return 1
    print(result.stdout.strip())

    # Deploy to live
    live_js = LIVE_DIR / "app.js"
    live_js.write_text((DIR / "app.js").read_text())
    print(f"Deployed to {live_js}")

    # Git commit and push
    git = lambda *args: subprocess.run(
        ["git", "-C", str(REPO_DIR), *args], capture_output=True, text=True
    )
    git("add", "app.js", "data/")
    commit_msg = (
        f"antibiogram: auto-update {', '.join(updated_names)}\n\n"
        f"Extracted via Claude vision from ND HHS archive.\n"
        f"Updated: {', '.join(updated_names)}\n"
        f"Date: {date.today()}"
    )
    cr = git("commit", "-m", commit_msg)
    if cr.returncode == 0:
        pr = git("push", "origin", "main")
        if pr.returncode == 0:
            print("Pushed to git")
        else:
            print("git push failed:", pr.stderr, file=sys.stderr)
    else:
        print("git commit:", cr.stdout.strip())

    # Notify
    lines = [f"• {n}" for n in updated_names]
    if failed_names:
        lines.append(f"• FAILED: {', '.join(failed_names)}")
    msg = f"{len(updated_names)} facility antibiogram(s) updated:\n" + "\n".join(lines)
    push_notify(pushover_user, pushover_token, "ND Antibiogram Auto-Updated", msg)
    print("Pushover notification sent.")

    findings = [{'detail': f"Updated: {n}"} for n in updated_names]
    if failed_names:
        findings.append({'detail': f"Extraction failed: {', '.join(failed_names)}"})
    _write_report_result('changed' if not failed_names else 'error', findings)
    _write_last_checked('changed' if not failed_names else 'error')

    save_state(current)
    if not failed_names:
        _write_heartbeat()
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        import traceback
        traceback.print_exc()
        sys.exit(1)
