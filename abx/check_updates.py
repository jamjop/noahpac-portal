#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for new guideline publications from sources
cited on noahpac.com/abx/. Alerts via Pushover when new papers appear.
Run quarterly via cron (Jan/Apr/Jul/Oct 15).

Usage:
    PUSHOVER_USER=xxx PUSHOVER_TOKEN=yyy ./check_updates.py
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
from datetime import date
from pathlib import Path

PUSHOVER_API = "https://api.pushover.net/1/messages.json"
EUTILS_BASE  = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
STATE_FILE   = Path(__file__).resolve().parent / "known_pmids.json"
ABX_URL      = "https://noahpac.com/abx/"

# Each entry targets one source cited in the abx reference page.
# reldate: how many past days to search (use 400 to safely cover a quarter + margin).
SEARCHES = [
    {
        'id':      'idsa',
        'name':    'IDSA Practice Guidelines',
        'query':   '"Infectious Diseases Society of America" AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'shea',
        'name':    'SHEA / CDI Guidelines',
        'query':   '"Society for Healthcare Epidemiology of America" AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'ssc',
        'name':    'Surviving Sepsis Campaign',
        'query':   '"Surviving Sepsis Campaign" AND (guideline OR recommendation OR update)[ti]',
        'reldate': 400,
    },
    {
        'id':      'wses',
        'name':    'WSES Intra-abdominal Guidelines',
        'query':   '"World Society of Emergency Surgery" AND (intra-abdominal OR peritonitis OR infection) AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'aap_aom',
        'name':    'AAP Otitis Media',
        'query':   '"American Academy of Pediatrics" AND "otitis media" AND guideline[pt]',
        'reldate': 730,
    },
    {
        'id':      'acg_pylori',
        'name':    'ACG H. pylori Guidelines',
        'query':   '"American College of Gastroenterology" AND "Helicobacter pylori" AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'ats_resp',
        'name':    'ATS/IDSA Respiratory Guidelines (CAP/COPD)',
        'query':   '("American Thoracic Society" OR "IDSA") AND (pneumonia OR "community-acquired" OR COPD) AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'aga_gi',
        'name':    'AGA / GI Guidelines',
        'query':   '"American Gastroenterological Association" AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'idsa_uti',
        'name':    'IDSA UTI / SSTI Guidelines',
        'query':   '"Infectious Diseases Society of America" AND (urinary tract OR skin OR "soft tissue") AND guideline[pt]',
        'reldate': 400,
    },
]


def esearch(query: str, reldate: int) -> list[str]:
    """Return list of PMIDs matching query within reldate days."""
    params = urllib.parse.urlencode({
        'db':       'pubmed',
        'term':     query,
        'retmode':  'json',
        'retmax':   50,
        'datetype': 'pdat',
        'reldate':  reldate,
    })
    url = f"{EUTILS_BASE}/esearch.fcgi?{params}"
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-abx-monitor/1.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    return data.get('esearchresult', {}).get('idlist', [])


def esummary(pmids: list[str]) -> dict:
    """Return title/journal metadata keyed by PMID."""
    if not pmids:
        return {}
    params = urllib.parse.urlencode({
        'db':      'pubmed',
        'id':      ','.join(pmids),
        'retmode': 'json',
    })
    url = f"{EUTILS_BASE}/esummary.fcgi?{params}"
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-abx-monitor/1.0'})
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


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2))
    STATE_FILE.chmod(0o644)


def push_notify(user: str, token: str, title: str, message: str) -> None:
    payload = json.dumps({
        'token':     token,
        'user':      user,
        'title':     title,
        'message':   message,
        'url':       ABX_URL,
        'url_title': 'noahpac.com/abx/',
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
            print(f"Pushover warning: {result}", file=sys.stderr)


def main() -> int:
    user  = os.environ.get('PUSHOVER_USER', '').strip()
    token = os.environ.get('PUSHOVER_TOKEN', '').strip()
    if not user or not token:
        print('ERROR: set PUSHOVER_USER and PUSHOVER_TOKEN', file=sys.stderr)
        return 2

    state = load_state()
    first_run = not state
    if first_run:
        print('First run — initialising state (no alert will be sent).')

    all_new: list[tuple[str, dict]] = []  # (search_name, metadata)

    for search in SEARCHES:
        sid = search['id']
        print(f"Querying PubMed: {search['name']} …")
        try:
            pmids = esearch(search['query'], search['reldate'])
        except Exception as exc:
            print(f"  ERROR fetching {sid}: {exc}", file=sys.stderr)
            continue

        known = set(state.get(sid, []))
        new_pmids = [p for p in pmids if p not in known]
        print(f"  Found {len(pmids)} total, {len(new_pmids)} new")

        if new_pmids and not first_run:
            try:
                meta = esummary(new_pmids)
                time.sleep(0.4)  # stay under PubMed rate limit (3 req/s)
            except Exception as exc:
                print(f"  WARNING: could not fetch summaries: {exc}", file=sys.stderr)
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
        time.sleep(0.4)  # PubMed rate limit

    save_state(state)

    if first_run:
        print(f'State initialised with {sum(len(v) for v in state.values())} PMIDs across {len(SEARCHES)} searches.')
        print('No notification sent on first run.')
        return 0

    if not all_new:
        print(f'No new guideline publications detected ({date.today()}).')
        return 0

    # Build Pushover message
    lines = [f'{len(all_new)} new guideline publication(s) — review for abx updates:\n']
    for search_name, m in all_new:
        lines.append(f'[{search_name}]')
        lines.append(f'  {m["title"]}')
        if m['journal']:
            lines.append(f'  {m["journal"]} {m["pubdate"]} — PMID {m["pmid"]}')
        else:
            lines.append(f'  PMID {m["pmid"]}')
        lines.append('')

    lines.append('Review and update /var/www/noahpac-portal/abx/app.js if regimens changed.')
    message = '\n'.join(lines)

    print(message)
    push_notify(user, token, 'ABX Guideline Update Detected', message)
    print('Notification sent.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
