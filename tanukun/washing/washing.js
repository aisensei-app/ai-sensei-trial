/* =========================================================
   タヌくんを洗おう（washing/。2026-11。試作）
   ・南国のシャワールーム（竹の塀・空が見える・板の床）に、タヌくんが立っている。いつも息をしてゆっくり動く。いつでも遊べる
   ・2026-11-02 作り変え（ユーザーの要望）：おけ → シャワールーム／ブラシとシャワーは「ブラシゲージ・シャワーゲージ」で自動で入れかわる
       ブラシで洗っている間はブラシゲージが減り、0 になるとシャワーへ（その間ブラシゲージはスーっと回復）。シャワーも使うと減り、0 でブラシへ。最初はブラシ
     お股はいつも泡で隠れている（この泡はシャワーで流れない）。最後の仕上げのシャワーで泡が流れはじめ、ぎりぎり見えないところで結果の画面へ
   ・まえ と うしろ（右下のボタンでくるっと回る）。まえ＝頭・むね・おなか・腕・脇・しっぽ／うしろ＝背中・お尻・しっぽ
   ・① 汚れ落とし：砂よごれ・泥はね・貝がら・ヒトデ・コンブを、指でこすって落とす（指の下にブラシ）。こすった所は泡、取れた所はキラキラ
       脇の下をこすると「ばんざい」してくれて、脇も洗える（くすぐったがる）
     ② シャワー：指の上の竹の筒から水が出る。泡を流す。おなか・胸・お尻に当たった水は、ぽよんとはねる。タップで「ぷるん」して水をはじく
     → よごれが落ちて泡も流れたら、仕上げのシャワー → ピカピカ！
   ・よごれゲージ：まえ・うしろ・脇の汚れで 100% → 20%、汚れが落ちたあとは泡を流して 20% → 0%。0% で仕上げ
   ・反応：頭＝うっとり／むね・腕＝ときどきくすぐったい／おなか・お尻＝指につられて動く／しっぽ＝ひゃっ／背中＝きもちいい
     お股のあたり＝もじもじの絵になって「そこは自分で洗うから〜！」（こすれない。15歳以上の範囲の線引き）。お股は流れない泡で隠す
   ・絵：img/*.webp（tools/make_washing_art.py。Gemini の絵。腰みのなし）
       stand（720×900。立ち絵 images/normal.webp と同じ並べ方）、banzai・mojimoji・shake・back（720×940。上に 40px の余白 → y=-40 に置く）
       item_*（小物）。まえの表情は、今の立ち絵（images/happy.webp など）の顔だけを上に重ねる
     汚れのしみ・泡・しずく・シャワールーム（空・竹の塀・床）は、プログラムで描く
   ・座標はすべて立ち絵の座標（720×900）。上に余白のある絵のため、重ねる用のキャンバスは 720×940（TOP=40 だけ下にずらして使う）
   ・おなか・胸・お尻の揺れは丸太シーソーと同じ「網目の変形」＋「やわらかい上限」（tanh）
   ・音はすべてプログラムで作る（Web Audio）
   ・公開スイッチ（config.js の features.washing）が 'open' でないときは、本編へもどす
   ========================================================= */
(() => {
'use strict';

const C = window.TANU_CONFIG || {};
if (C.features && C.features.washing && C.features.washing !== 'open') { location.replace('../'); return; }
try { localStorage.setItem('tanukun.washingSeen', '1'); } catch (e) {}

/* ---- タヌくんのところへ戻るとき：幕がふわっとかかってから ---- */
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href="../"]');
  if (!a || e.defaultPrevented || document.body.classList.contains('leaving')) return;
  e.preventDefault();
  try { sessionStorage.setItem('tanukun.homeZoom', '1'); } catch (err) {}
  document.body.classList.add('leaving');
  setTimeout(() => { location.href = a.href; }, 430);
});

/* ---- ことば：本編と同じ i18n.js（洗うゲームの訳は washing.i18n.js） ---- */
const I18N = window.TanuI18n || { lang: 'ja', tr: (s) => s, apply: () => {} };
const tr = (ja, vars) => {
  let out = I18N.tr(ja, vars);
  if (vars && out === ja) Object.keys(vars).forEach((k) => { out = out.split('{' + k + '}').join(vars[k]); });
  return out;
};
I18N.apply();
if (I18N.lang !== 'ja') document.title = tr('タヌくんを洗おう｜タヌくん');

const SRC = {
  stand:    'img/stand.webp',              // まえ（720×900）
  banzai:   'img/banzai.webp',             // ばんざい（脇を洗う。720×940）
  mojimoji: 'img/mojimoji.webp',           // もじもじ（お股のあたり。720×940）
  shake:    'img/shake.webp',              // ぶるぶる（720×940）
  back:     'img/back.webp',               // うしろ（真後ろ。720×940）
  lookback: 'img/lookback.webp',           // うしろで、ふり返る（お尻・しっぽを洗うと。体は back と同じ位置）
  happy:    '../images/happy.webp',        // くすぐったい（笑う）… 顔だけ使う
  melt:     '../images/melt.webp',         // うっとり（頭を洗う）
  shy:      '../images/shy.webp',          // えへへ（おなか）
  troubled: '../images/troubled.webp',     // ひゃっ（しっぽ）
  conch:    'img/item_conch.webp',
  clam:     'img/item_clam.webp',
  star:     'img/item_star.webp',
  kelp1:    'img/item_kelp1.webp',
  kelp2:    'img/item_kelp2.webp',
  sand1:    'img/item_sand1.webp',
  sand2:    'img/item_sand2.webp',
  sand3:    'img/item_sand3.webp',
  mud1:     'img/item_mud1.webp',
  mud2:     'img/item_mud2.webp',
  brush:    'img/item_brush.webp',
  bamboo:   'img/item_bamboo.webp',
  shower:   'img/item_showerhead.webp',    // シャワーヘッド（2026-11-02。ユーザーが描いた絵。横の管は切りとった）
  room:     'img/room.webp',               // シャワールームの背景（2026-11-02。ユーザーが描いた絵）
  cutface:  'img/cut_face.webp'            // カットインの笑顔（本編の笑い顔 images/happy.webp を丸く切りぬいた絵。tools/make_washing_art.py）
};
const POSES = ['stand', 'banzai', 'mojimoji', 'shake', 'back', 'lookback'];

/* ---------- 絵の中の場所（立ち絵 720×900 の座標） ---------- */
const IW = 720, IH = 900, TOP = 40, CH = IH + TOP;
const FACE = { cx: 325, cy: 118, rx: 108, ry: 78 };                 // 表情を差しかえる顔の範囲（ネックレスにかからない）
const FLOOR = 893;                                                   // 床（足の裏）。これより下には汚れ・泡をのせない
const BODY_CX = 300;                                                 // 画面のまんなかに来る所
const FENCE_Y = 250;                                                 // 竹の塀の上のはし（絵の座標。胸のあたり。上は空）
// 目のあたり（汚れ・小物をのせない）
const EYES = { cx: 325, cy: 116, rx: 100, ry: 40 };
// お股を隠す泡（絵ごとの中心。この泡はシャワーで流れない）。MIN は最後に小さくなっても必ず隠れる大きさ
// もじもじ（手でお股を隠している絵）は、ここに書かない＝泡を出さない（手と泡がかぶらないように。2026-11-02 ユーザー）。
const CROTCH_FOAM = { stand: { cx: 242, cy: 566 }, banzai: { cx: 248, cy: 565 }, shake: { cx: 246, cy: 567 } };
const CF = { rx: 62, ry: 44, minRx: 46, minRy: 32 };
const inE = (x, y, e, k) => ((x - e.cx) / e.rx) ** 2 + ((y - e.cy) / e.ry) ** 2 < (k || 1);
// 揺れる所（絵ごと）。s：どのばねで動くか（jb＝おなか・お尻、jcL/jcR＝胸・もう片方のお尻）、f：指につられて動くか
const ZONES = {
  stand:  [{ cx: 272, cy: 440, rx: 170, ry: 110, s: 'jb', f: 1, name: 'belly' },
           { cx: 200, cy: 292, rx: 74, ry: 54, s: 'jcL', f: 0.3, name: 'chest' },
           { cx: 342, cy: 298, rx: 70, ry: 52, s: 'jcR', f: 0.3, name: 'chest' }],
  banzai: [{ cx: 290, cy: 440, rx: 168, ry: 108, s: 'jb', f: 1, name: 'belly' },
           { cx: 190, cy: 284, rx: 66, ry: 50, s: 'jcL', f: 0.3, name: 'chest' },
           { cx: 372, cy: 304, rx: 66, ry: 50, s: 'jcR', f: 0.3, name: 'chest' }],
  // うしろ：左のお尻・右のお尻（しっぽの下）・しっぽの横（2026-11-02 ユーザー「しっぽの横あたりも、ぷるん」）。座標は縮める前の絵の座標で書き、下で BACK に合わせる
  back:   [{ cx: 234, cy: 495, rx: 100, ry: 90, s: 'jb', f: 1, name: 'butt' },
           { cx: 410, cy: 485, rx: 90, ry: 82, s: 'jcR', f: 0.6, name: 'butt' },
           { cx: 525, cy: 470, rx: 78, ry: 78, s: 'jcL', f: 0.5, name: 'butt' }],
  mojimoji: [], shake: []
};
/* うしろの絵は、まえより一回り大きかったので縮めた（tools/make_washing_art.py の BACK_FIT）。
   うしろの座標は縮める前の絵の座標で書いておき、ここで変換する：新しい位置 = 古い位置 × k ＋ (dx, dy) */
const BACK = { k: 0.94, dx: 10, dy: 40 * 0.94 + 48 - 40 };
const bk = (x, y) => [x * BACK.k + BACK.dx, y * BACK.k + BACK.dy];
const unBk = (x, y) => [(x - BACK.dx) / BACK.k, (y - BACK.dy) / BACK.k];
const bkE = (e) => { const [cx, cy] = bk(e.cx, e.cy); return Object.assign({}, e, { cx, cy, rx: e.rx * BACK.k, ry: e.ry * BACK.k }); };
ZONES.back = ZONES.back.map(bkE);
ZONES.lookback = ZONES.back;
const LOOK_FACE = bkE({ cx: 262, cy: 92, rx: 62, ry: 66 });   // ふり返ったときの横顔（うしろでは、ここに汚れ・泡をのせない）
const CROTCH = { cx: 242, cy: 570, rx: 92, ry: 62 };                // まえ：お股のあたり（さわるともじもじ）
const PIT_HINT = [{ cx: 140, cy: 300, rx: 40, ry: 44 }, { cx: 408, cy: 290, rx: 40, ry: 44 }];   // まえ：ここをこすると、ばんざい
const PITS = [{ cx: 170, cy: 245, rx: 34, ry: 50 }, { cx: 440, cy: 248, rx: 34, ry: 52 }];       // ばんざい：脇

