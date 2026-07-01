#!/usr/bin/env python3
"""
check_updates.py — monitor the official CoTCCC TCCC guidelines document
(books.allogy.com) for updates, with a secondary PubMed signal for new
comprehensive guideline publications in J Spec Oper Med.

Primary source: official CoTCCC guidelines PDF at allogy.com — monitors
HTTP ETag/Last-Modified headers and page content for new "20XX Guidelines"
sections. This is the authoritative source for the TCCC app; app content
should ONLY be updated based on this document, not individual journal papers.

Secondary (informational only): PubMed search for comprehensive TCCC guideline
publications in J Spec Oper Med — alerts for awareness, but content changes
require verification against the official document at allogy.com first.

Run quarterly via cron (Jan/Apr/Jul/Oct 15).

Usage:
    PUSHOVER_USER=xxx PUSHOVER_TOKEN=yyy ./check_updates.py
"""

import os
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'lib'))
import pubmed_watcher as pw

APP_ID      = 'tccc'
APP_NAME    = 'TCCC / CoTCCC Guidelines'
APP_URL     = 'https://noahpac.com/tccc/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-tccc-monitor/1.0'
ALERT_TITLE = 'CoTCCC / TCCC Guideline Update'

# Official CoTCCC guidelines — primary source
ALLOGY_PAGE_URL = 'https://books.allogy.com/web/tenant/8/books/b729b76a-1a34-4bf7-b76b-66bb2072b2a7/'
ALLOGY_PDF_URL  = 'https://learning-media.allogy.com:443/api/v1/pdf/72649259-ae73-4a95-a82f-eac339f5256a/contents'

UPDATE_HINT = (
    'IMPORTANT: verify all changes against the official CoTCCC guidelines at:\n'
    f'  {ALLOGY_PAGE_URL}\n'
    'Do NOT update app content based solely on journal abstracts — '
    'individual guideline change papers may not yet be incorporated into the official document.'
)

# Secondary signal — comprehensive guideline publications only (not individual GC papers)
SEARCHES = [
    {
        'id':      'cotccc_guidelines',
        'name':    'CoTCCC TCCC Guideline Publications (J Spec Oper Med)',
        'query':   '(CoTCCC OR "Committee on Tactical Combat Casualty Care") AND "J Spec Oper Med"[ta] AND (guideline[ti] OR guidelines[ti] OR "TCCC guidelines"[ti])',
        'reldate': 400,
    },
]


def check_pdf_headers(url: str, known_etag: str, known_modified: str) -> tuple[str, str, bool]:
    """GET the first byte of the PDF to read response headers — returns (etag, last_modified, changed)."""
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': USER_AGENT,
            'Range': 'bytes=0-0',
        })
        with urllib.request.urlopen(req, timeout=20) as resp:
            etag     = resp.headers.get('ETag', '').strip()
            modified = resp.headers.get('Last-Modified', '').strip()
        # Only flag as changed if we had a prior baseline AND something changed
        changed = bool(known_etag or known_modified) and bool(
            (etag     and etag     != known_etag)     or
            (modified and modified != known_modified)
        )
        return etag, modified, changed
    except Exception as exc:
        print(f'  WARNING: PDF header check failed: {exc}', file=sys.stderr)
        return known_etag, known_modified, False


def check_page_content(url: str, known_year: str) -> tuple[str, bool]:
    """Fetch page, look for the highest 'YYYY Guidelines' / 'YYYY Changes' year."""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=30) as resp:
            html = resp.read().decode('utf-8', errors='replace')
        years = re.findall(r'\b(20\d{2})\s+(?:TCCC\s+)?(?:Guidelines?|Changes?)\b', html, re.IGNORECASE)
        current_year = max(years) if years else ''
        changed = bool(current_year and current_year != known_year)
        return current_year, changed
    except Exception as exc:
        print(f'  WARNING: page fetch failed: {exc}', file=sys.stderr)
        return known_year, False


def main() -> int:
    user  = os.environ.get('PUSHOVER_USER', '').strip()
    token = os.environ.get('PUSHOVER_TOKEN', '').strip()
    if not user or not token:
        print('ERROR: set PUSHOVER_USER and PUSHOVER_TOKEN', file=sys.stderr)
        return 2

    state     = pw.load_state(STATE_FILE)
    first_run = not state

    alerts:   list[str]  = []
    findings: list[dict] = []

    # ── Primary: official document checks ────────────────────────────────────
    print(f'Checking official TCCC guidelines PDF headers ({ALLOGY_PDF_URL}) …')
    known_etag     = state.get('pdf_etag', '')
    known_modified = state.get('pdf_modified', '')
    etag, modified, pdf_changed = check_pdf_headers(ALLOGY_PDF_URL, known_etag, known_modified)
    print(f'  ETag: {etag or "(none)"}  Last-Modified: {modified or "(none)"}')
    if pdf_changed and not first_run:
        msg = f'Official TCCC guidelines PDF updated (ETag or Last-Modified changed)'
        alerts.append(msg)
        findings.append({'detail': msg})
        print(f'  CHANGED: ETag {known_etag!r} → {etag!r}  Modified {known_modified!r} → {modified!r}')
    state['pdf_etag']     = etag
    state['pdf_modified'] = modified

    print(f'Checking official TCCC guidelines page for new year markers ({ALLOGY_PAGE_URL}) …')
    known_year = state.get('page_year', '')
    current_year, year_changed = check_page_content(ALLOGY_PAGE_URL, known_year)
    print(f'  Most recent guidelines year on page: {current_year or "(not found)"}')
    # Only alert if we had a prior baseline year (not a first-time key initialisation)
    if year_changed and known_year and not first_run:
        msg = f'Official TCCC guidelines page shows new year: {known_year!r} → {current_year!r}'
        alerts.append(msg)
        findings.append({'detail': msg})
    state['page_year'] = current_year

    # ── Secondary: PubMed (informational signal only) ────────────────────────
    state, new_findings = pw.run_searches(SEARCHES, state, first_run, USER_AGENT)
    pw.save_state(STATE_FILE, state)

    if first_run:
        print('First run — initialising state (no alert will be sent).')
        print(f'  PDF ETag: {etag or "(none)"}  Last-Modified: {modified or "(none)"}')
        print(f'  Page year: {current_year or "(not found)"}')
        total = sum(len(v) for k, v in state.items() if isinstance(v, list))
        print(f'  PubMed: {total} PMIDs initialised.')
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'no_change', [])
        return 0

    for search_name, m in new_findings:
        msg = f'[PubMed — informational] {m["title"]}  PMID {m["pmid"]}'
        alerts.append(msg)
        findings.append({'search': search_name, 'title': m['title'],
                         'pmid': m['pmid'], 'journal': m['journal'],
                         'pubdate': m['pubdate']})

    if not alerts:
        print(f'No TCCC guideline changes detected ({date.today()}).')
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'no_change', [])
        return 0

    message = 'TCCC guideline update detected:\n\n' + '\n'.join(f'• {a}' for a in alerts)
    message += f'\n\n{UPDATE_HINT}'
    print(message)
    pw.push_notify(user, token, ALERT_TITLE, message, ALLOGY_PAGE_URL, 'Official CoTCCC Guidelines')
    pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'changed', findings)
    print('Notification sent.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
