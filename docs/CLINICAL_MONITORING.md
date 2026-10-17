# Clinical monitoring and review model

Noah PA-C uses automation to identify material that may require review. The
automation does not validate clinical accuracy and does not automatically edit
clinical recommendations, doses, thresholds, or interpretations.

## Secret handling

Create `/etc/noahpac-monitor.env` from `ops/noahpac-monitor.env.example`, add
the rotated USPSTF and Pushover credentials, and set ownership/mode to
`root:root` / `0600`. Do not print the old crontab or environment file into
tickets, recorded terminals, or chat. `ANTHROPIC_API_KEY` may remain in the
existing root-only `/etc/antibiogram-api.env`; the antibiogram service loads
both files.

## Source and claim registries

- `clinical-review.json` lists each tool, its risk tier, review cadence,
  monitor, and approved authoritative sources.
- `clinical-claims.json` maps clinically actionable content areas to the
  sources that support them. Every high-risk tool must have a monitor, an
  approved source, and at least one claim mapping. Governance tests fail when
  that coverage is missing.
- A claim mapping defines the scope a reviewer must examine. It is not evidence
  that the content has been reviewed.

## Surveillance layers

1. `noahpac-urgent-clinical.timer` checks official FDA MedWatch and CDC Health
   Alert Network channels daily. First run initializes state without alerting.
   New entries mark affected tools for review and send a notification.
2. `noahpac-high-risk-monitor.timer` runs topic-specific PubMed and official
   page surveillance monthly.
3. `noahpac-quarterly-monitor.timer` runs the complete topic set quarterly and
   sends a consolidated report.
4. `noahpac-source-fingerprints.timer` hashes designated stable source
   documents weekly. A byte-level replacement marks every mapped tool pending.
5. `noahpac-source-links.timer` checks all registered source URLs weekly. Link
   reachability is operational evidence only; it is not a clinical review.
6. USPSTF and antibiogram data have their own structured refresh timers.

State and latest reports are stored under `/var/lib/noahpac-monitor`. Fetch
failures return a non-zero status and trigger the systemd failure notifier;
they are never reported as "no change."

## Schedules

- Urgent FDA/CDC surveillance: daily at 04:05.
- USPSTF refresh: Mondays at 04:17; report at 04:30.
- Clinical-document fingerprints: Tuesdays at 04:35.
- Authoritative-source link check: Tuesdays at 04:50.
- High-risk curated-topic surveillance: monthly on the fifth at 04:30; 17
  topic monitors run sequentially and preserve unresolved review state.
- Antibiogram refresh: the first day of Jan/Apr/Jul/Oct at 04:23.
- Complete curated-topic surveillance: Jan/Apr/Jul/Oct 15 at 04:30; 19 topic
  monitors run before the consolidated report is sent.
- The existing mirror timer remains unchanged at every 20 minutes.

The repository systemd units replace the superseded root-cron entries and the
legacy `noahpac-guideline-check.timer`. Do not leave both scheduling systems
enabled or monitors will run twice. Install and migrate with:

```bash
sudo /var/www/noahpac-portal/ops/install-clinical-monitoring.sh
sudo /var/www/noahpac-portal/ops/migrate-root-cron.sh
```

The cron migration creates a mode-0600 backup under `/root`, does not print
embedded secrets, and preserves unrelated root jobs.

## Review evidence

The authenticated `/review/` portal requires the reviewer to record:

- every mapped clinical content area examined;
- the authoritative sources examined;
- source versions, publication dates, or access dates;
- known limitations or unresolved questions;
- a decision and review note;
- the deployed commit or release reference when content changed.

Critical mappings require a second review by a different authenticated user.
The primary review remains pending until the independent reviewer examines the
same mapped areas and records a second audit entry. Both identities, timestamps,
sources, scopes, versions, notes, and limitations remain in the append-only
audit log.

The portal is the preferred workflow. The root-only recovery command supports
the same evidence and two-stage review model. Example primary review:

```bash
sudo /usr/bin/python3 /var/www/noahpac-portal/scripts/acknowledge-clinical-review.py \
  sepsis --reviewer "REVIEWER.ONE" --decision no-change \
  --source-id ssc_2026 --claim sepsis-screening \
  --source-version "SSC 2026 guideline accessed 2026-10-17" \
  --limitations "None identified" \
  --note "Compared all deployed thresholds and escalation language."
```

For a critical mapping, a different authenticated reviewer completes the same
command with `--stage secondary`. Do not acknowledge an item merely because a
later automated run found no additional publications.

## Adding or changing clinical content

1. Add the authoritative source to `clinical-review.json`.
2. Associate it with the affected tool.
3. Add or update a content-area mapping in `clinical-claims.json`.
4. Add an appropriate monitor or extend an existing topic query.
5. For stable PDFs or documents, set `"fingerprint": true` on the source.
6. Add regression vectors for calculations or branching clinical logic.
7. Run governance, monitor, and browser tests.
8. Deploy the change, then complete the documented clinical review.

Urgent notifications and newly discovered publications are triage inputs. The
reviewer must open the original source, determine applicability, compare the
deployed content, and document the decision.

## Operational verification

```bash
sudo -u root NOAHPAC_REPO=/var/www/noahpac-portal \
  /usr/bin/python3 /var/www/noahpac-portal/scripts/run-quarterly-monitoring.py --check
sudo -u root NOAHPAC_REPO=/var/www/noahpac-portal \
  /usr/bin/python3 /var/www/noahpac-portal/scripts/monitor-urgent-clinical-feeds.py --check
sudo -u root NOAHPAC_REPO=/var/www/noahpac-portal \
  /usr/bin/python3 /var/www/noahpac-portal/scripts/monitor-source-fingerprints.py --check
sudo systemd-analyze verify /etc/systemd/system/noahpac-*.service /etc/systemd/system/noahpac-*.timer
sudo systemctl list-timers 'noahpac-*'
```

Starting the services manually can send live Pushover or email notifications.
A nonzero result means a source fetch, topic monitor, or report failed; it must
not be interpreted as a clean clinical check.
