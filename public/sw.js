/**
 * NIgaban service worker — Aurora build.
 *
 * Strategy:
 *  - Cache the app shell (HTML, manifest, favicon, fonts) for offline boot.
 *  - Use stale-while-revalidate for static built assets (/assets/*).
 *  - Always go network-first for /api/* (never serve cached API responses).
 *  - Fallback to /index.html on offline navigations.
 */

const SHELL_CACHE = "nigaban-shell-v3";
const RUNTIME_CACHE = "nigaban-runtime-v3";

const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache API responses
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ error: "offline" }), { status: 503, headers: { "Content-Type": "application/json" } })));
    return;
  }

  // Stale-while-revalidate for built JS/CSS assets
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Cache-first for app shell, fallback to network, fallback to /index.html for navigations
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") return response;
          const cloned = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate" || request.destination === "document") {
            return caches.match("/index.html");
          }
          return caches.match(request);
        });
    })
  );
});
