# Clinical Review Portal

The private portal at `/review/` turns the existing source-monitor results into
an authenticated clinical review queue. It does not perform or claim clinical
review automatically. A clinician must open the cited sources, compare them
with the deployed page, select a decision, and attest to that work.

New detections are stored as durable focused review packets. Each packet shows
the exact retained trigger (publication title/abstract, official alert, page
version, or source-document text diff) and identifies only the source-backed
claims affected by that trigger. Scheduled comprehensive reviews stay broad.
Older pending records whose evidence was not retained are clearly labeled
`Legacy broad detection` and must not be presented as focused evidence.

When a retained previous version exists, the portal presents bounded
side-by-side `Previous` and `Current` hunks with line numbers. Every displayed
hunk has its own clinician checkbox; the API rejects the review unless the
submitted hunk IDs exactly match the current packet. A checkbox documents that
the reviewer examined that change—it does not assert that automation judged it
clinically correct. New publications have no old version, and legacy alerts
have no reconstructable snapshot, so those packets continue to show direct
evidence links with an explicit comparison-unavailable notice.

## Security model

- Nginx and Authelia require two-factor authentication for both the frontend
  and API.
- Nginx replaces `X-Remote-User` with the identity returned by Authelia. The
  browser cannot select or override the reviewer name.
- The API binds only to `127.0.0.1:8767`, executes no shell commands, accepts
  only topics and source IDs from `clinical-review.json`, and applies strict
  length and enum validation.
- POST requests require the production Origin and a non-simple custom header.
- Every form contains the revision of the displayed status. A monitor update
  between page load and submission causes a conflict instead of clearing a
  newer alert.
- Submissions must identify the complete current set of event IDs, affected
  claim IDs, packet source IDs, and verified old/new hunk IDs; stale, partial,
  or expanded packets are rejected.
- The dedicated `noahpac-review` service account can write only the protected
  audit directory and the explicit `last_checked.json` files. The systemd unit
  otherwise uses a read-only filesystem and additional sandboxing.

## Install the API service

After deploying the repository commit:

```bash
sudo /var/www/noahpac-portal/ops/install-review-portal.sh
```

This creates the locked service account and group, normalizes status-file
permissions, installs the unit, and starts the loopback API.

## Configure Nginx and Authelia

The idempotent configurator backs up both live files, adds the versioned Nginx
locations, expands the existing Noah PA-C two-factor rule to `/review/`,
validates both configurations, restarts Authelia, waits for health, and reloads
Nginx. It restores both backups if any step fails:

```bash
sudo /var/www/noahpac-portal/ops/configure-review-proxy.sh
```

The resulting Authelia resource rule is:

```yaml
resources:
  - '^/(clinical-assistant|review)(/.*)?$'
policy: two_factor
```

Do not add `/review/` to Nginx without the corresponding validated Authelia
rule.

## Verify

```bash
curl -fsS http://127.0.0.1:8767/health
sudo systemctl status noahpac-review-portal.service --no-pager
curl -I https://www.noahpac.com/review/
```

The public request without an authenticated session should redirect to
Authelia. After signing in, the dashboard should show the Authelia username and
the current review queue.

## Operational behavior

Submitting `No change required` records that the deployed content remains
accurate. `Not applicable` records that the exact detected evidence does not
affect the tool. `Content updated` additionally requires a deployed commit or
release reference.
The API updates the topic status and appends a JSON record to the root-owned,
group-writable `/var/lib/noahpac-monitor/review-audit.jsonl` audit log.

Open and resolved evidence packets are retained under
`/var/lib/noahpac-monitor/review-events/`. The portal never resolves a packet
until the required primary review—and, for critical claims, independent review
by a different authenticated identity—has been recorded.

If clinical content is changed in response to a packet, attach the exact Git
implementation comparison before completing the review:

```bash
sudo /usr/bin/python3 /var/www/noahpac-portal/scripts/attach-clinical-implementation-diff.py \
  EVENT_ID --base PREVIOUS_DEPLOYED_COMMIT --head UPDATED_DEPLOYED_COMMIT \
  --path sepsis/app.js --path sepsis/index.html
```

The command accepts only repository revisions and changed repository paths,
stores bounded text hunks in the existing protected event file, and refuses to
alter resolved events. Reopen `/review/` after attaching it; the packet revision
changes deliberately so a previously loaded form cannot submit stale evidence.

The status files are runtime state and are excluded by `.gitignore`; portal
submissions therefore do not dirty the production Git checkout. The existing
CLI acknowledgement remains available as a recovery path.
