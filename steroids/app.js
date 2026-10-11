'use strict';

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// Corticosteroid equivalency — equiv_dose is the dose (mg) equal to hydrocortisone 20mg.
// mc = relative mineralocorticoid potency (referenced to hydrocortisone = 1).
// duration = biologic half-life class. Glucocorticoid potency is not stored
// separately — it's mathematically 20/equiv_dose, so it's derived on display
// (buildRefTable) rather than hardcoded, which would risk drifting out of
// sync with equiv_dose (the value actually used in the conversion math).
const STEROIDS = [
  {id:'hydrocortisone',      name:'Hydrocortisone',       equiv_dose:20,   mc:1,    duration:'Short (8–12h)'},
  {id:'cortisone',           name:'Cortisone',             equiv_dose:25,   mc:0.8,  duration:'Short (8–12h)'},
  {id:'prednisone',          name:'Prednisone',            equiv_dose:5,    mc:0.8,  duration:'Intermediate (12–36h)'},
  {id:'prednisolone',        name:'Prednisolone',          equiv_dose:5,    mc:0.8,  duration:'Intermediate (12–36h)'},
  {id:'methylprednisolone',  name:'Methylprednisolone',    equiv_dose:4,    mc:0.5,  duration:'Intermediate (12–36h)'},
  {id:'triamcinolone',       name:'Triamcinolone',         equiv_dose:4,    mc:0,    duration:'Intermediate (12–36h)'},
  {id:'dexamethasone',       name:'Dexamethasone',         equiv_dose:0.75, mc:0,    duration:'Long (36–54h)'},
  {id:'betamethasone',       name:'Betamethasone',         equiv_dose:0.6,  mc:0,    duration:'Long (36–54h)'},
];

const FREQS = [
  {label:'Once daily',      val:1, sig:'once daily'},
  {label:'BID (2×/day)',    val:2, sig:'twice daily'},
  {label:'TID (3×/day)',    val:3, sig:'three times daily'},
  {label:'QID (4×/day)',    val:4, sig:'four times daily'},
];

// Physiologic replacement ≈ hydrocortisone 20mg/day ≈ prednisone 5mg/day.
const PHYSIOLOGIC_PREDNISONE_MG = 5;
const HIGH_DOSE_PREDNISONE_MG = 20;

function populateSelects() {
  const fromDrug = document.getElementById('fromDrug');
  const toDrug   = document.getElementById('toDrug');
  for (const s of STEROIDS) {
    const o1 = document.createElement('option');
    o1.value = s.id; o1.textContent = s.name;
    if (s.id === 'prednisone') o1.selected = true;
    fromDrug.appendChild(o1);
    const o2 = document.createElement('option');
    o2.value = s.id; o2.textContent = s.name;
    if (s.id === 'hydrocortisone') o2.selected = true;
    toDrug.appendChild(o2);
  }

  const fromFreq = document.getElementById('fromFreq');
  fromFreq.innerHTML = '';
  for (const f of FREQS) {
    const o = document.createElement('option');
    o.value = f.val; o.textContent = f.label;
    fromFreq.appendChild(o);
  }

  buildRefTable();
}

function hydrocortisoneEquiv(steroid, dosePerAdmin, freq) {
  if (!steroid || isNaN(dosePerAdmin) || dosePerAdmin <= 0) return null;
  const dailyDose = dosePerAdmin * freq;
  return dailyDose * (20 / steroid.equiv_dose);
}

function equivClass(hcEquiv) {
  if (hcEquiv === null) return '';
  const prednisoneEquiv = hcEquiv * (5 / 20);
  if (prednisoneEquiv <= PHYSIOLOGIC_PREDNISONE_MG) return 'ok';
  if (prednisoneEquiv < HIGH_DOSE_PREDNISONE_MG) return 'warn';
  return 'risk';
}

