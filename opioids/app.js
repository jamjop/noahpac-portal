'use strict';

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// Opioids — mme_oral = MME per mg (oral), mme_iv = MME per mg (IV/SC)
// fentanyl_patch: mme_td = MME per mcg/hr per day (CDC factor 2.4)
// methadone and buprenorphine: special = true (require clinical note)
const OPIOIDS = [
  {id:'morphine',    name:'Morphine',              mme_oral:1,    mme_iv:3,    routes:['Oral','IV / SC'],    unit:'mg'},
  {id:'oxycodone',   name:'Oxycodone',              mme_oral:1.5,              routes:['Oral'],              unit:'mg'},
  {id:'hydrocodone', name:'Hydrocodone',             mme_oral:1,                routes:['Oral'],              unit:'mg'},
  {id:'hydromorph',  name:'Hydromorphone',           mme_oral:4,    mme_iv:20,  routes:['Oral','IV / SC'],    unit:'mg'},
  {id:'oxymorphone', name:'Oxymorphone',             mme_oral:3,    mme_iv:10,  routes:['Oral','IV / SC'],    unit:'mg'},
  {id:'codeine',     name:'Codeine',                 mme_oral:0.15,             routes:['Oral'],              unit:'mg'},
  {id:'tramadol',    name:'Tramadol',                mme_oral:0.1,              routes:['Oral'],              unit:'mg'},
  {id:'tapentadol',  name:'Tapentadol',              mme_oral:0.4,              routes:['Oral'],              unit:'mg'},
  {id:'fentanyl_td', name:'Fentanyl Patch',          mme_td:2.4,                routes:['Transdermal'],       unit:'mcg/hr', patch:true},
  {id:'methadone',   name:'Methadone ⚠',        mme_oral:null,             routes:['Oral'],              unit:'mg', special:'methadone'},
  {id:'buprenorphine', name:'Buprenorphine SL ⚠', mme_oral:null,           routes:['Sublingual'],        unit:'mg', special:'buprenorphine'},
];

const FREQS = [
  {label:'q4h  (6×/day)',  val:6},
  {label:'q6h  (4×/day)',  val:4},
  {label:'q8h  (3×/day)',  val:3},
  {label:'q12h (2×/day)',  val:2},
  {label:'Once daily',     val:1},
];

function populateSelects() {
  const fromDrug = document.getElementById('fromDrug');
  const toDrug   = document.getElementById('toDrug');
  for (const op of OPIOIDS) {
    const o1 = document.createElement('option');
    o1.value = op.id; o1.textContent = op.name;
    fromDrug.appendChild(o1);
    const o2 = document.createElement('option');
    o2.value = op.id; o2.textContent = op.name;
    toDrug.appendChild(o2);
  }
  // default "to" to a different drug
  toDrug.selectedIndex = 1;

  const fromFreq = document.getElementById('fromFreq');
  fromFreq.innerHTML = '';
  for (const f of FREQS) {
    const o = document.createElement('option');
    o.value = f.val; o.textContent = f.label;
    if (f.val === 2) o.selected = true;
    fromFreq.appendChild(o);
  }

  populateRoutes('fromDrug', 'fromRoute', 'fromUnit');
  populateRoutes('toDrug', 'toRoute', null);
  buildRefTable();
}

function populateRoutes(drugSelId, routeSelId, unitId) {
  const drugId = document.getElementById(drugSelId).value;
  const op = OPIOIDS.find(o => o.id === drugId);
  const routeSel = document.getElementById(routeSelId);
  routeSel.innerHTML = '';
  if (op) {
    for (const r of op.routes) {
      const o = document.createElement('option');
      o.value = r; o.textContent = r;
      routeSel.appendChild(o);
    }
  }
  if (unitId && op) {
    document.getElementById(unitId).textContent = op.unit;
  }
  // hide route select if only one option
  const field = routeSel.closest('.field');
  if (field) field.style.display = op && op.routes.length <= 1 ? 'none' : '';
}

function getMME(opioid, route, dosePerAdmin, freq) {
  if (!opioid || isNaN(dosePerAdmin) || dosePerAdmin <= 0) return null;
  if (opioid.special) return null;

  if (opioid.patch) {
    // fentanyl patch: MME/day = mcg/hr × 2.4 (dose is mcg/hr)
    return dosePerAdmin * opioid.mme_td;
  }

  const isIV = route === 'IV / SC';
  const mme_per_mg = isIV ? opioid.mme_iv : opioid.mme_oral;
  if (!mme_per_mg) return null;

  return dosePerAdmin * mme_per_mg * freq;
}

