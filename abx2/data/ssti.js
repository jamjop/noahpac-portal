'use strict';
const ABX_SSTI = [

  {
    id:'cellulitis', cat:'ssti',
    name:'Cellulitis (Non-purulent)', organism:'Beta-hemolytic Streptococcus (Groups A, B, C, G); rarely S. aureus',
    source:'IDSA 2014',
    regimens:[
      {label:'Outpatient', cls:'fl', drugs:[
        {name:'Cephalexin', dose:'500 mg PO QID × 5 days (extend if not improving)'},
        {name:'Dicloxacillin', dose:'500 mg PO QID × 5 days', note:'Beta-lactamase stable; well absorbed fasting'},
        {name:'Amoxicillin-clavulanate', dose:'875/125 mg PO BID × 5 days', note:'If animal bite, water exposure, or mixed flora concern'},
      ]},
      {label:'Systemic illness / failed outpatient / immunocompromised', drugs:[
        {name:'Cefazolin', dose:'1–2 g IV q8h', note:'Transition to cephalexin PO when improving'},
        {name:'Ceftriaxone', dose:'1–2 g IV q24h', note:'Once-daily option; facilitates discharge'},
        {name:'Nafcillin / Oxacillin', dose:'1–2 g IV q4–6h', note:'For non-MRSA; excellent streptococcal coverage'},
      ]},
      {label:'PCN allergy — anaphylaxis', cls:'allergy', drugs:[
        {name:'Clindamycin', dose:'300–450 mg PO TID × 5–7 days (outpatient)', note:'Ensure D-zone susceptibility if MRSA is possible'},
        {name:'TMP-SMX', dose:'1–2 DS tablets PO BID × 5–7 days', note:'Covers MRSA but NOT Streptococcus reliably — less ideal for classic cellulitis'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Cephalexin', dose:'500 mg PO QID × 5–7 days'},
        {name:'Cefazolin', dose:'1 g IV q8h (hospitalized)'},
      ]},
    ],
    notes:'Mark borders with pen at presentation. Non-purulent cellulitis is mostly streptococcal — MRSA coverage usually NOT needed unless failed beta-lactam or risk factors. Elevate extremity. Re-evaluate at 48–72h. Recurrent cellulitis: consider once-daily penicillin V 250 mg for prophylaxis after acute episode. Rule out DVT if lower extremity. Lymphedema is a major risk factor.',
  },

  {
    id:'abscess', cat:'ssti',
    name:'Cutaneous Abscess (Purulent SSTI)', organism:'S. aureus (including CA-MRSA ~60% of purulent SSTIs)',
    source:'IDSA 2014',
    regimens:[
      {label:'Primary treatment (all abscesses)', cls:'fl', drugs:[
        {name:'Incision and Drainage (I&D)', dose:'Required — antibiotics alone insufficient for fluctuant abscess', note:'Adequate I&D is the definitive treatment'},
      ]},
      {label:'Antibiotics after I&D (indicated for: systemic illness, multiple lesions, rapid spread, immunocompromised, poor I&D access)', drugs:[
        {name:'TMP-SMX (DS)', dose:'1–2 tablets PO BID × 5–7 days', note:'Preferred for CA-MRSA coverage; superior to beta-lactam in clinical trials (NEJM 2017)'},
        {name:'Doxycycline', dose:'100 mg PO BID × 5–7 days', note:'Alternative MRSA coverage; comparable to TMP-SMX in trials'},
        {name:'Clindamycin', dose:'300–450 mg PO TID × 5–7 days', note:'Confirm MRSA susceptibility — inducible resistance possible (D-zone test)'},
      ]},
      {label:'PCN allergy (if beta-lactam needed)', cls:'allergy', drugs:[
        {name:'TMP-SMX or Doxycycline', dose:'As above', note:'These are not penicillins — safe in PCN allergy'},
      ]},
      {label:'Pregnant / breastfeeding', cls:'preg', drugs:[
        {name:'Cephalexin', dose:'500 mg PO QID × 5–7 days', note:'After I&D; if MRSA not suspected'},
        {name:'Consult ID', note:'TMP-SMX avoided near term; doxycycline avoided in pregnancy'},
      ]},
    ],
    notes:'I&D is the primary treatment. For uncomplicated, small abscesses in healthy immunocompetent patients without systemic signs: I&D alone may be sufficient. Antibiotic benefit most clear for abscesses >2 cm. Wound packing evidence is evolving — less packing may improve outcomes. Culture wound discharge to guide therapy. MRSA nasal decolonization for recurrent MRSA furunculosis (mupirocin ointment + chlorhexidine wash).',
  },

  {
    id:'necrotizing', cat:'ssti',
    name:'Necrotizing Fasciitis / Fournier\'s Gangrene', organism:'Polymicrobial (Type I): mixed aerobic/anaerobic; Monomicrobial (Type II): GAS or S. aureus',
    source:'IDSA 2014 / Surgical guidelines',
    regimens:[
      {label:'Empiric broad-spectrum (ALL types)', cls:'fl', drugs:[
        {name:'Piperacillin-tazobactam', dose:'4.5 g IV q6h (extended infusion preferred)'},
        {name:'+ Vancomycin', dose:'25–30 mg/kg IV loading, then AUC-guided', note:'Covers MRSA'},
        {name:'+ Clindamycin', dose:'900 mg IV q8h', note:'Add to suppress toxin production (GAS/MRSA); anti-toxin effect independent of susceptibility'},
      ]},
      {label:'Confirmed GAS (Type II monomicrobial)', drugs:[
        {name:'Penicillin G', dose:'4 million units IV q4–6h', note:'After source control and sensitivities known'},
        {name:'+ Clindamycin', dose:'900 mg IV q8h × 72h', note:'Continue clindamycin for toxin suppression even if organism is penicillin-susceptible'},
      ]},
      {label:'Confirmed MRSA', cls:'allergy', drugs:[
        {name:'Vancomycin', dose:'AUC-guided dosing  +  Clindamycin 900 mg IV q8h'},
        {name:'Linezolid', dose:'600 mg IV/PO q12h  +  anti-anaerobic coverage', note:'Alternative if vancomycin allergy or AUC monitoring unavailable'},
      ]},
      {label:'Carbapenem-based (if ESBL or carbapenem-indicated)', drugs:[
        {name:'Meropenem', dose:'1 g IV q8h  +  Vancomycin  +  Clindamycin', note:'Escalate if: poor response, ESBL concern, severely immunocompromised'},
      ]},
    ],
    notes:'SURGICAL EMERGENCY — immediate surgical debridement is the primary treatment. No antibiotic regimen substitutes for surgery. Mortality is extremely high without early aggressive debridement. LRINEC score may help risk-stratify, but do not delay surgery for lab results if clinical suspicion is high. Repeat surgical re-look in 24–48h. ICU care, vasopressors if septic shock, IVIG considered for streptococcal toxic shock syndrome. Hyperbaric oxygen — adjunctive; not a substitute for surgery.',
  },

  {
    id:'diabetic-foot', cat:'ssti',
    name:'Diabetic Foot Infection', organism:'Mild–moderate: S. aureus, Streptococcus; Severe/chronic: polymicrobial + gram-negatives + anaerobes',
    source:'IDSA 2012 / IWGDF 2023',
    regimens:[
      {label:'Mild (superficial, limited to skin/subcutaneous tissue)', cls:'fl', drugs:[
        {name:'TMP-SMX (DS)', dose:'1–2 tablets PO BID × 7–14 days', note:'If MRSA risk or CA-MRSA prevalent'},
        {name:'Cephalexin', dose:'500 mg PO QID × 7–14 days', note:'If MSSA/streptococcal; no systemic signs'},
        {name:'Amoxicillin-clavulanate', dose:'875/125 mg PO BID × 7–14 days', note:'Broader coverage including anaerobes'},
      ]},
      {label:'Moderate (deeper tissue — fascia, muscle, tendon, or systemic signs)', drugs:[
        {name:'Piperacillin-tazobactam', dose:'4.5 g IV q6h', note:'Broad polymicrobial coverage for moderately severe DFI'},
        {name:'Ampicillin-sulbactam', dose:'3 g IV q6h', note:'Alternative if Pseudomonas not suspected'},
        {name:'+ Vancomycin', dose:'AUC-guided', note:'Add MRSA coverage for: prior MRSA, wound colonization, severe/hospitalized patient'},
      ]},
      {label:'Severe (limb/life-threatening, osteomyelitis, sepsis)', cls:'allergy', drugs:[
        {name:'Vancomycin', dose:'AUC-guided  +  Piperacillin-tazobactam 4.5 g IV q6h', note:'MRSA + broad gram-negative + anaerobic coverage'},
        {name:'Meropenem', dose:'1 g IV q8h  +  Vancomycin', note:'If ESBL concern or recent antibiotic exposure'},
        {name:'Culture-guided de-escalation at 48–72h', note:''},
      ]},
      {label:'Osteomyelitis complicating DFI (see Bone & Joint)', drugs:[
        {name:'Probe-to-bone positive: treat as osteomyelitis', note:'Prolonged antibiotic course (4–6 weeks) and/or surgical debridement/resection of infected bone — refer to Bone & Joint section'},
      ]},
    ],
    notes:'IDSA/IWGDF severity classification guides management. Ischemia evaluation mandatory — vascular surgery consult if ABI <0.9 or non-compressible vessels; infection will not heal without revascularization. Wound cultures (deep tissue biopsy or bone biopsy if osteomyelitis suspected) — avoid superficial swab cultures. Offloading is essential. MRI is the best imaging for osteomyelitis detection. Osteomyelitis: surgical resection of infected bone often provides best outcomes; conservative antibiotics alone acceptable in some patients not surgical candidates.',
  },

  {
    id:'bite-wound', cat:'ssti',
    name:'Animal / Human Bite Wound', organism:'Dog bite: Pasteurella multocida, Capnocytophaga; Cat bite: P. multocida; Human bite: Eikenella corrodens, oral anaerobes, S. aureus',
    source:'IDSA 2014 / UpToDate',
    regimens:[
      {label:'Prophylaxis and early infection (dog, cat, or human bite)', cls:'fl', drugs:[
        {name:'Amoxicillin-clavulanate', dose:'875/125 mg PO BID × 5 days (prophylaxis)  or  × 7–14 days (established infection)', note:'Covers Pasteurella, Capnocytophaga, anaerobes, and gram-positives — preferred for all bite wounds'},
      ]},
      {label:'Established infection — IV therapy', drugs:[
        {name:'Ampicillin-sulbactam', dose:'3 g IV q6h', note:'For hospitalized patients with severe bite infection'},
        {name:'Piperacillin-tazobactam', dose:'4.5 g IV q6h', note:'Escalate if systemic sepsis or immunocompromised'},
      ]},
      {label:'PCN allergy — non-anaphylaxis', cls:'allergy', drugs:[
        {name:'Moxifloxacin', dose:'400 mg PO daily × 5–7 days', note:'Covers Pasteurella and anaerobes; single agent'},
        {name:'Doxycycline + Metronidazole', dose:'Doxycycline 100 mg BID + Metronidazole 500 mg TID × 5–7 days', note:'Covers Pasteurella and anaerobes separately'},
      ]},
      {label:'PCN allergy — anaphylaxis', cls:'allergy', drugs:[
        {name:'TMP-SMX (DS) + Metronidazole', dose:'TMP-SMX 1 DS tab BID + Metronidazole 500 mg TID × 5–7 days', note:'TMP-SMX covers Pasteurella and MRSA; add metronidazole for anaerobes'},
        {name:'Ciprofloxacin + Metronidazole', dose:'Ciprofloxacin 500 mg BID + Metronidazole 500 mg TID × 5–7 days', note:'Ciprofloxacin covers Pasteurella; add metronidazole for anaerobes; poor oral streptococcal coverage'},
      ]},
    ],
    notes:'Irrigate wound copiously with normal saline (10+ mL/cm) under pressure. Debride devitalized tissue. Prophylactic antibiotics for: cat bites (high infection risk), deep punctures (hands, face, joints), immunocompromised patients, asplenic patients (Capnocytophaga risk). Dog bites: prophylaxis not universally required for superficial wounds in healthy patients. Rabies PEP: consult local health department; bat, raccoon, skunk, fox — high-risk; vaccinated dogs/cats — low risk but evaluate. Tetanus prophylaxis. Human bites on hands (clenched fist injury — "fight bite"): high infection risk, explore wound to check for extensor tendon/joint involvement.',
  },

];
