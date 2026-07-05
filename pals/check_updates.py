#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for new guideline publications from sources
cited on noahpac.com/pals/. Alerts via Pushover when new papers appear.
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

APP_ID      = 'pals'
APP_DIR      = Path(__file__).resolve().parent
APP_NAME    = 'Pediatric Advanced Life Support'
APP_URL     = 'https://noahpac.com/pals/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-pals-monitor/1.0'
ALERT_TITLE = 'PALS Guideline Update Detected'
UPDATE_HINT = 'Update algorithms in /var/www/noahpac-portal/pals/app.js if guidance changed.'

# AHA PALS and ILCOR pediatric resuscitation guidelines are on a ~5-year
# cycle; SVT management, IO access, and post-arrest care update more
# frequently. reldate=730 used for slow-cycle bodies.
SEARCHES = [

    # ── PALS / Pediatric Cardiac Arrest (Core) ────────────────────────────────
    {
        'id':      'aha_pals',
        'name':    'AHA Pediatric Advanced Life Support (PALS) Guidelines',
        'query':   '"American Heart Association" AND ("pediatric advanced life support" OR PALS OR "pediatric cardiac arrest" OR "pediatric resuscitation") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 730,
    },
    {
        'id':      'ilcor_pediatric',
        'name':    'ILCOR Pediatric Resuscitation — Consensus on Science',
        'query':   '(ILCOR OR "International Liaison Committee on Resuscitation") AND (pediatric OR paediatric OR neonatal) AND (resuscitation OR "cardiac arrest" OR "life support") AND (guideline[pt] OR update[ti] OR consensus[ti] OR statement[pt])',
        'reldate': 730,
    },
    {
        'id':      'erc_pediatric',
        'name':    'European Resuscitation Council — Pediatric Guidelines',
        'query':   '"European Resuscitation Council" AND (pediatric OR paediatric OR child) AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 730,
    },

    # ── Pediatric Arrhythmia (SVT / VT / Bradycardia) ────────────────────────
    {
        'id':      'aha_peds_arrhythmia',
        'name':    'AHA/ACC Pediatric Arrhythmia Guidelines (SVT, VT, Bradycardia)',
        'query':   '("American Heart Association" OR "American College of Cardiology" OR "Pediatric and Congenital Electrophysiology Society") AND (pediatric OR paediatric OR child) AND (tachycardia OR bradycardia OR "supraventricular tachycardia" OR arrhythmia) AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 730,
    },

    # ── Pediatric Post-Arrest Care ────────────────────────────────────────────
    {
        'id':      'peds_post_arrest',
        'name':    'Pediatric Post-Cardiac Arrest Care (PPCA)',
        'query':   '(pediatric OR paediatric OR child) AND ("post-cardiac arrest" OR "post-resuscitation" OR "targeted temperature management" OR "temperature control") AND (guideline[pt] OR update[ti] OR consensus[ti] OR statement[pt])',
        'reldate': 400,
    },

    # ── IO Access / Vascular Access in Arrest ────────────────────────────────
    {
        'id':      'io_access',
        'name':    'Intraosseous Access in Pediatric Resuscitation',
        'query':   '(intraosseous OR "IO access") AND (pediatric OR paediatric OR resuscitation OR "cardiac arrest") AND (guideline[pt] OR update[ti] OR consensus[ti] OR recommendation[ti])',
        'reldate': 730,
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
        print(f'No new guideline publications detected ({date.today()}).')
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'no_change', [])
        pw.save_last_checked(APP_DIR, 'no_change')
        return 0

    lines = [f'{len(findings)} new guideline publication(s) — review for PALS algorithm updates:\n']
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
