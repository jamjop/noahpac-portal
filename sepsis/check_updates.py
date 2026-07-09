#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for updates to sepsis guidelines
(Sepsis-3, Surviving Sepsis Campaign, SSC bundles). Alerts via Pushover.
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

APP_ID      = 'sepsis'
APP_DIR      = Path(__file__).resolve().parent
APP_NAME    = 'Sepsis Screening (qSOFA / SOFA)'
APP_URL     = 'https://noahpac.com/sepsis/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-sepsis-monitor/1.0'
ALERT_TITLE = 'Sepsis Guidelines Update'
UPDATE_HINT = 'Review and update /var/www/noahpac-portal/sepsis/app.js if Sepsis-3 criteria or bundle recommendations changed.'

# SSC publishes a new numbered guideline revision every several years (2016,
# 2021, 2026) rather than dating a page — the version year itself is the
# change signal, so we regex for it instead of a "last updated" string.
SCCM_ADULT_URL = 'https://www.sccm.org/survivingsepsiscampaign/guidelines-and-resources/surviving-sepsis-campaign-adult-guidelines'
SCCM_DATE_PATTERNS = [
    r'Guidelines for Management of Sepsis and Septic Shock\s+(\d{4})',
    r'(\d{4})\s+SSC Adult Guidelines Update',
    r'(\d{4})\s+adult guidelines update',
]

SEARCHES = [
    {
        'id':      'surviving_sepsis',
        'name':    'Surviving Sepsis Campaign Guidelines',
        'query':   '"Surviving Sepsis Campaign"[ti]',
        'reldate': 400,
    },
    {
        'id':      'sepsis3_definition',
        'name':    'Sepsis-3 Definition / SOFA Updates',
        'query':   '("Sepsis-3"[ti] OR "sepsis definition"[ti] OR "SOFA score"[ti] OR qSOFA[ti]) AND (guideline OR consensus OR update OR revision OR redefin*)',
        'reldate': 400,
    },
    {
        'id':      'ssc_bundle',
        'name':    'Sepsis Bundle / Hour-1 Bundle',
        'query':   '("sepsis bundle" OR "hour-1 bundle" OR "1-hour bundle") AND (guideline OR recommendation OR outcome OR compliance)',
        'reldate': 400,
    },
    {
        'id':      'septic_shock',
        'name':    'Septic Shock Management Guidelines',
        'query':   '"septic shock"[ti] AND (management[ti] OR treatment[ti] OR resuscitation[ti]) AND (guideline OR "practice guideline" OR consensus)[pt]',
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

    known_version = state.get('sccm_adult_version', '')
    print(f"Checking {SCCM_ADULT_URL} …")
    page_result = pw.check_page_source('SSC Adult Guidelines', SCCM_ADULT_URL,
                                        SCCM_DATE_PATTERNS, known_version, USER_AGENT)
    print(f"  Guideline version: {page_result['value'] or '(not found)'}")
    page_changed = bool(page_result['changed'] and not first_run)
    page_error   = page_result['error']
    if page_error:
        print(f"  ERROR: {page_error}", file=sys.stderr)
    elif page_changed:
        print(f"  Version changed: {known_version!r} → {page_result['value']!r}")
    state['sccm_adult_version'] = page_result['value']

    if first_run:
        print('First run — initialising state (no alert will be sent).')

    state, findings = pw.run_searches(SEARCHES, state, first_run, USER_AGENT)
    pw.save_state(STATE_FILE, state)

    if first_run:
        total = sum(len(v) for v in state.values() if isinstance(v, list))
        print(f'State initialised with {total} PMIDs across {len(SEARCHES)} searches.')
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'no_change', [])
        pw.save_last_checked(APP_DIR, 'no_change')
        return 0

    if not findings and not page_changed and not page_error:
        print(f'No changes detected ({date.today()}).')
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'no_change', [])
        pw.save_last_checked(APP_DIR, 'no_change')
        return 0

    if not findings and not page_changed and page_error:
        # SSC page check is broken but nothing else to report — surface as
        # 'error', not 'no_change', so a blocked fetch isn't hidden.
        msg = f'SSC guideline page check error: {page_error}'
        print(msg)
        pw.push_notify(user, token, ALERT_TITLE, msg, APP_URL, APP_NAME)
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'error', [{'detail': msg}])
        pw.save_last_checked(APP_DIR, 'error')
        print('Notification sent.')
        return 0

    lines = []
    if page_changed:
        lines.append(f"SSC Adult Guidelines version changed: {known_version!r} → {page_result['value']!r}\n")
    if page_error:
        lines.append(f'(Page check error, unrelated to findings below: {page_error})\n')
    if findings:
        lines.append(f'{len(findings)} new guideline publication(s) — review for sepsis guideline updates:\n')
        lines.append(pw.format_findings(findings))
    lines.append(UPDATE_HINT)
    message = '\n'.join(lines)

    print(message)
    pw.push_notify(user, token, ALERT_TITLE, message, APP_URL, APP_NAME)
    report_findings = []
    if page_changed:
        report_findings.append({'detail': f"SSC Adult Guidelines version changed: {known_version!r} → {page_result['value']!r}"})
    if page_error:
        report_findings.append({'detail': f'Page check error: {page_error}'})
    report_findings.extend(
        {'search': name, 'title': m['title'], 'pmid': m['pmid'],
         'journal': m['journal'], 'pubdate': m['pubdate']}
        for name, m in findings
    )
    pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'changed', report_findings)
    pw.save_last_checked(APP_DIR, 'changed')
    print('Notification sent.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
