// ── Antibiotic master dictionary ──────────────────────────────────────────
const ABX = {
  pen:   {name:"Penicillin G",            abbr:"PEN G"},
  amp:   {name:"Ampicillin",              abbr:"AMP"},
  oxa:   {name:"Oxacillin",               abbr:"OXA"},
  ams:   {name:"Ampicillin/Sulbactam",    abbr:"AMP/SUL"},
  ptz:   {name:"Pip/Tazobactam",          abbr:"PIP/TAZ"},
  cfz:   {name:"Cefazolin",               abbr:"CFZ"},
  cfz_u: {name:"Cefazolin (urine)",       abbr:"CFZ-U"},
  cfx:   {name:"Cefoxitin",               abbr:"CFX"},
  cxm:   {name:"Cefuroxime",              abbr:"CXM"},
  cro:   {name:"Ceftriaxone",             abbr:"CRO"},
  caz:   {name:"Ceftazidime",             abbr:"CAZ"},
  fep:   {name:"Cefepime",                abbr:"FEP"},
  mem:   {name:"Meropenem",               abbr:"MEM"},
  gen:   {name:"Gentamicin",              abbr:"GEN"},
  tob:   {name:"Tobramycin",              abbr:"TOB"},
  cip:   {name:"Ciprofloxacin",           abbr:"CIP"},
  lvx:   {name:"Levofloxacin",            abbr:"LVX"},
  van:   {name:"Vancomycin",              abbr:"VAN"},
  tet:   {name:"Tetracycline",            abbr:"TET"},
  dox:   {name:"Doxycycline",             abbr:"DOX"},
  cli:   {name:"Clindamycin",             abbr:"CLI"},
  ery:   {name:"Erythromycin",            abbr:"ERY"},
  azi:   {name:"Azithromycin",            abbr:"AZI"},
  sxt:   {name:"TMP/SMX",                abbr:"TMP/SMX"},
  rif:   {name:"Rifampin",               abbr:"RIF"},
  dap:   {name:"Daptomycin",             abbr:"DAP"},
  lzd:   {name:"Linezolid",              abbr:"LZD"},
  nit:   {name:"Nitrofurantoin (urine)",  abbr:"NIT"},
};

// Display order for columns
const ABX_ORDER = [
  "pen","amp","oxa","ams","ptz","cfz","cfz_u","cfx","cxm",
  "cro","caz","fep","mem",
  "gen","tob","cip","lvx",
  "van","tet","dox","cli","ery","azi",
  "sxt","rif","dap","lzd","nit"
];

