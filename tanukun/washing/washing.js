/* =========================================================
   タヌくんを洗おう（washing/。2026-11。試作）
   ・浜辺の大きな木のおけのお風呂に、タヌくんが立って入っている（前向き）。いつでも遊べる
   ・① 汚れ落とし：砂よごれ・貝がら・ヒトデ・コンブを、指でこすって落とす。こすった所は泡が立ち、汚れが取れた所はキラキラ
     → ② シャワー：指の上から水が出る。泡を流す。おなか・胸に当たった水は、ぽよんとはねる。おなか・胸をタップすると「ぷるん」で水をはじく
     → ③ ぶるぶる：全身をふって水しぶき → ピカピカ！
   ・よごれゲージ：汚れ落としで 100% → 30%、シャワーで泡を流して 30% → 0%。0% でクリア
   ・さわる所で反応が変わる：頭＝うっとり／むね・腕＝ときどき、くすぐったい／おなか＝指につられて動いて、えへへ／しっぽ＝ひゃっ
     おけのふち（お股のあたり）＝もじもじして「そこは自分で洗うから〜！」（こすれない。15歳以上の範囲の線引き）
   ・絵：img/stand.webp（tools/make_washing_art.py。腰みのなし・前向き。立ち絵 images/normal.webp と同じ並べ方）
     表情は、今ある立ち絵（images/happy.webp など）の顔だけを上に重ねる。汚れ・泡・しずく・小物・おけ・シャワーは、プログラムで描く
   ・おなか・胸の揺れは丸太シーソーと同じ「網目の変形」＋「やわらかい上限」（tanh）
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
  stand:    'img/stand.webp',              // 腰みのなしの前向きの立ち絵（720×900）
  happy:    '../images/happy.webp',        // くすぐったい（笑う）
  melt:     '../images/melt.webp',         // うっとり（頭を洗う）
  shy:      '../images/shy.webp',          // えへへ（おなか）
  troubled: '../images/troubled.webp',     // ひゃっ（しっぽ）
  mojimoji: '../images/mojimoji.webp',     // もじもじ（お股のあたり）
  beach:    '../images/bg/beach_day.webp'
};

/* ---------- 絵の中の場所（立ち絵 720×900 の座標） ---------- */
const IW = 720, IH = 900;
const FACE = { cx: 325, cy: 118, rx: 108, ry: 78 };                 // 表情を差しかえる顔の範囲（ネックレスにかからない）
const BELLY = { cx: 272, cy: 440, rx: 170, ry: 110 };
const CHEST = [{ cx: 200, cy: 292, rx: 74, ry: 54 }, { cx: 342, cy: 298, rx: 70, ry: 52 }];
const BX0 = 92, BX1 = 456, BY0 = 230, BY1 = 560;                    // 網目で動かす範囲
const RIM = 588;                                                     // おけのふち（これより下はお湯の中）
const TUB = { cx: 300, rx: 318, ry: 46 };
const CROTCH = { x0: 178, x1: 335, y0: 528 };                         // お股のあたり（おけのふちの上）
const BODY_CX = 300;                                                 // 画面のまんなかに来る所

/* ---------- 画面 ---------- */
const cv = document.getElementById('stage');
const ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1, K = 1, OX = 0, OY = 0;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  // 体（横 490px）が画面の幅に収まり、頭の上にゲージの場所が残るように
  K = Math.min(W / 505, (H * 0.8 - 150) / (RIM - 10));
  OX = W / 2 - BODY_CX * K;
  OY = H * 0.8 - RIM * K;
}
addEventListener('resize', resize); resize();
const toImg = (x, y) => ({ x: (x - OX) / K - S.shakeX, y: (y - OY) / K });
const toScr = (x, y) => ({ x: OX + (x + S.shakeX) * K, y: OY + y * K });

/* ---------- 状態 ---------- */
const S = {
  t: 0, stage: 'scrub',            // scrub（汚れ落とし）→ shower → shake（ぶるぶる）→ clear
  bx: { y: 0, v: 0 }, by: { y: 0, v: 0 }, jb: { y: 0, v: 0 }, jcL: { y: 0, v: 0 }, jcR: { y: 0, v: 0 },
  follow: null,                    // おなかを指でこすっているとき、指につられる量（目標）
  shakeX: 0, shakeT: 0, shakeAll: 0,
  face: null, faceUntil: 0,
  drops: [], sparks: [], items: [], ripples: [],
  showerOn: false, sx: 0, sy: 0,
  dirt0: 1, foam0: 1, gauge: 100,
  lastInput: 0, tickle: 0, said: {}
};
const events = [];

