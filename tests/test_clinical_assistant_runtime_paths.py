import importlib.util
import os
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().parents[1] / "clinical-assistant" / "runtime_paths.py"


def load_paths():
    spec = importlib.util.spec_from_file_location("clinical_assistant_runtime_paths", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class RuntimePathTests(unittest.TestCase):
    def test_development_defaults_remain_inside_app_directory(self):
        with patch.dict(os.environ, {}, clear=True):
            paths = load_paths()
        self.assertEqual(paths.CHROMA_DIR, paths.APP_DIR / "chroma_data")
        self.assertEqual(paths.LIBRARY_DIR, paths.APP_DIR / "library")

    def test_production_state_directory_is_configurable(self):
        with patch.dict(os.environ, {
            "CLINICAL_ASSISTANT_STATE_DIR": "/var/lib/noahpac-clinical-assistant",
        }, clear=True):
            paths = load_paths()
        self.assertEqual(paths.CHROMA_DIR, Path("/var/lib/noahpac-clinical-assistant/chroma_data"))


if __name__ == "__main__":
    unittest.main()
