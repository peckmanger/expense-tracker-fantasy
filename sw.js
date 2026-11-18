// sw.js — makes the app open offline. Your data is NOT here; it lives in IndexedDB.
// Strategy: serve from cache instantly, refresh the cache in the background.
// After you upload new files, the update shows up the next time you open the app.
// Bump the number when you change files, so phones pick up the new version cleanly.
const PREFIX = 'hoard-';
const CACHE = PREFIX + 'v2';
const ASSETS = [
  './', './index.html', './styles.css', './app.js', './store.js', './views.js', './charts.js', './sprites.js',
  './magic.js', './game.js', './i18n.js', './report.js', './fx.js', './db.js', './manifest.json', './fonts/hoard-pixel.woff',
  './icon-180.png', './icon-192.png', './icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // Only clear this app's own old caches — other apps on the same github.io domain keep theirs.
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // exchange-rate APIs go straight to the network
  if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return; // not our app
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (cached) { e.waitUntil(network); return cached; }
      const res = await network;
      return res || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error());
    })
  );
});
