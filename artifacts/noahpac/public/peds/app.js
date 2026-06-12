'use strict';

// ── Weight estimation ─────────────────────────────────────────────────────────

function estimateWeight(ageNum, unit) {
  if (unit === 'mo') {
    if (ageNum < 3)  return 4;
    if (ageNum <= 12) return Math.round(((ageNum + 9) / 2) * 10) / 10;
    ageNum = ageNum / 12;
  }
  // years
  if (ageNum < 1)  return 4 + Math.round(ageNum * 12) * 0.5;
  if (ageNum <= 9) return 2 * (ageNum + 8);
  if (ageNum <= 14) return 3 * ageNum + 7;
  return null;
}

// ── Broselow band ─────────────────────────────────────────────────────────────

const BROSE_BANDS = [
  {max:3,   color:'#9CA3AF', name:'Grey',   label:'< 3 kg — not on tape'},
  {max:5,   color:'#F9A8D4', name:'Pink',   label:'3–5 kg'},
  {max:7,   color:'#FCA5A5', name:'Red',    label:'6–7 kg'},
  {max:9,   color:'#C4B5FD', name:'Purple', label:'8–9 kg'},
  {max:11,  color:'#FDE68A', name:'Yellow', label:'10–11 kg'},
  {max:14,  color:'#E5E7EB', name:'White',  label:'12–14 kg'},
  {max:18,  color:'#93C5FD', name:'Blue',   label:'15–18 kg'},
  {max:25,  color:'#FD9B72', name:'Orange', label:'19–25 kg'},
  {max:36,  color:'#6EE7B7', name:'Green',  label:'26–36 kg'},
  {max:999, color:'#E5E7EB', name:'—',      label:'> 36 kg — adult doses'},
];

function getBroseBand(wt) {
  return BROSE_BANDS.find(b => wt <= b.max) || BROSE_BANDS[BROSE_BANDS.length-1];
}

// ── Utility ───────────────────────────────────────────────────────────────────

