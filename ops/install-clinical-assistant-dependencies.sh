#!/usr/bin/env bash
set -euo pipefail

REPO=/var/www/noahpac-portal
PYTHON=/opt/noahpac/clinical-assistant/venv/bin/python3
REQUIREMENTS="${REPO}/clinical-assistant/requirements.txt"
SERVICE=clinical-assistant-api.service

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this installer with sudo." >&2
  exit 1
fi
if [[ "$(readlink -f "${REPO}")" != "/var/www/noahpac-portal" ]]; then
  echo "Unexpected repository path." >&2
  exit 1
fi
for required in "${PYTHON}" "${REQUIREMENTS}"; do
  if [[ ! -e "${required}" ]]; then
    echo "Required file is missing: ${required}" >&2
    exit 1
  fi
done

"${PYTHON}" -m pip install \
  --disable-pip-version-check \
  --upgrade-strategy only-if-needed \
  --requirement "${REQUIREMENTS}"
"${PYTHON}" -m pip check

# The environment is executable infrastructure, not application state.
chown -R root:root /opt/noahpac/clinical-assistant/venv

cd "${REPO}/clinical-assistant"
CLINICAL_ASSISTANT_STATE_DIR=/var/lib/noahpac-clinical-assistant \
  "${PYTHON}" -c 'import anthropic, chromadb, flask, pdf2image, pdfplumber, voyageai; import ingest; print("Clinical Assistant API and ingestion imports passed.")'

systemctl restart "${SERVICE}"
for _ in {1..15}; do
  if curl -fsS http://127.0.0.1:8766/health; then
    echo
    echo "Clinical Assistant dependencies updated and service restarted successfully."
    exit 0
  fi
  sleep 1
done

systemctl --no-pager --full status "${SERVICE}" || true
echo "Clinical Assistant did not become healthy after the dependency update." >&2
exit 1
