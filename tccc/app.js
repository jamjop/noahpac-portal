'use strict';

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// ── Section renderer helpers ─────────────────────────────────────────────────

function phase(label, steps) {
  const items = steps.map((s,i)=>`<li><span class="step-num">${i+1}</span><span>${esc(s)}</span></li>`).join('');
  return `<div class="phase"><div class="phase-label">${esc(label)}</div><ol class="steps">${items}</ol></div>`;
}

function callout(variant, label, content) {
  return `<div class="callout ${esc(variant)}"><div class="callout-label">${esc(label)}</div>${content}</div>`;
}

function timeline(rows) {
  const items = rows.map(r=>`<div class="tl-row"><div class="tl-time">${esc(r.t)}</div><div class="tl-text">${esc(r.txt)}</div></div>`).join('');
  return `<div class="timeline">${items}</div>`;
}

function drugCard(d) {
  const rows = (d.rows||[]).map(r=>`<div class="drug-row"><div class="drug-row-label">${esc(r.l)}</div><div class="drug-row-val">${esc(r.v)}</div></div>`).join('');
  const tag = d.tag ? `<span class="drug-tag ${esc(d.tagColor||'')}">${esc(d.tag)}</span>` : '';
  const note = d.note ? `<div class="drug-note">${esc(d.note)}</div>` : '';
  return `<div class="drug-card${d.priority?' priority':''}"><div class="drug-header"><span class="drug-name">${esc(d.name)}</span>${tag}</div>${rows}${note}</div>`;
}

// ── Section content ──────────────────────────────────────────────────────────

