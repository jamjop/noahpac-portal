const CACHE = 'noahpac-v34';

const TOOLS = [
  'screener','vaccines','calculators','opioids','sti','abx',
  'labs','tccc','lookup','drugref','peds','allergy','antibiogram',
  'empiric','sepsis','wound','ddx','naloxone','reportable','sti-guide',
  'als','pals'
];

const CORE = ['/', '/index.html', '/shared.css', '/favicon.svg', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/manifest.json'];

const TOOL_FILES = TOOLS.flatMap(t => [
  `/${t}/`, `/${t}/index.html`, `/${t}/style.css`, `/${t}/app.js`
]);

// Fetch in small batches with a pause between each to avoid triggering
// server-side burst limits (CrowdSec, etc.) during SW install.
async function cacheInBatches(cache, urls, batchSize = 4, delayMs = 300) {
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.all(batch.map(url => cache.add(url).catch(() => null)));
    if (i + batchSize < urls.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      await c.addAll(CORE);
      await cacheInBatches(c, TOOL_FILES);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Let browser fetch cross-origin resources (CDN scripts/fonts) directly.
  // Intercepting them yields opaque responses that browsers may refuse to execute.
  if (url.origin !== location.origin) return;

  const isHTML = e.request.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        });
      })
    );
  }
});