/* ---------- 画面 ---------- */
const cv = document.getElementById('stage');
const ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1, K = 1, OX = 0, OY = 0;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  // 体（横 490px・足もとまで）が画面に収まり、頭の上にゲージ、足もとに道具のゲージの場所が残るように
  const top = 150, bottom = 92;
  K = Math.min(W / 505, (H - top - bottom) / (FLOOR + 20));
  OX = W / 2 - BODY_CX * K;
  OY = H - bottom - FLOOR * K;
}
addEventListener('resize', () => { resize(); placeTools(); }); resize();
// 道具のアイコンは、タヌくんの右上（頭の右の上）。画面のはしや上のゲージにかからないように
function placeTools() {
  const el = document.getElementById('tools'); if (!el) return;
  const x = OX + 610 * K, y = OY + 40 * K;
  el.style.left = Math.min(W - 44, Math.max(W * 0.72, x)) + 'px';
  el.style.top = Math.max(150, y) + 'px';
}
// 息：体が足もとを中心に、ゆっくりふくらむ（BR.sx, BR.sy）。指の位置も、それに合わせて直す
const BR = { sx: 1, sy: 1 };
const toImg = (x, y) => {
  const ix = (x - OX) / K - S.shakeX, iy = (y - OY) / K;
  return { x: BODY_CX + (ix - BODY_CX) / BR.sx, y: FLOOR + (iy - FLOOR) / BR.sy };
};
const toScr = (x, y) => ({ x: OX + (BODY_CX + (x - BODY_CX) * BR.sx + S.shakeX) * K, y: OY + (FLOOR + (y - FLOOR) * BR.sy) * K });

/* ---------- 状態 ---------- */
const S = {
  t: 0, stage: 'wash',             // wash（洗う。ブラシとシャワーを行き来する）→ finale（仕上げのシャワー）→ clear
  tool: 'brush',                   // いまの道具（brush・shower。右上のアイコンで切りかえ）
  foamRef: null,                   // 汚れが落ちたときの泡の量（ゲージ用）
  cf: 1, finT: 0,                  // お股の泡の大きさ（1 → 最後に小さく）・仕上げの時間
  side: 'front', pose: 'stand', poseUntil: 0, turn: null,
  bx: { y: 0, v: 0 }, by: { y: 0, v: 0 }, jb: { y: 0, v: 0 }, jcL: { y: 0, v: 0 }, jcR: { y: 0, v: 0 },
  follow: null,                    // おなか・お尻を指でこすっているとき、指につられる量（目標）
  shakeX: 0, shakeT: 0,
  face: null, faceUntil: 0,
  drops: [], sparks: [], ripples: [],
  showerOn: false, sx: 0, sy: 0, brush: null,
  dirt0: 1, gauge: 100, asked: {},
  lastInput: 0, tickle: 0, said: {},
  newZ: [], zkJust: false          // このあそびで、ずかんに初めて登録した小物の id・ずかんがそろった（結果の画面でとくべつイラスト）
};
const events = [];

/* ---------- 絵と、重ねる用のキャンバス ---------- */
function load(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
function layer() {   // 720×940。座標は立ち絵の座標のまま描ける（TOP だけ下にずらしてある）
  const c = document.createElement('canvas'); c.width = IW; c.height = CH;
  const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, TOP);
  return { c, x };
}
function clr(x) { x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, IW, CH); x.restore(); }
let IMG = {};
const MASK = {};       // 絵ごとの不透明度（汚れや泡をのせてよい所）
const FACES = {};
function drawPose(x, key) { const im = IMG[key]; x.drawImage(im, 0, im.height > IH ? -TOP : 0); }
const comp = layer(), outL = layer(), tmp = layer();
let compDirty = true, wasMoving = true;

// 顔だけを切りぬく（ふちはふわっと）
function faceLayer(img) {
  const L = layer(), x = L.x;
  x.drawImage(img, 0, 0, IW, IH);
  x.globalCompositeOperation = 'destination-in';
  x.save(); x.translate(FACE.cx, FACE.cy); x.scale(1, FACE.ry / FACE.rx);
  const g = x.createRadialGradient(0, 0, 0, 0, 0, FACE.rx);
  g.addColorStop(0.72, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(-FACE.rx, -FACE.rx, FACE.rx * 2, FACE.rx * 2); x.restore();
  return L.c;
}
const isOn = (pose, x, y) => {
  x |= 0; y |= 0;
  return x >= 0 && y >= -TOP && x < IW && y < IH && y < FLOOR && MASK[pose][(y + TOP) * IW + x] > 140;
};
const isBody = (x, y) => isOn(S.pose, x, y);

/* ---------- 汚れ・泡の量（8px のマスで数える。ゲージに使う） ---------- */
const G = 8, GW = Math.ceil(IW / G), GH = Math.ceil(CH / G);
function sumGrid(g) { let s = 0; for (let i = 0; i < g.length; i++) s += g[i]; return s; }
function eachCell(x, y, r, fn) {
  const py = y + TOP;
  const x0 = Math.max(0, ((x - r) / G) | 0), x1 = Math.min(GW - 1, ((x + r) / G) | 0);
  const y0 = Math.max(0, ((py - r) / G) | 0), y1 = Math.min(GH - 1, ((py + r) / G) | 0);
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
    const cx = i * G + G / 2, cy = j * G + G / 2;
    if ((cx - x) * (cx - x) + (cy - py) * (cy - py) <= r * r) fn(j * GW + i, cx, cy - TOP);
  }
}
const cellOf = (x, y) => Math.min(GH - 1, Math.max(0, ((y + TOP) / G) | 0)) * GW + Math.min(GW - 1, Math.max(0, (x / G) | 0));
function gridFrom(L, g) {
  const d = L.x.getImageData(0, 0, IW, CH).data;
  g.fill(0);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    let s = 0, n = 0;
    for (let y = j * G; y < Math.min(CH, j * G + G); y += 2) for (let x = i * G; x < Math.min(IW, i * G + G); x += 2) { s += d[(y * IW + x) * 4 + 3]; n++; }
    g[j * GW + i] = n ? s / n / 255 : 0;
  }
}

/* ---------- まえ・うしろ・脇（それぞれ、汚れ・泡・しずく・小物を持つ） ---------- */
function makeSide(pose) {
  return { pose, dirt: layer(), foam: layer(), wet: layer(), dirtGrid: new Float32Array(GW * GH), foamGrid: new Float32Array(GW * GH), items: [] };
}
const SIDES = { front: makeSide('stand'), back: makeSide('back'), pit: makeSide('banzai') };   // pit：脇の汚れ（ばんざいのときだけ見える）
const cur = () => SIDES[S.side];

/* ---------- 汚れをつける（毎回すこしずつ場所が変わる） ---------- */
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const DIRT_AREAS = {   // [中心x, 中心y, 横, 縦, 数]
  front: [[325, 48, 70, 22, 1], [270, 290, 120, 40, 3], [270, 440, 140, 80, 5], [100, 430, 32, 70, 2], [470, 320, 55, 110, 2], [520, 545, 45, 30, 1],
          [200, 720, 45, 60, 1], [410, 720, 45, 60, 1], [205, 840, 40, 25, 1], [415, 840, 40, 25, 1]],
  back:  [[360, 60, 50, 30, 1], [320, 260, 150, 70, 5], [232, 505, 60, 45, 2], [470, 480, 70, 50, 2], [110, 420, 30, 60, 1], [550, 420, 30, 60, 1],
          [215, 730, 45, 60, 1], [400, 730, 45, 60, 1]].map(([x, y, rx, ry, n]) => [...bk(x, y), rx * BACK.k, ry * BACK.k, n]),
  pit:   [[PITS[0].cx, PITS[0].cy, 14, 22, 1], [PITS[1].cx, PITS[1].cy, 14, 22, 1]]
};
function stamp(x, key, cx, cy, w, rot, alpha) {
  const im = IMG[key], h = w * im.height / im.width;
  x.save(); x.globalAlpha = alpha || 1; x.translate(cx, cy); x.rotate(rot || 0); x.drawImage(im, -w / 2, -h / 2, w, h); x.restore();
}
// 汚れをのせない所：まえの目のあたり（ユーザーの要望）・お股の泡のあたり。r はしみの大きさ（はみ出しも考える）
function noDirt(name, x, y, r) {
  if (name === 'back') return false;
  const e = { cx: EYES.cx, cy: EYES.cy, rx: EYES.rx + r * 1.4, ry: EYES.ry + r * 1.4 };
  return inE(x, y, e) || inE(x, y, { cx: CROTCH.cx, cy: CROTCH.cy, rx: CROTCH.rx + r, ry: CROTCH.ry + r });
}
function makeDirt(name) {
  const sd = SIDES[name], x = sd.dirt.x;
  clr(x);
  for (const [ax, ay, rx, ry, n] of DIRT_AREAS[name]) {
    for (let k = 0; k < n; k++) {
      let cx, cy, tries = 0;
      const r = rnd(20, 32);
      do { const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()); cx = ax + Math.cos(a) * rx * d; cy = ay + Math.sin(a) * ry * d; } while ((!isOn(sd.pose, cx, cy) || noDirt(name, cx, cy, r)) && ++tries < 30);
      if (tries >= 30) continue;
      // やわらかいしみの上に、砂よごれの絵をのせる
      for (let m = 0; m < 3; m++) {
        const mx = cx + rnd(-r, r) * 0.5, my = cy + rnd(-r, r) * 0.5, mr = r * rnd(0.7, 1.05);
        const g = x.createRadialGradient(mx, my, 0, mx, my, mr);
        g.addColorStop(0, 'rgba(118,82,46,.45)'); g.addColorStop(1, 'rgba(140,104,64,0)');
        x.fillStyle = g; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
      }
      stamp(x, pick(['sand1', 'sand2', 'sand3']), cx, cy, r * 2.1, rnd(-0.6, 0.6), 0.92);
      if (Math.random() < 0.5) stamp(x, pick(['mud1', 'mud2']), cx + rnd(-r, r) * 1.2, cy + rnd(-r, r) * 1.2, rnd(18, 30), rnd(0, 6), 0.85);
    }
  }
  // 体の外にはみ出した所は消す
  x.globalCompositeOperation = 'destination-in'; drawPose(x, sd.pose); x.globalCompositeOperation = 'source-over';
  gridFrom(sd.dirt, sd.dirtGrid);
}

/* ---------- くっついている小物と、ずかん ----------
   ZUKAN … 小物の定義表。絵（SRC の key）を足して、ここに1行書けば種類がふえる（ずかんの数も自動）。
     id（記録の名前。あとで変えない）・key（SRC の絵の名前）・group（どの場所に出るか。shell・star・kelp・rare）・weight（出やすさ。同じ group の中で）・w（絵の幅）
     name・line（ずかんの名前とひとこと。3言語は washing.i18n.js）
   rare は、ときどき（chance）出る特別な場所。rare の定義が1つも無ければ出ない */
