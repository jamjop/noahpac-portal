"""
Shared utilities for PubMed-based guideline monitors on noahpac.com.

Each check_updates.py that uses PubMed imports this module and supplies its
own SEARCHES list, app metadata, and notification strings. All HTTP, state
I/O, and Pushover logic lives here.
"""
import json
import re
import sys
import time
import urllib.request
import urllib.parse
import datetime
from pathlib import Path

PUSHOVER_API  = "https://api.pushover.net/1/messages.json"
EUTILS_BASE   = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
TEXTFILE_DIR  = Path("/var/lib/node_exporter/textfile_collector")


def esearch(query: str, reldate: int,
            user_agent: str = 'noahpac-monitor/1.0') -> list[str]:
    params = urllib.parse.urlencode({
        'db': 'pubmed', 'term': query, 'retmode': 'json',
        'retmax': 50, 'datetype': 'pdat', 'reldate': reldate,
    })
    url = f"{EUTILS_BASE}/esearch.fcgi?{params}"
    req = urllib.request.Request(url, headers={'User-Agent': user_agent})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read()).get('esearchresult', {}).get('idlist', [])


def esummary(pmids: list[str],
             user_agent: str = 'noahpac-monitor/1.0') -> dict:
    if not pmids:
        return {}
    params = urllib.parse.urlencode({
        'db': 'pubmed', 'id': ','.join(pmids), 'retmode': 'json',
    })
    url = f"{EUTILS_BASE}/esummary.fcgi?{params}"
    req = urllib.request.Request(url, headers={'User-Agent': user_agent})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    result = {}
    for pmid, item in data.get('result', {}).items():
        if pmid == 'uids':
            continue
        result[pmid] = {
            'title':   item.get('title', '(no title)'),
            'source':  item.get('source', ''),
            'pubdate': item.get('pubdate', ''),
        }
    return result


def write_heartbeat(job: str) -> None:
    """Atomically update the Prometheus textfile heartbeat for a cron job."""
    if not TEXTFILE_DIR.exists():
        return
    tmp = TEXTFILE_DIR / f"cron_{job}.prom.tmp"
    dst = TEXTFILE_DIR / f"cron_{job}.prom"
    try:
        tmp.write_text(
            f'# HELP cron_last_success_timestamp_seconds Unix timestamp of last successful run\n'
            f'# TYPE cron_last_success_timestamp_seconds gauge\n'
            f'cron_last_success_timestamp_seconds{{job="{job}"}} {int(time.time())}\n'
        )
        tmp.rename(dst)
    except Exception as exc:
        print(f"WARNING: could not write heartbeat for {job}: {exc}", file=sys.stderr)


def save_last_checked(app_dir: Path, status: str) -> None:
    """Record that a check ran, for the frontend's 'last checked' tag."""
    f = app_dir / "last_checked.json"
    try:
        f.write_text(json.dumps({
            "date": datetime.date.today().isoformat(),
            "status": status,
        }, indent=2))
        f.chmod(0o644)
    except Exception as exc:
        print(f"WARNING: could not write last_checked.json: {exc}", file=sys.stderr)


def load_state(state_file: Path) -> dict:
    return json.loads(state_file.read_text()) if state_file.exists() else {}


def save_state(state_file: Path, state: dict) -> None:
    state_file.write_text(json.dumps(state, indent=2))
    state_file.chmod(0o644)


def write_quarterly_result(app_id: str, app_name: str, app_url: str,
                           status: str, findings: list[dict]) -> None:
    write_heartbeat(app_id)
    report_file = Path(f"/tmp/quarterly-report-{datetime.date.today()}.json")
    try:
        existing = json.loads(report_file.read_text()) if report_file.exists() else []
        existing.append({
            'app_id':   app_id,
            'app_name': app_name,
            'app_url':  app_url,
            'status':   status,
            'findings': findings,
            'ran_at':   datetime.datetime.now().isoformat(timespec='minutes'),
        })
        report_file.write_text(json.dumps(existing, indent=2))
    except Exception as exc:
        print(f"WARNING: could not write quarterly report: {exc}", file=sys.stderr)


