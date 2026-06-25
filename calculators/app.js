/* Clinical Calculator Suite */

function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmt(n,d=1){ return isNaN(n)||!isFinite(n) ? null : n.toFixed(d); }
function pct(n){ return fmt(n*100,1); }

/* ── Calculator definitions ── */
const CALCS = [

  /* 1. Accutane Dosing */
  {
    id:"accutane", name:"Accutane Dosing", num:"01",
    eyebrow:"Dermatology", source:"Weight-based isotretinoin cumulative dose guidelines",
    render: pane => {
      pane.innerHTML = calcHeader("Accutane (Isotretinoin) Dosing","Dermatology","Weight-based cumulative dose calculator") + `
      <div class="fields">
        ${field("Weight","accutane-weight","number","kg","","1","200")}
        ${field("Planned daily dose","accutane-daily","number","mg/day","","","","e.g. 40")}
      </div>
      <div id="accutane-result" class="result-card"><div class="result-placeholder">Enter weight</div></div>
      <button class="copy-btn" id="accutane-copy">&#x2398; Copy results</button>
      <p class="note"><strong>How the duration projection is calculated:</strong> The target cumulative dose is 120 mg/kg — the minimum threshold at which relapse rates drop significantly per Layton &amp; Cunliffe (1992). Month 1 runs at the starting dose (0.5 mg/kg/day), contributing <em>starting dose × 30 days</em> of cumulative mg. The remaining mg needed to reach 120 mg/kg is divided by the planned daily dose to get the additional days. Total duration = 30 days + remaining days, expressed in 30-day months. The upper limit of 150 mg/kg shown above represents the ceiling beyond which no additional benefit has been demonstrated — not a separate target to reach.<br><br>Example: 46 kg patient on 40 mg/day. Target = 5,520 mg. Month 1 at 23 mg/day = 690 mg. Remaining = 4,830 mg ÷ 40 mg/day = 121 days. Total = 151 days = 5 months 1 day.<br><br><strong>References:</strong> Dosing parameters (0.5–1 mg/kg/day; cumulative target 120–150 mg/kg) are consistent with: Zaenglein AL et al. "Guidelines of care for the management of acne vulgaris." <em>J Am Acad Dermatol.</em> 2016;74(5):945–973 (AAD); and Layton AM, Cunliffe WJ. "Guidelines for optimal use of isotretinoin in acne." <em>J Am Acad Dermatol.</em> 1992;27(6 Pt 2):S2–7.</p>`;
      pane.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('input', calcAccutane);
        el.addEventListener('change', calcAccutane);
      });
      const acBtn = document.getElementById('accutane-copy');
      if(acBtn) acBtn.addEventListener('click', () => copyAccutane(acBtn));
      calcAccutane();
    }
  },

  /* 2. ASCVD */
  {
    id:"ascvd", name:"ASCVD 10-yr Risk", num:"01",
    eyebrow:"Cardiovascular", source:"Pooled Cohort Equations · Goff et al. 2014 (ACC/AHA)",
    render: pane => {
      pane.innerHTML = calcHeader("ASCVD 10-Year Risk","Cardiovascular","Pooled Cohort Equations · Goff et al. 2014 (ACC/AHA)") + `
      <div class="fields">
        ${field("Age","ascvd-age","number","years","40","40","79")}
        ${selectField("Sex","ascvd-sex",[["male","Male"],["female","Female"]])}
        ${selectField("Race","ascvd-race",[["white","White"],["black","African American"]])}
        ${field("Total Cholesterol","ascvd-tc","number","mg/dL","200","100","400")}
        ${field("HDL Cholesterol","ascvd-hdl","number","mg/dL","50","20","100")}
        ${field("Systolic BP","ascvd-sbp","number","mmHg","120","80","220")}
      </div>
      <div class="checks">
        ${check("ascvd-bptx","On blood pressure treatment")}
        ${check("ascvd-dm","Diabetes mellitus")}
        ${check("ascvd-smoker","Current smoker")}
      </div>
      <div id="ascvd-result" class="result-card"><div class="result-placeholder">—</div></div>
      <button class="copy-btn" id="ascvd-copy">&#x2398; Copy result</button>
      <p class="note">Validated for ages 40–79 without prior ASCVD. Not applicable to patients already on statins or with prior MI/stroke. Use clinical judgment for borderline/intermediate risk.</p>`;
      addListeners("ascvd", calcAscvd);
    }
  },

  /* 2. CHA2DS2-VASc */
  {
    id:"chads", name:"CHA₂DS₂-VASc", num:"02",
    eyebrow:"Atrial Fibrillation", source:"Lip et al. 2010 · ESC / AHA Guidelines",
    render: pane => {
      pane.innerHTML = calcHeader("CHA₂DS₂-VASc","Atrial Fibrillation","Stroke risk in non-valvular AFib · Lip et al. 2010") + `
      <div class="section-label">Criteria</div>
      <div class="checks">
        ${checkPts("chads-chf","CHF or LV dysfunction",1)}
        ${checkPts("chads-htn","Hypertension",1)}
        ${checkPts("chads-age75","Age ≥75 years",2)}
        ${checkPts("chads-dm","Diabetes mellitus",1)}
        ${checkPts("chads-stroke","Stroke / TIA / thromboembolism history",2)}
        ${checkPts("chads-vasc","Vascular disease (prior MI, PAD, aortic plaque)",1)}
        ${checkPts("chads-age65","Age 65–74 years",1)}
        ${checkPts("chads-female","Sex category: Female",1,"Note: female sex adds risk only when other criteria ≥1")}
      </div>
      <div id="chads-result" class="result-card"><div class="result-placeholder">—</div></div>
      <button class="copy-btn" id="chads-copy">&#x2398; Copy result</button>`;
      addListeners("chads", calcChads);
    }
  },

  /* 3. Wells DVT */
  {
    id:"wellsdvt", name:"Wells DVT Score", num:"03",
    eyebrow:"Thrombosis", source:"Wells et al. 1997 / 2003",
    render: pane => {
      pane.innerHTML = calcHeader("Wells DVT Score","Thrombosis","Pretest probability for deep vein thrombosis · Wells et al.") + `
      <div class="checks">
        ${checkPts("dvt-cancer","Active cancer (treatment ongoing, within 6 months, or palliative)",1)}
        ${checkPts("dvt-paralysis","Paralysis/paresis or recent plaster immobilization of lower extremity",1)}
        ${checkPts("dvt-bedridden","Bedridden ≥3 days or major surgery within 12 weeks",1)}
        ${checkPts("dvt-tenderness","Localized tenderness along the deep venous system",1)}
        ${checkPts("dvt-legswollen","Entire leg swollen",1)}
        ${checkPts("dvt-calf","Calf swelling >3 cm vs. asymptomatic leg",1)}
        ${checkPts("dvt-pitting","Pitting edema confined to symptomatic leg",1)}
        ${checkPts("dvt-collateral","Collateral superficial veins (non-varicose)",1)}
        ${checkPts("dvt-alt","Alternative diagnosis as likely or more likely than DVT",-2)}
      </div>
      <div id="wellsdvt-result" class="result-card"><div class="result-placeholder">—</div></div>
      <button class="copy-btn" id="wellsdvt-copy">&#x2398; Copy result</button>`;
      addListeners("wellsdvt", calcWellsDvt);
    }
  },

  /* 4. Wells PE + PERC */
  {
    id:"wellspe", name:"Wells PE + PERC", num:"04",
    eyebrow:"Pulmonary Embolism", source:"Wells et al. 2000 · Kline PERC 2004",
    render: pane => {
      pane.innerHTML = calcHeader("Wells PE Score + PERC Rule","Pulmonary Embolism","Wells et al. 2000 · Kline PERC 2004") + `
      <div class="section-label">PERC Rule — all must be absent to rule out PE without further testing</div>
      <div class="checks">
        ${check("perc-age50","Age ≥50")}
        ${check("perc-hr100","HR ≥100 bpm")}
        ${check("perc-sao2","SpO₂ &lt;95% on room air")}
        ${check("perc-legswelling","Unilateral leg swelling")}
        ${check("perc-hemoptysis","Hemoptysis")}
        ${check("perc-surgery","Surgery or trauma within 4 weeks")}
        ${check("perc-priorpe","Prior PE or DVT")}
        ${check("perc-estrogen","Exogenous estrogen use")}
      </div>
      <div id="perc-result" class="perc-result"></div>

      <div class="section-label">Wells PE Score</div>
      <div class="checks">
        ${checkPts("pe-dvt","Clinical signs/symptoms of DVT",3)}
        ${checkPts("pe-pe1","PE is #1 diagnosis or equally likely",3)}
        ${checkPts("pe-hr","Heart rate >100 bpm",1.5)}
        ${checkPts("pe-immo","Immobilization ≥3 days or surgery in previous 4 weeks",1.5)}
        ${checkPts("pe-priorpe","Previous PE or DVT",1.5)}
        ${checkPts("pe-hemo","Hemoptysis",1)}
        ${checkPts("pe-cancer","Malignancy (active or treated within 6 months)",1)}
      </div>
      <div id="wellspe-result" class="result-card"><div class="result-placeholder">—</div></div>
      <button class="copy-btn" id="wellspe-copy">&#x2398; Copy result</button>`;
      addListeners("wellspe", calcWellsPe);
    }
  },

  /* 5. CURB-65 */
  {
    id:"curb65", name:"CURB-65", num:"05",
    eyebrow:"Pneumonia", source:"Lim et al. 2003 · BTS Guidelines",
    render: pane => {
      pane.innerHTML = calcHeader("CURB-65","Pneumonia Severity","Community-acquired pneumonia mortality score · Lim et al. 2003") + `
      <div class="checks">
        ${checkPts("curb-confusion","Confusion (new disorientation to person, place, or time)",1)}
        ${checkPts("curb-urea","Urea >7 mmol/L  OR  BUN >20 mg/dL",1)}
        ${checkPts("curb-rr","Respiratory rate ≥30 breaths/min",1)}
        ${checkPts("curb-bp","Systolic BP &lt;90 mmHg  OR  diastolic BP ≤60 mmHg",1)}
        ${checkPts("curb-age65","Age ≥65 years",1)}
      </div>
      <div id="curb65-result" class="result-card"><div class="result-placeholder">—</div></div>
      <button class="copy-btn" id="curb65-copy">&#x2398; Copy result</button>`;
      addListeners("curb65", calcCurb65);
    }
  },

  /* 6. Creatinine Clearance */
  {
    id:"crcl", name:"Creatinine Clearance", num:"06",
    eyebrow:"Renal Function", source:"Cockcroft-Gault 1976",
    render: pane => {
      pane.innerHTML = calcHeader("Creatinine Clearance","Renal Function","Cockcroft-Gault equation · 1976") + `
      <div class="fields">
        ${field("Age","crcl-age","number","years","55","18","110")}
        ${selectField("Sex","crcl-sex",[["male","Male"],["female","Female"]])}
        ${field("Weight","crcl-wt","number","kg","70","20","300")}
        ${field("Serum Creatinine","crcl-cr","number","mg/dL","1.0","0.1","20")}
      </div>
      <div id="crcl-result" class="result-card"><div class="result-placeholder">—</div></div>
      <button class="copy-btn" id="crcl-copy">&#x2398; Copy result</button>
      <p class="note">Use ideal body weight (IBW) for obese patients; actual body weight may overestimate CrCl. IBW (males): 50 + 2.3×(height inches - 60); (females): 45.5 + 2.3×(height inches - 60). eGFR (CKD-EPI) is now preferred for CKD staging; Cockcroft-Gault remains the standard for drug dosing.</p>`;
      addListeners("crcl", calcCrcl);
    }
  },

  /* 7. Corrected Ca + Anion Gap */
  {
    id:"electro", name:"Corrected Ca + Anion Gap", num:"07",
    eyebrow:"Electrolytes / Metabolic", source:"Standard formulas",
    render: pane => {
      pane.innerHTML = calcHeader("Corrected Calcium + Anion Gap","Electrolytes / Metabolic","Standard clinical formulas") + `
      <div class="section-label">Corrected Calcium</div>
      <div class="fields">
        ${field("Measured Calcium","ca-ca","number","mg/dL","8.9","4","16")}
        ${field("Albumin","ca-alb","number","g/dL","4.0","1","6")}
      </div>
      <div id="ca-result" class="result-card"><div class="result-placeholder">—</div></div>

      <div class="section-label section-label-gap">Anion Gap</div>
      <div class="fields">
        ${field("Sodium","ag-na","number","mEq/L","140","100","180")}
        ${field("Chloride","ag-cl","number","mEq/L","100","50","140")}
        ${field("Bicarbonate","ag-hco3","number","mEq/L","24","5","45")}
        ${field("Albumin (optional)","ag-alb","number","g/dL","","1","6","optional")}
      </div>
      <div id="ag-result" class="result-card"><div class="result-placeholder">—</div></div>
      <button class="copy-btn" id="electro-copy">&#x2398; Copy results</button>`;
      addListeners("electro", calcElectro);
    }
  },

  /* 8. MELD */
  {
    id:"meld", name:"MELD / MELD-Na", num:"08",
    eyebrow:"Liver Disease", source:"Kamath et al. 2001 · UNOS modification",
    render: pane => {
      pane.innerHTML = calcHeader("MELD Score","Liver Disease","Model for End-Stage Liver Disease · UNOS modification") + `
      <div class="fields">
        ${field("INR","meld-inr","number","","1.5","0.5","20")}
        ${field("Bilirubin","meld-bili","number","mg/dL","2.0","0.1","50")}
        ${field("Creatinine","meld-cr","number","mg/dL","1.2","0.1","20")}
        ${field("Sodium","meld-na","number","mEq/L","138","100","160")}
      </div>
      <div id="meld-result" class="result-card"><div class="result-placeholder">—</div></div>
      <button class="copy-btn" id="meld-copy">&#x2398; Copy result</button>
      <p class="note">Creatinine capped at 4.0 mg/dL (minimum 1.0). Sodium clamped to 125–137 mEq/L for MELD-Na. Dialysis patients: set creatinine to 4.0.</p>`;
      addListeners("meld", calcMeld);
    }
  },

  /* 9. PHQ-9 */
  {
    id:"phq9", name:"PHQ-9", num:"09",
    eyebrow:"Depression Screening", source:"Kroenke & Spitzer 2001",
    render: pane => {
      const questions = [
        "Little interest or pleasure in doing things",
        "Feeling down, depressed, or hopeless",
        "Trouble falling or staying asleep, or sleeping too much",
        "Feeling tired or having little energy",
        "Poor appetite or overeating",
        "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
        "Trouble concentrating on things, such as reading the newspaper or watching television",
        "Moving or speaking so slowly that other people could have noticed, or being so fidgety/restless that you have been moving around a lot more than usual",
        "Thoughts that you would be better off dead, or of hurting yourself in some way"
      ];
      const optHtml = [["0","Not at all"],["1","Several days"],["2","More than half the days"],["3","Nearly every day"]]
        .map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join('');
      const rows = questions.map((q,i)=>`
        <div class="phq-row${i===8?' phq-row-si':''}">
          <div class="phq-q"><span class="phq-num">${i+1}</span>${esc(q)}</div>
          <select id="phq9-q${i}" class="phq-sel">${optHtml}</select>
        </div>`).join('');
      pane.innerHTML = calcHeader("PHQ-9","Depression Screening","Patient Health Questionnaire · Kroenke &amp; Spitzer 2001") +
        `<p class="phq-instr">Over the <strong>last 2 weeks</strong>, how often have you been bothered by each of the following?</p>
        <div class="phq-table">${rows}</div>
        <div id="phq9-result" class="result-card"><div class="result-placeholder">—</div></div>
        <button class="copy-btn" id="phq9-copy">&#x2398; Copy result</button>
        <p class="note">Question 9 (suicidal ideation) should trigger immediate safety assessment regardless of total score. Functional impairment question (unscored): "How difficult have these problems made it to do work, manage home, or get along with people?"</p>`;
      addListeners("phq9", calcPhq9);
    }
  },

  /* 10. GAD-7 */
  {
    id:"gad7", name:"GAD-7", num:"10",
    eyebrow:"Anxiety Screening", source:"Spitzer et al. 2006",
    render: pane => {
      const questions = [
        "Feeling nervous, anxious, or on edge",
        "Not being able to stop or control worrying",
        "Worrying too much about different things",
        "Trouble relaxing",
        "Being so restless that it's hard to sit still",
        "Becoming easily annoyed or irritable",
        "Feeling afraid as if something awful might happen"
      ];
      const optHtml = [["0","Not at all"],["1","Several days"],["2","More than half the days"],["3","Nearly every day"]]
        .map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join('');
      const rows = questions.map((q,i)=>`
        <div class="phq-row">
          <div class="phq-q"><span class="phq-num">${i+1}</span>${esc(q)}</div>
          <select id="gad7-q${i}" class="phq-sel">${optHtml}</select>
        </div>`).join('');
      pane.innerHTML = calcHeader("GAD-7","Anxiety Screening","Generalized Anxiety Disorder 7-item · Spitzer et al. 2006") +
        `<p class="phq-instr">Over the <strong>last 2 weeks</strong>, how often have you been bothered by the following?</p>
        <div class="phq-table">${rows}</div>
        <div id="gad7-result" class="result-card"><div class="result-placeholder">—</div></div>
        <button class="copy-btn" id="gad7-copy">&#x2398; Copy result</button>
        <p class="note">GAD-7 ≥10: 89% sensitivity, 82% specificity for GAD. Also screens for panic disorder (≥8), social anxiety disorder (≥8), and PTSD (≥8). Functional impairment question: "How difficult have these problems made it to do work, manage home, or get along with people?"</p>`;
      addListeners("gad7", calcGad7);
    }
  },

  /* 11. HEART Score */
  {
    id:"heart", name:"HEART Score", num:"11",
    eyebrow:"Chest Pain", source:"Six et al. 2010 / Backus et al. 2010",
    render: pane => {
      pane.innerHTML = calcHeader("HEART Score","Chest Pain Risk Stratification","MACE prediction in chest pain presentations · Six / Backus 2010") +
        `<div class="section-label">Select one value per category (0–2 points each)</div>
        <div class="fields">
          ${selectField("History","heart-hx",[["0","0 — Slightly suspicious"],["1","1 — Moderately suspicious"],["2","2 — Highly suspicious / typical ACS"]])}
          ${selectField("EKG","heart-ekg",[["0","0 — Normal"],["1","1 — Non-specific repolarization disturbance"],["2","2 — Significant ST deviation"]])}
          ${selectField("Age","heart-age",[["0","0 — Under 45"],["1","1 — Age 45–64"],["2","2 — Age 65 or older"]])}
          ${selectField("Risk Factors","heart-rf",[["0","0 — No known risk factors"],["1","1 — 1–2 risk factors or family history"],["2","2 — ≥3 risk factors or known atherosclerosis"]])}
          ${selectField("Troponin","heart-tn",[["0","0 — ≤ Normal limit"],["1","1 — 1–3× normal limit"],["2","2 — > 3× normal limit"]])}
        </div>
        <p class="note">Risk factors: HTN, hypercholesterolemia, DM, obesity (BMI >30), current/recent smoking (≤90 days), family history of CAD (1st-degree relative: ♀ &lt;65 yr, ♂ &lt;55 yr). Known atherosclerosis: prior MI, PCI/CABG, CVA/TIA, PAD.</p>
        <div id="heart-result" class="result-card"><div class="result-placeholder">—</div></div>
        <button class="copy-btn" id="heart-copy">&#x2398; Copy result</button>`;
      addListeners("heart", calcHeart);
    }
  },

  /* 12. eGFR CKD-EPI 2021 */
  {
    id:"egfr", name:"eGFR (CKD-EPI 2021)", num:"12",
    eyebrow:"Renal Function", source:"Inker et al. NEJM 2021",
    render: pane => {
      pane.innerHTML = calcHeader("eGFR (CKD-EPI 2021)","Renal Function","Race-free CKD-EPI creatinine equation · Inker et al. NEJM 2021") +
        `<div class="fields">
          ${field("Age","egfr-age","number","years","55","18","110")}
          ${selectField("Sex","egfr-sex",[["male","Male"],["female","Female"]])}
          ${field("Serum Creatinine","egfr-cr","number","mg/dL","1.0","0.1","20")}
        </div>
        <div id="egfr-result" class="result-card"><div class="result-placeholder">—</div></div>
        <button class="copy-btn" id="egfr-copy">&#x2398; Copy result</button>
        <p class="note">CKD-EPI 2021 (race-free) replaces the 2009 race-based equation. Preferred for CKD staging per KDIGO 2022 and NKF-ASN recommendations. Cockcroft-Gault (calculator #06) remains the standard for drug dosing adjustments. Both equations assume stable creatinine — inaccurate in AKI.</p>`;
      addListeners("egfr", calcEgfr);
    }
  },

  /* 13. Ottawa Knee + Ankle */
  {
    id:"ottawa", name:"Ottawa Knee + Ankle", num:"13",
    eyebrow:"Musculoskeletal", source:"Stiell et al. 1995 / 1996",
    render: pane => {
      pane.innerHTML = calcHeader("Ottawa Knee &amp; Ankle Rules","Musculoskeletal","Clinical decision rules for imaging · Stiell et al.") +
        `<div class="section-label">Ottawa Knee — X-ray indicated if any criterion present:</div>
        <div class="checks">
          ${check("knee-age","Age ≥55")}
          ${check("knee-fib","Tenderness at head of fibula")}
          ${check("knee-pat","Isolated tenderness of patella (no other bony tenderness)")}
          ${check("knee-flex","Inability to flex knee to 90°")}
          ${check("knee-wt","Inability to bear weight both immediately and in the ED (4 steps)")}
        </div>
        <div id="knee-result" class="perc-result"></div>

        <div class="section-label section-label-gap">Ottawa Ankle — Ankle X-ray if any criterion present:</div>
        <div class="checks">
          ${check("ankle-lat","Bone tenderness at posterior edge or tip of lateral malleolus (distal 6 cm)")}
          ${check("ankle-med","Bone tenderness at posterior edge or tip of medial malleolus (distal 6 cm)")}
          ${check("ankle-wt","Inability to bear weight both immediately and in the ED (4 steps)")}
        </div>
        <div id="ankle-result" class="perc-result"></div>

        <div class="section-label section-label-gap">Ottawa Ankle — Foot X-ray if any criterion present:</div>
        <div class="checks">
          ${check("foot-5th","Bone tenderness at base of 5th metatarsal")}
          ${check("foot-nav","Bone tenderness at navicular")}
          ${check("foot-wt","Inability to bear weight both immediately and in the ED (4 steps)")}
        </div>
        <div id="foot-result" class="perc-result"></div>

        <button class="copy-btn" id="ottawa-copy">&#x2398; Copy results</button>
        <p class="note">Ottawa rules apply to adults and children ≥5 years. Do NOT apply if: altered LOC, intoxication, distracting injuries, or multiple painful injuries. Near 100% sensitivity for clinically significant fractures; specificity ~40%. Validated across many clinical settings worldwide.</p>`;
      addListeners("ottawa", calcOttawa);
      document.getElementById('ottawa-copy').addEventListener('click', copyOttawa);
    }
  },

  /* 14. Alvarado (MANTRELS) */
  {
    id:"alvarado", name:"Alvarado Score", num:"14",
    eyebrow:"Appendicitis", source:"Alvarado 1986 · MANTRELS criteria",
    render: pane => {
      pane.innerHTML = calcHeader("Alvarado Score","Appendicitis","Suspected appendicitis in adults · Alvarado 1986") + `
      <div class="section-label">MANTRELS Criteria</div>
      <div class="checks">
        ${checkPts("alv-migration","Migration of pain to right lower quadrant",1)}
        ${checkPts("alv-anorexia","Anorexia",1)}
        ${checkPts("alv-nausea","Nausea or vomiting",1)}
        ${checkPts("alv-tenderness","Tenderness in right lower quadrant",2)}
        ${checkPts("alv-rebound","Rebound tenderness",1)}
        ${checkPts("alv-temp","Elevated temperature (>37.3°C / 99.1°F)",1)}
        ${checkPts("alv-wbc","Leukocytosis (WBC >10,000/mm³)",2)}
        ${checkPts("alv-shift","Left shift (neutrophils >75%)",1)}
      </div>
      <div id="alvarado-result" class="result-card"><div class="result-placeholder">—</div></div>
      <button class="copy-btn" id="alvarado-copy">&#x2398; Copy result</button>
      <p class="note">Validated for adults with suspected appendicitis. Score 1–4: low probability — discharge with return precautions. Score 5–6: equivocal — CT imaging recommended. Score 7–10: high probability — urgent surgical consultation. Does not replace clinical judgment or imaging in equivocal cases.</p>`;
      addListeners("alvarado", calcAlvarado);
    }
  },

  /* 15. Pregnancy Due Date */
  {
    id:"edd", name:"Pregnancy Due Date", num:"15",
    eyebrow:"Obstetrics", source:"Naegele's Rule · EDD = LMP + 280 days",
    render: pane => {
      pane.innerHTML = calcHeader("Pregnancy Due Date","Obstetrics","Naegele's Rule — EDD = LMP + 280 days") + `
      <div class="fields">
        ${field("Last Menstrual Period (LMP)","edd-lmp","date","","",undefined,undefined)}
      </div>
      <div id="edd-result" class="result-card"><div class="result-placeholder">Enter LMP date</div></div>
      <button class="copy-btn" id="edd-copy">&#x2398; Copy result</button>
      <p class="note">Based on Naegele's Rule (LMP + 280 days), assuming a 28-day cycle. Confirm EDD with first-trimester ultrasound (most accurate ≤14 weeks). Term = 37w0d–41w6d; late preterm = 34–36w; post-term = ≥42w0d.</p>`;
      addListeners("edd", calcEdd);
    }
  },

  /* 16. RCRI */
  {
    id:"rcri", name:"RCRI", num:"16",
    eyebrow:"Perioperative", source:"Lee et al. 1999 · ACC/AHA Guidelines",
    render: pane => {
      pane.innerHTML = calcHeader("RCRI","Perioperative Cardiac Risk","Revised Cardiac Risk Index — major noncardiac surgery · Lee et al. 1999") + `
      <div class="checks">
        ${checkPts("rcri-surgery","High-risk surgery (intraperitoneal, intrathoracic, or suprainguinal vascular)",1)}
        ${checkPts("rcri-ihd","Ischemic heart disease (history of MI, positive stress test, angina, nitrate use, or Q-waves on ECG)",1)}
        ${checkPts("rcri-chf","Congestive heart failure (pulmonary edema, bilateral rales, PND, S3 gallop, or CXR with redistribution)",1)}
        ${checkPts("rcri-cvd","Cerebrovascular disease (stroke or TIA)",1)}
        ${checkPts("rcri-dm","Preoperative insulin therapy for diabetes",1)}
        ${checkPts("rcri-cr","Preoperative creatinine >2.0 mg/dL",1)}
      </div>
      <div id="rcri-result" class="result-card"><div class="result-placeholder">—</div></div>
      <button class="copy-btn" id="rcri-copy">&#x2398; Copy result</button>
      <p class="note">Does not apply to emergency surgery, low-risk procedures (endoscopy, cataract, superficial), or cardiac surgery. Risk of major cardiac complications (MI, pulmonary edema, VF/cardiac arrest, complete heart block) from Lee et al. 1999 derivation cohort. Endorsed by ACC/AHA for preoperative cardiac evaluation.</p>`;
      addListeners("rcri", calcRcri);
    }
  },

  /* 17. PECARN */
  {
    id:"pecarn", name:"PECARN Head CT", num:"17",
    eyebrow:"Pediatrics", source:"Kuppermann et al. 2009 — Lancet",
    render: pane => {
      pane.innerHTML = calcHeader("PECARN Pediatric Head CT Rule","Pediatrics","Minor blunt head trauma · Kuppermann et al. Lancet 2009") + `
      <div class="fields">
        ${selectField("Age group","pecarn-age",[["lt2","< 2 years"],["gte2","≥ 2 years"]])}
      </div>
      <div class="section-label">High-Risk Criteria (CT Recommended if Any Present)</div>
      <div id="pecarn-high-items" class="checks"></div>
      <div class="section-label section-label-gap">Intermediate-Risk Criteria (CT vs. Observation)</div>
      <div id="pecarn-int-items" class="checks"></div>
      <div id="pecarn-result" class="result-card"><div class="result-placeholder">—</div></div>
      <button class="copy-btn" id="pecarn-copy">&#x2398; Copy result</button>
      <p class="note">Applies to children with GCS 14–15 presenting within 24h of minor blunt head trauma. Validated in 42,412 children. Observation is appropriate for intermediate-risk patients with isolated findings and reliable caregivers. Does not apply to known intracranial abnormalities, bleeding disorders, or penetrating trauma.</p>`;

      function renderItems(){
        const isLt2=sel('pecarn-age')==='lt2';
        const hi=isLt2?[
          ['pecarn-gcs','GCS ≤ 14'],
          ['pecarn-skull','Palpable skull fracture'],
          ['pecarn-ams','Altered mental status (agitation, somnolence, repetitive questioning, slow verbal response)'],
        ]:[
          ['pecarn-gcs','GCS ≤ 14'],
          ['pecarn-bsf','Signs of basilar skull fracture (hemotympanum, raccoon eyes, retroauricular bruising, CSF rhinorrhea/otorrhea)'],
          ['pecarn-ams','Altered mental status'],
        ];
        const mid=isLt2?[
          ['pecarn-hematoma','Occipital, parietal, or temporal scalp hematoma'],
          ['pecarn-loc','Loss of consciousness ≥ 5 seconds'],
          ['pecarn-mechanism','Severe mechanism (MVA with ejection/rollover/fatality; pedestrian/cyclist hit by vehicle; fall >3 ft; struck by high-impact object)'],
          ['pecarn-abnormal','Not acting normally per parent'],
        ]:[
          ['pecarn-loc','Loss of consciousness'],
          ['pecarn-vomiting','Vomiting'],
          ['pecarn-mechanism','Severe mechanism (MVA with ejection/rollover/fatality; pedestrian/cyclist hit by vehicle; fall >5 ft; struck by high-impact object)'],
          ['pecarn-headache','Severe headache'],
        ];
        document.getElementById('pecarn-high-items').innerHTML=hi.map(([id,lbl])=>check(id,lbl)).join('');
        document.getElementById('pecarn-int-items').innerHTML=mid.map(([id,lbl])=>check(id,lbl)).join('');
        pane.querySelectorAll('#pecarn-high-items input,#pecarn-int-items input').forEach(el=>{
          el.addEventListener('change',calcPecarn);
        });
        calcPecarn();
      }

      document.getElementById('pecarn-age').addEventListener('change',renderItems);
      const cb=document.getElementById('pecarn-copy');
      if(cb) cb.addEventListener('click',()=>copyResult('pecarn',cb));
      renderItems();
    }
  },

];

