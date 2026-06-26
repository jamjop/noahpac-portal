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

// ── Navigation ──────────────────────────────────────────────────────────────

function buildNav() {
  const q = document.getElementById('abxSearch').value.trim().toLowerCase();
  const nav = document.getElementById('tabNav');
  nav.innerHTML = '';

  for (const cat of CATS) {
    const items = ABX.filter(a => {
      if (a.cat !== cat.id) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.organism.toLowerCase().includes(q);
    });
    if (items.length === 0) continue;

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
}

// ── Detail pane ─────────────────────────────────────────────────────────────

function showAbx(id) {
  currentId = id;
  const a = ABX.find(x => x.id === id);
  if (!a) return;

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

  html += `<button class="copy-btn" id="copyBtn">&#x2398; Copy regimen</button>`;
  document.getElementById('pane').innerHTML = html;
  document.getElementById('copyBtn').addEventListener('click', copyRegimen);
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

document.getElementById('abxSearch').addEventListener('input', buildNav);
buildNav();
