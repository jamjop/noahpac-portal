'use strict';
(() => {
  const page = document.querySelector('.acute-reference');
  const main = document.getElementById('main-content');
  if (!page || !main) return;

  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const title = document.querySelector('h1')?.textContent || 'reference';
  const prefix = slug(title).replace(/-reference$/, '');
  const sections = [...main.querySelectorAll(':scope > section.card')];

  sections.forEach((section, index) => {
    const heading = section.querySelector(':scope > .card-title');
    if (!heading) return;
    const label = heading.textContent.trim();
    section.id = `${prefix}-${slug(label)}`;
    section.classList.add('acute-anchor');
    if (!index) section.dataset.primary = 'true';
  });

  const doseCards = [...main.querySelectorAll('.dose-card')];
  doseCards.forEach(card => {
    if (card instanceof HTMLDetailsElement) return;
    const route = card.querySelector('.dose-route')?.textContent.trim() || 'Reference item';
    const amount = card.querySelector('.dose-amount')?.textContent.trim() || '';
    const details = document.createElement('details');
    details.className = card.className;
    details.id = `${prefix}-item-${slug(route)}`;
    details.classList.add('acute-anchor');
    details.dataset.search = card.textContent.toLowerCase();
    details.innerHTML = `<summary><span class="acute-summary-title">${esc(route)}</span><span class="acute-summary-value">${esc(amount)}</span></summary><div class="acute-detail-body"></div>`;
    const body = details.querySelector('.acute-detail-body');
    card.querySelector('.dose-route')?.remove();
    card.querySelector('.dose-amount')?.remove();
    [...card.childNodes].forEach(node => body.appendChild(node));
    card.replaceWith(details);
  });

  main.querySelectorAll('.legal-item').forEach(item => {
    if (item instanceof HTMLDetailsElement) return;
    const heading = item.querySelector('.legal-head')?.textContent.trim() || 'Reference detail';
    const details = document.createElement('details');
    details.className = item.className;
    details.id = `${prefix}-detail-${slug(heading)}`;
    details.classList.add('acute-anchor');
    details.innerHTML = `<summary><span class="acute-summary-title">${esc(heading)}</span><span class="acute-summary-value">Reference detail</span></summary><div class="acute-detail-body"></div>`;
    const body = details.querySelector('.acute-detail-body');
    item.querySelector('.legal-head')?.remove();
    [...item.childNodes].forEach(node => body.appendChild(node));
    item.replaceWith(details);
  });

  const searchId = `${prefix}-search`;
  const tools = document.createElement('section');
  tools.className = 'acute-tools';
  tools.setAttribute('aria-label', `${title} navigation and search`);
  tools.innerHTML = `<nav class="page-outline acute-section-nav" aria-label="On this page">${sections.map(section => `<a href="#${section.id}" data-section-link="${section.id}">${esc(section.querySelector('.card-title')?.childNodes[0]?.textContent.trim() || 'Section')}</a>`).join('')}</nav><div class="acute-search"><label for="${searchId}">Find an agent, route, or antidote</label><input id="${searchId}" type="search" autocomplete="off" placeholder="Search this reference…"><button type="button">Clear</button><p class="acute-result-summary" role="status" aria-live="polite"></p></div><p class="acute-no-results" hidden>No matching quick-reference items. Clear the search to browse all sections.</p>`;
  const leadingAlert = main.firstElementChild?.matches('.alert-box') ? main.firstElementChild : null;
  leadingAlert ? leadingAlert.insertAdjacentElement('afterend', tools) : main.prepend(tools);

  const search = tools.querySelector('input');
  const clear = tools.querySelector('button');
  const summary = tools.querySelector('.acute-result-summary');
  const empty = tools.querySelector('.acute-no-results');
  const searchable = [...main.querySelectorAll('details.dose-card')];
  const applySearch = () => {
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    searchable.forEach(card => {
      const match = !query || card.dataset.search.includes(query);
      card.hidden = !match;
      if (match) {
        shown += 1;
        if (query) card.open = true;
      }
    });
    summary.textContent = query ? `${shown} of ${searchable.length} quick-reference items shown` : `${searchable.length} quick-reference items`;
    empty.hidden = shown !== 0;
  };
  search.addEventListener('input', applySearch);
  clear.addEventListener('click', () => { search.value = ''; applySearch(); search.focus(); });
  applySearch();

  main.querySelectorAll('details.acute-anchor').forEach(details => details.addEventListener('toggle', () => {
    if (details.open) history.replaceState(null, '', `#${details.id}`);
  }));
  const openHash = () => {
    const target = document.getElementById(location.hash.slice(1));
    if (target instanceof HTMLDetailsElement) target.open = true;
    if (target) requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
  };
  openHash();
  window.addEventListener('hashchange', openHash);

  const sectionLinks = [...tools.querySelectorAll('[data-section-link]')];
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    sectionLinks.forEach(link => link.setAttribute('aria-current', String(link.dataset.sectionLink === visible.target.id)));
    const active = sectionLinks.find(link => link.getAttribute('aria-current') === 'true');
    active?.scrollIntoView({block:'nearest', inline:'center'});
  }, {rootMargin:'-30% 0px -60%', threshold:[0,.25,.5]});
  sections.forEach(section => observer.observe(section));
})();
