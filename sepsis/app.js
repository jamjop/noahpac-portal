const segs = ["resp","plt","bili","cv","gcs","cr"];
const sofaVals = {resp:0,plt:0,bili:0,cv:0,gcs:0,cr:0};

function selectSofaValue(id, btn) {
  document.querySelectorAll(`#seg-${id} button`).forEach(b => {
    const active = b === btn;
    b.classList.toggle("active", active);
    b.setAttribute("aria-checked", String(active));
    b.tabIndex = active ? 0 : -1;
  });
  sofaVals[id] = parseInt(btn.dataset.val, 10);
  updateSOFA();
}

segs.forEach(id => {
  const buttons = Array.from(document.querySelectorAll(`#seg-${id} button`));
  buttons.forEach((btn, index) => {
    btn.tabIndex = index === 0 ? 0 : -1;
    btn.addEventListener("click", () => selectSofaValue(id, btn));
    btn.addEventListener("keydown", event => {
      if(!["ArrowRight","ArrowDown","ArrowLeft","ArrowUp","Home","End"].includes(event.key)) return;
      let nextIndex = buttons.indexOf(btn);
      if(event.key === "Home") nextIndex = 0;
      else if(event.key === "End") nextIndex = buttons.length - 1;
      else if(event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (nextIndex + 1) % buttons.length;
      else nextIndex = (nextIndex - 1 + buttons.length) % buttons.length;
      event.preventDefault();
      buttons[nextIndex].focus();
      selectSofaValue(id, buttons[nextIndex]);
    });
  });
});

["q-rr","q-ams","q-sbp"].forEach(id => {
  document.getElementById(id).addEventListener("change", updateQSOFA);
});
["sh-vaso","sh-lac"].forEach(id => {
  document.getElementById(id).addEventListener("change", updateShock);
});

function setSummary(name, value, status, state = "") {
  document.getElementById(`summary-${name}-value`).textContent = value;
  document.getElementById(`summary-${name}-status`).textContent = status;
  const item = document.getElementById(`summary-${name}`);
  item.classList.remove("is-ok", "is-warn", "is-critical");
  if(state) item.classList.add(`is-${state}`);
}

function updateQSOFA() {
  const score = ["q-rr","q-ams","q-sbp"].filter(id => document.getElementById(id).checked).length;
  document.getElementById("qsofa-badge").textContent = `${score} / 3`;
  const el = document.getElementById("qsofa-result");
  if (score === 0) {
    setSummary("qsofa", "0 / 3", "No criteria selected");
    el.className = "result-box"; el.textContent = ""; return;
  }
  if (score >= 2) {
    setSummary("qsofa", `${score} / 3`, "Positive — evaluate further", "warn");
    el.className = "result-box res-warn";
    el.innerHTML = "<strong>qSOFA positive (≥2)</strong> — High risk. Evaluate for sepsis. Assess SOFA score, obtain cultures, and consider early intervention.";
  } else {
    setSummary("qsofa", "1 / 3", "Monitor closely");
    el.className = "result-box res-neutral";
    el.innerHTML = "<strong>qSOFA 1/3</strong> — Monitor closely. Low specificity alone; use clinical judgment.";
  }
}

function updateSOFA() {
  const total = Object.values(sofaVals).reduce((a,b) => a+b, 0);
  document.getElementById("sofa-badge").textContent = total;
  const el = document.getElementById("sofa-result");
  if (total === 0) {
    setSummary("sofa", "0", "Baseline selections");
    el.className = "result-box"; el.textContent = ""; return;
  }
  if (total >= 2) {
    setSummary("sofa", String(total), "Organ dysfunction threshold", "warn");
    el.className = "result-box res-warn";
    el.innerHTML = `<strong>SOFA ${total} — Organ dysfunction</strong><br>SOFA ≥2 with suspected infection meets Sepsis-3 criteria for <em>sepsis</em>. Mortality risk increases ~10% per point above 2. Initiate sepsis bundle: cultures × 2, broad-spectrum antibiotics within 1 hour, 30mL/kg IVF bolus, lactate.`;
  } else {
    setSummary("sofa", String(total), "Below threshold", "ok");
    el.className = "result-box res-ok";
    el.innerHTML = `<strong>SOFA ${total}</strong> — Below organ dysfunction threshold. Continue monitoring.`;
  }
}

function updateShock() {
  const vaso = document.getElementById("sh-vaso").checked;
  const lac  = document.getElementById("sh-lac").checked;
  const el   = document.getElementById("shock-result");
  const count = Number(vaso) + Number(lac);
  if (!vaso && !lac) {
    setSummary("shock", "0 / 2", "Criteria not met");
    el.className = "result-box"; el.textContent = ""; return;
  }
  if (vaso && lac) {
    setSummary("shock", "2 / 2", "Criteria met — escalate", "critical");
    el.className = "result-box res-crit";
    el.innerHTML = "<strong>Septic shock criteria met</strong> — Vasopressors + lactate &gt;2 despite resuscitation. Hospital mortality &gt;40%. Escalate care immediately.";
  } else {
    setSummary("shock", `${count} / 2`, "Confirm remaining criterion", "warn");
    el.className = "result-box res-neutral";
    el.innerHTML = `<strong>${vaso ? "Vasopressors in use" : "Lactate >2"}</strong> — One of two septic shock criteria present. Confirm the other.`;
  }
}

updateQSOFA();
updateSOFA();
updateShock();