function mmeClass(mme) {
  if (mme === null) return '';
  if (mme < 50) return 'ok';
  if (mme < 90) return 'warn';
  return 'risk';
}

function calcAndRender() {
  const fromOp = OPIOIDS.find(o => o.id === document.getElementById('fromDrug').value);
  const fromRoute = document.getElementById('fromRoute').value;
  const fromDose = parseFloat(document.getElementById('fromDose').value);
  const freq = parseInt(document.getElementById('fromFreq').value);

  const toOp = OPIOIDS.find(o => o.id === document.getElementById('toDrug').value);
  const toRoute = document.getElementById('toRoute').value;
  const reduction = parseInt(document.getElementById('reduction').value) / 100;

  // ── Current MME display ──
  const currentMmeEl = document.getElementById('currentMme');

  if (fromOp && fromOp.special) {
    currentMmeEl.innerHTML = specialNote(fromOp.special);
  } else {
    const mme = getMME(fromOp, fromRoute, fromDose, freq);
    if (mme === null || isNaN(mme)) {
      currentMmeEl.innerHTML = '<span class="mme-placeholder">Enter dose above</span>';
    } else {
      const cls = mmeClass(mme);
      let flagHtml = '';
      if (mme >= 90) flagHtml = '<div class="mme-flag risk">⚠ ≥90 MME/day — high risk threshold (CDC 2022)</div>';
      else if (mme >= 50) flagHtml = '<div class="mme-flag warn">⚠ ≥50 MME/day — moderate risk; reassess necessity</div>';
      const patchNote = fromOp && fromOp.patch ? `<div class="conv-detail">${esc(fromOp.name)} ${fromDose} mcg/hr — daily dose (patch worn continuously)</div>` : '';
      currentMmeEl.innerHTML = `
        <div class="mme-row">
          <span class="mme-num ${esc(cls)}">${mme.toFixed(1)}</span>
          <span class="mme-label">MME / day</span>
        </div>
        ${patchNote}
        ${flagHtml}`;
    }
  }

  // ── Conversion display ──
  const convEl = document.getElementById('convResult');

  if (toOp && toOp.special) {
    convEl.innerHTML = specialNote(toOp.special);
    return;
  }

  const fromMme = fromOp && !fromOp.special ? getMME(fromOp, fromRoute, fromDose, freq) : null;

  if (fromMme === null || isNaN(fromMme) || !toOp) {
    convEl.innerHTML = '<span class="mme-placeholder">Enter current dose to calculate conversion</span>';
    return;
  }

  const isIVto  = toRoute === 'IV / SC';
  const mme_to  = isIVto ? toOp.mme_iv : toOp.mme_oral;

  if (!mme_to) {
    convEl.innerHTML = '<span class="mme-placeholder">Route not applicable for this conversion</span>';
    return;
  }

  const targetMme = fromMme * (1 - reduction);

  if (toOp.patch) {
    // convert MME/day to mcg/hr
    const mcgHr = targetMme / toOp.mme_td;
    const availablePatches = [12, 25, 37, 50, 62, 75, 100];
    const nearest = availablePatches.reduce((a, b) => Math.abs(b - mcgHr) < Math.abs(a - mcgHr) ? b : a);
    convEl.innerHTML = `
      <div class="conv-drug">${esc(toOp.name)}</div>
      <div class="conv-dose">${mcgHr.toFixed(0)} mcg/hr</div>
      <div class="conv-detail">Nearest standard patch size: ${esc(String(nearest))} mcg/hr<br>
        Equianalgesic to ${targetMme.toFixed(1)} MME/day${reduction > 0 ? ` (after ${(reduction*100).toFixed(0)}% cross-tolerance reduction from ${fromMme.toFixed(1)} MME/day)` : ''}</div>
      <div class="conv-warning">Verify titration from short-acting opioids; allow 12–24h overlap for full patch onset.</div>`;
    return;
  }

  // standard oral/IV conversion
  const totalDailyMg = targetMme / mme_to;
  const roundedDose  = Math.round(totalDailyMg * 10) / 10;

  // suggest a per-dose split
  const suggestedFreqs = toOp.patch ? [] : FREQS.filter(f => f.val >= 2 && f.val <= 4);
  const perDoses = suggestedFreqs.map(f => ({
    freq: f.label,
    dose: (totalDailyMg / f.val).toFixed(1),
  }));

  const perDoseRows = perDoses.map(p =>
    `<span>${esc(p.dose)} mg ${esc(toRoute)} ${esc(p.freq)}</span>`
  ).join('  ·  ');

  convEl.innerHTML = `
    <div class="conv-drug">${esc(toOp.name)} (${esc(toRoute)})</div>
    <div class="conv-dose">${esc(String(roundedDose))} mg/day total</div>
    <div class="conv-detail">
      ${esc(targetMme.toFixed(1))} MME/day${reduction > 0 ? ` (${(reduction*100).toFixed(0)}% reduction applied from ${esc(fromMme.toFixed(1))} MME/day)` : ''}
      ${perDoseRows ? `<br><strong>Divided dosing:</strong> ${perDoseRows}` : ''}
    </div>
    ${reduction === 0 ? '<div class="conv-warning">No cross-tolerance reduction applied. Consider 25–50% reduction when rotating opioids in clinical practice.</div>' : ''}`;
}

