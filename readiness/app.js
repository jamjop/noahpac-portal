(function () {
  const workflowKeys = ['visit', 'pha', 'sleep', 'function'];
  const tabs = Array.from(document.querySelectorAll('[data-workflow-target]'));
  const panels = new Map(workflowKeys.map((key) => [key, document.querySelector(`[data-workflow-panel="${key}"]`)]));

  const configs = {
    visit: {
      idleLabel: 'No conclusion', idleTitle: 'Select the facts addressed during this encounter',
      idleText: 'Unchecked fields are not interpreted as normal or absent.',
      activeLabel: 'Review indicated', activeTitle: 'Potential duty-impact factors documented',
      activeText: 'Apply current policy and consult the appropriate CMA or local process when indicated. Selection does not determine disposition.',
      disclaimer: 'This summary documents selected clinical facts only. It does not determine PRAP qualification, certification, suspension, deployment status, profile requirements, or fitness for a specific duty.',
      hasActive: (panel) => panel.querySelectorAll('input[data-summary]:checked:not([data-group="Completed safeguards"])').length > 0,
    },
    pha: {
      idleLabel: 'Review not started', idleTitle: 'Select the domains verified during this encounter',
      idleText: 'Blank domains remain unreviewed and are not interpreted as current.',
      activeLabel: 'Follow-up identified', activeTitle: 'One or more readiness domains need follow-up',
      activeText: 'Resolve findings through the authorized clinical and readiness processes; this companion is not the official PHA record.',
      progressLabel: 'Review in progress', progressTitle: 'PHA / IMR domains documented',
      progressText: 'Complete remaining required elements and record the final assessment in the authorized system.',
      disclaimer: 'This companion does not complete a PHA, update ASIMS, establish IMR status, or determine duty or deployment eligibility.',
      hasActive: (panel) => Array.from(panel.querySelectorAll('select[data-domain]')).some((field) => field.value === 'Follow-up needed'),
    },
    sleep: {
      idleLabel: 'No conclusion', idleTitle: 'Select the sleep findings addressed during this encounter',
      idleText: 'Unchecked findings are not interpreted as absent and no diagnosis is assigned.',
      urgentLabel: 'Prompt safety review', urgentTitle: 'A selected concern may affect immediate safety',
      urgentText: 'Perform an individualized assessment and use the appropriate urgent, emergency, behavioral-health, and duty-safety pathways.',
      activeLabel: 'Focused assessment', activeTitle: 'Sleep or fatigue concerns documented',
      activeText: 'Clarify sleep opportunity, impairment, contributors, validated screening, and the appropriate diagnostic or treatment pathway.',
      disclaimer: 'This summary does not diagnose insomnia, OSA, a circadian disorder, or fitness for duty. Screening scores and selected concerns require clinical interpretation.',
      hasUrgent: (panel) => panel.querySelectorAll('input[data-priority="urgent"]:checked').length > 0,
      hasActive: (panel) => panel.querySelectorAll('input[data-summary]:checked').length > 0,
    },
    function: {
      idleLabel: 'No conclusion', idleTitle: 'Select only limitations supported by the encounter',
      idleText: 'An unchecked domain is not interpreted as unrestricted or unaffected.',
      activeLabel: 'Limitations documented', activeTitle: 'Functional limitation domains selected',
      activeText: 'Translate the supported limitations into timely, specific, unambiguous wording in the authorized record and apply current policy.',
      disclaimer: 'This helper does not create an AF Form 469, select a profile, establish qualification, or determine PRAP, deployment, or duty status.',
      hasActive: (panel) => panel.querySelectorAll('input[data-group="Functional limitations"]:checked').length > 0,
    },
  };

  function selectedItems(panel) {
    const groups = new Map();
    panel.querySelectorAll('input[data-summary]:checked').forEach((input) => {
      const group = input.dataset.group || 'Selected findings';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(input.dataset.summary);
    });
    panel.querySelectorAll('[data-summary-label]').forEach((field) => {
      if (!field.value) return;
      const group = field.closest('.domain-grid') ? 'Readiness domain status' : 'Plan and timing';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(`${field.dataset.summaryLabel}: ${field.value}`);
    });
    return groups;
  }

  function hasSelections(panel) {
    return panel.querySelector('input[data-summary]:checked') || Array.from(panel.querySelectorAll('[data-summary-label]')).some((field) => field.value);
  }

  function summaryIds(key) {
    return key === 'visit'
      ? { state: 'readiness-state', list: 'finding-list', copy: 'copy-summary', reset: 'reset-workflow' }
      : { state: `${key}-state`, list: `${key}-finding-list`, copy: `${key}-copy-summary`, reset: `${key}-reset-workflow` };
  }

  function createSummary(panel, key) {
    const ids = summaryIds(key);
    panel.querySelector('[data-summary-panel]').innerHTML = `
      <section class="summary-panel">
        <p class="summary-eyebrow">Documentation support</p>
        <div class="readiness-state" id="${ids.state}" data-state role="status" aria-live="polite"></div>
        <div class="summary-findings"><h2>Selected findings</h2><ul id="${ids.list}" data-finding-list></ul></div>
        <div class="summary-actions">
          <button id="${ids.copy}" data-copy-summary type="button">Copy documentation summary</button>
          <button id="${ids.reset}" data-reset-workflow class="secondary" type="button">Reset</button>
        </div>
        <p class="summary-caution">${configs[key].disclaimer}</p>
      </section>`;
  }

  function render(panel, key) {
    const config = configs[key];
    const state = panel.querySelector('[data-state]');
    const list = panel.querySelector('[data-finding-list]');
    const groups = selectedItems(panel);
    const any = hasSelections(panel);
    state.className = 'readiness-state';

    if (config.hasUrgent?.(panel)) {
      state.classList.add('readiness-state--urgent');
      state.innerHTML = `<span class="readiness-label">${config.urgentLabel}</span><strong>${config.urgentTitle}</strong><p>${config.urgentText}</p>`;
    } else if (config.hasActive(panel)) {
      state.classList.add('readiness-state--review');
      state.innerHTML = `<span class="readiness-label">${config.activeLabel}</span><strong>${config.activeTitle}</strong><p>${config.activeText}</p>`;
    } else if (any) {
      state.classList.add('readiness-state--documented');
      state.innerHTML = `<span class="readiness-label">${config.progressLabel || 'Documentation in progress'}</span><strong>${config.progressTitle || 'Selected encounter elements documented'}</strong><p>${config.progressText || 'This reflects only completed selections and does not establish qualification or fitness.'}</p>`;
    } else {
      state.innerHTML = `<span class="readiness-label">${config.idleLabel}</span><strong>${config.idleTitle}</strong><p>${config.idleText}</p>`;
    }

    list.replaceChildren();
    if (!groups.size) {
      const item = document.createElement('li');
      item.textContent = 'No findings selected.';
      list.appendChild(item);
      return;
    }
    groups.forEach((values, group) => {
      values.forEach((value) => {
        const item = document.createElement('li');
        item.textContent = `${group}: ${value}`;
        list.appendChild(item);
      });
    });
  }

  function summaryText(panel, key) {
    const groups = selectedItems(panel);
    const lines = [panel.dataset.title, ''];
    if (!groups.size) lines.push('No findings selected. Blank or unchecked fields were not interpreted as absent, normal, or current.', '');
    groups.forEach((values, group) => {
      lines.push(`${group}:`);
      values.forEach((value) => lines.push(`- ${value}`));
      lines.push('');
    });
    lines.push(configs[key].disclaimer);
    lines.push('Use current DAF, DoD, DHA, VA/DoD CPG, and local guidance and the appropriate authorized system.');
    return lines.join('\n');
  }

  async function copySummary(panel, key) {
    const button = panel.querySelector('[data-copy-summary]');
    await navigator.clipboard.writeText(summaryText(panel, key));
    button.textContent = 'Copied';
    button.classList.add('copied');
    window.setTimeout(() => {
      button.textContent = 'Copy documentation summary';
      button.classList.remove('copied');
    }, 1800);
  }

  function resetPanel(panel, key) {
    panel.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
    panel.querySelectorAll('select').forEach((select) => { select.selectedIndex = 0; });
    render(panel, key);
    panel.querySelector('.workflow-intro').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function switchWorkflow(key, updateUrl = true, moveFocus = false) {
    const safeKey = workflowKeys.includes(key) ? key : 'visit';
    panels.forEach((panel, panelKey) => { panel.hidden = panelKey !== safeKey; });
    tabs.forEach((tab) => {
      const selected = tab.dataset.workflowTarget === safeKey;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    document.querySelector('.skip-link').href = `#panel-${safeKey}`;
    if (updateUrl) {
      const url = new URL(window.location.href);
      if (safeKey === 'visit') url.searchParams.delete('workflow');
      else url.searchParams.set('workflow', safeKey);
      history.replaceState({ workflow: safeKey }, '', `${url.pathname}${url.search}${url.hash}`);
    }
    if (moveFocus) panels.get(safeKey).querySelector('.workflow-intro h2').focus({ preventScroll: true });
  }

  panels.forEach((panel, key) => {
    createSummary(panel, key);
    panel.querySelectorAll('input, select').forEach((control) => control.addEventListener('change', () => render(panel, key)));
    panel.querySelector('[data-copy-summary]').addEventListener('click', () => copySummary(panel, key).catch(() => {
      panel.querySelector('[data-copy-summary]').textContent = 'Copy unavailable';
    }));
    panel.querySelector('[data-reset-workflow]').addEventListener('click', () => resetPanel(panel, key));
    render(panel, key);
  });

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => switchWorkflow(tab.dataset.workflowTarget));
    tab.addEventListener('keydown', (event) => {
      let target = null;
      if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
      if (event.key === 'ArrowLeft') target = tabs[(index - 1 + tabs.length) % tabs.length];
      if (event.key === 'Home') target = tabs[0];
      if (event.key === 'End') target = tabs[tabs.length - 1];
      if (!target) return;
      event.preventDefault();
      target.focus();
      switchWorkflow(target.dataset.workflowTarget);
    });
  });

  document.querySelectorAll('[data-open-workflow]').forEach((button) => button.addEventListener('click', () => {
    switchWorkflow(button.dataset.openWorkflow);
    document.querySelector(`[data-workflow-target="${button.dataset.openWorkflow}"]`).focus();
    window.scrollTo({ top: document.querySelector('.workflow-nav').offsetTop, behavior: 'smooth' });
  }));

  window.addEventListener('popstate', () => switchWorkflow(new URLSearchParams(window.location.search).get('workflow') || 'visit', false));
  switchWorkflow(new URLSearchParams(window.location.search).get('workflow') || 'visit', false);
}());
