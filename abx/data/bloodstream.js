'use strict';
const ABX_BLOODSTREAM = [

  {
    id:'sepsis', cat:'bloodstream',
    name:'Sepsis / Septic Shock — Empiric', organism:'Gram-positive and gram-negative bacteria; source-dependent (see notes)',
    source:'Surviving Sepsis Campaign 2021',
    regimens:[
      {label:'Community-acquired sepsis (unknown source)', cls:'fl', drugs:[
        {name:'Piperacillin-tazobactam', dose:'4.5 g IV q6h (extended 4h infusion preferred)', note:'Broad gram-positive + gram-negative + anaerobic coverage; preferred if Pseudomonas possible'},
        {name:'Ceftriaxone', dose:'2 g IV q24h  +  Metronidazole 500 mg IV q8h', note:'Reasonable if intra-abdominal or pulmonary source and low Pseudomonas risk'},
      ]},
      {label:'Add MRSA coverage (suspected SSTI source, prior MRSA, healthcare exposure, severe pneumonia)', drugs:[
        {name:'+ Vancomycin', dose:'25–30 mg/kg IV loading dose, then AUC-guided (target AUC/MIC 400–600)', note:'Add to above regimen; monitor renal function'},
        {name:'Or Linezolid', dose:'600 mg IV q12h', note:'Alternative; avoid with concurrent serotonergic agents'},
      ]},
      {label:'Healthcare-associated / ICU / recent antibiotics / immunocompromised', drugs:[
        {name:'Meropenem', dose:'1–2 g IV q8h', note:'Escalate if: recent hospitalization, ESBL colonized, prior broad-spectrum antibiotics, failed initial therapy'},
        {name:'+ Vancomycin', dose:'AUC-guided', note:'If MRSA risk factors present'},
      ]},
      {label:'Neutropenic fever (ANC <500)', cls:'allergy', drugs:[
        {name:'Cefepime', dose:'2 g IV q8h (or Piperacillin-tazobactam 4.5 g q6h)', note:'Anti-pseudomonal beta-lactam preferred for febrile neutropenia'},
        {name:'Add Vancomycin for: hemodynamic instability, skin/soft tissue infection, MRSA risk', note:'Do not add vancomycin empirically without indication'},
        {name:'Add Antifungal (Caspofungin)', dose:'70 mg IV load then 50 mg daily: if prolonged fever ≥4–5 days, persistent neutropenia'},
      ]},
    ],
    notes:'Hour-1 bundle (SSC 2018): blood cultures × 2 BEFORE antibiotics, antibiotics within 1 hour of sepsis recognition, IV fluid 30 mL/kg crystalloid if hypoperfusion, vasopressors if MAP <65 after fluid. De-escalation: reassess at 24–48h once culture data available — narrow spectrum. Duration: typically 7–10 days; shorter acceptable if rapid source control. Hydrocortisone 200 mg IV/day (continuous infusion) for septic shock refractory to vasopressors. Source control within 6–12h.',
  },

  {
    id:'s-aureus-bacteremia', cat:'bloodstream',
    name:'S. aureus Bacteremia (SAB)', organism:'S. aureus — MSSA or MRSA; all bacteremia requires ID consult and TTE/TEE',
    source:'IDSA 2011 / AHA 2015 / Emerging literature',
    regimens:[
      {label:'MSSA bacteremia', cls:'fl', drugs:[
        {name:'Nafcillin / Oxacillin', dose:'2 g IV q4h × minimum 14 days (uncomplicated)  or  × 4–6 weeks (complicated)', note:'Superior to vancomycin for MSSA bacteremia — lower treatment failure, mortality; do NOT use vancomycin if MSSA confirmed'},
        {name:'Cefazolin', dose:'2 g IV q8h × minimum 14 days', note:'Non-inferior to anti-staphylococcal penicillins for bacteremia (CAMERA2 trial); preferred in PCN-allergic or due to toxicity; check for inoculum effect concerns'},
      ]},
      {label:'MRSA bacteremia', drugs:[
        {name:'Vancomycin', dose:'25–30 mg/kg IV loading, then AUC-guided (target AUC/MIC 400–600) × 14–42 days', note:'First-line for MRSA; duration depends on complicated vs. uncomplicated status'},
        {name:'Daptomycin', dose:'6–10 mg/kg IV q24h', note:'Alternative for persistent MRSA bacteremia or vancomycin intolerance; NOT for pulmonary involvement (inactivated by surfactant)'},
      ]},
      {label:'Persistent bacteremia / high vancomycin MIC (salvage)', cls:'allergy', drugs:[
        {name:'Daptomycin', dose:'8–10 mg/kg IV q24h  ±  beta-lactam combination', note:'Combination with ceftaroline or cefazolin for synergy'},
        {name:'Ceftaroline', dose:'600 mg IV q8h (off-label for SAB)', note:'Novel cephalosporin with MRSA activity; used for salvage'},
        {name:'Consult ID urgently', note:'Persistent bacteremia (>72h) despite appropriate treatment requires urgent ID consultation'},
      ]},
    ],
    notes:'Mandatory ID consult — all SAB. Mandatory echocardiography: TTE at minimum; TEE strongly preferred (much higher sensitivity for endocarditis). Repeat blood cultures every 48h until negative. "Uncomplicated" SAB criteria: follow-up cultures negative within 72h, no prosthetic material, no endocarditis, no metastatic sites of infection, defervescence in 72h. Uncomplicated: 14 days minimum. Complicated (endocarditis, prosthetic material, metastatic infection): 4–6 weeks. Remove/exchange all IV access. Rifampin: do NOT add empirically (antagonism risk in acute bacteremia); consider for prosthetic material after bacteremia cleared.',
  },

  {
    id:'clabsi', cat:'bloodstream',
    name:'CLABSI / Catheter-Associated Bloodstream Infection', organism:'CoNS (S. epidermidis), S. aureus, Candida, gram-negatives (Klebsiella, Pseudomonas)',
    source:'IDSA 2009 / CDC / SHEA practice recommendations',
    regimens:[
      {label:'Empiric (pending cultures)', cls:'fl', drugs:[
        {name:'Vancomycin', dose:'25–30 mg/kg IV loading, then AUC-guided', note:'Covers CoNS and MRSA; the most common CLABSI pathogens are gram-positive'},
        {name:'+ Cefepime or Piperacillin-tazobactam', dose:'Cefepime 2 g IV q8h  or  Pip-Tazo 4.5 g IV q6h', note:'Add gram-negative coverage if: immunocompromised, neutropenia, femoral catheter, GI colonization'},
        {name:'+ Caspofungin (if Candida risk)', dose:'70 mg IV loading dose, then 50 mg IV daily', note:'Candida risk: TPN, broad-spectrum antibiotics, abdominal surgery, renal replacement therapy, prolonged ICU stay'},
      ]},
      {label:'Catheter management (critical decision)', drugs:[
        {name:'REMOVE catheter if:', note:'S. aureus, gram-negatives, Candida bacteremia; tunnel/port infection; septic shock; persistent bacteremia; endovascular infection'},
        {name:'RETAIN catheter (with antibiotic lock therapy) only if:', note:'CoNS, uncomplicated; no clinical evidence of tunnel/port infection; catheter is essential and non-replaceable; patient improves within 72h'},
      ]},
      {label:'CoNS (coagulase-negative Staph — catheter salvage)', drugs:[
        {name:'Vancomycin systemic', dose:'AUC-guided × 7–14 days  +  Vancomycin lock therapy', note:'Lock solution: vancomycin 5 mg/mL in heparin 100 units/mL; dwell in catheter lumen 8–12h/day'},
      ]},
      {label:'Candida bloodstream (candidemia)', drugs:[
        {name:'Caspofungin', dose:'70 mg IV loading, then 50 mg IV daily (first-line)', note:'Echinocandin is first-line for candidemia; remove catheter immediately if Candida isolated'},
        {name:'Micafungin', dose:'100 mg IV daily', note:'Alternative echinocandin'},
        {name:'Step-down to Fluconazole', dose:'400–800 mg PO/IV daily (after species confirmed susceptible and patient stable)', note:'C. glabrata and C. krusei may be fluconazole-resistant — check susceptibilities'},
      ]},
    ],
    notes:'REMOVE or EXCHANGE the catheter — the most important intervention for true CLABSI. Duration (after catheter removal): CoNS 5–7 days if uncomplicated; S. aureus minimum 14 days (always TTE/TEE); gram-negatives 7–14 days; Candida 14 days from first negative blood culture (ophthalmology exam for endophthalmitis). All Candida bloodstream infections require ophthalmology consult (endophthalmitis risk). Prevention: maximal barrier precautions for insertion, chlorhexidine skin prep, subclavian preferred over femoral, remove catheters as soon as not needed.',
  },

  {
    id:'candidemia', cat:'bloodstream',
    name:'Candidemia / Invasive Candidiasis', organism:'C. albicans, C. glabrata (auris), C. parapsilosis, C. tropicalis, C. krusei',
    source:'IDSA 2016',
    regimens:[
      {label:'Non-neutropenic critically ill or unknown species', cls:'fl', drugs:[
        {name:'Caspofungin', dose:'70 mg IV loading dose, then 50 mg IV daily', note:'First-line for non-neutropenic critically ill; echinocandins have superior efficacy in clinical trials'},
        {name:'Micafungin', dose:'100 mg IV daily', note:'Equivalent echinocandin alternative'},
        {name:'Anidulafungin', dose:'200 mg IV loading, then 100 mg IV daily', note:'Third echinocandin option'},
      ]},
      {label:'Step-down to fluconazole (when stable and susceptibility confirmed)', drugs:[
        {name:'Fluconazole', dose:'400–800 mg PO/IV daily × 14 days from first negative culture', note:'C. albicans and C. parapsilosis: typically fluconazole-susceptible; transition after species and sensitivity confirmed + patient stable 5–7 days'},
        {name:'NOT for C. glabrata, C. krusei, C. auris', note:'These species have high fluconazole MICs; continue echinocandin or switch to voriconazole/amphotericin based on susceptibility'},
      ]},
      {label:'Neutropenic patient', cls:'allergy', drugs:[
        {name:'Echinocandin (as above)', note:'Preferred in neutropenic patients'},
        {name:'Fluconazole', dose:'800 mg IV loading, then 400 mg daily', note:'Acceptable if patient is clinically stable, no prior azole exposure, and C. krusei/glabrata not suspected'},
        {name:'Liposomal Amphotericin B', dose:'3 mg/kg IV daily', note:'If echinocandin not tolerated or species with high echinocandin MIC'},
      ]},
      {label:'C. auris (emerging MDR pathogen)', drugs:[
        {name:'Echinocandin (first-line for C. auris)', note:'Most C. auris are resistant to fluconazole; echinocandin preferred'},
        {name:'Consult ID urgently + infection control', note:'C. auris: high MDR potential, hospital outbreak pathogen, contact precautions, specialized environmental cleaning required'},
      ]},
    ],
    notes:'Remove central venous catheters immediately — a critical intervention. Ophthalmology consult for endophthalmitis (present in 4–10%). Echocardiography for endocarditis risk (prosthetic valves, structural heart disease, persistent candidemia). Duration: 14 days from first negative blood culture + symptom resolution. Repeat blood cultures every 48h until negative. ID consultation mandatory. All candidemia patients need fundoscopic exam.',
  },

];
