#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for new guideline publications from sources
cited on noahpac.com/als/. Alerts via Pushover when new papers appear.
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
ALS_URL      = "https://noahpac.com/als/"

# AHA ACLS guidelines are on a ~5-year ILCOR cycle; TTM/post-arrest care,
# ACS, and stroke guidance update more frequently. reldate=730 used for
# major guidelines bodies; 400 for more actively evolving areas.
SEARCHES = [

    # ── ACLS / Cardiac Arrest (Core) ─────────────────────────────────────────
    {
        'id':      'aha_acls',
        'name':    'AHA Advanced Cardiovascular Life Support (ACLS) Guidelines',
        'query':   '"American Heart Association" AND ("advanced cardiovascular life support" OR ACLS OR "cardiac arrest" OR "cardiopulmonary resuscitation") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 730,
    },
    {
        'id':      'ilcor_adult',
        'name':    'ILCOR Adult Resuscitation — Consensus on Science',
        'query':   '(ILCOR OR "International Liaison Committee on Resuscitation") AND (adult OR ACLS OR "basic life support") AND (guideline[pt] OR update[ti] OR consensus[ti] OR statement[pt])',
        'reldate': 730,
    },
    {
        'id':      'erc_resuscitation',
        'name':    'European Resuscitation Council (ERC) Guidelines',
        'query':   '"European Resuscitation Council" AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 730,
    },

    # ── Bradycardia / Tachycardia / Arrhythmia ───────────────────────────────
    {
        'id':      'aha_arrhythmia',
        'name':    'AHA/ACC Arrhythmia Guidelines (Bradycardia, SVT, VT)',
        'query':   '("American Heart Association" OR "American College of Cardiology") AND (bradycardia OR tachycardia OR "supraventricular tachycardia" OR "ventricular tachycardia" OR arrhythmia) AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },

    # ── Post-Cardiac Arrest Care / TTM ────────────────────────────────────────
    {
        'id':      'post_arrest_ttm',
        'name':    'Post-Cardiac Arrest Care / Targeted Temperature Management',
        'query':   '("targeted temperature management" OR "temperature control" OR "post-cardiac arrest" OR "post-resuscitation care" OR "therapeutic hypothermia") AND (guideline[pt] OR update[ti] OR consensus[ti] OR statement[pt])',
        'reldate': 400,
    },

    # ── ACS / STEMI ───────────────────────────────────────────────────────────
    {
        'id':      'aha_acc_acs',
        'name':    'AHA/ACC Acute Coronary Syndromes / STEMI Guidelines',
        'query':   '("American Heart Association" OR "American College of Cardiology") AND ("acute coronary syndrome" OR STEMI OR "ST-elevation myocardial infarction" OR NSTEMI OR "unstable angina") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },

    # ── Stroke ────────────────────────────────────────────────────────────────
    {
        'id':      'aha_stroke',
        'name':    'AHA/ASA Acute Stroke Guidelines',
        'query':   '("American Heart Association" OR "American Stroke Association") AND ("acute stroke" OR "ischemic stroke" OR "intracerebral hemorrhage" OR tPA OR alteplase OR thrombectomy) AND (guideline[pt] OR update[ti] OR statement[pt])',
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
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-als-monitor/1.0'})
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
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-als-monitor/1.0'})
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
        'url':       ALS_URL,
        'url_title': 'noahpac.com/als/',
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
        _write_quarterly_result('als', 'Advanced Life Support', ALS_URL, 'no_change', [])
        return 0

    lines = [f'{len(all_new)} new guideline publication(s) — review for ALS algorithm updates:\n']
    for search_name, m in all_new:
        lines.append(f'[{search_name}]')
        lines.append(f'  {m["title"]}')
        if m['journal']:
            lines.append(f'  {m["journal"]} {m["pubdate"]} — PMID {m["pmid"]}')
        else:
            lines.append(f'  PMID {m["pmid"]}')
        lines.append('')

    lines.append('Update algorithms in /var/www/noahpac-portal/als/app.js if guidance changed.')
    message = '\n'.join(lines)

    print(message)
    push_notify(user, token, 'ALS Guideline Update Detected', message)
    _write_quarterly_result('als', 'Advanced Life Support', ALS_URL, 'changed', [
        {'search': name, 'title': m['title'], 'pmid': m['pmid'],
         'journal': m['journal'], 'pubdate': m['pubdate']}
        for name, m in all_new
    ])
    print('Notification sent.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
