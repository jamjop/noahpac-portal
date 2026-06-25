---
name: Service worker cache busting
description: How to force the live site to serve updated files after deployment
---

The site has a root service worker (`sw.js`) with a `const CACHE = 'noahpac-vN'` version string.

**Rule 1 — Bump the cache version:** Every time changes are pushed to the live site at noahpac.com, bump the cache version (e.g. v3 → v4). Without this, the SW serves old cached files indefinitely.

**Why:** The browser only installs a new service worker when `sw.js` itself changes. Bumping `CACHE` changes `sw.js`, triggers SW update, old cache is deleted on activate, and fresh assets are fetched.

**Rule 2 — Page must auto-reload on SW takeover:** `index.html` must include a `controllerchange` listener that calls `window.location.reload()`. Without this, a page served by the old SW never re-renders with the new SW's fresh cache, even after the new SW activates.

**How it's implemented:** In `index.html` SW registration block:
```js
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();
});
```

**Rule 3 — Production is a static deploy, not Express:** `artifact.toml` uses `serve = "static"` with `publicDir = "artifacts/noahpac/dist/public"`. The `server.mjs` Express server runs only in development. Cache-control headers for sw.js in production come from Replit's static serving layer (already sends `no-cache`).

**How to apply:** Before any deployment: bump `CACHE` version in `sw.js`. The controllerchange auto-reload handles the rest for all users.
