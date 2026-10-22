#!/usr/bin/env python3
"""Loopback-only API for authenticated clinical-review acknowledgements."""

from __future__ import annotations

import datetime as dt
import fcntl
import hashlib
import json
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


REPO = Path(os.environ.get("NOAHPAC_REPO", "/var/www/noahpac-portal")).resolve()
MANIFEST = REPO / "clinical-review.json"
CLAIM_MANIFEST = REPO / "clinical-claims.json"
EVENT_DIR = Path(os.environ.get("NOAHPAC_REVIEW_EVENT_DIR", "/var/lib/noahpac-monitor/review-events"))
AUDIT_LOG = Path(os.environ.get("NOAHPAC_REVIEW_AUDIT_LOG", "/var/lib/noahpac-monitor/review-audit.jsonl"))
LOCK_FILE = Path(os.environ.get("NOAHPAC_REVIEW_LOCK", "/var/lib/noahpac-monitor/review.lock"))
ALLOWED_ORIGIN = os.environ.get("NOAHPAC_REVIEW_ORIGIN", "https://www.noahpac.com")
HOST = os.environ.get("NOAHPAC_REVIEW_HOST", "127.0.0.1")
PORT = int(os.environ.get("NOAHPAC_REVIEW_PORT", "8767"))
MAX_BODY = 16_384
REVIEWER_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.@ -]{0,119}$")
DECISIONS = {"no-change", "content-updated", "not-applicable"}

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "lib"))
import review_events  # noqa: E402


class ReviewError(ValueError):
    pass


def load_json(path: Path, default=None):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return {} if default is None else default


def revision(payload: dict) -> str:
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(raw).hexdigest()[:16]


def next_review_due(reviewed_at: str | None, cadence: str) -> str | None:
    if not reviewed_at:
        return None
    try:
        reviewed = dt.datetime.fromisoformat(reviewed_at.replace("Z", "+00:00")).date()
    except ValueError:
        return None
    days = {"weekly": 7, "monthly": 31, "quarterly": 92, "annual": 365}.get(cadence)
    return (reviewed + dt.timedelta(days=days)).isoformat() if days else None


def manifest_data() -> tuple[dict, list[dict], dict[str, list[dict]]]:
    data = load_json(MANIFEST)
    claim_data = load_json(CLAIM_MANIFEST)
    sources = data.get("sources", {})
    tools = [
        tool for tool in data.get("tools", [])
        if tool.get("monitor") or tool.get("status") == "review_required"
    ]
    claims_by_tool: dict[str, list[dict]] = {}
    for claim in claim_data.get("claims", []):
        claims_by_tool.setdefault(claim.get("tool_id", ""), []).append(claim)
    if not isinstance(sources, dict) or not tools or not claims_by_tool:
        raise ReviewError("Clinical review manifest is unavailable or invalid.")
    return sources, tools, claims_by_tool


def review_event_module():
    # Tests and alternate deployments may replace REPO/EVENT_DIR at runtime.
    review_events.REPO = REPO
    review_events.EVENT_DIR = EVENT_DIR
    return review_events


def legacy_event(tool: dict, status: dict, claims: list[dict]) -> dict:
    scheduled = status.get("status") not in {"changed", "held_for_review", "review_required"}
    identity = hashlib.sha256(json.dumps({
        "tool": tool["id"], "date": status.get("date"), "status": status.get("status")
    }, sort_keys=True).encode()).hexdigest()[:16]
    return {
        "id": f"legacy{identity}", "tool_id": tool["id"],
        "title": "Scheduled comprehensive review" if scheduled else "Legacy broad detection",
        "trigger_type": "scheduled-review" if scheduled else "legacy-detection",
        "detected_at": status.get("date"), "status": "open", "evidence_scope": "broad",
        "source_ids": sorted(tool.get("source_ids", [])),
        "claim_ids": sorted(claim["id"] for claim in claims),
        "findings": [{"detail": (
            "A comprehensive cadence review is due; compare every mapped content area with its current source."
            if scheduled else
            "This item predates durable evidence packets. The original monitor recorded a change but did not retain the exact finding."
        )}],
    }


