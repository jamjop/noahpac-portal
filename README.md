# noahpac.com

Clinical reference portal for [noahpac.com](https://noahpac.com). Built for point-of-care use — fast, mobile-friendly, no login required.

## Structure

Pure static HTML/CSS/JS — no build step, no framework. Nginx serves files directly from this repo's working directory.

**Root** (`index.html`) — static portal homepage and navigation shell.

**Tool subdirectories** — each is a self-contained app:

| Directory | App | Description |
|---|---|---|
| `labs/` | Lab Reference | 181 adult lab tests, 14 categories, searchable |
| `ddx/` | Lab Differentials | Differential diagnoses by lab value (high/low), 30+ labs |
| `abx/` | Antibiotic Reference | Empiric coverage for 19 infections across 6 categories; sources audited Jun 2026 |
| `empiric/` | Empiric Therapy + Local Susceptibility | Treatment recommendations cross-referenced with local antibiogram data |
| `allergy/` | Antibiotic Allergy Cross-Reactivity | Cross-reactivity reference for penicillin/cephalosporin/carbapenem allergies |
| `sti-guide/` | STI Treatment Guidelines | CDC 2021 full guidelines; includes doxy-PEP (CDC 2023 interim guidance) and chancroid |
| `antibiogram/` | ND Antibiogram | Local susceptibility data for 4 ND facilities; auto-updated monthly from HHS PDFs |
| `tccc/` | TCCC Field Reference | CoTCCC 1 May 2026 guidelines; PWA with offline support |
| `vaccines/` | ACIP / AAP / ACOG Immunization Schedule | Birth-to-adult schedule; ACIP 2026; patient age/condition screener with AAP and ACOG source toggle |
| `calculators/` | Clinical Calculators | 19 calculators: ASCVD, CHA₂DS₂-VASc, Wells DVT/PE/PERC, CURB-65, CrCl, eGFR, MELD/MELD-Na, PHQ-9, GAD-7, HEART, Ottawa Knee/Ankle, PECARN, Alvarado, Anion Gap, Accutane dosing, RCRI, Corrected Calcium, Weight Change, Pregnancy EDD |
| `als/` | Advanced Life Support | AHA 2020 ACLS algorithms: VF/pVT, Asystole/PEA, Bradycardia, Tachycardia, Post-Arrest Care (TTM), ACS, Stroke; PWA |
| `pals/` | Pediatric Advanced Life Support | AHA 2020 PALS algorithms: weight-based cardiac arrest, arrhythmia, and post-arrest care; Broselow-matched dosing; PWA |
| `opioids/` | Opioid Conversion | Equianalgesic conversion with MME and CDC risk thresholds |
| `naloxone/` | Naloxone & Overdose Reference | Dosing, routes, and ND overdose data |
| `sepsis/` | Sepsis Screening | qSOFA + SOFA scoring |
| `wound/` | Wound Classification & Tetanus | Wound classification and tetanus prophylaxis guide |
| `lookup/` | Code & Drug Lookup | ICD-10, RxTerms, LOINC live search via NLM Clinical Tables API |
| `drugref/` | Drug Reference | FDA drug labels and recall search via openFDA |
| `peds/` | Pediatric Dosing | Broselow-style dosing card by weight or age |
| `screener/` | USPSTF Screener | USPSTF A/B/C preventive services by age and sex; data auto-updated weekly |
| `reportable/` | ND Reportable Conditions | ND HHS reportable conditions list |

**Shared assets:**
- `shared.css` — CSS design tokens and base styles used by all tool apps
- `favicon.svg`, `opengraph.jpg`, `robots.txt` — portal-level assets

## Deployment

Served by nginx on the Linux server. The `main` branch reflects deployed state.

```bash
# Deploy
git -C /var/www/noahpac-portal pull

# Force-reset (e.g. after Replit force-push to main)
git -C /var/www/noahpac-portal reset --hard origin/main
```

No build step required.

## TCCC — PWA / Service Worker

`tccc/` is a Progressive Web App with a service worker (`tccc/sw.js`). The cache name must be bumped after any content change so browsers discard stale cached files:

```js
// tccc/sw.js
const CACHE = 'tccc-v3';  // increment on each content update
```

Current cache version: **tccc-v3** (updated for CoTCCC 1 May 2026 guidelines).

## Automated Data Updates

### Weekly
| Script | Schedule | Description |
|--------|----------|-------------|
| `screener/update_uspstf.py` | Mon 04:17 | Fetches USPSTF recommendations from Prevention TaskForce API; writes to `screener/data/` (gitignored). Requires `USPSTF_API_KEY` env var. API key: request from uspstfpda@ahrq.gov |

### Monthly
| Script | Schedule | Description |
|--------|----------|-------------|
| `antibiogram/auto_update.py` | 1st of month 04:23 | Downloads latest ND HHS antibiogram PDFs and extracts data via Claude vision; writes to `antibiogram/data/` and commits + pushes to git. Requires `ANTHROPIC_API_KEY` |

### Quarterly (Jan / Apr / Jul / Oct — 15th)

All scripts use PubMed E-utilities (esearch + esummary) and/or page-hash watching. Send Pushover notifications on detected changes. Require `PUSHOVER_USER` and `PUSHOVER_TOKEN` env vars.

| Script | Cron time | Watches |
|--------|-----------|---------|
| `reportable/check_updates.py` | 04:30 | ND HHS notifiable disease list |
| `sti-guide/check_updates.py` | 04:45 | CDC STI guidelines page + PubMed: CDC STI MMWR, doxy-PEP, gonorrhea resistance |
| `naloxone/check_updates.py` | 05:00 | ND HHS behavioral health / overdose data |
| `abx/check_updates.py` | 05:15 | PubMed: IDSA, SHEA, SSC, WSES, AAP, ACG, ATS, AGA (9 searches) |
| `tccc/check_updates.py` | 05:30 | PubMed: CoTCCC / J Spec Oper Med publications (3 searches) |
| `vaccines/check_updates.py` | 05:45 | PubMed: ACIP MMWR, AAP COID/Pediatrics, ACOG Ob/Gyn; CDC, AAP, and ACOG schedule page dates |
| `calculators/check_updates.py` | 06:15 | PubMed: ACC/AHA (ASCVD, AFib, chest pain, periop), ACCP/ESC (VTE), ATS/BTS (pneumonia), KDIGO (eGFR/CrCl), AASLD (MELD), USPSTF (depression/anxiety), Ottawa/PECARN/Alvarado, AAD (isotretinoin), ACOG (EDD) |
| `peds/check_updates.py` | 06:30 | PubMed: AHA/ILCOR PALS, AAP/IDSA pediatric infections, AES/PECARN status epilepticus, ASHP/ACCP/IDSA vancomycin monitoring, ACEP/AAP procedural sedation |
| `als/check_updates.py` | 06:35 | PubMed: AHA ACLS, ILCOR adult resuscitation, ERC guidelines, AHA/ACC arrhythmia, post-arrest TTM, ACS/STEMI, AHA/ASA stroke |
| `pals/check_updates.py` | 06:40 | PubMed: AHA PALS, ILCOR pediatric resuscitation, ERC pediatric, AHA/ACC pediatric arrhythmia, pediatric post-arrest care, IO access |
| `opioids/check_updates.py` | 06:45 | PubMed: CDC 2022 opioid prescribing guideline, MME conversion factors, buprenorphine/OUD guidance, methadone safety, high-dose thresholds |
| `wound/check_updates.py` | 06:50 | PubMed: ACIP tetanus recommendations, wound prophylaxis evidence, SSI/wound classification guidelines |
| `sepsis/check_updates.py` | 06:55 | PubMed: Surviving Sepsis Campaign, Sepsis-3/SOFA updates, SSC bundles, septic shock management |
| `allergy/check_updates.py` | 07:00 | PubMed: AAAAI/ACAAI beta-lactam cross-reactivity guidelines, penicillin allergy delabeling, R1 side-chain evidence, cephalosporin hypersensitivity |

Quarterly email report runs at **07:25** (25 min after last check script). Monitoring scripts send a Pushover notification when new publications or page changes are detected. They do **not** auto-update content — changes require manual review and a pull request.

## Backend Services

`antibiogram/` has a server-side PDF extraction API:

- **Service:** `antibiogram-api.service` (systemd, runs as www-data on 127.0.0.1:8765)
- **Source:** `antibiogram/api_server.py`
- **Config:** `/etc/antibiogram-api.env` (holds `ANTHROPIC_API_KEY`)
- **Nginx:** proxied at `/antibiogram/api/`

Used by the import panel to extract facility data from ND HHS antibiogram PDFs via Claude vision.

## External APIs

| App | API |
|---|---|
| `lookup/` | [NLM Clinical Tables](https://clinicaltables.nlm.nih.gov/) |
| `drugref/` | [openFDA](https://open.fda.gov/) |
| `screener/` | [USPSTF Prevention TaskForce](https://www.uspreventiveservicestaskforce.org/apps/api.jsp) |
| `antibiogram/` | [Anthropic Claude](https://console.anthropic.com/) (server-side only) |

All other tools are fully offline — no external requests at runtime.

---

**Not medical advice.** All content should be verified against primary sources and individualized with clinical judgment.
