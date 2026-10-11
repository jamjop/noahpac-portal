import importlib.util
import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "clinical-review" / "api_server.py"
SPEC = importlib.util.spec_from_file_location("review_portal_api", MODULE_PATH)
api = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(api)


class ReviewPortalTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        (root / "sepsis").mkdir()
        (root / "sepsis" / "last_checked.json").write_text(json.dumps({"date":"2026-10-11","status":"changed","review_pending":True}))
        (root / "clinical-review.json").write_text(json.dumps({
            "sources": {"ssc": {"title":"Surviving Sepsis Campaign", "url":"https://example.org/ssc"}},
            "tools": [{"id":"sepsis","path":"/sepsis/","title":"Sepsis Screening","risk_tier":"high","review_cadence":"monthly","monitor":"sepsis/check_updates.py","source_ids":["ssc"]}],
        }))
        api.REPO = root
        api.MANIFEST = root / "clinical-review.json"
        api.AUDIT_LOG = root / "state" / "review-audit.jsonl"
        api.LOCK_FILE = root / "state" / "review.lock"

    def tearDown(self):
        self.tmp.cleanup()

    def submission(self):
        topic = api.dashboard()["topics"][0]
        return {"topic":"sepsis","decision":"no-change","note":"Compared all deployed sepsis content with the current campaign source.","source_ids":["ssc"],"expected_revision":topic["revision"],"change_reference":"","confirmed":True}

    def test_dashboard_exposes_pending_topic_and_approved_source(self):
        topic = api.dashboard()["topics"][0]
        self.assertEqual(topic["state"], "pending")
        self.assertEqual(topic["sources"][0]["id"], "ssc")

    def test_review_records_authenticated_identity_and_audit(self):
        result = api.record_review(self.submission(), "noah.pa")
        self.assertTrue(result["ok"])
        status = json.loads((api.REPO / "sepsis" / "last_checked.json").read_text())
        self.assertEqual(status["reviewer"], "noah.pa")
        self.assertFalse(status["review_pending"])
        audit = json.loads(api.AUDIT_LOG.read_text().splitlines()[0])
        self.assertEqual(audit["topic"], "sepsis")

    def test_unapproved_source_is_rejected(self):
        data = self.submission()
        data["source_ids"] = ["not-approved"]
        with self.assertRaisesRegex(api.ReviewError, "not approved"):
            api.record_review(data, "noah.pa")

    def test_stale_revision_is_rejected(self):
        data = self.submission()
        data["expected_revision"] = "0" * 16
        with self.assertRaisesRegex(api.ReviewError, "changed after"):
            api.record_review(data, "noah.pa")

    def test_content_update_requires_deployment_reference(self):
        data = self.submission()
        data["decision"] = "content-updated"
        with self.assertRaisesRegex(api.ReviewError, "deployed commit"):
            api.record_review(data, "noah.pa")

    def test_http_api_requires_forwarded_identity_and_same_origin(self):
        server = api.ThreadingHTTPServer(("127.0.0.1", 0), api.Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f"http://127.0.0.1:{server.server_port}"
        try:
            with self.assertRaises(urllib.error.HTTPError) as missing_user:
                urllib.request.urlopen(f"{base}/api/status")
            self.assertEqual(missing_user.exception.code, 401)
            missing_user.exception.close()

            body = json.dumps(self.submission()).encode()
            request = urllib.request.Request(
                f"{base}/api/reviews", data=body, method="POST",
                headers={"Content-Type":"application/json", "X-Remote-User":"noah.pa", "Origin":"https://attacker.example", "X-Requested-With":"NoahPACReviewPortal"},
            )
            with self.assertRaises(urllib.error.HTTPError) as wrong_origin:
                urllib.request.urlopen(request)
            self.assertEqual(wrong_origin.exception.code, 403)
            wrong_origin.exception.close()
        finally:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    unittest.main()
