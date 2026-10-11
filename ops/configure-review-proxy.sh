#!/usr/bin/env bash
set -euo pipefail

REPO=/var/www/noahpac-portal
NGINX_CONF=/etc/nginx/conf.d/noahpac.com.conf
AUTHELIA_CONF=/opt/stacks/authelia/config/configuration.yml
AUTHELIA_COMPOSE=/opt/stacks/authelia/compose.yaml
SNIPPET="${REPO}/ops/nginx/noahpac-review-portal.locations.conf"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
NGINX_BACKUP="${NGINX_CONF}.before-review-portal-${STAMP}"
AUTHELIA_BACKUP="${AUTHELIA_CONF}.before-review-portal-${STAMP}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this configurator with sudo." >&2
  exit 1
fi
for required in "${NGINX_CONF}" "${AUTHELIA_CONF}" "${AUTHELIA_COMPOSE}" "${SNIPPET}"; do
  if [[ ! -f "${required}" ]]; then
    echo "Required file not found: ${required}" >&2
    exit 1
  fi
done

cp --preserve=all "${NGINX_CONF}" "${NGINX_BACKUP}"
cp --preserve=all "${AUTHELIA_CONF}" "${AUTHELIA_BACKUP}"

rollback() {
  echo "Configuration failed; restoring backups." >&2
  cp --preserve=all "${NGINX_BACKUP}" "${NGINX_CONF}"
  cp --preserve=all "${AUTHELIA_BACKUP}" "${AUTHELIA_CONF}"
  docker compose -f "${AUTHELIA_COMPOSE}" restart authelia >/dev/null 2>&1 || true
  nginx -t >/dev/null 2>&1 && systemctl reload nginx || true
}
trap rollback ERR

python3 - "${NGINX_CONF}" "${SNIPPET}" "${AUTHELIA_CONF}" <<'PY'
from pathlib import Path
import sys

nginx_path, snippet_path, authelia_path = map(Path, sys.argv[1:])
nginx = nginx_path.read_text()
snippet = snippet_path.read_text().rstrip() + "\n\n"
begin = "    # Clinical Review Portal API — Authelia identity is forwarded only by Nginx."
anchor = "    # ── STI Treatment Reference — redirected to STI Guide ──"
if begin not in nginx:
    if nginx.count(anchor) != 1:
        raise SystemExit("Refusing Nginx edit: expected insertion anchor was not unique")
    nginx = nginx.replace(anchor, snippet + anchor)
    nginx_path.write_text(nginx)

authelia = authelia_path.read_text()
old = "resources: ['^/clinical-assistant(/.*)?$']"
new = "resources: ['^/(clinical-assistant|review)(/.*)?$']"
if new not in authelia:
    if authelia.count(old) != 1:
        raise SystemExit("Refusing Authelia edit: expected clinical-assistant rule was not unique")
    authelia = authelia.replace(old, new)
    authelia_path.write_text(authelia)
PY

nginx -t
docker compose -f "${AUTHELIA_COMPOSE}" exec -T authelia \
  authelia config validate --config /config/configuration.yml
docker compose -f "${AUTHELIA_COMPOSE}" restart authelia

healthy=0
for _attempt in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:9091/api/health >/dev/null; then
    healthy=1
    break
  fi
  sleep 1
done
if [[ "${healthy}" -ne 1 ]]; then
  echo "Authelia did not become healthy within 30 seconds." >&2
  exit 1
fi

systemctl reload nginx
trap - ERR
echo "Clinical Review Portal proxy and two-factor rule installed."
echo "Nginx backup: ${NGINX_BACKUP}"
echo "Authelia backup: ${AUTHELIA_BACKUP}"
