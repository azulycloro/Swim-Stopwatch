const CACHE_NAME = 'swim-stopwatch-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Deja pasar intactos los POST y peticiones a dominios externos (como tu Web App de Apps Script)
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Network-first para HTML / navegación: toma cambios nuevos si hay red, o usa caché si estás offline
  if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return networkRes;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  // Cache-first para recursos estáticos del mismo origen
  event.respondWith(
    caches.match(req).then((cachedRes) => cachedRes || fetch(req))
  );
});
