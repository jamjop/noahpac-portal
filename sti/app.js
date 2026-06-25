'use strict';

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

const CATS = [
  {id:'bacterial', label:'Bacterial'},
  {id:'vaginal',   label:'Vaginal Infections'},
  {id:'viral',     label:'Viral'},
  {id:'pelvic',    label:'Pelvic / Reproductive'},
  {id:'ecto',      label:'Ectoparasites'},
];

// regimen label classes: 'fl'=first-line, 'preg'=pregnancy, 'allergy'=allergy/alt
const STIS = [
  // ── BACTERIAL ─────────────────────────────────────────────────────────────
  {
    id:'chlamydia', cat:'bacterial',
    name:'Chlamydia', organism:'Chlamydia trachomatis',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Doxycycline', dose:'100 mg PO BID × 7 days',
         note:'Preferred; superior efficacy at rectal site vs azithromycin'},
      ]},
      {label:'Alternative', drugs:[
        {name:'Azithromycin', dose:'1 g PO × 1 dose',
         note:'Less effective for rectal infection; use only if adherence is a concern'},
        {name:'Levofloxacin', dose:'500 mg PO daily × 7 days'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Azithromycin', dose:'1 g PO × 1 dose',
         note:'Doxycycline contraindicated in pregnancy'},
        {name:'Amoxicillin', dose:'500 mg PO TID × 7 days',
         note:'Alternative if azithromycin not tolerated'},
      ]},
    ],
    notes:'Test of cure not routinely recommended unless pregnant or symptoms persist. Expedited partner therapy (EPT) appropriate in most states.',
  },
  {
    id:'gonorrhea', cat:'bacterial',
    name:'Gonorrhea — Urogenital / Rectal', organism:'Neisseria gonorrhoeae',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Ceftriaxone', dose:'500 mg IM × 1 dose (1 g if weight ≥ 150 kg)',
         note:'Dual therapy with azithromycin no longer recommended per 2021 guidelines'},
      ]},
      {label:'Cephalosporin allergy', cls:'allergy', drugs:[
        {name:'Gentamicin 240 mg IM × 1', dose:'+ Azithromycin 2 g PO × 1',
         note:'Limited data; confirm cure with test of cure 7–14 days'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Ceftriaxone', dose:'500 mg IM × 1 dose (1 g if ≥ 150 kg)',
         note:'Fluoroquinolones contraindicated; ceftriaxone is safe'},
      ]},
    ],
    notes:'GISP surveillance critical. Test of cure not routine for urogenital sites. Co-treat for chlamydia if not tested.',
  },
  {
    id:'gonorrhea-pharyngeal', cat:'bacterial',
    name:'Gonorrhea — Pharyngeal', organism:'Neisseria gonorrhoeae',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Ceftriaxone', dose:'500 mg IM × 1 dose (1 g if ≥ 150 kg)',
         note:'Pharyngeal site is hardest to eradicate; monotherapy required'},
      ]},
    ],
    notes:'Test of cure recommended 7–14 days after treatment for pharyngeal gonorrhea. If treatment failure, culture and susceptibility testing prior to retreatment.',
  },
  {
    id:'syphilis-1-2', cat:'bacterial',
    name:'Syphilis — Primary / Secondary', organism:'Treponema pallidum',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Benzathine penicillin G', dose:'2.4 million units IM × 1 dose'},
      ]},
      {label:'Penicillin allergy', cls:'allergy', drugs:[
        {name:'Doxycycline', dose:'100 mg PO BID × 14 days',
         note:'Compliance essential; serologic follow-up required'},
        {name:'Tetracycline', dose:'500 mg PO QID × 14 days'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Benzathine penicillin G', dose:'2.4 million units IM × 1 dose',
         note:'Desensitize if PCN-allergic; alternatives have not been proven to prevent congenital syphilis'},
      ]},
    ],
    notes:'Jarisch-Herxheimer reaction common (fever, chills, malaise within 24h of first dose) — not a drug allergy. Retreat if RPR/VDRL does not fall ≥4-fold at 6–12 months.',
  },
  {
    id:'syphilis-latent-early', cat:'bacterial',
    name:'Syphilis — Latent, Early (< 1 year)', organism:'Treponema pallidum',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Benzathine penicillin G', dose:'2.4 million units IM × 1 dose'},
      ]},
      {label:'Penicillin allergy', cls:'allergy', drugs:[
        {name:'Doxycycline', dose:'100 mg PO BID × 14 days'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Benzathine penicillin G', dose:'2.4 million units IM × 1 dose',
         note:'Desensitize if PCN-allergic'},
      ]},
    ],
    notes:'Same single-dose regimen as primary/secondary. Serologic follow-up at 6 and 12 months.',
  },
  {
    id:'syphilis-latent-late', cat:'bacterial',
    name:'Syphilis — Latent, Late or Unknown Duration', organism:'Treponema pallidum',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Benzathine penicillin G', dose:'2.4 million units IM weekly × 3 doses (total 7.2 MU)',
         note:'Doses must be given 7 days apart; restart series if gap > 9 days'},
      ]},
      {label:'Penicillin allergy', cls:'allergy', drugs:[
        {name:'Doxycycline', dose:'100 mg PO BID × 28 days'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Benzathine penicillin G', dose:'2.4 million units IM weekly × 3 doses',
         note:'Desensitize if PCN-allergic'},
      ]},
    ],
    notes:'Serologic follow-up at 6, 12, and 24 months. LP to rule out neurosyphilis if: neuro/ocular symptoms, treatment failure, HIV with late/unknown latent, or planned non-PCN therapy.',
  },
  {
    id:'neurosyphilis', cat:'bacterial',
    name:'Neurosyphilis / Ocular / Otosyphilis', organism:'Treponema pallidum',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Aqueous crystalline penicillin G',
         dose:'18–24 million units/day IV × 10–14 days',
         note:'Give as 3–4 MU IV q4h or by continuous infusion'},
      ]},
      {label:'Alternative (if adherence ensured)', drugs:[
        {name:'Procaine penicillin G', dose:'2.4 million units IM daily',
         note:'+ Probenecid 500 mg PO QID, both × 10–14 days'},
      ]},
      {label:'Penicillin allergy', cls:'allergy', drugs:[
        {name:'Ceftriaxone', dose:'2 g IV/IM daily × 10–14 days',
         note:'Desensitize to PCN is preferred; ceftriaxone has limited evidence'},
      ]},
    ],
    notes:'Follow up with repeat LP every 6 months until CSF-VDRL nonreactive and cell count normal. Retreatment if CSF-VDRL not declining.',
  },
  {
    id:'chancroid', cat:'bacterial',
    name:'Chancroid', organism:'Haemophilus ducreyi',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Azithromycin', dose:'1 g PO × 1 dose'},
        {name:'Ceftriaxone', dose:'250 mg IM × 1 dose'},
      ]},
      {label:'Alternative', drugs:[
        {name:'Ciprofloxacin', dose:'500 mg PO BID × 3 days',
         note:'Contraindicated in pregnancy'},
        {name:'Erythromycin base', dose:'500 mg PO TID × 7 days'},
      ]},
    ],
    notes:'Rare in US; co-test for HIV and syphilis. Fluctuant nodes may require aspiration. Re-examine at 3–7 days; if no improvement reconsider diagnosis or resistance.',
  },
  {
    id:'lgv', cat:'bacterial',
    name:'Lymphogranuloma Venereum (LGV)', organism:'Chlamydia trachomatis (L1–L3)',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Doxycycline', dose:'100 mg PO BID × 21 days'},
      ]},
      {label:'Alternative', drugs:[
        {name:'Azithromycin', dose:'1 g PO weekly × 3 weeks',
         note:'Less data than doxycycline'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Erythromycin base', dose:'500 mg PO QID × 21 days'},
      ]},
    ],
    notes:'Treat buboes by aspiration, not incision. Clinical resolution may take weeks. Partners within 60 days should be treated for chlamydia.',
  },

  // ── VAGINAL INFECTIONS ─────────────────────────────────────────────────────
  {
    id:'trichomoniasis', cat:'vaginal',
    name:'Trichomoniasis', organism:'Trichomonas vaginalis',
    regimens:[
      {label:'First-line — women', cls:'fl', drugs:[
        {name:'Metronidazole', dose:'500 mg PO BID × 7 days',
         note:'7-day regimen preferred for women; higher cure rate than single dose'},
      ]},
      {label:'First-line — men', cls:'fl', drugs:[
        {name:'Metronidazole', dose:'2 g PO × 1 dose'},
        {name:'Tinidazole', dose:'2 g PO × 1 dose'},
      ]},
      {label:'Alternative', drugs:[
        {name:'Tinidazole', dose:'2 g PO × 1 dose (women or men)'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Metronidazole', dose:'500 mg PO BID × 7 days',
         note:'Safe in all trimesters; treat symptomatic disease'},
      ]},
    ],
    notes:'Test of cure at 3 months due to high reinfection rate. Avoid alcohol during metronidazole/tinidazole and 24–72h after. Treat partners.',
  },
  {
    id:'bv', cat:'vaginal',
    name:'Bacterial Vaginosis', organism:'Polymicrobial (Gardnerella, anaerobes)',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Metronidazole', dose:'500 mg PO BID × 7 days'},
        {name:'Metronidazole gel 0.75%', dose:'5 g intravaginally daily × 5 days'},
        {name:'Clindamycin cream 2%', dose:'5 g intravaginally QHS × 7 days'},
      ]},
      {label:'Alternative', drugs:[
        {name:'Tinidazole', dose:'2 g PO daily × 2 days  OR  1 g PO daily × 5 days'},
        {name:'Clindamycin', dose:'300 mg PO BID × 7 days'},
        {name:'Secnidazole', dose:'2 g PO granules × 1 dose (sprinkle on food)'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Metronidazole', dose:'500 mg PO BID × 7 days',
         note:'All trimesters; treat symptomatic BV to reduce risk of preterm birth'},
        {name:'Clindamycin', dose:'300 mg PO BID × 7 days'},
      ]},
    ],
    notes:'Partner treatment not recommended. Recurrence common (>50% at 12 months). Avoid douching. Condom use reduces recurrence.',
  },
  {
    id:'vvc', cat:'vaginal',
    name:'Vulvovaginal Candidiasis', organism:'Candida albicans (90%); C. glabrata (non-albicans)',
    regimens:[
      {label:'Uncomplicated (first-line)', cls:'fl', drugs:[
        {name:'Fluconazole', dose:'150 mg PO × 1 dose'},
        {name:'Topical azole (OTC)', dose:'Miconazole or clotrimazole intravaginally × 1–7 days',
         note:'Multiple OTC formulations available; all equivalent efficacy'},
      ]},
      {label:'Severe / complicated', drugs:[
        {name:'Fluconazole', dose:'150 mg PO q72h × 2–3 doses'},
      ]},
      {label:'Recurrent (≥ 4 episodes/year)', drugs:[
        {name:'Fluconazole', dose:'150 mg PO weekly × 6 months',
         note:'After initial induction treatment'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Topical azole only', dose:'Miconazole or clotrimazole × 7 days',
         note:'Avoid oral fluconazole, especially first trimester (possible teratogenicity)'},
      ]},
    ],
    notes:'Non-albicans (C. glabrata) is often fluconazole-resistant; treat with boric acid 600 mg vaginal suppository × 14 days or topical nystatin × 14 days.',
  },

  // ── VIRAL ─────────────────────────────────────────────────────────────────
  {
    id:'hsv-first', cat:'viral',
    name:'Herpes Simplex — First Episode', organism:'HSV-1 / HSV-2',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Valacyclovir', dose:'1 g PO BID × 7–10 days'},
        {name:'Acyclovir', dose:'400 mg PO TID × 7–10 days'},
        {name:'Famciclovir', dose:'250 mg PO TID × 7–10 days'},
      ]},
      {label:'Pregnancy', cls:'preg', drugs:[
        {name:'Acyclovir', dose:'400 mg PO TID × 7–10 days',
         note:'Valacyclovir also used; most data with acyclovir'},
      ]},
    ],
    notes:'Continue until lesions are healed (may extend to 10 days if incomplete healing). Counsel on transmission, asymptomatic shedding, and suppressive therapy options.',
  },
  {
    id:'hsv-recurrent', cat:'viral',
    name:'Herpes Simplex — Recurrent (Episodic)', organism:'HSV-1 / HSV-2',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Valacyclovir', dose:'500 mg PO BID × 3 days  OR  1 g daily × 5 days'},
        {name:'Acyclovir', dose:'800 mg PO TID × 2 days  OR  800 mg BID × 5 days'},
        {name:'Famciclovir', dose:'1 g PO BID × 1 day  OR  125 mg BID × 5 days'},
      ]},
    ],
    notes:'Initiate within 1 day of lesion onset or prodrome. Patient-initiated therapy (self-start pack) most effective.',
  },
  {
    id:'hsv-suppressive', cat:'viral',
    name:'Herpes Simplex — Suppressive Therapy', organism:'HSV-1 / HSV-2',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Valacyclovir', dose:'500 mg PO daily  (1 g daily if > 10 episodes/year)'},
        {name:'Acyclovir', dose:'400 mg PO BID'},
        {name:'Famciclovir', dose:'250 mg PO BID'},
      ]},
    ],
    notes:'Reduces transmission to partners by ~50%. Consider in patients with frequent recurrences (≥ 6/year), significant psychosocial impact, or HIV coinfection. Reassess annually.',
  },
  {
    id:'mpox', cat:'viral',
    name:'Mpox (Monkeypox)', organism:'Orthopoxvirus (monkeypox virus)',
    regimens:[
      {label:'Mild disease', cls:'fl', drugs:[
        {name:'Supportive care', dose:'Most cases self-limited (2–4 weeks)',
         note:'Pain management, wound care, treat secondary bacterial infection if present'},
      ]},
      {label:'Severe / immunocompromised', drugs:[
        {name:'Tecovirimat (TPOXX)', dose:'600 mg PO BID × 14 days (weight-based dosing)',
         note:'Available under EUA/IND; contact CDC/local health dept for access'},
        {name:'Cidofovir or Brincidofovir', dose:'Per specialist guidance',
         note:'Reserved for life-threatening disease or tecovirimat failure'},
      ]},
    ],
    notes:'Nationally notifiable disease — report to local/state health department. Isolate until all lesions healed and scabs separated. Vaccination (JYNNEOS) for PEP within 4 days of exposure.',
  },

  // ── PELVIC / REPRODUCTIVE ─────────────────────────────────────────────────
  {
    id:'pid-outpatient', cat:'pelvic',
    name:'PID — Outpatient', organism:'Polymicrobial (N. gonorrhoeae, C. trachomatis, anaerobes)',
    regimens:[
      {label:'Preferred', cls:'fl', drugs:[
        {name:'Ceftriaxone 500 mg IM × 1',
         dose:'+ Doxycycline 100 mg PO BID × 14 days + Metronidazole 500 mg PO BID × 14 days'},
      ]},
      {label:'Alternative', drugs:[
        {name:'Cefoxitin 2 g IM × 1 + Probenecid 1 g PO × 1',
         dose:'+ Doxycycline 100 mg PO BID × 14 days + Metronidazole 500 mg PO BID × 14 days'},
      ]},
    ],
    notes:'Indications for hospitalization: cannot tolerate PO, surgical emergency not excluded, TOA, pregnancy, no clinical improvement after 72h of outpatient therapy. Reassess at 72h.',
  },
  {
    id:'pid-inpatient', cat:'pelvic',
    name:'PID — Inpatient (IV)', organism:'Polymicrobial',
    regimens:[
      {label:'Regimen A (preferred)', cls:'fl', drugs:[
        {name:'Cefotetan 2 g IV q12h  OR  Cefoxitin 2 g IV q6h',
         dose:'+ Doxycycline 100 mg PO or IV q12h',
         note:'Transition to PO doxycycline 100 mg BID once clinically improved; total 14 days'},
      ]},
      {label:'Regimen B', drugs:[
        {name:'Clindamycin 900 mg IV q8h',
         dose:'+ Gentamicin 3–5 mg/kg IV/IM daily (or 2 mg/kg loading then 1.5 mg/kg q8h)',
         note:'Transition to clindamycin 450 mg PO QID or doxycycline 100 mg BID once improved'},
      ]},
      {label:'Alternative', drugs:[
        {name:'Ampicillin-sulbactam 3 g IV q6h',
         dose:'+ Doxycycline 100 mg PO or IV q12h'},
      ]},
    ],
    notes:'Continue IV therapy for ≥ 24h after clinical improvement. Tubo-ovarian abscess (TOA): may require 72–96h IV then oral clindamycin 450 mg QID for 14 days total.',
  },
  {
    id:'epididymoorchitis', cat:'pelvic',
    name:'Epididymo-orchitis', organism:'C. trachomatis / N. gonorrhoeae (< 35 yr); enteric organisms (older, MSM with insertive anal sex)',
    regimens:[
      {label:'Likely STI (age < 35 or MSM)', cls:'fl', drugs:[
        {name:'Ceftriaxone 500 mg IM × 1',
         dose:'+ Doxycycline 100 mg PO BID × 10 days'},
      ]},
      {label:'Enteric organisms also possible (insertive anal sex)', drugs:[
        {name:'Ceftriaxone 500 mg IM × 1',
         dose:'+ Levofloxacin 500 mg PO daily × 10 days'},
      ]},
      {label:'Likely enteric only (no STI risk, older)', drugs:[
        {name:'Levofloxacin', dose:'500 mg PO daily × 10 days',
         note:'Or ofloxacin 300 mg PO BID × 10 days'},
      ]},
    ],
    notes:'Testicular torsion must be excluded urgently. Scrotal support and NSAIDs for pain. Refer if no improvement in 3 days. Treat partner(s) if STI identified.',
  },

  // ── ECTOPARASITES ─────────────────────────────────────────────────────────
  {
    id:'scabies', cat:'ecto',
    name:'Scabies', organism:'Sarcoptes scabiei',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Permethrin 5% cream', dose:'Apply head-to-toe (neck down), leave on 8–14h, then wash off',
         note:'Repeat in 1 week. Apply under fingernails; include soles of feet'},
      ]},
      {label:'Alternative', drugs:[
        {name:'Ivermectin', dose:'200 mcg/kg PO × 1; repeat in 2 weeks',
         note:'Less effective for classic scabies than permethrin; useful if topical adherence poor'},
      ]},
      {label:'Crusted (Norwegian) scabies', drugs:[
        {name:'Permethrin 5% cream daily × 7 days, then 2×/week until cure',
         dose:'+ Ivermectin 200 mcg/kg PO on days 1, 2, 8, 9, 15 (and 22, 29 if severe)',
         note:'Highly contagious; contact precautions required'},
      ]},
    ],
    notes:'Treat all household and sexual contacts simultaneously. Launder bedding/clothing (hot cycle). Pruritus may persist 2–4 weeks after successful treatment (immune reaction to dead mites).',
  },
  {
    id:'pubic-lice', cat:'ecto',
    name:'Pubic Lice (Crabs)', organism:'Phthirus pubis',
    regimens:[
      {label:'First-line', cls:'fl', drugs:[
        {name:'Permethrin 1% lotion', dose:'Apply to affected area, wash off after 10 minutes',
         note:'OTC; re-apply in 9–10 days for newly hatched lice'},
      ]},
      {label:'Alternative', drugs:[
        {name:'Pyrethrins + piperonyl butoxide', dose:'Apply to affected area, wash off after 10 minutes; repeat in 9–10 days'},
        {name:'Malathion 0.5% lotion', dose:'Apply to affected area, wash off after 8–12 hours; repeat in 7–9 days',
         note:'Prescription only; use if first-line fails'},
        {name:'Ivermectin', dose:'250 mcg/kg PO × 1; repeat in 2 weeks'},
      ]},
    ],
    notes:'Treat eyelash involvement with occlusive ophthalmic ointment (petrolatum) BID × 10 days. Launder bedding/clothing. Treat sexual contacts.',
  },
];