def topic_events(tool: dict, status: dict, claims: list[dict], pending: bool) -> list[dict]:
    events = review_event_module().list_events(tool["id"])
    if pending and not events:
        events = [legacy_event(tool, status, claims)]
    return events


def public_event(event: dict) -> dict:
    return {
        key: event.get(key) for key in (
            "id", "title", "trigger_type", "detected_at", "status",
            "evidence_scope", "source_ids", "claim_ids", "findings",
            "implementation_hunks", "implementation_comparison",
            "primary_reviewer", "primary_reviewed_at",
        )
    }


def event_hunk_ids(events: list[dict]) -> set[str]:
    """Return every explicit source or implementation hunk requiring review."""
    identifiers = set()
    for event in events:
        for hunk in event.get("implementation_hunks", []):
            if isinstance(hunk, dict) and isinstance(hunk.get("id"), str):
                identifiers.add(hunk["id"])
        for finding in event.get("findings", []):
            if not isinstance(finding, dict):
                continue
            for hunk in finding.get("diff_hunks", []):
                if isinstance(hunk, dict) and isinstance(hunk.get("id"), str):
                    identifiers.add(hunk["id"])
    return identifiers


def public_topic(tool: dict, sources: dict, claims: list[dict]) -> dict:
    topic = tool["id"]
    status = load_json(REPO / topic / "last_checked.json")
    source_items = []
    for source_id in tool.get("source_ids", []):
        source = sources.get(source_id)
        if source:
            source_items.append({"id": source_id, "title": source["title"], "url": source["url"]})
    raw_status = status.get("status", "not_checked")
    required_after = tool.get("review_required_after")
    status_date = status.get("date", "")
    pending = bool(
        status.get("review_pending")
        or raw_status in {"changed", "held_for_review", "review_required"}
        or (required_after and (not status.get("clinically_reviewed") or status_date < required_after))
    )
    events = topic_events(tool, status, claims, pending)
    target_claim_ids = {claim_id for event in events for claim_id in event.get("claim_ids", [])}
    target_source_ids = {source_id for event in events for source_id in event.get("source_ids", [])}
    if status.get("independent_review_pending"):
        state = "second_review"
    elif pending or events:
        state = "pending"
    elif raw_status == "error":
        state = "error"
    elif status.get("clinically_reviewed"):
        state = "reviewed"
    elif raw_status in {"no_change", "refreshed"}:
        state = "current"
    else:
        state = "not_checked"
    return {
        "id": topic,
        "title": tool["title"],
        "path": tool["path"],
        "risk_tier": tool["risk_tier"],
        "cadence": tool["review_cadence"],
        "state": state,
        "status": raw_status,
        "status_date": status.get("date"),
        "reviewer": status.get("reviewer"),
        "reviewed_at": status.get("reviewed_at"),
        "review_note": status.get("review_note"),
        "review_decision": status.get("review_decision"),
        "independent_review_pending": bool(status.get("independent_review_pending")),
        "primary_reviewer": status.get("primary_reviewer"),
        "primary_reviewed_at": status.get("primary_reviewed_at"),
        "secondary_reviewer": status.get("secondary_reviewer"),
        "secondary_reviewed_at": status.get("secondary_reviewed_at"),
        "next_review_due": next_review_due(status.get("secondary_reviewed_at") or status.get("reviewed_at"), tool["review_cadence"]),
        "revision": revision({"status": status, "events": [public_event(event) for event in events]}),
        "sources": source_items,
        "claims": [{
            "id": claim["id"], "scope": claim["scope"],
            "review_priority": claim["review_priority"],
            "independent_review": claim["independent_review"],
            "source_ids": claim["source_ids"],
        } for claim in claims],
        "review_claim_ids": sorted(target_claim_ids),
        "review_source_ids": sorted(target_source_ids),
        "review_events": [public_event(event) for event in events],
        "review_hunk_ids": sorted(event_hunk_ids(events)),
        "independent_review_required": any(
            claim.get("independent_review") == "required"
            for claim in claims if claim.get("id") in target_claim_ids
        ),
    }


