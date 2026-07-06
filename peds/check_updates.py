#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for new guideline publications from sources
cited on noahpac.com/peds/. Alerts via Pushover when new papers appear.
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

APP_ID      = 'peds'
APP_DIR      = Path(__file__).resolve().parent
APP_NAME    = 'Pediatric Dosing'
APP_URL     = 'https://noahpac.com/peds/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-peds-monitor/1.0'
ALERT_TITLE = 'Peds Dosing Guideline Update Detected'
UPDATE_HINT = 'Update doses in /var/www/noahpac-portal/peds/app.js if regimens changed.'

# PALS (AHA) guidelines update on a ~5-year ILCOR cycle; AAP antibiotic
# recommendations, seizure protocols, and vancomycin monitoring guidance
# change more frequently. reldate=400 covers a quarter with margin;
# reldate=730 used for slowly-updating bodies to avoid missing anything.
SEARCHES = [

    # ── Resuscitation / PALS ─────────────────────────────────────────────────
    {
        'id':      'aha_pals',
        'name':    'AHA Pediatric Advanced Life Support (PALS) Guidelines',
        'query':   '"American Heart Association" AND ("pediatric advanced life support" OR PALS OR "pediatric resuscitation" OR "pediatric cardiac arrest") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 730,
    },
    {
        'id':      'ilcor_peds',
        'name':    'ILCOR Pediatric Resuscitation — Consensus on Science',
        'query':   '(ILCOR OR "International Liaison Committee on Resuscitation") AND (pediatric OR paediatric) AND (resuscitation OR "cardiac arrest" OR "life support") AND (consensus[ti] OR update[ti] OR statement[pt])',
        'reldate': 730,
    },

    # ── Antibiotics / Pediatric Infections ───────────────────────────────────
    {
        'id':      'aap_antibiotics',
        'name':    'AAP Pediatric Antibiotic / Infectious Disease Guidelines',
        'query':   '"American Academy of Pediatrics" AND (antibiotic OR antimicrobial OR "otitis media" OR "community-acquired pneumonia" OR "urinary tract infection") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },
    {
        'id':      'idsa_peds_infections',
        'name':    'IDSA Pediatric Infection Guidelines',
        'query':   '"Infectious Diseases Society of America" AND (pediatric OR paediatric OR children) AND (guideline[pt] OR update[ti])',
        'reldate': 400,
    },

    # ── Seizures / Status Epilepticus ─────────────────────────────────────────
    {
        'id':      'aes_status_epilepticus',
        'name':    'AES / PECARN Status Epilepticus Guidelines',
        'query':   '("American Epilepsy Society" OR "Pediatric Emergency Care Applied Research Network") AND ("status epilepticus" OR seizure) AND (guideline[pt] OR update[ti] OR protocol[ti] OR consensus[ti])',
        'reldate': 730,
    },

    # ── Vancomycin Monitoring ─────────────────────────────────────────────────
    {
        'id':      'vancomycin_monitoring',
        'name':    'ASHP/ACCP/IDSA Vancomycin Therapeutic Monitoring',
        'query':   '("American Society of Health-System Pharmacists" OR "Infectious Diseases Society of America" OR "Society of Infectious Diseases Pharmacists") AND vancomycin AND (AUC OR "therapeutic monitoring" OR "pharmacokinetic" OR dosing) AND (guideline[pt] OR update[ti] OR consensus[ti])',
        'reldate': 730,
    },

    # ── Procedural Sedation / RSI ─────────────────────────────────────────────
    {
        'id':      'acep_aap_sedation',
        'name':    'ACEP / AAP Pediatric Procedural Sedation Guidelines',
        'query':   '("American College of Emergency Physicians" OR "American Academy of Pediatrics" OR "Society for Academic Emergency Medicine") AND ("procedural sedation" OR "ketamine" OR "propofol" OR "rapid sequence intubation") AND pediatric AND (guideline[pt] OR update[ti] OR statement[pt])',
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

    lines = [f'{len(findings)} new guideline publication(s) — review for peds dosing updates:\n']
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
