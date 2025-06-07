// sw.js - Service Worker for Student Management App

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const CACHE_NAME = Diwaanka-ardayda-cache-v1';
const OFFLINE_PAGE = 'offline.html'; // Create this file
const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install and precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Network-first strategy for API calls
workbox.routing.registerRoute(
  ({url}) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60 // 5 minutes
      })
    ]
  })
);

// Cache-first strategy for static assets
workbox.routing.registerRoute(
  ({request}) => request.destination === 'style' || 
                 request.destination === 'script' ||
                 request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'static-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// Offline page for navigation requests
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

// Background sync for student data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-students') {
    event.waitUntil(syncPendingStudents());
  }
});

async function syncPendingStudents() {
  // Implement your offline data sync logic here
  const pending = await getPendingStudents(); // You need to implement this
  if (pending.length > 0) {
    await fetch('/api/students/sync', {
      method: 'POST',
      body: JSON.stringify(pending)
    });
    // Clear pending after successful sync
    await clearPendingStudents(); // You need to implement this
  }
}