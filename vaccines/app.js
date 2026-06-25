/* ACIP Immunization Schedule — 2025 */

function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* Ages in months throughout. 1 year = 12 months. */
const VACCINES = [
  /* ── Infancy / early childhood ── */
  {
    id:"hepb", name:"Hepatitis B", abbr:"HepB",
    routine:{min:0,max:18}, catchupMax:18*12,
    adultIfNoRecords:true,
    doses:"3-dose series", freq:"birth · 1–2 mo · 6–18 mo",
    detail:"Birth dose within 24 h for infants of HBsAg-negative mothers. Complete 3-dose series. Catch-up recommended through age 18; universal adult recommendation since 2022.",
    requires:[], sexSpecific:null,
    conditionExtra:[{conds:["liverDz","hiv"], note:"Priority vaccination — chronic liver disease, HIV"}],
  },
  {
    id:"rv", name:"Rotavirus", abbr:"RV",
    routine:{min:6,max:8}, catchupMax:8,
    doses:"2–3 doses", freq:"2 · 4 · (6) months",
    detail:"Rotarix: 2 doses at 2 and 4 months. RotaTeq: 3 doses at 2, 4, and 6 months. Do NOT give after 8 months.",
    requires:[], sexSpecific:null, conditionExtra:[],
    contraindications:["immunocompromised"],
  },
  {
    id:"dtap", name:"DTaP (Diphtheria, Tetanus, Pertussis)", abbr:"DTaP",
    routine:{min:2,max:72}, catchupMax:84,
    doses:"5 doses", freq:"2 · 4 · 6 · 15–18 mo · 4–6 yr",
    detail:"5-dose series completing by age 6. For children 7+ who need catch-up, Tdap replaces one DTaP dose for pertussis coverage.",
    requires:[], sexSpecific:null, conditionExtra:[],
  },
  {
    id:"tdap", name:"Tdap / Td (Tetanus, Diphtheria, Pertussis)", abbr:"Tdap",
    routine:{min:11*12,max:12*12}, catchupMax:null,
    adultBooster:true,
    doses:"Tdap ×1, then Td q10 yr", freq:"11–12 yr · booster q10 yr",
    detail:"Single Tdap dose at 11–12 years. Td booster every 10 years thereafter. Adults who have never received Tdap should get one dose; pregnant persons receive Tdap each pregnancy at 27–36 weeks.",
    requires:[], sexSpecific:null,
    conditionExtra:[{conds:["pregnant"], note:"Tdap every pregnancy (27–36 weeks)"}],
  },
  {
    id:"hib", name:"Haemophilus influenzae type b", abbr:"Hib",
    routine:{min:2,max:15}, catchupMax:59,
    doses:"3–4 doses", freq:"2 · 4 · 6 · 12–15 mo",
    detail:"Series of 3–4 doses depending on brand. Catch-up through 59 months (5 years). Generally not indicated after age 5 except immunocompromising conditions.",
    requires:[], sexSpecific:null,
    conditionExtra:[{conds:["asplenia","immunocompromised","hiv"], note:"May be indicated in adults with asplenia or certain immunocompromising conditions"}],
  },
  {
    id:"pcv", name:"Pneumococcal Conjugate (PCV15/20)", abbr:"PCV",
    routine:{min:2,max:15}, catchupMax:71,
    adultIfCondition:true,
    doses:"4 doses (infant) / 1–2 doses (adult)", freq:"2 · 4 · 6 · 12–15 mo",
    detail:"Infant series 4 doses. Catch-up for unvaccinated children through 71 months. PCV20 ×1 for adults 65+. Adults 19–64 with certain conditions receive PCV15 or PCV20.",
    requires:[], sexSpecific:null,
    conditionExtra:[{conds:["immunocompromised","asplenia","ckd","diabetes","heartDz","lungDz","liverDz","hiv"], note:"Recommended regardless of age for listed conditions"}],
  },
  {
    id:"ipv", name:"Inactivated Poliovirus", abbr:"IPV",
    routine:{min:2,max:72}, catchupMax:18*12,
    doses:"4 doses", freq:"2 · 4 · 6–18 mo · 4–6 yr",
    detail:"4-dose series. Third dose at 6–18 months; if dose 3 given at ≥4 years and ≥6 months after dose 2, dose 4 is not needed. Catch-up through age 18.",
    requires:[], sexSpecific:null, conditionExtra:[],
  },
  {
    id:"covid", name:"COVID-19", abbr:"COVID",
    routine:{min:6,max:99*12},
    doses:"Annual updated dose", freq:"annually (≥6 months)",
    detail:"Annual updated COVID-19 vaccine recommended for everyone 6 months and older. Immunocompromised individuals may require additional doses per current CDC guidance.",
    requires:[], sexSpecific:null, conditionExtra:[],
  },
  {
    id:"flu", name:"Influenza", abbr:"Flu",
    routine:{min:6,max:99*12},
    doses:"Annual", freq:"annually (≥6 months)",
    detail:"Annual vaccination for everyone ≥6 months. Children 6 months–8 years receiving influenza vaccine for the first time need 2 doses ≥4 weeks apart.",
    requires:[], sexSpecific:null,
    conditionExtra:[{conds:["pregnant"], note:"Inactivated influenza vaccine preferred in pregnancy"}],
  },
  /* ── School age / adolescent ── */
  {
    id:"mmr", name:"Measles, Mumps, Rubella", abbr:"MMR",
    routine:{min:12,max:15}, catchupMax:18*12,
    adultIfNoRecords:true,
    doses:"2 doses", freq:"12–15 mo · 4–6 yr",
    detail:"2-dose series. Catch-up through age 18. Unvaccinated adults born in or after 1957 should receive at least 1 dose (2 doses if at higher risk).",
    requires:[], sexSpecific:null,
    contraindications:["immunocompromised","pregnant"],
    conditionExtra:[],
  },
  {
    id:"varicella", name:"Varicella (Chickenpox)", abbr:"VAR",
    routine:{min:12,max:15}, catchupMax:18*12,
    adultIfNoRecords:true,
    doses:"2 doses", freq:"12–15 mo · 4–6 yr",
    detail:"2-dose series. Catch-up through age 18 for those without evidence of immunity. Adults without evidence of immunity (no history of disease or vaccination) should receive 2 doses.",
    requires:[], sexSpecific:null,
    contraindications:["immunocompromised","pregnant"],
    conditionExtra:[],
  },
  {
    id:"hepa", name:"Hepatitis A", abbr:"HepA",
    routine:{min:12,max:23}, catchupMax:18*12,
    doses:"2 doses", freq:"12–23 mo · 6–18 mo apart",
    detail:"2-dose series. Catch-up through age 18. Adults at increased risk (travel to endemic areas, chronic liver disease, MSM) or who want protection should receive 2 doses.",
    requires:[], sexSpecific:null,
    conditionExtra:[{conds:["liverDz","msm","hiv"], note:"Strongly recommended — chronic liver disease, MSM, HIV"}],
  },
  {
    id:"hpv", name:"Human Papillomavirus", abbr:"HPV",
    routine:{min:11*12,max:12*12}, catchupMax:26*12,
    doses:"2–3 doses", freq:"11–12 yr (through 26 yr catch-up)",
    detail:"2-dose series if started before age 15; 3-dose series if started at 15+. Routine through age 26. Ages 27–45: shared clinical decision-making.",
    requires:[], sexSpecific:null, conditionExtra:[],
  },
  {
    id:"menacwy", name:"Meningococcal ACWY", abbr:"MenACWY",
    routine:{min:11*12,max:12*12}, catchupMax:18*12,
    doses:"2 doses", freq:"11–12 yr + booster at 16 yr",
    detail:"Primary dose at 11–12 years; booster at 16. Catch-up through age 18. Higher-risk groups (asplenia, HIV, complement deficiency, college freshmen in dorms) should be vaccinated regardless of age.",
    requires:[], sexSpecific:null,
    conditionExtra:[{conds:["asplenia","hiv","immunocompromised"], note:"Vaccinate at any age — high-risk conditions"}],
  },
  {
    id:"menb", name:"Meningococcal B", abbr:"MenB",
    routine:{min:16*12,max:18*12},
    doses:"2–3 doses", freq:"16–23 yr (shared decision)",
    detail:"Shared clinical decision-making for ages 16–23 (preferred 16–18). Recommended for high-risk patients (asplenia, complement deficiency) at any age ≥10.",
    requires:[], sexSpecific:null,
    conditionExtra:[{conds:["asplenia","immunocompromised"], note:"Recommended regardless of age — asplenia or complement deficiency"}],
  },
  /* ── Adult ── */
  {
    id:"zoster", name:"Zoster (Shingrix)", abbr:"RZV",
    routine:{min:50*12,max:99*12},
    doses:"2 doses", freq:"2-dose series (2–6 months apart)",
    detail:"2-dose recombinant zoster vaccine (RZV/Shingrix) for all adults ≥50. Can be given even after prior zoster disease or prior ZVL vaccination. Also indicated for immunocompromised adults ≥19.",
    requires:[], sexSpecific:null,
    conditionExtra:[{conds:["immunocompromised","hiv"], note:"Recommended from age 19 with immunocompromising conditions"}],
  },
  {
    id:"rsv", name:"RSV (Respiratory Syncytial Virus)", abbr:"RSV",
    routine:{min:60*12,max:99*12},
    doses:"1 dose", freq:"single dose (shared decision ≥60 yr)",
    detail:"Shared clinical decision-making for adults ≥60. RSV vaccine (Abrysvo, Arexvy, or mResvia) provides protection against severe RSV disease.",
    requires:[], sexSpecific:null, conditionExtra:[],
  },
  {
    id:"ppsv23", name:"Pneumococcal Polysaccharide (PPSV23)", abbr:"PPSV23",
    routine:{min:65*12,max:99*12},
    adultIfCondition:true,
    doses:"1–2 doses", freq:"65+ yr; conditions 19–64 yr",
    detail:"For adults 65+ not previously vaccinated with PCV20: PCV15 followed by PPSV23 (≥1 year after PCV15). For adults 19–64 with high-risk conditions.",
    requires:[], sexSpecific:null,
    conditionExtra:[{conds:["immunocompromised","asplenia","ckd","heartDz","lungDz","liverDz","hiv"], note:"Indicated for high-risk conditions at any adult age"}],
  },
];

