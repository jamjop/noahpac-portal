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
    parser.add_argument("--source-version", required=True, help="Versions, publication dates, or access dates examined")
    parser.add_argument("--limitations", default="", help="Known limitations or unresolved questions")
    parser.add_argument("--stage", choices=("primary", "secondary"), default="primary")
    parser.add_argument("--change-reference", default="", help="Deployed commit or release reference")
    parser.add_argument("--decision", required=True, choices=("no-change", "content-updated"), help="Documented clinical review outcome")
    args = parser.parse_args()

    manifest = json.loads((REPO / "clinical-review.json").read_text())
    claim_manifest = json.loads((REPO / "clinical-claims.json").read_text())
    tool = next(item for item in manifest["tools"] if item["id"] == args.topic)
    approved_source_ids = set(tool["source_ids"])
    topic_claims = [item for item in claim_manifest["claims"] if item["tool_id"] == args.topic]
    required_claim_ids = {item["id"] for item in topic_claims}
    if not set(args.source_id).issubset(approved_source_ids):
        parser.error("one or more --source-id values are not approved for this topic")
    if set(args.claim) != required_claim_ids:
        parser.error("--claim must confirm every mapped clinical content area")
    if args.decision == "content-updated" and not args.change_reference:
        parser.error("--change-reference is required when content was updated")

    sources = manifest["sources"]
    source_urls = [sources[source_id]["url"] for source_id in args.source_id]
    destination = REPO / args.topic / "last_checked.json"
    current = json.loads(destination.read_text()) if destination.exists() else {}
    reviewed_at = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    independent_required = any(item["independent_review"] == "required" for item in topic_claims)
    if args.stage == "secondary":
        if not current.get("independent_review_pending"):
            parser.error("no independent review is pending for this topic")
        if current.get("primary_reviewer") == args.reviewer:
            parser.error("secondary reviewer must differ from primary reviewer")
        payload = current | {
            "date": datetime.date.today().isoformat(), "status": "no_change",
            "review_pending": False, "independent_review_pending": False,
            "clinically_reviewed": True, "secondary_reviewer": args.reviewer,
            "secondary_reviewed_at": reviewed_at, "secondary_review_note": args.note,
            "secondary_review_source_ids": args.source_id, "secondary_review_sources": source_urls,
            "secondary_review_claim_ids": args.claim, "secondary_source_versions": args.source_version,
            "secondary_review_limitations": args.limitations,
        }
    else:
        payload = {
            "date": datetime.date.today().isoformat(),
            "status": "review_required" if independent_required else "no_change",
            "review_pending": independent_required, "clinically_reviewed": not independent_required,
            "independent_review_pending": independent_required,
            "reviewer": args.reviewer, "review_note": args.note,
            "review_sources": source_urls, "review_source_ids": args.source_id,
            "review_claim_ids": args.claim, "review_source_versions": args.source_version,
            "review_limitations": args.limitations, "review_decision": args.decision,
            "reviewed_at": reviewed_at, "primary_reviewer": args.reviewer,
            "primary_reviewed_at": reviewed_at,
        }
        if args.change_reference:
            payload["change_reference"] = args.change_reference
    audit_record = {
        "topic": args.topic,
        "reviewer": args.reviewer,
        "decision": args.decision,
        "note": args.note,
        "source_ids": args.source_id,
        "sources": source_urls,
        "claim_ids": args.claim,
        "source_versions": args.source_version,
        "limitations": args.limitations,
        "stage": args.stage,
        "change_reference": args.change_reference,
        "reviewed_at": reviewed_at,
    }
    try:
        AUDIT_LOG.parent.mkdir(parents=True, exist_ok=True)
        with AUDIT_LOG.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(audit_record, sort_keys=True) + "\n")
        AUDIT_LOG.chmod(0o660)
    except PermissionError:
        print(f"Unable to write protected audit log {AUDIT_LOG}; run with sudo.")
        return 1
    destination.write_text(json.dumps(payload, indent=2) + "\n")
    destination.chmod(0o664)
    print(f"Acknowledged clinical review for {args.topic}: {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
