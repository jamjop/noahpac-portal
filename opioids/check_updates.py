#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for updates to opioid prescribing guidelines
and MME conversion evidence (CDC, FDA, SAMHSA). Alerts via Pushover.
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

APP_ID      = 'opioids'
APP_NAME    = 'Opioid Conversion & MME'
APP_URL     = 'https://noahpac.com/opioids/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-opioid-monitor/1.0'
ALERT_TITLE = 'Opioid Guidelines Update'
UPDATE_HINT = 'Review and update /var/www/noahpac-portal/opioids/app.js if MME factors or thresholds changed.'

SEARCHES = [
    {
        'id':      'cdc_opioid_guideline',
        'name':    'CDC Opioid Prescribing Guideline',
        'query':   'CDC AND ("opioid prescribing" OR "opioid guideline") AND (MMWR[ta] OR guideline[pt])',
        'reldate': 400,
    },
    {
        'id':      'mme_conversion',
        'name':    'Opioid MME Conversion Factors',
        'query':   '("morphine milligram equivalent" OR "MME" OR "equianalgesic") AND (opioid OR analgesic) AND (conversion OR factor OR ratio) AND (guideline OR recommendation OR update)[ti]',
        'reldate': 400,
    },
    {
        'id':      'buprenorphine_guidance',
        'name':    'Buprenorphine / OUD Treatment Guidance',
        'query':   '(buprenorphine OR "opioid use disorder") AND (guideline OR recommendation OR practice[ti]) AND (SAMHSA OR FDA OR ASAM OR "addiction medicine")',
        'reldate': 400,
    },
    {
        'id':      'methadone_guidance',
        'name':    'Methadone Dosing / Safety Guidance',
        'query':   'methadone AND (guideline OR recommendation OR "QTc" OR "cardiac safety" OR "dose conversion") AND (opioid OR "pain management" OR "opioid use disorder")',
        'reldate': 400,
    },
    {
        'id':      'opioid_risk_thresholds',
        'name':    'Opioid Risk Thresholds (50/90 MME)',
        'query':   'opioid AND ("high dose" OR "90 MME" OR "50 MME" OR "high-dose opioid") AND (overdose OR risk OR mortality OR outcome)',
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

    lines = [f'{len(findings)} new guideline publication(s) — review for opioid guideline updates:\n']
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
