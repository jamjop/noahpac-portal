const CACHE = 'tccc-__DEPLOY_HASH__';
// Exact URLs as requested by index.html, including cache-busting query
// strings -- caches.match() keys on the full request URL, so a precached
// entry without "?v=2" is a silent miss against the real page request and
// falls through to a runtime fetch instead of serving offline.
const ASSETS = [
  '/tccc/',
  '/tccc/index.html',
  '/tccc/app.js?v=2',
  '/tccc/style.css?v=2',
  '/tccc/manifest.json',
  '/tccc/icon.svg',
  '/tccc/last_checked.json',
  '/shared.css',
  '/assets/fonts.css',
  '/assets/last-checked.js',
];

self.addEventListener('install', e => {
  // Individual cache.add() calls via allSettled, not addAll(): addAll() is
  // all-or-nothing, so one bad URL in ASSETS would silently fail the whole
  // install forever and leave the page with zero offline capability.
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(ASSETS.map(url => c.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
