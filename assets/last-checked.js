// Populates every `.last-checked` element on the page (e.g. header tag and
// footer note) from that page's own last_checked.json, written by its
// check_updates.py on each cron run. Silently does nothing if the file
// doesn't exist yet or fetch fails.
//
// A page can override the source via data-source on its own script tag,
// e.g. <script src="/assets/last-checked.js" data-source="/antibiogram/last_checked.json" defer>
// — for pages whose content is actually sourced live from another app's
// data at runtime (empiric reads /antibiogram/data/*.json directly), so
// their real freshness signal is that app's check, not their own.
(function () {
  var targets = document.querySelectorAll('.last-checked');
  if (!targets.length) return;

  var src = (document.currentScript && document.currentScript.dataset.source) || './last_checked.json';

  fetch(src, { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.date) return;
      var d = new Date(data.date + 'T00:00:00');
      var formatted = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      targets.forEach(function (target) {
        target.innerHTML = '<span class="dot"></span>Last checked for updates: ' + formatted;
      });
    })
    .catch(function () {});
})();
