// ── Tab switching ──────────────────────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".tab-panel").forEach(p => { p.hidden = true; });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    document.getElementById("panel-" + btn.dataset.tab).hidden = false;
  });
});

// ── Tetanus ──────────────────────────────────────────────────────────────────
let woundType = "clean";
let vaxStatus  = "unknown";

document.querySelectorAll("#wound-grid .seg-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#wound-grid .seg-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    woundType = btn.dataset.wound;
    render();
  });
});
document.querySelectorAll("#vax-grid .seg-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#vax-grid .seg-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    vaxStatus = btn.dataset.vax;
    render();
  });
});

function rec() {
  const prone = woundType === "prone";
  switch (vaxStatus) {
    case "unknown":
      return {
        vaccine: true, tig: prone,
        text: prone
          ? "Administer <strong>Tdap or Td</strong> + <strong>TIG 250 units IM</strong> (separate sites). Tdap preferred if patient has never received it."
          : "Administer <strong>Tdap or Td</strong>. Tdap preferred if patient has never received it. No TIG needed for clean minor wounds."
      };
    case "recent":
      return {
        vaccine: false, tig: false,
        text: "No tetanus prophylaxis needed. Last booster &lt;5 years ago — adequate protection for all wound types."
      };
    case "mid":
      return {
        vaccine: prone, tig: false,
        text: prone
          ? "Administer <strong>Tdap or Td</strong> booster. Last dose 5–10 years ago; tetanus-prone wound warrants a booster. No TIG needed."
          : "No tetanus prophylaxis needed. Last booster &lt;10 years ago — adequate for clean minor wounds."
      };
    case "old":
      return {
        vaccine: true, tig: false,
        text: "Administer <strong>Tdap or Td</strong> booster. Last dose &gt;10 years ago — booster indicated for all wound types. Tdap preferred if never received. No TIG needed."
      };
  }
}

function render() {
  const r = rec();
  const prone = woundType === "prone";

  let pills = "";
  if (r.vaccine) pills += `<span class="pill pill-warn">Tdap / Td</span>`;
  if (r.tig)     pills += `<span class="pill pill-crit">TIG 250 units IM</span>`;
  if (!r.vaccine && !r.tig) pills = `<span class="pill pill-ok">No prophylaxis needed</span>`;

  document.getElementById("rec-output").innerHTML = `
    <div class="rec-pills">${pills}</div>
    <p class="rec-text">${r.text}</p>
    <div class="rec-context">
      <span class="ctx-tag">${prone ? "Tetanus-prone wound" : "Clean / minor wound"}</span>
      <span class="ctx-tag">${{unknown:"Unknown / &lt;3 doses",recent:"≥3 doses, last &lt;5 yrs",mid:"≥3 doses, last 5–10 yrs",old:"≥3 doses, last &gt;10 yrs"}[vaxStatus]}</span>
    </div>
  `;
}

render();

// ── Closure ──────────────────────────────────────────────────────────────────
let closureContam = "clean";

document.querySelectorAll("#contam-grid .seg-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#contam-grid .seg-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    closureContam = btn.dataset.contam;
    renderClosure();
  });
});

function closureRec() {
  switch (closureContam) {
    case "clean":
      return {
        approach: "Primary closure",
        level: "ok",
        text: "Close immediately after thorough irrigation. Repair within 6–12h (up to 24h for facial wounds). Sutures, staples, or tissue adhesive as appropriate for location and depth.",
        steps: [
          "Irrigate copiously with normal saline or tap water via high-pressure syringe",
          "Debride any devitalized tissue or embedded debris",
          "Close in layers: absorbable deep sutures (Vicryl), then skin",
          "Dress wound; assess tetanus status (see Tetanus tab)",
        ],
      };
    case "contaminated":
      return {
        approach: "Delayed primary closure",
        level: "warn",
        text: "Irrigate thoroughly, pack open loosely with moist gauze. Re-evaluate at 3–5 days — close primarily if no infection signs develop. Exception: facial wounds may close primarily despite contamination due to excellent vascularity and cosmetic importance.",
        steps: [
          "Irrigate copiously; remove all debris and foreign material",
          "Debride devitalized tissue",
          "Pack open with moist saline gauze — do not approximate skin edges",
          "Antibiotic prophylaxis per Bites tab if bite wound",
          "Return at 3–5 days; close if wound is clean and granulating",
        ],
      };
    case "infected":
      return {
        approach: "Secondary intention",
        level: "crit",
        text: "Do not close. Irrigate, debride, and pack open. Allow to granulate or arrange surgical wound management. Surgical consult for deep-space involvement, tendon, joint, or bone exposure.",
        steps: [
          "Irrigate and debride — remove all necrotic tissue and foreign material",
          "Pack open; do not approximate wound edges",
          "Systemic antibiotics based on clinical severity and likely pathogens",
          "Surgical consult for deep space, tendon, joint, or bone involvement",
          "Daily wound checks until infection controlled and granulation established",
        ],
      };
  }
}

