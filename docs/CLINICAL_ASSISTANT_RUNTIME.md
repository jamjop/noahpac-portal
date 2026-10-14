# Clinical Assistant runtime layout

The Clinical Assistant source and public frontend remain in
`/var/www/noahpac-portal/clinical-assistant`. Production runtime artifacts are
kept outside the Nginx document root:

- Python virtual environment: `/opt/noahpac/clinical-assistant/venv`
- Persistent Chroma index: `/var/lib/noahpac-clinical-assistant/chroma_data`
- Root-only API credentials: `/etc/clinical-assistant-api.env`

The versioned systemd unit sets `CLINICAL_ASSISTANT_STATE_DIR`. The Python code
retains its historical in-tree defaults when that variable is absent so local
development remains straightforward.

## One-time migration

Deploy the commit containing the migration first, then run:

```bash
sudo /var/www/noahpac-portal/ops/migrate-clinical-assistant-runtime.sh
```

The script stops the API, moves the existing environment and Chroma database,
installs the hardened unit, starts the service, and checks the loopback health
endpoint. If startup or health validation fails, it restores the prior unit and
paths automatically. It is safe to run again after a successful migration.

Verify afterward:

```bash
systemctl show clinical-assistant-api.service \
  -p LoadState -p ActiveState -p SubState -p ExecMainStatus
curl -fsS http://127.0.0.1:8766/health
sudo test ! -e /var/www/noahpac-portal/clinical-assistant/.venv
sudo test ! -e /var/www/noahpac-portal/clinical-assistant/chroma_data
```

Do not delete the Chroma directory as routine cleanup. It is generated data,
but it is the assistant's live reference index and requires re-ingestion to
recreate. Back it up with other application state.
