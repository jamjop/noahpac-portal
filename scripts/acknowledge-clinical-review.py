#!/usr/bin/env python3
"""Clear a topic's pending-review state after a human clinical review."""

import argparse
import importlib.util
import os
from pathlib import Path


REPO = Path(__file__).resolve().parent.parent
TOPICS = {
    "abx", "allergy", "als", "antibiogram", "anticoag", "calculators",
    "empiric", "naloxone", "opioids", "pals", "peds", "reportable", "screener", "sepsis",
    "steroids", "sti-guide", "tccc", "toxicology", "triage", "vaccines", "wound",
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
    parser.add_argument("--source-id", required=True, action="append", help="Approved source identifier reviewed; repeat as needed")
    parser.add_argument("--claim", required=True, action="append", help="Mapped clinical claim identifier reviewed; repeat as needed")
    parser.add_argument("--verify-hunk", action="append", default=[], help="Old/new hunk identifier personally verified; repeat for every displayed hunk")
    parser.add_argument("--source-version", required=True, help="Versions, publication dates, or access dates examined")
    parser.add_argument("--limitations", default="", help="Known limitations or unresolved questions")
    parser.add_argument("--stage", choices=("primary", "secondary"), default="primary")
    parser.add_argument("--change-reference", default="", help="Deployed commit or release reference")
    parser.add_argument("--decision", required=True, choices=("no-change", "not-applicable", "content-updated"), help="Documented clinical review outcome")
    args = parser.parse_args()

    spec = importlib.util.spec_from_file_location(
        "noahpac_review_api", REPO / "clinical-review" / "api_server.py"
    )
    api = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(api)
    api.REPO = REPO
    api.MANIFEST = REPO / "clinical-review.json"
    api.CLAIM_MANIFEST = REPO / "clinical-claims.json"
    api.AUDIT_LOG = AUDIT_LOG
    topic = next(item for item in api.dashboard()["topics"] if item["id"] == args.topic)
    payload = {
        "topic": args.topic,
        "reviewer": args.reviewer,
        "decision": args.decision,
        "note": args.note,
        "source_ids": args.source_id,
        "claim_ids": args.claim,
        "event_ids": [event["id"] for event in topic["review_events"]],
        "verified_hunk_ids": args.verify_hunk,
        "source_versions": args.source_version,
        "limitations": args.limitations,
        "review_stage": args.stage,
        "change_reference": args.change_reference,
        "expected_revision": topic["revision"],
        "confirmed": True,
    }
    try:
        result = api.record_review(payload, args.reviewer)
    except (api.ReviewError, PermissionError, OSError) as exc:
        print(f"Unable to record clinical review: {exc}")
        return 1
    print(
        f"Acknowledged clinical review for {args.topic} at {result['reviewed_at']}"
        + ("; independent review remains pending." if result["independent_review_pending"] else ".")
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