/* ── HTML helpers ── */
function calcHeader(title, eyebrow, source){
  return `<div class="calc-eyebrow">${esc(eyebrow)}</div>
  <h1 class="calc-title">${esc(title)}</h1>
  <div class="calc-source">${esc(source)}</div>`;
}
function field(label, id, type, unit, defaultVal, min, max, placeholder){
  return `<div class="field">
    <label class="field-label" for="${esc(id)}">${esc(label)}</label>
    <input type="${esc(type)}" id="${esc(id)}" value="${esc(defaultVal||'')}" ${min!==undefined?`min="${esc(min)}"`:''}
      ${max!==undefined?`max="${esc(max)}"`:''}
      ${placeholder?`placeholder="${esc(placeholder)}"`:''}
      inputmode="decimal">
    ${unit?`<span class="unit">${esc(unit)}</span>`:''}
  </div>`;
}
function selectField(label, id, opts){
  const options = opts.map(([v,t])=>`<option value="${esc(v)}">${esc(t)}</option>`).join('');
  return `<div class="field">
    <label class="field-label" for="${esc(id)}">${esc(label)}</label>
    <select id="${esc(id)}">${options}</select>
  </div>`;
}
function check(id, label){ return `<label><input type="checkbox" id="${esc(id)}"> ${esc(label)}</label>`; }
function checkPts(id, label, pts, note){
  const ptsStr = pts > 0 ? `+${pts}` : String(pts);
  return `<label><span class="pts">${esc(ptsStr)}</span><input type="checkbox" id="${esc(id)}"> ${esc(label)}${note?`<br><small class="calc-note">${esc(note)}</small>`:''}</label>`;
}
function resultCard(score, label, detail, risk){
  return `<div class="result-num ${esc(risk)}">${esc(score)}</div>
  <div class="result-label">${esc(label)}</div>
  <div class="result-detail">${esc(detail)}</div>`;
}

