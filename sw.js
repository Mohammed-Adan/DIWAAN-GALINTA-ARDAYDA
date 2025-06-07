const CACHE_NAME = "Diwaanka-ardayda-cache-v2"; // Updated cache name
const OFFLINE_PAGE = "offline.html";
const DATA_CACHE = "ardayda-data-v1";

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

// Precaching
self.addEventListener('install', (event) => {
  const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/offline.html',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
  ];
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Cache cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Network-first for API, cache-first for assets
workbox.routing.registerRoute(
  new RegExp('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: DATA_CACHE
  })
);

workbox.routing.registerRoute(
  new RegExp('.(?:js|css|png|jpg|svg)'),
  new workbox.strategies.CacheFirst({
    cacheName: CACHE_NAME
  })
);

// Offline page for navigation
workbox.routing.registerRoute(
  ({request}) => request.mode === 'navigate',
  async ({event}) => {
    try {
      return await workbox.strategies.NetworkFirst().handle({event});
    } catch (error) {
      return caches.match(OFFLINE_PAGE);
    }
  }
);

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-students') {
    event.waitUntil(syncPendingStudents());
  }
});

async function syncPendingStudents() {
  const pending = await getPendingStudents();
  if (pending.length > 0) {
    try {
      await fetch('/api/students', {
        method: 'POST',
        body: JSON.stringify(pending),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      await clearPendingStudents();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

// Helper functions (would be in your app.js)
async function getPendingStudents() {
  const cache = await caches.open(DATA_CACHE);
  const response = await cache.match('/pending-students');
  return response ? await response.json() : [];
}

async function clearPendingStudents() {
  const cache = await caches.open(DATA_CACHE);
  await cache.delete('/pending-students');
}