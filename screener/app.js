/* ============================================================
   Built-in dataset (fallback). The update script replaces this
   by writing data/uspstf.json in the same schema.
   sex: "any" | "female" | "male"
   requires: flags that must be true for the rec to firmly apply.
   If unmet, the rec appears under "May apply if…".
   ============================================================ */
const BUILTIN = {
  meta: { source: "builtin", updated: "2026-06-10",
          note: "Curated from uspreventiveservicestaskforce.org, incl. 2024 breast, Jan 2025 osteoporosis, 2025 cervical updates." },
  recs: [
    {name:"Vision screening (amblyopia)", grade:"B", sex:"any", minAge:3, maxAge:5, freq:"at least once", detail:"Screen at least once between ages 3–5 to detect amblyopia or its risk factors."},
    {name:"Obesity screening (children)", grade:"B", sex:"any", minAge:6, maxAge:17, freq:"routine visits", detail:"BMI screening; refer children with obesity to intensive behavioral interventions."},
    {name:"Anxiety screening (children/adolescents)", grade:"B", sex:"any", minAge:8, maxAge:18, freq:"periodic", detail:"Screen ages 8–18, including those without recognized signs or symptoms."},
    {name:"Depression screening (adolescents)", grade:"B", sex:"any", minAge:12, maxAge:18, freq:"periodic", detail:"Screen for major depressive disorder with systems for diagnosis, treatment, and follow-up."},

    {name:"Blood pressure (hypertension)", grade:"A", sex:"any", minAge:18, maxAge:120, freq:"annual 40+ · q3–5y 18–39", detail:"Office BP measurement; confirm with out-of-office readings before diagnosis."},
    {name:"Tobacco use screening & cessation", grade:"A", sex:"any", minAge:18, maxAge:120, freq:"every visit", detail:"Ask all adults about tobacco use; behavioral + pharmacotherapy for users."},
    {name:"Depression screening (adults)", grade:"B", sex:"any", minAge:18, maxAge:120, freq:"periodic", detail:"All adults, including pregnant/postpartum people and older adults."},
    {name:"Anxiety screening (adults)", grade:"B", sex:"any", minAge:18, maxAge:64, freq:"periodic", detail:"Adults 18–64 including pregnant/postpartum. Evidence insufficient at 65+."},
    {name:"Unhealthy alcohol use", grade:"B", sex:"any", minAge:18, maxAge:120, freq:"periodic", detail:"Screen; brief behavioral counseling for risky/hazardous drinking."},
    {name:"Unhealthy drug use", grade:"B", sex:"any", minAge:18, maxAge:120, freq:"periodic", detail:"Ask about drug use when diagnosis and care services can be offered or referred."},
    {name:"Obesity (adults) — intensive intervention", grade:"B", sex:"any", minAge:18, maxAge:120, freq:"routine visits", detail:"Offer or refer adults with BMI ≥30 to intensive multicomponent behavioral interventions."},
    {name:"HIV screening", grade:"A", sex:"any", minAge:15, maxAge:65, freq:"at least once", detail:"Screen ages 15–65 at least once; repeat for those at increased risk; all pregnancies."},
    {name:"Hepatitis C screening", grade:"B", sex:"any", minAge:18, maxAge:79, freq:"at least once", detail:"Screen all adults 18–79 at least once; periodic if ongoing risk."},

    {name:"Syphilis screening (nonpregnant)", grade:"A", sex:"any", minAge:15, maxAge:120, requires:["stiRisk"], freq:"periodic", detail:"Screen asymptomatic adults and adolescents at increased risk."},
    {name:"Hepatitis B screening", grade:"B", sex:"any", minAge:15, maxAge:120, requires:["stiRisk"], freq:"periodic", detail:"Screen adolescents and adults at increased risk."},
    {name:"Latent tuberculosis screening", grade:"B", sex:"any", minAge:18, maxAge:120, requires:["stiRisk"], freq:"once / periodic", detail:"Screen adults at increased risk (e.g., born in or travel to high-prevalence countries, congregate settings)."},

    {name:"Chlamydia & gonorrhea", grade:"B", sex:"female", minAge:15, maxAge:24, requires:["sexuallyActive"], freq:"periodic", detail:"All sexually active women 24 and younger."},
    {name:"Chlamydia & gonorrhea (25+)", grade:"B", sex:"female", minAge:25, maxAge:65, requires:["stiRisk"], freq:"periodic", detail:"Women 25+ at increased risk."},
    {name:"Cervical cancer", grade:"A", sex:"female", minAge:21, maxAge:65, freq:"q3y / q5y", detail:"21–29: cytology q3y. 30–65: hrHPV primary test q5y — clinician- or self-collected (2025 update) — or cytology q3y, or co-testing q5y. Stop after 65 with adequate prior screening."},
    {name:"Intimate partner violence", grade:"B", sex:"female", minAge:18, maxAge:49, freq:"periodic", detail:"Screen women of reproductive age; provide or refer to ongoing support services."},
    {name:"BRCA risk assessment", grade:"B", sex:"female", minAge:18, maxAge:120, requires:["brcaHistory"], freq:"once", detail:"Familial risk tool; refer positives for genetic counseling and, if indicated, testing."},
    {name:"Breast cancer (mammography)", grade:"B", sex:"female", minAge:40, maxAge:74, freq:"every 2 yrs", detail:"Biennial screening mammography (2024 update — start age lowered from 50 to 40)."},
    {name:"Osteoporosis (women 65+)", grade:"B", sex:"female", minAge:65, maxAge:120, freq:"DXA", detail:"Bone measurement testing to prevent osteoporotic fractures in all women 65+."},
    {name:"Osteoporosis (postmenopausal <65)", grade:"B", sex:"female", minAge:40, maxAge:64, requires:["postmenopausal"], freq:"DXA if tool +", detail:"Screen postmenopausal women <65 at increased risk per a clinical risk assessment tool (Jan 2025 update)."},

    {name:"Prediabetes & type 2 diabetes", grade:"B", sex:"any", minAge:35, maxAge:70, requires:["bmi25"], freq:"~every 3 yrs", detail:"Screen adults 35–70 with overweight or obesity; consider earlier in higher-risk groups."},
    {name:"Statin use / CVD risk assessment", grade:"B", sex:"any", minAge:40, maxAge:75, requires:["cvdRisk"], freq:"risk estimate", detail:"Statin for primary prevention at 40–75 with ≥1 risk factor and est. 10-yr CVD risk ≥10%."},
    {name:"Colorectal cancer (early start)", grade:"B", sex:"any", minAge:45, maxAge:49, freq:"varies by test", detail:"Begin screening: colonoscopy q10y, FIT annually, stool DNA-FIT q1–3y, CT colonography or flexible sigmoidoscopy q5y."},
    {name:"Colorectal cancer", grade:"A", sex:"any", minAge:50, maxAge:75, freq:"varies by test", detail:"Continue screening with any recommended modality."},
    {name:"Colorectal cancer (76–85)", grade:"C", sex:"any", minAge:76, maxAge:85, freq:"individualized", detail:"Selectively offer based on overall health, prior screening history, and preferences."},
    {name:"Lung cancer (low-dose CT)", grade:"B", sex:"any", minAge:50, maxAge:80, requires:["heavySmoker"], freq:"annual", detail:"Annual LDCT for ages 50–80 with ≥20 pack-years who smoke now or quit within 15 yrs."},
    {name:"Prostate cancer (PSA)", grade:"C", sex:"male", minAge:55, maxAge:69, freq:"individualized", detail:"Individual decision after discussing potential benefits and harms. Not recommended at 70+ (D)."},
    {name:"Abdominal aortic aneurysm", grade:"B", sex:"male", minAge:65, maxAge:75, requires:["everSmoked"], freq:"one-time US", detail:"One-time ultrasound for men 65–75 who have ever smoked. Never-smokers: selective (C)."},

    {name:"Syphilis (pregnancy)", grade:"A", sex:"female", minAge:12, maxAge:55, requires:["pregnant"], freq:"early + repeat", detail:"Screen early in pregnancy; rescreen later in pregnancy per 2025 update."},
    {name:"Hepatitis B (pregnancy)", grade:"A", sex:"female", minAge:12, maxAge:55, requires:["pregnant"], freq:"first visit", detail:"HBsAg at the first prenatal visit."},
    {name:"Rh(D) typing & antibody", grade:"A", sex:"female", minAge:12, maxAge:55, requires:["pregnant"], freq:"first visit", detail:"Blood typing and antibody testing at the first prenatal visit."},
    {name:"Asymptomatic bacteriuria (pregnancy)", grade:"B", sex:"female", minAge:12, maxAge:55, requires:["pregnant"], freq:"urine culture", detail:"Urine culture screening in pregnant persons."},
    {name:"Gestational diabetes", grade:"B", sex:"female", minAge:12, maxAge:55, requires:["pregnant"], freq:"≥24 weeks", detail:"Screen asymptomatic pregnant people at 24 weeks of gestation or after."},
    {name:"Preeclampsia (BP in pregnancy)", grade:"B", sex:"female", minAge:12, maxAge:55, requires:["pregnant"], freq:"every visit", detail:"BP measurement throughout pregnancy; low-dose aspirin after 12 wks if high risk."}
  ]
};

