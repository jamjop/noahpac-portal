'use strict';
const ABX_CNS = [

  {
    id:'meningitis', cat:'cns',
    name:'Bacterial Meningitis — Empiric', organism:'N. meningitidis, S. pneumoniae, L. monocytogenes (immunocompromised/elderly)',
    source:'IDSA 2004 / 2017 HAI update',
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
    id:'brain-abscess', cat:'cns',
    name:'Brain Abscess', organism:'Streptococcus milleri group, anaerobes, gram-negatives; S. aureus (post-trauma/surgery); Toxoplasma (HIV)',
    source:'IDSA 2004 / Neurosurgical literature',
    regimens:[
      {label:'Empiric (unknown source)', cls:'fl', drugs:[
        {name:'Ceftriaxone', dose:'2 g IV q12h', note:'Broad gram-positive and gram-negative coverage'},
        {name:'+ Metronidazole', dose:'500 mg IV q8h', note:'Essential for anaerobic coverage (dental/otogenic source)'},
        {name:'+ Vancomycin', dose:'AUC-guided dosing', note:'Add if: post-neurosurgery, trauma, MRSA risk, or hematogenous from skin source'},
      ]},
      {label:'Post-neurosurgical / trauma', drugs:[
        {name:'Vancomycin', dose:'AUC-guided  +  Cefepime 2 g IV q8h  +  Metronidazole 500 mg IV q8h', note:'Broader gram-negative coverage for Pseudomonas risk; cover MRSA'},
        {name:'Or Meropenem', dose:'2 g IV q8h  +  Vancomycin', note:'If MDR gram-negatives suspected'},
      ]},
      {label:'HIV/immunocompromised — Toxoplasma', drugs:[
        {name:'Pyrimethamine', dose:'200 mg PO loading, then 50–75 mg daily', note:'First-line for cerebral toxoplasmosis in HIV'},
        {name:'+ Sulfadiazine', dose:'1–1.5 g PO q6h'},
        {name:'+ Leucovorin', dose:'10–25 mg PO daily (folic acid rescue)'},
        {name:'Duration: 6 weeks acute, then lifelong suppression until CD4 >200 × 6 months', note:''},
      ]},
      {label:'PCN allergy', cls:'allergy', drugs:[
        {name:'Meropenem', dose:'2 g IV q8h  +  Metronidazole 500 mg IV q8h  +  Vancomycin'},
      ]},
    ],
    notes:'Neurosurgical consultation mandatory — most abscesses require aspiration or excision for diagnosis and drainage. Empiric antibiotics appropriate before surgery only if patient is deteriorating rapidly. Duration: 4–8 weeks IV antibiotics typically required; longer for multiple/large abscesses. MRI with contrast preferred over CT. Follow up with serial imaging. Steroids (dexamethasone) only for significant mass effect/herniation risk — may reduce antibiotic penetration and alter imaging.',
  },

  {
    id:'spinal-epidural-abscess', cat:'cns',
    name:'Spinal Epidural Abscess', organism:'S. aureus (most common ~60–70%), gram-negatives (IVDU, post-procedure), Streptococcus',
    source:'IDSA / Spine surgery literature',
    regimens:[
      {label:'Empiric — MRSA coverage required', cls:'fl', drugs:[
        {name:'Vancomycin', dose:'25–30 mg/kg IV loading, then AUC-guided (target AUC/MIC 400–600)', note:'MRSA coverage is mandatory — S. aureus is the dominant pathogen'},
        {name:'+ Ceftriaxone', dose:'2 g IV q24h', note:'Add gram-negative coverage for: IVDU, post-procedure, urinary/GI source'},
        {name:'Or + Cefepime', dose:'2 g IV q8h', note:'Instead of ceftriaxone if Pseudomonas risk (IVDU, nosocomial, structural spine disease)'},
      ]},
      {label:'MSSA confirmed (step-down)', drugs:[
        {name:'Nafcillin / Oxacillin', dose:'2 g IV q4h × 6–8 weeks', note:'Superior to vancomycin for MSSA'},
        {name:'Cefazolin', dose:'2 g IV q8h × 6–8 weeks', note:'Alternative; IV infusion center-friendly'},
      ]},
      {label:'MRSA confirmed', drugs:[
        {name:'Vancomycin', dose:'AUC-guided × 6–8 weeks'},
        {name:'Daptomycin', dose:'6–8 mg/kg IV q24h', note:'Alternative; good bone/soft tissue penetration'},
      ]},
    ],
    notes:'Neurosurgical / spine surgery emergency — neurological deficits can progress rapidly to permanent paralysis. URGENT MRI spine with/without contrast. Surgical decompression (laminectomy/evacuation) for any neurological deficit, failure of medical therapy, or clinical deterioration. Conservative (antibiotics alone) only if: no deficit, stable imaging, poor surgical candidate, complete paraplegia >24–72h (poor surgical prognosis). Duration: 6–8 weeks IV; may shorten with oral step-down (OVIVA criteria). Blood cultures × 2 and CT-guided needle aspiration before antibiotics when possible (but do NOT delay if deficits present).',
  },

  {
    id:'hsv-encephalitis', cat:'cns',
    name:'HSV / Viral Encephalitis', organism:'HSV-1 (most common viral encephalitis in adults), HSV-2 (neonatal), VZV (immunocompromised)',
    source:'IDSA 2008 (updated) / ESCMID',
    regimens:[
      {label:'HSV encephalitis — empiric and confirmed', cls:'fl', drugs:[
        {name:'Acyclovir', dose:'10 mg/kg IV q8h × 14–21 days', note:'Standard adult dose; renally dose-adjusted (CrCl <50). Start IMMEDIATELY on clinical suspicion — do not wait for PCR result'},
        {name:'HSV-2 neonatal encephalitis', dose:'Acyclovir 20 mg/kg IV q8h × 21 days', note:'Higher dose for neonates; follow with oral acyclovir suppression'},
      ]},
      {label:'VZV encephalitis/vasculopathy', drugs:[
        {name:'Acyclovir', dose:'10–15 mg/kg IV q8h × 14 days', note:'For VZV encephalitis; longer duration for vasculopathy'},
        {name:'+ Prednisone', dose:'1 mg/kg/day × 5 days (for VZV vasculopathy)', note:'Adjunctive steroid for VZV-associated vasculopathy only'},
      ]},
      {label:'EBV / CMV (immunocompromised)', drugs:[
        {name:'CMV: Ganciclovir', dose:'5 mg/kg IV q12h × 14–21 days', note:'CMV encephalitis in immunocompromised'},
        {name:'Or Foscarnet', dose:'90 mg/kg IV q12h', note:'If ganciclovir resistance or toxicity'},
      ]},
      {label:'Empiric bacterial cover (if diagnosis uncertain)', drugs:[
        {name:'Add Ceftriaxone + Vancomycin', dose:'Until bacterial meningitis excluded by CSF culture (≥48–72h)', note:'Cover bacterial meningitis empirically until results available'},
      ]},
    ],
    notes:'Start acyclovir empirically for any patient with fever + altered mental status + CSF pleocytosis — HSV encephalitis has ~70% mortality untreated. LP: lymphocytic pleocytosis, elevated protein, normal/low glucose. HSV CSF PCR sensitivity ~96% — can discontinue acyclovir if PCR negative after 72h AND clinical picture not strongly HSV. MRI: temporal lobe involvement highly suggestive of HSV. EEG: periodic lateralizing epileptiform discharges (PLEDs) in HSV. Adjunctive dexamethasone has no proven benefit for HSV encephalitis (unlike bacterial meningitis).',
  },

];
