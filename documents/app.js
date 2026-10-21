(function () {
  var input = document.getElementById('doc-search');
  if (!input) return;

  var noResults = document.getElementById('no-results');
  var grid = document.getElementById('tools-grid');
  var external = document.getElementById('ext-refs');
  var count = document.getElementById('doc-count');
  var clear = document.getElementById('doc-clear');
  var categoryNav = document.getElementById('document-categories');

  function slug(value) {
    return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  var resourceIcons = {
    'Shoulder — General Program': 'biceps-flexed',
    'Shoulder Impingement Syndrome': 'bone',
    'Post-Op Shoulder Rehabilitation Protocol': 'hospital',
    'Rotator Cuff & Shoulder Conditioning': 'rotate-cw',
    'Cubital Tunnel Syndrome': 'bone',
    "De Quervain's Tenosynovitis": 'hand',
    'Wrist Tendinopathy': 'hand',
    'Carpal Tunnel Syndrome': 'hand',
    "Epicondylitis — Tennis/Golfer's Elbow": 'dumbbell',
    'Radial Tunnel Syndrome': 'bone',
    'Low Back — General Program': 'person-standing',
    'Lumbar Core Strengthening (Princeton)': 'dumbbell',
    'Sacroiliac Joint Pain': 'bone',
    'Knee — General Program': 'person-standing',
    'Patellofemoral Pain Syndrome': 'circle-dot',
    'Patellar Tendinitis': 'biceps-flexed',
    'IT Band Syndrome': 'move-diagonal-2',
    'Ankle — General Program': 'footprints',
    'Ankle Sprain Rehab': 'footprints',
    'Plantar Fasciitis — Option 1': 'footprints',
    'Plantar Fasciitis — Option 2': 'footprints',
    'Shin Splints (MTSS)': 'bone',
    'Neck — General Program': 'person-standing',
    'Neck Pain — General': 'bone',
    'Hamstring Strain': 'biceps-flexed',
    'Epley Maneuver (BPPV)': 'move-3d',
    'Epley Maneuver — Foster Method (BPPV)': 'rotate-cw',
    'Asthma Control Test': 'wind',
    'PHQ-9': 'brain',
    'GAD-7': 'brain-circuit',
    'STOP-BANG Questionnaire': 'moon',
    'Epworth Sleepiness Scale': 'bed'
  };

  function resourceIcon(row) {
    var title = row.querySelector('.tool-name,.ext-name');
    if (!title) return 'file-text';
    var publisherBadge = title.querySelector('.ext-badge');
    var publisherText = publisherBadge ? publisherBadge.textContent : '';
    var name = title.textContent.replace(publisherText, '').trim();
    return resourceIcons[name] || (row.classList.contains('ext-row') ? 'clipboard-check' : 'file-text');
  }

  function addResourceKind(row) {
    var url = new URL(row.href, location.href);
    var externalLink = url.origin !== location.origin;
    var pdf = /\.pdf$/i.test(url.pathname);
    var publisher = '';
    var publisherBadge = row.querySelector('.ext-badge');
    if (publisherBadge) {
      publisher = publisherBadge.textContent.replace('↗', '').trim();
      publisherBadge.remove();
    }
    var label = document.createElement('span');
    label.className = 'document-kind';
    label.textContent = externalLink
      ? (pdf ? 'External PDF' : 'Publisher website') + (publisher ? ' · ' + publisher : '')
      : 'PDF · Hosted locally';
    var leadingIcon = row.querySelector('[data-lucide]');
    if (leadingIcon) leadingIcon.setAttribute('data-lucide', resourceIcon(row));
    if (row.classList.contains('ext-row')) {
      row.querySelector('.ext-body').appendChild(label);
      var existingAction = row.querySelector('.ext-arrow');
      if (existingAction) existingAction.classList.add('document-action');
      return;
    }
    var name = row.querySelector('.tool-name');
    var body = document.createElement('span');
    body.className = 'document-row__body';
    row.insertBefore(body, name);
    body.append(name, label);
    var action = document.createElement('span');
    action.className = 'document-action';
    action.setAttribute('aria-hidden', 'true');
    action.innerHTML = '<i data-lucide="' + (externalLink ? 'external-link' : 'file-down') + '"></i>';
    row.appendChild(action);
  }

  var navLinks = [];
  document.querySelectorAll('.category-col').forEach(function (section) {
    var heading = section.querySelector('.cat-heading');
    var title = heading.textContent.trim();
    var total = section.querySelectorAll('.tool-row').length;
    section.id = 'documents-' + slug(title);
    var headingCount = document.createElement('span');
    headingCount.className = 'category-count';
    headingCount.textContent = String(total);
    headingCount.setAttribute('aria-label', total + ' resources');
    heading.appendChild(headingCount);
    navLinks.push({ href: '#' + section.id, label: title });
  });

  var externalHeading = external.querySelector('.cat-heading');
  var externalTotal = external.querySelectorAll('.ext-row').length;
  var externalCount = document.createElement('span');
  externalCount.className = 'category-count';
  externalCount.textContent = String(externalTotal);
  externalCount.setAttribute('aria-label', externalTotal + ' resources');
  externalHeading.appendChild(externalCount);
  navLinks.push({ href: '#ext-refs', label: 'Screening forms' });
  categoryNav.innerHTML = navLinks.map(function (item) { return '<a href="' + item.href + '">' + item.label + '</a>'; }).join('');

  document.querySelectorAll('.tool-row,.ext-row').forEach(addResourceKind);
  lucide.createIcons();

  function filterDocuments() {
    var q = input.value.trim().toLowerCase();
    var rows = document.querySelectorAll('.tool-row');
    var externalRows = document.querySelectorAll('.ext-row');
    var cols = document.querySelectorAll('.category-col');
    var visible = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.tool-row,.ext-row'), function (r) {
      var text = (r.dataset.search || '') + ' ' + r.textContent;
      var match = !q || text.toLowerCase().includes(q);
      r.classList.toggle('hidden-tool', !match);
      if (match) visible += 1;
    });

    cols.forEach(function (col) {
      var hasVisible = Array.prototype.some.call(
        col.querySelectorAll('.tool-row'),
        function (r) { return !r.classList.contains('hidden-tool'); }
      );
      col.style.display = hasVisible ? '' : 'none';
    });

    var localVisible = Array.prototype.some.call(rows, function (r) { return !r.classList.contains('hidden-tool'); });
    var externalVisible = Array.prototype.some.call(externalRows, function (r) { return !r.classList.contains('hidden-tool'); });
    noResults.style.display = visible ? 'none' : 'block';
    grid.style.display = localVisible ? '' : 'none';
    external.style.display = externalVisible ? '' : 'none';
    count.textContent = q ? visible + ' match' + (visible === 1 ? '' : 'es') : (rows.length + externalRows.length) + ' resources';
    clear.hidden = !q;
    var params = new URLSearchParams();
    if (input.value.trim()) params.set('q', input.value.trim());
    history.replaceState(null, '', location.pathname + (params.size ? '?' + params.toString() : ''));
  }

  input.value = new URLSearchParams(location.search).get('q') || '';
  input.addEventListener('input', filterDocuments);
  clear.addEventListener('click', function () { input.value = ''; filterDocuments(); input.focus(); });
  filterDocuments();
})();