def dashboard() -> dict:
    sources, tools, claims_by_tool = manifest_data()
    topics = [public_topic(tool, sources, claims_by_tool.get(tool["id"], [])) for tool in tools]
    order = {"pending": 0, "second_review": 1, "error": 2, "not_checked": 3, "current": 4, "reviewed": 5}
    topics.sort(key=lambda item: (order.get(item["state"], 9), item["title"].lower()))
    counts = {key: sum(item["state"] == key for item in topics) for key in order}
    return {"topics": topics, "counts": counts, "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")}


def validate_submission(data: dict, authenticated_user: str) -> dict:
    if not REVIEWER_RE.fullmatch(authenticated_user or ""):
        raise ReviewError("Authenticated reviewer identity is missing or invalid.")
    if data.get("confirmed") is not True:
        raise ReviewError("Confirm that the source-to-content review is complete.")
    topic = str(data.get("topic", ""))
    decision = str(data.get("decision", ""))
    note = str(data.get("note", "")).strip()
    expected_revision = str(data.get("expected_revision", ""))
    source_ids = data.get("source_ids")
    claim_ids = data.get("claim_ids")
    event_ids = data.get("event_ids")
    verified_hunk_ids = data.get("verified_hunk_ids", [])
    review_stage = str(data.get("review_stage", "primary"))
    source_versions = str(data.get("source_versions", "")).strip()
    limitations = str(data.get("limitations", "")).strip()
    change_reference = str(data.get("change_reference", "")).strip()
    if decision not in DECISIONS:
        raise ReviewError("Select a valid review decision.")
    if len(note) < 20 or len(note) > 2000:
        raise ReviewError("Review note must be between 20 and 2,000 characters.")
    if not re.fullmatch(r"[0-9a-f]{16}", expected_revision):
        raise ReviewError("Review state revision is missing or invalid; reload the portal.")
    if not isinstance(source_ids, list) or not source_ids or len(source_ids) > 20:
        raise ReviewError("Select at least one authoritative source.")
    if any(not isinstance(item, str) for item in source_ids) or len(set(source_ids)) != len(source_ids):
        raise ReviewError("Source selection is invalid.")
    if not isinstance(claim_ids, list) or not claim_ids or len(claim_ids) > 30:
        raise ReviewError("Confirm each mapped clinical content area reviewed.")
    if any(not isinstance(item, str) for item in claim_ids) or len(set(claim_ids)) != len(claim_ids):
        raise ReviewError("Clinical content-area selection is invalid.")
    if not isinstance(event_ids, list) or not event_ids or len(event_ids) > 50:
        raise ReviewError("Focused review event selection is missing or invalid.")
    if any(not isinstance(item, str) for item in event_ids) or len(set(event_ids)) != len(event_ids):
        raise ReviewError("Focused review event selection is invalid.")
    if not isinstance(verified_hunk_ids, list) or len(verified_hunk_ids) > 200:
        raise ReviewError("Change-hunk verification is invalid.")
    if any(not isinstance(item, str) or not re.fullmatch(r"[0-9a-f]{20}", item) for item in verified_hunk_ids):
        raise ReviewError("Change-hunk verification is invalid.")
    if len(set(verified_hunk_ids)) != len(verified_hunk_ids):
        raise ReviewError("Change-hunk verification is invalid.")
    if review_stage not in {"primary", "secondary"}:
        raise ReviewError("Review stage is invalid.")
    if len(source_versions) < 3 or len(source_versions) > 1000:
        raise ReviewError("Record the source versions or publication dates examined.")
    if len(limitations) > 1000:
        raise ReviewError("Limitations must be 1,000 characters or fewer.")
    if decision == "content-updated" and not (7 <= len(change_reference) <= 160):
        raise ReviewError("Provide the deployed commit or change reference.")

    sources, tools, claims_by_tool = manifest_data()
    tool = next((item for item in tools if item.get("id") == topic), None)
    if not tool:
        raise ReviewError("Topic is not eligible for portal review.")
    allowed_ids = set(tool.get("source_ids", []))
    if not set(source_ids).issubset(allowed_ids):
        raise ReviewError("One or more sources are not approved for this topic.")
    resolved = [sources[item] | {"id": item} for item in source_ids]
    approved_claims = claims_by_tool.get(topic, [])
    approved_claim_ids = {claim["id"] for claim in approved_claims}
    current = load_json(REPO / topic / "last_checked.json")
    required_after = tool.get("review_required_after")
    pending = bool(
        current.get("review_pending")
        or current.get("status") in {"changed", "held_for_review", "review_required"}
        or (required_after and (not current.get("clinically_reviewed") or current.get("date", "") < required_after))
    )
    events = topic_events(tool, current, approved_claims, pending)
    required_event_ids = {event["id"] for event in events}
    required_claim_ids = {claim_id for event in events for claim_id in event.get("claim_ids", [])}
    required_source_ids = {source_id for event in events for source_id in event.get("source_ids", [])}
    required_hunk_ids = event_hunk_ids(events)
    if set(event_ids) != required_event_ids:
        raise ReviewError("The focused review packet changed; reload the portal.")
    if set(claim_ids) != required_claim_ids or not set(claim_ids).issubset(approved_claim_ids):
        raise ReviewError("Confirm every clinical content area in this focused review packet.")
    if required_source_ids and not required_source_ids.issubset(set(source_ids)):
        raise ReviewError("Review every authoritative source identified by this focused packet.")
    if set(verified_hunk_ids) != required_hunk_ids:
        raise ReviewError("Verify every old-versus-new change hunk in this focused packet.")
    targeted_claims = [claim for claim in approved_claims if claim["id"] in required_claim_ids]
    return {
        "topic": topic, "decision": decision, "note": note,
        "expected_revision": expected_revision, "sources": resolved,
        "change_reference": change_reference, "reviewer": authenticated_user,
        "claim_ids": claim_ids, "event_ids": event_ids, "review_stage": review_stage,
        "verified_hunk_ids": verified_hunk_ids,
        "source_versions": source_versions, "limitations": limitations,
        "independent_review_required": any(claim.get("independent_review") == "required" for claim in targeted_claims),
    }


