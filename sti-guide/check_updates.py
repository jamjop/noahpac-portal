#!/usr/bin/env python3
"""
check_updates.py — monitor CDC STI treatment guidelines page for updates.

Fetches the CDC guidelines page, extracts all hrefs to documents/PDFs/
guideline sections, and compares against the known state. Also checks for
the page's "Last Reviewed" date changing. Run quarterly via cron.

Usage:
    PUSHOVER_USER=xxx PUSHOVER_TOKEN=yyy ./check_updates.py
"""

import json
import os
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

PAGE_URL     = "https://www.cdc.gov/std/treatment-guidelines/default.htm"
PUSHOVER_API = "https://api.pushover.net/1/messages.json"
STATE_FILE   = Path(__file__).resolve().parent / "known_state.json"

# Patterns that indicate a guideline document link
GUIDELINE_PATTERNS = [
    r"/std/treatment",
    r"/sti/hcp",
    r"STI-Guidelines",
    r"treatment-guidelines",
    r"\.pdf",
]


def fetch_page(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "cdc-sti-monitor/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def extract_links(html: str) -> set[str]:
    hrefs = re.findall(r'href="([^"]+)"', html, re.IGNORECASE)
    result = set()
    for h in hrefs:
        if any(re.search(p, h, re.IGNORECASE) for p in GUIDELINE_PATTERNS):
            result.add(h.strip())
    return result


def extract_last_reviewed(html: str) -> str:
    m = re.search(r'(?:last\s+reviewed|updated)[:\s]+([A-Za-z]+\s+\d+,?\s+\d{4})',
                  html, re.IGNORECASE)
    return m.group(1).strip() if m else ""


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2))
    STATE_FILE.chmod(0o644)


def push_notify(user: str, token: str, title: str, message: str) -> None:
    payload = json.dumps({
        "token": token, "user": user,
        "title": title, "message": message,
        "url": PAGE_URL, "url_title": "CDC STI Treatment Guidelines",
        "priority": 0,
    }).encode()
    req = urllib.request.Request(PUSHOVER_API, data=payload,
                                 headers={"Content-Type": "application/json"},
                                 method="POST")
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        if result.get("status") != 1:
            print(f"Pushover warning: {result}", file=sys.stderr)


def main() -> int:
    user  = os.environ.get("PUSHOVER_USER", "").strip()
    token = os.environ.get("PUSHOVER_TOKEN", "").strip()
    if not user or not token:
        print("ERROR: set PUSHOVER_USER and PUSHOVER_TOKEN", file=sys.stderr)
        return 2

    print(f"Fetching {PAGE_URL} …")
    html = fetch_page(PAGE_URL)

    current_links   = extract_links(html)
    current_reviewed = extract_last_reviewed(html)
    print(f"  Found {len(current_links)} guideline links")
    print(f"  Last reviewed : {current_reviewed or '(not found)'}")

    known = load_state()
    known_links   = set(known.get("links", []))
    known_reviewed = known.get("last_reviewed", "")

    new_links     = current_links - known_links
    removed_links = known_links - current_links
    date_changed  = current_reviewed and current_reviewed != known_reviewed

    if not new_links and not date_changed:
        print(f"No changes detected ({date.today()})")
        save_state({"links": sorted(current_links), "last_reviewed": current_reviewed})
        return 0

    parts = []
    if date_changed:
        parts.append(f"'Last Reviewed' changed: {known_reviewed!r} → {current_reviewed!r}")
    if new_links:
        parts.append(f"{len(new_links)} new link(s):\n" +
                     "\n".join(f"  • {l}" for l in sorted(new_links)))
    if removed_links:
        parts.append(f"{len(removed_links)} removed link(s):\n" +
                     "\n".join(f"  • {l}" for l in sorted(removed_links)))

    message = "CDC STI Treatment Guidelines page changed.\n\n" + "\n\n".join(parts)
    message += "\n\nReview and update /var/www/sti-guide/app.js if regimens changed."

    print(message)
    push_notify(user, token, "CDC STI Guidelines Update", message)
    save_state({"links": sorted(current_links), "last_reviewed": current_reviewed})
    print("Notification sent.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
