'use strict';
const ABX_GU = [

  {
    id:'uti', cat:'gu',
    name:'Uncomplicated UTI / Cystitis', organism:'E. coli (70–95%), K. pneumoniae, S. saprophyticus (young women)',
    source:'IDSA 2010',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Nitrofurantoin macrocrystals (Macrobid)', dose:'100 mg PO BID × 5 days', note:'Preferred; avoid if CrCl <30 mL/min or pyelonephritis (poor tissue penetration)'},
        {name:'Trimethoprim-sulfamethoxazole (TMP-SMX)', dose:'160/800 mg (DS) PO BID × 3 days', note:'Use only if local E. coli resistance <20%; check local antibiogram'},
        {name:'Fosfomycin trometamol', dose:'3 g PO single dose', note:'Alternative; excellent if ESBL suspected'},
      ]},
      {label:'Alternative (fluoroquinolone-sparing)', drugs:[
        {name:'Pivmecillinam', dose:'400 mg PO BID × 5–7 days', note:'If available; low collateral resistance impact'},
        {name:'Cephalexin', dose:'500 mg PO QID × 7 days', note:'Option if above agents not suitable'},
      ]},
      {label:'Fluoroquinolone — reserve (not first-line)', drugs:[
        {name:'Ciprofloxacin', dose:'250 mg PO BID × 3 days', note:'Reserve: collateral resistance, C. diff risk; use only if first-line agents not options'},
        {name:'Levofloxacin', dose:'250 mg PO daily × 3 days'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Nitrofurantoin', dose:'100 mg PO BID × 5–7 days', note:'Avoid at term (≥36 weeks) — neonatal hemolytic anemia risk'},
        {name:'Cephalexin', dose:'500 mg PO QID × 7 days'},
        {name:'Amoxicillin-clavulanate', dose:'500/125 mg PO TID × 7 days', note:'If susceptibilities known; higher resistance rates'},
        {name:'Fosfomycin', dose:'3 g PO single dose', note:'Safe in pregnancy'},
      ]},
    ],
    notes:'Asymptomatic bacteriuria: treat ONLY in pregnancy and pre-urological procedures. Do NOT treat in catheterized patients, elderly, or diabetics without symptoms. Symptom resolution expected 1–2 days; if no improvement in 48h, culture-guided therapy. Urine culture not required for uncomplicated cystitis in premenopausal non-pregnant women — clinical diagnosis sufficient.',
  },

  {
    id:'pyelo', cat:'gu',
    name:'Pyelonephritis', organism:'E. coli, K. pneumoniae, Proteus; Enterococcus (catheter-associated)',
    source:'IDSA 2010 / EAU 2023',
    regimens:[
      {label:'Outpatient (uncomplicated, tolerating PO)', cls:'fl', drugs:[
        {name:'Ciprofloxacin', dose:'500 mg PO BID × 7 days  or  XR 1 g PO daily × 7 days', note:'First-line outpatient if local E. coli fluoroquinolone resistance <10%; obtain culture before starting'},
        {name:'TMP-SMX (DS)', dose:'160/800 mg PO BID × 14 days', note:'Only if susceptibility confirmed by culture; empiric use suboptimal due to resistance rates'},
        {name:'Amoxicillin-clavulanate', dose:'875/125 mg PO BID × 14 days', note:'If susceptibility known; not empiric first-line'},
      ]},
      {label:'Inpatient (moderate–severe, IV transition)', drugs:[
        {name:'Ceftriaxone', dose:'1–2 g IV q24h (transition to PO when improving)'},
        {name:'Ciprofloxacin', dose:'400 mg IV q12h (transition to PO)'},
        {name:'Ampicillin-sulbactam', dose:'3 g IV q6h', note:'If Enterococcus on Gram stain'},
      ]},
      {label:'ESBL-producing organism', cls:'allergy', drugs:[
        {name:'Ertapenem', dose:'1 g IV q24h × 7–14 days', note:'Outpatient-IV option (once daily)'},
        {name:'Meropenem', dose:'1 g IV q8h', note:'If critically ill or broader coverage needed'},
        {name:'Fosfomycin', dose:'3 g PO q48–72h (investigational for ESBL)', note:'Limited data for pyelonephritis; use with ID guidance'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Ceftriaxone', dose:'1–2 g IV q24h (inpatient recommended in pregnancy)', note:'Hospitalize pregnant patients with pyelonephritis'},
        {name:'Cephalexin', dose:'500 mg PO QID × 14 days (after IV stabilization)'},
      ]},
    ],
    notes:'Obtain urine culture and blood cultures × 2 before antibiotics. Imaging (renal US or CT) if: no improvement in 48–72h, suspected obstruction, recurrent pyelonephritis. Duration: 7 days (fluoroquinolone), 14 days (beta-lactam). Complicated pyelonephritis (men, structural abnormalities, catheter, obstruction, immunocompromised) → 14 days minimum; consider urology consult.',
  },

  {
    id:'prostatitis', cat:'gu',
    name:'Acute Bacterial Prostatitis', organism:'E. coli, K. pneumoniae, Pseudomonas, Enterococcus; N. gonorrhoeae (young, sexually active)',
    source:'EAU 2023 / IDSA guidance',
    regimens:[
      {label:'Outpatient (mild)', cls:'fl', drugs:[
        {name:'Ciprofloxacin', dose:'500 mg PO BID × 28 days', note:'Fluoroquinolones preferred — excellent prostate tissue penetration'},
        {name:'Levofloxacin', dose:'500 mg PO daily × 28 days'},
      ]},
      {label:'Inpatient (severe / sepsis)', drugs:[
        {name:'Ciprofloxacin', dose:'400 mg IV q12h  +  Ampicillin 2 g IV q4h', note:'Add ampicillin to cover Enterococcus'},
        {name:'Piperacillin-tazobactam', dose:'4.5 g IV q6h', note:'If Pseudomonas risk or broad coverage needed'},
        {name:'Ceftriaxone', dose:'2 g IV q24h  +  Gentamicin', note:'Alternative combination'},
      ]},
      {label:'STI-associated (young, sexually active)', drugs:[
        {name:'Ceftriaxone', dose:'500 mg IM single dose (for gonorrhea)', note:'Cover GC before prostate penetration therapy'},
        {name:'+ Doxycycline', dose:'100 mg PO BID × 10–14 days', note:'Cover Chlamydia; complete with 28-day TMP-SMX or fluoroquinolone course'},
      ]},
    ],
    notes:'Do NOT perform vigorous prostate massage — may cause bacteremia. Hospitalize for: sepsis, urinary retention, inability to take PO, immunosuppression. Total duration 28 days (minimum 4 weeks). Alpha-blockers (tamsulosin) help with voiding symptoms. Culture urine ± urine 2-glass test; blood cultures if febrile. If no improvement in 48–72h, imaging to rule out prostatic abscess (TRUS or CT).',
  },

  {
    id:'gonorrhea-chlamydia', cat:'gu',
    name:'Gonorrhea / Chlamydia (Urethritis, Cervicitis)', organism:'Neisseria gonorrhoeae, Chlamydia trachomatis (often co-infection)',
    source:'CDC STI Guidelines 2021',
    regimens:[
      {label:'Gonorrhea — uncomplicated (genital/rectal/pharyngeal)', cls:'fl', drugs:[
        {name:'Ceftriaxone', dose:'500 mg IM single dose (if weight ≥150 kg: 1 g IM)', note:'Single-drug therapy now preferred by CDC 2021 — dual therapy not required if chlamydia co-test is negative; if co-test not done, add chlamydia treatment'},
        {name:'+ Doxycycline', dose:'100 mg PO BID × 7 days  OR  Azithromycin 1 g PO single dose', note:'Add for chlamydial co-treatment if not tested or test positive'},
      ]},
      {label:'Chlamydia — uncomplicated (genital/rectal)', drugs:[
        {name:'Doxycycline', dose:'100 mg PO BID × 7 days', note:'Preferred over azithromycin per CDC 2021 (superior efficacy for rectal chlamydia; doxycycline has better microbiologic cure rates)'},
        {name:'Azithromycin', dose:'1 g PO single dose', note:'Alternative if doxycycline not tolerated; slightly inferior for rectal infection'},
        {name:'Levofloxacin', dose:'500 mg PO daily × 7 days', note:'Alternative for genital chlamydia if above options not feasible'},
      ]},
      {label:'GC — if ceftriaxone not available (alternative regimens)', cls:'allergy', drugs:[
        {name:'Gentamicin', dose:'240 mg IM single dose  +  Azithromycin 2 g PO single dose', note:'If ceftriaxone contraindicated (severe cephalosporin allergy)'},
        {name:'Cefixime', dose:'800 mg PO single dose', note:'Only if ceftriaxone IM not feasible; inferior bioavailability for pharyngeal GC; NOT for pharyngeal infection alone'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Ceftriaxone', dose:'500 mg IM single dose  +  Azithromycin 1 g PO single dose', note:'Doxycycline contraindicated in pregnancy — use azithromycin for chlamydia'},
        {name:'Amoxicillin', dose:'500 mg PO TID × 7 days', note:'Alternative chlamydia treatment in pregnancy if azithromycin intolerance'},
      ]},
    ],
    notes:'Test all patients with GC for chlamydia, HIV, and syphilis. Expedited partner therapy (EPT): treat partners empirically. Report all GC/Chlamydia to public health. Pharyngeal GC is harder to treat — ceftriaxone IM only (cefixime inadequate). Retest for GC/Chlamydia in 3 months. Disseminated GC: arthritis-dermatitis syndrome → ceftriaxone 1 g IV/IM daily × 7 days. Avoid sexual activity for 7 days after treatment and until partners treated.',
  },

  {
    id:'pid', cat:'gu',
    name:'Pelvic Inflammatory Disease (PID)', organism:'N. gonorrhoeae, Chlamydia trachomatis, vaginal flora (anaerobes, G. vaginalis, Mycoplasma genitalium)',
    source:'CDC STI Guidelines 2021',
    regimens:[
      {label:'Outpatient (mild–moderate PID)', cls:'fl', drugs:[
        {name:'Ceftriaxone', dose:'500 mg IM single dose', note:'Covers gonorrhea'},
        {name:'+ Doxycycline', dose:'100 mg PO BID × 14 days', note:'Covers Chlamydia and anaerobes'},
        {name:'+ Metronidazole', dose:'500 mg PO BID × 14 days', note:'Add for anaerobic coverage (BV-associated organisms); especially if IUD present, surgical procedure, or BV detected'},
      ]},
      {label:'Inpatient (severe, surgical abdomen excluded, pregnancy, failed outpatient, tubo-ovarian abscess)', drugs:[
        {name:'Cefoxitin', dose:'2 g IV q6h  +  Doxycycline 100 mg IV/PO q12h', note:'Transition to oral doxycycline (100 mg BID) when improving; continue for 14 days total'},
        {name:'Or Ceftriaxone', dose:'1 g IV q24h  +  Doxycycline 100 mg IV/PO q12h  +  Metronidazole 500 mg IV q8h', note:'With metronidazole for anaerobic/BV coverage'},
        {name:'Clindamycin + Gentamicin', dose:'Clindamycin 900 mg IV q8h  +  Gentamicin 1.5 mg/kg IV q8h (or 3–5 mg/kg q24h)', note:'Alternative IV regimen — proven effective; transition to clindamycin 450 mg PO QID or doxycycline 100 mg PO BID for 14 days total'},
      ]},
      {label:'PCN/cephalosporin allergy', cls:'allergy', drugs:[
        {name:'Clindamycin + Gentamicin', dose:'As above', note:'No beta-lactam; clindamycin covers Chlamydia and anaerobes'},
        {name:'Moxifloxacin', dose:'400 mg PO daily × 14 days', note:'Only if GC has been excluded; GC fluoroquinolone resistance is high'},
      ]},
    ],
    notes:'Treat empirically for PID if minimum criteria present: uterine, adnexal, or cervical motion tenderness with no other cause identified. Remove IUD only if no clinical improvement within 48–72h. Tubo-ovarian abscess: IV antibiotics; percutaneous drainage or laparoscopy if no response in 48–72h. Recheck in 72h for clinical improvement. Long-term consequences: ectopic pregnancy, infertility, chronic pelvic pain. Test and treat all sex partners within 60 days. Screen for HIV and syphilis.',
  },

  {
    id:'bv-trich', cat:'gu',
    name:'Bacterial Vaginosis / Trichomoniasis', organism:'BV: G. vaginalis, anaerobes, Mycoplasma hominis; Trichomoniasis: Trichomonas vaginalis',
    source:'CDC STI Guidelines 2021',
    regimens:[
      {label:'Bacterial Vaginosis (BV)', cls:'fl', drugs:[
        {name:'Metronidazole', dose:'500 mg PO BID × 7 days', note:'Preferred oral regimen; avoid alcohol during and 24h after'},
        {name:'Metronidazole 0.75% vaginal gel', dose:'1 applicator (5 g) intravaginally once daily × 5 days', note:'Local therapy; fewer systemic side effects'},
        {name:'Clindamycin 2% vaginal cream', dose:'1 applicator (5 g) intravaginally at bedtime × 7 days', note:'Alternative; clindamycin cream may weaken latex condoms'},
        {name:'Tinidazole', dose:'2 g PO daily × 2 days  or  1 g PO daily × 5 days', note:'Alternative nitroimidazole'},
        {name:'Secnidazole (Solosec)', dose:'2 g oral granules single dose', note:'Single-dose convenience; mix in applesauce or pudding'},
      ]},
      {label:'Trichomoniasis', drugs:[
        {name:'Metronidazole', dose:'500 mg PO BID × 7 days (women)', note:'CDC 2021: 7-day course preferred for women (superior to single dose based on cure rates)'},
        {name:'Tinidazole', dose:'2 g PO single dose', note:'Alternative for women; single-dose convenience'},
        {name:'Men: Metronidazole', dose:'2 g PO single dose  or  500 mg PO BID × 7 days'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'BV in pregnancy: Metronidazole', dose:'500 mg PO BID × 7 days (safe in all trimesters)', note:'Treat symptomatic BV in pregnancy; evidence mixed for asymptomatic — treat if symptomatic'},
        {name:'Trichomoniasis in pregnancy: Metronidazole', dose:'2 g PO single dose  or  500 mg BID × 7 days', note:'Treat — T. vaginalis associated with preterm labor; metronidazole safe in pregnancy'},
      ]},
    ],
    notes:'BV: treat partners is NOT recommended (partner therapy does not reduce BV recurrence rates). Recurrent BV: metronidazole gel 0.75% twice weekly for 16 weeks (suppressive therapy) or oral metronidazole + fluconazole. Trichomoniasis: treat all sexual partners; avoid intercourse until both partners complete treatment and are asymptomatic. Test for HIV, GC, Chlamydia, and syphilis in all patients with Trichomoniasis. Metronidazole resistance in Trichomoniasis: use tinidazole (2 g PO daily × 7 days) or consult CDC sexually transmitted diseases program.',
  },

];
