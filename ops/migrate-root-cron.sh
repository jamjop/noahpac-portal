#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Run this script with sudo." >&2
  exit 1
fi

stamp=$(date -u +%Y%m%dT%H%M%SZ)
backup="/root/noahpac-root-crontab-${stamp}.bak"
current=$(mktemp)
filtered=$(mktemp)
trap 'rm -f "$current" "$filtered"' EXIT

if ! crontab -l >"$current" 2>/dev/null; then
  : >"$current"
fi

install -o root -g root -m 600 "$current" "$backup"

# These jobs are replaced by the versioned systemd units under ops/systemd.
grep -Ev \
  '(/var/www/noahpac-portal/(screener/update_uspstf\.py|antibiogram/auto_update\.py|[^[:space:]]+/check_updates\.py)|/opt/scripts/(uspstf-email-report\.sh|quarterly-email-report\.py|antibiogram-email-report\.sh))' \
  "$current" >"$filtered" || true

removed=$(( $(wc -l <"$current") - $(wc -l <"$filtered") ))
crontab "$filtered"

echo "Removed ${removed} superseded Noah PA-C cron line(s)."
echo "Root crontab backup: ${backup}"