const FLAG_LABELS = {
  pregnant:"currently pregnant", postmenopausal:"postmenopausal",
  everSmoked:"has ever smoked", heavySmoker:"≥20 pack-yr history, current smoker or quit <15 yrs",
  bmi25:"BMI ≥25", sexuallyActive:"sexually active", stiRisk:"at increased STI/HBV/TB risk",
  cvdRisk:"≥1 cardiovascular risk factor", brcaHistory:"history suggesting BRCA-related cancer"
};

let DATA = BUILTIN;
const state = { age: 50, sex: "female" };

const els = {
  age: document.getElementById('age'),
  sexSeg: document.getElementById('sexSeg'),
  results: document.getElementById('results'),
  datasource: document.getElementById('datasource'),
  flagGrid: document.getElementById('flagGrid'),
  copyBar: document.getElementById('copyBar'),
  copyBtn: document.getElementById('copyBtn')
};

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function flags() {
  const out = {};
  document.querySelectorAll('.flag-grid input').forEach(cb => out[cb.id.slice(2)] = cb.checked);
  return out;
}

function sexMatch(recSex, patientSex){ return recSex === "any" || recSex === patientSex; }

function render() {
  const age = Math.max(0, Math.min(110, parseInt(els.age.value || "0", 10)));
  const f = flags();
  // hide female-only flags for male patients
  document.querySelectorAll('.flag-grid label[data-only]').forEach(l => {
    l.style.display = (l.dataset.only === state.sex) ? "" : "none";
  });

  const firm = [], conditional = [];
  for (const r of DATA.recs) {
    if (!sexMatch(r.sex, state.sex)) continue;
    if (age < r.minAge || age > r.maxAge) continue;
    const req = r.requires || [];
    const unmet = req.filter(k => !f[k]);
    if (unmet.length === 0) firm.push(r);
    else conditional.push({ rec: r, unmet });
  }
  const order = {A:0,B:1,C:2};
  firm.sort((a,b)=>(order[a.grade]??3)-(order[b.grade]??3));

  let html = "";
  const recRow = (r, condText) => `
    <div class="rec">
      <div class="rec-title">
        <span class="chip ${esc(r.grade)}">${esc(r.grade)}</span>
        ${r.sex==="female"?'<span class="tag women">W</span>':r.sex==="male"?'<span class="tag men">M</span>':""}
        <span class="rec-name">${esc(r.name)}</span>
      </div>
      ${r.freq?`<div class="freq">${esc(r.freq)}</div>`:""}
      <div class="rec-detail">${esc(r.detail||"")}</div>
      ${condText?`<div class="cond">Applies if: ${esc(condText)}</div>`:""}
    </div>`;

  const recommended = firm.filter(r=>r.grade==="A"||r.grade==="B");
  const individualized = firm.filter(r=>r.grade==="C");

  html += `<div class="group-head"><span class="group-name">Recommended</span><span class="group-count">${recommended.length}</span></div>`;
  html += recommended.length ? recommended.map(r=>recRow(r)).join("") :
    `<div class="empty">No Grade A/B screenings firmly apply at age ${age} with the selected factors.</div>`;

  if (individualized.length) {
    html += `<div class="group-head"><span class="group-name">Individualized decision (Grade C)</span><span class="group-count">${individualized.length}</span></div>`;
    html += individualized.map(r=>recRow(r)).join("");
  }
  if (conditional.length) {
    html += `<div class="group-head"><span class="group-name">May apply — depends on risk factors</span><span class="group-count">${conditional.length}</span></div>`;
    html += conditional.map(({rec,unmet}) =>
      recRow(rec, unmet.map(k=>FLAG_LABELS[k]||k).join("; "))).join("");
  }
  els.results.innerHTML = html;
  const hasAny = recommended.length || individualized.length || conditional.length;
  els.copyBar.hidden = !hasAny;
}

