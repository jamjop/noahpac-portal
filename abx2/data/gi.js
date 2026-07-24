'use strict';
const ABX_GI = [

  {
    id:'cdi', cat:'gi',
    name:'Clostridioides difficile Infection (CDI)', organism:'Clostridioides difficile (toxin-producing)',
    source:'IDSA/SHEA 2021',
    regimens:[
      {label:'Non-severe (first episode)', cls:'fl', drugs:[
        {name:'Fidaxomicin', dose:'200 mg PO BID × 10 days', note:'Preferred over vancomycin — lower recurrence rate, especially for non-ribotype 027 strains'},
        {name:'Vancomycin (oral)', dose:'125 mg PO QID × 10 days', note:'Alternative to fidaxomicin; systemic vancomycin has NO activity against C. diff'},
      ]},
      {label:'Severe (WBC ≥15,000 or Cr ≥1.5 mg/dL)', drugs:[
        {name:'Vancomycin (oral)', dose:'125 mg PO QID × 10 days', note:'Use oral (not IV) vancomycin — IV has no luminal activity'},
        {name:'Fidaxomicin', dose:'200 mg PO BID × 10 days', note:'Preferred if available — equivalent or better outcomes'},
      ]},
      {label:'Fulminant (hypotension, shock, ileus, megacolon)', cls:'allergy', drugs:[
        {name:'Vancomycin (oral/NG)', dose:'500 mg PO/NG QID × 10 days'},
        {name:'+ Metronidazole', dose:'500 mg IV q8h', note:'Add IV metronidazole only in fulminant disease (systemic adjunct)'},
        {name:'± Vancomycin enema', dose:'500 mg in 100 mL NS q6h PR', note:'If ileus — can\'t rely on PO reaching colon'},
      ]},
      {label:'First recurrence', drugs:[
        {name:'Fidaxomicin', dose:'200 mg PO BID × 10 days', note:'Preferred over vancomycin for first recurrence'},
        {name:'Vancomycin extended/tapered pulsed', dose:'125 mg QID × 10–14 days → BID × 7 days → daily × 7 days → q2–3 days × 2–8 weeks', note:'If fidaxomicin not available or initial treatment was vancomycin'},
      ]},
      {label:'Subsequent recurrences', drugs:[
        {name:'Fecal Microbiota Transplant (FMT)', note:'Highly effective for multiply-recurrent CDI; standard of care ≥2 recurrences'},
        {name:'Bezlotoxumab (Zinplava)', dose:'10 mg/kg IV single infusion (during antibiotic course)', note:'Monoclonal anti-toxin B; reduces recurrence risk; use for high-risk patients'},
        {name:'Rifaximin', dose:'400 mg PO TID × 20 days after vancomycin course', note:'Adjunctive "chaser" strategy for recurrence prevention'},
      ]},
    ],
    notes:'Metronidazole is NO LONGER first-line per IDSA 2021 (inferior to vancomycin/fidaxomicin in trials). Discontinue offending antibiotics ASAP. Avoid anti-motility agents (loperamide, opioids) — may precipitate toxic megacolon. Isolate patient (contact precautions, private room). Test only symptomatic patients (≥3 loose stools/day). Do not test asymptomatic patients or test of cure after treatment. Hand washing with soap and water superior to alcohol-based sanitizer for C. diff spores.',
  },

  {
    id:'h-pylori', cat:'gi',
    name:'H. pylori Eradication', organism:'Helicobacter pylori',
    source:'ACG 2017 / Maastricht VI 2022',
    regimens:[
      {label:'Bismuth quadruple (preferred in high clarithromycin resistance regions)', cls:'fl', drugs:[
        {name:'Bismuth subsalicylate (Pepto-Bismol)', dose:'525 mg PO QID × 10–14 days'},
        {name:'+ Tetracycline', dose:'500 mg PO QID × 10–14 days'},
        {name:'+ Metronidazole', dose:'250–500 mg PO QID × 10–14 days'},
        {name:'+ PPI (any)', dose:'Standard dose BID × 10–14 days (e.g., omeprazole 20 mg BID)', note:'Also available as Pylera combination capsule (bismuth 140 mg/metronidazole 125 mg/tetracycline 125 mg) 3 caps QID + PPI BID'},
      ]},
      {label:'Clarithromycin triple (if local clarithromycin resistance <15%)', drugs:[
        {name:'Clarithromycin', dose:'500 mg PO BID × 10–14 days'},
        {name:'+ Amoxicillin', dose:'1 g PO BID × 10–14 days'},
        {name:'+ PPI', dose:'Standard dose BID × 10–14 days'},
      ]},
      {label:'Concomitant quadruple (non-bismuth)', drugs:[
        {name:'Clarithromycin', dose:'500 mg PO BID × 10–14 days'},
        {name:'+ Amoxicillin', dose:'1 g PO BID × 10–14 days'},
        {name:'+ Metronidazole', dose:'500 mg PO BID × 10–14 days'},
        {name:'+ PPI', dose:'Standard dose BID × 10–14 days'},
      ]},
      {label:'PCN allergy (penicillin-sparing)', cls:'allergy', drugs:[
        {name:'Bismuth quadruple with tetracycline (as above)', note:'No amoxicillin — safe for PCN-allergic patients'},
        {name:'Levofloxacin triple (second-line)', note:''},
        {name:'Levofloxacin', dose:'500 mg PO daily × 10–14 days'},
        {name:'+ Clarithromycin', dose:'500 mg PO BID × 10–14 days'},
        {name:'+ PPI', dose:'Standard dose BID'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Defer treatment until after delivery if possible', note:'Tetracycline contraindicated; clarithromycin relatively contraindicated; metronidazole caution in first trimester'},
        {name:'If treatment required: amoxicillin + metronidazole + PPI', dose:'Consult GI/OB', note:'Avoid bismuth and tetracycline'},
      ]},
    ],
    notes:'Confirm eradication with urea breath test or stool antigen test ≥4 weeks after completing therapy AND ≥2 weeks after stopping PPI. Test and treat all patients who test positive. Do not use serology for test of cure (remains positive years after eradication). Culture-guided susceptibility testing for treatment failures. In US, bismuth quadruple therapy is now the recommended first-line by ACG 2017 due to rising clarithromycin resistance.',
  },

  {
    id:'intraabdominal', cat:'gi',
    name:'Intra-abdominal Infection (Complicated)', organism:'E. coli, Klebsiella, Bacteroides fragilis, Enterococcus, Pseudomonas (healthcare-associated)',
    source:'IDSA/SIS 2010 (updated 2021)',
    regimens:[
      {label:'Community-acquired, mild–moderate', cls:'fl', drugs:[
        {name:'Ceftriaxone', dose:'1–2 g IV q24h  +  Metronidazole 500 mg IV q8h'},
        {name:'Ertapenem', dose:'1 g IV q24h', note:'Monotherapy option; covers gram-negatives and anaerobes, NOT Pseudomonas'},
        {name:'Moxifloxacin', dose:'400 mg IV/PO daily', note:'Monotherapy; good anaerobic coverage; caution with QTc'},
      ]},
      {label:'Healthcare-associated / severe / immunocompromised', drugs:[
        {name:'Piperacillin-tazobactam', dose:'4.5 g IV q6h (extended infusion preferred)', note:'Covers Pseudomonas; consider if nosocomial or ICU'},
        {name:'Meropenem', dose:'1 g IV q8h  or  Imipenem 500 mg IV q6h', note:'If ESBL concern, prior antibiotic exposure, or critically ill'},
        {name:'± Vancomycin or Linezolid', note:'Add for MRSA risk (prosthetic devices, prior MRSA, severe illness)'},
      ]},
      {label:'Enterococcus coverage (indicated if valve disease, immunocompromised, healthcare-associated)', drugs:[
        {name:'Add Ampicillin', dose:'2 g IV q4–6h', note:'For Enterococcus faecalis coverage'},
        {name:'Vancomycin', dose:'AUC-guided (if PCN allergic or E. faecium)', note:'For VRE: linezolid or daptomycin'},
      ]},
      {label:'PCN allergy — severe', cls:'allergy', drugs:[
        {name:'Aztreonam', dose:'2 g IV q8h  +  Metronidazole 500 mg IV q8h  +  Vancomycin (if MRSA risk)'},
        {name:'Ciprofloxacin', dose:'400 mg IV q8h  +  Metronidazole 500 mg IV q8h', note:'Only if local E. coli fluoroquinolone sensitivity acceptable'},
      ]},
    ],
    notes:'Source control is essential — antibiotics are adjunctive. Adequate drainage (percutaneous or surgical) is mandatory for abscesses and perforations. Duration: 4 days after source control for uncomplicated; 5–7 days typical. Do NOT continue antibiotics >7 days if source control achieved. Cultures from operative specimens guide de-escalation. Tertiary peritonitis (recurrent, hospital-acquired) may require Candida coverage — consider fluconazole.',
  },

  {
    id:'sbp', cat:'gi',
    name:'Spontaneous Bacterial Peritonitis (SBP)', organism:'E. coli, Klebsiella, S. pneumoniae; gram-positives in healthcare-acquired',
    source:'AASLD / EASL 2021',
    regimens:[
      {label:'Community-acquired SBP', cls:'fl', drugs:[
        {name:'Cefotaxime', dose:'2 g IV q8h × 5 days', note:'Gold standard; covers gram-negatives and streptococcal organisms'},
        {name:'Ceftriaxone', dose:'2 g IV q24h × 5 days', note:'Once-daily alternative; equivalent outcomes'},
      ]},
      {label:'Oral step-down (if improving and able to tolerate PO)', drugs:[
        {name:'Ciprofloxacin', dose:'500 mg PO BID (or 400 mg IV q12h) × 5 days total', note:'Oral option after initial IV response; only if non-healthcare-acquired and organism susceptible'},
        {name:'Ofloxacin', dose:'400 mg PO BID × 5 days', note:'Alternative oral fluoroquinolone for SBP step-down'},
      ]},
      {label:'Nosocomial / healthcare-acquired SBP', cls:'allergy', drugs:[
        {name:'Piperacillin-tazobactam', dose:'4.5 g IV q6h × 5 days', note:'Broader coverage for resistant organisms; MDR gram-negatives and Enterococcus'},
        {name:'Meropenem', dose:'1 g IV q8h × 5 days', note:'For ESBL or MDR concern; nosocomial SBP carries much higher rates of resistant organisms'},
      ]},
      {label:'Albumin (not an antibiotic — essential adjunct)', drugs:[
        {name:'IV Albumin 25%', dose:'1.5 g/kg IV on day 1, then 1 g/kg IV on day 3', note:'Reduces incidence of renal failure and in-hospital mortality by 33%; mandatory for patients with creatinine ≥1.0, BUN ≥30, or total bilirubin ≥4 mg/dL'},
      ]},
    ],
    notes:'SBP diagnosed by PMN count >250 cells/mm³ in ascitic fluid (even before culture results). Culture ascitic fluid at bedside into blood culture bottles (improves sensitivity to ~80%). Total duration: 5 days adequate for uncomplicated SBP. Secondary prophylaxis after first SBP: ciprofloxacin 500 mg PO daily or TMP-SMX DS daily (indefinitely until liver transplant or resolution of ascites). Primary prophylaxis: indicated if ascitic protein <1.5 g/dL + Child-Pugh C or renal dysfunction.',
  },

  {
    id:'cholangitis', cat:'gi',
    name:'Acute Cholangitis / Cholecystitis', organism:'E. coli, Klebsiella, Enterococcus, Bacteroides (biliary flora)',
    source:'Tokyo Guidelines 2018 (TG18)',
    regimens:[
      {label:'Mild–moderate cholangitis or cholecystitis', cls:'fl', drugs:[
        {name:'Ceftriaxone', dose:'2 g IV q24h  +  Metronidazole 500 mg IV q8h', note:'Covers gram-negatives and anaerobes; preferred for community-acquired'},
        {name:'Ampicillin-sulbactam', dose:'3 g IV q6h', note:'Covers Enterococcus (important in biliary tract infections); add if enterococcal sepsis suspected'},
        {name:'Piperacillin-tazobactam', dose:'4.5 g IV q6h', note:'Broader option if healthcare-associated or recent antibiotics'},
      ]},
      {label:'Severe (Grade III TG18 — organ dysfunction)', drugs:[
        {name:'Meropenem', dose:'1 g IV q8h', note:'Broad spectrum for severe/septic cholangitis'},
        {name:'Piperacillin-tazobactam', dose:'4.5 g IV q6h  ±  Vancomycin', note:'Add vancomycin if MRSA risk or healthcare-acquired'},
      ]},
      {label:'PCN allergy', cls:'allergy', drugs:[
        {name:'Ciprofloxacin', dose:'400 mg IV q12h  +  Metronidazole 500 mg IV q8h'},
        {name:'Aztreonam', dose:'2 g IV q8h  +  Metronidazole 500 mg IV q8h  +  Vancomycin'},
      ]},
    ],
    notes:'Biliary drainage is the cornerstone of treatment for cholangitis — ERCP preferred; percutaneous transhepatic cholangiography (PTC) or surgical drainage if ERCP fails. Grade III (severe) cholangitis: urgent drainage within 24h. Grade II (moderate): early drainage within 72h. Cholecystitis: laparoscopic cholecystectomy ideally within 72h of symptom onset (Tokyo Guidelines). Duration of antibiotics: 4–7 days after source control for cholangitis; 1–3 days after cholecystectomy for uncomplicated cholecystitis. Blood cultures × 2 and LFTs/bilirubin to assess severity.',
  },

  {
    id:'infectious-diarrhea', cat:'gi',
    name:'Infectious Diarrhea', organism:'Campylobacter, Salmonella, Shigella, E. coli O157:H7, Giardia, Cryptosporidium (depending on context)',
    source:'IDSA 2017',
    regimens:[
      {label:'Moderate–severe non-typhoid infection (empiric, high-risk patient)', cls:'fl', drugs:[
        {name:'Ciprofloxacin', dose:'500 mg PO BID × 3–5 days', note:'Empiric for moderate-severe traveler\'s diarrhea or immunocompromised; high resistance in South/Southeast Asia (Campylobacter)'},
        {name:'Azithromycin', dose:'1 g PO single dose  or  500 mg PO daily × 3 days', note:'Preferred for travelers returning from South/SE Asia, Campylobacter coverage, or fluoroquinolone resistance'},
      ]},
      {label:'Shigellosis', drugs:[
        {name:'Ciprofloxacin', dose:'500 mg PO BID × 3 days', note:'Check local/regional fluoroquinolone resistance rates'},
        {name:'Azithromycin', dose:'500 mg PO daily × 3 days  or  1 g single dose', note:'Alternative if fluoroquinolone resistance suspected'},
        {name:'Ceftriaxone', dose:'2 g IV daily × 2–5 days', note:'For severe/invasive disease or unable to tolerate PO'},
      ]},
      {label:'Campylobacter', drugs:[
        {name:'Azithromycin', dose:'500 mg PO daily × 3 days', note:'Preferred — significant fluoroquinolone resistance (>20–30% in many regions)'},
        {name:'Ciprofloxacin', dose:'500 mg PO BID × 3–5 days', note:'Only if known susceptibility'},
      ]},
      {label:'Giardia', drugs:[
        {name:'Metronidazole', dose:'500 mg PO TID × 5–7 days  or  250 mg PO TID × 7–10 days'},
        {name:'Tinidazole', dose:'2 g PO single dose', note:'Single-dose convenience; slightly superior efficacy'},
        {name:'Nitazoxanide', dose:'500 mg PO BID × 3 days', note:'Alternative; well tolerated'},
      ]},
      {label:'E. coli O157:H7 (STEC / HUS risk)', cls:'allergy', drugs:[
        {name:'Do NOT give antibiotics', note:'STEC diarrhea (bloody, no fever): antibiotics increase risk of HUS (hemolytic uremic syndrome) by releasing Shiga toxin — avoid antibiotics, fluoroquinolones especially'},
        {name:'Supportive care only', note:'IV fluids, avoid anti-motility agents; monitor renal function, CBC for HUS development'},
      ]},
    ],
    notes:'Most infectious diarrhea is self-limited — antibiotics not routinely indicated. Treat if: systemic illness (fever, bloody stool, duration >1 week), immunocompromised, traveler\'s diarrhea moderate-severe. Non-typhoid Salmonella: antibiotics may prolong carrier state — treat only if: systemic illness, immunocompromised, age <12 months or >50, valvular disease/prosthesis. Stool cultures indicated for: bloody diarrhea, fever, duration >3 days, recent hospitalization/antibiotics (C. diff), immunocompromised, outbreaks. Rehydration is the cornerstone of treatment.',
  },

];
