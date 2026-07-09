#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed/CDC/AAP/ACOG for immunization schedule updates.

Watches:
  ACIP / CDC
  1. MMWR ACIP annual immunization schedule publications
  2. Individual ACIP vaccine recommendations (new vaccines, updated guidance)
  3. CDC vaccine schedule page for "last updated" date changes

  AAP
  4. AAP annual immunization schedule (Pediatrics journal, published Jan alongside ACIP)
  5. AAP Committee on Infectious Diseases (COID) vaccine policy statements
  6. AAP influenza / LAIV guidance updates
  7. AAP immunization resources page for date changes

  ACOG
  8. ACOG immunization committee opinions (Obstetrics & Gynecology journal)
  9. ACOG RSV maternal vaccine / pregnancy immunization guidance
  10. ACOG immunization for women resources page for date changes

The vaccines app supports ACIP, AAP, and ACOG schedule sources. Key differences:
  AAP: HPV from age 9, LAIV preferred ages 2-8, MenB routine 16-23
  ACOG: RSV maternal (Abrysvo 32-36wk), Tdap 27-32wk optimal, HPV deferred in pregnancy

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

APP_ID        = 'vaccines'
APP_NAME      = 'ACIP/AAP/ACOG Vaccine Schedules'
APP_URL       = 'https://noahpac.com/vaccines/'
APP_DIR       = Path(__file__).resolve().parent
STATE_FILE    = APP_DIR / 'known_pmids.json'
USER_AGENT    = 'noahpac-vaccines-monitor/1.0'
ALERT_TITLE   = 'ACIP/AAP/ACOG Vaccine Schedule Update'
CDC_SCHED_URL = 'https://www.cdc.gov/vaccines/schedules/'
AAP_SCHED_URL = 'https://www.aap.org/en/patient-care/immunizations/immunization-schedule-and-resources/'
ACOG_IMMU_URL = 'https://www.acog.org/womens-health/immunization-for-women'

SEARCHES = [
    # ── ACIP / CDC ──
    {
        'id':      'acip_schedule',
        'name':    'ACIP Annual Immunization Schedule (MMWR)',
        'query':   'ACIP AND "immunization schedule" AND MMWR[ta]',
        'reldate': 400,
    },
    {
        'id':      'acip_recommendations',
        'name':    'ACIP New Vaccine Recommendations (MMWR)',
        'query':   'ACIP AND ("recommendations" OR "recommendation") AND MMWR[ta] AND (vaccine OR vaccination OR immunization)[ti]',
        'reldate': 400,
    },
    {
        'id':      'cdc_vaccine_guidance',
        'name':    'CDC Vaccine Guidance Updates',
        'query':   '"Advisory Committee on Immunization Practices" AND guideline[pt]',
        'reldate': 400,
    },
    # ── AAP ──
    {
        'id':      'aap_schedule',
        'name':    'AAP Annual Immunization Schedule (Pediatrics)',
        'query':   '"immunization schedule" AND Pediatrics[ta] AND ("American Academy of Pediatrics" OR "Committee on Infectious Diseases")',
        'reldate': 400,
    },
    {
        'id':      'aap_coid',
        'name':    'AAP COID Vaccine Policy Statements (Pediatrics)',
        'query':   '"Committee on Infectious Diseases" AND Pediatrics[ta] AND (vaccine[ti] OR vaccination[ti] OR immunization[ti] OR immunoprophylaxis[ti])',
        'reldate': 400,
    },
    {
        'id':      'aap_influenza',
        'name':    'AAP Influenza / LAIV Guidance (Pediatrics)',
        'query':   '"American Academy of Pediatrics" AND (influenza[ti] OR "live attenuated influenza"[ti]) AND Pediatrics[ta]',
        'reldate': 400,
    },
    # ── ACOG ──
    {
        'id':      'acog_immunization',
        'name':    'ACOG Immunization in Pregnancy Committee Opinions (Obstetrics & Gynecology)',
        'query':   '"American College of Obstetricians and Gynecologists" AND (immunization[ti] OR vaccination[ti] OR vaccine[ti]) AND "Obstetrics and gynecology"[ta]',
        'reldate': 400,
    },
    {
        'id':      'acog_rsv_pregnancy',
        'name':    'ACOG RSV / Maternal Vaccine Guidance',
        'query':   '"respiratory syncytial virus"[ti] AND (pregnancy[ti] OR maternal[ti]) AND vaccin*[ti] AND (ACOG[tiab] OR "American College of Obstetricians"[tiab] OR ACIP[tiab] OR CDC[tiab] OR guideline[tiab] OR recommendation[tiab])',
        'reldate': 400,
    },
]