function specialNote(type) {
  if (type === 'methadone') {
    return `<div class="conv-warning">
      Methadone conversion is highly variable and NOT suitable for calculator-based dosing. The equianalgesic ratio changes based on total daily morphine dose (range 3:1 to 20:1+) and individual patient factors. Methadone has a long, unpredictable half-life with risk of delayed toxicity. Conversion should only be performed by clinicians with methadone experience. Consult pain management or palliative care.
    </div>`;
  }
  if (type === 'buprenorphine') {
    return `<div class="conv-warning">
      Buprenorphine is a partial agonist with a ceiling analgesic effect. Standard MME conversion does not reliably apply. For OUD treatment (Suboxone), conversion to/from full agonists requires specialized protocols. Consult addiction medicine or pain management.
    </div>`;
  }
  return '';
}

function buildRefTable() {
  const tbl = document.getElementById('refTable');
  tbl.innerHTML = `<tr>
    <th>Opioid</th>
    <th>Oral Dose (mg)</th>
    <th>IV/SC Dose (mg)</th>
    <th>MME Factor (oral)</th>
  </tr>`;
  const rows = [
    ['Morphine',      '30',  '10',   '1.0'],
    ['Oxycodone',     '20',  '—',    '1.5'],
    ['Hydrocodone',   '30',  '—',    '1.0'],
    ['Hydromorphone', '7.5', '1.5',  '4.0'],
    ['Oxymorphone',   '10',  '3',    '3.0'],
    ['Codeine',       '200', '—',    '0.15'],
    ['Tramadol',      '300', '—',    '0.1'],
    ['Tapentadol',    '75',  '—',    '0.4'],
    ['Fentanyl Patch','25 mcg/hr ≈ 60 mg/day oral morphine', '—', '2.4 per mcg/hr'],
    ['Methadone',     'Variable — see note', '—', '—'],
    ['Buprenorphine SL', 'See note', '—', '—'],
  ];
  const specialIds = ['Methadone', 'Buprenorphine SL'];
  for (const [name, oral, iv, factor] of rows) {
    const cls = specialIds.includes(name) ? ' class="special"' : '';
    tbl.innerHTML += `<tr${cls}>
      <td>${esc(name)}</td>
      <td class="mono">${esc(oral)}</td>
      <td class="mono">${esc(iv)}</td>
      <td class="mono">${esc(factor)}</td>
    </tr>`;
  }
  tbl.innerHTML += `<tr><td colspan="4" style="font-size:11px;color:var(--ink-muted);padding:6px 10px">All values approximate equivalence to oral morphine 30 mg. Source: CDC 2022 Opioid Prescribing Guideline, FDA, clinical references.</td></tr>`;
}

function wireListeners() {
  const ids = ['fromDrug','fromRoute','fromDose','fromFreq','toDrug','toRoute','reduction'];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('change', () => {
      if (id === 'fromDrug') { populateRoutes('fromDrug','fromRoute','fromUnit'); }
      if (id === 'toDrug')   { populateRoutes('toDrug','toRoute', null); }
      calcAndRender();
    });
    el.addEventListener('input', calcAndRender);
  }
}

populateSelects();
wireListeners();
calcAndRender();
