---
name: Artifacts Rebuild Plan
description: Plan to restore the pnpm workspace and artifacts/ folder in Replit so the dev environment is properly structured.
---

# Artifacts Folder Rebuild Plan

## Goal
Restore the pnpm workspace structure (`pnpm-workspace.yaml` + `artifacts/`) so Replit has a properly configured dev environment. Both files are gitignored — zero impact on the git repo or nginx hosting.

## What Was There Before (and why it was bad)
- `artifacts/noahpac/public/` held **copies** of the tool files (calculators, labs, abx, etc.)
- This meant duplicate files that could drift out of sync with the root-level originals
- An unused `artifacts/api-server/` (Express, no routes used by any tool)

## New Approach (cleaner)
No duplicate files. `artifacts/noahpac/` is just a thin Replit artifact wrapper that points its static server at the workspace root. All tool files stay at root. One source of truth.

---

## Step-by-Step Plan

### Step 1: Restore `pnpm-workspace.yaml`
```yaml
packages:
  - 'artifacts/*'
  - 'lib/*'
  - 'scripts'

catalog:
  # pins to add as needed
```
This file is already in `.gitignore` — safe to create.

### Step 2: Create `artifacts/noahpac/`

**`artifacts/noahpac/package.json`**
- name: `@workspace/noahpac`
- devDependency: `vite` (or just use node's built-in http for simplicity)
- scripts: `dev` → starts the static server on `$PORT`

**`artifacts/noahpac/.replit-artifact/artifact.toml`**
```toml
[[services]]
name = "Web"
localPort = 5000   # or $PORT
paths = ["/"]

[info]
title = "Clinical Reference Tools"
```

**Static server:**
Rather than Vite (overkill for pure static), move `server.js` into `artifacts/noahpac/` and have its `dev` script run it. The server root stays `__dirname + '/../../'` (i.e., workspace root). This way the existing `server.js` logic is reused, just properly packaged.

Alternatively, use `vite preview` or `npx serve` — both can point to the workspace root.

### Step 3: Update workflow
- Rename/reconfigure the "Start application" workflow to use:
  `pnpm --filter @workspace/noahpac run dev`
- Or keep `node server.js` if we leave `server.js` at the root and just add the `pnpm-workspace.yaml`

### Step 4: Decide on `artifacts/api-server/` and `artifacts/mockup-sandbox/`
- **api-server**: Skip — never used, all tools are client-side
- **mockup-sandbox**: Optional — only needed if canvas design work resumes. Canvas iframes for "Warm Clinical" and "Warm Approachable" are stale anyway (components gone)

---

## Minimal vs Full Rebuild

| Option | Work | Result |
|---|---|---|
| **Minimal** | Add `pnpm-workspace.yaml` + thin `artifact.toml` | Proper Replit artifact registration, workflow unchanged |
| **Full** | Above + move server into artifact package | Cleaner separation, `pnpm --filter` workflow |

Minimal is sufficient for now and can be done in one short session.

---

## Files to Create (minimal)
1. `pnpm-workspace.yaml` — workspace root, lists `artifacts/*`, `lib/*`, `scripts`
2. `artifacts/noahpac/.replit-artifact/artifact.toml` — Replit routing config
3. `artifacts/noahpac/package.json` — `@workspace/noahpac`, `dev` script
4. Keep `server.js` at root, referenced by the dev script

## Files Already in Place
- `lib/` (api-spec, api-zod, api-client-react, db) — untouched
- `scripts/` — untouched
- All tool files at workspace root — untouched
- `.gitignore` — already ignores `artifacts/`, `pnpm-workspace.yaml`