const SECTIONS = [
  // ── M: Massive Hemorrhage ──────────────────────────────────────────────────
  {
    id:'M', label:'M: Hemorrhage', color:'red',
    render() { return `
      <div class="sec-title"><span class="sec-letter">M</span> Massive Hemorrhage</div>

      ${phase('Care Under Fire (CUF)', [
        'Return fire and take cover before treating',
        'Direct casualty to self-treat if able — apply own tourniquet',
        'Apply tourniquet to any life-threatening extremity hemorrhage; do not expose wound',
        'Move casualty to cover as soon as tactically feasible',
      ])}

      ${phase('Tactical Field Care — Extremity Bleeding', [
        'Expose wound; identify source of hemorrhage',
        '<strong>Tourniquet</strong>: apply Combat Application Tourniquet (CAT) or SOFT-T WIDE 2–3 inches <em>proximal</em> to wound',
        'Tighten until bleeding stops and distal pulse is absent; <strong>record application time</strong>',
        'Do not cover tourniquet; mark time on tourniquet and casualty card',
      ])}

      ${phase('Tactical Field Care — Junctional / Truncal Bleeding', [
        'Wound packing: open wound with fingers, pack hemostatic gauze (Combat Gauze / Celox-A / ChitoGauze XR) tightly into wound, filling dead space',
        'Apply firm direct pressure with both hands for a minimum of <strong>3 minutes</strong>',
        'Apply pressure dressing to maintain hemostasis',
        'For junctional wounds: apply JUNCTIONAL TOURNIQUET (JETT or SAM-JT) if packing fails',
        'For truncal hemorrhage: surgical intervention required — request MEDEVAC',
      ])}

      ${callout('danger', 'Tourniquet Conversion Timeline',
        timeline([
          {t:'0 min', txt:'Apply TQ; record <strong>exact time</strong> on strap and DD Form 1380'},
          {t:'< 2 h', txt:'Do not convert in field; reassess hemorrhage control and distal limb'},
          {t:'2 h mark', txt:'Consider conversion at Role 2+ with surgical capability and ability to monitor continuously'},
          {t:'> 6 h', txt:'<strong>Do not remove TQ</strong>; limb viability assessment at Role 2/3 only'},
          {t:'NEVER', txt:'Do not remove if: hemorrhagic shock, cannot monitor continuously, or wound cannot be packed'},
        ])
      )}

      ${phase('TQ Conversion Procedure (Role 2+ only)', [
        'Verify hemorrhage is packable; assess wound',
        'Pack wound with hemostatic gauze + pressure dressing while maintaining pressure',
        'Inflate BP cuff 20 mmHg above systolic <em>proximal</em> to TQ, then slowly loosen TQ',
        'Monitor wound for hemorrhage for 5 minutes under direct observation',
        'If bleeding returns → immediately re-tighten TQ, do not remove',
        'If hemostasis maintained → remove TQ and monitor closely',
      ])}

      ${callout('warn', 'Wound Packing Technique', `
        <ul>
          <li>Unfold gauze and start at deepest point of wound, not the surface</li>
          <li>Pack continuously, pushing gauze to bottom with fingers or instrument</li>
          <li>Fill all dead space firmly; do not leave air pockets</li>
          <li>Apply 3 minutes minimum of firm, direct, uninterrupted pressure</li>
          <li>For Combat Gauze: do not cover with additional gauze until hemostatic property activated</li>
        </ul>`
      )}

      <div class="sec-note">The leading cause of preventable death in combat is extremity hemorrhage. 90% of preventable deaths occur before evacuation. Tourniquet → wound packing in the correct sequence saves lives.</div>`;
    }
  },

  // ── A: Airway ──────────────────────────────────────────────────────────────
  {
    id:'A1', label:'A: Airway', color:'teal',
    render() { return `
      <div class="sec-title"><span class="sec-letter teal">A</span> Airway</div>

      ${phase('Unconscious — No Obvious Obstruction', [
        'Position: recovery (lateral decubitus) position to protect airway',
        'Nasopharyngeal airway (NPA): size = measure from external nare to tragus of ear',
        'Lubricate with water-based lubricant; insert into right nare, bevel toward septum',
        'Advance gently; if resistance, rotate slightly and continue',
        'Contraindication: suspected basilar skull fracture (Battle sign, raccoon eyes, CSF rhinorrhea)',
      ])}

      ${phase('Obstructed Airway — Initial Maneuvers', [
        'Head-tilt chin-lift (contraindicated if cervical spine injury suspected)',
        'Jaw thrust: grasp angles of mandible bilaterally, displace anteriorly',
        'Suction if equipment available; clear foreign body',
        'Insert NPA if not already done',
      ])}

      ${callout('danger', 'Surgical Airway — Indications',`
        <p>Perform if: failed NPA + airway obstruction not relieved by positioning, or inability to intubate</p>
        <ul>
          <li><strong>Landmark:</strong> cricothyroid membrane — midline soft spot between thyroid and cricoid cartilage</li>
          <li><strong>Cric-Key method:</strong> palpate CTM, insert Cric-Key device, advance tube</li>
          <li><strong>Surgical technique:</strong> horizontal stab incision through CTM, dilate with finger/hemostat, insert 6.0 cuffed ETT or tracheostomy tube</li>
          <li>Confirm placement: auscultate bilateral breath sounds, watch for chest rise</li>
          <li>Secure tube to prevent dislodgement during transport</li>
        </ul>`
      )}

      ${callout('info', 'NPA Notes', `
        <ul>
          <li>Right nare preferred; left nare if right blocked</li>
          <li>10mL syringe barrel can substitute if no commercial NPA available</li>
          <li>Gag reflex present does not contraindicate NPA</li>
          <li>Does not protect airway against aspiration — position casualty on side</li>
        </ul>`
      )}`;
    }
  },

  // ── R: Respiration ─────────────────────────────────────────────────────────
  {
    id:'R', label:'R: Respiration', color:'teal',
    render() { return `
      <div class="sec-title"><span class="sec-letter teal">R</span> Respiration</div>

      ${phase('Assess and Manage', [
        'Expose chest; inspect and auscultate bilaterally',
        '<strong>Open/penetrating wound:</strong> apply vented chest seal to ALL penetrating wounds (anterior and posterior)',
        'If vented seal not available: apply standard chest seal; monitor for tension PTX and burp/remove if it develops',
        'SpO₂ target: ≥ 90% with supplemental O₂ if available',
      ])}

      ${callout('danger', 'Tension Pneumothorax — Recognize and Treat', `
        <p><strong>Signs:</strong> absent/decreased unilateral breath sounds, respiratory distress, tracheal deviation (late), hypotension, JVD, SpO₂ drop</p>
        <p>Onset can be rapid — clinical diagnosis; do not wait for imaging</p>
        <div class="phase-label phase-label-mt">Needle Decompression (NCD)</div>
        <ul>
          <li><strong>Site 1:</strong> 2nd intercostal space, midclavicular line (MCL) — standard</li>
          <li><strong>Site 2:</strong> 4th/5th ICS, anterior axillary line (AAL) — preferred for obese/muscular patients; lower failure rate</li>
          <li>Use 14g (min) angiocath, 3.25 inch; insert perpendicular to chest wall over upper rib margin</li>
          <li>Successful: audible rush of air, improvement in vitals/breathing</li>
          <li>May need to repeat on same or contralateral side</li>
          <li>If recurs after NCD: <strong>finger thoracostomy</strong> same site, leave open or insert chest tube</li>
        </ul>`
      )}

      ${callout('warn', 'Sucking Chest Wound', `
        <ul>
          <li>Any penetrating wound to chest that makes sucking sound or bubbles</li>
          <li>Apply vented chest seal over wound (Hyfin Vent, Russell, or improvised)</li>
          <li>If sealed wound develops tension PTX signs → lift seal edge to release pressure (burp)</li>
          <li>Cover back wounds as well; reassess after each intervention</li>
        </ul>`
      )}`;
    }
  },

  // ── C: Circulation ─────────────────────────────────────────────────────────
  {
    id:'C', label:'C: Circulation', color:'red',
    render() { return `
      <div class="sec-title"><span class="sec-letter">C</span> Circulation</div>

      ${phase('Hemorrhage Reassessment', [
        'Reassess all TQs; ensure still tight and hemorrhage controlled',
        'Reassess wound packing; reinforce pressure dressings if soaked through',
        'Check for any missed wounds — do a full-body sweep',
      ])}

      ${phase('Vascular Access', [
        'IV access: 18g peripheral IV, antecubital or forearm preferred',
        'If IV fails ×2: intraosseous (IO) — proximal tibia (anterior-medial, 2cm below tibial tuberosity) or proximal humerus',
        'Flush IO with 10mL normal saline; medications and fluids via IO same as IV',
        'Note: IO is painful in conscious patients — consider 2% lidocaine 40mg before flushing',
      ])}

      ${callout('danger', 'Resuscitation — Hemorrhagic Shock', `
        <p><strong>Signs of shock:</strong> absent radial pulse, altered mental status (mnemonic: "No Pulse? No Problem — give blood"), tachycardia</p>
        <p><strong>Target (permissive hypotension):</strong> SBP 80–90 mmHg OR palpable radial pulse</p>
        <p><strong>TBI present:</strong> maintain SBP ≥ 90 mmHg — permissive hypotension is contraindicated</p>
        <div class="phase-label phase-label-mt">Fluid/Blood Priority (in order)</div>
        <ol class="steps-ol">
          <li><strong>Low-Titer O Whole Blood (LTOWB)</strong> — gold standard</li>
          <li><strong>1:1:1 component therapy</strong> — pRBC : FFP : Platelets</li>
          <li><strong>Lyophilized plasma</strong> — shelf-stable option</li>
          <li><strong>Hextend 500 mL × 1</strong> — last resort, crystalloid if nothing else available</li>
        </ol>
        <p class="mt-sm">Avoid excessive crystalloid; worsens coagulopathy and acidosis.</p>`
      )}

      ${callout('ok', 'TXA — Tranexamic Acid', `
        <p><strong>Indications (ALL must apply):</strong></p>
        <ul>
          <li>Age ≥ 18</li>
          <li>Hemorrhagic shock OR anticipated need for blood transfusion</li>
          <li><strong>Within 3 hours of injury</strong> (TXA given after 3h may be harmful)</li>
        </ul>
        <p class="mt-sm"><strong>Dose:</strong> 1 g IV/IO over 10 min → then 1 g IV/IO over 8 h (second dose at Role 2+)</p>
        <p><strong>If no IV/IO:</strong> 1 g IM (off-label; early anecdotal data; use if no IV access)</p>
        <p>Administer ASAP — every 15-min delay reduces effectiveness.</p>`
      )}`;
    }
  },

  // ── H: Hypothermia / Head ──────────────────────────────────────────────────
  {
    id:'H', label:'H: Hypothermia', color:'teal',
    render() { return `
      <div class="sec-title"><span class="sec-letter teal">H</span> Hypothermia &amp; Head Injury</div>

      ${phase('Hypothermia Prevention (Lethal Triad)', [
        'Remove wet clothing; cut away if necessary',
        'Insulate from ground: sleeping pad, litter, any dry material',
        'Wrap in Ready-Heat blanket + Blizzard Survival Bag or sleeping bag',
        'Cover head and neck — major source of heat loss',
        'Warm IV fluids if available (never infuse cold blood/fluids)',
        'Monitor for shivering; patient is hypothermic if shivering is absent and temp ≤ 35°C',
      ])}

      ${callout('warn', 'The Lethal Triad', `
        <p>Hypothermia + Acidosis + Coagulopathy = death spiral</p>
        <ul>
          <li>Prevent each component aggressively</li>
          <li>Warm + resuscitate with blood products early</li>
          <li>Hypothermia impairs coagulation cascade — even mild hypothermia (34°C) increases blood loss</li>
        </ul>`
      )}

      ${phase('Head Injury / TBI Assessment', [
        'AVPU: Alert, Voice, Pain, Unresponsive (or full GCS if time permits)',
        'Document best motor and verbal response; note pupil reactivity',
        'Prevent secondary brain injury: secure airway, maintain SpO₂ > 90%, SBP ≥ 90 mmHg',
        'Elevate head 30° if not in shock',
        'Avoid hyperthermia (increases cerebral metabolic demand)',
        'No prophylactic hyperventilation (causes vasoconstriction → worse ischemia)',
      ])}

      ${callout('danger', 'Seizure Management', `
        <p><strong>Midazolam 5 mg IM</strong> (or intranasal) for active seizure</p>
        <p>If no response in 5 min: repeat 5 mg IM</p>
        <p>Establish IV/IO access; consider valproic acid or levetiracetam at Role 2+</p>`
      )}

      ${callout('info', 'Hypothermia Temperature Reference', `
        <ul>
          <li><strong>Mild:</strong> 32–35°C — shivering present</li>
          <li><strong>Moderate:</strong> 28–32°C — shivering absent, confusion, bradycardia</li>
          <li><strong>Severe:</strong> &lt; 28°C — coma, no shivering, V-fib risk</li>
        </ul>`
      )}`;
    }
  },

  // ── P: Pain ────────────────────────────────────────────────────────────────
  {
    id:'P', label:'P: Pain', color:'warn',
    render() { return `
      <div class="sec-title"><span class="sec-letter warn">P</span> Pain Management</div>

      ${callout('info', 'Pain Tier System', `
        <ul>
          <li><strong>Mild</strong> (still combat-effective): oral/buccal options</li>
          <li><strong>Moderate–Severe</strong> (non-combat-effective): ketamine or IV opioids</li>
          <li>Reassess after each intervention; document medications + doses + times on DD 1380</li>
        </ul>`
      )}

      ${phase('Mild Pain — Combat Pill Pack', [
        'Acetaminophen 500 mg PO + Meloxicam 15 mg PO (combat pill pack)',
        'Can repeat acetaminophen 500–1000 mg q6h',
        '<strong>OTFC (fentanyl lozenge) 800 mcg buccal</strong>: hold against cheek 15 min; discard after use; may repeat × 1 after 15 min if no relief',
        'OTFC contraindicated if: respiratory rate < 12, SpO₂ < 90%, unconscious',
      ])}

      ${phase('Moderate–Severe Pain — Ketamine (Preferred)', [
        '<strong>IV/IO:</strong> 20–30 mg slow IV push (over 1–2 min); may repeat 20 mg q20 min (max 200 mg)',
        '<strong>IM:</strong> 100–200 mg IM; may repeat × 1 after 15–20 min (max 400 mg)',
        '<strong>Intranasal:</strong> 1 mg/kg (max 100 mg) — use atomizer',
        'Analgesic dose only — patient should remain conversant',
        'Procedural sedation: 1–2 mg/kg IV or 4 mg/kg IM (full dissociative dose)',
      ])}

      ${callout('warn', 'Ketamine — Practical Notes', `
        <ul>
          <li>Onset: IV 1–2 min; IM 5–15 min; IN 5–10 min</li>
          <li>Duration: IV 10–20 min; IM 20–45 min</li>
          <li>Emergence reactions: add <strong>midazolam 2–5 mg IV or 5 mg IM</strong> if agitation/hallucinations</li>
          <li>Use caution in TBI: raises ICP — use lowest effective dose; ensure airway maintained</li>
          <li>Maintains airway reflexes and BP — preferred over opioids in field</li>
          <li>Vial: 500 mg/10 mL (50 mg/mL) — draw 0.5–0.6 mL for 25–30 mg IV bolus</li>
        </ul>`
      )}

      ${phase('Moderate–Severe Pain — Morphine (If Ketamine Unavailable)', [
        'IV/IO: 5 mg slow IV push q10 min; max 15 mg/h',
        'IM: 10 mg IM × 1; reassess in 30 min',
        'Reversal: <strong>Naloxone 0.4–0.8 mg IV/IO/IM/IN</strong>',
        'Avoid if: SBP < 90, RR < 12, altered mental status from head injury',
      ])}`;
    }
  },

  // ── A2: Antibiotics ────────────────────────────────────────────────────────
  {
    id:'ABX', label:'A: Antibiotics', color:'ok',
    render() { return `
      <div class="sec-title"><span class="sec-letter ok">A</span> Antibiotics</div>

      ${callout('info', 'Indications', `
        <p>Administer antibiotics for <strong>all penetrating wounds</strong> except minor skin abrasions</p>
        <ul>
          <li>Penetrating abdominal wounds — highest priority</li>
          <li>Open fractures, blast injuries, amputations</li>
          <li>Burns &gt; 20% BSA or full-thickness</li>
          <li>Penetrating joint or chest injuries</li>
        </ul>`
      )}

      ${phase('Antibiotic Selection', [
        '<strong>With IV/IO access (preferred):</strong> Ertapenem 1 g IM × 1 dose',
        '<strong>No IV access / field expedient:</strong> Moxifloxacin 400 mg PO × 1 dose',
        'Penicillin/carbapenem allergy: Moxifloxacin is the preferred alternative (ertapenem is a carbapenem, low PCN cross-reactivity ≈ 1%)',
        'Administer as soon as possible after wounding — delay increases infection risk',
      ])}

      ${callout('ok', 'Ertapenem Reconstitution', `
        <p>1 g powder vial + <strong>3.2 mL of 1% lidocaine</strong> → gives ~3.5 mL IM solution</p>
        <p>Inject deep into large muscle (gluteus, lateral thigh); avoid IV administration of IM reconstitution</p>
        <p>Spectrum: aerobic gram+ and gram−, anaerobes — excellent for abdominal penetrating trauma</p>`
      )}

      ${callout('info', 'Moxifloxacin Notes', `
        <ul>
          <li>400 mg PO × 1 dose; take on empty stomach if possible</li>
          <li>Caution: QT prolongation (avoid with other QT-prolonging drugs)</li>
          <li>Good bioavailability — oral = IV for soft tissue/intra-abdominal coverage</li>
          <li>Carried in combat pill pack and medic bag</li>
        </ul>`
      )}

      <div class="sec-note">Antibiotic prophylaxis bridges the gap until surgical debridement. It does not replace wound care and does not prevent infection without adequate irrigation and debridement at Role 2+.</div>`;
    }
  },

  // ── W: Wounds ──────────────────────────────────────────────────────────────
  {
    id:'W', label:'W: Wounds', color:'teal',
    render() { return `
      <div class="sec-title"><span class="sec-letter teal">W</span> Wound Care</div>

      ${phase('General Wound Management', [
        'Expose and assess all wounds — perform full-body sweep; log-roll to check back',
        'Control minor bleeding with direct pressure; cover with sterile dressing',
        'Do not remove embedded objects; stabilize in place',
        'Do not explore wounds beyond what is necessary for hemorrhage control',
      ])}

      ${callout('danger', 'Evisceration', `
        <ul>
          <li><strong>Do not reduce</strong> bowel contents — risk of additional injury and contamination</li>
          <li>Moisten contents with sterile saline or water if available</li>
          <li>Cover with moist, non-adherent dressing then occlusive cover</li>
          <li>Keep patient supine; flex knees slightly to reduce abdominal tension</li>
          <li>Definitive management in OR only</li>
        </ul>`
      )}

      ${callout('warn', 'Eye Injuries', `
        <ul>
          <li>Suspected open globe: apply <strong>rigid eye shield</strong> (Fox Shield or improvised) — no pressure dressing</li>
          <li>Do not attempt to remove any object from the eye</li>
          <li>Cover both eyes (sympathetic ophthalmic response) if open globe suspected</li>
          <li>Protect eyes from further contamination during transport</li>
        </ul>`
      )}

      ${phase('Burns Management', [
        'Stop the burning process: cool with water ≤ 20 min for burns < 10% BSA; do not use ice',
        'Remove jewelry and non-adherent clothing; leave adherent clothing',
        'Cover with burn dressing (Medi-Burn, Spenco) or clean sheet',
        'Estimate % BSA using Rule of 9s (see callout below)',
        'Fluid resuscitation if > 20% BSA: 4 mL/kg/% BSA Lactated Ringer\'s over 24 h (half in first 8 h)',
        'Keep patient warm; burns cause major heat loss',
      ])}

      ${callout('info', 'Rule of 9s — BSA Estimation', `
        <ul>
          <li>Head and neck: 9%</li>
          <li>Each arm: 9% (total 18%)</li>
          <li>Anterior torso: 18%</li>
          <li>Posterior torso: 18%</li>
          <li>Each leg: 18% (total 36%)</li>
          <li>Perineum / genitalia: 1%</li>
          <li>Palm method: patient\'s palm (fingers together) ≈ 1% BSA</li>
        </ul>`
      )}`;
    }
  },

  // ── S: Splinting / Evacuation ──────────────────────────────────────────────
  {
    id:'S', label:'S: Splinting', color:'teal',
    render() { return `
      <div class="sec-title"><span class="sec-letter teal">S</span> Splinting &amp; Evacuation</div>

      ${phase('Fracture Management', [
        '<strong>Femur fracture:</strong> apply traction splint (Sager, HARE, CTMS); reduces blood loss 500–2000 mL by tamponading femoral bleeder',
        'Long bone fractures: SAM splint or improvised; immobilize joint <em>above and below</em> fracture',
        'Open fractures: irrigate, cover with moist sterile dressing, then splint; antibiotics as per A section',
        'Dislocations: do not reduce in field unless neurovascular compromise; splint in position found',
        'Check neurovascular status (pulse, sensation, motor) before and after splinting',
      ])}

      ${callout('info', 'Spine Precautions — TCCC Guidance', `
        <ul>
          <li><strong>Penetrating trauma without neurological deficit:</strong> spinal immobilization NOT required and may delay evacuation</li>
          <li><strong>Blunt trauma with:</strong> midline pain, neurological deficit, or altered mental status → apply spinal precautions</li>
          <li>Consider benefits vs. delay in time-critical casualties</li>
        </ul>`
      )}

      ${phase('Evacuation Preparation', [
        'Document on DD Form 1380 (TCCC Casualty Card): mechanism, injuries, interventions, vitals, all medications with doses and times',
        'Mark TQ application time prominently — write on skin proximal to TQ in permanent marker',
        'Position casualty: recovery position if unconscious; supine for shock; semi-recumbent if respiratory distress',
        'Prepare 9-line MEDEVAC request',
      ])}

      ${callout('warn', '9-Line MEDEVAC Format', `
        <ol class="meds-ol">
          <li>Location (grid)</li>
          <li>Radio freq / call sign</li>
          <li>Number of patients by precedence (U/P/R/C)</li>
          <li>Special equipment needed</li>
          <li>Number patients by type (litter/ambulatory)</li>
          <li>Security at pickup site</li>
          <li>Method of marking site</li>
          <li>Patient nationality / status</li>
          <li>NBC contamination (if applicable)</li>
        </ol>`
      )}

      <div class="sec-note">Precedence: Urgent (2h) → Urgent Surgical (2h, needs OR) → Priority (4h) → Routine (24h) → Convenience.</div>`;
    }
  },

  // ── DRUGS ─────────────────────────────────────────────────────────────────
  {
    id:'DRUGS', label:'℞ Drugs', color:'red',
    render() { return `
      <div class="sec-title"><span class="sec-letter">℞</span> Drug Reference Cards</div>
      <div class="drug-grid">

        ${drugCard({
          name:'TXA — Tranexamic Acid',
          tag:'HEMORRHAGE', tagColor:'',
          priority:true,
          rows:[
            {l:'Indication', v:'Hemorrhagic shock within 3h of injury'},
            {l:'Dose 1', v:'1 g IV/IO over 10 minutes — give ASAP'},
            {l:'Dose 2', v:'1 g IV/IO over 8 hours (at Role 2+)'},
            {l:'IM (no IV)', v:'1 g IM × 1 (off-label; use if no IV access)'},
            {l:'Onset', v:'Antifibrinolytic effect in minutes'},
          ],
          note:'CONTRAINDICATED if > 3h since injury (may increase mortality). Also avoid with STEMI, stroke, or suspected DIC. Every 15-min delay reduces benefit.',
        })}

        ${drugCard({
          name:'Ketamine',
          tag:'PAIN', tagColor:'warn',
          rows:[
            {l:'Analgesia IV', v:'20–30 mg slow IV push; repeat 20 mg q20 min (max 200 mg)'},
            {l:'Analgesia IM', v:'100–200 mg IM; repeat × 1 (max 400 mg)'},
            {l:'Analgesia IN', v:'1 mg/kg intranasal (max 100 mg)'},
            {l:'Proc. sed. IV', v:'1–2 mg/kg IV (full dissociative)'},
            {l:'Proc. sed. IM', v:'4 mg/kg IM'},
            {l:'Onset IV', v:'1–2 min'},
            {l:'Onset IM', v:'5–15 min'},
            {l:'Duration IV', v:'10–20 min'},
            {l:'Duration IM', v:'20–45 min'},
            {l:'Vial', v:'500 mg/10 mL (50 mg/mL)'},
          ],
          note:'Maintains airway reflexes and BP. Emergence: add midazolam 2–5 mg IV or 5 mg IM. Use caution in TBI (raises ICP) — use lowest effective dose.',
        })}

        ${drugCard({
          name:'OTFC — Oral Transmucosal Fentanyl',
          tag:'PAIN', tagColor:'warn',
          rows:[
            {l:'Indication', v:'Mild–moderate pain; combat-effective casualty only'},
            {l:'Dose', v:'800 mcg buccal lozenge'},
            {l:'Admin', v:'Hold against cheek/gum 15 min; do not chew'},
            {l:'Repeat', v:'May repeat × 1 after 15 min if no relief'},
            {l:'Onset', v:'~5–15 min'},
          ],
          note:'CONTRAINDICATED if: RR < 12, SpO₂ < 90%, unconscious, anticipated airway intervention. Discard remaining lozenge; monitor for resp depression.',
        })}

        ${drugCard({
          name:'Morphine',
          tag:'PAIN', tagColor:'warn',
          rows:[
            {l:'IV/IO dose', v:'5 mg slow IV push q10 min (max 15 mg/h)'},
            {l:'IM dose', v:'10 mg IM × 1'},
            {l:'Reversal', v:'Naloxone 0.4–0.8 mg IV/IO/IM/IN; repeat q2–3 min PRN'},
          ],
          note:'Avoid if SBP < 90, RR < 12, head injury with AMS. Ketamine preferred in field over morphine.',
        })}

        ${drugCard({
          name:'Ertapenem',
          tag:'ANTIBIOTICS', tagColor:'ok',
          rows:[
            {l:'Indication', v:'Penetrating wounds, open fractures, burns'},
            {l:'Dose', v:'1 g IM × 1 dose'},
            {l:'Reconstitute', v:'3.2 mL of 1% lidocaine into 1 g powder vial'},
            {l:'Result', v:'~3.5 mL; inject deep IM (gluteus, lateral thigh)'},
            {l:'Coverage', v:'Gram+, gram−, anaerobes'},
          ],
          note:'Carbapenem — very low PCN cross-reactivity (~1%). Do not give reconstituted IM solution IV.',
        })}

        ${drugCard({
          name:'Moxifloxacin',
          tag:'ANTIBIOTICS', tagColor:'ok',
          rows:[
            {l:'Indication', v:'Penetrating wounds when parenteral route unavailable'},
            {l:'Dose', v:'400 mg PO × 1 dose'},
            {l:'Coverage', v:'Gram+, gram−, anaerobes, atypicals'},
          ],
          note:'QT prolongation — avoid with other QT-prolonging medications. Alternative when ertapenem not available or patient cannot receive IM injection.',
        })}

        ${drugCard({
          name:'Midazolam',
          tag:'SEDATION', tagColor:'teal',
          rows:[
            {l:'Emergence IV', v:'2–5 mg IV/IO slow push'},
            {l:'Emergence IM', v:'5 mg IM'},
            {l:'Seizure IM', v:'5 mg IM or 5 mg intranasal'},
            {l:'Repeat', v:'May repeat in 5 min × 1 if seizure continues'},
            {l:'Reversal', v:'Flumazenil 0.2 mg IV q1 min (max 1 mg)'},
          ],
          note:'Respiratory depression risk, especially combined with opioids. Have naloxone and flumazenil available.',
        })}

      </div>`;
    }
  },
];

// ── Navigation ───────────────────────────────────────────────────────────────

let current = SECTIONS[0].id;

function buildTabs() {
  const nav = document.getElementById('tabNav');
  nav.innerHTML = SECTIONS.map(s =>
    `<button class="tab-btn${s.id===current?' active':''}" data-id="${esc(s.id)}" data-color="${esc(s.color||'red')}">${esc(s.label)}</button>`
  ).join('');
  nav.addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    current = btn.dataset.id;
    nav.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderSection();
  });
}

function renderSection() {
  const sec = SECTIONS.find(s => s.id === current);
  document.getElementById('content').innerHTML = sec ? sec.render() : '';
}

// ── Service worker registration ───────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/tccc/sw.js').catch(() => {});
  window.addEventListener('offline', () => { document.getElementById('offlineBadge').hidden = false; });
  window.addEventListener('online',  () => { document.getElementById('offlineBadge').hidden = true; });
  if (!navigator.onLine) document.getElementById('offlineBadge').hidden = false;
}

buildTabs();
renderSection();
