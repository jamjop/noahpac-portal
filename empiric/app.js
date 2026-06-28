// Facility list is loaded at runtime from the antibiogram manifest.

let FACILITY_SUSC = {};

const ABX_NAME = {
  amp:"Ampicillin",ams:"Amp/Sulbactam",ptz:"Pip/Tazo",cfz:"Cefazolin",cfx:"Cefoxitin",
  cxm:"Cefuroxime",cro:"Ceftriaxone",caz:"Ceftazidime",fep:"Cefepime",
  mem:"Meropenem",gen:"Gentamicin",tob:"Tobramycin",cip:"Ciprofloxacin",lvx:"Levofloxacin",
  van:"Vancomycin",tet:"Tetracycline",dox:"Doxycycline",cli:"Clindamycin",ery:"Erythromycin",
  azi:"Azithromycin",sxt:"TMP/SMX",rif:"Rifampin",dap:"Daptomycin",lzd:"Linezolid",
  nit:"Nitrofurantoin",oxa:"Oxacillin",pen:"Penicillin G",
};

const SITES = [
  {
    id:"uti", label:"UTI (uncomplicated)",
    orgs:["E. coli","Klebsiella pneumoniae","Proteus mirabilis","Enterococcus faecalis"],
    regimens:[
      {name:"Nitrofurantoin",   dose:"100 mg ER BID × 5d", note:"First-line; avoid if CrCl <30 or pyelonephritis", abx:"nit"},
      {name:"TMP-SMX",          dose:"160/800 mg BID × 3d", note:"Use only if local E. coli susceptibility ≥80%", abx:"sxt"},
      {name:"Fosfomycin",       dose:"3 g PO single dose",  note:"First-line; not effective for Klebsiella or Proteus"},
      {name:"Ciprofloxacin",    dose:"250 mg BID × 3d",     note:"Reserve — local E. coli resistance high", abx:"cip"},
    ]
  },
  {
    id:"uti-comp", label:"UTI (complicated / pyelonephritis)",
    orgs:["E. coli","Klebsiella pneumoniae","Proteus mirabilis"],
    regimens:[
      {name:"Ceftriaxone",      dose:"1–2 g IV q24h",       note:"First-line IV; step down to oral when improving", abx:"cro"},
      {name:"Cefazolin",        dose:"1–2 g IV q8h",        note:"Good coverage for GNR; avoid for Proteus", abx:"cfz"},
      {name:"Ciprofloxacin",    dose:"400 mg IV / 500 mg PO BID × 7–14d", note:"Check local susceptibility — resistance common", abx:"cip"},
      {name:"Pip/Tazobactam",   dose:"3.375 g IV q6h",      note:"Broader coverage; reserve for resistant organisms", abx:"ptz"},
      {name:"Meropenem",        dose:"1 g IV q8h",          note:"Reserve for ESBL/multidrug-resistant organisms", abx:"mem"},
    ]
  },
  {
    id:"pneumonia-cap", label:"Pneumonia (CAP)",
    orgs:["Streptococcus pneumoniae"],
    regimens:[
      {name:"Amoxicillin",      dose:"1 g PO TID × 5d",     note:"Low-severity, no comorbidities"},
      {name:"Doxycycline",      dose:"100 mg PO BID × 5d",  note:"Alternative for penicillin allergy; atypical coverage"},
      {name:"Azithromycin",     dose:"500 mg PO × 1, then 250 mg QD × 4d", note:"Atypical coverage; high pneumococcal resistance in some regions"},
      {name:"Amox/Clavulanate + Azithromycin", dose:"875/125 mg BID + Azithromycin × 5d", note:"Moderate severity with comorbidities"},
      {name:"Levofloxacin",     dose:"750 mg PO/IV QD × 5d", note:"Respiratory fluoroquinolone; use if β-lactam/macrolide fails", abx:"lvx"},
      {name:"Ceftriaxone + Azithromycin", dose:"1–2 g IV q24h + Azithromycin", note:"Hospitalized, non-ICU", abx:"cro"},
    ]
  },
  {
    id:"pneumonia-hap", label:"Pneumonia (HAP / VAP)",
    orgs:["Staph aureus (MRSA)","Pseudomonas aeruginosa","Klebsiella pneumoniae"],
    regimens:[
      {name:"Vancomycin",       dose:"15–20 mg/kg IV q8–12h (target AUC 400–600)", note:"MRSA coverage", abx:"van"},
      {name:"Pip/Tazobactam",   dose:"4.5 g IV q6h",        note:"GNR coverage; add MRSA agent if risk factors", abx:"ptz"},
      {name:"Cefepime",         dose:"1–2 g IV q8h",        note:"Antipseudomonal; combination with MRSA agent", abx:"fep"},
      {name:"Meropenem",        dose:"1–2 g IV q8h",        note:"Reserve for MDR or ESBL producers", abx:"mem"},
    ]
  },
  {
    id:"ssti", label:"Skin & Soft Tissue",
    orgs:["Staph aureus (MSSA)","Staph aureus (MRSA)"],
    regimens:[
      {name:"Cephalexin",       dose:"500 mg QID × 5–7d",   note:"Non-purulent cellulitis (Strep); MSSA coverage"},
      {name:"Dicloxacillin",    dose:"500 mg QID × 5–7d",   note:"MSSA; preferred for outpatient"},
      {name:"TMP-SMX",          dose:"160/800 mg BID × 5–7d", note:"Purulent — MRSA coverage", abx:"sxt"},
      {name:"Doxycycline",      dose:"100 mg BID × 5–7d",   note:"MRSA alternative; similar efficacy to TMP-SMX"},
      {name:"Clindamycin",      dose:"300–450 mg TID × 5–7d", note:"Check inducible resistance (D-zone test)", abx:"cli"},
      {name:"Vancomycin",       dose:"15–20 mg/kg IV q8–12h", note:"Severe MRSA SSTI requiring hospitalization", abx:"van"},
    ]
  },
  {
    id:"sepsis", label:"Sepsis (undifferentiated)",
    orgs:["E. coli","Klebsiella pneumoniae","Staph aureus (MSSA)","Staph aureus (MRSA)"],
    regimens:[
      {name:"Vancomycin + Pip/Taz",  dose:"Vanco 25–30 mg/kg load + PipTaz 4.5 g IV q6h", note:"Broad coverage — MRSA + GNR + anaerobes", abx:"ptz"},
      {name:"Vancomycin + Cefepime", dose:"Vanco + Cefepime 2 g IV q8h", note:"Avoid PipTaz if AKI concern (VANISH trial)", abx:"fep"},
      {name:"Vancomycin + Meropenem",dose:"Vanco + Meropenem 1–2 g IV q8h", note:"ESBL/MDR risk, immunocompromised, recent hospitalization", abx:"mem"},
    ]
  },
  {
    id:"abdominal", label:"Intra-abdominal",
    orgs:["E. coli","Klebsiella pneumoniae"],
    regimens:[
      {name:"Pip/Tazobactam",   dose:"3.375 g IV q6h",      note:"Community-acquired; adequate anaerobic coverage", abx:"ptz"},
      {name:"Ceftriaxone + Metronidazole", dose:"1 g IV q24h + Metro 500 mg IV q8h", note:"Alternative; good GNR + anaerobic coverage", abx:"cro"},
      {name:"Meropenem",        dose:"1 g IV q8h",          note:"High severity, ESBL risk, healthcare-associated", abx:"mem"},
      {name:"Ertapenem",        dose:"1 g IV q24h",         note:"Once-daily option; no Pseudomonas coverage"},
    ]
  },
  {
    id:"prostatitis", label:"Prostatitis (acute bacterial)",
    orgs:["E. coli","Klebsiella pneumoniae","Proteus mirabilis","Enterococcus faecalis"],
    regimens:[
      {name:"Ciprofloxacin",    dose:"500 mg PO BID × 4–6 wk",        note:"First-line; excellent prostate penetration — check local E. coli susceptibility", abx:"cip"},
      {name:"Levofloxacin",     dose:"500 mg PO QD × 4–6 wk",         note:"First-line alternative; once-daily dosing", abx:"lvx"},
      {name:"TMP-SMX",          dose:"160/800 mg PO BID × 4–6 wk",    note:"Use only if susceptibility confirmed; inferior prostate penetration vs. fluoroquinolones", abx:"sxt"},
      {name:"Ceftriaxone",      dose:"1–2 g IV q24h → oral step-down", note:"Initial IV for septic presentation; step down once afebrile and improving", abx:"cro"},
    ]
  },
  {
    id:"osteomyelitis", label:"Osteomyelitis / Septic Arthritis",
    orgs:["Staph aureus (MSSA)","Staph aureus (MRSA)"],
    regimens:[
      {name:"Nafcillin / Oxacillin", dose:"1.5–2 g IV q4h",                       note:"MSSA definitive therapy; superior to vancomycin for MSSA — de-escalate if cultures confirm MSSA", abx:"oxa"},
      {name:"Cefazolin",             dose:"1–2 g IV q8h",                          note:"MSSA alternative; better tolerated than nafcillin", abx:"cfz"},
      {name:"Vancomycin",            dose:"15–20 mg/kg IV q8–12h (AUC-guided)",   note:"Empiric if MRSA risk or pending cultures; definitive therapy for MRSA", abx:"van"},
      {name:"TMP-SMX",               dose:"160/800 mg PO BID (step-down)",         note:"Oral step-down for MRSA osteomyelitis; good bone penetration — use if susceptible", abx:"sxt"},
      {name:"Doxycycline",           dose:"100 mg PO BID (step-down)",             note:"Oral MRSA alternative; similar efficacy to TMP-SMX for step-down therapy", abx:"dox"},
    ]
  },
  {
    id:"meningitis", label:"Meningitis (bacterial)",
    orgs:["Streptococcus pneumoniae"],
    regimens:[
      {name:"Vancomycin + Ceftriaxone",  dose:"Vanco 15–20 mg/kg IV q8–12h + Ceftriaxone 2 g IV q12h", note:"Empiric first-line for community-acquired; covers pneumococcal and meningococcal", abx:"cro"},
      {name:"+ Ampicillin (add-on)",     dose:"2 g IV q4h",                                              note:"Add if age >50, immunocompromised, or pregnant — covers Listeria monocytogenes"},
      {name:"Dexamethasone",             dose:"0.15 mg/kg IV q6h × 4 days",                              note:"Give before or with first antibiotic dose; reduces mortality and neurological sequelae in pneumococcal meningitis"},
      {name:"Ceftriaxone (monotherapy)", dose:"2 g IV q12h",                                              note:"De-escalation for confirmed susceptible pneumococcal or meningococcal — discontinue vancomycin once susceptibilities return", abx:"cro"},
    ]
  },
  {
    id:"diabetic-foot", label:"Diabetic Foot Infection",
    orgs:["Staph aureus (MSSA)","Staph aureus (MRSA)","E. coli","Klebsiella pneumoniae","Proteus mirabilis"],
    regimens:[
      {name:"Amox/Clavulanate",            dose:"875/125 mg PO BID × 7–14d",                            note:"Mild; Strep/MSSA + anaerobic + GNR coverage", abx:"ams"},
      {name:"TMP-SMX",                     dose:"160/800 mg PO BID × 7–14d",                            note:"Mild–moderate with MRSA risk; add amoxicillin if Streptococcus coverage needed", abx:"sxt"},
      {name:"Doxycycline",                 dose:"100 mg PO BID × 7–14d",                                note:"MRSA alternative for mild–moderate; less GNR coverage than TMP-SMX", abx:"dox"},
      {name:"Vancomycin + Pip/Tazobactam", dose:"Vanco 15–20 mg/kg IV q8–12h + PipTaz 4.5 g IV q6h",   note:"Moderate–severe; MRSA + GNR + anaerobic coverage", abx:"ptz"},
      {name:"Vancomycin + Meropenem",      dose:"Vanco + Meropenem 1 g IV q8h",                         note:"Severe or ESBL/MDR risk; prior antibiotics, osteomyelitis, or healthcare-associated infection", abx:"mem"},
    ]
  },
  {
    id:"biliary", label:"Biliary / Cholangitis",
    orgs:["E. coli","Klebsiella pneumoniae","Enterococcus faecalis"],
    regimens:[
      {name:"Ceftriaxone",                 dose:"1–2 g IV q24h",                              note:"Mild–moderate (Tokyo Grade I–II); adequate GNR coverage", abx:"cro"},
      {name:"Ceftriaxone + Metronidazole", dose:"1–2 g IV q24h + Metro 500 mg IV q8h",       note:"Add metronidazole if anaerobic risk (biliary-enteric anastomosis, obstruction)", abx:"cro"},
      {name:"Pip/Tazobactam",              dose:"3.375–4.5 g IV q6h",                         note:"Moderate–severe; broad GNR + anaerobic coverage; add vancomycin if Enterococcus suspected", abx:"ptz"},
      {name:"Meropenem",                   dose:"1 g IV q8h",                                 note:"Severe (Tokyo Grade III); resistant organisms, healthcare-associated, or prior biliary instrumentation", abx:"mem"},
    ]
  },
];

