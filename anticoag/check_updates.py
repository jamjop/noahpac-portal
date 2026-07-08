#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for updates to anticoagulant/antiplatelet
reversal and periprocedural bridging guidance (ACC/AHA, CHEST, ASRA,
DOAC-specific reversal agents). Alerts via Pushover.
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

APP_ID      = 'anticoag'
APP_DIR      = Path(__file__).resolve().parent
APP_NAME    = 'Anticoagulation Reversal'
APP_URL     = 'https://noahpac.com/anticoag/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-anticoag-monitor/1.0'
ALERT_TITLE = 'Anticoagulation Reversal Guidelines Update'
UPDATE_HINT = 'Review and update /var/www/noahpac-portal/anticoag/index.html if reversal agents, dosing, or bridging recommendations changed.'

SEARCHES = [
    {
        'id':      'warfarin_reversal',
        'name':    'Warfarin / Vitamin K Antagonist Reversal',
        'query':   '(warfarin OR "vitamin K antagonist") AND (reversal[tiab] OR "prothrombin complex"[tiab]) AND (guideline OR "practice guideline" OR review)[pt]',
        'reldate': 400,
    },
    {
        'id':      'doac_reversal_agents',
        'name':    'DOAC-Specific Reversal Agents',
        'query':   '(idarucizumab OR "andexanet alfa") AND (guideline OR "practice guideline" OR consensus OR review)[pt]',
        'reldate': 400,
    },
    {
        'id':      'periprocedural_bridging',
        'name':    'Periprocedural Anticoagulation Bridging',
        'query':   '(anticoagul*[ti] OR DOAC[ti] OR warfarin[ti]) AND (periprocedural[tiab] OR perioperative[tiab] OR bridging[tiab]) AND (guideline OR "practice guideline" OR consensus)[pt]',
        'reldate': 400,
    },
    {
        'id':      'antiplatelet_reversal',
        'name':    'Antiplatelet Reversal / Management',
        'query':   '(aspirin[ti] OR P2Y12[ti] OR clopidogrel[ti] OR ticagrelor[ti]) AND (reversal[tiab] OR "platelet transfusion"[tiab] OR perioperative[tiab]) AND (guideline OR "practice guideline" OR consensus)[pt]',
        'reldate': 400,
    },
    {
        'id':      'doac_reversal_guideline',
        'name':    'DOAC Reversal — Society Guidance',
        'query':   '("factor Xa inhibitor"[tiab] OR "direct oral anticoagulant"[tiab] OR DOAC[tiab]) AND (reversal[ti] OR "major bleeding"[ti]) AND (guideline OR "practice guideline" OR consensus)[pt]',
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

    lines = [f'{len(findings)} new guideline publication(s) — review for anticoagulation reversal updates:\n']
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
