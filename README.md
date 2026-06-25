# noahpac.com

Clinical reference portal for [noahpac.com](https://noahpac.com). Built for point-of-care use — fast, mobile-friendly, no login required.

## Structure

This repo holds all deployed files for the portal.

**Root** — React/Vite SPA (`index.html` + `assets/`) serves as the portal shell and navigation layer. Source lives in `artifacts/noahpac/` in this repo.

**Tool subdirectories** — Pure static HTML/CSS/JS apps, each served by the Express server in `artifacts/noahpac/server.mjs`:

| Directory | App | Description |
|---|---|---|
| `labs/` | Lab Reference | 181 adult lab tests, 14 categories, searchable |
| `ddx/` | Lab Differentials | Differential diagnoses by lab value (high/low), 30+ labs |
| `sti/` | STI Treatment Reference | CDC-aligned empiric treatment by diagnosis |
| `sti-guide/` | STI Treatment Guidelines | CDC 2021 full guidelines with monitoring scripts |
| `abx/` | Antibiotic Reference | Empiric coverage for 17 infections across 6 categories |
| `antibiogram/` | ND Antibiogram | Local susceptibility data for 4 ND facilities (2023–2024); import-from-PDF feature |
| `empiric/` | Empiric Therapy + Local Susceptibility | Treatment recommendations cross-referenced with local antibiogram data |
| `allergy/` | Antibiotic Allergy Cross-Reactivity | Cross-reactivity reference for penicillin/cephalosporin/carbapenem allergies |
| `tccc/` | TCCC Field Reference | Tactical Combat Casualty Care quick reference (PWA) |
| `calculators/` | Clinical Calculators | ASCVD, CHA₂DS₂-VASc, Wells DVT/PE/PERC, CURB-65, CrCl, eGFR, MELD, PHQ-9, GAD-7, HEART, Ottawa rules |
| `opioids/` | Opioid Conversion | Equianalgesic conversion with MME and CDC risk thresholds |
| `naloxone/` | Naloxone & Overdose Reference | Dosing, routes, and ND overdose data; quarterly monitoring for ND HHS updates |
| `sepsis/` | Sepsis Screening | qSOFA + SOFA scoring |
| `wound/` | Wound Classification & Tetanus | Wound classification and tetanus prophylaxis guide |
| `lookup/` | Code & Drug Lookup | ICD-10, RxTerms, LOINC live search via NLM Clinical Tables API |
| `drugref/` | Drug Reference | FDA drug labels and recall search via openFDA |
| `peds/` | Pediatric Dosing | Broselow-style dosing card by weight or age |
| `vaccines/` | ACIP Immunization Schedule | Full birth-to-adult schedule |
| `screener/` | USPSTF Screener | USPSTF A/B/C preventive services by age and sex |
| `reportable/` | ND Reportable Conditions | ND HHS reportable conditions list; quarterly monitoring for updates |

**Shared assets:**
- `shared.css` — CSS design tokens and base styles used by all tool apps
- `favicon.svg`, `opengraph.jpg`, `robots.txt` — portal-level assets

## Deployment

The portal runs on Replit. The Express server (`artifacts/noahpac/server.mjs`) serves the SPA and all static tool subdirectories from the workspace root.

```
artifacts/noahpac/server.mjs   ← Express static server
artifacts/noahpac/src/         ← React/Vite SPA source
```

The `main` branch reflects deployed state. Deploy via Replit's publish flow.

## SPA Development

The React portal shell lives in `artifacts/noahpac/`. Built with Vite + wouter + Tailwind + Radix UI. Requires Node ≥20.19.

```bash
cd artifacts/noahpac
pnpm install
pnpm dev          # local dev server
pnpm build        # output → dist/public/
```

## Data Updates

The USPSTF screener (`screener/`) fetches live data from the Prevention TaskForce API. A weekly cron (Monday 04:17) runs `screener/update_uspstf.py`:

```bash
USPSTF_API_KEY=yourkey python3 screener/update_uspstf.py
```

An API key can be requested from uspstfpda@ahrq.gov.

Quarterly crons (Jan/Apr/Jul/Oct 15th) monitor ND HHS sources for updates:
- `reportable/check_updates.py` — ND reportable conditions PDF
- `sti-guide/check_updates.py` — CDC STI guidelines page
- `naloxone/check_updates.py` — ND HHS behavioral health data

All three send Pushover notifications on change.

## Backend Services

`antibiogram/` has a server-side PDF extraction API:

- **Service:** `antibiogram-api.service` (systemd, runs as www-data on 127.0.0.1:8765)
- **Source:** `/var/www/antibiogram/api_server.py` + `pdf_to_js.py`
- **Config:** `/etc/antibiogram-api.env` (holds `ANTHROPIC_API_KEY`)
- **Nginx:** proxied at `/antibiogram/api/`

Used by the import panel to extract facility data from ND HHS antibiogram PDFs via Claude vision.

## External APIs

| App | API |
|---|---|
| `lookup/` | [NLM Clinical Tables](https://clinicaltables.nlm.nih.gov/) |
| `drugref/` | [openFDA](https://open.fda.gov/) |
| `screener/` | [USPSTF Prevention TaskForce](https://www.uspreventiveservicestaskforce.org/apps/api.jsp) |
| `antibiogram/` | [Anthropic Claude](https://console.anthropic.com/) (server-side only, via API key) |

All other tools are fully offline — no external requests at runtime.

---

**Not medical advice.** All content should be verified against primary sources and individualized with clinical judgment.
