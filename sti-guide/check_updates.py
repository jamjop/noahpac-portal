#!/usr/bin/env python3
"""
check_updates.py — monitor CDC STI guidelines page for content/date changes
AND PubMed for new guideline publications (CDC STI MMWR, doxy-PEP, gonorrhea
resistance). Alerts via Pushover. Run quarterly via cron (Jan/Apr/Jul/Oct 15).

Usage:
    PUSHOVER_USER=xxx PUSHOVER_TOKEN=yyy ./check_updates.py
"""

import os
import re
import sys
import time
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'lib'))
import pubmed_watcher as pw

APP_ID       = 'sti-guide'
APP_NAME     = 'STI Treatment Guidelines'
APP_URL      = 'https://noahpac.com/sti-guide/'
PAGE_URL     = 'https://www.cdc.gov/std/treatment-guidelines/default.htm'
APP_DIR      = Path(__file__).resolve().parent
PAGE_STATE   = APP_DIR / 'known_state.json'
PMID_STATE   = APP_DIR / 'known_pmids.json'
USER_AGENT   = 'noahpac-sti-guide-monitor/1.0'
ALERT_TITLE  = 'CDC STI Guidelines Update'
UPDATE_HINT  = 'Review and update /var/www/noahpac-portal/sti-guide/app.js if regimens changed.'

GUIDELINE_PATTERNS = [
    r"/std/treatment",
    r"/sti/hcp",
    r"STI-Guidelines",
    r"treatment-guidelines",
    r"\.pdf",
]

SEARCHES = [
    {
        'id':      'cdc_sti_guidelines',
        'name':    'CDC STI Treatment Guidelines (MMWR)',
        'query':   'CDC AND ("sexually transmitted" OR STI OR STD) AND ("treatment guidelines" OR "treatment guide") AND MMWR[ta]',
        'reldate': 400,
    },
    {
        'id':      'doxy_pep',
        'name':    'Doxycycline PEP (STI post-exposure prophylaxis)',
        'query':   '("doxycycline post-exposure"[tiab] OR "doxy-PEP"[tiab] OR "doxycycline PEP"[tiab]) AND (guideline OR "practice guideline" OR consensus OR recommendation)[pt]',
        'reldate': 400,
    },
    {
        'id':      'gonorrhea_resistance',
        'name':    'Gonorrhea Antimicrobial Resistance',
        'query':   'CDC AND gonorrhea AND ("antimicrobial resistance" OR "treatment failure" OR ceftriaxone) AND (guideline OR recommendation OR update)[ti]',
        'reldate': 400,
    },
    {
        'id':      'cdc_sti_updates',
        'name':    'CDC STI / Sexual Health Guidance Updates',
        'query':   '"Centers for Disease Control" AND ("sexually transmitted" OR "sexual health") AND (guideline OR recommendation)[pt]',
        'reldate': 400,
    },
]


def extract_links(html: str) -> set[str]:
    hrefs = re.findall(r'href="([^"]+)"', html, re.IGNORECASE)
    return {h.strip() for h in hrefs
            if any(re.search(p, h, re.IGNORECASE) for p in GUIDELINE_PATTERNS)}


def extract_last_reviewed(html: str) -> str:
    for pat in pw.CDC_DATE_PATTERNS:
        m = re.search(pat, html, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return ''


def main() -> int:
    user  = os.environ.get('PUSHOVER_USER', '').strip()
    token = os.environ.get('PUSHOVER_TOKEN', '').strip()
    if not user or not token:
        print('ERROR: set PUSHOVER_USER and PUSHOVER_TOKEN', file=sys.stderr)
        return 2

    alerts: list[str] = []
    findings: list[dict] = []
    page_error: str | None = None

    # ── Page check ────────────────────────────────────────────────────────────
    print(f"Fetching {PAGE_URL} …")
    try:
        html             = pw.fetch_page(PAGE_URL, USER_AGENT)
        current_links    = extract_links(html)
        current_reviewed = extract_last_reviewed(html)
        print(f"  {len(current_links)} guideline links; last reviewed: {current_reviewed or '(not found)'}")

        page_state     = pw.load_state(PAGE_STATE)
        known_links    = set(page_state.get('links', []))
        known_reviewed = page_state.get('last_reviewed', '')

        new_links    = current_links - known_links
        date_changed = current_reviewed and current_reviewed != known_reviewed

        if date_changed:
            msg = f"'Last Reviewed' changed: {known_reviewed!r} → {current_reviewed!r}"
            alerts.append(msg)
            findings.append({'detail': msg})
        for link in sorted(new_links):
            alerts.append(f"New link: {link}")
            findings.append({'detail': f'New CDC page link: {link}'})

        pw.save_state(PAGE_STATE, {'links': sorted(current_links), 'last_reviewed': current_reviewed})
    except Exception as exc:
        # Do NOT let this fall through silently — a page that failed to load
        # is not the same as a page that hasn't changed. Without an explicit
        # 'error' status, a fetch failure here (e.g. Akamai bot-blocking the
        # host) would previously be indistinguishable from a clean run.
        page_error = f'CDC STI page fetch failed: {exc}'
        print(f"  ERROR fetching page: {exc}", file=sys.stderr)

    # ── PubMed checks ─────────────────────────────────────────────────────────
    pmid_state = pw.load_state(PMID_STATE)
    first_run  = not pmid_state
    if first_run:
        print('First PubMed run — initialising state (no PubMed alert will be sent).')

    pmid_state, new_findings = pw.run_searches(SEARCHES, pmid_state, first_run, USER_AGENT)
    pw.save_state(PMID_STATE, pmid_state)

    if first_run:
        total = sum(len(v) for v in pmid_state.values())
        print(f'PubMed state initialised with {total} PMIDs.')

    for search_name, m in new_findings:
        alerts.append(f"[{search_name}] {m['title']}  PMID {m['pmid']}")
        findings.append({'search': search_name, 'title': m['title'],
                         'pmid': m['pmid'], 'journal': m['journal'],
                         'pubdate': m['pubdate']})

    # ── Report ────────────────────────────────────────────────────────────────
    if not alerts and not page_error:
        print(f'No changes detected ({date.today()}).')
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'no_change', [])
        pw.save_last_checked(APP_DIR, 'no_change')
        return 0

    if not alerts and page_error:
        # Nothing content-wise to report, but the page check itself is
        # broken — surface as 'error' (red) rather than 'no_change' (green).
        print(page_error)
        pw.push_notify(user, token, ALERT_TITLE, page_error, PAGE_URL, 'CDC STI Treatment Guidelines')
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'error', [{'detail': page_error}])
        pw.save_last_checked(APP_DIR, 'error')
        print('Notification sent.')
        return 0

    if page_error:
        alerts.insert(0, f'WARNING: {page_error}')
        findings.insert(0, {'detail': page_error})

    message = 'CDC STI guidelines update detected:\n\n' + '\n'.join(f'• {a}' for a in alerts)
    message += f'\n\n{UPDATE_HINT}'
    print(message)
    pw.push_notify(user, token, ALERT_TITLE, message, PAGE_URL, 'CDC STI Treatment Guidelines')
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
