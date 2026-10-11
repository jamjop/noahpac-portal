# Clinical monitoring operations

The monitoring jobs detect possible source changes. They do not determine that
clinical content is correct and they do not automatically rewrite curated
guidance. A detected change remains `review_pending` until a clinician reviews
the source, deploys any needed content change, and explicitly acknowledges it.

## Secret handling

Create `/etc/noahpac-monitor.env` from `ops/noahpac-monitor.env.example`, fill
in newly rotated values, and set ownership/mode to `root:root` / `0600`. The
USPSTF key and Pushover credentials were previously exposed inline in root's
crontab and should be rotated before this file is activated. Do not print the
old crontab or environment file into tickets, terminals being recorded, or chat.

`ANTHROPIC_API_KEY` may remain in the existing root-only
`/etc/antibiogram-api.env`; the antibiogram service loads both files.

## Schedules

- USPSTF refresh: Mondays 04:17; report 04:30.
- Antibiogram refresh: first day of Jan/Apr/Jul/Oct at 04:23.
- High-risk curated-topic surveillance: monthly on the 5th at 04:30. Fifteen
  high-risk topic monitors run sequentially and preserve unresolved review state.
- Curated-topic surveillance: Jan/Apr/Jul/Oct 15 at 04:30. One orchestrator
  runs all 17 topics and sends the report after completion.
- Authoritative-source link check: Tuesdays at 04:50, with failure escalation.
- The existing mirror timer remains unchanged at every 20 minutes.

The repository systemd units replace the duplicate root-cron entries and the
legacy `noahpac-guideline-check.timer`. Do not leave both scheduling systems
enabled or each monitor will run twice.

After the new environment file contains rotated credentials, install the units
and remove only the superseded Noah PA-C root-cron entries:

```bash
sudo /var/www/noahpac-portal/ops/install-clinical-monitoring.sh
sudo /var/www/noahpac-portal/ops/migrate-root-cron.sh
```

The cron migration creates a mode-0600 backup under `/root` and does not print
the old crontab (or its embedded secrets) to the terminal. It leaves unrelated
root jobs intact.

## Review acknowledgement

After source review and deployment:

```bash
sudo /usr/bin/python3 /var/www/noahpac-portal/scripts/acknowledge-clinical-review.py \
  sepsis --reviewer "INITIALS" --decision content-updated \
  --source "https://example.org/current-guideline" \
  --note "Reviewed current guideline; deployed content update"
```

The command records the reviewer, outcome, source, note, and UTC timestamp in
the topic's `last_checked.json` and appends a root-only audit record to
`/var/lib/noahpac-monitor/review-audit.jsonl`.
Do not use it merely because a later automated check found no additional papers.

## Verification

```bash
sudo -u root NOAHPAC_REPO=/var/www/noahpac-portal \
  /usr/bin/python3 /var/www/noahpac-portal/scripts/run-quarterly-monitoring.py --check
sudo systemd-analyze verify /etc/systemd/system/noahpac-*.service /etc/systemd/system/noahpac-*.timer
sudo systemctl list-timers 'noahpac-*'
sudo systemctl start noahpac-quarterly-monitor.service
sudo systemctl start noahpac-high-risk-monitor.service
sudo journalctl -u noahpac-quarterly-monitor.service -n 200 --no-pager
```

Run the manual service only when sending live Pushover/email notifications is
intended. A nonzero service result means at least one topic or the final report
failed; other topics still ran and the affected public status is red.

Every scheduled service also triggers `noahpac-monitor-failure@.service` on a
nonzero result. See `docs/CLINICAL_GOVERNANCE.md` for source-manifest semantics,
link-check behavior, and safe alert testing.
