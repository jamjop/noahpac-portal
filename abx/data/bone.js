'use strict';
const ABX_BONE = [

  {
    id:'osteomyelitis', cat:'bone',
    name:'Osteomyelitis — Hematogenous', organism:'S. aureus (most common), Streptococcus; gram-negatives (neonates, elderly, IV drug use); Salmonella (sickle cell)',
    source:'IDSA 2012',
    regimens:[
      {label:'Empiric (pending cultures)', cls:'fl', drugs:[
        {name:'Vancomycin', dose:'25–30 mg/kg IV loading, then AUC-guided', note:'Covers MRSA and streptococci; obtain cultures/biopsy before starting when possible'},
        {name:'+ Cefepime or Piperacillin-tazobactam', dose:'Cefepime 2 g IV q8h  or  Pip-Tazo 4.5 g IV q6h', note:'Add gram-negative coverage for: immunocompromised, healthcare-associated, or neonates'},
      ]},
      {label:'MSSA confirmed', drugs:[
        {name:'Nafcillin / Oxacillin', dose:'2 g IV q4h × 4–6 weeks', note:'Preferred over vancomycin for MSSA'},
        {name:'Cefazolin', dose:'2 g IV q8h × 4–6 weeks', note:'Equivalent option; fewer side effects'},
      ]},
      {label:'MRSA confirmed', drugs:[
        {name:'Vancomycin', dose:'AUC-guided × 4–6 weeks'},
        {name:'Daptomycin', dose:'6–8 mg/kg IV q24h × 4–6 weeks', note:'Alternative; good bone penetration'},
      ]},
      {label:'Oral step-down (IDSA-endorsed for stable patients)', drugs:[
        {name:'TMP-SMX (DS)', dose:'1–2 tablets PO BID', note:'For MRSA; high bioavailability; equivalent outcomes to IV in landmark trials (POET 2019, OVIVA 2019)'},
        {name:'Clindamycin', dose:'300–450 mg PO QID', note:'For MSSA/streptococcal; excellent bone penetration'},
        {name:'Ciprofloxacin', dose:'750 mg PO BID  ±  Rifampin 300–450 mg PO BID', note:'For gram-negative or foreign body-associated osteomyelitis'},
        {name:'Linezolid', dose:'600 mg PO BID', note:'MRSA alternative; monitor CBC (thrombocytopenia, anemia with prolonged use)'},
      ]},
    ],
    notes:'Bone biopsy/culture is the gold standard before antibiotics when possible (CT-guided or surgical). MRI is the preferred imaging modality. Total treatment duration: 4–6 weeks (IV or IV-to-PO transition). OVIVA trial (Lancet 2019): early oral step-down is non-inferior to continued IV therapy in complex bone/joint infections — reduces line complications and cost. Surgery often required for chronic osteomyelitis (debridement, dead bone removal). Implant-associated: requires hardware removal or suppressive antibiotics long-term.',
  },

  {
    id:'septic-arthritis', cat:'bone',
    name:'Septic Arthritis — Native Joint', organism:'S. aureus (most common adults), N. gonorrhoeae (young sexually active adults), Streptococcus; gram-negatives (immunocompromised)',
    source:'IDSA 2012 / ACR guidance',
    regimens:[
      {label:'Empiric (pending Gram stain/culture)', cls:'fl', drugs:[
        {name:'Vancomycin', dose:'25–30 mg/kg IV loading, then AUC-guided', note:'Empiric MRSA coverage; obtain joint fluid before antibiotics'},
        {name:'+ Ceftriaxone', dose:'2 g IV q24h', note:'Add for N. gonorrhoeae coverage in sexually active young adults, or gram-negative concern'},
      ]},
      {label:'Gonococcal arthritis — disseminated (DGI)', drugs:[
        {name:'Ceftriaxone', dose:'1 g IM/IV q24h × 7 days (transition to oral after 48h improvement)', note:'Most common cause of septic arthritis in adults <40; arthritis-dermatitis triad'},
        {name:'Oral step-down: Cefixime', dose:'400 mg PO BID × total 7 days', note:'If confirmed GC susceptible'},
        {name:'+ Azithromycin (or Doxycycline)', dose:'1 g PO single dose (azithromycin)  or  Doxycycline 100 mg BID × 7 days', note:'Treat co-infection with Chlamydia'},
      ]},
      {label:'MSSA confirmed', drugs:[
        {name:'Nafcillin / Oxacillin', dose:'2 g IV q4h × 3–4 weeks'},
        {name:'Cefazolin', dose:'2 g IV q8h × 3–4 weeks', note:'Alternative'},
      ]},
      {label:'MRSA confirmed', drugs:[
        {name:'Vancomycin', dose:'AUC-guided × 3–4 weeks'},
        {name:'Daptomycin', dose:'6 mg/kg IV q24h', note:'Alternative'},
      ]},
    ],
    notes:'Joint aspiration is mandatory — diagnostic AND therapeutic. Repeat aspiration (daily if possible) until sterile. Large joints (knee): arthroscopic washout if needle aspiration inadequate. Duration: 3–4 weeks total (IV or IV-to-PO); 2 weeks acceptable for GC arthritis or very responsive staph. Anti-inflammatory agents (NSAIDs) may help symptom control but do not affect outcomes. Prosthetic joint infection: requires hardware removal or long-term suppression — consult orthopedic surgery and ID.',
  },

  {
    id:'vertebral-osteomyelitis', cat:'bone',
    name:'Vertebral Osteomyelitis / Discitis (Spondylodiscitis)', organism:'S. aureus (most common ~50%), Streptococcus, gram-negatives; Mycobacterium tuberculosis (Pott\'s disease)',
    source:'IDSA 2012 / ESCMID-ESCID 2015',
    regimens:[
      {label:'Empiric (after blood cultures and biopsy obtained)', cls:'fl', drugs:[
        {name:'Vancomycin', dose:'25–30 mg/kg IV loading, then AUC-guided', note:'Covers MRSA; delay empiric antibiotics until biopsy obtained unless sepsis or severe neurological deficit'},
        {name:'+ Ceftriaxone', dose:'2 g IV q24h', note:'Add if gram-negative suspected (IVDU, GU source, post-procedural, elderly)'},
      ]},
      {label:'MSSA confirmed', drugs:[
        {name:'Nafcillin / Oxacillin', dose:'2 g IV q4h × 4–6 weeks total', note:'Superior to vancomycin for MSSA'},
        {name:'Cefazolin', dose:'2 g IV q8h × 4–6 weeks'},
        {name:'Step-down to oral: Dicloxacillin 500 mg PO QID or Cephalexin 500 mg PO QID', note:'After 2–4 weeks IV if clinical improvement (OVIVA data supports early oral transition)'},
      ]},
      {label:'MRSA confirmed', drugs:[
        {name:'Vancomycin', dose:'AUC-guided × 6 weeks minimum'},
        {name:'Oral step-down: TMP-SMX (DS)', dose:'1–2 tablets PO BID  ±  Rifampin 300 mg PO BID', note:'Rifampin enhances bone penetration but must not be used as monotherapy (resistance)'},
      ]},
      {label:'Gram-negative (E. coli, Klebsiella — post-GU procedure or older patient)', drugs:[
        {name:'Ciprofloxacin', dose:'500–750 mg PO BID × 6 weeks total (excellent bone penetration)', note:'First-line oral option after IV initiation — superior bioavailability; confirm susceptibility'},
        {name:'Ceftriaxone', dose:'2 g IV q24h × 2–4 weeks, then oral step-down per susceptibility'},
      ]},
      {label:'Tuberculous spondylitis (Pott\'s disease)', drugs:[
        {name:'RIPE therapy: Isoniazid + Rifampin + Pyrazinamide + Ethambutol', dose:'×2 months, then Isoniazid + Rifampin × 10 months (12 months total)', note:'TB spondylodiscitis typically requires 12 months; surgery for neurological compromise or spinal instability'},
      ]},
    ],
    notes:'Delay empiric antibiotics to allow adequate tissue sampling — unlike septic arthritis, vertebral osteomyelitis is subacute; a 24–48h delay for CT-guided biopsy is acceptable if patient is hemodynamically stable. CT-guided biopsy: 40–70% sensitivity. MRI is diagnostic imaging of choice (90% sensitivity). Blood cultures positive in ~50% — draw before any antibiotics. Neurosurgery consult for: epidural abscess, cord compression, vertebral collapse/instability. External bracing for pain and spinal protection. Duration: 6 weeks minimum; up to 12 weeks if poor response or tuberculosis.',
  },

  {
    id:'prosthetic-joint', cat:'bone',
    name:'Prosthetic Joint Infection (PJI)', organism:'CoNS (S. epidermidis), S. aureus, Streptococcus, Enterococcus; gram-negatives (late infection)',
    source:'IDSA 2013 / AAOS / MSIS criteria',
    regimens:[
      {label:'Empiric (after joint aspiration/surgery samples)', cls:'fl', drugs:[
        {name:'Vancomycin', dose:'25–30 mg/kg IV loading, then AUC-guided', note:'Covers MRSA and CoNS; primary organisms in PJI'},
        {name:'+ Cefepime or Piperacillin-tazobactam', dose:'Add if gram-negative PJI suspected (late infection, host factors)', note:''},
      ]},
      {label:'MSSA — DAIR (debridement, antibiotics, implant retention — early PJI ≤4 weeks)', drugs:[
        {name:'Rifampin', dose:'300–450 mg PO BID (add after bacteremia cleared)', note:'Essential for biofilm-associated MSSA PJI in retained implant; must pair with a companion antibiotic'},
        {name:'+ Ciprofloxacin', dose:'750 mg PO BID (companion to rifampin)', note:'Excellent biofilm penetration; preferred companion for rifampin in DAIR strategy'},
        {name:'Nafcillin IV initially (before oral transition)', dose:'2 g IV q4h × 2 weeks, then rifampin + ciprofloxacin PO for 3–6 months total', note:''},
      ]},
      {label:'MRSA — DAIR (implant retained)', drugs:[
        {name:'Vancomycin IV × 2 weeks, then TMP-SMX + Rifampin PO', dose:'TMP-SMX 1–2 DS tablets BID + Rifampin 300–450 mg PO BID × 3–6 months total', note:'After bacteremia cleared, add rifampin for biofilm penetration'},
      ]},
      {label:'Two-stage exchange (hardware removal — most effective for chronic PJI)', drugs:[
        {name:'Stage 1: Antibiotic-loaded cement spacer + IV antibiotics × 6 weeks', note:'Based on intraoperative cultures; targeted therapy'},
        {name:'Stage 2: Replantation at 8–12 weeks (after infection cleared, ESR/CRP normalized)', note:''},
        {name:'Post-reimplantation antibiotics × 3 months (oral) for MRSA/CoNS', note:''},
      ]},
      {label:'Chronic suppressive therapy (non-surgical candidate)', drugs:[
        {name:'TMP-SMX (DS)', dose:'1 tablet PO daily or BID (for MRSA)', note:'Long-term suppression if implant cannot be removed; not curative'},
        {name:'Cephalexin', dose:'500 mg PO BID (for streptococcal/MSSA)', note:'Low-dose suppression'},
      ]},
    ],
    notes:'MSIS/IDSA diagnostic criteria: major criteria (sinus tract communicating with prosthesis, OR two positive cultures of same organism) OR minor criteria (elevated CRP/ESR, elevated synovial WBC/PMN%, positive synovial culture, positive histology, single positive culture). Optimal treatment is surgical hardware removal (two-stage > one-stage exchange). DAIR only for: symptom onset <4 weeks, well-fixed implant, no sinus tract, susceptible organism (not rifampin-resistant). Orthopedic surgery + ID co-management is standard of care.',
  },

];
