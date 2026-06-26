#!/usr/bin/env python3
"""
check_updates.py — monitor PubMed for new guideline publications from sources
cited on noahpac.com/abx/. Alerts via Pushover when new papers appear.
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
ABX_URL      = "https://noahpac.com/abx/"

# Each entry targets one source cited in the abx reference pages (data/*.js).
# reldate: how many past days to search (400 safely covers a quarter + margin).
SEARCHES = [

    # ── Infectious Disease / General ────────────────────────────────────────
    {
        'id':      'idsa_general',
        'name':    'IDSA Practice Guidelines',
        'query':   '"Infectious Diseases Society of America" AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'shea_cdi',
        'name':    'SHEA / CDI Guidelines',
        'query':   '"Society for Healthcare Epidemiology of America" AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'idsa_bone',
        'name':    'IDSA Bone & Joint Guidelines',
        'query':   '"Infectious Diseases Society of America" AND (osteomyelitis OR "prosthetic joint" OR "septic arthritis" OR "bone and joint") AND (guideline[pt] OR update[ti] OR revision[ti])',
        'reldate': 400,
    },
    {
        'id':      'idsa_tick',
        'name':    'IDSA Tick-borne Disease Guidelines (Lyme, Babesia)',
        'query':   '"Infectious Diseases Society of America" AND (Lyme OR babesiosis OR Borrelia OR "tick-borne") AND (guideline[pt] OR update[ti])',
        'reldate': 730,
    },
    {
        'id':      'escmid',
        'name':    'ESCMID / European ID Guidelines',
        'query':   '"European Society of Clinical Microbiology and Infectious Diseases" AND guideline[pt]',
        'reldate': 400,
    },

    # ── Sepsis / Critical Care ──────────────────────────────────────────────
    {
        'id':      'ssc',
        'name':    'Surviving Sepsis Campaign',
        'query':   '"Surviving Sepsis Campaign" AND (guideline OR recommendation OR update)[ti]',
        'reldate': 400,
    },

    # ── Pulmonary / Respiratory ─────────────────────────────────────────────
    {
        'id':      'ats_resp',
        'name':    'ATS/IDSA Respiratory Guidelines (CAP/HAP/COPD)',
        'query':   '("American Thoracic Society" OR "IDSA") AND (pneumonia OR "community-acquired" OR "hospital-acquired" OR "ventilator-associated" OR COPD) AND guideline[pt]',
        'reldate': 400,
    },

    # ── GI / Hepatology ─────────────────────────────────────────────────────
    {
        'id':      'idsa_gi',
        'name':    'IDSA GI / C. diff Guidelines',
        'query':   '"Infectious Diseases Society of America" AND ("Clostridium difficile" OR "Clostridioides difficile" OR "intra-abdominal" OR diarrhea) AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'acg_pylori',
        'name':    'ACG H. pylori Guidelines',
        'query':   '"American College of Gastroenterology" AND "Helicobacter pylori" AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'aga_gi',
        'name':    'AGA Gastrointestinal Guidelines',
        'query':   '"American Gastroenterological Association" AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'aasld_sbp',
        'name':    'AASLD Liver Disease / SBP Guidelines',
        'query':   '"American Association for the Study of Liver Diseases" AND (peritonitis OR cirrhosis OR ascites OR "liver disease") AND (guideline[pt] OR practice guideline[pt])',
        'reldate': 400,
    },
    {
        'id':      'wses_biliary',
        'name':    'WSES / Tokyo Guidelines — Biliary & Intra-abdominal',
        'query':   '("World Society of Emergency Surgery" OR "Tokyo Guidelines") AND (cholangitis OR cholecystitis OR "intra-abdominal" OR peritonitis) AND (guideline[pt] OR update[ti])',
        'reldate': 730,
    },

    # ── GU / STI ────────────────────────────────────────────────────────────
    {
        'id':      'idsa_uti',
        'name':    'IDSA UTI / GU Guidelines',
        'query':   '"Infectious Diseases Society of America" AND ("urinary tract" OR pyelonephritis OR prostatitis) AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'cdc_sti',
        'name':    'CDC STI Treatment Guidelines',
        'query':   '"Centers for Disease Control" AND ("sexually transmitted" OR gonorrhea OR chlamydia OR "pelvic inflammatory" OR vaginosis OR trichomoniasis) AND (guideline[pt] OR recommendation[ti] OR update[ti])',
        'reldate': 400,
    },

    # ── Skin & Soft Tissue ──────────────────────────────────────────────────
    {
        'id':      'idsa_ssti',
        'name':    'IDSA SSTI Guidelines (Cellulitis, Abscess, NF)',
        'query':   '"Infectious Diseases Society of America" AND ("skin and soft tissue" OR cellulitis OR abscess OR "necrotizing fasciitis") AND guideline[pt]',
        'reldate': 400,
    },
    {
        'id':      'iwgdf',
        'name':    'IWGDF Diabetic Foot Guidelines',
        'query':   '"International Working Group on the Diabetic Foot" AND (guideline[pt] OR update[ti] OR recommendation[ti])',
        'reldate': 730,
    },

    # ── ENT ─────────────────────────────────────────────────────────────────
    {
        'id':      'aap_aom',
        'name':    'AAP Otitis Media / Pediatric ENT Guidelines',
        'query':   '"American Academy of Pediatrics" AND ("otitis media" OR rhinosinusitis OR pharyngitis) AND guideline[pt]',
        'reldate': 730,
    },
    {
        'id':      'aaoHNS',
        'name':    'AAO-HNS ENT Guidelines',
        'query':   '"American Academy of Otolaryngology" AND (guideline[pt] OR "clinical practice guideline"[ti])',
        'reldate': 400,
    },
    {
        'id':      'idsa_sinusitis',
        'name':    'IDSA Sinusitis / ENT Guidelines',
        'query':   '"Infectious Diseases Society of America" AND (sinusitis OR pharyngitis OR "upper respiratory") AND guideline[pt]',
        'reldate': 730,
    },

    # ── Cardiac / Endocarditis ──────────────────────────────────────────────
    {
        'id':      'aha_endocarditis',
        'name':    'AHA / ACC Endocarditis & Cardiac Infection Guidelines',
        'query':   '("American Heart Association" OR "American College of Cardiology") AND (endocarditis OR pericarditis OR "infective endocarditis") AND (guideline[pt] OR statement[pt] OR update[ti])',
        'reldate': 400,
    },
    {
        'id':      'esc_cardiac',
        'name':    'ESC Endocarditis / Cardiac Infection Guidelines',
        'query':   '"European Society of Cardiology" AND (endocarditis OR pericarditis) AND (guideline[pt] OR update[ti])',
        'reldate': 400,
    },

    # ── CNS ─────────────────────────────────────────────────────────────────
    {
        'id':      'idsa_cns',
        'name':    'IDSA CNS Infection Guidelines (Meningitis, Brain Abscess, Encephalitis)',
        'query':   '"Infectious Diseases Society of America" AND (meningitis OR encephalitis OR "brain abscess" OR "spinal epidural abscess") AND guideline[pt]',
        'reldate': 730,
    },
    {
        'id':      'escmid_cns',
        'name':    'ESCMID CNS Infection Guidelines',
        'query':   '"European Society of Clinical Microbiology and Infectious Diseases" AND (meningitis OR encephalitis OR "brain abscess") AND (guideline[pt] OR update[ti])',
        'reldate': 730,
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
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-abx-monitor/1.0'})
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
    req = urllib.request.Request(url, headers={'User-Agent': 'noahpac-abx-monitor/1.0'})
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
        'url':       ABX_URL,
        'url_title': 'noahpac.com/abx/',
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
        _write_quarterly_result('abx', 'Antibiotic Reference', ABX_URL, 'no_change', [])
        return 0

    # Build Pushover message
    lines = [f'{len(all_new)} new guideline publication(s) — review for abx updates:\n']
    for search_name, m in all_new:
        lines.append(f'[{search_name}]')
        lines.append(f'  {m["title"]}')
        if m['journal']:
            lines.append(f'  {m["journal"]} {m["pubdate"]} — PMID {m["pmid"]}')
        else:
            lines.append(f'  PMID {m["pmid"]}')
        lines.append('')

    lines.append('Update the relevant file in /var/www/noahpac-portal/abx/data/ if regimens changed.')
    message = '\n'.join(lines)

    print(message)
    push_notify(user, token, 'ABX Guideline Update Detected', message)
    _write_quarterly_result('abx', 'Antibiotic Reference', ABX_URL, 'changed', [
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
