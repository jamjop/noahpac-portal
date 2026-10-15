#!/usr/bin/env python3
"""fetch_page: cdc.gov 403 retry with urllib's default User-Agent, then Wayback fallback."""

import io
import sys
import unittest
import urllib.error
from pathlib import Path
from unittest import mock

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "lib"))

import pubmed_watcher as pw  # noqa: E402

CDC = "https://www.cdc.gov/std/treatment-guidelines/default.htm"
OTHER = "https://www.example.org/page"
CUSTOM_UA = "noahpac-sti-guide-monitor/1.0"


class FakeResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


def http_403(url):
    return urllib.error.HTTPError(url, 403, "Forbidden", {}, io.BytesIO(b""))


def ua_of(request):
    return request.get_header("User-agent")


class FetchPageTests(unittest.TestCase):
    def run_fetch(self, url, behaviours):
        """behaviours: list of callables(request) -> FakeResponse or raises, consumed in order."""
        seen = []

        def fake_urlopen(request, timeout=None):
            seen.append(request)
            return behaviours[len(seen) - 1](request)

        with mock.patch.object(pw.urllib.request, "urlopen", side_effect=fake_urlopen):
            try:
                result = pw.fetch_page(url, CUSTOM_UA)
                error = None
            except Exception as exc:  # noqa: BLE001
                result, error = None, exc
        return result, error, seen

    def test_identified_request_accepted_is_used_as_is(self):
        result, error, seen = self.run_fetch(CDC, [lambda r: FakeResponse(b"ok")])
        self.assertEqual(result, "ok")
        self.assertIsNone(error)
        self.assertEqual(len(seen), 1)
        self.assertEqual(ua_of(seen[0]), CUSTOM_UA)

    def test_cdc_403_retries_once_without_custom_user_agent(self):
        def blocked(request):
            raise http_403(request.full_url)

        result, error, seen = self.run_fetch(CDC, [blocked, lambda r: FakeResponse(b"page")])
        self.assertEqual(result, "page")
        self.assertIsNone(error)
        self.assertEqual(len(seen), 2)
        self.assertEqual(ua_of(seen[0]), CUSTOM_UA)
        # No explicit header: urllib itself supplies its stock "Python-urllib/x.y" agent when it opens the connection.
        self.assertIsNone(ua_of(seen[1]))
        self.assertEqual(seen[1].full_url, CDC)

    def test_cdc_subdomain_also_retries(self):
        url = "https://stacks.cdc.gov/view/cdc/123"

        def blocked(request):
            raise http_403(request.full_url)

        result, _, seen = self.run_fetch(url, [blocked, lambda r: FakeResponse(b"x")])
        self.assertEqual(result, "x")
        self.assertEqual(len(seen), 2)

    def test_lookalike_host_does_not_retry(self):
        url = "https://www.notcdc.gov.example.org/page"

        def blocked(request):
            raise http_403(request.full_url)

        _, error, seen = self.run_fetch(url, [blocked, blocked, blocked])
        # direct failed, no default-UA retry, only the Wayback fallback was tried
        self.assertIsInstance(error, RuntimeError)
        self.assertEqual(len(seen), 2)
        self.assertTrue(seen[1].full_url.startswith(pw.WAYBACK_SAVE_BASE))

    def test_non_cdc_403_goes_straight_to_wayback(self):
        def blocked(request):
            raise http_403(request.full_url)

        result, _, seen = self.run_fetch(OTHER, [blocked, lambda r: FakeResponse(b"archived")])
        self.assertEqual(result, "archived")
        self.assertEqual(len(seen), 2)
        self.assertTrue(seen[1].full_url.startswith(pw.WAYBACK_SAVE_BASE))
        self.assertEqual(ua_of(seen[1]), CUSTOM_UA)

    def test_cdc_non_403_error_does_not_retry(self):
        def server_error(request):
            raise urllib.error.HTTPError(request.full_url, 500, "boom", {}, io.BytesIO(b""))

        _, _, seen = self.run_fetch(CDC, [server_error, lambda r: FakeResponse(b"archived")])
        self.assertEqual(len(seen), 2)
        self.assertTrue(seen[1].full_url.startswith(pw.WAYBACK_SAVE_BASE))

    def test_cdc_retry_blocked_falls_back_to_wayback(self):
        def blocked(request):
            raise http_403(request.full_url)

        result, _, seen = self.run_fetch(CDC, [blocked, blocked, lambda r: FakeResponse(b"archived")])
        self.assertEqual(result, "archived")
        self.assertEqual(len(seen), 3)
        self.assertTrue(seen[2].full_url.startswith(pw.WAYBACK_SAVE_BASE))

    def test_everything_failing_raises_with_both_causes_in_the_message(self):
        def blocked(request):
            raise http_403(request.full_url)

        def timed_out(request):
            raise TimeoutError("The read operation timed out")

        _, error, _ = self.run_fetch(CDC, [blocked, blocked, timed_out])
        self.assertIsInstance(error, RuntimeError)
        self.assertIn("Wayback Machine fallback also failed", str(error))
        self.assertIn("timed out", str(error))


if __name__ == "__main__":
    unittest.main()
