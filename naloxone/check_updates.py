#!/usr/bin/env python3
"""
check_updates.py — monitor ND HHS behavioral health data page for new
overdose/naloxone reports, and the CDC fentanyl/overdose stats page.

Tracks PDF/document links on both pages; notifies when new files appear.
Run quarterly via cron.

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

SOURCES = {
    "nd_bh_data": {
        "url": "https://www.hhs.nd.gov/behavioral-health/data",
        "label": "ND HHS Behavioral Health Data",
        "pattern": r'\.pdf|data-booklet|databook|epi-profile|overdose',
    },
}

PUSHOVER_API = "https://api.pushover.net/1/messages.json"
STATE_FILE   = Path(__file__).resolve().parent / "known_state.json"

OVERDOSE_KEYWORDS = ["overdose", "naloxone", "opioid", "fentanyl", "death", "fatal"]


def fetch_page(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "nd-naloxone-monitor/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def extract_links(html: str, pattern: str) -> set[str]:
    hrefs = re.findall(r'href="([^"]+)"', html, re.IGNORECASE)
    return {
        h.strip() for h in hrefs
        if re.search(pattern, h, re.IGNORECASE)
        and "exclusion" not in h  # ND HHS appends -exclusion to file names
           or re.search(r'exclusion', h) and re.search(pattern, h, re.IGNORECASE)
    }


def is_overdose_related(url: str) -> bool:
    lower = url.lower()
    return any(kw in lower for kw in OVERDOSE_KEYWORDS)


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2))
    STATE_FILE.chmod(0o644)


def push_notify(user: str, token: str, title: str, message: str, url: str) -> None:
    payload = json.dumps({
        "token": token, "user": user,
        "title": title, "message": message,
        "url": url, "url_title": "ND HHS Behavioral Health Data",
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

    known = load_state()
    new_state = {}
    all_new = []

    for src_id, src in SOURCES.items():
        print(f"Fetching {src['url']} …")
        try:
            html = fetch_page(src["url"])
        except Exception as exc:
            print(f"  WARNING: could not fetch {src['url']}: {exc}", file=sys.stderr)
            new_state[src_id] = known.get(src_id, [])
            continue

        current = extract_links(html, src["pattern"])
        known_set = set(known.get(src_id, []))
        new_files = current - known_set

        print(f"  {len(current)} links found, {len(new_files)} new")
        new_state[src_id] = sorted(current)

        for f in sorted(new_files):
            all_new.append((src["label"], f, is_overdose_related(f)))

    if not all_new:
        print(f"No new files detected ({date.today()})")
        save_state(new_state)
        return 0

    lines = [f"• [{label}] {url.split('/')[-1]}" for label, url, _ in all_new]
    overdose_hits = [f for _, f, rel in all_new if rel]

    message = f"{len(all_new)} new file(s) detected:\n" + "\n".join(lines)
    if overdose_hits:
        message += (f"\n\n⚠ {len(overdose_hits)} may contain updated overdose/naloxone stats "
                    f"— review and update /var/www/naloxone/index.html if figures changed.")

    title = "ND Overdose/Naloxone Data Update"
    if overdose_hits:
        title += " — new stats"

    print(message)
    push_notify(user, token, title, message,
                SOURCES["nd_bh_data"]["url"])
    save_state(new_state)
    print("Notification sent.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
