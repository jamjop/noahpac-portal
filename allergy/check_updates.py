#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for updates to antibiotic allergy and
beta-lactam cross-reactivity guidelines (AAAAI/ACAAI, IDSA, penicillin
allergy delabeling). Alerts via Pushover.
Run quarterly via cron (Jan/Apr/Jul/Oct 15).

Usage:
    PUSHOVER_USER=xxx PUSHOVER_TOKEN=yyy ./check_updates.py
"""

import os
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'lib'))
import pubmed_watcher as pw

APP_ID      = 'allergy'
APP_DIR      = Path(__file__).resolve().parent
APP_NAME    = 'Antibiotic Allergy Cross-Reactivity'
APP_URL     = 'https://noahpac.com/allergy/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-allergy-monitor/1.0'
ALERT_TITLE = 'Antibiotic Allergy Guidelines Update'
UPDATE_HINT = 'Review and update /var/www/noahpac-portal/allergy/app.js if cross-reactivity data or recommendations changed.'

SEARCHES = [
    {
        'id':      'betalactam_crossreactivity',
        'name':    'Beta-Lactam Cross-Reactivity Guidelines',
        'query':   '("beta-lactam" OR "penicillin") AND ("cross-reactivity" OR "cross reactivity") AND (cephalosporin OR carbapenem OR aztreonam) AND (guideline OR recommendation OR review)[pt]',
        'reldate': 400,
    },
    {
        'id':      'penicillin_allergy_delabeling',
        'name':    'Penicillin Allergy Delabeling / Evaluation',
        'query':   '"penicillin allergy" AND (delabeling OR "de-labeling" OR "skin test" OR evaluation OR graded) AND (guideline OR recommendation OR practice parameter)',
        'reldate': 400,
    },
    {
        'id':      'aaaai_acaai_drug_allergy',
        'name':    'AAAAI / ACAAI Drug Allergy Practice Parameters',
        'query':   '(AAAAI OR ACAAI OR "Joint Task Force") AND ("drug allergy" OR "antibiotic allergy" OR "penicillin allergy") AND (practice OR parameter OR guideline)',
        'reldate': 400,
    },
    {
        'id':      'side_chain_crossreactivity',
        'name':    'R1 Side-Chain Cross-Reactivity Evidence',
        'query':   '("side chain" OR "R1 group" OR "aminobenzyl") AND (penicillin OR cephalosporin) AND (cross-reactivity OR allergy OR hypersensitivity)',
        'reldate': 400,
    },
    {
        'id':      'cephalosporin_allergy',
        'name':    'Cephalosporin Allergy / Hypersensitivity',
        'query':   '"cephalosporin" AND (allergy OR hypersensitivity) AND (guideline OR recommendation OR "clinical practice") AND (management OR evaluation)',
        'reldate': 400,
    },
]


def main() -> int:
    user  = os.environ.get('PUSHOVER_USER', '').strip()
    token = os.environ.get('PUSHOVER_TOKEN', '').strip()
    if not user or not token:
        print('ERROR: set PUSHOVER_USER and PUSHOVER_TOKEN', file=sys.stderr)
        return 2

    state     = pw.load_state(STATE_FILE)
    first_run = not state
    if first_run:
        print('First run — initialising state (no alert will be sent).')

    state, findings = pw.run_searches(SEARCHES, state, first_run, USER_AGENT)
    pw.save_state(STATE_FILE, state)

    if first_run:
        total = sum(len(v) for v in state.values())
        print(f'State initialised with {total} PMIDs across {len(SEARCHES)} searches.')
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'no_change', [])
        pw.save_last_checked(APP_DIR, 'no_change')
        return 0

    if not findings:
        print(f'No changes detected ({date.today()}).')
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'no_change', [])
        pw.save_last_checked(APP_DIR, 'no_change')
        return 0

    lines = [f'{len(findings)} new guideline publication(s) — review for allergy updates:\n']
    lines.append(pw.format_findings(findings))
    lines.append(UPDATE_HINT)
    message = '\n'.join(lines)

    print(message)
    pw.push_notify(user, token, ALERT_TITLE, message, APP_URL, APP_NAME)
    pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'changed', [
        {'search': name, 'title': m['title'], 'pmid': m['pmid'],
         'journal': m['journal'], 'pubdate': m['pubdate']}
        for name, m in findings
    ])
    pw.save_last_checked(APP_DIR, 'changed')
    print('Notification sent.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