PAGE_SOURCES = [
    {
        'id':   'cdc_page_date',
        'name': 'CDC Vaccine Schedules page',
        'url':  CDC_SCHED_URL,
        'date_patterns': pw.CDC_DATE_PATTERNS,
    },
    {
        'id':   'aap_page_date',
        'name': 'AAP Immunization Schedule page',
        'url':  AAP_SCHED_URL,
        'date_patterns': [
            r'(?:updated?|reviewed?|published?)[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})',
            r'(20\d{2}-\d{2}-\d{2})',
            r'((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})',
        ],
    },
    {
        'id':   'acog_page_date',
        'name': 'ACOG Immunization for Women page',
        'url':  ACOG_IMMU_URL,
        'date_patterns': [
            r'(?:updated?|reviewed?|published?)[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})',
            r'(20\d{2}-\d{2}-\d{2})',
            r'((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})',
        ],
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

    page_changed = False
    page_notes: list[str] = []
    page_errors: list[str] = []

    for page_cfg in PAGE_SOURCES:
        known = state.get(page_cfg['id'], '')
        print(f"Checking {page_cfg['name']} …")
        result = pw.check_page_source(page_cfg['name'], page_cfg['url'],
                                       page_cfg['date_patterns'], known, USER_AGENT)
        current = result['value']
        print(f"  Page date: {current or '(not found)'}")
        if result['error']:
            print(f"  ERROR: {result['error']}", file=sys.stderr)
            page_errors.append(result['error'])
        elif result['changed'] and not first_run:
            page_changed = True
            note = f"{page_cfg['name']} date → {current}"
            page_notes.append(note)
            print(f"  Date changed: {known!r} → {current!r}")
        state[page_cfg['id']] = current

    state, new_findings = pw.run_searches(SEARCHES, state, first_run, USER_AGENT)
    pw.save_state(STATE_FILE, state)

    if first_run:
        total = sum(len(v) for k, v in state.items() if isinstance(v, list))
        print(f'State initialised with {total} PMIDs.')
        print('No notification sent on first run.')
        return 0

    if not new_findings and not page_changed and not page_errors:
        print(f'No ACIP/AAP vaccine schedule changes detected ({date.today()}).')
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'no_change', [])
        pw.save_last_checked(APP_DIR, 'no_change')
        return 0

    if not new_findings and not page_changed and page_errors:
        # Nothing content-wise to report, but one or more page checks are
        # broken (e.g. blocked fetch) — surface as 'error', not 'no_change'.
        msg = 'Page check error(s):\n' + '\n'.join(f'• {e}' for e in page_errors)
        print(msg)
        pw.push_notify(user, token, ALERT_TITLE, msg, APP_URL, APP_NAME)
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'error',
                                   [{'detail': e} for e in page_errors])
        pw.save_last_checked(APP_DIR, 'error')
        print('Notification sent.')
        return 0

    lines = []
    for note in page_notes:
        lines.append(note)
    if page_notes:
        lines.append('')
    if page_errors:
        lines.append('Page check error(s) (unrelated to findings below):')
        for e in page_errors:
            lines.append(f'• {e}')
        lines.append('')
    if new_findings:
        lines.append(f'{len(new_findings)} new publication(s):\n')
        lines.append(pw.format_findings(new_findings))

    lines.append('Review vaccines/app.js VACCINES array and aap:{}/acog:{} overrides.')
    lines.append('Update footer in vaccines/index.html if a new annual schedule was published.')
    message = '\n'.join(lines)

    print(message)
    pw.push_notify(user, token, ALERT_TITLE, message, APP_URL, APP_NAME)
    findings = [{'detail': n} for n in page_notes]
    findings.extend({'detail': f'Page check error: {e}'} for e in page_errors)
    findings.extend(
        {'search': name, 'title': m['title'], 'pmid': m['pmid'],
         'journal': m['journal'], 'pubdate': m['pubdate']}
        for name, m in new_findings
    )
    pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'changed', findings)
    pw.save_last_checked(APP_DIR, 'changed')
    print('Notification sent.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
