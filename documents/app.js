(function () {
  'use strict';

  var input = document.getElementById('doc-search');
  if (!input) return;

  var noResults = document.getElementById('no-results');
  var grid = document.getElementById('tools-grid');
  var external = document.getElementById('ext-refs');
  var count = document.getElementById('doc-count');
  var clear = document.getElementById('doc-clear');
  var collectionNav = document.getElementById('document-categories');
  var collectionSelect = document.getElementById('collection-select');
  var libraryTitle = document.getElementById('library-title');
  var libraryDescription = document.getElementById('library-description');
  var quickAccess = document.getElementById('quick-access');
  var searchResults = document.getElementById('search-results');
  var catalogContent = document.getElementById('catalog-content');
  var subcategoryNav = document.getElementById('subcategory-nav');

  var FAVORITES_KEY = 'noahpac.documentFavorites';
  var RECENTS_KEY = 'noahpac.documentRecent';
  var COLLECTION_KEY = 'noahpac.documentCollection';

  var collections = [
    { id: 'quick', label: 'Quick access', icon: 'sparkles', title: 'Quick access', description: 'Commonly used resources, favorites, and recently opened documents.' },
    { id: 'screening', label: 'Screening & forms', icon: 'clipboard-check', title: 'Screening & assessment forms', description: 'Printable screening and assessment instruments from their original publishers.' },
    { id: 'medication', label: 'Medication education', icon: 'pill', title: 'Medication education', description: 'Patient-facing medication counseling and quick-reference handouts.' },
    { id: 'musculoskeletal', label: 'Musculoskeletal', icon: 'bone', title: 'Musculoskeletal handouts', description: 'Exercise programs, rehabilitation protocols, and condition-specific patient handouts.' },
    { id: 'other', label: 'Vestibular', icon: 'rotate-cw', title: 'Vestibular instructions', description: 'Patient instructions for positional vertigo maneuvers.' },
    { id: 'all', label: 'All documents', icon: 'library', title: 'All documents', description: 'Browse the complete clinical document library.' }
  ];

  var resourceIcons = {
    'GLP-1 Receptor Agonist Patient Education': 'syringe',
    'Long-Term PPI Use: Benefits & Risks': 'pill',
    'PPI Quick Guide': 'clipboard-list',
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
    'Plantar Fasciitis Overview (OrthoInfo)': 'footprints',
    'Plantar Fasciitis Home Exercise Program (OrthoIndy)': 'footprints',
    'Shin Splints (MTSS)': 'bone',
    'Neck Home Exercise Program (USAF / MedBridge)': 'user-round',
    'Neck Pain Patient Guide': 'user-round',
    'Hamstring Strain': 'biceps-flexed',
    'Self-Treatment Epley Maneuver': 'move-3d',
    'Half Somersault (Foster Method) for BPPV': 'rotate-cw',
    'Asthma Control Test': 'wind',
    'PHQ-9': 'brain',
    'GAD-7': 'brain-circuit',
    'STOP-BANG Questionnaire': 'moon',
    'Epworth Sleepiness Scale': 'bed'
  };

  function slug(value) {
    return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function readList(key) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function writeList(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function collectionForCategory(title) {
    if (title === 'Medication Education') return 'medication';
    if (title === 'Vestibular') return 'other';
    if (title === 'Screening & Assessment Forms') return 'screening';
    return 'musculoskeletal';
  }

  function purposeFor(title, collection) {
    if (collection === 'screening') return 'Screening form';
    if (collection === 'medication') return 'Patient education';
    if (/post-op|rehabilitation protocol/i.test(title)) return 'Rehabilitation protocol';
    if (/epley|somersault/i.test(title)) return 'Patient instruction';
    return 'Exercise handout';
  }

  var categorySections = [];
  document.querySelectorAll('.category-col').forEach(function (section) {
    var heading = section.querySelector('.cat-heading');
    var title = heading.textContent.trim();
    var total = section.querySelectorAll('.tool-row').length;
    var collection = collectionForCategory(title);
    section.id = 'documents-' + slug(title);
    section.dataset.category = slug(title);
    section.dataset.collection = collection;
    var headingCount = document.createElement('span');
    headingCount.className = 'category-count';
    headingCount.textContent = String(total);
    headingCount.setAttribute('aria-label', total + ' resources');
    heading.appendChild(headingCount);
    categorySections.push({ element: section, title: title, id: section.dataset.category, collection: collection });
  });

  var externalHeading = external.querySelector('.cat-heading');
  var externalTitle = externalHeading.textContent.trim();
  var externalTotal = external.querySelectorAll('.ext-row').length;
  external.dataset.category = 'screening-forms';
  external.dataset.collection = 'screening';
  var externalCount = document.createElement('span');
  externalCount.className = 'category-count';
  externalCount.textContent = String(externalTotal);
  externalCount.setAttribute('aria-label', externalTotal + ' resources');
  externalHeading.appendChild(externalCount);
  categorySections.push({ element: external, title: externalTitle, id: 'screening-forms', collection: 'screening' });

  var resources = [];

  function titleForRow(row) {
    var title = row.querySelector('.tool-name,.ext-name');
    if (!title) return '';
    var publisherBadge = title.querySelector('.ext-badge');
    var publisherText = publisherBadge ? publisherBadge.textContent : '';
    return title.textContent.replace(publisherText, '').trim();
  }

  function enhanceResource(row, section) {
    var title = titleForRow(row);
    var id = slug(title);
    var collection = section.dataset.collection;
    var purpose = purposeFor(title, collection);
    var url = new URL(row.href, location.href);
    var externalLink = url.origin !== location.origin;
    var publisher = '';
    var publisherBadge = row.querySelector('.ext-badge');
    if (publisherBadge) {
      publisher = publisherBadge.textContent.replace('↗', '').trim();
      publisherBadge.remove();
    }

    var kind = purpose;
    if (publisher) kind += ' · ' + publisher;
    else if (externalLink) kind += ' · External';

    var leadingIcon = row.querySelector('[data-lucide]');
    var icon = resourceIcons[title] || (collection === 'screening' ? 'clipboard-check' : 'file-text');
    if (leadingIcon) leadingIcon.setAttribute('data-lucide', icon);

    var kindLabel = document.createElement('span');
    kindLabel.className = 'document-kind';
    kindLabel.textContent = kind;
    if (row.classList.contains('ext-row')) {
      row.querySelector('.ext-body').appendChild(kindLabel);
    } else {
      var name = row.querySelector('.tool-name');
      var body = document.createElement('span');
      body.className = 'document-row__body';
      row.insertBefore(body, name);
      body.append(name, kindLabel);
    }

    row.dataset.docId = id;
    row.dataset.collection = collection;
    row.dataset.category = section.dataset.category;

    var item = row.parentElement;
    if (!item || item.tagName !== 'LI') {
      var wrapper = document.createElement('div');
      wrapper.className = 'document-item';
      row.parentNode.insertBefore(wrapper, row);
      wrapper.appendChild(row);
      item = wrapper;
    } else {
      item.classList.add('document-item');
    }

    var favoriteButton = document.createElement('button');
    favoriteButton.className = 'favorite-button';
    favoriteButton.type = 'button';
    favoriteButton.dataset.favoriteId = id;
    favoriteButton.innerHTML = '<i data-lucide="star" aria-hidden="true"></i>';
    item.appendChild(favoriteButton);

    var categoryTitle = section.querySelector('.cat-heading').childNodes[0].textContent.trim();
    var resource = {
      id: id,
      title: title,
      href: row.getAttribute('href'),
      icon: icon,
      purpose: purpose,
      kind: kind,
      category: categoryTitle,
      categoryId: section.dataset.category,
      collection: collection,
      search: ((row.dataset.search || '') + ' ' + title + ' ' + kind + ' ' + categoryTitle).toLowerCase(),
      external: externalLink,
      row: row,
      item: item
    };
    resources.push(resource);
    row.addEventListener('click', function () { recordRecent(id); });
  }

  categorySections.forEach(function (category) {
    category.element.querySelectorAll('.tool-row,.ext-row').forEach(function (row) { enhanceResource(row, category.element); });
  });

  function resourceById(id) {
    return resources.find(function (resource) { return resource.id === id; });
  }

  function favoriteIds() { return readList(FAVORITES_KEY).filter(function (id) { return !!resourceById(id); }); }
  function recentIds() { return readList(RECENTS_KEY).filter(function (id) { return !!resourceById(id); }); }

  function updateFavoriteButtons() {
    var favorites = favoriteIds();
    document.querySelectorAll('[data-favorite-id]').forEach(function (button) {
      var resource = resourceById(button.dataset.favoriteId);
      if (!resource) return;
      var selected = favorites.includes(resource.id);
      button.classList.toggle('is-favorite', selected);
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', (selected ? 'Remove ' : 'Add ') + resource.title + (selected ? ' from favorites' : ' to favorites'));
      button.title = selected ? 'Remove from favorites' : 'Add to favorites';
    });
  }

  function toggleFavorite(id) {
    var favorites = favoriteIds();
    var index = favorites.indexOf(id);
    if (index === -1) favorites.unshift(id);
    else favorites.splice(index, 1);
    writeList(FAVORITES_KEY, favorites.slice(0, 20));
    updateFavoriteButtons();
    renderQuickAccess();
  }

  function recordRecent(id) {
    var recents = recentIds().filter(function (value) { return value !== id; });
    recents.unshift(id);
    writeList(RECENTS_KEY, recents.slice(0, 6));
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-favorite-id]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(button.dataset.favoriteId);
  });

  function resourceCard(resource, includeCategory) {
    var wrapper = document.createElement('div');
    wrapper.className = 'resource-card';
    var categoryText = includeCategory ? ' · ' + resource.category : '';
    wrapper.innerHTML = '<a href="' + escapeHtml(resource.href) + '" target="_blank" rel="noopener" data-quick-id="' + escapeHtml(resource.id) + '">' +
      '<span class="resource-card__icon"><i data-lucide="' + escapeHtml(resource.icon) + '" aria-hidden="true"></i></span>' +
      '<span class="resource-card__body"><strong>' + escapeHtml(resource.title) + '</strong><small>' + escapeHtml(resource.purpose + categoryText) + '</small></span>' +
      '</a><button class="favorite-button" type="button" data-favorite-id="' + escapeHtml(resource.id) + '"><i data-lucide="star" aria-hidden="true"></i></button>';
    wrapper.querySelector('a').addEventListener('click', function () { recordRecent(resource.id); });
    return wrapper;
  }

  function renderResourceSection(container, heading, list, includeCategory) {
    if (!list.length) return;
    var section = document.createElement('section');
    section.className = 'resource-section';
    var title = document.createElement('h3');
    title.textContent = heading;
    section.appendChild(title);
    var listElement = document.createElement('div');
    listElement.className = 'resource-card-list';
    list.forEach(function (resource) { listElement.appendChild(resourceCard(resource, includeCategory)); });
    section.appendChild(listElement);
    container.appendChild(section);
  }

  function renderQuickAccess() {
    quickAccess.innerHTML = '';
    var favorites = favoriteIds().map(resourceById).filter(Boolean);
    var recents = recentIds().map(resourceById).filter(Boolean);
    var suggestedTitles = ['PHQ-9', 'GAD-7', 'Asthma Control Test', 'STOP-BANG Questionnaire', 'Low Back — General Program', 'Ankle Sprain Rehab'];
    var suggested = suggestedTitles.map(function (title) { return resources.find(function (resource) { return resource.title === title; }); }).filter(Boolean);

    if (!favorites.length) {
      var hint = document.createElement('p');
      hint.className = 'quick-hint';
      hint.innerHTML = '<i data-lucide="star" aria-hidden="true"></i><span>Use the star beside any resource to keep it here for one-click access on this device.</span>';
      quickAccess.appendChild(hint);
    }
    renderResourceSection(quickAccess, 'Favorites', favorites, true);
    renderResourceSection(quickAccess, 'Recently opened', recents, true);
    renderResourceSection(quickAccess, 'Suggested', suggested, true);
    updateFavoriteButtons();
    lucide.createIcons();
  }

  collectionNav.innerHTML = collections.map(function (collection) {
    return '<button type="button" data-collection="' + collection.id + '"><i data-lucide="' + collection.icon + '" aria-hidden="true"></i><span>' + collection.label + '</span></button>';
  }).join('');
  collectionSelect.innerHTML = collections.map(function (collection) { return '<option value="' + collection.id + '">' + collection.label + '</option>'; }).join('');

  var musculoskeletalCategories = categorySections.filter(function (category) { return category.collection === 'musculoskeletal'; });
  subcategoryNav.innerHTML = '<button type="button" data-region="all">All regions</button>' + musculoskeletalCategories.map(function (category) {
    return '<button type="button" data-region="' + category.id + '">' + category.title + '</button>';
  }).join('');

  var params = new URLSearchParams(location.search);
  var requestedCollection = params.get('collection');
  var storedCollection = '';
  try { storedCollection = localStorage.getItem(COLLECTION_KEY) || ''; } catch (_) {}
  var currentCollection = collections.some(function (collection) { return collection.id === requestedCollection; })
    ? requestedCollection
    : (collections.some(function (collection) { return collection.id === storedCollection; }) ? storedCollection : 'quick');
  var currentRegion = params.get('region') || 'all';

  function setUrl(values) {
    var next = new URLSearchParams();
    if (values.q) next.set('q', values.q);
    else {
      if (currentCollection !== 'quick') next.set('collection', currentCollection);
      if (currentCollection === 'musculoskeletal' && currentRegion !== 'all') next.set('region', currentRegion);
    }
    history.replaceState(null, '', location.pathname + (next.size ? '?' + next.toString() : ''));
  }

  function visibleCollectionResources(collection) {
    if (collection === 'all') return resources;
    if (collection === 'quick') return resources;
    return resources.filter(function (resource) {
      if (resource.collection !== collection) return false;
      return collection !== 'musculoskeletal' || currentRegion === 'all' || resource.categoryId === currentRegion;
    });
  }

  function activateCollection(collection, updateUrl) {
    var config = collections.find(function (item) { return item.id === collection; }) || collections[0];
    currentCollection = config.id;
    try { localStorage.setItem(COLLECTION_KEY, currentCollection); } catch (_) {}

    collectionNav.querySelectorAll('[data-collection]').forEach(function (button) {
      var selected = button.dataset.collection === currentCollection;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    collectionSelect.value = currentCollection;
    libraryTitle.textContent = config.title;
    libraryDescription.textContent = config.description;
    searchResults.hidden = true;
    quickAccess.hidden = currentCollection !== 'quick';
    catalogContent.hidden = currentCollection === 'quick';
    subcategoryNav.hidden = currentCollection !== 'musculoskeletal';

    categorySections.forEach(function (category) {
      var visible = currentCollection === 'all' || category.collection === currentCollection;
      if (currentCollection === 'musculoskeletal' && currentRegion !== 'all') visible = visible && category.id === currentRegion;
      category.element.hidden = !visible;
    });
    grid.hidden = !categorySections.some(function (category) { return !category.element.hidden && category.element !== external; });
    external.hidden = !(currentCollection === 'all' || currentCollection === 'screening');
    noResults.hidden = true;

    var visible = visibleCollectionResources(currentCollection);
    count.textContent = currentCollection === 'quick' ? resources.length + ' resources available' : visible.length + ' resource' + (visible.length === 1 ? '' : 's');
    if (currentCollection === 'quick') renderQuickAccess();
    if (updateUrl !== false) setUrl({});
    lucide.createIcons();
  }

  function setRegion(region) {
    if (!musculoskeletalCategories.some(function (category) { return category.id === region; })) region = 'all';
    currentRegion = region;
    subcategoryNav.querySelectorAll('[data-region]').forEach(function (button) {
      var selected = button.dataset.region === currentRegion;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    activateCollection('musculoskeletal');
  }

  function renderSearch(query) {
    var normalized = query.toLowerCase();
    var matches = resources.filter(function (resource) { return resource.search.includes(normalized); });
    searchResults.innerHTML = '';
    quickAccess.hidden = true;
    catalogContent.hidden = true;
    subcategoryNav.hidden = true;
    searchResults.hidden = false;
    libraryTitle.textContent = 'Search results';
    libraryDescription.textContent = matches.length ? 'Results across every document collection.' : 'Try a diagnosis, body region, medication, or screening instrument.';
    renderResourceSection(searchResults, matches.length + ' match' + (matches.length === 1 ? '' : 'es'), matches, true);
    noResults.hidden = matches.length > 0;
    count.textContent = matches.length + ' match' + (matches.length === 1 ? '' : 'es');
    clear.hidden = false;
    updateFavoriteButtons();
    lucide.createIcons();
    setUrl({ q: query });
  }

  function handleSearch() {
    var query = input.value.trim();
    if (query) renderSearch(query);
    else {
      clear.hidden = true;
      noResults.hidden = true;
      activateCollection(currentCollection);
    }
  }

  collectionNav.addEventListener('click', function (event) {
    var button = event.target.closest('[data-collection]');
    if (!button) return;
    input.value = '';
    clear.hidden = true;
    activateCollection(button.dataset.collection);
  });
  collectionSelect.addEventListener('change', function () {
    input.value = '';
    clear.hidden = true;
    activateCollection(collectionSelect.value);
  });
  subcategoryNav.addEventListener('click', function (event) {
    var button = event.target.closest('[data-region]');
    if (button) setRegion(button.dataset.region);
  });
  input.addEventListener('input', handleSearch);
  clear.addEventListener('click', function () { input.value = ''; handleSearch(); input.focus(); });

  input.value = params.get('q') || '';
  if (!musculoskeletalCategories.some(function (category) { return category.id === currentRegion; })) currentRegion = 'all';
  subcategoryNav.querySelectorAll('[data-region]').forEach(function (button) {
    var selected = button.dataset.region === currentRegion;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  activateCollection(currentCollection, false);
  updateFavoriteButtons();
  if (input.value) renderSearch(input.value);
  else setUrl({});
  lucide.createIcons();
})();
