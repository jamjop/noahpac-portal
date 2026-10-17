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
