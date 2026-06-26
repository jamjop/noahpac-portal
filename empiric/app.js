const FACILITY_IDS = ['trinity', 'sanford_bismarck', 'altru', 'chi_bismarck'];

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
];

let selectedSite     = SITES[0].id;
let selectedOrg      = null;
let selectedFacility = 'trinity';

function suscCell(val) {
  if (val === null || val === undefined) return "";
  if (val === "nr") return `<span class="susc-nr">~</span>`;
  const cls = val>=90?"susc-hi":val>=70?"susc-mid":"susc-lo";
  return `<span class="${cls}">${val}%</span>`;
}

function getSusc(org, abxKey) {
  const data = FACILITY_SUSC[selectedFacility]?.data?.[org];
  if (!data) return undefined;
  return data[abxKey] !== undefined ? data[abxKey] : undefined;
}

function render() {
  const site    = SITES.find(s => s.id === selectedSite);
  const facInfo = FACILITY_SUSC[selectedFacility];

  const orgSeg = document.getElementById("seg-org");
  orgSeg.innerHTML = `<button class="seg-btn${!selectedOrg?" active":""}" data-org="">Any / unknown</button>` +
    site.orgs.map(o => `<button class="seg-btn${o===selectedOrg?" active":""}" data-org="${o}">${o}</button>`).join("");
  orgSeg.querySelectorAll(".seg-btn").forEach(btn => btn.addEventListener("click", () => {
    selectedOrg = btn.dataset.org || null;
    render();
  }));

  const orgData = selectedOrg ? facInfo?.data?.[selectedOrg] : null;

  const rows = site.regimens.map(r => {
    let localCell = "";
    if (orgData && r.abx) {
      const val = getSusc(selectedOrg, r.abx);
      const rendered = val !== undefined ? suscCell(val) : `<span class="susc-na">—</span>`;
      localCell = `<td class="susc-col">${rendered}</td>`;
    } else if (orgData) {
      localCell = `<td class="susc-col susc-na">—</td>`;
    }
    return `
      <tr>
        <td class="reg-name">${r.name}</td>
        <td class="reg-dose">${r.dose}</td>
        ${orgData ? localCell : ""}
        <td class="reg-note">${r.note}</td>
      </tr>`;
  }).join("");

  const localHeader = orgData
    ? `<th class="susc-col">Local %S<br><span class="susc-src">${selectedOrg}</span></th>` : "";

  document.getElementById("result-area").innerHTML = `
    <div class="result-card">
      <div class="result-head">${site.label}</div>
      ${orgData ? `<div class="susc-note">Local susceptibility: <strong>${selectedOrg}</strong> · ${facInfo.label}</div>` : ""}
      <div class="tbl-wrap">
        <table class="reg-tbl">
          <thead><tr>
            <th>Regimen</th>
            <th>Typical dose</th>
            ${localHeader}
            <th>Notes</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${orgData ? `<div class="legend-row">
        <span class="susc-hi">≥90%</span> high &nbsp;·&nbsp;
        <span class="susc-mid">70–89%</span> intermediate &nbsp;·&nbsp;
        <span class="susc-lo">&lt;70%</span> low &nbsp;·&nbsp;
        <span class="susc-nr">~</span> not recommended &nbsp;·&nbsp;
        <span class="susc-na">—</span> not tested at this facility
      </div>` : ""}
    </div>`;
}

// Site buttons — wired up once, before data loads
const siteSeg = document.getElementById("seg-site");
siteSeg.innerHTML = SITES.map(s =>
  `<button class="seg-btn${s.id===selectedSite?" active":""}" data-site="${s.id}">${s.label}</button>`
).join("");
siteSeg.querySelectorAll(".seg-btn").forEach(btn => btn.addEventListener("click", () => {
  selectedSite = btn.dataset.site;
  selectedOrg  = null;
  siteSeg.querySelectorAll(".seg-btn").forEach(b => b.classList.toggle("active", b === btn));
  render();
}));

async function loadFacilities() {
  document.getElementById("result-area").innerHTML = '<div class="state">Loading antibiogram data…</div>';

  const results = await Promise.allSettled(
    FACILITY_IDS.map(id =>
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
