// ── Antibiotic master dictionary ──────────────────────────────────────────
const ABX = {
  pen:   {name:"Penicillin G",            abbr:"PEN G"},
  amp:   {name:"Ampicillin",              abbr:"AMP"},
  oxa:   {name:"Oxacillin",               abbr:"OXA"},
  ams:   {name:"Ampicillin/Sulbactam",    abbr:"AMP/SUL"},
  ptz:   {name:"Pip/Tazobactam",          abbr:"PIP/TAZ"},
  cfz:   {name:"Cefazolin",               abbr:"CFZ"},
  cfz_u: {name:"Cefazolin (urine)",       abbr:"CFZ-U"},
  cfx:   {name:"Cefoxitin",               abbr:"CFX"},
  cxm:   {name:"Cefuroxime",              abbr:"CXM"},
  cro:   {name:"Ceftriaxone",             abbr:"CRO"},
  caz:   {name:"Ceftazidime",             abbr:"CAZ"},
  fep:   {name:"Cefepime",                abbr:"FEP"},
  mem:   {name:"Meropenem",               abbr:"MEM"},
  gen:   {name:"Gentamicin",              abbr:"GEN"},
  tob:   {name:"Tobramycin",              abbr:"TOB"},
  cip:   {name:"Ciprofloxacin",           abbr:"CIP"},
  lvx:   {name:"Levofloxacin",            abbr:"LVX"},
  van:   {name:"Vancomycin",              abbr:"VAN"},
  tet:   {name:"Tetracycline",            abbr:"TET"},
  dox:   {name:"Doxycycline",             abbr:"DOX"},
  cli:   {name:"Clindamycin",             abbr:"CLI"},
  ery:   {name:"Erythromycin",            abbr:"ERY"},
  azi:   {name:"Azithromycin",            abbr:"AZI"},
  sxt:   {name:"TMP/SMX",                abbr:"TMP/SMX"},
  rif:   {name:"Rifampin",               abbr:"RIF"},
  dap:   {name:"Daptomycin",             abbr:"DAP"},
  lzd:   {name:"Linezolid",              abbr:"LZD"},
  nit:   {name:"Nitrofurantoin (urine)",  abbr:"NIT"},
};

// Display order for columns
const ABX_ORDER = [
  "pen","amp","oxa","ams","ptz","cfz","cfz_u","cfx","cxm",
  "cro","caz","fep","mem",
  "gen","tob","cip","lvx",
  "van","tet","dox","cli","ery","azi",
  "sxt","rif","dap","lzd","nit"
];

