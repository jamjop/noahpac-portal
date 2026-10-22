import unittest
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]


class ClinicalAssistantSecurityTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.api = (REPO / "clinical-assistant" / "api_server.py").read_text()
        cls.ingest = (REPO / "clinical-assistant" / "ingest.py").read_text()
        cls.unit = (REPO / "ops" / "systemd" / "clinical-assistant-api.service").read_text()
        cls.installer = (REPO / "ops" / "install-clinical-assistant-dependencies.sh").read_text()

    def test_chroma_remains_embedded_with_a_fixed_collection(self):
        for source in (self.api, self.ingest):
            self.assertIn("chromadb.PersistentClient", source)
            self.assertIn('get_or_create_collection(name="clinical_docs")', source)
            self.assertNotIn("chromadb.HttpClient", source)
            self.assertNotIn("trust_remote_code", source)

    def test_api_remains_loopback_only(self):
        self.assertIn('app.run(host="127.0.0.1", port=8766, debug=False)', self.api)

    def test_systemd_sandbox_preserves_the_compensating_controls(self):
        for directive in (
            "User=www-data",
            "NoNewPrivileges=true",
            "ProtectSystem=strict",
            "ProtectHome=true",
            "CapabilityBoundingSet=",
            "ReadWritePaths=/var/lib/noahpac-clinical-assistant",
        ):
            self.assertIn(directive, self.unit)

    def test_dependency_installer_checks_and_restarts_the_service(self):
        self.assertIn('from importlib.metadata import PackageNotFoundError, version', self.installer)
        self.assertIn('Pinned Clinical Assistant dependency versions match requirements.', self.installer)
        self.assertIn('systemctl restart "${SERVICE}"', self.installer)
        self.assertIn("http://127.0.0.1:8766/health", self.installer)


if __name__ == "__main__":
    unittest.main()
