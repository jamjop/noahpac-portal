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
        self.assertIn("27 claim mappings", completed.stdout)

    def test_all_manifest_routes_and_monitors_exist(self):
        manifest = json.loads((REPO / "clinical-review.json").read_text())
        self.assertEqual(len(manifest["tools"]), 27)
        self.assertEqual(len({tool["id"] for tool in manifest["tools"]}), 27)
        for tool in manifest["tools"]:
            self.assertTrue((REPO / tool["path"].strip("/") / "index.html").is_file())
            if tool["monitor"]:
                self.assertTrue((REPO / tool["monitor"]).is_file())

    def test_every_high_risk_tool_has_claim_traceability_and_monitoring(self):
        manifest = json.loads((REPO / "clinical-review.json").read_text())
        claims = json.loads((REPO / "clinical-claims.json").read_text())["claims"]
        covered = {claim["tool_id"] for claim in claims}
        for tool in manifest["tools"]:
            if tool["risk_tier"] == "high":
                self.assertIn(tool["id"], covered)
                self.assertTrue(tool["monitor"])
                self.assertTrue(tool["source_ids"])

    def test_new_outpatient_calculators_have_complete_update_coverage(self):
        manifest = json.loads((REPO / "clinical-review.json").read_text())
        claims = json.loads((REPO / "clinical-claims.json").read_text())["claims"]
        calculator = next(tool for tool in manifest["tools"] if tool["id"] == "calculators")
        claim = next(claim for claim in claims if claim["id"] == "calculators-outpatient-prevention")
        expected_sources = {
            "cdc_adult_bmi", "mosteller_bsa", "uspstf_lung_2021", "ada_a1c_eag",
            "aha_bp_2025", "aha_prevent", "aha_orthostatic",
        }
        mutable_web_sources = expected_sources - {"mosteller_bsa"}

        self.assertTrue(expected_sources.issubset(calculator["source_ids"]))
        self.assertEqual(set(claim["source_ids"]), expected_sources)
        for source_id in mutable_web_sources:
            self.assertIs(manifest["sources"][source_id].get("fingerprint"), True)

        updater = (REPO / calculator["monitor"]).read_text()
        for search_id in {
            "aha_prevent_risk", "aha_hypertension", "a1c_eag_conversion",
            "uspstf_lung_screening", "adult_anthropometrics",
        }:
            self.assertIn(f"'id':      '{search_id}'", updater)

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
