# Release and deployment runbook

The public site is served directly from `/var/www/noahpac-portal`. GitHub `main` is the source of truth; production should only move by fast-forwarding to a reviewed commit.

## Release flow

1. Create a feature branch and open a pull request.
2. Add an entry to `clinical-changelog.json` when the release changes clinical content, a safety control, or clinical governance. Do not add entries for cosmetic-only changes.
3. Require the CSS token check and Clinical Site Quality Gate to pass.
4. Review the public-facing diff and merge to `main`.
5. Deploy the exact merged commit:

   ```bash
   cd /var/www/noahpac-portal
   ./scripts/deploy-production.sh <full-merged-commit-sha>
   ```

6. Run the production health workflow or `node scripts/check-site-health.mjs --remote`.
7. Tag significant releases only after production verification.

Set `RUN_BROWSER_TESTS=1` when the production host should rerun the complete Playwright suite during deployment. CI normally supplies this gate before merge.

## Rollback

Tags preserve known-good states. Prefer a normal Git revert on `main`, allow CI to validate it, and deploy that new commit. For an urgent incident, serve the verified pre-redesign backup or a temporary worktree from the known-good tag; do not erase Git history with a force-push or hard reset.

Runtime-generated freshness files, screener data, clinical-assistant state, and `replit.md` are intentionally ignored or untracked and must be preserved during operational work.

`deploy-production.sh` refuses to deploy over tracked local changes, but deliberately ignores modified `*/last_checked.json` files: the monitors and the review portal rewrite them at runtime, and `triage/last_checked.json` is tracked to seed its review-required state. Do not "clean" them with `git checkout` or `git stash` before a deploy; a missing file is treated as a first run and loses a pending review flag (`save_last_checked` creates a fresh `no_change` record).

## Device review

CI emulates common phone and tablet widths in Chromium. Before a major release, also perform a short physical-device smoke test on Safari/iOS and Chrome/Android: landing search, one calculator, one reference table, dark mode, tab navigation, and installed-app icon behavior.