function calcAndRender() {
  const fromSt = STEROIDS.find(s => s.id === document.getElementById('fromDrug').value);
  const fromDose = parseFloat(document.getElementById('fromDose').value);
  const freq = parseInt(document.getElementById('fromFreq').value);
  const duration = document.getElementById('fromDuration').value;

  const toSt = STEROIDS.find(s => s.id === document.getElementById('toDrug').value);

  // ── Hydrocortisone-equivalent display ──
  const equivEl = document.getElementById('currentEquiv');
  const hcEquiv = hydrocortisoneEquiv(fromSt, fromDose, freq);

  if (hcEquiv === null || isNaN(hcEquiv)) {
    equivEl.innerHTML = '<span class="mme-placeholder">Enter dose above</span>';
  } else {
    const cls = equivClass(hcEquiv);
    const prednisoneEquiv = hcEquiv * (5 / 20);
    let flagHtml = '';
    if (cls === 'risk') flagHtml = '<div class="mme-flag risk">⚠ High-dose — ≥20 mg/day prednisone-equivalent</div>';
    else if (cls === 'warn') flagHtml = '<div class="mme-flag warn">⚠ Supraphysiologic — 5–19 mg/day prednisone-equivalent</div>';
    else flagHtml = '<div class="mme-flag ok">Physiologic range — &lt;5 mg/day prednisone-equivalent</div>';
    equivEl.innerHTML = `
      <div class="mme-row">
        <span class="mme-num ${esc(cls)}">${hcEquiv.toFixed(1)}</span>
        <span class="mme-label">mg/day hydrocortisone-equiv</span>
      </div>
      <div class="conv-detail">≈ ${prednisoneEquiv.toFixed(1)} mg/day prednisone-equivalent</div>
      ${flagHtml}`;
  }

  // ── Conversion display ──
  const convEl = document.getElementById('convResult');
  if (hcEquiv === null || isNaN(hcEquiv) || !toSt) {
    convEl.innerHTML = '<span class="mme-placeholder">Enter current dose to calculate conversion</span>';
  } else {
    const targetDailyDose = hcEquiv * (toSt.equiv_dose / 20);
    convEl.innerHTML = `
      <div class="conv-drug">${esc(toSt.name)}</div>
      <div class="conv-dose">${targetDailyDose.toFixed(2)} mg/day total</div>
      <div class="conv-detail">
        Equivalent to ${hcEquiv.toFixed(1)} mg/day hydrocortisone.
        ${toSt.mc < fromSt.mc ? '<br><strong>Note:</strong> target agent has lower mineralocorticoid activity — consider fludrocortisone if mineralocorticoid replacement is clinically needed.' : ''}
      </div>`;
  }

  // ── Tapering guidance ──
  const taperEl = document.getElementById('taperResult');
  if (hcEquiv === null || isNaN(hcEquiv)) {
    taperEl.innerHTML = '<span class="mme-placeholder">Enter current dose for guidance</span>';
  } else {
    taperEl.innerHTML = taperGuidance(hcEquiv, duration);
  }
}

function taperGuidance(hcEquiv, duration) {
  const prednisoneEquiv = hcEquiv * (5 / 20);
  let noteHtml;
  let tierLabel;

  if (duration === 'short') {
    tierLabel = 'Short course (<3 weeks)';
    noteHtml = `<div class="taper-text">
      <strong>${tierLabel}:</strong> The 2024 Endocrine Society/ESE guideline suggests no taper is needed for systemic glucocorticoid therapy lasting less than 3–4 weeks, irrespective of dose. The underlying disease may still require a condition-specific step-down plan.
    </div>`;
  } else if (prednisoneEquiv <= PHYSIOLOGIC_PREDNISONE_MG) {
    tierLabel = 'Physiologic range, ≥3 weeks';
    noteHtml = `<div class="taper-text">
      <strong>${tierLabel}:</strong> If the underlying disease is controlled and glucocorticoids are no longer required, either continue a gradual, clinically monitored taper or assess recovery with an 8–9 AM serum cortisol before discontinuation.
    </div>`;
  } else if (prednisoneEquiv < HIGH_DOSE_PREDNISONE_MG) {
    tierLabel = 'Supraphysiologic dose, ≥3 weeks';
    noteHtml = `<div class="taper-text">
      <strong>${tierLabel}:</strong> Consider tapering only when the underlying disease is controlled and glucocorticoids are no longer required. Tapering can generally proceed faster above the physiologic range, then should slow near 4–6 mg/day prednisone-equivalent. Individualize and monitor for withdrawal or adrenal insufficiency symptoms.
    </div>`;
  } else {
    tierLabel = 'High-dose, prolonged therapy';
    noteHtml = `<div class="taper-text">
      <strong>${tierLabel}:</strong> Do not stop abruptly. Confirm the underlying disease is controlled before tapering. A clinician-directed taper may proceed faster at high doses and more slowly near 4–6 mg/day prednisone-equivalent; consider changing long-acting agents to hydrocortisone or prednisone when they are no longer needed. At physiologic dosing, use clinical monitoring or an 8–9 AM cortisol to guide discontinuation.
    </div>`;
  }

  return `${noteHtml}<div class="conv-warning">No patient-specific taper or prescription is generated. Select dose steps and timing from the indication, relapse risk, duration of exposure, comorbidities, dosage forms, and clinical response.</div>`;
}

function buildRefTable() {
  const tbl = document.getElementById('refTable');
  tbl.innerHTML = `<tr>
    <th>Steroid</th>
    <th>Equiv. Dose (mg)</th>
    <th>Glucocorticoid</th>
    <th>Mineralocorticoid</th>
    <th>Duration</th>
  </tr>`;
  for (const s of STEROIDS) {
    const gc = Math.round((20 / s.equiv_dose) * 10) / 10;
    tbl.innerHTML += `<tr>
      <td>${esc(s.name)}</td>
      <td class="mono">${esc(String(s.equiv_dose))}</td>
      <td class="mono">${esc(String(gc))}×</td>
      <td class="mono">${s.mc === 0 ? 'None' : esc(String(s.mc)) + '×'}</td>
      <td>${esc(s.duration)}</td>
    </tr>`;
  }
  tbl.innerHTML += `<tr><td colspan="5" style="font-size:11px;color:var(--ink-muted);padding:6px 10px">Equivalent doses referenced to hydrocortisone 20 mg. Potency is relative to hydrocortisone = 1×. Source: Endocrine Society, standard clinical pharmacology references.</td></tr>`;
}

function wireListeners() {
  const ids = ['fromDrug','fromDose','fromFreq','fromDuration','toDrug'];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('change', calcAndRender);
    el.addEventListener('input', calcAndRender);
  }

}

populateSelects();
wireListeners();
calcAndRender();
