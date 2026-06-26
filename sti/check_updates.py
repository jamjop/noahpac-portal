#!/usr/bin/env python3
"""
check_updates.py — monitor CDC STI Treatment Guidelines for updates to the
treatment reference app (noahpac.com/sti/).

Watches:
  1. PubMed for new CDC STI treatment guideline publications
  2. CDC STI treatment guidelines page for link/date changes

The STI treatment app (sti/) is based on CDC 2021 STI Treatment Guidelines.
The sti-guide/ app monitors the same source; this monitor is specific to the
treatment reference app and includes additional PubMed searches for
STI-specific updates (doxy-PEP, mpox, gonorrhea resistance, etc.).

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

PUSHOVER_API = "https://api.pushover.net/1/messages.json"
EUTILS_BASE  = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
STATE_FILE   = Path(__file__).resolve().parent / "known_pmids.json"
STI_URL      = "https://noahpac.com/sti/"
CDC_STI_URL  = "https://www.cdc.gov/std/treatment-guidelines/default.htm"

SEARCHES = [
    {
        'id':      'cdc_sti_guidelines',
        'name':    'CDC STI Treatment Guidelines (MMWR)',
        'query':   'CDC AND ("sexually transmitted" OR "STI" OR "STD") AND ("treatment guidelines" OR "treatment guide") AND MMWR[ta]',
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
        'query':   'CDC AND gonorrhea AND ("antimicrobial resistance" OR "treatment failure" OR "ceftriaxone") AND (guideline OR recommendation OR update)[ti]',
        'reldate': 400,
    },
    {
        'id':      'cdc_sti_updates',
        'name':    'CDC STI/Sexual Health Guidance Updates',
        'query':   '"Centers for Disease Control" AND ("sexually transmitted" OR sexual health) AND (guideline OR recommendation)[pt]',
        'reldate': 400,
    },
]

CDC_PAGE = {
    'url': CDC_STI_URL,
    'date_patterns': [
        r'(?:last\s+reviewed|updated)[:\s]+([A-Za-z]+\s+\d+,?\s+\d{4})',
        r'(\d{1,2}/\d{1,2}/\d{4})',
    ],
    'link_patterns': [
        r'/std/treatment',
        r'/sti/hcp',
        r'STI-Guidelines',
        r'treatment-guidelines',
        r'\.pdf',
    ],
}


def esearch(query: str, reldate: int) -> list[str]:
    params = urllib.parse.urlencode({
        'db':       'pubmed',
        'term':     query,
        'retmode':  'json',
        'retmax':   30,
        'datetype': 'pdat',
        'reldate':  reldate,
    })
    url = f"{EUTILS_BASE}/esearch.fcgi?{params}"
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-sti-monitor/1.0'})
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
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-sti-monitor/1.0'})
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


def check_cdc_page(state: dict) -> tuple[bool, list[str]]:
    """Check CDC STI page for new links or date changes. Returns (changed, change_notes)."""
    try:
        req = urllib.request.Request(
            CDC_PAGE['url'],
            headers={'User-Agent': 'noahpac-sti-monitor/1.0'},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            html = resp.read().decode('utf-8', errors='replace')
    except Exception as exc:
        print(f"  WARNING: could not fetch CDC page: {exc}", file=sys.stderr)
        return False, []

    hrefs = re.findall(r'href=["\']([^"\']+)["\']', html, re.IGNORECASE)
    current_links = {h for h in hrefs if any(re.search(p, h, re.IGNORECASE) for p in CDC_PAGE['link_patterns'])}

    date_match = None
    for pat in CDC_PAGE['date_patterns']:
        m = re.search(pat, html, re.IGNORECASE)
        if m:
            date_match = m.group(1).strip()
            break

    known_links  = set(state.get('cdc_links', []))
    known_date   = state.get('cdc_date', '')
    new_links    = current_links - known_links
    date_changed = bool(date_match and date_match != known_date)

    state['cdc_links'] = sorted(current_links)
    state['cdc_date']  = date_match or known_date

    notes = []
    if date_changed:
        notes.append(f"CDC page 'Last Reviewed' changed: {known_date!r} → {date_match!r}")
    if new_links:
        notes.append(f"{len(new_links)} new link(s): " + "; ".join(sorted(new_links)))

    print(f"  CDC page: {len(current_links)} links, date={date_match or '(none)'}")
    return bool(notes), notes


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
        'url':       STI_URL,
        'url_title': 'noahpac.com/sti/',
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

    # Check CDC page
    print(f"Checking CDC STI Treatment Guidelines page …")
    page_changed, page_notes = check_cdc_page(state)
    if page_changed and not first_run:
        for note in page_notes:
            print(f"  {note}")

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
                meta = {p: {'title': '(unavailable)', 'source': '', 'pubdate': ''} for p in new_pmids}
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

    if not all_new and not (page_changed and page_notes):
        print(f'No CDC STI guideline changes detected ({date.today()}).')
        _write_quarterly_result('sti', 'STI Treatment Reference', STI_URL, 'no_change', [])
        return 0

    lines = []
    if page_notes:
        lines.append('CDC STI Treatment Guidelines page changed:')
        lines.extend(f'  • {n}' for n in page_notes)
        lines.append('')
    if all_new:
        lines.append(f'{len(all_new)} new STI-related publication(s):\n')
        for search_name, m in all_new:
            lines.append(f'[{search_name}]')
            lines.append(f'  {m["title"]}')
            if m['journal']:
                lines.append(f'  {m["journal"]} {m["pubdate"]} — PMID {m["pmid"]}')
            else:
                lines.append(f'  PMID {m["pmid"]}')
            lines.append('')

    lines.append('Review and update /var/www/noahpac-portal/sti/app.js if treatment regimens changed.')
    message = '\n'.join(lines)

    print(message)
    push_notify(user, token, 'CDC STI Treatment Guidelines Update', message)
    findings = [{'detail': n} for n in page_notes]
    findings.extend(
        {'search': name, 'title': m['title'], 'pmid': m['pmid'],
         'journal': m['journal'], 'pubdate': m['pubdate']}
        for name, m in all_new
    )
    _write_quarterly_result('sti', 'STI Treatment Reference', STI_URL, 'changed', findings)
    print('Notification sent.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
