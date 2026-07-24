'use strict';
const ABX_ENT = [

  {
    id:'pharyngitis', cat:'ent',
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
    id:'otitis', cat:'ent',
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
    id:'otitis-externa', cat:'ent',
    name:'Otitis Externa (Swimmer\'s Ear)', organism:'P. aeruginosa, S. aureus; Aspergillus/Candida (malignant/diabetic)',
    source:'AAO-HNS 2014',
    regimens:[
      {label:'Uncomplicated (aural canal intact)', cls:'fl', drugs:[
        {name:'Ciprofloxacin 0.3% / dexamethasone 0.1% otic drops (Ciprodex)', dose:'4 drops in affected ear BID × 7 days', note:'Preferred — fluoroquinolone otic drops are most effective; dexamethasone reduces inflammation'},
        {name:'Ofloxacin 0.3% otic drops', dose:'10 drops in affected ear once daily × 7 days', note:'Alternative fluoroquinolone otic'},
        {name:'Acetic acid 2% otic (Vosol)', dose:'4–6 drops q4–6h × 7 days', note:'Mild infection; creates acidic environment hostile to bacteria/fungi'},
      ]},
      {label:'Tympanic membrane perforation', drugs:[
        {name:'Ciprofloxacin otic drops (non-ototoxic)', dose:'As above', note:'Non-ototoxic fluoroquinolone drops are safe with perforated TM; avoid aminoglycoside drops (neomycin) with perforation'},
      ]},
      {label:'Malignant (necrotizing) otitis externa — diabetic/immunocompromised', cls:'allergy', drugs:[
        {name:'Ciprofloxacin', dose:'750 mg PO BID × 6–8 weeks', note:'Anti-pseudomonal; oral route acceptable for malignant OE if no osteomyelitis'},
        {name:'Or Piperacillin-tazobactam', dose:'4.5 g IV q6h × 6–8 weeks', note:'IV for skull base osteomyelitis, cranial nerve involvement, systemic sepsis'},
      ]},
      {label:'Fungal (otomycosis)', drugs:[
        {name:'Acetic acid 2% otic drops', dose:'4–6 drops q8h × 7–14 days after thorough canal cleaning', note:'Primary treatment; antifungal drops (clotrimazole 1% solution) if refractory'},
        {name:'Clotrimazole 1% solution', dose:'3–4 drops BID × 7–14 days', note:'For Candida or Aspergillus — requires dry ear and thorough debridement'},
      ]},
    ],
    notes:'Aural toilet (gentle cleaning/suction) is essential. Ear canal wick placed if significant edema blocks drop delivery. Oral antibiotics NOT needed for uncomplicated OE. Malignant OE: elderly diabetic or immunocompromised with granulation tissue at the floor of the ear canal, severe otalgia, and cranial nerve palsies. MRI or CT for skull base extension. ENT referral for malignant OE. No swimming or water in ear during treatment.',
  },

  {
    id:'sinusitis', cat:'ent',
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
    id:'peritonsillar-abscess', cat:'ent',
    name:'Peritonsillar Abscess', organism:'S. pyogenes (GAS), anaerobes (Fusobacterium, Prevotella), S. aureus',
    source:'AAO-HNS / IDSA guidance',
    regimens:[
      {label:'After drainage (primary treatment)', cls:'fl', drugs:[
        {name:'Amoxicillin-clavulanate', dose:'875/125 mg PO BID × 10 days', note:'Covers GAS + anaerobes; preferred after I&D or needle aspiration'},
        {name:'Clindamycin', dose:'300 mg PO TID × 10 days', note:'Alternative; excellent anaerobic and GAS coverage'},
      ]},
      {label:'Severe (systemic illness, hospitalized)', drugs:[
        {name:'Ampicillin-sulbactam', dose:'3 g IV q6h', note:'Until able to swallow PO; transition to oral amox-clav'},
        {name:'+ Clindamycin', dose:'600–900 mg IV q8h', note:'If necrotizing or Fusobacterium (Lemierre syndrome) concern'},
      ]},
      {label:'PCN allergy', cls:'allergy', drugs:[
        {name:'Clindamycin', dose:'300–450 mg PO TID × 10 days'},
        {name:'Or Metronidazole + Azithromycin', dose:'Metronidazole 500 mg PO TID + Azithromycin 500 mg PO daily × 10 days', note:'For PCN anaphylaxis'},
      ]},
    ],
    notes:'Drainage (needle aspiration or I&D) is the primary treatment — antibiotics are adjunctive. Needle aspiration is well-tolerated in the ED and equally effective as surgical I&D. Tonsillectomy (quinsy tonsillectomy) for recurrent PTA or airway compromise. Lemierre syndrome: septic thrombophlebitis of the internal jugular vein — Fusobacterium necrophorum; presents with neck swelling, septic pulmonary emboli; treat with prolonged antibiotics and anticoagulation (controversial). Airway assessment is critical — consider ENT consultation.',
  },

  {
    id:'epiglottitis', cat:'ent',
    name:'Epiglottitis (Supraglottitis)', organism:'H. influenzae type b (unvaccinated), Streptococcus spp., S. aureus; Group A Strep (adults)',
    source:'IDSA / ACEP / Airway management guidelines',
    regimens:[
      {label:'Standard empiric (after airway secured)', cls:'fl', drugs:[
        {name:'Ceftriaxone', dose:'2 g IV q24h × 7–10 days', note:'Covers H. influenzae and streptococcal species'},
        {name:'+ Vancomycin', dose:'AUC-guided', note:'Add if MRSA risk or no response to ceftriaxone'},
        {name:'Ampicillin-sulbactam', dose:'3 g IV q6h × 7–10 days', note:'Alternative; broader anaerobic coverage'},
      ]},
      {label:'PCN allergy', cls:'allergy', drugs:[
        {name:'Levofloxacin', dose:'750 mg IV daily × 7–10 days'},
        {name:'Aztreonam', dose:'2 g IV q8h  +  Vancomycin (AUC-guided)', note:'For severe PCN/cephalosporin anaphylaxis'},
      ]},
    ],
    notes:'AIRWAY IS THE PRIORITY. Do NOT perform laryngoscopy or oropharyngeal examination in the ED without airway preparation — may precipitate complete obstruction. Symptoms: "hot potato" voice, drooling, tripod position, odynophagia, stridor. Soft-tissue lateral neck X-ray: "thumbprint sign." Direct nasopharyngoscopy in controlled setting (OR or ICU) for definitive diagnosis + airway. Dexamethasone (0.6 mg/kg IV) reduces edema and may prevent intubation. Adult epiglottitis often less dramatic — can be managed with IV antibiotics and close monitoring without intubation if stable. Pediatric: treat as complete obstruction until proven otherwise.',
  },

];