// ── Facility data ──────────────────────────────────────────────────────────
const FACILITIES = [
  // ── 1. Trinity Hospital (Minot) CY 2022 ──────────────────────────────
  {
    id: "trinity",
    name: "Trinity Hospital",
    location: "Minot, ND",
    period: "2023",
    sourceNote: "ND HHS Archive · Trinity Hospital Antibiogram 2023 (data period: Jan 1 – Dec 31, 2022) · % susceptible, 1st isolate/patient/year · hhs.nd.gov/…/2023-TrinityHealth-archive.pdf",
    organisms: [
      // ── Gram-positive ──
      { name:"Staph aureus (MSSA)",        gram:"positive", isolates:483,
        s:{pen:"nr",oxa:100,ams:100,ptz:"nr",cfz:"nr",cfx:"nr",cxm:"nr",cro:"nr",caz:"nr",fep:"nr",mem:"nr",gen:99,tob:"nr",cip:89,lvx:90,van:100,tet:94,cli:81,azi:69,sxt:100,rif:100,dap:100,lzd:100,nit:100}},
      { name:"Staph aureus (MRSA)",        gram:"positive", isolates:162,
        s:{oxa:0,ams:0,mem:98,gen:"nr",cip:32,lvx:35,van:100,tet:96,cli:80,sxt:98,rif:99,dap:99,lzd:100,nit:93}},
      { name:"Staph aureus (All strains)", gram:"positive", isolates:645,
        s:{amp:"nr",oxa:75,ams:75,ptz:"nr",cfz:"nr",cfx:"nr",cxm:"nr",cro:"nr",caz:"nr",fep:"nr",mem:98,gen:"nr",cip:75,lvx:76,van:100,tet:95,cli:81,azi:56,sxt:99,rif:100,dap:100,lzd:100,nit:98}},
      { name:"Staph, Coagulase Neg",       gram:"positive", isolates:280,
        s:{oxa:50,ams:50,mem:96,gen:"nr",cip:85,lvx:85,van:100,tet:87,cli:64,azi:42,sxt:83,rif:99,dap:100,lzd:100,nit:100}},
      { name:"Streptococcus pneumoniae",   gram:"positive", isolates:39,
        s:{pen:93,amp:"nr",cro:100,fep:"nr",mem:89,lvx:97,van:100,tet:76,cli:86,azi:75,sxt:79}},
      { name:"Enterococcus faecalis",      gram:"positive", isolates:353,
        s:{amp:100,cip:84,lvx:89,van:100,tet:31,sxt:50,rif:100,dap:100,nit:100}},
      { name:"Enterococcus faecium",       gram:"positive", isolates:45,
        s:{amp:33,cip:20,lvx:36,van:67,tet:64,rif:100,dap:98,nit:83}},
      // ── Gram-negative ──
      { name:"E. coli",                    gram:"negative", isolates:2424,
        s:{amp:64,ams:68,ptz:100,cfz:93,cfx:97,cxm:93,cro:95,caz:96,fep:96,mem:100,gen:94,tob:97,cip:"nr",lvx:"nr",sxt:84,nit:98}},
      { name:"Klebsiella pneumoniae",      gram:"negative", isolates:421,
        s:{ptz:98,cfz:97,cfx:96,cxm:94,cro:97,caz:98,fep:98,mem:100,gen:99,tob:99,sxt:94,nit:48}},
      { name:"Klebsiella oxytoca",         gram:"negative", isolates:133,
        s:{ams:72,ptz:97,cfz:19,cfx:94,cxm:89,cro:95,caz:97,fep:96,mem:100,gen:96,tob:98,sxt:97,nit:93}},
      { name:"Proteus mirabilis",          gram:"negative", isolates:166,
        s:{amp:89,ptz:95,cfz:100,cfx:93,cxm:99,cro:99,caz:98,fep:100,mem:99,gen:95,sxt:86}},
      { name:"Enterobacter cloacae",       gram:"negative", isolates:137,
        s:{ptz:85,cro:69,caz:79,fep:94,mem:100,gen:99,tob:99,sxt:96,nit:26}},
      { name:"Klebsiella aerogenes",       gram:"negative", isolates:63,  note:"formerly Enterobacter",
        s:{ptz:90,cxm:84,cro:83,caz:98,fep:100,mem:100,gen:100,sxt:98,nit:24}},
      { name:"Serratia marcescens",        gram:"negative", isolates:28,
        s:{ptz:89,cxm:93,cro:93,caz:96,fep:100,mem:100,gen:100,sxt:100}},
      { name:"Citrobacter freundii",       gram:"negative", isolates:35,
        s:{ptz:89,cfx:80,cxm:80,cro:100,caz:100,fep:97,mem:97,sxt:89,nit:96}},
      { name:"Pseudomonas aeruginosa",     gram:"negative", isolates:192,
        s:{ptz:96,caz:96,fep:96,mem:98,gen:87,tob:99}},
      { name:"Stenotrophomonas maltophilia",gram:"negative",isolates:24,  s:{sxt:100}},
      { name:"H. influenzae",              gram:"negative", isolates:22,  note:"68% beta-lactamase neg", s:{}},
    ]
  },

  // ── 2. Sanford Health Bismarck 2024 ───────────────────────────────────
  {
    id: "sanford_bismarck",
    name: "Sanford Health",
    location: "Bismarck, ND",
    period: "2024",
    sourceNote: "ND HHS Archive · Sanford Health Bismarck Antibiogram 2025 (Jan–Dec 2024 data) · inpatient + outpatient · % susceptible",
    organisms: [
      // ── Gram-positive ──
      { name:"Enterococcus faecalis",      gram:"positive", isolates:423,
        s:{amp:100,cip:88,lvx:88,nit:100,lzd:97,van:100}},
      { name:"Enterococcus faecium",       gram:"positive", isolates:54,
        s:{amp:26,cip:13,lvx:19,nit:30,lzd:96,van:30}},
      { name:"Staph aureus (MSSA)",        gram:"positive", isolates:726,
        s:{oxa:100,cli:96,ery:69,nit:100,tet:93,sxt:98,lzd:100,van:100}},
      { name:"Staph aureus (MRSA)",        gram:"positive", isolates:310,
        s:{oxa:0,cli:87,ery:17,nit:100,tet:90,sxt:92,lzd:99,van:100}},
      { name:"Staph epidermidis",          gram:"positive", isolates:218,
        s:{oxa:43,cli:73,ery:46,nit:100,tet:84,sxt:67,lzd:99,van:100}},
      { name:"Streptococcus pneumoniae",   gram:"positive", isolates:37,
        note:"PCN/CRO values for non-meningitis breakpoints",
        s:{pen:100,cro:100,lvx:100,cli:97,ery:78,tet:95,sxt:95,lzd:100,van:100}},
      // ── Gram-negative ──
      { name:"Citrobacter freundii",       gram:"negative", isolates:192,
        s:{ptz:91,fep:100,caz:90,cro:89,mem:100,cip:96,lvx:95,gen:99,tob:97,nit:90,sxt:97}},
      { name:"Enterobacter cloacae",       gram:"negative", isolates:179,
        s:{ptz:84,fep:97,caz:87,cro:85,mem:99,cip:96,lvx:93,gen:97,tob:97,nit:27,sxt:93}},
      { name:"E. coli",                    gram:"negative", isolates:4156,
        s:{amp:62,ptz:97,cfz:94,fep:99,caz:98,cro:95,mem:100,cip:85,lvx:81,gen:94,tob:95,nit:98,sxt:83}},
      { name:"Klebsiella aerogenes",       gram:"negative", isolates:128,
        s:{ptz:84,fep:99,caz:88,cro:85,mem:99,cip:97,lvx:96,gen:98,tob:98,nit:18,sxt:99}},
      { name:"Klebsiella oxytoca",         gram:"negative", isolates:165,
        s:{ptz:96,fep:100,caz:100,cro:97,mem:100,cip:98,lvx:98,gen:99,tob:99,nit:87,sxt:98}},
      { name:"Klebsiella pneumoniae",      gram:"negative", isolates:703,
        s:{ptz:94,cfz:96,fep:99,caz:98,cro:96,mem:99,cip:95,lvx:92,gen:98,tob:98,nit:34,sxt:95}},
      { name:"Proteus mirabilis",          gram:"negative", isolates:364,
        s:{amp:88,ptz:100,cfz:95,fep:100,caz:100,cro:99,mem:100,cip:84,lvx:84,gen:98,tob:98,sxt:90}},
      { name:"Pseudomonas aeruginosa",     gram:"negative", isolates:355,
        s:{ptz:90,fep:97,caz:95,mem:93,cip:88,lvx:80,tob:97}},
      { name:"Serratia marcescens",        gram:"negative", isolates:48,
        s:{fep:100,caz:100,cro:90,mem:98,cip:96,lvx:96,gen:98,tob:90,sxt:98}},
      { name:"Stenotrophomonas maltophilia",gram:"negative",isolates:43,  s:{lvx:81,sxt:88}},
      { name:"H. influenzae",              gram:"negative", isolates:33,  s:{amp:76}},
    ]
  },

  // ── 3. Altru Health System (Grand Forks) 2024 ─────────────────────────
  {
    id: "altru",
    name: "Altru Health System",
    location: "Grand Forks, ND",
    period: "2024",
    sourceNote: "ND HHS Archive · Altru Health System 2024 Antibiogram · % susceptible, 1st isolate/patient",
    organisms: [
      // ── Gram-positive ──
      { name:"Enterococcus faecalis",      gram:"positive", isolates:359,
        s:{amp:100,van:99,lzd:98,dap:100,nit:100}},
      { name:"Enterococcus faecium",       gram:"positive", isolates:57,
        s:{amp:28,van:61,lzd:97,nit:30}},
      { name:"Staph aureus (MSSA)",        gram:"positive", isolates:738,
        s:{oxa:75,ery:93,sxt:81,cli:93,dox:100,van:100,lzd:100}},
      { name:"Staph aureus (MRSA)",        gram:"positive", isolates:186,
        s:{ery:86,sxt:80,cli:91,dox:100,van:100,lzd:100}},
      { name:"Staph epidermidis",          gram:"positive", isolates:202,
        s:{oxa:40,ery:"nr",sxt:53,cli:83,dox:100,van:99,lzd:100}},
      { name:"Streptococcus pneumoniae",   gram:"positive", isolates:54,
        note:"PCN/CRO: non-meningitis breakpoints",
        s:{pen:97,cro:96,ery:65,cli:96,dox:75,van:100}},
      { name:"β-hemolytic Strep (GAS)",   gram:"positive", isolates:25,
        s:{pen:100,cro:100,cli:100,sxt:52}},
      { name:"β-hemolytic Strep (GBS)",   gram:"positive", isolates:89,
        s:{pen:98,cro:100,cli:100,sxt:47}},
      { name:"Strep anginosus",            gram:"positive", isolates:27,
        s:{amp:96,cro:95,sxt:65,dox:92}},
      { name:"Strep intermedius",          gram:"positive", isolates:21,
        s:{amp:100,cro:100,sxt:72,dox:95}},
      { name:"Strep mitis/oralis",         gram:"positive", isolates:27,
        s:{amp:70,cro:92,sxt:77,dox:100}},
      // ── Gram-negative ──
      { name:"E. coli",                    gram:"negative", isolates:2008,
        s:{amp:63,ams:72,ptz:95,cfz_u:93,cro:95,fep:97,mem:100,cip:79,gen:94,sxt:84,nit:97}},
      { name:"Enterobacter cloacae",       gram:"negative", isolates:151,
        s:{ptz:82,cro:"nr",fep:94,mem:96,cip:96,gen:98,sxt:94,nit:11}},
      { name:"Klebsiella aerogenes",       gram:"negative", isolates:47,
        s:{ptz:69,cro:"nr",fep:100,mem:100,cip:91,gen:100,sxt:97,nit:33}},
      { name:"Klebsiella oxytoca",         gram:"negative", isolates:128,
        s:{ams:77,ptz:92,cro:93,fep:96,mem:99,cip:95,gen:97,sxt:92,nit:87}},
      { name:"Klebsiella pneumoniae",      gram:"negative", isolates:354,
        s:{ams:89,ptz:95,cfz_u:94,cro:97,fep:96,mem:99,cip:92,gen:98,sxt:94,nit:34}},
      { name:"Pseudomonas aeruginosa",     gram:"negative", isolates:267,
        s:{ptz:89,fep:93,mem:93,cip:87,gen:99}},
      { name:"Proteus mirabilis",          gram:"negative", isolates:211,
        s:{amp:86,ams:93,ptz:98,cfz_u:96,cro:99,fep:100,mem:99,cip:87,gen:93,sxt:89,nit:"nr"}},
      { name:"Citrobacter gp",             gram:"negative", isolates:127,
        s:{ptz:94,cro:"nr",fep:99,mem:100,cip:94,gen:97,sxt:94,nit:89}},
      { name:"Serratia marcescens",        gram:"negative", isolates:26,
        s:{cro:"nr",fep:100,mem:100,cip:96,gen:100,sxt:100}},
      { name:"Haemophilus gp",             gram:"negative", isolates:60,
        s:{ams:90,cro:96,cip:100,sxt:77}},
    ]
  },

  // ── 4. CHI St. Alexius Health Bismarck 2024 ───────────────────────────
  {
    id: "chi_bismarck",
    name: "CHI St. Alexius Health",
    location: "Bismarck, ND",
    period: "2024",
    sourceNote: "ND HHS Archive · CHI St. Alexius Health Bismarck Antibiogram (Jan 1 – Dec 31, 2024) · inpatient · % susceptible",
    organisms: [
      // ── Gram-positive ──
      { name:"Staph aureus (MSSA)",        gram:"positive", isolates:137,
        s:{oxa:100,gen:100,lvx:92,van:100,cli:87,sxt:99,dox:100,nit:100}},
      { name:"Staph aureus (MRSA)",        gram:"positive", isolates:42,
        s:{gen:100,lvx:31,van:100,cli:73,sxt:95,dox:95,nit:100}},
      { name:"Staph aureus (All)",         gram:"positive", isolates:185,
        s:{oxa:74,gen:100,van:100,cli:66,sxt:95,dox:96,nit:100}},
      { name:"Staph CoNS",                 gram:"positive", isolates:55,
        s:{oxa:43,gen:96,lvx:69,van:100,cli:63,sxt:68,dox:90,nit:100}},
      { name:"Streptococcus pneumoniae",   gram:"positive", isolates:26,
        note:"PCN/CRO: non-meningitis breakpoints",
        s:{pen:96,cro:96,lvx:100,sxt:80,dox:58}},
      { name:"Strep viridans",             gram:"positive", isolates:54,
        s:{pen:78,cro:94,lvx:98,van:100,cli:81}},
      { name:"Enterococcus faecalis",      gram:"positive", isolates:87,
        s:{amp:100,gen:80,lvx:85,cip:85,van:100,nit:100}},
      { name:"Enterococcus faecium",       gram:"positive", isolates:24,
        s:{amp:13,gen:96,lvx:9,cip:9,van:50,nit:39}},
      // ── Gram-negative ──
      { name:"E. coli",                    gram:"negative", isolates:536,
        s:{ptz:50,cfz_u:96,cro:91,caz:93,fep:99,mem:100,tob:95,lvx:77,cip:79,sxt:80,nit:98}},
      { name:"Klebsiella pneumoniae",      gram:"negative", isolates:103,
        s:{ptz:100,cfz_u:91,cro:85,caz:87,fep:89,mem:99,tob:94,lvx:84,cip:84,sxt:86}},
      { name:"Klebsiella oxytoca",         gram:"negative", isolates:28,
        s:{cfz_u:94,cro:96,caz:100,fep:100,mem:100,tob:100,lvx:100,cip:100,sxt:93,nit:96}},
      { name:"Proteus mirabilis",          gram:"negative", isolates:55,
        s:{cfz_u:100,cro:98,caz:98,fep:100,mem:100,tob:100,lvx:75,cip:75,sxt:90}},
      { name:"Enterobacter cloacae",       gram:"negative", isolates:38,
        s:{ptz:65,caz:"nr",fep:89,mem:95,tob:97,lvx:100,cip:97,sxt:97,nit:29}},
      { name:"Klebsiella aerogenes",       gram:"negative", isolates:19,
        s:{ptz:71,caz:"nr",fep:100,mem:100,tob:100,lvx:100,cip:100,sxt:100,nit:21}},
      { name:"Citrobacter freundii",       gram:"negative", isolates:11, note:"n<30; interpret with caution",
        s:{ptz:85,caz:"nr",fep:100,mem:100,tob:100,lvx:90,cip:100,sxt:100,nit:90}},
      { name:"Pseudomonas aeruginosa",     gram:"negative", isolates:95,
        s:{ptz:91,caz:92,fep:97,mem:89,tob:97,lvx:76,cip:84}},
    ]
  },
];