def record_review(data: dict, authenticated_user: str) -> dict:
    item = validate_submission(data, authenticated_user)
    LOCK_FILE.parent.mkdir(parents=True, exist_ok=True)
    with LOCK_FILE.open("a+", encoding="utf-8") as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
        destination = REPO / item["topic"] / "last_checked.json"
        current = load_json(destination)
        sources, tools, claims_by_tool = manifest_data()
        tool = next(entry for entry in tools if entry["id"] == item["topic"])
        required_after = tool.get("review_required_after")
        pending = bool(
            current.get("review_pending")
            or current.get("status") in {"changed", "held_for_review", "review_required"}
            or (required_after and (not current.get("clinically_reviewed") or current.get("date", "") < required_after))
        )
        events = topic_events(tool, current, claims_by_tool[item["topic"]], pending)
        if revision({"status": current, "events": [public_event(event) for event in events]}) != item["expected_revision"]:
            raise ReviewError("This topic changed after the page loaded. Reload and review the latest state.")
        now = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
        if item["review_stage"] == "secondary":
            if not current.get("independent_review_pending"):
                raise ReviewError("No independent review is pending for this topic.")
            if current.get("primary_reviewer") == item["reviewer"]:
                raise ReviewError("Independent review must be completed by a different authenticated reviewer.")
            payload = current | {
                "date": dt.date.today().isoformat(), "status": "no_change",
                "review_pending": False, "independent_review_pending": False,
                "clinically_reviewed": True, "secondary_reviewer": item["reviewer"],
                "secondary_reviewed_at": now, "secondary_review_note": item["note"],
                "secondary_review_source_ids": [source["id"] for source in item["sources"]],
                "secondary_review_claim_ids": item["claim_ids"],
                "secondary_review_event_ids": item["event_ids"],
                "secondary_verified_hunk_ids": item["verified_hunk_ids"],
                "secondary_source_versions": item["source_versions"],
                "secondary_review_limitations": item["limitations"],
            }
        else:
            pending_second = item["independent_review_required"]
            payload = {
                "date": dt.date.today().isoformat(),
                "status": "review_required" if pending_second else "no_change",
                "review_pending": pending_second, "clinically_reviewed": not pending_second,
                "independent_review_pending": pending_second,
                "reviewer": item["reviewer"], "review_note": item["note"],
                "review_sources": [source["url"] for source in item["sources"]],
                "review_source_ids": [source["id"] for source in item["sources"]],
                "review_claim_ids": item["claim_ids"],
                "review_event_ids": item["event_ids"],
                "review_verified_hunk_ids": item["verified_hunk_ids"],
                "review_source_versions": item["source_versions"],
                "review_limitations": item["limitations"],
                "review_decision": item["decision"], "reviewed_at": now,
                "primary_reviewer": item["reviewer"], "primary_reviewed_at": now,
            }
            if item["change_reference"]:
                payload["change_reference"] = item["change_reference"]
        event_updates = {
            "status": "resolved" if item["review_stage"] == "secondary" or not payload.get("independent_review_pending") else "primary_reviewed",
            f"{item['review_stage']}_reviewer": item["reviewer"],
            f"{item['review_stage']}_reviewed_at": now,
            "decision": item["decision"],
            "review_note": item["note"],
            "verified_hunk_ids": item["verified_hunk_ids"],
        }
        try:
            review_event_module().update_events(item["event_ids"], event_updates)
        except ValueError as exc:
            raise ReviewError(str(exc)) from exc
        with destination.open("r+", encoding="utf-8") as handle:
            handle.seek(0)
            handle.write(json.dumps(payload, indent=2) + "\n")
            handle.truncate()
            handle.flush()
            os.fsync(handle.fileno())
        audit = payload | {"topic": item["topic"], "review_stage": item["review_stage"], "event_ids": item["event_ids"]}
        with AUDIT_LOG.open("a", encoding="utf-8") as handle:
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
            handle.write(json.dumps(audit, sort_keys=True) + "\n")
            handle.flush()
            os.fsync(handle.fileno())
    return {"ok": True, "topic": item["topic"], "reviewed_at": now, "independent_review_pending": bool(payload.get("independent_review_pending"))}


