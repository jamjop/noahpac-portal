import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]


def load(name, relative_path):
    spec = importlib.util.spec_from_file_location(name, REPO / relative_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


urgent = load("urgent_clinical_monitor", "scripts/monitor-urgent-clinical-feeds.py")
fingerprints = load("clinical_fingerprint_monitor", "scripts/monitor-source-fingerprints.py")
watcher = load("pubmed_watcher_under_test", "lib/pubmed_watcher.py")
events = load("review_events_under_test", "lib/review_events.py")


class UrgentFeedParsingTests(unittest.TestCase):
    def test_parses_rss_items_with_stable_ids(self):
        raw = b"""<?xml version='1.0'?><rss><channel><item><title>Safety alert</title><link>/alert/1</link><guid>alert-1</guid></item></channel></rss>"""
        entries = urgent.rss_entries(raw, "https://www.fda.gov/feed.xml")
        self.assertEqual(entries, [{"id":"alert-1","title":"Safety alert","url":"https://www.fda.gov/alert/1"}])

    def test_parses_cdc_han_identifiers_and_deduplicates(self):
        raw = b'<a href="/han/2026/han00520.html">CDCHAN-00520 Example notice</a><a href="/han/2026/han00520.html">Duplicate CDCHAN-00520</a>'
        entries = urgent.han_entries(raw, "https://www.cdc.gov/han/")
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]["id"], "CDCHAN-00520")

    def test_prefers_canonical_han_url_when_link_text_disagrees(self):
        raw = b'<a href="/han/php/notices/han00533.html">CDCHAN-00532 Incorrect index text</a>'
        entries = urgent.han_entries(raw, "https://www.cdc.gov/han/site.html")
        self.assertEqual(entries[0]["id"], "CDCHAN-00533")

    def test_rejects_non_https_or_unmapped_channels(self):
        errors = urgent.validate({"schema_version":1,"channels":[{"id":"bad","type":"rss","url":"http://example.test/feed","tool_ids":[]}]})
        self.assertEqual(len(errors), 2)


class FingerprintMappingTests(unittest.TestCase):
    def test_maps_changed_source_to_all_affected_tools(self):
        claims = {"claims":[
            {"tool_id":"a","source_ids":["source"]},
            {"tool_id":"b","source_ids":["source","other"]},
            {"tool_id":"c","source_ids":["other"]},
        ]}
        self.assertEqual(fingerprints.affected_tools("source", claims), ["a", "b"])

    def test_generates_bounded_text_diff(self):
        diff = fingerprints.text_diff("Heading\nDose 5 mg", "Heading\nDose 10 mg")
        self.assertIn("-Dose 5 mg", diff)
        self.assertIn("+Dose 10 mg", diff)


class FocusedReviewEventTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        (root / "clinical-review.json").write_text(json.dumps({
            "sources": {"pubmed":{"title":"PubMed","url":"https://pubmed.ncbi.nlm.nih.gov/"},"other":{"title":"Other","url":"https://example.org/"}},
            "tools": [{"id":"tool","source_ids":["pubmed","other"]}],
        }))
        (root / "clinical-claims.json").write_text(json.dumps({"claims":[
            {"id":"literature","tool_id":"tool","source_ids":["pubmed"]},
            {"id":"other-claim","tool_id":"tool","source_ids":["other"]},
        ]}))
        events.REPO = root
        events.EVENT_DIR = root / "events"

    def tearDown(self):
        self.tmp.cleanup()

    def test_pubmed_event_targets_only_pubmed_backed_claim(self):
        event = events.create_event("tool", "topic-monitor", [{"pmid":"123","title":"New paper"}])
        self.assertEqual(event["claim_ids"], ["literature"])
        self.assertEqual(event["source_ids"], ["pubmed"])
        self.assertEqual(event["evidence_scope"], "focused")

    def test_duplicate_evidence_is_deduplicated(self):
        first = events.create_event("tool", "topic-monitor", [{"pmid":"123"}])
        second = events.create_event("tool", "topic-monitor", [{"pmid":"123"}])
        self.assertEqual(first["id"], second["id"])
        self.assertEqual(len(events.list_events("tool")), 1)

    def test_exact_source_url_targets_its_claim(self):
        event = events.create_event(
            "tool", "topic-monitor",
            [{"url":"https://example.org/", "detail":"Page version changed"}],
        )
        self.assertEqual(event["source_ids"], ["other"])
        self.assertEqual(event["claim_ids"], ["other-claim"])


class ReviewEvidencePersistenceTests(unittest.TestCase):
    def test_clean_monitor_run_preserves_pending_independent_review(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "last_checked.json"
            path.write_text(json.dumps({
                "date":"2026-10-16", "status":"review_required", "review_pending":True,
                "independent_review_pending":True, "primary_reviewer":"reviewer.one",
                "primary_reviewed_at":"2026-10-16T12:00:00+00:00", "review_claim_ids":["claim"],
            }))
            watcher.save_last_checked(Path(directory), "no_change")
            result = json.loads(path.read_text())
            self.assertEqual(result["status"], "review_required")
            self.assertTrue(result["independent_review_pending"])
            self.assertEqual(result["primary_reviewer"], "reviewer.one")
            self.assertEqual(result["review_claim_ids"], ["claim"])


if __name__ == "__main__":
    unittest.main()
