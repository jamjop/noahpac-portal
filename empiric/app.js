// Local susceptibility data — keyed by facility id → organism → antibiotic
const FACILITY_SUSC = {
  trinity: {
    label: "Trinity Hospital — Minot, ND (2023, data: CY 2022)",
    data: {
      "E. coli":               {amp:64,ams:68,ptz:100,cfz:93,cfx:97,cxm:93,cro:95,caz:96,fep:96,mem:100,gen:94,tob:97,cip:"nr",lvx:"nr",sxt:84,nit:98},
      "Klebsiella pneumoniae": {ptz:98,cfz:97,cfx:96,cxm:94,cro:97,caz:98,fep:98,mem:100,gen:99,tob:99,sxt:94,nit:48},
      "Proteus mirabilis":     {amp:89,ptz:95,cfz:100,cfx:93,cxm:99,cro:99,caz:98,fep:100,mem:99,gen:95,sxt:86},
      "Pseudomonas aeruginosa":{ptz:96,caz:96,fep:96,mem:98,gen:87,tob:99},
      "Staph aureus (MSSA)":   {oxa:100,ams:100,gen:99,cip:89,lvx:90,van:100,tet:94,cli:81,azi:69,sxt:100,rif:100,dap:100,lzd:100,nit:100},
      "Staph aureus (MRSA)":   {oxa:0,ams:0,mem:98,gen:"nr",cip:32,lvx:35,van:100,tet:96,cli:80,sxt:98,rif:99,dap:99,lzd:100,nit:93},
      "Enterococcus faecalis": {amp:100,cip:84,lvx:89,van:100,tet:31,sxt:50,rif:100,dap:100,nit:100},
      "Streptococcus pneumoniae":{pen:93,cro:100,mem:89,lvx:97,van:100,tet:76,cli:86,azi:75,sxt:79},
    }
  },
  sanford_bismarck: {
    label: "Sanford Health — Bismarck, ND (2024)",
    data: {
      "E. coli":               {amp:62,ptz:97,cfz:94,fep:99,caz:98,cro:95,mem:100,cip:85,lvx:81,gen:94,tob:95,nit:98,sxt:83},
      "Klebsiella pneumoniae": {ptz:94,cfz:96,fep:99,caz:98,cro:96,mem:99,cip:95,lvx:92,gen:98,tob:98,nit:34,sxt:95},
      "Proteus mirabilis":     {amp:88,ptz:100,cfz:95,fep:100,caz:100,cro:99,mem:100,cip:84,lvx:84,gen:98,tob:98,sxt:90},
      "Pseudomonas aeruginosa":{ptz:90,fep:97,caz:95,mem:93,cip:88,lvx:80,tob:97},
      "Staph aureus (MSSA)":   {oxa:100,cli:96,ery:69,nit:100,tet:93,sxt:98,lzd:100,van:100},
      "Staph aureus (MRSA)":   {oxa:0,cli:87,ery:17,nit:100,tet:90,sxt:92,lzd:99,van:100},
      "Enterococcus faecalis": {amp:100,cip:88,lvx:88,nit:100,lzd:97,van:100},
      "Streptococcus pneumoniae":{pen:100,cro:100,lvx:100,cli:97,ery:78,tet:95,sxt:95,lzd:100,van:100},
    }
  },
  altru: {
    label: "Altru Health System — Grand Forks, ND (2024)",
    data: {
      "E. coli":               {amp:63,ams:72,ptz:95,cfz:93,cro:95,fep:97,mem:100,cip:79,gen:94,sxt:84,nit:97},
      "Klebsiella pneumoniae": {ams:89,ptz:95,cfz:94,cro:97,fep:96,mem:99,cip:92,gen:98,sxt:94,nit:34},
      "Proteus mirabilis":     {amp:86,ams:93,ptz:98,cfz:96,cro:99,fep:100,mem:99,cip:87,gen:93,sxt:89,nit:"nr"},
      "Pseudomonas aeruginosa":{ptz:89,fep:93,mem:93,cip:87,gen:99},
      "Staph aureus (MSSA)":   {oxa:75,ery:93,sxt:81,cli:93,dox:100,van:100,lzd:100},
      "Staph aureus (MRSA)":   {ery:86,sxt:80,cli:91,dox:100,van:100,lzd:100},
      "Enterococcus faecalis": {amp:100,van:99,lzd:98,dap:100,nit:100},
      "Streptococcus pneumoniae":{pen:97,cro:96,ery:65,cli:96,dox:75,van:100},
    }
  },
  chi_bismarck: {
    label: "CHI St. Alexius Health — Bismarck, ND (2024)",
    data: {
      "E. coli":               {ptz:50,cfz:96,cro:91,caz:93,fep:99,mem:100,tob:95,lvx:77,cip:79,sxt:80,nit:98},
      "Klebsiella pneumoniae": {ptz:100,cfz:91,cro:85,caz:87,fep:89,mem:99,tob:94,lvx:84,cip:84,sxt:86},
      "Proteus mirabilis":     {cfz:100,cro:98,caz:98,fep:100,mem:100,tob:100,lvx:75,cip:75,sxt:90},
      "Pseudomonas aeruginosa":{ptz:91,caz:92,fep:97,mem:89,tob:97,lvx:76,cip:84},
      "Staph aureus (MSSA)":   {oxa:100,gen:100,lvx:92,van:100,cli:87,sxt:99,dox:100,nit:100},
      "Staph aureus (MRSA)":   {gen:100,lvx:31,van:100,cli:73,sxt:95,dox:95,nit:100},
      "Enterococcus faecalis": {amp:100,gen:80,lvx:85,cip:85,van:100,nit:100},
      "Streptococcus pneumoniae":{pen:96,cro:96,lvx:100,sxt:80,dox:58},
    }
  },
};

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
let selectedFacility = "trinity";

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

  // Org buttons
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

// Site buttons
const siteSeg = document.getElementById("seg-site");
siteSeg.innerHTML = SITES.map(s =>
  `<button class="seg-btn${s.id===selectedSite?" active":""}" data-site="${s.id}">${s.label}</button>`
).join("");
siteSeg.querySelectorAll(".seg-btn").forEach(btn => btn.addEventListener("click", () => {
  selectedSite = btn.dataset.site;
  selectedOrg  = null;
  render();
}));

// Facility selector
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
