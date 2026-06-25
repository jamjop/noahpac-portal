'use strict';

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

const CATS = [
  {id:'resp',   label:'Respiratory'},
  {id:'uti',    label:'Urinary Tract'},
  {id:'ssti',   label:'Skin & Soft Tissue'},
  {id:'gi',     label:'GI / Abdominal'},
  {id:'tick',   label:'Tick-borne'},
  {id:'severe', label:'Severe / Empiric'},
];

const ABX = [

  // ── RESPIRATORY ──────────────────────────────────────────────────────────────
  {
    id:'pharyngitis', cat:'resp',
    name:'Pharyngitis (GAS)', organism:'Group A Streptococcus (S. pyogenes)',
    source:'IDSA 2012',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Amoxicillin', dose:'500 mg PO BID × 10 days  or  1 g PO once daily × 10 days'},
        {name:'Penicillin V', dose:'500 mg PO BID × 10 days  or  250 mg PO QID × 10 days'},
      ]},
      {label:'PCN allergy — mild (no anaphylaxis)', drugs:[
        {name:'Cephalexin', dose:'500 mg PO BID × 10 days', note:'1st-gen cephalosporin; safe if no PCN anaphylaxis/urticaria'},
      ]},
      {label:'PCN allergy — anaphylaxis/urticaria', cls:'allergy', drugs:[
        {name:'Azithromycin', dose:'500 mg PO day 1, then 250 mg days 2–5', note:'~10% resistance; use only if susceptibility confirmed or alternatives unavailable'},
        {name:'Clindamycin', dose:'300 mg PO TID × 10 days'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Amoxicillin', dose:'500 mg PO BID × 10 days', note:'Safe in all trimesters'},
        {name:'Cephalexin', dose:'500 mg PO BID × 10 days'},
      ]},
    ],
    notes:'Treat only confirmed GAS (positive rapid strep or throat culture). Use Centor/McIsaac score to guide testing — do NOT treat viral pharyngitis. Routine test of cure not needed. Expedited partner therapy not applicable.',
  },
  {
    id:'otitis', cat:'resp',
    name:'Acute Otitis Media', organism:'S. pneumoniae, H. influenzae, M. catarrhalis',
    source:'AAP 2013 (reaffirmed 2019)',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Amoxicillin', dose:'80–90 mg/kg/day PO divided BID × 5–10 days (max 3 g/day)', note:'High-dose preferred to cover PCN-resistant S. pneumoniae'},
      ]},
      {label:'Treatment failure / recent antibiotics', drugs:[
        {name:'Amoxicillin-clavulanate', dose:'90 mg/kg/day (amox component) PO divided BID × 10 days', note:'If no improvement in 48–72h on amoxicillin, or antibiotics within 30 days'},
      ]},
      {label:'PCN allergy — anaphylaxis', cls:'allergy', drugs:[
        {name:'Azithromycin', dose:'10 mg/kg PO day 1, then 5 mg/kg days 2–5', note:'High resistance rates; reserve for true PCN anaphylaxis'},
        {name:'Clindamycin', dose:'30–40 mg/kg/day PO divided TID × 10 days', note:'Covers gram-positive only; not H. influenzae'},
      ]},
    ],
    notes:'Observation without antibiotics is appropriate for children ≥2 years with mild-moderate unilateral AOM (nonsevere symptoms, no otorrhea). Treat immediately: age <2, bilateral AOM, otorrhea, or severe symptoms (high fever, severe otalgia). Duration: 10 days for age <2 or severe; 5–7 days for age ≥6 years with mild-moderate disease.',
  },
  {
    id:'sinusitis', cat:'resp',
    name:'Acute Bacterial Rhinosinusitis', organism:'S. pneumoniae, H. influenzae, M. catarrhalis',
    source:'IDSA 2012',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Amoxicillin-clavulanate', dose:'500/125 mg PO TID × 5–7 days  or  875/125 mg PO BID × 5–7 days', note:'Preferred per IDSA 2012 over amoxicillin alone (better H. influenzae / M. catarrhalis coverage)'},
      ]},
      {label:'PCN allergy — non-severe', drugs:[
        {name:'Doxycycline', dose:'100 mg PO BID × 5–7 days', note:'Adults only; avoid in pregnancy and children <8 years'},
        {name:'Levofloxacin', dose:'500 mg PO once daily × 5–7 days'},
        {name:'Moxifloxacin', dose:'400 mg PO once daily × 5–7 days'},
      ]},
      {label:'PCN allergy — anaphylaxis', cls:'allergy', drugs:[
        {name:'Levofloxacin', dose:'500 mg PO once daily × 5–7 days'},
        {name:'Doxycycline', dose:'100 mg PO BID × 5–7 days', note:'Adults only'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Amoxicillin-clavulanate', dose:'875/125 mg PO BID × 5–7 days', note:'Avoid fluoroquinolones and doxycycline'},
      ]},
    ],
    notes:'Treat only confirmed ABRS — NOT viral URI. ABRS criteria: symptoms ≥10 days without improvement, OR severe symptoms ≥3–4 days (high fever, purulent discharge, facial pain), OR "double-sickening" (initial improvement then worsening). Most rhinosinusitis is viral and resolves without antibiotics.',
  },
  {
    id:'copd_exac', cat:'resp',
    name:'COPD Exacerbation (Bacterial)', organism:'H. influenzae, S. pneumoniae, M. catarrhalis, Pseudomonas (severe/structural)',
    source:'GOLD 2024 / ATS-ERS',
    regimens:[
      {label:'Mild–moderate outpatient', cls:'fl', drugs:[
        {name:'Amoxicillin-clavulanate', dose:'875/125 mg PO BID × 5–7 days'},
        {name:'Azithromycin', dose:'500 mg PO day 1, then 250 mg days 2–5  or  500 mg daily × 3 days'},
        {name:'Doxycycline', dose:'100 mg PO BID × 5–7 days'},
      ]},
      {label:'Severe inpatient — no Pseudomonas risk', drugs:[
        {name:'Levofloxacin', dose:'750 mg IV/PO once daily × 5 days'},
        {name:'Moxifloxacin', dose:'400 mg IV/PO once daily × 5 days'},
      ]},
      {label:'Pseudomonas risk', drugs:[
        {name:'Ciprofloxacin', dose:'400 mg IV q8–12h  or  750 mg PO BID × 7 days', note:'Pseudomonas risk: severe COPD (FEV1 <30%), ≥4 exacerbations/year, prior Pseudomonas, recent hospitalization, structural lung disease'},
        {name:'Piperacillin-tazobactam', dose:'3.375 g IV q6h  or  4.5 g IV q8h × 7 days'},
      ]},
    ],
    notes:'Antibiotics benefit strongest when ≥2 of: increased dyspnea, increased sputum volume, purulent sputum (Anthonisen criteria). CRP >40 or procalcitonin >0.1 support bacterial etiology. Corticosteroids (prednisone 40 mg PO × 5 days) improve FEV1 and shorten length of stay.',
  },
  {
    id:'cap_out', cat:'resp',
    name:'CAP — Outpatient', organism:'S. pneumoniae, atypicals (Mycoplasma, Chlamydophila, Legionella)',
    source:'IDSA/ATS 2019',
    regimens:[
      {label:'No comorbidities', cls:'fl', drugs:[
        {name:'Amoxicillin', dose:'1 g PO TID × 5 days', note:'Preferred for typical CAP; covers S. pneumoniae well'},
        {name:'Doxycycline', dose:'100 mg PO BID × 5 days', note:'Good atypical coverage; preferred if Mycoplasma suspected'},
      ]},
      {label:'With comorbidities (COPD, DM, CHF, immunosuppression, recent antibiotics)', drugs:[
        {name:'Combination: Amoxicillin-clavulanate + Azithromycin', dose:'Amox-clav 875/125 mg PO BID + Azithromycin 500 mg day 1, 250 mg days 2–5 × 5 days'},
        {name:'Respiratory fluoroquinolone (monotherapy)', dose:'Levofloxacin 750 mg PO once daily  or  Moxifloxacin 400 mg PO once daily × 5 days'},
      ]},
      {label:'PCN allergy', cls:'allergy', drugs:[
        {name:'Doxycycline', dose:'100 mg PO BID × 5 days', note:'Adults only; good atypical coverage'},
        {name:'Levofloxacin', dose:'750 mg PO once daily × 5 days'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Amoxicillin', dose:'875 mg PO BID × 5–7 days', note:'Avoid fluoroquinolones and doxycycline'},
        {name:'Azithromycin', dose:'500 mg PO day 1, 250 mg days 2–5', note:'For atypical coverage if needed'},
      ]},
    ],
    notes:'PSI/PORT Class I–II or CURB-65 ≤1 appropriate for outpatient. Blood cultures not required for outpatient CAP. Consider influenza testing seasonally. Reserve fluoroquinolones when possible to reduce resistance pressure. Minimum 5-day course; extend if not clinically stable.',
  },
  {
    id:'cap_in', cat:'resp',
    name:'CAP — Inpatient (Non-ICU)', organism:'S. pneumoniae, H. influenzae, atypicals, aspiration organisms',
    source:'IDSA/ATS 2019',
    regimens:[
      {label:'Standard inpatient', cls:'fl', drugs:[
        {name:'Beta-lactam + Azithromycin', dose:'Ceftriaxone 1–2 g IV daily + Azithromycin 500 mg IV/PO daily × 5 days', note:'Combination provides typical + atypical coverage; preferred combination'},
        {name:'Respiratory fluoroquinolone (monotherapy)', dose:'Levofloxacin 750 mg IV/PO once daily  or  Moxifloxacin 400 mg IV/PO once daily × 5 days'},
      ]},
      {label:'MRSA/Pseudomonas risk (prior isolation, structural lung disease, recent hospitalization)', drugs:[
        {name:'Add vancomycin', dose:'25–30 mg/kg IV loading dose, then 15 mg/kg q8–12h (AUC-guided)', note:'For MRSA risk; target AUC/MIC 400–600'},
        {name:'Add piperacillin-tazobactam or cefepime', dose:'Pip-tazo 4.5 g IV q8h  or  Cefepime 2 g IV q8h', note:'For Pseudomonas risk; replace ceftriaxone'},
      ]},
      {label:'PCN allergy — severe', cls:'allergy', drugs:[
        {name:'Respiratory fluoroquinolone', dose:'Levofloxacin 750 mg IV/PO once daily × 5 days'},
        {name:'Azithromycin', dose:'500 mg IV/PO daily (if fluoroquinolone contraindicated)', note:'Less reliable for typical bacteria; use with beta-lactam if possible'},
      ]},
    ],
    notes:'Duration: 5 days if clinical stability achieved (temperature ≤37.8°C, HR ≤100, RR ≤24, SBP ≥90, SpO2 ≥90%). MRSA/Pseudomonas add-on coverage only if validated risk factors present — reassess and de-escalate at 48–72h based on cultures.',
  },

  // ── URINARY TRACT ─────────────────────────────────────────────────────────────
  {
    id:'uti_uncx', cat:'uti',
    name:'UTI — Uncomplicated Cystitis (Female)', organism:'E. coli (>80%), K. pneumoniae, S. saprophyticus',
    source:'IDSA 2010 / ACOG',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Nitrofurantoin macrocrystals', dose:'100 mg PO BID × 5 days', note:'Do not use if CrCl <30 mL/min or pyelonephritis suspected'},
        {name:'TMP-SMX (DS)', dose:'160/800 mg PO BID × 3 days', note:'Only if local E. coli resistance <20%'},
        {name:'Fosfomycin', dose:'3 g PO × 1 dose', note:'Single-dose convenience; slightly lower cure rate vs multi-day regimens'},
      ]},
      {label:'Alternative (when first-line not appropriate)', drugs:[
        {name:'Cephalexin', dose:'500 mg PO QID × 3–7 days'},
        {name:'Ciprofloxacin', dose:'250 mg PO BID × 3 days', note:'Reserve fluoroquinolones; high resistance in many communities'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Nitrofurantoin', dose:'100 mg PO BID × 5–7 days', note:'Avoid at term (≥36 weeks) — neonatal hemolytic anemia risk'},
        {name:'Cephalexin', dose:'500 mg PO QID × 3–7 days'},
        {name:'Amoxicillin-clavulanate', dose:'875/125 mg PO BID × 3–7 days', note:'Culture-guided preferred; amoxicillin alone has high resistance'},
      ]},
    ],
    notes:'Urine culture not required before treatment for typical uncomplicated UTI. Test of cure not required unless pregnant or symptoms persist. Post-menopausal: topical estrogen reduces recurrence. Postcoital prophylaxis (single-dose TMP-SMX or nitrofurantoin) for frequent recurrence.',
  },
  {
    id:'pyelonephritis', cat:'uti',
    name:'Pyelonephritis — Outpatient', organism:'E. coli, Klebsiella, Proteus',
    source:'IDSA 2010',
    regimens:[
      {label:'First-line (if fluoroquinolone resistance <10% locally)', cls:'fl', drugs:[
        {name:'Ciprofloxacin', dose:'500 mg PO BID × 7 days  or  1 g XR PO once daily × 7 days', note:'Obtain urine culture first; use only if local resistance <10%'},
        {name:'TMP-SMX (DS)', dose:'160/800 mg PO BID × 14 days', note:'Only if susceptibility confirmed (resistance rate <20%)'},
      ]},
      {label:'High fluoroquinolone resistance / ESBL risk', drugs:[
        {name:'Initial dose: Ceftriaxone 1 g IV/IM × 1', dose:'Then oral step-down to culture-directed agent × 7–14 days total', note:'Use if fluoroquinolone resistance >10% — give parenteral initial dose while awaiting culture'},
        {name:'Ertapenem 1 g IM/IV × 1 (if ESBL risk)', dose:'Then step-down per susceptibility', note:'ESBL risk: prior ESBL infection, recent hospitalization, travel to endemic area'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Cephalexin', dose:'500 mg PO QID × 14 days', note:'After susceptibility confirmed; hospitalization often preferred in pregnancy'},
        {name:'Ceftriaxone', dose:'1–2 g IV daily (if hospitalized)', note:'Fluoroquinolones and TMP-SMX relatively contraindicated'},
      ]},
    ],
    notes:'Obtain urine culture before antibiotics. Consider hospitalization for: severe vomiting, sepsis, obstruction, immunosuppression, pregnancy, or failed outpatient treatment. IV-to-oral step-down appropriate once tolerating PO and afebrile ×24–48h.',
  },
  {
    id:'prostatitis', cat:'uti',
    name:'Acute Bacterial Prostatitis', organism:'E. coli, Klebsiella, Pseudomonas, Enterococcus',
    source:'EAU Guidelines 2023',
    regimens:[
      {label:'Outpatient — mild/moderate', cls:'fl', drugs:[
        {name:'Ciprofloxacin', dose:'500 mg PO BID × 4–6 weeks', note:'Fluoroquinolones preferred — excellent prostate penetration; culture-guided'},
        {name:'Levofloxacin', dose:'500 mg PO once daily × 4–6 weeks'},
      ]},
      {label:'TMP-SMX alternative', drugs:[
        {name:'TMP-SMX (DS)', dose:'160/800 mg PO BID × 4–6 weeks', note:'Good prostate penetration; use if FQ resistance/intolerance'},
      ]},
      {label:'Severe / hospitalized', drugs:[
        {name:'Ciprofloxacin', dose:'400 mg IV q12h', note:'Step down to oral once clinically improved and tolerating PO'},
        {name:'Piperacillin-tazobactam', dose:'3.375 g IV q6h  or  4.5 g IV q8h', note:'If septic or Pseudomonas risk'},
      ]},
    ],
    notes:'Blood and urine cultures before antibiotics. Long course (4–6 weeks) required due to poor antibiotic penetration of inflamed/non-inflamed prostate tissue. Prostate massage CONTRAINDICATED during acute infection (bacteremia risk). Follow-up culture at 4 weeks to confirm eradication.',
  },

  // ── SKIN & SOFT TISSUE ────────────────────────────────────────────────────────
  {
    id:'cellulitis', cat:'ssti',
    name:'Non-purulent Cellulitis', organism:'Group A Streptococcus (most common), S. aureus (MSSA)',
    source:'IDSA SSTI Guidelines 2014',
    regimens:[
      {label:'Mild outpatient', cls:'fl', drugs:[
        {name:'Cephalexin', dose:'500 mg PO QID × 5–7 days'},
        {name:'Dicloxacillin', dose:'500 mg PO QID × 5–7 days'},
      ]},
      {label:'Cephalosporin / PCN allergy', cls:'allergy', drugs:[
        {name:'Clindamycin', dose:'300–450 mg PO TID × 5–7 days', note:'Check local clindamycin resistance'},
        {name:'TMP-SMX (DS)', dose:'1–2 tabs PO BID × 5–7 days', note:'Limited streptococcal coverage; preferably add amoxicillin if GAS likely'},
      ]},
      {label:'Moderate–severe / systemic signs / hospitalized', drugs:[
        {name:'Cefazolin', dose:'1–2 g IV q8h', note:'Step down to oral cephalexin once improving'},
        {name:'Nafcillin / Oxacillin', dose:'1–2 g IV q4–6h', note:'For confirmed MSSA; more active against staph than cefazolin in some settings'},
        {name:'Vancomycin', dose:'25–30 mg/kg IV loading, then 15–20 mg/kg q8–12h (AUC-guided)', note:'If MRSA suspected or critically ill; target AUC/MIC 400–600'},
      ]},
    ],
    notes:'Mark borders with pen to track progression. Bilateral lower extremity "cellulitis" is often pseudocellulitis (stasis dermatitis, lipodermatosclerosis, lipedema) — confirm unilateral signs before treating. Elevate extremity. Treat tinea pedis if present (recurrence prevention). Expect 72h response; reassess if not improving.',
  },
  {
    id:'ssti_purulent', cat:'ssti',
    name:'Purulent SSTI / Skin Abscess', organism:'S. aureus (including CA-MRSA)',
    source:'IDSA SSTI Guidelines 2014 / Talan NEJM 2017',
    regimens:[
      {label:'Incision and drainage (primary treatment)', cls:'fl', drugs:[
        {name:'I&D alone', dose:'Primary treatment for uncomplicated abscess <2 cm in immunocompetent adults', note:'Drainage alone adequate per RCT evidence; antibiotics may not be required for simple abscess'},
      ]},
      {label:'Antibiotic adjunct — moderate (systemic signs, ≥2 cm, or multiple lesions)', drugs:[
        {name:'TMP-SMX (DS)', dose:'1–2 tabs PO BID × 5–7 days', note:'Excellent CA-MRSA coverage; preferred outpatient option'},
        {name:'Doxycycline', dose:'100 mg PO BID × 5–7 days', note:'Similar CA-MRSA activity to TMP-SMX'},
        {name:'Clindamycin', dose:'300–450 mg PO TID × 5–7 days', note:'Check inducible resistance (D-zone test) and local resistance rates'},
      ]},
      {label:'Severe — hospitalized / septic', drugs:[
        {name:'Vancomycin', dose:'25–30 mg/kg IV loading, then 15–20 mg/kg q8–12h (AUC-guided)', note:'Target AUC/MIC 400–600'},
        {name:'Daptomycin', dose:'4–6 mg/kg IV once daily', note:'Alternative for vancomycin intolerance or failure; not for pneumonia'},
      ]},
    ],
    notes:'Antibiotics recommended with I&D when: systemic SIRS, multiple lesions or >2 cm, immunosuppression, failed I&D, facial/hand/genitalia location. CA-MRSA coverage essential in most US communities. Hospitalize for: sepsis, rapidly progressing, failed outpatient, high-risk location.',
  },
  {
    id:'necrotizing', cat:'ssti',
    name:'Necrotizing Fasciitis — Empiric', organism:'Polymicrobial (Type I); GAS (Type II)',
    source:'IDSA SSTI Guidelines 2014',
    regimens:[
      {label:'Type I — polymicrobial (most common)', cls:'fl', drugs:[
        {name:'Piperacillin-tazobactam', dose:'3.375 g IV q6h  or  4.5 g IV q8h', note:'Broad gram-positive, gram-negative, and anaerobic coverage'},
        {name:'+ Vancomycin', dose:'25–30 mg/kg IV loading dose, then AUC-guided', note:'Add for MRSA coverage'},
        {name:'Alternative: Meropenem 1–2 g IV q8h + Vancomycin', dose:'For ESBL/resistant organisms'},
      ]},
      {label:'Type II — GAS/streptococcal (monomicrobial)', drugs:[
        {name:'Penicillin G', dose:'2–4 million units IV q4–6h + Clindamycin 900 mg IV q8h', note:'Clindamycin added to inhibit toxin production (Eagle effect); do NOT use clindamycin alone (resistance risk)'},
      ]},
    ],
    notes:'SURGICAL EMERGENCY — immediate surgical debridement is definitive treatment. LRINEC score ≥6 suggests necrotizing infection but clinical suspicion should guide decision. Antibiotics are adjunctive. IVIG has been used for Group A strep toxic shock syndrome. Do not delay surgery for imaging if clinical presentation is clear.',
  },

  // ── GI / ABDOMINAL ────────────────────────────────────────────────────────────
  {
    id:'cdiff', cat:'gi',
    name:'C. difficile Infection (CDI)', organism:'Clostridioides difficile',
    source:'IDSA/SHEA 2021',
    regimens:[
      {label:'Non-severe initial episode', cls:'fl', drugs:[
        {name:'Fidaxomicin', dose:'200 mg PO BID × 10 days', note:'Preferred over vancomycin — lower recurrence rate per IDSA 2021 update'},
        {name:'Vancomycin (oral)', dose:'125 mg PO QID × 10 days', note:'Acceptable alternative; NOT to be confused with IV vancomycin (ineffective for CDI)'},
      ]},
      {label:'Fulminant CDI (hypotension, ileus, megacolon)', drugs:[
        {name:'Vancomycin (oral or NG)', dose:'500 mg PO/NG QID + Metronidazole 500 mg IV q8h', note:'IV metronidazole only as adjunct when PO not tolerated; vancomycin PR enema 500 mg/100 mL q6h if ileus'},
        {name:'Surgical consultation', dose:'For toxic megacolon or perforation; diverting loop ileostomy may spare colon'},
      ]},
      {label:'Recurrent CDI', drugs:[
        {name:'First recurrence', dose:'Fidaxomicin 200 mg PO BID × 10 days  or  Vancomycin tapered pulse (125 mg QID × 10d → BID × 7d → daily × 7d → q2–3d × 8 doses)'},
        {name:'≥2 recurrences', dose:'Bezlotoxumab 10 mg/kg IV × 1 (prevents recurrence)  or  Fecal microbiota transplant (FMT)', note:'FMT highly effective for multiple recurrences; bezlotoxumab given with antibiotics during treatment'},
      ]},
    ],
    notes:'Discontinue precipitating antibiotic if at all possible. Do NOT use oral metronidazole for initial or recurrent CDI (inferior cure rate). Avoid antimotility agents (may precipitate toxic megacolon). Contact precautions; alcohol-based hand sanitizers are not sporicidal — use soap and water.',
  },
  {
    id:'h_pylori', cat:'gi',
    name:'H. pylori Eradication', organism:'Helicobacter pylori',
    source:'ACG 2017 / AGA 2022',
    regimens:[
      {label:'Bismuth quadruple — preferred in most settings', cls:'fl', drugs:[
        {name:'PPI + Bismuth + Tetracycline + Metronidazole', dose:'PPI (standard dose BID) + Bismuth subsalicylate 525 mg QID + Tetracycline 500 mg QID + Metronidazole 500 mg TID-QID × 10–14 days', note:'Preferred by ACG 2017; effective despite metronidazole resistance; requires many pills'},
      ]},
      {label:'Clarithromycin triple — only if local resistance <15%', drugs:[
        {name:'PPI + Clarithromycin + Amoxicillin', dose:'PPI (standard dose BID) + Clarithromycin 500 mg BID + Amoxicillin 1 g BID × 14 days', note:'Do NOT use if prior macrolide exposure or clarithromycin resistance >15% locally'},
      ]},
      {label:'Concomitant (if bismuth unavailable)', drugs:[
        {name:'PPI + Clarithromycin + Amoxicillin + Metronidazole', dose:'PPI BID + Clarithromycin 500 mg BID + Amoxicillin 1 g BID + Metronidazole 500 mg BID × 10–14 days'},
      ]},
      {label:'PCN allergy', cls:'allergy', drugs:[
        {name:'Bismuth quadruple (amoxicillin-free)', dose:'Replaces amoxicillin; tetracycline-based regimen has no PCN component'},
        {name:'Levofloxacin triple', dose:'PPI BID + Levofloxacin 500 mg daily + Rifabutin 150 mg BID × 10–14 days', note:'For salvage after failed regimens; rifabutin-based avoids amoxicillin'},
      ]},
    ],
    notes:'Confirm eradication with urea breath test or stool antigen test ≥4 weeks after completing therapy and ≥2 weeks off PPI. Resistance testing (culture or molecular PCR) recommended for salvage after 2 failed regimens. All regimens require a PPI twice daily throughout the entire course.',
  },
  {
    id:'intraabdominal', cat:'gi',
    name:'Intra-abdominal Infection — Empiric', organism:'E. coli, Bacteroides fragilis, Streptococcus spp., Klebsiella',
    source:'IDSA/SIS 2010 / WSES 2017',
    regimens:[
      {label:'Mild–moderate community-acquired', cls:'fl', drugs:[
        {name:'Ertapenem', dose:'1 g IV/IM once daily × 4–7 days', note:'Excellent gram-negative and anaerobic coverage; convenient once-daily dosing'},
        {name:'Ceftriaxone + Metronidazole', dose:'Ceftriaxone 2 g IV daily + Metronidazole 500 mg IV/PO q8h', note:'Common combination; add metronidazole for anaerobic (Bacteroides) coverage'},
        {name:'Moxifloxacin', dose:'400 mg IV/PO once daily', note:'Oral step-down option for mild disease; covers gram-negatives and anaerobes'},
      ]},
      {label:'Severe / healthcare-associated / ESBL risk', drugs:[
        {name:'Piperacillin-tazobactam', dose:'3.375 g IV q6h  or  4.5 g IV q8h (extended infusion preferred)', note:'Broad coverage; extended infusion improves pharmacodynamic target attainment'},
        {name:'Meropenem', dose:'1 g IV q8h (moderate) or 2 g IV q8h (severe ESBL risk)'},
      ]},
      {label:'Enterococcus risk (valvular disease, post-op, immunosuppressed)', drugs:[
        {name:'Add ampicillin-sulbactam', dose:'3 g IV q6h  or  add ampicillin to regimen', note:'Enterococcal coverage; Enterococcus faecalis usually susceptible to ampicillin'},
      ]},
    ],
    notes:'Source control (surgery, percutaneous drainage) is the primary treatment — antibiotics are adjunctive. Duration: typically 4–7 days after adequate source control for complicated IAI. Uncomplicated appendicitis/cholecystitis may not require post-operative antibiotics. De-escalate at 48–72h based on cultures and clinical response.',
  },

  // ── TICK-BORNE ────────────────────────────────────────────────────────────────
  {
    id:'lyme', cat:'tick',
    name:'Lyme Disease — Early Localized / Disseminated', organism:'Borrelia burgdorferi',
    source:'IDSA/AAN/ACR 2020',
    regimens:[
      {label:'Early localized (EM rash)', cls:'fl', drugs:[
        {name:'Doxycycline', dose:'100 mg PO BID × 10 days  or  200 mg once daily × 10 days', note:'Drug of choice; also active against Anaplasma (frequent co-infection)'},
      ]},
      {label:'PCN allergy or doxycycline contraindicated', drugs:[
        {name:'Amoxicillin', dose:'500 mg PO TID × 14 days'},
        {name:'Cefuroxime axetil', dose:'500 mg PO BID × 14 days'},
      ]},
      {label:'Early disseminated — carditis (1st/2nd degree AV block)', drugs:[
        {name:'Doxycycline', dose:'100 mg PO BID × 14–21 days', note:'For mild carditis; oral acceptable if not hospitalized'},
        {name:'Ceftriaxone', dose:'2 g IV daily × 14–21 days', note:'For high-degree AV block or hospitalized patients'},
      ]},
      {label:'Neurological Lyme (radiculopathy, meningitis, facial palsy)', drugs:[
        {name:'Ceftriaxone', dose:'2 g IV once daily × 14–28 days', note:'Meningitis, radiculopathy, other neurological involvement'},
        {name:'Doxycycline', dose:'100–200 mg PO BID × 14–21 days', note:'Acceptable alternative for facial palsy without meningitis per IDSA 2020'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Amoxicillin', dose:'500 mg PO TID × 14 days', note:'Doxycycline contraindicated'},
        {name:'Cefuroxime axetil', dose:'500 mg PO BID × 14 days'},
        {name:'Ceftriaxone', dose:'2 g IV daily if disseminated'},
      ]},
    ],
    notes:'EM rash (≥5 cm erythema migrans) is clinical diagnosis — serology not required for early localized. Single-dose prophylaxis for tick bite: doxycycline 200 mg PO × 1 dose within 72h if Ixodes tick attached ≥36h in endemic area. Two-tier serology (ELISA then Western blot) for all other presentations.',
  },
  {
    id:'rmsf', cat:'tick',
    name:'RMSF / Ehrlichiosis / Anaplasmosis', organism:'Rickettsia rickettsii, Ehrlichia spp., Anaplasma phagocytophilum',
    source:'CDC / IDSA 2016',
    regimens:[
      {label:'First-line — ALL age groups including children', cls:'fl', drugs:[
        {name:'Doxycycline', dose:'100 mg PO/IV BID until afebrile ≥3 days (minimum 5–7 days for RMSF; 5–10 days for Ehrlichia/Anaplasma)', note:'Children: 2.2 mg/kg/dose BID (max 100 mg/dose). Do NOT delay for rash — mortality increases with >5-day delays'},
      ]},
      {label:'Pregnancy — only if doxycycline absolutely contraindicated', cls:'preg', drugs:[
        {name:'Chloramphenicol', dose:'500 mg IV/PO QID × 7–10 days', note:'Significant hematologic toxicity; use only if doxycycline refused near term. Doxycycline preferred in most of pregnancy including 1st trimester given mortality risk of RMSF'},
      ]},
    ],
    notes:'RMSF diagnosis is CLINICAL — do NOT delay treatment for serologic confirmation (serology is negative in first week). Classic triad: fever + headache + rash — but rash may be absent early or in dark-skinned patients. Doxycycline is SAFE in children of all ages; dental staining negligible with short courses. ICU for severe cases. Mortality approaches 25% without treatment.',
  },

  // ── SEVERE / EMPIRIC ──────────────────────────────────────────────────────────
  {
    id:'meningitis', cat:'severe',
    name:'Bacterial Meningitis — Empiric', organism:'N. meningitidis, S. pneumoniae, L. monocytogenes (immunocompromised/elderly)',
    source:'IDSA 2004 / updated practice',
    regimens:[
      {label:'Standard empiric therapy', cls:'fl', drugs:[
        {name:'Ceftriaxone', dose:'2 g IV q12h', note:'Covers N. meningitidis and S. pneumoniae'},
        {name:'+ Vancomycin', dose:'25–30 mg/kg IV loading dose, then 15–20 mg/kg q8–12h (AUC-guided)', note:'Add for PCN-resistant S. pneumoniae (all regions)'},
        {name:'+ Ampicillin', dose:'2 g IV q4h', note:'Add if: age >50, pregnancy, immunosuppression, alcoholism (Listeria coverage)'},
        {name:'+ Dexamethasone', dose:'0.15 mg/kg IV q6h × 4 days', note:'Start 15–30 min before or with first antibiotic dose; proven benefit for S. pneumoniae; discontinue if non-pneumococcal organism confirmed'},
      ]},
      {label:'PCN allergy — severe', cls:'allergy', drugs:[
        {name:'Meropenem', dose:'2 g IV q8h + Vancomycin (as above)', note:'Meropenem covers most meningitis pathogens including Listeria; use if true beta-lactam anaphylaxis'},
        {name:'Chloramphenicol', dose:'Consult ID; rarely used due to toxicity', note:'Historical alternative; significant bone marrow suppression risk'},
      ]},
    ],
    notes:'Blood cultures × 2 AND lumbar puncture BEFORE antibiotics — but do NOT delay antibiotics >30–60 min for LP. CT head before LP only if: papilledema, focal neurological deficit, altered consciousness, new-onset seizure, or immunocompromise. CSF bacterial meningitis: cloudy, WBC >1000 (PMN predominant), glucose <45, protein >200, opening pressure elevated.',
  },
  {
    id:'sepsis', cat:'severe',
    name:'Sepsis — Empiric (Community-Acquired)', organism:'Gram-negative enteric, S. aureus, Streptococcus spp.',
    source:'Surviving Sepsis Campaign 2021',
    regimens:[
      {label:'Community-acquired (no MRSA/Pseudomonas risk)', cls:'fl', drugs:[
        {name:'Piperacillin-tazobactam', dose:'3.375 g IV q6h  or  4.5 g IV q8h (extended infusion preferred for severe sepsis)', note:'Broad gram-negative and anaerobic coverage; add vancomycin if MRSA risk'},
        {name:'Ceftriaxone', dose:'2 g IV daily', note:'Alternative for non-Pseudomonas community sepsis; add metronidazole 500 mg IV q8h if abdominal source'},
      ]},
      {label:'MRSA risk (skin/soft tissue source, nasal colonization, prior MRSA)', drugs:[
        {name:'+ Vancomycin', dose:'25–30 mg/kg IV loading dose, then 15 mg/kg q8–12h (AUC-guided)', note:'Add to beta-lactam; target AUC/MIC 400–600'},
      ]},
      {label:'Pseudomonas risk (structural lung disease, neutropenia, prior Pseudomonas, ICU admission)', drugs:[
        {name:'Cefepime', dose:'2 g IV q8h', note:'Antipseudomonal; replace ceftriaxone'},
        {name:'Piperacillin-tazobactam', dose:'4.5 g IV q8h (extended infusion)', note:'Alternative antipseudomonal'},
        {name:'Meropenem', dose:'1–2 g IV q8h', note:'Reserve for ESBL/KPC risk, or prior resistant organisms'},
      ]},
    ],
    notes:'Blood cultures × 2 (and source-site cultures) BEFORE antibiotics — but do not delay >1 hour for septic shock. Reassess and de-escalate at 48–72h based on cultures and clinical response. Source control essential (drain, debride, remove infected device). 7-day course adequate for most community-acquired sepsis without bacteremia. Procalcitonin-guided duration reduces antibiotic exposure.',
  },
];

// ── Navigation ────────────────────────────────────────────────────────────────

let currentId = null;

function buildNav() {
  const q = document.getElementById('abxSearch').value.trim().toLowerCase();
  const nav = document.getElementById('tabNav');
  nav.innerHTML = '';

  for (const cat of CATS) {
    const items = ABX.filter(a => {
      if (a.cat !== cat.id) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.organism.toLowerCase().includes(q);
    });
    for (const a of items) {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (currentId === a.id ? ' active' : '');
      btn.dataset.id = a.id;
      btn.textContent = a.name;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showAbx(a.id);
      });
      nav.appendChild(btn);
    }
  }
}