/* ── Event wiring ── */
function addListeners(calcId, calcFn){
  const pane = document.getElementById('pane');
  pane.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', calcFn);
    el.addEventListener('change', calcFn);
  });
  const copyBtn = document.getElementById(`${calcId}-copy`);
  if(copyBtn) copyBtn.addEventListener('click', () => copyResult(calcId, copyBtn));
  calcFn();
}
function v(id){ return document.getElementById(id); }
function num(id){ const el=v(id); if(!el) return NaN; const n=parseFloat(el.value); return isNaN(n)?NaN:n; }
function sel(id){ const el=v(id); return el?el.value:''; }
function chk(id){ const el=v(id); return el?el.checked:false; }
function setResult(id, html, risk=''){
  const el = document.getElementById(id);
  if(el){ el.innerHTML=html; el.className=`result-card${risk?' '+risk:''}`; }
}

/* ── Calculators ── */

function calcAscvd(){
  const age=num('ascvd-age'),tc=num('ascvd-tc'),hdl=num('ascvd-hdl'),sbp=num('ascvd-sbp');
  const sex=sel('ascvd-sex'), race=sel('ascvd-race');
  const bptx=chk('ascvd-bptx'), dm=chk('ascvd-dm'), smoke=chk('ascvd-smoker');
  const el = document.getElementById('ascvd-result');
  if([age,tc,hdl,sbp].some(isNaN)||age<40||age>79){
    el.innerHTML='<div class="result-placeholder">Enter values (age 40–79)</div>'; el.className='result-card'; return;
  }
  const lnAge=Math.log(age), lnTc=Math.log(tc), lnHdl=Math.log(hdl), lnSbp=Math.log(sbp);
  let indiv, s10, mean;

  if(race==='white' && sex==='male'){
    indiv = 12.344*lnAge + 11.853*lnTc - 2.664*lnAge*lnTc - 7.990*lnHdl + 1.769*lnAge*lnHdl +
      (bptx?1.764:1.797)*lnSbp + 7.837*(smoke?1:0) - 1.795*lnAge*(smoke?1:0) + 0.658*(dm?1:0);
    s10=0.9144; mean=61.18;
  } else if(race==='white' && sex==='female'){
    indiv = -29.799*lnAge + 4.884*lnAge*lnAge + 13.540*lnTc - 3.114*lnAge*lnTc -
      13.578*lnHdl + 3.149*lnAge*lnHdl + (bptx?2.019:1.957)*lnSbp +
      7.574*(smoke?1:0) - 1.665*lnAge*(smoke?1:0) + 0.661*(dm?1:0);
    s10=0.9665; mean=-29.799;
  } else if(race==='black' && sex==='male'){
    indiv = 2.469*lnAge + 0.302*lnTc - 0.307*lnHdl +
      (bptx?1.916:1.809)*lnSbp + 0.549*(smoke?1:0) + 0.645*(dm?1:0);
    s10=0.8954; mean=19.54;
  } else { /* black female */
    indiv = 17.1141*lnAge + 0.9396*lnTc - 18.9196*lnHdl + 4.4748*lnAge*lnHdl +
      (bptx?29.2907:27.8197)*lnSbp + (bptx?-6.4321:-6.0873)*lnAge*lnSbp +
      0.8738*(smoke?1:0) + 0.8738*(dm?1:0);
    s10=0.9533; mean=86.6081;
  }

  const risk = (1 - Math.pow(s10, Math.exp(indiv - mean))) * 100;
  const riskFmt = risk.toFixed(1) + '%';
  let riskClass, riskLabel, riskDetail;
  if(risk < 5){
    riskClass='ok'; riskLabel='Low risk (<5%)';
    riskDetail='Low 10-year ASCVD risk. Lifestyle counseling appropriate. Statin discussion generally not indicated by risk alone.';
  } else if(risk < 7.5){
    riskClass=''; riskLabel='Borderline risk (5–<7.5%)';
    riskDetail='Borderline risk. Consider risk-enhancing factors (family history, hs-CRP, CAC score) to guide statin discussion.';
  } else if(risk < 20){
    riskClass='warn'; riskLabel='Intermediate risk (7.5–<20%)';
    riskDetail='Intermediate risk. Moderate-intensity statin recommended if risk-benefit discussion favors treatment. Consider CAC for additional risk stratification.';
  } else {
    riskClass='risk'; riskLabel='High risk (≥20%)';
    riskDetail='High 10-year ASCVD risk. High-intensity statin recommended. Consider additional risk-reduction strategies.';
  }
  setResult('ascvd-result', resultCard(riskFmt, riskLabel, riskDetail, riskClass), riskClass);
}

