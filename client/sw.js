/* =============================================
   Pawtify Service Worker v2.2
   Advanced Caching for Offline Access
   ============================================= */
const CACHE_NAME = 'pawtify-app-shell-v2.2';
const DYNAMIC_CACHE = 'pawtify-dynamic-v2.2';
const API_CACHE = 'pawtify-api-v2.2';
const MEDIA_CACHE = 'pawtify-media-v2.2';

const ASSETS = ['/', '/index.html', '/styles.css', '/app.js', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (
            ![CACHE_NAME, DYNAMIC_CACHE, API_CACHE, MEDIA_CACHE].includes(key)
          ) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ping') {
    event.source.postMessage({ type: 'pong' });
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. API Calls (Search, etc.) -> Network First, fallback to Cache
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

  // 2. Media / Images -> Cache First, fallback to Network
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

  // 3. App Shell & Other assets -> Stale While Revalidate
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
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('', { status: 408, statusText: 'Offline' });
      });
    })
  );
});
