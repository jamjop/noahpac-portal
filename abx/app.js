'use strict';

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

const CATS = [
  {id:'cns',         label:'CNS'},
  {id:'ent',         label:'ENT'},
  {id:'pulmonary',   label:'Pulmonary'},
  {id:'cardiac',     label:'Cardiac'},
  {id:'gi',          label:'GI / Abdominal'},
  {id:'gu',          label:'Genitourinary'},
  {id:'ssti',        label:'Skin & Soft Tissue'},
  {id:'bone',        label:'Bone & Joint'},
  {id:'bloodstream', label:'Bloodstream / Sepsis'},
  {id:'tickborne',   label:'Tick-borne'},
];

const ABX = [
  ...ABX_CNS,
  ...ABX_ENT,
  ...ABX_PULMONARY,
  ...ABX_CARDIAC,
  ...ABX_GI,
  ...ABX_GU,
  ...ABX_SSTI,
  ...ABX_BONE,
  ...ABX_BLOODSTREAM,
  ...ABX_TICKBORNE,
];

let currentId = null;
const searchInput = document.getElementById('abxSearch');
const clearSearch = document.getElementById('clearSearch');

function syncUrl({replace = false} = {}) {
  const url = new URL(location.href);
  const q = searchInput.value.trim();
  if (currentId) url.searchParams.set('condition', currentId);
  else url.searchParams.delete('condition');
  if (q) url.searchParams.set('q', q);
  else url.searchParams.delete('q');
  history[replace ? 'replaceState' : 'pushState']({}, '', `${url.pathname}${url.search}${url.hash}`);
}

// ── Navigation ──────────────────────────────────────────────────────────────

function buildNav() {
  const q = searchInput.value.trim().toLowerCase();
  const nav = document.getElementById('tabNav');
  nav.innerHTML = '';
  clearSearch.hidden = !q;
  let resultCount = 0;

  for (const cat of CATS) {
    const items = ABX.filter(a => {
      if (a.cat !== cat.id) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.organism.toLowerCase().includes(q);
    });
    if (items.length === 0) continue;
    resultCount += items.length;

    const hasActive = items.some(a => a.id === currentId);
    const isOpen = hasActive || q.length > 0;

    const section = document.createElement('div');
    section.className = 'nav-section' + (isOpen ? ' open' : '');

    const hdr = document.createElement('button');
    hdr.className = 'nav-section-hdr';
    hdr.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    hdr.innerHTML = `<span>${esc(cat.label)}</span><span class="nav-chevron"></span>`;
    hdr.addEventListener('click', () => {
      const nowOpen = section.classList.toggle('open');
      hdr.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
    });

    const list = document.createElement('div');
    list.className = 'nav-section-list';

    for (const a of items) {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (currentId === a.id ? ' active' : '');
      btn.dataset.id = a.id;
      btn.textContent = a.name;
      btn.setAttribute('aria-current', currentId === a.id ? 'true' : 'false');
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showAbx(a.id);
      });
      list.appendChild(btn);
    }

    section.appendChild(hdr);
    section.appendChild(list);
    nav.appendChild(section);
  }
  document.getElementById('abxResultCount').textContent = `${resultCount} condition${resultCount === 1 ? '' : 's'}`;
  if (!resultCount) nav.innerHTML = '<p class="nav-empty">No conditions match this search.</p>';
}

// ── Detail pane ─────────────────────────────────────────────────────────────

