# Clinical Assistant dependency security

Last reviewed: 2026-10-22

## ChromaDB 1.5.9

The current stable ChromaDB release is affected by four published advisories:
CVE-2026-45829, CVE-2026-45830, CVE-2026-45831, and CVE-2026-45833. Upstream
does not currently provide a patched stable release.

The affected server and remote-model surfaces are not exposed by this service:

- Chroma is opened as an in-process `PersistentClient`; no Chroma HTTP server
  is started or proxied.
- The application always opens the fixed local `clinical_docs` collection.
- Web requests can query that collection but cannot create, update, or delete
  collections, select an embedding implementation, provide a model repository,
  or enable `trust_remote_code`.
- The Flask API binds to `127.0.0.1:8766`, is proxied only through the
  Authelia-protected `/clinical-assistant/api/` location, and is rate-limited.
- The systemd unit runs as `www-data` with no capabilities, strict filesystem
  protection, and write access limited to the Chroma state directory.

These controls are locked by `tests/test_clinical_assistant_security.py`.
Upgrade ChromaDB once a stable release explicitly fixes the four advisories,
then re-run ingestion, API health, and retrieval regression checks before
closing the alerts.

## Pillow

Pillow is pinned to 13.0.0 or later to exclude the TIFF memory-safety issues
affecting 12.3.0 and earlier. PDF/image ingestion remains restricted to the
administrator-maintained clinical document library.
