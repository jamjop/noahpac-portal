import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


REPO = Path(__file__).resolve().parent.parent


class ClinicalGovernanceTests(unittest.TestCase):
    def test_manifest_and_source_configuration(self):
        env = os.environ.copy()
        env["NOAHPAC_REPO"] = str(REPO)
        completed = subprocess.run(
            [sys.executable, str(REPO / "scripts/check-clinical-sources.py"), "--check-config"],
            env=env, capture_output=True, text=True, check=False,
        )
        self.assertEqual(completed.returncode, 0, completed.stdout + completed.stderr)
        self.assertIn("26 tools", completed.stdout)

    def test_all_manifest_routes_and_monitors_exist(self):
        manifest = json.loads((REPO / "clinical-review.json").read_text())
        self.assertEqual(len(manifest["tools"]), 26)
        self.assertEqual(len({tool["id"] for tool in manifest["tools"]}), 26)
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


if __name__ == "__main__":
    unittest.main()
