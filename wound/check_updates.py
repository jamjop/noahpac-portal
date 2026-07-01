#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for updates to wound care and tetanus
prophylaxis guidelines (ACIP, IDSA, ACS). Alerts via Pushover.
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

APP_ID      = 'wound'
APP_NAME    = 'Wound Care'
APP_URL     = 'https://noahpac.com/wound/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-wound-monitor/1.0'
ALERT_TITLE = 'Wound Care Update'
UPDATE_HINT = 'Review and update /var/www/noahpac-portal/wound/app.js if prophylaxis recommendations changed.'

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

    # suppress_new_search_alerts: guards against false positives when new
    # searches are added to an already-initialised state file.
    state, findings = pw.run_searches(
        SEARCHES, state, first_run, USER_AGENT,
        suppress_new_search_alerts=True,
    )
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

    lines = [f'{len(findings)} new guideline publication(s) — review for wound care updates:\n']
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
