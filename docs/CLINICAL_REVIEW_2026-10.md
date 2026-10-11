# Clinical content review — October 2026

This record documents the implemented safety changes and the primary guidance
used for them. It is an engineering review record, not independent medical
validation or a substitute for clinician sign-off.

| Area | Implemented disposition | Primary source/version |
|---|---|---|
| Vaccines | CDC and AAP COVID-19 paths are separated; pediatric shared-decision, risk-based, and universal recommendations are no longer collapsed into one blanket rule. | CDC 2026–27 COVID guidance; AAP 2026 schedule |
| ALS | Post-arrest oxygen, temperature, coronary-intervention, and glucose language updated; routine bicarbonate language removed. | AHA 2025 CPR/ECC |
| PALS | Two-finger infant compressions removed; shock/epinephrine sequence and post-arrest care updated; bicarbonate narrowed. | AHA/AAP 2025 CPR/ECC |
| Pediatric dosing | Medication/fluid doses now require measured weight. Age is optional and only drives airway sizing; ETT size is never inferred from weight. | Safety boundary; AHA/AAP pediatric references |
| Opioids | Removed target-opioid dose and cross-tolerance prescription output. Retained current-regimen MME for risk context. | CDC 2022 opioid guideline |
| Steroids | Removed generated taper table and Copy SIG. Retained equivalency plus non-prescriptive taper context. | Endocrine Society/ESE 2024 guideline |
| Sepsis | Added SIRS; explicitly rejects qSOFA-only screening; updated fluids and reassessment language. | Surviving Sepsis Campaign 2026; Sepsis-3 |
| STI | Replaced interim Doxy-PEP language and erroneous HIV/PrEP prerequisite with final eligibility and follow-up guidance. Updated Bicillin availability note. | CDC Doxy-PEP 2024; CDC product availability Sep 2026 |
| Anticoagulation | Removed blanket bridging recommendation, clarified selected high-risk exceptions, updated U.S. Andexxa status, and narrowed antiplatelet transfusion language. | CHEST 2022; FDA Dec 2025 safety communication |
| Toxicology | Tightened methylene-blue and charcoal cautions and updated the poison-center resource. | ACMT/Poison Control and product-specific guidance |

All other calculators and reference tools retain their existing logic and are
covered by quarterly topic monitors or live authoritative APIs. A source change
now produces a visible pending/error state instead of a falsely green status.