function fmt(n, dec=1) {
  if (n === null || isNaN(n)) return '—';
  return Number(n.toFixed(dec)).toString();
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function round5(n) { return Math.round(n / 5) * 5; }

// nearest 0.5
function roundHalf(n) { return Math.round(n * 2) / 2; }

// ── ETT sizing ────────────────────────────────────────────────────────────────

function ettSize(ageYr) {
  const cuffed   = roundHalf(ageYr / 4 + 3.5);
  const uncuffed = roundHalf(ageYr / 4 + 4);
  const depth    = roundHalf(cuffed * 3);
  return {cuffed, uncuffed, depth};
}

// ── Dose card builder ─────────────────────────────────────────────────────────

function card(name, val, unit, note, variant, rangeText) {
  const cls = variant ? ` ${variant}` : '';
  return `<div class="dose-card${cls}">
    <div class="dose-name">${name}</div>
    <div><span class="dose-val">${val}</span><span class="dose-unit">${unit}</span></div>
    ${rangeText ? `<div class="dose-range">${rangeText}</div>` : ''}
    ${note ? `<div class="dose-note">${note}</div>` : ''}
  </div>`;
}

// ── Main render ───────────────────────────────────────────────────────────────

function render(wt) {
  const ageEst = wt <= 4 ? 0 : wt <= 9 ? (wt*2-9) : (wt/2-8);
  const ageYr  = Math.max(0, ageEst);
  const ett    = ageYr >= 1 ? ettSize(ageYr) : null;
  const infant = wt < 10;

  let html = '';

  // ── Equipment ──────────────────────────────────────────────────────────────
  html += `<div class="sec-head">Airway & Equipment</div><div class="equip-row dose-grid">`;

  // ETT
  if (ett) {
    html += card('ETT (cuffed)', fmt(ett.cuffed,1), 'mm ID', `Uncuffed: ${fmt(ett.uncuffed,1)} mm · Depth: ${fmt(ett.depth,1)} cm at lip`, 'highlight');
  } else {
    html += card('ETT', 'Uncuffed', '3.5 mm', 'Newborn / infant — verify with tape', 'highlight');
  }

  // Laryngoscope blade
  const blade = wt < 5 ? '0 straight' : wt < 10 ? '1 straight' : wt < 20 ? '2 straight/curved' : '3 curved';
  html += card('Laryngoscope', blade, '', '');

  // LMA
  const lmaSize = wt < 5 ? '1' : wt < 10 ? '1.5' : wt < 20 ? '2' : wt < 30 ? '2.5' : '3';
  html += card('LMA size', lmaSize, '', 'Supraglottic airway backup');

  // BVM
  const bvm = wt < 10 ? 'Infant 250 mL' : 'Pediatric 450 mL';
  html += card('BVM', bvm, '', '');

  // BP cuff
  const cuff = wt < 5 ? 'Newborn' : wt < 10 ? 'Infant' : wt < 18 ? 'Child' : 'Small adult';
  html += card('BP cuff', cuff, '', '');

  // NG tube
  const ng = wt < 5 ? '5–6 Fr' : wt < 10 ? '8 Fr' : wt < 20 ? '10 Fr' : '12–14 Fr';
  html += card('NG tube', ng, '', '');

  html += `</div>`;

  // ── Fluids ────────────────────────────────────────────────────────────────
  html += `<div class="sec-head">IV Fluids</div><div class="dose-grid">`;

  const bolus = round5(wt * 20);
  html += card('NS Bolus 20 mL/kg', fmt(bolus, 0), 'mL', 'Reassess after each bolus; max 3×', 'highlight');

  const dexBolus = round5(wt * 2);
  html += card('D10W Bolus (hypoglycemia)', fmt(dexBolus, 0), 'mL', '2 mL/kg D10W IV push');

  // Maintenance (Holliday-Segar)
  let maint;
  if (wt <= 10) maint = wt * 4;
  else if (wt <= 20) maint = 40 + (wt-10) * 2;
  else maint = 60 + (wt-20) * 1;
  html += card('Maintenance fluids', fmt(maint, 0), 'mL/hr', 'Holliday-Segar — reassess in sepsis/trauma');

  // Blood — 10 mL/kg pRBC
  html += card('pRBC transfusion', fmt(round5(wt*10), 0), 'mL', '10 mL/kg over 3–4 h');

  html += `</div>`;

  // ── Resuscitation drugs ────────────────────────────────────────────────────
  html += `<div class="sec-head">Resuscitation</div><div class="dose-grid">`;

  const epi = clamp(wt * 0.01, 0.01, 1);
  html += card('Epinephrine (cardiac arrest)', fmt(epi, 2), 'mg IV/IO', '0.01 mg/kg (1:10,000) — q3–5 min');

  const epiAnaphylaxis = clamp(wt * 0.01, 0.01, 0.5);
  html += card('Epinephrine (anaphylaxis)', fmt(epiAnaphylaxis, 2), 'mg IM', '0.01 mg/kg 1:1,000 IM — max 0.5 mg', 'warn');

  const atropine = clamp(wt * 0.02, 0.1, 0.5);
  html += card('Atropine', fmt(atropine, 2), 'mg IV', '0.02 mg/kg — min 0.1 mg, max 0.5 mg');

  const adenosine = clamp(wt * 0.1, 0.1, 6);
  html += card('Adenosine (SVT)', fmt(adenosine, 1), 'mg rapid IV', '0.1 mg/kg — may double to 0.2 mg/kg (max 12 mg)');

  const amio = clamp(wt * 5, 5, 300);
  html += card('Amiodarone (VF/pVT)', fmt(amio, 0), 'mg IV/IO', '5 mg/kg over 20 min — not in stable SVT');

  const defib = clamp(wt * 2, 2, 120);
  const syncCardio = clamp(wt * 1, 1, 50);
  html += card('Defibrillation', `${fmt(defib,0)}–${fmt(defib*2,0)}`, 'J', `2–4 J/kg; cardioversion 0.5–1 J/kg (${fmt(syncCardio,0)} J first)`);

  html += `</div>`;

  // ── Intubation / sedation ─────────────────────────────────────────────────
  html += `<div class="sec-head">RSI / Procedural Sedation</div><div class="dose-grid">`;

  const sux = clamp(infant ? wt*2 : wt*1.5, 5, 150);
  html += card('Succinylcholine', fmt(sux, 0), 'mg IV', infant ? '2 mg/kg (infant)' : '1.5 mg/kg', 'risk');

  const roc = clamp(wt * 1.2, 2, 100);
  html += card('Rocuronium', fmt(roc, 0), 'mg IV', '1.2 mg/kg RSI dose');

  const ketProp = clamp(wt * 2, 10, 200);
  html += card('Ketamine (induction)', fmt(ketProp, 0), 'mg IV', '1–2 mg/kg IV; 4–5 mg/kg IM');

  const propofol = clamp(wt * 2, 10, 200);
  html += card('Propofol (induction)', fmt(propofol, 0), 'mg IV', '1–2.5 mg/kg IV — avoid < 3 yr for induction');

  const midaz = clamp(wt * 0.1, 0.5, 5);
  html += card('Midazolam (sedation)', fmt(midaz, 1), 'mg IV', '0.1 mg/kg IV; 0.2–0.3 mg/kg IM/IN');

  const fent = clamp(wt * 1, 5, 100);
  html += card('Fentanyl (analgesia)', fmt(fent, 0), 'mcg IV', '1 mcg/kg; IN 1.5–2 mcg/kg');

  html += `</div>`;

  // ── Seizures ──────────────────────────────────────────────────────────────
  html += `<div class="sec-head">Seizures</div><div class="dose-grid">`;

  const lz = clamp(wt * 0.1, 0.5, 4);
  html += card('Lorazepam', fmt(lz, 1), 'mg IV/IO', '0.1 mg/kg — may repeat ×1; rectal 0.1 mg/kg');

  const dz = clamp(wt * 0.3, 1, 10);
  html += card('Diazepam', fmt(dz, 1), 'mg IV', '0.3 mg/kg; rectal 0.5 mg/kg (max 20 mg)');

  const midazSeizure = clamp(wt * 0.2, 1, 10);
  html += card('Midazolam (status)', fmt(midazSeizure, 1), 'mg IM/IN', '0.2 mg/kg IM or 0.3 mg/kg IN');

  const lev = clamp(wt * 60, 100, 3000);
  html += card('Levetiracetam (load)', fmt(round5(lev), 0), 'mg IV', '60 mg/kg over 10 min — max 3 g');

  const phenyt = clamp(wt * 20, 100, 1000);
  html += card('Fosphenytoin', fmt(round5(phenyt), 0), 'PE IV', '20 PE/kg over 10–20 min (use fosphenytoin, not phenytoin)');

  html += `</div>`;

  // ── Pain & fever ──────────────────────────────────────────────────────────
  html += `<div class="sec-head">Pain & Fever</div><div class="dose-grid">`;

  const apap = clamp(wt * 15, 30, 1000);
  html += card('Acetaminophen (PO/PR)', fmt(round5(apap), 0), 'mg q6h', '15 mg/kg — max 1 g/dose, 4 g/day');

  const ibu = clamp(wt * 10, 50, 400);
  html += card('Ibuprofen (PO)', fmt(round5(ibu), 0), 'mg q6–8h', '10 mg/kg — max 400 mg/dose; ≥ 6 months');

  const morph = clamp(wt * 0.1, 0.5, 5);
  html += card('Morphine (IV)', fmt(morph, 1), 'mg q2–4h PRN', '0.05–0.1 mg/kg');

  const narcan = clamp(wt * 0.01, 0.04, 2);
  html += card('Naloxone (reversal)', fmt(narcan, 2), 'mg IV/IM', '0.01 mg/kg — may repeat; full reversal 0.1 mg/kg');

  html += `</div>`;

  // ── Antibiotics ───────────────────────────────────────────────────────────
  html += `<div class="sec-head">Antibiotics</div><div class="dose-grid">`;

  const amox = clamp(wt * 90, 250, 4000);
  html += card('Amoxicillin (AOM)', fmt(round5(amox), 0), 'mg/day ÷ bid', '90 mg/kg/day — high-dose for AOM');

  const ampSulbactam = clamp(wt * 50, 250, 3000);
  html += card('Ampicillin-Sulbactam', fmt(round5(ampSulbactam), 0), 'mg q6h', '50 mg/kg/dose amp component');

  const ceftriax = clamp(wt * 50, 250, 2000);
  html += card('Ceftriaxone', fmt(round5(ceftriax), 0), 'mg IV q24h', '50–100 mg/kg/day — meningitis 100 mg/kg');

  const cefazolin = clamp(wt * 25, 250, 2000);
  html += card('Cefazolin (skin/surgical)', fmt(round5(cefazolin), 0), 'mg IV q8h', '25 mg/kg/dose');

  const gent = clamp(wt * 5, 10, 320);
  html += card('Gentamicin', fmt(gent, 0), 'mg IV q24h', '5 mg/kg — obtain levels; renally dose-adjust', 'warn');

  const vanc = clamp(wt * 15, 50, 750);
  html += card('Vancomycin', fmt(vanc, 0), 'mg IV q6h', '15 mg/kg/dose — AUC-guided; infuse over 60 min', 'warn');

  html += `</div>`;

  // ── Footnote ─────────────────────────────────────────────────────────────
  html += `<div class="callout info mt">
    Doses are weight-based estimates. Always verify against institutional formulary, patient age, organ function, and clinical context. Max doses capped to typical adult limits.
  </div>`;

  document.getElementById('content').innerHTML = html;
}

// ── UI logic ──────────────────────────────────────────────────────────────────

function go() {
  const wtInput  = parseFloat(document.getElementById('wtKg').value);
  const ageNum   = parseFloat(document.getElementById('ageNum').value);
  const ageUnit  = document.getElementById('ageUnit').value;

  let wt;
  if (!isNaN(wtInput) && wtInput > 0) {
    wt = wtInput;
  } else if (!isNaN(ageNum) && ageNum >= 0) {
    wt = estimateWeight(ageNum, ageUnit);
    if (!wt) {
      document.getElementById('content').innerHTML = '<div class="err">Could not estimate weight. Enter weight directly or use age 0–14 years.</div>';
      return;
    }
    document.getElementById('wtKg').value = '';
  } else {
    document.getElementById('content').innerHTML = '<div class="err">Enter a weight (kg) or age to calculate.</div>';
    return;
  }

  if (wt < 1 || wt > 80) {
    document.getElementById('content').innerHTML = '<div class="err">Weight must be between 1 and 80 kg.</div>';
    return;
  }

  const band = getBroseBand(wt);
  const barEl = document.getElementById('broseBar');
  document.getElementById('broseSwatch').style.background = band.color;
  document.getElementById('broseLabel').textContent = `${band.name} — ${band.label}`;
  document.getElementById('broseWeight').textContent = `${fmt(wt,1)} kg`;
  barEl.hidden = false;

  render(wt);
}

document.getElementById('calcBtn').addEventListener('click', go);
['wtKg','ageNum','ageUnit'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
});