/* ---------- 絵の読みこみ ---------- */
function load(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
function mk(w, h) { const c = document.createElement('canvas'); c.width = w || IW; c.height = h || IH; return c; }
let IMG = {}, BODY = null;   // BODY：体の不透明度（汚れや泡をのせてよい所）
const FACES = {};
const comp = mk(), cctx = comp.getContext('2d');      // 立ち絵＋顔＋汚れ＋小物＋泡＋しずく
const outC = mk(), octx = outC.getContext('2d');      // ↑を網目で動かしたもの（画面に描く）
const dirtC = mk(), dctx = dirtC.getContext('2d');
const foamC = mk(), fctx = foamC.getContext('2d');
const wetC = mk(), wctx = wetC.getContext('2d');
let compDirty = true, wasMoving = true;

// 顔だけを切りぬく（ふちはふわっと）
function faceLayer(img) {
  const c = mk(), x = c.getContext('2d');
  x.drawImage(img, 0, 0, IW, IH);
  x.globalCompositeOperation = 'destination-in';
  x.save(); x.translate(FACE.cx, FACE.cy); x.scale(1, FACE.ry / FACE.rx);
  const g = x.createRadialGradient(0, 0, 0, 0, 0, FACE.rx);
  g.addColorStop(0.72, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(-FACE.rx, -FACE.rx, FACE.rx * 2, FACE.rx * 2); x.restore();
  return c;
}
const isBody = (x, y) => {
  x |= 0; y |= 0;
  return x >= 0 && y >= 0 && x < IW && y < IH && y < RIM && BODY[y * IW + x] > 140;
};

/* ---------- 汚れ・泡の量（8px のマスで数える。ゲージに使う） ---------- */
const G = 8, GW = Math.ceil(IW / G), GH = Math.ceil(IH / G);
const dirtGrid = new Float32Array(GW * GH), foamGrid = new Float32Array(GW * GH);
function sumGrid(g) { let s = 0; for (let i = 0; i < g.length; i++) s += g[i]; return s; }
function eachCell(x, y, r, fn) {
  const x0 = Math.max(0, ((x - r) / G) | 0), x1 = Math.min(GW - 1, ((x + r) / G) | 0);
  const y0 = Math.max(0, ((y - r) / G) | 0), y1 = Math.min(GH - 1, ((y + r) / G) | 0);
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
    const cx = i * G + G / 2, cy = j * G + G / 2;
    if ((cx - x) * (cx - x) + (cy - y) * (cy - y) <= r * r) fn(j * GW + i, cx, cy);
  }
}

/* ---------- 汚れをつける（毎回すこしずつ場所が変わる） ---------- */
const rnd = (a, b) => a + Math.random() * (b - a);
const DIRT_AREAS = [   // [中心x, 中心y, 横, 縦, 数]
  [325, 70, 80, 40, 2],     // 頭（髪）
  [270, 290, 120, 40, 4],   // むね
  [270, 440, 140, 80, 6],   // おなか
  [100, 430, 32, 70, 2],    // 左の腕
  [470, 320, 55, 110, 3],   // 右の腕
  [520, 545, 45, 30, 1]     // しっぽ（お湯の上の所）
];
function blob(x, cx, cy, r) {
  x.beginPath();
  const n = 9, rs = [];
  for (let i = 0; i < n; i++) rs.push(r * rnd(0.65, 1.15));
  for (let i = 0; i <= n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 0.5) / n) * Math.PI * 2, r0 = rs[i % n], r1 = rs[(i + 1) % n];
    const p = [cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0];
    if (i === 0) x.moveTo(p[0], p[1]);
    else x.quadraticCurveTo(cx + Math.cos(a0 - Math.PI / n) * (rs[(i - 1 + n) % n] + r0) * 0.6, cy + Math.sin(a0 - Math.PI / n) * (rs[(i - 1 + n) % n] + r0) * 0.6, p[0], p[1]);
    void a1; void r1;
  }
  x.closePath();
}
function makeDirt() {
  dctx.clearRect(0, 0, IW, IH);
  for (const [ax, ay, rx, ry, n] of DIRT_AREAS) {
    for (let k = 0; k < n; k++) {
      let cx, cy, tries = 0;
      do { const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()); cx = ax + Math.cos(a) * rx * d; cy = ay + Math.sin(a) * ry * d; } while (!isBody(cx, cy) && ++tries < 20);
      const r = rnd(20, 34);
      // 砂よごれ：やわらかいしみを、いくつか重ねる
      for (let m = 0; m < 4; m++) {
        const mx = cx + rnd(-r, r) * 0.5, my = cy + rnd(-r, r) * 0.5, mr = r * rnd(0.55, 0.9);
        const g = dctx.createRadialGradient(mx, my, 0, mx, my, mr);
        g.addColorStop(0, 'rgba(118,82,46,.62)'); g.addColorStop(0.6, 'rgba(128,92,54,.5)'); g.addColorStop(1, 'rgba(140,104,64,0)');
        dctx.fillStyle = g; dctx.beginPath(); dctx.arc(mx, my, mr, 0, Math.PI * 2); dctx.fill();
      }
      // 砂つぶ（少しだけ）
      for (let i = 0; i < r * 1.6; i++) {
        const a = Math.random() * Math.PI * 2, dd = Math.sqrt(Math.random()) * r * 0.8;
        dctx.fillStyle = Math.random() < 0.6 ? 'rgba(226,198,150,.8)' : 'rgba(84,56,30,.6)';
        dctx.beginPath(); dctx.arc(cx + Math.cos(a) * dd, cy + Math.sin(a) * dd, rnd(0.6, 1.5), 0, Math.PI * 2); dctx.fill();
      }
      // 泥はね（小さなしみ）
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2, d = r * rnd(1.1, 1.6);
        dctx.fillStyle = 'rgba(105,72,40,.55)';
        dctx.beginPath(); dctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rnd(1.5, 3.5), 0, Math.PI * 2); dctx.fill();
      }
    }
  }
  // 体の外にはみ出した所は消す
  dctx.globalCompositeOperation = 'destination-in';
  dctx.drawImage(IMG.stand, 0, 0, IW, IH);
  dctx.globalCompositeOperation = 'source-over';
  // マスごとの汚れの量
  const d = dctx.getImageData(0, 0, IW, IH).data;
  dirtGrid.fill(0);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    let s = 0, n = 0;
    for (let y = j * G; y < Math.min(IH, j * G + G); y += 2) for (let x = i * G; x < Math.min(IW, i * G + G); x += 2) { s += d[(y * IW + x) * 4 + 3]; n++; }
    dirtGrid[j * GW + i] = n ? s / n / 255 : 0;
  }
  S.dirt0 = Math.max(1, sumGrid(dirtGrid));
}