let selectedSite     = SITES[0].id;
let selectedOrg      = null;
let selectedFacility = 'trinity';

function resistCell(val) {
  if (val === null || val === undefined) return "";
  if (val === "nr") return `<span class="susc-nr">~</span>`;
  const r = 100 - val;
  const cls = r<=10?"susc-hi":r<=30?"susc-mid":"susc-lo";
  return `<span class="${cls}">${r}%</span>`;
}

function getSusc(org, abxKey) {
  const data = FACILITY_SUSC[selectedFacility]?.data?.[org];
  if (!data) return undefined;
  return data[abxKey] !== undefined ? data[abxKey] : undefined;
}

function renderOrgs(site) {
  const orgSeg = document.getElementById("seg-org");
  orgSeg.innerHTML =
    `<button class="org-btn${!selectedOrg?" active":""}" data-org=""><span class="org-dot"></span><span class="org-label">Any / unknown</span></button>` +
    site.orgs.map(o => `<button class="org-btn${o===selectedOrg?" active":""}" data-org="${o}"><span class="org-dot"></span><span class="org-label">${o}</span></button>`).join("");
  orgSeg.querySelectorAll(".org-btn").forEach(btn => btn.addEventListener("click", () => {
    orgSeg.querySelectorAll(".org-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedOrg = btn.dataset.org || null;
    renderResult();
  }));
}

function renderResult() {
  const site    = SITES.find(s => s.id === selectedSite);
  const facInfo = FACILITY_SUSC[selectedFacility];
  const orgData = selectedOrg ? facInfo?.data?.[selectedOrg] : null;

  const rows = site.regimens.map(r => {
    let resistVal = `<span class="susc-na">—</span>`;
    if (orgData && r.abx) {
      const val = getSusc(selectedOrg, r.abx);
      resistVal = val !== undefined ? resistCell(val) : `<span class="susc-na">—</span>`;
    }
    return `
      <tr>
        <td class="reg-name">${r.name}</td>
        <td class="reg-dose">${r.dose}</td>
        <td class="susc-col">${resistVal}</td>
        <td class="reg-note">${r.note}</td>
      </tr>`;
  }).join("");

  const orgLabel = orgData ? selectedOrg : "select organism ↑";
  const suscNote = orgData
    ? `Local resistance rates: <strong>${selectedOrg}</strong> · ${facInfo.label}`
    : "Select an organism above to see local resistance data";

  document.getElementById("result-area").innerHTML = `
    <div class="result-card">
      <div class="result-head">${site.label}</div>
      <div class="susc-note">${suscNote}</div>
      <div class="tbl-wrap">
        <table class="reg-tbl">
          <thead><tr>
            <th>Regimen</th>
            <th>Typical dose</th>
            <th class="susc-col">Local %R<br><span class="susc-src">${orgLabel}</span></th>
            <th>Notes</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="legend-row">
        <span class="susc-hi">≤10%</span> low resistance &nbsp;·&nbsp;
        <span class="susc-mid">11–30%</span> moderate &nbsp;·&nbsp;
        <span class="susc-lo">&gt;30%</span> high resistance &nbsp;·&nbsp;
        <span class="susc-nr">~</span> not recommended &nbsp;·&nbsp;
        <span class="susc-na">—</span> not tested / select organism
      </div>
    </div>`;
}

function render() {
  const site = SITES.find(s => s.id === selectedSite);
  renderOrgs(site);
  renderResult();
}

// Site dropdown — wired up once, before data loads
const siteSel = document.getElementById("site-sel");
SITES.forEach(s => {
  const opt = document.createElement("option");
  opt.value = s.id;
  opt.textContent = s.label;
  if (s.id === selectedSite) opt.selected = true;
  siteSel.appendChild(opt);
});
siteSel.addEventListener("change", () => {
  selectedSite = siteSel.value;
  selectedOrg  = null;
  render();
});

async function loadFacilities() {
  document.getElementById("result-area").innerHTML = '<div class="state">Loading antibiogram data…</div>';

  let facilityIds;
  try {
    const manifest = await fetch('/antibiogram/data/manifest.json').then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
    facilityIds = manifest.facilities;
  } catch (e) {
    document.getElementById("result-area").innerHTML =
      '<div class="state err">Could not load antibiogram manifest. Please try again later.</div>';
    return;
  }

  const results = await Promise.allSettled(
    facilityIds.map(id =>
      fetch(`/antibiogram/data/${id}.json`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
    )
  );

  results.forEach(result => {
    if (result.status !== 'fulfilled') return;
    const f = result.value;
    const data = {};
    f.organisms.forEach(org => { data[org.name] = org.s; });
    FACILITY_SUSC[f.id] = {
      label: `${f.name} — ${f.location} (${f.period})`,
      data,
    };
  });

  if (!Object.keys(FACILITY_SUSC).length) {
    document.getElementById("result-area").innerHTML =
      '<div class="state err">Could not load antibiogram data. Please try again later.</div>';
    return;
  }

  if (!FACILITY_SUSC[selectedFacility]) {
    selectedFacility = Object.keys(FACILITY_SUSC)[0];
  }

  const facSel = document.getElementById("fac-sel");
  Object.entries(FACILITY_SUSC).forEach(([id, f]) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = f.label;
    if (id === selectedFacility) opt.selected = true;
    facSel.appendChild(opt);
  });
  facSel.addEventListener("change", () => {
    selectedFacility = facSel.value;
    render();
  });

  render();
}

loadFacilities();
