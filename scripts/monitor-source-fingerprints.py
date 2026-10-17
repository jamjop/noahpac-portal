#!/usr/bin/env python3
"""Fingerprint designated stable clinical documents and flag replacements."""

from __future__ import annotations

import argparse
import datetime as dt
import difflib
import hashlib
from html.parser import HTMLParser
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

REPO = Path(os.environ.get("NOAHPAC_REPO", "/var/www/noahpac-portal")).resolve()
MANIFEST = REPO / "clinical-review.json"
CLAIMS = REPO / "clinical-claims.json"
STATE = Path(os.environ.get("NOAHPAC_FINGERPRINT_STATE", "/var/lib/noahpac-monitor/source-fingerprints.json"))
REPORT = Path(os.environ.get("NOAHPAC_FINGERPRINT_REPORT", "/var/lib/noahpac-monitor/source-fingerprints-latest.json"))
SNAPSHOT_DIR = Path(os.environ.get("NOAHPAC_FINGERPRINT_SNAPSHOTS", "/var/lib/noahpac-monitor/source-snapshots"))
USER_AGENT = "NoahPAC-Clinical-Document-Monitor/1.0"


def atomic_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(dir=path.parent, prefix=path.name, suffix=".tmp")
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)
            handle.write("\n")
        os.chmod(temporary, 0o640)
        os.replace(temporary, path)
    except Exception:
        Path(temporary).unlink(missing_ok=True)
        raise


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.hidden = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "noscript", "svg"}:
            self.hidden += 1
        elif not self.hidden and tag in {"p", "li", "h1", "h2", "h3", "h4", "tr", "br"}:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in {"script", "style", "noscript", "svg"} and self.hidden:
            self.hidden -= 1
        elif not self.hidden and tag in {"p", "li", "h1", "h2", "h3", "h4", "tr"}:
            self.parts.append("\n")

    def handle_data(self, data):
        if not self.hidden:
            self.parts.append(data)


def normalized_text(raw: bytes, content_type: str) -> str:
    if content_type == "application/pdf" or raw.startswith(b"%PDF"):
        completed = subprocess.run(
            ["/usr/bin/pdftotext", "-layout", "-", "-"], input=raw,
            capture_output=True, timeout=60, check=False,
        )
        if completed.returncode != 0:
            raise RuntimeError(completed.stderr.decode("utf-8", "replace")[:500])
        text = completed.stdout.decode("utf-8", "replace")
    else:
        parser = TextExtractor()
        parser.feed(raw.decode("utf-8", "replace"))
        text = "".join(parser.parts)
    lines = []
    for line in text.splitlines():
        clean = re.sub(r"\s+", " ", line).strip()
        if clean:
            lines.append(clean)
    return "\n".join(lines)


def text_diff(previous: str, current: str) -> str:
    if not previous or not current:
        return ""
    lines = list(difflib.unified_diff(
        previous.splitlines(), current.splitlines(),
        fromfile="previous source", tofile="current source", n=2, lineterm="",
    ))
    return "\n".join(lines)[:12_000]


def atomic_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(dir=path.parent, prefix=path.name, suffix=".tmp")
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            handle.write(content)
        os.chmod(temporary, 0o640)
        os.replace(temporary, path)
    except Exception:
        Path(temporary).unlink(missing_ok=True)
        raise


def fetch(source: dict) -> tuple[dict, bytes]:
    request = urllib.request.Request(source["url"], headers={"User-Agent": USER_AGENT, "Accept": "application/pdf, text/html;q=0.8"})
    with urllib.request.urlopen(request, timeout=60) as response:
        raw = response.read(50 * 1024 * 1024 + 1)
        if len(raw) > 50 * 1024 * 1024:
            raise ValueError("document exceeds 50 MiB safety limit")
        return ({
            "sha256": hashlib.sha256(raw).hexdigest(),
            "bytes": len(raw),
            "etag": response.headers.get("ETag"),
            "last_modified": response.headers.get("Last-Modified"),
            "content_type": response.headers.get_content_type(),
            "final_url": response.geturl(),
        }, raw)


def affected_tools(source_id: str, claims: dict) -> list[str]:
    return sorted({claim["tool_id"] for claim in claims.get("claims", []) if source_id in claim.get("source_ids", [])})


