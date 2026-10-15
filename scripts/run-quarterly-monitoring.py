#!/usr/bin/env python3
"""Run all quarterly clinical monitors and send one consolidated report.

This orchestrator replaces staggered root-cron entries. A failed topic cannot
prevent later topics from running, and failures are written into both the
consolidated report and that topic's public review-status file.
"""

import datetime
import argparse
import json
import os
import re
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
    ("triage", "Adult Urgency & Disposition"),
]
HIGH_RISK_TOPIC_IDS = {
    "sti-guide", "naloxone", "abx", "tccc", "vaccines", "calculators",
    "peds", "als", "pals", "opioids", "sepsis", "allergy", "steroids",
    "anticoag", "toxicology", "triage",
}


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


FETCH_WARNING = re.compile(r"fetch failed", re.IGNORECASE)


def page_fetch_warning_topics(results: list[dict]) -> list[str]:
    """Topics whose result mentions a failed page fetch.

    A topic whose monitor ran to completion but could not read one of its source
    pages exits 0 and reports the problem inside its findings, so it is not a
    topic failure, but it is not "clean" either: the page was not checked.
    """
    topics = []
    for item in results:
        details = [str(finding.get("detail", "")) for finding in item.get("findings", []) or []]
        if item.get("status") != "error" and any(FETCH_WARNING.search(text) for text in details):
            topics.append(str(item.get("app_id")))
    return sorted(set(topics))


def write_heartbeat(job: str) -> None:
    """Prometheus 'last success' heartbeat, same helper the topic monitors use."""
    sys.path.insert(0, str(REPO / "lib"))
    import pubmed_watcher  # noqa: PLC0415

    pubmed_watcher.write_heartbeat(job)


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
    status_path.chmod(0o664)


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
    parser = argparse.ArgumentParser(description="Run Noah PA-C clinical source monitors")
    parser.add_argument("--high-risk", action="store_true", help="Run only high-risk topics for monthly surveillance")
    parser.add_argument("--check", action="store_true", help="Validate configuration without running monitors")
    args = parser.parse_args()
    topics = [item for item in TOPICS if item[0] in HIGH_RISK_TOPIC_IDS] if args.high_risk else TOPICS
    if REPO != Path("/var/www/noahpac-portal") and not os.environ.get("NOAHPAC_ALLOW_ALT_REPO"):
        print(f"Refusing unexpected repository path: {REPO}", file=sys.stderr)
        return 2

    if args.check:
        missing_paths = [
            str(REPO / topic / "check_updates.py")
            for topic, _name in topics
            if not (REPO / topic / "check_updates.py").is_file()
        ]
        if not REPORTER.is_file():
            missing_paths.append(str(REPORTER))
        if missing_paths:
            print("Monitoring configuration is incomplete:", file=sys.stderr)
            for path in missing_paths:
                print(f"  missing: {path}", file=sys.stderr)
            return 1
        print(f"Monitoring configuration valid: {len(topics)} topic scripts and reporter found.")
        return 0

    missing = [name for name in ("PUSHOVER_USER", "PUSHOVER_TOKEN") if not os.environ.get(name)]
    if missing:
        print(f"Missing required environment variable(s): {', '.join(missing)}", file=sys.stderr)
        return 2

    report_file().unlink(missing_ok=True)
    topic_failures = 0
    for topic, name in topics:
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

    # Read this before the reporter runs: it deletes the report file after sending.
    warned = page_fetch_warning_topics(load_report())

    expected = json.dumps([
        [topic, name, f"https://noahpac.com/{topic}/"] for topic, name in topics
    ])
    report = subprocess.run([
        sys.executable, str(REPORTER),
        "--title", "Monthly High-Risk Clinical Review" if args.high_risk else "Quarterly Clinical Guidelines Review",
        "--expected", expected,
    ], check=False)
    if report.returncode != 0:
        print(f"Consolidated report failed with status {report.returncode}", file=sys.stderr)
        report_failed = True
    else:
        report_failed = False

    clean = len(topics) - topic_failures - len([t for t in warned if t in {topic for topic, _ in topics}])
    warning_text = f", {len(warned)} with a page-fetch warning ({', '.join(warned)})" if warned else ""
    print(
        f"{'High-risk monthly' if args.high_risk else 'Quarterly'} monitoring complete: {clean} clean"
        f"{warning_text}, {topic_failures} topic failure(s), report {'failed' if report_failed else 'sent'}."
    )
    if not topic_failures and not report_failed:
        write_heartbeat("high_risk_monitor" if args.high_risk else "quarterly_monitor")
    return 1 if topic_failures or report_failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