class Handler(BaseHTTPRequestHandler):
    server_version = "NoahPACReview/1.0"

    def send_json(self, status: int, payload: dict):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def authenticated_user(self) -> str:
        return self.headers.get("X-Remote-User", "").strip()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            self.send_json(200, {"ok": True})
        elif path == "/api/status":
            user = self.authenticated_user()
            if not user:
                self.send_json(401, {"error": "Authentication required."})
                return
            try:
                self.send_json(200, dashboard() | {"authenticated_user": user})
            except Exception:
                self.send_json(500, {"error": "Unable to load clinical review status."})
        else:
            self.send_json(404, {"error": "Not found."})

    def do_POST(self):
        if urlparse(self.path).path != "/api/reviews":
            self.send_json(404, {"error": "Not found."})
            return
        if self.headers.get("Origin") != ALLOWED_ORIGIN or self.headers.get("X-Requested-With") != "NoahPACReviewPortal":
            self.send_json(403, {"error": "Invalid request origin."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY:
            self.send_json(413, {"error": "Invalid request size."})
            return
        try:
            data = json.loads(self.rfile.read(length))
            result = record_review(data, self.authenticated_user())
            self.send_json(201, result)
        except ReviewError as exc:
            self.send_json(409 if "changed after" in str(exc) else 400, {"error": str(exc)})
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(400, {"error": "Invalid JSON request."})
        except Exception:
            self.send_json(500, {"error": "Unable to record review."})

    def log_message(self, fmt, *args):
        print(f"{self.log_date_time_string()} {self.client_address[0]} {fmt % args}")


if __name__ == "__main__":
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
