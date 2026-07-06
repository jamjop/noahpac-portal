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
//
// Staleness: the badge is green while the last check falls within the
// cadence declared by the page's own header tag ("↻ Reviewed quarterly",
// "↻ Updated monthly", ...), and turns yellow (class "stale") once it's
// older than that window. Thresholds mirror the server-side Grafana
// cron-health alert thresholds (weekly 8d / monthly 32d / quarterly 92d)
// so the badge goes yellow at the same point the backend starts alerting.
// A page with no cadence tag keeps the green badge (no staleness check).
(function () {
  var CADENCE_MAX_DAYS = { weekly: 8, monthly: 32, quarterly: 92, annually: 370 };

  function maxAgeDays() {
    var el = document.querySelector('.update-cadence');
    if (!el) return null;
    var m = el.textContent.toLowerCase().match(/weekly|monthly|quarterly|annually/);
    return m ? CADENCE_MAX_DAYS[m[0]] : null;
  }

  var targets = document.querySelectorAll('.last-checked');
  if (!targets.length) return;

  var src = (document.currentScript && document.currentScript.dataset.source) || './last_checked.json';

  fetch(src, { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.date) return;
      var d = new Date(data.date + 'T00:00:00');
      var formatted = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      var limit = maxAgeDays();
      var stale = limit !== null && (Date.now() - d.getTime()) > limit * 86400000;
      targets.forEach(function (target) {
        target.innerHTML = '<span class="dot"></span>Last checked for updates: ' + formatted;
        target.classList.toggle('stale', stale);
      });
    })
    .catch(function () {});
})();