function calcChads(){
  const pts = [
    ['chads-chf',1],['chads-htn',1],['chads-age75',2],['chads-dm',1],
    ['chads-stroke',2],['chads-vasc',1],['chads-age65',1],['chads-female',1]
  ].reduce((s,[id,p])=> s+(chk(id)?p:0), 0);
  let riskClass, riskLabel, detail;
  if(pts===0){ riskClass='ok'; riskLabel='Score 0 — Low risk'; detail='Annual stroke risk ~0%. Anticoagulation not recommended.'; }
  else if(pts===1){ riskClass=''; riskLabel='Score 1 — Low-moderate risk'; detail='Annual stroke risk ~1.3%. Consider anticoagulation based on individual risk-benefit; female sex alone (score=1) does not warrant anticoagulation.'; }
  else if(pts<=3){ riskClass='warn'; riskLabel=`Score ${pts} — Moderate-high risk`; detail='Annual stroke risk 2–4%. Oral anticoagulation recommended unless contraindicated. Reassess bleeding risk (HAS-BLED).'; }
  else{ riskClass='risk'; riskLabel=`Score ${pts} — High risk`; detail='Annual stroke risk >4%. Oral anticoagulation recommended (NOAC preferred over warfarin in non-valvular AFib). Reassess bleeding risk.'; }
  setResult('chads-result', resultCard(String(pts), riskLabel, detail, riskClass), riskClass);
}

