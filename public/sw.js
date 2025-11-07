const CACHE_VERSION = import.meta.env.VITE_APP_VERSION;
const CACHE_NAME = `trackcycle-cache-${CACHE_VERSION}`;

self.addEventListener("install", (event) => {
  console.log("[SW] Install event – caching app shell");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/", "/index.html", "/manifest.json"]);
    })
  );
  self.skipWaiting(); // 🔥 neue Version sofort aktivieren
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activate event – cleaning old caches");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("trackcycle-cache-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  return self.clients.claim(); // 🔥 neue Version sofort übernehmen
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (!req.url.startsWith("http")) return;

  // HTML-Dateien immer "NetworkFirst"
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Für alle anderen Requests: CacheFirst + Fallback
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            return res;
          })
          .catch(() => caches.match("/index.html"))
    )
  );
});