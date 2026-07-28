// Cyprus planner — offline service worker
const CACHE = 'cyprus-planner-v1';
const SHELL = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // app shell: cache-first, fall back to network, then to cached index
    e.respondWith(
      caches.match(req).then(c => c || fetch(req).then(r => {
        const cp = r.clone(); caches.open(CACHE).then(ca => ca.put(req, cp)); return r;
      }).catch(() => caches.match('./index.html')))
    );
  } else {
    // external (Leaflet, map tiles, photos): serve cached if present, update in background
    e.respondWith(
      caches.match(req).then(c => {
        const f = fetch(req).then(r => {
          const cp = r.clone(); caches.open(CACHE).then(ca => ca.put(req, cp)); return r;
        }).catch(() => c);
        return c || f;
      })
    );
  }
});
