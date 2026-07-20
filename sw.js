/* Otome Shimai service worker — caches the app shell for offline use.
   Never caches cross-origin requests (RSS feed, fonts) — those stay live. */
const CACHE = "otome-shimai-v3";
const SHELL = [
  "./",
  "index.html",
  "shared.css",
  "md.js",
  "manifest.webmanifest",
  "assets/cover.jpg",
  "assets/header.png",
  "blog/",
  "blog/index.html",
  "blog/view.html",
  "blog/posts.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // live data stays live
  // network-first so content updates promptly; cache is the offline fallback
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: url.pathname.endsWith("view.html") }))
  );
});
