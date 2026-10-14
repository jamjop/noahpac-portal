'use strict';

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function clean(s){return String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}

const LABEL_SECTIONS = [
  {key:'indications_and_usage',        label:'Indications & Usage'},
  {key:'dosage_and_administration',     label:'Dosage & Administration'},
  {key:'contraindications',             label:'Contraindications'},
  {key:'warnings_and_cautions',         label:'Warnings & Precautions', fallback:'warnings'},
  {key:'adverse_reactions',             label:'Adverse Reactions'},
  {key:'drug_interactions',             label:'Drug Interactions'},
  {key:'use_in_specific_populations',   label:'Use in Specific Populations'},
  {key:'clinical_pharmacology',         label:'Clinical Pharmacology'},
  {key:'how_supplied',                  label:'How Supplied / Storage'},
];

const TRUNC = 600;
const fullTexts = new Map();
const queryInput = document.getElementById('q');
const clearSearch = document.getElementById('clearSearch');

function syncSearchState(q, {replace = false} = {}) {
  clearSearch.hidden = !q;
  const url = new URL(location.href);
  if (q) url.searchParams.set('q', q);
  else url.searchParams.delete('q');
  history[replace ? 'replaceState' : 'pushState']({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function setContent(html){
  const content = document.getElementById('content');
  content.innerHTML = html;
  content.setAttribute('aria-busy', 'false');
}

function spin(on){
  document.getElementById('content').innerHTML = on
    ? '<div class="state"><div class="spinner"></div>Loading FDA label data…</div>'
    : document.getElementById('content').innerHTML;
}

async function search(q) {
  if (!q.trim()) return;
  const content = document.getElementById('content');
  content.setAttribute('aria-busy', 'true');
  content.innerHTML = '<div class="reference-status state" role="status"><div><span class="spinner" aria-hidden="true"></span>Loading FDA label data…</div></div>';
  try {
    const [labelRes, recallRes] = await Promise.allSettled([
      fetch(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(q)}"&limit=1`).then(r=>r.json()),
      fetch(`https://api.fda.gov/drug/enforcement.json?search=openfda.generic_name:"${encodeURIComponent(q)}"&limit=6&sort=recall_initiation_date:desc`).then(r=>r.json()),
    ]);

    const labelData = labelRes.status === 'fulfilled' ? labelRes.value : null;
    const recallData = recallRes.status === 'fulfilled' ? recallRes.value : null;

    if (!labelData || labelData.error || !labelData.results?.length) {
      setContent(`<div class="err" role="alert">No FDA label found for "<strong>${esc(q)}</strong>". Try a generic name (e.g. metformin, lisinopril).</div>`);
      return;
    }

    renderDrug(labelData.results[0], recallData?.results || [], q);
  } catch(e) {
    setContent(`<div class="err" role="alert">Network error: ${esc(e.message)}</div>`);
  }
}

function renderDrug(label, recalls, q) {
  fullTexts.clear();
  const openfda = label.openfda || {};

  const genericNames = (openfda.generic_name || []).map(n => n.toLowerCase()
    .split(' ').map(w => w.charAt(0).toUpperCase()+w.slice(1)).join(' '));
  const brandNames  = openfda.brand_name  || [];
  const routes      = openfda.route       || [];

  const title = genericNames[0] || q;

  // Drug header
  let html = `<section class="drug-header-card" aria-labelledby="drug-result-title">
    <div class="drug-header-card__title-row">
      <div><p class="drug-result-eyebrow">FDA label match</p><h2 class="drug-title" id="drug-result-title">${esc(title)}</h2></div>
      <button class="result-link-button" type="button" data-action="copy-link">Copy link</button>
    </div>
    <div class="drug-meta">
      ${routes.map(r=>`<span class="meta-pill route">${esc(r)}</span>`).join('')}
      ${brandNames.slice(0,6).map(b=>`<span class="meta-pill brand">${esc(b)}</span>`).join('')}
      ${genericNames.slice(1,4).map(g=>`<span class="meta-pill">${esc(g)}</span>`).join('')}
    </div>
  </section>`;

  // Boxed warning
  if (label.boxed_warning) {
    const text = clean(Array.isArray(label.boxed_warning) ? label.boxed_warning.join('\n\n') : label.boxed_warning);
    html += `<section class="boxed-warning" aria-labelledby="boxed-warning-title">
      <div class="boxed-warning-label" id="boxed-warning-title">Boxed Warning (Black Box)</div>
      <div class="boxed-warning-text">${esc(text)}</div>
    </section>`;
  }

  // Label sections
  for (const sec of LABEL_SECTIONS) {
    let raw = label[sec.key];
    if (!raw && sec.fallback) raw = label[sec.fallback];
    if (!raw) continue;
    const text = clean(Array.isArray(raw) ? raw.join('\n\n') : raw);
    if (!text) continue;

    const id = `sec-${sec.key}`;
    const truncated = text.length > TRUNC;
    const display = truncated ? text.slice(0, TRUNC) + '…' : text;
    if (truncated) fullTexts.set(id, text);

    html += `<section class="label-section">
      <button class="label-head" type="button" aria-expanded="false" aria-controls="${esc(id)}" data-sec="${esc(id)}">
        <span class="label-title">${esc(sec.label)}</span>
        <span class="label-chevron" aria-hidden="true">▾</span>
      </button>
      <div class="label-body" id="${esc(id)}" hidden>
        <div class="label-text" id="${esc(id)}-text">${esc(display)}</div>
        ${truncated ? `<button class="show-more" data-sec="${esc(id)}">Show full section</button>` : ''}
      </div>
    </section>`;
  }

  // Recalls
  html += `<section class="recalls-section" aria-labelledby="recalls-title"><h2 class="recalls-head" id="recalls-title">Recent Recalls</h2>`;
  if (!recalls.length) {
    html += `<div class="no-recalls">No recent recalls found for this drug</div>`;
  } else {
    for (const r of recalls) {
      const cls = r.classification === 'Class I' ? 'cls1' : r.classification === 'Class II' ? 'cls2' : 'cls3';
      const date = r.recall_initiation_date
        ? r.recall_initiation_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
        : '';
      html += `<div class="recall-card">
        <div class="recall-header">
          <span class="recall-class ${cls}">${esc(r.classification||'')}</span>
          <span class="recall-date">${esc(date)}</span>
          <span class="recall-status">${esc(r.status||'')}</span>
        </div>
        <div class="recall-reason">${esc(r.reason_for_recall||'').slice(0,160)}</div>
        <div class="recall-product">${esc(r.product_description||'').slice(0,200)}</div>
      </div>`;
    }
  }
  html += `</section>`;

  setContent(html);
}

// Accordion toggle
document.getElementById('content').addEventListener('click', e => {
  const linkButton = e.target.closest('[data-action="copy-link"]');
  if (linkButton) {
    navigator.clipboard.writeText(location.href).then(() => {
      linkButton.textContent = 'Copied';
      linkButton.classList.add('copied');
      setTimeout(() => { linkButton.textContent = 'Copy link'; linkButton.classList.remove('copied'); }, 1800);
    });
    return;
  }
  const head = e.target.closest('.label-head');
  if (head) {
    const secId = head.dataset.sec;
    const body = document.getElementById(secId);
    const open = head.getAttribute('aria-expanded') === 'true';
    head.setAttribute('aria-expanded', String(!open));
    body.classList.toggle('open', !open);
    body.hidden = open;
    return;
  }
  const btn = e.target.closest('.show-more');
  if (btn) {
    const secId = btn.dataset.sec;
    const full = fullTexts.get(secId);
    if (full) {
      document.getElementById(`${secId}-text`).textContent = full;
      btn.remove();
    }
  }
});

// Search submission
document.getElementById('drugSearchForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = queryInput.value.trim();
  if (!q) return;
  syncSearchState(q);
  search(q);
});

queryInput.addEventListener('input', () => { clearSearch.hidden = !queryInput.value.trim(); });
clearSearch.addEventListener('click', () => {
  queryInput.value = '';
  syncSearchState('');
  setContent('<div class="reference-status state" role="status">Enter a drug name to retrieve FDA label data and recent recalls.</div>');
  queryInput.focus();
});

window.addEventListener('popstate', () => {
  const q = new URLSearchParams(location.search).get('q') || '';
  queryInput.value = q;
  clearSearch.hidden = !q;
  if (q) search(q);
  else setContent('<div class="reference-status state" role="status">Enter a drug name to retrieve FDA label data and recent recalls.</div>');
});

// Deep-link: ?q=
const urlQ = new URLSearchParams(location.search).get('q');
if (urlQ) {
  queryInput.value = urlQ;
  syncSearchState(urlQ, {replace:true});
  search(urlQ);
}