// ── Facility data ──────────────────────────────────────────────────────────
const FACILITIES = [
  {
    "id": "trinity",
    "name": "Trinity Hospital",
    "location": "Minot, ND",
    "period": "2023",
    "sourceNote": "ND HHS Archive \u00b7 Trinity Hospital Antibiogram 2023 (data period: Jan 1 \u2013 Dec 31, 2022) \u00b7 % susceptible, 1st isolate/patient/year \u00b7 hhs.nd.gov/\u2026/2023-TrinityHealth-archive.pdf",
    "organisms": [
      {
        "name": "Staph aureus (MSSA)",
        "gram": "positive",
        "isolates": 483,
        "s": {
          "pen": "nr",
          "oxa": 100,
          "ams": 100,
          "ptz": "nr",
          "cfz": "nr",
          "cfx": "nr",
          "cxm": "nr",
          "cro": "nr",
          "caz": "nr",
          "fep": "nr",
          "mem": "nr",
          "gen": 99,
          "tob": "nr",
          "cip": 89,
          "lvx": 90,
          "van": 100,
          "tet": 94,
          "cli": 81,
          "azi": 69,
          "sxt": 100,
          "rif": 100,
          "dap": 100,
          "lzd": 100,
          "nit": 100
        }
      },
      {
        "name": "Staph aureus (MRSA)",
        "gram": "positive",
        "isolates": 162,
        "s": {
          "oxa": 0,
          "ams": 0,
          "mem": 98,
          "gen": "nr",
          "cip": 32,
          "lvx": 35,
          "van": 100,
          "tet": 96,
          "cli": 80,
          "sxt": 98,
          "rif": 99,
          "dap": 99,
          "lzd": 100,
          "nit": 93
        }
      },
      {
        "name": "Staph aureus (All strains)",
        "gram": "positive",
        "isolates": 645,
        "s": {
          "amp": "nr",
          "oxa": 75,
          "ams": 75,
          "ptz": "nr",
          "cfz": "nr",
          "cfx": "nr",
          "cxm": "nr",
          "cro": "nr",
          "caz": "nr",
          "fep": "nr",
          "mem": 98,
          "gen": "nr",
          "cip": 75,
          "lvx": 76,
          "van": 100,
          "tet": 95,
          "cli": 81,
          "azi": 56,
          "sxt": 99,
          "rif": 100,
          "dap": 100,
          "lzd": 100,
          "nit": 98
        }
      },
      {
        "name": "Staph, Coagulase Neg",
        "gram": "positive",
        "isolates": 280,
        "s": {
          "oxa": 50,
          "ams": 50,
          "mem": 96,
          "gen": "nr",
          "cip": 85,
          "lvx": 85,
          "van": 100,
          "tet": 87,
          "cli": 64,
          "azi": 42,
          "sxt": 83,
          "rif": 99,
          "dap": 100,
          "lzd": 100,
          "nit": 100
        }
      },
      {
        "name": "Streptococcus pneumoniae",
        "gram": "positive",
        "isolates": 39,
        "s": {
          "pen": 93,
          "amp": "nr",
          "cro": 100,
          "fep": "nr",
          "mem": 89,
          "lvx": 97,
          "van": 100,
          "tet": 76,
          "cli": 86,
          "azi": 75,
          "sxt": 79
        }
      },
      {
        "name": "Enterococcus faecalis",
        "gram": "positive",
        "isolates": 353,
        "s": {
          "amp": 100,
          "cip": 84,
          "lvx": 89,
          "van": 100,
          "tet": 31,
          "sxt": 50,
          "rif": 100,
          "dap": 100,
          "nit": 100
        }
      },
      {
        "name": "Enterococcus faecium",
        "gram": "positive",
        "isolates": 45,
        "s": {
          "amp": 33,
          "cip": 20,
          "lvx": 36,
          "van": 67,
          "tet": 64,
          "rif": 100,
          "dap": 98,
          "nit": 83
        }
      },
      {
        "name": "E. coli",
        "gram": "negative",
        "isolates": 2424,
        "s": {
          "amp": 64,
          "ams": 68,
          "ptz": 100,
          "cfz": 93,
          "cfx": 97,
          "cxm": 93,
          "cro": 95,
          "caz": 96,
          "fep": 96,
          "mem": 100,
          "gen": 94,
          "tob": 97,
          "cip": "nr",
          "lvx": "nr",
          "sxt": 84,
          "nit": 98
        }
      },
      {
        "name": "Klebsiella pneumoniae",
        "gram": "negative",
        "isolates": 421,
        "s": {
          "ptz": 98,
          "cfz": 97,
          "cfx": 96,
          "cxm": 94,
          "cro": 97,
          "caz": 98,
          "fep": 98,
          "mem": 100,
          "gen": 99,
          "tob": 99,
          "sxt": 94,
          "nit": 48
        }
      },
      {
        "name": "Klebsiella oxytoca",
        "gram": "negative",
        "isolates": 133,
        "s": {
          "ams": 72,
          "ptz": 97,
          "cfz": 19,
          "cfx": 94,
          "cxm": 89,
          "cro": 95,
          "caz": 97,
          "fep": 96,
          "mem": 100,
          "gen": 96,
          "tob": 98,
          "sxt": 97,
          "nit": 93
        }
      },
      {
        "name": "Proteus mirabilis",
        "gram": "negative",
        "isolates": 166,
        "s": {
          "amp": 89,
          "ptz": 95,
          "cfz": 100,
          "cfx": 93,
          "cxm": 99,
          "cro": 99,
          "caz": 98,
          "fep": 100,
          "mem": 99,
          "gen": 95,
          "sxt": 86
        }
      },
      {
        "name": "Enterobacter cloacae",
        "gram": "negative",
        "isolates": 137,
        "s": {
          "ptz": 85,
          "cro": 69,
          "caz": 79,
          "fep": 94,
          "mem": 100,
          "gen": 99,
          "tob": 99,
          "sxt": 96,
          "nit": 26
        }
      },
      {
        "name": "Klebsiella aerogenes",
        "gram": "negative",
        "isolates": 63,
        "note": "formerly Enterobacter",
        "s": {
          "ptz": 90,
          "cxm": 84,
          "cro": 83,
          "caz": 98,
          "fep": 100,
          "mem": 100,
          "gen": 100,
          "sxt": 98,
          "nit": 24
        }
      },
      {
        "name": "Serratia marcescens",
        "gram": "negative",
        "isolates": 28,
        "s": {
          "ptz": 89,
          "cxm": 93,
          "cro": 93,
          "caz": 96,
          "fep": 100,
          "mem": 100,
          "gen": 100,
          "sxt": 100
        }
      },
      {
        "name": "Citrobacter freundii",
        "gram": "negative",
        "isolates": 35,
        "s": {
          "ptz": 89,
          "cfx": 80,
          "cxm": 80,
          "cro": 100,
          "caz": 100,
          "fep": 97,
          "mem": 97,
          "sxt": 89,
          "nit": 96
        }
      },
      {
        "name": "Pseudomonas aeruginosa",
        "gram": "negative",
        "isolates": 192,
        "s": {
          "ptz": 96,
          "caz": 96,
          "fep": 96,
          "mem": 98,
          "gen": 87,
          "tob": 99
        }
      },
      {
        "name": "Stenotrophomonas maltophilia",
        "gram": "negative",
        "isolates": 24,
        "s": {
          "sxt": 100
        }
      },
      {
        "name": "H. influenzae",
        "gram": "negative",
        "isolates": 22,
        "note": "68% beta-lactamase neg",
        "s": {}
      }
    ],
    "sourceUrl": "https://www.hhs.nd.gov/sites/default/files/documents/DOH%20Legacy/Antimicrobial/2023-TrinityHealth-archive.pdf"
  },
  {
    "id": "sanford_bismarck",
    "name": "Sanford Health",
    "location": "Bismarck, ND",
    "period": "2025",
    "sourceNote": "ND HHS Archive \u00b7 Sanford Health Antibiogram 2025 \u00b7 % susceptible, 1st isolate/patient/year",
    "sourceUrl": "https://www.hhs.nd.gov/sites/default/files/documents/public-health/hai/2025-sanford-bismarck-inpatient-outpatient-antibiogram-archive.pdf",
    "organisms": [
      {
        "name": "Citrobacter freundii",
        "gram": "negative",
        "isolates": 200,
        "note": null,
        "s": {
          "amp": 89,
          "ptz": 1.5,
          "cfz": 99,
          "cfz_u": 0,
          "cxm": 85,
          "cro": 81,
          "gen": 100,
          "cip": 96,
          "lvx": 96,
          "dox": 99,
          "tet": 99,
          "nit": 87,
          "sxt": 97
        }
      },
      {
        "name": "Enterobacter cloacae",
        "gram": "negative",
        "isolates": 179,
        "note": null,
        "s": {
          "amp": 77,
          "ptz": 3.4,
          "cfz": 95,
          "cfz_u": 2.8,
          "cxm": 80,
          "cro": 77,
          "gen": 99,
          "cip": 95,
          "lvx": 95,
          "dox": 99,
          "tet": 99,
          "nit": 24,
          "sxt": 94
        }
      },
      {
        "name": "Escherichia coli",
        "gram": "negative",
        "isolates": 4127,
        "note": null,
        "s": {
          "amp": 62,
          "ptz": 98,
          "ams": 0.3,
          "cfz": 92,
          "cfz_u": 98,
          "cxm": 0.8,
          "cro": 92,
          "gen": 95,
          "cip": 100,
          "lvx": 83,
          "dox": 83,
          "tet": 95,
          "nit": 95,
          "sxt": 97,
          "rif": 84
        }
      },
      {
        "name": "Klebsiella aerogenes",
        "gram": "negative",
        "isolates": 117,
        "note": null,
        "s": {
          "amp": 84,
          "ptz": 0.9,
          "cfz": 100,
          "cfz_u": 0,
          "cxm": 85,
          "cro": 86,
          "gen": 100,
          "cip": 96,
          "lvx": 95,
          "dox": 100,
          "tet": 100,
          "nit": 12,
          "sxt": 99
        }
      },
      {
        "name": "Klebsiella oxytoca",
        "gram": "negative",
        "isolates": 164,
        "note": null,
        "s": {
          "amp": 95,
          "ptz": 3.0,
          "cfz": 98,
          "cfz_u": 0.6,
          "cxm": 94,
          "cro": 96,
          "gen": 100,
          "cip": 96,
          "lvx": 98,
          "dox": 98,
          "tet": 98,
          "nit": 84,
          "sxt": 96
        }
      },
      {
        "name": "Klebsiella pneumoniae",
        "gram": "negative",
        "isolates": 661,
        "note": null,
        "s": {
          "amp": 93,
          "ptz": 4.8,
          "ams": 92,
          "cfz": 98,
          "cfz_u": 0.9,
          "cxm": 91,
          "cro": 96,
          "gen": 99,
          "cip": 92,
          "lvx": 91,
          "dox": 98,
          "tet": 98,
          "nit": 26,
          "sxt": 94
        }
      },
      {
        "name": "Proteus mirabilis",
        "gram": "negative",
        "isolates": 344,
        "note": null,
        "s": {
          "amp": 89,
          "ptz": 100,
          "ams": 0,
          "cfz": 83,
          "cfz_u": 98,
          "cxm": 1.4,
          "cro": 99,
          "gen": 98,
          "cip": 100,
          "lvx": 88,
          "dox": 87,
          "tet": 97,
          "nit": 97,
          "sxt": 92
        }
      },
      {
        "name": "Pseudomonas aeruginosa",
        "gram": "negative",
        "isolates": 374,
        "note": null,
        "s": {
          "ptz": 86,
          "ams": null,
          "cfz": 93,
          "cfz_u": null,
          "cxm": 92,
          "gen": 91,
          "cip": 87,
          "lvx": 81,
          "dox": null,
          "tet": 97,
          "nit": null,
          "sxt": null
        }
      },
      {
        "name": "Serratia marcescens",
        "gram": "negative",
        "isolates": 49,
        "note": "Instrument does not give data for S. marcescens and pip/tazo",
        "s": {
          "amp": null,
          "ptz": null,
          "cfz": 100,
          "cfz_u": 0,
          "cxm": 94,
          "cro": 88,
          "gen": 100,
          "cip": 90,
          "lvx": 90,
          "dox": 100,
          "tet": 86,
          "nit": null,
          "sxt": 100
        }
      },
      {
        "name": "Stenotrophomonas maltophilia",
        "gram": "negative",
        "isolates": 30,
        "note": "S. maltophilia minocycline: 100% S",
        "s": {
          "amp": null,
          "ptz": null,
          "cfz": null,
          "cfz_u": null,
          "cxm": null,
          "cro": null,
          "gen": null,
          "cip": null,
          "lvx": 63,
          "dox": null,
          "tet": null,
          "nit": null,
          "sxt": 100
        }
      },
      {
        "name": "Haemophilus influenzae",
        "gram": "negative",
        "isolates": 34,
        "note": null,
        "s": {
          "amp": 88,
          "ptz": null,
          "cfz": null,
          "cfz_u": null,
          "cxm": null,
          "cro": null,
          "gen": null,
          "cip": null,
          "lvx": null,
          "dox": null,
          "tet": null,
          "nit": null,
          "sxt": null
        }
      },
      {
        "name": "Enterococcus faecalis",
        "gram": "positive",
        "isolates": 452,
        "note": null,
        "s": {
          "amp": 100,
          "cro": 92,
          "lvx": 93,
          "ery": 99,
          "lzd": 96,
          "dap": 99
        }
      },
      {
        "name": "Enterococcus faecium",
        "gram": "positive",
        "isolates": 55,
        "note": null,
        "s": {
          "amp": 18,
          "cro": 7,
          "lvx": 7,
          "ery": 26,
          "lzd": 95,
          "dap": 49
        }
      },
      {
        "name": "Staphylococcus aureus (MSSA)",
        "gram": "positive",
        "isolates": 778,
        "note": null,
        "s": {
          "oxa": 100,
          "gen": 97,
          "cip": 71,
          "ery": 99,
          "cli": 92,
          "sxt": 97,
          "lzd": 100,
          "dap": 100
        }
      },
      {
        "name": "Staphylococcus aureus (MRSA)",
        "gram": "positive",
        "isolates": 275,
        "note": "2025 inpatient + outpatient MRSA rate: 26%",
        "s": {
          "oxa": 0,
          "gen": 92,
          "cip": 20,
          "ery": 99,
          "cli": 87,
          "sxt": 95,
          "lzd": 100,
          "dap": 100
        }
      },
      {
        "name": "Staphylococcus epidermidis",
        "gram": "positive",
        "isolates": 205,
        "note": null,
        "s": {
          "oxa": 40,
          "gen": 69,
          "cip": 36,
          "ery": 100,
          "cli": 86,
          "sxt": 62,
          "lzd": 100,
          "dap": 100
        }
      },
      {
        "name": "Streptococcus pneumoniae",
        "gram": "positive",
        "isolates": 48,
        "note": null,
        "s": {
          "amp": 100,
          "pen": 71,
          "cfz": 100,
          "cro": 98,
          "cip": 88,
          "ery": 60,
          "tet": 83,
          "sxt": 79,
          "lzd": 100,
          "dap": 100
        }
      }
    ]
  },
  {
    "id": "altru",
    "name": "Altru Health System",
    "location": "Grand Forks, ND",
    "period": "2025",
    "sourceNote": "ND HHS Archive \u00b7 Altru Health System Antibiogram 2025 \u00b7 % susceptible, 1st isolate/patient/year",
    "sourceUrl": "https://www.hhs.nd.gov/sites/default/files/documents/public-health/hai/2025-altru-antibiogram-archive.pdf",
    "organisms": [
      {
        "name": "E. faecalis",
        "gram": "positive",
        "isolates": 449,
        "note": null,
        "s": {
          "ams": null,
          "pen": null,
          "cfz": null,
          "amp": null,
          "oxa": null,
          "ptz": null,
          "mem": null,
          "cro": null,
          "cxm": null,
          "sxt": null,
          "cli": null,
          "dap": 99,
          "lzd": 97,
          "van": 72,
          "nit": 99
        }
      },
      {
        "name": "E. faecium",
        "gram": "positive",
        "isolates": 77,
        "note": null,
        "s": {
          "ams": null,
          "pen": null,
          "cfz": null,
          "amp": 20,
          "oxa": null,
          "ptz": null,
          "mem": null,
          "cro": null,
          "cxm": null,
          "sxt": null,
          "cli": null,
          "dap": 61,
          "lzd": 88,
          "van": "Not tested",
          "nit": 31
        }
      },
      {
        "name": "S. aureus",
        "gram": "positive",
        "isolates": 792,
        "note": null,
        "s": {
          "ams": null,
          "pen": null,
          "cfz": null,
          "amp": null,
          "oxa": 73,
          "ptz": null,
          "mem": null,
          "cro": null,
          "cxm": null,
          "sxt": 95,
          "cli": 82,
          "dap": 97,
          "lzd": 100,
          "van": 100,
          "nit": 100
        }
      },
      {
        "name": "MRSA",
        "gram": "positive",
        "isolates": 214,
        "note": null,
        "s": {
          "ams": null,
          "pen": null,
          "cfz": null,
          "amp": null,
          "oxa": null,
          "ptz": null,
          "mem": null,
          "cro": null,
          "cxm": null,
          "sxt": 91,
          "cli": 79,
          "dap": 94,
          "lzd": 99,
          "van": 100,
          "nit": 100
        }
      },
      {
        "name": "S. epidermidis",
        "gram": "positive",
        "isolates": 206,
        "note": null,
        "s": {
          "ams": null,
          "pen": null,
          "cfz": null,
          "amp": null,
          "oxa": 51,
          "ptz": null,
          "mem": null,
          "cro": null,
          "cxm": null,
          "sxt": null,
          "cli": 61,
          "dap": 88,
          "lzd": 100,
          "van": 100,
          "nit": 100
        }
      },
      {
        "name": "S. pneumoniae",
        "gram": "positive",
        "isolates": 54,
        "note": "1",
        "s": {
          "ams": null,
          "pen": 98,
          "cfz": 73,
          "amp": null,
          "oxa": null,
          "ptz": null,
          "mem": null,
          "cro": 98,
          "cxm": 70,
          "sxt": null,
          "cli": 96,
          "dap": null,
          "lzd": 100,
          "van": 100,
          "nit": null
        }
      },
      {
        "name": "\u03b2-hemolytic Strep: GAS/GBS",
        "gram": "positive",
        "isolates": 44,
        "note": null,
        "s": {
          "ams": null,
          "pen": 100,
          "cfz": 100,
          "amp": null,
          "oxa": null,
          "ptz": null,
          "mem": null,
          "cro": 100,
          "cxm": null,
          "sxt": 84,
          "cli": 49,
          "dap": null,
          "lzd": 100,
          "van": 100,
          "nit": null
        }
      },
      {
        "name": "S. intermedius",
        "gram": "positive",
        "isolates": 47,
        "note": null,
        "s": {
          "ams": null,
          "pen": 100,
          "cfz": null,
          "amp": null,
          "oxa": null,
          "ptz": null,
          "mem": null,
          "cro": 100,
          "cxm": null,
          "sxt": 70,
          "cli": null,
          "dap": null,
          "lzd": 96,
          "van": null,
          "nit": null
        }
      },
      {
        "name": "S. anginosus",
        "gram": "positive",
        "isolates": 31,
        "note": null,
        "s": {
          "ams": null,
          "pen": 85,
          "cfz": null,
          "amp": null,
          "oxa": null,
          "ptz": null,
          "mem": null,
          "cro": 94,
          "cxm": null,
          "sxt": 62,
          "cli": null,
          "dap": null,
          "lzd": 97,
          "van": null,
          "nit": null
        }
      },
      {
        "name": "S. mitis/oralis",
        "gram": "positive",
        "isolates": 48,
        "note": null,
        "s": {
          "ams": null,
          "pen": 68,
          "cfz": null,
          "amp": null,
          "oxa": null,
          "ptz": null,
          "mem": null,
          "cro": 95,
          "cxm": null,
          "sxt": 77,
          "cli": null,
          "dap": null,
          "lzd": 100,
          "van": null,
          "nit": null
        }
      },
      {
        "name": "E. coli",
        "gram": "negative",
        "isolates": 2222,
        "note": null,
        "s": {
          "pen": null,
          "amp": 62,
          "oxa": null,
          "ams": null,
          "ptz": 96,
          "cfz": 93,
          "cfz_u": null,
          "cfx": null,
          "cxm": null,
          "cro": 96,
          "caz": null,
          "fep": 100,
          "mem": 80,
          "gen": null,
          "tob": null,
          "cip": 95,
          "lvx": null,
          "van": null,
          "tet": 83,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": 97,
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": 71
        }
      },
      {
        "name": "E. cloacae",
        "gram": "negative",
        "isolates": 139,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": 78,
          "cfz": null,
          "cfz_u": null,
          "cfx": null,
          "cxm": null,
          "cro": 92,
          "caz": 92,
          "fep": 95,
          "mem": 98,
          "gen": null,
          "tob": null,
          "cip": null,
          "lvx": null,
          "van": null,
          "tet": 93,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": "nr",
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": "nr"
        }
      },
      {
        "name": "K. aerogenes",
        "gram": "negative",
        "isolates": 67,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": 81,
          "cfz": null,
          "cfz_u": null,
          "cfx": null,
          "cxm": null,
          "cro": 100,
          "caz": 100,
          "fep": 95,
          "mem": 98,
          "gen": null,
          "tob": null,
          "cip": null,
          "lvx": null,
          "van": null,
          "tet": 98,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": "nr",
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": "nr"
        }
      },
      {
        "name": "K. oxytoca",
        "gram": "negative",
        "isolates": 156,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": 87,
          "cfz": 94,
          "cfz_u": null,
          "cfx": null,
          "cxm": null,
          "cro": 100,
          "caz": 100,
          "fep": 97,
          "mem": 99,
          "gen": null,
          "tob": null,
          "cip": null,
          "lvx": null,
          "van": null,
          "tet": 98,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": 91,
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": null
        }
      },
      {
        "name": "K. pneumoniae",
        "gram": "negative",
        "isolates": 374,
        "note": null,
        "s": {
          "pen": null,
          "amp": 91,
          "oxa": null,
          "ams": null,
          "ptz": 94,
          "cfz": 97,
          "cfz_u": null,
          "cfx": null,
          "cxm": null,
          "cro": 100,
          "caz": 100,
          "fep": 90,
          "mem": 98,
          "gen": null,
          "tob": null,
          "cip": null,
          "lvx": null,
          "van": null,
          "tet": 94,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": "nr",
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": null
        }
      },
      {
        "name": "P. aeruginosa",
        "gram": "negative",
        "isolates": 314,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": 89,
          "cfz": null,
          "cfz_u": null,
          "cfx": null,
          "cxm": null,
          "cro": 93,
          "caz": null,
          "fep": 90,
          "mem": null,
          "gen": null,
          "tob": null,
          "cip": null,
          "lvx": null,
          "van": null,
          "tet": 93,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": null,
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": null
        }
      },
      {
        "name": "P. mirabilis",
        "gram": "negative",
        "isolates": 220,
        "note": null,
        "s": {
          "pen": 90,
          "amp": 94,
          "oxa": null,
          "ams": null,
          "ptz": 99,
          "cfz": 98,
          "cfz_u": null,
          "cfx": null,
          "cxm": null,
          "cro": 100,
          "caz": 99,
          "fep": 91,
          "mem": 95,
          "gen": null,
          "tob": null,
          "cip": null,
          "lvx": null,
          "van": null,
          "tet": 90,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": "nr",
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": null
        }
      },
      {
        "name": "Citrobacter gp",
        "gram": "negative",
        "isolates": 134,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": 87,
          "cfz": null,
          "cfz_u": null,
          "cfx": null,
          "cxm": null,
          "cro": 100,
          "caz": 99,
          "fep": 91,
          "mem": 100,
          "gen": null,
          "tob": null,
          "cip": null,
          "lvx": null,
          "van": null,
          "tet": 96,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": 92,
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": null
        }
      },
      {
        "name": "S. marcescens",
        "gram": "negative",
        "isolates": 45,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": null,
          "cfz": null,
          "cfz_u": null,
          "cfx": null,
          "cxm": null,
          "cro": 100,
          "caz": 100,
          "fep": 93,
          "mem": "nr",
          "gen": null,
          "tob": null,
          "cip": null,
          "lvx": null,
          "van": null,
          "tet": 100,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": "nr",
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": null
        }
      },
      {
        "name": "Haemophilus gp",
        "gram": "negative",
        "isolates": 73,
        "note": null,
        "s": {
          "pen": 69,
          "amp": 87,
          "oxa": null,
          "ams": null,
          "ptz": null,
          "cfz": null,
          "cfz_u": null,
          "cfx": null,
          "cxm": null,
          "cro": null,
          "caz": null,
          "fep": null,
          "mem": 97,
          "gen": null,
          "tob": null,
          "cip": 100,
          "lvx": null,
          "van": null,
          "tet": 75,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": null,
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": null
        }
      }
    ]
  },
  {
    "id": "chi_bismarck",
    "name": "CHI St. Alexius Health",
    "location": "Bismarck, ND",
    "period": "2024",
    "sourceNote": "ND HHS Archive \u00b7 CHI St. Alexius Health Bismarck Antibiogram (Jan 1 \u2013 Dec 31, 2024) \u00b7 inpatient \u00b7 % susceptible",
    "organisms": [
      {
        "name": "Staph aureus (MSSA)",
        "gram": "positive",
        "isolates": 137,
        "s": {
          "oxa": 100,
          "gen": 100,
          "lvx": 92,
          "van": 100,
          "cli": 87,
          "sxt": 99,
          "dox": 100,
          "nit": 100
        }
      },
      {
        "name": "Staph aureus (MRSA)",
        "gram": "positive",
        "isolates": 42,
        "s": {
          "gen": 100,
          "lvx": 31,
          "van": 100,
          "cli": 73,
          "sxt": 95,
          "dox": 95,
          "nit": 100
        }
      },
      {
        "name": "Staph aureus (All)",
        "gram": "positive",
        "isolates": 185,
        "s": {
          "oxa": 74,
          "gen": 100,
          "van": 100,
          "cli": 66,
          "sxt": 95,
          "dox": 96,
          "nit": 100
        }
      },
      {
        "name": "Staph CoNS",
        "gram": "positive",
        "isolates": 55,
        "s": {
          "oxa": 43,
          "gen": 96,
          "lvx": 69,
          "van": 100,
          "cli": 63,
          "sxt": 68,
          "dox": 90,
          "nit": 100
        }
      },
      {
        "name": "Streptococcus pneumoniae",
        "gram": "positive",
        "isolates": 26,
        "note": "PCN/CRO: non-meningitis breakpoints",
        "s": {
          "pen": 96,
          "cro": 96,
          "lvx": 100,
          "sxt": 80,
          "dox": 58
        }
      },
      {
        "name": "Strep viridans",
        "gram": "positive",
        "isolates": 54,
        "s": {
          "pen": 78,
          "cro": 94,
          "lvx": 98,
          "van": 100,
          "cli": 81
        }
      },
      {
        "name": "Enterococcus faecalis",
        "gram": "positive",
        "isolates": 87,
        "s": {
          "amp": 100,
          "gen": 80,
          "lvx": 85,
          "cip": 85,
          "van": 100,
          "nit": 100
        }
      },
      {
        "name": "Enterococcus faecium",
        "gram": "positive",
        "isolates": 24,
        "s": {
          "amp": 13,
          "gen": 96,
          "lvx": 9,
          "cip": 9,
          "van": 50,
          "nit": 39
        }
      },
      {
        "name": "E. coli",
        "gram": "negative",
        "isolates": 536,
        "s": {
          "ptz": 50,
          "cfz_u": 96,
          "cro": 91,
          "caz": 93,
          "fep": 99,
          "mem": 100,
          "tob": 95,
          "lvx": 77,
          "cip": 79,
          "sxt": 80,
          "nit": 98
        }
      },
      {
        "name": "Klebsiella pneumoniae",
        "gram": "negative",
        "isolates": 103,
        "s": {
          "ptz": 100,
          "cfz_u": 91,
          "cro": 85,
          "caz": 87,
          "fep": 89,
          "mem": 99,
          "tob": 94,
          "lvx": 84,
          "cip": 84,
          "sxt": 86
        }
      },
      {
        "name": "Klebsiella oxytoca",
        "gram": "negative",
        "isolates": 28,
        "s": {
          "cfz_u": 94,
          "cro": 96,
          "caz": 100,
          "fep": 100,
          "mem": 100,
          "tob": 100,
          "lvx": 100,
          "cip": 100,
          "sxt": 93,
          "nit": 96
        }
      },
      {
        "name": "Proteus mirabilis",
        "gram": "negative",
        "isolates": 55,
        "s": {
          "cfz_u": 100,
          "cro": 98,
          "caz": 98,
          "fep": 100,
          "mem": 100,
          "tob": 100,
          "lvx": 75,
          "cip": 75,
          "sxt": 90
        }
      },
      {
        "name": "Enterobacter cloacae",
        "gram": "negative",
        "isolates": 38,
        "s": {
          "ptz": 65,
          "caz": "nr",
          "fep": 89,
          "mem": 95,
          "tob": 97,
          "lvx": 100,
          "cip": 97,
          "sxt": 97,
          "nit": 29
        }
      },
      {
        "name": "Klebsiella aerogenes",
        "gram": "negative",
        "isolates": 19,
        "s": {
          "ptz": 71,
          "caz": "nr",
          "fep": 100,
          "mem": 100,
          "tob": 100,
          "lvx": 100,
          "cip": 100,
          "sxt": 100,
          "nit": 21
        }
      },
      {
        "name": "Citrobacter freundii",
        "gram": "negative",
        "isolates": 11,
        "note": "n<30; interpret with caution",
        "s": {
          "ptz": 85,
          "caz": "nr",
          "fep": 100,
          "mem": 100,
          "tob": 100,
          "lvx": 90,
          "cip": 100,
          "sxt": 100,
          "nit": 90
        }
      },
      {
        "name": "Pseudomonas aeruginosa",
        "gram": "negative",
        "isolates": 95,
        "s": {
          "ptz": 91,
          "caz": 92,
          "fep": 97,
          "mem": 89,
          "tob": 97,
          "lvx": 76,
          "cip": 84
        }
      }
    ],
    "sourceUrl": "https://www.hhs.nd.gov/sites/default/files/documents/DOH%20Legacy/Antimicrobial/2024-CHI-StAlexius-Bismarck-antibiogram-archive.pdf"
  },
  {
    "id": "chi_devilslake",
    "name": "CHI St. Alexius Health",
    "location": "Devils Lake, ND",
    "period": "2025",
    "sourceNote": "ND HHS Archive \u00b7 CHI St. Alexius Health Antibiogram 2025 \u00b7 % susceptible, 1st isolate/patient/year",
    "sourceUrl": "https://www.hhs.nd.gov/sites/default/files/documents/public-health/hai/2025-chi-stalexius-devilslake-antibiogram-archive.pdf",
    "organisms": [
      {
        "name": "Staph aureus (MSSA)",
        "gram": "positive",
        "isolates": 121,
        "note": null,
        "s": {
          "oxacillin": 100,
          "gentamicin": 100,
          "tobramycin": 91,
          "vancomycin": 100,
          "doxycycline": 95,
          "dap": 100,
          "nit": 99,
          "rif": 100
        }
      },
      {
        "name": "Staph aureus (MRSA)",
        "gram": "positive",
        "isolates": 53,
        "note": null,
        "s": {
          "oxacillin": 0,
          "gentamicin": 100,
          "tobramycin": 30,
          "vancomycin": 100,
          "doxycycline": 77,
          "dap": 90,
          "nit": 96,
          "rif": 100
        }
      },
      {
        "name": "Staph aureus (All strains)",
        "gram": "positive",
        "isolates": 174,
        "note": null,
        "s": {
          "oxacillin": 70,
          "gentamicin": 100,
          "tobramycin": 72,
          "vancomycin": 100,
          "doxycycline": 89,
          "dap": 97,
          "nit": 98,
          "rif": 100
        }
      },
      {
        "name": "Staph coag negative",
        "gram": "positive",
        "isolates": 58,
        "note": null,
        "s": {
          "oxacillin": 43,
          "gentamicin": 95,
          "tobramycin": 81,
          "vancomycin": 98,
          "doxycycline": 52,
          "dap": 69,
          "nit": 88,
          "rif": 100
        }
      },
      {
        "name": "Strep pneumoniae",
        "gram": "positive",
        "isolates": 27,
        "note": "S - Gentamicin synergy only",
        "s": {
          "pen": 100,
          "cfz": 70,
          "caz": 96,
          "fep": 92,
          "vancomycin": 100,
          "doxycycline": 85,
          "nit": 52
        }
      },
      {
        "name": "Strep viridans",
        "gram": "positive",
        "isolates": 48,
        "note": null,
        "s": {
          "pen": 78,
          "caz": 98,
          "tobramycin": 91,
          "vancomycin": 100,
          "doxycycline": 83
        }
      },
      {
        "name": "Enterococcus faecalis",
        "gram": "positive",
        "isolates": 92,
        "note": null,
        "s": {
          "amp": 100,
          "gentamicin": 76,
          "tobramycin": 87,
          "vancomycin": 87,
          "doxycycline": 99,
          "nit": 33
        }
      },
      {
        "name": "Enterococcus faecium",
        "gram": "positive",
        "isolates": 32,
        "note": null,
        "s": {
          "amp": 19,
          "gentamicin": 100,
          "tobramycin": 13,
          "vancomycin": 7,
          "doxycycline": 42,
          "nit": 40
        }
      },
      {
        "name": "E. coli",
        "gram": "negative",
        "isolates": 483,
        "note": null,
        "s": {
          "amp": 55,
          "ams": 22,
          "ptz": 94,
          "cfz": 61,
          "cfx": 89,
          "cro": 91,
          "caz": 91,
          "fep": 99,
          "cip": 96,
          "lvx": 93,
          "gen": 77,
          "tob": 79,
          "doxycycline": 87,
          "rif": 96
        }
      },
      {
        "name": "Klebsiella pneumoniae",
        "gram": "negative",
        "isolates": 128,
        "note": null,
        "s": {
          "amp": 93,
          "ptz": 93,
          "cfz": 66,
          "cfx": 86,
          "cro": 88,
          "caz": 88,
          "cip": 95,
          "lvx": 93,
          "gen": 86,
          "tob": 87,
          "doxycycline": 87,
          "rif": 26
        }
      },
      {
        "name": "Klebsiella oxytoca",
        "gram": "negative",
        "isolates": 32,
        "note": null,
        "s": {
          "amp": 100,
          "ptz": 84,
          "cfz": 0,
          "cfx": 0,
          "cro": 84,
          "caz": 100,
          "fep": 100,
          "cip": 100,
          "lvx": 100,
          "gen": 89,
          "tob": 100,
          "doxycycline": 100,
          "rif": 93
        }
      },
      {
        "name": "Proteus mirabilis",
        "gram": "negative",
        "isolates": 42,
        "note": null,
        "s": {
          "amp": 81,
          "ptz": 100,
          "cfz": 100,
          "cfx": 16,
          "cro": 93,
          "caz": 97,
          "fep": 100,
          "cip": 100,
          "lvx": 100,
          "gen": 96,
          "tob": 83,
          "doxycycline": 80,
          "rif": 0
        }
      },
      {
        "name": "Enterobacter cloacae",
        "gram": "negative",
        "isolates": 39,
        "note": null,
        "s": {
          "ptz": 63,
          "cfx": 0,
          "caz": 83,
          "fep": 97,
          "cip": 94,
          "lvx": 95,
          "gen": 81,
          "tob": 89,
          "doxycycline": 89,
          "rif": 50
        }
      },
      {
        "name": "Kleb (Enterobacter) aerogenes",
        "gram": "negative",
        "isolates": 20,
        "note": null,
        "s": {
          "ptz": 73,
          "cfx": 0,
          "cro": 84,
          "caz": 100,
          "fep": 100,
          "cip": 100,
          "lvx": 100,
          "gen": 89,
          "tob": 100,
          "doxycycline": 100,
          "rif": 13
        }
      },
      {
        "name": "Citrobacter freundii",
        "gram": "negative",
        "isolates": 18,
        "note": null,
        "s": {
          "ptz": 89,
          "cfx": 0,
          "cro": 66,
          "caz": 100,
          "fep": 100,
          "cip": 100,
          "lvx": 100,
          "gen": 100,
          "tob": 100,
          "doxycycline": 100,
          "rif": 90
        }
      },
      {
        "name": "Pseudomonas aeruginosa",
        "gram": "negative",
        "isolates": 85,
        "note": null,
        "s": {
          "ptz": 88,
          "caz": 97,
          "fep": 90,
          "cip": 100,
          "lvx": 79
        }
      }
    ]
  },
  {
    "id": "essentia",
    "name": "Essentia West Market",
    "location": "Fargo, ND",
    "period": "2025",
    "sourceNote": "ND HHS Archive \u00b7 Essentia West Market Antibiogram 2025 \u00b7 % susceptible, 1st isolate/patient/year",
    "sourceUrl": "https://www.hhs.nd.gov/sites/default/files/documents/public-health/hai/2025-essentia-west-grampositive-antibiogram-archive.pdf",
    "organisms": [
      {
        "name": "Enterococcus faecalis",
        "gram": "positive",
        "isolates": 585,
        "note": null,
        "s": {
          "amp": 100,
          "cip": 72,
          "gen": 89,
          "van": 98,
          "lvx": 99,
          "ery": 99,
          "rif": 29,
          "dap": 99
        }
      },
      {
        "name": "Enterococcus faecium",
        "gram": "positive",
        "isolates": 42,
        "note": "VRE",
        "s": {
          "amp": 73,
          "gen": 100,
          "van": 81,
          "lvx": 97,
          "cip": 68,
          "rif": 64,
          "dap": 97
        }
      },
      {
        "name": "Enterococcus faecium VRE",
        "gram": "positive",
        "isolates": 21,
        "note": null,
        "s": {
          "amp": 0,
          "gen": 0,
          "van": 0,
          "lvx": 4,
          "cip": 5,
          "dap": 0
        }
      },
      {
        "name": "Staphylococcus aureus",
        "gram": "positive",
        "isolates": 103,
        "note": null,
        "s": {
          "cfx": 100,
          "cip": 83,
          "caz": 100,
          "gen": 73,
          "fep": 98,
          "van": 93,
          "lvx": 100,
          "cro": 100,
          "ery": 99,
          "cli": 0,
          "sxt": 0,
          "rif": 100,
          "dox": 95,
          "tet": 97,
          "dap": 100
        }
      },
      {
        "name": "Methicillin Resistant Staphylococcus aureus",
        "gram": "positive",
        "isolates": 353,
        "note": null,
        "s": {
          "cfx": 98,
          "cip": 81,
          "caz": 100,
          "gen": 18,
          "fep": 99,
          "van": 41,
          "lvx": 100,
          "cro": 100,
          "ery": 100,
          "cli": 0,
          "sxt": 0,
          "rif": 99,
          "dox": 88,
          "tet": 92,
          "dap": 100
        }
      },
      {
        "name": "Staphylococcus aureus (MRSA)",
        "gram": "positive",
        "isolates": null,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": null,
          "cfz": null,
          "cfx": null,
          "cxm": null,
          "cro": null,
          "caz": null,
          "fep": null,
          "mem": null,
          "gen": null,
          "cip": null,
          "lvx": null,
          "van": 96,
          "tet": null,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": null,
          "rif": null,
          "dap": 98,
          "lzd": 96,
          "nit": null
        }
      },
      {
        "name": "Staphylococcus lugdunensis",
        "gram": "positive",
        "isolates": 88,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": 87,
          "cfz": null,
          "cfx": null,
          "cxm": null,
          "cro": null,
          "caz": null,
          "fep": null,
          "mem": 100,
          "gen": 88,
          "cip": null,
          "lvx": 98,
          "van": 100,
          "tet": null,
          "dox": null,
          "cli": 98,
          "ery": null,
          "azi": null,
          "sxt": 96,
          "rif": 96,
          "dap": 0,
          "lzd": null,
          "nit": null
        }
      },
      {
        "name": "Coagulase-Negative Staphylococcus",
        "gram": "positive",
        "isolates": 86,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": 66,
          "cfz": null,
          "cfx": null,
          "cxm": null,
          "cro": null,
          "caz": null,
          "fep": null,
          "mem": 100,
          "gen": 52,
          "cip": null,
          "lvx": 88,
          "van": 77,
          "tet": null,
          "dox": null,
          "cli": 100,
          "ery": null,
          "azi": null,
          "sxt": 100,
          "rif": 69,
          "dap": 0,
          "lzd": null,
          "nit": null
        }
      },
      {
        "name": "Streptococcus pneumoniae",
        "gram": "positive",
        "isolates": 71,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": null,
          "cfz": 92,
          "cfx": null,
          "cxm": 97,
          "cro": null,
          "caz": null,
          "fep": null,
          "mem": 94,
          "gen": null,
          "cip": 98,
          "lvx": null,
          "van": null,
          "tet": null,
          "dox": null,
          "cli": 66,
          "ery": null,
          "azi": null,
          "sxt": 84,
          "rif": null,
          "dap": null,
          "lzd": 70,
          "nit": null
        }
      },
      {
        "name": "Streptococcus pyogenes (Group A)",
        "gram": "positive",
        "isolates": null,
        "note": null,
        "s": {
          "pen": 80,
          "amp": null,
          "oxa": null,
          "ams": 100,
          "ptz": 100,
          "cfz": null,
          "cfx": null,
          "cxm": null,
          "cro": null,
          "caz": null,
          "fep": null,
          "mem": null,
          "gen": null,
          "cip": null,
          "lvx": null,
          "van": 100,
          "tet": 44,
          "dox": null,
          "cli": null,
          "ery": 28,
          "azi": null,
          "sxt": null,
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": null
        }
      },
      {
        "name": "Streptococcus agalactiae (Group B)",
        "gram": "positive",
        "isolates": null,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": null,
          "cfz": null,
          "cfx": null,
          "cxm": null,
          "cro": 100,
          "caz": null,
          "fep": null,
          "mem": null,
          "gen": null,
          "cip": null,
          "lvx": 100,
          "van": null,
          "tet": null,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": null,
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": null
        }
      },
      {
        "name": "Streptococcus bovis",
        "gram": "positive",
        "isolates": null,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": null,
          "cfz": null,
          "cfx": null,
          "cxm": null,
          "cro": null,
          "caz": null,
          "fep": null,
          "mem": null,
          "gen": null,
          "cip": null,
          "lvx": null,
          "van": null,
          "tet": null,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": null,
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": 91
        }
      },
      {
        "name": "Streptococcus pneumoniae (continued)",
        "gram": "positive",
        "isolates": null,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": null,
          "cfz": null,
          "cfx": null,
          "cxm": null,
          "cro": null,
          "caz": null,
          "fep": null,
          "mem": null,
          "gen": null,
          "cip": null,
          "lvx": null,
          "van": null,
          "tet": null,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": null,
          "rif": null,
          "dap": null,
          "lzd": 78,
          "nit": 100
        }
      },
      {
        "name": "Streptococcus pneumoniae (Group B)",
        "gram": "positive",
        "isolates": 12,
        "note": "Antibiotic reporting noting additional non-meningitis context reflects isolate sensitivities from non-spinal-fluid source for Streptococcus pneumoniae isolates.",
        "s": {
          "amp": 100,
          "cfz": 100,
          "cxm": null,
          "cro": 100,
          "van": 100,
          "cip": null
        }
      },
      {
        "name": "Streptococcus pneumoniae viridan group",
        "gram": "positive",
        "isolates": null,
        "note": null,
        "s": {
          "amp": 100,
          "cfz": 100,
          "cxm": null,
          "cro": 100,
          "van": 100,
          "cip": 91
        }
      },
      {
        "name": "Acinetobacter species",
        "gram": "negative",
        "isolates": 14,
        "note": null,
        "s": {
          "pen": 100,
          "cro": 85,
          "mem": 100,
          "caz": 61,
          "cip": 100,
          "lvx": 100,
          "gen": 100,
          "dox": 100,
          "sxt": 92
        }
      },
      {
        "name": "Citrobacter freundii/freundii complex",
        "gram": "negative",
        "isolates": 153,
        "note": null,
        "s": {
          "pen": 100,
          "amp": 0,
          "oxa": 0,
          "cro": 95,
          "mem": 83,
          "caz": 81,
          "cip": 90,
          "lvx": 97,
          "gen": 94,
          "dox": 98,
          "sxt": 94,
          "cxm": 81,
          "fep": 98,
          "van": 94
        }
      },
      {
        "name": "Citrobacter koseri",
        "gram": "negative",
        "isolates": 73,
        "note": null,
        "s": {
          "pen": 100,
          "amp": 0,
          "oxa": 94,
          "cro": 100,
          "mem": 98,
          "caz": 100,
          "cip": 97,
          "lvx": 100,
          "gen": 97,
          "dox": 100,
          "sxt": 42,
          "cxm": 93,
          "fep": 100,
          "van": 97
        }
      },
      {
        "name": "Enterobacter cloaca e/cloac ae complex",
        "gram": "negative",
        "isolates": 201,
        "note": null,
        "s": {
          "pen": 100,
          "amp": 0,
          "oxa": 0,
          "cro": 92,
          "mem": 83,
          "caz": 79,
          "cip": 94,
          "lvx": 98,
          "gen": 96,
          "dox": 99,
          "sxt": 29,
          "cxm": 79,
          "fep": 98,
          "van": 94
        }
      },
      {
        "name": "Escherichia coli",
        "gram": "negative",
        "isolates": 5468,
        "note": null,
        "s": {
          "pen": 100,
          "amp": 70,
          "oxa": 86,
          "cxm": 96,
          "cro": 99,
          "mem": 98,
          "caz": 99,
          "cip": 84,
          "lvx": 95,
          "gen": 89,
          "dox": 99,
          "sxt": 98,
          "fep": 98,
          "van": 95,
          "nit": 86
        }
      },
      {
        "name": "Escherichia coli ESBL",
        "gram": "negative",
        "isolates": 254,
        "note": null,
        "s": {
          "pen": 99,
          "amp": 0,
          "oxa": 0,
          "cxm": 0,
          "cro": 0,
          "mem": 0,
          "caz": 72,
          "cip": 11,
          "lvx": 75,
          "gen": 34,
          "dox": 100,
          "sxt": 93,
          "fep": 91,
          "van": 49
        }
      },
      {
        "name": "Klebsiella (Enterobacter) aeroge",
        "gram": "negative",
        "isolates": 111,
        "note": null,
        "s": {
          "pen": 100,
          "amp": 0,
          "oxa": 0,
          "cro": 97,
          "mem": 88,
          "caz": 89,
          "cip": 97,
          "lvx": 99,
          "gen": 98,
          "dox": 98,
          "sxt": 19,
          "cxm": 86,
          "fep": 99,
          "van": 97
        }
      },
      {
        "name": "Klebsiella oxytoca/Raoultella",
        "gram": "negative",
        "isolates": 205,
        "note": null,
        "s": {
          "pen": 100,
          "amp": 0,
          "oxa": 26,
          "cfz": 96,
          "cfx": 95,
          "cxm": 94,
          "cro": 95,
          "caz": 96,
          "fep": 98,
          "mem": 100,
          "gen": 90,
          "cip": 93,
          "lvx": 96,
          "sxt": 91
        }
      },
      {
        "name": "Klebsiella pneumoniae ESBL",
        "gram": "negative",
        "isolates": 37,
        "note": null,
        "s": {
          "pen": 97,
          "amp": 0,
          "oxa": 0,
          "cfz": 5,
          "cfx": 0,
          "cxm": 0,
          "cro": 0,
          "caz": 13,
          "fep": 59,
          "mem": 32,
          "gen": 97,
          "cip": 19,
          "lvx": 64,
          "sxt": 16
        }
      },
      {
        "name": "Klebsiella pneumoniae",
        "gram": "negative",
        "isolates": 676,
        "note": null,
        "s": {
          "pen": 100,
          "amp": 0,
          "oxa": 92,
          "cfz": 99,
          "cfx": 100,
          "cxm": 99,
          "cro": 99,
          "caz": 95,
          "fep": 99,
          "mem": 97,
          "gen": 100,
          "cip": 35,
          "lvx": 93,
          "sxt": 94
        }
      },
      {
        "name": "Morganella morganii",
        "gram": "negative",
        "isolates": 60,
        "note": null,
        "s": {
          "pen": 100,
          "amp": 0,
          "oxa": 0,
          "cfz": 0,
          "cfx": 100,
          "cxm": 88,
          "cro": 89,
          "caz": 86,
          "fep": 91,
          "mem": 86,
          "gen": 98,
          "cip": 0,
          "lvx": 100,
          "sxt": 91
        }
      },
      {
        "name": "Pantoea agglomerans",
        "gram": "negative",
        "isolates": 5,
        "note": null,
        "s": {
          "pen": 100,
          "amp": 60,
          "oxa": 0,
          "cfz": 100,
          "cfx": 100,
          "cxm": 100,
          "cro": 100,
          "caz": 100,
          "fep": 100,
          "mem": 100,
          "gen": 100,
          "cip": null,
          "lvx": 100,
          "sxt": 100
        }
      },
      {
        "name": "Proteus mirabilis",
        "gram": "negative",
        "isolates": 458,
        "note": null,
        "s": {
          "pen": 99,
          "amp": 87,
          "oxa": 1,
          "cfz": 97,
          "cfx": 99,
          "cxm": 99,
          "cro": 98,
          "caz": 86,
          "fep": 94,
          "mem": 88,
          "gen": 100,
          "cip": 0,
          "lvx": 100,
          "sxt": 89
        }
      },
      {
        "name": "Proteus mirabilis ESBL",
        "gram": "negative",
        "isolates": null,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "cfz": null,
          "cfx": null,
          "cxm": null,
          "cro": null,
          "caz": null,
          "fep": null,
          "mem": null,
          "gen": null,
          "cip": null,
          "lvx": null,
          "sxt": null
        }
      },
      {
        "name": "Providencia species",
        "gram": "negative",
        "isolates": 28,
        "note": null,
        "s": {
          "pen": 100,
          "amp": 0,
          "oxa": 0,
          "cfz": 100,
          "cfx": 92,
          "cxm": 96,
          "cro": 78,
          "caz": 89,
          "fep": 78,
          "mem": 100,
          "gen": 0,
          "cip": 100,
          "lvx": 82,
          "sxt": 85
        }
      },
      {
        "name": "Pseudomonas",
        "gram": "negative",
        "isolates": 353,
        "note": null,
        "s": {
          "pen": 99,
          "amp": null,
          "oxa": null,
          "cfz": 93,
          "cfx": 93,
          "cxm": null,
          "cro": 82,
          "caz": 50,
          "fep": 82,
          "mem": 94,
          "gen": null,
          "cip": 90,
          "lvx": 99,
          "sxt": 0
        }
      },
      {
        "name": "Pseudomonas aeruginosa",
        "gram": "negative",
        "isolates": null,
        "note": null,
        "s": {}
      },
      {
        "name": "Serratia marcescens",
        "gram": "negative",
        "isolates": 64,
        "note": null,
        "s": {
          "amp": 100,
          "oxa": 0,
          "cfz": 0,
          "caz": 87,
          "fep": 98,
          "cro": 90,
          "gen": 100,
          "cip": 89,
          "lvx": 98,
          "sxt": 0,
          "dox": 90,
          "ery": 87
        }
      },
      {
        "name": "Stenotrophomonas maltophilia",
        "gram": "negative",
        "isolates": 24,
        "note": null,
        "s": {
          "cip": 83,
          "dox": 91
        }
      }
    ]
  },
  {
    "id": "jamestown_rmc",
    "name": "Jamestown Regional Medical Center",
    "location": "Jamestown, ND",
    "period": "2025",
    "sourceNote": "ND HHS Archive \u00b7 Jamestown Regional Medical Center Antibiogram 2025 \u00b7 % susceptible, 1st isolate/patient/year",
    "sourceUrl": "https://www.hhs.nd.gov/sites/default/files/documents/public-health/hai/2025-jamestown-regional-medical-center-antibiogram-archive.pdf",
    "organisms": [
      {
        "name": "MS Staph aureus",
        "gram": "positive",
        "isolates": 112,
        "note": null,
        "s": {
          "pen": 0,
          "oxa": 0,
          "cfz": 0,
          "cxm": 0,
          "cro": 0,
          "caz": 0,
          "fep": 0,
          "mem": 0,
          "gen": 72,
          "cip": 0,
          "lvx": 0,
          "cli": 72,
          "ery": 72,
          "azi": 0,
          "sxt": 0,
          "rif": 72,
          "dap": 0,
          "lzd": 72,
          "van": 72
        }
      },
      {
        "name": "MR Staph aureus",
        "gram": "positive",
        "isolates": 40,
        "note": null,
        "s": {
          "pen": 0,
          "oxa": 0,
          "cfz": 0,
          "cxm": 0,
          "cro": 0,
          "caz": 0,
          "fep": 0,
          "mem": 0,
          "gen": 0,
          "cip": 100,
          "lvx": 100,
          "cli": 100,
          "ery": 0,
          "azi": 0,
          "sxt": 0,
          "rif": 100,
          "dap": 100,
          "lzd": 100,
          "van": 100
        }
      },
      {
        "name": "Total Staph aureus",
        "gram": "positive",
        "isolates": 112,
        "note": null,
        "s": {
          "pen": 20,
          "oxa": 20,
          "cfz": 20,
          "cxm": 20,
          "cro": 20,
          "caz": 20,
          "fep": 20,
          "mem": 20,
          "gen": 37,
          "cip": 100,
          "lvx": 100,
          "cli": 76,
          "ery": 100,
          "azi": 20,
          "sxt": 20,
          "rif": 100,
          "dap": 100,
          "lzd": 100,
          "van": 100
        }
      },
      {
        "name": "Staph (coag. neg.)",
        "gram": "positive",
        "isolates": 30,
        "note": null,
        "s": {
          "pen": 37,
          "oxa": 37,
          "cfz": 37,
          "cxm": 37,
          "cro": 37,
          "caz": 37,
          "fep": 37,
          "mem": 37,
          "gen": 40,
          "cip": 40,
          "lvx": 40,
          "cli": 40,
          "ery": 73,
          "azi": 40,
          "sxt": 40,
          "rif": 40,
          "dap": 40,
          "lzd": 77,
          "van": 77
        }
      },
      {
        "name": "Sheep pneumoniae",
        "gram": "positive",
        "isolates": 4,
        "note": null,
        "s": {
          "pen": 75,
          "oxa": null,
          "cfz": null,
          "cxm": 100,
          "cro": null,
          "caz": null,
          "fep": null,
          "mem": 100,
          "gen": 75,
          "cip": 100,
          "lvx": 100,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": 100,
          "rif": null,
          "dap": null,
          "lzd": 75,
          "van": null
        }
      },
      {
        "name": "E. faecalis",
        "gram": "positive",
        "isolates": 47,
        "note": null,
        "s": {
          "pen": 98,
          "amp": 98,
          "ptz": 100,
          "cro": 45,
          "gen": 98,
          "cip": 100,
          "lvx": 100,
          "dap": 81,
          "lzd": 98
        }
      },
      {
        "name": "E. faecium",
        "gram": "positive",
        "isolates": 4,
        "note": null,
        "s": {
          "pen": 50,
          "amp": 25,
          "ptz": 100,
          "cro": 25,
          "gen": 100,
          "cip": 50,
          "lvx": 100,
          "dap": 75,
          "lzd": 75
        }
      },
      {
        "name": "Enterococcus spp.",
        "gram": "positive",
        "isolates": 2,
        "note": null,
        "s": {
          "pen": 100,
          "amp": 100,
          "ptz": 100,
          "cro": 100,
          "gen": 100,
          "cip": 100,
          "lvx": 100,
          "dap": 50,
          "lzd": 100
        }
      },
      {
        "name": "C. freundii",
        "gram": "negative",
        "isolates": 0,
        "note": null,
        "s": {}
      },
      {
        "name": "M. morganii",
        "gram": "negative",
        "isolates": 8,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": null,
          "cfz": null,
          "cfz_u": null,
          "cfx": null,
          "cxm": 0,
          "cro": 0,
          "caz": 88,
          "fep": null,
          "mem": 0,
          "gen": null,
          "tob": null,
          "cip": null,
          "lvx": 88,
          "van": 100,
          "tet": null,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": 100,
          "rif": null,
          "dap": 100,
          "lzd": 88,
          "nit": 88
        }
      },
      {
        "name": "Providencia spp.",
        "gram": "negative",
        "isolates": null,
        "note": null,
        "s": {
          "pen": null,
          "amp": 0,
          "oxa": null,
          "ams": 0,
          "ptz": null,
          "cfz": 8,
          "cfz_u": null,
          "cfx": 8,
          "cxm": 8,
          "cro": 0,
          "caz": 8,
          "fep": 0,
          "mem": 8,
          "gen": 0,
          "tob": null,
          "cip": 0,
          "lvx": null,
          "van": 100,
          "tet": 0,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": 100,
          "rif": 0,
          "dap": null,
          "lzd": null,
          "nit": null
        }
      },
      {
        "name": "Salmonella spp.",
        "gram": "negative",
        "isolates": 0,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": null,
          "cfz": null,
          "cfz_u": null,
          "cfx": null,
          "cxm": null,
          "cro": null,
          "caz": null,
          "fep": null,
          "mem": null,
          "gen": null,
          "tob": null,
          "cip": null,
          "lvx": null,
          "van": null,
          "tet": null,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": null,
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": null
        }
      },
      {
        "name": "Shigella spp.",
        "gram": "negative",
        "isolates": 1,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": null,
          "cfz": null,
          "cfz_u": null,
          "cfx": null,
          "cxm": null,
          "cro": null,
          "caz": null,
          "fep": null,
          "mem": null,
          "gen": null,
          "tob": null,
          "cip": null,
          "lvx": null,
          "van": null,
          "tet": null,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": null,
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": null
        }
      },
      {
        "name": "Stenotrophomonas",
        "gram": "negative",
        "isolates": 2,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": null,
          "cfz": null,
          "cfz_u": null,
          "cfx": null,
          "cxm": null,
          "cro": null,
          "caz": null,
          "fep": null,
          "mem": null,
          "gen": null,
          "tob": null,
          "cip": 50,
          "lvx": null,
          "van": null,
          "tet": null,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": 100,
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": null
        }
      },
      {
        "name": "Klebsiella oxytoca",
        "gram": "negative",
        "isolates": 18,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": null,
          "ptz": null,
          "cfz": 0,
          "cfz_u": null,
          "cfx": 6,
          "cxm": 22,
          "cro": 0,
          "caz": null,
          "fep": 11,
          "mem": null,
          "gen": 0,
          "tob": null,
          "cip": 0,
          "lvx": 0,
          "van": null,
          "tet": null,
          "dox": null,
          "cli": null,
          "ery": null,
          "azi": null,
          "sxt": 0,
          "rif": null,
          "dap": null,
          "lzd": null,
          "nit": 18
        }
      }
    ]
  },
  {
    "id": "west_river_nonurine",
    "name": "West River Health Services (Non-Urine)",
    "location": "Hettinger, ND",
    "period": "2025",
    "sourceNote": "ND HHS Archive \u00b7 West River Health Services (Non-Urine) Antibiogram 2025 \u00b7 % susceptible, 1st isolate/patient/year",
    "sourceUrl": "https://www.hhs.nd.gov/sites/default/files/documents/public-health/hai/2025-west-river-nonurine-antibiogram-archive.pdf",
    "organisms": [
      {
        "name": "MS Staph aureus",
        "gram": "positive",
        "isolates": 22,
        "note": "S",
        "s": {
          "pen": 18,
          "amp": 0,
          "oxa": 100,
          "ams": 100,
          "cfz": 91,
          "cfx": 100,
          "cxm": 100,
          "cro": 100,
          "caz": 100,
          "fep": 100,
          "mem": 100,
          "gen": 91,
          "cip": 91,
          "lvx": 100,
          "van": 100,
          "cli": 82,
          "ery": 95,
          "azi": 64,
          "sxt": 73,
          "rif": 95,
          "dap": 95,
          "lzd": 100,
          "tet": 100
        }
      },
      {
        "name": "MR Staph aureus",
        "gram": "positive",
        "isolates": 15,
        "note": "S",
        "s": {
          "pen": 0,
          "amp": 0,
          "oxa": 0,
          "ams": 0,
          "cfz": 0,
          "cfx": null,
          "cxm": 0,
          "cro": 0,
          "caz": 0,
          "fep": 100,
          "mem": 100,
          "gen": 20,
          "cip": 20,
          "lvx": 43,
          "van": 53,
          "cli": 80,
          "ery": 100,
          "azi": 13,
          "sxt": 27,
          "rif": 87,
          "dap": 100,
          "lzd": 100,
          "tet": 93
        }
      },
      {
        "name": "Total Staph aureus",
        "gram": "positive",
        "isolates": 37,
        "note": "S",
        "s": {
          "pen": 11,
          "amp": 0,
          "oxa": 59,
          "ams": 59,
          "cfz": 54,
          "cfx": 100,
          "cxm": 59,
          "cro": 64,
          "caz": 64,
          "fep": 100,
          "mem": 100,
          "gen": 62,
          "cip": 62,
          "lvx": 73,
          "van": 81,
          "cli": 81,
          "ery": 97,
          "azi": 45,
          "sxt": 54,
          "rif": 92,
          "dap": 97,
          "lzd": 100,
          "tet": 97
        }
      },
      {
        "name": "E. faecalis",
        "gram": "positive",
        "isolates": 5,
        "note": "S",
        "s": {
          "pen": 100,
          "amp": 100,
          "oxa": null,
          "ams": null,
          "cfz": null,
          "cfx": null,
          "cxm": null,
          "cro": 40,
          "caz": 40,
          "fep": null,
          "mem": null,
          "gen": 40,
          "cip": 80,
          "lvx": null,
          "van": null,
          "cli": null,
          "ery": 100,
          "azi": null,
          "sxt": 40,
          "rif": 80,
          "dap": 100,
          "lzd": null,
          "tet": 40,
          "dox": 60,
          "nit": 100
        }
      },
      {
        "name": "Escherichia coli",
        "gram": "negative",
        "isolates": 16,
        "note": "S",
        "s": {
          "amp": 75,
          "ams": 100,
          "cfz": 75,
          "cfz_u": 100,
          "ptz": 94,
          "cxm": 91,
          "cro": 91,
          "caz": 94,
          "fep": 94,
          "mem": 100,
          "gen": 91,
          "cip": 100,
          "lvx": 100,
          "van": 100,
          "cli": 100,
          "ery": 100,
          "azi": 88,
          "sxt": 100,
          "nit": 100,
          "dox": 88,
          "tet": 91,
          "rif": 100,
          "dap": 100
        }
      },
      {
        "name": "Klebsiella pneumoniae",
        "gram": "negative",
        "isolates": 4,
        "note": "S",
        "s": {
          "amp": 0,
          "ams": 0,
          "cfz": 100,
          "cfz_u": 100,
          "ptz": 100,
          "cxm": 100,
          "cro": 100,
          "caz": 100,
          "fep": 50,
          "mem": 100,
          "gen": 100,
          "cip": 100,
          "lvx": 100,
          "van": 100,
          "cli": 100,
          "ery": 100,
          "azi": 100,
          "sxt": 100,
          "nit": 100,
          "dox": null,
          "tet": 100,
          "rif": 100,
          "dap": 100
        }
      },
      {
        "name": "Proteus mirabilis",
        "gram": "negative",
        "isolates": 3,
        "note": "S",
        "s": {
          "amp": 67,
          "ams": 67,
          "cfz": 100,
          "cfz_u": 100,
          "ptz": 100,
          "cxm": 100,
          "cro": 100,
          "caz": 100,
          "fep": 100,
          "mem": 100,
          "gen": 100,
          "cip": 100,
          "lvx": 100,
          "van": 100,
          "cli": 100,
          "ery": null,
          "azi": 67,
          "sxt": 67,
          "nit": null,
          "dox": null,
          "tet": null,
          "rif": null,
          "dap": null
        }
      },
      {
        "name": "E. aerogenes",
        "gram": "negative",
        "isolates": 1,
        "note": "S",
        "s": {
          "amp": 100,
          "ams": 0,
          "cfz": 100,
          "cfz_u": 100,
          "ptz": 0,
          "cxm": null,
          "cro": null,
          "caz": 100,
          "fep": 100,
          "mem": 100,
          "gen": null,
          "cip": null,
          "lvx": 100,
          "van": 0,
          "cli": 100,
          "ery": null,
          "azi": 100,
          "sxt": 100,
          "nit": 100,
          "dox": null,
          "tet": null,
          "rif": null,
          "dap": null
        }
      },
      {
        "name": "E. cloacae",
        "gram": "negative",
        "isolates": 1,
        "note": "S",
        "s": {
          "amp": 100,
          "ams": 0,
          "cfz": 0,
          "cfz_u": 100,
          "ptz": 0,
          "cxm": null,
          "cro": null,
          "caz": 100,
          "fep": 100,
          "mem": 100,
          "gen": null,
          "cip": null,
          "lvx": 100,
          "van": 100,
          "cli": 100,
          "ery": null,
          "azi": 100,
          "sxt": 100,
          "nit": 100,
          "dox": null,
          "tet": null,
          "rif": null,
          "dap": null
        }
      },
      {
        "name": "P. aeruginosa",
        "gram": "negative",
        "isolates": 5,
        "note": "S",
        "s": {
          "amp": null,
          "ams": null,
          "cfz": null,
          "cfz_u": 80,
          "ptz": null,
          "cxm": null,
          "cro": null,
          "caz": 80,
          "fep": null,
          "mem": 80,
          "gen": null,
          "cip": 100,
          "lvx": null,
          "van": 20,
          "cli": 80,
          "ery": null,
          "azi": 20,
          "sxt": 80,
          "nit": 80,
          "dox": null,
          "tet": null,
          "rif": null,
          "dap": null
        }
      },
      {
        "name": "C. freundii",
        "gram": "negative",
        "isolates": 1,
        "note": "S",
        "s": {
          "amp": 0,
          "ams": null,
          "cfz": 100,
          "cfz_u": 100,
          "ptz": 0,
          "cxm": 100,
          "cro": 100,
          "caz": 100,
          "fep": 100,
          "mem": 100,
          "gen": 100,
          "cip": 100,
          "lvx": 100,
          "van": 100,
          "cli": 100,
          "ery": null,
          "azi": 100,
          "sxt": 100,
          "nit": 100,
          "dox": null,
          "tet": null,
          "rif": null,
          "dap": null
        }
      },
      {
        "name": "M. morganii",
        "gram": "negative",
        "isolates": 1,
        "note": "S",
        "s": {
          "amp": 0,
          "ams": null,
          "cfz": 0,
          "cfz_u": 100,
          "ptz": 0,
          "cxm": 0,
          "cro": 0,
          "caz": 0,
          "fep": 0,
          "mem": 100,
          "gen": 0,
          "cip": 100,
          "lvx": 100,
          "van": 0,
          "cli": 100,
          "ery": null,
          "azi": 0,
          "sxt": 0,
          "nit": 0,
          "dox": 0,
          "tet": 0,
          "rif": null,
          "dap": null
        }
      },
      {
        "name": "Providencia spp.",
        "gram": "negative",
        "isolates": 3,
        "note": "S",
        "s": {
          "amp": 0,
          "ams": 0,
          "cfz": 0,
          "cfz_u": 100,
          "ptz": 0,
          "cxm": 0,
          "cro": 0,
          "caz": 33,
          "fep": 67,
          "mem": 100,
          "gen": 0,
          "cip": 100,
          "lvx": 100,
          "van": 0,
          "cli": 100,
          "ery": 50,
          "azi": 0,
          "sxt": 0,
          "nit": null,
          "dox": 100,
          "tet": 33,
          "rif": 0,
          "dap": 0,
          "tob": 100
        }
      },
      {
        "name": "Klebsiella oxytoca",
        "gram": "negative",
        "isolates": 2,
        "note": "S",
        "s": {
          "amp": 0,
          "ams": 100,
          "cfz": 100,
          "cfz_u": 100,
          "ptz": 50,
          "cxm": 100,
          "cro": 100,
          "caz": 100,
          "fep": 100,
          "mem": 100,
          "gen": 100,
          "cip": 100,
          "lvx": 100,
          "van": 100,
          "cli": 100,
          "ery": 100,
          "azi": 100,
          "sxt": 100,
          "nit": 100,
          "dox": 50,
          "tet": null,
          "rif": 100,
          "dap": 100,
          "tob": 100
        }
      }
    ]
  },
  {
    "id": "west_river_urine",
    "name": "West River Health Services (Urine)",
    "location": "Hettinger, ND",
    "period": "2025",
    "sourceNote": "ND HHS Archive \u00b7 West River Health Services (Urine) Antibiogram 2025 \u00b7 % susceptible, 1st isolate/patient/year",
    "sourceUrl": "https://www.hhs.nd.gov/sites/default/files/documents/public-health/hai/2025-west-river-urine-antibiogram-archive.pdf",
    "organisms": [
      {
        "name": "MS Staph aureus",
        "gram": "positive",
        "isolates": 10,
        "note": null,
        "s": {
          "pen": 40,
          "amp": 0,
          "oxa": 100,
          "ams": 100,
          "cfz": 100,
          "cfz_u": 100,
          "cxm": 100,
          "cro": 100,
          "fep": 100,
          "gen": 100,
          "cip": 100,
          "lvx": 100,
          "ery": 100,
          "cli": 100,
          "sxt": 90,
          "lzd": 90,
          "dap": 90,
          "van": 100,
          "tet": 100,
          "nit": null
        }
      },
      {
        "name": "MR Staph aureus",
        "gram": "positive",
        "isolates": 3,
        "note": null,
        "s": {
          "pen": 0,
          "amp": 0,
          "oxa": 0,
          "ams": 0,
          "cfz": 0,
          "cfz_u": 0,
          "cxm": null,
          "cro": 0,
          "fep": 0,
          "gen": 100,
          "cip": 100,
          "lvx": 33,
          "ery": 33,
          "cli": 67,
          "sxt": 100,
          "lzd": 100,
          "dap": 100,
          "van": 100,
          "tet": 100,
          "nit": null
        }
      },
      {
        "name": "Total Staph aureus",
        "gram": "positive",
        "isolates": 13,
        "note": null,
        "s": {
          "pen": 31,
          "amp": 0,
          "oxa": 77,
          "ams": 77,
          "cfz": 77,
          "cfz_u": 100,
          "cxm": 77,
          "cro": 88,
          "fep": 100,
          "gen": 100,
          "cip": 85,
          "lvx": 85,
          "ery": 92,
          "cli": 100,
          "sxt": 92,
          "lzd": 92,
          "dap": 92,
          "van": 100,
          "tet": 100,
          "nit": null
        }
      },
      {
        "name": "E. faecalis",
        "gram": "positive",
        "isolates": 22,
        "note": null,
        "s": {
          "pen": 95,
          "amp": 100,
          "oxa": null,
          "ams": null,
          "cfz": 50,
          "cfz_u": 60,
          "cxm": 73,
          "cro": null,
          "fep": 86,
          "gen": null,
          "cip": 95,
          "lvx": 95,
          "ery": null,
          "cli": null,
          "sxt": 91,
          "lzd": null,
          "dap": null,
          "van": null,
          "tet": null,
          "nit": null
        }
      },
      {
        "name": "Enterococcus spp.",
        "gram": "positive",
        "isolates": 1,
        "note": null,
        "s": {
          "pen": 100,
          "amp": 100,
          "oxa": null,
          "ams": null,
          "cfz": null,
          "cfz_u": null,
          "cxm": null,
          "cro": null,
          "fep": 0,
          "gen": 0,
          "cip": 0,
          "lvx": null,
          "ery": null,
          "cli": null,
          "sxt": 100,
          "lzd": 100,
          "dap": 0,
          "van": 100,
          "tet": null,
          "nit": null
        }
      },
      {
        "name": "Escherichia coli",
        "gram": "negative",
        "isolates": 235,
        "note": null,
        "s": {
          "pen": 70,
          "amp": 67,
          "oxa": null,
          "ams": 74,
          "cfz": 99,
          "cfz_u": 86,
          "cxm": 88,
          "cro": 81,
          "fep": 89,
          "gen": 89,
          "cip": 91,
          "lvx": 98,
          "ery": null,
          "cli": 88,
          "sxt": 100,
          "lzd": 98,
          "dap": null,
          "van": 100,
          "tet": 95,
          "nit": 95
        }
      },
      {
        "name": "Klebsiella pneumoniae",
        "gram": "negative",
        "isolates": 44,
        "note": null,
        "s": {
          "pen": 0,
          "amp": 40,
          "oxa": null,
          "ams": 82,
          "cfz": 98,
          "cfz_u": 86,
          "cxm": 89,
          "cro": 90,
          "fep": 95,
          "gen": 93,
          "cip": 95,
          "lvx": 100,
          "ery": null,
          "cli": 95,
          "sxt": 98,
          "lzd": 98,
          "dap": null,
          "van": 100,
          "tet": 100,
          "nit": 92
        }
      },
      {
        "name": "Proteus mirabilis",
        "gram": "negative",
        "isolates": 23,
        "note": null,
        "s": {
          "pen": 87,
          "amp": 100,
          "oxa": null,
          "ams": 91,
          "cfz": 96,
          "cfz_u": 87,
          "cxm": 92,
          "cro": 92,
          "fep": 96,
          "gen": 96,
          "cip": 96,
          "lvx": 100,
          "ery": null,
          "cli": 92,
          "sxt": 100,
          "lzd": null,
          "dap": 100,
          "van": 100,
          "tet": 78,
          "nit": null
        }
      },
      {
        "name": "E. aerogenes",
        "gram": "negative",
        "isolates": 1,
        "note": null,
        "s": {
          "pen": 0,
          "amp": 0,
          "oxa": null,
          "ams": 0,
          "cfz": 100,
          "cfz_u": 0,
          "cxm": null,
          "cro": null,
          "fep": 100,
          "gen": 100,
          "cip": 100,
          "lvx": null,
          "ery": null,
          "cli": null,
          "sxt": 100,
          "lzd": 100,
          "dap": null,
          "van": 100,
          "tet": 100,
          "nit": 100
        }
      },
      {
        "name": "E. cloacae",
        "gram": "negative",
        "isolates": 11,
        "note": null,
        "s": {
          "pen": 9,
          "amp": 0,
          "oxa": null,
          "ams": 9,
          "cfz": 91,
          "cfz_u": 0,
          "cxm": 0,
          "cro": 100,
          "fep": 82,
          "gen": 45,
          "cip": 91,
          "lvx": 0,
          "ery": null,
          "cli": 100,
          "sxt": 91,
          "lzd": 36,
          "dap": 100,
          "van": 100,
          "tet": 100,
          "nit": 100
        }
      },
      {
        "name": "Serratia marcescens",
        "gram": "negative",
        "isolates": 1,
        "note": null,
        "s": {
          "pen": 0,
          "amp": null,
          "oxa": null,
          "ams": 0,
          "cfz": 100,
          "cfz_u": 0,
          "cxm": 0,
          "cro": 100,
          "fep": 100,
          "gen": 100,
          "cip": 100,
          "lvx": 0,
          "ery": null,
          "cli": 100,
          "sxt": 100,
          "lzd": null,
          "dap": 100,
          "van": 100,
          "tet": 100,
          "nit": null
        }
      },
      {
        "name": "P. aeruginosa",
        "gram": "negative",
        "isolates": 8,
        "note": null,
        "s": {
          "pen": 0,
          "amp": null,
          "oxa": null,
          "ams": null,
          "cfz": 100,
          "cfz_u": null,
          "cxm": null,
          "cro": null,
          "fep": 88,
          "gen": 88,
          "cip": 100,
          "lvx": null,
          "ery": null,
          "cli": null,
          "sxt": 68,
          "lzd": 100,
          "dap": 100,
          "van": null,
          "tet": 100,
          "nit": null
        }
      },
      {
        "name": "A. baumannii",
        "gram": "negative",
        "isolates": 1,
        "note": null,
        "s": {
          "pen": null,
          "amp": null,
          "oxa": null,
          "ams": 0,
          "cfz": null,
          "cfz_u": null,
          "cxm": null,
          "cro": null,
          "fep": null,
          "gen": 100,
          "cip": null,
          "lvx": 100,
          "ery": null,
          "cli": null,
          "sxt": null,
          "lzd": 100,
          "dap": 100,
          "van": 100,
          "tet": 0,
          "nit": null
        }
      },
      {
        "name": "C. freundii",
        "gram": "negative",
        "isolates": 9,
        "note": null,
        "s": {
          "pen": 11,
          "amp": 0,
          "oxa": null,
          "ams": 67,
          "cfz": 89,
          "cfz_u": 0,
          "cxm": 100,
          "cro": 100,
          "fep": 67,
          "gen": 78,
          "cip": 89,
          "lvx": 0,
          "ery": null,
          "cli": 100,
          "sxt": 100,
          "lzd": 44,
          "dap": 100,
          "van": 100,
          "tet": 89,
          "nit": 100
        }
      },
      {
        "name": "M. morganii",
        "gram": "negative",
        "isolates": 2,
        "note": null,
        "s": {
          "pen": 0,
          "amp": 0,
          "oxa": null,
          "ams": 0,
          "cfz": 100,
          "cfz_u": 0,
          "cxm": 0,
          "cro": 100,
          "fep": 100,
          "gen": 100,
          "cip": 100,
          "lvx": 100,
          "ery": null,
          "cli": 100,
          "sxt": 100,
          "lzd": 100,
          "dap": 0,
          "van": 0,
          "tet": 100,
          "nit": null
        }
      },
      {
        "name": "Providencia spp.",
        "gram": "negative",
        "isolates": 4,
        "note": null,
        "s": {
          "pen": 0,
          "amp": null,
          "oxa": null,
          "ams": 50,
          "cfz": 75,
          "cfz_u": 25,
          "cxm": 75,
          "cro": 100,
          "fep": 75,
          "gen": 75,
          "cip": 100,
          "lvx": 100,
          "ery": null,
          "cli": 50,
          "sxt": 100,
          "lzd": 75,
          "dap": 75,
          "van": 50,
          "tet": 0,
          "nit": null
        }
      },
      {
        "name": "Salmonella spp.",
        "gram": "negative",
        "isolates": 3,
        "note": null,
        "s": {
          "pen": 100,
          "amp": null,
          "oxa": null,
          "ams": null,
          "cfz": null,
          "cfz_u": null,
          "cxm": null,
          "cro": null,
          "fep": 100,
          "gen": null,
          "cip": null,
          "lvx": null,
          "ery": null,
          "cli": null,
          "sxt": null,
          "lzd": 100,
          "dap": 100,
          "van": null,
          "tet": null,
          "nit": null
        }
      },
      {
        "name": "Klebsiella oxytoca",
        "gram": "negative",
        "isolates": 12,
        "note": null,
        "s": {
          "pen": 0,
          "amp": 71,
          "oxa": null,
          "ams": 67,
          "cfz": 100,
          "cfz_u": 25,
          "cxm": 60,
          "cro": 100,
          "fep": 100,
          "gen": 92,
          "cip": 92,
          "lvx": 80,
          "ery": null,
          "cli": 100,
          "sxt": 92,
          "lzd": 100,
          "dap": 100,
          "van": 100,
          "tet": 100,
          "nit": 100
        }
      }
    ]
  }
];