/* Conditions that trigger additional vaccines */
const CONDITION_LABELS = {
  pregnant:"currently pregnant",
  immunocompromised:"immunocompromised",
  hiv:"HIV positive",
  asplenia:"asplenia/functional asplenia",
  liverDz:"chronic liver disease",
  ckd:"chronic kidney disease",
  diabetes:"diabetes mellitus",
  heartDz:"chronic heart disease",
  lungDz:"chronic lung disease",
  hcw:"healthcare worker",
  msm:"MSM",
  noRecords:"no vaccination records",
};

const state = { ageMonths: 24, sex: "female", unit: "yr" };

const els = {
  age: document.getElementById('age'),
  unitYr: document.getElementById('unitYr'),
  unitMo: document.getElementById('unitMo'),
  sexSeg: document.getElementById('sexSeg'),
  results: document.getElementById('results'),
  flagGrid: document.getElementById('flagGrid'),
  copyBar: document.getElementById('copyBar'),
  copyBtn: document.getElementById('copyBtn'),
};

function flags(){
  const out = {};
  document.querySelectorAll('.flag-grid input').forEach(cb => out[cb.id.slice(2)] = cb.checked);
  return out;
}

function getAgeMonths(){
  const v = Math.max(0, parseInt(els.age.value||"0", 10));
  return state.unit === "yr" ? v * 12 : v;
}

