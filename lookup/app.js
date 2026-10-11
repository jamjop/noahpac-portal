'use strict';

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

const TABS = [
  {id:'icd',   label:'ICD-10-CM', searchLabel:'Search ICD-10-CM', ph:'Search diagnoses — "pneumonia", "E11", "chest pain"'},
  {id:'drug',  label:'Drugs', searchLabel:'Search RxTerms drug names', ph:'Search drug names — "metformin", "lisinopril", "amoxicillin"'},
  {id:'loinc', label:'LOINC', searchLabel:'Search LOINC laboratory terms', ph:'Search lab tests — "sodium", "TSH", "hemoglobin a1c"'},
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
  document.getElementById('results').setAttribute('aria-busy', String(on));
}

function setResults(html) {
  document.getElementById('results').innerHTML = html;
}

function debounce() {
  clearTimeout(debTimer);
  const q = document.getElementById('q').value.trim();
  if (q.length < 2) { setResults('<div class="reference-status state">Type at least two characters to search.</div>'); return; }
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
    setResults(`<div class="err" role="alert">Unable to load results: ${esc(e.message)}</div>`);
  } finally {
    spin(false);
  }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function render({type, total, items}, q) {
  if (!items.length) {
    setResults(`<div class="reference-status state">No results for &ldquo;${esc(q)}&rdquo;.</div>`);
    return;
  }
  const countHtml = `<div class="result-count" role="status">${total.toLocaleString()} match${total===1?'':'es'} &middot; showing ${items.length}</div>`;
  let rows = '';

  if (type === 'icd') {
    rows = items.map(({code,name}) =>
      `<article class="rrow">
        <span class="code-chip">${esc(code)}</span>
        <span class="rname">${esc(name)}</span>
        <button class="abtn" type="button" data-action="copy" data-val="${esc(code)} – ${esc(name)}" aria-label="Copy ${esc(code)} and description">Copy</button>
       </article>`
    ).join('');

  } else if (type === 'drug') {
    rows = items.map(({name,rxcui,route}) => {
      const base = name.split(' ')[0];
      return `<article class="rrow">
        <span class="rname">${esc(name)}</span>
        ${route ? `<span class="route-chip">${esc(route)}</span>` : ''}
        ${rxcui ? `<span class="rxcui">RxCUI ${esc(rxcui)}</span>` : ''}
        <button class="abtn ext" type="button" data-action="drugref" data-val="${esc(base)}">FDA label <span aria-hidden="true">→</span></button>
        <button class="abtn" type="button" data-action="copy" data-val="${esc(name)}" aria-label="Copy ${esc(name)}">Copy</button>
       </article>`;
    }).join('');

  } else {
    rows = items.map(({code,name,cls}) =>
      `<article class="rrow">
        <span class="code-chip">${esc(code)}</span>
        <span class="rname">${esc(name)}</span>
        ${cls ? `<span class="cls-chip">${esc(cls)}</span>` : ''}
        <button class="abtn" type="button" data-action="copy" data-val="${esc(code)} – ${esc(name)}" aria-label="Copy ${esc(code)} and description">Copy</button>
       </article>`
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
    `<button class="reference-tab tab-pill${t.id===tab?' active':''}" type="button" role="tab" id="tab-${t.id}" aria-controls="resultPanel" aria-selected="${t.id===tab}" tabindex="${t.id===tab?'0':'-1'}" data-id="${t.id}">${esc(t.label)}</button>`
  ).join('');
  el.addEventListener('click', e => {
    const btn = e.target.closest('.tab-pill');
    if (!btn) return;
    activateTab(btn.dataset.id, {focusSearch:true});
  });
  el.addEventListener('keydown', e => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
    e.preventDefault();
    const tabs = [...el.querySelectorAll('[role="tab"]')];
    const current = tabs.indexOf(document.activeElement);
    let next = current;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else if (e.key === 'ArrowRight') next = (current + 1 + tabs.length) % tabs.length;
    else next = (current - 1 + tabs.length) % tabs.length;
    tabs[next].focus();
    activateTab(tabs[next].dataset.id, {focusSearch:false});
  });
}

function activateTab(nextTab, {focusSearch} = {focusSearch:false}) {
  if (!TABS.some(t => t.id === nextTab)) return;
  tab = nextTab;
  const config = TABS.find(t => t.id === tab);
  document.querySelectorAll('#tabs [role="tab"]').forEach(btn => {
    const active = btn.dataset.id === tab;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
    btn.tabIndex = active ? 0 : -1;
  });
  const inp = document.getElementById('q');
  inp.placeholder = config.ph;
  document.getElementById('lookupSearchLabel').textContent = config.searchLabel;
  document.getElementById('resultPanel').setAttribute('aria-labelledby', `tab-${tab}`);
  if (focusSearch) inp.focus();
  const q = inp.value.trim();
  if (q.length >= 2) debounce();
  else setResults('<div class="reference-status state">Type at least two characters to search.</div>');
}

// ── Init ──────────────────────────────────────────────────────────────────────

buildTabs();
const qEl = document.getElementById('q');
qEl.placeholder = TABS[0].ph;
qEl.addEventListener('input', debounce);
document.addEventListener('keydown', e => {
  const target = e.target;
  const editing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
  if (e.key === '/' && !editing) { e.preventDefault(); qEl.focus(); }
});
