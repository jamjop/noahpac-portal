#!/usr/bin/env python3
"""
check_updates.py — monitor ND HHS reportable conditions list for updates.

Checks the Last-Modified header of the official conditions PDF.
If the server reports a newer modification date than what's stored in the
state file, sends a Pushover notification. Run quarterly via cron.

Usage:
    PUSHOVER_USER=xxx PUSHOVER_TOKEN=yyy ./check_updates.py
"""

import json
import os
import sys
import urllib.request
from datetime import date
from pathlib import Path

PDF_URL  = "https://www.hhs.nd.gov/sites/default/files/documents/DOH%20Legacy/reportable-conditions-exclusion.pdf"
PAGE_URL = "https://www.hhs.nd.gov/health/diseases-conditions-and-immunization/reportable-conditions"
PUSHOVER_API = "https://api.pushover.net/1/messages.json"
STATE_FILE   = Path(__file__).resolve().parent / "known_state.json"


def get_pdf_headers(url: str) -> dict:
    req = urllib.request.Request(url, method="HEAD",
                                 headers={"User-Agent": "nd-reportable-monitor/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return {
            "last_modified": resp.headers.get("Last-Modified", ""),
            "content_length": resp.headers.get("Content-Length", ""),
            "etag": resp.headers.get("ETag", ""),
        }


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
        "url": PAGE_URL, "url_title": "ND Reportable Conditions",
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

    print(f"Checking {PDF_URL} …")
    current = get_pdf_headers(PDF_URL)
    print(f"  Last-Modified : {current['last_modified']}")
    print(f"  Content-Length: {current['content_length']}")

    known = load_state()
    changed = (
        current["last_modified"] != known.get("last_modified") or
        current["content_length"] != known.get("content_length") or
        current["etag"] != known.get("etag")
    )

    if not changed:
        print(f"No change detected ({date.today()})")
        save_state(current)
        return 0

    message = (
        f"ND HHS reportable conditions PDF may have been updated.\n"
        f"  Last-Modified : {current['last_modified']} (was: {known.get('last_modified', 'unknown')})\n"
        f"  Size          : {current['content_length']} bytes (was: {known.get('content_length', 'unknown')})\n\n"
        f"Review the updated list and update /var/www/reportable/app.js if conditions changed."
    )

    print(message)
    push_notify(user, token, "ND Reportable Conditions Update", message)
    save_state(current)
    print("Notification sent.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
