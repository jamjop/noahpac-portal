let woundType = "clean";
let vaxStatus  = "unknown";

document.querySelectorAll("#wound-grid .opt-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#wound-grid .opt-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    woundType = btn.dataset.wound;
    render();
  });
});
document.querySelectorAll("#vax-grid .opt-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#vax-grid .opt-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    vaxStatus = btn.dataset.vax;
    render();
  });
});

function rec() {
  // ACIP tetanus prophylaxis table
  const prone = woundType === "prone";
  switch (vaxStatus) {
    case "unknown":
      return {
        vaccine: true, tig: prone,
        text: prone
          ? "Administer <strong>Tdap or Td</strong> + <strong>TIG 250 units IM</strong> (separate sites). Tdap preferred if patient has never received it."
          : "Administer <strong>Tdap or Td</strong>. Tdap preferred if patient has never received it. No TIG needed for clean minor wounds."
      };
    case "recent":
      return {
        vaccine: false, tig: false,
        text: "No tetanus prophylaxis needed. Last booster &lt;5 years ago — adequate protection for all wound types."
      };
    case "mid":
      return {
        vaccine: prone, tig: false,
        text: prone
          ? "Administer <strong>Tdap or Td</strong> booster. Last dose 5–10 years ago; tetanus-prone wound warrants a booster. No TIG needed."
          : "No tetanus prophylaxis needed. Last booster &lt;10 years ago — adequate for clean minor wounds."
      };
    case "old":
      return {
        vaccine: true, tig: false,
        text: "Administer <strong>Tdap or Td</strong> booster. Last dose &gt;10 years ago — booster indicated for all wound types. Tdap preferred if never received. No TIG needed."
      };
  }
}

function render() {
  const r = rec();
  const prone = woundType === "prone";

  let pills = "";
  if (r.vaccine) pills += `<span class="pill pill-warn">Tdap / Td</span>`;
  if (r.tig)     pills += `<span class="pill pill-crit">TIG 250 units IM</span>`;
  if (!r.vaccine && !r.tig) pills = `<span class="pill pill-ok">No prophylaxis needed</span>`;

  document.getElementById("rec-output").innerHTML = `
    <div class="rec-pills">${pills}</div>
    <p class="rec-text">${r.text}</p>
    <div class="rec-context">
      <span class="ctx-tag">${prone ? "Tetanus-prone wound" : "Clean / minor wound"}</span>
      <span class="ctx-tag">${{unknown:"Unknown / &lt;3 doses",recent:"≥3 doses, last &lt;5 yrs",mid:"≥3 doses, last 5–10 yrs",old:"≥3 doses, last &gt;10 yrs"}[vaxStatus]}</span>
    </div>
  `;
}

render();
