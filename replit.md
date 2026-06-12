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

## Architecture decisions

- **iframe-per-tool** — Each tool is vanilla JS embedded in a full-page iframe. This preserves all existing functionality without a React rewrite and makes each tool independently deployable/updatable.
- **Shared CSS at root** — All tools reference `/shared.css` for design tokens. Served from `public/shared.css`.
- **Wouter router** — Lightweight client-side router; each `/slug` route renders a `ToolPage` iframe with the matching static file.
- **No backend dependency** — All clinical logic runs client-side. API server is scaffolded but unused.

## Product

15-tool clinical reference suite for point-of-care use: preventive screenings, calculators, drug references, field medicine protocols. 100% client-side — works offline, no account required.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Adding a new tool: drop `index.html`, `app.js`, `style.css` into `public/<slug>/`, then add a route entry to `src/App.tsx` and a card to `src/pages/Home.tsx`.
- All tool `index.html` files reference `/shared.css` as a root-relative path — this works because Vite serves `public/` at the root.
- The TCCC tool is a PWA with `manifest.json` and `sw.js` — the service worker registers from within the iframe context.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
