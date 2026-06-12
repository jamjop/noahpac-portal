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

function setContent(html){document.getElementById('content').innerHTML = html;}

function spin(on){
  document.getElementById('content').innerHTML = on
    ? '<div class="state"><div class="spinner"></div>Loading FDA label data…</div>'
    : document.getElementById('content').innerHTML;
}

async function search(q) {
  if (!q.trim()) return;
  document.getElementById('content').innerHTML = '<div class="state"><div class="spinner"></div>Loading FDA label data…</div>';
  try {
    const [labelRes, recallRes] = await Promise.allSettled([
      fetch(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(q)}"&limit=1`).then(r=>r.json()),
      fetch(`https://api.fda.gov/drug/enforcement.json?search=openfda.generic_name:"${encodeURIComponent(q)}"&limit=6&sort=recall_initiation_date:desc`).then(r=>r.json()),
    ]);

    const labelData = labelRes.status === 'fulfilled' ? labelRes.value : null;
    const recallData = recallRes.status === 'fulfilled' ? recallRes.value : null;

    if (!labelData || labelData.error || !labelData.results?.length) {
      setContent(`<div class="err">No FDA label found for "<strong>${esc(q)}</strong>". Try a generic name (e.g. metformin, lisinopril).</div>`);
      return;
    }

    renderDrug(labelData.results[0], recallData?.results || [], q);
  } catch(e) {
    setContent(`<div class="err">Network error: ${esc(e.message)}</div>`);
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
  let html = `<div class="drug-header-card">
    <div class="drug-title">${esc(title)}</div>
    <div class="drug-meta">
      ${routes.map(r=>`<span class="meta-pill route">${esc(r)}</span>`).join('')}
      ${brandNames.slice(0,6).map(b=>`<span class="meta-pill brand">${esc(b)}</span>`).join('')}
      ${genericNames.slice(1,4).map(g=>`<span class="meta-pill">${esc(g)}</span>`).join('')}
    </div>
  </div>`;

  // Boxed warning
  if (label.boxed_warning) {
    const text = clean(Array.isArray(label.boxed_warning) ? label.boxed_warning.join('\n\n') : label.boxed_warning);
    html += `<div class="boxed-warning">
      <div class="boxed-warning-label">Boxed Warning (Black Box)</div>
      <div class="boxed-warning-text">${esc(text)}</div>
    </div>`;
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

    html += `<div class="label-section">
      <div class="label-head" aria-expanded="false" data-sec="${esc(id)}">
        <span class="label-title">${esc(sec.label)}</span>
        <span class="label-chevron">▾</span>
      </div>
      <div class="label-body" id="${esc(id)}">
        <div class="label-text" id="${esc(id)}-text">${esc(display)}</div>
        ${truncated ? `<button class="show-more" data-sec="${esc(id)}">Show full section</button>` : ''}
      </div>
    </div>`;
  }

  // Recalls
  html += `<div class="recalls-section"><div class="recalls-head">Recent Recalls</div>`;
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
  html += `</div>`;

  setContent(html);
}

// Accordion toggle
document.getElementById('content').addEventListener('click', e => {
  const head = e.target.closest('.label-head');
  if (head) {
    const secId = head.dataset.sec;
    const body = document.getElementById(secId);
    const open = head.getAttribute('aria-expanded') === 'true';
    head.setAttribute('aria-expanded', String(!open));
    body.classList.toggle('open', !open);
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

// Search button / enter
document.getElementById('searchBtn').addEventListener('click', () => {
  search(document.getElementById('q').value.trim());
});
document.getElementById('q').addEventListener('keydown', e => {
  if (e.key === 'Enter') search(document.getElementById('q').value.trim());
});

// Deep-link: ?q=
const urlQ = new URLSearchParams(location.search).get('q');
if (urlQ) {
  document.getElementById('q').value = urlQ;
  search(urlQ);
}
