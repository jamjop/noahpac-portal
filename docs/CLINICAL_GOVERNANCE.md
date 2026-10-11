# Clinical governance and regression controls

## Review manifest

`/clinical-review.json` is the canonical machine-readable inventory of all 26
clinical routes. It records each tool's risk tier, review status, cadence,
monitor, last documented substantive review (when one exists), and references
to centrally defined authoritative sources.

`reviewed` means a source-based review was documented; it does not claim
independent medical validation. `monitoring_only` deliberately distinguishes
automated surveillance from clinician sign-off. Never populate a review date
merely because a link checker or PubMed monitor ran successfully.

Validate the manifest without network access:

```bash
NOAHPAC_REPO=/var/www/noahpac-portal \
  python3 /var/www/noahpac-portal/scripts/check-clinical-sources.py --check-config
```

## Authoritative-link monitoring

`noahpac-source-links.timer` checks the source registry each Tuesday at 04:50,
with up to five minutes of randomized delay. Results are written atomically to
`/var/lib/noahpac-monitor/source-links.json`. Authentication and bot-protection
responses (401, 403, 405, 406, 429) count as reachable; broken links, DNS/TLS
errors, and server failures fail the service and trigger the shared Pushover
failure alert.

This verifies availability only. A reachable source may still contain a new
guideline that requires clinical review.

## Failure escalation

The scheduled monitoring services use:

```ini
OnFailure=noahpac-monitor-failure@%n.service
```

The template sends the failed unit, host, UTC time, and a safe journal command
through the existing root-only Pushover configuration. It never includes
environment values or journal contents in the notification.

Safe payload test (does not send a notification):

```bash
sudo --preserve-env=PUSHOVER_USER,PUSHOVER_TOKEN \
  python3 /var/www/noahpac-portal/scripts/notify-monitor-failure.py \
  noahpac-test.service --dry-run
```

## Independent regression vectors

`tests/clinical-regression-vectors.json` stores reviewable inputs, expected
outputs, and the mathematical basis separately from the Playwright runner.
Vectors currently cover renal equations, corrected calcium, anion gap, MELD,
CHA2DS2-VASc, CURB-65, pediatric emergency-dose boundaries, opioid MME,
corticosteroid equivalence, SIRS, and qSOFA.

Run them with:

```bash
tests/node_modules/.bin/playwright test \
  --config=tests/playwright.config.ts tests/clinical-regression-vectors.spec.ts
```

Any clinical-logic change must update or add a vector with an independently
verified expected value. Do not derive the expected value by calling the same
application function under test.

## Public clinical change log

`/clinical-changelog.json` is the structured source for the public
`/updates/` page. Add an entry when a release changes clinical content, a
patient-safety control, scheduled monitoring, review policy, or another
substantive governance mechanism. Cosmetic-only interface work is omitted
unless it materially changes clinical usability or accessibility across the
site.

Clinical entries must identify the affected routes and authoritative source
IDs from `clinical-review.json`. A monitoring run alone is not a clinical
change and must never be described as clinical review. Keep entries newest
first, use plain language, and point `commit` to the release that introduced
the change. The governance test validates route and source references.
