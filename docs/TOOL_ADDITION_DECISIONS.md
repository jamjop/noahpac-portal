# Focused tool-addition decisions

Reviewed 2026-10-11.

- Added FIB-4 with AASLD interpretation, the age-over-65 cutoff, the
  age-35-and-younger accuracy caveat, and an acute-illness warning.
- Added KDIGO G/A staging using both eGFR and urine ACR, with chronicity and
  G1/G2 diagnostic caveats. This does not claim to calculate KFRE.
- Added AUDIT-C and the validated NIDA single-question drug-use screen. The
  results are screening prompts, not diagnoses.
- Added McIsaac testing support inside the GAS pharyngitis workflow. It never
  recommends empiric antibiotics and yields to viral-feature and high-risk
  clinical context.
- Added a focused CDC-based HIV PrEP/PEP workflow to the STI guide.
- Did not reproduce STOP-BANG. The American Thoracic Society questionnaire
  repository states that reuse requires permission from the developer, and
  University Health Network identifies the tool as its property. Reconsider
  only after documented permission or license terms are obtained.
- Added current CMS HCPCS Level II codes to Code & Terminology Lookup through
  NLM Clinical Tables, filtering out terminated codes. This is explicitly
  labeled as HCPCS Level II and not represented as
  CPT. A true CPT search remains deferred because CPT codes and descriptors
  require an AMA license for use in a distributed web product; integrate only
  after a suitable license and authorized data source are documented.

Deliberately out of scope: comprehensive renal dosing, interaction checking,
pregnancy drug databases, and general prescribing references. Those need
commercial-grade editorial coverage and continuous maintenance.
