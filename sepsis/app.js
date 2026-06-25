const segs = ["resp","plt","bili","cv","gcs","cr"];
const sofaVals = {resp:0,plt:0,bili:0,cv:0,gcs:0,cr:0};

segs.forEach(id => {
  document.querySelectorAll(`#seg-${id} button`).forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(`#seg-${id} button`).forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      sofaVals[id] = parseInt(btn.dataset.val);
      updateSOFA();
    });
  });
});

["q-rr","q-ams","q-sbp"].forEach(id => {
  document.getElementById(id).addEventListener("change", updateQSOFA);
});
["sh-vaso","sh-lac"].forEach(id => {
  document.getElementById(id).addEventListener("change", updateShock);
});

function updateQSOFA() {
  const score = ["q-rr","q-ams","q-sbp"].filter(id => document.getElementById(id).checked).length;
  document.getElementById("qsofa-badge").textContent = `${score} / 3`;
  const el = document.getElementById("qsofa-result");
  if (score === 0) { el.className = "result-box"; el.textContent = ""; return; }
  if (score >= 2) {
    el.className = "result-box res-warn";
    el.innerHTML = "<strong>qSOFA positive (≥2)</strong> — High risk. Evaluate for sepsis. Assess SOFA score, obtain cultures, and consider early intervention.";
  } else {
    el.className = "result-box res-neutral";
    el.innerHTML = "<strong>qSOFA 1/3</strong> — Monitor closely. Low specificity alone; use clinical judgment.";
  }
}

function updateSOFA() {
  const total = Object.values(sofaVals).reduce((a,b) => a+b, 0);
  document.getElementById("sofa-badge").textContent = total;
  const el = document.getElementById("sofa-result");
  if (total === 0) { el.className = "result-box"; el.textContent = ""; return; }
  if (total >= 2) {
    el.className = "result-box res-warn";
    el.innerHTML = `<strong>SOFA ${total} — Organ dysfunction</strong><br>SOFA ≥2 with suspected infection meets Sepsis-3 criteria for <em>sepsis</em>. Mortality risk increases ~10% per point above 2. Initiate sepsis bundle: cultures × 2, broad-spectrum antibiotics within 1 hour, 30mL/kg IVF bolus, lactate.`;
  } else {
    el.className = "result-box res-ok";
    el.innerHTML = `<strong>SOFA ${total}</strong> — Below organ dysfunction threshold. Continue monitoring.`;
  }
}

function updateShock() {
  const vaso = document.getElementById("sh-vaso").checked;
  const lac  = document.getElementById("sh-lac").checked;
  const el   = document.getElementById("shock-result");
  if (!vaso && !lac) { el.className = "result-box"; el.textContent = ""; return; }
  if (vaso && lac) {
    el.className = "result-box res-crit";
    el.innerHTML = "<strong>Septic shock criteria met</strong> — Vasopressors + lactate &gt;2 despite resuscitation. Hospital mortality &gt;40%. Escalate care immediately.";
  } else {
    el.className = "result-box res-neutral";
    el.innerHTML = `<strong>${vaso ? "Vasopressors in use" : "Lactate >2"}</strong> — One of two septic shock criteria present. Confirm the other.`;
  }
}

updateQSOFA();
updateSOFA();
