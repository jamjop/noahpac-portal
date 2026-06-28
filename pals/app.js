'use strict';

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function phase(label, steps) {
  const items = steps.map((s,i)=>`<li><span class="step-num">${i+1}</span><span>${s}</span></li>`).join('');
  return `<div class="phase"><div class="phase-label">${esc(label)}</div><ol class="steps">${items}</ol></div>`;
}

function callout(variant, label, content) {
  return `<div class="callout ${esc(variant)}"><div class="callout-label">${esc(label)}</div>${content}</div>`;
}

function drugCard(d) {
  const rows = (d.rows||[]).map(r=>`<div class="drug-row"><div class="drug-row-label">${esc(r.l)}</div><div class="drug-row-val">${r.v}</div></div>`).join('');
  const tag = d.tag ? `<span class="drug-tag ${esc(d.tagColor||'')}">${esc(d.tag)}</span>` : '';
  const note = d.note ? `<div class="drug-note">${d.note}</div>` : '';
  return `<div class="drug-card${d.priority?' priority':''}"><div class="drug-header"><span class="drug-name">${esc(d.name)}</span>${tag}</div>${rows}${note}</div>`;
}

// ── EKG waveform paths (viewBox 0 0 480 70, baseline y=35) ───────────────────
const EKG = {
  nsr:    `M0,35 L5,35 Q12,28 19,35 L28,35 L30,39 L32,4 L34,43 L37,35 L52,35 Q63,24 75,35 L120,35 L125,35 Q132,28 139,35 L148,35 L150,39 L152,4 L154,43 L157,35 L172,35 Q183,24 195,35 L240,35 L245,35 Q252,28 259,35 L268,35 L270,39 L272,4 L274,43 L277,35 L292,35 Q303,24 315,35 L360,35 L365,35 Q372,28 379,35 L388,35 L390,39 L392,4 L394,43 L397,35 L412,35 Q423,24 435,35 L480,35`,
  brady:  `M0,35 L40,35 Q47,28 54,35 L63,35 L65,39 L67,4 L69,43 L72,35 L87,35 Q98,24 110,35 L248,35 Q255,28 262,35 L271,35 L273,39 L275,4 L277,43 L280,35 L295,35 Q306,24 318,35 L480,35`,
  svt:    `M0,35 L1,39 L2,4 L3,43 L5,35 Q10,30 18,35 L40,35 L41,39 L42,4 L43,43 L45,35 Q50,30 58,35 L80,35 L81,39 L82,4 L83,43 L85,35 Q90,30 98,35 L120,35 L121,39 L122,4 L123,43 L125,35 Q130,30 138,35 L160,35 L161,39 L162,4 L163,43 L165,35 Q170,30 178,35 L200,35 L201,39 L202,4 L203,43 L205,35 Q210,30 218,35 L240,35 L241,39 L242,4 L243,43 L245,35 Q250,30 258,35 L280,35 L281,39 L282,4 L283,43 L285,35 Q290,30 298,35 L320,35 L321,39 L322,4 L323,43 L325,35 Q330,30 338,35 L360,35 L361,39 L362,4 L363,43 L365,35 Q370,30 378,35 L400,35 L401,39 L402,4 L403,43 L405,35 Q410,30 418,35 L440,35 L441,39 L442,4 L443,43 L445,35 Q450,30 458,35 L480,35`,
  pvt:    `M0,35 C8,35 20,4 25,4 C30,4 44,60 48,60 C52,60 57,35 60,35 C68,35 80,4 85,4 C90,4 104,60 108,60 C112,60 117,35 120,35 C128,35 140,4 145,4 C150,4 164,60 168,60 C172,60 177,35 180,35 C188,35 200,4 205,4 C210,4 224,60 228,60 C232,60 237,35 240,35 C248,35 260,4 265,4 C270,4 284,60 288,60 C292,60 297,35 300,35 C308,35 320,4 325,4 C330,4 344,60 348,60 C352,60 357,35 360,35 C368,35 380,4 385,4 C390,4 404,60 408,60 C412,60 417,35 420,35 C428,35 440,4 445,4 C450,4 464,60 468,60 C472,60 477,35 480,35`,
  vf:     `M0,35 Q6,48 12,22 Q16,8 20,56 Q24,65 28,16 Q32,4 36,58 Q40,66 44,20 Q48,8 52,54 Q56,62 60,22 Q64,10 68,56 Q72,64 76,18 Q80,6 84,52 Q88,62 92,24 Q96,12 100,54 Q104,62 108,20 Q112,8 116,56 Q120,64 124,18 Q128,6 132,52 Q136,60 140,24 Q144,14 148,54 Q152,62 156,22 Q160,10 164,56 Q168,64 172,18 Q176,6 180,52 Q184,62 188,24 Q192,12 196,54 Q200,60 204,20 Q208,8 212,52 Q216,60 220,22 Q224,12 228,56 Q232,64 236,20 Q240,8 244,54 Q248,62 252,24 Q256,12 260,54 Q264,60 268,22 Q272,10 276,56 Q280,64 284,18 Q288,6 292,52 Q296,60 300,24 Q304,12 308,54 Q312,62 316,22 Q320,10 324,56 Q328,64 332,18 Q336,6 340,52 Q344,62 348,24 Q352,12 356,52 Q360,62 364,20 Q368,8 372,56 Q376,64 380,18 Q384,6 388,52 Q392,60 396,24 Q400,14 404,56 Q408,64 412,20 Q416,8 420,52 Q424,60 428,24 Q432,12 436,56 Q440,64 444,18 Q448,6 452,52 Q456,60 460,24 Q464,14 468,54 Q472,62 476,26 Q478,40 480,35`,
  asys:   `M0,35 Q120,34 240,36 Q360,35 480,35`,
  pea:    `M0,35 L18,35 L21,39 L26,4 L34,4 L39,43 L45,35 Q57,26 70,35 L230,35 L233,39 L238,4 L246,4 L251,43 L257,35 Q269,26 282,35 L480,35`,
  afib:   `M0,35 Q4,32 8,35 Q12,38 16,35 Q20,32 24,35 Q28,38 32,35 Q36,32 40,35 Q44,38 48,35 L50,39 L52,4 L54,43 L57,35 Q65,27 74,35 Q78,32 82,35 Q86,38 90,35 Q94,32 98,35 L100,39 L102,4 L104,43 L107,35 Q115,27 124,35 Q128,32 132,35 Q136,38 140,35 Q144,32 148,35 Q152,38 156,35 L158,39 L160,4 L162,43 L165,35 Q173,27 182,35 Q186,32 190,35 Q194,38 198,35 Q202,32 206,35 L208,39 L210,4 L212,43 L215,35 Q223,27 232,35 Q236,32 240,35 Q244,38 248,35 Q252,32 256,35 Q260,38 264,35 Q268,32 272,35 L274,39 L276,4 L278,43 L281,35 Q289,27 298,35 Q302,32 306,35 Q310,38 314,35 Q318,32 322,35 Q326,38 330,35 Q334,32 338,35 L340,39 L342,4 L344,43 L347,35 Q355,27 364,35 Q368,32 372,35 Q376,38 380,35 Q384,32 388,35 Q392,38 396,35 Q400,32 404,35 L406,39 L408,4 L410,43 L413,35 Q421,27 430,35 Q434,32 438,35 Q442,38 446,35 Q450,32 454,35 L456,39 L458,4 L460,43 L463,35 Q471,27 480,35`,
  stemi:  `M0,35 L5,35 Q12,28 19,35 L28,35 L30,39 L32,4 L34,27 L50,25 Q60,14 72,35 L120,35 L125,35 Q132,28 139,35 L148,35 L150,39 L152,4 L154,27 L170,25 Q180,14 192,35 L240,35 L245,35 Q252,28 259,35 L268,35 L270,39 L272,4 L274,27 L290,25 Q300,14 312,35 L360,35 L365,35 Q372,28 379,35 L388,35 L390,39 L392,4 L394,27 L410,25 Q420,14 432,35 L480,35`,
  nstemi: `M0,35 L5,35 Q12,28 19,35 L28,35 L30,39 L32,4 L34,43 L37,35 L46,43 L58,43 Q66,50 78,35 L120,35 L125,35 Q132,28 139,35 L148,35 L150,39 L152,4 L154,43 L157,35 L166,43 L178,43 Q186,50 198,35 L240,35 L245,35 Q252,28 259,35 L268,35 L270,39 L272,4 L274,43 L277,35 L286,43 L298,43 Q306,50 318,35 L360,35 L365,35 Q372,28 379,35 L388,35 L390,39 L392,4 L394,43 L397,35 L406,43 L418,43 Q426,50 438,35 L480,35`,
  stachy: `M0,35 Q5,31 10,35 L14,35 L16,39 L18,4 L20,43 L22,35 Q30,27 40,35 L80,35 Q85,31 90,35 L94,35 L96,39 L98,4 L100,43 L102,35 Q110,27 120,35 L160,35 Q165,31 170,35 L174,35 L176,39 L178,4 L180,43 L182,35 Q190,27 200,35 L240,35 Q245,31 250,35 L254,35 L256,39 L258,4 L260,43 L262,35 Q270,27 280,35 L320,35 Q325,31 330,35 L334,35 L336,39 L338,4 L340,43 L342,35 Q350,27 360,35 L400,35 Q405,31 410,35 L414,35 L416,39 L418,4 L420,43 L422,35 Q430,27 440,35 L480,35`,
  pedsvt: `M0,35 L1,39 L2,4 L3,43 L5,35 Q9,30 16,35 L20,35 L21,39 L22,4 L23,43 L25,35 Q29,30 36,35 L40,35 L41,39 L42,4 L43,43 L45,35 Q49,30 56,35 L60,35 L61,39 L62,4 L63,43 L65,35 Q69,30 76,35 L80,35 L81,39 L82,4 L83,43 L85,35 Q89,30 96,35 L100,35 L101,39 L102,4 L103,43 L105,35 Q109,30 116,35 L120,35 L121,39 L122,4 L123,43 L125,35 Q129,30 136,35 L140,35 L141,39 L142,4 L143,43 L145,35 Q149,30 156,35 L160,35 L161,39 L162,4 L163,43 L165,35 Q169,30 176,35 L180,35 L181,39 L182,4 L183,43 L185,35 Q189,30 196,35 L200,35 L201,39 L202,4 L203,43 L205,35 Q209,30 216,35 L220,35 L221,39 L222,4 L223,43 L225,35 Q229,30 236,35 L240,35 L241,39 L242,4 L243,43 L245,35 Q249,30 256,35 L260,35 L261,39 L262,4 L263,43 L265,35 Q269,30 276,35 L280,35 L281,39 L282,4 L283,43 L285,35 Q289,30 296,35 L300,35 L301,39 L302,4 L303,43 L305,35 Q309,30 316,35 L320,35 L321,39 L322,4 L323,43 L325,35 Q329,30 336,35 L340,35 L341,39 L342,4 L343,43 L345,35 Q349,30 356,35 L360,35 L361,39 L362,4 L363,43 L365,35 Q369,30 376,35 L380,35 L381,39 L382,4 L383,43 L385,35 Q389,30 396,35 L400,35 L401,39 L402,4 L403,43 L405,35 Q409,30 416,35 L420,35 L421,39 L422,4 L423,43 L425,35 Q429,30 436,35 L440,35 L441,39 L442,4 L443,43 L445,35 Q449,30 456,35 L460,35 L461,39 L462,4 L463,43 L465,35 Q469,30 476,35 L480,35`,
};

