#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed/CDC/AAP for immunization schedule updates.

Watches:
  ACIP / CDC
  1. MMWR ACIP annual immunization schedule publications
  2. Individual ACIP vaccine recommendations (new vaccines, updated guidance)
  3. CDC vaccine schedule page for "last updated" date changes

  AAP
  4. AAP annual immunization schedule (Pediatrics journal, published Jan alongside ACIP)
  5. AAP Committee on Infectious Diseases (COID) vaccine policy statements
  6. AAP influenza / LAIV guidance updates
  7. AAP immunization resources page for date changes

The vaccines app now supports ACIP and AAP schedule sources; key AAP differences
(HPV from age 9, LAIV preferred ages 2-8, MenB routine 16-23) must be reviewed
when either schedule publishes an update.

Run quarterly via cron (Jan/Apr/Jul/Oct 15).

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

PUSHOVER_API  = "https://api.pushover.net/1/messages.json"
EUTILS_BASE   = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
STATE_FILE    = Path(__file__).resolve().parent / "known_pmids.json"
VACCINES_URL  = "https://noahpac.com/vaccines/"
CDC_SCHED_URL = "https://www.cdc.gov/vaccines/schedules/"
AAP_SCHED_URL = "https://www.aap.org/en/patient-care/immunizations/immunization-schedule-and-resources/"

SEARCHES = [
    # ── ACIP / CDC ──
    {
        'id':      'acip_schedule',
        'name':    'ACIP Annual Immunization Schedule (MMWR)',
        'query':   'ACIP AND "immunization schedule" AND MMWR[ta]',
        'reldate': 400,
    },
    {
        'id':      'acip_recommendations',
        'name':    'ACIP New Vaccine Recommendations (MMWR)',
        'query':   'ACIP AND ("recommendations" OR "recommendation") AND MMWR[ta] AND (vaccine OR vaccination OR immunization)[ti]',
        'reldate': 400,
    },
    {
        'id':      'cdc_vaccine_guidance',
        'name':    'CDC Vaccine Guidance Updates',
        'query':   '"Advisory Committee on Immunization Practices" AND guideline[pt]',
        'reldate': 400,
    },
    # ── AAP ──
    {
        'id':      'aap_schedule',
        'name':    'AAP Annual Immunization Schedule (Pediatrics)',
        'query':   '"immunization schedule" AND Pediatrics[ta] AND ("American Academy of Pediatrics" OR "Committee on Infectious Diseases")',
        'reldate': 400,
    },
    {
        'id':      'aap_coid',
        'name':    'AAP COID Vaccine Policy Statements (Pediatrics)',
        'query':   '"Committee on Infectious Diseases" AND Pediatrics[ta] AND (vaccine[ti] OR vaccination[ti] OR immunization[ti] OR immunoprophylaxis[ti])',
        'reldate': 400,
    },
    {
        'id':      'aap_influenza',
        'name':    'AAP Influenza / LAIV Guidance (Pediatrics)',
        'query':   '"American Academy of Pediatrics" AND (influenza[ti] OR "live attenuated influenza"[ti]) AND Pediatrics[ta]',
        'reldate': 400,
    },
]

CDC_PAGE = {
    'id':   'cdc_schedule_page',
    'name': 'CDC Vaccine Schedules page',
    'url':  CDC_SCHED_URL,
    'date_patterns': [
        r'(?:updated?|reviewed?)[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})',
        r'(20\d{2}-\d{2}-\d{2})',
    ],
}

AAP_PAGE = {
    'id':   'aap_schedule_page',
    'name': 'AAP Immunization Schedule page',
    'url':  AAP_SCHED_URL,
    'date_patterns': [
        r'(?:updated?|reviewed?|published?)[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})',
        r'(20\d{2}-\d{2}-\d{2})',
        r'((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})',
    ],
}


def esearch(query: str, reldate: int) -> list[str]:
    params = urllib.parse.urlencode({
        'db':       'pubmed',
        'term':     query,
        'retmode':  'json',
        'retmax':   50,
        'datetype': 'pdat',
        'reldate':  reldate,
    })
    url = f"{EUTILS_BASE}/esearch.fcgi?{params}"
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-vaccines-monitor/1.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    return data.get('esearchresult', {}).get('idlist', [])


def esummary(pmids: list[str]) -> dict:
    if not pmids:
        return {}
    params = urllib.parse.urlencode({
        'db':      'pubmed',
        'id':      ','.join(pmids),
        'retmode': 'json',
    })
    url = f"{EUTILS_BASE}/esummary.fcgi?{params}"
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-vaccines-monitor/1.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    result = {}
    for pmid, item in data.get('result', {}).items():
        if pmid == 'uids':
            continue
        result[pmid] = {
            'title':   item.get('title', '(no title)'),
            'source':  item.get('source', ''),
            'pubdate': item.get('pubdate', ''),
        }
    return result


def check_page(page_cfg: dict, known_date: str) -> tuple[str, bool]:
    """Fetch a page and check for date changes using configured patterns."""
    try:
        req = urllib.request.Request(
            page_cfg['url'],
            headers={'User-Agent': 'noahpac-vaccines-monitor/1.0'},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            html = resp.read().decode('utf-8', errors='replace')
        for pat in page_cfg['date_patterns']:
            m = re.search(pat, html, re.IGNORECASE)
            if m:
                current = m.group(1).strip()
                return current, (current != known_date and bool(known_date))
    except Exception as exc:
        print(f"  WARNING: could not fetch {page_cfg['name']}: {exc}", file=sys.stderr)
    return known_date, False


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2))
    STATE_FILE.chmod(0o644)


