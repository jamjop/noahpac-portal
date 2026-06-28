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
  svt:    `M0,35 L1,39 L2,4 L3,43 L5,35 Q15,30 28,35 L80,35 L81,39 L82,4 L83,43 L85,35 Q95,30 108,35 L160,35 L161,39 L162,4 L163,43 L165,35 Q175,30 188,35 L240,35 L241,39 L242,4 L243,43 L245,35 Q255,30 268,35 L320,35 L321,39 L322,4 L323,43 L325,35 Q335,30 348,35 L400,35 L401,39 L402,4 L403,43 L405,35 Q415,30 428,35 L480,35`,
  pvt:    `M0,35 C8,35 20,4 25,4 C30,4 44,60 48,60 C52,60 57,35 60,35 C68,35 80,4 85,4 C90,4 104,60 108,60 C112,60 117,35 120,35 C128,35 140,4 145,4 C150,4 164,60 168,60 C172,60 177,35 180,35 C188,35 200,4 205,4 C210,4 224,60 228,60 C232,60 237,35 240,35 C248,35 260,4 265,4 C270,4 284,60 288,60 C292,60 297,35 300,35 C308,35 320,4 325,4 C330,4 344,60 348,60 C352,60 357,35 360,35 C368,35 380,4 385,4 C390,4 404,60 408,60 C412,60 417,35 420,35 C428,35 440,4 445,4 C450,4 464,60 468,60 C472,60 477,35 480,35`,
  vf:     `M0,35 Q6,48 12,22 Q16,8 20,56 Q24,65 28,16 Q32,4 36,58 Q40,66 44,20 Q48,8 52,54 Q56,62 60,22 Q64,10 68,56 Q72,64 76,18 Q80,6 84,52 Q88,62 92,24 Q96,12 100,54 Q104,62 108,20 Q112,8 116,56 Q120,64 124,18 Q128,6 132,52 Q136,60 140,24 Q144,14 148,54 Q152,62 156,22 Q160,10 164,56 Q168,64 172,18 Q176,6 180,52 Q184,62 188,24 Q192,12 196,54 Q200,60 204,20 Q208,8 212,52 Q216,60 220,22 Q224,12 228,56 Q232,64 236,20 Q240,8 244,54 Q248,62 252,24 Q256,12 260,54 Q264,60 268,22 Q272,10 276,56 Q280,64 284,18 Q288,6 292,52 Q296,60 300,24 Q304,12 308,54 Q312,62 316,22 Q320,10 324,56 Q328,64 332,18 Q336,6 340,52 Q344,62 348,24 Q352,12 356,52 Q360,62 364,20 Q368,8 372,56 Q376,64 380,18 Q384,6 388,52 Q392,60 396,24 Q400,14 404,56 Q408,64 412,20 Q416,8 420,52 Q424,60 428,24 Q432,12 436,56 Q440,64 444,18 Q448,6 452,52 Q456,60 460,24 Q464,14 468,54 Q472,62 476,26 Q478,40 480,35`,
  asys:   `M0,35 Q120,34 240,36 Q360,35 480,35`,
  pea:    `M0,35 L18,35 L21,39 L26,4 L34,4 L39,43 L45,35 Q57,26 70,35 L230,35 L233,39 L238,4 L246,4 L251,43 L257,35 Q269,26 282,35 L480,35`,
  afib:   `M0,35 Q4,32 8,35 Q12,38 16,35 Q20,32 24,35 Q28,38 32,35 Q36,32 40,35 Q44,38 48,35 L50,39 L52,4 L54,43 L57,35 Q65,27 74,35 Q78,32 82,35 Q86,38 90,35 Q94,32 98,35 L100,39 L102,4 L104,43 L107,35 Q115,27 124,35 Q128,32 132,35 Q136,38 140,35 Q144,32 148,35 Q152,38 156,35 L158,39 L160,4 L162,43 L165,35 Q173,27 182,35 Q186,32 190,35 Q194,38 198,35 Q202,32 206,35 L208,39 L210,4 L212,43 L215,35 Q223,27 232,35 Q236,32 240,35 Q244,38 248,35 Q252,32 256,35 Q260,38 264,35 Q268,32 272,35 L274,39 L276,4 L278,43 L281,35 Q289,27 298,35 Q302,32 306,35 Q310,38 314,35 Q318,32 322,35 Q326,38 330,35 Q334,32 338,35 L340,39 L342,4 L344,43 L347,35 Q355,27 364,35 Q368,32 372,35 Q376,38 380,35 Q384,32 388,35 Q392,38 396,35 Q400,32 404,35 L406,39 L408,4 L410,43 L413,35 Q421,27 430,35 Q434,32 438,35 Q442,38 446,35 Q450,32 454,35 L456,39 L458,4 L460,43 L463,35 Q471,27 480,35`,
  stemi:  `M0,35 L5,35 Q12,28 19,35 L28,35 L30,39 L32,4 L34,27 L50,25 Q60,14 72,35 L120,35 L125,35 Q132,28 139,35 L148,35 L150,39 L152,4 L154,27 L170,25 Q180,14 192,35 L240,35 L245,35 Q252,28 259,35 L268,35 L270,39 L272,4 L274,27 L290,25 Q300,14 312,35 L360,35 L365,35 Q372,28 379,35 L388,35 L390,39 L392,4 L394,27 L410,25 Q420,14 432,35 L480,35`,
  nstemi: `M0,35 L5,35 Q12,28 19,35 L28,35 L30,39 L32,4 L34,43 L37,35 L46,43 L58,43 Q66,50 78,35 L120,35 L125,35 Q132,28 139,35 L148,35 L150,39 L152,4 L154,43 L157,35 L166,43 L178,43 Q186,50 198,35 L240,35 L245,35 Q252,28 259,35 L268,35 L270,39 L272,4 L274,43 L277,35 L286,43 L298,43 Q306,50 318,35 L360,35 L365,35 Q372,28 379,35 L388,35 L390,39 L392,4 L394,43 L397,35 L406,43 L418,43 Q426,50 438,35 L480,35`,
  avb3:   `M0,35 L10,35 Q17,29 24,35 L72,35 L75,39 L80,4 L88,4 L92,43 L98,35 Q110,26 122,35 L128,35 Q135,29 142,35 L248,35 Q255,29 262,35 L272,35 L275,39 L280,4 L288,4 L292,43 L298,35 Q310,26 322,35 L368,35 Q375,29 382,35 L462,35 L465,39 L470,4 L478,4 L480,14`,
  stachy: `M0,35 Q5,31 10,35 L14,35 L16,39 L18,4 L20,43 L22,35 Q30,27 40,35 L80,35 Q85,31 90,35 L94,35 L96,39 L98,4 L100,43 L102,35 Q110,27 120,35 L160,35 Q165,31 170,35 L174,35 L176,39 L178,4 L180,43 L182,35 Q190,27 200,35 L240,35 Q245,31 250,35 L254,35 L256,39 L258,4 L260,43 L262,35 Q270,27 280,35 L320,35 Q325,31 330,35 L334,35 L336,39 L338,4 L340,43 L342,35 Q350,27 360,35 L400,35 Q405,31 410,35 L414,35 L416,39 L418,4 L420,43 L422,35 Q430,27 440,35 L480,35`,
  pedsvt: `M0,35 L1,39 L2,4 L3,43 L5,35 Q14,30 26,35 L60,35 L61,39 L62,4 L63,43 L65,35 Q74,30 86,35 L120,35 L121,39 L122,4 L123,43 L125,35 Q134,30 146,35 L180,35 L181,39 L182,4 L183,43 L185,35 Q194,30 206,35 L240,35 L241,39 L242,4 L243,43 L245,35 Q254,30 266,35 L300,35 L301,39 L302,4 L303,43 L305,35 Q314,30 326,35 L360,35 L361,39 L362,4 L363,43 L365,35 Q374,30 386,35 L420,35 L421,39 L422,4 L423,43 L425,35 Q434,30 446,35 L480,35`,
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

  // ── VF / pVT ──────────────────────────────────────────────────────────────
  {
    id:'vfpvt', label:'VF / pVT',
    render() { return `
      <div class="sec-title"><span class="sec-badge">SHOCKABLE</span> VF / Pulseless VT</div>

      ${ekgStrip([
        {label:'V-Fib',  sub:'Chaotic · no pulse',    path:EKG.vf,  color:'c-red'},
        {label:'p-VT',   sub:'Wide regular · no pulse',path:EKG.pvt, color:'c-red'},
      ])}

      ${phase('Initial Recognition & CPR', [
        'Confirm unresponsiveness — no normal breathing, no pulse (&le;10 sec check)',
        'Activate emergency response; send someone for defibrillator',
        'Begin high-quality CPR immediately: rate 100–120/min, depth &ge;2 in (5 cm), full chest recoil, minimize interruptions',
        'Attach monitor/defibrillator as soon as available — do not delay CPR',
      ])}

      ${phase('Shock → CPR → Rhythm Check Cycle', [
        '<strong>Shock:</strong> biphasic 120–200 J (per device recommendation); monophasic 360 J',
        '<strong>Immediately resume CPR</strong> for 2 minutes — do not check rhythm first',
        'Establish IV or IO access during CPR',
        'Check rhythm at end of 2-minute cycle; if shockable → shock again',
        'Epinephrine 1 mg IV/IO after 2nd shock; repeat every 3–5 min throughout arrest',
        'If VF/pVT persists after 3rd shock → antiarrhythmic (amiodarone or lidocaine)',
        'Continue CPR → shock → epinephrine cycle; treat reversible causes each cycle',
      ])}

      ${callout('danger', 'CPR Quality Targets', `
        <ul>
          <li>Rate: <strong>100–120/min</strong> — use metronome or feedback device</li>
          <li>Depth: <strong>&ge;2 inches (5 cm)</strong> in adults; avoid >2.4 inches (6 cm)</li>
          <li>Full chest recoil between compressions — do not lean</li>
          <li>Minimize interruptions: pause <strong>&lt;10 seconds</strong> for rhythm check and shock</li>
          <li>Rotate compressors every <strong>2 minutes</strong> to prevent fatigue-related compression decline</li>
          <li>Without advanced airway: <strong>30:2</strong> compression:ventilation ratio</li>
          <li>With advanced airway: continuous compressions + <strong>1 breath every 6 sec</strong> (10/min)</li>
          <li>Avoid excessive ventilation — causes air trapping and reduces venous return</li>
        </ul>`
      )}

      <div class="drug-grid">
        ${drugCard({name:'Epinephrine', tag:'Every 3–5 min', tagColor:'',
          rows:[
            {l:'Dose',v:'<strong>1 mg IV/IO</strong>'},
            {l:'Timing',v:'Give ASAP after 1st or 2nd shock; repeat q3–5 min'},
            {l:'Route',v:'IV push; follow with 20 mL NS flush'},
          ],
          note:'No proven benefit to high-dose epi; standard 1 mg dosing throughout arrest'
        })}
        ${drugCard({name:'Amiodarone', tag:'After 3rd shock', tagColor:'warn',
          rows:[
            {l:'1st dose',v:'<strong>300 mg IV/IO</strong> push'},
            {l:'2nd dose',v:'150 mg IV/IO push'},
            {l:'Indication',v:'Refractory VF/pVT after ≥3 shocks + epinephrine'},
          ],
          note:'Preferred antiarrhythmic; give during CPR, not during rhythm check pause'
        })}
        ${drugCard({name:'Lidocaine', tag:'Alt to amiodarone', tagColor:'teal',
          rows:[
            {l:'1st dose',v:'<strong>1–1.5 mg/kg IV/IO</strong>'},
            {l:'2nd dose',v:'0.5–0.75 mg/kg IV/IO'},
            {l:'Max',v:'3 mg/kg total'},
          ],
          note:'Acceptable alternative if amiodarone unavailable; do not give both'
        })}
      </div>

      ${callout('warn', "Reversible Causes — H's & T's", `
        <ul>
          <li><strong>H</strong>ypovolemia — IV/IO fluid bolus</li>
          <li><strong>H</strong>ypoxia — optimize ventilation; check ETT/SGA placement</li>
          <li><strong>H</strong>ydrogen ion (acidosis) — sodium bicarbonate if severe or prolonged arrest</li>
          <li><strong>H</strong>ypo/Hyperkalemia — calcium chloride for hyperkalemia; replete for hypokalemia</li>
          <li><strong>H</strong>ypothermia — active rewarming; continue CPR until core temp &ge;30°C</li>
          <li><strong>T</strong>ension pneumothorax — needle decompression 2nd ICS MCL or 4th/5th ICS AAL</li>
          <li><strong>T</strong>amponade (cardiac) — pericardiocentesis; bedside ultrasound if available</li>
          <li><strong>T</strong>oxins — specific antidotes (e.g., naloxone, flumazenil, sodium bicarb for TCA)</li>
          <li><strong>T</strong>hrombosis (pulmonary) — thrombolytics (tPA 50 mg IV); continue CPR 60–90 min after</li>
          <li><strong>T</strong>hrombosis (coronary) — cath lab activation for STEMI suspected cause of arrest</li>
        </ul>`
      )}

      <div class="sec-note">If ROSC achieved → proceed to Post-Cardiac Arrest Care. If no ROSC after appropriate resuscitation, consider termination of resuscitation per protocol.</div>
    `;}
  },

  // ── Asystole / PEA ────────────────────────────────────────────────────────
  {
    id:'pea', label:'Asystole / PEA',
    render() { return `
      <div class="sec-title"><span class="sec-badge">NON-SHOCKABLE</span> Asystole / PEA</div>

      ${ekgStrip([
        {label:'Asystole', sub:'Flat · no electrical activity', path:EKG.asys, color:'c-muted'},
        {label:'PEA',      sub:'Organized · no pulse',          path:EKG.pea,  color:'c-warn'},
      ])}

      ${phase('Initial Steps', [
        'Confirm cardiac arrest: unresponsive, no breathing, no pulse',
        'Begin high-quality CPR immediately; minimize interruptions',
        'Establish IV or IO access during CPR',
        'Confirm asystole/PEA: check lead connections, gain on monitor, check multiple leads',
        '<strong>Epinephrine 1 mg IV/IO as soon as access is obtained</strong>; repeat every 3–5 min',
        'Advanced airway (ETT or SGA) when feasible; confirm placement with waveform capnography',
      ])}

      ${phase('2-Minute CPR Cycles', [
        'Check rhythm every 2 minutes; minimize pause to &lt;10 sec',
        'If shockable rhythm (VF/pVT) develops → switch to shockable algorithm immediately',
        'If organized rhythm on monitor → pulse check (&le;10 sec); if pulse present → post-arrest care',
        'Continue epinephrine every 3–5 min; aggressively treat reversible causes (H&rsquo;s &amp; T&rsquo;s)',
        'If no ROSC after appropriate efforts → consider termination of resuscitation',
      ])}

      ${callout('danger', 'Key Differences from VF/pVT', `
        <ul>
          <li><strong>No defibrillation</strong> — asystole and PEA are non-shockable; shocking asystole is harmful</li>
          <li>Epinephrine is the <strong>only proven drug</strong> for asystole/PEA — give ASAP after access</li>
          <li>Atropine is <strong>NOT recommended</strong> for asystole or PEA (removed from AHA guidelines 2010)</li>
          <li>Sodium bicarbonate may be used for prolonged arrest, known hyperkalemia, or TCA toxicity</li>
          <li>Focus on <strong>identifying and treating reversible causes</strong> — PEA is often correctable</li>
        </ul>`
      )}

      ${callout('warn', "Reversible Causes — H's & T's", `
        <ul>
          <li><strong>H</strong>ypovolemia — most common PEA cause; aggressive IV/IO fluid resuscitation</li>
          <li><strong>H</strong>ypoxia — verify airway and ventilation; check SpO2 and ETCO2</li>
          <li><strong>H</strong>ydrogen ion (acidosis) — sodium bicarb 1 mEq/kg IV/IO if suspected</li>
          <li><strong>H</strong>ypo/Hyperkalemia — EKG changes; calcium chloride for hyperK; replace for hypoK</li>
          <li><strong>H</strong>ypothermia — core temp; active rewarming; ECMO if available for severe hypothermia</li>
          <li><strong>T</strong>ension pneumothorax — absent breath sounds, tracheal deviation; needle decompression</li>
          <li><strong>T</strong>amponade — bedside echo (effusion + RV collapse); pericardiocentesis</li>
          <li><strong>T</strong>oxins — history, pill bottles, pinpoint pupils; targeted antidotes</li>
          <li><strong>T</strong>hrombosis (pulmonary) — massive PE; consider thrombolytics</li>
          <li><strong>T</strong>hrombosis (coronary) — STEMI; cath lab activation</li>
        </ul>`
      )}

      ${callout('info', 'ETCO₂ as CPR Quality Indicator', `
        <ul>
          <li>Normal ETCO₂ during CPR: <strong>10–20 mmHg</strong> suggests adequate compressions</li>
          <li>ETCO₂ &lt;10 mmHg despite optimal CPR → consider reversible cause or termination</li>
          <li>Sudden <strong>rise in ETCO₂ &ge;40 mmHg</strong> suggests ROSC — check pulse before stopping CPR</li>
          <li>Do not use ETCO₂ as sole determinant for termination of resuscitation</li>
        </ul>`
      )}
    `;}
  },

  // ── Bradycardia ───────────────────────────────────────────────────────────
  {
    id:'brady', label:'Bradycardia',
    render() { return `
      <div class="sec-title"><span class="sec-badge warn">BRADYCARDIA</span> Bradycardia with Pulse</div>

      ${ekgStrip([
        {label:'Sinus Brady', sub:'HR &lt;60 · P before QRS',                    path:EKG.brady, color:'c-warn'},
        {label:'3° AV Block', sub:'Vent rate 20–40 · P &amp; QRS dissociated', path:EKG.avb3,  color:'c-red'},
      ])}

      <div class="sec-note">Bradycardia = HR &lt;60 bpm. Treat only if causing symptoms or hemodynamic compromise.</div>

      ${phase('Initial Assessment', [
        'Maintain patent airway; assist breathing if inadequate; supplemental O₂ if SpO₂ &lt;94%',
        'Attach cardiac monitor; obtain IV access; 12-lead ECG',
        'Identify and treat reversible causes: hypoxia, medications (&beta;-blockers, CCBs, digoxin), hyperkalemia, increased vagal tone, ACS, hypothyroidism',
        'Assess for signs of <strong>inadequate perfusion</strong>: hypotension, acutely altered mental status, ischemic chest discomfort, acute heart failure, shock',
      ])}

      ${phase('If Hemodynamically Unstable (inadequate perfusion)', [
        '<strong>Atropine 1 mg IV push</strong> — first-line agent; may repeat every 3–5 min; max 3 mg total',
        'If atropine ineffective or not appropriate for cause → <strong>transcutaneous pacing (TCP)</strong>',
        'While preparing TCP or if TCP unavailable: <strong>dopamine or epinephrine infusion</strong>',
        'Expert consultation for high-degree AV block, new LBBB, or refractory bradycardia',
        'Transvenous pacing for infranodal (Mobitz II, 3rd degree) blocks refractory to atropine',
      ])}

      ${phase('If Hemodynamically Stable', [
        'Monitor and observe; obtain 12-lead ECG to characterize rhythm',
        'Review medications — hold or reverse offending agents if possible',
        'Expert (cardiology) consultation; no emergent intervention required',
      ])}

      <div class="drug-grid">
        ${drugCard({name:'Atropine', tag:'First-line', tagColor:'ok',
          rows:[
            {l:'Dose',v:'<strong>1 mg IV push</strong>'},
            {l:'Repeat',v:'Every 3–5 min; max <strong>3 mg total</strong>'},
            {l:'Onset',v:'1–2 min IV'},
            {l:'Notes',v:'Effective for vagally mediated and nodal bradycardia'},
          ],
          note:'NOT reliable for Mobitz II or 3rd-degree AV block — do not delay pacing for repeat doses'
        })}
        ${drugCard({name:'Dopamine', tag:'Infusion', tagColor:'warn',
          rows:[
            {l:'Dose',v:'<strong>2–20 mcg/kg/min IV</strong> infusion'},
            {l:'Titrate',v:'Upward by 2–5 mcg/kg/min every 5–10 min to effect'},
            {l:'Notes',v:'Chronotropic and vasopressor; tachyarrhythmia risk at high doses'},
          ]
        })}
        ${drugCard({name:'Epinephrine', tag:'Infusion', tagColor:'',
          rows:[
            {l:'Dose',v:'<strong>2–10 mcg/min IV</strong> infusion'},
            {l:'Titrate',v:'Start 2 mcg/min; titrate to HR and BP response'},
            {l:'Notes',v:'Alternative to dopamine; use if patient in shock'},
          ]
        })}
      </div>

      ${callout('info', 'Transcutaneous Pacing (TCP)', `
        <ul>
          <li>Indications: atropine-refractory symptomatic bradycardia, Mobitz II, complete heart block</li>
          <li>Rate: set to <strong>60–80 bpm</strong></li>
          <li>Current: start at <strong>0 mA</strong>, increase in 10 mA steps until electrical capture (widened QRS after each spike)</li>
          <li>Mechanical capture: confirm with pulse palpation (femoral preferred to avoid artifact confusion)</li>
          <li>Typical capture threshold: <strong>40–80 mA</strong> but may be up to 200 mA</li>
          <li><strong>Analgesia and sedation</strong> for conscious patients — TCP is painful; use fentanyl + midazolam</li>
        </ul>`
      )}
    `;}
  },

  // ── Tachycardia ───────────────────────────────────────────────────────────
  {
    id:'tachy', label:'Tachycardia',
    render() { return `
      <div class="sec-title"><span class="sec-badge warn">TACHYCARDIA</span> Tachycardia with Pulse</div>

      ${ekgStrip([
        {label:'SVT',      sub:'HR &gt;150 · narrow · regular',   path:EKG.svt,  color:'c-warn'},
        {label:'A-Fib',    sub:'HR 100–160 · narrow · irregular', path:EKG.afib, color:'c-warn'},
        {label:'Stable VT',sub:'HR &gt;100 · wide · regular',     path:EKG.pvt,  color:'c-red'},
      ])}

      ${callout('danger', 'Unstable → Immediate Synchronized Cardioversion', `
        <p>Signs of instability: hypotension, acutely altered mental status, signs of shock, ischemic chest discomfort, or acute heart failure <em>caused by the tachycardia</em>.</p>
        <ul>
          <li>If IV access available and no significant delay: sedation before cardioversion</li>
          <li><strong>Narrow regular:</strong> start at 50–100 J (synchronized)</li>
          <li><strong>Narrow irregular (AFib):</strong> 120–200 J biphasic (synchronized)</li>
          <li><strong>Wide regular (monomorphic VT):</strong> 100 J (synchronized)</li>
          <li><strong>Wide irregular (polymorphic VT / torsades):</strong> defibrillation dose — <em>not synchronized</em></li>
          <li>If cardioversion fails: increase energy each attempt; consider antiarrhythmics</li>
        </ul>`
      )}

      ${phase('Stable — Narrow Complex (QRS ≤0.12 sec)', [
        'Obtain 12-lead ECG; determine if regular or irregular',
        '<strong>Regular narrow:</strong> attempt vagal maneuvers (Valsalva or carotid sinus massage)',
        'If vagal maneuvers fail: <strong>adenosine 6 mg IV rapid push</strong> + 20 mL NS flush',
        'If no response after 1–2 min: adenosine <strong>12 mg IV rapid push</strong> (may repeat once)',
        '<strong>Irregular narrow (AFib/flutter):</strong> rate control (beta-blocker or non-DHP CCB); anticoagulation per protocol; expert consultation',
        'If WPW with AFib: avoid AV nodal blockers — use procainamide or electrical cardioversion',
      ])}

      ${phase('Stable — Wide Complex (QRS >0.12 sec)', [
        'Obtain 12-lead ECG; treat as VT until proven otherwise',
        '<strong>Regular wide:</strong> adenosine if possible SVT with aberrancy (regular, monomorphic); antiarrhythmic for VT',
        'Amiodarone 150 mg IV over 10 min for stable monomorphic VT',
        'Procainamide 20–50 mg/min IV until arrhythmia suppressed, hypotension, QRS widens &gt;50%, or 17 mg/kg maximum',
        '<strong>Do not use</strong> adenosine for wide irregular rhythms or WPW with AFib',
        'Expert consultation strongly recommended for wide complex tachycardias',
      ])}

      <div class="drug-grid">
        ${drugCard({name:'Adenosine', tag:'SVT first-line', tagColor:'ok',
          rows:[
            {l:'1st dose',v:'<strong>6 mg IV rapid push</strong> at antecubital or above'},
            {l:'2nd dose',v:'<strong>12 mg IV rapid push</strong> (may repeat once)'},
            {l:'Flush',v:'Immediate 20 mL NS rapid push after each dose'},
          ],
          note:'Half-life 6–10 seconds. Warn patient of transient chest tightness, flushing, dyspnea. Do not use for irregular wide complex, WPW + AFib, or 2nd/3rd degree AV block.'
        })}
        ${drugCard({name:'Amiodarone', tag:'Stable VT / refractory SVT', tagColor:'warn',
          rows:[
            {l:'Loading dose',v:'<strong>150 mg IV</strong> over 10 min'},
            {l:'Maintenance',v:'1 mg/min × 6 h, then 0.5 mg/min × 18 h'},
            {l:'Max',v:'2.2 g/24 hours IV'},
          ],
          note:'Monitor for hypotension and bradycardia during infusion. Do not use with procainamide.'
        })}
        ${drugCard({name:'Procainamide', tag:'Wide complex VT', tagColor:'',
          rows:[
            {l:'Loading',v:'20–50 mg/min IV until effect, hypotension, or 17 mg/kg max'},
            {l:'Maintenance',v:'1–4 mg/min IV infusion'},
            {l:'Stop if',v:'Arrhythmia resolves, hypotension, QRS widens &gt;50%'},
          ],
          note:'Avoid in prolonged QT, HF, or concurrent amiodarone. Preferred by some for WPW + AFib.'
        })}
      </div>
    `;}
  },

  // ── Post-Cardiac Arrest Care ──────────────────────────────────────────────
  {
    id:'rosc', label:'Post-Arrest Care',
    render() { return `
      <div class="sec-title"><span class="sec-badge ok">ROSC</span> Post-Cardiac Arrest Care</div>

      ${ekgStrip([
        {label:'Goal Rhythm', sub:'NSR after ROSC', path:EKG.nsr, color:'c-ok'},
      ])}

      <div class="sec-note">ROSC = Return of Spontaneous Circulation. Immediate systematic post-arrest care significantly improves survival and neurologic outcomes.</div>

      ${phase('Airway & Breathing', [
        'If not following commands → advanced airway (ETT preferred); confirm with waveform capnography',
        'Titrate FiO₂ to maintain <strong>SpO₂ 92–98%</strong> — avoid hyperoxia (SpO₂ &gt;98% may worsen outcome)',
        'Ventilate to <strong>PaCO₂ 35–45 mmHg</strong> (ETCO₂ ~35–40 mmHg) — avoid hypo- and hyperventilation',
        'Rate: 10 breaths/min with advanced airway; avoid excessive minute ventilation',
      ])}

      ${phase('Circulation', [
        'Target <strong>SBP &ge;90 mmHg</strong> (MAP &ge;65 mmHg); treat hypotension aggressively',
        'IV fluid bolus (NS 1–2 L) for hypovolemia; vasopressors if fluid-refractory',
        '<strong>12-lead ECG immediately</strong> after ROSC — identify STEMI or presumed new LBBB',
        'If STEMI or suspected cardiac cause: <strong>emergent coronary angiography</strong> (cath lab activation) regardless of mental status',
        'Vasopressors: norepinephrine 0.1–0.5 mcg/kg/min IV; epinephrine 0.1–0.5 mcg/kg/min IV; dopamine 5–10 mcg/kg/min IV',
      ])}

      ${phase('Targeted Temperature Management (TTM)', [
        'Indication: adult comatose (not following commands) after ROSC from cardiac arrest',
        'Target temperature: <strong>32–36°C</strong> — select and maintain for at least <strong>24 hours</strong>',
        'Prevent fever (temperature &gt;37.7°C) for at least <strong>72 hours</strong> after ROSC',
        'Methods: cooling blankets, ice packs, endovascular cooling catheters, cold IV fluids',
        'Rewarm slowly: 0.25°C/hour if below target; avoid hyperthermia on rewarming',
        'Neuromuscular blockade may be required to prevent shivering during cooling',
      ])}

      ${phase('Disability & Metabolic', [
        'Glucose: maintain <strong>144–180 mg/dL</strong> — avoid hypoglycemia (&lt;70 mg/dL); tight control not beneficial',
        'Seizures: monitor for clinical and subclinical seizures; treat with levetiracetam, valproate, or phenytoin',
        'Neurologic prognostication: not before 72 hours post-ROSC (or 72 hours after TTM completion)',
        'Sedation and analgesia: fentanyl + propofol or midazolam infusion for mechanically ventilated patients',
      ])}

      ${callout('ok', 'Goals of Care', `
        <ul>
          <li><strong>MAP &ge;65 mmHg</strong> (some guidelines target 80–100 mmHg for neuroprotection)</li>
          <li><strong>SpO₂ 92–98%</strong> (avoid hyperoxia)</li>
          <li><strong>ETCO₂ 35–40 mmHg</strong> (PaCO₂ 35–45 mmHg)</li>
          <li><strong>Temperature 32–36°C</strong> × 24+ hours (comatose patients)</li>
          <li><strong>Glucose 144–180 mg/dL</strong></li>
          <li>12-lead ECG → cath lab if STEMI or suspected coronary cause</li>
          <li>ICU admission; continuous EEG monitoring if seizure concern</li>
        </ul>`
      )}
    `;}
  },

  // ── ACS ───────────────────────────────────────────────────────────────────
  {
    id:'acs', label:'ACS',
    render() { return `
      <div class="sec-title"><span class="sec-badge purple">ACS</span> Acute Coronary Syndromes</div>

      ${ekgStrip([
        {label:'STEMI',  sub:'ST elevation · convex', path:EKG.stemi,  color:'c-red'},
        {label:'NSTEMI', sub:'ST depression · T inv.', path:EKG.nstemi, color:'c-warn'},
      ])}

      ${phase('Immediate Assessment (first 10 minutes)', [
        'Targeted history: quality, radiation, onset, duration, associated symptoms; prior CAD, PCI, CABG',
        '<strong>12-lead ECG within 10 minutes</strong> of presentation — interpret immediately',
        'IV access × 2; continuous cardiac monitoring; pulse oximetry',
        'Labs: troponin, CBC, BMP, coagulation, lipids, BNP if HF concern; repeat troponin at 3 or 6 hours',
        'Portable CXR if STEMI does not delay reperfusion',
      ])}

      ${phase('Initial Treatment (MONA — evidence-adjusted)', [
        '<strong>O₂</strong>: only if SpO₂ &lt;90% or respiratory distress — do not routinely administer to normoxic patients',
        '<strong>Aspirin 325 mg PO chewed</strong> if no contraindication (allergy, active GI bleed)',
        '<strong>Nitroglycerin 0.4 mg SL</strong> every 5 min × 3 doses for ongoing ischemic pain',
        '<strong>P2Y₁₂ inhibitor</strong> (clopidogrel 600 mg, ticagrelor 180 mg, or prasugrel 60 mg) per protocol',
        '<strong>Morphine</strong> for severe pain unrelieved by nitrates — use cautiously in NSTEMI (may increase mortality); avoid in inferior MI with RV involvement',
        'Anticoagulation (heparin, enoxaparin, or bivalirudin) per ACS protocol',
      ])}

      ${phase('STEMI — Reperfusion Strategy', [
        'Goal: <strong>door-to-balloon &le;90 minutes</strong> at PCI-capable hospital',
        'If PCI not available within 120 min of first medical contact: thrombolytic therapy if no contraindications',
        'Activate cath lab as soon as STEMI identified on ECG — do not wait for biomarkers',
        'Thrombolytics: tPA (alteplase) 15 mg IV bolus → 0.75 mg/kg over 30 min (max 50 mg) → 0.5 mg/kg over 60 min (max 35 mg); total max 100 mg',
        'Transfer to PCI-capable facility after thrombolytics if needed (pharmacoinvasive strategy)',
      ])}

      ${phase('NSTEMI / UA — Management', [
        'Risk stratify with TIMI or GRACE score',
        'Early invasive strategy (cath within 24 h) for high-risk features: refractory ischemia, hemodynamic instability, VT/VF, HF, elevated troponin, new ST changes',
        'Conservative (ischemia-guided) strategy for low-risk stable patients',
        'Continue anticoagulation and antiplatelet therapy per cardiology plan',
      ])}

      ${callout('danger', 'Nitroglycerin Contraindications', `
        <ul>
          <li>SBP &lt;90 mmHg or &gt;30 mmHg below baseline</li>
          <li>HR &lt;50 or &gt;100 bpm</li>
          <li><strong>Suspected right ventricular infarction</strong> (inferior STEMI — preload dependent)</li>
          <li>PDE-5 inhibitor use within <strong>24 hours</strong> (sildenafil, vardenafil) or <strong>48 hours</strong> (tadalafil)</li>
          <li>Severe aortic stenosis</li>
        </ul>`
      )}
    `;}
  },

  // ── Stroke ────────────────────────────────────────────────────────────────
  {
    id:'stroke', label:'Stroke',
    render() { return `
      <div class="sec-title"><span class="sec-badge teal">STROKE</span> Suspected Acute Stroke</div>

      ${ekgStrip([
        {label:'A-Fib',sub:'#1 cardioembolic source · irregular',path:EKG.afib,color:'c-warn'},
        {label:'NSR',  sub:'Normal sinus rhythm',               path:EKG.nsr},
      ])}

      ${phase('Prehospital & Immediate Recognition', [
        '<strong>FAST:</strong> Face droop, Arm drift, Speech abnormal, Time — call 911 immediately',
        'Document <strong>last known normal (LKN)</strong> time precisely — critical for treatment eligibility',
        'Prehospital notification to receiving hospital to activate stroke team',
        'Establish IV access; do not delay transport for treatment',
        'Glucose check: treat hypoglycemia (&lt;60 mg/dL) immediately — can mimic stroke',
        'Do <strong>NOT</strong> lower BP in the field unless hypertensive emergency with end-organ damage',
      ])}

      ${phase('Emergency Department — First 25 Minutes', [
        'Stroke team activation; neurologist notification',
        '<strong>Non-contrast CT head within 25 min</strong> of arrival — rule out hemorrhagic stroke',
        'CBC, BMP, coagulation (PT/INR/aPTT), type and screen; troponin and 12-lead ECG',
        'CT angiography (head and neck) if large vessel occlusion (LVO) suspected',
        'Assess NIHSS; obtain informed consent for thrombolytics',
      ])}

      ${phase('IV tPA (Alteplase) — Ischemic Stroke', [
        'Eligibility window: LKN <strong>&le;3 hours</strong> (extended to 4.5 h with additional criteria)',
        'BP must be &lt;185/110 mmHg before giving tPA — treat if needed (labetalol 10–20 mg IV, nicardipine infusion)',
        '<strong>Dose: 0.9 mg/kg IV (max 90 mg)</strong> — 10% as bolus over 1 min, remainder over 60 min',
        'Maintain BP &lt;180/105 mmHg for at least 24 hours after tPA',
        'No anticoagulants or antiplatelets for 24 hours after tPA',
        'Repeat non-contrast CT at 24 hours to assess for hemorrhagic transformation',
      ])}

      ${phase('Mechanical Thrombectomy (Endovascular)', [
        'Indicated for <strong>LVO</strong> (ICA, M1/M2 MCA, basilar artery) with significant deficit',
        'Window: LKN &le;6 hours (extended to 24 h with favorable imaging criteria — DAWN/DEFUSE-3)',
        'Transfer immediately to thrombectomy-capable center if not available',
        'Can be combined with IV tPA (bridging therapy) or as primary therapy',
        'NIHSS &ge;6 in anterior circulation LVO is typical threshold',
      ])}

      ${callout('warn', 'Blood Pressure Management', `
        <ul>
          <li><strong>Before tPA:</strong> treat to SBP &lt;185 / DBP &lt;110 mmHg</li>
          <li><strong>After tPA:</strong> maintain SBP &lt;180 / DBP &lt;105 mmHg × 24 hours</li>
          <li><strong>No tPA, no thrombectomy:</strong> permissive hypertension — treat only if SBP &gt;220 / DBP &gt;120 mmHg; lower by ≤15% in first 24 hours</li>
          <li><strong>Hemorrhagic stroke:</strong> target SBP &lt;140 mmHg with nicardipine or labetalol infusion</li>
          <li>Avoid hypotension — adequate cerebral perfusion pressure is critical</li>
        </ul>`
      )}

      ${callout('danger', 'IV tPA Absolute Contraindications', `
        <ul>
          <li>Hemorrhagic stroke on CT or prior intracranial hemorrhage</li>
          <li>Active internal bleeding (excluding menses)</li>
          <li>Severe head trauma or stroke within 3 months</li>
          <li>Intracranial/spinal surgery within 3 months</li>
          <li>History of intracranial neoplasm, AVM, or aneurysm</li>
          <li>Platelet count &lt;100,000; INR &gt;1.7; aPTT &gt;40 sec; PT &gt;15 sec</li>
          <li>Blood glucose &lt;50 mg/dL (treat hypoglycemia first — may resolve deficits)</li>
        </ul>`
      )}
    `;}
  },

  // ── Opioid Emergency ──────────────────────────────────────────────────────
  {
    id:'opioid', label:'Opioid Emergency',
    render() { return `
      <div class="sec-title"><span class="sec-badge">OPIOID</span> Opioid-Associated Emergency</div>

      ${ekgStrip([
        {label:'Sinus Brady', sub:'HR &lt;60 · opioid-induced', path:EKG.brady, color:'c-warn'},
      ])}

      ${phase('Recognition', [
        'Classic triad: <strong>altered mental status / unresponsiveness + respiratory depression + miosis</strong> (pinpoint pupils)',
        'Context: known opioid use disorder, drug paraphernalia, witnessed use, post-procedural opioid administration',
        'May present as respiratory arrest → cardiac arrest if untreated',
        'Stimulation: sternal rub or trapezius pinch — minimal or no response in significant opioid toxicity',
      ])}

      ${phase('Initial Response (Lay Rescuer / Prehospital)', [
        'Call 911 / activate EMS',
        '<strong>Rescue breathing</strong> with barrier device or BVM if available — opioid overdose is primarily respiratory, not cardiac',
        'Administer <strong>naloxone intranasally (IN)</strong>: 4 mg (2 mg per nostril using mucosal atomizer)',
        'If no response in 2–3 minutes: repeat naloxone dose; continue rescue breathing',
        'If ROSC / breathing resumes: recovery position; do not leave alone — opioid effect may outlast naloxone',
      ])}

      ${phase('EMS / Clinical Setting', [
        'BVM ventilation with 100% O₂; SpO₂ monitoring',
        'IV/IO access if available',
        'Naloxone IV/IO: <strong>0.4–2 mg IV</strong>; titrate to adequate respirations (not full reversal)',
        'Repeat every 2–3 min up to 10 mg if no response (consider non-opioid etiology)',
        'Cardiac monitoring: opioid overdose can cause bradycardia; arrest → standard ACLS',
        'If no IV/IO access: naloxone IM 0.4–2 mg (deltoid or anterolateral thigh)',
        'Monitor minimum <strong>1 hour</strong> after last naloxone dose for re-narcotization',
      ])}

      <div class="drug-grid">
        ${drugCard({name:'Naloxone (Narcan)', tag:'Opioid antagonist', tagColor:'ok',
          rows:[
            {l:'IN',v:'<strong>4 mg</strong> (2 mg each nostril) — first-line for lay rescuers'},
            {l:'IM/SC',v:'<strong>0.4 mg</strong>; repeat q2–3 min as needed'},
            {l:'IV/IO',v:'<strong>0.4–2 mg</strong>; titrate to adequate breathing'},
            {l:'Auto-injector',v:'0.4 mg IM (EVZIO) or 2 mg IM (higher-dose)'},
            {l:'Duration',v:'30–90 min — shorter than most opioids'},
          ],
          note:'Goal is adequate spontaneous ventilation, NOT full reversal. Full reversal causes acute withdrawal, agitation, vomiting, and risk of aspiration. Repeat dosing or infusion often needed for long-acting opioids (methadone, fentanyl patch).'
        })}
      </div>

      ${callout('warn', 'Re-Narcotization Risk', `
        <ul>
          <li>Naloxone duration is <strong>30–90 minutes</strong>; most opioids last much longer</li>
          <li>Long-acting opioids (methadone, extended-release formulations, fentanyl patch): high re-narcotization risk — observe for 4–6 hours</li>
          <li>Naloxone infusion: 2/3 of effective bolus dose per hour IV; titrate to maintain adequate ventilation</li>
          <li>Discharge only after sustained adequate ventilation without naloxone for appropriate observation period</li>
        </ul>`
      )}

      ${callout('info', 'Bystander Naloxone Programs', `
        <p>Co-prescribe naloxone with all chronic opioid prescriptions, high-dose opioids, and patients with SUD. Ensure patient and caregivers know how to use.</p>
        <ul>
          <li>Narcan nasal spray 4 mg/spray — FDA-approved; available OTC in all 50 states</li>
          <li>NEXT Distro, NEXT Step programs for harm reduction distribution</li>
          <li>Good Samaritan laws in most states protect bystanders who call 911</li>
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
  navigator.serviceWorker.register('/als/sw.js').catch(() => {});
  window.addEventListener('offline', () => { document.getElementById('offlineBadge').hidden = false; });
  window.addEventListener('online',  () => { document.getElementById('offlineBadge').hidden = true; });
  if (!navigator.onLine) document.getElementById('offlineBadge').hidden = false;
}
