#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Run this script with sudo." >&2
  exit 1
fi

repo=/var/www/noahpac-portal
env_file=/etc/noahpac-monitor.env
unit_dir=/etc/systemd/system

if [[ ! -f ${env_file} ]]; then
  echo "Missing ${env_file}. Copy ops/noahpac-monitor.env.example there and add rotated credentials first." >&2
  exit 1
fi

for required in PUSHOVER_USER PUSHOVER_TOKEN USPSTF_API_KEY; do
  if ! grep -Eq "^${required}=.+" "$env_file"; then
    echo "${env_file} is missing a non-empty ${required}. Add a rotated value before installation." >&2
    exit 1
  fi
done

chmod 600 "$env_file"
chown root:root "$env_file"

NOAHPAC_REPO="$repo" /usr/bin/python3 \
  "$repo/scripts/check-clinical-sources.py" --check-config
NOAHPAC_REPO="$repo" /usr/bin/python3 \
  "$repo/scripts/monitor-urgent-clinical-feeds.py" --check
NOAHPAC_REPO="$repo" /usr/bin/python3 \
  "$repo/scripts/monitor-source-fingerprints.py" --check

units=(
  noahpac-quarterly-monitor.service
  noahpac-quarterly-monitor.timer
  noahpac-high-risk-monitor.service
  noahpac-high-risk-monitor.timer
  noahpac-uspstf-update.service
  noahpac-uspstf-update.timer
  noahpac-uspstf-report.service
  noahpac-uspstf-report.timer
  noahpac-antibiogram-update.service
  noahpac-antibiogram-update.timer
  noahpac-monitor-failure@.service
  noahpac-source-links.service
  noahpac-source-links.timer
  noahpac-urgent-clinical.service
  noahpac-urgent-clinical.timer
  noahpac-source-fingerprints.service
  noahpac-source-fingerprints.timer
)

for unit in "${units[@]}"; do
  install -o root -g root -m 644 "$repo/ops/systemd/$unit" "$unit_dir/$unit"
done

systemctl disable --now noahpac-guideline-check.timer 2>/dev/null || true
systemctl daemon-reload
systemd-analyze verify "${units[@]/#/$unit_dir/}"
systemctl enable --now \
  noahpac-quarterly-monitor.timer \
  noahpac-high-risk-monitor.timer \
  noahpac-uspstf-update.timer \
  noahpac-uspstf-report.timer \
  noahpac-antibiogram-update.timer \
  noahpac-source-links.timer \
  noahpac-urgent-clinical.timer \
  noahpac-source-fingerprints.timer

systemctl list-timers --all --no-pager \
  noahpac-quarterly-monitor.timer \
  noahpac-high-risk-monitor.timer \
  noahpac-uspstf-update.timer \
  noahpac-uspstf-report.timer \
  noahpac-antibiogram-update.timer \
  noahpac-source-links.timer \
  noahpac-urgent-clinical.timer \
  noahpac-source-fingerprints.timer
