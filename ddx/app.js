'use strict';

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

const CATS = [
  {id:'electrolytes', label:'Electrolytes'},
  {id:'renal',        label:'Renal'},
  {id:'hepatic',      label:'Hepatic'},
  {id:'cbc',          label:'CBC / Hematology'},
  {id:'coag',         label:'Coagulation'},
  {id:'cardiac',      label:'Cardiac'},
  {id:'thyroid',      label:'Thyroid'},
  {id:'metabolic',    label:'Metabolic'},
  {id:'iron',         label:'Iron Studies'},
  {id:'inflammatory', label:'Inflammatory'},
  {id:'other',        label:'Other'},
];

const LABS = [

  // ── ELECTROLYTES ──────────────────────────────────────────────────────────────
  {id:'sodium', cat:'electrolytes', name:'Sodium (Na⁺)', unit:'mEq/L', range:'136–145',
   high_title:'↑ Hypernatremia', low_title:'↓ Hyponatremia',
   high:['Central diabetes insipidus','Nephrogenic diabetes insipidus','Excess free water loss (fever, diarrhea, sweating, burns)','Inadequate free water intake (adipsia, altered mental status)','Hypertonic fluid or sodium bicarbonate administration','Primary hyperaldosteronism (mild, usually <150)','Cushing syndrome'],
   low:['SIADH (most common euvolemic cause)','Heart failure (hypervolemic, dilutional)','Cirrhosis / hepatic failure','Nephrotic syndrome','Hypothyroidism','Adrenal insufficiency (Addison’s)','Diuretics (thiazide > loop)','Vomiting / diarrhea (hypovolemic)','Primary polydipsia','Beer potomania','Pseudohyponatremia (hyperlipidemia, hyperproteinemia)','Hyperglycemia (translocation hyponatremia)']},

  {id:'potassium', cat:'electrolytes', name:'Potassium (K⁺)', unit:'mEq/L', range:'3.5–5.0',
   high_title:'↑ Hyperkalemia', low_title:'↓ Hypokalemia',
   high:['Renal failure (AKI or CKD — most common)','Adrenal insufficiency / Addison’s disease','Hypoaldosteronism (type IV RTA)','ACE inhibitors / ARBs','Potassium-sparing diuretics (spironolactone, amiloride)','NSAIDs','Severe metabolic acidosis (K⁺ shifts extracellularly)','Rhabdomyolysis','Tumor lysis syndrome','Pseudohyperkalemia (hemolysis in tube, thrombocytosis)','Succinylcholine (depolarizing NMB)','Digoxin toxicity'],
   low:['Loop diuretics (furosemide, bumetanide)','Thiazide diuretics','Vomiting / nasogastric suction (metabolic alkalosis → renal K⁺ wasting)','Diarrhea / laxative abuse','Primary hyperaldosteronism (Conn syndrome)','Cushing syndrome','Renal tubular acidosis (type I or II)','Hypomagnesemia (refractory hypokalemia until Mg²⁺ replaced)','Insulin excess','Beta-adrenergic agonists (albuterol)','Alkalosis (K⁺ shifts intracellularly)','Bartter / Gitelman syndrome']},

  {id:'chloride', cat:'electrolytes', name:'Chloride (Cl⁻)', unit:'mEq/L', range:'98–106',
   high_title:'↑ Hyperchloremia', low_title:'↓ Hypochloremia',
   high:['Normal anion gap (hyperchloremic) metabolic acidosis','Diarrhea (GI bicarbonate loss)','Renal tubular acidosis (type I, II, or IV)','Excess 0.9% saline infusion','Acetazolamide use','Primary hyperparathyroidism'],
   low:['Vomiting / nasogastric suction','Metabolic alkalosis (any cause)','SIADH (dilutional)','Loop or thiazide diuretics','Cystic fibrosis (excess sweat Cl⁻ loss)','Chronic respiratory acidosis (compensatory HCO₃⁻ retention)']},

  {id:'bicarbonate', cat:'electrolytes', name:'Bicarbonate (HCO₃⁻)', unit:'mEq/L', range:'22–29',
   high_title:'↑ Elevated (Metabolic Alkalosis or Chronic Resp. Acidosis)', low_title:'↓ Decreased (Metabolic Acidosis or Resp. Alkalosis)',
   high:['Vomiting / nasogastric suction','Loop or thiazide diuretics','Primary hyperaldosteronism (Conn syndrome)','Milk-alkali syndrome','Contraction alkalosis','Chronic corticosteroid use','Compensation for chronic respiratory acidosis (COPD)'],
   low:['High anion gap acidosis: DKA, lactic acidosis, uremia, toxic alcohols (methanol, ethylene glycol), salicylates','Normal anion gap acidosis: diarrhea, renal tubular acidosis, saline excess, acetazolamide','Compensation for respiratory alkalosis (hyperventilation)']},

  {id:'calcium', cat:'electrolytes', name:'Calcium (Ca²⁺)', unit:'mg/dL', range:'8.5–10.5',
   note:'Correct for albumin: corrected Ca = measured Ca + 0.8 × (4.0 − albumin). Ionized Ca is more reliable in critically ill patients.',
   high_title:'↑ Hypercalcemia', low_title:'↓ Hypocalcemia',
   high:['Primary hyperparathyroidism (most common outpatient cause)','Malignancy: PTHrP secretion (SCC, renal, bladder), osteolytic mets, calcitriol-producing lymphomas (most common inpatient)','Granulomatous disease (sarcoidosis, TB, coccidioidomycosis — extrarenal 1α-hydroxylase)','Vitamin D toxicity','Thiazide diuretics','Lithium therapy','Familial hypocalciuric hypercalcemia (FHH — usually mild, benign)','Milk-alkali syndrome','Hyperthyroidism','Immobilization (especially Paget’s or in young patients)'],
   low:['Hypoparathyroidism (post-surgical most common; also autoimmune)','Vitamin D deficiency','Renal failure (low calcitriol synthesis, hyperphosphatemia → Ca-phos precipitation)','Hypomagnesemia (suppresses PTH release and end-organ response)','Acute pancreatitis (saponification)','Hungry bone syndrome (post-parathyroidectomy)','Massive transfusion (citrate chelation)','Bisphosphonate therapy','Hypoalbuminemia (pseudohypocalcemia — check ionized Ca)']},

  {id:'magnesium', cat:'electrolytes', name:'Magnesium (Mg²⁺)', unit:'mg/dL', range:'1.7–2.4',
   high_title:'↑ Hypermagnesemia', low_title:'↓ Hypomagnesemia',
   high:['Renal failure (most common)','Excess Mg²⁺ supplementation or antacids (especially in CKD)','Hypothyroidism','Adrenal insufficiency','Lithium therapy'],
   low:['Alcoholism (most common cause in the US)','Loop and thiazide diuretics','Chronic PPI use (impairs Mg²⁺ channel TRPM6 in gut)','Diarrhea / malabsorption (IBD, celiac, short gut)','Aminoglycosides, cisplatin, amphotericin B, calcineurin inhibitors','Poorly controlled diabetes (osmotic diuresis)','Refeeding syndrome','Gitelman / Bartter syndrome (renal wasting)']},

  {id:'phosphorus', cat:'electrolytes', name:'Phosphorus (PO₄)', unit:'mg/dL', range:'2.5–4.5',
   high_title:'↑ Hyperphosphatemia', low_title:'↓ Hypophosphatemia',
   high:['Renal failure (most common — decreased excretion)','Hypoparathyroidism (decreased renal phosphate clearance)','Vitamin D toxicity','Rhabdomyolysis (intracellular PO₄ release)','Tumor lysis syndrome','Excess phosphate intake (phosphate-containing enemas, supplements)'],
   low:['Refeeding syndrome (insulin drives PO₄ intracellularly with glucose/TPN initiation)','DKA treatment (insulin + volume repletion)','Primary or secondary hyperparathyroidism (increased renal PO₄ excretion)','Vitamin D deficiency','Aluminum- or magnesium-containing antacids (bind gut PO₄)','Alcoholism','Fanconi syndrome (proximal tubular PO₄ wasting)','Oncogenic osteomalacia (FGF23 excess — search for mesenchymal tumor)']},

  // ── RENAL ─────────────────────────────────────────────────────────────────────
  {id:'bun', cat:'renal', name:'BUN', unit:'mg/dL', range:'7–25',
   note:'BUN:Cr ratio > 20:1 suggests prerenal azotemia or upper GI bleed. Ratio < 10:1 suggests intrinsic renal disease or hepatic failure.',
   high_title:'↑ Elevated BUN (Azotemia)', low_title:'↓ Low BUN',
   high:['Prerenal: volume depletion, low cardiac output (CHF), hepatorenal syndrome','Intrinsic renal: acute tubular necrosis, glomerulonephritis, interstitial nephritis','Postrenal: urinary obstruction (BPH, stone, tumor)','Upper GI bleeding (protein digestion → urea production)','High-protein diet or hypercatabolism (sepsis, trauma, surgery)','Corticosteroids (protein catabolism)','Tetracyclines (anti-anabolic effect)'],
   low:['Liver failure (decreased hepatic urea synthesis)','Severe malnutrition / low-protein diet','SIADH (dilutional)','Pregnancy (increased GFR, dilution)']},

  {id:'creatinine', cat:'renal', name:'Creatinine (Cr)', unit:'mg/dL', range:'0.6–1.2 (M), 0.5–1.1 (F)',
   high_title:'↑ Elevated Creatinine', low_title:'↓ Low Creatinine',
   high:['Prerenal AKI: volume depletion, cardiogenic shock, hepatorenal','Intrinsic AKI: ATN (ischemic or nephrotoxic), contrast nephropathy, glomerulonephritis, interstitial nephritis, rhabdomyolysis','Postrenal AKI: obstruction','CKD (any cause — leads to chronically elevated baseline)','Drugs blocking tubular secretion: trimethoprim, cimetidine (falsely raise Cr without true GFR reduction)'],
   low:['Decreased muscle mass (elderly, cachexia, malnutrition, amputation, muscle disease)','Pregnancy (increased GFR dilutes creatinine)','Liver failure (decreased creatine synthesis in hepatocytes)']},

  {id:'uric_acid', cat:'renal', name:'Uric Acid', unit:'mg/dL', range:'3.5–7.2 (M), 2.5–6.0 (F)',
   high_title:'↑ Hyperuricemia', low_title:'↓ Hypouricemia',
   high:['Gout (acute flares, chronic tophaceous)','Tumor lysis syndrome (massive nucleic acid release)','Myeloproliferative disorders / leukemia (high cell turnover)','Renal failure (decreased excretion)','Thiazide and loop diuretics','Cyclosporine, tacrolimus','Chronic alcohol use','High-purine diet (organ meats, shellfish, red meat)','Starvation / ketoacidosis (urate competes with ketones for renal excretion)','Psoriasis (high epidermal turnover)','Lesch-Nyhan syndrome (HGPRT deficiency)'],
   low:['Allopurinol or febuxostat therapy','High-dose salicylates (uricosuric at high doses)','SIADH (dilutional)','Wilson’s disease (renal tubular dysfunction)','Xanthinuria (XDH deficiency)','Fanconi syndrome (renal urate wasting)']},

  // ── HEPATIC ───────────────────────────────────────────────────────────────────
  {id:'ast', cat:'hepatic', name:'AST', unit:'U/L', range:'10–40',
   note:'AST:ALT ≥ 2:1 (especially ≥ 3:1) suggests alcoholic liver disease. AST is less liver-specific than ALT — also elevated in muscle, heart, and hemolysis.',
   high_title:'↑ Elevated AST', low_title:null,
   high:['Hepatocellular: viral hepatitis, alcoholic hepatitis, NAFLD/NASH, drug-induced (DILI), autoimmune, ischemic (“shock liver” — very high)','Extrahepatic: acute MI, rhabdomyolysis (muscle > liver), hemolysis, pulmonary embolism (right heart strain)','Celiac disease','Thyroid disease (hyper or hypo)','Critical illness / sepsis'],
   low:null, low_note:'Low AST is not clinically significant.'},

  {id:'alt', cat:'hepatic', name:'ALT', unit:'U/L', range:'7–56',
   note:'ALT is more liver-specific than AST. Extremely high ALT (>1000 U/L) suggests viral hepatitis, ischemic hepatitis, or acetaminophen toxicity.',
   high_title:'↑ Elevated ALT', low_title:null,
   high:['Viral hepatitis: hepatitis A, B, C, E; EBV, CMV, HSV','NAFLD / NASH (most common cause of mildly elevated ALT in the US)','Alcoholic hepatitis (AST:ALT >2:1 favors alcohol)','Drug-induced (DILI): acetaminophen, statins, antibiotics, herbal/supplements, INH','Ischemic hepatitis (“shock liver”) — very high, rapid rise and fall','Autoimmune hepatitis','Hemochromatosis','Wilson’s disease (especially in young patients with elevated LFTs)','Celiac disease','Thyroid disease'],
   low:null, low_note:'Low ALT is not clinically significant. End-stage cirrhosis can paradoxically show falling transaminases as hepatocyte mass is lost.'},

  {id:'alp', cat:'hepatic', name:'Alkaline Phosphatase (ALP)', unit:'U/L', range:'44–147',
   note:'Confirm liver origin by checking GGT (also elevated in liver/biliary disease). Isolated ALP elevation with normal GGT suggests bone source.',
   high_title:'↑ Elevated ALP', low_title:'↓ Low ALP',
   high:['Biliary obstruction / cholestasis: choledocholithiasis, cholangiocarcinoma, pancreatic head mass, strictures','Primary biliary cholangitis (PBC)','Primary sclerosing cholangitis (PSC)','Hepatic infiltration: mets, sarcoid, amyloid, lymphoma, abscess','Drug-induced cholestasis','Bone disease: Paget’s disease (often very high), osteoblastic mets, healing fracture, hyperparathyroidism, osteomalacia, rickets','Physiologic: 3rd trimester pregnancy (placental ALP), childhood growth spurts','Hyperthyroidism'],
   low:['Hypothyroidism','Pernicious anemia (B12 deficiency)','Zinc deficiency','Hypophosphatasia (rare genetic disorder — very low ALP, fragile bones)','Post-cardiac bypass (transient)']},

  {id:'ggt', cat:'hepatic', name:'GGT', unit:'U/L', range:'9–48',
   note:'GGT elevation confirms hepatic origin of elevated ALP. GGT elevation with normal ALP suggests isolated enzyme induction (alcohol, anticonvulsants) without cholestasis.',
   high_title:'↑ Elevated GGT', low_title:null,
   high:['Alcohol use disorder (most sensitive marker — induced even at moderate intake)','Biliary obstruction / cholestasis (rises parallel to ALP)','Drug induction: phenytoin, carbamazepine, rifampin, barbiturates','NAFLD / NASH','Viral or autoimmune hepatitis','Pancreatitis','Hyperthyroidism','Renal failure (moderate elevation)'],
   low:null, low_note:'Low GGT is not clinically significant.'},

  {id:'bilirubin', cat:'hepatic', name:'Bilirubin (Total)', unit:'mg/dL', range:'0.1–1.2',
   note:'Direct (conjugated) vs. indirect (unconjugated) helps localize cause. Normal direct bilirubin ≤0.3 mg/dL.',
   high_title:'↑ Hyperbilirubinemia', low_title:null,
   high:['Prehepatic — indirect dominant: hemolysis (immune or non-immune), ineffective erythropoiesis, large hematoma resorption','Isolated indirect: Gilbert syndrome (benign UGT1A1 polymorphism — elevated with fasting/illness), Crigler-Najjar','Hepatic — mixed: viral hepatitis, alcoholic hepatitis, DILI, cirrhosis, sepsis (impaired uptake/conjugation)','Posthepatic — direct dominant: choledocholithiasis, cholangiocarcinoma, pancreatic cancer, PBC, PSC','Neonatal: physiologic, ABO/Rh incompatibility, G6PD deficiency'],
   low:null, low_note:'Low bilirubin is not clinically significant.'},

  {id:'albumin', cat:'hepatic', name:'Albumin', unit:'g/dL', range:'3.5–5.0',
   high_title:'↑ Elevated Albumin', low_title:'↓ Hypoalbuminemia',
   high:['Dehydration (relative / hemoconcentration — not a true elevation)'],
   low:['Liver failure / cirrhosis (decreased synthesis — half-life ~20 days, reflects chronic function)','Nephrotic syndrome (urinary albumin loss)','Malnutrition / protein-calorie deficiency','Inflammatory states (negative acute-phase reactant — IL-6 downregulates synthesis)','Protein-losing enteropathy (IBD, lymphangiectasia, celiac disease)','Burns / major trauma (third-spacing)','Pregnancy (dilutional, physiologic)','Hypothyroidism']},

  // ── CBC / HEMATOLOGY ──────────────────────────────────────────────────────────
  {id:'wbc', cat:'cbc', name:'WBC (Leukocytes)', unit:'×10³/µL', range:'4.5–11.0',
   high_title:'↑ Leukocytosis', low_title:'↓ Leukopenia',
   high:['Bacterial infection (most common cause of marked leukocytosis)','Physiologic stress: epinephrine release → demargination (exercise, pain, anxiety)','Corticosteroids (demargination + decreased apoptosis of neutrophils)','Leukemia (CML — very high; CLL; AML; ALL)','Myeloproliferative neoplasms','Post-splenectomy','Inflammatory / autoimmune disease: RA flare, vasculitis, IBD, Still’s disease','Tissue necrosis: MI, surgery, trauma, burns','G-CSF / GM-CSF therapy','Lithium','Chronic smoking (mild)'],
   low:['Viral infections: HIV (CD4+ depletion), EBV, CMV, hepatitis, influenza','Sepsis (bone marrow suppression, consumption)','Chemotherapy / radiation therapy','Aplastic anemia','Myelodysplastic syndrome','SLE / autoimmune neutropenia','Felty syndrome (RA + splenomegaly + neutropenia)','Hypersplenism (splenic sequestration)','B12 / folate deficiency (hypersegmented neutrophils, ineffective granulopoiesis)','Drugs: clozapine, carbamazepine, methimazole, TMP-SMX, dapsone']},

  {id:'hemoglobin', cat:'cbc', name:'Hemoglobin / Hematocrit', unit:'g/dL (Hgb)', range:'13.5–17.5 (M), 12.0–16.0 (F)',
   high_title:'↑ Elevated Hemoglobin (Polycythemia)', low_title:'↓ Anemia',
   high:['Polycythemia vera (JAK2 V617F mutation — autonomous EPO-independent proliferation)','Secondary — appropriate EPO: COPD, OSA, high altitude, cyanotic heart disease, right-to-left shunt','Secondary — inappropriate EPO: RCC, HCC, cerebellar hemangioblastoma, uterine fibroids','Testosterone / androgen therapy','Dehydration (spurious — hemoconcentration)'],
   low:['Microcytic (MCV <80): iron deficiency (most common), thalassemia, anemia of chronic disease (sometimes), sideroblastic anemia','Normocytic (MCV 80–100): anemia of chronic disease, acute blood loss, hemolytic anemia (AIHA, G6PD, hereditary spherocytosis), aplastic anemia, CKD (low EPO)','Macrocytic (MCV >100): B12 deficiency, folate deficiency, alcohol, liver disease, MDS, drugs (methotrexate, hydroxyurea, zidovudine)','Blood loss: GI bleed, trauma, menorrhagia, post-surgical']},

  {id:'platelets', cat:'cbc', name:'Platelets', unit:'×10³/µL', range:'150–400',
   high_title:'↑ Thrombocytosis', low_title:'↓ Thrombocytopenia',
   high:['Reactive (most common): iron deficiency, acute infection/inflammation, post-splenectomy, post-surgery, tissue necrosis, chronic inflammatory disease','Essential thrombocythemia (JAK2, CALR, or MPL mutation)','Polycythemia vera','Chronic myeloid leukemia (CML)'],
   low:['Decreased production: aplastic anemia, B12/folate deficiency, chemotherapy, radiation, viral marrow suppression (HIV, EBV, CMV), alcohol, MDS','Increased destruction: ITP (immune-mediated), TTP (ADAMTS13 deficiency), HUS (Shiga toxin or atypical), DIC, HELLP syndrome','Drug-induced: HIT (heparin + PF4 antibodies), quinine, vancomycin, sulfonamides, linezolid, abciximab','Sequestration: hypersplenism (cirrhosis, myelofibrosis, storage diseases)','Dilutional (massive transfusion)']},

  {id:'mcv', cat:'cbc', name:'MCV', unit:'fL', range:'80–100',
   high_title:'↑ Macrocytosis (MCV >100)', low_title:'↓ Microcytosis (MCV <80)',
   high:['Vitamin B12 deficiency (megaloblastic — hypersegmented neutrophils)','Folate deficiency (megaloblastic)','Alcohol (direct marrow toxicity + folate depletion)','Liver disease','Hypothyroidism','Myelodysplastic syndrome','Drugs: methotrexate, hydroxyurea, zidovudine, phenytoin, azathioprine (impair DNA synthesis)','Reticulocytosis (large immature RBCs)'],
   low:['Iron deficiency anemia (most common — also low ferritin, high TIBC)','Thalassemia (alpha or beta — normal ferritin, RBC count usually elevated)','Anemia of chronic disease (usually normocytic, sometimes mildly microcytic)','Sideroblastic anemia (ring sideroblasts on marrow biopsy)','Lead poisoning','Copper deficiency']},

  // ── COAGULATION ───────────────────────────────────────────────────────────────
  {id:'pt_inr', cat:'coag', name:'PT / INR', unit:'seconds / ratio', range:'11–13.5 s / INR <1.2',
   high_title:'↑ Prolonged PT/INR', low_title:null,
   high:['Warfarin therapy (most common)','Liver disease / failure (decreased synthesis of factors II, VII, IX, X, and protein C/S)','Vitamin K deficiency (malabsorption, prolonged NPO, broad-spectrum antibiotics, cholestasis)','DIC (consumption of all clotting factors)','Factor VII deficiency (isolated PT prolongation — extrinsic pathway only)','Superwarfarin ingestion (brodifacoum — rodenticide)','Direct thrombin or Xa inhibitors (rivaroxaban, apixaban can prolong PT)','Massive transfusion (dilution of clotting factors)'],
   low:null, low_note:'Low PT/INR is not routinely used to assess thrombotic risk.'},

  {id:'ptt', cat:'coag', name:'PTT (aPTT)', unit:'seconds', range:'25–35',
   high_title:'↑ Prolonged PTT', low_title:null,
   high:['Unfractionated heparin (UFH) — primary monitoring test','Hemophilia A (factor VIII deficiency — most common hereditary bleeding disorder)','Hemophilia B (factor IX deficiency)','Von Willebrand disease (severe, type 3)','Lupus anticoagulant / antiphospholipid syndrome (paradoxically prolonged PTT but prothrombotic)','DIC (combined with prolonged PT)','Factor XII deficiency (prolonged PTT, no bleeding risk)','Liver disease','Direct thrombin inhibitors (argatroban, bivalirudin, dabigatran)'],
   low:null, low_note:'Short PTT is not clinically significant.'},

  {id:'d_dimer', cat:'coag', name:'D-dimer', unit:'µg/mL FEU', range:'<0.50',
   note:'High sensitivity (~95%) but low specificity for VTE. Best used to rule OUT PE/DVT when pre-test probability is low (Wells score). A negative D-dimer in low/moderate pre-test probability essentially excludes VTE.',
   high_title:'↑ Elevated D-dimer', low_title:null,
   high:['Venous thromboembolism: DVT, PE (the primary indication)','Disseminated intravascular coagulation (DIC) — very high','Recent surgery or trauma','Sepsis / serious infection','Malignancy (ongoing clot formation and fibrinolysis)','Pregnancy (physiologically rises, especially 3rd trimester)','Atrial fibrillation / intracardiac thrombus','Liver disease','Inflammatory states (RA, IBD, vasculitis)','Advanced age (non-specific, increases with age)','Stroke, MI'],
   low:null, low_note:'Normal D-dimer effectively excludes VTE in low/intermediate pre-test probability.'},

  // ── CARDIAC ───────────────────────────────────────────────────────────────────
  {id:'troponin', cat:'cardiac', name:'Troponin (hs-TnI or hs-TnT)', unit:'ng/L (assay-dependent)', range:'<14–52 (lab-specific)',
   note:'Serial troponins (0h + 1–3h) used for rapid NSTEMI rule-in/rule-out. Elevated troponin always requires clinical context — many non-ACS causes exist.',
   high_title:'↑ Elevated Troponin', low_title:null,
   high:['Type 1 MI (atherosclerotic plaque rupture → thrombus → occlusion)','Type 2 MI (demand ischemia): tachyarrhythmia, hypotension, severe anemia, hypertensive emergency, sepsis','Myocarditis (viral, autoimmune, immune checkpoint inhibitor)','Pulmonary embolism (right ventricular strain and micro-infarction)','Acute decompensated heart failure (wall stress)','Takotsubo cardiomyopathy','CKD / ESRD (chronically elevated — impaired clearance + myocardial strain)','Subarachnoid hemorrhage / stroke (neurogenic myocardial injury)','Cardiac contusion (direct trauma)','Cardioversion, ablation, or cardiac surgery','Rhabdomyolysis (minor, less specific cardiac isoform elevation)'],
   low:null, low_note:'Undetectable troponin on serial high-sensitivity assays effectively rules out ACS.'},

  {id:'bnp', cat:'cardiac', name:'BNP / NT-proBNP', unit:'pg/mL', range:'BNP <100; NT-proBNP <300',
   note:'BNP released by ventricular myocytes in response to wall stretch (volume or pressure overload). Obesity causes falsely low BNP. NT-proBNP cleared by kidneys — elevated in renal failure independent of cardiac function.',
   high_title:'↑ Elevated BNP/NT-proBNP', low_title:null,
   high:['Acute decompensated heart failure (HFrEF or HFpEF) — primary use for dyspnea rule-in/rule-out','LV dysfunction from ACS','Pulmonary hypertension / cor pulmonale','Pulmonary embolism (RV strain)','CKD / ESRD (impaired clearance, especially NT-proBNP)','Sepsis / critical illness','Atrial fibrillation (atrial wall stretch)','Valvular heart disease (severe MR, AS)','Myocarditis'],
   low:null, low_note:'BNP <100 pg/mL makes heart failure unlikely as cause of acute dyspnea. Obesity can cause spuriously low BNP even with significant HF.'},

  {id:'ck', cat:'cardiac', name:'CK (Creatine Kinase)', unit:'U/L', range:'30–200 (M), 30–150 (F)',
   note:'CK-MB isoform elevates in myocardial injury. CK-MM (skeletal muscle) is the dominant fraction. CK-MB:total CK ratio >5–10% suggests cardiac origin.',
   high_title:'↑ Elevated CK', low_title:null,
   high:['Rhabdomyolysis (often >1000 U/L, with myoglobinuria risk >5000)','Strenuous exercise (benign, transient)','Acute MI (CK-MB rises 3‒6h, peaks 24h, normalizes 48–72h)','Myositis (polymyositis, dermatomyositis, inclusion body)','Muscular dystrophies','Hypothyroidism (myopathy, often very high CK)','Statin-induced myopathy (myalgia → myositis → rhabdomyolysis spectrum)','Intramuscular injections','Trauma / surgery / prolonged immobility','Malignant hyperthermia','Neuroleptic malignant syndrome','Seizures (postictal)'],
   low:null, low_note:'Low CK can occur in liver disease (reduced synthesis) or early pregnancy. Not clinically significant.'},

  // ── THYROID ───────────────────────────────────────────────────────────────────
  {id:'tsh', cat:'thyroid', name:'TSH', unit:'mIU/L', range:'0.4–4.0',
   note:'TSH is the best initial screening test. Elevated TSH + low free T4 = primary hypothyroidism. Suppressed TSH + high free T4 = hyperthyroidism. Suppressed TSH + low T4 = pituitary/hypothalamic (secondary) hypothyroidism or euthyroid sick syndrome.',
   high_title:'↑ Elevated TSH', low_title:'↓ Suppressed TSH',
   high:['Primary hypothyroidism: Hashimoto’s thyroiditis (most common), post-radioiodine ablation, post-thyroidectomy, iodine deficiency','Drugs: amiodarone (iodine-rich, blocks T4→T3), lithium, interferon-α, checkpoint inhibitors (immune thyroiditis)','Subclinical hypothyroidism (elevated TSH, normal free T4)','Recovery phase of thyroiditis (after initial hyperthyroid phase)','TSH-secreting pituitary adenoma (rare — high TSH with elevated T4)'],
   low:['Graves’ disease (most common hyperthyroidism — TSH receptor antibodies)','Toxic multinodular goiter','Toxic adenoma (autonomous nodule)','Thyroiditis — early destructive phase: subacute de Quervain, postpartum, silent (painless)','Exogenous thyroid hormone (over-replacement or factitious)','Subclinical hyperthyroidism (suppressed TSH, normal T4/T3)','Secondary hypothyroidism (suppressed TSH with low free T4 — pituitary or hypothalamic failure)','Dopamine or high-dose glucocorticoids (suppress TSH — non-thyroidal)']},

  {id:'free_t4', cat:'thyroid', name:'Free T4', unit:'ng/dL', range:'0.8–1.8',
   high_title:'↑ Elevated Free T4', low_title:'↓ Low Free T4',
   high:['Hyperthyroidism (Graves’, toxic goiter, toxic adenoma)','Thyroiditis (release of preformed T4 — painless, postpartum, de Quervain)','Exogenous levothyroxine over-replacement or ingestion','Amiodarone (early — blocks T4→T3 conversion raising T4)','Familial dysalbuminemia hyperthyroxinemia (spurious — assay interference)'],
   low:['Primary hypothyroidism (with elevated TSH)','Secondary hypothyroidism (with low or inappropriately normal TSH — pituitary or hypothalamic disease)','Euthyroid sick syndrome (low T4, low T3, low-normal TSH in critical illness)','Severe malnutrition','Drugs: dopamine, high-dose glucocorticoids (suppress T4 synthesis centrally)']},

  // ── METABOLIC ─────────────────────────────────────────────────────────────────
  {id:'glucose', cat:'metabolic', name:'Glucose (Fasting)', unit:'mg/dL', range:'70–99 (fasting)',
   high_title:'↑ Hyperglycemia', low_title:'↓ Hypoglycemia',
   high:['Diabetes mellitus type 2 (most common)','Diabetes mellitus type 1 / LADA','Diabetic ketoacidosis (DKA)','Hyperglycemic hyperosmolar state (HHS)','Stress hyperglycemia: MI, stroke, sepsis, major surgery','Corticosteroid therapy','Cushing syndrome (cortisol excess)','Acromegaly (GH excess → insulin resistance)','Pheochromocytoma (catecholamine excess)','Glucagonoma','Pancreatitis / pancreatectomy / pancreatic cancer','Atypical antipsychotics (olanzapine, clozapine — insulin resistance + weight gain)'],
   low:['Insulin overdose','Sulfonylurea or meglitinide ingestion (stimulate endogenous insulin)','Prolonged fasting in susceptible individuals (liver disease, adrenal insufficiency)','Insulinoma (autonomous insulin secretion)','Adrenal insufficiency / Addison’s disease (cortisol needed for gluconeogenesis)','Hypopituitarism (deficiency of cortisol, GH)','Liver failure (decreased gluconeogenesis and glycogen stores)','Alcohol (inhibits gluconeogenesis + glycogen depletion)','Sepsis','Non-islet cell tumor hypoglycemia (IGF-2 secreting mesenchymal tumors)','Factitious (exogenous insulin injection)']},

  {id:'lactate', cat:'metabolic', name:'Lactate', unit:'mmol/L', range:'0.5–2.0',
   note:'Lactate >2 = elevated; >4 = severe lactic acidosis (high mortality in sepsis). Normal lactate does not exclude tissue hypoperfusion in compensated shock.',
   high_title:'↑ Elevated Lactate', low_title:null,
   high:['Type A — tissue hypoperfusion: septic shock, cardiogenic shock, hypovolemic shock, cardiac arrest, mesenteric ischemia, severe hypoxemia, severe anemia, CO poisoning','Type B1 — systemic disease: liver failure (impaired lactate clearance), malignancy (leukemia, lymphoma), severe sepsis without frank shock, DM','Type B2 — drugs/toxins: metformin (especially in AKI), linezolid, NRTIs (HIV meds), propofol infusion syndrome, epinephrine/salbutamol','Type B3 — inborn errors of metabolism: mitochondrial disorders, pyruvate dehydrogenase deficiency'],
   low:null, low_note:'Low lactate is not clinically significant.'},

  {id:'ammonia', cat:'metabolic', name:'Ammonia', unit:'µmol/L', range:'15–45',
   note:'Ammonia level does not correlate well with grade of hepatic encephalopathy. Treat the clinical picture, not the number.',
   high_title:'↑ Hyperammonemia', low_title:null,
   high:['Hepatic encephalopathy (cirrhosis, acute liver failure — impaired urea cycle)','Portosystemic shunting (TIPS, large spontaneous varices)','Urea cycle disorders (OTC deficiency most common in adults — consider in encephalopathy without overt liver disease)','Valproic acid toxicity (inhibits urea cycle enzymes)','Upper GI bleeding in cirrhosis (protein load → ammonia generation)','Renal failure (decreased ammonia excretion)','UTI with urease-producing organisms (Proteus, Klebsiella) in obstructed patient','Parenteral nutrition (amino acid load)'],
   low:null, low_note:'Low ammonia is not clinically significant.'},

  // ── IRON STUDIES ──────────────────────────────────────────────────────────────
  {id:'ferritin', cat:'iron', name:'Ferritin', unit:'ng/mL', range:'30–300 (M), 15–200 (F)',
   note:'Ferritin is an acute-phase reactant — elevated in inflammation even when iron stores are depleted. Low ferritin (<15) is virtually diagnostic of iron deficiency.',
   high_title:'↑ Elevated Ferritin', low_title:'↓ Low Ferritin',
   high:['Hereditary hemochromatosis (HFE gene mutations — C282Y most common)','Iron overload from transfusions','Inflammatory / infectious states (acute-phase reactant — up-regulated by IL-6)','Liver disease (hepatocytes store and release ferritin)','Malignancy: leukemia, lymphoma, hepatocellular carcinoma, neuroblastoma','Hemophagocytic lymphohistiocytosis (HLH) — very high, often >10,000','Alcoholism','Metabolic syndrome / NAFLD','Renal failure','Adult-onset Still’s disease'],
   low:['Iron deficiency anemia (most sensitive marker — virtually diagnostic if <15 ng/mL)','Low ferritin can occur without frank anemia in early depletion (pre-anemia stage)']},

  {id:'serum_iron', cat:'iron', name:'Serum Iron', unit:'µg/dL', range:'60–170',
   high_title:'↑ Elevated Serum Iron', low_title:'↓ Low Serum Iron',
   high:['Iron toxicity / acute overdose (large ingestion)','Hereditary hemochromatosis','Hemolysis (RBC iron release)','Multiple blood transfusions','Liver necrosis (massive hepatocyte iron release)','Pyridoxine (B6) deficiency — sideroblastic anemia'],
   low:['Iron deficiency anemia','Anemia of chronic disease (hepcidin sequesters iron in macrophages)','Acute phase response / inflammation (hepcidin elevated)','Chronic blood loss']},

  {id:'tibc', cat:'iron', name:'TIBC (Transferrin Capacity)', unit:'µg/dL', range:'250–370',
   note:'TIBC reflects transferrin levels. Transferrin saturation (serum iron ÷ TIBC × 100%) <16% suggests iron deficiency; >45% suggests iron overload or hemochromatosis.',
   high_title:'↑ Elevated TIBC', low_title:'↓ Low TIBC',
   high:['Iron deficiency anemia (upregulation of transferrin synthesis — classic triad: low iron, low ferritin, high TIBC)','Pregnancy (physiologic increase in transferrin)','Oral contraceptive use (estrogen stimulates transferrin synthesis)'],
   low:['Anemia of chronic disease (hepcidin suppresses transferrin)','Malnutrition / protein deficiency','Liver disease (decreased transferrin synthesis)','Nephrotic syndrome (urinary protein losses)','Hemochromatosis / iron overload (saturated transferrin, TIBC normal or low)','Inflammatory states']},

  // ── INFLAMMATORY ──────────────────────────────────────────────────────────────
  {id:'crp', cat:'inflammatory', name:'CRP (C-Reactive Protein)', unit:'mg/L', range:'<10',
   note:'CRP rises within 6h of stimulus, peaks at 48h, and falls rapidly (half-life ~19h). More responsive to acute changes than ESR. Markedly elevated CRP (>100 mg/L) favors bacterial over viral infection.',
   high_title:'↑ Elevated CRP', low_title:null,
   high:['Bacterial infection (typically high — often >100 mg/L in bacteremia/sepsis)','Viral infection (typically lower than bacterial; usually <20–30 mg/L)','Inflammatory / autoimmune: RA, vasculitis, IBD, seronegative spondyloarthropathies','SLE (CRP often disproportionately low relative to disease activity — unless serositis or infection)','Tissue injury: MI (peaks day 2–3), surgery, trauma, pancreatitis, burns','Malignancy (tumor-derived IL-6)','Obesity (mild chronic elevation from adipose-derived cytokines)'],
   low:null, low_note:'Low CRP helps exclude significant bacterial infection or active inflammatory flare. CRP <1 mg/L associated with lower cardiovascular risk.'},

  {id:'esr', cat:'inflammatory', name:'ESR', unit:'mm/hr', range:'0–15 (M), 0–20 (F)',
   note:'ESR is slow to rise (24–48h) and slow to fall (days to weeks). Best for monitoring chronic inflammatory conditions (PMR/GCA, osteomyelitis, SBE) rather than acute diagnosis.',
   high_title:'↑ Elevated ESR', low_title:'↓ Low ESR',
   high:['Inflammatory states: RA, SLE, vasculitis, IBD, PMR/GCA (often >50–100 mm/hr)','Bacterial infection (bacterial > viral)','Multiple myeloma (markedly elevated — paraprotein causes rouleaux)','Other malignancy: lymphoma, solid tumors','Anemia (RBCs fall faster due to reduced competition)','Pregnancy','Advancing age (non-specific — reference ranges increase with age)','Hypergammaglobulinemia','Renal failure'],
   low:['Polycythemia vera (increased RBC mass slows sedimentation)','Sickle cell disease (abnormal cell shape prevents rouleaux)','Hypofibrinogenemia (DIC, severe liver failure)','Congestive heart failure (very low fibrinogen levels)','Microcytosis / spherocytosis']},

  {id:'procalcitonin', cat:'inflammatory', name:'Procalcitonin (PCT)', unit:'ng/mL', range:'<0.10',
   note:'PCT is more specific for bacterial infection than CRP or WBC. Used for antibiotic stewardship in respiratory infections: PCT <0.25 → antibiotics unlikely to benefit; PCT >0.5 → antibiotics recommended.',
   high_title:'↑ Elevated Procalcitonin', low_title:null,
   high:['Bacterial sepsis (most specific marker — rises within 3–6h, driven by bacterial endotoxin)','Bacterial pneumonia (CAP or HAP)','Intra-abdominal sepsis, bacterial meningitis','Fungal sepsis (moderate elevation)','Major surgery / trauma (transient, non-infectious — typically resolves 24–48h)','Severe burns','Medullary thyroid carcinoma (C cells produce calcitonin precursor constitutively)'],
   low:null, low_note:'PCT <0.1 ng/mL argues strongly against bacterial infection and supports withholding or stopping antibiotics. Viral infections, localized bacterial infections, and non-infectious inflammatory conditions typically do NOT significantly elevate PCT.'},

  // ── OTHER ─────────────────────────────────────────────────────────────────────
  {id:'vitamin_d', cat:'other', name:'Vitamin D (25-OH)', unit:'ng/mL', range:'30–100 (optimal)',
   high_title:'↑ Vitamin D Toxicity (>100 ng/mL)', low_title:'↓ Vitamin D Deficiency (<20 ng/mL)',
   high:['Excessive supplementation (most common cause of toxicity — active 1,25-OH form is toxic, not 25-OH directly, but high 25-OH leads to excess 1,25-OH synthesis)','Granulomatous disease: sarcoidosis, TB, histoplasmosis, berylliosis (extrarenal 1α-hydroxylase in macrophages)','Certain lymphomas (same mechanism as granulomatous disease)','Iatrogenic over-supplementation in medical setting'],
   low:['Inadequate sun exposure (UVB) — most common cause globally','Dietary deficiency','Malabsorption: Crohn’s disease, celiac, bariatric surgery, short bowel syndrome, cystic fibrosis','CKD (impaired renal 1α-hydroxylation — low active 1,25-OH even with normal 25-OH)','Liver disease (impaired hepatic 25-hydroxylation)','Nephrotic syndrome (urinary loss of vitamin D-binding protein)','Obesity (sequestration in adipose tissue)','Drugs: anticonvulsants (phenytoin, carbamazepine), rifampin, glucocorticoids (increased catabolism)']},

  {id:'b12', cat:'other', name:'Vitamin B12 (Cobalamin)', unit:'pg/mL', range:'200–900',
   high_title:'↑ Elevated B12', low_title:'↓ Low B12',
   high:['Myeloproliferative neoplasms (CML — transcobalamin release; polycythemia vera)','Liver disease (release of hepatic B12 stores)','Solid tumors: breast, colon, hepatocellular carcinoma','CMML / hypereosinophilic syndrome (transcobalamin overproduction)'],
   low:['Pernicious anemia (anti-intrinsic factor antibodies — autoimmune gastritis, most common in older adults)','Gastrectomy / gastric bypass (loss of IF-secreting parietal cells)','Crohn’s disease affecting terminal ileum (site of IF-B12 complex absorption)','Strict vegan / vegetarian diet (animal products are sole dietary source)','Metformin (long-term — impairs ileal uptake; check B12 annually)','Chronic PPI or H2-blocker use (reduced gastric acid impairs B12 release from food protein)','Small intestinal bacterial overgrowth (SIBO — bacteria compete for B12)','Pancreatic exocrine insufficiency (insufficient proteases to cleave R-protein)']},

  {id:'amylase', cat:'other', name:'Amylase', unit:'U/L', range:'25–125',
   note:'Lipase preferred over amylase for diagnosing acute pancreatitis (more sensitive, more specific, and remains elevated longer). Amylase returns to normal within 3–5 days even if pancreatitis continues.',
   high_title:'↑ Elevated Amylase', low_title:'↓ Low Amylase',
   high:['Acute pancreatitis (rises within 2–12h; returns to normal in 3–5 days)','Parotitis / salivary gland disease (salivary amylase isoform — mumps, Sjögren’s, salivary duct obstruction)','Bowel obstruction, ischemia, or perforation (gut amylase release)','Renal failure (decreased clearance — usually 3× upper limit)','Macroamylasemia (amylase bound to immunoglobulin — chronically elevated, no symptoms, normal urine amylase)','DKA','Ectopic pregnancy'],
   low:['Exocrine pancreatic insufficiency (chronic pancreatitis end-stage, cystic fibrosis — loss of acinar cells)','Severe liver disease']},

  {id:'lipase', cat:'other', name:'Lipase', unit:'U/L', range:'10–140',
   note:'Lipase is the preferred test for acute pancreatitis: sensitivity ~90–94%, more specific than amylase. Remains elevated for 7–14 days (useful when patient presents late).',
   high_title:'↑ Elevated Lipase', low_title:'↓ Low Lipase',
   high:['Acute pancreatitis (most common cause of markedly elevated lipase)','CKD / renal failure (decreased clearance — often mild elevation up to 3× ULN)','Bowel obstruction or mesenteric ischemia','Cholecystitis / biliary disease (adjacent inflammation)','Medications: azathioprine, valproic acid, didanosine, pentamidine, sulfonamides','Macrolipasemia','Perforated peptic ulcer (duodenal content exposure to pancreatic lipase)'],
   low:['Exocrine pancreatic insufficiency: end-stage chronic pancreatitis, cystic fibrosis (near-total acinar cell loss)']},

];

