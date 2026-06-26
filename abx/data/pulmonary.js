'use strict';
const ABX_PULMONARY = [

  {
    id:'copd-exac', cat:'pulmonary',
    name:'COPD Exacerbation (Infectious)', organism:'H. influenzae, M. catarrhalis, S. pneumoniae; Pseudomonas if severe/frequent exacerbator',
    source:'GOLD 2024',
    regimens:[
      {label:'Mild–moderate (outpatient)', cls:'fl', drugs:[
        {name:'Amoxicillin-clavulanate', dose:'875/125 mg PO BID × 5–7 days', note:'Preferred for broad coverage'},
        {name:'Azithromycin', dose:'500 mg PO day 1, then 250 mg days 2–5  or  500 mg PO daily × 3 days', note:'Alternative; QTc risk — check ECG if cardiac disease'},
        {name:'Doxycycline', dose:'100 mg PO BID × 5–7 days'},
      ]},
      {label:'Severe (hospitalized, no Pseudomonas risk)', drugs:[
        {name:'Ampicillin-sulbactam', dose:'3 g IV q6h × 5–7 days'},
        {name:'Ceftriaxone', dose:'1–2 g IV q24h × 5–7 days'},
        {name:'Levofloxacin', dose:'750 mg IV/PO daily × 5 days'},
      ]},
      {label:'Severe + Pseudomonas risk factors', cls:'allergy', drugs:[
        {name:'Piperacillin-tazobactam', dose:'4.5 g IV q6h', note:'Pseudomonas risk: recent hospitalization, frequent steroids, prior Pseudomonas isolation, structural lung disease (bronchiectasis)'},
        {name:'Cefepime', dose:'2 g IV q8h'},
        {name:'Ciprofloxacin', dose:'400 mg IV q8h  or  750 mg PO BID'},
      ]},
    ],
    notes:'Antibiotics only if ≥2 of 3 Anthonisen criteria (increased dyspnea, sputum volume, sputum purulence) — especially purulence. Add systemic corticosteroids (prednisone 40 mg PO daily × 5 days). Bronchodilators, oxygen. Assess for NIV in moderate-severe respiratory failure.',
  },

  {
    id:'cap-outpatient', cat:'pulmonary',
    name:'CAP — Outpatient', organism:'S. pneumoniae, M. pneumoniae, C. pneumoniae, H. influenzae, respiratory viruses',
    source:'IDSA/ATS 2007 (updated 2019)',
    regimens:[
      {label:'No comorbidities / no recent antibiotics', cls:'fl', drugs:[
        {name:'Amoxicillin', dose:'1 g PO TID × 5 days', note:'For typical bacterial CAP in otherwise healthy patients'},
        {name:'Doxycycline', dose:'100 mg PO BID × 5 days', note:'Alternative; covers atypicals'},
        {name:'Azithromycin', dose:'500 mg PO day 1, then 250 mg days 2–5', note:'Monotherapy only if local pneumococcal resistance <25%; high resistance in many US regions'},
      ]},
      {label:'With comorbidities (COPD, DM, CHF, malignancy, renal disease, recent antibiotics)', cls:'fl', drugs:[
        {name:'Amoxicillin-clavulanate', dose:'875/125 mg PO BID × 5 days  +  Azithromycin 500 mg day 1 then 250 mg days 2–5', note:'Beta-lactam + macrolide combination'},
        {name:'Respiratory fluoroquinolone (monotherapy)', note:''},
        {name:'Levofloxacin', dose:'750 mg PO daily × 5 days'},
        {name:'Moxifloxacin', dose:'400 mg PO daily × 5 days'},
      ]},
      {label:'PCN allergy', cls:'allergy', drugs:[
        {name:'Levofloxacin', dose:'750 mg PO daily × 5 days'},
        {name:'Moxifloxacin', dose:'400 mg PO daily × 5 days'},
        {name:'Doxycycline', dose:'100 mg PO BID × 5 days', note:'For atypical coverage; less reliable for S. pneumoniae'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Amoxicillin', dose:'500 mg PO TID × 5–7 days', note:'Avoid fluoroquinolones (teratogenic concerns) and doxycycline'},
        {name:'Amoxicillin-clavulanate + Azithromycin', dose:'875/125 mg BID + 500 mg day 1, 250 mg days 2–5', note:'If comorbidities present'},
      ]},
    ],
    notes:'Assess severity with PSI/PORT score or CURB-65 to guide outpatient vs. inpatient. CURB-65 0–1: outpatient; 2: inpatient preferred; ≥3: hospitalize. Outpatient criteria: CURB-65 0–1, no hypoxia, able to tolerate oral meds, social support. Treat for minimum 5 days; ensure afebrile ≥48h before stopping.',
  },

  {
    id:'cap-inpatient', cat:'pulmonary',
    name:'CAP — Inpatient', organism:'S. pneumoniae, H. influenzae, atypicals, S. aureus, Legionella (severe)',
    source:'IDSA/ATS 2007 (updated 2019)',
    regimens:[
      {label:'Non-ICU (standard ward)', cls:'fl', drugs:[
        {name:'Ceftriaxone', dose:'1–2 g IV q24h  +  Azithromycin 500 mg IV/PO daily', note:'Beta-lactam + macrolide; duration 5–7 days'},
        {name:'Levofloxacin', dose:'750 mg IV/PO daily × 5 days', note:'Monotherapy alternative (respiratory fluoroquinolone)'},
        {name:'Ampicillin-sulbactam', dose:'3 g IV q6h  +  Azithromycin 500 mg daily', note:'If ceftriaxone unavailable'},
      ]},
      {label:'ICU / severe CAP', drugs:[
        {name:'Ceftriaxone', dose:'2 g IV q24h  +  Azithromycin 500 mg IV daily', note:'Beta-lactam + macrolide'},
        {name:'Ceftriaxone', dose:'2 g IV q24h  +  Levofloxacin 750 mg IV daily', note:'If macrolide contraindicated (QTc prolongation)'},
      ]},
      {label:'Severe CAP + Pseudomonas risk', drugs:[
        {name:'Piperacillin-tazobactam', dose:'4.5 g IV q6h  +  Ciprofloxacin 400 mg IV q8h', note:'Risk factors: bronchiectasis, immunosuppression, prior Pseudomonas, recent hospitalization/antibiotics'},
        {name:'Cefepime', dose:'2 g IV q8h  +  Ciprofloxacin 400 mg IV q8h'},
      ]},
      {label:'Severe CAP + MRSA risk / cavitary / post-influenza', cls:'allergy', drugs:[
        {name:'Add Vancomycin', dose:'25–30 mg/kg IV loading, then AUC-guided', note:'MRSA risk: prior MRSA, post-influenza, necrotizing/cavitary infiltrates, SSTI'},
        {name:'Or Linezolid', dose:'600 mg IV/PO q12h', note:'Preferred if MRSA pneumonia confirmed (better lung penetration)'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Ceftriaxone', dose:'1–2 g IV q24h  +  Azithromycin 500 mg IV/PO daily', note:'Safe in all trimesters; avoid fluoroquinolones'},
      ]},
    ],
    notes:'Switch to PO when: improving clinically, afebrile × 24h, tolerating oral intake, O2 sat adequate on room air. Total duration 5–7 days for uncomplicated CAP; extend for Legionella (14 days), S. aureus/Pseudomonas (14–21 days). Legionella urinary antigen and pneumococcal urinary antigen for ICU/severe cases. Blood cultures × 2 for ICU or immunocompromised.',
  },

  {
    id:'hap', cat:'pulmonary',
    name:'Hospital-Acquired / Ventilator-Associated Pneumonia', organism:'S. aureus (MRSA), Pseudomonas, Klebsiella, Acinetobacter, Enterobacter (MDR risk)',
    source:'IDSA/ATS 2016',
    regimens:[
      {label:'HAP — no MDR risk factors, not critically ill', cls:'fl', drugs:[
        {name:'Piperacillin-tazobactam', dose:'4.5 g IV q6h × 7 days', note:'Antipseudomonal beta-lactam; add vancomycin if MRSA risk'},
        {name:'Cefepime', dose:'2 g IV q8h × 7 days'},
        {name:'Levofloxacin', dose:'750 mg IV daily × 7 days', note:'If beta-lactam allergy; poor anti-pseudomonal reliability'},
      ]},
      {label:'Add MRSA coverage (risk factors: prior MRSA, IV antibiotics in last 90 days, hospitalization ≥5 days, septic shock, ARDS, renal replacement therapy)', drugs:[
        {name:'Vancomycin', dose:'AUC-guided (target AUC/MIC 400–600)', note:'Add to anti-pseudomonal beta-lactam'},
        {name:'Linezolid', dose:'600 mg IV/PO q12h', note:'Non-inferior to vancomycin for MRSA pneumonia; preferred by some guidelines for better lung concentrations'},
      ]},
      {label:'MDR/XDR risk (prior IV antibiotics, resistant organism known, high local resistance)', cls:'allergy', drugs:[
        {name:'Meropenem', dose:'2 g IV q8h (extended 3h infusion)  or  Imipenem 500 mg IV q6h', note:'For ESBL, KPC-producing organisms; extended infusion improves pharmacodynamics'},
        {name:'+ Tobramycin or Amikacin', dose:'Tobramycin 5–7 mg/kg q24h  or  Amikacin 15–20 mg/kg q24h', note:'Add aminoglycoside for double gram-negative coverage in septic shock; short course (3–5 days)'},
        {name:'Ceftazidime-avibactam', dose:'2.5 g IV q8h', note:'For KPC-producing Klebsiella or MDR Pseudomonas — consult ID'},
      ]},
    ],
    notes:'IDSA 2016: de-escalation is critical — narrow therapy at 48–72h based on cultures. Duration: 7 days for most HAP/VAP (evidence supports shorter courses). Do NOT extend purely based on infiltrate resolution — clinical stability criteria guide duration. Procalcitonin-guided protocol reduces antibiotic exposure. Mini-BAL or endotracheal aspirates for culture (quantitative cultures preferred for VAP). Antimicrobial stewardship involvement recommended.',
  },

  {
    id:'aspiration-pneumonia', cat:'pulmonary',
    name:'Aspiration Pneumonia / Pneumonitis', organism:'Anaerobes (Bacteroides, Prevotella, Peptostreptococcus), oral streptococci, gram-negatives (hospital-acquired)',
    source:'IDSA/ATS 2019 / Mandell & Bennett',
    regimens:[
      {label:'Community-acquired aspiration pneumonia (anaerobic coverage)', cls:'fl', drugs:[
        {name:'Amoxicillin-clavulanate', dose:'875/125 mg PO BID × 5–7 days (outpatient)', note:'Preferred for outpatient; covers oral anaerobes and gram-positives'},
        {name:'Ceftriaxone + Metronidazole', dose:'Ceftriaxone 1–2 g IV q24h + Metronidazole 500 mg IV/PO q8h × 5–7 days', note:'Inpatient standard; metronidazole provides anaerobic coverage'},
        {name:'Moxifloxacin', dose:'400 mg IV/PO daily × 5–7 days', note:'Monotherapy; covers anaerobes and gram-positives; avoid if QTc prolonged'},
      ]},
      {label:'Hospital-acquired aspiration (broader gram-negative coverage)', drugs:[
        {name:'Piperacillin-tazobactam', dose:'4.5 g IV q6h', note:'Covers Pseudomonas, gram-negatives, anaerobes; preferred in hospitalized patients'},
        {name:'+ Vancomycin', dose:'AUC-guided', note:'Add if MRSA risk factors or poor response'},
      ]},
      {label:'Aspiration pneumonitis (chemical injury — no antibiotics needed acutely)', drugs:[
        {name:'Supportive care', note:'Aspiration of gastric acid (Mendelson syndrome): supplemental O2, positioning, bronchodilators. Antibiotics NOT indicated in first 24–48h unless clinical deterioration (fever, worsening infiltrate, purulent sputum)'},
        {name:'If infection develops: treat as aspiration pneumonia', note:'Start antibiotics if: fever persists >48h, worsening hypoxia, purulent secretions, or leukocytosis — suggests secondary bacterial pneumonia'},
      ]},
    ],
    notes:'Distinguish aspiration pneumonitis (chemical/gastric acid) from aspiration pneumonia (bacterial infection from oropharyngeal contents). Pneumonitis: acute, often self-resolving; antibiotics NOT routinely needed. Pneumonia: more indolent, often develops in dependent lung segments (superior lower lobes, posterior upper lobes). Consider anaerobic coverage when: altered consciousness (seizure, ETOH, anesthesia), significant dysphagia, poor dentition, putrid sputum. Corticosteroids are NOT indicated.',
  },

  {
    id:'lung-abscess', cat:'pulmonary',
    name:'Lung Abscess', organism:'Oral anaerobes (Peptostreptococcus, Fusobacterium, Prevotella), S. aureus (MRSA if hematogenous), Klebsiella (alcoholics)',
    source:'IDSA / ATS practice guidelines',
    regimens:[
      {label:'Primary (aspirated oral flora — anaerobic)', cls:'fl', drugs:[
        {name:'Amoxicillin-clavulanate', dose:'875/125 mg PO BID × 4–6 weeks', note:'Preferred oral option; covers anaerobes and gram-positives; oral therapy adequate for most primary lung abscesses'},
        {name:'Clindamycin', dose:'600 mg IV q8h (until improving), then 300–450 mg PO TID × 4–6 weeks total', note:'Historical first-line; still effective for anaerobic coverage; falling out of favor vs. amox-clav due to C. diff risk'},
        {name:'Ceftriaxone + Metronidazole', dose:'Ceftriaxone 2 g IV q24h + Metronidazole 500 mg IV/PO q8h', note:'IV option for hospitalized patients'},
      ]},
      {label:'Secondary / hematogenous (MRSA — SSTI, IVDU, post-influenza)', cls:'allergy', drugs:[
        {name:'Vancomycin', dose:'AUC-guided × 4–6 weeks', note:'For MRSA lung abscess'},
        {name:'Linezolid', dose:'600 mg IV/PO q12h × 4–6 weeks', note:'Superior lung penetration vs. vancomycin'},
      ]},
      {label:'Klebsiella pneumoniae (alcoholic patient, "currant jelly" sputum)', drugs:[
        {name:'Ceftriaxone', dose:'2 g IV q24h × 4–6 weeks', note:'Or meropenem if ESBL-producing strain'},
        {name:'Piperacillin-tazobactam', dose:'4.5 g IV q6h', note:'Broader option pending sensitivities'},
      ]},
    ],
    notes:'Most primary lung abscesses respond to prolonged antibiotics alone — surgery rarely needed (only for massive hemoptysis, empyema, fistula, failed medical therapy). Duration: 4–6 weeks minimum; longer if >6 cm or slow clinical response. Postural drainage, chest physiotherapy. CT-guided percutaneous drainage for large abscesses (>6 cm) failing antibiotics. Bronchoscopy: rules out obstructing lesion (malignancy) and aids drainage. Distinguish from empyema (pleural space) which requires tube thoracostomy.',
  },

];
