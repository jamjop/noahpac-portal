// Side-chain similarity groups (shared R1 = higher cross-reactivity risk)
const AMINOBENZYL = ["ampicillin","amoxicillin","cefadroxil","cephalexin","cefprozil","cefaclor"];
const CEFTAZ_AZT  = ["ceftazidime","aztreonam"]; // identical R1 chain

const DRUGS = {
  penicillins: {
    label:"Penicillins",
    items:["Penicillin G / V","Ampicillin","Amoxicillin","Amoxicillin-Clavulanate","Nafcillin","Oxacillin","Dicloxacillin","Piperacillin","Piperacillin-Tazobactam"]
  },
  cephalosporins: {
    label:"Cephalosporins",
    items:["Cephalexin","Cefadroxil","Cefazolin","Cefuroxime","Cefprozil","Cefaclor","Ceftriaxone","Cefotaxime","Ceftazidime","Cefepime","Ceftaroline","Cefdinir"]
  },
  carbapenems: {
    label:"Carbapenems",
    items:["Meropenem","Ertapenem","Imipenem","Doripenem"]
  },
  monobactams: {
    label:"Monobactams",
    items:["Aztreonam"]
  },
  other: {
    label:"Other",
    items:["TMP-SMX","Clindamycin","Metronidazole","Vancomycin","Daptomycin","Linezolid","Fluoroquinolones","Macrolides","Tetracyclines","Aminoglycosides"]
  }
};

const ALL_DRUGS = Object.values(DRUGS).flatMap(g => g.items);

const ALLERGY_DRUGS = [
  "Penicillin G / V","Ampicillin","Amoxicillin","Amoxicillin-Clavulanate",
  "Nafcillin","Piperacillin","Piperacillin-Tazobactam",
  "Cephalexin","Cefadroxil","Cefazolin","Ceftriaxone","Ceftazidime","Cefepime",
  "Meropenem","Aztreonam","TMP-SMX","Clindamycin","Fluoroquinolones","Vancomycin"
];

let selectedAllergy  = "Penicillin G / V";
let selectedProposed = "Ceftriaxone";

function normalise(s){ return s.toLowerCase().replace(/[^a-z]/g,""); }

function getClass(drug) {
  for (const [cls, g] of Object.entries(DRUGS)) {
    if (g.items.includes(drug)) return cls;
  }
  return "other";
}

function isSameAminobenzyl(a,b) {
  return AMINOBENZYL.some(x => normalise(a).includes(normalise(x))) &&
         AMINOBENZYL.some(x => normalise(b).includes(normalise(x)));
}
function isCeftazAzt(a,b) {
  const norm = s => CEFTAZ_AZT.some(x => normalise(s).includes(x));
  return norm(a) && norm(b);
}

