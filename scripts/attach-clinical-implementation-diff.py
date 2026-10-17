#!/usr/bin/env python3
"""Attach a bounded Git old/new comparison to an open clinical review event."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path, PurePosixPath

REPO = Path(os.environ.get("NOAHPAC_REPO", Path(__file__).resolve().parents[1])).resolve()
sys.path.insert(0, str(REPO / "lib"))
from diff_hunks import build_hunks  # noqa: E402
import review_events  # noqa: E402


def git(*args: str, text: bool = True):
    return subprocess.run(
        ["git", "-C", str(REPO), *args], capture_output=True, text=text,
        check=True, timeout=30,
    ).stdout


def valid_revision(value: str) -> str:
    resolved = git("rev-parse", "--verify", f"{value}^{{commit}}").strip()
    if not resolved:
        raise ValueError(f"Revision {value!r} is unavailable")
    return resolved


def file_at(revision: str, path: str) -> str:
    completed = subprocess.run(
        ["git", "-C", str(REPO), "show", f"{revision}:{path}"],
        capture_output=True, timeout=30,
    )
    if completed.returncode:
        return ""
    if len(completed.stdout) > 1_000_000 or b"\0" in completed.stdout:
        return ""
    return completed.stdout.decode("utf-8", "replace")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("event_id")
    parser.add_argument("--base", required=True, help="Previous deployed commit")
    parser.add_argument("--head", required=True, help="Updated deployed commit")
    parser.add_argument("--path", action="append", required=True, help="Changed repo path; repeat as needed")
    args = parser.parse_args()
    review_events.REPO = REPO
    base, head = valid_revision(args.base), valid_revision(args.head)
    event = next((item for item in review_events.list_events(include_resolved=False) if item.get("id") == args.event_id), None)
    if not event:
        raise ValueError("Open review event not found")

    requested = set(args.path)
    for path in requested:
        pure = PurePosixPath(path)
        if pure.is_absolute() or ".." in pure.parts:
            raise ValueError(f"Unsafe repository path: {path}")
    changed = git("diff", "--name-only", base, head).splitlines()
    paths = [path for path in changed if path in requested]
    if not paths:
        raise ValueError("No matching changed files found between these revisions")

    all_hunks, truncated = [], False
    for path in paths[:20]:
        hunks, clipped = build_hunks(
            file_at(base, path), file_at(head, path),
            kind="implementation", label=path,
        )
        all_hunks.extend(hunks)
        truncated = truncated or clipped
    if not all_hunks:
        raise ValueError("No reviewable text changes found in the selected files")
    if len(all_hunks) > 50:
        all_hunks, truncated = all_hunks[:50], True
    review_events.attach_implementation_hunks(args.event_id, all_hunks, {
        "base": base, "head": head, "paths": paths[:20], "truncated": truncated or len(paths) > 20,
    })
    print(f"Attached {len(all_hunks)} implementation change hunk(s) to {args.event_id}.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, subprocess.SubprocessError) as exc:
        print(f"Unable to attach implementation comparison: {exc}", file=sys.stderr)
        raise SystemExit(2)
