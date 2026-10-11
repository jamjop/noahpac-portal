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
    var el = document.querySelector('.update-cadence, .review-status');
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
      var needsReview = Boolean(data.review_pending) || ['changed', 'held_for_review', 'review_required'].includes(data.status);
      var checkError = data.status === 'error';
      targets.forEach(function (target) {
        var prefix = checkError
          ? 'Update check failed'
          : needsReview
            ? 'Clinical update review pending'
            : 'Last checked for updates';
        target.innerHTML = '<span class="dot"></span>' + prefix + ': ' + formatted;
        target.classList.toggle('stale', stale);
        target.classList.toggle('needs-review', needsReview);
        target.classList.toggle('check-error', checkError);
      });
      document.querySelectorAll('.review-status').forEach(function (status) {
        var label = status.querySelector('span:last-child');
        status.classList.toggle('stale', stale && !needsReview && !checkError);
        status.classList.toggle('needs-review', needsReview);
        status.classList.toggle('check-error', checkError);
        if (label) {
          label.textContent = checkError
            ? 'Update check needs attention'
            : needsReview
              ? 'Clinical update review pending'
              : status.dataset.cadence;
        }
        status.title = (checkError
          ? 'The most recent update check failed'
          : needsReview
            ? 'A source change was detected and requires clinical review'
            : 'Last checked for updates') + ': ' + formatted;
      });
    })
    .catch(function () {});
})();
