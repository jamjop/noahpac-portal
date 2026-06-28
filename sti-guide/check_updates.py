#!/usr/bin/env python3
"""
check_updates.py — monitor CDC STI guidelines page for content/date changes
AND PubMed for new guideline publications (CDC STI MMWR, doxy-PEP, gonorrhea
resistance). Alerts via Pushover. Run quarterly via cron (Jan/Apr/Jul/Oct 15).

Usage:
    PUSHOVER_USER=xxx PUSHOVER_TOKEN=yyy ./check_updates.py
"""

import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse
from datetime import date
from pathlib import Path

PAGE_URL     = "https://www.cdc.gov/std/treatment-guidelines/default.htm"
PUSHOVER_API = "https://api.pushover.net/1/messages.json"
EUTILS_BASE  = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
PAGE_STATE   = Path(__file__).resolve().parent / "known_state.json"
PMID_STATE   = Path(__file__).resolve().parent / "known_pmids.json"
STI_URL      = "https://noahpac.com/sti-guide/"

GUIDELINE_PATTERNS = [
    r"/std/treatment",
    r"/sti/hcp",
    r"STI-Guidelines",
    r"treatment-guidelines",
    r"\.pdf",
]

SEARCHES = [
    {
        'id':      'cdc_sti_guidelines',
        'name':    'CDC STI Treatment Guidelines (MMWR)',
        'query':   'CDC AND ("sexually transmitted" OR STI OR STD) AND ("treatment guidelines" OR "treatment guide") AND MMWR[ta]',
        'reldate': 400,
    },
    {
        'id':      'doxy_pep',
        'name':    'Doxycycline PEP (STI post-exposure prophylaxis)',
        'query':   '("doxycycline post-exposure" OR "doxy-PEP" OR "doxycycline PEP") AND (STI OR STD OR gonorrhea OR chlamydia OR syphilis)',
        'reldate': 400,
    },
    {
        'id':      'gonorrhea_resistance',
        'name':    'Gonorrhea Antimicrobial Resistance',
        'query':   'CDC AND gonorrhea AND ("antimicrobial resistance" OR "treatment failure" OR ceftriaxone) AND (guideline OR recommendation OR update)[ti]',
        'reldate': 400,
    },
    {
        'id':      'cdc_sti_updates',
        'name':    'CDC STI / Sexual Health Guidance Updates',
        'query':   '"Centers for Disease Control" AND ("sexually transmitted" OR "sexual health") AND (guideline OR recommendation)[pt]',
        'reldate': 400,
    },
]


# ── Page monitoring ───────────────────────────────────────────────────────────

def fetch_page(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "cdc-sti-monitor/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def extract_links(html: str) -> set[str]:
    hrefs = re.findall(r'href="([^"]+)"', html, re.IGNORECASE)
    return {h.strip() for h in hrefs
            if any(re.search(p, h, re.IGNORECASE) for p in GUIDELINE_PATTERNS)}


def extract_last_reviewed(html: str) -> str:
    m = re.search(r'(?:last\s+reviewed|updated)[:\s]+([A-Za-z]+\s+\d+,?\s+\d{4})',
                  html, re.IGNORECASE)
    return m.group(1).strip() if m else ""


# ── PubMed ────────────────────────────────────────────────────────────────────

def esearch(query: str, reldate: int) -> list[str]:
    params = urllib.parse.urlencode({
        'db': 'pubmed', 'term': query, 'retmode': 'json',
        'retmax': 50, 'datetype': 'pdat', 'reldate': reldate,
    })
    url = f"{EUTILS_BASE}/esearch.fcgi?{params}"
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-sti-guide-monitor/1.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read()).get('esearchresult', {}).get('idlist', [])


def esummary(pmids: list[str]) -> dict:
    if not pmids:
        return {}
    params = urllib.parse.urlencode({'db': 'pubmed', 'id': ','.join(pmids), 'retmode': 'json'})
    url = f"{EUTILS_BASE}/esummary.fcgi?{params}"
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-sti-guide-monitor/1.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    result = {}
    for pmid, item in data.get('result', {}).items():
        if pmid == 'uids':
            continue
        result[pmid] = {'title': item.get('title', '(no title)'),
                        'source': item.get('source', ''),
                        'pubdate': item.get('pubdate', '')}
    return result


# ── State ─────────────────────────────────────────────────────────────────────

def load_page_state() -> dict:
    return json.loads(PAGE_STATE.read_text()) if PAGE_STATE.exists() else {}


def save_page_state(state: dict) -> None:
    PAGE_STATE.write_text(json.dumps(state, indent=2))
    PAGE_STATE.chmod(0o644)


def load_pmid_state() -> dict:
    return json.loads(PMID_STATE.read_text()) if PMID_STATE.exists() else {}


def save_pmid_state(state: dict) -> None:
    PMID_STATE.write_text(json.dumps(state, indent=2))
    PMID_STATE.chmod(0o644)


# ── Notifications ─────────────────────────────────────────────────────────────

