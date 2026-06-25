---
name: Service worker cache busting
description: How to force the live site to serve updated files after deployment
---

The site has a root service worker (`sw.js`) with a `const CACHE = 'noahpac-vN'` version string.

**Rule:** Every time changes are pushed to the live site at noahpac.com, bump the cache version (e.g. v2 → v3). Without this, the SW serves old cached files indefinitely regardless of what's on the server.

**Why:** The browser only installs a new service worker when `sw.js` itself changes. Bumping `CACHE` changes `sw.js`, triggers SW update, old cache is deleted on activate, and fresh assets are fetched.

**How to apply:** Edit the first line of `sw.js` before any deployment that changes HTML, CSS, JS, or asset files.
