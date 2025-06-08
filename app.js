const CACHE_NAME = 'ardayda-cache-v3';
const OFFLINE_PAGE = 'offline.html';
const DATA_CACHE = 'ardayda-data-v1';

self.addEventListener('install', (event) => {
  const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    OFFLINE_PAGE
  ];
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(JSON.stringify({ offline: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_PAGE))
    );
    return;
  }

  // For all other requests
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => cachedResponse || fetch(event.request))
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-students') {
    event.waitUntil(syncPendingStudents());
  }
});

async function syncPendingStudents() {
  const pending = await getPendingStudents();
  if (pending.length > 0) {
    try {
      // This is where you would send data to your server
      console.log('Syncing pending students:', pending);
      // await fetch('/api/students', {
      //   method: 'POST',
      //   body: JSON.stringify(pending),
      //   headers: {
      //     'Content-Type': 'application/json'
      //   }
      // });
      
      await clearPendingStudents();
      clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'sync-complete',
            count: pending.length
          });
        });
      });
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

async function getPendingStudents() {
  const cache = await caches.open(DATA_CACHE);
  const response = await cache.match('/pending-students');
  return response ? await response.json() : [];
}

async function clearPendingStudents() {
  const cache = await caches.open(DATA_CACHE);
  await cache.delete('/pending-students');
}