function showAbx(id) {
  currentId = id;
  const a = ABX.find(x => x.id === id);
  if (!a) return;

  const catLabel = CATS.find(c => c.id === a.cat)?.label || a.cat;
  let html = `
    <div class="abx-eyebrow">${esc(catLabel)}</div>
    <div class="abx-title">${esc(a.name)}</div>
    <div class="abx-organism">${esc(a.organism)}</div>
    <div class="abx-source">Source: ${esc(a.source)}</div>`;

  for (const reg of a.regimens) {
    const cls = reg.cls ? ` ${esc(reg.cls)}` : '';
    html += `<div class="reg-label${cls}">${esc(reg.label)}</div><div class="drugs">`;
    for (const d of reg.drugs) {
      const dcls = reg.cls === 'fl' ? ' fl' : '';
      html += `<div class="drug${dcls}">
        <div class="drug-name">${esc(d.name)}</div>
        <div class="drug-dose">${esc(d.dose)}</div>
        ${d.note ? `<div class="drug-note">${esc(d.note)}</div>` : ''}
      </div>`;
    }
    html += `</div>`;
  }

  if (a.notes) {
    html += `<div class="abx-note">${esc(a.notes)}</div>`;
  }

  html += `<button class="copy-btn" id="copyBtn">&#x2398; Copy regimen</button>`;
  document.getElementById('pane').innerHTML = html;
  document.getElementById('copyBtn').addEventListener('click', copyRegimen);
}

function copyRegimen() {
  const a = ABX.find(x => x.id === currentId);
  if (!a) return;
  const lines = [`${a.name}`, `Organism: ${a.organism}`, ''];
  for (const reg of a.regimens) {
    lines.push(reg.label.toUpperCase());
    for (const d of reg.drugs) {
      lines.push(`  ${d.name}  —  ${d.dose}`);
      if (d.note) lines.push(`    Note: ${d.note}`);
    }
    lines.push('');
  }
  if (a.notes) { lines.push(`Clinical Notes: ${a.notes}`); lines.push(''); }
  lines.push(`Source: ${a.source} — noahpac.com/abx/`);
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = '✓ Copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.innerHTML = '&#x2398; Copy regimen'; btn.classList.remove('copied'); }, 2000);
  });
}

document.getElementById('abxSearch').addEventListener('input', buildNav);
buildNav();
