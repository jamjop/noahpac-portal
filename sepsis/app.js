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
["s-temp","s-hr","s-resp","s-wbc"].forEach(id => {
  document.getElementById(id).addEventListener("change", updateSIRS);
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

function updateSIRS() {
  const score = ["s-temp","s-hr","s-resp","s-wbc"].filter(id => document.getElementById(id).checked).length;
  document.getElementById("sirs-badge").textContent = `${score} / 4`;
  const el = document.getElementById("sirs-result");
  if (score === 0) {
    setSummary("sirs", "0 / 4", "No criteria selected");
    el.className = "result-box"; el.textContent = ""; return;
  }
  if (score >= 2) {
    setSummary("sirs", `${score} / 4`, "Positive — assess suspected infection", "warn");
    el.className = "result-box res-warn";
    el.innerHTML = `<strong>SIRS ${score}/4</strong> — Screen positive. This is sensitive but nonspecific; assess for infection, organ dysfunction, alternative causes, and clinical trajectory.`;
  } else {
    setSummary("sirs", "1 / 4", "Below threshold");
    el.className = "result-box res-neutral";
    el.innerHTML = "<strong>SIRS 1/4</strong> — Below the traditional screening threshold. A negative score does not exclude sepsis.";
  }
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
    el.innerHTML = "<strong>qSOFA positive (≥2)</strong> — Higher risk of poor outcome. Evaluate urgently for infection and organ dysfunction, but do not use qSOFA as the sole sepsis screen.";
  } else {
    setSummary("qsofa", "1 / 3", "Monitor closely");
    el.className = "result-box res-neutral";
    el.innerHTML = "<strong>qSOFA 1/3</strong> — A lower score does not exclude sepsis. Use SIRS, NEWS/NEWS2, or MEWS for screening and apply clinical judgment.";
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
    el.innerHTML = `<strong>SOFA ${total} — Organ dysfunction</strong><br>A SOFA increase of ≥2 from baseline with suspected infection supports the Sepsis-3 definition. Begin immediate clinical evaluation and treatment according to infection likelihood, shock status, source, and local protocol.`;
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

updateSIRS();
updateQSOFA();
updateSOFA();
updateShock();
