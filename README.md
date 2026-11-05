# noahpac.com

Clinical reference portal for [noahpac.com](https://noahpac.com). The public
point-of-care tools are fast, mobile-friendly, and require no login. The
Clinical Assistant and Clinical Review Portal are private operator tools
protected by Authelia two-factor authentication.

## Structure

The public interface is primarily static HTML/CSS/JavaScript with no framework
or build step. Nginx serves files directly from the production checkout. Three
small loopback-only services support antibiogram import, the Clinical
Assistant, and the Clinical Review Portal.

**Root** (`index.html`) — static portal homepage and navigation shell.

**Clinical updates** (`updates/`, backed by `clinical-changelog.json`) — public record of substantive clinical-content, safety, and governance changes.

**Clinical Assistant** (`clinical-assistant/`) — Authelia-protected,
document-grounded reference assistant backed by a loopback-only Python service
and a local Chroma index.

**Clinical Review Portal** (`clinical-review/`, published privately at
`/review/`) — Authelia-protected clinician acknowledgement queue backed by a
loopback-only, sandboxed Python service.

**Tool subdirectories** — each is a self-contained app:

| Directory | App | Description |
|---|---|---|
| `labs/` | Laboratory Reference | Searchable adult reference ranges, units, and concise interpretation notes |
| `ddx/` | Lab Value DDx | Searchable high/low differential diagnoses organized by laboratory value |
| `abx/` | Antibiotic Reference | Searchable empiric guidance by syndrome, organism, and anatomic site |
| `empiric/` | Empiric Therapy + Local Susceptibility | Treatment recommendations cross-referenced with local antibiogram data |
| `allergy/` | Antibiotic Allergy Cross-Reactivity | Cross-reactivity reference for penicillin/cephalosporin/carbapenem allergies |
| `sti-guide/` | STI Treatment Guidelines | CDC 2021 treatment guidance plus final CDC 2024 doxy-PEP guidance and current product-availability alerts |
| `antibiogram/` | ND Antibiogram | Local susceptibility data from ND facilities; checked quarterly against HHS PDFs with extraction validation and human-review holds |
| `anticoag/` | Anticoagulation Reversal | Reversal and urgent-management reference for anticoagulants and antiplatelet agents |
| `steroids/` | Steroid Conversion | Corticosteroid equivalency, HPA-axis risk context, tapering, and stress-dose guidance |
| `toxicology/` | Toxicology and Antidotes | Toxidrome, decontamination, antidote, and poison-center reference |
| `triage/` | Adult Urgency & Disposition | Conservative adult urgency support using emergency threats, vital signs, red flags, and safety-net documentation |
| `tccc/` | TCCC Field Reference | CoTCCC 1 May 2026 guidelines; PWA with offline support |
| `vaccines/` | ACIP / AAP / ACOG Immunization Schedule | Birth-to-adult schedule; ACIP 2026; patient age/condition screener with AAP and ACOG source toggle |
| `calculators/` | Clinical Calculators | Point-of-care calculators, validated screens, and conversions; Accutane dosing remains first for the owner's workflow |
| `readiness/` | Active-Duty Care Support | Public, browser-only visit, PHA/IMR, sleep/fatigue, and functional-limitation workflows with neutral documentation summaries; never determines PRAP, profile, deployment, or duty status |
| `als/` | Advanced Life Support | Offline-capable arrest, bradycardia, tachycardia, post-arrest, ACS, stroke, and opioid-emergency reference |
| `pals/` | Pediatric Advanced Life Support | Offline-capable pediatric arrest, respiratory, shock, arrhythmia, and weight-based medication reference |
| `opioids/` | Opioid MME Estimator | Current-regimen MME, equianalgesic conversion, and CDC risk context |
| `naloxone/` | Naloxone & Overdose Reference | Dosing, routes, and ND overdose data |
| `sepsis/` | Sepsis Screening | SIRS, qSOFA, SOFA, septic-shock assessment, and documentation summary |
| `wound/` | Wound Classification & Tetanus | Wound classification and tetanus prophylaxis guide |
| `lookup/` | Code & Terminology Lookup | ICD-10-CM, CMS HCPCS Level II, RxTerms, and LOINC live search via NLM Clinical Tables API |
| `drugref/` | FDA Label Search | FDA structured label sections and recall search via openFDA |
| `peds/` | Pediatric Dosing | Weight-based dosing from measured weight; optional age is used only for airway sizing |
| `screener/` | USPSTF Screener | USPSTF A/B/C preventive services by age and sex; data auto-updated weekly |
| `reportable/` | ND Reportable Conditions | ND HHS reportable conditions list |
| `documents/` | Clinical Documents | Searchable screening forms, medication education, and musculoskeletal patient resources |

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

## Offline protocol apps and service workers

TCCC, ALS, and PALS are offline-capable Progressive Web Apps. Increment the
`CACHE` value at the top of `tccc/sw.js`, `als/sw.js`, or `pals/sw.js` whenever
that app's cached content changes so browsers discard stale files. Those three
service-worker files are the source of truth; cache versions are intentionally
not duplicated here.

## Clinical monitoring and automated data updates

Automation discovers potentially relevant source changes; it does not perform
clinical review or automatically rewrite recommendations, doses, thresholds,
or interpretations. Pending findings remain visible until a clinician records
a source-backed review.

The production schedules are systemd timers:

| Cadence | Job | Schedule |
|---|---|---|
| Daily | Urgent FDA MedWatch and CDC Health Alert Network surveillance | 04:05 |
| Weekly | USPSTF data refresh and email report | Monday 04:17 / 04:30 |
| Weekly | Stable source-document fingerprints | Tuesday 04:35 |
| Weekly | Authoritative-source link availability | Tuesday 04:50 |
| Monthly | High-risk topic surveillance | Fifth day at 04:30 |
| Quarterly | ND antibiogram refresh | Jan/Apr/Jul/Oct 1 at 04:23 |
| Quarterly | Complete topic surveillance and consolidated report | Jan/Apr/Jul/Oct 15 at 04:30 |

### Structured data refreshes

| Script | Schedule | Description |
|--------|----------|-------------|
| `screener/update_uspstf.py` | Mon 04:17 | Fetches USPSTF recommendations from Prevention TaskForce API; writes to `screener/data/` (gitignored). Requires `USPSTF_API_KEY` env var. API key: request from uspstfpda@ahrq.gov |
| `antibiogram/auto_update.py` | Jan/Apr/Jul/Oct 1 at 04:23 | Downloads new ND HHS antibiogram PDFs, extracts data, holds implausible output for human review, and commits validated updates. Requires `ANTHROPIC_API_KEY` plus Pushover credentials. |

### Topic surveillance

Topic scripts use PubMed E-utilities and/or approved official-source checks.
The high-risk subset runs monthly; the complete set runs quarterly. They send
Pushover notifications when a change is detected and require `PUSHOVER_USER`
and `PUSHOVER_TOKEN` from the root-only environment file.

| Script | Cadence | Watches |
|--------|---------|---------|
| `reportable/check_updates.py` | Quarterly | ND HHS notifiable disease list |
| `sti-guide/check_updates.py` | Monthly + quarterly | CDC STI guidance, doxy-PEP, and gonorrhea resistance |
| `naloxone/check_updates.py` | Monthly + quarterly | ND HHS behavioral-health and overdose data |
| `abx/check_updates.py` | Monthly + quarterly | IDSA, SHEA, SSC, WSES, AAP, ACG, ATS, and AGA publications |
| `empiric/check_updates.py` | Monthly + quarterly | Empiric-treatment and antimicrobial-resistance guidance |
| `tccc/check_updates.py` | Monthly + quarterly | CoTCCC and Journal of Special Operations Medicine publications |
| `vaccines/check_updates.py` | Monthly + quarterly | ACIP, AAP, ACOG, and official schedule sources |
| `calculators/check_updates.py` | Monthly + quarterly | Guideline and validation sources for deployed calculators and screening tools |
| `peds/check_updates.py` | Monthly + quarterly | Pediatric resuscitation, infection, sedation, seizure, and dosing guidance |
| `als/check_updates.py` | Monthly + quarterly | Adult resuscitation, arrhythmia, post-arrest, ACS, and stroke guidance |
| `pals/check_updates.py` | Monthly + quarterly | Pediatric resuscitation, arrhythmia, post-arrest, and IO-access guidance |
| `opioids/check_updates.py` | Monthly + quarterly | Opioid prescribing, MME factors, buprenorphine/OUD, and methadone safety |
| `wound/check_updates.py` | Quarterly | Tetanus, wound prophylaxis, and wound-classification guidance |
| `sepsis/check_updates.py` | Monthly + quarterly | Surviving Sepsis, Sepsis-3/SOFA, bundles, and shock management |
| `allergy/check_updates.py` | Monthly + quarterly | Beta-lactam cross-reactivity, delabeling, and side-chain evidence |
| `steroids/check_updates.py` | Monthly + quarterly | Equivalency, HPA-axis suppression, tapering, and stress dosing |
| `anticoag/check_updates.py` | Monthly + quarterly | Anticoagulant reversal and periprocedural guidance |
| `toxicology/check_updates.py` | Monthly + quarterly | Acetaminophen/NAC, toxic alcohols, antidotes, cardiotoxic overdose, and lipid emulsion |
| `triage/check_updates.py` | Monthly + quarterly | Adult triage, deterioration, emergency-warning, and disposition sources |

`scripts/run-quarterly-monitoring.py` runs topic checks sequentially for both the monthly high-risk set and the full quarterly set, sending each consolidated report only after every selected topic has completed. Monitoring scripts send Pushover notifications when sources change. They do **not** rewrite clinical content; detected changes remain visibly pending until `scripts/acknowledge-clinical-review.py` records a source-backed human review and its protected audit entry.

Systemd unit templates and secure setup instructions are in `ops/systemd/` and `docs/CLINICAL_MONITORING.md`. Secrets belong in root-only `/etc/noahpac-monitor.env`, never in root's crontab.

The private review workflow, service installer, Nginx locations, and Authelia
boundary are documented in [`docs/CLINICAL_REVIEW_PORTAL.md`](docs/CLINICAL_REVIEW_PORTAL.md).
The Clinical Assistant's production virtual environment and Chroma index live
outside the web root; migration and recovery details are in
[`docs/CLINICAL_ASSISTANT_RUNTIME.md`](docs/CLINICAL_ASSISTANT_RUNTIME.md).
Its direct Python dependencies are pinned in
`clinical-assistant/requirements.txt` and installed with the documented
root-only dependency installer.

Clinical ownership, review state, cadence, and authoritative-source mappings
for all 28 registered tools are recorded in `clinical-review.json`. The weekly
source-link check and shared systemd failure alerts are documented in
`docs/CLINICAL_GOVERNANCE.md`. Independently reviewable calculation vectors live
in `tests/clinical-regression-vectors.json`. Substantive public changes are
recorded in `clinical-changelog.json` and displayed at `/updates/`.

## Backend services

All application services bind to loopback and are exposed only through their
documented Nginx locations:

| Service | Loopback | Purpose | Configuration / state |
|---|---|---|---|
| `antibiogram-api.service` | `127.0.0.1:8765` | Extract facility data from ND HHS antibiogram PDFs for the import workflow | `/etc/antibiogram-api.env` |
| `clinical-assistant-api.service` | `127.0.0.1:8766` | Retrieve from the local Chroma reference index and produce document-grounded answers; Authelia-protected | `/etc/clinical-assistant-api.env`, `/var/lib/noahpac-clinical-assistant/` |
| `noahpac-review-portal.service` | `127.0.0.1:8767` | Authenticated clinical-review queue, evidence packets, and append-only audit workflow | `/var/lib/noahpac-monitor/` |

See `docs/CLINICAL_ASSISTANT_RUNTIME.md` and
`docs/CLINICAL_REVIEW_PORTAL.md` before changing either private service or its
authentication boundary.

## External services and APIs

| Context | App / job | Dependency |
|---|---|---|
| Public runtime | `lookup/` | [NLM Clinical Tables](https://clinicaltables.nlm.nih.gov/) |
| Public runtime | `drugref/` | [openFDA](https://open.fda.gov/) |
| Private runtime | `clinical-assistant/` | Voyage AI embeddings and Anthropic Claude; server-side only and identifier-screened |
| Scheduled refresh | `screener/update_uspstf.py` | [USPSTF Prevention TaskForce](https://www.uspreventiveservicestaskforce.org/apps/api.jsp) |
| Administrative import | `antibiogram/auto_update.py` and import API | [Anthropic Claude](https://console.anthropic.com/); server-side only |

The remaining public calculators and reference logic run locally in the
browser from repository-hosted data. Clinical-document downloads and cited
source links may intentionally open external publisher or agency sites.

---

**Not medical advice.** All content should be verified against primary sources and individualized with clinical judgment.
