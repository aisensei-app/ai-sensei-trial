/* オフラインでも開けるようにするための仕組み（Service Worker）
   ネットにつながるときは常に最新のファイルを使い、
   つながらないときだけ保存しておいたファイルを使います。 */
const CACHE = 'tanukun-v15';
const FILES = [
  './', './index.html', './style.css', './config.js', './lines.js', './i18n.js', './save.js', './belly.js', './app.js',
  './manifest.webmanifest', './images/icon-192.png', './images/icon-512.png',
  './images/normal.webp', './images/shy.webp', './images/happy.webp',
  './images/muni.webp', './images/ponpoko1.webp', './images/ponpoko2.webp',
  './images/bush.webp', './images/angry.webp', './images/troubled.webp', './images/melt.webp',
  './images/mojimoji.webp', './images/dere.webp', './images/dere2.webp',
  './images/parts/debeso.webp',
  './images/memories/1.webp', './images/memories/2.webp', './images/memories/3.webp',
  './images/memories/4.webp', './images/memories/5.webp', './images/memories/5b.webp',
  './images/memories/6.webp', './images/memories/6b.webp', './images/memories/6c.webp'
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
