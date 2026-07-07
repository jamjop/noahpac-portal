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
          "ptz": 89,
          "fep": 99,
          "caz": 85,
          "cro": 81,
          "mem": 100,
          "cip": 96,
          "lvx": 96,
          "gen": 99,
          "tob": 99,
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
          "ptz": 77,
          "fep": 95,
          "caz": 80,
          "cro": 77,
          "mem": 99,
          "cip": 95,
          "lvx": 95,
          "gen": 99,
          "tob": 99,
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
          "cfz": 92,
          "fep": 98,
          "caz": 92,
          "cro": 95,
          "mem": 100,
          "cip": 83,
          "lvx": 83,
          "gen": 95,
          "tob": 95,
          "nit": 97,
          "sxt": 84
        }
      },
      {
        "name": "Klebsiella aerogenes",
        "gram": "negative",
        "isolates": 117,
        "note": null,
        "s": {
          "ptz": 84,
          "fep": 100,
          "caz": 85,
          "cro": 86,
          "mem": 100,
          "cip": 96,
          "lvx": 95,
          "gen": 100,
          "tob": 100,
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
          "ptz": 95,
          "fep": 98,
          "caz": 94,
          "cro": 96,
          "mem": 100,
          "cip": 96,
          "lvx": 98,
          "gen": 98,
          "tob": 98,
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
          "ptz": 93,
          "cfz": 92,
          "fep": 98,
          "caz": 91,
          "cro": 96,
          "mem": 99,
          "cip": 92,
          "lvx": 91,
          "gen": 98,
          "tob": 98,
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
          "cfz": 83,
          "fep": 98,
          "caz": 99,
          "cro": 98,
          "mem": 100,
          "cip": 88,
          "lvx": 87,
          "gen": 97,
          "tob": 97,
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
          "fep": 93,
          "caz": 92,
          "mem": 91,
          "cip": 87,
          "lvx": 81,
          "tob": 97
        }
      },
      {
        "name": "Serratia marcescens",
        "gram": "negative",
        "isolates": 49,
        "note": "Instrument does not give data for S. marcescens and pip/tazo",
        "s": {
          "fep": 100,
          "caz": 94,
          "cro": 88,
          "mem": 100,
          "cip": 90,
          "lvx": 90,
          "gen": 100,
          "tob": 86,
          "sxt": 100
        }
      },
      {
        "name": "Stenotrophomonas maltophilia",
        "gram": "negative",
        "isolates": 30,
        "note": "S. maltophilia minocycline: 100% S",
        "s": {
          "lvx": 63,
          "sxt": 100
        }
      },
      {
        "name": "Haemophilus influenzae",
        "gram": "negative",
        "isolates": 34,
        "note": null,
        "s": {
          "amp": 88
        }
      },
      {
        "name": "Enterococcus faecalis",
        "gram": "positive",
        "isolates": 452,
        "note": null,
        "s": {
          "amp": 100,
          "cip": 92,
          "lvx": 93,
          "nit": 99,
          "lzd": 96,
          "van": 99
        }
      },
      {
        "name": "Enterococcus faecium",
        "gram": "positive",
        "isolates": 55,
        "note": null,
        "s": {
          "amp": 18,
          "cip": 7,
          "lvx": 7,
          "nit": 26,
          "lzd": 95,
          "van": 49
        }
      },
      {
        "name": "Staphylococcus aureus (MSSA)",
        "gram": "positive",
        "isolates": 778,
        "note": null,
        "s": {
          "oxa": 100,
          "cli": 97,
          "ery": 71,
          "nit": 99,
          "tet": 92,
          "sxt": 97,
          "lzd": 100,
          "van": 100
        }
      },
      {
        "name": "Staphylococcus aureus (MRSA)",
        "gram": "positive",
        "isolates": 275,
        "note": "2025 inpatient + outpatient MRSA rate: 26%",
        "s": {
          "oxa": 0,
          "cli": 92,
          "ery": 20,
          "nit": 99,
          "tet": 87,
          "sxt": 95,
          "lzd": 100,
          "van": 100
        }
      },
      {
        "name": "Staphylococcus epidermidis",
        "gram": "positive",
        "isolates": 205,
        "note": null,
        "s": {
          "oxa": 40,
          "cli": 69,
          "ery": 36,
          "nit": 100,
          "tet": 86,
          "sxt": 62,
          "lzd": 100,
          "van": 100
        }
      },
      {
        "name": "Streptococcus pneumoniae",
        "gram": "positive",
        "isolates": 48,
        "note": "Penicillin/ceftriaxone shown at non-meningitis breakpoints; meningitis breakpoints: penicillin 71%, ceftriaxone 83%.",
        "s": {
          "pen": 100,
          "cro": 100,
          "lvx": 98,
          "cli": 88,
          "ery": 60,
          "tet": 83,
          "sxt": 79,
          "lzd": 100,
          "van": 100
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
          "amp": 99,
          "ptz": 99,
          "van": 99,
          "lzd": 97,
          "dap": 72,
          "nit": 99
        }
      },
      {
        "name": "E. faecium",
        "gram": "positive",
        "isolates": 77,
        "note": null,
        "s": {
          "amp": 20,
          "van": 61,
          "lzd": 88,
          "nit": 31
        }
      },
      {
        "name": "S. aureus",
        "gram": "positive",
        "isolates": 792,
        "note": null,
        "s": {
          "oxa": 73,
          "sxt": 95,
          "cli": 82,
          "dox": 97,
          "tet": 91,
          "van": 100,
          "lzd": 100,
          "dap": 100
        }
      },
      {
        "name": "MRSA",
        "gram": "positive",
        "isolates": 214,
        "note": null,
        "s": {
          "sxt": 91,
          "cli": 79,
          "dox": 94,
          "tet": 84,
          "van": 99,
          "lzd": 99,
          "dap": 100
        }
      },
      {
        "name": "S. epidermidis",
        "gram": "positive",
        "isolates": 206,
        "note": null,
        "s": {
          "oxa": 51,
          "cli": 61,
          "dox": 88,
          "tet": 83,
          "van": 100,
          "lzd": 100,
          "dap": 100
        }
      },
      {
        "name": "S. pneumoniae",
        "gram": "positive",
        "isolates": 54,
        "note": "1",
        "s": {
          "pen": 73,
          "cro": 98,
          "ery": 70,
          "cli": 96,
          "tet": 90,
          "van": 100,
          "lzd": 100
        }
      },
      {
        "name": "\u03b2-hemolytic Strep: GAS/GBS",
        "gram": "positive",
        "isolates": 44,
        "note": null,
        "s": {
          "amp": 100,
          "cro": 100,
          "van": 100
        }
      },
      {
        "name": "S. intermedius",
        "gram": "positive",
        "isolates": 47,
        "note": null,
        "s": {
          "pen": 100,
          "cro": 100,
          "cli": 70,
          "van": 96
        }
      },
      {
        "name": "S. anginosus",
        "gram": "positive",
        "isolates": 31,
        "note": null,
        "s": {
          "pen": 85,
          "cro": 94,
          "cli": 62,
          "van": 97
        }
      },
      {
        "name": "S. mitis/oralis",
        "gram": "positive",
        "isolates": 48,
        "note": null,
        "s": {
          "pen": 68,
          "cro": 95,
          "cli": 77,
          "van": 100
        }
      },
      {
        "name": "E. coli",
        "gram": "negative",
        "isolates": 2222,
        "note": null,
        "s": {
          "amp": 62,
          "ams": 71,
          "ptz": 96,
          "cfz_u": 93,
          "cro": 95,
          "fep": 96,
          "mem": 100,
          "cip": 80,
          "gen": 95,
          "sxt": 83,
          "nit": 97
        }
      },
      {
        "name": "E. cloacae",
        "gram": "negative",
        "isolates": 139,
        "note": null,
        "s": {
          "ptz": 78,
          "fep": 92,
          "mem": 98,
          "cip": 95,
          "tob": 98,
          "sxt": 93
        }
      },
      {
        "name": "K. aerogenes",
        "gram": "negative",
        "isolates": 67,
        "note": null,
        "s": {
          "ptz": 81,
          "fep": 98,
          "mem": 100,
          "cip": 95,
          "tob": 98,
          "sxt": 98
        }
      },
      {
        "name": "K. oxytoca",
        "gram": "negative",
        "isolates": 156,
        "note": null,
        "s": {
          "ams": 74,
          "ptz": 87,
          "cro": 94,
          "fep": 99,
          "mem": 100,
          "cip": 97,
          "tob": 99,
          "sxt": 98,
          "nit": 91
        }
      },
      {
        "name": "K. pneumoniae",
        "gram": "negative",
        "isolates": 374,
        "note": null,
        "s": {
          "ams": 91,
          "ptz": 94,
          "cfz_u": 94,
          "cro": 97,
          "fep": 97,
          "mem": 100,
          "cip": 90,
          "tob": 98,
          "sxt": 94
        }
      },
      {
        "name": "P. aeruginosa",
        "gram": "negative",
        "isolates": 314,
        "note": null,
        "s": {
          "ptz": 89,
          "fep": 93,
          "mem": 93,
          "cip": 90,
          "tob": 100
        }
      },
      {
        "name": "P. mirabilis",
        "gram": "negative",
        "isolates": 220,
        "note": null,
        "s": {
          "amp": 90,
          "ams": 94,
          "ptz": 99,
          "cfz_u": 98,
          "cro": 99,
          "fep": 99,
          "mem": 99,
          "cip": 91,
          "gen": 95,
          "sxt": 90
        }
      },
      {
        "name": "Citrobacter gp",
        "gram": "negative",
        "isolates": 134,
        "note": null,
        "s": {
          "ptz": 87,
          "fep": 99,
          "mem": 100,
          "cip": 91,
          "gen": 100,
          "sxt": 96,
          "nit": 92
        }
      },
      {
        "name": "S. marcescens",
        "gram": "negative",
        "isolates": 45,
        "note": null,
        "s": {
          "fep": 100,
          "mem": 100,
          "cip": 93,
          "gen": 100,
          "sxt": 100
        }
      },
      {
        "name": "Haemophilus gp",
        "gram": "negative",
        "isolates": 73,
        "note": null,
        "s": {
          "amp": 69,
          "ams": 87,
          "cro": 97,
          "cip": 100,
          "sxt": 75
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
          "van": 100,
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
          "ams": 50,
          "ptz": 96,
          "cfz": 0,
          "cfz_u": 91,
          "cro": 93,
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
          "ams": 100,
          "ptz": 91,
          "cfz": 6,
          "cfz_u": 85,
          "cro": 87,
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
          "ptz": 94,
          "cfz": 0,
          "cfz_u": 0,
          "cro": 96,
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
          "ptz": 100,
          "cfz": 0,
          "cfz_u": 98,
          "cro": 98,
          "fep": 100,
          "mem": 100,
          "tob": 98,
          "lvx": 75,
          "cip": 75,
          "sxt": 90,
          "nit": 0
        }
      },
      {
        "name": "Enterobacter cloacae",
        "gram": "negative",
        "isolates": 38,
        "s": {
          "ptz": 65,
          "cfz_u": 0,
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
          "cfz_u": 0,
          "cro": 79,
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
          "cfz_u": 0,
          "cro": 60,
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
          "oxa": 100,
          "gen": 100,
          "lvx": 91,
          "van": 100,
          "cli": 95,
          "sxt": 100,
          "dox": 99,
          "nit": 100
        }
      },
      {
        "name": "Staph aureus (MRSA)",
        "gram": "positive",
        "isolates": 53,
        "note": null,
        "s": {
          "oxa": 0,
          "gen": 100,
          "lvx": 30,
          "van": 100,
          "cli": 77,
          "sxt": 90,
          "dox": 96,
          "nit": 100
        }
      },
      {
        "name": "Staph aureus (All strains)",
        "gram": "positive",
        "isolates": 174,
        "note": null,
        "s": {
          "oxa": 70,
          "gen": 100,
          "lvx": 72,
          "van": 100,
          "cli": 89,
          "sxt": 97,
          "dox": 98,
          "nit": 100
        }
      },
      {
        "name": "Staph coag negative",
        "gram": "positive",
        "isolates": 58,
        "note": null,
        "s": {
          "oxa": 43,
          "gen": 95,
          "lvx": 81,
          "van": 98,
          "cli": 52,
          "sxt": 69,
          "dox": 88,
          "nit": 100
        }
      },
      {
        "name": "Strep pneumoniae",
        "gram": "positive",
        "isolates": 27,
        "note": "S - Gentamicin synergy only",
        "s": {
          "pen": 100,
          "cro": 96,
          "lvx": 100,
          "van": 100,
          "sxt": 85,
          "dox": 52
        }
      },
      {
        "name": "Strep viridans",
        "gram": "positive",
        "isolates": 48,
        "note": null,
        "s": {
          "pen": 78,
          "cro": 98,
          "lvx": 91,
          "van": 100,
          "cli": 83
        }
      },
      {
        "name": "Enterococcus faecalis",
        "gram": "positive",
        "isolates": 92,
        "note": null,
        "s": {
          "amp": 100,
          "gen": 76,
          "lvx": 87,
          "cip": 87,
          "van": 99,
          "sxt": 33
        }
      },
      {
        "name": "Enterococcus faecium",
        "gram": "positive",
        "isolates": 32,
        "note": null,
        "s": {
          "amp": 19,
          "gen": 100,
          "lvx": 13,
          "cip": 7,
          "van": 42,
          "sxt": 40
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
          "cfz_u": 89,
          "cro": 91,
          "fep": 91,
          "mem": 99,
          "gen": 96,
          "tob": 93,
          "lvx": 77,
          "cip": 79,
          "nit": 96
        }
      },
      {
        "name": "Klebsiella pneumoniae",
        "gram": "negative",
        "isolates": 128,
        "note": null,
        "s": {
          "ams": 93,
          "ptz": 93,
          "cfz": 66,
          "cfz_u": 86,
          "cro": 88,
          "fep": 88,
          "mem": 100,
          "gen": 95,
          "tob": 93,
          "lvx": 86,
          "cip": 87,
          "sxt": 87,
          "nit": 26
        }
      },
      {
        "name": "Klebsiella oxytoca",
        "gram": "negative",
        "isolates": 32,
        "note": null,
        "s": {
          "ams": 100,
          "ptz": 84,
          "cfz": 0,
          "cfz_u": 0,
          "cro": 84,
          "fep": 100,
          "mem": 100,
          "gen": 100,
          "tob": 100,
          "lvx": 89,
          "cip": 100,
          "sxt": 100,
          "nit": 93
        }
      },
      {
        "name": "Proteus mirabilis",
        "gram": "negative",
        "isolates": 42,
        "note": null,
        "s": {
          "amp": 81,
          "ams": 100,
          "ptz": 100,
          "cfz": 16,
          "cfz_u": 93,
          "cro": 97,
          "fep": 100,
          "mem": 100,
          "gen": 100,
          "tob": 96,
          "lvx": 83,
          "cip": 80,
          "sxt": 80,
          "nit": 0
        }
      },
      {
        "name": "Enterobacter cloacae",
        "gram": "negative",
        "isolates": 39,
        "note": null,
        "s": {
          "ptz": 63,
          "cfz_u": 0,
          "fep": 83,
          "mem": 97,
          "gen": 94,
          "tob": 95,
          "lvx": 81,
          "cip": 89,
          "sxt": 89,
          "nit": 50
        }
      },
      {
        "name": "Kleb (Enterobacter) aerogenes",
        "gram": "negative",
        "isolates": 20,
        "note": null,
        "s": {
          "ptz": 73,
          "cfz": 0,
          "cfz_u": 0,
          "cro": 84,
          "fep": 100,
          "mem": 100,
          "gen": 100,
          "tob": 100,
          "lvx": 89,
          "cip": 100,
          "sxt": 100,
          "nit": 13
        }
      },
      {
        "name": "Citrobacter freundii",
        "gram": "negative",
        "isolates": 18,
        "note": null,
        "s": {
          "ptz": 89,
          "cfz": 0,
          "cfz_u": 0,
          "cro": 66,
          "fep": 100,
          "mem": 100,
          "gen": 100,
          "tob": 100,
          "lvx": 100,
          "cip": 100,
          "sxt": 100,
          "nit": 90
        }
      },
      {
        "name": "Pseudomonas aeruginosa",
        "gram": "negative",
        "isolates": 85,
        "note": null,
        "s": {
          "ptz": 88,
          "fep": 97,
          "mem": 90,
          "tob": 100,
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
          "dap": 72,
          "lvx": 89,
          "lzd": 98,
          "nit": 99,
          "pen": 99,
          "tet": 29,
          "van": 99
        }
      },
      {
        "name": "Enterococcus faecium",
        "gram": "positive",
        "isolates": 42,
        "note": null,
        "s": {
          "amp": 73,
          "dap": 100,
          "lvx": 81,
          "lzd": 97,
          "pen": 68,
          "tet": 64,
          "van": 97
        }
      },
      {
        "name": "Enterococcus faecium VRE",
        "gram": "positive",
        "isolates": 21,
        "note": null,
        "s": {
          "amp": 0,
          "lvx": 0,
          "lzd": 100,
          "pen": 4,
          "tet": 5,
          "van": 0
        }
      },
      {
        "name": "Staphylococcus aureus",
        "gram": "positive",
        "isolates": 1031,
        "note": null,
        "s": {
          "cli": 83,
          "ery": 73,
          "gen": 98,
          "lvx": 93,
          "lzd": 100,
          "nit": 100,
          "oxa": 99,
          "pen": 0,
          "rif": 100,
          "tet": 95,
          "sxt": 97,
          "van": 100
        }
      },
      {
        "name": "Methicillin Resistant Staphylococcus aureus",
        "gram": "positive",
        "isolates": 353,
        "note": null,
        "s": {
          "cli": 81,
          "ery": 18,
          "gen": 99,
          "lvx": 41,
          "lzd": 100,
          "nit": 100,
          "oxa": 0,
          "pen": 0,
          "rif": 99,
          "tet": 88,
          "sxt": 92,
          "van": 100
        }
      },
      {
        "name": "Staphylococcus lugdunensis",
        "gram": "positive",
        "isolates": 88,
        "note": null,
        "s": {
          "cli": 87,
          "dap": 100,
          "ery": 88,
          "gen": 98,
          "lvx": 100,
          "lzd": 98,
          "nit": 96,
          "oxa": 96,
          "pen": 0,
          "rif": 98,
          "tet": 96,
          "van": 100
        }
      },
      {
        "name": "Coagulase-Negative Staphylococcus",
        "gram": "positive",
        "isolates": 86,
        "note": null,
        "s": {
          "cli": 66,
          "dap": 100,
          "ery": 52,
          "gen": 88,
          "lvx": 77,
          "lzd": 100,
          "nit": 100,
          "oxa": 69,
          "pen": 0,
          "rif": 95,
          "tet": 82,
          "van": 100
        }
      },
      {
        "name": "Streptococcus pneumoniae",
        "gram": "positive",
        "isolates": 71,
        "note": null,
        "s": {
          "ery": 66,
          "mem": 84,
          "pen": 70,
          "cro": 94,
          "tet": 91,
          "sxt": 78,
          "van": 100
        }
      },
      {
        "name": "Streptococcus agalactiae (Group B)",
        "gram": "positive",
        "isolates": 80,
        "note": null,
        "s": {
          "fep": 100,
          "cro": 100,
          "cli": 44,
          "ery": 28,
          "lvx": 100,
          "lzd": 100,
          "pen": 100,
          "tet": 18,
          "van": 100
        }
      },
      {
        "name": "Streptococcus viridans group",
        "gram": "positive",
        "isolates": 12,
        "note": null,
        "s": {
          "fep": 100,
          "cro": 100,
          "cli": 55,
          "lvx": 100,
          "lzd": 100,
          "pen": 91,
          "van": 100
        }
      },
      {
        "name": "Acinetobacter species",
        "gram": "negative",
        "isolates": 14,
        "note": null,
        "s": {
          "fep": 85,
          "caz": 100,
          "cro": 61,
          "cip": 100,
          "gen": 100,
          "lvx": 100,
          "mem": 100,
          "tob": 100,
          "sxt": 92
        }
      },
      {
        "name": "Citrobacter freundii/freundii complex",
        "gram": "negative",
        "isolates": 153,
        "note": null,
        "s": {
          "amp": 0,
          "cfz": 0,
          "fep": 95,
          "caz": 83,
          "cro": 81,
          "cip": 90,
          "gen": 97,
          "lvx": 94,
          "mem": 98,
          "nit": 94,
          "ptz": 81,
          "tob": 98,
          "sxt": 94
        }
      },
      {
        "name": "Citrobacter koseri",
        "gram": "negative",
        "isolates": 73,
        "note": null,
        "s": {
          "amp": 0,
          "cfz": 94,
          "fep": 100,
          "caz": 98,
          "cro": 100,
          "cip": 97,
          "gen": 100,
          "lvx": 97,
          "mem": 100,
          "nit": 42,
          "ptz": 93,
          "tob": 100,
          "sxt": 97
        }
      },
      {
        "name": "Enterobacter cloacae/cloacae complex",
        "gram": "negative",
        "isolates": 201,
        "note": null,
        "s": {
          "amp": 0,
          "cfz": 0,
          "fep": 92,
          "caz": 83,
          "cro": 79,
          "cip": 94,
          "gen": 98,
          "lvx": 96,
          "mem": 99,
          "nit": 29,
          "ptz": 79,
          "tob": 98,
          "sxt": 94
        }
      },
      {
        "name": "Escherichia coli",
        "gram": "negative",
        "isolates": 5468,
        "note": null,
        "s": {
          "amp": 70,
          "cfz": 86,
          "cfz_u": 96,
          "fep": 99,
          "caz": 98,
          "cro": 99,
          "cip": 84,
          "gen": 95,
          "lvx": 89,
          "mem": 99,
          "nit": 98,
          "ptz": 98,
          "tob": 95,
          "sxt": 86
        }
      },
      {
        "name": "Escherichia coli ESBL",
        "gram": "negative",
        "isolates": 254,
        "note": null,
        "s": {
          "amp": 0,
          "cfz": 0,
          "cfz_u": 0,
          "fep": 0,
          "caz": 0,
          "cro": 0,
          "cip": 11,
          "gen": 75,
          "lvx": 34,
          "mem": 100,
          "nit": 93,
          "ptz": 91,
          "tob": 72,
          "sxt": 49
        }
      },
      {
        "name": "Klebsiella (Enterobacter) aerogenes",
        "gram": "negative",
        "isolates": 111,
        "note": null,
        "s": {
          "amp": 0,
          "cfz": 0,
          "fep": 97,
          "caz": 88,
          "cro": 89,
          "cip": 97,
          "gen": 99,
          "lvx": 98,
          "mem": 98,
          "nit": 19,
          "ptz": 86,
          "tob": 99,
          "sxt": 97
        }
      },
      {
        "name": "Klebsiella oxytoca/Raoultella ornithinolytica",
        "gram": "negative",
        "isolates": 205,
        "note": null,
        "s": {
          "amp": 0,
          "cfz": 26,
          "fep": 96,
          "caz": 95,
          "cro": 94,
          "cip": 95,
          "gen": 96,
          "lvx": 98,
          "mem": 100,
          "nit": 90,
          "ptz": 93,
          "tob": 96,
          "sxt": 91
        }
      },
      {
        "name": "Klebsiella pneumoniae",
        "gram": "negative",
        "isolates": 676,
        "note": null,
        "s": {
          "amp": 0,
          "cfz": 92,
          "cfz_u": 99,
          "fep": 100,
          "caz": 99,
          "cro": 99,
          "cip": 95,
          "gen": 99,
          "lvx": 97,
          "mem": 100,
          "nit": 35,
          "ptz": 93,
          "tob": 99,
          "sxt": 94
        }
      },
      {
        "name": "Klebsiella pneumoniae ESBL",
        "gram": "negative",
        "isolates": 37,
        "note": null,
        "s": {
          "amp": 0,
          "cfz": 0,
          "cfz_u": 5,
          "fep": 0,
          "caz": 0,
          "cro": 0,
          "cip": 13,
          "gen": 59,
          "lvx": 32,
          "mem": 97,
          "nit": 19,
          "ptz": 64,
          "tob": 67,
          "sxt": 16
        }
      },
      {
        "name": "Morganella morganii",
        "gram": "negative",
        "isolates": 60,
        "note": null,
        "s": {
          "amp": 0,
          "cfz": 0,
          "cfz_u": 0,
          "fep": 100,
          "caz": 88,
          "cro": 89,
          "cip": 86,
          "gen": 91,
          "lvx": 86,
          "mem": 98,
          "nit": 0,
          "ptz": 100,
          "tob": 98,
          "sxt": 91
        }
      },
      {
        "name": "Pantoea agglomerans",
        "gram": "negative",
        "isolates": 5,
        "note": null,
        "s": {
          "amp": 60,
          "cfz": 0,
          "fep": 100,
          "caz": 100,
          "cro": 100,
          "cip": 100,
          "gen": 100,
          "lvx": 100,
          "mem": 100,
          "ptz": 100,
          "tob": 100,
          "sxt": 100
        }
      },
      {
        "name": "Proteus mirabilis",
        "gram": "negative",
        "isolates": 458,
        "note": null,
        "s": {
          "amp": 87,
          "cfz": 1,
          "cfz_u": 97,
          "fep": 99,
          "caz": 99,
          "cro": 98,
          "cip": 86,
          "gen": 94,
          "lvx": 88,
          "mem": 100,
          "nit": 0,
          "ptz": 100,
          "tob": 94,
          "sxt": 89
        }
      },
      {
        "name": "Providencia species",
        "gram": "negative",
        "isolates": 28,
        "note": null,
        "s": {
          "amp": 0,
          "cfz": 0,
          "fep": 100,
          "caz": 92,
          "cro": 96,
          "cip": 78,
          "gen": 89,
          "lvx": 78,
          "mem": 100,
          "nit": 0,
          "ptz": 100,
          "tob": 82,
          "sxt": 85
        }
      },
      {
        "name": "Pseudomonas aeruginosa",
        "gram": "negative",
        "isolates": 353,
        "note": null,
        "s": {
          "fep": 93,
          "caz": 93,
          "cip": 82,
          "gen": 50,
          "lvx": 82,
          "mem": 94,
          "ptz": 90,
          "tob": 99,
          "sxt": 0
        }
      },
      {
        "name": "Serratia marcescens",
        "gram": "negative",
        "isolates": 64,
        "note": null,
        "s": {
          "amp": 0,
          "cfz": 0,
          "fep": 98,
          "caz": 98,
          "cro": 90,
          "cip": 87,
          "gen": 100,
          "lvx": 89,
          "mem": 98,
          "nit": 0,
          "ptz": 90,
          "tob": 87
        }
      },
      {
        "name": "Stenotrophomonas maltophilia",
        "gram": "negative",
        "isolates": 24,
        "note": null,
        "s": {
          "lvx": 83,
          "sxt": 91
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
        "name": "Strep pneumoniae",
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
    "id": "minot_afb",
    "name": "5th Medical Group - Minot AFB",
    "location": "Minot AFB, ND",
    "period": "2025",
    "sourceNote": "DHA Antimicrobial Stewardship App \u00b7 AF-C-5th MEDGRP-MINOT 2025 Antibiogram (Outpatient) \u00b7 % susceptible, Jan 1 \u2013 Dec 31, 2025. Most organisms below the facility's own 30-isolate reporting threshold this period (shown as intrinsic-resistance markers only, where applicable); only E. coli has a full reportable susceptibility profile. 5% of E. coli are ESBL.",
    "sourceUrl": "https://mobile.health.mil/mobile_apps/asp/outpatient-mtfantibiograms/outpatient-antibiogram/chart",
    "organisms": [
      {
        "name": "Citrobacter freundii",
        "gram": "negative",
        "isolates": 0,
        "note": null,
        "s": {
          "ams": 0,
          "cfz": 0,
          "amp": 0
        }
      },
      {
        "name": "Citrobacter koseri",
        "gram": "negative",
        "isolates": 0,
        "note": null,
        "s": {
          "amp": 0
        }
      },
      {
        "name": "E. coli",
        "gram": "negative",
        "isolates": 51,
        "note": null,
        "s": {
          "gen": 96,
          "tob": 98,
          "ptz": 100,
          "cfz": 95,
          "fep": 100,
          "cro": 96,
          "sxt": 86,
          "nit": 98,
          "mem": 100,
          "amp": 72,
          "cip": 92,
          "lvx": 92,
          "tet": 88
        }
      },
      {
        "name": "Klebsiella aerogenes",
        "gram": "negative",
        "isolates": 2,
        "note": null,
        "s": {
          "ams": 0,
          "cfz": 0,
          "amp": 0
        }
      },
      {
        "name": "Klebsiella pneumoniae",
        "gram": "negative",
        "isolates": 4,
        "note": null,
        "s": {
          "amp": 0
        }
      },
      {
        "name": "Morganella morganii",
        "gram": "negative",
        "isolates": 0,
        "note": null,
        "s": {
          "ams": 0,
          "cfz": 0,
          "nit": 0,
          "amp": 0
        }
      },
      {
        "name": "Proteus mirabilis",
        "gram": "negative",
        "isolates": 0,
        "note": null,
        "s": {
          "nit": 0,
          "tet": 0
        }
      },
      {
        "name": "Pseudomonas aeruginosa",
        "gram": "negative",
        "isolates": 0,
        "note": null,
        "s": {
          "ams": 0,
          "cro": 0,
          "sxt": 0,
          "amp": 0,
          "tet": 0
        }
      },
      {
        "name": "Serratia marcescens",
        "gram": "negative",
        "isolates": 0,
        "note": null,
        "s": {
          "ams": 0,
          "cfz": 0,
          "nit": 0,
          "amp": 0
        }
      },
      {
        "name": "Stenotrophomonas maltophilia",
        "gram": "negative",
        "isolates": 0,
        "note": null,
        "s": {
          "gen": 0,
          "tob": 0,
          "ams": 0,
          "ptz": 0,
          "cfz": 0,
          "amp": 0,
          "tet": 0
        }
      },
      {
        "name": "Enterococcus faecalis",
        "gram": "positive",
        "isolates": 8,
        "note": null,
        "s": {
          "gen": 0,
          "tob": 0,
          "ptz": 0,
          "cfz": 0,
          "fep": 0,
          "caz": 0,
          "cro": 0,
          "cli": 0
        }
      },
      {
        "name": "Enterococcus faecium",
        "gram": "positive",
        "isolates": 1,
        "note": null,
        "s": {
          "gen": 0,
          "tob": 0,
          "ptz": 0,
          "cfz": 0,
          "fep": 0,
          "caz": 0,
          "cro": 0,
          "cli": 0
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
          "ams": 91,
          "ptz": 100,
          "cfz": 100,
          "cro": 100,
          "mem": 100,
          "gen": 100,
          "rif": 100,
          "cip": 91,
          "lvx": 91,
          "sxt": 100,
          "cli": 82,
          "dap": 95,
          "azi": 64,
          "ery": 73,
          "lzd": 95,
          "van": 95,
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
          "cro": 0,
          "mem": 0,
          "gen": 100,
          "rif": 100,
          "cip": 20,
          "lvx": 20,
          "sxt": 53,
          "cli": 80,
          "dap": 100,
          "azi": 13,
          "ery": 27,
          "lzd": 87,
          "van": 100,
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
          "ams": 54,
          "ptz": 100,
          "cfz": 59,
          "cro": 64,
          "mem": 64,
          "gen": 100,
          "rif": 100,
          "cip": 62,
          "lvx": 62,
          "sxt": 81,
          "cli": 81,
          "dap": 97,
          "azi": 45,
          "ery": 54,
          "lzd": 92,
          "van": 97,
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
          "rif": 40,
          "cip": 40,
          "lvx": 80,
          "dap": 100,
          "ery": 40,
          "lzd": 80,
          "van": 100,
          "tet": 40
        }
      },
      {
        "name": "Escherichia coli",
        "gram": "negative",
        "isolates": 16,
        "note": "S",
        "s": {
          "amp": 75,
          "ams": 75,
          "ptz": 100,
          "cfz": 94,
          "cxm": 91,
          "caz": 94,
          "cro": 94,
          "fep": 94,
          "cfx": 100,
          "mem": 100,
          "gen": 88,
          "tob": 88,
          "cip": 100,
          "lvx": 100,
          "sxt": 88
        }
      },
      {
        "name": "Klebsiella pneumoniae",
        "gram": "negative",
        "isolates": 4,
        "note": "S",
        "s": {
          "amp": 0,
          "ams": 100,
          "ptz": 100,
          "cfz": 100,
          "cxm": 100,
          "caz": 100,
          "cro": 100,
          "fep": 100,
          "cfx": 50,
          "mem": 100,
          "gen": 100,
          "tob": 100,
          "cip": 100,
          "lvx": 100,
          "sxt": 100
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
          "ptz": 100,
          "cfz": 67,
          "cxm": 100,
          "caz": 100,
          "cro": 100,
          "fep": 100,
          "cfx": 100,
          "mem": 100,
          "gen": 100,
          "tob": 100,
          "cip": 67,
          "lvx": 67,
          "sxt": 67,
          "nit": 0
        }
      },
      {
        "name": "E. aerogenes",
        "gram": "negative",
        "isolates": 1,
        "note": "S",
        "s": {
          "amp": 100,
          "ams": 100,
          "ptz": 100,
          "cfz": 0,
          "caz": 100,
          "cro": 100,
          "fep": 100,
          "mem": 100,
          "gen": 100,
          "tob": 100,
          "cip": 100,
          "lvx": 100,
          "sxt": 100
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
          "ptz": 100,
          "cfz": 0,
          "caz": 100,
          "cro": 100,
          "mem": 100,
          "gen": 100,
          "tob": 100,
          "cip": 100,
          "lvx": 100,
          "sxt": 100
        }
      },
      {
        "name": "P. aeruginosa",
        "gram": "negative",
        "isolates": 5,
        "note": "S",
        "s": {
          "ptz": 80,
          "caz": 80,
          "fep": 80,
          "mem": 100,
          "gen": 20,
          "tob": 80,
          "cip": 80,
          "lvx": 80
        }
      },
      {
        "name": "C. freundii",
        "gram": "negative",
        "isolates": 1,
        "note": "S",
        "s": {
          "amp": 0,
          "ams": 100,
          "ptz": 100,
          "cfz": 0,
          "cxm": 100,
          "caz": 100,
          "cro": 100,
          "fep": 100,
          "cfx": 0,
          "mem": 100,
          "gen": 100,
          "tob": 100,
          "cip": 100,
          "lvx": 100,
          "sxt": 100
        }
      },
      {
        "name": "M. morganii",
        "gram": "negative",
        "isolates": 1,
        "note": "S",
        "s": {
          "amp": 0,
          "ams": 0,
          "ptz": 100,
          "cfz": 0,
          "caz": 0,
          "cro": 0,
          "fep": 100,
          "cfx": 0,
          "mem": 100,
          "gen": 0,
          "tob": 100,
          "cip": 0,
          "lvx": 0,
          "sxt": 0,
          "nit": 0
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
          "ptz": 0,
          "cfz": 0,
          "caz": 100,
          "cro": 0,
          "fep": 100,
          "cfx": 100,
          "mem": 0,
          "gen": 100,
          "tob": 33,
          "cip": 0,
          "lvx": 0,
          "sxt": 50,
          "nit": 100
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
          "ptz": 100,
          "cfz": 50,
          "cxm": 100,
          "caz": 100,
          "cro": 100,
          "fep": 100,
          "cfx": 0,
          "mem": 100,
          "gen": 100,
          "tob": 100,
          "cip": 100,
          "lvx": 100,
          "sxt": 50
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
          "ptz": 100,
          "cfz": 100,
          "cro": 100,
          "gen": 100,
          "rif": 100,
          "cip": 100,
          "lvx": 100,
          "sxt": 100,
          "dap": 100,
          "nit": 90,
          "lzd": 90,
          "van": 90,
          "tet": 100
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
          "cro": 0,
          "gen": 100,
          "rif": 100,
          "cip": 33,
          "lvx": 33,
          "sxt": 67,
          "dap": 100,
          "nit": 100,
          "lzd": 100,
          "van": 100,
          "tet": 100
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
          "ptz": 100,
          "cfz": 77,
          "cro": 88,
          "gen": 100,
          "rif": 100,
          "cip": 85,
          "lvx": 85,
          "sxt": 92,
          "dap": 100,
          "nit": 92,
          "lzd": 92,
          "van": 92,
          "tet": 100
        }
      },
      {
        "name": "E. faecalis",
        "gram": "positive",
        "isolates": 22,
        "note": null,
        "s": {
          "pen": 95,
          "amp": 95,
          "rif": 50,
          "cip": 73,
          "lvx": 86,
          "dap": 95,
          "nit": 91,
          "lzd": 91,
          "van": 95,
          "tet": 50
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
          "rif": 0,
          "cip": 0,
          "lvx": 0,
          "dap": 100,
          "nit": 100,
          "lzd": 0,
          "van": 100,
          "tet": 100
        }
      },
      {
        "name": "Escherichia coli",
        "gram": "negative",
        "isolates": 235,
        "note": null,
        "s": {
          "amp": 70,
          "ams": 74,
          "ptz": 99,
          "cfz": 86,
          "cxm": 88,
          "caz": 89,
          "cro": 89,
          "fep": 91,
          "cfx": 98,
          "mem": 100,
          "gen": 95,
          "tob": 95,
          "cip": 91,
          "lvx": 92,
          "sxt": 82,
          "nit": 94
        }
      },
      {
        "name": "Klebsiella pneumoniae",
        "gram": "negative",
        "isolates": 44,
        "note": null,
        "s": {
          "amp": 0,
          "ams": 82,
          "ptz": 98,
          "cfz": 86,
          "cxm": 89,
          "caz": 95,
          "cro": 93,
          "fep": 95,
          "cfx": 100,
          "mem": 100,
          "gen": 98,
          "tob": 98,
          "cip": 95,
          "lvx": 95,
          "sxt": 91,
          "nit": 50
        }
      },
      {
        "name": "Proteus mirabilis",
        "gram": "negative",
        "isolates": 23,
        "note": null,
        "s": {
          "amp": 87,
          "ams": 91,
          "ptz": 96,
          "cfz": 87,
          "cxm": 92,
          "caz": 96,
          "cro": 96,
          "fep": 96,
          "cfx": 100,
          "mem": 100,
          "gen": 100,
          "tob": 100,
          "cip": 78,
          "lvx": 91,
          "sxt": 91,
          "nit": 0
        }
      },
      {
        "name": "E. aerogenes",
        "gram": "negative",
        "isolates": 1,
        "note": null,
        "s": {
          "amp": 0,
          "ams": 0,
          "ptz": 100,
          "cfz": 0,
          "caz": 100,
          "cro": 100,
          "fep": 100,
          "mem": 100,
          "gen": 100,
          "tob": 100,
          "cip": 100,
          "lvx": 100,
          "sxt": 0
        }
      },
      {
        "name": "E. cloacae",
        "gram": "negative",
        "isolates": 11,
        "note": null,
        "s": {
          "amp": 9,
          "ams": 9,
          "ptz": 91,
          "cfz": 0,
          "caz": 82,
          "cro": 45,
          "fep": 91,
          "cfx": 0,
          "mem": 100,
          "gen": 100,
          "tob": 100,
          "cip": 100,
          "lvx": 100,
          "sxt": 18,
          "nit": 80
        }
      },
      {
        "name": "Serratia marcescens",
        "gram": "negative",
        "isolates": 1,
        "note": null,
        "s": {
          "amp": 0,
          "ams": 0,
          "ptz": 100,
          "cfz": 0,
          "caz": 100,
          "cro": 100,
          "fep": 100,
          "cfx": 0,
          "mem": 100,
          "gen": 100,
          "tob": 100,
          "cip": 100,
          "lvx": 100,
          "sxt": 100,
          "nit": 0
        }
      },
      {
        "name": "P. aeruginosa",
        "gram": "negative",
        "isolates": 8,
        "note": null,
        "s": {
          "ptz": 100,
          "caz": 88,
          "fep": 100,
          "cfx": 100,
          "mem": 100,
          "gen": 88,
          "tob": 100,
          "cip": 75,
          "lvx": 75
        }
      },
      {
        "name": "A. baumannii",
        "gram": "negative",
        "isolates": 1,
        "note": null,
        "s": {
          "ams": 0,
          "caz": 100,
          "cro": 100,
          "mem": 100,
          "gen": 100,
          "tob": 100,
          "cip": 100,
          "lvx": 100,
          "sxt": 0
        }
      },
      {
        "name": "C. freundii",
        "gram": "negative",
        "isolates": 9,
        "note": null,
        "s": {
          "amp": 11,
          "ams": 67,
          "ptz": 89,
          "cfz": 0,
          "cxm": 100,
          "caz": 67,
          "cro": 78,
          "fep": 89,
          "cfx": 0,
          "mem": 100,
          "gen": 89,
          "tob": 89,
          "cip": 100,
          "lvx": 100,
          "sxt": 78,
          "nit": 89
        }
      },
      {
        "name": "M. morganii",
        "gram": "negative",
        "isolates": 2,
        "note": null,
        "s": {
          "amp": 0,
          "ams": 0,
          "ptz": 100,
          "cfz": 0,
          "caz": 100,
          "cro": 100,
          "fep": 100,
          "cfx": 100,
          "mem": 100,
          "gen": 100,
          "tob": 100,
          "cip": 100,
          "lvx": 100,
          "sxt": 0,
          "nit": 0
        }
      },
      {
        "name": "Providencia spp.",
        "gram": "negative",
        "isolates": 4,
        "note": null,
        "s": {
          "amp": 0,
          "ams": 50,
          "ptz": 75,
          "cfz": 25,
          "cxm": 75,
          "caz": 75,
          "cro": 75,
          "fep": 100,
          "cfx": 100,
          "mem": 100,
          "tob": 100,
          "cip": 75,
          "lvx": 75,
          "sxt": 50,
          "nit": 0
        }
      },
      {
        "name": "Salmonella spp.",
        "gram": "negative",
        "isolates": 3,
        "note": null,
        "s": {
          "amp": 100,
          "caz": 100,
          "cro": 100,
          "cip": 100,
          "lvx": 100,
          "sxt": 100
        }
      },
      {
        "name": "Klebsiella oxytoca",
        "gram": "negative",
        "isolates": 12,
        "note": null,
        "s": {
          "amp": 0,
          "ams": 67,
          "ptz": 100,
          "cfz": 25,
          "cxm": 60,
          "caz": 100,
          "cro": 92,
          "fep": 92,
          "cfx": 80,
          "mem": 100,
          "gen": 100,
          "tob": 100,
          "cip": 100,
          "lvx": 100,
          "sxt": 75,
          "nit": 75
        }
      }
    ]
  },
  {
    "id": "wramc",
    "name": "Walter Reed National Military Medical Center",
    "location": "Bethesda, MD",
    "period": "2025",
    "sourceNote": "DHA Antimicrobial Stewardship App \u00b7 Walter Reed National Military Medical Center 2025 Antibiogram (Outpatient) \u00b7 % susceptible, Jan 1 \u2013 Dec 31, 2025. Organisms below the facility's own 30-isolate threshold are shown as intrinsic-resistance markers only where applicable. 5% of E. coli and 8% of Klebsiella pneumoniae are ESBL. \"Staphylococcus aureus (All strains)\" is a mixed MSSA+MRSA aggregate, distinct from the MSSA-only row.",
    "sourceUrl": "https://mobile.health.mil/mobile_apps/asp/outpatient-mtfantibiograms/outpatient-antibiogram",
    "organisms": [
      {
        "name": "Citrobacter freundii",
        "gram": "negative",
        "isolates": 18,
        "note": null,
        "s": {
          "ams": 0,
          "cfz": 0,
          "amp": 0
        }
      },
      {
        "name": "Citrobacter koseri",
        "gram": "negative",
        "isolates": 33,
        "note": null,
        "s": {
          "amp": 0
        }
      },
      {
        "name": "E. coli",
        "gram": "negative",
        "isolates": 706,
        "note": null,
        "s": {
          "gen": 91,
          "tob": 79,
          "ams": 63,
          "ptz": 98,
          "fep": 80,
          "caz": 93,
          "cro": 93,
          "sxt": 76,
          "nit": 98,
          "mem": 99,
          "amp": 58,
          "cip": 72,
          "lvx": 83
        }
      },
      {
        "name": "Klebsiella aerogenes",
        "gram": "negative",
        "isolates": 30,
        "note": null,
        "s": {
          "ams": 0,
          "cfz": 0,
          "amp": 0
        }
      },
      {
        "name": "Klebsiella pneumoniae",
        "gram": "negative",
        "isolates": 166,
        "note": null,
        "s": {
          "gen": 93,
          "tob": 89,
          "ams": 84,
          "ptz": 92,
          "fep": 77,
          "caz": 90,
          "cro": 90,
          "sxt": 88,
          "nit": 49,
          "mem": 100,
          "amp": 0,
          "cip": 87
        }
      },
      {
        "name": "Morganella morganii",
        "gram": "negative",
        "isolates": 23,
        "note": null,
        "s": {
          "ams": 0,
          "cfz": 0,
          "nit": 0,
          "amp": 0
        }
      },
      {
        "name": "Proteus mirabilis",
        "gram": "negative",
        "isolates": 76,
        "note": null,
        "s": {
          "gen": 100,
          "ams": 89,
          "cro": 94,
          "sxt": 84,
          "nit": 0,
          "amp": 84,
          "cip": 91,
          "tet": 0
        }
      },
      {
        "name": "Pseudomonas aeruginosa",
        "gram": "negative",
        "isolates": 83,
        "note": null,
        "s": {
          "tob": 100,
          "ams": 0,
          "ptz": 93,
          "fep": 90,
          "caz": 93,
          "cro": 0,
          "sxt": 0,
          "mem": 95,
          "amp": 0,
          "cip": 87,
          "lvx": 87,
          "tet": 0
        }
      },
      {
        "name": "Serratia marcescens",
        "gram": "negative",
        "isolates": 10,
        "note": null,
        "s": {
          "ams": 0,
          "cfz": 0,
          "nit": 0,
          "amp": 0
        }
      },
      {
        "name": "Stenotrophomonas maltophilia",
        "gram": "negative",
        "isolates": 3,
        "note": null,
        "s": {
          "gen": 0,
          "tob": 0,
          "ams": 0,
          "ptz": 0,
          "sxt": 0,
          "tet": 0
        }
      },
      {
        "name": "Enterococcus faecalis",
        "gram": "positive",
        "isolates": 109,
        "note": null,
        "s": {
          "gen": 0,
          "tob": 0,
          "cfz": 0,
          "fep": 0,
          "caz": 0,
          "cro": 0,
          "sxt": 0,
          "van": 100,
          "cli": 0,
          "dap": 84,
          "amp": 100
        }
      },
      {
        "name": "Enterococcus faecium",
        "gram": "positive",
        "isolates": 0,
        "note": null,
        "s": {
          "gen": 0,
          "tob": 0,
          "cfz": 0,
          "fep": 0,
          "caz": 0,
          "cro": 0,
          "sxt": 0,
          "cli": 0
        }
      },
      {
        "name": "Staph aureus (MSSA)",
        "gram": "positive",
        "isolates": 171,
        "note": null,
        "s": {
          "sxt": 92,
          "van": 100,
          "cli": 73,
          "dap": 98,
          "ery": 60,
          "lzd": 98,
          "oxa": 100,
          "pen": 0,
          "tet": 87
        }
      },
      {
        "name": "Staphylococcus aureus (All strains)",
        "gram": "positive",
        "isolates": 207,
        "note": null,
        "s": {
          "sxt": 91,
          "van": 100,
          "cli": 74,
          "dap": 98,
          "ery": 54,
          "lzd": 98,
          "oxa": 86,
          "pen": 0,
          "tet": 84
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
