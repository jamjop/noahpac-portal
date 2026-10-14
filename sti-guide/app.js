const DATA = [
  // ── Chlamydia ──
  {
    cat:"Chlamydia", name:"Chlamydia trachomatis — Nongonococcal urethritis / cervicitis",
    recommended:[
      {drug:"Doxycycline", dose:"100 mg PO BID × 7 days", note:"Preferred — superior efficacy for urogenital infection"},
    ],
    alternative:[
      {drug:"Azithromycin", dose:"1 g PO × 1 dose", note:"Use when compliance with 7-day course is a concern"},
      {drug:"Levofloxacin", dose:"500 mg PO QD × 7 days", note:""},
    ],
    pregnancy:[
      {drug:"Azithromycin", dose:"1 g PO × 1 dose", note:"Preferred in pregnancy"},
      {drug:"Amoxicillin", dose:"500 mg PO TID × 7 days", note:"Alternative"},
    ],
    notes:"Test-of-cure 4 weeks after treatment if azithromycin used (higher failure rate). Retest in 3 months. Treat all partners."
  },
  {
    cat:"Chlamydia", name:"Chlamydia — Rectal",
    recommended:[
      {drug:"Doxycycline", dose:"100 mg PO BID × 7 days", note:"Superior to azithromycin for rectal infection"},
    ],
    alternative:[
      {drug:"Azithromycin", dose:"1 g PO × 1 dose", note:"Substantially lower cure rates for rectal infection — avoid if possible"},
    ],
    notes:"Doxycycline is strongly preferred over azithromycin for rectal chlamydia."
  },
  {
    cat:"Chlamydia", name:"Lymphogranuloma Venereum (LGV)",
    recommended:[
      {drug:"Doxycycline", dose:"100 mg PO BID × 21 days", note:""},
    ],
    alternative:[
      {drug:"Azithromycin", dose:"1 g PO weekly × 3 weeks", note:"Limited data"},
    ],
    notes:"Buboes may require aspiration or incision/drainage."
  },

  // ── Gonorrhea ──
  {
    cat:"Gonorrhea", name:"Gonorrhea — Uncomplicated urogenital, rectal, or pharyngeal",
    recommended:[
      {drug:"Ceftriaxone", dose:"500 mg IM × 1 dose", note:"If weight ≥150 kg: 1 g IM × 1 dose"},
    ],
    alternative:[
      {drug:"Gentamicin 240 mg IM + Azithromycin 2 g PO", dose:"Single doses simultaneously", note:"If ceftriaxone unavailable or severe allergy"},
      {drug:"Cefixime", dose:"800 mg PO × 1 dose", note:"Substantially lower pharyngeal efficacy — do not use for pharyngeal infection"},
    ],
    pregnancy:[
      {drug:"Ceftriaxone", dose:"500 mg IM × 1 dose", note:"Same as non-pregnant; fluoroquinolones contraindicated"},
    ],
    notes:"Routine co-treatment for chlamydia no longer recommended — test and treat only if chlamydia not excluded. Test-of-cure for pharyngeal infection 7–14 days after treatment. Partner treatment essential."
  },
  {
    cat:"Gonorrhea", name:"Gonorrhea — Disseminated (DGI)",
    recommended:[
      {drug:"Ceftriaxone", dose:"1 g IV/IM q24h", note:"Continue 24–48h after improvement"},
    ],
    alternative:[
      {drug:"Cefotaxime or Ceftizoxime", dose:"1 g IV q8h", note:""},
    ],
    notes:"Step-down to oral cefixime 400 mg BID when improving; total 7 days. Meningitis/endocarditis require prolonged IV therapy (10–14 days / ≥4 weeks)."
  },
  {
    cat:"Gonorrhea", name:"Gonorrhea — Ophthalmia neonatorum (prophylaxis)",
    recommended:[
      {drug:"Erythromycin 0.5% ophthalmic ointment", dose:"Single application both eyes at birth", note:""},
    ],
    notes:"Prophylaxis required by law in most states."
  },

  // ── Syphilis ──
  {
    cat:"Syphilis", name:"Syphilis — Primary, Secondary, or Early Latent (<1 year)",
    recommended:[
      {drug:"Benzathine Penicillin G", dose:"2.4 million units IM × 1 dose", note:""},
    ],
    alternative:[
      {drug:"Doxycycline", dose:"100 mg PO BID × 14 days", note:"Penicillin-allergic, non-pregnant"},
      {drug:"Tetracycline", dose:"500 mg PO QID × 14 days", note:"Penicillin-allergic, non-pregnant"},
      {drug:"Ceftriaxone", dose:"1–2 g IM/IV QD × 10–14 days", note:"Limited data; not preferred"},
    ],
    pregnancy:[
      {drug:"Benzathine Penicillin G", dose:"2.4 million units IM × 1 dose", note:"Desensitize if penicillin-allergic — no alternatives in pregnancy"},
    ],
    notes:"Jarisch-Herxheimer reaction common in first 24h — fever, chills, myalgia. Treat partners exposed within 90 days. Follow-up RPR at 6 and 12 months. SUPPLY ALERT (CDC updated Sep 2026): Bicillin L-A shortage remains active; anticipated recovery Q4 2027. Prioritize benzathine penicillin G for pregnant patients and follow current CDC/FDA availability guidance; notify CDC at stdshortages@cdc.gov of low jurisdictional inventory."
  },
  {
    cat:"Syphilis", name:"Syphilis — Late Latent (>1 year or unknown duration) / Tertiary (non-neurosyphilis)",
    recommended:[
      {drug:"Benzathine Penicillin G", dose:"2.4 million units IM weekly × 3 doses", note:""},
    ],
    alternative:[
      {drug:"Doxycycline", dose:"100 mg PO BID × 28 days", note:"Penicillin-allergic, non-pregnant"},
    ],
    pregnancy:[
      {drug:"Benzathine Penicillin G", dose:"2.4 million units IM weekly × 3 doses", note:"Desensitize if allergic"},
    ],
    notes:"CSF exam recommended if neurologic symptoms or treatment failure; apply current CDC guidance for patients with HIV. SUPPLY ALERT (CDC updated Sep 2026): Bicillin L-A shortage remains active with anticipated recovery Q4 2027; prioritize stock for pregnant patients and consult current CDC/FDA availability guidance."
  },
  {
    cat:"Syphilis", name:"Neurosyphilis / Ocular / Otosyphilis",
    recommended:[
      {drug:"Aqueous Crystalline Penicillin G", dose:"18–24 million units/day IV as 3–4 million units q4h × 10–14 days", note:""},
    ],
    alternative:[
      {drug:"Procaine Penicillin G 2.4MU IM QD + Probenecid 500 mg PO QID × 10–14 days", dose:"", note:"If IV access unavailable"},
    ],
    notes:"Follow with Benzathine Penicillin G 2.4 MU IM weekly × 3 doses. Repeat CSF every 6 months until normal."
  },

  // ── Herpes ──
  {
    cat:"Herpes (HSV)", name:"Genital Herpes — First episode",
    recommended:[
      {drug:"Acyclovir", dose:"400 mg PO TID × 7–10 days", note:"Extend if incomplete healing"},
      {drug:"Valacyclovir", dose:"1 g PO BID × 7–10 days", note:""},
      {drug:"Famciclovir", dose:"250 mg PO TID × 7–10 days", note:""},
    ],
    pregnancy:[
      {drug:"Acyclovir", dose:"400 mg PO TID × 7–10 days", note:"Preferred in pregnancy"},
      {drug:"Valacyclovir", dose:"1 g PO BID × 7–10 days", note:"Also acceptable"},
    ],
    notes:"Suppression at 36 weeks gestation recommended to reduce neonatal transmission risk."
  },
  {
    cat:"Herpes (HSV)", name:"Genital Herpes — Recurrent episodes",
    recommended:[
      {drug:"Acyclovir", dose:"800 mg PO BID × 5d  OR  800 mg TID × 2d", note:""},
      {drug:"Valacyclovir", dose:"500 mg PO BID × 3d  OR  1 g QD × 5d", note:""},
      {drug:"Famciclovir", dose:"125 mg PO BID × 5d  OR  1 g BID × 1d", note:""},
    ],
    notes:"Initiate within 1 day of onset. Single-day regimens (valacyclovir 1g BID × 1d; famciclovir 1g BID × 1d) are FDA-approved and convenient."
  },
  {
    cat:"Herpes (HSV)", name:"Genital Herpes — Suppressive therapy",
    recommended:[
      {drug:"Acyclovir", dose:"400 mg PO BID (daily)", note:""},
      {drug:"Valacyclovir", dose:"500 mg PO QD (daily)", note:"1 g QD if ≥10 recurrences/year"},
      {drug:"Famciclovir", dose:"250 mg PO BID (daily)", note:""},
    ],
    notes:"Reduces transmission to susceptible partners by ~50%. Disclose HSV status to partners. Duration is indefinite based on patient preference."
  },

  // ── Trichomoniasis ──
  {
    cat:"Trichomoniasis", name:"Trichomoniasis",
    recommended:[
      {drug:"Metronidazole", dose:"500 mg PO BID × 7 days", note:"Preferred — higher cure rates than single dose"},
    ],
    alternative:[
      {drug:"Metronidazole", dose:"2 g PO × 1 dose", note:"Single dose option; lower efficacy in women"},
      {drug:"Tinidazole", dose:"2 g PO × 1 dose", note:""},
    ],
    pregnancy:[
      {drug:"Metronidazole", dose:"500 mg PO BID × 7 days", note:"Safe in all trimesters"},
    ],
    notes:"Test-of-cure at 3 months (high reinfection rate). Avoid alcohol during and 72h after tinidazole. Treat partners."
  },

  // ── BV ──
  {
    cat:"Bacterial Vaginosis", name:"Bacterial Vaginosis",
    recommended:[
      {drug:"Metronidazole", dose:"500 mg PO BID × 7 days", note:""},
      {drug:"Metronidazole gel 0.75%", dose:"5 g intravaginally QD × 5 days", note:""},
      {drug:"Clindamycin cream 2%", dose:"5 g intravaginally QHS × 7 days", note:""},
    ],
    alternative:[
      {drug:"Tinidazole", dose:"2 g PO QD × 2 days  OR  1 g PO QD × 5 days", note:""},
      {drug:"Clindamycin", dose:"300 mg PO BID × 7 days", note:""},
      {drug:"Clindamycin ovules 100 mg", dose:"Intravaginally QHS × 3 days", note:""},
      {drug:"Secnidazole", dose:"2 g PO × 1 dose (granules in applesauce)", note:"Single-dose option"},
    ],
    pregnancy:[
      {drug:"Metronidazole", dose:"500 mg PO BID × 7 days", note:""},
      {drug:"Clindamycin", dose:"300 mg PO BID × 7 days", note:""},
    ],
    notes:"High recurrence rate (~30% at 3 months, ~50% at 12 months). Male partners do not require treatment. Consider longer suppressive therapy for frequent recurrence."
  },

  // ── Vulvovaginal Candidiasis ──
  {
    cat:"Vulvovaginal Candidiasis", name:"Vulvovaginal Candidiasis — Uncomplicated",
    recommended:[
      {drug:"Fluconazole", dose:"150 mg PO × 1 dose", note:"Oral; preferred for convenience"},
      {drug:"Miconazole 2% cream", dose:"5 g intravaginally QD × 7 days  OR  Miconazole 200 mg suppository × 3 days", note:"OTC"},
      {drug:"Clotrimazole 1% cream", dose:"5 g intravaginally QD × 7–14 days", note:"OTC"},
      {drug:"Terconazole 0.4% cream", dose:"5 g intravaginally QD × 7 days", note:"Rx"},
    ],
    alternative:[],
    pregnancy:[
      {drug:"Topical azole", dose:"Miconazole or clotrimazole × 7 days", note:"Avoid oral fluconazole in first trimester (teratogenicity risk)"},
    ],
    notes:"Non-albicans species (especially C. glabrata) may require longer courses, topical boric acid 600 mg suppository QD × 14d, or specialist referral."
  },
  {
    cat:"Vulvovaginal Candidiasis", name:"Vulvovaginal Candidiasis — Severe / Recurrent (≥4/year)",
    recommended:[
      {drug:"Fluconazole", dose:"150 mg PO q72h × 3 doses, then 150 mg weekly × 6 months", note:"Induction then suppression"},
    ],
    alternative:[
      {drug:"Ibrexafungerp (Brexafemme)", dose:"300 mg PO BID × 1 day", note:"FDA-approved alternative, especially for azole-resistant species"},
    ],
    notes:"Culture to identify species before starting suppression. C. glabrata (now Nakaseomyces glabrata) is often fluconazole-resistant."
  },

  // ── PID ──
  {
    cat:"Pelvic Inflammatory Disease", name:"PID — Outpatient (mild–moderate)",
    recommended:[
      {drug:"Ceftriaxone 500 mg IM × 1 + Doxycycline 100 mg PO BID × 14d ± Metronidazole 500 mg PO BID × 14d", dose:"", note:"Metronidazole added if BV present or instrumentation within 2 weeks"},
    ],
    alternative:[
      {drug:"Cefoxitin 2 g IM + Probenecid 1 g PO simultaneously, then Doxycycline 100 mg PO BID × 14d ± Metronidazole", dose:"", note:""},
    ],
    notes:"Re-evaluate at 72 hours. Hospitalize if no improvement, inability to tolerate oral therapy, TOA, or surgical emergency cannot be excluded."
  },
  {
    cat:"Pelvic Inflammatory Disease", name:"PID — Inpatient",
    recommended:[
      {drug:"Cefoxitin 2 g IV q6h + Doxycycline 100 mg IV/PO q12h", dose:"", note:"Transition to oral doxycycline when clinical improvement (100 mg PO BID to complete 14 days)"},
      {drug:"Clindamycin 900 mg IV q8h + Gentamicin 3–5 mg/kg IV q24h", dose:"", note:"Alternative parenteral regimen"},
    ],
    notes:"Add metronidazole 500 mg PO BID to complete 14 days when transitioning to oral. IUD removal not required but consider if no improvement at 72h."
  },

  // ── Epididymitis ──
  {
    cat:"Epididymitis", name:"Epididymitis — Likely STI (age <35, sexual risk)",
    recommended:[
      {drug:"Ceftriaxone 500 mg IM × 1 + Doxycycline 100 mg PO BID × 10 days", dose:"", note:"Covers GC and chlamydia"},
    ],
    notes:"Evaluate and treat partners. Scrotal elevation + NSAIDs for symptom relief."
  },
  {
    cat:"Epididymitis", name:"Epididymitis — Likely enteric organisms (age >35, no sexual risk, anal insertive sex)",
    recommended:[
      {drug:"Ceftriaxone 500 mg IM × 1 + Levofloxacin 500 mg PO QD × 10 days", dose:"", note:""},
      {drug:"Ceftriaxone 500 mg IM × 1 + Ofloxacin 300 mg PO BID × 10 days", dose:"", note:""},
    ],
    notes:"Enteric gram-negatives more likely. Urine culture to guide therapy."
  },

  // ── Scabies / Pubic Lice ──
  {
    cat:"Ectoparasites", name:"Scabies",
    recommended:[
      {drug:"Permethrin cream 5%", dose:"Apply to body from neck down; wash off after 8–14 hours. Repeat in 1 week.", note:""},
    ],
    alternative:[
      {drug:"Ivermectin", dose:"200 mcg/kg PO × 1 dose; repeat in 2 weeks", note:"For crusted (Norwegian) scabies or treatment failure; not FDA-approved for this indication"},
    ],
    pregnancy:[
      {drug:"Permethrin cream 5%", dose:"Same as above", note:"Preferred in pregnancy; lindane contraindicated"},
    ],
    notes:"Wash all clothing/bedding in hot water. Treat all household contacts simultaneously. Itch may persist 2–4 weeks after treatment."
  },
  {
    cat:"Ectoparasites", name:"Pubic Lice (Pediculosis pubis)",
    recommended:[
      {drug:"Permethrin cream rinse 1%", dose:"Apply to affected area; wash off after 10 min. Repeat in 9–10 days.", note:"OTC"},
      {drug:"Pyrethrins + piperonyl butoxide", dose:"Apply to affected area; wash off after 10 min. Repeat in 9–10 days.", note:"OTC"},
    ],
    alternative:[
      {drug:"Malathion 0.5% lotion", dose:"Apply for 8–12 hours; wash off. Repeat in 7–9 days.", note:""},
      {drug:"Ivermectin", dose:"250 mcg/kg PO; repeat in 2 weeks", note:""},
    ],
    notes:"Eyelid infestation: apply petrolatum BID × 10 days. Wash all bedding/clothing."
  },

  // ── Chancroid ──
  {
    cat:"Chancroid", name:"Chancroid",
    recommended:[
      {drug:"Azithromycin", dose:"1 g PO × 1 dose", note:""},
      {drug:"Ceftriaxone", dose:"250 mg IM × 1 dose", note:""},
    ],
    alternative:[
      {drug:"Ciprofloxacin", dose:"500 mg PO BID × 3 days", note:"Contraindicated in pregnancy"},
      {drug:"Erythromycin base", dose:"500 mg PO TID × 7 days", note:""},
    ],
    notes:"Rare in US (Haemophilus ducreyi). Co-test for HIV and syphilis. Fluctuant nodes may require aspiration, not incision. Re-examine at 3–7 days; if no improvement reconsider diagnosis or resistance."
  },

  // ── MPox ──
  {
    cat:"Mpox", name:"Mpox — Antiviral therapy",
    recommended:[
      {drug:"Tecovirimat (TPOXX)", dose:"600 mg PO BID × 14 days (weight ≥40 kg)", note:"For severe disease, immunocompromised, special anatomic sites. Available via CDC protocol."},
    ],
    alternative:[
      {drug:"Cidofovir or Brincidofovir", dose:"Specialist consultation required", note:"Alternative for severe refractory disease"},
    ],
    notes:"Most immunocompetent cases are self-limiting. Tecovirimat requires IND/CDC protocol access. Supportive care (wound care, pain management) is primary for mild cases. JYNNEOS vaccine PEP within 4 days of exposure."
  },

  // ── Prevention ──
  {
    cat:"Prevention", name:"Doxy-PEP (STI Post-Exposure Prophylaxis)",
    recommended:[
      {drug:"Doxycycline", dose:"200 mg PO once, as soon as possible and within 72 hours after oral, vaginal, or anal sex", note:"Max 200 mg per 24 hours. Take with water; remain upright for 30 minutes. Separate from dairy, antacids, iron, calcium, magnesium, or sodium bicarbonate by at least 2 hours."},
    ],
    alternative:[],
    notes:"CDC recommends counseling and offering doxy-PEP through shared decision-making to gay, bisexual, and other MSM and transgender women with syphilis, chlamydia, or gonorrhea diagnosed in the prior 12 months, regardless of HIV or PrEP status. Test at anatomic sites of exposure and for syphilis at baseline and every 3–6 months; reassess ongoing need every 3–6 months. Evidence is insufficient for CDC to recommend doxy-PEP in other populations. Discuss adverse effects, drug interactions, and antimicrobial-resistance uncertainty. Source: CDC Clinical Guidelines, 2024 (MMWR 73[RR-2]:1–8)."
  },
];

