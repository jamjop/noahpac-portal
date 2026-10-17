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
        (root / "clinical-claims.json").write_text(json.dumps({
            "schema_version": 1,
            "claims": [{"id":"sepsis-guidance","tool_id":"sepsis","scope":"Sepsis screening and treatment guidance","source_ids":["ssc"],"review_priority":"high","independent_review":"recommended"}],
        }))
        api.REPO = root
        api.MANIFEST = root / "clinical-review.json"
        api.CLAIM_MANIFEST = root / "clinical-claims.json"
        api.AUDIT_LOG = root / "state" / "review-audit.jsonl"
        api.LOCK_FILE = root / "state" / "review.lock"
        api.EVENT_DIR = root / "state" / "review-events"

    def tearDown(self):
        self.tmp.cleanup()

    def submission(self):
        topic = api.dashboard()["topics"][0]
        return {"topic":"sepsis","decision":"no-change","note":"Compared all deployed sepsis content with the current campaign source.","source_ids":["ssc"],"claim_ids":["sepsis-guidance"],"event_ids":[event["id"] for event in topic["review_events"]],"source_versions":"SSC current guideline accessed 2026-10-17","limitations":"None identified.","review_stage":"primary","expected_revision":topic["revision"],"change_reference":"","confirmed":True}

    def test_dashboard_exposes_pending_topic_and_approved_source(self):
        topic = api.dashboard()["topics"][0]
        self.assertEqual(topic["state"], "pending")
        self.assertEqual(topic["sources"][0]["id"], "ssc")
        self.assertEqual(topic["claims"][0]["id"], "sepsis-guidance")
        self.assertEqual(topic["review_events"][0]["trigger_type"], "legacy-detection")

    def test_focused_event_limits_required_claims_and_sources(self):
        claims = json.loads(api.CLAIM_MANIFEST.read_text())
        claims["claims"].append({"id":"sepsis-other","tool_id":"sepsis","scope":"Unrelated content","source_ids":["other"],"review_priority":"high","independent_review":"recommended"})
        api.CLAIM_MANIFEST.write_text(json.dumps(claims))
        manifest = json.loads(api.MANIFEST.read_text())
        manifest["sources"]["other"] = {"title":"Other", "url":"https://example.org/other"}
        manifest["tools"][0]["source_ids"].append("other")
        api.MANIFEST.write_text(json.dumps(manifest))
        api.review_event_module().create_event(
            "sepsis", "document-fingerprint", [{"source_id":"ssc","detail":"Section changed"}],
            source_ids=["ssc"],
        )
        topic = api.dashboard()["topics"][0]
        self.assertEqual(topic["review_claim_ids"], ["sepsis-guidance"])
        self.assertEqual(topic["review_source_ids"], ["ssc"])
        self.assertEqual(topic["review_events"][0]["evidence_scope"], "focused")

    def test_focused_review_resolves_event_without_unrelated_claim(self):
        api.review_event_module().create_event(
            "sepsis", "topic-monitor",
            [{"source_id":"ssc","title":"Focused guideline item","url":"https://example.org/ssc"}],
            source_ids=["ssc"],
        )
        topic = api.dashboard()["topics"][0]
        data = self.submission()
        data["expected_revision"] = topic["revision"]
        data["event_ids"] = [event["id"] for event in topic["review_events"]]
        api.record_review(data, "noah.pa")
        stored = api.review_event_module().list_events("sepsis", include_resolved=True)
        self.assertEqual(stored[0]["status"], "resolved")
        self.assertEqual(stored[0]["decision"], "no-change")

    def test_not_applicable_is_a_valid_reviewed_disposition(self):
        data = self.submission()
        data["decision"] = "not-applicable"
        result = api.record_review(data, "noah.pa")
        self.assertTrue(result["ok"])
        status = json.loads((api.REPO / "sepsis" / "last_checked.json").read_text())
        self.assertEqual(status["review_decision"], "not-applicable")

    def test_new_required_review_date_reopens_previously_reviewed_topic(self):
        status_path = api.REPO / "sepsis" / "last_checked.json"
        status_path.write_text(json.dumps({
            "date": "2026-10-11", "status": "no_change",
            "review_pending": False, "clinically_reviewed": True,
        }))
        manifest = json.loads(api.MANIFEST.read_text())
        manifest["tools"][0]["review_required_after"] = "2026-10-15"
        api.MANIFEST.write_text(json.dumps(manifest))

        self.assertEqual(api.dashboard()["topics"][0]["state"], "pending")

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

    def test_required_independent_review_needs_a_different_authenticated_user(self):
        claims = json.loads(api.CLAIM_MANIFEST.read_text())
        claims["claims"][0]["independent_review"] = "required"
        api.CLAIM_MANIFEST.write_text(json.dumps(claims))
        first = api.record_review(self.submission(), "noah.pa")
        self.assertTrue(first["independent_review_pending"])
        topic = api.dashboard()["topics"][0]
        self.assertEqual(topic["state"], "second_review")
        second = self.submission()
        second["review_stage"] = "secondary"
        second["expected_revision"] = topic["revision"]
        with self.assertRaisesRegex(api.ReviewError, "different authenticated reviewer"):
            api.record_review(second, "noah.pa")
        result = api.record_review(second, "reviewer.two")
        self.assertFalse(result["independent_review_pending"])
        self.assertEqual(api.dashboard()["topics"][0]["state"], "reviewed")

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