// ── Rendering ─────────────────────────────────────────────────────────────────

let activeId = null;

function buildNav() {
  const q = document.getElementById('ddxSearch').value.trim().toLowerCase();
  const nav = document.getElementById('tabNav');
  nav.innerHTML = '';

  CATS.forEach(cat => {
    const items = LABS.filter(l => l.cat === cat.id &&
      (!q || l.name.toLowerCase().includes(q)));
    items.forEach(l => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (l.id === activeId ? ' active' : '');
      btn.dataset.id = l.id;
      btn.textContent = l.name;
      btn.addEventListener('click', () => showLab(l.id));
      nav.appendChild(btn);
    });
  });
}

function showLab(id) {
  const lab = LABS.find(l => l.id === id);
  if (!lab) return;
  activeId = id;
  buildNav();

  const highHtml = lab.high
    ? `<ul class="ddx-list">${lab.high.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`
    : '';

  const lowHtml = lab.low
    ? `<ul class="ddx-list">${lab.low.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`
    : `<p class="ddx-nolow">${esc(lab.low_note || 'Low values are not clinically significant.')}</p>`;

  const colsHtml = `
    <div class="ddx-cols">
      <div>
        <div class="ddx-col-head high">${esc(lab.high_title || '↑ Elevated ' + lab.name)}</div>
        ${highHtml}
      </div>
      <div>
        <div class="ddx-col-head low">${esc(lab.low_title || '↓ Low ' + lab.name)}</div>
        ${lowHtml}
      </div>
    </div>`;

  document.getElementById('pane').innerHTML = `
    <div class="ddx-eyebrow">${esc(CATS.find(c => c.id === lab.cat)?.label || '')}</div>
    <h2 class="ddx-name">${esc(lab.name)}</h2>
    <div class="ddx-range">${esc(lab.unit)} &nbsp;·&nbsp; Normal: ${esc(lab.range)}</div>
    ${lab.note ? `<p class="ddx-note">${esc(lab.note)}</p>` : ''}
    ${colsHtml}
    <button class="copy-btn" id="copyBtn">&#x2398; Copy differentials</button>`;

  document.getElementById('copyBtn').addEventListener('click', () => copyDdx(lab));
}

function copyDdx(lab) {
  const lines = [`${lab.name}  ·  ${lab.unit}  ·  Normal: ${lab.range}`];
  if (lab.note) lines.push(`\n${lab.note}`);
  if (lab.high) {
    lines.push(`\n${lab.high_title || '↑ Elevated ' + lab.name}`);
    lab.high.forEach(c => lines.push(`  • ${c}`));
  }
  lines.push(`\n${lab.low_title || '↓ Low ' + lab.name}`);
  if (lab.low) {
    lab.low.forEach(c => lines.push(`  • ${c}`));
  } else {
    lines.push(`  ${lab.low_note || 'Low values are not clinically significant.'}`);
  }
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    const btn = document.getElementById('copyBtn');
    if (!btn) return;
    btn.textContent = '✓ Copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '⎘ Copy differentials'; btn.classList.remove('copied'); }, 2000);
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────

buildNav();
document.getElementById('ddxSearch').addEventListener('input', buildNav);