const CATEGORY_GROUPS = [
  { id:"", label:"All" },
  { id:"Chlamydia", label:"Chlamydia", cats:["Chlamydia"] },
  { id:"Gonorrhea", label:"Gonorrhea", cats:["Gonorrhea"] },
  { id:"Syphilis", label:"Syphilis", cats:["Syphilis"] },
  { id:"HSV", label:"HSV", cats:["Herpes (HSV)"] },
  { id:"Vaginitis", label:"Vaginitis", cats:["Trichomoniasis","Bacterial Vaginosis","Vulvovaginal Candidiasis"] },
  { id:"Upper tract", label:"PID & epididymitis", cats:["Pelvic Inflammatory Disease","Epididymitis"] },
  { id:"Other", label:"Other infections", cats:["Ectoparasites","Chancroid","Mpox"] },
  { id:"Prevention", label:"Prevention", cats:["Prevention"] },
];

const els = {
  search: document.getElementById("search"),
  catSelect: document.getElementById("cat-select"),
  categoryRail: document.getElementById("category-rail"),
  resultCount: document.getElementById("result-count"),
  filterSummary: document.getElementById("active-filter-summary"),
  clearFilters: document.getElementById("clear-filters"),
  printResults: document.getElementById("print-results"),
  root: document.getElementById("list-root"),
  treatmentPanel: document.getElementById("treatment-panel"),
  hivPanel: document.getElementById("hiv-panel"),
  modeTreatment: document.getElementById("mode-treatment"),
  modeHiv: document.getElementById("mode-hiv"),
};