const ZUKAN = [
  { id: 'conch', key: 'conch', group: 'shell', weight: 1, w: 40, name: 'まきがい',   line: 'くるくる うずまきの かいがら' },
  { id: 'clam',  key: 'clam',  group: 'shell', weight: 1, w: 46, name: 'にまいがい', line: 'ぱかっと ひらく かいがら' },
  { id: 'star',  key: 'star',  group: 'star',  weight: 1, w: 50, name: 'ヒトデ',     line: 'おほしさまみたいな いきもの' },
  { id: 'kelp1', key: 'kelp1', group: 'kelp',  weight: 1, w: 50, name: 'コンブ',     line: 'ぬるぬる ひろがる うみのくさ' },
  { id: 'kelp2', key: 'kelp2', group: 'kelp',  weight: 1, w: 48, name: 'ワカメ',     line: 'ひらひら ゆれる うみのくさ' }
];
const ITEM_SPOTS = {
  front: [{ g: 'shell', at: [[205, 300], [330, 385], [470, 270]] },
          { g: 'star', at: [[300, 470], [160, 420], [480, 400]] },
          { g: 'kelp', at: [[250, 250], [110, 470], [420, 700]] },
          { g: 'rare', chance: 0.4, at: [[360, 255], [170, 340], [330, 520], [400, 640], [170, 620]] }],
  back:  [{ g: 'shell', at: [[250, 270], [400, 300]].map(([x, y]) => bk(x, y)) },
          { g: 'star', at: [[225, 500], [180, 380]].map(([x, y]) => bk(x, y)) },
          { g: 'kelp', at: [[480, 470], [150, 300]].map(([x, y]) => bk(x, y)) },
          { g: 'rare', chance: 0.4, at: [[300, 260], [200, 450], [420, 430]].map(([x, y]) => bk(x, y)) }],
  pit: []
};
const ITEM_W = {}; ZUKAN.forEach((z) => { ITEM_W[z.key] = z.w; });
const pickWeighted = (list) => { let r = Math.random() * list.reduce((a, z) => a + z.weight, 0); for (const z of list) { if ((r -= z.weight) < 0) return z; } return list[0]; };
function makeItems(name) {
  SIDES[name].items = ITEM_SPOTS[name].filter((s) => ZUKAN.some((z) => z.group === s.g) && (s.chance == null || Math.random() < s.chance)).map((s) => {
    const [x, y] = pick(s.at), z = pickWeighted(ZUKAN.filter((q) => q.group === s.g));
    return { id: z.id, key: z.key, name: z.name, x, y, rot: rnd(-0.6, 0.6), hp: 1, stuck: true, vx: 0, vy: 0, vr: 0 };
  });
}
function drawItem(x, it) { stamp(x, it.key, it.x, it.y, ITEM_W[it.key], it.rot, 1); }

/* ---------- ずかん（記録・画面） ----------
   記録は、この端末の localStorage（tanu-washing-zukan。{id: とれた数}）だけ。そろったときのとくべつイラストを見たかは tanu-washing-zukan-done
   とくべつイラスト（ZK_SPECIAL）は、src が null の間は仮の絵（準備中）。絵ができたら img/sp_zukan.webp（tools/make_washing_art.py の REWARD_IDS に zukan）を文字列で書く */
const ZK_KEY = 'tanu-washing-zukan', ZK_DONE = 'tanu-washing-zukan-done';
const ZK_SPECIAL = { src: null, title: 'ずかんコンプリート！', line: 'ぜんぶ あつめたね！ ありがとう〜！' };
let zkSeen = {}, zkDoneSeen = false;
try { zkSeen = JSON.parse(localStorage.getItem(ZK_KEY) || '{}') || {}; zkDoneSeen = localStorage.getItem(ZK_DONE) === '1'; } catch (e) { zkSeen = {}; }
const zkFound = () => ZUKAN.filter((z) => zkSeen[z.id]).length;
const zkBtn = document.getElementById('zkBtn');
function zkUpdate() { document.getElementById('zkCount').textContent = zkFound() + '/' + ZUKAN.length; }
function zkSave() { try { localStorage.setItem(ZK_KEY, JSON.stringify(zkSeen)); if (zkDoneSeen) localStorage.setItem(ZK_DONE, '1'); } catch (e) {} }
// 小物がとれたとき（または最後のシャワーで流れ落ちたとき）。初めてなら true
function zkRegister(it) {
  const isNew = !zkSeen[it.id];
  zkSeen[it.id] = (zkSeen[it.id] || 0) + 1;
  if (isNew) {
    S.newZ.push(it.id);
    if (zkFound() === ZUKAN.length && !zkDoneSeen) S.zkJust = true;
    zkBtn.classList.remove('bump'); void zkBtn.offsetWidth; zkBtn.classList.add('bump');
  }
  zkSave(); zkUpdate();
  return isNew;
}
const zkEl = document.getElementById('zukan'), zkGrid = document.getElementById('zkGrid');
function zkOpen() {
  document.getElementById('zkNum').textContent = zkFound() + ' / ' + ZUKAN.length;
  zkGrid.textContent = '';
  for (const z of ZUKAN) {
    const have = zkSeen[z.id], d = document.createElement('div');
    d.className = 'zk' + (have ? '' : ' lock');
    const pic = document.createElement('div'); pic.className = 'pic';
    const im = document.createElement('img'); im.src = IMG[z.key].src; im.alt = ''; im.draggable = false; pic.appendChild(im);
    const nm = document.createElement('b'); nm.textContent = have ? tr(z.name) : '？？？';
    const cn = document.createElement('span'); cn.className = 'cnt'; cn.textContent = have ? '×' + zkSeen[z.id] : '';
    const ln = document.createElement('i'); ln.textContent = have ? tr(z.line) : tr('どこかに いるかも…');
    d.append(pic, nm, cn, ln); zkGrid.appendChild(d);
  }
  const all = zkFound() === ZUKAN.length;
  document.getElementById('zkNote').textContent = all ? '' : tr('ぜんぶ あつめると、とくべつイラストが 見られるよ');
  document.getElementById('zkArtBtn').hidden = !(all && zkDoneSeen);
  zkEl.hidden = false;
}
zkBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); audioInit(); zkOpen(); });
zkBtn.addEventListener('click', (e) => { e.stopPropagation(); if (e.detail === 0) zkOpen(); });   // キーボードで押したとき
document.getElementById('zkClose').addEventListener('click', () => { zkEl.hidden = true; });
const zkArtEl = document.getElementById('zkArt');
document.getElementById('zkArtBtn').addEventListener('click', () => {
  const img = document.getElementById('zkArtImg');
  img.src = ZK_SPECIAL.src || rewardPlaceholder({ id: 'zukan' });
  img.alt = tr(ZK_SPECIAL.title);
  document.getElementById('zkArtTitle').textContent = tr(ZK_SPECIAL.title);
  document.getElementById('zkArtLine').textContent = tr(ZK_SPECIAL.line);
  zkArtEl.hidden = false; requestAnimationFrame(() => zkArtEl.classList.add('on'));
});
document.getElementById('zkArtBack').addEventListener('click', () => { zkArtEl.classList.remove('on'); setTimeout(() => { zkArtEl.hidden = true; }, 400); });
zkUpdate();

/* ---------- 泡としずく ---------- */
// 白い泡（お股を隠す泡。透けない）
function bubbleAt(x, cx, cy, r) {
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2);
  const g = x.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.75, '#f6faff'); g.addColorStop(1, '#dfeaf6');
  x.fillStyle = g; x.fill();
  x.lineWidth = 1.4; x.strokeStyle = 'rgba(160,190,220,.7)'; x.stroke();
  x.fillStyle = 'rgba(255,255,255,1)'; x.beginPath(); x.ellipse(cx - r * 0.38, cy - r * 0.42, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2); x.fill();
}
/* シャボン玉の泡（2026-11-02 ユーザー：シャボン玉っぽく、虹色を含ませて）。
   ふちが虹色に光る、透き通った玉。先に何種類か絵を作っておき、それを押して並べる（毎回描くより軽い） */
