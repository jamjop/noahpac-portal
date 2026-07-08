#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for updates to toxicology antidote
guidance (ACMT, AAPCC, acetaminophen/NAC dosing, toxic alcohol,
antidote-specific society guidance). Alerts via Pushover.
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

APP_ID      = 'toxicology'
APP_DIR      = Path(__file__).resolve().parent
APP_NAME    = 'Toxicology / Antidote Reference'
APP_URL     = 'https://noahpac.com/toxicology/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-toxicology-monitor/1.0'
ALERT_TITLE = 'Toxicology Guidelines Update'
UPDATE_HINT = 'Review and update /var/www/noahpac-portal/toxicology/index.html if antidote agents, dosing, or nomogram guidance changed.'

SEARCHES = [
    {
        'id':      'acetaminophen_nac',
        'name':    'Acetaminophen / N-acetylcysteine Dosing',
        'query':   '(acetaminophen[ti] OR paracetamol[ti]) AND ("N-acetylcysteine"[tiab] OR NAC[tiab] OR nomogram[tiab]) AND (guideline OR "practice guideline" OR consensus OR review)[pt]',
        'reldate': 400,
    },
    {
        'id':      'toxic_alcohol_poisoning',
        'name':    'Toxic Alcohol Poisoning (Methanol / Ethylene Glycol)',
        'query':   '(methanol[ti] OR "ethylene glycol"[ti] OR fomepizole[ti]) AND (poisoning[tiab] OR toxicity[tiab] OR management[tiab]) AND (guideline OR "practice guideline" OR consensus OR review)[pt]',
        'reldate': 400,
    },
    {
        'id':      'antidote_society_guidance',
        'name':    'Antidote / Poisoning Management — Society Guidance',
        'query':   '("American College of Medical Toxicology" OR ACMT OR "position statement") AND (antidote OR poisoning OR overdose) AND (guideline OR "practice guideline" OR consensus OR review)[pt]',
        'reldate': 400,
    },
    {
        'id':      'cardiotoxic_overdose_antidotes',
        'name':    'Cardiotoxic Overdose Antidotes (Digoxin, CCB/BB, TCA)',
        'query':   '(digoxin[ti] OR "calcium channel blocker"[ti] OR "beta blocker"[ti] OR "tricyclic"[ti]) AND (overdose[tiab] OR toxicity[tiab] OR poisoning[tiab]) AND (guideline OR "practice guideline" OR consensus OR review)[pt]',
        'reldate': 400,
    },
    {
        'id':      'lipid_emulsion_therapy',
        'name':    'Lipid Emulsion Therapy / Local Anesthetic Systemic Toxicity',
        'query':   '("lipid emulsion"[tiab] OR LAST[ti]) AND ("local anesthetic"[tiab] OR toxicity[tiab] OR overdose[tiab]) AND (guideline OR "practice guideline" OR consensus OR review)[pt]',
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

    lines = [f'{len(findings)} new guideline publication(s) — review for toxicology updates:\n']
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
