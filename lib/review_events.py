"""Durable, claim-scoped evidence packets for clinical review.

Monitors call :func:`create_event` when they detect new evidence. The review
portal reads these files and records a clinician disposition against the exact
event IDs. Automation narrows the review surface; it never decides whether a
clinical recommendation is correct.
"""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import tempfile
from pathlib import Path


REPO = Path(os.environ.get("NOAHPAC_REPO", "/var/www/noahpac-portal")).resolve()
EVENT_DIR = Path(os.environ.get(
    "NOAHPAC_REVIEW_EVENT_DIR", "/var/lib/noahpac-monitor/review-events"
))
MAX_FINDINGS = 50
MAX_TEXT = 12_000


def _load(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default


def _manifests() -> tuple[dict, dict]:
    return (
        _load(REPO / "clinical-review.json", {"sources": {}, "tools": []}),
        _load(REPO / "clinical-claims.json", {"claims": []}),
    )


def _clean(value):
    """Keep event JSON bounded and free of unexpected object types."""
    if value is None or isinstance(value, (bool, int, float)):
        return value
    if isinstance(value, str):
        return value[:MAX_TEXT]
    if isinstance(value, list):
        return [_clean(item) for item in value[:MAX_FINDINGS]]
    if isinstance(value, dict):
        return {str(key)[:100]: _clean(item) for key, item in list(value.items())[:50]}
    return str(value)[:MAX_TEXT]


def _atomic_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(dir=path.parent, prefix=path.name, suffix=".tmp")
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2, sort_keys=True)
            handle.write("\n")
        os.chmod(temporary, 0o660)
        os.replace(temporary, path)
    except Exception:
        Path(temporary).unlink(missing_ok=True)
        raise


def scoped_ids(
    tool_id: str,
    findings: list[dict],
    source_ids: list[str] | None = None,
    claim_ids: list[str] | None = None,
) -> tuple[list[str], list[str], str]:
    """Resolve the smallest defensible claim/source scope for an event."""
    manifest, claim_manifest = _manifests()
    tool = next((item for item in manifest.get("tools", []) if item.get("id") == tool_id), {})
    approved_sources = set(tool.get("source_ids", []))
    tool_claims = [item for item in claim_manifest.get("claims", []) if item.get("tool_id") == tool_id]
    approved_claims = {item.get("id"): item for item in tool_claims}

    explicit_sources = set(source_ids or [])
    explicit_claims = set(claim_ids or [])
    source_urls = {
        str(source.get("url", "")).rstrip("/"): source_id
        for source_id, source in manifest.get("sources", {}).items()
        if source_id in approved_sources
    }
    for finding in findings:
        explicit_sources.update(finding.get("source_ids", []))
        if finding.get("source_id"):
            explicit_sources.add(finding["source_id"])
        explicit_claims.update(finding.get("claim_ids", []))
        if finding.get("claim_id"):
            explicit_claims.add(finding["claim_id"])
        finding_url = str(finding.get("url", "")).rstrip("/")
        if finding_url in source_urls:
            explicit_sources.add(source_urls[finding_url])
    explicit_sources &= approved_sources
    explicit_claims &= set(approved_claims)

    # PubMed findings are scoped to claims explicitly supported by the PubMed
    # surveillance source. This handles broad literature queries without
    # pulling unrelated claims into the review packet.
    if any(finding.get("pmid") for finding in findings) and "pubmed" in approved_sources:
        explicit_sources.add("pubmed")

    if explicit_sources:
        source_claims = {
            claim_id for claim_id, claim in approved_claims.items()
            if explicit_sources.intersection(claim.get("source_ids", []))
        }
        explicit_claims.update(source_claims)

    if not explicit_claims and len(approved_claims) == 1:
        explicit_claims = set(approved_claims)

    evidence_scope = "focused"
    if not explicit_claims:
        explicit_claims = set(approved_claims)
        evidence_scope = "broad"
    if not explicit_sources:
        explicit_sources = {
            source_id
            for claim_id in explicit_claims
            for source_id in approved_claims[claim_id].get("source_ids", [])
            if source_id in approved_sources
        }
        if len(explicit_sources) != 1:
            evidence_scope = "broad"
    return sorted(explicit_sources), sorted(explicit_claims), evidence_scope


def _identity(tool_id: str, trigger_type: str, findings: list[dict], source_ids: list[str]) -> str:
    stable_findings = []
    for finding in findings:
        stable_findings.append({
            key: finding.get(key)
            for key in ("id", "pmid", "url", "title", "detail", "previous_sha256", "current_sha256")
            if finding.get(key) not in (None, "")
        })
    raw = json.dumps({
        "tool_id": tool_id, "trigger_type": trigger_type,
        "source_ids": sorted(source_ids), "findings": stable_findings,
    }, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(raw).hexdigest()[:20]


def create_event(
    tool_id: str,
    trigger_type: str,
    findings: list[dict],
    *,
    title: str | None = None,
    source_ids: list[str] | None = None,
    claim_ids: list[str] | None = None,
    detected_at: str | None = None,
) -> dict:
    """Create or return a deduplicated open review packet."""
    findings = [_clean(item) for item in findings[:MAX_FINDINGS]]
    resolved_sources, resolved_claims, evidence_scope = scoped_ids(
        tool_id, findings, source_ids, claim_ids
    )
    event_id = _identity(tool_id, trigger_type, findings, resolved_sources)
    path = EVENT_DIR / f"{event_id}.json"
    existing = _load(path, {})
    if existing:
        return existing
    now = detected_at or dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    payload = {
        "schema_version": 1,
        "id": event_id,
        "tool_id": tool_id,
        "title": title or "Clinical source change detected",
        "trigger_type": trigger_type,
        "detected_at": now,
        "status": "open",
        "evidence_scope": evidence_scope,
        "source_ids": resolved_sources,
        "claim_ids": resolved_claims,
        "findings": findings,
    }
    _atomic_json(path, payload)
    return payload


def list_events(tool_id: str | None = None, include_resolved: bool = False) -> list[dict]:
    if not EVENT_DIR.exists():
        return []
    events = []
    for path in EVENT_DIR.glob("*.json"):
        event = _load(path, {})
        if not event or (tool_id and event.get("tool_id") != tool_id):
            continue
        if not include_resolved and event.get("status") == "resolved":
            continue
        events.append(event)
    return sorted(events, key=lambda item: (item.get("detected_at", ""), item.get("id", "")))


def update_events(event_ids: list[str], updates: dict) -> None:
    for event_id in event_ids:
        if not isinstance(event_id, str) or not event_id.isalnum():
            raise ValueError("Invalid review event ID")
        path = EVENT_DIR / f"{event_id}.json"
        event = _load(path, {})
        if not event:
            # Synthetic legacy packets are deliberately not persisted.
            if event_id.startswith("legacy"):
                continue
            raise ValueError(f"Review event {event_id} is unavailable")
        _atomic_json(path, event | _clean(updates))
