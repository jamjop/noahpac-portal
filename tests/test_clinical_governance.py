import json
import os
import subprocess
import sys
import tempfile
import unittest
import importlib.util
from datetime import date
from pathlib import Path


REPO = Path(__file__).resolve().parent.parent


class ClinicalGovernanceTests(unittest.TestCase):
    def test_clinical_assistant_identifier_filter(self):
        path = REPO / "clinical-assistant" / "safety.py"
        spec = importlib.util.spec_from_file_location("assistant_safety", path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        self.assertEqual(module.detected_identifier("MRN: AB-12345"), "medical record number")
        self.assertEqual(module.detected_identifier("DOB 04/02/1980"), "date of birth")
        self.assertEqual(module.detected_identifier("Call 701-555-1212"), "phone number")
        self.assertIsNone(module.detected_identifier("Adult with fever and cough for 2 days"))

    def test_manifest_and_source_configuration(self):
        env = os.environ.copy()
        env["NOAHPAC_REPO"] = str(REPO)
        completed = subprocess.run(
            [sys.executable, str(REPO / "scripts/check-clinical-sources.py"), "--check-config"],
            env=env, capture_output=True, text=True, check=False,
        )
        self.assertEqual(completed.returncode, 0, completed.stdout + completed.stderr)
        self.assertIn("27 tools", completed.stdout)

    def test_all_manifest_routes_and_monitors_exist(self):
        manifest = json.loads((REPO / "clinical-review.json").read_text())
        self.assertEqual(len(manifest["tools"]), 27)
        self.assertEqual(len({tool["id"] for tool in manifest["tools"]}), 27)
        for tool in manifest["tools"]:
            self.assertTrue((REPO / tool["path"].strip("/") / "index.html").is_file())
            if tool["monitor"]:
                self.assertTrue((REPO / tool["monitor"]).is_file())

    def test_failure_alert_dry_run_never_prints_secrets(self):
        env = os.environ.copy()
        env.update(PUSHOVER_USER="secret-user", PUSHOVER_TOKEN="secret-token")
        completed = subprocess.run(
            [sys.executable, str(REPO / "scripts/notify-monitor-failure.py"),
             "noahpac-test.service", "--dry-run"],
            env=env, capture_output=True, text=True, check=False,
        )
        self.assertEqual(completed.returncode, 0)
        self.assertNotIn("secret-user", completed.stdout)
        self.assertNotIn("secret-token", completed.stdout)
        self.assertIn("<configured>", completed.stdout)

    def test_public_changelog_is_well_formed(self):
        manifest = json.loads((REPO / "clinical-review.json").read_text())
        changelog = json.loads((REPO / "clinical-changelog.json").read_text())
        routes = {tool["path"] for tool in manifest["tools"]}
        source_ids = set(manifest["sources"])
        entries = changelog["entries"]

        self.assertEqual(changelog["schema_version"], 1)
        self.assertEqual(len({entry["id"] for entry in entries}), len(entries))
        self.assertEqual([entry["date"] for entry in entries], sorted(
            (entry["date"] for entry in entries), reverse=True
        ))

        for entry in entries:
            date.fromisoformat(entry["date"])
            self.assertIn(entry["type"], {"clinical", "governance", "interface"})
            self.assertIsInstance(entry["clinical_change"], bool)
            self.assertTrue(entry["title"])
            self.assertTrue(entry["summary"])
            self.assertTrue(entry["changes"])
            self.assertTrue(set(entry["affected_routes"]).issubset(routes))
            self.assertTrue(set(entry["source_ids"]).issubset(source_ids))
            if entry["clinical_change"]:
                self.assertEqual(entry["type"], "clinical")
                self.assertTrue(entry["affected_routes"])
                self.assertTrue(entry["source_ids"])


if __name__ == "__main__":
    unittest.main()
