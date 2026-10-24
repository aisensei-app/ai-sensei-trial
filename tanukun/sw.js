/* オフラインでも開けるようにするための仕組み（Service Worker）
   ネットにつながるときは常に最新のファイルを使い、
   つながらないときだけ保存しておいたファイルを使います。 */
const CACHE = 'tanukun-v6';
const FILES = [
  './', './index.html', './style.css', './config.js', './lines.js', './save.js', './app.js',
  './manifest.webmanifest', './images/icon-192.png', './images/icon-512.png',
  './images/normal.webp', './images/shy.webp', './images/happy.webp',
  './images/muni.webp', './images/ponpoko1.webp', './images/ponpoko2.webp',
  './images/bush.webp', './images/angry.webp', './images/troubled.webp', './images/melt.webp'
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
