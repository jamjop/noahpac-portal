"""Create bounded, stable side-by-side text-change hunks for clinical review."""

from __future__ import annotations

import difflib
import hashlib
import json


MAX_HUNKS = 24
MAX_LINES_PER_SIDE = 50
MAX_LINE_LENGTH = 500


def _line(number: int, text: str, changed: bool) -> dict:
    return {
        "number": number,
        "text": text[:MAX_LINE_LENGTH],
        "changed": changed,
    }


def build_hunks(previous: str, current: str, *, kind: str = "source", label: str = "") -> tuple[list[dict], bool]:
    """Return review-sized grouped opcodes and whether anything was omitted."""
    if previous == current:
        return [], False
    before = previous.splitlines()
    after = current.splitlines()
    groups = list(difflib.SequenceMatcher(None, before, after, autojunk=False).get_grouped_opcodes(2))
    truncated = len(groups) > MAX_HUNKS
    hunks = []
    for group in groups[:MAX_HUNKS]:
        old_lines, new_lines = [], []
        old_start = group[0][1] + 1
        new_start = group[0][3] + 1
        clipped = False
        for tag, i1, i2, j1, j2 in group:
            changed = tag != "equal"
            for offset, text in enumerate(before[i1:i2]):
                if len(old_lines) >= MAX_LINES_PER_SIDE:
                    clipped = True
                    break
                old_lines.append(_line(i1 + offset + 1, text, changed))
            for offset, text in enumerate(after[j1:j2]):
                if len(new_lines) >= MAX_LINES_PER_SIDE:
                    clipped = True
                    break
                new_lines.append(_line(j1 + offset + 1, text, changed))
        identity = json.dumps({
            "kind": kind, "label": label, "old": old_lines, "new": new_lines,
        }, sort_keys=True, separators=(",", ":")).encode()
        hunks.append({
            "id": hashlib.sha256(identity).hexdigest()[:20],
            "kind": kind,
            "label": label or ("Source text" if kind == "source" else "Noah PA-C implementation"),
            "old_start": old_start,
            "new_start": new_start,
            "old_lines": old_lines,
            "new_lines": new_lines,
            "truncated": clipped,
        })
        truncated = truncated or clipped
    return hunks, truncated


def marker_hunk(previous: str, current: str, *, label: str) -> dict:
    """Represent an authoritative page's extracted version marker change."""
    hunks, _ = build_hunks(previous, current, kind="source", label=label)
    return hunks[0]
