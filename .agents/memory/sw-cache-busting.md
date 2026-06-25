---
name: Service worker cache busting
description: How to force the live site to serve updated files after deployment
---

The site has a root service worker (`sw.js`) with a `const CACHE = 'noahpac-vN'` version string.

**Rule 1 — Bump the cache version:** Every time changes are pushed to the live site at noahpac.com, bump the cache version (e.g. v2 → v3). Without this, the SW serves old cached files indefinitely.

**Why:** The browser only installs a new service worker when `sw.js` itself changes. Bumping `CACHE` changes `sw.js`, triggers SW update, old cache is deleted on activate, and fresh assets are fetched.

**Rule 2 — Server must serve sw.js with no-store:** `sw.js` and `manifest.json` must be served with `Cache-Control: no-store` unconditionally (not gated on NODE_ENV). Without this, the browser's HTTP cache serves the old `sw.js` and the browser never sees the updated version — bumping the cache version has no effect.

**How it's implemented:** `artifacts/noahpac/server.mjs` has a middleware that sets `Cache-Control: no-store` for `/sw.js` and `/manifest.json` before the static file handler runs.

**How to apply:** Before any deployment that changes HTML, CSS, JS, or asset files: (1) bump the CACHE version in `sw.js`, (2) redeploy so the new server middleware is live.
