/**
 * ọnọdụ Service Worker - PWA Offline Caching & Execution Engine
 */

const CACHE_NAME = "onodu-v1";
const STATIC_RESOURCES = [
  "/",
  "/index.html",
  "/logo192.png",
  "/logo512.png",
  "/manifest.json"
];

// Install Service Worker and cache core shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching offline application shell...");
      return cache.addAll(STATIC_RESOURCES);
    }).then(() => self.skipWaiting())
  );
});

// Activate & remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Invalidating outdated cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First with Cache fallbacks for seamless loading & offline support
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Bypass service worker caching for dynamic API queries and non-GET items
  if (url.pathname.startsWith("/api/") || event.request.method !== "GET") {
    return; // Let browser process normally via real-time endpoints
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If query is successful, clone and save latest copy into the cache
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to offline cache if net is disconnected
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If accessing standard navigation routing, fallback to main index document shell
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
      })
  );
});