// ── State ──────────────────────────────────────────────────────────────────
let activeFacilityId = "trinity";
let activeGram       = "positive";

function getFacility() {
  return FACILITIES.find(f => f.id === activeFacilityId);
}

// ── Helpers ────────────────────────────────────────────────────────────────
function cellCls(val) {
  if (val === null || val === undefined) return "na";
  if (val === "nr") return "nr";
  if (val >= 90) return "hi";
  if (val >= 70) return "mid";
  return "lo";
}

function cellTxt(val) {
  if (val === null || val === undefined) return "—";
  if (val === "nr") return "~";
  return val;
}

function getAbxForOrgs(orgs) {
  const seen = new Set();
  orgs.forEach(o => Object.keys(o.s).forEach(id => seen.add(id)));
  return ABX_ORDER.filter(id => seen.has(id));
}

// ── Render ─────────────────────────────────────────────────────────────────
function render() {
  const facility = getFacility();
  const orgs     = facility.organisms.filter(o => o.gram === activeGram);
  const abxIds   = getAbxForOrgs(orgs);

  // Update header eyebrow
  document.getElementById("eyebrow").textContent =
    `${facility.name} · ${facility.location} · ${facility.period}`;

  // Update footer source note
  const srcEl = document.getElementById("source-note");
  if (srcEl) srcEl.textContent = facility.sourceNote;

  const head = document.getElementById("thead");
  const body = document.getElementById("tbody");

  head.innerHTML = `<tr>
    <th class="col-org">Organism</th>
    <th class="col-n">n</th>
    ${abxIds.map(id => `<th title="${ABX[id].name}">${ABX[id].abbr}</th>`).join("")}
  </tr>`;

  body.innerHTML = orgs.map(org => `
    <tr>
      <td class="col-org">
        ${org.name}${org.note ? `<span class="org-note">${org.note}</span>` : ""}
      </td>
      <td class="col-n">${org.isolates.toLocaleString()}</td>
      ${abxIds.map(id => {
        const v = org.s[id] ?? null;
        return `<td class="c-${cellCls(v)}">${cellTxt(v)}</td>`;
      }).join("")}
    </tr>
  `).join("");
}

