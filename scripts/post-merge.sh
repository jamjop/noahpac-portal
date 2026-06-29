#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

# ── Single-source-of-truth for static page assets ────────────────────────────
# The page folders (abx, sti, labs, drugref, tccc, lookup) live at the workspace
# root and are served directly by artifacts/noahpac/server.mjs (SITE_ROOT).
# We symlink them into artifacts/noahpac/public/ so that Vite's build step also
# picks them up, and so that "the other location" always references the canonical
# root copy rather than containing a separate, potentially diverged file.
WORKSPACE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_DIR="$WORKSPACE_ROOT/artifacts/noahpac/public"
mkdir -p "$PUBLIC_DIR"
for page in abx sti labs drugref tccc lookup; do
  ln -sfn "$WORKSPACE_ROOT/$page" "$PUBLIC_DIR/$page"
done
