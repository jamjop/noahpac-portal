#!/usr/bin/env python3
"""Clear a topic's pending-review state after a human clinical review."""

import argparse
import datetime
import json
from pathlib import Path


REPO = Path(__file__).resolve().parent.parent
TOPICS = {
    "abx", "allergy", "als", "antibiogram", "anticoag", "calculators",
    "naloxone", "opioids", "pals", "peds", "reportable", "sepsis",
    "steroids", "sti-guide", "tccc", "toxicology", "vaccines", "wound",
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Acknowledge completed clinical review")
    parser.add_argument("topic", choices=sorted(TOPICS))
    parser.add_argument("--reviewer", required=True, help="Reviewer name or initials")
    parser.add_argument("--note", required=True, help="Guideline/version or review summary")
    args = parser.parse_args()

    destination = REPO / args.topic / "last_checked.json"
    payload = {
        "date": datetime.date.today().isoformat(),
        "status": "no_change",
        "review_pending": False,
        "clinically_reviewed": True,
        "reviewer": args.reviewer,
        "review_note": args.note,
    }
    destination.write_text(json.dumps(payload, indent=2) + "\n")
    destination.chmod(0o644)
    print(f"Acknowledged clinical review for {args.topic}: {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
