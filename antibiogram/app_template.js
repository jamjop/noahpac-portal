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
const FACILITIES = /* __FACILITIES__ */;

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
function buildFacilitySelect() {
  const sel = document.getElementById("facility-select");
  // "5th Medical Group" (Minot AFB) pinned to the top of this dropdown —
  // display-order only, doesn't touch the underlying FACILITIES array/manifest.
  const ordered = [...FACILITIES].sort((a, b) => {
    if (a.id === "minot_afb") return -1;
    if (b.id === "minot_afb") return 1;
    return 0;
  });
  sel.innerHTML = ordered.map(f =>
    `<option value="${f.id}"${f.id === activeFacilityId ? " selected" : ""}>${f.name} — ${f.location} (${f.period})</option>`
  ).join("");
  sel.onchange = () => { activeFacilityId = sel.value; render(); };
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

buildFacilitySelect();
render();