function calcWellsDvt(){
  const pts = [
    ['dvt-cancer',1],['dvt-paralysis',1],['dvt-bedridden',1],['dvt-tenderness',1],
    ['dvt-legswollen',1],['dvt-calf',1],['dvt-pitting',1],['dvt-collateral',1],
    ['dvt-alt',-2]
  ].reduce((s,[id,p])=> s+(chk(id)?p:0), 0);
  let riskClass, riskLabel, detail;
  if(pts<=1){ riskClass='ok'; riskLabel=`Score ${pts} — Low probability`; detail='~3% prevalence of DVT. Consider d-dimer; if negative, DVT excluded. If positive, proceed to compression ultrasound.'; }
  else if(pts===2){ riskClass='warn'; riskLabel=`Score ${pts} — Moderate probability`; detail='~17% prevalence of DVT. Compression ultrasound recommended. If negative, consider repeat ultrasound in 1 week or d-dimer.'; }
  else{ riskClass='risk'; riskLabel=`Score ${pts} — High probability`; detail='~75% prevalence of DVT. Compression ultrasound recommended. Consider empiric anticoagulation while awaiting imaging if delay expected.'; }
  setResult('wellsdvt-result', resultCard(String(pts), riskLabel, detail, riskClass), riskClass);
}

function calcWellsPe(){
  /* PERC */
  const percItems = ['perc-age50','perc-hr100','perc-sao2','perc-legswelling',
    'perc-hemoptysis','perc-surgery','perc-priorpe','perc-estrogen'];
  const percPos = percItems.some(id=>chk(id));
  const percEl = document.getElementById('perc-result');
  if(percEl){
    percEl.className = percPos ? 'perc-result pos' : 'perc-result neg';
    percEl.textContent = percPos
      ? 'PERC positive — proceed with Wells PE score below'
      : 'PERC negative — PE can be excluded in low pre-test probability setting without further workup';
  }

  /* Wells PE */
  const pts = [
    ['pe-dvt',3],['pe-pe1',3],['pe-hr',1.5],['pe-immo',1.5],
    ['pe-priorpe',1.5],['pe-hemo',1],['pe-cancer',1]
  ].reduce((s,[id,p])=>s+(chk(id)?p:0), 0);
  let riskClass, riskLabel, detail;
  if(pts<2){ riskClass='ok'; riskLabel=`Score ${pts} — Low probability`; detail='~1.3% prevalence of PE. Consider PERC (if applicable). d-dimer if PERC not negative.'; }
  else if(pts<=6){ riskClass='warn'; riskLabel=`Score ${pts} — Moderate probability`; detail='~16% prevalence of PE. d-dimer if score ≤4 (PE unlikely); proceed to CTPA if score >4 (PE likely) or d-dimer positive.'; }
  else{ riskClass='risk'; riskLabel=`Score ${pts} — High probability`; detail='~38% prevalence of PE. Proceed directly to CTPA. Consider empiric anticoagulation if CTPA will be delayed.'; }
  const simplifiedNote = pts<=4 ? ' Simplified: PE unlikely (d-dimer approach).' : ' Simplified: PE likely (imaging recommended).';
  setResult('wellspe-result', resultCard(String(pts), riskLabel, detail+simplifiedNote, riskClass), riskClass);
}

function calcCurb65(){
  const pts = ['curb-confusion','curb-urea','curb-rr','curb-bp','curb-age65']
    .reduce((s,id)=>s+(chk(id)?1:0), 0);
  let riskClass, riskLabel, detail;
  if(pts<=1){ riskClass='ok'; riskLabel=`Score ${pts} — Low severity`; detail='~1.5% 30-day mortality. Suitable for outpatient treatment in most patients. Consider patient factors (social support, ability to take oral medications).'; }
  else if(pts===2){ riskClass='warn'; riskLabel=`Score ${pts} — Moderate severity`; detail='~9% 30-day mortality. Consider short-stay hospitalization or closely supervised outpatient care. Use clinical judgment.'; }
  else if(pts<=4){ riskClass='risk'; riskLabel=`Score ${pts} — High severity`; detail='~22% 30-day mortality. Hospitalization recommended. Score ≥4: consider ICU assessment. Assess for sepsis criteria.'; }
  else{ riskClass='risk'; riskLabel=`Score ${pts} — Severe`; detail='>40% 30-day mortality. ICU assessment recommended. Assess for sepsis, respiratory failure, and need for vasopressors.'; }
  setResult('curb65-result', resultCard(String(pts), riskLabel, detail, riskClass), riskClass);
}

