#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for new guideline publications from sources
cited on noahpac.com/calculators/. Alerts via Pushover when new papers appear.
Run quarterly via cron (Jan/Apr/Jul/Oct 15).

Usage:
    PUSHOVER_USER=xxx PUSHOVER_TOKEN=yyy ./check_updates.py
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
from datetime import date
from pathlib import Path

PUSHOVER_API = "https://api.pushover.net/1/messages.json"
EUTILS_BASE  = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
STATE_FILE   = Path(__file__).resolve().parent / "known_pmids.json"
CALC_URL     = "https://noahpac.com/calculators/"

# Each entry targets one source/guideline body cited in the calculators app.
# reldate: how many past days to search (400 safely covers a quarter + margin).
SEARCHES = [

    # ── Cardiovascular ──────────────────────────────────────────────────────
    {
        'id':      'acc_aha_cholesterol',
        'name':    'ACC/AHA Cholesterol / ASCVD (PCE) Guidelines',
        'query':   '("American College of Cardiology" OR "American Heart Association") AND (cholesterol OR "atherosclerotic cardiovascular" OR "ASCVD" OR "pooled cohort equations") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },
    {
        'id':      'acc_aha_afib',
        'name':    'ACC/AHA/ESC Atrial Fibrillation Guidelines (CHA₂DS₂-VASc)',
        'query':   '("American College of Cardiology" OR "American Heart Association" OR "European Society of Cardiology") AND "atrial fibrillation" AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },
    {
        'id':      'acc_aha_chest_pain',
        'name':    'ACC/AHA Chest Pain Guidelines (HEART Score)',
        'query':   '("American College of Cardiology" OR "American Heart Association") AND ("chest pain" OR "HEART score" OR "acute coronary syndrome" OR "high-sensitivity troponin") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },
    {
        'id':      'acc_aha_periop',
        'name':    'ACC/AHA Perioperative Cardiovascular Guidelines (RCRI)',
        'query':   '("American College of Cardiology" OR "American Heart Association") AND ("perioperative" OR "noncardiac surgery" OR "preoperative cardiac") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },

    # ── VTE ─────────────────────────────────────────────────────────────────
    {
        'id':      'accp_vte',
        'name':    'ACCP / ASH VTE Guidelines (Wells DVT/PE/PERC)',
        'query':   '("American College of Chest Physicians" OR "American Society of Hematology") AND ("venous thromboembolism" OR "deep vein thrombosis" OR "pulmonary embolism") AND (guideline[pt] OR update[ti])',
        'reldate': 400,
    },
    {
        'id':      'esc_pe',
        'name':    'ESC Pulmonary Embolism Guidelines (Wells PE)',
        'query':   '"European Society of Cardiology" AND "pulmonary embolism" AND (guideline[pt] OR update[ti])',
        'reldate': 400,
    },

    # ── Pulmonary ────────────────────────────────────────────────────────────
    {
        'id':      'pneumonia_severity',
        'name':    'ATS/BTS/IDSA Pneumonia Guidelines (CURB-65)',
        'query':   '("American Thoracic Society" OR "British Thoracic Society" OR "Infectious Diseases Society of America") AND ("community-acquired pneumonia" OR "pneumonia severity") AND (guideline[pt] OR update[ti])',
        'reldate': 400,
    },

    # ── Renal ────────────────────────────────────────────────────────────────
    {
        'id':      'kdigo_ckd',
        'name':    'KDIGO CKD Guidelines (eGFR / CKD-EPI / CrCl)',
        'query':   '"Kidney Disease: Improving Global Outcomes" AND ("chronic kidney disease" OR eGFR OR "glomerular filtration" OR "creatinine clearance") AND (guideline[pt] OR update[ti])',
        'reldate': 400,
    },

    # ── Hepatology ───────────────────────────────────────────────────────────
    {
        'id':      'aasld_meld',
        'name':    'AASLD Liver Disease / MELD Guidelines',
        'query':   '"American Association for the Study of Liver Diseases" AND ("MELD" OR "liver transplantation" OR "end-stage liver disease" OR cirrhosis) AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },

    # ── Mental Health ─────────────────────────────────────────────────────────
    {
        'id':      'uspstf_depression',
        'name':    'USPSTF Depression Screening Guidelines (PHQ-9)',
        'query':   '"US Preventive Services Task Force" AND (depression OR "depressive disorder") AND (screening OR guideline OR recommendation)',
        'reldate': 400,
    },
    {
        'id':      'uspstf_anxiety',
        'name':    'USPSTF Anxiety Screening Guidelines (GAD-7)',
        'query':   '"US Preventive Services Task Force" AND (anxiety OR "anxiety disorder") AND (screening OR guideline OR recommendation)',
        'reldate': 400,
    },

    # ── Emergency / Surgical ─────────────────────────────────────────────────
    {
        'id':      'ottawa_rules',
        'name':    'Ottawa Knee / Ankle Rules — Validation & Updates',
        'query':   '("Ottawa knee" OR "Ottawa ankle" OR "Ottawa rules") AND (validation OR update OR derivation)[ti]',
        'reldate': 730,
    },
    {
        'id':      'pecarn',
        'name':    'PECARN Pediatric Head CT Rule — Validation & Updates',
        'query':   'PECARN AND ("head injury" OR "traumatic brain injury" OR "computed tomography") AND (validation OR update OR prospective)[ti]',
        'reldate': 730,
    },
    {
        'id':      'wses_appendicitis',
        'name':    'WSES Appendicitis Guidelines (Alvarado Score)',
        'query':   '("World Society of Emergency Surgery" OR WSES) AND appendicitis AND (guideline[pt] OR update[ti])',
        'reldate': 730,
    },

    # ── Dermatology ──────────────────────────────────────────────────────────
    {
        'id':      'aad_acne',
        'name':    'AAD Acne / Isotretinoin Guidelines (Accutane Dosing)',
        'query':   '"American Academy of Dermatology" AND (acne OR isotretinoin OR "acne vulgaris") AND (guideline[pt] OR update[ti] OR statement[pt])',
        'reldate': 400,
    },

    # ── Obstetrics ───────────────────────────────────────────────────────────
    {
        'id':      'acog_dating',
        'name':    'ACOG Gestational Age Dating / EDD Guidelines',
        'query':   '"American College of Obstetricians and Gynecologists" AND ("gestational age" OR "estimated due date" OR "pregnancy dating" OR "last menstrual period" OR "ultrasound dating") AND (guideline[pt] OR bulletin[ti] OR practice[ti] OR opinion[ti])',
        'reldate': 400,
    },
]


def esearch(query: str, reldate: int) -> list[str]:
    """Return list of PMIDs matching query within reldate days."""
    params = urllib.parse.urlencode({
        'db':       'pubmed',
        'term':     query,
        'retmode':  'json',
        'retmax':   50,
        'datetype': 'pdat',
        'reldate':  reldate,
    })
    url = f"{EUTILS_BASE}/esearch.fcgi?{params}"
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-calculators-monitor/1.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    return data.get('esearchresult', {}).get('idlist', [])


def esummary(pmids: list[str]) -> dict:
    """Return title/journal metadata keyed by PMID."""
    if not pmids:
        return {}
    params = urllib.parse.urlencode({
        'db':      'pubmed',
        'id':      ','.join(pmids),
        'retmode': 'json',
    })
    url = f"{EUTILS_BASE}/esummary.fcgi?{params}"
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-calculators-monitor/1.0'})
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


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2))
    STATE_FILE.chmod(0o644)


def _write_quarterly_result(app_id: str, app_name: str, app_url: str,
                            status: str, findings: list[dict]) -> None:
    import datetime as _dt
    report_file = Path(f"/tmp/quarterly-report-{_dt.date.today()}.json")
    try:
        existing = json.loads(report_file.read_text()) if report_file.exists() else []
        existing.append({'app_id': app_id, 'app_name': app_name, 'app_url': app_url,
                         'status': status, 'findings': findings,
                         'ran_at': _dt.datetime.now().isoformat(timespec='minutes')})
        report_file.write_text(json.dumps(existing, indent=2))
    except Exception as exc:
        print(f"WARNING: could not write quarterly report: {exc}", file=sys.stderr)


def push_notify(user: str, token: str, title: str, message: str) -> None:
    payload = json.dumps({
        'token':     token,
        'user':      user,
        'title':     title,
        'message':   message,
        'url':       CALC_URL,
        'url_title': 'noahpac.com/calculators/',
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


def main() -> int:
    user  = os.environ.get('PUSHOVER_USER', '').strip()
    token = os.environ.get('PUSHOVER_TOKEN', '').strip()
    if not user or not token:
        print('ERROR: set PUSHOVER_USER and PUSHOVER_TOKEN', file=sys.stderr)
        return 2

    state = load_state()
    first_run = not state
    if first_run:
        print('First run — initialising state (no alert will be sent).')

    all_new: list[tuple[str, dict]] = []  # (search_name, metadata)

    for search in SEARCHES:
        sid = search['id']
        print(f"Querying PubMed: {search['name']} …")
        try:
            pmids = esearch(search['query'], search['reldate'])
        except Exception as exc:
            print(f"  ERROR fetching {sid}: {exc}", file=sys.stderr)
            continue

        known = set(state.get(sid, []))
        new_pmids = [p for p in pmids if p not in known]
        print(f"  Found {len(pmids)} total, {len(new_pmids)} new")

        if new_pmids and not first_run:
            try:
                meta = esummary(new_pmids)
                time.sleep(0.4)  # stay under PubMed rate limit (3 req/s)
            except Exception as exc:
                print(f"  WARNING: could not fetch summaries: {exc}", file=sys.stderr)
                meta = {p: {'title': '(title unavailable)', 'source': '', 'pubdate': ''} for p in new_pmids}
            for pmid in new_pmids:
                m = meta.get(pmid, {})
                all_new.append((search['name'], {
                    'pmid':    pmid,
                    'title':   m.get('title', ''),
                    'journal': m.get('source', ''),
                    'pubdate': m.get('pubdate', ''),
                }))

        state[sid] = sorted(set(known) | set(pmids))
        time.sleep(0.4)  # PubMed rate limit

    save_state(state)

    if first_run:
        print(f'State initialised with {sum(len(v) for v in state.values())} PMIDs across {len(SEARCHES)} searches.')
        print('No notification sent on first run.')
        return 0

    if not all_new:
        print(f'No new guideline publications detected ({date.today()}).')
        _write_quarterly_result('calculators', 'Clinical Calculators', CALC_URL, 'no_change', [])
        return 0

    # Build Pushover message
    lines = [f'{len(all_new)} new guideline publication(s) — review for calculator updates:\n']
    for search_name, m in all_new:
        lines.append(f'[{search_name}]')
        lines.append(f'  {m["title"]}')
        if m['journal']:
            lines.append(f'  {m["journal"]} {m["pubdate"]} — PMID {m["pmid"]}')
        else:
            lines.append(f'  PMID {m["pmid"]}')
        lines.append('')

    lines.append('Update the relevant calculator in /var/www/noahpac-portal/calculators/ if logic changed.')
    message = '\n'.join(lines)

    print(message)
    push_notify(user, token, 'Calculator Guideline Update Detected', message)
    _write_quarterly_result('calculators', 'Clinical Calculators', CALC_URL, 'changed', [
        {'search': name, 'title': m['title'], 'pmid': m['pmid'],
         'journal': m['journal'], 'pubdate': m['pubdate']}
        for name, m in all_new
    ])
    print('Notification sent.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
