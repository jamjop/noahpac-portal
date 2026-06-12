export default function Home() {
  const tools: {
    category: string;
    items: {
      name: string;
      desc: string;
      chips: string[];
      href: string;
      color: string;
      external?: boolean;
    }[];
  }[] = [
    {
      category: "Screening & Preventive Care",
      items: [
        {
          name: "USPSTF Screener",
          desc: "Age + sex + risk factors → applicable USPSTF Grade A/B/C recommendations. Covers the full schedule including 2024 breast cancer and 2025 cervical updates. Risk-factor checkboxes promote conditional screenings (lung LDCT, AAA, osteoporosis) into the recommended list.",
          chips: ["USPSTF 2026", "Ages 3–110"],
          href: "/screener",
          color: "teal",
        },
        {
          name: "Immunization Schedule",
          desc: "Age + conditions → vaccines due now. Full ACIP schedule birth through adult with catch-up logic. Conditions including pregnancy, immunocompromised status, asplenia, and chronic organ disease surface additional indicated vaccines.",
          chips: ["ACIP 2025", "Birth – 90 yr"],
          href: "/vaccines",
          color: "blue",
        },
      ],
    },
    {
      category: "Clinical Calculators",
      items: [
        {
          name: "Medical Calculators",
          desc: "Thirteen calculators with live results: ASCVD 10-yr risk, CHA₂DS₂-VASc, Wells DVT & PE / PERC, CURB-65, CrCl (Cockcroft-Gault), eGFR (CKD-EPI 2021), corrected calcium, anion gap + delta ratio, MELD / MELD-Na, PHQ-9, GAD-7, HEART score, and Ottawa Knee / Ankle rules.",
          chips: ["13 calculators", "Live results"],
          href: "/calculators",
          color: "indigo",
        },
        {
          name: "Opioid Conversion",
          desc: "Equianalgesic conversion between opioids with MME calculation and CDC risk thresholds. Supports oral, IV, and transdermal routes with cross-tolerance reduction options. Includes reference table of standard conversion factors.",
          chips: ["CDC MME 2022", "Cross-tolerance"],
          href: "/opioids",
          color: "amber",
        },
        {
          name: "STI Treatment",
          desc: "CDC 2021 treatment guidelines distilled to organism → first-line regimen with pregnancy and allergy alternatives. Covers bacterial, viral, vaginal, pelvic, and ectoparasite conditions. Manually curated dataset — no API dependency.",
          chips: ["CDC 2021", "21 conditions"],
          href: "/sti",
          color: "crimson",
        },
      ],
    },
    {
      category: "Clinical Reference",
      items: [
        {
          name: "Antibiotic Reference",
          desc: "Empiric antibiotic regimens by infection site — first-line, allergy alternatives, and pregnancy-safe options for respiratory, urinary, skin, GI, tick-borne, and severe/empiric infections. Searchable sidebar. Based on IDSA, ISDA, and Surviving Sepsis guidelines.",
          chips: ["IDSA Guidelines", "17 infections"],
          href: "/abx",
          color: "green",
        },
        {
          name: "Lab Differentials",
          desc: "Select any lab value to see differential diagnoses for elevated and decreased results. Covers 40+ tests across electrolytes, CBC, liver, thyroid, and more — with clinical context for each differential.",
          chips: ["40+ tests", "Differentials"],
          href: "/labdiff",
          color: "rose",
        },
        {
          name: "Lab Reference",
          desc: "Searchable adult reference ranges for 90+ lab tests across CBC, BMP/CMP, liver, coagulation, cardiac, thyroid, lipids, urinalysis, ABG, immunology, and miscellaneous panels. Sex-specific ranges where applicable, with clinical interpretation notes.",
          chips: ["90+ tests", "Sex-specific"],
          href: "/labs",
          color: "violet",
        },
      ],
    },
    {
      category: "Field Medicine",
      items: [
        {
          name: "TCCC / MARCH PAWS",
          desc: "CoTCCC 2023 field reference — hemorrhage control sequences, TQ conversion timelines, and drug cards for ketamine, TXA, ertapenem, and more. Full MARCH PAWS protocol with Care Under Fire and Tactical Field Care phases. Offline-capable PWA — add to home screen to use without data.",
          chips: ["CoTCCC 2023", "PWA · Offline"],
          href: "/tccc",
          color: "red",
        },
      ],
    },
    {
      category: "Drug & Code Reference",
      items: [
        {
          name: "Code & Drug Lookup",
          desc: "Live typeahead search for ICD-10 diagnoses, RxTerms drug names, and LOINC lab codes via the NLM Clinical Tables API. Copy codes directly or jump to the full drug label. No API key required.",
          chips: ["ICD-10", "RxTerms", "LOINC"],
          href: "/lookup",
          color: "slate",
        },
        {
          name: "Drug Reference",
          desc: "Pull FDA structured label data on demand — dosing, contraindications, boxed warnings, adverse reactions, drug interactions, and recent recalls. Powered by the openFDA Drug Label and Enforcement APIs. No API key required.",
          chips: ["openFDA", "Recalls"],
          href: "/drugref",
          color: "slate",
        },
        {
          name: "Pediatric Dosing",
          desc: "Enter weight or age to generate a full Broselow-style dosing card: equipment sizes, fluid volumes, resuscitation drugs, RSI agents, seizure medications, antibiotics, and more — all calculated for the patient in front of you.",
          chips: ["Weight-based", "Broselow"],
          href: "/peds",
          color: "green",
        },
      ],
    },
    {
      category: "External References",
      items: [
        {
          name: "UpToDate",
          desc: "Evidence-based clinical decision support covering diagnosis, treatment, and prevention across all specialties. Peer-reviewed recommendations with graded evidence and drug information.",
          chips: ["Wolters Kluwer", "Subscription"],
          href: "https://www.uptodate.com/",
          color: "slate",
          external: true,
        },
        {
          name: "Dr. Oracle",
          desc: "AI-powered clinical question answering grounded in medical literature. Ask free-text clinical questions and receive evidence-referenced answers with source citations.",
          chips: ["AI-assisted", "Free"],
          href: "https://www.droracle.ai/",
          color: "slate",
          external: true,
        },
      ],
    },
  ];

  const colorMap: Record<string, string> = {
    teal: "#0891B2",
    blue: "#1B2E6B",
    green: "#1A8A5A",
    red: "#C53030",
    crimson: "#991B1B",
    indigo: "#3730A3",
    violet: "#2563EB",
    rose: "#BE185D",
    amber: "#D97706",
    slate: "#475569",
  };

  const chipBgMap: Record<string, string> = {
    teal: "#E0F5FA",
    blue: "#E8EDF7",
    green: "#E3F5EC",
    red: "#FDE8E8",
    crimson: "#FDE8E8",
    indigo: "#EEF0FA",
    violet: "#EEF4FF",
    rose: "#FDE8F2",
    amber: "#FEF3DA",
    slate: "#F1F3F7",
  };

  const chipColorMap: Record<string, string> = {
    teal: "#0369A1",
    blue: "#1B2E6B",
    green: "#1A8A5A",
    red: "#991B1B",
    crimson: "#991B1B",
    indigo: "#3730A3",
    violet: "#1D4ED8",
    rose: "#9D174D",
    amber: "#92400E",
    slate: "#334155",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ background: "var(--grad)", color: "#fff", padding: 0 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "44px 24px 40px" }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,.55)",
            textTransform: "uppercase",
            fontWeight: 600,
          }}>
            NOAH PA-C · POINT-OF-CARE REFERENCE
          </div>
          <h1 style={{
            fontSize: "clamp(26px, 4.5vw, 38px)",
            margin: "5px 0 12px",
            color: "#fff",
            letterSpacing: "-0.01em",
            fontWeight: 800,
            lineHeight: 1.1,
          }}>
            Clinical Reference Tools
          </h1>
          <p style={{
            fontSize: 13.5,
            color: "rgba(255,255,255,.7)",
            maxWidth: 520,
            lineHeight: 1.7,
          }}>
            <strong style={{ color: "rgba(255,255,255,.95)" }}>Fast, offline-capable</strong> clinical reference. No login, no tracking — all calculations run locally in your browser.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
            {["15 tools", "No account", "Runs offline", "100% client-side"].map((badge) => (
              <span key={badge} style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.05em",
                padding: "5px 12px",
                borderRadius: 50,
                background: "rgba(255,255,255,.1)",
                color: "rgba(255,255,255,.8)",
                border: "1px solid rgba(255,255,255,.18)",
              }}>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Tool grid */}
      <main style={{ flex: 1, paddingTop: 36, paddingBottom: 64 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
          {tools.map((section) => (
            <div key={section.category} style={{ marginBottom: 40 }}>
              {/* Section label */}
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-muted)",
                fontWeight: 700,
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: 2,
                  background: "currentColor",
                  flexShrink: 0,
                  opacity: 0.65,
                  display: "inline-block",
                }} />
                {section.category}
                <span style={{ flex: 1, height: 1, background: "var(--line)", display: "inline-block" }} />
              </div>

              {/* Cards grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 14,
              }}>
                {section.items.map((tool) => {
                  const barColor = colorMap[tool.color] ?? colorMap.slate;
                  const isExternal = tool.external;
                  return (
                    <a
                      key={tool.name}
                      href={tool.href}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      style={{
                        background: "var(--surface)",
                        borderRadius: "var(--r)",
                        padding: "20px 20px 16px",
                        textDecoration: "none",
                        color: "inherit",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "var(--sh)",
                        transition: "transform .2s ease, box-shadow .2s ease",
                        borderLeft: `4px solid ${barColor}`,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "var(--sh-lg)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "var(--sh)";
                      }}
                    >
                      {/* Tool name */}
                      <div style={{
                        fontWeight: 800,
                        fontSize: 15,
                        letterSpacing: "0.01em",
                        lineHeight: 1.25,
                        color: "var(--ink)",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}>
                        <span style={{
                          width: 7,
                          height: 7,
                          borderRadius: 2,
                          background: barColor,
                          flexShrink: 0,
                          display: "inline-block",
                        }} />
                        {tool.name}
                      </div>

                      {/* Description */}
                      <div style={{
                        fontSize: 12.5,
                        color: "var(--ink-soft)",
                        lineHeight: 1.65,
                        flex: 1,
                        marginBottom: 14,
                      }}>
                        {tool.desc}
                      </div>

                      {/* Meta chips + arrow */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexWrap: "wrap",
                        borderTop: "1px solid var(--line)",
                        paddingTop: 11,
                        marginTop: "auto",
                      }}>
                        {tool.chips.map((chip) => (
                          <span key={chip} style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 9.5,
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                            padding: "3px 9px",
                            borderRadius: 4,
                            background: chipBgMap[tool.color] ?? "#F1F3F7",
                            color: chipColorMap[tool.color] ?? "#334155",
                          }}>
                            {chip}
                          </span>
                        ))}
                        <span style={{
                          marginLeft: "auto",
                          fontSize: 18,
                          flexShrink: 0,
                          color: barColor,
                          transition: "transform .2s",
                        }}>
                          {isExternal ? "↗" : "→"}
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer disclaimer */}
      <footer style={{
        borderTop: "1px solid var(--line)",
        padding: "20px 24px",
        textAlign: "center",
      }}>
        <p style={{
          maxWidth: 720,
          margin: "0 auto",
          fontSize: 12,
          color: "var(--ink-muted)",
          lineHeight: 1.7,
        }}>
          <strong style={{ color: "var(--ink-soft)" }}>Not medical advice.</strong> These tools summarize published guidelines and validated scoring systems for reference use only. Always apply clinical judgment, read primary sources, and individualize care. Verify calculator results before guiding treatment decisions.
        </p>
      </footer>
    </div>
  );
}