function showAbx(id, {replace = false} = {}) {
  currentId = id;
  const a = ABX.find(x => x.id === id);
  if (!a) return;
  syncUrl({replace});
  buildNav();

  const catLabel = CATS.find(c => c.id === a.cat)?.label || a.cat;
  let html = `
    <div class="abx-eyebrow">${esc(catLabel)}</div>
    <div class="abx-title">${esc(a.name)}</div>
    <div class="abx-organism">${esc(a.organism)}</div>
    <div class="abx-source">Source: ${esc(a.source)}</div>`;

  for (const reg of a.regimens) {
    const cls = reg.cls ? ` ${esc(reg.cls)}` : '';
    html += `<div class="reg-label${cls}">${esc(reg.label)}</div><div class="drugs">`;
    for (const d of reg.drugs) {
      const dcls = reg.cls === 'fl' ? ' fl' : '';
      html += `<div class="drug${dcls}">
        <div class="drug-name">${esc(d.name)}</div>
        ${d.dose ? `<div class="drug-dose">${esc(d.dose)}</div>` : ''}
        ${d.note ? `<div class="drug-note">${esc(d.note)}</div>` : ''}
      </div>`;
    }
    html += `</div>`;
  }

  if (a.notes) {
    html += `<div class="abx-note">${esc(a.notes)}</div>`;
  }

  if (a.id === 'pharyngitis') {
    html += `<section class="centor-tool" aria-labelledby="centor-title">
      <div class="reg-label" id="centor-title">McIsaac testing support</div>
      <p class="centor-intro">Use only for patients age ≥3 years without clear viral features. This score supports a testing decision; it does not justify empiric antibiotics.</p>
      <div class="centor-age">
        <label for="centor-age">Age</label>
        <select id="centor-age"><option value="under3">Under 3</option><option value="3to14">3–14</option><option value="15to44" selected>15–44</option><option value="45plus">45 or older</option></select>
      </div>
      <div class="centor-checks">
        <label><input type="checkbox" id="centor-exudate"> Tonsillar exudate or swelling <span>+1</span></label>
        <label><input type="checkbox" id="centor-nodes"> Tender anterior cervical nodes <span>+1</span></label>
        <label><input type="checkbox" id="centor-fever"> Temperature &gt;38°C (100.4°F) <span>+1</span></label>
        <label><input type="checkbox" id="centor-no-cough"> Absence of cough <span>+1</span></label>
        <label><input type="checkbox" id="centor-viral"> Clear viral symptoms (cough, rhinorrhea, hoarseness, oral ulcers, conjunctivitis)</label>
        <label><input type="checkbox" id="centor-high-risk"> High-risk host or concerning presentation</label>
      </div>
      <div id="centor-result" class="centor-result" role="status" aria-live="polite"></div>
      <p class="centor-source">CDC/IDSA: do not test when clear viral symptoms are present. When viral features are absent, confirm GAS microbiologically before treatment. Back up a negative RADT with throat culture in symptomatic children age ≥3; this is not routinely indicated in adults.</p>
    </section>`;
  }

  html += `<div class="abx-actions"><button class="copy-btn" id="copyBtn">&#x2398; Copy regimen</button><button class="copy-btn copy-btn--secondary" id="copyLinkBtn">Copy link</button></div>`;
  document.getElementById('pane').innerHTML = html;
  document.getElementById('copyBtn').addEventListener('click', copyRegimen);
  document.getElementById('copyLinkBtn').addEventListener('click', copyLink);
  if (a.id === 'pharyngitis') {
    document.querySelectorAll('.centor-tool input, .centor-tool select').forEach(control => {
      control.addEventListener('change', updateCentor);
    });
    updateCentor();
  }
}

function copyLink() {
  navigator.clipboard.writeText(location.href).then(() => {
    const btn = document.getElementById('copyLinkBtn');
    btn.textContent = 'Copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy link'; btn.classList.remove('copied'); }, 1800);
  });
}

function updateCentor() {
  const age = document.getElementById('centor-age').value;
  const result = document.getElementById('centor-result');
  if (age === 'under3') {
    result.innerHTML = '<strong>Not applicable under age 3.</strong><span>GAS pharyngitis is uncommon; evaluate and test only in selected circumstances using current pediatric guidance.</span>';
    return;
  }
  const viral = document.getElementById('centor-viral').checked;
  const highRisk = document.getElementById('centor-high-risk').checked;
  let score = ['centor-exudate','centor-nodes','centor-fever','centor-no-cough']
    .reduce((sum,id)=>sum+(document.getElementById(id).checked?1:0),0);
  if (age === '3to14') score += 1;
  if (age === '45plus') score -= 1;
  let guidance;
  if (viral) guidance = 'Clear viral features: GAS testing is generally not indicated.';
  else if (highRisk) guidance = 'Do not rely on the score alone; test and assess using the higher-risk clinical context.';
  else if (score <= 0) guidance = 'Very low clinical probability; GAS testing is generally not indicated.';
  else if (score === 1) guidance = 'Low clinical probability; testing is usually unnecessary, subject to local practice and epidemiology.';
  else guidance = 'Perform RADT, NAAT, or throat culture per local practice. Treat only a confirmed GAS infection.';
  result.innerHTML = `<strong>McIsaac score: ${score}</strong><span>${esc(guidance)}</span>`;
}

// ── Clipboard copy ──────────────────────────────────────────────────────────

function copyRegimen() {
  const a = ABX.find(x => x.id === currentId);
  if (!a) return;
  const lines = [`${a.name}`, `Organism: ${a.organism}`, ''];
  for (const reg of a.regimens) {
    lines.push(reg.label.toUpperCase());
    for (const d of reg.drugs) {
      lines.push(`  ${d.name}${d.dose ? '  —  ' + d.dose : ''}`);
      if (d.note) lines.push(`    Note: ${d.note}`);
    }
    lines.push('');
  }
  if (a.notes) { lines.push(`Clinical Notes: ${a.notes}`); lines.push(''); }
  lines.push(`Source: ${a.source} — noahpac.com/abx/`);
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = 'Copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.innerHTML = '&#x2398; Copy regimen'; btn.classList.remove('copied'); }, 2000);
  });
}

searchInput.addEventListener('input', () => { buildNav(); syncUrl({replace:true}); });
clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  buildNav();
  syncUrl({replace:true});
  searchInput.focus();
});
const initialParams = new URLSearchParams(location.search);
searchInput.value = initialParams.get('q') || '';
buildNav();
const initialCondition = initialParams.get('condition');
if (ABX.some(item => item.id === initialCondition)) showAbx(initialCondition, {replace:true});