// ── State ──────────────────────────────────────────────────────────────────
let activeFacilityId = "trinity";
let activeGram       = "positive";

function getFacility() {
  return FACILITIES.find(f => f.id === activeFacilityId);
}

// ── Helpers ────────────────────────────────────────────────────────────────
function cellCls(val) {
  if (val === null || val === undefined) return "na";
  if (val === "nr") return "nr";
  if (val >= 90) return "hi";
  if (val >= 70) return "mid";
  return "lo";
}

function cellTxt(val) {
  if (val === null || val === undefined) return "—";
  if (val === "nr") return "~";
  return val;
}

function getAbxForOrgs(orgs) {
  const seen = new Set();
  orgs.forEach(o => Object.keys(o.s).forEach(id => seen.add(id)));
  return ABX_ORDER.filter(id => seen.has(id));
}

// ── Render ─────────────────────────────────────────────────────────────────
function render() {
  const facility = getFacility();
  const orgs     = facility.organisms.filter(o => o.gram === activeGram);
  const abxIds   = getAbxForOrgs(orgs);

  // Update header eyebrow
  document.getElementById("eyebrow").textContent =
    `${facility.name} · ${facility.location} · ${facility.period}`;

  // Update footer source note
  const srcEl = document.getElementById("source-note");
  if (srcEl) srcEl.textContent = facility.sourceNote;

  const head = document.getElementById("thead");
  const body = document.getElementById("tbody");

  head.innerHTML = `<tr>
    <th class="col-org">Organism</th>
    <th class="col-n">n</th>
    ${abxIds.map(id => `<th title="${ABX[id].name}">${ABX[id].abbr}</th>`).join("")}
  </tr>`;

  body.innerHTML = orgs.map(org => `
    <tr>
      <td class="col-org">
        ${org.name}${org.note ? `<span class="org-note">${org.note}</span>` : ""}
      </td>
      <td class="col-n">${org.isolates.toLocaleString()}</td>
      ${abxIds.map(id => {
        const v = org.s[id] ?? null;
        return `<td class="c-${cellCls(v)}">${cellTxt(v)}</td>`;
      }).join("")}
    </tr>
  `).join("");
}