function calcCrcl(){
  const age=num('crcl-age'), wt=num('crcl-wt'), cr=num('crcl-cr'), sex=sel('crcl-sex');
  const el=document.getElementById('crcl-result');
  if([age,wt,cr].some(isNaN)||cr<=0||wt<=0||age<=0){
    el.innerHTML='<div class="result-placeholder">Enter values</div>'; el.className='result-card'; return;
  }
  const crcl = ((140-age)*wt)/(72*cr) * (sex==='female'?0.85:1);
  const crclFmt = crcl.toFixed(0) + ' mL/min';
  let riskClass, ckdStage, detail;
  if(crcl>=90){ riskClass='ok'; ckdStage='G1 — Normal or high'; detail='≥90 mL/min. Standard drug dosing applies. Evaluate for kidney damage markers if CKD suspected.'; }
  else if(crcl>=60){ riskClass='ok'; ckdStage='G2 — Mildly decreased'; detail='60–89 mL/min. Most drugs dosed normally. Monitor renally-cleared drugs. Avoid nephrotoxins.'; }
  else if(crcl>=45){ riskClass=''; ckdStage='G3a — Mildly-moderately decreased'; detail='45–59 mL/min. Dose adjustment required for many drugs (metformin, NSAIDs, certain antibiotics, DOACs). Nephrology evaluation recommended.'; }
  else if(crcl>=30){ riskClass='warn'; ckdStage='G3b — Moderately-severely decreased'; detail='30–44 mL/min. Significant dose adjustments required. Avoid NSAIDs, gadolinium. Review all renally-cleared medications.'; }
  else if(crcl>=15){ riskClass='risk'; ckdStage='G4 — Severely decreased'; detail='15–29 mL/min. Prepare for renal replacement therapy planning. Extensive drug dose modification required.'; }
  else{ riskClass='risk'; ckdStage='G5 — Kidney failure'; detail='<15 mL/min. Dialysis or transplant evaluation recommended. Most renally-cleared drugs require major adjustment or are contraindicated.'; }
  setResult('crcl-result', resultCard(crclFmt, ckdStage, detail, riskClass), riskClass);
}

function calcElectro(){
  /* Corrected calcium */
  const ca=num('ca-ca'), alb=num('ca-alb');
  const caEl=document.getElementById('ca-result');
  if(!isNaN(ca)&&!isNaN(alb)&&alb>0){
    const corrCa = ca + 0.8*(4.0-alb);
    const caFmt = corrCa.toFixed(2) + ' mg/dL';
    let riskClass='', caLabel, caDetail;
    if(corrCa<8.5){ riskClass='risk'; caLabel='Corrected Ca — Hypocalcemia'; caDetail=`Corrected calcium ${caFmt} — below normal range (8.5–10.2 mg/dL). Evaluate for hypoparathyroidism, vitamin D deficiency, or hypomagnesemia.`; }
    else if(corrCa>10.2){ riskClass='warn'; caLabel='Corrected Ca — Hypercalcemia'; caDetail=`Corrected calcium ${caFmt} — above normal range (8.5–10.2 mg/dL). Evaluate for primary hyperparathyroidism, malignancy.`; }
    else{ riskClass='ok'; caLabel='Corrected Ca — Normal'; caDetail=`Corrected calcium ${caFmt} — within normal range (8.5–10.2 mg/dL).`; }
    setResult('ca-result', resultCard(caFmt, caLabel, caDetail, riskClass), riskClass);
  } else {
    caEl.innerHTML='<div class="result-placeholder">—</div>'; caEl.className='result-card';
  }

  /* Anion Gap */
  const na=num('ag-na'), cl=num('ag-cl'), hco3=num('ag-hco3'), agAlb=num('ag-alb');
  const agEl=document.getElementById('ag-result');
  if(!isNaN(na)&&!isNaN(cl)&&!isNaN(hco3)){
    const ag = na-(cl+hco3);
    const corrAg = !isNaN(agAlb)&&agAlb>0 ? ag+2.5*(4.0-agAlb) : null;
    const displayAg = corrAg!==null ? corrAg : ag;
    const agFmt = ag.toFixed(0) + ' mEq/L';
    const corrFmt = corrAg!==null ? `Corrected AG: ${corrAg.toFixed(1)} mEq/L · ` : '';
    let agClass='', agLabel, agDetail;

    if(ag>12){ agClass='warn'; agLabel='Elevated Anion Gap'; }
    else if(ag<8){ agClass=''; agLabel='Low Anion Gap'; }
    else{ agClass='ok'; agLabel='Normal Anion Gap (8–12)'; }

    let deltaDetail='';
    if(ag>12&&!isNaN(hco3)){
      const delta=(ag-12)/(24-hco3);
      let interp;
      if(delta<0.4) interp='<0.4 → Hyperchloremic normal AG acidosis';
      else if(delta<0.8) interp='0.4–0.8 → Mixed high AG + normal AG acidosis';
      else if(delta<2.0) interp='0.8–2.0 → Pure high AG metabolic acidosis';
      else interp='>2.0 → High AG acidosis + concurrent metabolic alkalosis';
      deltaDetail = ` Delta ratio: ${delta.toFixed(2)} → ${interp}.`;
    }

    const ddx = ag>12 ? ' MUDPILES: Methanol, Uremia, DKA, Propylene glycol, Isoniazid/Iron, Lactic acidosis, Ethylene glycol, Salicylates.' : '';
    agDetail = `${corrFmt}AG = Na - (Cl + HCO₃) = ${ag.toFixed(0)} mEq/L (normal 8–12).${deltaDetail}${ddx}`;
    setResult('ag-result', `<div class="result-num ${esc(agClass)}">${esc(agFmt)}</div>
      <div class="result-label">${esc(agLabel)}</div>
      <div class="result-detail">${esc(agDetail)}</div>`, agClass);
  } else {
    agEl.innerHTML='<div class="result-placeholder">—</div>'; agEl.className='result-card';
  }
}

function calcMeld(){
  let inr=num('meld-inr'), bili=num('meld-bili'), cr=num('meld-cr'), na=num('meld-na');
  const el=document.getElementById('meld-result');
  if([inr,bili,cr,na].some(isNaN)||inr<=0||bili<=0||cr<=0){
    el.innerHTML='<div class="result-placeholder">Enter values</div>'; el.className='result-card'; return;
  }
  cr=Math.min(Math.max(cr,1.0),4.0);
  const meldRaw=3.78*Math.log(bili)+11.2*Math.log(inr)+9.57*Math.log(cr)+6.43;
  const meld=Math.round(meldRaw);

  const naClamped=Math.min(Math.max(na,125),137);
  const meldNa=Math.round(meld+1.32*(137-naClamped)-0.033*meld*(137-naClamped));

  let riskClass, mort, label;
  if(meld<10){ riskClass='ok'; mort='~2%'; label='MELD <10 — Low 90-day mortality'; }
  else if(meld<20){ riskClass=''; mort='~6–20%'; label='MELD 10–19 — Moderate'; }
  else if(meld<30){ riskClass='warn'; mort='~20–50%'; label='MELD 20–29 — High'; }
  else if(meld<40){ riskClass='risk'; mort='~50–70%'; label='MELD 30–39 — Very high'; }
  else{ riskClass='risk'; mort='>70%'; label='MELD ≥40 — Critical'; }

  setResult('meld-result', `<div class="result-num ${esc(riskClass)}">${esc(String(meld))}</div>
    <div class="result-label">${esc(label)}</div>
    <div class="result-detail">Estimated 90-day mortality: ${esc(mort)}.
    <div class="sub-result">
      <strong>MELD-Na: ${esc(String(meldNa))}</strong><br>
      <span class="calc-note">MELD-Na incorporates serum sodium and is now used by UNOS for liver transplant waitlist prioritization (MELD ≥11).</span>
    </div></div>`, riskClass);
}

/* ── New calc functions ── */

function calcPhq9(){
  let total=0;
  for(let i=0;i<9;i++) total+=parseInt(v(`phq9-q${i}`)?.value||0);
  const si=parseInt(v('phq9-q8')?.value||0)>0;
  let riskClass,label,detail;
  if(total<=4){riskClass='ok';label='Score '+total+' — None–Minimal';detail='Minimal depressive symptoms. Watchful waiting; rescreen in 1 year or with new symptoms.';}
  else if(total<=9){riskClass='';label='Score '+total+' — Mild';detail='Mild depression. Watchful waiting with patient education; follow-up in 2–4 weeks. Consider counseling.';}
  else if(total<=14){riskClass='warn';label='Score '+total+' — Moderate';detail='Moderate depression. Counseling and/or pharmacotherapy recommended. Follow-up in 1–2 weeks.';}
  else if(total<=19){riskClass='risk';label='Score '+total+' — Moderately Severe';detail='Moderately severe depression. Active treatment with pharmacotherapy and/or psychotherapy indicated.';}
  else{riskClass='risk';label='Score '+total+' — Severe';detail='Severe depression. Pharmacotherapy and/or specialist referral. Consider immediate psychiatric consultation.';}
  if(si) detail+=' ⚠ Question 9 positive (suicidal ideation) — perform immediate safety assessment.';
  setResult('phq9-result',resultCard(String(total),label,detail,riskClass),riskClass);
}

