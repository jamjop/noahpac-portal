#!/usr/bin/env bash
set -euo pipefail

TARGET="${NOAHPAC_DEPLOY_TARGET:-/var/www/noahpac-portal}"
EXPECTED_COMMIT="${1:-}"

if [[ "$(readlink -f "$TARGET")" != "/var/www/noahpac-portal" ]]; then
  echo "Refusing to deploy to unexpected target: $TARGET" >&2
  exit 1
fi

cd "$TARGET"

# Monitors rewrite */last_checked.json at runtime (and the review portal writes them when a clinician records a
# review), so a tracked one (triage/last_checked.json) would otherwise make this check fail after every run.
# Those files are runtime state, not hand edits, and must be preserved. Everything else still blocks the deploy.
# If an incoming commit changes one of them, the fast-forward merge below refuses to overwrite the local copy.
if [[ -n "$(git status --porcelain --untracked-files=no -- . ':(exclude,glob)**/last_checked.json')" ]]; then
  echo "Refusing to deploy over tracked local changes." >&2
  exit 1
fi

git fetch --tags origin main
REMOTE_COMMIT="$(git rev-parse origin/main)"

if [[ -n "$EXPECTED_COMMIT" && "$REMOTE_COMMIT" != "$EXPECTED_COMMIT" ]]; then
  echo "origin/main is $REMOTE_COMMIT, expected $EXPECTED_COMMIT" >&2
  exit 1
fi

if ! git merge-base --is-ancestor HEAD "$REMOTE_COMMIT"; then
  echo "origin/main is not a fast-forward from the deployed commit." >&2
  exit 1
fi

git merge --ff-only "$REMOTE_COMMIT"
node scripts/check-site-health.mjs --local
git diff --check

if [[ "${RUN_BROWSER_TESTS:-0}" == "1" ]]; then
  tests/node_modules/.bin/playwright test --project=chromium --config=tests/playwright.config.ts
fi

echo "Deployed $(git rev-parse --short HEAD) to $TARGET"
