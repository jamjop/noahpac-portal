#!/usr/bin/env python3
"""Monitoring health: runner summary (page-fetch warnings, heartbeats) and the antibiogram freshness check."""

import contextlib
import importlib.util
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

REPO = Path(__file__).resolve().parents[1]
RUNNER_PATH = REPO / "scripts" / "run-quarterly-monitoring.py"
FRESHNESS = REPO / "scripts" / "check-antibiogram-freshness.cjs"


def load_runner(repo_dir: str):
    env = {"NOAHPAC_REPO": repo_dir, "NOAHPAC_ALLOW_ALT_REPO": "1", "PUSHOVER_USER": "u", "PUSHOVER_TOKEN": "t"}
    with mock.patch.dict(os.environ, env):
        spec = importlib.util.spec_from_file_location("run_quarterly_monitoring_under_test", RUNNER_PATH)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module


class PageFetchWarningTests(unittest.TestCase):
    def setUp(self):
        self.runner = load_runner(tempfile.gettempdir())

    def test_flags_topics_that_could_not_read_a_page(self):
        results = [
            {"app_id": "sti-guide", "status": "changed", "findings": [{"detail": "WARNING: CDC STI page fetch failed: direct fetch failed (HTTP Error 403)"}]},
            {"app_id": "vaccines", "status": "no_change", "findings": [{"detail": "ERROR: CDC Vaccine Schedules page: Fetch Failed -- timed out"}]},
            {"app_id": "abx", "status": "changed", "findings": [{"detail": "[Antibiotics] Some paper  PMID 1"}]},
            {"app_id": "sepsis", "status": "no_change", "findings": []},
        ]
        self.assertEqual(self.runner.page_fetch_warning_topics(results), ["sti-guide", "vaccines"])

    def test_topic_failures_are_not_double_counted_as_warnings(self):
        results = [{"app_id": "peds", "status": "error", "findings": [{"detail": "Monitor exited with status 1 (fetch failed)"}]}]
        self.assertEqual(self.runner.page_fetch_warning_topics(results), [])

    def test_tolerates_missing_findings_and_duplicates(self):
        results = [
            {"app_id": "als"},
            {"app_id": "als", "findings": None},
            {"app_id": "pals", "findings": [{"detail": "fetch failed"}]},
            {"app_id": "pals", "findings": [{"detail": "fetch failed again"}]},
        ]
        self.assertEqual(self.runner.page_fetch_warning_topics(results), ["pals"])


class RunnerSummaryTests(unittest.TestCase):
    """Drives main() with fake topic scripts; the fake reporter deletes the report file like the real one."""

    def run_main(self, argv, failing=()):
        tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, tmp, ignore_errors=True)
        runner = load_runner(str(tmp))
        for topic in ("a", "b", "c"):
            (tmp / topic).mkdir()
            (tmp / topic / "check_updates.py").write_text("")
        report = tmp / "report.json"
        runner.report_file = lambda: report
        runner.TOPICS = [("a", "Topic A"), ("b", "Topic B"), ("c", "Topic C")]
        runner.HIGH_RISK_TOPIC_IDS = {"a", "b"}
        runner.REPORTER = tmp / "reporter.py"
        heartbeats = []
        runner.write_heartbeat = heartbeats.append

        def fake_run(cmd, **kwargs):
            script = Path(cmd[1])
            if script == runner.REPORTER:
                report.unlink(missing_ok=True)
                return subprocess.CompletedProcess(cmd, 0)
            topic = script.parent.name
            if topic in failing:
                return subprocess.CompletedProcess(cmd, 1)
            entry = {"app_id": topic, "status": "no_change", "findings": []}
            if topic == "b":
                entry["findings"] = [{"detail": "WARNING: CDC page fetch failed: HTTP Error 403"}]
            existing = json.loads(report.read_text()) if report.exists() else []
            report.write_text(json.dumps(existing + [entry]))
            return subprocess.CompletedProcess(cmd, 0)

        out = io.StringIO()
        with mock.patch.object(runner.subprocess, "run", side_effect=fake_run), \
                mock.patch.object(sys, "argv", ["run-quarterly-monitoring.py", *argv]), \
                mock.patch.dict(os.environ, {"PUSHOVER_USER": "u", "PUSHOVER_TOKEN": "t", "NOAHPAC_ALLOW_ALT_REPO": "1"}), \
                contextlib.redirect_stdout(out):
            code = runner.main()
        return code, out.getvalue(), heartbeats

    def test_summary_separates_clean_from_page_fetch_warnings(self):
        code, out, heartbeats = self.run_main([])
        self.assertEqual(code, 0)
        self.assertIn("2 clean, 1 with a page-fetch warning (b), 0 topic failure(s)", out)
        self.assertEqual(heartbeats, ["quarterly_monitor"])

    def test_high_risk_run_uses_its_own_heartbeat_and_scope(self):
        code, out, heartbeats = self.run_main(["--high-risk"])
        self.assertEqual(code, 0)
        self.assertIn("1 clean, 1 with a page-fetch warning (b)", out)
        self.assertEqual(heartbeats, ["high_risk_monitor"])

    def test_no_heartbeat_when_a_topic_fails(self):
        code, out, heartbeats = self.run_main([], failing={"c"})
        self.assertEqual(code, 1)
        self.assertIn("1 topic failure(s)", out)
        self.assertEqual(heartbeats, [])