const SOAP = [];
function makeSoap() {
  const R = 40;
  for (let v = 0; v < 6; v++) {
    const c = document.createElement('canvas'); c.width = c.height = R * 2 + 4;
    const x = c.getContext('2d'), o = R + 2, rot = v * Math.PI / 3;
    // 中：ほとんど透明。ふちに向かって少し白く
    const body = x.createRadialGradient(o, o, R * 0.2, o, o, R);
    body.addColorStop(0, 'rgba(255,255,255,0.06)'); body.addColorStop(0.7, 'rgba(255,255,255,0.16)'); body.addColorStop(1, 'rgba(255,255,255,0.55)');
    x.fillStyle = body; x.beginPath(); x.arc(o, o, R, 0, Math.PI * 2); x.fill();
    // ふちの虹色（色の帯を、玉ごとに少し回す）
    const hues = ['rgba(255,120,200,.55)', 'rgba(255,220,120,.5)', 'rgba(120,240,200,.5)', 'rgba(120,190,255,.55)', 'rgba(200,140,255,.55)', 'rgba(255,120,200,.55)'];
    const lg = x.createLinearGradient(o + Math.cos(rot) * R, o + Math.sin(rot) * R, o - Math.cos(rot) * R, o - Math.sin(rot) * R);
    hues.forEach((h, i) => lg.addColorStop(i / (hues.length - 1), h));
    x.lineWidth = R * 0.16; x.strokeStyle = lg; x.beginPath(); x.arc(o, o, R * 0.9, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 1.5; x.strokeStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.arc(o, o, R - 0.8, 0, Math.PI * 2); x.stroke();
    // 光の反射（窓のような大きい光と、小さな点）
    x.fillStyle = 'rgba(255,255,255,.9)';
    x.beginPath(); x.ellipse(o - R * 0.42, o - R * 0.45, R * 0.24, R * 0.12, -0.75, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.arc(o + R * 0.45, o + R * 0.5, R * 0.07, 0, Math.PI * 2); x.fill();
    SOAP.push(c);
  }
}
function soapAt(x, cx, cy, r) { const c = SOAP[(Math.random() * SOAP.length) | 0]; x.drawImage(c, cx - r * 1.05, cy - r * 1.05, r * 2.1, r * 2.1); }
// 泡は、マスごとに上限まで（同じ所をこすり続けても、もこもこになりすぎない）。まえの顔の上にはのせない
const onFace = (x, y, pose) => (pose === 'back' || pose === 'lookback' ? inE(x, y, LOOK_FACE) : ((x - FACE.cx) / (FACE.rx * 0.95)) ** 2 + ((y - FACE.cy + 8) / (FACE.ry * 0.95)) ** 2 < 1);
function addFoam(sd, pose, px, py, R, n, ok) {
  for (let i = 0; i < (n || 2); i++) {
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * R * 0.9, cx = px + Math.cos(a) * d, cy = py + Math.sin(a) * d;
    if (!isOn(pose, cx, cy) || onFace(cx, cy, pose) || (ok && !ok(cx, cy))) continue;
    if (sd.foamGrid[cellOf(cx, cy)] >= 0.7) continue;
    soapAt(sd.foam.x, cx, cy, rnd(6, 17));   // シャボン玉。大小を混ぜる
    eachCell(cx, cy, 14, (j) => { sd.foamGrid[j] = Math.min(1, sd.foamGrid[j] + 0.12); });
  }
}
function wetDrop(cx, cy) {
  const x = cur().wet.x, r = rnd(2, 4.5);
  x.fillStyle = 'rgba(200,230,255,.55)';
  x.beginPath(); x.ellipse(cx, cy, r, r * 1.3, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = 'rgba(255,255,255,.9)';
  x.beginPath(); x.arc(cx - r * 0.3, cy - r * 0.4, r * 0.35, 0, Math.PI * 2); x.fill();
}

/* ---------- さわった所 ---------- */
const BRUSH = 30;
function partAt(x, y) {
  const p = S.pose;
  if ((p === 'stand' || p === 'mojimoji' || p === 'banzai') && inE(x, y, CROTCH) && !inE(x, y, ZONES.stand[0], 0.85)) return 'crotch';
  if (!isBody(x, y)) return null;
  if (y > 640) return 'leg';
  if (p === 'back' || p === 'lookback') {
    const [ox, oy] = unBk(x, y);   // うしろの場所分けの線は、縮める前の座標で書いてある
    if (oy < 165) return 'head';
    if (ZONES.back.some((z) => inE(x, y, z))) return 'butt';
    if (ox > 320 && oy > 400) return 'tail';
    if (ox < 135 || ox > 520) return 'arm';
    return 'back';
  }
  if (p === 'banzai') {
    if (PITS.some((e) => inE(x, y, e, 1.4))) return 'pit';
    if (y < 215 && x > 250 && x < 420) return 'head';
  } else if (y < 196) return 'head';
  if (x > 445 && y > 470) return 'tail';
  for (const z of ZONES[p] || []) if (inE(x, y, z, z.name === 'chest' ? 1.3 : 1)) return z.name;
  if (p === 'stand' && PIT_HINT.some((e) => inE(x, y, e))) return 'pitHint';
  return 'arm';
}

/* ---------- こする ---------- */
function scrub(x0, y0, x1, y1, part) {
  // ばんざいの脇だけは、脇の汚れを落とす
  const sd = part === 'pit' ? SIDES.pit : cur(), foamSd = cur();
  const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(len / 8));
  let removed = 0;
  for (let s = 1; s <= n; s++) {
    const x = x0 + (x1 - x0) * s / n, y = y0 + (y1 - y0) * s / n;
    if (!isBody(x, y) && !isBody(x, y - 12) && !isBody(x, y + 12)) continue;
    eachCell(x, y, BRUSH, (i) => { removed += sd.dirtGrid[i]; sd.dirtGrid[i] = 0; });
    if (S.pose !== 'mojimoji') {
      // ばんざいのとき、上げた腕など「ふだんの立ち絵の形の外」についた泡は、ばんざい専用の泡（腕を下ろすと見えない）
      if (S.pose === 'banzai') { addFoam(SIDES.pit, 'banzai', x, y, BRUSH, 2, (fx, fy) => !isOn('stand', fx, fy)); addFoam(foamSd, 'banzai', x, y, BRUSH, 2, (fx, fy) => isOn('stand', fx, fy)); }
      else addFoam(foamSd, S.pose, x, y, BRUSH);
    }
    // 小物：何度かこすると取れる
    for (const it of sd.items) if (it.stuck && Math.hypot(it.x - x, it.y - y) < 32) {
      it.hp -= 0.05; it.rot += rnd(-0.05, 0.05);
      if (it.hp <= 0) { it.stuck = false; it.vx = rnd(-60, 60); it.vy = -rnd(80, 160); it.vr = rnd(-6, 6); events.push(['item', it]); }
    }
  }
  const x = sd.dirt.x;
  x.save(); x.globalCompositeOperation = 'destination-out';
  x.lineCap = 'round'; x.lineWidth = BRUSH * 2; x.strokeStyle = '#000';
  x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); x.restore();
  // 汚れが取れた所はキラキラ
  if (removed > 0.4) {
    for (let i = 0; i < Math.min(4, removed / 1.5); i++) spark(x1 + rnd(-BRUSH, BRUSH), y1 + rnd(-BRUSH, BRUSH), 0.7);
    sfx.sparkle(0.35);
  }
  compDirty = true;
}
function spark(x, y, life, big) { S.sparks.push({ x, y, life: life || 0.8, max: life || 0.8, r: big ? rnd(8, 14) : rnd(4, 9), rot: rnd(0, 1) }); }

/* ---------- ことば・吹き出し ---------- */
const LINES = {
  start: ['砂だらけになっちゃった〜。洗ってくれる？'],
  idle: ['よごれてる所を、こすってね〜', 'まだ砂がついてるよ〜'],
  head: ['きもちいい〜', 'ふぁ〜、いい気持ち…'],
  tickle: ['くすぐった〜い！', 'あはは、くすぐったいよ〜', 'ひゃ〜、そこ弱いの〜！'],
  belly: ['えへへ…', 'おなか、ぽよぽよ〜', 'やさしくね〜'],
  tail: ['ひゃっ！', 'しっぽは、やさしくね〜'],
  crotch: ['そ、そこは自分で洗うから〜！', 'そ、そこはいいの〜！'],
  banzai: ['ばんざ〜い！ わきも洗って〜'],
  pit: ['わきは、くすぐった〜い！', 'あはは、だめ〜！'],
  back: ['せなか、きもちいい〜', 'そこそこ〜♪'],
  butt: ['ひゃっ、おしり〜！', 'は、はずかしい〜', 'おしりも、ぽよん…'],
  turnBack: ['うしろも、お願い〜'],
  turnFront: ['まえも、お願い〜'],
  item: ['とれた〜！'],
  foam: ['あわあわ〜！ シャワーで流して〜'],
  toBrush: ['もっと、ゴシゴシして〜'],
  rinse: ['さいごに、ザーッと流して〜！'],
  foamBack: ['うしろの泡も、流して〜'],
  foamFront: ['まえの泡も、流して〜'],
  shower: ['あったか〜い♪', 'きもちいい〜'],
  purun: ['ぷるんっ！', 'えへへ、はじいた〜'],
  clean: ['ピカピカになった〜！ ありがと♪']
};
const bubbleEl = document.getElementById('bubble');
let bubbleUntil = 0, bubbleCool = 0;
function say(key, force) {
  if (!force && S.t < bubbleCool) return;
  const list = LINES[key] || [key];
  bubbleEl.textContent = tr(pick(list));
  bubbleEl.classList.add('on');
  bubbleUntil = S.t + 2.2; bubbleCool = S.t + 2.6;
}
const popsEl = document.getElementById('pops');
function pop(text, x, y, cls) {
  const el = document.createElement('div');
  el.className = 'pop ' + (cls || '');
  el.textContent = tr(text);
  el.style.left = Math.max(60, Math.min(W - 60, x)) + 'px';
  el.style.top = Math.max(110, y) + 'px';
  popsEl.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}
function setFace(name, sec) { if (S.face !== name) { S.face = name; compDirty = true; } S.faceUntil = S.t + sec; }
function setPose(name, sec) {
  if (S.pose !== name) { S.pose = name; compDirty = true; wasMoving = true; }
  S.poseUntil = sec ? S.t + sec : 0;
}
const basePose = () => (S.side === 'back' ? 'back' : 'stand');

// 上の説明の文はやめた（2026-11-02 ユーザー）。代わりに、はじめに道具のアイコンを点滅させるガイド（runGuide）
const hintEl = document.getElementById('hint');
hintEl.hidden = true;
function setHint() {}
/* ---------- はじめのガイド（3秒以内）：ブラシのアイコンが点滅して「ブラシで泡立てて！」→ シャワーのアイコンが点滅して「泡を流して！」
   ページを開いて最初の1回だけ。途中で画面にさわったら、すぐ終わる ---------- */
const tipEl = document.getElementById('tip');
let guide = null;
function showTip(btn, text) {
  for (const b of Object.values(toolBtns)) b.classList.remove('blink');
  btn.classList.add('blink');
  tipEl.textContent = tr(text);
  const r = btn.getBoundingClientRect();
  tipEl.style.top = (r.top + r.height / 2) + 'px';
  tipEl.style.right = (W - r.left + 12) + 'px';
  tipEl.hidden = false;
  tipEl.classList.remove('on'); void tipEl.offsetWidth; tipEl.classList.add('on');
}
function endGuide() {
  if (!guide) return;
  guide.timers.forEach(clearTimeout); guide = null;
  for (const b of Object.values(toolBtns)) b.classList.remove('blink');
  tipEl.classList.remove('on'); tipEl.hidden = true;
}
function runGuide(after) {
  endGuide();
  guide = { timers: [] };
  const g = guide;
  g.timers.push(setTimeout(() => showTip(toolBtns.brush, 'ブラシで泡立てて！'), 250));
  g.timers.push(setTimeout(() => showTip(toolBtns.shower, '泡を流して！'), 1550));
  g.timers.push(setTimeout(() => { endGuide(); if (after) after(); }, 2850));
}
const gaugeEl = document.getElementById('gauge'), gfill = document.getElementById('gfill'), gnum = document.getElementById('gnum');
const dirtOf = (n) => sumGrid(SIDES[n].dirtGrid);
const foamOf = (n) => sumGrid(SIDES[n].foamGrid);
function updateGauge() {
  let g;
  if (S.stage === 'wash') {
    // 汚れが残っている間は 100% → 20%（残り約1割で 20%。最後のひとかけを探さなくてよいように）。そのあとは泡を流して 20% → 0%
    const da = Math.max(0, Math.min(1, (dirtLeft() / S.dirt0 - 0.12) / 0.88));
    if (da > 0) { g = 20 + 80 * da; S.foamRef = null; }
    else {
      const f = foamOf('front') + foamOf('back');
      if (S.foamRef == null) S.foamRef = Math.max(f, 1);
      g = 20 * Math.max(0, Math.min(1, (f / S.foamRef - 0.08) / 0.92));   // 腕のはしなどに少し残っても、0% に
    }
  } else g = 0;
  const shown = g <= 0 ? 0 : Math.max(1, Math.ceil(g));
  if (shown !== S.gauge) {
    S.gauge = shown;
    gfill.style.width = shown + '%'; gnum.textContent = shown + '%';
    gaugeEl.setAttribute('aria-valuenow', String(shown));
  }
  gaugeEl.classList.toggle('foam', S.stage === 'wash' && g <= 20);
  gaugeEl.classList.toggle('done', shown === 0);
  return g;
}

/* ---------- まえ・うしろ（右下のボタン） ---------- */
const turnBtn = document.getElementById('turn');
function updateTurnBtn() {
  turnBtn.textContent = tr(S.side === 'front' ? '↻ うしろ' : '↻ まえ');
  turnBtn.hidden = S.stage !== 'wash';
}
// まえ・うしろのボタンも、指がふれた瞬間に（道具のアイコンと同じ理由）。キーボードの Enter・スペースは click で
turnBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); audioInit(); turn(); });
turnBtn.addEventListener('click', (e) => { if (e.detail === 0) { audioInit(); turn(); } });
function turn() {
  if (S.turn || S.stage !== 'wash') return;
  S.turn = { t: 0, swapped: false };
  turnBtn.classList.remove('ask');
  sfx.whoosh();
}