function renderClosure() {
  const r = closureRec();
  const levelClass = { ok: "pill-ok", warn: "pill-warn", crit: "pill-crit" }[r.level];
  const steps = r.steps.map(s => `<li>${s}</li>`).join("");
  document.getElementById("closure-output").innerHTML = `
    <div class="rec-pills"><span class="pill ${levelClass}">${r.approach}</span></div>
    <p class="rec-text">${r.text}</p>
    <ol class="rec-steps">${steps}</ol>
  `;
}

renderClosure();

// ── Bites ────────────────────────────────────────────────────────────────────
let biteAnimal = "domestic-obs";

document.querySelectorAll("#animal-grid .seg-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#animal-grid .seg-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    biteAnimal = btn.dataset.animal;
    renderBite();
  });
});

function biteRec() {
  switch (biteAnimal) {
    case "domestic-obs":
      return {
        pep: "Observe — PEP not indicated now",
        level: "ok",
        text: "Observe animal for 10 days. Begin PEP only if the animal develops signs of rabies during observation. Applicable to dogs, cats, and ferrets when the animal is healthy and available.",
      };
    case "domestic-unavail":
      return {
        pep: "Consult public health — PEP likely indicated",
        level: "warn",
        text: "Contact local/state public health immediately. PEP is generally indicated when the biting animal is unavailable for observation, ill, or died. Decision based on animal vaccination status, local epidemiology, and circumstances of exposure.",
      };
    case "wild-stray":
      return {
        pep: "Consult public health — PEP typically indicated",
        level: "warn",
        text: "Contact public health. PEP is typically recommended for stray or unvaccinated dogs and cats unless the animal is captured and tests negative. Do not delay — initiate PEP if in doubt pending public health guidance.",
      };
    case "bat":
      return {
        pep: "PEP indicated",
        level: "crit",
        text: "Bat exposures carry high rabies risk even without a visible bite mark. PEP is indicated for any bite or scratch, mucous membrane contact, or if a bat is found in the room of a sleeping person, unattended child, or person who is intoxicated or cognitively impaired. Contact public health immediately.",
      };
    case "wildlife-high":
      return {
        pep: "PEP indicated",
        level: "crit",
        text: "Raccoons, skunks, foxes, coyotes, and wolves are primary rabies reservoir species in the US. PEP (HRIG + vaccine series) is indicated unless the animal is captured and laboratory testing is negative. Contact public health immediately.",
      };
    case "wildlife-low":
      return {
        pep: "PEP not routinely indicated",
        level: "ok",
        text: "Livestock, rabbits, squirrels, rats, mice, hamsters, and other small rodents are rarely infected with rabies and are not considered significant exposure risks in the US. Consult public health if the animal's behavior was unusual or if in a high-endemicity area.",
      };
    case "human":
      return {
        pep: "No rabies risk from human bites",
        level: "ok",
        text: "Human-to-human rabies transmission via bites is not documented. Rabies PEP is not indicated. Prioritize wound management, tetanus prophylaxis (see Tetanus tab), and antibiotic prophylaxis per the reference card below.",
      };
  }
}

function renderBite() {
  const r = biteRec();
  const levelClass = { ok: "pill-ok", warn: "pill-warn", crit: "pill-crit" }[r.level];
  document.getElementById("bite-output").innerHTML = `
    <div class="rec-pills"><span class="pill ${levelClass}">${r.pep}</span></div>
    <p class="rec-text">${r.text}</p>
  `;
}

renderBite();
