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
function buildFacilityTabs() {
  const wrap = document.getElementById("facility-tabs");
  wrap.innerHTML = FACILITIES.map(f => `
    <button class="fac-tab${f.id === activeFacilityId ? " active" : ""}"
            data-fac="${f.id}">
      <span class="fac-name">${f.name}</span>
      <span class="fac-loc">${f.location}</span>
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