function render(){
  const ageM = getAgeMonths();
  const ageY = ageM / 12;
  const f = flags();
  state.ageMonths = ageM;

  /* hide sex-specific flags */
  document.querySelectorAll('.flag-grid label[data-only]').forEach(l => {
    l.style.display = (l.dataset.only === state.sex) ? "" : "none";
  });

  const routine = [], condDriven = [], sharedDecision = [];
  const added = new Set();

  for (const v of VACCINES) {
    if (v.sexSpecific && v.sexSpecific !== state.sex) continue;
    if (v.contraindications && v.contraindications.some(c => f[c])) continue;

    let shown = false;

    /* Routine age range */
    if (ageM >= v.routine.min && ageM <= v.routine.max) {
      /* Special: MenB is shared decision for routine ages */
      if (v.id === "menb" && ageM >= 16*12 && ageM <= 23*12 && !f.asplenia && !f.immunocompromised) {
        sharedDecision.push({v, note:null});
      } else {
        routine.push({v, note:null});
      }
      added.add(v.id);
      shown = true;
    }

    /* Catch-up for unvaccinated */
    if (!shown && v.catchupMax && ageM > v.routine.max && ageM <= v.catchupMax && (f.noRecords || v.adultIfNoRecords)) {
      routine.push({v, note:"catch-up"});
      added.add(v.id);
      shown = true;
    }

    /* Adult vaccines with no upper routine age (flu, covid, tdap adult booster) */
    if (!shown && v.adultBooster && ageM >= 11*12) {
      if (!added.has(v.id)) { routine.push({v, note:null}); added.add(v.id); shown = true; }
    }
    if (!shown && v.id === "covid" && ageM >= 6) {
      if (!added.has(v.id)) { routine.push({v, note:null}); added.add(v.id); shown = true; }
    }
    if (!shown && v.id === "flu" && ageM >= 6) {
      if (!added.has(v.id)) { routine.push({v, note:null}); added.add(v.id); shown = true; }
    }

    /* Adult universal vaccines if no records */
    if (!shown && v.adultIfNoRecords && ageM >= 19*12 && f.noRecords && !added.has(v.id)) {
      routine.push({v, note:"catch-up — no prior records"});
      added.add(v.id);
      shown = true;
    }

    /* Condition-driven extras */
    if (v.conditionExtra) {
      for (const ce of v.conditionExtra) {
        if (ce.conds.some(c => f[c])) {
          if (!added.has(v.id)) {
            condDriven.push({v, note:ce.note});
            added.add(v.id);
          } else {
            /* Already in routine but add condition note to it */
            const existing = routine.find(r => r.v.id === v.id) || sharedDecision.find(r => r.v.id === v.id);
            if (existing && !existing.condNote) existing.condNote = ce.note;
          }
          break;
        }
      }
    }
  }

  /* HCW-specific: annual flu already included; additionally Hep B if not in list */
  if (f.hcw && !added.has("hepb") && ageM >= 18*12) {
    const v = VACCINES.find(x => x.id === "hepb");
    if (v) { condDriven.push({v, note:"Healthcare workers — ensure HepB series complete"}); added.add("hepb"); }
  }

  const recRow = (v, note, condNote, type) => {
    const chipClass = type === "cond" ? "chip cond" : type === "catchup" ? "chip catchup" : "chip";
    const chipLabel = type === "cond" ? "COND" : type === "catchup" ? "CATCH-UP" : "DUE";
    const condText = condNote ? `<div class="cond-note">Also indicated: ${esc(condNote)}</div>` : "";
    const noteText = note ? `<div class="cond-note">${esc(note)}</div>` : "";
    return `<div class="rec">
      <div class="rec-title">${esc(v.name)}
        <span class="${chipClass}">${chipLabel}</span>
        <span class="freq">${esc(v.freq)}</span>
      </div>
      <div class="rec-detail">${esc(v.detail)}</div>
      ${noteText}${condText}
    </div>`;
  };

  let html = "";

  html += `<div class="group-head"><span class="group-name">Routine / Catch-up</span><span class="group-count">${routine.length}</span></div>`;
  html += routine.length ? routine.map(({v,note,condNote}) => recRow(v, note, condNote, note && note.includes("catch") ? "catchup" : "routine")).join("") :
    `<div class="empty">No routine vaccines due at this age with the current inputs.</div>`;

  if (condDriven.length) {
    html += `<div class="group-head"><span class="group-name">Due — Condition-specific</span><span class="group-count">${condDriven.length}</span></div>`;
    html += condDriven.map(({v,note}) => recRow(v, note, null, "cond")).join("");
  }
  if (sharedDecision.length) {
    html += `<div class="group-head"><span class="group-name">Shared Clinical Decision</span><span class="group-count">${sharedDecision.length}</span></div>`;
    html += sharedDecision.map(({v,note}) => recRow(v, note, null, "shared")).join("");
  }

  els.results.innerHTML = html;
  els.copyBar.hidden = !(routine.length || condDriven.length || sharedDecision.length);
}

