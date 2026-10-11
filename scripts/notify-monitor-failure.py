#!/usr/bin/env python3
"""Send a concise Pushover alert when a Noah PA-C systemd job fails."""

import argparse
import datetime
import json
import os
import platform
import urllib.request


PUSHOVER_API = "https://api.pushover.net/1/messages.json"


def build_message(unit: str) -> dict[str, object]:
    hostname = platform.node() or "unknown host"
    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="minutes")
    return {
        "token": os.environ.get("PUSHOVER_TOKEN", ""),
        "user": os.environ.get("PUSHOVER_USER", ""),
        "title": "Noah PA-C monitoring failure",
        "message": (
            f"{unit} failed on {hostname} at {now}. "
            f"Inspect: journalctl -u {unit} --since today --no-pager"
        ),
        "priority": 1,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("unit", help="failed systemd unit name")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    payload = build_message(args.unit)

    if args.dry_run:
        safe = dict(payload)
        safe["token"] = "<configured>" if payload["token"] else "<missing>"
        safe["user"] = "<configured>" if payload["user"] else "<missing>"
        print(json.dumps(safe, indent=2))
        return 0

    missing = [key for key in ("token", "user") if not payload[key]]
    if missing:
        print(f"Missing Pushover configuration: {', '.join(missing)}")
        return 2

    request = urllib.request.Request(
        PUSHOVER_API,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "User-Agent": "noahpac-monitor/1.0"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        result = json.loads(response.read())
    if result.get("status") != 1:
        print(f"Pushover rejected failure alert: {result}")
        return 1
    print(f"Failure alert sent for {args.unit}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