/* ---------- 音（Web Audio でその場で作る） ---------- */
let AC = null, soundOn = true;
const sndBtn = document.getElementById('snd');
sndBtn.textContent = tr('音 ON');
sndBtn.addEventListener('click', () => {
  audioInit(); soundOn = !soundOn;
  sndBtn.textContent = tr(soundOn ? '音 ON' : '音 OFF'); sndBtn.setAttribute('aria-pressed', String(soundOn));
  if (!soundOn) showerSound(false);
});
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; }
}
function env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
function tone(type, f0, f1, dur, vol, delay) {
  if (!AC || !soundOn) return;
  const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, 0.01, vol, dur); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + 0.05);
}
let noiseBuf = null;
function getNoise() {
  if (!noiseBuf) {
    const n = AC.sampleRate * 2; noiseBuf = AC.createBuffer(1, n, AC.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}
function noise(dur, vol, f0, f1, q) {
  if (!AC || !soundOn) return;
  const t = AC.currentTime, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = getNoise(); f.type = 'bandpass'; f.Q.value = q || 1;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, 0.01, vol, dur); s.connect(f).connect(g).connect(AC.destination); s.start(t); s.stop(t + dur + 0.05);
}
let lastRub = 0, lastSparkle = 0, lastBoing = 0;
const sfx = {
  rub() { if (S.t - lastRub < 0.09) return; lastRub = S.t; noise(0.12, 0.07, rnd(2500, 3800), rnd(1500, 2200), 2.5); if (Math.random() < 0.3) tone('sine', rnd(900, 1400), rnd(1600, 2200), 0.06, 0.04); },
  sparkle(v) { if (S.t - lastSparkle < 0.18) return; lastSparkle = S.t; const f = rnd(1800, 2600); tone('sine', f, f * 1.5, 0.12, 0.06 * (v || 1)); tone('triangle', f * 1.5, f * 2, 0.15, 0.04 * (v || 1), 0.06); },
  boing(k) { if (S.t - lastBoing < 0.12) return; lastBoing = S.t; k = Math.min(1, k || 0.5); tone('sine', 220, 480 + 200 * k, 0.1, 0.22 * (0.5 + k / 2)); tone('sine', 480 + 200 * k, 280, 0.24, 0.18 * (0.5 + k / 2), 0.09); },
  plop() { tone('sine', 700, 180, 0.16, 0.22); noise(0.18, 0.08, 1200, 400, 1.5); },
  splash() { noise(0.7, 0.28, 2600, 500, 0.7); },
  whoosh() { noise(0.3, 0.12, 400, 1600, 1.2); },
  giggle() { [0, 0.11, 0.22].forEach((d, i) => tone('triangle', 620 - i * 40, 760 - i * 40, 0.08, 0.06, d)); },
  fanfare() { [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, f, 0.22, 0.12, i * 0.12)); }
};
let showerSrc = null, showerGain = null;
function showerSound(on) {
  if (!AC) return;
  if (on && soundOn && !showerSrc) {
    showerSrc = AC.createBufferSource(); showerSrc.buffer = getNoise(); showerSrc.loop = true;
    const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 0.6;
    showerGain = AC.createGain(); showerGain.gain.value = 0.0001; showerGain.gain.exponentialRampToValueAtTime(0.09, AC.currentTime + 0.15);
    showerSrc.connect(f).connect(showerGain).connect(AC.destination); showerSrc.start();
  } else if (!on && showerSrc) {
    const s = showerSrc; showerGain.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + 0.2); setTimeout(() => { try { s.stop(); } catch (e) {} }, 260);
    showerSrc = null;
  }
}

/* ---------- 指の操作 ---------- */
let ptr = null;
const soft = (v, m) => m * Math.tanh(v / m);
cv.addEventListener('pointerdown', (e) => {
  audioInit(); endGuide();
  if (S.stage !== 'wash' || S.turn) return;
  const p = toImg(e.clientX, e.clientY);
  ptr = { x: p.x, y: p.y, sx: p.x, sy: p.y, t: S.t, moved: 0, part: partAt(p.x, p.y), lastPart: null };
  try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  S.lastInput = S.t;
  if (S.tool === 'shower') { S.showerOn = true; S.sx = p.x; S.sy = p.y; showerSound(true); }
  touchPart(ptr.part, true);
});
cv.addEventListener('pointermove', (e) => {
  if (!ptr) return;
  const p = toImg(e.clientX, e.clientY);
  const d = Math.hypot(p.x - ptr.x, p.y - ptr.y);
  if (d < 2) return;
  ptr.moved += d; S.lastInput = S.t;
  const part = partAt(p.x, p.y);
  if (part !== ptr.lastPart) { touchPart(part, false); ptr.lastPart = part; }
  if (S.tool === 'brush') {
    if (part && part !== 'crotch') {
      scrub(ptr.x, ptr.y, p.x, p.y, part); sfx.rub(); rubReact(part, d);
    }
    S.brush = part && part !== 'crotch' ? { x: p.x, y: p.y, a: Math.sin(S.t * 30) * 0.15 } : null;
    // おなか・お尻：指につられて動く（こすった向きに）
    if (part === 'belly' || part === 'butt') S.follow = { x: soft((p.x - ptr.sx) * 0.35, 24), y: soft((p.y - ptr.sy) * 0.35, 20) };
    else S.follow = null;
    if (ptr.moved > 60) hintEl.classList.add('small');
  } else {
    S.sx = p.x; S.sy = p.y;
    if (ptr.moved > 60) hintEl.classList.add('small');
  }
  ptr.x = p.x; ptr.y = p.y;
});
function endPtr() {
  if (!ptr) return;
  // シャワーの間に、おなか・胸・お尻を軽くタップ → ぷるん！で水をはじく
  if (S.tool === 'shower' && ptr.moved < 14 && S.t - ptr.t < 0.35 && ['belly', 'chest', 'butt'].includes(ptr.part)) purun(ptr.sx, ptr.sy);
  ptr = null; S.follow = null; S.brush = null; S.showerOn = false; showerSound(false); S.lastInput = S.t;
}
cv.addEventListener('pointerup', endPtr);
cv.addEventListener('pointercancel', endPtr);

// さわった所の反応（さわった瞬間・ほかの所へ移ったとき）
function touchPart(part, first) {
  if (part === 'crotch') {
    setPose('mojimoji', 1.8); S.shakeT = 0.25;
    if (S.t - (S.said.crotch || -9) > 2.5) { S.said.crotch = S.t; say('crotch', true); sfx.giggle(); }
  } else if (part === 'pitHint' && S.tool === 'brush') {
    // 脇の下にふれたら、ばんざいしてくれる
    setPose('banzai', 2.5); say('banzai', true); sfx.giggle(); S.jb.v += 120;
  }
}
// こすっている間の反応
function rubReact(part, d) {
  if (S.pose === 'banzai') S.poseUntil = Math.max(S.poseUntil, S.t + 2.5);   // 脇を洗っている間は、ばんざいのまま
  if (part === 'head') { if (S.pose === 'stand') setFace('melt', 1.0); if (Math.random() < 0.02) say('head'); }
  else if (part === 'tail' && S.side === 'back') { lookBack(); if (Math.random() < 0.015) say('tail'); }
  else if (part === 'tail') { if (S.face !== 'troubled' && S.pose === 'stand') { setFace('troubled', 1.2); say('tail'); S.shakeT = 0.2; } else if (S.pose === 'stand') setFace('troubled', 1.0); else if (Math.random() < 0.015) say('tail'); }
  else if (part === 'belly') { if (S.pose === 'stand') setFace('shy', 1.0); if (Math.random() < 0.012) say('belly'); }
  else if (part === 'back') { if (Math.random() < 0.012) say('back'); }
  else if (part === 'butt') { lookBack(); if (Math.random() < 0.015) { say('butt'); S.shakeT = 0.2; } }
  else if (part === 'pit') {
    S.tickle += d * 1.6;
    if (S.tickle > rnd(300, 600)) { S.tickle = 0; S.shakeT = 0.45; say('pit', true); sfx.giggle(); S.jcL.v += 120; S.jcR.v += 110; S.jb.v += 90; }
  } else if (part === 'chest' || part === 'arm' || part === 'leg' || part === 'pitHint') {
    S.tickle += d * (part === 'chest' ? 1 : 0.6);
    if (S.tickle > rnd(600, 1100)) {
      S.tickle = 0; if (S.pose === 'stand') setFace('happy', 1.4); S.shakeT = 0.45; say('tickle', true); sfx.giggle();
      S.jcL.v += 120; S.jcR.v += 110; S.jb.v += 90;
    }
  }
}

// うしろで、お尻・しっぽをさわると、ふり返る
function lookBack() { if (S.side === 'back' && (S.pose === 'back' || S.pose === 'lookback')) setPose('lookback', 1.6); }

/* ---------- ぷるん！（水をはじく） ---------- */
function purun(x, y) {
  const zs = ZONES[S.pose] || [];
  let z = zs.find((q) => inE(x, y, q, 1.3)) || zs[0];
  if (!z) return;
  S.jb.v += 520; setTimeout(() => { S.jcL.v += 420; S.jcR.v += 390; }, 50);
  sfx.boing(1); if (S.pose === 'stand') setFace('shy', 1.2); lookBack();
  const sc = toScr(x, y); pop('ぷるん！', sc.x + 40, sc.y - 30);
  if (Math.random() < 0.5) say(S.side === 'back' ? 'butt' : 'purun');
  // ぷるんした所（おなか・お尻なら両方）から、しずくが飛ぶ
  const hit = zs.filter((q) => q.name === z.name);
  for (const c of hit) {
    for (let i = 0; i < 18; i++) {
      const a = rnd(-Math.PI, 0), sp = rnd(180, 420);
      S.drops.push({ x: c.cx + Math.cos(a) * c.rx * 0.7, y: c.cy + Math.sin(a) * c.ry * 0.6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 100, r: rnd(2.5, 5), life: 1.4, free: true });
    }
    const wx = cur().wet.x;
    wx.save(); wx.globalCompositeOperation = 'destination-out'; wx.beginPath(); wx.ellipse(c.cx, c.cy, c.rx * 0.8, c.ry * 0.8, 0, 0, Math.PI * 2); wx.fill(); wx.restore();
  }
  compDirty = true;
}

