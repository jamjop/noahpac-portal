#!/usr/bin/env python3
"""Monitor guideline literature that can change empiric-therapy recommendations."""

import os
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(APP_DIR.parent / "lib"))
import pubmed_watcher as pw  # noqa: E402

APP_ID = "empiric"
APP_NAME = "Empiric Therapy"
APP_URL = "https://noahpac.com/empiric/"
STATE_FILE = APP_DIR / ".update_state.json"
USER_AGENT = "noahpac-empiric-monitor/1.0"

SEARCHES = [
    {
        "id": "idsa_empiric_therapy",
        "name": "IDSA empiric antimicrobial guidance",
        "query": '("Infectious Diseases Society of America" OR IDSA) AND (empiric OR empirical) AND (antimicrobial OR antibiotic) AND (guideline[pt] OR update[ti] OR guidance[ti])',
        "reldate": 400,
    },
    {
        "id": "sepsis_empiric_antibiotics",
        "name": "Sepsis empiric antimicrobial guidance",
        "query": '("Surviving Sepsis Campaign" OR sepsis) AND (empiric OR empirical) AND (antimicrobial OR antibiotic) AND (guideline[pt] OR update[ti] OR consensus[ti])',
        "reldate": 400,
    },
    {
        "id": "antibiogram_stewardship",
        "name": "Antibiogram and stewardship guidance",
        "query": '(antibiogram OR "cumulative susceptibility") AND (stewardship OR empiric) AND (guideline OR consensus OR recommendation)',
        "reldate": 400,
    },
]


def main() -> int:
    state = pw.load_state(STATE_FILE)
    first_run = not bool(state)
    state, findings = pw.run_searches(
        SEARCHES, state, first_run, USER_AGENT, suppress_new_search_alerts=True
    )
    pw.save_state(STATE_FILE, state)
    if first_run or not findings:
        pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, "no_change", [])
        pw.save_last_checked(APP_DIR, "no_change")
        print("Empiric-therapy surveillance complete; no new publications detected.")
        return 0

    detail = pw.format_findings(findings)
    result_items = [{"detail": line} for line in detail.splitlines() if line.strip()]
    pw.write_quarterly_result(APP_ID, APP_NAME, APP_URL, "changed", result_items)
    pw.save_last_checked(APP_DIR, "changed")
    user, token = os.environ.get("PUSHOVER_USER"), os.environ.get("PUSHOVER_TOKEN")
    if user and token:
        pw.push_notify(user, token, "Empiric therapy review required", detail, APP_URL, "Open Empiric Therapy")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
