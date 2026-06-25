const CONDITIONS = [
  // Infectious — Immediate (highlighted red in original)
  { name:"Anthrax",                        cat:"Infectious",    timing:"Immediate",       note:"Select Agent when confirmed. Notify HHS Lab: 701-328-6272" },
  { name:"Botulism",                       cat:"Infectious",    timing:"Immediate",       note:"Send isolate/sample to ND HHS Lab" },
  { name:"Brucellosis",                    cat:"Infectious",    timing:"Immediate",       note:"Send isolate/sample to ND HHS Lab" },
  { name:"Cholera",                        cat:"Infectious",    timing:"Immediate",       note:"Send isolate/sample to ND HHS Lab" },
  { name:"Cluster of severe / unexplained illnesses and deaths", cat:"Infectious", timing:"Immediate", note:"" },
  { name:"Diphtheria",                     cat:"Infectious",    timing:"Immediate",       note:"Send isolate/sample to ND HHS Lab" },
  { name:"E. coli (Shiga toxin-producing)",cat:"Infectious",    timing:"Immediate",       note:"Send isolate/sample to ND HHS Lab" },
  { name:"Glanders",                       cat:"Infectious",    timing:"Immediate",       note:"Select Agent. Notify HHS Lab: 701-328-6272" },
  { name:"Hantavirus",                     cat:"Infectious",    timing:"Immediate",       note:"" },
  { name:"Laboratory incident — possible release of Category A agent or novel influenza", cat:"Infectious", timing:"Immediate", note:"" },
  { name:"Listeriosis",                    cat:"Infectious",    timing:"Immediate",       note:"Send isolate/sample to ND HHS Lab" },
  { name:"Measles (rubeola)",              cat:"Infectious",    timing:"Immediate",       note:"" },
  { name:"Melioidosis",                    cat:"Infectious",    timing:"Immediate",       note:"Select Agent. Notify HHS Lab: 701-328-6272" },
  { name:"Meningococcal disease (invasive)",cat:"Infectious",   timing:"Immediate",       note:"Send isolate/sample to ND HHS Lab" },
  { name:"Mpox",                           cat:"Infectious",    timing:"Immediate",       note:"" },
  { name:"Nipah virus infections",         cat:"Infectious",    timing:"Immediate",       note:"" },
  { name:"Novel severe acute illness",     cat:"Infectious",    timing:"Immediate",       note:"" },
  { name:"Plague",                         cat:"Infectious",    timing:"Immediate",       note:"Select Agent. Notify HHS Lab: 701-328-6272" },
  { name:"Poliomyelitis",                  cat:"Infectious",    timing:"Immediate",       note:"" },
  { name:"Rabies (human and animal — all results)", cat:"Infectious", timing:"Immediate", note:"" },
  { name:"Rubella",                        cat:"Infectious",    timing:"Immediate",       note:"" },
  { name:"Smallpox",                       cat:"Infectious",    timing:"Immediate",       note:"Select Agent. Notify HHS Lab: 701-328-6272" },
  { name:"Staphylococcus enterotoxin B intoxication", cat:"Infectious", timing:"Immediate", note:"" },
  { name:"Tetanus",                        cat:"Infectious",    timing:"Immediate",       note:"" },
  { name:"Tularemia",                      cat:"Infectious",    timing:"Immediate",       note:"Select Agent. Notify HHS Lab: 701-328-6272" },
  { name:"Typhoid fever",                  cat:"Infectious",    timing:"Immediate",       note:"Send isolate/sample to ND HHS Lab" },
  { name:"Unexplained or emerging critical illness/death", cat:"Infectious", timing:"Immediate", note:"" },
  { name:"Viral hemorrhagic fevers",       cat:"Infectious",    timing:"Immediate",       note:"" },
  { name:"Weapons of Mass Destruction — suspected event", cat:"Infectious", timing:"Immediate", note:"" },
  { name:"Yellow fever",                   cat:"Infectious",    timing:"Immediate",       note:"" },

  // Infectious — 1 business day
  { name:"Acute Flaccid Myelitis",         cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Alpha-gal Syndrome",             cat:"Infectious",    timing:"1 business day",  note:"Added 2024" },
  { name:"Anaplasmosis",                   cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Arboviral infection (other)",    cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Babesiosis",                     cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Campylobacteriosis",             cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Candida auris",                  cat:"Infectious",    timing:"1 business day",  note:"Send isolate to ND HHS Lab" },
  { name:"Carbapenem-resistant Enterobacterales (CRE)", cat:"Infectious", timing:"1 business day", note:"" },
  { name:"Carbapenem-resistant Pseudomonas aeruginosa", cat:"Infectious", timing:"1 business day", note:"" },
  { name:"Carbapenem-resistant Acinetobacter baumannii", cat:"Infectious", timing:"1 business day", note:"" },
  { name:"Chickenpox (varicella)",         cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Chikungunya virus disease",      cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Chlamydial infection",           cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Coccidioidomycosis",             cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Creutzfeldt-Jakob disease",      cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Cryptosporidiosis",              cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Cyclosporiasis",                 cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Dengue",                         cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Eastern equine encephalitis",    cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Ehrlichiosis",                   cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Foodborne / waterborne outbreak",cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Giardiasis",                     cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Gonorrhea",                      cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Haemophilus influenzae (invasive)",cat:"Infectious",  timing:"1 business day",  note:"Send isolate to ND HHS Lab" },
  { name:"Hemolytic uremic syndrome",      cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Hepatitis A",                    cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Hepatitis B",                    cat:"Infectious",    timing:"1 business day",  note:"All positive/reactive results; all nucleic acid test results including nondetectable" },
  { name:"Hepatitis C",                    cat:"Infectious",    timing:"1 business day",  note:"All positive/reactive results, genotypes, all NAT results including nondetectable" },
  { name:"Hepatitis D",                    cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Hepatitis E",                    cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"HIV / AIDS",                     cat:"Infectious",    timing:"1 business day",  note:"Any positive/reactive results; gene sequencing; all NAT + CD4 results including nondetectable" },
  { name:"Influenza — pediatric deaths",   cat:"Infectious",    timing:"1 business day",  note:"Electronic lab report only" },
  { name:"Influenza — suspect novel (PCR unsubtypable)", cat:"Infectious", timing:"1 business day", note:"Electronic lab report only" },
  { name:"Jamestown Canyon virus disease", cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"La Crosse encephalitis",         cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Legionellosis",                  cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Leptospirosis",                  cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Lyme disease",                   cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Malaria",                        cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Mumps",                          cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Nosocomial / healthcare-associated outbreak", cat:"Infectious", timing:"1 business day", note:"" },
  { name:"Pan-resistant organisms",        cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Pertussis",                      cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Powassan virus disease",         cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Pregnancy — person with Hepatitis B", cat:"Infectious", timing:"1 business day", note:"" },
  { name:"Pregnancy — person with Hepatitis C", cat:"Infectious", timing:"1 business day", note:"" },
  { name:"Pregnancy — person with HIV",    cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Pregnancy — person with Syphilis",cat:"Infectious",   timing:"1 business day",  note:"" },
  { name:"Q fever",                        cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Respiratory Panel Results",      cat:"Infectious",    timing:"1 business day",  note:"Electronic lab report only" },
  { name:"Respiratory Syncytial Virus — pediatric deaths", cat:"Infectious", timing:"1 business day", note:"Electronic lab report only" },
  { name:"Rocky Mountain spotted fever",   cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Salmonellosis",                  cat:"Infectious",    timing:"1 business day",  note:"Send isolate to ND HHS Lab" },
  { name:"SARS-CoV-2",                     cat:"Infectious",    timing:"1 business day",  note:"Electronic lab report only; report pediatric deaths" },
  { name:"Scabies outbreaks in institutions", cat:"Infectious", timing:"1 business day",  note:"" },
  { name:"Shigellosis",                    cat:"Infectious",    timing:"1 business day",  note:"Send isolate to ND HHS Lab" },
  { name:"St. Louis encephalitis",         cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Streptococcus pneumoniae — invasive", cat:"Infectious", timing:"1 business day", note:"Send isolate to ND HHS Lab" },
  { name:"Syphilis",                       cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Tickborne disease (other)",      cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Trichinosis",                    cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Tuberculosis — disease",         cat:"Infectious",    timing:"1 business day",  note:"All AFB smear, culture, rapid methodology results when M. tb complex suspected" },
  { name:"Tuberculosis — infection (positive PPD or IGRA)", cat:"Infectious", timing:"1 business day", note:"" },
  { name:"Vancomycin-resistant S. aureus (VRSA/VISA)", cat:"Infectious", timing:"1 business day", note:"Any site. Send isolate to ND HHS Lab" },
  { name:"Vibriosis",                      cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Western equine encephalitis",    cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"West Nile virus",                cat:"Infectious",    timing:"1 business day",  note:"" },
  { name:"Zika virus",                     cat:"Infectious",    timing:"1 business day",  note:"" },

  // Other mandatory reportable — 7 days
  { name:"Autism spectrum disorder",       cat:"Other",         timing:"7 days",          note:"Submit via autism report form: hhs.nd.gov/autism-spectrum-disorder-asd-database" },
  { name:"Cancer",                         cat:"Other",         timing:"7 days",          note:"Submit to ND Cancer Registry: 800-280-5512" },
  { name:"Cluster of severe / unexplained illnesses or deaths", cat:"Other", timing:"7 days", note:"" },
  { name:"Critical congenital heart disease (CCHD)", cat:"Other", timing:"7 days",        note:"" },
  { name:"Fetal alcohol syndrome (FAS)",   cat:"Other",         timing:"7 days",          note:"" },
  { name:"Lead level results (all)",       cat:"Other",         timing:"7 days",          note:"" },
  { name:"Neonatal abstinence syndrome (NAS)", cat:"Other",     timing:"7 days",          note:"" },
  { name:"Overdoses",                      cat:"Other",         timing:"7 days",          note:"" },
  { name:"Suicide and suicide attempts",   cat:"Other",         timing:"7 days",          note:"" },
  { name:"Tumors of the central nervous system", cat:"Other",  timing:"7 days",          note:"Submit to ND Cancer Registry: 800-280-5512" },
  { name:"Violent deaths",                 cat:"Other",         timing:"7 days",          note:"Homicides, legal intervention, unintentional firearm deaths, deaths of unknown intent, terrorism" },
  { name:"Visible congenital deformity",   cat:"Other",         timing:"7 days",          note:"NDCC 23-41-04 and 23-41-05" },
];

const TIMING_ORDER = ["Immediate","1 business day","7 days"];
const TIMING_CLS   = {"Immediate":"t-immediate","1 business day":"t-day","7 days":"t-week"};

function render(query) {
  const q = (query||"").toLowerCase().trim();
  const filtered = q ? CONDITIONS.filter(c =>
    c.name.toLowerCase().includes(q) || c.note.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q)
  ) : CONDITIONS;

  const grouped = {};
  filtered.forEach(c => {
    const key = c.cat + "||" + c.timing;
    if (!grouped[key]) grouped[key] = {cat:c.cat, timing:c.timing, items:[]};
    grouped[key].items.push(c);
  });

  const root = document.getElementById("list-root");
  if (filtered.length === 0) {
    root.innerHTML = `<div class="empty">No conditions match "${query}"</div>`;
    return;
  }

  const orderedKeys = Object.keys(grouped).sort((a,b) => {
    const [ac,at] = a.split("||");
    const [bc,bt] = b.split("||");
    if (ac !== bc) return ac === "Infectious" ? -1 : 1;
    return TIMING_ORDER.indexOf(at) - TIMING_ORDER.indexOf(bt);
  });

  root.innerHTML = orderedKeys.map(key => {
    const g = grouped[key];
    const cls = TIMING_CLS[g.timing] || "";
    return `
      <div class="group">
        <div class="group-head">
          <span class="group-cat">${g.cat}</span>
          <span class="timing-badge ${cls}">${g.timing}</span>
          <span class="group-count">${g.items.length}</span>
        </div>
        <div class="cond-list">
          ${g.items.map(c => `
            <div class="cond-item">
              <span class="cond-name">${c.name}</span>
              ${c.note ? `<span class="cond-note">${c.note}</span>` : ""}
            </div>
          `).join("")}
        </div>
      </div>`;
  }).join("");
}

document.getElementById("search").addEventListener("input", e => render(e.target.value));
render();
