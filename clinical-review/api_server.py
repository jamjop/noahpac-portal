#!/usr/bin/env python3
"""Loopback-only API for authenticated clinical-review acknowledgements."""

from __future__ import annotations

import datetime as dt
import fcntl
import hashlib
import json
import os
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


REPO = Path(os.environ.get("NOAHPAC_REPO", "/var/www/noahpac-portal")).resolve()
MANIFEST = REPO / "clinical-review.json"
AUDIT_LOG = Path(os.environ.get("NOAHPAC_REVIEW_AUDIT_LOG", "/var/lib/noahpac-monitor/review-audit.jsonl"))
LOCK_FILE = Path(os.environ.get("NOAHPAC_REVIEW_LOCK", "/var/lib/noahpac-monitor/review.lock"))
ALLOWED_ORIGIN = os.environ.get("NOAHPAC_REVIEW_ORIGIN", "https://www.noahpac.com")
HOST = os.environ.get("NOAHPAC_REVIEW_HOST", "127.0.0.1")
PORT = int(os.environ.get("NOAHPAC_REVIEW_PORT", "8767"))
MAX_BODY = 16_384
REVIEWER_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.@ -]{0,119}$")
DECISIONS = {"no-change", "content-updated"}


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


def manifest_data() -> tuple[dict, list[dict]]:
    data = load_json(MANIFEST)
    sources = data.get("sources", {})
    tools = [tool for tool in data.get("tools", []) if tool.get("monitor")]
    if not isinstance(sources, dict) or not tools:
        raise ReviewError("Clinical review manifest is unavailable or invalid.")
    return sources, tools


def public_topic(tool: dict, sources: dict) -> dict:
    topic = tool["id"]
    status = load_json(REPO / topic / "last_checked.json")
    source_items = []
    for source_id in tool.get("source_ids", []):
        source = sources.get(source_id)
        if source:
            source_items.append({"id": source_id, "title": source["title"], "url": source["url"]})
    raw_status = status.get("status", "not_checked")
    if status.get("review_pending") or raw_status in {"changed", "held_for_review", "review_required"}:
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
        "revision": revision(status),
        "sources": source_items,
    }


def dashboard() -> dict:
    sources, tools = manifest_data()
    topics = [public_topic(tool, sources) for tool in tools]
    order = {"pending": 0, "error": 1, "not_checked": 2, "current": 3, "reviewed": 4}
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
    if decision == "content-updated" and not (7 <= len(change_reference) <= 160):
        raise ReviewError("Provide the deployed commit or change reference.")

    sources, tools = manifest_data()
    tool = next((item for item in tools if item.get("id") == topic), None)
    if not tool:
        raise ReviewError("Topic is not eligible for portal review.")
    allowed_ids = set(tool.get("source_ids", []))
    if not set(source_ids).issubset(allowed_ids):
        raise ReviewError("One or more sources are not approved for this topic.")
    resolved = [sources[item] | {"id": item} for item in source_ids]
    return {
        "topic": topic, "decision": decision, "note": note,
        "expected_revision": expected_revision, "sources": resolved,
        "change_reference": change_reference, "reviewer": authenticated_user,
    }


def record_review(data: dict, authenticated_user: str) -> dict:
    item = validate_submission(data, authenticated_user)
    LOCK_FILE.parent.mkdir(parents=True, exist_ok=True)
    with LOCK_FILE.open("a+", encoding="utf-8") as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
        destination = REPO / item["topic"] / "last_checked.json"
        current = load_json(destination)
        if revision(current) != item["expected_revision"]:
            raise ReviewError("This topic changed after the page loaded. Reload and review the latest state.")
        now = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
        payload = {
            "date": dt.date.today().isoformat(), "status": "no_change",
            "review_pending": False, "clinically_reviewed": True,
            "reviewer": item["reviewer"], "review_note": item["note"],
            "review_sources": [source["url"] for source in item["sources"]],
            "review_source_ids": [source["id"] for source in item["sources"]],
            "review_decision": item["decision"], "reviewed_at": now,
        }
        if item["change_reference"]:
            payload["change_reference"] = item["change_reference"]
        with destination.open("r+", encoding="utf-8") as handle:
            handle.seek(0)
            handle.write(json.dumps(payload, indent=2) + "\n")
            handle.truncate()
            handle.flush()
            os.fsync(handle.fileno())
        audit = payload | {"topic": item["topic"]}
        with AUDIT_LOG.open("a", encoding="utf-8") as handle:
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
            handle.write(json.dumps(audit, sort_keys=True) + "\n")
            handle.flush()
            os.fsync(handle.fileno())
    return {"ok": True, "topic": item["topic"], "reviewed_at": now}


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
