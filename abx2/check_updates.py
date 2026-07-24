#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for new guideline publications from sources
cited on noahpac.com/abx/. Alerts via Pushover when new papers appear.
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

APP_ID      = 'abx'
APP_DIR      = Path(__file__).resolve().parent
APP_NAME    = 'Antibiotic Reference'
APP_URL     = 'https://noahpac.com/abx/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-abx-monitor/1.0'
ALERT_TITLE = 'ABX Guideline Update Detected'
UPDATE_HINT = 'Update the relevant file in /var/www/noahpac-portal/abx/data/ if regimens changed.'

# Each entry targets one source cited in the abx reference pages (data/*.js).
# reldate: how many past days to search (400 safely covers a quarter + margin).
SEARCHES = [

    # ── Infectious Disease / General ────────────────────────────────────────
    {
        'id':      'idsa_general',
        'name':    'IDSA Practice Guidelines',
        'query':   '"Infectious Diseases Society of America" AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'shea_cdi',
        'name':    'SHEA / CDI Guidelines',
        'query':   '"Society for Healthcare Epidemiology of America" AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'idsa_bone',
        'name':    'IDSA Bone & Joint Guidelines',
        'query':   '"Infectious Diseases Society of America" AND (osteomyelitis OR "prosthetic joint" OR "septic arthritis" OR "bone and joint") AND (guideline[pt] OR update[ti] OR revision[ti])',
        'reldate': 400,
    },
    {
        'id':      'idsa_tick',
        'name':    'IDSA Tick-borne Disease Guidelines (Lyme, Babesia)',
        'query':   '"Infectious Diseases Society of America" AND (Lyme OR babesiosis OR Borrelia OR "tick-borne") AND (guideline[pt] OR update[ti])',
        'reldate': 730,
    },
    {
        'id':      'escmid',
        'name':    'ESCMID / European ID Guidelines',
        'query':   '"European Society of Clinical Microbiology and Infectious Diseases" AND guideline[pt]',
        'reldate': 400,
    },

    # ── Sepsis / Critical Care ──────────────────────────────────────────────
    {
        'id':      'ssc',
        'name':    'Surviving Sepsis Campaign',
        'query':   '"Surviving Sepsis Campaign" AND (guideline OR recommendation OR update)[ti]',
        'reldate': 400,
    },

    # ── Pulmonary / Respiratory ─────────────────────────────────────────────
    {
        'id':      'ats_resp',
        'name':    'ATS/IDSA Respiratory Guidelines (CAP/HAP/COPD)',
        'query':   '("American Thoracic Society" OR "IDSA") AND (pneumonia OR "community-acquired" OR "hospital-acquired" OR "ventilator-associated" OR COPD) AND guideline[pt]',
        'reldate': 400,
    },

    # ── GI / Hepatology ─────────────────────────────────────────────────────
    {
        'id':      'idsa_gi',
        'name':    'IDSA GI / C. diff Guidelines',
        'query':   '"Infectious Diseases Society of America" AND ("Clostridium difficile" OR "Clostridioides difficile" OR "intra-abdominal" OR diarrhea) AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'acg_pylori',
        'name':    'ACG H. pylori Guidelines',
        'query':   '"American College of Gastroenterology" AND "Helicobacter pylori" AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'aga_gi',
        'name':    'AGA Gastrointestinal Guidelines',
        'query':   '"American Gastroenterological Association" AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'aasld_sbp',
        'name':    'AASLD Liver Disease / SBP Guidelines',
        'query':   '"American Association for the Study of Liver Diseases" AND (peritonitis OR cirrhosis OR ascites OR "liver disease") AND (guideline[pt] OR practice guideline[pt])',
        'reldate': 400,
    },
    {
        'id':      'wses_biliary',
        'name':    'WSES / Tokyo Guidelines — Biliary & Intra-abdominal',
        'query':   '("World Society of Emergency Surgery" OR "Tokyo Guidelines") AND (cholangitis OR cholecystitis OR "intra-abdominal" OR peritonitis) AND (guideline[pt] OR update[ti])',
        'reldate': 730,
    },

    # ── GU / STI ────────────────────────────────────────────────────────────
    {
        'id':      'idsa_uti',
        'name':    'IDSA UTI / GU Guidelines',
        'query':   '"Infectious Diseases Society of America" AND ("urinary tract" OR pyelonephritis OR prostatitis) AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'cdc_sti',
        'name':    'CDC STI Treatment Guidelines',
        'query':   '"Centers for Disease Control" AND ("sexually transmitted" OR gonorrhea OR chlamydia OR "pelvic inflammatory" OR vaginosis OR trichomoniasis) AND (guideline[pt] OR recommendation[ti] OR update[ti])',
        'reldate': 400,
    },

    # ── Skin & Soft Tissue ──────────────────────────────────────────────────
    {
        'id':      'idsa_ssti',
        'name':    'IDSA SSTI Guidelines (Cellulitis, Abscess, NF)',
        'query':   '"Infectious Diseases Society of America" AND ("skin and soft tissue" OR cellulitis OR abscess OR "necrotizing fasciitis") AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'iwgdf',
        'name':    'IWGDF Diabetic Foot Guidelines',
        'query':   '"International Working Group on the Diabetic Foot" AND (guideline[pt] OR update[ti] OR recommendation[ti])',
        'reldate': 730,
    },

    # ── ENT ─────────────────────────────────────────────────────────────────
    {
        'id':      'aap_aom',
        'name':    'AAP Otitis Media / Pediatric ENT Guidelines',
        'query':   '"American Academy of Pediatrics" AND ("otitis media" OR rhinosinusitis OR pharyngitis) AND guideline[pt]',
        'reldate': 730,
    },
    {
        'id':      'aaoHNS',
        'name':    'AAO-HNS ENT Guidelines',
        'query':   '"American Academy of Otolaryngology" AND (guideline[pt] OR "clinical practice guideline"[ti])',
        'reldate': 400,
    },
    {
        'id':      'idsa_sinusitis',
        'name':    'IDSA Sinusitis / ENT Guidelines',
        'query':   '"Infectious Diseases Society of America" AND (sinusitis OR pharyngitis OR "upper respiratory") AND guideline[pt]',
        'reldate': 730,
    },

    # ── Cardiac / Endocarditis ──────────────────────────────────────────────
    {
        'id':      'aha_endocarditis',
        'name':    'AHA / ACC Endocarditis & Cardiac Infection Guidelines',
        'query':   '("American Heart Association" OR "American College of Cardiology") AND (endocarditis OR pericarditis OR "infective endocarditis") AND (guideline[pt] OR statement[pt] OR update[ti])',
        'reldate': 400,
    },
    {
        'id':      'esc_cardiac',
        'name':    'ESC Endocarditis / Cardiac Infection Guidelines',
        'query':   '"European Society of Cardiology" AND (endocarditis OR pericarditis) AND (guideline[pt] OR update[ti])',
        'reldate': 400,
    },

    # ── CNS ─────────────────────────────────────────────────────────────────
    {
        'id':      'idsa_cns',
        'name':    'IDSA CNS Infection Guidelines (Meningitis, Brain Abscess, Encephalitis)',
        'query':   '"Infectious Diseases Society of America" AND (meningitis OR encephalitis OR "brain abscess" OR "spinal epidural abscess") AND guideline[pt]',
        'reldate': 730,
    },
    {
        'id':      'escmid_cns',
        'name':    'ESCMID CNS Infection Guidelines',
        'query':   '"European Society of Clinical Microbiology and Infectious Diseases" AND (meningitis OR encephalitis OR "brain abscess") AND (guideline[pt] OR update[ti])',
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

    lines = [f'{len(findings)} new guideline publication(s) — review for abx updates:\n']
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
