
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('fai-cache').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.webmanifest',
        '/src/index.tsx'
      ]);
    })
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => {
      return resp || fetch(event.request);
    })
  );
});
