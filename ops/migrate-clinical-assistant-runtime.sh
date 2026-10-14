#!/usr/bin/env bash
set -euo pipefail

REPO=/var/www/noahpac-portal
SERVICE=clinical-assistant-api.service
SOURCE_VENV="${REPO}/clinical-assistant/.venv"
SOURCE_CHROMA="${REPO}/clinical-assistant/chroma_data"
TARGET_VENV=/opt/noahpac/clinical-assistant/venv
TARGET_CHROMA=/var/lib/noahpac-clinical-assistant/chroma_data
UNIT_SOURCE="${REPO}/ops/systemd/${SERVICE}"
UNIT_TARGET="/etc/systemd/system/${SERVICE}"
UNIT_BACKUP=""
MOVED_VENV=0
MOVED_CHROMA=0

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this migration with sudo." >&2
  exit 1
fi
if [[ "$(readlink -f "${REPO}")" != "/var/www/noahpac-portal" ]]; then
  echo "Unexpected repository path." >&2
  exit 1
fi
for required in "${UNIT_SOURCE}" "${UNIT_TARGET}" /etc/clinical-assistant-api.env; do
  if [[ ! -f "${required}" ]]; then
    echo "Required file is missing: ${required}" >&2
    exit 1
  fi
done
if [[ -e "${SOURCE_VENV}" && -e "${TARGET_VENV}" ]]; then
  echo "Both source and target virtual environments exist; refusing to guess." >&2
  exit 1
fi
if [[ -e "${SOURCE_CHROMA}" && -e "${TARGET_CHROMA}" ]]; then
  echo "Both source and target Chroma stores exist; refusing to guess." >&2
  exit 1
fi
if [[ ! -d "${SOURCE_VENV}" && ! -d "${TARGET_VENV}" ]]; then
  echo "Clinical Assistant virtual environment was not found." >&2
  exit 1
fi
if [[ ! -d "${SOURCE_CHROMA}" && ! -d "${TARGET_CHROMA}" ]]; then
  echo "Clinical Assistant Chroma store was not found." >&2
  exit 1
fi

rollback() {
  status=$?
  trap - EXIT
  if [[ ${status} -eq 0 ]]; then
    return
  fi
  echo "Migration failed; restoring the previous runtime layout." >&2
  systemctl stop "${SERVICE}" >/dev/null 2>&1 || true
  if [[ -n "${UNIT_BACKUP}" && -f "${UNIT_BACKUP}" ]]; then
    cp -a "${UNIT_BACKUP}" "${UNIT_TARGET}"
  fi
  if [[ ${MOVED_CHROMA} -eq 1 && -d "${TARGET_CHROMA}" && ! -e "${SOURCE_CHROMA}" ]]; then
    mv "${TARGET_CHROMA}" "${SOURCE_CHROMA}"
  fi
  if [[ ${MOVED_VENV} -eq 1 && -d "${TARGET_VENV}" && ! -e "${SOURCE_VENV}" ]]; then
    mv "${TARGET_VENV}" "${SOURCE_VENV}"
  fi
  systemctl daemon-reload || true
  systemctl start "${SERVICE}" || true
  exit "${status}"
}
trap rollback EXIT

UNIT_BACKUP="$(mktemp /tmp/clinical-assistant-api.service.XXXXXX)"
cp -a "${UNIT_TARGET}" "${UNIT_BACKUP}"
systemctl stop "${SERVICE}"

install -d -o root -g root -m 0755 /opt/noahpac /opt/noahpac/clinical-assistant
install -d -o www-data -g www-data -m 0750 /var/lib/noahpac-clinical-assistant

if [[ -d "${SOURCE_VENV}" ]]; then
  mv "${SOURCE_VENV}" "${TARGET_VENV}"
  MOVED_VENV=1
fi
chown -R root:root "${TARGET_VENV}"

if [[ -d "${SOURCE_CHROMA}" ]]; then
  mv "${SOURCE_CHROMA}" "${TARGET_CHROMA}"
  MOVED_CHROMA=1
fi
chown -R www-data:www-data "${TARGET_CHROMA}"
chmod 0750 "${TARGET_CHROMA}"

install -o root -g root -m 0644 "${UNIT_SOURCE}" "${UNIT_TARGET}"
systemctl daemon-reload
systemctl enable "${SERVICE}" >/dev/null
systemctl start "${SERVICE}"

healthy=0
for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8766/health >/dev/null; then
    healthy=1
    break
  fi
  sleep 1
done
if [[ ${healthy} -ne 1 ]]; then
  systemctl --no-pager --full status "${SERVICE}" >&2 || true
  journalctl -u "${SERVICE}" -n 40 --no-pager >&2 || true
  exit 1
fi

rm -f "${UNIT_BACKUP}"
UNIT_BACKUP=""
trap - EXIT

echo "Clinical Assistant runtime migration completed."
echo "Virtual environment: ${TARGET_VENV}"
echo "Chroma state: ${TARGET_CHROMA}"
curl -fsS http://127.0.0.1:8766/health
echo
