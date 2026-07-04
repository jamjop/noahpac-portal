// Populates every `.last-checked` element on the page (e.g. header tag and
// footer note) from that page's own last_checked.json, written by its
// check_updates.py on each cron run. Silently does nothing if the file
// doesn't exist yet or fetch fails.
(function () {
  var targets = document.querySelectorAll('.last-checked');
  if (!targets.length) return;

  fetch('./last_checked.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.date) return;
      var d = new Date(data.date + 'T00:00:00');
      var formatted = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      targets.forEach(function (target) {
        target.innerHTML = '<span class="dot"></span>Last checked ' + formatted;
      });
    })
    .catch(function () {});
})();
