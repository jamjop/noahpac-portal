// This service worker is retired. Nothing in the current codebase registers
// it anymore, but browsers that installed an earlier version keep running it
// indefinitely — its old cache-first fetch handler serves stale copies of
// every tool's style.css/app.js forever, ignoring Cache-Control headers and
// manual hard refreshes entirely (only incognito, with no SW installed, was
// unaffected). This file's only remaining job is to reach those browsers,
// wipe its caches, unregister itself, and reload any open tabs so they
// immediately get real, un-intercepted content instead of waiting on a
// manual refresh. Do not restore the old caching behavior here.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});
