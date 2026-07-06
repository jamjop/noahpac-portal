#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for new CoTCCC / TCCC comprehensive guideline
publications, with a secondary page scan of the official allogy.com document.

CoTCCC publishes comprehensive guidelines in J Spec Oper Med. PubMed is the
most reliable signal because CoTCCC may publish new guidelines as a new URL
rather than updating the existing allogy.com document in place.

IMPORTANT: PubMed hits are an AWARENESS signal only. Before updating any app
content, always verify the change against the official CoTCCC guidelines at:
  https://books.allogy.com/web/tenant/8/books/b729b76a-1a34-4bf7-b76b-66bb2072b2a7/
Individual guideline change papers (e.g. GC 25-03) may not be incorporated
into the official document yet — do not update the app based on abstracts alone.

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
APP_DIR      = Path(__file__).resolve().parent
APP_NAME    = 'TCCC / CoTCCC Guidelines'
APP_URL     = 'https://noahpac.com/tccc/'
STATE_FILE  = Path(__file__).resolve().parent / 'known_pmids.json'
USER_AGENT  = 'noahpac-tccc-monitor/1.0'
ALERT_TITLE = 'CoTCCC / TCCC Guideline Update'

ALLOGY_PAGE_URL = 'https://books.allogy.com/web/tenant/8/books/b729b76a-1a34-4bf7-b76b-66bb2072b2a7/'

UPDATE_HINT = (
    'IMPORTANT: verify all changes against the official CoTCCC guidelines at:\n'
    f'  {ALLOGY_PAGE_URL}\n'
    'Do NOT update app content based solely on journal abstracts — '
    'individual guideline change papers may not yet be incorporated into the official document.\n'
    'Also check whether a new guidelines URL has been published (CoTCCC may release '
    'each version as a new document rather than updating the link above).'
)

SEARCHES = [
    {
        'id':      'cotccc_guidelines',
        'name':    'CoTCCC TCCC Guideline Publications (J Spec Oper Med)',
        'query':   '(CoTCCC OR "Committee on Tactical Combat Casualty Care") AND "J Spec Oper Med"[ta] AND (guideline[ti] OR guidelines[ti] OR "TCCC guidelines"[ti])',
        'reldate': 400,
    },
    {
        'id':      'cotccc_broad',
        'name':    'CoTCCC Recommendations (all journals)',
        'query':   '"Committee on Tactical Combat Casualty Care" AND (guideline OR recommendation OR update)[ti]',
        'reldate': 400,
    },
    {
        'id':      'tccc_jsom',
        'name':    'TCCC core protocol changes (J Spec Oper Med)',
        'query':   '"J Spec Oper Med"[ta] AND ("TCCC guideline" OR "MARCH" OR "tourniquet" OR "hemorrhage control")[ti] AND (guideline OR recommendation OR update OR change)[ti]',
        'reldate': 400,
    },
]


def check_page_year(url: str, known_year: str) -> tuple[str, bool]:
    """Scan the allogy.com page for the highest 'YYYY Guidelines' year marker."""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=30) as resp:
            html = resp.read().decode('utf-8', errors='replace')
        years = re.findall(r'\b(20\d{2})\s+(?:TCCC\s+)?(?:Guidelines?|Changes?)\b', html, re.IGNORECASE)
        current_year = max(years) if years else ''
        # Only flag changed if we had a prior baseline (not a first-time key initialisation)
        changed = bool(current_year and known_year and current_year != known_year)
        return current_year, changed
    except Exception as exc:
        print(f'  WARNING: allogy.com page fetch failed: {exc}', file=sys.stderr)
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

    # ── Secondary: allogy.com page year scan ─────────────────────────────────
    print(f'Checking official TCCC guidelines page for new year markers …')
    known_year = state.get('page_year', '')
    current_year, year_changed = check_page_year(ALLOGY_PAGE_URL, known_year)
    print(f'  Most recent guidelines year on page: {current_year or "(not found)"}')
    if year_changed and not first_run:
        msg = f'Official TCCC guidelines page shows new year: {known_year!r} → {current_year!r}'
        alerts.append(msg)
        findings.append({'detail': msg})
    state['page_year'] = current_year

    # ── Primary: PubMed ───────────────────────────────────────────────────────
    state, new_findings = pw.run_searches(SEARCHES, state, first_run, USER_AGENT)
    pw.save_state(STATE_FILE, state)

    if first_run:
        print('First run — initialising state (no alert will be sent).')
        print(f'  Page year: {current_year or "(not found)"}')
        total = sum(len(v) for k, v in state.items() if isinstance(v, list))
        print(f'  PubMed: {total} PMIDs initialised across {len(SEARCHES)} searches.')
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'no_change', [])
        pw.save_last_checked(APP_DIR, 'no_change')
        return 0

    for search_name, m in new_findings:
        alerts.append(f'[{search_name}]\n  {m["title"]}\n  {m["journal"]} — PMID {m["pmid"]}')
        findings.append({'search': search_name, 'title': m['title'],
                         'pmid': m['pmid'], 'journal': m['journal'],
                         'pubdate': m['pubdate']})

    if not alerts:
        print(f'No TCCC guideline changes detected ({date.today()}).')
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, 'no_change', [])
        pw.save_last_checked(APP_DIR, 'no_change')
        return 0

    message = f'{len(new_findings)} new CoTCCC/TCCC publication(s) — review for guideline updates:\n\n'
    message += '\n\n'.join(alerts)
    message += f'\n\n{UPDATE_HINT}'
    print(message)
    pw.push_notify(user, token, ALERT_TITLE, message, ALLOGY_PAGE_URL, 'Official CoTCCC Guidelines')
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
