---
name: noahpac static files git architecture
description: The static tool files are NOT in the regular git tree — only in checkpoint commits. Pushing to GitHub can wipe them.
---

## The problem

The pnpm monorepo git tree only tracks `artifacts/`, `lib/`, `scripts/`, and root config files. The static tool files (`index.html`, `shared.css`, `abx/`, `peds/`, `tccc/`, etc.) and `artifacts/noahpac/server.mjs` are **not** in the regular git index — they only exist in Replit checkpoint commits.

**Why:** Replit checkpoint commits are full workspace snapshots including untracked files. Normal git commits only include `git add`'ed files.

## What breaks

When a git push triggers Replit's git integration to sync the working directory with the git tree, all untracked tool files are deleted. The `artifacts/noahpac/package.json` dev script also reverts to `"vite ..."` (from git) instead of `"node server.mjs"` (correct runtime state).

## Recovery

1. Restore all tool files from the most recent checkpoint commit:
   ```bash
   git --no-optional-locks ls-tree -r --name-only <sha> | grep -v "^\.replit$|^artifacts/...|^lib/|^scripts/|^pnpm|^package\.json|^tsconfig" | while read f; do
     mkdir -p "$(dirname "$f")"
     git --no-optional-locks show "<sha>:$f" > "$f"
   done
   ```
2. Fix `artifacts/noahpac/package.json` dev script back to `"node server.mjs"`
3. Restore `artifacts/noahpac/server.mjs`: `git --no-optional-locks show <sha>:artifacts/noahpac/server.mjs > artifacts/noahpac/server.mjs`
4. Restart the `artifacts/noahpac: web` workflow

## How to apply

Any time a git push or sync is done for this project, expect tool files to disappear and follow recovery steps above. Find the latest checkpoint sha with `git --no-optional-locks log --all --oneline`.
