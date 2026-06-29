#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for updates to wound care and tetanus
prophylaxis guidelines (ACIP, IDSA, ACS). Alerts via Pushover.
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
import datetime
from pathlib import Path

PUSHOVER_API = "https://api.pushover.net/1/messages.json"
EUTILS_BASE  = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
STATE_FILE   = Path(__file__).resolve().parent / "known_pmids.json"
APP_URL      = "https://noahpac.com/wound/"

SEARCHES = [
    {
        'id':      'acip_tetanus',
        'name':    'ACIP Tetanus Prophylaxis Recommendations',
        'query':   'ACIP AND (tetanus OR "Td" OR "Tdap") AND (recommendation OR guideline OR schedule)',
        'reldate': 400,
    },
    {
        'id':      'tetanus_wound',
        'name':    'Tetanus Wound Prophylaxis Evidence',
        'query':   'tetanus AND ("wound management" OR prophylaxis OR "immunoglobulin" OR TIG) AND (guideline OR recommendation OR update)[ti]',
        'reldate': 400,
    },
    {
        'id':      'wound_classification',
        'name':    'Surgical Wound Classification / SSI Prevention',
        'query':   '("wound classification" OR "surgical site infection") AND (guideline OR recommendation) AND (CDC OR IDSA OR ACS OR WHO)',
        'reldate': 400,
    },
    {
        'id':      'wound_care_guidelines',
        'name':    'Wound Care / Irrigation Guidelines',
        'query':   '("wound care" OR "wound irrigation" OR "wound management") AND (guideline OR recommendation OR "clinical practice") AND (emergency OR trauma OR laceration)',
        'reldate': 400,
    },
    {
        'id':      'wound_closure',
        'name':    'Wound Closure / Laceration Repair Guidelines',
        'query':   '("wound closure" OR "laceration repair" OR "primary closure" OR "delayed primary closure") AND (guideline OR recommendation OR "clinical practice") AND (emergency OR trauma)',
        'reldate': 400,
    },
    {
        'id':      'rabies_pep',
        'name':    'Rabies Post-Exposure Prophylaxis (ACIP)',
        'query':   'ACIP AND (rabies OR "post-exposure prophylaxis") AND (recommendation OR guideline OR update)',
        'reldate': 400,
    },
    {
        'id':      'animal_bite',
        'name':    'Animal Bite Wound Management',
        'query':   '("animal bite" OR "dog bite" OR "cat bite" OR "bite wound") AND ("wound management" OR "infection" OR prophylaxis) AND (guideline OR recommendation)',
        'reldate': 400,
    },
    {
        'id':      'human_bite',
        'name':    'Human Bite / Clenched-Fist Injuries',
        'query':   '("human bite" OR "clenched fist injury" OR "fight bite") AND (infection OR management OR prophylaxis)',
        'reldate': 400,
    },
    {
        'id':      'bite_abx',
        'name':    'Antibiotic Prophylaxis — Bite Wounds',
        'query':   '("bite wound" OR "animal bite" OR "human bite") AND (antibiotic OR prophylaxis OR "amoxicillin-clavulanate") AND (guideline OR recommendation OR "systematic review")',
        'reldate': 400,
    },
]


def esearch(query: str, reldate: int) -> list[str]:
    params = urllib.parse.urlencode({
        'db': 'pubmed', 'term': query, 'retmode': 'json',
        'retmax': 50, 'datetype': 'pdat', 'reldate': reldate,
    })
    url = f"{EUTILS_BASE}/esearch.fcgi?{params}"
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-wound-monitor/1.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read()).get('esearchresult', {}).get('idlist', [])


def esummary(pmids: list[str]) -> dict:
    if not pmids:
        return {}
    params = urllib.parse.urlencode({'db': 'pubmed', 'id': ','.join(pmids), 'retmode': 'json'})
    url = f"{EUTILS_BASE}/esummary.fcgi?{params}"
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-wound-monitor/1.0'})
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


def load_state() -> dict:
    return json.loads(STATE_FILE.read_text()) if STATE_FILE.exists() else {}


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2))
    STATE_FILE.chmod(0o644)


def _write_quarterly_result(status: str, findings: list[dict]) -> None:
    report_file = Path(f"/tmp/quarterly-report-{datetime.date.today()}.json")
    try:
        existing = json.loads(report_file.read_text()) if report_file.exists() else []
        existing.append({'app_id': 'wound', 'app_name': 'Wound Care',
                         'app_url': APP_URL, 'status': status, 'findings': findings,
                         'ran_at': datetime.datetime.now().isoformat(timespec='minutes')})
        report_file.write_text(json.dumps(existing, indent=2))
    except Exception as exc:
        print(f"WARNING: could not write quarterly report: {exc}", file=sys.stderr)


def push_notify(user: str, token: str, title: str, message: str) -> None:
    payload = json.dumps({
        'token': token, 'user': user, 'title': title, 'message': message,
        'url': APP_URL, 'url_title': 'Wound Care', 'priority': 0,
    }).encode()
    req = urllib.request.Request(PUSHOVER_API, data=payload,
                                 headers={'Content-Type': 'application/json'}, method='POST')
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

    state     = load_state()
    first_run = not state
    if first_run:
        print('First run — initialising state (no alert will be sent).')

    alerts:   list[str]  = []
    findings: list[dict] = []

    for search in SEARCHES:
        sid = search['id']
        print(f"Querying PubMed: {search['name']} …")
        try:
            pmids = esearch(search['query'], search['reldate'])
        except Exception as exc:
            print(f"  ERROR: {exc}", file=sys.stderr)
            continue

        known        = set(state.get(sid, []))
        first_search = sid not in state
        new_pmids    = [p for p in pmids if p not in known]
        suffix       = " (new search — initialising)" if first_search else ""
        print(f"  Found {len(pmids)} total, {len(new_pmids)} new{suffix}")

        if new_pmids and not first_run and not first_search:
            try:
                meta = esummary(new_pmids)
                time.sleep(0.4)
            except Exception as exc:
                print(f"  WARNING: summaries unavailable: {exc}", file=sys.stderr)
                meta = {p: {'title': '(title unavailable)', 'source': '', 'pubdate': ''} for p in new_pmids}
            for pmid in new_pmids:
                m = meta.get(pmid, {})
                alerts.append(f"[{search['name']}] {m.get('title','')}  PMID {pmid}")
                findings.append({'search': search['name'], 'title': m.get('title', ''),
                                 'pmid': pmid, 'journal': m.get('source', ''),
                                 'pubdate': m.get('pubdate', '')})

        state[sid] = sorted(known | set(pmids))
        time.sleep(0.4)

    save_state(state)

    if first_run:
        print(f'State initialised with {sum(len(v) for v in state.values())} PMIDs.')
        _write_quarterly_result('no_change', [])
        return 0

    if not alerts:
        print(f'No changes detected ({datetime.date.today()}).')
        _write_quarterly_result('no_change', [])
        return 0

    message = 'Wound care / tetanus guideline update detected:\n\n' + '\n'.join(f'• {a}' for a in alerts)
    message += '\n\nReview and update /var/www/noahpac-portal/wound/app.js if prophylaxis recommendations changed.'
    print(message)
    push_notify(user, token, 'Wound Care Update', message)
    _write_quarterly_result('changed', findings)
    print('Notification sent.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