/* events */
els.age.addEventListener('input', render);
els.sexSeg.addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  els.sexSeg.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  state.sex = b.dataset.sex;
  if (state.sex === "male") { const p=document.getElementById('f_pregnant'); if(p) p.checked=false; }
  render();
});
els.flagGrid.addEventListener('change', render);

function buildText() {
  const age = Math.max(0, Math.min(110, parseInt(els.age.value || "0", 10)));
  const f = flags();
  const sexLabel = state.sex === "female" ? "female" : "male";

  const firm = [], conditional = [];
  for (const r of DATA.recs) {
    if (!sexMatch(r.sex, state.sex)) continue;
    if (age < r.minAge || age > r.maxAge) continue;
    const unmet = (r.requires || []).filter(k => !f[k]);
    if (unmet.length === 0) firm.push(r);
    else conditional.push({ rec: r, unmet });
  }
  firm.sort((a,b)=>({A:0,B:1,C:2}[a.grade]??3)-({A:0,B:1,C:2}[b.grade]??3));

  const recommended   = firm.filter(r => r.grade === "A" || r.grade === "B");
  const individualized = firm.filter(r => r.grade === "C");
  const activeFlags = Object.entries(f).filter(([,v])=>v).map(([k])=>FLAG_LABELS[k]||k);
  const today = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});

  const lines = [
    "USPSTF Screening Recommendations",
    `Patient: ${age}-year-old ${sexLabel}`,
  ];
  if (activeFlags.length) lines.push(`Risk factors: ${activeFlags.join(", ")}`);
  lines.push(`Generated: ${today}`, "");

  const section = (title, items, condFn) => {
    lines.push(`── ${title} (${items.length}) ──`, "");
    if (!items.length) { lines.push("  (none)", ""); return; }
    for (const item of items) {
      const r = item.rec || item;
      let row = `• ${r.name} [Grade ${r.grade}]`;
      if (r.freq) row += `  ·  ${r.freq}`;
      if (r.sex === "female") row += "  (W)";
      if (r.sex === "male")   row += "  (M)";
      lines.push(row);
      if (condFn) lines.push(`  Applies if: ${condFn(item)}`);
      lines.push("");
    }
  };

  section("Recommended (A/B)", recommended);
  if (individualized.length) section("Individualized decision (C)", individualized);

  const src = DATA.meta?.source === "builtin"
    ? `Built-in dataset · verified ${DATA.meta.updated}`
    : `Live data · USPSTF Prevention TaskForce API · updated ${DATA.meta?.updated||"?"}`;
  lines.push(`Source: ${src}`, "uspreventiveservicestaskforce.org");
  return lines.join("\n");
}

els.copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(buildText()).then(() => {
    els.copyBtn.classList.add('copied');
    els.copyBtn.textContent = '✓ Copied';
    setTimeout(() => {
      els.copyBtn.classList.remove('copied');
      els.copyBtn.innerHTML = '&#x2398; Copy recommendations';
    }, 2000);
  });
});

/* try live data, fall back to builtin */
fetch('data/uspstf.json', {cache:'no-cache'})
  .then(r => { if(!r.ok) throw 0; return r.json(); })
  .then(j => {
    if (j && Array.isArray(j.recs) && j.recs.length) {
      DATA = j;
      els.datasource.classList.add('live');
      els.datasource.innerHTML = `<span class="dot"></span>Live data · USPSTF Prevention TaskForce API · updated ${esc(j.meta?.updated||"?")}`;
    } else throw 0;
  })
  .catch(() => {
    els.datasource.innerHTML = `<span class="dot"></span>Built-in dataset · verified ${esc(BUILTIN.meta.updated)} · run update_uspstf.py for live data`;
  })
  .finally(render);
