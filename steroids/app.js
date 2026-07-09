'use strict';

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// Plain-text SIG for whatever taper schedule is currently rendered — kept in
// sync by taperGuidance() on every re-render, read by the delegated copy
// button click handler wired in wireListeners().
let currentSigText = '';

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
  {label:'Once daily',      val:1},
  {label:'BID (2×/day)',    val:2},
  {label:'TID (3×/day)',    val:3},
  {label:'QID (4×/day)',    val:4},
];

// Physiologic replacement ≈ hydrocortisone 20mg/day ≈ prednisone 5mg/day.
const PHYSIOLOGIC_PREDNISONE_MG = 5;
const HIGH_DOSE_PREDNISONE_MG = 20;

// Practical dispensing increments (mg) — taper steps are rounded to these so
// the generated schedule is clean/prescribable rather than raw percentage
// math (e.g. "17.3 mg").
const TAPER_STEP_UNIT = {
  hydrocortisone: 5, cortisone: 12.5, prednisone: 2.5, prednisolone: 2.5,
  methylprednisolone: 4, triamcinolone: 4, dexamethasone: 0.5, betamethasone: 0.6,
};

function roundToStep(dose, step) {
  return Math.max(step, Math.round(dose / step) * step);
}

// Builds a step-down schedule in the CURRENT drug (fromSt) — real-world tapers
// are almost always done in the same agent the patient is already on, not the
// "Convert To" target (that section is for one-time cross-agent dose lookup,
// e.g. IV-to-PO at discharge, a separate use case).
function generateTaperSchedule(startDose, fromSt, duration) {
  const physiologic = fromSt.equiv_dose;
  const step = TAPER_STEP_UNIT[fromSt.id] || 1;
  const ratio = startDose / physiologic;

  // Not enough above physiologic to warrant a multi-step schedule — handled
  // by the static guidance text instead.
  if (ratio <= 1.5) return null;

  const numSteps = ratio <= 3 ? 3 : ratio <= 6 ? 4 : 5;
  // Short courses taper all the way to stop. Long-course, supraphysiologic
  // tapers stop AT physiologic dose (hold + reassess) rather than zero —
  // going below physiologic replacement needs individualized judgment, not
  // an automated schedule.
  const endsAtZero = duration === 'short';
  const floor = endsAtZero ? 0 : physiologic;
  const stepDays = duration === 'short' ? 4 : 7;

  const doses = [];
  for (let i = 0; i < numSteps; i++) {
    const frac = numSteps === 1 ? 0 : (numSteps - 1 - i) / (numSteps - 1);
    doses.push(roundToStep(floor + (startDose - floor) * frac, step));
  }
  const uniqueDoses = doses.filter((d, i) => i === 0 || d !== doses[i - 1]);
  if (uniqueDoses.length < 2) return null;

  return {
    steps: uniqueDoses.map(d => ({ dose: d, days: stepDays })),
    endsAtZero,
    physiologic,
  };
}

function formatSigDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildTaperSig(fromSt, schedule) {
  const lines = [];
  lines.push(`${fromSt.name.toUpperCase()} TAPER — take by mouth once daily`);
  lines.push('');
  const cursor = new Date();
  for (const step of schedule.steps) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    end.setDate(end.getDate() + step.days - 1);
    lines.push(`${step.dose} mg daily × ${step.days} days (${formatSigDate(start)}–${formatSigDate(end)})`);
    cursor.setDate(cursor.getDate() + step.days);
  }
  if (schedule.endsAtZero) {
    lines.push('Then discontinue.');
  } else {
    lines.push(`Then hold at ${schedule.physiologic} mg/day (physiologic replacement) and reassess with prescriber for further taper or discontinuation.`);
  }
  const totalDays = schedule.steps.reduce((sum, s) => sum + s.days, 0);
  lines.push('');
  lines.push(`Total scheduled duration: ${totalDays} days.`);
  lines.push('Suggested schedule — adjust based on clinical response. Not medical advice.');
  return lines.join('\n');
}

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
        Equianalgesic to ${hcEquiv.toFixed(1)} mg/day hydrocortisone-equivalent.
        ${toSt.mc < fromSt.mc ? '<br><strong>Note:</strong> target agent has lower mineralocorticoid activity — consider fludrocortisone if mineralocorticoid replacement is clinically needed.' : ''}
      </div>`;
  }

  // ── Tapering guidance ──
  const taperEl = document.getElementById('taperResult');
  if (hcEquiv === null || isNaN(hcEquiv)) {
    taperEl.innerHTML = '<span class="mme-placeholder">Enter current dose for guidance</span>';
    currentSigText = '';
  } else {
    const fromDailyDose = fromDose * freq;
    taperEl.innerHTML = taperGuidance(hcEquiv, duration, fromSt, fromDailyDose);
  }
}

function taperGuidance(hcEquiv, duration, fromSt, fromDailyDose) {
  const prednisoneEquiv = hcEquiv * (5 / 20);
  let noteHtml;
  let tierLabel;

  if (duration === 'short') {
    tierLabel = 'Short course (<3 weeks)';
    noteHtml = `<div class="taper-text">
      <strong>${tierLabel}:</strong> HPA suppression is unlikely regardless of dose. Abrupt discontinuation is generally safe. A brief taper may still be reasonable if stopping risks rebound of the underlying condition (e.g., asthma, autoimmune flare) rather than for adrenal suppression concerns.
    </div>`;
  } else if (prednisoneEquiv <= PHYSIOLOGIC_PREDNISONE_MG) {
    tierLabel = 'Physiologic range, ≥3 weeks';
    noteHtml = `<div class="taper-text">
      <strong>${tierLabel}:</strong> Low HPA suppression risk. Often can discontinue without an extensive taper, but a brief step-down (over 1–2 weeks) is reasonable, especially if therapy has been prolonged.
    </div>`;
  } else if (prednisoneEquiv < HIGH_DOSE_PREDNISONE_MG) {
    tierLabel = 'Supraphysiologic dose, ≥3 weeks';
    noteHtml = `<div class="taper-text">
      <strong>${tierLabel}:</strong> Moderate HPA suppression risk. Taper gradually rather than stopping abruptly — reduce by roughly 10–20% every 1–2 weeks, slowing further as the dose approaches physiologic replacement (~5 mg/day prednisone-equivalent). Monitor for adrenal insufficiency symptoms (fatigue, nausea, orthostatic hypotension, arthralgias) during the taper.
    </div>`;
  } else {
    tierLabel = 'High-dose, prolonged therapy';
    noteHtml = `<div class="taper-text">
      <strong>${tierLabel}:</strong> Significant HPA suppression risk. Requires a gradual, individualized taper — reduce by ~10–20% every 1–2 weeks while supraphysiologic, then slow further near physiologic range; consider alternate-day dosing in the final phase. Consider AM cortisol or ACTH stimulation testing before complete discontinuation, and endocrinology consultation for complex tapers or if adrenal insufficiency symptoms develop.
    </div>`;
  }

  const schedule = generateTaperSchedule(fromDailyDose, fromSt, duration);
  if (!schedule) {
    currentSigText = '';
    return noteHtml;
  }

  currentSigText = buildTaperSig(fromSt, schedule);
  const rows = schedule.steps.map(s =>
    `<tr><td class="mono">${esc(String(s.dose))} mg</td><td>daily × ${s.days} days</td></tr>`
  ).join('');
  const finalRow = schedule.endsAtZero
    ? `<tr><td colspan="2" style="font-style:italic;color:var(--ink-muted)">then discontinue</td></tr>`
    : `<tr><td colspan="2" style="font-style:italic;color:var(--ink-muted)">then hold at ${esc(String(schedule.physiologic))} mg/day, reassess</td></tr>`;

  return `${noteHtml}
    <table class="taper-sched">${rows}${finalRow}</table>
    <button type="button" class="copy-btn" id="copySigBtn">&#x2398; Copy SIG</button>`;
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
  tbl.innerHTML += `<tr><td colspan="5" style="font-size:9.5px;color:var(--ink-muted);padding:6px 8px;white-space:normal">Equivalent doses referenced to hydrocortisone 20 mg. Potency is relative to hydrocortisone = 1×. Source: Endocrine Society, standard clinical pharmacology references.</td></tr>`;
}

function wireListeners() {
  const ids = ['fromDrug','fromDose','fromFreq','fromDuration','toDrug'];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('change', calcAndRender);
    el.addEventListener('input', calcAndRender);
  }

  // Delegated: taperResult's innerHTML is replaced on every calcAndRender,
  // so the copy button (when present) is bound here once rather than
  // re-wired after each render.
  document.getElementById('taperResult').addEventListener('click', (e) => {
    const btn = e.target.closest('#copySigBtn');
    if (!btn || !currentSigText) return;
    navigator.clipboard.writeText(currentSigText).then(() => {
      btn.classList.add('copied');
      btn.textContent = '✓ Copied';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = '&#x2398; Copy SIG';
      }, 2000);
    });
  });
}

populateSelects();
wireListeners();
calcAndRender();