/* ---------- くっついている小物（貝がら・ヒトデ・コンブ。今はプログラムの仮の絵。絵ができたら差しかえる） ---------- */
const ITEM_KINDS = [
  { id: 'shell', name: '貝がら', spots: [[205, 300], [330, 385], [470, 270]] },
  { id: 'star',  name: 'ヒトデ', spots: [[300, 470], [160, 420], [480, 400]] },
  { id: 'kelp',  name: 'コンブ', spots: [[355, 78], [250, 250], [110, 470]] }
];
function makeItems() {
  S.items = ITEM_KINDS.map((k) => {
    const [x, y] = k.spots[Math.floor(Math.random() * k.spots.length)];
    return { kind: k.id, name: k.name, x, y, rot: rnd(-0.6, 0.6), hp: 1, stuck: true, vx: 0, vy: 0, vr: 0 };
  });
}
function drawItem(x, it) {
  x.save(); x.translate(it.x, it.y); x.rotate(it.rot); x.scale(1.4, 1.4);
  x.lineWidth = 1.6; x.strokeStyle = 'rgba(80,50,30,.9)';
  if (it.kind === 'shell') {           // 二枚貝（扇の形にすじ）
    x.fillStyle = '#f6d9c4';
    x.beginPath(); x.moveTo(0, 12); x.arc(0, 12, 22, Math.PI * 1.12, Math.PI * 1.88); x.closePath(); x.fill(); x.stroke();
    x.strokeStyle = 'rgba(190,120,90,.8)'; x.lineWidth = 1.5;
    for (let i = 1; i < 6; i++) { const a = Math.PI * (1.12 + 0.76 * i / 6); x.beginPath(); x.moveTo(0, 12); x.lineTo(Math.cos(a) * 20, 12 + Math.sin(a) * 20); x.stroke(); }
    x.fillStyle = '#e9b89a'; x.fillRect(-5, 9, 10, 5);
  } else if (it.kind === 'star') {     // ヒトデ
    x.fillStyle = '#f08a7a';
    x.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 8 : 20; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#ffd3c6';
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; x.beginPath(); x.arc(Math.cos(a) * 10, Math.sin(a) * 10, 1.8, 0, Math.PI * 2); x.fill(); }
  } else {                             // コンブ（波打った細長い葉）
    x.fillStyle = '#4f7d3a';
    x.beginPath(); x.moveTo(-4, -26);
    for (let i = 0; i <= 6; i++) x.lineTo(6 + Math.sin(i * 1.3) * 4, -26 + i * 9);
    for (let i = 6; i >= 0; i--) x.lineTo(-6 + Math.sin(i * 1.3 + 0.8) * 4, -26 + i * 9);
    x.closePath(); x.fill(); x.stroke();
    x.strokeStyle = 'rgba(160,200,120,.7)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(0, -22); x.lineTo(1, 26); x.stroke();
  }
  x.restore();
}

/* ---------- 泡としずく ---------- */
function bubbleAt(x, cx, cy, r) {
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2);
  x.fillStyle = 'rgba(255,255,255,.82)'; x.fill();
  x.lineWidth = 1.2; x.strokeStyle = 'rgba(150,185,220,.85)'; x.stroke();
  x.fillStyle = 'rgba(255,255,255,1)'; x.beginPath(); x.arc(cx - r * 0.35, cy - r * 0.35, r * 0.25, 0, Math.PI * 2); x.fill();
}
// 泡は、マスごとに上限まで（同じ所をこすり続けても、もこもこになりすぎない）。顔の上にはのせない
const onFace = (x, y) => ((x - FACE.cx) / (FACE.rx * 0.95)) ** 2 + ((y - FACE.cy + 8) / (FACE.ry * 0.95)) ** 2 < 1;
const cellOf = (x, y) => Math.min(GH - 1, Math.max(0, (y / G) | 0)) * GW + Math.min(GW - 1, Math.max(0, (x / G) | 0));
function addFoam(px, py, R, n) {
  for (let i = 0; i < (n || 2); i++) {
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * R * 0.9, cx = px + Math.cos(a) * d, cy = py + Math.sin(a) * d;
    if (!isBody(cx, cy) || onFace(cx, cy)) continue;
    const c = cellOf(cx, cy);
    if (foamGrid[c] >= 0.7) continue;
    bubbleAt(fctx, cx, cy, rnd(3, 9));
    eachCell(cx, cy, 10, (j) => { foamGrid[j] = Math.min(1, foamGrid[j] + 0.12); });
  }
}
function wetDrop(cx, cy) {
  const r = rnd(2, 4.5);
  wctx.fillStyle = 'rgba(200,230,255,.55)';
  wctx.beginPath(); wctx.ellipse(cx, cy, r, r * 1.3, 0, 0, Math.PI * 2); wctx.fill();
  wctx.fillStyle = 'rgba(255,255,255,.9)';
  wctx.beginPath(); wctx.arc(cx - r * 0.3, cy - r * 0.4, r * 0.35, 0, Math.PI * 2); wctx.fill();
}

