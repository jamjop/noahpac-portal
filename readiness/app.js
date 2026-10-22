(function () {
  const inputs = Array.from(document.querySelectorAll('input[type="checkbox"][data-group]'));
  const plan = document.getElementById('plan');
  const followup = document.getElementById('followup');
  const state = document.getElementById('readiness-state');
  const findingList = document.getElementById('finding-list');
  const copyButton = document.getElementById('copy-summary');
  const resetButton = document.getElementById('reset-workflow');

  const groupNames = {
    context: 'Encounter context',
    medication: 'Medication or treatment effects',
    function: 'Functional considerations',
    completion: 'Completed safeguards',
  };

  function selectedByGroup() {
    return inputs.reduce((groups, input) => {
      if (input.checked) groups[input.dataset.group].push(input.dataset.summary);
      return groups;
    }, { context: [], medication: [], function: [], completion: [] });
  }

  function render() {
    const groups = selectedByGroup();
    const clinicalCount = groups.context.length + groups.medication.length + groups.function.length;
    const selected = inputs.filter((input) => input.checked);

    state.className = 'readiness-state';
    if (clinicalCount > 0) {
      state.classList.add('readiness-state--review');
      state.innerHTML = '<span class="readiness-label">Review indicated</span><strong>Potential duty-impact factors documented</strong><p>Apply current policy and consult the appropriate CMA or local process when indicated. Selection does not determine disposition.</p>';
    } else if (groups.completion.length > 0 || plan.value) {
      state.classList.add('readiness-state--documented');
      state.innerHTML = '<span class="readiness-label">Documentation in progress</span><strong>No potential duty-impact factor was selected</strong><p>This reflects only the boxes completed here and does not establish qualification or fitness.</p>';
    } else {
      state.innerHTML = '<span class="readiness-label">No conclusion</span><strong>Select the facts addressed during this encounter</strong><p>Unchecked fields are not interpreted as normal or absent.</p>';
    }

    findingList.replaceChildren();
    if (!selected.length && !plan.value && !followup.value) {
      const item = document.createElement('li');
      item.textContent = 'No findings selected.';
      findingList.appendChild(item);
      return;
    }
    selected.forEach((input) => {
      const item = document.createElement('li');
      item.textContent = input.dataset.summary;
      findingList.appendChild(item);
    });
    if (plan.value) {
      const item = document.createElement('li');
      item.textContent = `Plan: ${plan.value}`;
      findingList.appendChild(item);
    }
    if (followup.value) {
      const item = document.createElement('li');
      item.textContent = `Follow-up: ${followup.value}`;
      findingList.appendChild(item);
    }
  }

  function summaryText() {
    const groups = selectedByGroup();
    const lines = ['Active-Duty Visit Support', ''];
    Object.entries(groups).forEach(([group, values]) => {
      if (!values.length) return;
      lines.push(`${groupNames[group]}:`);
      values.forEach((value) => lines.push(`- ${value}`));
      lines.push('');
    });
    if (!groups.context.length && !groups.medication.length && !groups.function.length) {
      lines.push('No potential duty-impact factor was selected in this tool. Unchecked items were not interpreted as absent or normal.', '');
    }
    if (plan.value) lines.push(`Documented plan: ${plan.value}`);
    if (followup.value) lines.push(`Follow-up timing: ${followup.value}`);
    if (plan.value || followup.value) lines.push('');
    lines.push('This summary documents selected clinical facts only. It does not determine PRAP qualification, certification, suspension, deployment status, profile requirements, or fitness for a specific duty. Apply current DAF, DoD, DHA, and local guidance and consult the appropriate CMA when indicated.');
    return lines.join('\n');
  }

  async function copySummary() {
    await navigator.clipboard.writeText(summaryText());
    copyButton.textContent = 'Copied';
    copyButton.classList.add('copied');
    window.setTimeout(() => {
      copyButton.textContent = 'Copy documentation summary';
      copyButton.classList.remove('copied');
    }, 1800);
  }

  function reset() {
    inputs.forEach((input) => { input.checked = false; });
    plan.value = '';
    followup.value = '';
    render();
    document.getElementById('context').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  inputs.forEach((input) => input.addEventListener('change', render));
  plan.addEventListener('change', render);
  followup.addEventListener('change', render);
  copyButton.addEventListener('click', () => copySummary().catch(() => {
    copyButton.textContent = 'Copy unavailable';
  }));
  resetButton.addEventListener('click', reset);
  render();
}());