@unittest.skipUnless(shutil.which("node"), "node is required for the freshness script")
class AntibiogramFreshnessTests(unittest.TestCase):
    def check(self, facilities, now="2026-10-15", exceptions=None, raw_exceptions=None):
        data = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, data, ignore_errors=True)
        (data / "manifest.json").write_text(json.dumps({"facilities": list(facilities)}))
        for key, period in facilities.items():
            (data / f"{key}.json").write_text(json.dumps({"name": key.title(), "location": "ND", "period": period}))
        if exceptions is not None:
            (data / "freshness-exceptions.json").write_text(json.dumps(exceptions))
        if raw_exceptions is not None:
            (data / "freshness-exceptions.json").write_text(raw_exceptions)
        env = {**os.environ, "NOAHPAC_ANTIBIOGRAM_DATA_DIR": str(data), "NOAHPAC_FRESHNESS_NOW": now}
        done = subprocess.run(["node", str(FRESHNESS)], capture_output=True, text=True, env=env)
        return done.returncode, done.stdout + done.stderr

    def test_last_years_data_is_fresh(self):
        code, out = self.check({"a": "2025"})
        self.assertEqual(code, 0, out)

    def test_data_more_than_18_months_past_period_end_is_stale(self):
        code, out = self.check({"a": "2024"})  # 653 days
        self.assertEqual(code, 1, out)
        self.assertIn("STALE", out)

    def test_threshold_boundary(self):
        # 548 days after 2025-12-31 is 2027-07-02. Use a margin of a few days: the day count is floor(ms / 86400000)
        # and a DST change between the two dates shifts it by an hour, i.e. possibly by one day.
        self.assertEqual(self.check({"a": "2025"}, now="2027-06-28")[0], 0)
        self.assertEqual(self.check({"a": "2025"}, now="2027-07-06")[0], 1)

    def test_valid_exception_passes_and_is_shown(self):
        code, out = self.check({"a": "2024"}, exceptions={"a": {"reason": "nothing newer published", "expires": "2027-03-31"}})
        self.assertEqual(code, 0, out)
        self.assertIn("ACCEPT", out)
        self.assertIn("nothing newer published", out)

    def test_expired_exception_fails_again(self):
        code, out = self.check({"a": "2024"}, now="2027-04-01", exceptions={"a": {"reason": "x", "expires": "2027-03-31"}})
        self.assertEqual(code, 1, out)
        self.assertIn("EXPIRED", out)

    def test_exception_without_a_reason_does_not_excuse(self):
        code, _ = self.check({"a": "2024"}, exceptions={"a": {"expires": "2027-03-31"}})
        self.assertEqual(code, 1)

    def test_exception_does_not_excuse_other_facilities(self):
        code, _ = self.check({"a": "2024", "b": "2023"}, exceptions={"a": {"reason": "r", "expires": "2027-03-31"}})
        self.assertEqual(code, 1)

    def test_unreadable_exceptions_file_fails_closed(self):
        code, out = self.check({"a": "2025"}, raw_exceptions="{not json")
        self.assertEqual(code, 1, out)

    def test_repository_data_passes_today(self):
        env = {**os.environ, "NOAHPAC_FRESHNESS_NOW": "2026-10-15"}
        done = subprocess.run(["node", str(FRESHNESS)], capture_output=True, text=True, env=env)
        self.assertEqual(done.returncode, 0, done.stdout + done.stderr)


if __name__ == "__main__":
    unittest.main()
