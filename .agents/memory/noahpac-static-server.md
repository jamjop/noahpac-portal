---
name: noahpac static server setup
description: How the noahpac clinical tools site is served on Replit after the origin/replit branch overwrote the monorepo structure.
---

## Setup

The compiled static site (React home page + 20 vanilla HTML/CSS/JS tool directories) lives at the **workspace root** (`/home/runner/workspace/`). There is no build step — the compiled assets are committed directly.

`artifacts/noahpac/` contains only a minimal Express static server:
- `server.mjs` — serves `path.join(__dirname, '..', '..')` (workspace root) on `process.env.PORT`
- `package.json` — `"dev": "node server.mjs"`, only dependency is `express`

**Why:** When `git pull origin/replit` ran, it replaced the monorepo with the production static site at root. React source (`src/`, `vite.config.ts`) is gone; only compiled output remains. Rebuilding a Vite pipeline would require recreating the source, so the simpler path was a static server.

## Workspace config

`pnpm-workspace.yaml` was recovered from git history (commit `5f9657b`).  
Root `package.json` was restored (workspace-level scripts only, no runtime deps).  
Node.js 22 was installed via `installProgrammingLanguage({ language: "nodejs-22" })` — the environment had no Node.js runtime initially.

## Artifact

- Artifact ID: `artifacts/noahpac`
- Preview path: `/`
- Port: 23012
- Dev command: `pnpm --filter @workspace/noahpac run dev`

## If React source needs to be rebuilt

The compiled home page JS is at `assets/index-T5aQEoVE.js`. To modify the home page, the React source would need to be recreated from scratch (it was overwritten by git pull). The static HTML tool pages can be edited directly in their respective directories at root.