function buildText(){
  const ageM = state.ageMonths;
  const ageDisplay = state.unit === "yr" ? `${Math.round(ageM/12)}-year-old` : `${ageM}-month-old`;
  const f = flags();
  const activeFlags = Object.entries(f).filter(([,v])=>v).map(([k])=>CONDITION_LABELS[k]||k);
  const today = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});

  const lines = [
    "ACIP Immunization Schedule",
    `Patient: ${ageDisplay} ${state.sex}`,
  ];
  if (activeFlags.length) lines.push(`Conditions: ${activeFlags.join(", ")}`);
  lines.push(`Generated: ${today}`, "");

  const allVax = [...els.results.querySelectorAll('.rec')];
  let section = "";
  for (const node of els.results.children) {
    if (node.classList.contains('group-head')) {
      section = node.querySelector('.group-name')?.textContent || "";
      lines.push(`── ${section} ──`, "");
    } else if (node.classList.contains('rec')) {
      const title = node.querySelector('.rec-title')?.childNodes[0]?.textContent?.trim() || "";
      const freq = node.querySelector('.freq')?.textContent?.trim() || "";
      const detail = node.querySelector('.rec-detail')?.textContent?.trim() || "";
      lines.push(`• ${title}${freq ? `  ·  ${freq}` : ""}`);
      if (detail) lines.push(`  ${detail}`);
      lines.push("");
    }
  }

  lines.push("Source: ACIP / CDC immunization schedule · cdc.gov/vaccines/schedules");
  return lines.join("\n");
}

/* events */
els.age.addEventListener('input', render);
els.unitYr.addEventListener('click', () => { state.unit="yr"; els.unitYr.classList.add('active'); els.unitMo.classList.remove('active'); render(); });
els.unitMo.addEventListener('click', () => { state.unit="mo"; els.unitMo.classList.add('active'); els.unitYr.classList.remove('active'); render(); });
els.sexSeg.addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  els.sexSeg.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  state.sex = b.dataset.sex;
  if (state.sex==="male"){ const p=document.getElementById('f_pregnant'); if(p) p.checked=false; }
  render();
});
els.flagGrid.addEventListener('change', render);
els.copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(buildText()).then(() => {
    els.copyBtn.classList.add('copied');
    els.copyBtn.textContent = '✓ Copied';
    setTimeout(() => { els.copyBtn.classList.remove('copied'); els.copyBtn.innerHTML='&#x2398; Copy schedule'; }, 2000);
  });
});

render();
