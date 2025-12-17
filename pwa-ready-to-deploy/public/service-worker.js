// Service Worker per PresenzaCalcio PWA
// Versione cache
const CACHE_VERSION = 'v1';
const CACHE_NAME = `presenzacalcio-cache-${CACHE_VERSION}`;

// File da cachare per funzionamento offline
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
  '/manifest.json',
];

// Installazione Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Attivazione Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Strategia Cache-First per risorse statiche, Network-First per API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-First per API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clona la risposta e salvala in cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Se network fallisce, prova dalla cache
          return caches.match(request);
        })
    );
    return;
  }

  // Cache-First per tutto il resto
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((response) => {
          // Non cachare risposte non-OK
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
  );
});

// GESTIONE NOTIFICHE PUSH
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const title = data.title || 'PresenzaCalcio';
  const options = {
    body: data.body || 'Hai una nuova notifica',
    icon: data.icon || '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Click su notifica
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  event.notification.close();

  // Apri l'app o focus se già aperta
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se l'app è già aperta, portala in primo piano
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Altrimenti apri una nuova finestra
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Background Sync (per quando torna online)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Qui potresti sincronizzare dati in sospeso
      Promise.resolve()
    );
  }
});

console.log('[Service Worker] Loaded successfully!');
