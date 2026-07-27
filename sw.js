const CACHE = 'settle-v1';
const ASSETS = ['.', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for the app page (so your updates always come through when online),
// cache fallback so it still opens with no signal. Cache-first for everything else.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.mode === 'navigate' || (req.destination === 'document')) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (req.url.startsWith(self.location.origin) || req.url.includes('fonts.g')) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
