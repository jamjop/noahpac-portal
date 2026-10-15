#!/usr/bin/env python3
"""Monitor literature relevant to adult clinical triage and escalation."""

import os
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'lib'))
import pubmed_watcher as pw

APP_ID='triage'
APP_DIR=Path(__file__).resolve().parent
APP_NAME='Adult Urgency & Disposition'
APP_URL='https://noahpac.com/triage/'
STATE_FILE=APP_DIR/'known_pmids.json'
USER_AGENT='noahpac-triage-monitor/1.0'
ALERT_TITLE='Triage Guidance Update'
UPDATE_HINT='Review /var/www/noahpac-portal/triage/ against current validated triage, deterioration, and emergency warning-sign guidance.'

SEARCHES=[
  {'id':'adult_triage','name':'Adult acute-care triage validation','query':'("triage"[ti] OR "Emergency Severity Index"[ti]) AND (adult OR emergency) AND (guideline OR validation OR consensus)','reldate':400},
  {'id':'early_warning','name':'Adult early-warning and deterioration guidance','query':'(NEWS2[ti] OR "National Early Warning Score"[ti]) AND (guideline OR validation OR update OR deterioration)','reldate':400},
]

def main():
  user=os.environ.get('PUSHOVER_USER','').strip(); token=os.environ.get('PUSHOVER_TOKEN','').strip()
  if not user or not token:
    print('ERROR: set PUSHOVER_USER and PUSHOVER_TOKEN',file=sys.stderr); return 2
  state=pw.load_state(STATE_FILE); first_run=not state
  state,findings=pw.run_searches(SEARCHES,state,first_run,USER_AGENT); pw.save_state(STATE_FILE,state)
  if first_run:
    pw.write_quarterly_result(APP_ID,APP_NAME,APP_URL,'no_change',[]); pw.save_last_checked(APP_DIR,'no_change')
    print('First run — monitoring state initialized.'); return 0
  if not findings:
    pw.write_quarterly_result(APP_ID,APP_NAME,APP_URL,'no_change',[]); pw.save_last_checked(APP_DIR,'no_change')
    print(f'No changes detected ({date.today()}).'); return 0
  lines=[f"{item['search_name']}: {item['title']} (PMID {item['pmid']})" for item in findings]
  message='\n'.join(lines+[UPDATE_HINT]); pw.push_notify(user,token,ALERT_TITLE,message,APP_URL,APP_NAME)
  pw.write_quarterly_result(APP_ID,APP_NAME,APP_URL,'changed',[{'detail':line} for line in lines]); pw.save_last_checked(APP_DIR,'changed')
  print('Notification sent.'); return 0

if __name__=='__main__': raise SystemExit(main())
