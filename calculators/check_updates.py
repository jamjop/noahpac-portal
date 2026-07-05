#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for new guideline publications from sources
cited on noahpac.com/calculators/. Alerts via Pushover when new papers appear.
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

APP_ID      = 'calculators'
APP_DIR      = Path(__file__).resolve().parent
APP_NAME    = 'Clinical Calculators'
APP_URL     = 'https://noahpac.com/calculators/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-calculators-monitor/1.0'
ALERT_TITLE = 'Calculator Guideline Update Detected'
UPDATE_HINT = 'Update the relevant calculator in /var/www/noahpac-portal/calculators/ if logic changed.'

# Each entry targets one source/guideline body cited in the calculators app.
# reldate: how many past days to search (400 safely covers a quarter + margin).
SEARCHES = [

    # ── Cardiovascular ──────────────────────────────────────────────────────
    {
        'id':      'acc_aha_cholesterol',
        'name':    'ACC/AHA Cholesterol / ASCVD (PCE) Guidelines',
        'query':   '("American College of Cardiology" OR "American Heart Association") AND (cholesterol OR "atherosclerotic cardiovascular" OR "ASCVD" OR "pooled cohort equations") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },
    {
        'id':      'acc_aha_afib',
        'name':    'ACC/AHA/ESC Atrial Fibrillation Guidelines (CHA₂DS₂-VASc)',
        'query':   '("American College of Cardiology" OR "American Heart Association" OR "European Society of Cardiology") AND "atrial fibrillation" AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },
    {
        'id':      'acc_aha_chest_pain',
        'name':    'ACC/AHA Chest Pain Guidelines (HEART Score)',
        'query':   '("American College of Cardiology" OR "American Heart Association") AND ("chest pain" OR "HEART score" OR "acute coronary syndrome" OR "high-sensitivity troponin") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },
    {
        'id':      'acc_aha_periop',
        'name':    'ACC/AHA Perioperative Cardiovascular Guidelines (RCRI)',
        'query':   '("American College of Cardiology" OR "American Heart Association") AND ("perioperative" OR "noncardiac surgery" OR "preoperative cardiac") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },

    # ── VTE ─────────────────────────────────────────────────────────────────
    {
        'id':      'accp_vte',
        'name':    'ACCP / ASH VTE Guidelines (Wells DVT/PE/PERC)',
        'query':   '("American College of Chest Physicians" OR "American Society of Hematology") AND ("venous thromboembolism" OR "deep vein thrombosis" OR "pulmonary embolism") AND (guideline[pt] OR update[ti])',
        'reldate': 400,
    },
    {
        'id':      'esc_pe',
        'name':    'ESC Pulmonary Embolism Guidelines (Wells PE)',
        'query':   '"European Society of Cardiology" AND "pulmonary embolism" AND (guideline[pt] OR update[ti])',
        'reldate': 400,
    },

    # ── Pulmonary ────────────────────────────────────────────────────────────
    {
        'id':      'pneumonia_severity',
        'name':    'ATS/BTS/IDSA Pneumonia Guidelines (CURB-65)',
        'query':   '("American Thoracic Society" OR "British Thoracic Society" OR "Infectious Diseases Society of America") AND ("community-acquired pneumonia" OR "pneumonia severity") AND (guideline[pt] OR update[ti])',
        'reldate': 400,
    },

    # ── Renal ────────────────────────────────────────────────────────────────
    {
        'id':      'kdigo_ckd',
        'name':    'KDIGO CKD Guidelines (eGFR / CKD-EPI / CrCl)',
        'query':   '"Kidney Disease: Improving Global Outcomes" AND ("chronic kidney disease" OR eGFR OR "glomerular filtration" OR "creatinine clearance") AND (guideline[pt] OR update[ti])',
        'reldate': 400,
    },

    # ── Hepatology ───────────────────────────────────────────────────────────
    {
        'id':      'aasld_meld',
        'name':    'AASLD Liver Disease / MELD Guidelines',
        'query':   '"American Association for the Study of Liver Diseases" AND ("MELD" OR "liver transplantation" OR "end-stage liver disease" OR cirrhosis) AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },

    # ── Mental Health ─────────────────────────────────────────────────────────
    {
        'id':      'uspstf_depression',
        'name':    'USPSTF Depression Screening Guidelines (PHQ-9)',
        'query':   '"US Preventive Services Task Force" AND (depression OR "depressive disorder") AND (screening OR guideline OR recommendation)',
        'reldate': 400,
    },
    {
        'id':      'uspstf_anxiety',
        'name':    'USPSTF Anxiety Screening Guidelines (GAD-7)',
        'query':   '"US Preventive Services Task Force" AND (anxiety OR "anxiety disorder") AND (screening OR guideline OR recommendation)',
        'reldate': 400,
    },

    # ── Emergency / Surgical ─────────────────────────────────────────────────
    {
        'id':      'ottawa_rules',
        'name':    'Ottawa Knee / Ankle Rules — Validation & Updates',
        'query':   '("Ottawa knee" OR "Ottawa ankle" OR "Ottawa rules") AND (validation OR update OR derivation)[ti]',
        'reldate': 730,
    },
    {
        'id':      'pecarn',
        'name':    'PECARN Pediatric Head CT Rule — Validation & Updates',
        'query':   'PECARN AND ("head injury" OR "traumatic brain injury" OR "computed tomography") AND (validation OR update OR prospective)[ti]',
        'reldate': 730,
    },
    {
        'id':      'wses_appendicitis',
        'name':    'WSES Appendicitis Guidelines (Alvarado Score)',
        'query':   '("World Society of Emergency Surgery" OR WSES) AND appendicitis AND (guideline[pt] OR update[ti])',
        'reldate': 730,
    },

    # ── Dermatology ──────────────────────────────────────────────────────────
    {
        'id':      'aad_acne',
        'name':    'AAD Acne / Isotretinoin Guidelines (Accutane Dosing)',
        'query':   '"American Academy of Dermatology" AND (acne OR isotretinoin OR "acne vulgaris") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },

    # ── Obstetrics ───────────────────────────────────────────────────────────
    {
        'id':      'acog_dating',
        'name':    'ACOG Gestational Age Dating / EDD Guidelines',
        'query':   '"American College of Obstetricians and Gynecologists" AND ("gestational age" OR "estimated due date" OR "pregnancy dating" OR "last menstrual period" OR "ultrasound dating") AND (guideline[pt] OR bulletin[ti] OR practice[ti] OR opinion[ti])',
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

    lines = [f'{len(findings)} new guideline publication(s) — review for calculator updates:\n']
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
