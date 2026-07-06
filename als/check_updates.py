#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for new guideline publications from sources
cited on noahpac.com/als/. Alerts via Pushover when new papers appear.
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

APP_ID      = 'als'
APP_DIR      = Path(__file__).resolve().parent
APP_NAME    = 'Advanced Life Support'
APP_URL     = 'https://noahpac.com/als/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-als-monitor/1.0'
ALERT_TITLE = 'ALS Guideline Update Detected'
UPDATE_HINT = 'Update algorithms in /var/www/noahpac-portal/als/app.js if guidance changed.'

# AHA ACLS guidelines are on a ~5-year ILCOR cycle; TTM/post-arrest care,
# ACS, and stroke guidance update more frequently. reldate=730 used for
# major guidelines bodies; 400 for more actively evolving areas.
SEARCHES = [

    # ── ACLS / Cardiac Arrest (Core) ─────────────────────────────────────────
    {
        'id':      'aha_acls',
        'name':    'AHA Advanced Cardiovascular Life Support (ACLS) Guidelines',
        'query':   '"American Heart Association" AND ("advanced cardiovascular life support" OR ACLS OR "cardiac arrest" OR "cardiopulmonary resuscitation") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 730,
    },
    {
        'id':      'ilcor_adult',
        'name':    'ILCOR Adult Resuscitation — Consensus on Science',
        'query':   '(ILCOR OR "International Liaison Committee on Resuscitation") AND (adult OR ACLS OR "basic life support") AND (guideline[pt] OR update[ti] OR consensus[ti] OR statement[pt])',
        'reldate': 730,
    },
    {
        'id':      'erc_resuscitation',
        'name':    'European Resuscitation Council (ERC) Guidelines',
        'query':   '"European Resuscitation Council" AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 730,
    },

    # ── Bradycardia / Tachycardia / Arrhythmia ───────────────────────────────
    {
        'id':      'aha_arrhythmia',
        'name':    'AHA/ACC Arrhythmia Guidelines (Bradycardia, SVT, VT)',
        'query':   '("American Heart Association" OR "American College of Cardiology") AND (bradycardia OR tachycardia OR "supraventricular tachycardia" OR "ventricular tachycardia" OR arrhythmia) AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },

    # ── Post-Cardiac Arrest Care / TTM ────────────────────────────────────────
    {
        'id':      'post_arrest_ttm',
        'name':    'Post-Cardiac Arrest Care / Targeted Temperature Management',
        'query':   '("targeted temperature management" OR "temperature control" OR "post-cardiac arrest" OR "post-resuscitation care" OR "therapeutic hypothermia") AND (guideline[pt] OR update[ti] OR consensus[ti] OR statement[pt])',
        'reldate': 400,
    },

    # ── ACS / STEMI ───────────────────────────────────────────────────────────
    {
        'id':      'aha_acc_acs',
        'name':    'AHA/ACC Acute Coronary Syndromes / STEMI Guidelines',
        'query':   '("American Heart Association" OR "American College of Cardiology") AND ("acute coronary syndrome" OR STEMI OR "ST-elevation myocardial infarction" OR NSTEMI OR "unstable angina") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },

    # ── Stroke ────────────────────────────────────────────────────────────────
    {
        'id':      'aha_stroke',
        'name':    'AHA/ASA Acute Stroke Guidelines',
        'query':   '("American Heart Association" OR "American Stroke Association") AND ("acute stroke" OR "ischemic stroke" OR "intracerebral hemorrhage" OR tPA OR alteplase OR thrombectomy) AND (guideline[pt] OR update[ti] OR statement[pt])',
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
        print(f'No new guideline publications detected ({date.today()}).')
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'no_change', [])
        pw.save_last_checked(APP_DIR, 'no_change')
        return 0

    lines = [f'{len(findings)} new guideline publication(s) — review for ALS algorithm updates:\n']
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
