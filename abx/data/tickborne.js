'use strict';
const ABX_TICKBORNE = [

  {
    id:'lyme', cat:'tickborne',
    name:'Lyme Disease', organism:'Borrelia burgdorferi (USA); B. afzelii, B. garinii (Europe)',
    source:'IDSA 2020',
    regimens:[
      {label:'Early localized (EM rash, no systemic symptoms)', cls:'fl', drugs:[
        {name:'Doxycycline', dose:'100 mg PO BID × 10 days  or  200 mg PO daily × 10 days', note:'Preferred — also covers Anaplasma (common co-infection); avoid in children <8 and pregnancy'},
        {name:'Amoxicillin', dose:'500 mg PO TID × 14 days', note:'Children <8 and pregnancy'},
        {name:'Cefuroxime axetil', dose:'500 mg PO BID × 14 days', note:'Alternative for adults with PCN/doxy allergy/intolerance'},
      ]},
      {label:'Early disseminated — facial palsy (isolated)', drugs:[
        {name:'Doxycycline', dose:'100 mg PO BID × 14–21 days', note:'Oral treatment adequate for isolated facial nerve palsy; LP not required unless meningeal signs'},
        {name:'Amoxicillin or Cefuroxime', dose:'As above × 14–21 days', note:'If doxycycline not tolerated'},
      ]},
      {label:'Lyme meningitis / radiculopathy / carditis (AV block)', drugs:[
        {name:'Ceftriaxone', dose:'2 g IV q24h × 14–21 days', note:'Preferred for CNS Lyme and symptomatic cardiac disease requiring hospitalization'},
        {name:'Doxycycline', dose:'100 mg PO BID × 14–21 days', note:'Acceptable oral alternative for meningitis in adults able to take PO'},
        {name:'Penicillin G', dose:'18–24 million units IV/day (continuous or divided q4h) × 14–21 days'},
      ]},
      {label:'Lyme arthritis (uncomplicated)', drugs:[
        {name:'Doxycycline', dose:'100 mg PO BID × 28 days', note:'Oral therapy preferred for uncomplicated Lyme arthritis'},
        {name:'Amoxicillin', dose:'500 mg PO TID × 28 days'},
      ]},
      {label:'Refractory Lyme arthritis (persistent despite oral course)', drugs:[
        {name:'Ceftriaxone', dose:'2 g IV q24h × 28 days', note:'One IV course for refractory arthritis; if still refractory after IV, likely post-Lyme inflammatory — NSAIDS/DMARDS, not more antibiotics'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Amoxicillin', dose:'500 mg PO TID × 14 days (early localized)', note:'Doxycycline contraindicated in pregnancy'},
        {name:'Ceftriaxone', dose:'2 g IV q24h × 14–21 days (CNS/disseminated)', note:'Recommended; treat promptly — vertical transmission risk'},
      ]},
    ],
    notes:'Prophylaxis after tick bite: doxycycline 200 mg PO single dose if: Ixodes scapularis tick, attached ≥36h (engorged), endemic area, started within 72h of removal. Do NOT test tick — not validated. Serologic testing (ELISA + Western blot) indicated for disseminated disease; may be negative early localized (clinical diagnosis). "Chronic Lyme" / post-treatment Lyme disease syndrome: prolonged antibiotics are NOT recommended — no evidence of persistent infection.',
  },

  {
    id:'rmsf', cat:'tickborne',
    name:'RMSF / Ehrlichiosis / Anaplasmosis', organism:'Rickettsia rickettsii (RMSF), Ehrlichia spp., Anaplasma phagocytophilum',
    source:'CDC/IDSA guidance',
    regimens:[
      {label:'Treatment (ALL ages — doxycycline is drug of choice)', cls:'fl', drugs:[
        {name:'Doxycycline', dose:'100 mg IV/PO BID (adults)  or  2.2 mg/kg IV/PO BID (children <45 kg)  × 5–7 days  or  until afebrile × 3 days', note:'IDSA and CDC: doxycycline is preferred at ALL ages including children — benefit far outweighs tooth staining risk for a potentially fatal disease'},
      ]},
      {label:'PCN allergy or doxycycline truly unavailable', cls:'allergy', drugs:[
        {name:'Chloramphenicol', dose:'500 mg IV/PO QID × 7–10 days', note:'Significantly inferior to doxycycline; used only if doxycycline truly contraindicated. NOT recommended in pregnancy (gray baby syndrome)'},
      ]},
    ],
    notes:'DO NOT DELAY TREATMENT PENDING CONFIRMATORY TESTING. RMSF diagnosis is clinical — start doxycycline immediately if any suspicion. Mortality without treatment: ~25%. Mortality with treatment: <5%. Rash may not appear until 3–5 days (spotted; petechial in severe). Classic triad: fever + headache + rash. Thrombocytopenia + elevated LFTs supportive. Confirmatory testing: acute and convalescent serology (IFA) or PCR from skin biopsy. Ehrlichiosis and Anaplasmosis: same treatment (doxycycline); Ehrlichia more common in Southeast/South-Central US; Anaplasma in Upper Midwest/Northeast.',
  },

  {
    id:'babesiosis', cat:'tickborne',
    name:'Babesiosis', organism:'Babesia microti (USA Northeast/Midwest); B. divergens (Europe — more severe)',
    source:'IDSA 2021',
    regimens:[
      {label:'Mild–moderate (most immunocompetent patients)', cls:'fl', drugs:[
        {name:'Atovaquone', dose:'750 mg PO BID × 7–10 days', note:'With food (fat increases absorption)'},
        {name:'+ Azithromycin', dose:'500 mg PO day 1, then 250 mg PO daily × 7–10 days (or 500–1000 mg daily for immunocompromised)', note:'Atovaquone + azithromycin: preferred for mild-moderate disease — fewer side effects than clindamycin + quinine'},
      ]},
      {label:'Severe / immunocompromised', drugs:[
        {name:'Clindamycin', dose:'600 mg IV/PO q8h × 7–10 days', note:'Classic regimen; greater toxicity but for severe disease'},
        {name:'+ Quinine', dose:'650 mg PO q6–8h × 7–10 days', note:'Combination clindamycin + quinine for severe disease; quinine side effects: cinchonism (tinnitus, headache, dizziness)'},
        {name:'Exchange transfusion (adjunctive for high parasitemia)', note:'Consider if: parasitemia ≥10%, severe hemolysis, ARDS, or organ failure — consult hematology/blood bank'},
      ]},
      {label:'Prolonged / relapsing (immunocompromised — asplenic, HIV, B-cell depleted)', drugs:[
        {name:'Atovaquone + Azithromycin × ≥6 weeks', note:'Longer course for immunocompromised; may require months of therapy; test for cure by negative blood smear/PCR'},
        {name:'Atovaquone resistance: add Clindamycin + Quinine', note:'Resistance emerging; if parasitemia not declining after 7 days, suspect resistance'},
      ]},
    ],
    notes:'Transmitted by Ixodes scapularis (same tick as Lyme disease) — co-infection with Lyme and Anaplasma possible; test for all three in endemic area. Diagnosis by thick and thin blood smear (intraerythrocytic ring forms, tetrads/"Maltese cross"). PCR more sensitive for low parasitemia. Severity predictors: age >50, asplenia, immunosuppression, parasitemia >10%. Most immunocompetent patients have mild self-limited illness (may not require treatment). Asplenic patients can have fulminant disease with >80% parasitemia. Duration: ≥7–10 days OR at least 2 weeks after parasitemia is undetectable — whichever is longer.',
  },

];
