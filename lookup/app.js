'use strict';

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

const TABS = [
  {id:'icd',   label:'ICD-10',       ph:'Search diagnoses — "pneumonia", "E11", "chest pain"'},
  {id:'drug',  label:'Drugs',         ph:'Search drug names — "metformin", "lisinopril", "amoxicillin"'},
  {id:'loinc', label:'LOINC',         ph:'Search lab tests — "sodium", "TSH", "hemoglobin a1c"'},
];

let tab = 'icd';
let debTimer = null;
let ctrl = null;

// ── NLM fetch helpers ─────────────────────────────────────────────────────────

async function fetchICD(q, signal) {
  const url = `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?terms=${encodeURIComponent(q)}&maxList=20&sf=code,name&df=code,name`;
  const r = await fetch(url, {signal}).then(r => r.json());
  return {type:'icd', total:r[0]||0, items:(r[3]||[]).map(([code,name]) => ({code,name}))};
}

async function fetchDrug(q, signal) {
  const url = `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encodeURIComponent(q)}&maxList=20&ef=RXCUI,ROUTE`;
  const r = await fetch(url, {signal}).then(r => r.json());
  const names = r[1] || [];
  const rxcui = r[2]?.RXCUI || [];
  const route = r[2]?.ROUTE || [];
  return {type:'drug', total:r[0]||0, items:names.map((name,i) => ({name, rxcui:String(rxcui[i]||''), route:String(route[i]||'')}))};
}

async function fetchLOINC(q, signal) {
  const url = `https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?terms=${encodeURIComponent(q)}&maxList=20&sf=LOINC_NUM,LONG_COMMON_NAME&df=LOINC_NUM,LONG_COMMON_NAME,CLASS`;
  const r = await fetch(url, {signal}).then(r => r.json());
  return {type:'loinc', total:r[0]||0, items:(r[3]||[]).map(([code,name,cls]) => ({code,name,cls:cls||''}))};
}

const FETCHERS = {icd:fetchICD, drug:fetchDrug, loinc:fetchLOINC};

// ── Search orchestration ──────────────────────────────────────────────────────

function spin(on) {
  document.getElementById('spinner').classList.toggle('on', on);
  document.getElementById('searchIcon').style.display = on ? 'none' : '';
}

function setResults(html) {
  document.getElementById('results').innerHTML = html;
}

function debounce() {
  clearTimeout(debTimer);
  const q = document.getElementById('q').value.trim();
  if (q.length < 2) { setResults('<div class="state">Type at least 2 characters</div>'); return; }
  debTimer = setTimeout(run, 280);
}

async function run() {
  const q = document.getElementById('q').value.trim();
  if (q.length < 2) return;
  if (ctrl) ctrl.abort();
  ctrl = new AbortController();
  spin(true);
  try {
    const data = await FETCHERS[tab](q, ctrl.signal);
    render(data, q);
  } catch(e) {
    if (e.name === 'AbortError') return;
    setResults(`<div class="err">Error: ${esc(e.message)}</div>`);
  } finally {
    spin(false);
  }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function render({type, total, items}, q) {
  if (!items.length) {
    setResults(`<div class="state">No results for &ldquo;${esc(q)}&rdquo;</div>`);
    return;
  }
  const countHtml = `<div class="result-count">${total.toLocaleString()} match${total===1?'':'es'} &middot; showing ${items.length}</div>`;
  let rows = '';

  if (type === 'icd') {
    rows = items.map(({code,name}) =>
      `<div class="rrow">
        <span class="code-chip">${esc(code)}</span>
        <span class="rname">${esc(name)}</span>
        <button class="abtn" data-action="copy" data-val="${esc(code)} – ${esc(name)}">Copy</button>
       </div>`
    ).join('');

  } else if (type === 'drug') {
    rows = items.map(({name,rxcui,route}) => {
      const base = name.split(' ')[0];
      return `<div class="rrow">
        <span class="rname">${esc(name)}</span>
        ${route ? `<span class="route-chip">${esc(route)}</span>` : ''}
        ${rxcui ? `<span class="rxcui">RxCUI ${esc(rxcui)}</span>` : ''}
        <button class="abtn ext" data-action="drugref" data-val="${esc(base)}">Drug label →</button>
        <button class="abtn" data-action="copy" data-val="${esc(name)}">Copy</button>
       </div>`;
    }).join('');

  } else {
    rows = items.map(({code,name,cls}) =>
      `<div class="rrow">
        <span class="code-chip">${esc(code)}</span>
        <span class="rname">${esc(name)}</span>
        ${cls ? `<span class="cls-chip">${esc(cls)}</span>` : ''}
        <button class="abtn" data-action="copy" data-val="${esc(code)} – ${esc(name)}">Copy</button>
       </div>`
    ).join('');
  }

  setResults(countHtml + `<div class="result-list">${rows}</div>`);
}

// ── Event delegation for result actions ──────────────────────────────────────

document.getElementById('results').addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  if (btn.dataset.action === 'copy') {
    navigator.clipboard.writeText(btn.dataset.val).then(() => {
      const orig = btn.textContent;
      btn.textContent = '✓ Copied';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);
    });
  } else if (btn.dataset.action === 'drugref') {
    window.location.href = `/drugref/?q=${encodeURIComponent(btn.dataset.val)}`;
  }
});

// ── Tab navigation ────────────────────────────────────────────────────────────

function buildTabs() {
  const el = document.getElementById('tabs');
  el.innerHTML = TABS.map(t =>
    `<button class="tab-pill${t.id===tab?' active':''}" data-id="${t.id}">${esc(t.label)}</button>`
  ).join('');
  el.addEventListener('click', e => {
    const btn = e.target.closest('.tab-pill');
    if (!btn || btn.dataset.id === tab) return;
    tab = btn.dataset.id;
    el.querySelectorAll('.tab-pill').forEach(b => b.classList.toggle('active', b.dataset.id === tab));
    const inp = document.getElementById('q');
    inp.placeholder = TABS.find(t => t.id === tab).ph;
    inp.focus();
    const q = inp.value.trim();
    if (q.length >= 2) debounce();
    else setResults('<div class="state">Type to search</div>');
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────

buildTabs();
const qEl = document.getElementById('q');
qEl.placeholder = TABS[0].ph;
qEl.addEventListener('input', debounce);
document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== qEl) { e.preventDefault(); qEl.focus(); }
});
