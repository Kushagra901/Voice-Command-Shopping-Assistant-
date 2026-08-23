// Voice Command Shopping Assistant — Offline Service Worker
const CACHE_NAME = "v1-voice-shopping-cache";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.svg",
  "/icon-512.svg"
];

// 1. Install: Precache App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Continue even if some optional assets are not yet emitted
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
          return Promise.resolve();
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Handler: Caching Strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for cache lookup (mutations handled by useOnlineStatus mutation queue)
  if (request.method !== "GET") {
    return;
  }

  // A. API Read Requests: Network-First with Cache Fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Offline fallback response for shopping-list
            if (url.pathname.includes("/shopping-list")) {
              return new Response(
                JSON.stringify({ success: true, data: [] }),
                { headers: { "Content-Type": "application/json" } }
              );
            }
            return new Response(
              JSON.stringify({ success: false, error: { message: "Offline — using cached data", code: "OFFLINE" } }),
              { status: 503, headers: { "Content-Type": "application/json" } }
            );
          });
        })
    );
    return;
  }

  // B. Static Assets & App Shell: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is navigation, return cached root index.html
          if (request.mode === "navigate") {
            return caches.match("/index.html") || caches.match("/");
          }
          return null;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
