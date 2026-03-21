const CACHE_NAME = 'forexcross-v4.4.6';
const ASSETS = [
  'index.html',
  'dashboard.html',
  'eur_usd.html',
  'style.css',
  'intro.js',
  'app.js',
  'utils.js',
  'translations.js',
  'settings.js',
  'icon-512.png',
  'manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the new service worker to become active immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets');
      return cache.addAll(ASSETS);
    })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch events
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
