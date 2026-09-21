/* sw.js — offline-first para o app shell; APIs ficam network-only (o app faz cache próprio via localStorage). */
const CACHE = 'offroad-app-v1';
const CORE = [
  './', './index.html', './css/app.css', './manifest.webmanifest', './icon.svg', './assets/intro.mp4',
  './js/util.js', './js/geo.js', './js/services.js', './js/fuel.js',
  './js/vehicles.js', './js/diagrams.js', './js/ui.js', './js/app.js',
];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });

self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = url.host.includes('fonts.googleapis.com') || url.host.includes('fonts.gstatic.com');

  if (sameOrigin) {
    // app shell: cache-first, atualiza em segundo plano
    e.respondWith(caches.match(req).then(c => c || fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(ca => ca.put(req, cp)); return r; }).catch(() => c)));
  } else if (isFont) {
    // fontes: stale-while-revalidate
    e.respondWith(caches.match(req).then(c => { const f = fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(ca => ca.put(req, cp)); return r; }).catch(() => c); return c || f; }));
  }
  // demais (open-meteo, bigdatacloud, overpass, google maps): passthrough (rede); offline o app usa cache local.
});