def _write_quarterly_result(status: str, findings: list[dict]) -> None:
    import datetime as _dt
    report_file = Path(f"/tmp/quarterly-report-{_dt.date.today()}.json")
    try:
        existing = json.loads(report_file.read_text()) if report_file.exists() else []
        existing.append({'app_id': 'sti-guide', 'app_name': 'STI Treatment Guidelines',
                         'app_url': STI_URL, 'status': status, 'findings': findings,
                         'ran_at': _dt.datetime.now().isoformat(timespec='minutes')})
        report_file.write_text(json.dumps(existing, indent=2))
    except Exception as exc:
        print(f"WARNING: could not write quarterly report: {exc}", file=sys.stderr)


def push_notify(user: str, token: str, title: str, message: str) -> None:
    payload = json.dumps({
        'token': token, 'user': user, 'title': title, 'message': message,
        'url': PAGE_URL, 'url_title': 'CDC STI Treatment Guidelines', 'priority': 0,
    }).encode()
    req = urllib.request.Request(PUSHOVER_API, data=payload,
                                 headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        if result.get('status') != 1:
            print(f"Pushover warning: {result}", file=sys.stderr)


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> int:
    user  = os.environ.get('PUSHOVER_USER', '').strip()
    token = os.environ.get('PUSHOVER_TOKEN', '').strip()
    if not user or not token:
        print('ERROR: set PUSHOVER_USER and PUSHOVER_TOKEN', file=sys.stderr)
        return 2

    alerts: list[str] = []
    findings: list[dict] = []

    # ── Page check ────────────────────────────────────────────────────────────
    print(f"Fetching {PAGE_URL} …")
    try:
        html = fetch_page(PAGE_URL)
        current_links    = extract_links(html)
        current_reviewed = extract_last_reviewed(html)
        print(f"  {len(current_links)} guideline links; last reviewed: {current_reviewed or '(not found)'}")

        page_state     = load_page_state()
        known_links    = set(page_state.get('links', []))
        known_reviewed = page_state.get('last_reviewed', '')

        new_links    = current_links - known_links
        date_changed = current_reviewed and current_reviewed != known_reviewed

        if date_changed:
            msg = f"'Last Reviewed' changed: {known_reviewed!r} → {current_reviewed!r}"
            alerts.append(msg)
            findings.append({'detail': msg})
        if new_links:
            for l in sorted(new_links):
                alerts.append(f"New link: {l}")
                findings.append({'detail': f'New CDC page link: {l}'})

        save_page_state({'links': sorted(current_links), 'last_reviewed': current_reviewed})
    except Exception as exc:
        print(f"  ERROR fetching page: {exc}", file=sys.stderr)
        findings.append({'detail': f'Page fetch error: {exc}'})

    # ── PubMed checks ─────────────────────────────────────────────────────────
    pmid_state  = load_pmid_state()
    first_run   = not pmid_state
    if first_run:
        print('First PubMed run — initialising state (no PubMed alert will be sent).')

    for search in SEARCHES:
        sid = search['id']
        print(f"Querying PubMed: {search['name']} …")
        try:
            pmids = esearch(search['query'], search['reldate'])
        except Exception as exc:
            print(f"  ERROR: {exc}", file=sys.stderr)
            continue

        known_pmids = set(pmid_state.get(sid, []))
        new_pmids   = [p for p in pmids if p not in known_pmids]
        print(f"  Found {len(pmids)} total, {len(new_pmids)} new")

        if new_pmids and not first_run:
            try:
                meta = esummary(new_pmids)
                time.sleep(0.4)
            except Exception as exc:
                print(f"  WARNING: summaries unavailable: {exc}", file=sys.stderr)
                meta = {p: {'title': '(title unavailable)', 'source': '', 'pubdate': ''} for p in new_pmids}
            for pmid in new_pmids:
                m = meta.get(pmid, {})
                line = f"[{search['name']}] {m.get('title','')}  PMID {pmid}"
                alerts.append(line)
                findings.append({'search': search['name'], 'title': m.get('title', ''),
                                 'pmid': pmid, 'journal': m.get('source', ''),
                                 'pubdate': m.get('pubdate', '')})

        pmid_state[sid] = sorted(known_pmids | set(pmids))
        time.sleep(0.4)

    save_pmid_state(pmid_state)

    if first_run:
        print(f'PubMed state initialised with {sum(len(v) for v in pmid_state.values())} PMIDs.')

    # ── Report ────────────────────────────────────────────────────────────────
    if not alerts:
        print(f'No changes detected ({date.today()}).')
        _write_quarterly_result('no_change', [])
        return 0

    message = 'CDC STI guidelines update detected:\n\n' + '\n'.join(f'• {a}' for a in alerts)
    message += '\n\nReview and update /var/www/noahpac-portal/sti-guide/app.js if regimens changed.'
    print(message)
    push_notify(user, token, 'CDC STI Guidelines Update', message)
    _write_quarterly_result('changed', findings)
    print('Notification sent.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
