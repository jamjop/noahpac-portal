(function () {
  lucide.createIcons();

  var input = document.getElementById('doc-search');
  if (!input) return;

  var noResults = document.getElementById('no-results');
  var grid = document.getElementById('tools-grid');

  input.addEventListener('input', function () {
    var q = this.value.trim().toLowerCase();
    var rows = document.querySelectorAll('.tool-row');
    var cols = document.querySelectorAll('.category-col');

    if (!q) {
      rows.forEach(function (r) { r.classList.remove('hidden-tool'); });
      cols.forEach(function (c) { c.style.display = ''; });
      noResults.style.display = 'none';
      grid.style.display = 'grid';
      return;
    }

    var anyVisible = false;
    rows.forEach(function (r) {
      var text = (r.dataset.search || '') + ' ' + r.textContent;
      var match = text.toLowerCase().includes(q);
      r.classList.toggle('hidden-tool', !match);
      if (match) anyVisible = true;
    });

    cols.forEach(function (col) {
      var hasVisible = Array.prototype.some.call(
        col.querySelectorAll('.tool-row'),
        function (r) { return !r.classList.contains('hidden-tool'); }
      );
      col.style.display = hasVisible ? '' : 'none';
    });

    noResults.style.display = anyVisible ? 'none' : 'block';
    grid.style.display = anyVisible ? 'grid' : 'none';
  });
})();
