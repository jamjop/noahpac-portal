#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for updates to corticosteroid equivalency,
HPA axis suppression risk, and tapering guidance (Endocrine Society, ACR,
perioperative stress dosing). Alerts via Pushover.
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

APP_ID      = 'steroids'
APP_DIR      = Path(__file__).resolve().parent
APP_NAME    = 'Corticosteroid Equivalency & Tapering'
APP_URL     = 'https://noahpac.com/steroids/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-steroid-monitor/1.0'
ALERT_TITLE = 'Corticosteroid Guidelines Update'
UPDATE_HINT = 'Review and update /var/www/noahpac-portal/steroids/app.js if equivalency ratios, HPA suppression thresholds, or taper guidance changed.'

SEARCHES = [
    {
        'id':      'corticosteroid_equivalency',
        'name':    'Corticosteroid Equivalency / Relative Potency',
        'query':   '(corticosteroid OR glucocorticoid) AND ("equivalent dose" OR "relative potency" OR equipotent) AND (prednisone OR dexamethasone OR hydrocortisone OR methylprednisolone) AND (guideline OR review OR reference)[pt]',
        'reldate': 400,
    },
    {
        'id':      'hpa_axis_suppression',
        'name':    'HPA Axis Suppression / Adrenal Insufficiency Risk',
        'query':   '("HPA axis" OR "hypothalamic-pituitary-adrenal" OR "adrenal insufficiency" OR "adrenal suppression") AND (glucocorticoid OR corticosteroid) AND (exogenous OR iatrogenic) AND (guideline OR "practice guideline" OR review)[pt]',
        'reldate': 400,
    },
    {
        'id':      'steroid_tapering',
        'name':    'Corticosteroid Tapering Guidance',
        'query':   '(corticosteroid[ti] OR glucocorticoid[ti] OR steroid[ti]) AND (taper[tiab] OR tapering[tiab] OR withdrawal[tiab]) AND (guideline OR "practice guideline" OR consensus)[pt]',
        'reldate': 400,
    },
    {
        'id':      'endocrine_society_glucocorticoid',
        'name':    'Endocrine Society Glucocorticoid / Adrenal Guidance',
        'query':   '("Endocrine Society") AND (glucocorticoid OR adrenal OR corticosteroid OR "adrenal insufficiency") AND (guideline OR "clinical practice guideline")',
        'reldate': 400,
    },
    {
        'id':      'perioperative_stress_dosing',
        'name':    'Perioperative / Stress-Dose Corticosteroid Guidance',
        'query':   '("stress dose" OR "stress dosing" OR "perioperative steroid") AND (corticosteroid OR glucocorticoid) AND (guideline OR consensus OR recommendation)[pt]',
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

    lines = [f'{len(findings)} new guideline publication(s) — review for corticosteroid updates:\n']
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