// ── Facility selector ──────────────────────────────────────────────────────
function buildFacilityTabs() {
  const wrap = document.getElementById("facility-tabs");
  wrap.innerHTML = FACILITIES.map(f => `
    <button class="fac-tab${f.id === activeFacilityId ? " active" : ""}"
            data-fac="${f.id}">
      <span class="fac-name">${f.name}</span>
      <span class="fac-loc">${f.location}</span>
      <span class="fac-period">${f.period} data</span>
    </button>
  `).join("");

  wrap.querySelectorAll(".fac-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      wrap.querySelectorAll(".fac-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFacilityId = btn.dataset.fac;
      render();
    });
  });
}

// ── Gram tabs ──────────────────────────────────────────────────────────────
document.querySelectorAll(".gram-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".gram-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeGram = btn.dataset.gram;
    render();
  });
});

buildFacilityTabs();
render();

// ── PDF Import ─────────────────────────────────────────────────────────────
(function () {
  const toggle  = document.getElementById("import-toggle");
  const body    = document.getElementById("import-body");
  const chevron = document.querySelector(".import-chevron");
  const btn     = document.getElementById("import-submit");
  const status  = document.getElementById("import-status");
  const log     = document.getElementById("import-log");

  toggle.addEventListener("click", () => {
    const open = !body.hidden;
    body.hidden = open;
    toggle.setAttribute("aria-expanded", String(!open));
    chevron.textContent = open ? "▾" : "▴";
  });
  toggle.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") toggle.click(); });

  function setStatus(msg, type) {
    status.textContent = msg;
    status.className = "import-status" + (type ? " import-status-" + type : "");
  }

  btn.addEventListener("click", async () => {
    const url    = document.getElementById("imp-url").value.trim();
    const name   = document.getElementById("imp-name").value.trim();
    const loc    = document.getElementById("imp-loc").value.trim();
    const period = document.getElementById("imp-period").value.trim();

    if (!url) { setStatus("Paste a PDF URL first.", "err"); return; }
    if (!url.toLowerCase().endsWith(".pdf")) {
      setStatus("URL must point to a .pdf file.", "err"); return;
    }

    btn.disabled = true;
    log.hidden = true;
    setStatus("Downloading and extracting… this takes 20–60 s", "busy");

    try {
      const resp = await fetch("/antibiogram/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, name, location: loc, period }),
      });
      const data = await resp.json();

      if (!resp.ok || data.error) {
        setStatus("Error: " + (data.error || resp.statusText), "err");
        btn.disabled = false;
        return;
      }

      const fac = data.facility;
      const s   = data.stats;

      // Guard against duplicate IDs
      if (FACILITIES.find(f => f.id === fac.id)) {
        fac.id += "_" + Date.now().toString(36);
      }

      FACILITIES.push(fac);
      activeFacilityId = fac.id;
      buildFacilityTabs();
      render();

      setStatus(
        `Added "${fac.name}" — ${s.organisms} organism(s) · ${s.gram_positive} gram+ · ${s.gram_negative} gram−`,
        "ok"
      );

      // Show log
      log.textContent = `Facility ID : ${fac.id}\nPages processed: ${s.pages}\nOrganisms found: ${s.organisms}\nSource note: ${fac.sourceNote}`;
      log.hidden = false;

      // Scroll to new tab
      document.getElementById("facility-tabs").scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (err) {
      setStatus("Network error: " + err.message, "err");
    }

    btn.disabled = false;
  });
})();