function ekgStrip(rows) {
  return `<div class="ekg-card">${rows.map(r=>`
    <div class="ekg-row">
      <div class="ekg-labels">
        <span class="ekg-rhythm">${r.label}</span>
        ${r.sub?`<span class="ekg-sub">${r.sub}</span>`:''}
      </div>
      <div class="ekg-svg-wrap">
        <svg class="ekg-svg" viewBox="0 0 480 70" preserveAspectRatio="none">
          <line x1="0" y1="35" x2="480" y2="35" class="ekg-baseline"/>
          <path d="${r.path}" class="ekg-path${r.color?' '+r.color:''}"/>
        </svg>
      </div>
    </div>`).join('')}</div>`;
}

const SECTIONS = [

  // ── Pediatric VF / pVT ────────────────────────────────────────────────────
  {
    id:'vfpvt', label:'VF / pVT',
    render() { return `
      <div class="sec-title"><span class="sec-badge">SHOCKABLE</span> Pediatric VF / Pulseless VT</div>

      ${ekgStrip([
        {label:'V-Fib', sub:'Chaotic · no pulse',     path:EKG.vf,  color:'c-red'},
        {label:'p-VT',  sub:'Wide regular · no pulse', path:EKG.pvt, color:'c-red'},
      ])}

      ${callout('danger', 'Key Differences from Adult ALS', `
        <ul>
          <li>Pediatric cardiac arrest is <strong>usually asphyxial</strong> (not primary cardiac) — optimize oxygenation/ventilation early</li>
          <li>VF/pVT is <strong>less common</strong> in children; asystole/PEA are more common</li>
          <li>Energy doses are <strong>weight-based</strong>: 2 J/kg first shock; 4 J/kg subsequent</li>
          <li>All drug doses are weight-based — use Broselow tape or length-based tool for rapid dosing</li>
        </ul>`
      )}

      ${phase('Initial Recognition & CPR', [
        'Confirm cardiac arrest: unresponsive, no breathing or gasping, no pulse (&le;10 sec)',
        'Activate emergency response; send for defibrillator and crash cart',
        '<strong>Begin CPR immediately</strong>: rate 100–120/min; depth &ge;1/3 AP diameter (&asymp;1.5 in infant, 2 in child)',
        'Compressions to ventilations: <strong>30:2</strong> single rescuer; <strong>15:2</strong> two rescuers',
        'Infant: 2-finger or 2-thumb encircling technique; child: 1–2 hand heel technique',
        'Attach monitor/defibrillator as soon as available',
      ])}

      ${phase('Shock → CPR → Rhythm Check Cycle', [
        '<strong>1st shock: 2 J/kg</strong> (biphasic or monophasic)',
        'Resume CPR immediately for 2 minutes — do not check pulse immediately after shock',
        'Establish IV or IO access during CPR (IO preferred if IV access delayed)',
        '<strong>Epinephrine 0.01 mg/kg IV/IO</strong> (0.1 mL/kg of 0.1 mg/mL concentration) after 1st shock; max 1 mg; repeat every 3–5 min',
        'Check rhythm at 2-min mark; if shockable → <strong>2nd shock: 4 J/kg</strong>',
        'If VF/pVT persists after 2nd shock → amiodarone or lidocaine during CPR',
        'Subsequent shocks: 4 J/kg (or higher, max 10 J/kg or adult dose); continue epinephrine cycle',
      ])}

      <div class="drug-grid">
        ${drugCard({name:'Epinephrine', tag:'Every 3–5 min', tagColor:'',
          rows:[
            {l:'Dose',v:'<strong>0.01 mg/kg IV/IO</strong> (max 1 mg)'},
            {l:'Concentration',v:'Use <strong>0.1 mg/mL</strong> (1:10,000) → give 0.1 mL/kg'},
            {l:'Flush',v:'5–10 mL NS flush after each dose'},
            {l:'Repeat',v:'Every 3–5 min throughout arrest'},
          ],
          note:'Double-check concentration — 1 mg/mL (1:1,000) can cause 10× overdose if used instead of 0.1 mg/mL (1:10,000)'
        })}
        ${drugCard({name:'Amiodarone', tag:'After 2nd shock', tagColor:'warn',
          rows:[
            {l:'Dose',v:'<strong>5 mg/kg IV/IO</strong>; max 300 mg per dose'},
            {l:'Repeat',v:'May repeat ×2 for refractory VF/pVT'},
            {l:'In arrest',v:'Push rapidly (over 3–5 min); dilute for non-arrest'},
          ],
          note:'Preferred antiarrhythmic for pediatric cardiac arrest. Monitor for hypotension in non-arrest use.'
        })}
        ${drugCard({name:'Lidocaine', tag:'Alt to amiodarone', tagColor:'teal',
          rows:[
            {l:'Bolus',v:'<strong>1 mg/kg IV/IO</strong>'},
            {l:'Infusion',v:'20–50 mcg/kg/min if ROSC achieved'},
          ],
          note:'Acceptable alternative if amiodarone unavailable. Do not give both simultaneously.'
        })}
      </div>

      ${callout('warn', "Reversible Causes — H's & T's", `
        <ul>
          <li><strong>H</strong>ypoxia — most common in children; verify airway and ventilation first</li>
          <li><strong>H</strong>ypovolemia — IV/IO fluid bolus 20 mL/kg NS or LR</li>
          <li><strong>H</strong>ydrogen ion (acidosis) — sodium bicarbonate 1 mEq/kg IV/IO</li>
          <li><strong>H</strong>ypo/Hyperkalemia — calcium chloride 20 mg/kg IV/IO for hyperkalemia</li>
          <li><strong>H</strong>ypoglycemia — dextrose: D10W 5 mL/kg (infant/neonate); D25W 2 mL/kg (child)</li>
          <li><strong>H</strong>ypothermia — active rewarming; ECMO if available for severe cases</li>
          <li><strong>T</strong>ension pneumothorax — needle decompression 2nd ICS MCL</li>
          <li><strong>T</strong>amponade — pericardiocentesis; bedside echo if available</li>
          <li><strong>T</strong>oxins — targeted antidotes; call poison control (1-800-222-1222)</li>
          <li><strong>T</strong>hrombosis — rare in children; consider if known cardiac disease or central line</li>
        </ul>`
      )}
    `;}
  },

  // ── Pediatric Asystole / PEA ──────────────────────────────────────────────
  {
    id:'pea', label:'Asystole / PEA',
    render() { return `
      <div class="sec-title"><span class="sec-badge">NON-SHOCKABLE</span> Pediatric Asystole / PEA</div>

      ${ekgStrip([
        {label:'Asystole', sub:'Flat · no electrical activity', path:EKG.asys, color:'c-muted'},
        {label:'PEA',      sub:'Organized · no pulse',          path:EKG.pea,  color:'c-warn'},
      ])}

      <div class="sec-note">Asystole and PEA are the most common arrest rhythms in children. The primary cause is usually asphyxia — prioritize airway and ventilation.</div>

      ${phase('Initial Steps', [
        'Confirm cardiac arrest: unresponsive, no breathing, no pulse',
        'Begin <strong>high-quality CPR immediately</strong>; rate 100–120/min, depth &ge;1/3 AP diameter',
        '15:2 (two rescuers) or 30:2 (single rescuer) until advanced airway placed',
        'Establish IV or IO access during CPR — IO is fast and reliable',
        '<strong>Epinephrine 0.01 mg/kg IV/IO</strong> as soon as access obtained; repeat every 3–5 min; max 1 mg',
        'Advanced airway when feasible; confirm with waveform capnography',
      ])}

      ${phase('2-Minute CPR Cycles', [
        'Check rhythm every 2 minutes; minimize pause &lt;10 sec',
        'If shockable rhythm (VF/pVT) develops → switch to shockable algorithm immediately',
        'If organized rhythm → pulse check (&le;10 sec); if pulse present → post-arrest care',
        'Continue epinephrine every 3–5 min; aggressively treat reversible causes',
        '<strong>Hypoxia is the #1 reversible cause in children</strong> — verify airway, ETT/SGA placement, bilateral breath sounds, adequate chest rise',
      ])}

      ${callout('info', 'Intraosseous (IO) Access in Pediatric Arrest', `
        <ul>
          <li>IO is the <strong>preferred vascular access</strong> when IV cannot be rapidly obtained</li>
          <li>Sites: proximal tibia (1–2 cm below tibial tuberosity, medial aspect) — most common</li>
          <li>Alternative sites: distal femur, proximal humerus, distal tibia</li>
          <li>EZ-IO needle sizes: 15 mm (3–39 kg), 25 mm (&ge;40 kg or obese), 45 mm (large adult)</li>
          <li>Flush with NS before drug administration; all IV drugs and fluids can be given IO</li>
          <li>Confirm placement: secure needle, no infiltration, marrow aspiration or free-flow of flush</li>
        </ul>`
      )}

      ${callout('warn', 'Sodium Bicarbonate', `
        <ul>
          <li>Dose: <strong>1 mEq/kg IV/IO</strong> slow push</li>
          <li>Indications: prolonged arrest, known or suspected metabolic acidosis, hyperkalemia, TCA overdose</li>
          <li>Not recommended for routine use — may cause hyperosmolarity, paradoxical intracellular acidosis</li>
          <li>Flush line before and after with NS — incompatible with calcium and epinephrine</li>
        </ul>`
      )}

      ${callout('danger', 'Glucose in Pediatric Arrest', `
        <ul>
          <li><strong>Check glucose early</strong> — neonates and infants have minimal glycogen stores; hypoglycemia common</li>
          <li>Neonates/infants: D10W 5–10 mL/kg IV/IO</li>
          <li>Children: D25W 2–4 mL/kg IV/IO</li>
          <li>Adolescents: D50W 1–2 mL/kg IV/IO</li>
          <li>Target blood glucose 70–180 mg/dL; avoid hyperglycemia</li>
        </ul>`
      )}
    `;}
  },

  // ── Pediatric Bradycardia ─────────────────────────────────────────────────
  {
    id:'brady', label:'Bradycardia',
    render() { return `
      <div class="sec-title"><span class="sec-badge warn">BRADYCARDIA</span> Pediatric Bradycardia with Pulse</div>

      ${ekgStrip([
        {label:'Sinus Brady', sub:'HR &lt;60 · P before QRS · hypoxia first', path:EKG.brady, color:'c-warn'},
      ])}

      ${callout('danger', 'Critical Principle', `
        <p><strong>In children, bradycardia is most often caused by hypoxia.</strong> The first intervention is always to support the airway and provide adequate oxygenation and ventilation. Drugs and pacing are secondary.</p>`
      )}

      ${phase('Initial Assessment', [
        'Assess: is the child hemodynamically stable? Signs of instability: HR &lt;60 bpm with <strong>poor perfusion</strong> despite adequate oxygenation/ventilation',
        'Support airway: open airway, suction, supplemental O₂ (100% if compromised)',
        'Assist ventilation if inadequate; BVM with O₂',
        'Cardiac monitor, pulse oximetry, IV/IO access, 12-lead ECG',
        'If bradycardia and poor perfusion persist despite oxygenation → medications/pacing',
      ])}

      ${phase('If HR < 60 bpm with Poor Perfusion Despite Oxygenation', [
        'If hemodynamic compromise is severe → <strong>CPR if HR &lt;60 with poor perfusion</strong>',
        '<strong>Epinephrine 0.01 mg/kg IV/IO</strong> — preferred for symptomatic bradycardia from any cause; max 1 mg; repeat q3–5 min',
        '<strong>Atropine 0.02 mg/kg IV/IO</strong> — for vagally mediated or AV nodal block; min dose 0.1 mg; max 0.5 mg (child) or 1 mg (adolescent)',
        'Transcutaneous or transvenous pacing if refractory to medications',
        'Expert (pediatric cardiology) consultation',
        'Identify and treat underlying cause: hypoxia, hypothermia, heart block, toxins, electrolyte abnormality',
      ])}

      <div class="drug-grid">
        ${drugCard({name:'Epinephrine', tag:'First-line', tagColor:'ok',
          rows:[
            {l:'Dose',v:'<strong>0.01 mg/kg IV/IO</strong> (0.1 mL/kg of 0.1 mg/mL)'},
            {l:'Max',v:'1 mg per dose'},
            {l:'Repeat',v:'Every 3–5 min as needed'},
          ],
          note:'Preferred for hemodynamically significant bradycardia; effective regardless of cause'
        })}
        ${drugCard({name:'Atropine', tag:'Vagal / nodal bradycardia', tagColor:'teal',
          rows:[
            {l:'Dose',v:'<strong>0.02 mg/kg IV/IO</strong>'},
            {l:'Min dose',v:'0.1 mg (to avoid paradoxical bradycardia)'},
            {l:'Max dose',v:'0.5 mg (child); 1 mg (adolescent)'},
            {l:'Repeat',v:'May repeat once (max total: 1 mg child, 2 mg adolescent)'},
          ],
          note:'Effective for increased vagal tone and AV nodal block. Not reliable for infranodal (Mobitz II, complete) block.'
        })}
      </div>
    `;}
  },

  // ── Pediatric Tachycardia ─────────────────────────────────────────────────
  {
    id:'tachy', label:'Tachycardia',
    render() { return `
      <div class="sec-title"><span class="sec-badge warn">TACHYCARDIA</span> Pediatric Tachycardia with Pulse</div>

      ${ekgStrip([
        {label:'SVT',  sub:'HR &gt;220 infant · narrow · regular', path:EKG.pedsvt, color:'c-warn'},
        {label:'V-Tach',sub:'Wide · regular · fast',               path:EKG.pvt,    color:'c-red'},
      ])}

      ${callout('danger', 'Unstable → Immediate Synchronized Cardioversion', `
        <p>Signs of instability: altered mental status, signs of shock, respiratory distress, or hypotension <em>caused by the tachycardia</em>.</p>
        <ul>
          <li><strong>SVT (narrow, regular):</strong> 0.5–1 J/kg synchronized; if no response → 2 J/kg</li>
          <li><strong>VT with pulse (wide, regular):</strong> 0.5–1 J/kg synchronized; increase PRN</li>
          <li>Sedate before cardioversion if possible and no significant delay</li>
          <li>Adenosine may be attempted for narrow regular tachycardia while preparing for cardioversion</li>
        </ul>`
      )}

      ${phase('Stable — Narrow Complex SVT (QRS < 0.09 sec, regular)', [
        'Obtain 12-lead ECG; assess for P waves and regularity',
        '<strong>Vagal maneuvers first</strong>: ice to face/forehead in infants (10–15 sec); Valsalva in older children',
        'If vagal maneuvers fail → <strong>Adenosine 0.1 mg/kg IV/IO rapid push</strong> (max first dose 6 mg)',
        'Follow immediately with <strong>5–10 mL NS flush as fast as possible</strong> (use stopcock technique)',
        'If no response in 1–2 min: <strong>Adenosine 0.2 mg/kg</strong> (max 12 mg) with NS flush',
        'If no response to 2 doses → synchronized cardioversion; expert consultation',
      ])}

      ${phase('Stable — Wide Complex (QRS ≥ 0.09 sec)', [
        'Treat as VT until proven otherwise — wide complex tachycardia is VT in most children',
        'Obtain 12-lead ECG; expert (pediatric cardiology) consultation strongly recommended',
        '<strong>Amiodarone 5 mg/kg IV/IO</strong> over 20–60 minutes for stable monomorphic VT',
        '<strong>Procainamide 15 mg/kg IV/IO</strong> over 30–60 min — alternative to amiodarone',
        '<strong>Do NOT give amiodarone and procainamide together</strong> — risk of fatal arrhythmia',
        'If deteriorates → synchronized cardioversion',
      ])}

      <div class="drug-grid">
        ${drugCard({name:'Adenosine', tag:'SVT first-line', tagColor:'ok',
          rows:[
            {l:'1st dose',v:'<strong>0.1 mg/kg IV/IO rapid push</strong> (max 6 mg)'},
            {l:'2nd dose',v:'<strong>0.2 mg/kg IV/IO rapid push</strong> (max 12 mg)'},
            {l:'Flush',v:'5–10 mL NS immediately after each dose via stopcock'},
            {l:'Technique',v:'Draw adenosine and flush in separate syringes; push together'},
          ],
          note:'Half-life 6–10 seconds — must reach central circulation quickly. Antecubital or above preferred. Warn of transient chest pain, flushing. Contraindicated in 2nd/3rd degree AV block, sick sinus syndrome, WPW + AFib.'
        })}
        ${drugCard({name:'Amiodarone', tag:'Stable VT', tagColor:'warn',
          rows:[
            {l:'Dose',v:'<strong>5 mg/kg IV/IO</strong> (max 300 mg per dose)'},
            {l:'Rate',v:'Over 20–60 min for non-arrest (over 3–5 min in arrest)'},
            {l:'Repeat',v:'May repeat up to 3× in arrest (total 15 mg/kg max)'},
          ],
          note:'Monitor BP and HR during infusion — may cause hypotension and bradycardia. Do not combine with procainamide.'
        })}
        ${drugCard({name:'Procainamide', tag:'Alt for stable wide VT', tagColor:'',
          rows:[
            {l:'Dose',v:'<strong>15 mg/kg IV/IO</strong> over 30–60 min'},
            {l:'Stop if',v:'Arrhythmia resolves, hypotension, QRS widens &gt;50%'},
          ],
          note:'Do not use with amiodarone. Preferred by some for SVT with aberrancy vs VT when uncertain.'
        })}
      </div>

      ${callout('info', 'SVT vs Sinus Tachycardia', `
        <ul>
          <li><strong>SVT:</strong> abrupt onset/termination; HR typically &gt;220 (infant) or &gt;180 (child); no variability; P waves absent or abnormal</li>
          <li><strong>Sinus tach:</strong> gradual onset; HR varies with activity; P waves normal; history consistent with fever/dehydration/pain/anemia</li>
          <li>If uncertain: treat underlying cause (fluid, antipyretics) and reassess before adenosine</li>
        </ul>`
      )}
    `;}
  },

  // ── Pediatric Post-Arrest Care ────────────────────────────────────────────
  {
    id:'rosc', label:'Post-Arrest Care',
    render() { return `
      <div class="sec-title"><span class="sec-badge ok">ROSC</span> Pediatric Post-Cardiac Arrest Care</div>

      ${ekgStrip([
        {label:'Goal Rhythm', sub:'NSR after ROSC', path:EKG.nsr, color:'c-ok'},
      ])}

      ${phase('Airway & Breathing', [
        'If not following commands or inadequate respirations → advanced airway (ETT preferred in children post-arrest)',
        'Confirm ETT placement: waveform capnography, bilateral breath sounds, symmetric chest rise',
        'Titrate FiO₂ to <strong>SpO₂ 94–99%</strong> — avoid hyperoxia and hypoxia',
        'Target <strong>PaCO₂ 35–45 mmHg</strong> (ETCO₂ ~35–40 mmHg) — hyperventilation worsens neurologic outcome',
        'Rate: weight-appropriate (infant 30/min; child 20/min; adolescent 10–12/min)',
      ])}

      ${phase('Circulation & Hemodynamics', [
        'Target age-appropriate MAP; vasopressors if hypotensive after fluid resuscitation',
        'IV/IO fluid: 10–20 mL/kg NS bolus; reassess after each bolus',
        'Vasopressors: norepinephrine 0.1–2 mcg/kg/min; epinephrine 0.1–1 mcg/kg/min; dopamine 2–20 mcg/kg/min',
        '12-lead ECG to identify underlying arrhythmia or structural heart disease',
        'Bedside echo if available: assess myocardial function, identify structural abnormality',
      ])}

      ${phase('Targeted Temperature Management', [
        'Comatose infants and children post-cardiac arrest: TTM <strong>32–34°C × 48 hours</strong>, then normothermia 36–37.5°C × 72 hours',
        'Alternatively: normothermia (36–37.5°C) for 5 days if TTM 32–34°C not feasible',
        '<strong>Prevent fever (&gt;38°C) for at least 72 hours</strong> post-ROSC regardless of TTM strategy',
        'Rewarming: no faster than 0.5°C per hour',
        'Neuromuscular blockade to prevent shivering if needed during cooling',
      ])}

      ${phase('Metabolic & Neurologic', [
        'Glucose: maintain <strong>70–180 mg/dL</strong> — neonates and infants especially prone to hypoglycemia',
        'Seizures: very common post-arrest in children; treat with levetiracetam, phenobarbital, or fosphenytoin',
        'Continuous EEG monitoring in comatose post-arrest patients when feasible',
        'Neurologic prognostication: not before 72 hours (or 72 h after TTM completion)',
        'Identify underlying cause: congenital heart disease, channelopathy, metabolic disorder',
      ])}

      ${callout('ok', 'Post-Arrest Goals Summary', `
        <ul>
          <li><strong>SpO₂ 94–99%</strong> — avoid hyperoxia</li>
          <li><strong>PaCO₂ 35–45 mmHg</strong> — avoid hyperventilation</li>
          <li><strong>Temperature 32–34°C × 48 h</strong> (comatose) or normothermia × 5 days</li>
          <li><strong>Glucose 70–180 mg/dL</strong></li>
          <li>Age-appropriate MAP; vasopressors as needed</li>
          <li>PICU admission; continuous cardiac and EEG monitoring</li>
          <li>Family counseling and psychosocial support</li>
        </ul>`
      )}
    `;}
  },

  // ── Respiratory Emergencies ───────────────────────────────────────────────
  {
    id:'resp', label:'Respiratory',
    render() { return `
      <div class="sec-title"><span class="sec-badge teal">RESPIRATORY</span> Pediatric Respiratory Emergencies</div>

      ${ekgStrip([
        {label:'Sinus Tachy', sub:'HR &gt;100 · compensatory · P before QRS', path:EKG.stachy, color:'c-warn'},
      ])}

      <div class="sec-note">Respiratory failure is the leading cause of pediatric cardiac arrest. Early recognition and intervention can prevent arrest.</div>

      ${callout('warn', 'Signs of Impending Respiratory Failure', `
        <ul>
          <li>Increased work of breathing: tachypnea, retractions (suprasternal, intercostal, subcostal), nasal flaring, grunting</li>
          <li>Altered mental status: agitation, drowsiness, poor response to stimulation</li>
          <li>Paradoxical breathing (seesaw pattern) — advanced obstruction or neuromuscular failure</li>
          <li>Decreased air movement on auscultation despite increased effort</li>
          <li>SpO₂ &lt;90% on room air; PaO₂ &lt;60 mmHg; PaCO₂ &gt;50 mmHg with acidosis</li>
          <li>Exhaustion: slowing respiratory rate after tachypnea — ominous sign</li>
        </ul>`
      )}

      ${phase('Upper Airway Obstruction — Croup (Viral Laryngotracheobronchitis)', [
        'Barky seal-like cough, stridor, hoarse voice; typically 6 months–3 years; viral etiology',
        'Humidified air or cool mist (minimal evidence but may comfort); <strong>do not agitate child</strong>',
        '<strong>Dexamethasone 0.6 mg/kg PO/IM/IV</strong> (max 16 mg) — mainstay; single dose effective',
        'Moderate-severe: <strong>racemic epinephrine 0.5 mL of 2.25% nebulized</strong> in 2.5 mL NS; or L-epinephrine 5 mL of 1:1,000 nebulized',
        'Observe minimum 2–4 hours after racemic epi (rebound effect); admit if required &gt;1 dose',
        'Heliox (70:30) for severe refractory croup; intubate only if progressive failure',
      ])}

      ${phase('Upper Airway Obstruction — Epiglottitis', [
        'Tripod positioning, drooling, "hot potato" voice, high fever, rapidly progressive — <strong>medical emergency</strong>',
        '<strong>Do not perform throat examination</strong> — may precipitate complete obstruction',
        'Keep child calm; allow position of comfort; <strong>do not lay flat</strong>',
        'Emergent ENT, anesthesia, and OR notification — airway secured in controlled setting',
        'If airway lost before OR: bag-valve-mask, then intubation or surgical airway',
        'Antibiotics: ceftriaxone 100 mg/kg/day IV (max 4 g/day); cover H. influenzae and S. aureus',
      ])}

      ${phase('Lower Airway Obstruction — Asthma', [
        'Assess severity: mild (speaking in sentences, SpO₂ &ge;94%) → moderate (phrases, SpO₂ 90–94%) → severe (words only, SpO₂ &lt;90%, accessory muscles)',
        '<strong>Albuterol 0.15 mg/kg nebulized</strong> (min 2.5 mg, max 5 mg) every 20 min × 3; MDI 4–8 puffs with spacer is equivalent',
        '<strong>Ipratropium 0.25–0.5 mg nebulized</strong> with albuterol for first 1–3 doses (moderate-severe)',
        '<strong>Systemic corticosteroids</strong> within 1 hour: prednisolone 1–2 mg/kg PO (max 40 mg) or methylprednisolone 1–2 mg/kg IV',
        'Severe/refractory: magnesium sulfate 50 mg/kg IV over 20 min (max 2 g); heliox; terbutaline infusion',
        'NIPPV (BiPAP) for severe bronchospasm before intubation — intubation high risk in severe asthma',
      ])}

      ${phase('RSI for Pediatric Intubation', [
        'Indications: respiratory failure, loss of protective reflexes, GCS &le;8 with airway risk',
        'Pre-oxygenate 100% O₂ × 3–5 min; position with shoulder roll in infants',
        '<strong>Ketamine 1–2 mg/kg IV</strong> (preferred induction agent — bronchodilatory, maintains airway reflexes)',
        '<strong>Rocuronium 1.2 mg/kg IV</strong> (preferred paralytic for RSI); succinylcholine 2 mg/kg IV &lt;10 kg, 1.5 mg/kg if older',
        'ETT size: uncuffed = (age/4) + 4; cuffed = (age/4) + 3.5; or use Broselow tape',
        'Depth at lip: 3× ETT inner diameter; confirm with waveform capnography and bilateral breath sounds',
      ])}
    `;}
  },

  // ── Pediatric Shock ───────────────────────────────────────────────────────
  {
    id:'shock', label:'Shock',
    render() { return `
      <div class="sec-title"><span class="sec-badge">SHOCK</span> Pediatric Shock</div>

      ${ekgStrip([
        {label:'Sinus Tachy', sub:'HR &gt;100 · compensatory tachycardia', path:EKG.stachy, color:'c-warn'},
      ])}

      ${callout('warn', 'Shock Recognition in Children', `
        <ul>
          <li>Tachycardia is the <strong>earliest and most sensitive</strong> sign of shock in children</li>
          <li>Children compensate well — hypotension is a <strong>late</strong> and <strong>pre-arrest</strong> finding</li>
          <li>Clinical signs: tachycardia, prolonged capillary refill (&gt;2 sec), weak peripheral pulses, mottled/pallid skin, altered mental status, decreased urine output</li>
          <li>BP within normal range does <strong>NOT</strong> rule out shock in children</li>
        </ul>`
      )}

      ${phase('General Shock Management', [
        'IV or IO access × 2 if possible; IO preferred if IV access delayed',
        '<strong>Fluid resuscitation: 20 mL/kg NS or LR IV/IO</strong> bolus over 5–10 min; repeat up to 60 mL/kg total assessing response after each bolus',
        'Reassess after each bolus: HR, BP, capillary refill, mental status, urine output',
        'Supplemental O₂; airway management as needed; continuous cardiac monitoring',
        'Labs: CBC, BMP, lactate, blood cultures × 2, glucose, ABG/VBG, coagulation',
        'If no improvement after 40–60 mL/kg fluid → vasopressors; PICU consultation',
      ])}

      ${phase('Septic Shock', [
        'Blood cultures × 2 (before antibiotics if does not delay &gt;45 min)',
        '<strong>IV antibiotics within 1 hour</strong>: broad-spectrum coverage (vancomycin + cefepime or piperacillin-tazobactam)',
        'Fluid resuscitation as above; reassess for hepatomegaly or rales before each bolus (cardiogenic risk)',
        '<strong>Cold shock</strong> (weak pulses, narrow pulse pressure, prolonged cap refill): <strong>epinephrine 0.1–1 mcg/kg/min</strong>',
        '<strong>Warm shock</strong> (bounding pulses, wide pulse pressure, flash cap refill): <strong>norepinephrine 0.1–2 mcg/kg/min</strong>',
        'Refractory shock: consider hydrocortisone 2 mg/kg IV (max 100 mg) for suspected adrenal insufficiency; PICU transfer',
      ])}

      ${phase('Anaphylaxis', [
        'Remove trigger; call for help; place supine with legs elevated (unless respiratory distress)',
        '<strong>Epinephrine 0.01 mg/kg IM</strong> (anterolateral thigh; 1 mg/mL concentration; max 0.5 mg) — <strong>give immediately, first-line</strong>',
        'Repeat epinephrine every 5–15 min if no improvement; most patients need only 1–2 doses',
        'Supplemental O₂; albuterol nebulized for bronchospasm',
        'IV fluid 20 mL/kg NS for hypotension',
        'Diphenhydramine 1 mg/kg IV/IM (max 50 mg) and methylprednisolone 1 mg/kg IV (max 125 mg) — adjuncts only, not substitutes for epinephrine',
        'Observe minimum 4–6 hours for biphasic reaction (recurrence without re-exposure)',
      ])}

      ${phase('Hypovolemic Shock', [
        'Identify and control bleeding source',
        'Fluid resuscitation: 20 mL/kg NS or LR boluses; reassess after each',
        'Hemorrhagic shock: early blood products preferred over crystalloid — 10 mL/kg pRBC; 1:1:1 ratio if MTP activated',
        'For traumatic hemorrhage: permissive hypotension (MAP 50–60 mmHg) until surgical hemorrhage control',
        'Tranexamic acid (TXA): 15 mg/kg IV (max 1 g) within 3 hours of injury for hemorrhagic shock',
      ])}
    `;}
  },

  // ── PALS Medications ─────────────────────────────────────────────────────
  {
    id:'meds', label:'Medications',
    render() { return `
      <div class="sec-title"><span class="sec-badge purple">MEDS</span> PALS Drug Reference</div>

      <div class="sec-note">All doses are weight-based. Use Broselow tape or length-based tool for rapid weight estimation. Double-check concentrations — epinephrine errors are common and potentially fatal.</div>

      <table class="drug-table">
        <thead>
          <tr>
            <th>Drug</th>
            <th>Dose</th>
            <th>Max / Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="drug-name-cell">Adenosine</td>
            <td class="dose-cell">0.1 mg/kg IV/IO rapid push (1st dose)<br>0.2 mg/kg IV/IO (2nd dose)</td>
            <td class="note-cell">Max 1st: 6 mg; Max 2nd: 12 mg. Immediate NS flush (5–10 mL). Stopcock technique preferred.</td>
          </tr>
          <tr>
            <td class="drug-name-cell">Amiodarone</td>
            <td class="dose-cell">5 mg/kg IV/IO</td>
            <td class="note-cell">Max 300 mg/dose. Push over 3–5 min in arrest; over 20–60 min in non-arrest. May repeat ×2. Do not combine with procainamide.</td>
          </tr>
          <tr>
            <td class="drug-name-cell">Atropine</td>
            <td class="dose-cell">0.02 mg/kg IV/IO</td>
            <td class="note-cell">Min 0.1 mg. Max 0.5 mg (child), 1 mg (adolescent). May repeat once. Use for vagal/nodal bradycardia.</td>
          </tr>
          <tr>
            <td class="drug-name-cell">Calcium chloride 10%</td>
            <td class="dose-cell">20 mg/kg IV/IO<br>(0.2 mL/kg of 10% solution)</td>
            <td class="note-cell">Max 1 g. Slow IV push (central line preferred). For hyperkalemia, hypocalcemia, hypermagnesemia, CCB toxicity.</td>
          </tr>
          <tr>
            <td class="drug-name-cell">Dextrose</td>
            <td class="dose-cell">0.5–1 g/kg IV/IO</td>
            <td class="note-cell">D10W 5–10 mL/kg (neonate/infant). D25W 2–4 mL/kg (child). D50W 1–2 mL/kg (adolescent). Target glucose 70–180.</td>
          </tr>
          <tr>
            <td class="drug-name-cell">Epinephrine<br><em>(cardiac arrest)</em></td>
            <td class="dose-cell">0.01 mg/kg IV/IO<br>(0.1 mL/kg of 0.1 mg/mL)</td>
            <td class="note-cell">Max 1 mg. Use <strong>0.1 mg/mL (1:10,000)</strong> concentration. Repeat every 3–5 min. Flush with 5–10 mL NS.</td>
          </tr>
          <tr>
            <td class="drug-name-cell">Epinephrine<br><em>(anaphylaxis / bradycardia)</em></td>
            <td class="dose-cell">0.01 mg/kg IM<br>(0.01 mL/kg of 1 mg/mL)</td>
            <td class="note-cell">Max 0.5 mg. Use <strong>1 mg/mL (1:1,000)</strong> for IM. Anterolateral thigh. Repeat q5–15 min for anaphylaxis.</td>
          </tr>
          <tr>
            <td class="drug-name-cell">Lidocaine<br><em>(cardiac arrest)</em></td>
            <td class="dose-cell">1 mg/kg IV/IO bolus</td>
            <td class="note-cell">Alt to amiodarone for VF/pVT. Infusion: 20–50 mcg/kg/min after ROSC.</td>
          </tr>
          <tr>
            <td class="drug-name-cell">Magnesium sulfate</td>
            <td class="dose-cell">25–50 mg/kg IV/IO</td>
            <td class="note-cell">Max 2 g. Over 10–20 min (over 3–5 min in torsades arrest). For torsades de pointes, hypomagnesemia, severe asthma.</td>
          </tr>
          <tr>
            <td class="drug-name-cell">Naloxone</td>
            <td class="dose-cell">0.01 mg/kg IV/IO/IM<br>IN: 0.1 mg/kg</td>
            <td class="note-cell">Max 0.4 mg (opioid-naive); higher doses (2 mg) if needed. Titrate to adequate ventilation, not full reversal.</td>
          </tr>
          <tr>
            <td class="drug-name-cell">Procainamide</td>
            <td class="dose-cell">15 mg/kg IV/IO</td>
            <td class="note-cell">Over 30–60 min. Stop if: arrhythmia resolves, hypotension, QRS widens &gt;50%. Do not use with amiodarone.</td>
          </tr>
          <tr>
            <td class="drug-name-cell">Sodium bicarbonate</td>
            <td class="dose-cell">1 mEq/kg IV/IO slow push</td>
            <td class="note-cell">For metabolic acidosis, TCA OD, hyperkalemia. Flush with NS before and after — incompatible with calcium and epi.</td>
          </tr>
        </tbody>
      </table>

      ${callout('danger', 'Epinephrine Concentration Alert', `
        <ul>
          <li><strong>Cardiac arrest IV/IO:</strong> use <strong>0.1 mg/mL (1:10,000)</strong> → give 0.1 mL/kg</li>
          <li><strong>Anaphylaxis/bradycardia IM:</strong> use <strong>1 mg/mL (1:1,000)</strong> → give 0.01 mL/kg</li>
          <li>Using the wrong concentration is a 10× overdose — verify concentration before drawing</li>
          <li>Color coding: 1:1,000 = blue label; 1:10,000 = green label (may vary by manufacturer)</li>
        </ul>`
      )}

      ${callout('info', 'IO Access Quick Reference', `
        <ul>
          <li>Proximal tibia: 1–2 cm below tibial tuberosity, medial flat surface</li>
          <li>EZ-IO: 15 mm pink (3–39 kg); 25 mm blue (&ge;40 kg); 45 mm yellow (obese/deep tissue)</li>
          <li>Confirm: secure in bone, no infiltration, flush flows freely; marrow aspiration if uncertain</li>
          <li>All medications, fluids, and blood products can be administered IO</li>
          <li>Remove within 24 hours; obtain IV access when patient stabilizes</li>
        </ul>`
      )}
    `;}
  },

];

// ── Nav & render ──────────────────────────────────────────────────────────────

let current = SECTIONS[0].id;

function buildTabs() {
  const nav = document.getElementById('tabNav');
  nav.innerHTML = SECTIONS.map(s =>
    `<button class="tab-btn${s.id===current?' active':''}" data-id="${esc(s.id)}">${esc(s.label)}</button>`
  ).join('');
  nav.addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    current = btn.dataset.id;
    nav.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderSection();
    window.scrollTo({top:0,behavior:'smooth'});
  });
}

function renderSection() {
  const sec = SECTIONS.find(s => s.id === current);
  document.getElementById('content').innerHTML = sec ? sec.render() : '';
}

buildTabs();
renderSection();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/pals/sw.js').catch(() => {});
  window.addEventListener('offline', () => { document.getElementById('offlineBadge').hidden = false; });
  window.addEventListener('online',  () => { document.getElementById('offlineBadge').hidden = true; });
  if (!navigator.onLine) document.getElementById('offlineBadge').hidden = false;
}