let activeSearch = "";
let activeCat = "";
let activeMode = "treatment";
let openCard = "";
let currentItems = [];

function esc(value) {
  return String(value || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
}

function selectedCategory() {
  return CATEGORY_GROUPS.find(group => group.id === activeCat) || CATEGORY_GROUPS[0];
}

function sourceLabel(d) {
  if (d.name.includes("Doxy-PEP")) return "CDC 2024";
  if ((d.notes || "").includes("CDC updated Sep 2026")) return "CDC update 2026";
  return "CDC 2021 base";
}

function noteTone(notes) {
  return /SUPPLY ALERT|contraindicat|hospitalize|treatment failure|medical emergency/i.test(notes || "") ? " warning" : "";
}

function buildCopyText(d) {
  const lines = [d.name, ''];
  function section(regs, label) {
    if (!regs || regs.length === 0) return;
    lines.push(label + ':');
    regs.forEach(r => {
      lines.push('• ' + (r.dose ? r.drug + '  ' + r.dose : r.drug));
      if (r.note) lines.push('  ' + r.note);
    });
    lines.push('');
  }
  section(d.recommended, 'Recommended');
  section(d.alternative, 'Alternative');
  section(d.pregnancy, 'In Pregnancy');
  if (d.notes) lines.push('Notes: ' + d.notes, '');
  lines.push('Source: CDC STI Treatment Guidelines (noahpac.com/sti-guide/)');
  return lines.join('\n').trim();
}

function filterData() {
  let items = DATA;
  const category = selectedCategory();
  if (category.cats) items = items.filter(d => category.cats.includes(d.cat));
  if (activeSearch) {
    const q = activeSearch.toLowerCase();
    items = items.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.cat.toLowerCase().includes(q) ||
      [...(d.recommended||[]),...(d.alternative||[]),...(d.pregnancy||[])].some(r =>
        r.drug.toLowerCase().includes(q) || (r.note||"").toLowerCase().includes(q)
      ) ||
      (d.notes||"").toLowerCase().includes(q)
    );
  }
  return items;
}

