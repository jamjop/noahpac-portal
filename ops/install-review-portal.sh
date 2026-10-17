#!/usr/bin/env bash
set -euo pipefail

REPO=/var/www/noahpac-portal
UNIT=noahpac-review-portal.service
SERVICE_USER=noahpac-review

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this installer with sudo." >&2
  exit 1
fi
if [[ "$(readlink -f "${REPO}")" != "/var/www/noahpac-portal" ]]; then
  echo "Unexpected repository path." >&2
  exit 1
fi

if ! getent group "${SERVICE_USER}" >/dev/null; then
  groupadd --system "${SERVICE_USER}"
fi
if ! id "${SERVICE_USER}" >/dev/null 2>&1; then
  useradd --system --gid "${SERVICE_USER}" --home-dir /nonexistent --shell /usr/sbin/nologin "${SERVICE_USER}"
fi

install -d -o root -g "${SERVICE_USER}" -m 2770 /var/lib/noahpac-monitor
install -d -o root -g "${SERVICE_USER}" -m 2770 /var/lib/noahpac-monitor/review-events
touch /var/lib/noahpac-monitor/review-audit.jsonl /var/lib/noahpac-monitor/review.lock
chown root:"${SERVICE_USER}" /var/lib/noahpac-monitor/review-audit.jsonl /var/lib/noahpac-monitor/review.lock
chmod 0660 /var/lib/noahpac-monitor/review-audit.jsonl /var/lib/noahpac-monitor/review.lock

topics=(abx allergy als antibiogram anticoag calculators empiric naloxone opioids pals peds reportable screener sepsis steroids sti-guide tccc toxicology triage vaccines wound)
for topic in "${topics[@]}"; do
  status="${REPO}/${topic}/last_checked.json"
  if [[ ! -e "${status}" ]]; then
    printf '{\n  "status": "not_checked"\n}\n' > "${status}"
  fi
  chown root:"${SERVICE_USER}" "${status}"
  chmod 0664 "${status}"
done

install -m 0644 "${REPO}/ops/systemd/${UNIT}" "/etc/systemd/system/${UNIT}"
systemctl daemon-reload
systemctl enable "${UNIT}"
systemctl restart "${UNIT}"
systemctl --no-pager --full status "${UNIT}"

echo
echo "Review API installed. Add the versioned Nginx locations and Authelia"
echo "two-factor rule described in docs/CLINICAL_REVIEW_PORTAL.md, then reload them."