def mark_pending(tool_ids: list[str]) -> None:
    sys.path.insert(0, str(REPO / "lib"))
    import pubmed_watcher  # noqa: PLC0415
    for tool_id in tool_ids:
        directory = REPO / tool_id
        if directory.is_dir():
            pubmed_watcher.save_last_checked(directory, "review_required")


def notify(changes: list[dict]) -> None:
    user, token = os.environ.get("PUSHOVER_USER"), os.environ.get("PUSHOVER_TOKEN")
    if not changes or not user or not token:
        return
    sys.path.insert(0, str(REPO / "lib"))
    import pubmed_watcher  # noqa: PLC0415
    message = "\n".join(f"{item['title']} changed; review {', '.join(item['tool_ids'])}" for item in changes)
    pubmed_watcher.push_notify(user, token, "Clinical document changed", message, changes[0]["url"], "Open changed source")


def heartbeat() -> None:
    sys.path.insert(0, str(REPO / "lib"))
    import pubmed_watcher  # noqa: PLC0415
    pubmed_watcher.write_heartbeat("source_fingerprints")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    manifest = json.loads(MANIFEST.read_text())
    claims = json.loads(CLAIMS.read_text())
    watched = {source_id: source for source_id, source in manifest.get("sources", {}).items() if source.get("fingerprint") is True}
    if not watched:
        print("No fingerprinted clinical documents configured.", file=sys.stderr)
        return 2
    unmapped = [source_id for source_id in watched if not affected_tools(source_id, claims)]
    if unmapped:
        print(f"Fingerprint sources lack claim mappings: {', '.join(unmapped)}", file=sys.stderr)
        return 2
    if args.check:
        print(f"Clinical document fingerprint configuration valid: {len(watched)} documents.")
        return 0

    previous = json.loads(STATE.read_text()) if STATE.exists() else {"sources": {}}
    first_run = not STATE.exists()
    now = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    next_state = {"updated_at": now, "sources": {}}
    changes, failures = [], []
    for source_id, source in watched.items():
        try:
            fingerprint, raw = fetch(source)
            old = previous.get("sources", {}).get(source_id)
            tool_ids = affected_tools(source_id, claims)
            snapshot_path = SNAPSHOT_DIR / f"{source_id}.txt"
            previous_text = snapshot_path.read_text(encoding="utf-8") if snapshot_path.exists() else ""
            extraction_error = None
            try:
                current_text = normalized_text(raw, fingerprint["content_type"])
            except Exception as exc:  # noqa: BLE001
                current_text = ""
                extraction_error = str(exc)[:500]
            if old and old.get("sha256") != fingerprint["sha256"]:
                changes.append({
                    "id": source_id, "source_id": source_id,
                    "title": source["title"], "url": source["url"], "tool_ids": tool_ids,
                    "previous_sha256": old.get("sha256"), "current_sha256": fingerprint["sha256"],
                    "diff_excerpt": text_diff(previous_text, current_text),
                    "extraction_error": extraction_error,
                })
            next_state["sources"][source_id] = fingerprint | {"checked_at": now, "title": source["title"], "url": source["url"]}
            if current_text:
                atomic_text(snapshot_path, current_text)
        except Exception as exc:  # noqa: BLE001
            failures.append({"id": source_id, "title": source["title"], "error": str(exc)})
            if source_id in previous.get("sources", {}):
                next_state["sources"][source_id] = previous["sources"][source_id]

    atomic_json(STATE, next_state)
    if changes:
        mark_pending(sorted({tool for item in changes for tool in item["tool_ids"]}))
        sys.path.insert(0, str(REPO / "lib"))
        import review_events  # noqa: PLC0415
        for change in changes:
            for tool_id in change["tool_ids"]:
                review_events.create_event(
                    tool_id, "document-fingerprint", [change],
                    title=f"{change['title']}: source document changed",
                    source_ids=[change["source_id"]], detected_at=now,
                )
    notify(changes)
    atomic_json(REPORT, {"checked_at": now, "first_run": first_run, "changes": changes, "failures": failures})
    print(f"Clinical document fingerprints: {len(changes)} change(s), {len(failures)} failure(s).")
    if not failures:
        heartbeat()
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
