#!/usr/bin/env python3
"""
check_updates.py — monitor ND HHS antibiogram page for new files.

Fetches the antibiogram archive page, compares linked PDFs/xlsx files
against a local state file, and sends a Pushover notification when new
files appear. Run monthly via cron.

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

PAGE_URL = "https://www.hhs.nd.gov/health/diseases-conditions-and-immunization/antibiotic-resistance-and-antimicrobial-stewardship/antibiotic-resistance-and-antimicrobial-stewardship/antibiograms"
PUSHOVER_API = "https://api.pushover.net/1/messages.json"
STATE_FILE = Path(__file__).resolve().parent / "known_files.json"

MINOT_KEYWORDS = ["trinity", "minot", "sanford-minot", "sanford_minot"]


def fetch_page(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "nd-antibiogram-monitor/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def extract_links(html: str) -> set[str]:
    pattern = r'href="([^"]+\.(?:pdf|xlsx))"'
    return {
        m.group(1).strip()
        for m in re.finditer(pattern, html, re.IGNORECASE)
        if "Antimicrobial" in m.group(1) or "antibiogram" in m.group(1).lower()
    }


def load_state() -> set[str]:
    if STATE_FILE.exists():
        return set(json.loads(STATE_FILE.read_text()))
    return set()


def save_state(links: set[str]) -> None:
    STATE_FILE.write_text(json.dumps(sorted(links), indent=1))
    STATE_FILE.chmod(0o644)


def is_minot_related(url: str) -> bool:
    lower = url.lower()
    return any(kw in lower for kw in MINOT_KEYWORDS)


def push_notify(user: str, token: str, title: str, message: str) -> None:
    payload = json.dumps({
        "token": token,
        "user": user,
        "title": title,
        "message": message,
        "url": PAGE_URL,
        "url_title": "ND HHS Antibiograms",
        "priority": 0,
    }).encode()
    req = urllib.request.Request(
        PUSHOVER_API,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        if result.get("status") != 1:
            print(f"Pushover warning: {result}", file=sys.stderr)


def main() -> int:
    user = os.environ.get("PUSHOVER_USER", "").strip()
    token = os.environ.get("PUSHOVER_TOKEN", "").strip()
    if not user or not token:
        print("ERROR: set PUSHOVER_USER and PUSHOVER_TOKEN", file=sys.stderr)
        return 2

    print(f"Fetching {PAGE_URL} …")
    html = fetch_page(PAGE_URL)
    current = extract_links(html)
    print(f"Found {len(current)} antibiogram files on page")

    known = load_state()
    new_files = current - known

    if not new_files:
        print(f"No new files ({date.today()})")
        save_state(current)
        return 0

    new_sorted = sorted(new_files)
    minot = [f for f in new_sorted if is_minot_related(f)]

    lines = [f"• {f.split('/')[-1]}" for f in new_sorted]
    message = f"{len(new_files)} new antibiogram file(s) posted:\n" + "\n".join(lines)
    if minot:
        message += f"\n\n⚠ {len(minot)} may be Minot/Trinity/Sanford — update antibiogram app."

    title = "ND Antibiogram Update"
    if minot:
        title += " — Minot data"

    print(message)
    push_notify(user, token, title, message)
    save_state(current)
    print("Notification sent.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