function regRows(regs, label, cls) {
  if (!regs || regs.length === 0) return "";
  const lcls = cls ? ` ${cls}` : "";
  return `
    <div class="reg-section">
      <div class="reg-label${lcls}">${label}</div>
      ${regs.map(r => `
        <div class="reg-row${lcls}">
          <span class="reg-drug">${esc(r.drug)}</span>
          ${r.dose ? `<span class="reg-dose">${esc(r.dose)}</span>` : ""}
          ${r.note ? `<span class="reg-note">${esc(r.note)}</span>` : ""}
        </div>
      `).join("")}
    </div>`;
}

function updateUrl() {
  const params = new URLSearchParams();
  if (activeMode === "hiv") params.set("mode", "hiv");
  if (activeSearch) params.set("q", activeSearch);
  if (activeCat) params.set("cat", activeCat);
  if (openCard && !activeSearch) params.set("open", openCard);
  const next = `${location.pathname}${params.size ? `?${params}` : ""}`;
  history.replaceState(null, "", next);
}

function setMode(mode, update = true) {
  activeMode = mode === "hiv" ? "hiv" : "treatment";
  const treatmentActive = activeMode === "treatment";
  els.treatmentPanel.hidden = !treatmentActive;
  els.hivPanel.hidden = treatmentActive;
  els.modeTreatment.classList.toggle("active", treatmentActive);
  els.modeHiv.classList.toggle("active", !treatmentActive);
  els.modeTreatment.setAttribute("aria-selected", String(treatmentActive));
  els.modeHiv.setAttribute("aria-selected", String(!treatmentActive));
  els.modeTreatment.tabIndex = treatmentActive ? 0 : -1;
  els.modeHiv.tabIndex = treatmentActive ? -1 : 0;
  if (update) updateUrl();
}