/* ---------- こする ---------- */
const BRUSH = 30;
function partAt(x, y) {
  if (y >= CROTCH.y0 && y < RIM + 30 && x > CROTCH.x0 && x < CROTCH.x1 &&
      ((x - BELLY.cx) / BELLY.rx) ** 2 + ((y - BELLY.cy) / BELLY.ry) ** 2 > 0.85) return 'crotch';
  if (y > RIM) return 'water';
  if (!isBody(x, y)) return null;
  if (y < 196) return 'head';
  if (x > 445 && y > 470) return 'tail';
  if (((x - BELLY.cx) / BELLY.rx) ** 2 + ((y - BELLY.cy) / BELLY.ry) ** 2 < 1) return 'belly';
  for (const c of CHEST) if (((x - c.cx) / c.rx) ** 2 + ((y - c.cy) / c.ry) ** 2 < 1.3) return 'chest';
  return 'arm';
}
function scrub(x0, y0, x1, y1) {
  const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(len / 8));
  let removed = 0;
  for (let s = 1; s <= n; s++) {
    const x = x0 + (x1 - x0) * s / n, y = y0 + (y1 - y0) * s / n;
    if (!isBody(x, y) && !isBody(x, y - 12) && !isBody(x, y + 12)) continue;
    eachCell(x, y, BRUSH, (i) => { removed += dirtGrid[i]; dirtGrid[i] = 0; });
    addFoam(x, y, BRUSH);
    // 小物：何度かこすると取れる
    for (const it of S.items) if (it.stuck && Math.hypot(it.x - x, it.y - y) < 30) {
      it.hp -= 0.05; it.rot += rnd(-0.05, 0.05);
      if (it.hp <= 0) { it.stuck = false; it.vx = rnd(-60, 60); it.vy = -rnd(80, 160); it.vr = rnd(-6, 6); events.push(['item', it]); }
    }
  }
  dctx.save(); dctx.globalCompositeOperation = 'destination-out';
  dctx.lineCap = 'round'; dctx.lineWidth = BRUSH * 2; dctx.strokeStyle = '#000';
  dctx.beginPath(); dctx.moveTo(x0, y0); dctx.lineTo(x1, y1); dctx.stroke(); dctx.restore();
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
  water: ['お湯、あったか〜い♪'],
  item: ['とれた〜！'],
  foam: ['あわあわ〜！ シャワーで流して〜'],
  shower: ['あったか〜い♪', 'きもちいい〜'],
  purun: ['ぷるんっ！', 'えへへ、はじいた〜'],
  shake: ['ぶるぶる〜っ！'],
  clean: ['ピカピカになった〜！ ありがと♪']
};
const bubbleEl = document.getElementById('bubble');
let bubbleUntil = 0, bubbleCool = 0;
function say(key, force) {
  if (!force && S.t < bubbleCool) return;
  const list = LINES[key] || [key];
  bubbleEl.textContent = tr(list[Math.floor(Math.random() * list.length)]);
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

const hintEl = document.getElementById('hint');
function setHint(html) { hintEl.innerHTML = tr(html); hintEl.classList.remove('small'); }
const gaugeEl = document.getElementById('gauge'), gfill = document.getElementById('gfill'), gnum = document.getElementById('gnum');
function updateGauge() {
  let g;
  if (S.stage === 'scrub') g = 30 + 70 * Math.max(0, Math.min(1, (sumGrid(dirtGrid) / S.dirt0 - 0.12) / 0.88));   // 汚れが残り約1割で 30%（最後のひとかけを探さなくてよいように）
  else if (S.stage === 'shower') g = 30 * Math.max(0, Math.min(1, (sumGrid(foamGrid) / S.foam0 - 0.08) / 0.92));   // 腕のはしなどに少し残っても、0% に
  else g = 0;
  // 見た目は少し切り上げ（0% は本当に終わったときだけ）
  const shown = g <= 0 ? 0 : Math.max(1, Math.ceil(g));
  if (shown !== S.gauge) {
    S.gauge = shown;
    gfill.style.width = shown + '%'; gnum.textContent = shown + '%';
    gaugeEl.setAttribute('aria-valuenow', String(shown));
  }
  gaugeEl.classList.toggle('foam', S.stage === 'shower');
  gaugeEl.classList.toggle('done', shown === 0);
  return g;
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
cv.addEventListener('pointerdown', (e) => {
  audioInit();
  if (S.stage === 'shake' || S.stage === 'clear') return;
  const p = toImg(e.clientX, e.clientY);
  ptr = { x: p.x, y: p.y, sx: p.x, sy: p.y, t: S.t, moved: 0, part: partAt(p.x, p.y), lastPart: null };
  try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  S.lastInput = S.t;
  if (S.stage === 'shower') { S.showerOn = true; S.sx = p.x; S.sy = p.y; showerSound(true); }
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
  if (S.stage === 'scrub') {
    if (part && part !== 'crotch' && part !== 'water') { scrub(ptr.x, ptr.y, p.x, p.y); sfx.rub(); rubReact(part, d); }
    // おなか：指につられて動く（こすった向きに）
    if (part === 'belly') S.follow = { x: soft((p.x - ptr.sx) * 0.35, 24), y: soft((p.y - ptr.sy) * 0.35, 20) };
    else S.follow = null;
    if (ptr.moved > 60) hintEl.classList.add('small');
  } else if (S.stage === 'shower') {
    S.sx = p.x; S.sy = p.y;
    if (ptr.moved > 60) hintEl.classList.add('small');
  }
  ptr.x = p.x; ptr.y = p.y;
});
function endPtr() {
  if (!ptr) return;
  // シャワーの間に、おなか・胸を軽くタップ → ぷるん！で水をはじく
  if (S.stage === 'shower' && ptr.moved < 14 && S.t - ptr.t < 0.35 && (ptr.part === 'belly' || ptr.part === 'chest')) purun(ptr.sx, ptr.sy, ptr.part);
  ptr = null; S.follow = null; S.showerOn = false; showerSound(false); S.lastInput = S.t;
}
cv.addEventListener('pointerup', endPtr);
cv.addEventListener('pointercancel', endPtr);
const soft = (v, m) => m * Math.tanh(v / m);

// さわった所の反応（さわった瞬間・ほかの所へ移ったとき）
function touchPart(part, first) {
  if (part === 'crotch') {
    setFace('mojimoji', 1.8); S.jb.v += 60; S.shakeT = 0.25;
    if (S.t - (S.said.crotch || -9) > 2.5) { S.said.crotch = S.t; say('crotch', true); sfx.giggle(); }
  } else if (part === 'water' && first && S.stage === 'scrub') {
    if (S.t - (S.said.water || -9) > 8) { S.said.water = S.t; say('water'); }
  }
}
// こすっている間の反応
function rubReact(part, d) {
  if (part === 'head') { setFace('melt', 1.0); if (Math.random() < 0.02) say('head'); }
  else if (part === 'tail') { if (S.face !== 'troubled') { setFace('troubled', 1.2); say('tail'); S.shakeT = 0.2; } else setFace('troubled', 1.0); }
  else if (part === 'belly') { setFace('shy', 1.0); if (Math.random() < 0.012) say('belly'); }
  else if (part === 'chest' || part === 'arm') {
    S.tickle += d * (part === 'arm' ? 0.6 : 1);
    if (S.tickle > rnd(600, 1100)) {
      S.tickle = 0; setFace('happy', 1.4); S.shakeT = 0.45; say('tickle', true); sfx.giggle();
      S.jcL.v += 120; S.jcR.v += 110; S.jb.v += 90;
    }
  }
}

/* ---------- ぷるん！（水をはじく） ---------- */
function purun(x, y, part) {
  const k = part === 'belly' ? 1 : 0.8;
  S.jb.v += 520 * k; setTimeout(() => { S.jcL.v += 420 * k; S.jcR.v += 390 * k; }, 50);
  sfx.boing(1); setFace('shy', 1.2);
  const sc = toScr(x, y); pop('ぷるん！', sc.x + 40, sc.y - 30);
  if (Math.random() < 0.5) say('purun');
  const c = part === 'belly' ? BELLY : (x < 270 ? CHEST[0] : CHEST[1]);
  for (let i = 0; i < 26; i++) {
    const a = rnd(-Math.PI, 0), sp = rnd(180, 420);
    S.drops.push({ x: c.cx + Math.cos(a) * c.rx * 0.7, y: c.cy + Math.sin(a) * c.ry * 0.6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 100, r: rnd(2.5, 5), life: 1.4, free: true });
  }
  // 当たった所のしずくを少し飛ばす
  wctx.save(); wctx.globalCompositeOperation = 'destination-out'; wctx.beginPath(); wctx.ellipse(c.cx, c.cy, c.rx * 0.8, c.ry * 0.8, 0, 0, Math.PI * 2); wctx.fill(); wctx.restore();
  compDirty = true;
}

/* ---------- 段階を進める ---------- */
function toShower() {
  S.stage = 'shower';
  // 残った少しの汚れは、ふわっと消す
  dctx.clearRect(0, 0, IW, IH); dirtGrid.fill(0);
  for (const it of S.items) if (it.stuck) { it.stuck = false; it.vx = rnd(-60, 60); it.vy = -100; it.vr = rnd(-5, 5); }
  // 泡が少ないときは、体じゅうを泡で包む（シャワーで流す楽しみのため）
  if (sumGrid(foamGrid) < 120) for (let i = 0; i < 400; i++) { const x = rnd(90, 540), y = rnd(30, RIM - 10); if (isBody(x, y)) addFoam(x, y, 26, 3); }
  S.foam0 = Math.max(1, sumGrid(foamGrid));
  compDirty = true;
  say('foam', true); setFace('happy', 1.5); sfx.fanfare();
  setHint('<b>指でなぞると、上からシャワーが出るよ</b><br><span class="sub">泡を流してね。おなかや胸をタップすると…？</span>');
}
function toShake() {
  S.stage = 'shake'; S.shakeAll = 1.6; S.showerOn = false; showerSound(false); ptr = null;
  foamGrid.fill(0); fctx.clearRect(0, 0, IW, IH); compDirty = true;
  say('shake', true); setFace('happy', 2);
  hintEl.classList.add('small');
  sfx.splash();
}
function toClear() {
  S.stage = 'clear'; wctx.clearRect(0, 0, IW, IH); compDirty = true;
  updateGauge(); sfx.fanfare(); setFace('shy', 99);
  say('clean', true);
  for (let i = 0; i < 40; i++) { const x = rnd(80, 560), y = rnd(20, RIM); if (isBody(x, y)) spark(x, y, rnd(0.8, 1.8), true); }
  setTimeout(() => {
    const el = document.getElementById('clear');
    document.getElementById('cLine').textContent = tr('ふわふわ、いいにおい〜♪');
    document.getElementById('cNote').textContent = tr('（ごほうびの絵は、これから入ります）');
    el.hidden = false; requestAnimationFrame(() => el.classList.add('on'));
  }, 1700);
}
document.getElementById('again').addEventListener('click', () => {
  const el = document.getElementById('clear'); el.classList.remove('on'); setTimeout(() => { el.hidden = true; }, 600);
  start();
});

/* ---------- 泡を流す（シャワーの水・流れ落ちる水） ---------- */
function rinse(x, y, r, amount, alpha) {
  let had = 0;
  eachCell(x, y, r, (i) => { had += foamGrid[i]; foamGrid[i] = Math.max(0, foamGrid[i] - amount); });
  if (had <= 0.01) return;
  fctx.save(); fctx.globalCompositeOperation = 'destination-out';
  const eg = fctx.createRadialGradient(x, y, 0, x, y, r);
  eg.addColorStop(0, 'rgba(0,0,0,' + alpha + ')'); eg.addColorStop(1, 'rgba(0,0,0,0)');
  fctx.fillStyle = eg; fctx.fillRect(x - r, y - r, r * 2, r * 2); fctx.restore();
  if (had > 0.3 && Math.random() < 0.04) spark(x + rnd(-20, 20), y + rnd(-10, 20), 0.6);   // 流れた所はキラキラ
  compDirty = true;
}

/* ---------- 物理（1/240 秒ずつ） ---------- */
function spring(s, k, c, h, rest) { s.v += (-k * (s.y - (rest || 0)) - c * s.v) * h; s.y += s.v * h; }
function step(h) {
  S.t += h;
  // 体をゆする（くすぐったい・もじもじ・ぶるぶる）。おなかは少し遅れてついてくる
  const prevX = S.shakeX;
  if (S.shakeAll > 0) {
    S.shakeAll -= h;
    S.shakeX = Math.sin(S.t * 38) * 14 * Math.min(1, S.shakeAll);
    if (Math.random() < 0.5) {   // 水しぶき
      const a = rnd(0, Math.PI * 2), x = rnd(90, 540), y = rnd(30, RIM - 20);
      if (isBody(x, y)) S.drops.push({ x, y, vx: Math.cos(a) * rnd(250, 520), vy: Math.sin(a) * rnd(250, 520) - 120, r: rnd(2.5, 5), life: 1.3, free: true });
    }
    if (S.shakeAll <= 0) { S.shakeX = 0; toClear(); }
  } else if (S.shakeT > 0) {
    S.shakeT -= h; S.shakeX = Math.sin(S.t * 30) * 5 * Math.min(1, S.shakeT * 4);
  } else S.shakeX = 0;
  const vel = (S.shakeX - prevX) / h;
  const f = S.follow;
  spring(S.bx, 130, 7, h, (f ? f.x : 0) - vel * 0.035);
  spring(S.by, 130, 7, h, f ? f.y : 0);
  spring(S.jb, 110, 2.6, h);
  spring(S.jcL, 230, 3.0, h);
  spring(S.jcR, 255, 3.3, h);

  // 取れた小物：おけのお湯へ落ちる
  for (const it of S.items) if (!it.stuck && !it.gone) {
    it.vy += 900 * h; it.x += it.vx * h; it.y += it.vy * h; it.rot += it.vr * h;
    if (it.y > RIM + 20) { it.gone = true; events.push(['plop', it]); }
    compDirty = true;
  }
  // シャワーの水
  if (S.stage === 'shower' && S.showerOn && Math.random() < 0.9) {
    for (let i = 0; i < 2; i++) S.drops.push({ x: S.sx + rnd(-16, 16), y: S.sy - 150, vx: rnd(-25, 25), vy: rnd(650, 800), r: rnd(2, 3.5), life: 1.5, target: S.sy + rnd(-30, 20) });
  }
  for (const d of S.drops) {
    d.life -= h;
    if (d.run) {
      // 体をつたって流れ落ちる水：通った所の泡を少しずつ流す
      d.x += d.vx * h; d.y += d.vy * h;
      if (!isBody(d.x, d.y) || d.life <= 0) { d.run = false; d.free = true; d.vy = 60; d.life = 0.8; continue; }
      if (Math.random() < 0.5) rinse(d.x, d.y, 12, 0.08, 0.35);
      continue;
    }
    d.vy += 1500 * h; d.x += d.vx * h; d.y += d.vy * h;
    if (d.free || d.life <= 0) { if (d.y > RIM + 10 && d.vy > 0 && !d.dead) { d.dead = true; if (Math.random() < 0.3) S.ripples.push({ x: d.x, t: 0 }); } continue; }
    if (d.y > RIM) { d.dead = true; if (Math.random() < 0.25) S.ripples.push({ x: d.x, t: 0 }); continue; }
    // 水は、指のあたり（target）で体に当たる。上の方の体は通りぬける（シャワーを当てたい所に当てられるように）
    if (d.y >= d.target && isBody(d.x, d.y)) {
      rinse(d.x, d.y + 8, 22, 0.25, 0.6);
      if (Math.random() < 0.06) wetDrop(d.x + rnd(-14, 14), d.y + rnd(0, 26));
      // おなか・胸に当たった水は、ぽよんとはねる（半分くらい。残りは体をつたって流れる）
      const inB = ((d.x - BELLY.cx) / BELLY.rx) ** 2 + ((d.y - BELLY.cy) / BELLY.ry) ** 2 < 1;
      const inC = CHEST.some((c) => ((d.x - c.cx) / c.rx) ** 2 + ((d.y - c.cy) / c.ry) ** 2 < 1);
      if ((inB || inC) && Math.random() < 0.5) {
        d.free = true; d.vy = -d.vy * rnd(0.35, 0.55); d.vx = (d.x - (inB ? BELLY.cx : 270)) * rnd(1.2, 2.2) + rnd(-60, 60);
        if (inB) S.jb.v += 14; else { S.jcL.v += 10; S.jcR.v += 9; }
        if (Math.random() < 0.04) sfx.boing(0.25);
      } else { d.run = true; d.vx = rnd(-12, 12); d.vy = rnd(110, 170); d.life = 1.6; }
    }
  }
  S.drops = S.drops.filter((d) => d.life > 0 && d.y < IH + 40 && !(d.dead && d.y > RIM + 10));
  for (const p of S.sparks) p.life -= h;
  S.sparks = S.sparks.filter((p) => p.life > 0);
  for (const r of S.ripples) r.t += h;
  S.ripples = S.ripples.filter((r) => r.t < 0.6);
}

/* ---------- 描く ---------- */
function recompose() {
  cctx.clearRect(0, 0, IW, IH);
  cctx.drawImage(IMG.stand, 0, 0, IW, IH);
  if (S.face && FACES[S.face]) cctx.drawImage(FACES[S.face], 0, 0);
  cctx.drawImage(dirtC, 0, 0);
  for (const it of S.items) if (it.stuck) drawItem(cctx, it);
  cctx.drawImage(foamC, 0, 0);
  cctx.drawImage(wetC, 0, 0);
  compDirty = false;
  return true;
}
let warpOut = null;
function warp(changed) {
  const jy = soft(S.jb.y, 34), ox = soft(S.bx.y, 26), oy = soft(S.by.y, 22);
  const jc = [soft(S.jcL.y, 28), soft(S.jcR.y, 28)];
  const moving = Math.abs(jy) > 0.12 || Math.abs(ox) > 0.12 || Math.abs(oy) > 0.12 || Math.abs(jc[0]) > 0.12 || Math.abs(jc[1]) > 0.12;
  if (!changed && !moving && !wasMoving) return;
  octx.clearRect(0, 0, IW, IH); octx.drawImage(comp, 0, 0);
  wasMoving = moving;
  if (!moving) return;
  const bw = BX1 - BX0, bh = BY1 - BY0;
  const src = cctx.getImageData(BX0, BY0, bw, bh), d = src.data;
  if (!warpOut || warpOut.width !== bw) warpOut = octx.createImageData(bw, bh);
  const o = warpOut.data, spread = 0.5 / BELLY.ry;
  for (let y = 0; y < bh; y++) {
    const Y = y + BY0;
    for (let x = 0; x < bw; x++) {
      const X = x + BX0;
      let dx = 0, dy = 0;
      let u = (X - BELLY.cx) / BELLY.rx, v = (Y - BELLY.cy) / BELLY.ry, r2 = u * u + v * v;
      if (r2 < 1) { const w = (1 - r2) * (1 - r2); dy += (jy + oy) * w; dx += ox * w + (X - BELLY.cx) * jy * spread * w; }
      for (let n = 0; n < 2; n++) {
        const c = CHEST[n]; u = (X - c.cx) / c.rx; v = (Y - c.cy) / c.ry; r2 = u * u + v * v;
        if (r2 < 1) { const w = (1 - r2) * (1 - r2); dy += jc[n] * w; dx += ox * 0.3 * w; }
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
  octx.putImageData(warpOut, BX0, BY0);
}

function drawBackground() {
  const bg = IMG.beach, s = Math.max(W / bg.width, H / bg.height);
  ctx.drawImage(bg, (W - bg.width * s) / 2, (H - bg.height * s) / 2 + H * 0.05, bg.width * s, bg.height * s);
  // 少しだけ明るく、やわらかく（タヌくんが目立つように）
  ctx.fillStyle = 'rgba(255,248,235,.18)'; ctx.fillRect(0, 0, W, H);
}
// 大きな木のおけ（お風呂）。back=true は奥のふちとお湯、false は手前
function drawTub(back) {
  const cx = TUB.cx, rx = TUB.rx, ry = TUB.ry, top = RIM, bottom = (H - OY) / K + 20;
  if (back) {
    ctx.fillStyle = '#8a5a2e';
    ctx.beginPath(); ctx.ellipse(cx, top, rx, ry, 0, Math.PI, Math.PI * 2); ctx.fill();
    return;
  }
  // お湯の面
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, top + 4, rx - 14, ry - 10, 0, 0, Math.PI * 2); ctx.clip();
  const wg = ctx.createLinearGradient(0, top - ry, 0, top + ry);
  wg.addColorStop(0, 'rgba(160,220,246,.9)'); wg.addColorStop(1, 'rgba(96,180,228,.95)');
  ctx.fillStyle = wg; ctx.fillRect(cx - rx, top - ry, rx * 2, ry * 2);
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { const yy = top - 12 + i * 9, ph = S.t * 1.5 + i; ctx.beginPath(); ctx.moveTo(cx - rx + 30, yy); for (let x = -rx + 30; x < rx - 30; x += 20) ctx.lineTo(cx + x, yy + Math.sin(x * 0.05 + ph) * 2); ctx.stroke(); }
  for (const r of S.ripples) { const a = 1 - r.t / 0.6; ctx.strokeStyle = 'rgba(255,255,255,' + (0.8 * a) + ')'; ctx.beginPath(); ctx.ellipse(r.x, top + 6, 6 + r.t * 40, 2 + r.t * 10, 0, 0, Math.PI * 2); ctx.stroke(); }
  // お湯に浮かぶ泡
  for (let i = 0; i < 26; i++) bubbleAt(ctx, cx - rx + 40 + i * 21 + Math.sin(S.t * 1.3 + i) * 4, top - 8 + (i * 7 % 5) * 6 + Math.cos(S.t + i * 2) * 2, 5 + (i * 5 % 4) * 2.5);
  ctx.restore();
  // 手前の板
  ctx.save();
  ctx.beginPath(); ctx.moveTo(cx - rx, top); ctx.ellipse(cx, top, rx, ry, 0, Math.PI, 0, true);
  ctx.lineTo(cx + rx - 18, bottom); ctx.lineTo(cx - rx + 18, bottom); ctx.closePath();
  const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
  g.addColorStop(0, '#9a6434'); g.addColorStop(0.35, '#c98d52'); g.addColorStop(0.7, '#b7783f'); g.addColorStop(1, '#8a5428');
  ctx.fillStyle = g; ctx.fill(); ctx.clip();
  ctx.strokeStyle = 'rgba(90,52,22,.45)'; ctx.lineWidth = 2.5;
  for (let i = -6; i <= 6; i++) { const x = cx + i * rx / 6.5; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x * 0.97 + cx * 0.03, bottom); ctx.stroke(); }
  // たが（竹の輪）
  for (const yy of [top + ry + 40, top + ry + 190]) {
    ctx.fillStyle = '#6f8f3a'; ctx.beginPath(); ctx.ellipse(cx, yy - ry * 0.7, rx + 2, ry, 0, 0.05, Math.PI - 0.05); ctx.lineTo(cx - rx, yy - ry * 0.7 + 16); ctx.ellipse(cx, yy - ry * 0.7 + 16, rx, ry, 0, Math.PI - 0.05, 0.05, true); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // ふち
  ctx.strokeStyle = '#6e4220'; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.ellipse(cx, top, rx - 3, ry - 3, 0, 0, Math.PI); ctx.stroke();
  ctx.strokeStyle = '#d9a46b'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(cx, top - 3, rx - 3, ry - 4, 0, 0.1, Math.PI - 0.1); ctx.stroke();
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
function drawShower() {
  const x = S.sx, y = S.sy - 150;
  // 竹の筒（右上から）
  ctx.save();
  ctx.translate(x, y); ctx.rotate(-0.35);
  ctx.fillStyle = '#7fae47'; ctx.strokeStyle = '#4c7426'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-10, -18, 260, 30, 12) : ctx.rect(-10, -18, 260, 30); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(60,95,30,.8)'; ctx.lineWidth = 4;
  for (const nx of [70, 160]) { ctx.beginPath(); ctx.moveTo(nx, -18); ctx.lineTo(nx, 12); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = '#5f8f34'; ctx.beginPath(); ctx.ellipse(x, y + 4, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2f4f18'; ctx.beginPath(); ctx.ellipse(x, y + 5, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
}

let tanuTop = null;
function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawBackground();
  // ここからは、立ち絵の座標で描く
  ctx.setTransform(DPR * K, 0, 0, DPR * K, DPR * (OX + S.shakeX * K), DPR * OY);
  ctx.save(); ctx.translate(-S.shakeX, 0); drawTub(true); ctx.restore();
  const changed = compDirty && recompose();
  warp(changed);
  ctx.drawImage(outC, 0, 0);
  // 小物（落ちているもの）
  for (const it of S.items) if (!it.stuck && !it.gone) drawItem(ctx, it);
  ctx.save(); ctx.translate(-S.shakeX, 0); drawTub(false); ctx.restore();
  // 水のつぶ
  ctx.fillStyle = 'rgba(205,235,255,.9)';
  for (const d of S.drops) {
    if (d.dead) continue;
    if (d.run) { ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.ellipse(d.x, d.y, 2, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; continue; }
    ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r * 0.8, d.r * 1.3, Math.atan2(d.vx, d.vy) * -1, 0, Math.PI * 2); ctx.fill();
  }
  for (const p of S.sparks) drawSpark(p);
  if (S.stage === 'shower') { ctx.save(); ctx.translate(-S.shakeX, 0); if (S.showerOn) drawShower(); else drawShowerIdle(); ctx.restore(); }
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  tanuTop = toScr(325, 10);
  if (bubbleEl.classList.contains('on')) {
    const half = bubbleEl.offsetWidth / 2 + 10;
    bubbleEl.style.left = Math.max(half, Math.min(W - half, tanuTop.x + 40)) + 'px';
    bubbleEl.style.top = Math.max(150, tanuTop.y) + 'px';
    if (S.t > bubbleUntil) bubbleEl.classList.remove('on');
  }
}
// シャワーを使っていないときは、右上でゆらゆら待っている
function drawShowerIdle() {
  const sv = S.sx, sw = S.sy; S.sx = 560 + Math.sin(S.t * 2) * 6; S.sy = 140; drawShower(); S.sx = sv; S.sy = sw;
}

/* ---------- 出来事 ---------- */
function handleEvents() {
  while (events.length) {
    const [type, v] = events.shift();
    if (type === 'item') {
      const sc = toScr(v.x, v.y);
      pop(tr('{n}、とれた！', { n: tr(v.name) }), sc.x, sc.y - 30, 'small'); sfx.sparkle(1);
      for (let i = 0; i < 6; i++) spark(v.x + rnd(-24, 24), v.y + rnd(-24, 24), 0.9, true);
    } else if (type === 'plop') sfx.plop();
  }
  if (S.face && S.t > S.faceUntil) { S.face = null; compDirty = true; }
  const g = updateGauge();
  if (S.stage === 'scrub' && g <= 30.2) toShower();
  else if (S.stage === 'shower' && g <= 0) toShake();
  // しばらくさわらないと、さそう
  if (S.stage === 'scrub' && !ptr && S.t - S.lastInput > 10) { S.lastInput = S.t; say('idle'); }
}

/* ---------- はじめる ---------- */
function start() {
  S.stage = 'scrub'; S.face = null; S.drops = []; S.sparks = []; S.ripples = []; S.shakeAll = 0; S.tickle = 0; S.said = {};
  fctx.clearRect(0, 0, IW, IH); wctx.clearRect(0, 0, IW, IH); foamGrid.fill(0);
  makeDirt(); makeItems(); S.gauge = -1; updateGauge();
  compDirty = true; S.lastInput = S.t;
  setHint('<b>よごれている所を、指でこすってね</b><br><span class="sub">頭・むね・おなか・腕・しっぽ。貝がらやヒトデもついてるよ</span>');
  setTimeout(() => say('start', true), 700);
}
const KEYS = ['stand', 'happy', 'melt', 'shy', 'troubled', 'mojimoji', 'beach'];
Promise.all(KEYS.map((k) => load(SRC[k]))).then((imgs) => {
  KEYS.forEach((k, i) => { IMG[k] = imgs[i]; });
  ['happy', 'melt', 'shy', 'troubled', 'mojimoji'].forEach((k) => { FACES[k] = faceLayer(IMG[k]); });
  const c = mk(), x = c.getContext('2d'); x.drawImage(IMG.stand, 0, 0, IW, IH);
  const d = x.getImageData(0, 0, IW, IH).data; BODY = new Uint8Array(IW * IH);
  for (let i = 0; i < IW * IH; i++) BODY[i] = d[i * 4 + 3];
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
