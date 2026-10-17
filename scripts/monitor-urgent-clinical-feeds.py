#!/usr/bin/env python3
"""Daily surveillance of official urgent clinical update channels.

This is an alerting layer only. It never changes clinical content. On first
run it records the current feed IDs without alerting; later unseen entries are
reported and the affected tools remain pending until clinician review.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import sys
import tempfile
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

REPO = Path(os.environ.get("NOAHPAC_REPO", "/var/www/noahpac-portal")).resolve()
CONFIG = REPO / "urgent-clinical-feeds.json"
STATE = Path(os.environ.get("NOAHPAC_URGENT_STATE", "/var/lib/noahpac-monitor/urgent-feeds-state.json"))
REPORT = Path(os.environ.get("NOAHPAC_URGENT_REPORT", "/var/lib/noahpac-monitor/urgent-feeds-latest.json"))
USER_AGENT = "NoahPAC-Urgent-Clinical-Monitor/1.0"


def fetch(url: str) -> tuple[bytes, str]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/rss+xml, application/xml, text/html;q=0.8"})
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.read(), response.geturl()


def rss_entries(raw: bytes, base_url: str) -> list[dict]:
    root = ET.fromstring(raw)
    entries = []
    for item in list(root.findall(".//item")) + list(root.findall(".//{*}entry")):
        def value(name: str) -> str:
            node = item.find(name)
            if node is None:
                node = item.find(f"{{*}}{name}")
            if node is None:
                return ""
            return (node.text or node.attrib.get("href") or "").strip()
        title = value("title")
        link = value("link")
        guid = value("guid") or value("id") or link or title
        if guid:
            entries.append({"id": guid, "title": title or "Untitled alert", "url": urllib.parse.urljoin(base_url, link)})
    return entries


def han_entries(raw: bytes, base_url: str) -> list[dict]:
    html = raw.decode("utf-8", errors="replace")
    entries = []
    pattern = re.compile(r'href=["\']([^"\']*(?:han|notice)[^"\']*)["\'][^>]*>(.*?)</a>', re.I | re.S)
    for href, title_html in pattern.findall(html):
        text = re.sub(r"<[^>]+>", " ", title_html)
        title = re.sub(r"\s+", " ", text).strip()
        # Prefer the canonical notice URL. The CDC site index has occasionally
        # displayed link text whose HAN number does not match its href.
        identifier = re.search(r"han(\d{4,})\.html", href, re.I)
        if not identifier:
            identifier = re.search(r"CDCHAN[-– ]?(\d{3,})", title, re.I)
        if not identifier:
            continue
        alert_id = f"CDCHAN-{int(identifier.group(1)):05d}"
        entries.append({"id": alert_id, "title": title or alert_id, "url": urllib.parse.urljoin(base_url, href)})
    unique = {entry["id"]: entry for entry in entries}
    return list(unique.values())


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


def mark_pending(tool_ids: list[str]) -> None:
    sys.path.insert(0, str(REPO / "lib"))
    import pubmed_watcher  # noqa: PLC0415
    for tool_id in tool_ids:
        directory = REPO / tool_id
        if directory.is_dir():
            pubmed_watcher.save_last_checked(directory, "review_required")


def notify(findings: list[dict]) -> None:
    user, token = os.environ.get("PUSHOVER_USER"), os.environ.get("PUSHOVER_TOKEN")
    if not user or not token or not findings:
        return
    sys.path.insert(0, str(REPO / "lib"))
    import pubmed_watcher  # noqa: PLC0415
    lines = [f"{item['channel']}: {item['title']}" for item in findings[:10]]
    pubmed_watcher.push_notify(user, token, "Urgent clinical source review", "\n".join(lines), findings[0]["url"], "Open first alert")


def heartbeat() -> None:
    sys.path.insert(0, str(REPO / "lib"))
    import pubmed_watcher  # noqa: PLC0415
    pubmed_watcher.write_heartbeat("urgent_clinical")


def validate(config: dict) -> list[str]:
    errors = []
    if config.get("schema_version") != 1:
        errors.append("schema_version must be 1")
    channels = config.get("channels", [])
    if not isinstance(channels, list) or not channels:
        errors.append("channels must be a non-empty list")
    for channel in channels:
        if channel.get("type") not in {"rss", "han-index"}:
            errors.append(f"unsupported channel type for {channel.get('id')}")
        if not str(channel.get("url", "")).startswith("https://"):
            errors.append(f"channel {channel.get('id')} requires HTTPS")
        if not channel.get("tool_ids"):
            errors.append(f"channel {channel.get('id')} has no affected tools")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    config = json.loads(CONFIG.read_text())
    errors = validate(config)
    if errors:
        print("\n".join(f"ERROR: {error}" for error in errors), file=sys.stderr)
        return 2
    if args.check:
        print(f"Urgent clinical feed configuration valid: {len(config['channels'])} channels.")
        return 0

    previous = json.loads(STATE.read_text()) if STATE.exists() else {"channels": {}}
    first_run = not STATE.exists()
    next_state = {"updated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"), "channels": {}}
    findings, failures = [], []
    for channel in config["channels"]:
        try:
            raw, final_url = fetch(channel["url"])
            entries = rss_entries(raw, final_url) if channel["type"] == "rss" else han_entries(raw, final_url)
            known = set(previous.get("channels", {}).get(channel["id"], {}).get("seen", []))
            unseen = [] if first_run else [entry for entry in entries if entry["id"] not in known]
            for entry in unseen:
                findings.append(entry | {"channel": channel["title"], "tool_ids": channel["tool_ids"]})
            next_state["channels"][channel["id"]] = {
                "seen": sorted(known | {entry["id"] for entry in entries})[-1000:],
                "entry_count": len(entries), "last_success": next_state["updated_at"],
                "content_sha256": hashlib.sha256(raw).hexdigest(),
            }
        except Exception as exc:  # noqa: BLE001
            failures.append({"channel": channel["id"], "error": str(exc)})
            if channel["id"] in previous.get("channels", {}):
                next_state["channels"][channel["id"]] = previous["channels"][channel["id"]]

    atomic_json(STATE, next_state)
    affected = sorted({tool for finding in findings for tool in finding["tool_ids"]})
    if affected:
        mark_pending(affected)
    notify(findings)
    atomic_json(REPORT, {"checked_at": next_state["updated_at"], "first_run": first_run, "findings": findings, "failures": failures})
    print(f"Urgent clinical surveillance: {len(findings)} new alert(s), {len(failures)} failure(s).")
    if not failures:
        heartbeat()
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