function updateControls() {
  els.catSelect.value = activeCat;
  els.categoryRail.querySelectorAll("button").forEach(button => {
    const selected = button.dataset.category === activeCat;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  const filters = [];
  if (activeCat) filters.push(selectedCategory().label);
  if (activeSearch) filters.push(`Search: “${activeSearch}”`);
  els.resultCount.textContent = `${currentItems.length} ${currentItems.length === 1 ? "regimen" : "regimens"}`;
  els.filterSummary.textContent = filters.join(" · ");
  els.clearFilters.hidden = !filters.length;
}

function render() {
  currentItems = filterData();
  if (currentItems.length === 0) {
    updateControls();
    els.root.innerHTML = `<div class="empty">No regimens match the current search and category. <button class="secondary-action" type="button" data-clear>Clear filters</button></div>`;
    updateUrl();
    return;
  }

  els.root.innerHTML = currentItems.map((d, i) => {
    const id = slug(d.name);
    const expanded = Boolean(activeSearch) || openCard === id;
    const primary = d.recommended && d.recommended[0];
    return `
    <article class="guide-card" id="${id}">
      <div class="card-top">
        <button class="card-toggle" type="button" aria-expanded="${expanded}" aria-controls="${id}-body" data-card="${id}">
          <span>
            <span class="guide-cat">${esc(d.cat)}</span>
            <span class="guide-name">${esc(d.name)}</span>
            <span class="card-badges">
              ${d.pregnancy && d.pregnancy.length ? `<span class="card-badge preg">Pregnancy guidance</span>` : ""}
              <span class="card-badge source">${sourceLabel(d)}</span>
            </span>
          </span>
          ${primary ? `<span class="card-summary"><strong>${esc(primary.drug)}</strong><span>${esc(primary.dose)}</span></span>` : ""}
        </button>
        <button class="copy-btn" type="button" data-idx="${i}" aria-label="Copy ${esc(d.name)} regimen" title="Copy regimen">⧉</button>
      </div>
      <div class="card-body" id="${id}-body" ${expanded ? "" : "hidden"}>
        ${regRows(d.recommended, "Preferred regimen", "fl")}
        ${regRows(d.alternative, "Alternatives")}
        ${regRows(d.pregnancy, "Pregnancy", "preg")}
        ${d.notes ? `<div class="guide-notes${noteTone(d.notes)}"><span class="guide-notes__label">Follow-up, partners, and cautions</span>${esc(d.notes)}</div>` : ""}
      </div>
    </article>`;
  }).join("");
  updateControls();
  updateUrl();
}

els.catSelect.innerHTML = CATEGORY_GROUPS.map(group => `<option value="${esc(group.id)}">${esc(group.label)}</option>`).join("");
els.categoryRail.innerHTML = CATEGORY_GROUPS.map(group => `<button class="category-chip" type="button" data-category="${esc(group.id)}" aria-pressed="false">${esc(group.label)}</button>`).join("");

els.catSelect.addEventListener("change", () => {
  activeCat = els.catSelect.value;
  render();
});

els.categoryRail.addEventListener("click", event => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  activeCat = button.dataset.category;
  render();
});

els.search.addEventListener("input", e => {
  activeSearch = e.target.value;
  openCard = "";
  render();
});

els.clearFilters.addEventListener("click", () => {
  activeSearch = "";
  activeCat = "";
  openCard = "";
  els.search.value = "";
  render();
  els.search.focus();
});

els.printResults.addEventListener("click", () => window.print());
els.modeTreatment.addEventListener("click", () => setMode("treatment"));
els.modeHiv.addEventListener("click", () => setMode("hiv"));

document.querySelector(".guide-mode").addEventListener("keydown", event => {
  if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
  event.preventDefault();
  const next = event.key === "Home" || event.key === "ArrowLeft" ? els.modeTreatment : els.modeHiv;
  next.click();
  next.focus();
});

els.root.addEventListener("click", e => {
  const clear = e.target.closest("[data-clear]");
  if (clear) {
    els.clearFilters.click();
    return;
  }
  const toggle = e.target.closest(".card-toggle");
  if (toggle) {
    const body = document.getElementById(toggle.getAttribute("aria-controls"));
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    body.hidden = expanded;
    openCard = expanded ? "" : toggle.dataset.card;
    updateUrl();
    return;
  }
  const btn = e.target.closest(".copy-btn");
  if (!btn) return;
  const d = currentItems[parseInt(btn.dataset.idx, 10)];
  navigator.clipboard.writeText(buildCopyText(d)).then(() => {
    btn.textContent = "✓";
    btn.classList.add("copied");
    setTimeout(() => { btn.textContent = "⧉"; btn.classList.remove("copied"); }, 1500);
  }).catch(() => {
    btn.textContent = "!";
    setTimeout(() => { btn.textContent = "⧉"; }, 1500);
  });
});

const initial = new URLSearchParams(location.search);
activeSearch = initial.get("q") || "";
activeCat = CATEGORY_GROUPS.some(group => group.id === initial.get("cat")) ? initial.get("cat") : "";
openCard = initial.get("open") || "";
els.search.value = activeSearch;
setMode(initial.get("mode") === "hiv" ? "hiv" : "treatment", false);
render();
