// Service Worker for Pitch Up PWA
const CACHE_NAME = 'pitch-up-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Background sync for future iOS support
self.addEventListener('sync', event => {
  if (event.tag === 'notification-sync') {
    event.waitUntil(checkNotificationTime());
  }
});

async function checkNotificationTime() {
  // This will work when iOS supports background sync
  const lastCheck = await getLastCheckTime();
  const now = Date.now();
  const timeSinceLastCheck = now - lastCheck;
  
  if (timeSinceLastCheck > 30 * 60 * 1000) { // 30 minutes
    // Send message to all clients to trigger notification
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'TRIGGER_NOTIFICATION',
        time: now
      });
    });
  }
}

async function getLastCheckTime() {
  // In a real implementation, this would use IndexedDB
  return Date.now() - (60 * 60 * 1000); // Default to 1 hour ago
}

// Listen for messages from the app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'NOTIFICATION_CHECK') {
    checkNotificationTime();
  }
});