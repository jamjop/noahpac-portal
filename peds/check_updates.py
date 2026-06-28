#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for new guideline publications from sources
cited on noahpac.com/peds/. Alerts via Pushover when new papers appear.
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
PEDS_URL     = "https://noahpac.com/peds/"

# PALS (AHA) guidelines update on a ~5-year ILCOR cycle; AAP antibiotic
# recommendations, seizure protocols, and vancomycin monitoring guidance
# change more frequently. reldate=400 covers a quarter with margin;
# reldate=730 used for slowly-updating bodies to avoid missing anything.
SEARCHES = [

    # ── Resuscitation / PALS ─────────────────────────────────────────────────
    {
        'id':      'aha_pals',
        'name':    'AHA Pediatric Advanced Life Support (PALS) Guidelines',
        'query':   '"American Heart Association" AND ("pediatric advanced life support" OR PALS OR "pediatric resuscitation" OR "pediatric cardiac arrest") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 730,
    },
    {
        'id':      'ilcor_peds',
        'name':    'ILCOR Pediatric Resuscitation — Consensus on Science',
        'query':   '(ILCOR OR "International Liaison Committee on Resuscitation") AND (pediatric OR paediatric) AND (resuscitation OR "cardiac arrest" OR "life support") AND (consensus[ti] OR update[ti] OR statement[pt])',
        'reldate': 730,
    },

    # ── Antibiotics / Pediatric Infections ───────────────────────────────────
    {
        'id':      'aap_antibiotics',
        'name':    'AAP Pediatric Antibiotic / Infectious Disease Guidelines',
        'query':   '"American Academy of Pediatrics" AND (antibiotic OR antimicrobial OR "otitis media" OR "community-acquired pneumonia" OR "urinary tract infection") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },
    {
        'id':      'idsa_peds_infections',
        'name':    'IDSA Pediatric Infection Guidelines',
        'query':   '"Infectious Diseases Society of America" AND (pediatric OR paediatric OR children) AND (guideline[pt] OR update[ti])',
        'reldate': 400,
    },

    # ── Seizures / Status Epilepticus ─────────────────────────────────────────
    {
        'id':      'aes_status_epilepticus',
        'name':    'AES / PECARN Status Epilepticus Guidelines',
        'query':   '("American Epilepsy Society" OR "Pediatric Emergency Care Applied Research Network") AND ("status epilepticus" OR seizure) AND (guideline[pt] OR update[ti] OR protocol[ti] OR consensus[ti])',
        'reldate': 730,
    },

    # ── Vancomycin Monitoring ─────────────────────────────────────────────────
    {
        'id':      'vancomycin_monitoring',
        'name':    'ASHP/ACCP/IDSA Vancomycin Therapeutic Monitoring',
        'query':   '("American Society of Health-System Pharmacists" OR "Infectious Diseases Society of America" OR "Society of Infectious Diseases Pharmacists") AND vancomycin AND (AUC OR "therapeutic monitoring" OR "pharmacokinetic" OR dosing) AND (guideline[pt] OR update[ti] OR consensus[ti])',
        'reldate': 730,
    },

    # ── Procedural Sedation / RSI ─────────────────────────────────────────────
    {
        'id':      'acep_aap_sedation',
        'name':    'ACEP / AAP Pediatric Procedural Sedation Guidelines',
        'query':   '("American College of Emergency Physicians" OR "American Academy of Pediatrics" OR "Society for Academic Emergency Medicine") AND ("procedural sedation" OR "ketamine" OR "propofol" OR "rapid sequence intubation") AND pediatric AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 730,
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
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-peds-monitor/1.0'})
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
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-peds-monitor/1.0'})
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
        'url':       PEDS_URL,
        'url_title': 'noahpac.com/peds/',
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
        _write_quarterly_result('peds', 'Pediatric Dosing', PEDS_URL, 'no_change', [])
        return 0

    # Build Pushover message
    lines = [f'{len(all_new)} new guideline publication(s) — review for peds dosing updates:\n']
    for search_name, m in all_new:
        lines.append(f'[{search_name}]')
        lines.append(f'  {m["title"]}')
        if m['journal']:
            lines.append(f'  {m["journal"]} {m["pubdate"]} — PMID {m["pmid"]}')
        else:
            lines.append(f'  PMID {m["pmid"]}')
        lines.append('')

    lines.append('Update doses in /var/www/noahpac-portal/peds/app.js if regimens changed.')
    message = '\n'.join(lines)

    print(message)
    push_notify(user, token, 'Peds Dosing Guideline Update Detected', message)
    _write_quarterly_result('peds', 'Pediatric Dosing', PEDS_URL, 'changed', [
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
