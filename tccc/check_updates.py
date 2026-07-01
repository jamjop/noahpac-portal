#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for new CoTCCC / TCCC guideline publications.

CoTCCC (Committee on Tactical Combat Casualty Care) publishes all guideline
updates in the Journal of Special Operations Medicine (J Spec Oper Med).
This script queries PubMed for new publications matching CoTCCC/TCCC and
alerts via Pushover when new papers appear.

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

APP_ID      = 'tccc'
APP_NAME    = 'TCCC / CoTCCC Guidelines'
APP_URL     = 'https://noahpac.com/tccc/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-tccc-monitor/1.0'
ALERT_TITLE = 'CoTCCC / TCCC Guideline Update'
UPDATE_HINT = (
    'Review and update /var/www/noahpac-portal/tccc/app.js if MARCH/PAWS '
    'protocols changed.\nAlso bump tccc/sw.js cache version after any content update.'
)

SEARCHES = [
    {
        'id':      'cotccc_guidelines',
        'name':    'CoTCCC TCCC Guideline Updates',
        'query':   '(CoTCCC OR "Committee on Tactical Combat Casualty Care" OR "TCCC Guidelines") AND "J Spec Oper Med"[ta]',
        'reldate': 400,
    },
    {
        'id':      'cotccc_broad',
        'name':    'CoTCCC Recommendations (all journals)',
        'query':   '"Committee on Tactical Combat Casualty Care" AND (guideline OR recommendation OR update)[ti]',
        'reldate': 400,
    },
    {
        'id':      'tccc_jsom',
        'name':    'TCCC / J Spec Oper Med (guideline changes)',
        'query':   '"J Spec Oper Med"[ta] AND ("guideline change" OR "TCCC guideline" OR "MARCH" OR "tourniquet" OR "hemorrhage control")[ti]',
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
        print('No notification sent on first run.')
        return 0

    if not findings:
        print(f'No new TCCC guideline publications detected ({date.today()}).')
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'no_change', [])
        return 0

    lines = [f'{len(findings)} new CoTCCC/TCCC publication(s) — review for guideline updates:\n']
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
    print('Notification sent.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
