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
    report_file = Path(f"/tmp/{REPORT_PREFIX}-{_dt.date.today()}.json")
    try:
        existing = json.loads(report_file.read_text()) if report_file.exists() else []
        existing.append({
            'app_id': 'antibiogram', 'app_name': 'ND Antibiogram',
            'app_url': ANTIBIOGRAM_URL, 'status': status, 'findings': findings,
            'ran_at': _dt.datetime.now().isoformat(timespec='minutes'),
        })
        report_file.write_text(json.dumps(existing, indent=2))
    except Exception as exc:
        print(f"WARNING: could not write report: {exc}", file=sys.stderr)


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

def extract_facility(url: str, fac: dict, year: int) -> dict | None:
    """Download PDF, run Claude extraction, return updated facility dict."""
    sys.path.insert(0, str(DIR))
    from pdf_to_js import EXTRACT_PROMPT, merge_results
    import anthropic, base64, io, tempfile, urllib.request
    from pdf2image import convert_from_path

    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set", file=sys.stderr)
        return None

    print(f"  Downloading {url} …")
    req = urllib.request.Request(url, headers={"User-Agent": "nd-antibiogram-import/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        pdf_bytes = resp.read(30 * 1024 * 1024)

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name

    try:
        print("  Converting to images …")
        images = convert_from_path(tmp_path, dpi=200)
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    client = anthropic.Anthropic(api_key=api_key)
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

    data = merge_results(page_results)
    year_str = str(year)

    # Load existing file to preserve fields not returned by extraction
    existing = {}
    data_path = DIR / "data" / f"{fac['id']}.json"
    if data_path.exists():
        existing = json.loads(data_path.read_text())

    return {
        "id":         fac["id"],
        "name":       fac["name"],
        "location":   fac["location"],
        "period":     year_str,
        "sourceNote": (
            f"ND HHS Archive · {fac['name']} Antibiogram {year_str} · "
            f"% susceptible, 1st isolate/patient/year"
        ),
        "sourceUrl":  url,
        "organisms":  data.get("organisms", existing.get("organisms", [])),
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

    # Find new PDFs that match a tracked facility AND have a newer year
    to_update: list[tuple[str, dict, int]] = []
    for url in sorted(new_urls):
        fac  = facility_for_url(url)
        year = year_from_url(url)
        if not fac or not year:
            continue
        cur_year = current_period_year(fac["id"])
        if cur_year is None or year > cur_year:
            print(f"  → {fac['id']}: new {year} PDF found (current: {cur_year})")
            to_update.append((url, fac, year))
        else:
            print(f"  → {fac['id']}: {year} PDF found but not newer than {cur_year}, skipping")

    if not to_update:
        print(f"No facility updates needed ({date.today()})")
        save_state(current)
        _write_report_result('no_change', [])
        return 0

    updated_names = []
    failed_names  = []

    for url, fac, year in to_update:
        print(f"\nUpdating {fac['id']} from {url} …")
        try:
            facility_data = extract_facility(url, fac, year)
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
    git("add", "app.js")
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

    save_state(current)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        import traceback
        traceback.print_exc()
        sys.exit(1)