// ── Facility selector ──────────────────────────────────────────────────────
function buildFacilitySelect() {
  const sel = document.getElementById("facility-select");
  sel.innerHTML = FACILITIES.map(f =>
    `<option value="${f.id}"${f.id === activeFacilityId ? " selected" : ""}>${f.name} — ${f.location} (${f.period})</option>`
  ).join("");
  sel.onchange = () => { activeFacilityId = sel.value; render(); };
}

// ── Gram tabs ──────────────────────────────────────────────────────────────
document.querySelectorAll(".gram-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".gram-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeGram = btn.dataset.gram;
    render();
  });
});

buildFacilitySelect();
render();

// ── PDF Import ─────────────────────────────────────────────────────────────
(function () {
  const toggle  = document.getElementById("import-toggle");
  const body    = document.getElementById("import-body");
  const chevron = document.querySelector(".import-chevron");
  const btn     = document.getElementById("import-submit");
  const status  = document.getElementById("import-status");
  const log     = document.getElementById("import-log");

  toggle.addEventListener("click", () => {
    const open = !body.hidden;
    body.hidden = open;
    toggle.setAttribute("aria-expanded", String(!open));
    chevron.textContent = open ? "▾" : "▴";
  });
  toggle.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") toggle.click(); });

  function setStatus(msg, type) {
    status.textContent = msg;
    status.className = "import-status" + (type ? " import-status-" + type : "");
  }

  btn.addEventListener("click", async () => {
    const url    = document.getElementById("imp-url").value.trim();
    const name   = document.getElementById("imp-name").value.trim();
    const loc    = document.getElementById("imp-loc").value.trim();
    const period = document.getElementById("imp-period").value.trim();

    if (!url) { setStatus("Paste a PDF URL first.", "err"); return; }
    if (!url.toLowerCase().endsWith(".pdf")) {
      setStatus("URL must point to a .pdf file.", "err"); return;
    }

    btn.disabled = true;
    log.hidden = true;
    setStatus("Downloading and extracting… this takes 20–60 s", "busy");

    try {
      const resp = await fetch("/antibiogram/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, name, location: loc, period }),
      });
      const data = await resp.json();

      if (!resp.ok || data.error) {
        setStatus("Error: " + (data.error || resp.statusText), "err");
        btn.disabled = false;
        return;
      }

      const fac = data.facility;
      const s   = data.stats;

      // Guard against duplicate IDs
      if (FACILITIES.find(f => f.id === fac.id)) {
        fac.id += "_" + Date.now().toString(36);
      }

      FACILITIES.push(fac);
      activeFacilityId = fac.id;
      buildFacilitySelect();
      render();

      setStatus(
        `Added "${fac.name}" — ${s.organisms} organism(s) · ${s.gram_positive} gram+ · ${s.gram_negative} gram−`,
        "ok"
      );

      // Show log
      log.textContent = `Facility ID : ${fac.id}\nPages processed: ${s.pages}\nOrganisms found: ${s.organisms}\nSource note: ${fac.sourceNote}`;
      log.hidden = false;

      // Scroll to new tab
      document.getElementById("facility-select").scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (err) {
      setStatus("Network error: " + err.message, "err");
    }

    btn.disabled = false;
  });
})();
