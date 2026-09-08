/* Service worker del Hub de herramientas · Control Union Perú
   - HTML: primero red (para ver siempre la versión más reciente), con respaldo en caché sin conexión.
   - Recursos (logo, íconos, etc.): primero caché, para que abra rápido.
   Sube la versión del caché (v1 -> v2 …) si quieres forzar una actualización limpia. */
const CACHE = 'hub-cu-v1';
const SHELL = [
  './',
  './index.html',
  './banco-imagenes.html',
  './logo-control-union.png',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // no interferir con imágenes de GitHub, etc.

  const isHTML = req.mode === 'navigate' || req.destination === 'document' || url.pathname.endsWith('.html');

  if (isHTML) {
    // Red primero, respaldo caché
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
  } else {
    // Caché primero, luego red
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }))
    );
  }
});