def push_notify(user: str, token: str, title: str, message: str,
                url: str, url_title: str) -> None:
    payload = json.dumps({
        'token':     token,
        'user':      user,
        'title':     title,
        'message':   message,
        'url':       url,
        'url_title': url_title,
        'priority':  0,
    }).encode()
    req = urllib.request.Request(
        PUSHOVER_API, data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        if result.get('status') != 1:
            print(f"Pushover warning: {result}", file=sys.stderr)


def run_searches(
    searches: list[dict],
    state: dict,
    first_run: bool,
    user_agent: str = 'noahpac-monitor/1.0',
    suppress_new_search_alerts: bool = False,
) -> tuple[dict, list[tuple[str, dict]]]:
    """
    Run all PubMed searches, update state in-place, and return new findings.

    Returns (updated_state, findings) where findings is a list of
    (search_name, {pmid, title, journal, pubdate}) tuples.

    suppress_new_search_alerts: when True, searches whose IDs were not in
    state before this run do not generate alerts (protects against false
    positives when new search entries are added to an existing SEARCHES list).
    """
    findings: list[tuple[str, dict]] = []

    for search in searches:
        sid = search['id']
        print(f"Querying PubMed: {search['name']} …")
        try:
            pmids = esearch(search['query'], search['reldate'], user_agent)
        except Exception as exc:
            print(f"  ERROR fetching {sid}: {exc}", file=sys.stderr)
            continue

        known        = set(state.get(sid, []))
        is_new_sid   = sid not in state
        new_pmids    = [p for p in pmids if p not in known]
        suffix       = " (new search — initialising)" if (suppress_new_search_alerts and is_new_sid) else ""
        print(f"  Found {len(pmids)} total, {len(new_pmids)} new{suffix}")

        should_alert = (
            new_pmids and not first_run
            and not (suppress_new_search_alerts and is_new_sid)
        )
        if should_alert:
            try:
                meta = esummary(new_pmids, user_agent)
                time.sleep(0.4)
            except Exception as exc:
                print(f"  WARNING: could not fetch summaries: {exc}", file=sys.stderr)
                meta = {p: {'title': '(title unavailable)', 'source': '', 'pubdate': ''} for p in new_pmids}
            for pmid in new_pmids:
                m = meta.get(pmid, {})
                findings.append((search['name'], {
                    'pmid':    pmid,
                    'title':   m.get('title', ''),
                    'journal': m.get('source', ''),
                    'pubdate': m.get('pubdate', ''),
                }))

        state[sid] = sorted(set(known) | set(pmids))
        time.sleep(0.4)

    return state, findings


def check_page_source(name: str, url: str, date_patterns: list[str], known_value: str,
                      user_agent: str = 'noahpac-monitor/1.0', timeout: int = 30) -> dict:
    """
    Fetch a page and look for a date/version marker among date_patterns.

    Returns {'value': str, 'changed': bool, 'error': str|None}.

    `changed` is only True when a value was successfully extracted AND
    differs from a non-empty known_value (so first-run never alerts).

    On fetch failure or a pattern miss, `value` is left as known_value
    (state is not corrupted) and `error` is set — callers MUST check
    `error` and surface it (e.g. write_quarterly_result status='error'),
    since a page that fails to load is NOT the same as a page that hasn't
    changed. Silently treating a fetch failure as "no change" hides a real
    monitoring gap behind a false-clean report.
    """
    try:
        req = urllib.request.Request(url, headers={'User-Agent': user_agent})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            html = resp.read().decode('utf-8', errors='replace')
    except Exception as exc:
        return {'value': known_value, 'changed': False,
                'error': f'{name}: fetch failed — {exc}'}

    for pat in date_patterns:
        m = re.search(pat, html, re.IGNORECASE)
        if m:
            current = m.group(1).strip()
            changed = bool(known_value) and current != known_value
            return {'value': current, 'changed': changed, 'error': None}

    return {'value': known_value, 'changed': False,
            'error': f'{name}: no date/version pattern matched (page structure may have changed)'}


def format_findings(findings: list[tuple[str, dict]]) -> str:
    """Format findings as bracketed entries for Pushover messages."""
    lines = []
    for search_name, m in findings:
        lines.append(f'[{search_name}]')
        lines.append(f'  {m["title"]}')
        if m['journal']:
            lines.append(f'  {m["journal"]} {m["pubdate"]} — PMID {m["pmid"]}')
        else:
            lines.append(f'  PMID {m["pmid"]}')
        lines.append('')
    return '\n'.join(lines)
