(function () {
  lucide.createIcons();

  var input = document.getElementById('doc-search');
  if (!input) return;

  var noResults = document.getElementById('no-results');
  var grid = document.getElementById('tools-grid');
  var external = document.getElementById('ext-refs');
  var count = document.getElementById('doc-count');
  var clear = document.getElementById('doc-clear');

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
    grid.style.display = localVisible ? 'grid' : 'none';
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
