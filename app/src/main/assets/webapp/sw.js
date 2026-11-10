/* =============================================
   Pawtify Service Worker v3.0.0-md3
   Seamless Lifecycle & Network-First Scripts & HTML Caching
   ============================================= */
const CACHE_VERSION = 'v3.0.0-md3';
const CACHE_NAME = `pawtify-app-shell-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `pawtify-dynamic-${CACHE_VERSION}`;
const API_CACHE = `pawtify-api-${CACHE_VERSION}`;
const MEDIA_CACHE = `pawtify-media-${CACHE_VERSION}`;

const CURRENT_CACHES = [CACHE_NAME, DYNAMIC_CACHE, API_CACHE, MEDIA_CACHE];

const ASSETS = [
  '/',
  '/index.html',
  '/styles.css?v=3.0.0-md3',
  '/src/main.js?v=3.0.0-md3',
  '/manifest.webmanifest',
  '/assets/pawtify.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/apple-touch-icon.png',
  '/assets/favicon.ico',
];

// 1. Immediate Activation during install: do not wait in queue
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. Cache Purging during activate: clean old versions and claim all open clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (!CURRENT_CACHES.includes(key)) {
              console.log('[SW Activate] Purging outdated cache:', key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW Activate] Claiming clients immediately.');
        return self.clients.claim();
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ping') {
    event.source.postMessage({ type: 'pong' });
  }
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. API Calls (Search, recommendations, etc.) -> Network First, fallback to Cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(API_CACHE)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response(JSON.stringify({ items: [] }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          });
        })
    );
    return;
  }

  // 2. Network-First for Navigation / HTML Document requests
  // Ensures newest DOM, meta tags, and script hashes are always retrieved when online
  if (
    event.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname === '/index.html' ||
    (event.request.headers.get('accept') &&
      event.request.headers.get('accept').includes('text/html'))
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return new Response('Offline', {
            status: 503,
            statusText: 'Offline',
          });
        })
    );
    return;
  }

  // 3. Media / Images -> Cache First, fallback to Network
  if (
    url.hostname.includes('ytimg.com') ||
    url.hostname.includes('saavncdn') ||
    event.request.destination === 'image' ||
    event.request.destination === 'audio' ||
    event.request.destination === 'video'
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((response) => {
            if (response.ok || response.type === 'opaque') {
              const clone = response.clone();
              caches
                .open(MEDIA_CACHE)
                .then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }

  // 4. JavaScript Scripts -> Network-First (ensures script updates are delivered instantly)
  if (
    event.request.destination === 'script' ||
    url.pathname.endsWith('.js') ||
    url.pathname.includes('/src/')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response('', { status: 408, statusText: 'Offline' });
        })
    );
    return;
  }

  // 5. App Shell & Other Static Assets (CSS, Fonts, Manifest) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {});

      if (cached) return cached;

      return networkFetch.then((res) => {
        if (res) return res;
        return new Response('', { status: 408, statusText: 'Offline' });
      });
    })
  );
});

// PWA Notification Routing: Focus or open standalone PWA window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetPath = event.notification.data?.url || '/';
  const urlToOpen = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // 1. Focus existing active PWA client if available
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // 2. Open standalone window if none is open
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  // Graceful notification close
});