function calcGad7(){
  let total=0;
  for(let i=0;i<7;i++) total+=parseInt(v(`gad7-q${i}`)?.value||0);
  let riskClass,label,detail;
  if(total<=4){riskClass='ok';label='Score '+total+' — Minimal';detail='Minimal anxiety symptoms. Rescreen if symptoms develop or worsen.';}
  else if(total<=9){riskClass='';label='Score '+total+' — Mild';detail='Mild anxiety. Monitor; consider counseling or brief behavioral interventions. Follow-up in 4 weeks.';}
  else if(total<=14){riskClass='warn';label='Score '+total+' — Moderate';detail='Moderate anxiety. Counseling and/or pharmacotherapy recommended. Reassess in 2–4 weeks.';}
  else{riskClass='risk';label='Score '+total+' — Severe';detail='Severe anxiety. Active treatment indicated. Consider specialist referral for CBT and/or pharmacotherapy.';}
  setResult('gad7-result',resultCard(String(total),label,detail,riskClass),riskClass);
}

function calcHeart(){
  const pts=parseInt(sel('heart-hx'))+parseInt(sel('heart-ekg'))+parseInt(sel('heart-age'))+parseInt(sel('heart-rf'))+parseInt(sel('heart-tn'));
  let riskClass,label,detail;
  if(pts<=3){riskClass='ok';label='Score '+pts+' — Low Risk';detail='~1.7% MACE at 6 weeks. Consider early discharge per institutional HEART Pathway protocol (requires negative serial troponins at 0h and 3h). Outpatient follow-up appropriate.';}
  else if(pts<=6){riskClass='warn';label='Score '+pts+' — Moderate Risk';detail='~12–16.6% MACE. Admission for observation, serial troponins, and further cardiac evaluation. Cardiology consultation as appropriate.';}
  else{riskClass='risk';label='Score '+pts+' — High Risk';detail='~50–65% MACE at 30 days. Early invasive strategy (angiography within 24–48h) recommended. Urgent cardiology consultation.';}
  setResult('heart-result',resultCard(String(pts),label,detail,riskClass),riskClass);
}

function calcEgfr(){
  const age=num('egfr-age'),cr=num('egfr-cr'),sex=sel('egfr-sex');
  const el=document.getElementById('egfr-result');
  if([age,cr].some(isNaN)||cr<=0||age<=0){
    el.innerHTML='<div class="result-placeholder">Enter values</div>';el.className='result-card';return;
  }
  const k=sex==='female'?0.7:0.9;
  const alpha=sex==='female'?-0.241:-0.302;
  const sf=sex==='female'?1.012:1;
  const scr_k=cr/k;
  const egfr=142*Math.pow(Math.min(scr_k,1),alpha)*Math.pow(Math.max(scr_k,1),-1.200)*Math.pow(0.9938,age)*sf;
  const egfrFmt=Math.round(egfr)+' mL/min/1.73m²';
  let riskClass,stage,detail;
  if(egfr>=90){riskClass='ok';stage='G1 — Normal or high (≥90)';detail='eGFR ≥90. Check kidney damage markers (proteinuria, hematuria) if CKD suspected. Standard drug dosing applies.';}
  else if(egfr>=60){riskClass='ok';stage='G2 — Mildly decreased (60–89)';detail='eGFR 60–89. Kidney damage markers required to diagnose CKD G2. Most drugs dosed normally. Annual monitoring.';}
  else if(egfr>=45){riskClass='';stage='G3a — Mildly-moderately decreased (45–59)';detail='eGFR 45–59. Dose adjustment for many renally-cleared drugs. Avoid NSAIDs. Nephrology referral recommended.';}
  else if(egfr>=30){riskClass='warn';stage='G3b — Moderately-severely decreased (30–44)';detail='eGFR 30–44. Significant dose adjustments required. Avoid metformin if <45. Avoid gadolinium. Nephrology follow-up.';}
  else if(egfr>=15){riskClass='risk';stage='G4 — Severely decreased (15–29)';detail='eGFR 15–29. Prepare for renal replacement therapy planning. Extensive medication adjustment required. Nephrology essential.';}
  else{riskClass='risk';stage='G5 — Kidney failure (<15)';detail='eGFR <15. Kidney failure. Dialysis or transplant evaluation. Most renally-cleared drugs contraindicated or require major dose modification.';}
  setResult('egfr-result',resultCard(egfrFmt,stage,detail,riskClass),riskClass);
}

function calcEdd(){
  const inp=v('edd-lmp');
  const el=document.getElementById('edd-result');
  if(!inp||!inp.value){el.innerHTML='<div class="result-placeholder">Enter LMP date</div>';el.className='result-card';return;}
  const [yr,mo,dy]=inp.value.split('-').map(Number);
  const lmp=new Date(yr,mo-1,dy);
  const today=new Date();today.setHours(0,0,0,0);
  if(lmp>today){el.innerHTML='<div class="result-placeholder">LMP cannot be in the future</div>';el.className='result-card';return;}
  const edd=new Date(lmp);edd.setDate(edd.getDate()+280);
  const dp=Math.floor((today-lmp)/86400000);
  const wks=Math.floor(dp/7),rem=dp%7;
  if(wks>45){el.innerHTML='<div class="result-placeholder">Check LMP date</div>';el.className='result-card';return;}
  const left=Math.round((edd-today)/86400000);
  const eddStr=edd.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const dueStr=left>0?`${left} days remaining`:left===0?'Due today':`${Math.abs(left)} days past EDD`;
  let riskClass,trim;
  if(wks<13){riskClass='';trim='1st Trimester';}
  else if(wks<27){riskClass='';trim='2nd Trimester';}
  else if(wks<37){riskClass='warn';trim='3rd Trimester — Preterm';}
  else if(wks<42){riskClass='ok';trim='3rd Trimester — Term';}
  else{riskClass='risk';trim='Post-term (≥42 weeks)';}
  const ms=[];
  if(wks>=15&&wks<20)ms.push('Quad screen: 15–20w');
  if(wks>=18&&wks<22)ms.push('Anatomy ultrasound: 18–22w');
  if(wks>=24&&wks<28)ms.push('GDM screen: 24–28w');
  if(wks>=35&&wks<37)ms.push('GBS culture: 35–37w');
  let detail=`EDD: ${eddStr} · ${dueStr}`;
  if(ms.length) detail+=' · Upcoming: '+ms.join('; ');
  setResult('edd-result',resultCard(`${wks}w ${rem}d`,trim,detail,riskClass),riskClass);
}

function calcRcri(){
  const pts=['rcri-surgery','rcri-ihd','rcri-chf','rcri-cvd','rcri-dm','rcri-cr']
    .reduce((s,id)=>s+(chk(id)?1:0),0);
  let riskClass,label,detail;
  if(pts===0){riskClass='ok';label='Score 0 — Very low risk';detail='~0.4% risk of major perioperative cardiac complications (MI, pulmonary edema, VF/cardiac arrest, complete heart block). Proceed with planned surgery.';}
  else if(pts===1){riskClass='ok';label='Score 1 — Low risk';detail='~0.9% risk. Generally safe to proceed. Optimize modifiable risk factors preoperatively.';}
  else if(pts===2){riskClass='warn';label='Score 2 — Moderate risk';detail='~6.6% risk. Preoperative cardiology consultation and optimization recommended. Non-invasive cardiac testing if results will change management.';}
  else{riskClass='risk';label=`Score ${pts} — High risk`;detail='~11% risk. Cardiology consultation recommended. Reassess necessity and timing of surgery. Discuss risk-benefit with patient and surgical team.';}
  setResult('rcri-result',resultCard(String(pts),label,detail,riskClass),riskClass);
}

function calcPecarn(){
  const isLt2=sel('pecarn-age')==='lt2';
  const hi=isLt2?['pecarn-gcs','pecarn-skull','pecarn-ams']:['pecarn-gcs','pecarn-bsf','pecarn-ams'];
  const mid=isLt2?['pecarn-hematoma','pecarn-loc','pecarn-mechanism','pecarn-abnormal']:['pecarn-loc','pecarn-vomiting','pecarn-mechanism','pecarn-headache'];
  if(!document.getElementById(hi[1]))return;
  const anyHi=hi.some(id=>chk(id));
  const anyMid=mid.some(id=>chk(id));
  if(anyHi){
    setResult('pecarn-result',resultCard('CT','CT Head Recommended','One or more high-risk criteria present. CT head indicated. Risk of clinically-important TBI is significant.','risk'),'risk');
  }else if(anyMid){
    setResult('pecarn-result',resultCard('OBS/CT','Intermediate Risk — Physician Discretion','Intermediate-risk finding(s) present. CT or observation per physician judgment and caregiver preference. Observation with return precautions is appropriate for isolated findings.','warn'),'warn');
  }else{
    const r=isLt2?'<0.02%':'<0.05%';
    setResult('pecarn-result',resultCard('SAFE','Low Risk — CT Not Required',`All criteria absent. Risk of clinically-important TBI ${r}. Discharge with return precautions.`,'ok'),'ok');
  }
}