function assess(allergy, proposed) {
  if (allergy === proposed) return {level:"same", msg:"Same drug — avoid."};

  const aC = getClass(allergy);
  const pC = getClass(proposed);

  // Identical R1 chain: ceftazidime ↔ aztreonam
  if (isCeftazAzt(allergy, proposed)) {
    return {
      level:"high",
      msg:`<strong>High cross-reactivity risk.</strong> Ceftazidime and aztreonam share an identical R1 side chain. Treat as contraindicated in IgE-mediated ceftazidime allergy. Use an alternative agent.`
    };
  }

  // Aminobenzyl R1 group
  if (isSameAminobenzyl(allergy, proposed)) {
    return {
      level:"mod",
      msg:`<strong>Moderate cross-reactivity risk.</strong> Both share the aminobenzyl R1 side chain (ampicillin/amoxicillin group ↔ cefadroxil/cephalexin/cefprozil/cefaclor). For severe IgE-mediated reactions, use an agent with a different R1 chain or consult allergy. For mild/non-IgE reactions risk is low.`
    };
  }

  // Penicillin → cephalosporin (general)
  if (aC==="penicillins" && pC==="cephalosporins") {
    return {
      level:"low",
      msg:`<strong>Low cross-reactivity (~2%).</strong> Penicillin allergy does not predict cephalosporin allergy unless shared R1 side chains are present. For non-severe, non-IgE reactions (rash), ${proposed} can typically be used. For anaphylaxis to penicillin, consider allergy consultation or graded challenge. Avoid if aminobenzyl side chain involved.`
    };
  }

  // Penicillin → carbapenem
  if (aC==="penicillins" && pC==="carbapenems") {
    return {
      level:"low",
      msg:`<strong>Very low cross-reactivity (&lt;1%).</strong> Carbapenems share the beta-lactam ring but have distinct side chains. Cross-reactivity with penicillin allergy is not clinically significant for most reaction types. ${proposed} can generally be used; use caution with history of severe anaphylaxis and consider allergy evaluation.`
    };
  }

  // Penicillin → aztreonam
  if (aC==="penicillins" && pC==="monobactams") {
    return {
      level:"low",
      msg:`<strong>Very low cross-reactivity (&lt;1%).</strong> Aztreonam is a monobactam with a distinct side chain from penicillins. Cross-reactivity is not clinically significant. Exception: aztreonam shares an R1 chain with ceftazidime — if ceftazidime allergy is the concern, see ceftazidime/aztreonam pairing.`
    };
  }

  // Cephalosporin → carbapenem
  if (aC==="cephalosporins" && pC==="carbapenems") {
    return {
      level:"low",
      msg:`<strong>Very low cross-reactivity (&lt;1%).</strong> No shared R1 side chains between cephalosporins and carbapenems. ${proposed} can generally be used safely in patients with cephalosporin allergy.`
    };
  }

  // Same class (excluding already handled)
  if (aC === pC) {
    return {
      level:"mod",
      msg:`<strong>Same antibiotic class — evaluate side-chain similarity.</strong> Cross-reactivity within the ${aC} class is driven by shared R1 side chains, not the beta-lactam ring. Check whether ${allergy} and ${proposed} share structural similarity. If side chains differ, risk is low (&lt;2%).`
    };
  }

  // Different class, no known cross-reactivity
  return {
    level:"ok",
    msg:`<strong>No significant cross-reactivity expected.</strong> ${allergy} (${aC}) and ${proposed} (${pC}) are structurally distinct drug classes with no established cross-reactive epitopes. ${proposed} can typically be used in patients with ${allergy} allergy.`
  };
}

function renderSegs() {
  const aEl = document.getElementById("seg-allergy");
  const pEl = document.getElementById("seg-proposed");

  aEl.innerHTML = ALLERGY_DRUGS.map(d =>
    `<button class="seg-btn${d===selectedAllergy?" active":""}" data-drug="${d}">${d}</button>`
  ).join("");
  pEl.innerHTML = ALL_DRUGS.map(d =>
    `<button class="seg-btn${d===selectedProposed?" active":""}" data-drug="${d}">${d}</button>`
  ).join("");

  aEl.querySelectorAll(".seg-btn").forEach(btn => btn.addEventListener("click", () => {
    selectedAllergy = btn.dataset.drug;
    renderSegs(); renderResult();
  }));
  pEl.querySelectorAll(".seg-btn").forEach(btn => btn.addEventListener("click", () => {
    selectedProposed = btn.dataset.drug;
    renderSegs(); renderResult();
  }));
}

function renderResult() {
  const r = assess(selectedAllergy, selectedProposed);
  const cls = {same:"res-crit",high:"res-crit",mod:"res-warn",low:"res-ok",ok:"res-ok"}[r.level];
  document.getElementById("result-area").innerHTML = `
    <div class="result-card ${cls}">
      <div class="result-pair">${selectedAllergy} → ${selectedProposed}</div>
      <div class="result-msg">${r.msg}</div>
    </div>`;
}

renderSegs();
renderResult();
