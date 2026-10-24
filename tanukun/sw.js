/* オフラインでも開けるようにするための仕組み（Service Worker）
   ネットにつながるときは常に最新のファイルを使い、
   つながらないときだけ保存しておいたファイルを使います。 */
const CACHE = 'tanukun-v1';
const FILES = [
  './', './index.html', './style.css', './config.js', './lines.js', './app.js',
  './manifest.webmanifest', './images/icon-192.png', './images/icon-512.png',
  './images/normal.svg', './images/shy.svg', './images/angry.svg',
  './images/melt.svg', './images/bush.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