/* ---------- ブラシとシャワー（右上のアイコンをタップして切りかえる。2026-11-02 ユーザー：ゲージでの自動切りかえはやめた） ---------- */
const toolEl = document.getElementById('tools');
const toolBtns = { brush: document.getElementById('tBrush'), shower: document.getElementById('tShower') };
const dirtLeft = () => dirtOf('front') + dirtOf('back') + dirtOf('pit');
const dirtDone = () => dirtLeft() / S.dirt0 < 0.12;
function setTool(t, quiet) {
  if (S.tool === t) return;
  S.tool = t; S.brush = null;
  if (t === 'shower') {
    if (ptr) { S.showerOn = true; S.sx = ptr.x; S.sy = ptr.y; showerSound(true); }
    setHint('<b>指でなぞると、シャワーが出るよ</b><br><span class="sub">泡を流してね。おなかや胸・お尻をタップすると…？</span>');
  } else {
    S.showerOn = false; showerSound(false);
    setHint('<b>ブラシで、よごれをこすってね</b><br><span class="sub">右上のアイコンで、ブラシとシャワーを切りかえられるよ</span>');
  }
  if (!quiet) sfx.whoosh();
  toolBtns.shower.classList.remove('ask');
  updateTools();
}
// 指がふれた瞬間に切りかえる（click を待たない）。スマホでは、こすった直後のタップを「ダブルタップ」とみなして
// click が来ないことがあった（2026-11-02 ユーザー「すぐシャワーに変えようとしても反応しない」）
for (const t of ['brush', 'shower']) {
  toolBtns[t].addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); audioInit(); endGuide(); setTool(t); });
  toolBtns[t].addEventListener('click', (e) => { e.stopPropagation(); setTool(t); });   // キーボードで押したとき
}
function updateTools() {
  for (const t of ['brush', 'shower']) { toolBtns[t].classList.toggle('on', S.tool === t); toolBtns[t].setAttribute('aria-pressed', String(S.tool === t)); }
  toolEl.hidden = S.stage !== 'wash';
  zkBtn.hidden = S.stage !== 'wash';
}
function toolStep() {
  // 汚れが落ちたのにブラシのままなら、シャワーのアイコンをゆらしてさそう
  if (S.stage === 'wash' && S.tool === 'brush' && dirtDone() && !S.said.toShower) {
    S.said.toShower = S.t; toolBtns.shower.classList.add('ask'); say('foam', true);
  }
}

/* ---------- 洗い終わったときのカットイン（2026-11-02 ユーザー「いきなり過ぎて戸惑う」）：
   笑顔と「きれいになった！」の帯が右から入って左へ抜ける（約1.5秒。ぽんぽこリズムの「スピードアップ！」と同じ形）→ そのあと真上からのシャワー（toFinale） ---------- */
const CUTIN_SEC = 1.5;
const cutinEl = document.getElementById('cutin');
document.getElementById('cutFace').src = SRC.cutface;
function toCutin() {
  S.stage = 'cutin'; S.cutT = 0; S.showerOn = false; showerSound(false); ptr = null; S.brush = null;
  S.side = 'front'; setPose('stand'); setFace('happy', 99); compDirty = true;
  // 残った少しの汚れは消す。くっついている小物も落とす
  for (const n of ['front', 'back', 'pit']) {
    const sd = SIDES[n]; clr(sd.dirt.x); sd.dirtGrid.fill(0);
    for (const it of sd.items) if (it.stuck) { zkRegister(it); it.stuck = false; it.vx = rnd(-60, 60); it.vy = -100; it.vr = rnd(-5, 5); }   // 残った小物も、シャワーで流れて、ずかんに入る
  }
  updateTurnBtn(); updateTools(); hintEl.classList.add('small');
  bubbleEl.classList.remove('on'); bubbleUntil = 0;   // 前のひとことは消す（帯に重ならないように）
  // 帯の高さ：タヌくんの胸のあたり（顔は帯の上に見える）
  const band = cutinEl.firstElementChild;
  band.style.top = (OY + 345 * K - 64) + 'px';
  cutinEl.hidden = false; cutinEl.classList.remove('go'); void cutinEl.offsetWidth; cutinEl.classList.add('go');
  sfx.whoosh(); sfx.sparkle(1.4);
  for (let i = 0; i < 24; i++) { const x = rnd(80, 560), y = rnd(20, FLOOR - 40); if (isBody(x, y)) spark(x, y, rnd(0.8, 1.8), true); }
}
function cutinStep(h) {
  S.cutT += h;
  if (S.cutT > CUTIN_SEC) { cutinEl.hidden = true; toFinale(); }
}

/* ---------- 仕上げ：真上からのシャワーで最後の泡が流れて、お股の泡も流れはじめる → ぎりぎり見えないところで結果の画面へ ---------- */
function toFinale() {
  S.stage = 'finale'; S.finT = 0; S.showerOn = false; showerSound(false); ptr = null; S.brush = null;
  compDirty = true;   // 顔は、カットインの笑顔のまま
  updateTurnBtn(); updateTools(); hintEl.classList.add('small');
  say('rinse', true);
  if (AC && soundOn) showerSound(true);
}
function finaleStep(h) {
  S.finT += h;
  // 上から、たっぷりのシャワー
  for (let i = 0; i < 4; i++) S.drops.push({ x: BODY_CX + rnd(-60, 60), y: -60, vx: rnd(-140, 140), vy: rnd(700, 900), r: rnd(2, 3.5), life: 1.6, target: rnd(80, 700) });
  // お股の泡が、少しずつ流れて小さくなる（でも、いちばん小さくても必ず隠れる）
  S.cf = Math.max(0, 1 - S.finT / 1.6);
  if (S.finT > 1.25 && !S.clearShown) { S.clearShown = true; showerSound(false); toClear(); }
}
/* ---------- ごほうびの特別イラスト（ピカピカになったら1枚。出やすさは weight。シーソーと同じ「集める」形） ----------
   src が null の間は、仮の絵（準備中）を出す。絵ができたら img/sp_towel.webp のようなパスを文字列で書く（tools/make_washing_art.py が washing/art/sp_〇〇_src.* から作る）
   集めた記録は、この端末の localStorage（tanu-washing-special）だけ。本編のアルバムとはまだつないでいない */
const REWARDS = [
  { id: 'towel',   weight: 6, src: 'img/sp_towel.webp',   title: 'タオルで、フキフキ〜',   line: 'ふわふわのタオル、気持ちいい〜♪' },
  { id: 'splash',  weight: 3, src: 'img/sp_splash.webp',  title: 'ぶるぶる〜っ！',         line: '水しぶき、飛ばしちゃえ〜♪' },
  { id: 'stumble', weight: 1, src: 'img/sp_stumble.webp', title: 'あわわっ、よろけちゃう！', line: '着替えようとして、バランスをくずしちゃった〜！' }
];
let rwSeen = {};
try { rwSeen = JSON.parse(localStorage.getItem('tanu-washing-special') || '{}') || {}; } catch (e) { rwSeen = {}; }
function rewardPlaceholder(rw) {
  // 仮の絵：空の色の上に、立ち絵と「準備中」
  const c = document.createElement('canvas'); c.width = 640; c.height = 800;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 800); g.addColorStop(0, '#bfe6ff'); g.addColorStop(1, '#eaf7ff');
  x.fillStyle = g; x.fillRect(0, 0, 640, 800);
  x.drawImage(IMG.stand, 0, 0, 640, 800);
  x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(0, 700, 640, 100);
  x.fillStyle = '#3a2210'; x.font = '700 30px sans-serif'; x.textAlign = 'center';
  x.fillText('ごほうびの絵「' + rw.id + '」（準備中）', 320, 762);
  return c.toDataURL('image/png');
}
const ctitleEl = document.querySelector('#clear .ctitle'), cZkEl = document.getElementById('cZk');
function showReward() {
  ctitleEl.textContent = tr('ピカピカ！'); ctitleEl.classList.remove('long'); cZkEl.hidden = true;
  if (S.zkJust) {   // ずかんがそろった！ → ごほうびの代わりに、とくべつイラスト
    S.zkJust = false; zkDoneSeen = true; zkSave();
    ctitleEl.textContent = tr('ずかんコンプリート！'); ctitleEl.classList.add('long');
    const im = document.getElementById('rwImg');
    im.src = ZK_SPECIAL.src || rewardPlaceholder({ id: 'zukan' }); im.alt = tr(ZK_SPECIAL.title);
    document.getElementById('cLine').textContent = tr(ZK_SPECIAL.title);
    document.getElementById('cNote').textContent = tr(ZK_SPECIAL.line);
    document.getElementById('rwNew').style.visibility = 'visible';
    document.getElementById('rwCount').textContent = tr('ずかん {a} / {b}', { a: zkFound(), b: ZUKAN.length });
    return;
  }
  let r = Math.random() * REWARDS.reduce((a, s) => a + s.weight, 0), rw = REWARDS[0];
  for (const s of REWARDS) { if ((r -= s.weight) < 0) { rw = s; break; } }
  const isNew = !rwSeen[rw.id];
  rwSeen[rw.id] = (rwSeen[rw.id] || 0) + 1;
  try { localStorage.setItem('tanu-washing-special', JSON.stringify(rwSeen)); } catch (e) {}
  const img = document.getElementById('rwImg');
  img.src = rw.src || rewardPlaceholder(rw);
  img.alt = tr(rw.title) + ' ' + tr(rw.line);
  document.getElementById('cLine').textContent = tr(rw.title);
  document.getElementById('cNote').textContent = tr(rw.line);
  document.getElementById('rwNew').style.visibility = isNew ? 'visible' : 'hidden';
  document.getElementById('rwCount').textContent = tr('あつめた {a} / {b}', { a: REWARDS.filter((s) => rwSeen[s.id]).length, b: REWARDS.length });
  if (S.newZ.length) { cZkEl.textContent = tr('ずかんに あたらしく {n}こ とうろく！', { n: S.newZ.length }); cZkEl.hidden = false; }
}
function toClear() {
  S.stage = 'clear';
  for (const n of ['front', 'back', 'pit']) { SIDES[n].foamGrid.fill(0); clr(SIDES[n].foam.x); clr(SIDES[n].wet.x); }
  compDirty = true;
  updateGauge(); sfx.fanfare(); setFace('shy', 99);
  say('clean', true);
  for (let i = 0; i < 40; i++) { const x = rnd(80, 560), y = rnd(20, FLOOR - 40); if (isBody(x, y)) spark(x, y, rnd(0.8, 1.8), true); }
  // 結果の画面は、すぐにかぶせる（泡がこれ以上流れる前に）
  const el = document.getElementById('clear');
  showReward();
  el.hidden = false; requestAnimationFrame(() => el.classList.add('on'));
}
document.getElementById('again').addEventListener('click', () => {
  const el = document.getElementById('clear'); el.classList.remove('on'); setTimeout(() => { el.hidden = true; }, 600);
  start();
});

/* ---------- 泡を流す（シャワーの水・流れ落ちる水） ---------- */
function rinse(x, y, r, amount, alpha) {
  if (S.pose === 'banzai') rinseLayer(SIDES.pit, x, y, r, amount, alpha);   // 上げた腕の泡
  rinseLayer(cur(), x, y, r, amount, alpha);
}
function rinseLayer(sd, x, y, r, amount, alpha) {
  let had = 0;
  eachCell(x, y, r, (i) => { had += sd.foamGrid[i]; sd.foamGrid[i] = Math.max(0, sd.foamGrid[i] - amount); });
  if (had <= 0.01) return;
  const fx = sd.foam.x;
  fx.save(); fx.globalCompositeOperation = 'destination-out';
  const eg = fx.createRadialGradient(x, y, 0, x, y, r);
  eg.addColorStop(0, 'rgba(0,0,0,' + alpha + ')'); eg.addColorStop(1, 'rgba(0,0,0,0)');
  fx.fillStyle = eg; fx.fillRect(x - r, y - r, r * 2, r * 2); fx.restore();
  if (had > 0.3 && Math.random() < 0.04) spark(x + rnd(-20, 20), y + rnd(-10, 20), 0.6);   // 流れた所はキラキラ
  compDirty = true;
}

