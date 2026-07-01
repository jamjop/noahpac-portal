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
          {t:'< 2 h', txt:'Reassess; <strong>reposition</strong> any TQ applied over uniform by applying second TQ directly to skin 2–3 in above wound, then loosening first'},
          {t:'2 h mark', txt:'Every effort should be made to convert before 2 h if bleeding can be controlled by other means. <strong>ASM/CLS: do not attempt conversion beyond 2 h without direction from medical personnel.</strong>'},
          {t:'> 6 h', txt:'<strong>Do not remove TQ</strong> unless close monitoring and lab capability available; limb viability assessment at Role 2/3 only'},
          {t:'NEVER', txt:'Do not remove if: hemorrhagic shock, cannot monitor continuously, or wound cannot be packed'},
        ])
      )}

      ${phase('TQ Conversion Procedure (Medical Personnel, Role 2+ only)', [
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
        <p><strong>Signs of shock:</strong> absent/weak radial pulse, altered mental status without brain injury</p>
        <p><strong>Resuscitation endpoint:</strong> palpable radial pulse, improved mental status, or SBP ≥ 100 mmHg — stop when any one is achieved</p>
        <p><strong>TBI present:</strong> maintain SBP > 100 mmHg — permissive hypotension contraindicated</p>
        <div class="phase-label phase-label-mt">Blood Product Priority (in order)</div>
        <ol class="steps-ol">
          <li><strong>Cold-stored low-titer O whole blood</strong> — preferred</li>
          <li><strong>Pre-screened low-titer O fresh whole blood</strong></li>
          <li><strong>Plasma + pRBC + Platelets 1:1:1</strong></li>
          <li><strong>Plasma + pRBC 1:1</strong></li>
          <li><strong>Plasma or pRBC alone</strong></li>
        </ol>
        <p class="mt-sm"><strong>After first transfused product:</strong> give 1 g calcium (30 mL 10% calcium gluconate or 10 mL 10% calcium chloride) IV/IO.</p>
        <p>Reassess after each unit; discontinue when endpoint reached. Avoid excessive crystalloid.</p>`
      )}

      ${callout('ok', 'TXA — Tranexamic Acid', `
        <p><strong>Indications (give if EITHER applies):</strong></p>
        <ul>
          <li>Likely to need blood transfusion (hemorrhagic shock, major amputation, penetrating torso trauma, severe bleeding)</li>
          <li>Signs/symptoms of significant TBI or altered mental status from blast or blunt trauma</li>
        </ul>
        <p class="mt-sm"><strong>Dose:</strong> 2 g IV or IO slow push — give as soon as possible, <strong>NOT later than 3 hours after injury</strong></p>
        <p>Administer ASAP — every 15-min delay reduces effectiveness. Do not give after 3 h (may increase mortality).</p>`
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

      ${callout('info', 'Two-Step Pain Management Model (May 2026)', `
        <ul>
          <li><strong>Step 1 — Mission capable</strong> (still combat-effective): TCCC Combat Wound Medication Pack (CWMP) — non-opioid pill pack with suzetrigine</li>
          <li><strong>Step 2 — Non-mission capable</strong> (cannot stay in fight): Fixed-dose ketamine or esketamine + CWMP (TCCC medical personnel)</li>
          <li>Document all medications with doses and times on DD Form 1380. Disarm casualties who receive ketamine.</li>
          <li>Goal: tolerable pain preserving airway patency, respiratory drive, and mentation — not complete pain elimination</li>
          <li><em>OTFC (oral transmucosal fentanyl citrate) removed from 2026 TCCC formulary</em></li>
        </ul>`
      )}

      ${phase('Mission Capable — TCCC Combat Wound Medication Pack (CWMP)', [
        '<strong>Acetaminophen</strong> 1000–1300 mg (two 650 mg ER caplets) PO every 8 hours',
        '<strong>Meloxicam</strong> 15 mg PO once daily',
        '<strong>Suzetrigine</strong> 100 mg PO once (two 50 mg tablets), then 50 mg PO every 12 hours',
      ])}

      ${phase('Non-Mission Capable — Medical Personnel', [
        'Direct casualty to take CWMP if not already done',
        '<strong>Ketamine 100 mg IM</strong>  —or—  <strong>Ketamine 50 mg IN</strong>  —or—  <strong>Ketamine 25 mg (0.2–0.3 mg/kg) IV/IO</strong> slow push over 1 min',
        '—or— <strong>Esketamine 14 or 28 mg IN × 1</strong>',
        'Repeat doses q30 min PRN',
        'Endpoint: reduction of pain or onset of nystagmus (rhythmic eye movement)',
      ])}

      ${callout('warn', 'Ketamine / Esketamine — Notes', `
        <ul>
          <li><strong>Disarm casualty</strong> and consider disconnecting communications equipment before administration</li>
          <li>TBI and eye injury do <strong>not</strong> preclude ketamine use — use lowest effective dose and monitor neurologic exam</li>
          <li>IV ketamine: give slowly over 1 minute; use higher concentration (100 mg/mL) for IN route to minimize volume</li>
          <li>If respirations reduced: reposition airway to "sniffing position"; provide ventilatory support if needed</li>
          <li><strong>Do NOT co-administer benzodiazepines with ketamine or esketamine</strong></li>
          <li>Ondansetron 4 mg ODT/IV/IO/IM q8h PRN for nausea or vomiting</li>
        </ul>`
      )}`;
    }
  },

  // ── A2: Antibiotics ────────────────────────────────────────────────────────
  {
    id:'ABX', label:'A: Antibiotics', color:'ok',
    render() { return `
      <div class="sec-title"><span class="sec-letter ok">A</span> Antibiotics</div>

      ${callout('info', 'Indications', `
        <p>Administer antibiotics for <strong>all open combat wounds</strong></p>
        <ul>
          <li>Penetrating abdominal wounds — highest priority</li>
          <li>Open fractures, blast injuries, amputations</li>
          <li>Burns &gt; 20% BSA or full-thickness</li>
          <li>Penetrating joint or chest injuries</li>
        </ul>`
      )}

      ${phase('Antibiotic Selection', [
        '<strong>Able to take PO (first-line):</strong> Cefadroxil 1 g PO once daily',
        '<strong>Able to take PO (alternative):</strong> Cephalexin 500 mg PO every 6 hours',
        '<strong>Unable to take PO</strong> (shock, unconscious): Ceftriaxone 2 g IV/IO/IM once daily',
        'Administer as soon as possible after wounding — delay increases infection risk',
      ])}

      ${callout('ok', 'Ceftriaxone Notes', `
        <p><strong>Dose:</strong> 2 g IV/IO/IM once daily</p>
        <p>IM: reconstitute with 3.5 mL 1% lidocaine for 1 g (adjust proportionally for 2 g); inject deep IM</p>
        <p>Covers gram-positive and gram-negative organisms including many abdominal pathogens</p>`
      )}

      ${callout('info', 'Cefadroxil / Cephalexin Notes', `
        <ul>
          <li>Cefadroxil 1 g PO daily — convenient once-daily dosing; first-line oral option</li>
          <li>Cephalexin 500 mg q6h — alternative if cefadroxil unavailable</li>
          <li>Both are first-generation cephalosporins; low cross-reactivity with PCN allergy (&lt;2%)</li>
          <li>Good coverage for skin, soft tissue, and wound pathogens</li>
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
            {l:'Indication', v:'Likely to need transfusion (hemorrhagic shock, amputation, penetrating torso) OR significant TBI / blast with AMS'},
            {l:'Dose', v:'2 g IV or IO slow push — give ASAP, NOT later than 3 h after injury'},
            {l:'Onset', v:'Antifibrinolytic effect in minutes'},
          ],
          note:'Do NOT give after 3 h since injury — may increase mortality. Every 15-min delay reduces benefit.',
        })}

        ${drugCard({
          name:'Ketamine',
          tag:'PAIN', tagColor:'warn',
          rows:[
            {l:'Analgesia IM', v:'100 mg IM'},
            {l:'Analgesia IN', v:'50 mg IN (use 100 mg/mL concentration)'},
            {l:'Analgesia IV/IO', v:'25 mg (0.2–0.3 mg/kg) slow IV/IO push over 1 min'},
            {l:'Repeat', v:'q30 min PRN; endpoint: pain reduction or nystagmus'},
            {l:'Proc. sed. IV', v:'1–2 mg/kg slow IV/IO'},
            {l:'Proc. sed. IM', v:'2–3 mg/kg IM (300 mg for avg adult)'},
            {l:'Onset IV', v:'1–2 min'},
            {l:'Onset IM', v:'5–15 min'},
          ],
          note:'Disarm casualty before administration. TBI/eye injury do NOT preclude use. Do NOT co-administer benzodiazepines. If emergence occurs during procedural sedation: midazolam 0.5–2 mg IV/IO.',
        })}

        ${drugCard({
          name:'Esketamine',
          tag:'PAIN', tagColor:'warn',
          rows:[
            {l:'Indication', v:'Non-mission capable — analgesic alternative to ketamine'},
            {l:'Dose IN', v:'14 or 28 mg intranasal × 1'},
            {l:'Repeat', v:'q30 min PRN'},
          ],
          note:'Do NOT co-administer with benzodiazepines. Disarm casualty before administration.',
        })}

        ${drugCard({
          name:'Suzetrigine (CWMP)',
          tag:'PAIN', tagColor:'warn',
          rows:[
            {l:'Indication', v:'Mission-capable casualty — Combat Wound Medication Pack'},
            {l:'Loading dose', v:'100 mg PO × 1 (two 50 mg tablets)'},
            {l:'Maintenance', v:'50 mg PO every 12 hours'},
          ],
          note:'NaV1.8 sodium channel blocker. Given with acetaminophen 1000–1300 mg q8h and meloxicam 15 mg daily as the CWMP.',
        })}

        ${drugCard({
          name:'Ceftriaxone',
          tag:'ANTIBIOTICS', tagColor:'ok',
          rows:[
            {l:'Indication', v:'Unable to take PO (shock, unconscious)'},
            {l:'Dose', v:'2 g IV/IO/IM once daily'},
            {l:'IM reconstitute', v:'3.5 mL of 1% lidocaine per 1 g; inject deep IM'},
            {l:'Coverage', v:'Gram+, gram−, many abdominal pathogens'},
          ],
          note:'First-line parenteral antibiotic in 2026 TCCC guidelines.',
        })}

        ${drugCard({
          name:'Cefadroxil / Cephalexin',
          tag:'ANTIBIOTICS', tagColor:'ok',
          rows:[
            {l:'Cefadroxil (1st line)', v:'1 g PO once daily'},
            {l:'Cephalexin (alt)', v:'500 mg PO every 6 hours'},
            {l:'Indication', v:'All open combat wounds — able to take PO'},
            {l:'Coverage', v:'Gram+, wound/soft tissue pathogens'},
          ],
          note:'1st-gen cephalosporins. Low PCN cross-reactivity (<2%). Administer ASAP after wounding.',
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
