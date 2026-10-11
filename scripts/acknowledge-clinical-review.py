#!/usr/bin/env python3
"""Clear a topic's pending-review state after a human clinical review."""

import argparse
import datetime
import json
import os
from pathlib import Path


REPO = Path(__file__).resolve().parent.parent
TOPICS = {
    "abx", "allergy", "als", "antibiogram", "anticoag", "calculators",
    "naloxone", "opioids", "pals", "peds", "reportable", "sepsis",
    "steroids", "sti-guide", "tccc", "toxicology", "vaccines", "wound",
}
AUDIT_LOG = Path(os.environ.get(
    "NOAHPAC_REVIEW_AUDIT_LOG",
    "/var/lib/noahpac-monitor/review-audit.jsonl",
))


def main() -> int:
    parser = argparse.ArgumentParser(description="Acknowledge completed clinical review")
    parser.add_argument("topic", choices=sorted(TOPICS))
    parser.add_argument("--reviewer", required=True, help="Reviewer name or initials")
    parser.add_argument("--note", required=True, help="Guideline/version or review summary")
    parser.add_argument("--source", required=True, action="append", help="Authoritative URL or source/version reviewed; repeat as needed")
    parser.add_argument("--decision", required=True, choices=("no-change", "content-updated"), help="Documented clinical review outcome")
    args = parser.parse_args()

    destination = REPO / args.topic / "last_checked.json"
    reviewed_at = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    payload = {
        "date": datetime.date.today().isoformat(),
        "status": "no_change",
        "review_pending": False,
        "clinically_reviewed": True,
        "reviewer": args.reviewer,
        "review_note": args.note,
        "review_sources": args.source,
        "review_decision": args.decision,
        "reviewed_at": reviewed_at,
    }
    audit_record = {
        "topic": args.topic,
        "reviewer": args.reviewer,
        "decision": args.decision,
        "note": args.note,
        "sources": args.source,
        "reviewed_at": reviewed_at,
    }
    try:
        AUDIT_LOG.parent.mkdir(parents=True, exist_ok=True)
        with AUDIT_LOG.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(audit_record, sort_keys=True) + "\n")
        AUDIT_LOG.chmod(0o600)
    except PermissionError:
        print(f"Unable to write protected audit log {AUDIT_LOG}; run with sudo.")
        return 1
    destination.write_text(json.dumps(payload, indent=2) + "\n")
    destination.chmod(0o644)
    print(f"Acknowledged clinical review for {args.topic}: {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