/* ---------- 物理（1/240 秒ずつ） ---------- */
function spring(s, k, c, h, rest) { s.v += (-k * (s.y - (rest || 0)) - c * s.v) * h; s.y += s.v * h; }
function step(h) {
  S.t += h;
  // くるっと回る（0.36 秒。まんなかで、まえ・うしろを入れかえる）
  if (S.turn) {
    S.turn.t += h;
    if (!S.turn.swapped && S.turn.t >= 0.18) {
      S.turn.swapped = true; S.side = S.side === 'front' ? 'back' : 'front';
      setPose(basePose()); S.face = null; compDirty = true; updateTurnBtn();
    }
    if (S.turn.t >= 0.36) S.turn = null;
  }
  if (S.poseUntil && S.t > S.poseUntil && !(ptr && S.pose === 'banzai' && ptr.lastPart === 'pit')) setPose(basePose());
  // 体をゆする（くすぐったい・もじもじ・ぶるぶる）。おなかは少し遅れてついてくる
  const prevX = S.shakeX;
  if (S.shakeT > 0) {
    S.shakeT -= h; S.shakeX = Math.sin(S.t * 30) * 5 * Math.min(1, S.shakeT * 4);
  } else S.shakeX = 0;
  const vel = (S.shakeX - prevX) / h;
  const f = S.follow;
  spring(S.bx, 130, 7, h, (f ? f.x : 0) - vel * 0.035);
  spring(S.by, 130, 7, h, f ? f.y : 0);
  spring(S.jb, 110, 2.6, h);
  spring(S.jcL, 230, 3.0, h);
  spring(S.jcR, 255, 3.3, h);

  // 息：足もとを中心に、ゆっくりふくらむ（いつも）
  const br = Math.sin(S.t * 2 * Math.PI / 3.4);
  BR.sx = 1 + 0.006 * br; BR.sy = 1 + 0.012 * br;
  toolStep();
  if (S.stage === 'cutin') cutinStep(h);
  if (S.stage === 'finale') finaleStep(h);
  // 取れた小物：床に落ちて、少しして消える
  for (const n of ['front', 'back', 'pit']) for (const it of SIDES[n].items) if (!it.stuck && !it.gone) {
    if (it.rest != null) { it.rest += h; if (it.rest > 1.2) it.gone = true; continue; }
    it.vy += 900 * h; it.x += it.vx * h; it.y += it.vy * h; it.rot += it.vr * h;
    if (it.y > FLOOR - 6) { it.y = FLOOR - 6; it.rest = 0; if (n === S.side || n === 'pit') events.push(['plop', it]); }
    compDirty = true;
  }
  // シャワーの水
  if (S.tool === 'shower' && S.stage === 'wash' && S.showerOn && Math.random() < 0.9) {
    // 水はたっぷり、広めに（2026-11-02 ユーザー：流せる量を多く、爽快に）
    for (let i = 0; i < 5; i++) S.drops.push({ x: S.sx + rnd(-44, 44), y: S.sy - 145, vx: rnd(-30, 30), vy: rnd(700, 860), r: rnd(2, 3.8), life: 1.5, target: S.sy + rnd(-40, 30) });
  }
  const zs = ZONES[S.pose] || [];
  for (const d of S.drops) {
    d.life -= h;
    if (d.run) {
      // 体をつたって流れ落ちる水：通った所の泡を少しずつ流す
      d.x += d.vx * h; d.y += d.vy * h;
      if (!isBody(d.x, d.y) || d.life <= 0) { d.run = false; d.free = true; d.vy = 60; d.life = 0.8; continue; }
      if (Math.random() < 0.6) rinse(d.x, d.y, 22, 0.15, 0.5);
      continue;
    }
    d.vy += 1500 * h; d.x += d.vx * h; d.y += d.vy * h;
    if (d.free || d.life <= 0) { if (d.y > FLOOR && d.vy > 0 && !d.dead) { d.dead = true; if (Math.random() < 0.3) S.ripples.push({ x: d.x, t: 0 }); } continue; }
    if (d.y > FLOOR) { d.dead = true; if (Math.random() < 0.25) S.ripples.push({ x: d.x, t: 0 }); continue; }
    // 水は、指のあたり（target）で体に当たる。上の方の体は通りぬける（シャワーを当てたい所に当てられるように）
    if (d.y >= d.target && isBody(d.x, d.y)) {
      rinse(d.x, d.y + 8, 40, 0.5, 0.95);
      if (Math.random() < 0.06) wetDrop(d.x + rnd(-14, 14), d.y + rnd(0, 26));
      // おなか・胸・お尻に当たった水は、ぽよんとはねる（半分くらい。残りは体をつたって流れる）
      const z = zs.find((q) => inE(d.x, d.y, q));
      if (z && Math.random() < 0.5) {
        d.free = true; d.vy = -d.vy * rnd(0.35, 0.55); d.vx = (d.x - z.cx) * rnd(1.2, 2.2) + rnd(-60, 60);
        S[z.s].v += z.s === 'jb' ? 14 : 10;
        if (z.name === 'butt' && Math.random() < 0.03) lookBack();
        if (Math.random() < 0.04) sfx.boing(0.25);
      } else { d.run = true; d.vx = rnd(-12, 12); d.vy = rnd(110, 170); d.life = 1.6; }
    }
  }
  S.drops = S.drops.filter((d) => d.life > 0 && !d.dead && d.y < FLOOR + 20);
  for (const p of S.sparks) p.life -= h;
  S.sparks = S.sparks.filter((p) => p.life > 0);
  for (const r of S.ripples) r.t += h;
  S.ripples = S.ripples.filter((r) => r.t < 0.6);
}

/* ---------- 描く ---------- */
// 重ねる層：ふだんの絵（まえ・うしろ）以外の絵のときは、その絵の形で切りぬいて重ねる
function drawLayers(x, sd, clipPose) {
  if (!clipPose) {
    x.drawImage(sd.dirt.c, 0, -TOP);
    for (const it of sd.items) if (it.stuck) drawItem(x, it);
    x.drawImage(sd.foam.c, 0, -TOP); x.drawImage(sd.wet.c, 0, -TOP);
    return;
  }
  const t = tmp.x; clr(t);
  t.drawImage(sd.dirt.c, 0, -TOP);
  for (const it of sd.items) if (it.stuck) drawItem(t, it);
  t.drawImage(sd.foam.c, 0, -TOP); t.drawImage(sd.wet.c, 0, -TOP);
  t.globalCompositeOperation = 'destination-in'; drawPose(t, clipPose); t.globalCompositeOperation = 'source-over';
  x.drawImage(tmp.c, 0, -TOP);
}
function recompose() {
  const x = comp.x; clr(x);
  drawPose(x, S.pose);
  if (S.pose === 'stand' && S.face && FACES[S.face]) x.drawImage(FACES[S.face], 0, -TOP);
  const base = basePose();
  if (S.pose !== 'shake') drawLayers(x, cur(), S.pose === base ? null : S.pose);
  if (S.pose === 'banzai') {   // 脇の汚れと、上げた腕の泡
    x.drawImage(SIDES.pit.dirt.c, 0, -TOP);
    x.drawImage(SIDES.pit.foam.c, 0, -TOP);
  }
  compDirty = false;
  return true;
}
let warpOut = null;
function warp(changed) {
  const zs = ZONES[S.pose] || [];
  const jy = soft(S.jb.y, 34), ox = soft(S.bx.y, 26), oy = soft(S.by.y, 22);
  const sv = { jb: jy, jcL: soft(S.jcL.y, 28), jcR: soft(S.jcR.y, 28) };
  const moving = zs.length && (Math.abs(jy) > 0.12 || Math.abs(ox) > 0.12 || Math.abs(oy) > 0.12 || Math.abs(sv.jcL) > 0.12 || Math.abs(sv.jcR) > 0.12);
  if (!changed && !moving && !wasMoving) return;
  clr(outL.x); outL.x.drawImage(comp.c, 0, -TOP);
  wasMoving = moving;
  if (!moving) return;
  let BX0 = IW, BX1 = 0, BY0 = IH, BY1 = -TOP;
  for (const z of zs) { BX0 = Math.min(BX0, z.cx - z.rx); BX1 = Math.max(BX1, z.cx + z.rx); BY0 = Math.min(BY0, z.cy - z.ry); BY1 = Math.max(BY1, z.cy + z.ry); }
  BX0 = Math.max(0, BX0 | 0); BX1 = Math.min(IW, Math.ceil(BX1)); BY0 = Math.max(-TOP, BY0 | 0); BY1 = Math.min(IH, Math.ceil(BY1));
  const bw = BX1 - BX0, bh = BY1 - BY0;
  const src = comp.x.getImageData(BX0, BY0 + TOP, bw, bh), d = src.data;
  if (!warpOut || warpOut.width !== bw || warpOut.height !== bh) warpOut = outL.x.createImageData(bw, bh);
  const o = warpOut.data;
  for (let y = 0; y < bh; y++) {
    const Y = y + BY0;
    for (let x = 0; x < bw; x++) {
      const X = x + BX0;
      let dx = 0, dy = 0;
      for (const z of zs) {
        const u = (X - z.cx) / z.rx, v = (Y - z.cy) / z.ry, r2 = u * u + v * v;
        if (r2 < 1) {
          const w = (1 - r2) * (1 - r2), j = sv[z.s];
          dy += (j + oy * z.f) * w; dx += ox * z.f * w + (z.s === 'jb' ? (X - z.cx) * j * (0.5 / z.ry) * w : 0);
        }
      }
      const i = (y * bw + x) * 4;
      if (dx === 0 && dy === 0) { o[i] = d[i]; o[i + 1] = d[i + 1]; o[i + 2] = d[i + 2]; o[i + 3] = d[i + 3]; continue; }
      let sx = x - dx, sy = y - dy;
      if (sx < 0) sx = 0; else if (sx > bw - 2) sx = bw - 2;
      if (sy < 0) sy = 0; else if (sy > bh - 2) sy = bh - 2;
      const x0 = sx | 0, y0 = sy | 0, fx = sx - x0, fy = sy - y0;
      const a = (y0 * bw + x0) * 4, b = a + 4, c2 = a + bw * 4, e = c2 + 4;
      const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
      for (let ch = 0; ch < 4; ch++) o[i + ch] = d[a + ch] * w00 + d[b + ch] * w10 + d[c2 + ch] * w01 + d[e + ch] * w11;
    }
  }
  outL.x.putImageData(warpOut, BX0, BY0 + TOP);
}

