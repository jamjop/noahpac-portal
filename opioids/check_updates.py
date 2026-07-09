#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for updates to opioid prescribing guidelines
and MME conversion evidence (CDC, FDA, SAMHSA), plus the CDC opioid
prescribing guidance page's own last-published date. Alerts via Pushover.
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

APP_ID      = 'opioids'
APP_DIR      = Path(__file__).resolve().parent
APP_NAME    = 'Opioid Conversion & MME'
APP_URL     = 'https://noahpac.com/opioids/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-opioid-monitor/1.0'
ALERT_TITLE = 'Opioid Guidelines Update'
UPDATE_HINT = 'Review and update /var/www/noahpac-portal/opioids/app.js if MME factors or thresholds changed.'

# Direct fetches to cdc.gov 403 from this host (Akamai bot protection,
# confirmed 2026-07-09) — pw.fetch_page()'s Wayback Machine fallback
# handles that transparently. See lib/pubmed_watcher.py CDC_DATE_PATTERNS.
CDC_OPIOID_URL = 'https://www.cdc.gov/overdose-prevention/hcp/clinical-guidance/index.html'

SEARCHES = [
    {
        'id':      'cdc_opioid_guideline',
        'name':    'CDC Opioid Prescribing Guideline',
        'query':   'CDC AND ("opioid prescribing" OR "opioid guideline") AND (MMWR[ta] OR guideline[pt])',
        'reldate': 400,
    },
    {
        'id':      'mme_conversion',
        'name':    'Opioid MME Conversion Factors',
        'query':   '("morphine milligram equivalent" OR "MME" OR "equianalgesic") AND (opioid OR analgesic) AND (conversion OR factor OR ratio) AND (guideline OR recommendation OR update)[ti]',
        'reldate': 400,
    },
    {
        'id':      'buprenorphine_guidance',
        'name':    'Buprenorphine / OUD Treatment Guidance',
        'query':   '(buprenorphine OR "opioid use disorder") AND (guideline OR recommendation OR practice[ti]) AND (SAMHSA OR FDA OR ASAM OR "addiction medicine")',
        'reldate': 400,
    },
    {
        'id':      'methadone_guidance',
        'name':    'Methadone Dosing / Safety Guidance',
        'query':   'methadone[ti] AND (dosing[tiab] OR QTc[tiab] OR "cardiac safety"[tiab] OR "dose conversion"[tiab]) AND (guideline OR "practice guideline" OR consensus)[pt]',
        'reldate': 400,
    },
    {
        'id':      'opioid_risk_thresholds',
        'name':    'Opioid Risk Thresholds (50/90 MME)',
        'query':   '("90 MME"[tiab] OR "50 MME"[tiab] OR "morphine milligram equivalent"[ti]) AND opioid[tiab] AND (threshold[tiab] OR risk[ti] OR mortality[ti])',
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

    known_version = state.get('cdc_page_date', '')
    print(f"Checking {CDC_OPIOID_URL} …")
    page_result = pw.check_page_source('CDC Opioid Prescribing Guideline page', CDC_OPIOID_URL,
                                        pw.CDC_DATE_PATTERNS, known_version, USER_AGENT)
    print(f"  Page date: {page_result['value'] or '(not found)'}")
    page_changed = bool(page_result['changed'] and not first_run)
    page_error   = page_result['error']
    if page_error:
        print(f"  ERROR: {page_error}", file=sys.stderr)
    elif page_changed:
        print(f"  Date changed: {known_version!r} → {page_result['value']!r}")
    state['cdc_page_date'] = page_result['value']

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
        # Page check is broken but nothing else to report — surface as
        # 'error', not 'no_change', so a blocked/failed fetch isn't hidden.
        msg = f'CDC opioid guideline page check error: {page_error}'
        print(msg)
        pw.push_notify(user, token, ALERT_TITLE, msg, APP_URL, APP_NAME)
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'error', [{'detail': msg}])
        pw.save_last_checked(APP_DIR, 'error')
        print('Notification sent.')
        return 0

    lines = []
    if page_changed:
        lines.append(f"CDC Opioid Prescribing Guideline page date changed: {known_version!r} → {page_result['value']!r}\n")
    if page_error:
        lines.append(f'(Page check error, unrelated to findings below: {page_error})\n')
    if findings:
        lines.append(f'{len(findings)} new guideline publication(s) — review for opioid guideline updates:\n')
        lines.append(pw.format_findings(findings))
    lines.append(UPDATE_HINT)
    message = '\n'.join(lines)

    print(message)
    pw.push_notify(user, token, ALERT_TITLE, message, APP_URL, APP_NAME)
    report_findings = []
    if page_changed:
        report_findings.append({'detail': f"CDC page date changed: {known_version!r} → {page_result['value']!r}"})
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
