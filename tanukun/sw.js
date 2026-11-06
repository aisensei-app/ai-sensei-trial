/* オフラインでも開けるようにするための仕組み（Service Worker）
   ネットにつながるときは常に最新のファイルを使い、
   つながらないときだけ保存しておいたファイルを使います。 */
const CACHE = 'tanukun-v33';
const FILES = [
  './', './index.html', './style.css', './config.js', './config.en.js', './config.zh.js', './lines.js', './lines.en.js', './lines.zh.js', './i18n.zh.js', './i18n.js', './stats.js', './save.js', './belly.js', './iris.js', './home.js', './uranai.js', './post.js', './app.js',
  './manifest.webmanifest', './images/icon-192.png', './images/icon-512.png',
  './images/normal.webp', './images/shy.webp', './images/happy.webp',
  './images/muni.webp', './images/ponpoko1.webp', './images/ponpoko2.webp',
  './images/bush.webp', './images/angry.webp', './images/troubled.webp', './images/melt.webp',
  './images/mojimoji.webp', './images/dere.webp', './images/dere2.webp',
  './images/parts/debeso.webp',
  // トップ画面（home.js）
  './images/topmenu/normal_hd.webp', './images/topmenu/pet.webp', './images/bg/beach_day.webp',
  './images/memories/1.webp', './images/memories/2.webp', './images/memories/3.webp',
  './images/memories/4.webp', './images/memories/5.webp', './images/memories/5b.webp',
  './images/memories/6.webp', './images/memories/6b.webp', './images/memories/6d.webp',
  // 貝がら占い（uranai.js）
  './images/uranai/pick.webp', './images/uranai/wow.webp', './images/uranai/result.webp', './images/uranai/gold.webp', './images/uranai/cave.webp', './images/uranai/altar.webp',
  './images/uranai/shell_coral_c.webp', './images/uranai/shell_pearl_c.webp', './images/uranai/shell_blue_c.webp', './images/uranai/shell_gold_c.webp',
  './images/uranai/shell_coral_o.webp', './images/uranai/shell_pearl_o.webp', './images/uranai/shell_blue_o.webp', './images/uranai/shell_gold_o.webp',
  // タヌくんのポスト（post.js）
  './images/post/mailbox_down.webp', './images/post/mailbox_up.webp', './images/post/receive.webp', './images/post/writing.webp',
  // 時間帯の立ち絵
  './images/time_morning.webp', './images/time_evening.webp', './images/time_night.webp', './images/time_sleep.webp',
  // ぽんぽこリズム（pon/）
  './pon/', './pon/index.html', './pon/pon.css', './pon/pon.js', './pon/pon.i18n.js',
  './images/pon/rank1.webp', './images/pon/rank2.webp', './images/pon/rank3.webp', './images/pon/rank4.webp',
  './images/pon/face_full.webp', './images/pon/face_cut1.webp', './images/pon/face_cut2.webp',
  './images/pon/face_cut3.webp', './images/pon/face_cut4.webp',
  // ぽよんラリー（rally/）
  './rally/', './rally/index.html', './rally/rally.css', './rally/rally.js', './rally/rally.i18n.js', './images/bg/beach_day.webp',
  './images/receive.webp', './images/rally/clear_sweat.webp', './images/rally/clear_sand.webp', './images/rally/clear_spin.webp', './images/rally/clear_rest.webp',
  // 丸太シーソー（seesaw/）
  './seesaw/', './seesaw/index.html', './seesaw/seesaw.css', './seesaw/seesaw.js', './seesaw/seesaw.i18n.js',
  './seesaw/img/sit_normal.webp', './seesaw/img/sit_happy.webp', './seesaw/img/sit_wow.webp', './seesaw/img/sit_ehehe.webp',
  './seesaw/img/jump_banzai.webp', './seesaw/img/sp_wet.webp', './seesaw/img/sp_octo.webp', './seesaw/img/sp_skirt.webp',
  // タヌくんを洗おう（washing/）。表情は本編の images/happy・melt・shy・troubled（上にある）
  './washing/', './washing/index.html', './washing/washing.css', './washing/washing.js', './washing/washing.i18n.js',
  './washing/img/back.webp', './washing/img/banzai.webp', './washing/img/cut_face.webp', './washing/img/item_bamboo.webp', './washing/img/item_brush.webp',
  './washing/img/item_clam.webp', './washing/img/item_conch.webp', './washing/img/item_coral.webp', './washing/img/item_glass.webp', './washing/img/item_goldstar.webp',
  './washing/img/item_hermit.webp', './washing/img/item_kelp1.webp', './washing/img/item_kelp2.webp', './washing/img/item_mud1.webp', './washing/img/item_mud2.webp',
  './washing/img/item_pearl.webp', './washing/img/item_petal.webp', './washing/img/item_sand1.webp', './washing/img/item_sand2.webp', './washing/img/item_sand3.webp',
  './washing/img/item_showerhead.webp', './washing/img/item_star.webp', './washing/img/item_urchin.webp', './washing/img/lookback.webp', './washing/img/mojimoji.webp',
  './washing/img/room.webp', './washing/img/shake.webp', './washing/img/sp_splash.webp', './washing/img/sp_stumble.webp', './washing/img/sp_towel.webp',
  './washing/img/sp_zukan.webp', './washing/img/sp_zukan_rare.webp', './washing/img/stand.webp',
  // 💖 ふれあい（なでなでの中で開く。nikukyu/・shippo/）
  './nikukyu/', './nikukyu/index.html', './nikukyu/img/sit_soles.webp', './nikukyu/img/sit_soles_smile.webp', './nikukyu/img/sit_soles_laugh.webp', './nikukyu/img/pads_mask.png',
  './shippo/', './shippo/index.html', './shippo/img/back.webp', './shippo/img/back_shy.webp', './shippo/img/back_laugh.webp', './shippo/img/tail.webp', './shippo/img/tail_puff.webp',
  // 🏮 第2章（matsuri/。2026-11-07 公開）：先読みはページ・ちらしの絵・アルバムの小さな絵だけ（全部で 3.4MB あるので、1〜2日目の人にまで読ませない）。
  // 場面の絵は、はじめて見たときに上の fetch が保存する
  './matsuri/', './matsuri/index.html', './matsuri/img/gate_day.webp',
  './matsuri/img/cafe_invite.webp', './matsuri/img/yatai_eat.webp', './matsuri/img/taiko_ready.webp', './matsuri/img/night_gift.webp'
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
