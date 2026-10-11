# noahpac.com

Clinical reference portal for [noahpac.com](https://noahpac.com). Built for point-of-care use — fast, mobile-friendly, no login required.

## Structure

Pure static HTML/CSS/JS — no build step, no framework. Nginx serves files directly from this repo's working directory.

**Root** (`index.html`) — static portal homepage and navigation shell.

**Clinical updates** (`updates/`, backed by `clinical-changelog.json`) — public record of substantive clinical-content, safety, and governance changes.

**Tool subdirectories** — each is a self-contained app:

| Directory | App | Description |
|---|---|---|
| `labs/` | Lab Reference | 181 adult lab tests, 14 categories, searchable |
| `ddx/` | Lab Differentials | Differential diagnoses by lab value (high/low), 30+ labs |
| `abx/` | Antibiotic Reference | Empiric coverage for 19 infections across 6 categories; sources audited Jun 2026 |
| `empiric/` | Empiric Therapy + Local Susceptibility | Treatment recommendations cross-referenced with local antibiogram data |
| `allergy/` | Antibiotic Allergy Cross-Reactivity | Cross-reactivity reference for penicillin/cephalosporin/carbapenem allergies |
| `sti-guide/` | STI Treatment Guidelines | CDC 2021 treatment guidance plus final CDC 2024 doxy-PEP guidance and current product-availability alerts |
| `antibiogram/` | ND Antibiogram | Local susceptibility data from ND facilities; checked quarterly against HHS PDFs with extraction validation and human-review holds |
| `tccc/` | TCCC Field Reference | CoTCCC 1 May 2026 guidelines; PWA with offline support |
| `vaccines/` | ACIP / AAP / ACOG Immunization Schedule | Birth-to-adult schedule; ACIP 2026; patient age/condition screener with AAP and ACOG source toggle |
| `calculators/` | Clinical Calculators | 24 calculators and screens, including ASCVD, VTE tools, renal equations and CKD G/A staging, MELD and FIB-4, PHQ-9, GAD-7, AUDIT-C, the single-question drug-use screen, and acute-care decision rules |
| `als/` | Advanced Life Support | AHA 2020 ACLS algorithms: VF/pVT, Asystole/PEA, Bradycardia, Tachycardia, Post-Arrest Care (TTM), ACS, Stroke; PWA |
| `pals/` | Pediatric Advanced Life Support | AHA 2020 PALS algorithms: weight-based cardiac arrest, arrhythmia, and post-arrest care; Broselow-matched dosing; PWA |
| `opioids/` | Opioid Conversion | Equianalgesic conversion with MME and CDC risk thresholds |
| `naloxone/` | Naloxone & Overdose Reference | Dosing, routes, and ND overdose data |
| `sepsis/` | Sepsis Screening | qSOFA + SOFA scoring |
| `wound/` | Wound Classification & Tetanus | Wound classification and tetanus prophylaxis guide |
| `lookup/` | Code & Terminology Lookup | ICD-10-CM, CMS HCPCS Level II, RxTerms, and LOINC live search via NLM Clinical Tables API |
| `drugref/` | FDA Label Search | FDA structured label sections and recall search via openFDA |
| `peds/` | Pediatric Dosing | Weight-based dosing from measured weight; optional age is used only for airway sizing |
| `screener/` | USPSTF Screener | USPSTF A/B/C preventive services by age and sex; data auto-updated weekly |
| `reportable/` | ND Reportable Conditions | ND HHS reportable conditions list |

**Shared assets:**
- `shared.css` — CSS design tokens and base styles used by all tool apps
- `favicon.svg`, `opengraph.jpg`, `robots.txt` — portal-level assets

## Deployment

Served by Nginx on the Linux server. The `main` branch is the source of truth and production only accepts fast-forward deployments of reviewed commits.

```bash
# Deploy the exact commit merged to main
cd /var/www/noahpac-portal
./scripts/deploy-production.sh <full-merged-commit-sha>
```

No build step is required. See [`docs/RELEASE_RUNBOOK.md`](docs/RELEASE_RUNBOOK.md) for validation, rollback, and physical-device review procedures. Do not force-reset the production checkout.

## Automated quality and health checks

- Pull requests and pushes run the CSS token check, internal route/asset validation, and the complete Playwright regression suite.
- The browser suite includes compact-header, dark-mode, accessibility, clinical behavior, and phone/tablet viewport checks.
- A scheduled production monitor checks all public routes, external references, openFDA and NLM APIs, review freshness metadata, and security headers.
- Run the checks manually with `node scripts/check-site-health.mjs --local` or `node scripts/check-site-health.mjs --remote`.

## TCCC — PWA / Service Worker

`tccc/` is a Progressive Web App with a service worker (`tccc/sw.js`). The cache name must be bumped after any content change so browsers discard stale cached files:

```js
// tccc/sw.js
const CACHE = 'tccc-v11';  // increment on each content update
```

Current protocol cache versions: **TCCC v11**, **ALS v17**, and **PALS v16**.

## Automated Data Updates

### Weekly
| Script | Schedule | Description |
|--------|----------|-------------|
| `screener/update_uspstf.py` | Mon 04:17 | Fetches USPSTF recommendations from Prevention TaskForce API; writes to `screener/data/` (gitignored). Requires `USPSTF_API_KEY` env var. API key: request from uspstfpda@ahrq.gov |

### Quarterly (Jan / Apr / Jul / Oct — 1st)
| Script | Schedule | Description |
|--------|----------|-------------|
| `antibiogram/auto_update.py` | 1st at 04:23 | Downloads new ND HHS antibiogram PDFs, extracts data, holds implausible output for human review, and commits validated updates. Requires `ANTHROPIC_API_KEY` plus Pushover credentials. |

### Quarterly (Jan / Apr / Jul / Oct — 15th)

All scripts use PubMed E-utilities (esearch + esummary) and/or page-hash watching. Send Pushover notifications on detected changes. Require `PUSHOVER_USER` and `PUSHOVER_TOKEN` env vars.

| Script | Execution | Watches |
|--------|-----------|---------|
| `reportable/check_updates.py` | sequential | ND HHS notifiable disease list |
| `sti-guide/check_updates.py` | sequential | CDC STI guidelines page + PubMed: CDC STI MMWR, doxy-PEP, gonorrhea resistance |
| `naloxone/check_updates.py` | sequential | ND HHS behavioral health / overdose data |
| `abx/check_updates.py` | sequential | PubMed: IDSA, SHEA, SSC, WSES, AAP, ACG, ATS, AGA (9 searches) |
| `tccc/check_updates.py` | sequential | PubMed: CoTCCC / J Spec Oper Med publications (3 searches) |
| `vaccines/check_updates.py` | sequential | PubMed: ACIP MMWR, AAP COID/Pediatrics, ACOG Ob/Gyn; CDC, AAP, and ACOG schedule page dates |
| `calculators/check_updates.py` | sequential | PubMed: ACC/AHA, ACCP/ESC, ATS/BTS, KDIGO, AASLD (MELD/FIB-4), USPSTF and validated behavioral-health screening, Ottawa/PECARN/Alvarado, AAD, and ACOG |
| `peds/check_updates.py` | sequential | PubMed: AHA/ILCOR PALS, AAP/IDSA pediatric infections, AES/PECARN status epilepticus, ASHP/ACCP/IDSA vancomycin monitoring, ACEP/AAP procedural sedation |
| `als/check_updates.py` | sequential | PubMed: AHA ACLS, ILCOR adult resuscitation, ERC guidelines, AHA/ACC arrhythmia, post-arrest TTM, ACS/STEMI, AHA/ASA stroke |
| `pals/check_updates.py` | sequential | PubMed: AHA PALS, ILCOR pediatric resuscitation, ERC pediatric, AHA/ACC pediatric arrhythmia, pediatric post-arrest care, IO access |
| `opioids/check_updates.py` | sequential | PubMed: CDC 2022 opioid prescribing guideline, MME conversion factors, buprenorphine/OUD guidance, methadone safety, high-dose thresholds |
| `wound/check_updates.py` | sequential | PubMed: ACIP tetanus recommendations, wound prophylaxis evidence, SSI/wound classification guidelines |
| `sepsis/check_updates.py` | sequential | PubMed: Surviving Sepsis Campaign, Sepsis-3/SOFA updates, SSC bundles, septic shock management |
| `allergy/check_updates.py` | sequential | PubMed: AAAAI/ACAAI beta-lactam cross-reactivity guidelines, penicillin allergy delabeling, R1 side-chain evidence, cephalosporin hypersensitivity |
| `steroids/check_updates.py` | sequential | PubMed: glucocorticoid equivalency, HPA-axis suppression, Endocrine Society tapering, perioperative stress dosing |
| `anticoag/check_updates.py` | sequential | PubMed: VKA/DOAC reversal, antiplatelet hemostasis, and CHEST periprocedural guidance |
| `toxicology/check_updates.py` | sequential | PubMed: acetaminophen/NAC, toxic alcohols, antidotes, cardiotoxic overdose, and lipid emulsion guidance |

`scripts/run-quarterly-monitoring.py` runs topic checks sequentially for both the monthly high-risk set and the full quarterly set, sending each consolidated report only after every selected topic has completed. Monitoring scripts send Pushover notifications when sources change. They do **not** rewrite clinical content; detected changes remain visibly pending until `scripts/acknowledge-clinical-review.py` records a source-backed human review and its protected audit entry.

Systemd unit templates and secure setup instructions are in `ops/systemd/` and `docs/CLINICAL_MONITORING.md`. Secrets belong in root-only `/etc/noahpac-monitor.env`, never in root's crontab.

Clinical ownership, review state, cadence, and authoritative-source mappings
for all 26 tools are recorded in `clinical-review.json`. The weekly source-link
check and shared systemd failure alerts are documented in
`docs/CLINICAL_GOVERNANCE.md`. Independently reviewable calculation vectors live
in `tests/clinical-regression-vectors.json`. Substantive public changes are
recorded in `clinical-changelog.json` and displayed at `/updates/`.

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
| `drugref/` (FDA Label Search) | [openFDA](https://open.fda.gov/) |
| `screener/` | [USPSTF Prevention TaskForce](https://www.uspreventiveservicestaskforce.org/apps/api.jsp) |
| `antibiogram/` | [Anthropic Claude](https://console.anthropic.com/) (server-side only) |

All other tools are fully offline — no external requests at runtime.

---

**Not medical advice.** All content should be verified against primary sources and individualized with clinical judgment.