function calcAlvarado(){
  const pts=[
    ['alv-migration',1],['alv-anorexia',1],['alv-nausea',1],['alv-tenderness',2],
    ['alv-rebound',1],['alv-temp',1],['alv-wbc',2],['alv-shift',1]
  ].reduce((s,[id,p])=>s+(chk(id)?p:0),0);
  let riskClass,label,detail;
  if(pts<=4){riskClass='ok';label='Score '+pts+' — Low probability';detail='Low likelihood of appendicitis. Safe for discharge with return precautions. If symptoms persist or worsen, reassess and consider imaging.';}
  else if(pts<=6){riskClass='warn';label='Score '+pts+' — Equivocal';detail='Compatible with appendicitis. CT imaging recommended to confirm or exclude diagnosis. Serial abdominal exams and observation appropriate.';}
  else if(pts<=9){riskClass='risk';label='Score '+pts+' — High probability';detail='High likelihood of appendicitis. Urgent surgical consultation recommended. CT may confirm diagnosis and guide operative planning.';}
  else{riskClass='risk';label='Score '+pts+' — Very high probability';detail='Very high likelihood of appendicitis. Urgent surgical consultation. Consider direct surgical exploration without CT in appropriate clinical context.';}
  setResult('alvarado-result',resultCard(String(pts),label,detail,riskClass),riskClass);
}

function calcOttawa(){
  const kneePos=['knee-age','knee-fib','knee-pat','knee-flex','knee-wt'].some(id=>chk(id));
  const anklePos=['ankle-lat','ankle-med','ankle-wt'].some(id=>chk(id));
  const footPos=['foot-5th','foot-nav','foot-wt'].some(id=>chk(id));
  const kneeEl=document.getElementById('knee-result');
  const ankleEl=document.getElementById('ankle-result');
  const footEl=document.getElementById('foot-result');
  if(kneeEl){kneeEl.className=kneePos?'perc-result pos':'perc-result neg';kneeEl.textContent=kneePos?'Knee X-ray recommended':'Knee X-ray not required per Ottawa Rule';}
  if(ankleEl){ankleEl.className=anklePos?'perc-result pos':'perc-result neg';ankleEl.textContent=anklePos?'Ankle X-ray recommended':'Ankle X-ray not required per Ottawa Rule';}
  if(footEl){footEl.className=footPos?'perc-result pos':'perc-result neg';footEl.textContent=footPos?'Foot X-ray recommended':'Foot X-ray not required per Ottawa Rule';}
}

function calcAccutane(){
  const weight = num('accutane-weight');
  const daily = num('accutane-daily');
  const el = document.getElementById('accutane-result');
  if(isNaN(weight)||weight<=0){
    el.innerHTML='<div class="result-placeholder">Enter weight</div>'; el.className='result-card'; return;
  }
  const lower = Math.round(weight*120);
  const upper = Math.round(weight*150);
  const startDose = Math.round(weight*0.5);
  const maxDaily = Math.floor(weight);
  let durationLine;
  if(!isNaN(daily) && daily > 0){
    const target = Math.round(weight*120);
    const month1mg = startDose * 30;
    const remainingDays = Math.ceil((target - month1mg) / daily);
    const totalDays = 30 + remainingDays;
    const months = Math.floor(totalDays / 30);
    const days = totalDays % 30;
    const dur = days > 0 ? `${months} months ${days} days` : `${months} months`;
    durationLine = `If you will take <strong>${esc(String(daily))} mg</strong> of isotretinoin a day, your treatment will last <strong>${esc(dur)}</strong>.`;
  } else {
    durationLine = `<span class="calc-note">Enter planned daily dose above to calculate treatment duration.</span>`;
  }
  setResult('accutane-result', `
    <div class="result-num">${esc(String(weight))} kg</div>
    <div class="result-label">Accutane Dose Targets</div>
    <div class="result-detail">
      Lower cumulative dose: <strong>${esc(String(lower))} mg</strong> <span class="calc-note">· 120 mg/kg</span><br>
      Upper cumulative dose: <strong>${esc(String(upper))} mg</strong> <span class="calc-note">· 150 mg/kg</span>
      <div class="sub-result">
        Lower daily dose: <strong>${esc(String(startDose))} mg/day</strong> <span class="calc-note">· 0.5 mg/kg</span><br>
        Max daily dose: <strong>${esc(String(maxDaily))} mg/day</strong> <span class="calc-note">· 1 mg/kg</span>
      </div>
      <div class="sub-result">${durationLine}</div>
    </div>`, '');
}

function copyAccutane(btn){
  const weight = num('accutane-weight');
  const daily = num('accutane-daily');
  if(isNaN(weight)||weight<=0) return;
  const lower = Math.round(weight*120);
  const upper = Math.round(weight*150);
  const startDose = Math.round(weight*0.5);
  const maxDaily = Math.floor(weight);
  const today = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  let text = `Accutane Dosing\nWeight: ${weight}kg\n\nLower cumulative dose: ${lower}mg (120 mg/kg)\nUpper cumulative dose: ${upper}mg (150 mg/kg)\nLower daily dose: ${startDose} mg/day (0.5 mg/kg)\nMax daily dose: ${maxDaily} mg/day (1 mg/kg)`;
  if(!isNaN(daily) && daily > 0){
    const target = Math.round(weight*120);
    const month1mg = startDose * 30;
    const remainingDays = Math.ceil((target - month1mg) / daily);
    const totalDays = 30 + remainingDays;
    const months = Math.floor(totalDays / 30);
    const days = totalDays % 30;
    const dur = days > 0 ? `${months} months ${days} days` : `${months} months`;
    text += `\n\nIf you will take ${daily} mg of isotretinoin a day, your treatment will last ${dur}.`;
  }
  text += `\n\nGenerated: ${today}\nSource: noahpac.com/calculators/`;
  navigator.clipboard.writeText(text).then(()=>{
    btn.classList.add('copied'); btn.textContent='✓ Copied';
    setTimeout(()=>{ btn.classList.remove('copied'); btn.innerHTML='&#x2398; Copy results'; }, 2000);
  });
}

function copyOttawa(e){
  const btn=e.currentTarget;
  const kneeEl=document.getElementById('knee-result');
  const ankleEl=document.getElementById('ankle-result');
  const footEl=document.getElementById('foot-result');
  const today=new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const text=`Ottawa Knee & Ankle Rules\nKnee: ${kneeEl?.textContent||'—'}\nAnkle: ${ankleEl?.textContent||'—'}\nFoot: ${footEl?.textContent||'—'}\nGenerated: ${today}\nSource: noahpac.com/calculators/`;
  navigator.clipboard.writeText(text).then(()=>{
    btn.classList.add('copied');btn.textContent='✓ Copied';
    setTimeout(()=>{btn.classList.remove('copied');btn.innerHTML='&#x2398; Copy results';},2000);
  });
}

/* ── Copy result ── */
function copyResult(calcId, btn){
  const resultEl = document.getElementById(`${calcId}-result`);
  if(!resultEl) return;
  const num = resultEl.querySelector('.result-num')?.textContent||'';
  const label = resultEl.querySelector('.result-label')?.textContent||'';
  const detail = resultEl.querySelector('.result-detail')?.textContent||'';
  const calcName = CALCS.find(c=>c.id===calcId)?.name||calcId;
  const today = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const text = `${calcName}\nResult: ${num} — ${label}\n${detail}\nGenerated: ${today}\nSource: noahpac.com/calculators/`;
  navigator.clipboard.writeText(text).then(()=>{
    btn.classList.add('copied'); btn.textContent='✓ Copied';
    setTimeout(()=>{ btn.classList.remove('copied'); btn.innerHTML='&#x2398; Copy result'; }, 2000);
  });
}

/* ── Navigation ── */
let currentCalc = null;
function showCalc(id){
  currentCalc = id;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.id===id));
  const pane = document.getElementById('pane');
  const calc = CALCS.find(c=>c.id===id);
  if(calc) calc.render(pane);
}

/* Build nav */
const tabNav = document.getElementById('tabNav');
CALCS.forEach(c=>{
  const btn=document.createElement('button');
  btn.className='tab-btn';
  btn.dataset.id=c.id;
  btn.textContent=c.name;
  btn.addEventListener('click',()=>showCalc(c.id));
  tabNav.appendChild(btn);
});
showCalc(CALCS[0].id);

