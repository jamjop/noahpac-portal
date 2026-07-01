#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for updates to sepsis guidelines
(Sepsis-3, Surviving Sepsis Campaign, SSC bundles). Alerts via Pushover.
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

APP_ID      = 'sepsis'
APP_NAME    = 'Sepsis Screening (qSOFA / SOFA)'
APP_URL     = 'https://noahpac.com/sepsis/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-sepsis-monitor/1.0'
ALERT_TITLE = 'Sepsis Guidelines Update'
UPDATE_HINT = 'Review and update /var/www/noahpac-portal/sepsis/app.js if Sepsis-3 criteria or bundle recommendations changed.'

SEARCHES = [
    {
        'id':      'surviving_sepsis',
        'name':    'Surviving Sepsis Campaign Guidelines',
        'query':   '"Surviving Sepsis Campaign" AND (guideline OR recommendation OR bundle OR update)',
        'reldate': 400,
    },
    {
        'id':      'sepsis3_definition',
        'name':    'Sepsis-3 Definition / SOFA Updates',
        'query':   '("Sepsis-3" OR "sepsis definition" OR SOFA OR qSOFA) AND (guideline OR consensus OR update OR revision)[ti]',
        'reldate': 400,
    },
    {
        'id':      'ssc_bundle',
        'name':    'Sepsis Bundle / Hour-1 Bundle',
        'query':   '("sepsis bundle" OR "hour-1 bundle" OR "1-hour bundle") AND (guideline OR recommendation OR outcome OR compliance)',
        'reldate': 400,
    },
    {
        'id':      'septic_shock',
        'name':    'Septic Shock Management Guidelines',
        'query':   '"septic shock" AND (vasopressor OR norepinephrine OR "fluid resuscitation") AND (guideline OR recommendation OR "clinical practice")',
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
        return 0

    if not findings:
        print(f'No changes detected ({date.today()}).')
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'no_change', [])
        return 0

    lines = [f'{len(findings)} new guideline publication(s) — review for sepsis guideline updates:\n']
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