// ── Navigation ───────────────────────────────────────────────────────────────

let current = null;

function buildNav() {
  const nav = document.getElementById('tabNav');
  nav.innerHTML = '';
  for (const cat of CATS) {
    for (const s of STIS.filter(x => x.cat === cat.id)) {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (current === s.id ? ' active' : '');
      btn.dataset.id = s.id;
      btn.textContent = s.name;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showSTI(s.id);
      });
      nav.appendChild(btn);
    }
  }
}

function showSTI(id) {
  current = id;
  const s = STIS.find(x => x.id === id);
  if (!s) return;

  let html = `
    <div class="sti-eyebrow">${esc(CATS.find(c=>c.id===s.cat)?.label||s.cat)}</div>
    <div class="sti-title">${esc(s.name)}</div>
    <div class="sti-organism">${esc(s.organism)}</div>`;

  for (const reg of s.regimens) {
    const cls = reg.cls ? ` ${esc(reg.cls)}` : '';
    html += `<div class="reg-label${cls}">${esc(reg.label)}</div><div class="drugs">`;
    for (const d of reg.drugs) {
      const dcls = reg.cls === 'fl' ? ' fl' : '';
      html += `<div class="drug${dcls}">
        <div class="drug-name">${esc(d.name)}</div>
        <div class="drug-dose">${esc(d.dose)}</div>
        ${d.note ? `<div class="drug-note">${esc(d.note)}</div>` : ''}
      </div>`;
    }
    html += `</div>`;
  }

  if (s.notes) {
    html += `<div class="sti-note">${esc(s.notes)}</div>`;
  }

  html += `<button class="copy-btn" id="copyBtn">&#x2398; Copy regimen</button>`;
  document.getElementById('pane').innerHTML = html;
  document.getElementById('copyBtn').addEventListener('click', copyRegimen);
}

function copyRegimen() {
  const s = STIS.find(x => x.id === current);
  if (!s) return;
  let lines = [`${s.name}  |  ${s.organism}`, ''];
  for (const reg of s.regimens) {
    lines.push(`${reg.label.toUpperCase()}`);
    for (const d of reg.drugs) {
      lines.push(`  ${d.name}  —  ${d.dose}`);
      if (d.note) lines.push(`    Note: ${d.note}`);
    }
    lines.push('');
  }
  if (s.notes) { lines.push(`Notes: ${s.notes}`); lines.push(''); }
  lines.push('Source: CDC STI Treatment Guidelines 2021 — noahpac.com/sti/');
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = '✓ Copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.innerHTML = '&#x2398; Copy regimen'; btn.classList.remove('copied'); }, 2000);
  });
}

buildNav();
