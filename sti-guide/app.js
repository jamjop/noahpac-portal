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
    notes:"Jarisch-Herxheimer reaction common in first 24h — fever, chills, myalgia. Treat partners exposed within 90 days. Follow-up RPR at 6 and 12 months."
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
    notes:"CSF exam recommended if neurological symptoms, treatment failure, or HIV with late syphilis."
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
];

const CATS = [...new Set(DATA.map(d => d.cat))];
let activeSearch = "";
let activeCat = null;

function filterData() {
  let items = DATA;
  if (activeCat) items = items.filter(d => d.cat === activeCat);
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

function regRows(regs, label) {
  if (!regs || regs.length === 0) return "";
  return `
    <div class="reg-section">
      <div class="reg-label">${label}</div>
      ${regs.map(r => `
        <div class="reg-row">
          <span class="reg-drug">${r.drug}</span>
          ${r.dose ? `<span class="reg-dose">${r.dose}</span>` : ""}
          ${r.note ? `<span class="reg-note">${r.note}</span>` : ""}
        </div>
      `).join("")}
    </div>`;
}

function render() {
  const items = filterData();
  const root  = document.getElementById("list-root");

  // Update cat tabs
  document.querySelectorAll(".cat-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.cat === (activeCat||""));
  });

  if (items.length === 0) {
    root.innerHTML = `<div class="empty">No results for "${activeSearch}"</div>`;
    return;
  }

  root.innerHTML = items.map(d => `
    <div class="guide-card">
      <div class="guide-cat">${d.cat}</div>
      <div class="guide-name">${d.name}</div>
      ${regRows(d.recommended, "Recommended")}
      ${regRows(d.alternative, "Alternative")}
      ${regRows(d.pregnancy,   "In Pregnancy")}
      ${d.notes ? `<div class="guide-notes">${d.notes}</div>` : ""}
    </div>
  `).join("");
}

// Build category tabs
const tabEl = document.getElementById("cat-tabs");
tabEl.innerHTML = `<button class="cat-tab active" data-cat="">All</button>` +
  CATS.map(c => `<button class="cat-tab" data-cat="${c}">${c}</button>`).join("");
tabEl.querySelectorAll(".cat-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    activeCat = btn.dataset.cat || null;
    render();
  });
});

document.getElementById("search").addEventListener("input", e => {
  activeSearch = e.target.value;
  render();
});

render();