def _write_quarterly_result(app_id: str, app_name: str, app_url: str,
                            status: str, findings: list[dict]) -> None:
    import datetime as _dt
    report_file = Path(f"/tmp/quarterly-report-{_dt.date.today()}.json")
    try:
        existing = json.loads(report_file.read_text()) if report_file.exists() else []
        existing.append({'app_id': app_id, 'app_name': app_name, 'app_url': app_url,
                         'status': status, 'findings': findings,
                         'ran_at': _dt.datetime.now().isoformat(timespec='minutes')})
        report_file.write_text(json.dumps(existing, indent=2))
    except Exception as exc:
        print(f"WARNING: could not write quarterly report: {exc}", file=sys.stderr)


def push_notify(user: str, token: str, title: str, message: str) -> None:
    payload = json.dumps({
        'token':     token,
        'user':      user,
        'title':     title,
        'message':   message,
        'url':       VACCINES_URL,
        'url_title': 'noahpac.com/vaccines/',
        'priority':  0,
    }).encode()
    req = urllib.request.Request(
        PUSHOVER_API, data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        if result.get('status') != 1:
            print(f'Pushover warning: {result}', file=sys.stderr)


def main() -> int:
    user  = os.environ.get('PUSHOVER_USER', '').strip()
    token = os.environ.get('PUSHOVER_TOKEN', '').strip()
    if not user or not token:
        print('ERROR: set PUSHOVER_USER and PUSHOVER_TOKEN', file=sys.stderr)
        return 2

    state     = load_state()
    first_run = not state
    if first_run:
        print('First run — initialising state (no alert will be sent).')

    all_new: list[tuple[str, dict]] = []
    page_changed = False
    page_notes: list[str] = []

    for page_cfg, state_key, label in [
        (CDC_PAGE, 'cdc_page_date', 'CDC vaccine schedule page date'),
        (AAP_PAGE, 'aap_page_date', 'AAP immunization schedule page date'),
    ]:
        known = state.get(state_key, '')
        print(f"Checking {page_cfg['name']} …")
        current, changed = check_page(page_cfg, known)
        print(f"  Page date: {current or '(not found)'}")
        if changed and not first_run:
            page_changed = True
            page_notes.append(f"{label} → {current}")
            print(f"  Date changed: {known!r} → {current!r}")
        state[state_key] = current
        # capture CDC date for legacy reference in notification
        if state_key == 'cdc_page_date':
            current_page_date = current

    # PubMed searches
    for search in SEARCHES:
        sid = search['id']
        print(f"Querying PubMed: {search['name']} …")
        try:
            pmids = esearch(search['query'], search['reldate'])
        except Exception as exc:
            print(f"  ERROR: {exc}", file=sys.stderr)
            continue

        known     = set(state.get(sid, []))
        new_pmids = [p for p in pmids if p not in known]
        print(f"  Found {len(pmids)} total, {len(new_pmids)} new")

        if new_pmids and not first_run:
            try:
                meta = esummary(new_pmids)
                time.sleep(0.4)
            except Exception as exc:
                print(f"  WARNING: {exc}", file=sys.stderr)
                meta = {p: {'title': '(title unavailable)', 'source': '', 'pubdate': ''} for p in new_pmids}
            for pmid in new_pmids:
                m = meta.get(pmid, {})
                all_new.append((search['name'], {
                    'pmid':    pmid,
                    'title':   m.get('title', ''),
                    'journal': m.get('source', ''),
                    'pubdate': m.get('pubdate', ''),
                }))

        state[sid] = sorted(set(known) | set(pmids))
        time.sleep(0.4)

    save_state(state)

    if first_run:
        total = sum(len(v) for k, v in state.items() if isinstance(v, list))
        print(f'State initialised with {total} PMIDs.')
        print('No notification sent on first run.')
        return 0

    if not all_new and not page_changed:
        print(f'No ACIP/AAP vaccine schedule changes detected ({date.today()}).')
        _write_quarterly_result('vaccines', 'ACIP/AAP Vaccine Schedules', VACCINES_URL, 'no_change', [])
        return 0

    lines = []
    for note in page_notes:
        lines.append(note)
    if page_notes:
        lines.append('')
    if all_new:
        lines.append(f'{len(all_new)} new publication(s):\n')
        for search_name, m in all_new:
            lines.append(f'[{search_name}]')
            lines.append(f'  {m["title"]}')
            if m['journal']:
                lines.append(f'  {m["journal"]} {m["pubdate"]} — PMID {m["pmid"]}')
            else:
                lines.append(f'  PMID {m["pmid"]}')
            lines.append('')

    lines.append('Review vaccines/app.js VACCINES array and AAP aap:{} overrides.')
    lines.append('Update footer in vaccines/index.html if a new annual schedule was published.')
    message = '\n'.join(lines)

    print(message)
    push_notify(user, token, 'ACIP/AAP Vaccine Schedule Update', message)
    findings = [{'detail': n} for n in page_notes]
    findings.extend(
        {'search': name, 'title': m['title'], 'pmid': m['pmid'],
         'journal': m['journal'], 'pubdate': m['pubdate']}
        for name, m in all_new
    )
    _write_quarterly_result('vaccines', 'ACIP/AAP Vaccine Schedules', VACCINES_URL, 'changed', findings)
    print('Notification sent.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