/* ---------- 南国のシャワールーム（空・雲・ヤシの葉・竹の塀・板の床）。すべてプログラムで描く ---------- */
let roomCache = null, roomKey = '';
function drawRoom() {
  const key = W + 'x' + H + ':' + K.toFixed(4);
  if (roomKey !== key) { roomKey = key; roomCache = makeRoom(); }
  ctx.drawImage(roomCache, 0, 0, W, H);
}
// 背景の絵（room.webp）を画面いっぱいに（高さに合わせ、はみ出す左右は切る）。タヌくんが目立つように、ほんの少しだけ淡く
function makeRoom() {
  const c = document.createElement('canvas'); c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
  const x = c.getContext('2d'); x.scale(DPR, DPR);
  const bg = IMG.room, s = Math.max(W / bg.width, H / bg.height);
  x.drawImage(bg, (W - bg.width * s) / 2, H - bg.height * s, bg.width * s, bg.height * s);
  x.fillStyle = 'rgba(255,250,240,.14)'; x.fillRect(0, 0, W, H);
  return c;
}
function drawFloorFx() {   // 床に落ちた水の輪
  for (const r of S.ripples) {
    const a = 1 - r.t / 0.6; ctx.strokeStyle = 'rgba(255,255,255,' + (0.8 * a) + ')'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(r.x, FLOOR - 4, 6 + r.t * 40, 2 + r.t * 8, 0, 0, Math.PI * 2); ctx.stroke();
  }
}
/* ---------- お股を隠す泡（流れない泡。仕上げのときだけ S.cf で小さくなる。いちばん小さくても必ず隠れる） ---------- */
let cfBubbles = [];
function makeCrotchFoam() {
  cfBubbles = [];
  // 白い大きな泡を少しだけ（2026-11-02 ユーザー：白いまま、大きさ2倍、丸の数を減らす）
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rnd(-0.25, 0.25), d = rnd(0.5, 0.8);
    cfBubbles.push({ ux: Math.cos(a) * d, uy: Math.sin(a) * d, r: rnd(26, 38), ph: rnd(0, 6) });
  }
  cfBubbles.push({ ux: rnd(-0.15, 0.15), uy: rnd(-0.15, 0.1), r: rnd(32, 40), ph: rnd(0, 6) });
}
function drawCrotchFoam() {
  if (S.side !== 'front') return;
  const at = CROTCH_FOAM[S.pose]; if (!at) return;
  const k = S.cf, rx = CF.minRx + (CF.rx - CF.minRx) * k, ry = CF.minRy + (CF.ry - CF.minRy) * k;
  // 下地（不透明。泡のすきまから見えないように）
  ctx.save(); ctx.translate(at.cx, at.cy);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.85, 'rgba(246,251,255,1)'); g.addColorStop(1, 'rgba(226,240,252,1)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  for (const b of cfBubbles) {
    const sc = 0.55 + 0.45 * k, r = b.r * sc * (1 + 0.04 * Math.sin(S.t * 2 + b.ph));
    bubbleAt(ctx, b.ux * rx, b.uy * ry, r);
  }
  ctx.restore();
}
function drawSpark(p) {
  const a = Math.min(1, p.life / p.max * 1.6), s = p.r * (0.6 + 0.4 * Math.sin((1 - p.life / p.max) * Math.PI));
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
  ctx.fillStyle = 'rgba(255,250,210,' + a + ')';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.25 : s; const an = i * Math.PI / 4; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,' + a + ')'; ctx.beginPath(); ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// シャワーヘッド（丸い面から、雨のように水が出る）。(x, y) が水の出る所（面のまんなか）
function drawShower(x, y) {
  const im = IMG.shower, w = 150, h = w * im.height / im.width;
  ctx.drawImage(im, x - w / 2, y - h * 0.72, w, h);
}
function drawBrush() {
  const b = S.brush, im = IMG.brush, w = 92, h = w * im.height / im.width;
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(-0.25 + b.a);
  ctx.drawImage(im, -w * 0.35, -h * 0.75, w, h);   // 毛の所が指の上に来るように
  ctx.restore();
}

let tanuTop = null;
function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawRoom();
  // ここからは、立ち絵の座標で描く
  ctx.setTransform(DPR * K, 0, 0, DPR * K, DPR * OX, DPR * OY);
  // 足もとの影
  ctx.fillStyle = 'rgba(40,20,5,.22)'; ctx.beginPath(); ctx.ellipse(BODY_CX + S.shakeX, FLOOR - 6, 210, 18, 0, 0, Math.PI * 2); ctx.fill();
  drawFloorFx();
  const changed = compDirty && recompose();
  warp(changed);
  // くるっと回るときは、横につぶして、ひろげる。いつも、息をしてゆっくりふくらむ（足もとが中心）
  let sx = 1;
  if (S.turn) sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * S.turn.t / 0.36)));
  ctx.save(); ctx.translate(BODY_CX + S.shakeX, FLOOR); ctx.scale(sx * BR.sx, BR.sy); ctx.translate(-BODY_CX, -FLOOR);
  ctx.drawImage(outL.c, 0, -TOP);
  drawCrotchFoam();
  ctx.restore();
  ctx.save(); ctx.translate(S.shakeX, 0);
  for (const n of [S.side, 'pit']) for (const it of SIDES[n].items) if (!it.stuck && !it.gone) {   // 落ちている小物（床で少しして消える）
    ctx.globalAlpha = it.rest != null ? Math.max(0, 1 - it.rest / 1.2) : 1; drawItem(ctx, it); ctx.globalAlpha = 1;
  }
  ctx.restore();
  // 水のつぶ
  ctx.save(); ctx.translate(S.shakeX, 0);
  ctx.fillStyle = 'rgba(205,235,255,.9)';
  for (const d of S.drops) {
    if (d.dead) continue;
    if (d.run) { ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.ellipse(d.x, d.y, 2, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; continue; }
    ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r * 0.8, d.r * 1.3, Math.atan2(d.vx, d.vy) * -1, 0, Math.PI * 2); ctx.fill();
  }
  for (const p of S.sparks) drawSpark(p);
  if (S.brush && S.tool === 'brush' && S.stage === 'wash') drawBrush();
  if (S.tool === 'shower' && S.stage === 'wash' && S.showerOn) drawShower(S.sx, S.sy - 150);
  if (S.stage === 'finale') drawShower(BODY_CX, -70);
  ctx.restore();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  tanuTop = toScr(325, 10);
  if (bubbleEl.classList.contains('on')) {
    const half = bubbleEl.offsetWidth / 2 + 10;
    bubbleEl.style.left = Math.max(half, Math.min(W - half, tanuTop.x + 40)) + 'px';
    bubbleEl.style.top = Math.max(150, tanuTop.y) + 'px';
    if (S.t > bubbleUntil) bubbleEl.classList.remove('on');
  }
}

/* ---------- 出来事 ---------- */
function handleEvents() {
  while (events.length) {
    const [type, v] = events.shift();
    if (type === 'item') {
      const sc = toScr(v.x, v.y);
      pop(tr('{n}、とれた！', { n: tr(v.name) }), sc.x, sc.y - 30, 'small'); sfx.sparkle(1);
      if (zkRegister(v)) { pop(tr('ずかんに とうろく！'), sc.x, sc.y + 8, 'blue small'); sfx.sparkle(1.6); }
      for (let i = 0; i < 6; i++) spark(v.x + rnd(-24, 24), v.y + rnd(-24, 24), 0.9, true);
    } else if (type === 'plop') sfx.plop();
  }
  if (S.face && S.t > S.faceUntil) { S.face = null; compDirty = true; }
  const g = updateGauge();
  updateTools();
  if (S.stage === 'wash' && g <= 0) toCutin();
  // 片方がだいたいきれいになったら、もう片方へさそう（ボタンをゆらす）
  if (S.stage === 'wash' && !S.turn) {
    const here = S.side, there = here === 'front' ? 'back' : 'front';
    const dirt = (n) => (n === 'front' ? dirtOf('front') + dirtOf('pit') : dirtOf(n)) / (S.side0[n] || 1);
    const foam = (n) => foamOf(n);
    const key = (dirtDone() ? 'foam' : 'dirt') + here;
    const ask = dirtDone() ? foam(here) < 2 && foam(there) > 6 : dirt(here) < 0.18 && dirt(there) > 0.25;
    if (ask && !S.asked[key]) {
      S.asked[key] = true; turnBtn.classList.add('ask');
      say(dirtDone() ? (here === 'front' ? 'foamBack' : 'foamFront') : (here === 'front' ? 'turnBack' : 'turnFront'), true);
    }
  }
  // しばらくさわらないと、さそう
  if (S.stage === 'wash' && !ptr && S.t - S.lastInput > 10) { S.lastInput = S.t; say('idle'); }
}

/* ---------- はじめる ---------- */
function start() {
  S.stage = 'wash'; S.side = 'front'; S.turn = null; setPose('stand'); S.face = null;
  cutinEl.hidden = true; S.cutT = 0; S.newZ = []; S.zkJust = false;
  S.tool = 'brush'; S.foamRef = null; S.cf = 1; S.finT = 0; S.clearShown = false; toolBtns.shower.classList.remove('ask');
  S.showerOn = false; showerSound(false); makeCrotchFoam();
  S.drops = []; S.sparks = []; S.ripples = []; S.tickle = 0; S.said = {}; S.asked = {};
  for (const n of ['front', 'back', 'pit']) {
    const sd = SIDES[n]; clr(sd.foam.x); clr(sd.wet.x); sd.foamGrid.fill(0);
    makeDirt(n); makeItems(n);
    // （pit の foam は、ばんざいで上げた腕についた泡）
  }
  S.side0 = { front: dirtOf('front') + dirtOf('pit'), back: dirtOf('back') };
  S.dirt0 = Math.max(1, dirtOf('front') + dirtOf('back') + dirtOf('pit'));
  S.gauge = -1; updateGauge(); updateTurnBtn(); updateTools(); turnBtn.classList.remove('ask');
  compDirty = true; S.lastInput = S.t;
  // はじめての1回はガイドのあとに、タヌくんのひとこと。もう一回のときは、すぐひとこと
  if (!S.guided) { S.guided = true; runGuide(() => say('start', true)); }
  else setTimeout(() => say('start', true), 700);
}

const KEYS = Object.keys(SRC);
Promise.all(KEYS.map((k) => load(SRC[k]))).then((imgs) => {
  KEYS.forEach((k, i) => { IMG[k] = imgs[i]; });
  ['happy', 'melt', 'shy', 'troubled'].forEach((k) => { FACES[k] = faceLayer(IMG[k]); });
  for (const p of POSES) {
    const L = layer(); drawPose(L.x, p);
    const d = L.x.getImageData(0, 0, IW, CH).data, m = new Uint8Array(IW * CH);
    for (let i = 0; i < IW * CH; i++) m[i] = d[i * 4 + 3];
    MASK[p] = m;
  }
  makeSoap(); placeTools();
  // 道具のアイコンの絵（確認用の1ファイル版でも出るように、読みこんだ絵を使う）
  toolBtns.brush.querySelector('img').src = IMG.brush.src;
  toolBtns.shower.innerHTML = '<img class="shead" alt="" src="' + IMG.shower.src + '">';
  document.getElementById('loading').remove();
  start();
  let last = performance.now(), acc = 0;
  const H_STEP = 1 / 240;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; acc += dt;
    while (acc >= H_STEP) { step(H_STEP); acc -= H_STEP; }
    handleEvents();
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}).catch(() => { document.getElementById('loading').textContent = tr('絵を読みこめませんでした。ページを開き直してください'); });
})();
