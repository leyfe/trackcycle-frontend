self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("trakko-cache-v1").then((cache) => {
      return cache.addAll(["/", "/index.html", "/manifest.json"]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Nur echte HTTP/HTTPS-Requests behandeln
  if (!req.url.startsWith("http")) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).catch(() => caches.match("/index.html")) // Fallback offline
      );
    })
  );
});