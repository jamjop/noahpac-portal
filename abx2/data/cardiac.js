'use strict';
const ABX_CARDIAC = [

  {
    id:'endocarditis-native', cat:'cardiac',
    name:'Infective Endocarditis — Native Valve (Empiric)', organism:'S. aureus (most common), viridans Streptococcus, Enterococcus, HACEK organisms',
    source:'AHA 2015 / ESC 2023',
    regimens:[
      {label:'Empiric (pending cultures)', cls:'fl', drugs:[
        {name:'Vancomycin', dose:'25–30 mg/kg IV loading dose, then AUC-guided (target AUC/MIC 400–600)', note:'Covers MRSA and streptococci'},
        {name:'+ Ceftriaxone', dose:'2 g IV q24h', note:'Add for HACEK and some gram-negative organisms; also improves enterococcal coverage (synergy)'},
      ]},
      {label:'MSSA confirmed (Staph aureus, methicillin-sensitive)', drugs:[
        {name:'Nafcillin / Oxacillin', dose:'2 g IV q4h × 4–6 weeks', note:'Preferred for MSSA — superior to vancomycin for methicillin-sensitive strains'},
        {name:'Cefazolin', dose:'2 g IV q8h × 4–6 weeks', note:'Alternative if PCN allergy (non-anaphylactic)'},
      ]},
      {label:'MRSA confirmed', drugs:[
        {name:'Vancomycin', dose:'AUC-guided × 6 weeks', note:'Duration: 6 weeks for native valve; longer for complications'},
        {name:'Daptomycin', dose:'8–10 mg/kg IV q24h', note:'Alternative; do NOT use for pulmonary septic emboli (inactivated by surfactant)'},
      ]},
      {label:'Viridans Streptococcus (PCN-sensitive, MIC ≤0.12)', drugs:[
        {name:'Penicillin G', dose:'12–18 million units IV/day × 4 weeks  or  2 weeks with gentamicin', note:'High-sensitivity streptococcal IE'},
        {name:'Ceftriaxone', dose:'2 g IV q24h × 4 weeks', note:'Convenient once-daily; equivalent outcomes'},
      ]},
      {label:'Enterococcus (PCN-sensitive)', drugs:[
        {name:'Ampicillin', dose:'2 g IV q4h  +  Ceftriaxone 2 g IV q12h × 6 weeks', note:'Preferred synergistic combination — avoids aminoglycoside nephrotoxicity; ampicillin + ceftriaxone equivalent to ampicillin + gentamicin'},
        {name:'Ampicillin', dose:'2 g IV q4h  +  Gentamicin 1 mg/kg IV q8h × 4–6 weeks', note:'Traditional synergy; nephrotoxicity risk — monitor levels'},
      ]},
      {label:'PCN allergy — anaphylaxis', cls:'allergy', drugs:[
        {name:'Vancomycin', dose:'AUC-guided × 4–6 weeks', note:'For streptococcal IE in PCN-allergic; inferior to beta-lactam but acceptable'},
        {name:'Daptomycin', dose:'8–10 mg/kg IV q24h', note:'Alternative for staphylococcal/enterococcal IE'},
      ]},
    ],
    notes:'Blood cultures × 3 (from different sites) before antibiotics. Echocardiogram (TEE preferred over TTE for sensitivity). Mandatory ID consult. Cardiothoracic surgery consult for: HF due to valve dysfunction, periannular abscess/fistula, embolic events, fungal IE, persistently positive cultures. Duration: 4–6 weeks; 6 weeks for MRSA, prosthetic valve, complicated disease. Dental prophylaxis: amoxicillin 2 g PO 30–60 min before dental procedures for high-risk valve lesions.',
  },

  {
    id:'endocarditis-prosthetic', cat:'cardiac',
    name:'Infective Endocarditis — Prosthetic Valve (PVE)', organism:'Early (<60 days post-surgery): CoNS, S. aureus; Late: viridans Streptococcus, CoNS, Enterococcus; HACEK',
    source:'AHA 2015 / ESC 2023',
    regimens:[
      {label:'Empiric — ALL PVE (broader coverage required)', cls:'fl', drugs:[
        {name:'Vancomycin', dose:'25–30 mg/kg IV loading, then AUC-guided', note:'MRSA and CoNS coverage; start empirically in all PVE'},
        {name:'+ Rifampin', dose:'300 mg PO/IV q8h', note:'Rifampin added for all PVE after bacteremia cleared (NOT during acute bacteremia — may be antagonistic); penetrates biofilm'},
        {name:'+ Gentamicin', dose:'1 mg/kg IV q8h × 2 weeks (initial synergy phase)', note:'Aminoglycoside synergy for first 2 weeks; monitor levels and renal function closely'},
        {name:'+ Ceftriaxone', dose:'2 g IV q24h', note:'Add for gram-negative / HACEK coverage if source unknown'},
      ]},
      {label:'MRSA prosthetic valve endocarditis', drugs:[
        {name:'Vancomycin', dose:'AUC-guided × 6 weeks minimum', note:'After bacteremia cleared (≥5 days negative cultures) add Rifampin 300 mg PO TID + Gentamicin 1 mg/kg q8h × 2 weeks'},
        {name:'+ Rifampin', dose:'300 mg PO TID (start after bacteremia cleared)', note:'Rifampin increases in vitro activity against biofilm; adds oral convenience'},
      ]},
      {label:'Viridans Streptococcus / HACEK (late PVE)', drugs:[
        {name:'Ceftriaxone', dose:'2 g IV q24h × 6 weeks', note:'For late-onset viridans streptococcal or HACEK PVE'},
        {name:'+ Gentamicin × 2 weeks', note:'For streptococcal: penicillin-susceptible strains may not need gentamicin'},
      ]},
      {label:'CoNS (coagulase-negative Staph — most common early PVE)', drugs:[
        {name:'Vancomycin', dose:'AUC-guided × 6 weeks'},
        {name:'+ Rifampin', dose:'300 mg PO TID (add after bacteremia cleared) × 6 weeks'},
        {name:'+ Gentamicin', dose:'1 mg/kg IV q8h × 2 weeks (synergy phase)'},
      ]},
    ],
    notes:'PVE carries 20–40% in-hospital mortality. Cardiac surgery consultation is mandatory at diagnosis — earlier surgery for PVE than NVE is generally recommended. Absolute surgical indications: heart failure, periannular extension (abscess, fistula), new heart block, fungal PVE, relapsing/persistent PVE. Rifampin is essential for PVE due to its biofilm penetration — but must NOT be started until bacteremia is cleared (rifampin resistance selects rapidly in presence of active bacteremia). Blood cultures every 48h until negative. TEE mandatory — TTE is inadequate for PVE diagnosis.',
  },

  {
    id:'pericarditis', cat:'cardiac',
    name:'Acute Pericarditis', organism:'Viral (most common — Coxsackievirus, Echovirus, adenovirus); Bacterial (S. aureus, S. pneumoniae, Mycobacterium — rare)',
    source:'ESC 2015 Guidelines',
    regimens:[
      {label:'Viral / idiopathic pericarditis (treatment)', cls:'fl', drugs:[
        {name:'Aspirin', dose:'750–1000 mg PO q8h × 1–2 weeks (taper over 3–4 weeks)', note:'First-line anti-inflammatory; colchicine added to reduce recurrence'},
        {name:'OR Ibuprofen', dose:'600 mg PO q8h × 1–2 weeks (taper)', note:'Alternative NSAID; fewer gastric side effects than aspirin'},
        {name:'+ Colchicine', dose:'0.5 mg PO BID × 3 months (weight ≥70 kg)  or  0.5 mg daily (weight <70 kg)', note:'Added to NSAID — halves recurrence rate (COPE trial, ICAP trial); continue 3 months for first episode'},
      ]},
      {label:'Bacterial purulent pericarditis (rare — requires drainage)', cls:'allergy', drugs:[
        {name:'Vancomycin', dose:'AUC-guided  +  Ceftriaxone 2 g IV q24h', note:'Empiric; purulent pericarditis is a medical/surgical emergency'},
        {name:'+ Metronidazole', dose:'500 mg IV q8h', note:'Add if suspect anaerobic source (thoracic/esophageal infection)'},
        {name:'DRAINAGE is mandatory', note:'Pericardiocentesis or pericardial window — pus in the pericardium must be drained; antibiotics alone are insufficient'},
      ]},
      {label:'Tuberculous pericarditis', drugs:[
        {name:'Standard TB therapy: RIPE', dose:'Isoniazid 300 mg + Rifampin 600 mg + Pyrazinamide 30 mg/kg + Ethambutol 20 mg/kg × 2 months, then Isoniazid + Rifampin × 4 months', note:'Same regimen as pulmonary TB; total 6 months'},
        {name:'+ Prednisone', dose:'120 mg PO daily × 4 weeks, then taper over 4 weeks', note:'Adjunctive corticosteroids reduce risk of constrictive pericarditis; WHO recommends in all TB pericarditis'},
      ]},
      {label:'Steroids (second-line — only for specific indications)', drugs:[
        {name:'Prednisone', dose:'0.25–0.5 mg/kg/day (taper slowly over 3–6 months)', note:'Use ONLY for: colchicine-refractory cases, contraindication to NSAIDs, autoimmune etiology. Avoid steroids for first-episode viral/idiopathic — increases recurrence risk'},
      ]},
    ],
    notes:'Viral/idiopathic pericarditis: rest and activity restriction until asymptomatic and CRP normalized. Athletes: restrict from competitive sports for minimum 3 months. Diagnostic criteria for acute pericarditis: ≥2 of: pericarditic chest pain, pericardial friction rub, new widespread ST elevation / PR depression, new pericardial effusion. Cardiac MRI if diagnosis uncertain. Complications: cardiac tamponade (hypotension + JVD + muffled heart sounds = Beck\'s triad), constrictive pericarditis (late complication of recurrent/TB pericarditis).',
  },

];
