#!/usr/bin/env python3
"""Run all quarterly clinical monitors and send one consolidated report.

This orchestrator replaces staggered root-cron entries. A failed topic cannot
prevent later topics from running, and failures are written into both the
consolidated report and that topic's public review-status file.
"""

import datetime
import json
import os
import subprocess
import sys
from pathlib import Path


REPO = Path(os.environ.get("NOAHPAC_REPO", "/var/www/noahpac-portal")).resolve()
REPORTER = Path(os.environ.get(
    "NOAHPAC_REPORTER", "/opt/scripts/quarterly-email-report.py"
))
TOPICS = [
    ("reportable", "ND Reportable Conditions"),
    ("sti-guide", "CDC STI Treatment Guidelines"),
    ("naloxone", "ND Overdose / Naloxone Data"),
    ("abx", "Antibiotic Reference"),
    ("tccc", "TCCC / CoTCCC Guidelines"),
    ("vaccines", "ACIP/AAP/ACOG Vaccine Schedules"),
    ("calculators", "Clinical Calculators"),
    ("peds", "Pediatric Dosing"),
    ("als", "Advanced Life Support"),
    ("pals", "Pediatric Advanced Life Support"),
    ("opioids", "Opioid MME Estimator"),
    ("wound", "Wound Care"),
    ("sepsis", "Sepsis Screening"),
    ("allergy", "Antibiotic Allergy Cross-Reactivity"),
    ("steroids", "Corticosteroid Equivalency & Taper Guidance"),
    ("anticoag", "Anticoagulation Reversal"),
    ("toxicology", "Toxicology / Antidote Reference"),
]


def report_file() -> Path:
    return Path(f"/tmp/quarterly-report-{datetime.date.today().isoformat()}.json")


def load_report() -> list[dict]:
    path = report_file()
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text())
    except (json.JSONDecodeError, OSError):
        return []


def write_error(topic: str, name: str, detail: str) -> None:
    results = load_report()
    if not any(item.get("app_id") == topic for item in results):
        results.append({
            "app_id": topic,
            "app_name": name,
            "app_url": f"https://noahpac.com/{topic}/",
            "status": "error",
            "findings": [{"detail": detail}],
            "ran_at": datetime.datetime.now().isoformat(timespec="minutes"),
        })
        report_file().write_text(json.dumps(results, indent=2) + "\n")

    status_path = REPO / topic / "last_checked.json"
    previous = {}
    try:
        previous = json.loads(status_path.read_text()) if status_path.exists() else {}
    except (json.JSONDecodeError, OSError):
        pass
    payload = {
        "date": datetime.date.today().isoformat(),
        "status": "error",
        "error": "Automated monitoring job failed; inspect the systemd journal.",
    }
    if previous.get("review_pending") or previous.get("status") in {
        "changed", "held_for_review", "review_required"
    }:
        payload["review_pending"] = True
    status_path.write_text(json.dumps(payload, indent=2) + "\n")
    status_path.chmod(0o644)


def ensure_result(topic: str, name: str) -> None:
    """Record successful first-run initialization when a legacy script is silent."""
    results = load_report()
    if any(item.get("app_id") == topic for item in results):
        return
    results.append({
        "app_id": topic,
        "app_name": name,
        "app_url": f"https://noahpac.com/{topic}/",
        "status": "no_change",
        "findings": [{"detail": "Monitor initialized successfully; no comparison alert emitted"}],
        "ran_at": datetime.datetime.now().isoformat(timespec="minutes"),
    })
    report_file().write_text(json.dumps(results, indent=2) + "\n")


def main() -> int:
    if REPO != Path("/var/www/noahpac-portal") and not os.environ.get("NOAHPAC_ALLOW_ALT_REPO"):
        print(f"Refusing unexpected repository path: {REPO}", file=sys.stderr)
        return 2

    if "--check" in sys.argv[1:]:
        missing_paths = [
            str(REPO / topic / "check_updates.py")
            for topic, _name in TOPICS
            if not (REPO / topic / "check_updates.py").is_file()
        ]
        if not REPORTER.is_file():
            missing_paths.append(str(REPORTER))
        if missing_paths:
            print("Monitoring configuration is incomplete:", file=sys.stderr)
            for path in missing_paths:
                print(f"  missing: {path}", file=sys.stderr)
            return 1
        print(f"Monitoring configuration valid: {len(TOPICS)} topic scripts and reporter found.")
        return 0

    missing = [name for name in ("PUSHOVER_USER", "PUSHOVER_TOKEN") if not os.environ.get(name)]
    if missing:
        print(f"Missing required environment variable(s): {', '.join(missing)}", file=sys.stderr)
        return 2

    report_file().unlink(missing_ok=True)
    topic_failures = 0
    for topic, name in TOPICS:
        script = REPO / topic / "check_updates.py"
        print(f"\n=== {name} ({topic}) ===", flush=True)
        if not script.is_file():
            topic_failures += 1
            write_error(topic, name, f"Missing monitor script: {script}")
            continue
        completed = subprocess.run([sys.executable, str(script)], cwd=script.parent, check=False)
        if completed.returncode != 0:
            topic_failures += 1
            write_error(topic, name, f"Monitor exited with status {completed.returncode}")
        else:
            ensure_result(topic, name)

    expected = json.dumps([
        [topic, name, f"https://noahpac.com/{topic}/"] for topic, name in TOPICS
    ])
    report = subprocess.run([
        sys.executable, str(REPORTER),
        "--title", "Quarterly Clinical Guidelines Review",
        "--expected", expected,
    ], check=False)
    if report.returncode != 0:
        print(f"Consolidated report failed with status {report.returncode}", file=sys.stderr)
        report_failed = True
    else:
        report_failed = False

    print(
        f"Quarterly monitoring complete: {len(TOPICS) - topic_failures} clean, "
        f"{topic_failures} topic failure(s), report {'failed' if report_failed else 'sent'}."
    )
    return 1 if topic_failures or report_failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
