#!/usr/bin/env python3
"""Regression coverage for the authoritative Vaccines monitor sources."""

import sys
import unittest
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO))

from vaccines import check_updates  # noqa: E402


class VaccineMonitorSourceTests(unittest.TestCase):
    def test_acog_source_uses_current_maternal_schedule(self):
        expected = (
            "https://www.acog.org/womens-health/infographics/"
            "maternal-immunization-schedule"
        )
        self.assertEqual(check_updates.ACOG_IMMU_URL, expected)
        source = next(item for item in check_updates.PAGE_SOURCES if item["id"] == "acog_page_date")
        self.assertEqual(source["url"], expected)
        self.assertEqual(source["name"], "ACOG Maternal Immunization Schedule")
        self.assertNotIn("immunization-for-women", source["url"])


if __name__ == "__main__":
    unittest.main()
