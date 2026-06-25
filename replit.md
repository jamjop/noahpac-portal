# noahpac — Clinical Reference Tools

Point-of-care clinical reference for Noah PA-C. Fast, offline-capable tools — no login, no tracking, all calculations run locally in the browser.

## Run & Operate

- `pnpm --filter @workspace/noahpac run dev` — run the web app (port auto-assigned)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite 7, Tailwind CSS 4, Wouter (routing)
- API: Express 5 (present but unused by tools — all tools are client-side)
- DB: PostgreSQL + Drizzle ORM (scaffolded, not yet used)

## Where things live

- `artifacts/noahpac/` — main React + Vite web app (landing page + routing)
- `artifacts/noahpac/src/pages/Home.tsx` — landing page with all tool cards
- `artifacts/noahpac/src/pages/ToolPage.tsx` — generic iframe wrapper for tool pages
- `artifacts/noahpac/src/App.tsx` — route definitions for all tools
- `artifacts/noahpac/public/<slug>/` — static vanilla HTML/CSS/JS for each tool
- `artifacts/noahpac/public/shared.css` — design tokens shared across all tools

## Tools

All tools are vanilla HTML/CSS/JS served as static files from `public/`, rendered inside a full-page iframe by the React SPA router.

| Route | Directory | Tool |
|---|---|---|
| `/screener` | `public/screener/` | USPSTF Screener |
| `/vaccines` | `public/vaccines/` | Immunization Schedule (ACIP) |
| `/calculators` | `public/calculators/` | Medical Calculators (13) |
| `/opioids` | `public/opioids/` | Opioid Conversion |
| `/sti` | `public/sti/` | STI Treatment |
| `/abx` | `public/abx/` | Antibiotic Reference |
| `/labs` | `public/labs/` | Lab Reference |
| `/tccc` | `public/tccc/` | TCCC / MARCH PAWS (PWA) |
| `/lookup` | `public/lookup/` | Code & Drug Lookup |
| `/drugref` | `public/drugref/` | Drug Reference |
| `/peds` | `public/peds/` | Pediatric Dosing |

**Lab Differentials** (`/labdiff`) — repo was empty at migration time; card present on landing page, tool pending.

## PWA & offline

Root-level files that power the PWA:

- `sw.js` — service worker, pre-caches all tool pages; cache key `noahpac-vN`
- `manifest.json` — web app manifest (name, icons, theme)
- `index.html` — landing page (also registers SW and listens for `controllerchange` to auto-reload on SW update)
- `apple-touch-icon.png` / `icon-192.png` / `icon-512.png` — app icons
- `favicon.svg` — browser tab icon

## Architecture decisions

- **iframe-per-tool** — Each tool is vanilla JS embedded in a full-page iframe. This preserves all existing functionality without a React rewrite and makes each tool independently deployable/updatable.
- **Static production deploy** — `artifact.toml` uses `serve = "static"` with `publicDir = "artifacts/noahpac/dist/public"`. The Express `server.mjs` runs only in dev; production is pure static files served by Replit.
- **Shared CSS** — All tools reference `/shared.css` for design tokens (light + dark mode). Served from `artifacts/noahpac/public/shared.css`.
- **No backend dependency** — All clinical logic runs client-side. API server is scaffolded but unused.
- **Dark mode** — `shared.css` and `index.html` both include `prefers-color-scheme: dark` overrides.

## Product

11-route clinical reference suite for point-of-care use: preventive screenings, calculators, drug references, field medicine protocols. 100% client-side — works offline, installable as a PWA, no account required.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Adding a new tool:** drop `index.html`, `app.js`, `style.css` into `artifacts/noahpac/public/<slug>/`, then add a route entry to `src/App.tsx`, a card to `src/pages/Home.tsx`, and the slug to the `TOOLS` array in `sw.js`. Bump the SW cache version too (see below).
- All tool `index.html` files reference `/shared.css` as a root-relative path — this works because Vite serves `public/` at the root.
- **Deploying changes? Bump the SW cache version.** Edit the first line of `sw.js` (`const CACHE = 'noahpac-vN'`) and increment N. Without this, the service worker serves stale cached files to all visitors indefinitely, even after a redeploy. The `controllerchange` listener in `index.html` auto-reloads the page once the new SW activates.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
