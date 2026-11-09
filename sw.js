// Offline support: the app shell and content are network-first (updates arrive as soon as
// you are online); audio is cache-first, so every clip you have played, or downloaded from
// the module page, keeps working without a connection.
const VERSION = "bandb-2026-11-09";
const SHELL = `bandb-shell-${VERSION}`;
const AUDIO = "bandb-audio-v1";
const FONTS = "bandb-fonts-v1";

const PRECACHE = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "assets/css/app.css",
  "assets/js/main.js",
  "assets/js/ui.js",
  "assets/js/audio.js",
  "assets/js/store.js",
  "assets/js/data.js",
  "assets/js/views.js",
  "assets/js/blocks.js",
  "assets/js/exercises.js",
  "assets/js/checks.js",
  "assets/js/recorder.js",
  "assets/img/icon.svg",
  "content/course.json",
  "content/cast.json",
  "content/b1-1/m01/module.json",
  "content/b1-1/m01/l01.json",
  "content/b1-1/m01/l02.json",
  "content/b1-1/m01/l03.json",
  "content/b1-1/m01/l04.json",
  "content/b1-1/m01/l05.json",
  "content/b1-1/m01/review.json",
  "audio/b1-1/m01/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("bandb-shell-") && k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com") {
    event.respondWith(staleWhileRevalidate(req, FONTS));
    return;
  }
  if (url.origin !== location.origin) return;

  if (url.pathname.endsWith(".mp3")) {
    event.respondWith(cacheFirst(req, AUDIO));
    return;
  }
  event.respondWith(networkFirst(req, SHELL));
});

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req, { ignoreSearch: true, ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && res.status === 200) cache.put(req, res.clone());
  return res;
}

async function networkFirst(req, name) {
  const cache = await caches.open(name);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === "navigate") return cache.match("index.html");
    throw new Error("offline");
  }
}

async function staleWhileRevalidate(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  const fresh = fetch(req).then((res) => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || fresh;
}
