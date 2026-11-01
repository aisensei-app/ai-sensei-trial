/* =========================================================
   タヌくんを洗おう（washing/。2026-11。試作）
   ・浜辺の大きな木のおけのお風呂に、タヌくんが立って入っている。いつでも遊べる
   ・まえ と うしろ（右下のボタンでくるっと回る）。まえ＝頭・むね・おなか・腕・脇・しっぽ／うしろ＝背中・お尻・しっぽ
   ・① 汚れ落とし：砂よごれ・泥はね・貝がら・ヒトデ・コンブを、指でこすって落とす（指の下にブラシ）。こすった所は泡、取れた所はキラキラ
       脇の下をこすると「ばんざい」してくれて、脇も洗える（くすぐったがる）
     → ② シャワー：指の上の竹の筒から水が出る。泡を流す。おなか・胸・お尻に当たった水は、ぽよんとはねる。タップで「ぷるん」して水をはじく
     → ③ ぶるぶる（ぶるぶるの絵）→ ピカピカ！
   ・よごれゲージ：まえ・うしろ・脇の汚れ全部で 100% → 30%、シャワーで両面の泡を流して 30% → 0%。0% でクリア
   ・反応：頭＝うっとり／むね・腕＝ときどきくすぐったい／おなか・お尻＝指につられて動く／しっぽ＝ひゃっ／背中＝きもちいい
     お股のあたり＝もじもじの絵になって「そこは自分で洗うから〜！」（こすれない。15歳以上の範囲の線引き）。おけのお湯でおなかから下を隠す
   ・絵：img/*.webp（tools/make_washing_art.py。Gemini の絵。腰みのなし）
       stand（720×900。立ち絵 images/normal.webp と同じ並べ方）、banzai・mojimoji・shake・back（720×940。上に 40px の余白 → y=-40 に置く）
       item_*（小物）。まえの表情は、今の立ち絵（images/happy.webp など）の顔だけを上に重ねる
     汚れのしみ・泡・しずく・おけは、プログラムで描く
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
  beach:    '../images/bg/beach_day.webp'
};
const POSES = ['stand', 'banzai', 'mojimoji', 'shake', 'back'];

/* ---------- 絵の中の場所（立ち絵 720×900 の座標） ---------- */
const IW = 720, IH = 900, TOP = 40, CH = IH + TOP;
const FACE = { cx: 325, cy: 118, rx: 108, ry: 78 };                 // 表情を差しかえる顔の範囲（ネックレスにかからない）
const RIM = 588;                                                     // おけのふち（これより下はお湯の中）
const TUB = { cx: 300, rx: 318, ry: 46 };
const BODY_CX = 300;                                                 // 画面のまんなかに来る所
const inE = (x, y, e, k) => ((x - e.cx) / e.rx) ** 2 + ((y - e.cy) / e.ry) ** 2 < (k || 1);
// 揺れる所（絵ごと）。s：どのばねで動くか（jb＝おなか・お尻、jcL/jcR＝胸・もう片方のお尻）、f：指につられて動くか
const ZONES = {
  stand:  [{ cx: 272, cy: 440, rx: 170, ry: 110, s: 'jb', f: 1, name: 'belly' },
           { cx: 200, cy: 292, rx: 74, ry: 54, s: 'jcL', f: 0.3, name: 'chest' },
           { cx: 342, cy: 298, rx: 70, ry: 52, s: 'jcR', f: 0.3, name: 'chest' }],
  banzai: [{ cx: 290, cy: 452, rx: 168, ry: 108, s: 'jb', f: 1, name: 'belly' },
           { cx: 210, cy: 300, rx: 72, ry: 50, s: 'jcL', f: 0.3, name: 'chest' },
           { cx: 385, cy: 312, rx: 70, ry: 50, s: 'jcR', f: 0.3, name: 'chest' }],
  back:   [{ cx: 234, cy: 495, rx: 100, ry: 90, s: 'jb', f: 1, name: 'butt' },
           { cx: 410, cy: 485, rx: 90, ry: 82, s: 'jcR', f: 0.6, name: 'butt' }],
  mojimoji: [], shake: []
};
const CROTCH = { x0: 178, x1: 335, y0: 528 };                        // まえ：お股のあたり（おけのふちの上）
const PIT_HINT = [{ cx: 140, cy: 300, rx: 40, ry: 44 }, { cx: 408, cy: 290, rx: 40, ry: 44 }];   // まえ：ここをこすると、ばんざい
const PITS = [{ cx: 165, cy: 245, rx: 34, ry: 50 }, { cx: 466, cy: 252, rx: 34, ry: 52 }];       // ばんざい：脇

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
  side: 'front', pose: 'stand', poseUntil: 0, turn: null,
  bx: { y: 0, v: 0 }, by: { y: 0, v: 0 }, jb: { y: 0, v: 0 }, jcL: { y: 0, v: 0 }, jcR: { y: 0, v: 0 },
  follow: null,                    // おなか・お尻を指でこすっているとき、指につられる量（目標）
  shakeX: 0, shakeT: 0, shakeAll: 0,
  face: null, faceUntil: 0,
  drops: [], sparks: [], ripples: [],
  showerOn: false, sx: 0, sy: 0, brush: null,
  dirt0: 1, foam0: 1, gauge: 100, asked: {},
  lastInput: 0, tickle: 0, said: {}
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
  return x >= 0 && y >= -TOP && x < IW && y < IH && y < RIM && MASK[pose][(y + TOP) * IW + x] > 140;
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
  front: [[325, 70, 80, 40, 2], [270, 290, 120, 40, 3], [270, 440, 140, 80, 5], [100, 430, 32, 70, 2], [470, 320, 55, 110, 2], [520, 545, 45, 30, 1]],
  back:  [[300, 80, 80, 40, 1], [320, 260, 150, 70, 5], [232, 505, 60, 45, 2], [470, 480, 70, 50, 2], [110, 420, 30, 60, 1], [550, 420, 30, 60, 1]],
  pit:   [[PITS[0].cx, PITS[0].cy, 14, 22, 1], [PITS[1].cx, PITS[1].cy, 14, 22, 1]]
};
function stamp(x, key, cx, cy, w, rot, alpha) {
  const im = IMG[key], h = w * im.height / im.width;
  x.save(); x.globalAlpha = alpha || 1; x.translate(cx, cy); x.rotate(rot || 0); x.drawImage(im, -w / 2, -h / 2, w, h); x.restore();
}
function makeDirt(name) {
  const sd = SIDES[name], x = sd.dirt.x;
  clr(x);
  for (const [ax, ay, rx, ry, n] of DIRT_AREAS[name]) {
    for (let k = 0; k < n; k++) {
      let cx, cy, tries = 0;
      do { const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()); cx = ax + Math.cos(a) * rx * d; cy = ay + Math.sin(a) * ry * d; } while (!isOn(sd.pose, cx, cy) && ++tries < 20);
      const r = rnd(20, 32);
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

/* ---------- くっついている小物（貝がら・ヒトデ・コンブ） ---------- */
const ITEM_SPOTS = {
  front: [{ k: ['conch', 'clam'], name: '貝がら', at: [[205, 300], [330, 385], [470, 270]] },
          { k: ['star'], name: 'ヒトデ', at: [[300, 470], [160, 420], [480, 400]] },
          { k: ['kelp1', 'kelp2'], name: 'コンブ', at: [[355, 70], [250, 250], [110, 470]] }],
  back:  [{ k: ['conch', 'clam'], name: '貝がら', at: [[250, 270], [400, 300]] },
          { k: ['star'], name: 'ヒトデ', at: [[225, 500], [180, 380]] },
          { k: ['kelp1', 'kelp2'], name: 'コンブ', at: [[480, 470], [300, 90]] }],
  pit: []
};
const ITEM_W = { conch: 40, clam: 46, star: 50, kelp1: 50, kelp2: 48 };
function makeItems(name) {
  SIDES[name].items = ITEM_SPOTS[name].map((s) => {
    const [x, y] = pick(s.at), key = pick(s.k);
    return { key, name: s.name, x, y, rot: rnd(-0.6, 0.6), hp: 1, stuck: true, vx: 0, vy: 0, vr: 0 };
  });
}
function drawItem(x, it) { stamp(x, it.key, it.x, it.y, ITEM_W[it.key], it.rot, 1); }

/* ---------- 泡としずく ---------- */
function bubbleAt(x, cx, cy, r) {
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2);
  x.fillStyle = 'rgba(255,255,255,.82)'; x.fill();
  x.lineWidth = 1.2; x.strokeStyle = 'rgba(150,185,220,.85)'; x.stroke();
  x.fillStyle = 'rgba(255,255,255,1)'; x.beginPath(); x.arc(cx - r * 0.35, cy - r * 0.35, r * 0.25, 0, Math.PI * 2); x.fill();
}
// 泡は、マスごとに上限まで（同じ所をこすり続けても、もこもこになりすぎない）。まえの顔の上にはのせない
const onFace = (x, y, pose) => pose !== 'back' && ((x - FACE.cx) / (FACE.rx * 0.95)) ** 2 + ((y - FACE.cy + 8) / (FACE.ry * 0.95)) ** 2 < 1;   // うしろは真後ろの絵なので顔なし
function addFoam(sd, pose, px, py, R, n) {
  for (let i = 0; i < (n || 2); i++) {
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * R * 0.9, cx = px + Math.cos(a) * d, cy = py + Math.sin(a) * d;
    if (!isOn(pose, cx, cy) || onFace(cx, cy, pose)) continue;
    if (sd.foamGrid[cellOf(cx, cy)] >= 0.7) continue;
    bubbleAt(sd.foam.x, cx, cy, rnd(3, 9));
    eachCell(cx, cy, 10, (j) => { sd.foamGrid[j] = Math.min(1, sd.foamGrid[j] + 0.12); });
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
  if (p === 'stand' || p === 'mojimoji') {
    if (y >= CROTCH.y0 && y < RIM + 30 && x > CROTCH.x0 && x < CROTCH.x1 && !inE(x, y, ZONES.stand[0], 0.85)) return 'crotch';
  }
  if (y > RIM) return 'water';
  if (!isBody(x, y)) return null;
  if (p === 'back') {
    if (y < 165) return 'head';
    if (x > 320 && y > 400 && !inE(x, y, ZONES.back[0])) return 'tail';
    if (inE(x, y, ZONES.back[0])) return 'butt';
    if (x < 135 || x > 520) return 'arm';
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
    if (S.pose !== 'mojimoji') addFoam(foamSd, S.pose, x, y, BRUSH);
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
  water: ['お湯、あったか〜い♪'],
  banzai: ['ばんざ〜い！ わきも洗って〜'],
  pit: ['わきは、くすぐった〜い！', 'あはは、だめ〜！'],
  back: ['せなか、きもちいい〜', 'そこそこ〜♪'],
  butt: ['ひゃっ、おしり〜！', 'は、はずかしい〜', 'おしりも、ぽよん…'],
  turnBack: ['うしろも、お願い〜'],
  turnFront: ['まえも、お願い〜'],
  item: ['とれた〜！'],
  foam: ['あわあわ〜！ シャワーで流して〜'],
  foamBack: ['うしろの泡も、流して〜'],
  foamFront: ['まえの泡も、流して〜'],
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

const hintEl = document.getElementById('hint');
function setHint(html) { hintEl.innerHTML = tr(html); hintEl.classList.remove('small'); }
const gaugeEl = document.getElementById('gauge'), gfill = document.getElementById('gfill'), gnum = document.getElementById('gnum');
const dirtOf = (n) => sumGrid(SIDES[n].dirtGrid);
const foamOf = (n) => sumGrid(SIDES[n].foamGrid);
function updateGauge() {
  let g;
  if (S.stage === 'scrub') g = 30 + 70 * Math.max(0, Math.min(1, ((dirtOf('front') + dirtOf('back') + dirtOf('pit')) / S.dirt0 - 0.12) / 0.88));   // 汚れが残り約1割で 30%（最後のひとかけを探さなくてよいように）
  else if (S.stage === 'shower') g = 30 * Math.max(0, Math.min(1, ((foamOf('front') + foamOf('back')) / S.foam0 - 0.08) / 0.92));   // 腕のはしなどに少し残っても、0% に
  else g = 0;
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

/* ---------- まえ・うしろ（右下のボタン） ---------- */
const turnBtn = document.getElementById('turn');
function updateTurnBtn() {
  turnBtn.textContent = tr(S.side === 'front' ? '↻ うしろ' : '↻ まえ');
  turnBtn.hidden = !(S.stage === 'scrub' || S.stage === 'shower');
}
turnBtn.addEventListener('click', () => { audioInit(); turn(); });
function turn() {
  if (S.turn || S.stage === 'shake' || S.stage === 'clear') return;
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
  audioInit();
  if (S.stage === 'shake' || S.stage === 'clear' || S.turn) return;
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
    if (part && part !== 'crotch' && part !== 'water') { scrub(ptr.x, ptr.y, p.x, p.y, part); sfx.rub(); rubReact(part, d); }
    S.brush = part && part !== 'crotch' && part !== 'water' ? { x: p.x, y: p.y, a: Math.sin(S.t * 30) * 0.15 } : null;
    // おなか・お尻：指につられて動く（こすった向きに）
    if (part === 'belly' || part === 'butt') S.follow = { x: soft((p.x - ptr.sx) * 0.35, 24), y: soft((p.y - ptr.sy) * 0.35, 20) };
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
  // シャワーの間に、おなか・胸・お尻を軽くタップ → ぷるん！で水をはじく
  if (S.stage === 'shower' && ptr.moved < 14 && S.t - ptr.t < 0.35 && ['belly', 'chest', 'butt'].includes(ptr.part)) purun(ptr.sx, ptr.sy);
  ptr = null; S.follow = null; S.brush = null; S.showerOn = false; showerSound(false); S.lastInput = S.t;
}
cv.addEventListener('pointerup', endPtr);
cv.addEventListener('pointercancel', endPtr);

// さわった所の反応（さわった瞬間・ほかの所へ移ったとき）
function touchPart(part, first) {
  if (part === 'crotch') {
    setPose('mojimoji', 1.8); S.shakeT = 0.25;
    if (S.t - (S.said.crotch || -9) > 2.5) { S.said.crotch = S.t; say('crotch', true); sfx.giggle(); }
  } else if (part === 'water' && first && S.stage === 'scrub') {
    if (S.t - (S.said.water || -9) > 8) { S.said.water = S.t; say('water'); }
  } else if (part === 'pitHint' && S.stage === 'scrub') {
    // 脇の下にふれたら、ばんざいしてくれる
    setPose('banzai', 2.5); say('banzai', true); sfx.giggle(); S.jb.v += 120;
  }
}
// こすっている間の反応
function rubReact(part, d) {
  if (S.pose === 'banzai') S.poseUntil = Math.max(S.poseUntil, S.t + 2.5);   // 脇を洗っている間は、ばんざいのまま
  if (part === 'head') { if (S.pose === 'stand') setFace('melt', 1.0); if (Math.random() < 0.02) say('head'); }
  else if (part === 'tail') { if (S.face !== 'troubled' && S.pose === 'stand') { setFace('troubled', 1.2); say('tail'); S.shakeT = 0.2; } else if (S.pose === 'stand') setFace('troubled', 1.0); else if (Math.random() < 0.015) say('tail'); }
  else if (part === 'belly') { if (S.pose === 'stand') setFace('shy', 1.0); if (Math.random() < 0.012) say('belly'); }
  else if (part === 'back') { if (Math.random() < 0.012) say('back'); }
  else if (part === 'butt') { if (Math.random() < 0.015) { say('butt'); S.shakeT = 0.2; } }
  else if (part === 'pit') {
    S.tickle += d * 1.6;
    if (S.tickle > rnd(300, 600)) { S.tickle = 0; S.shakeT = 0.45; say('pit', true); sfx.giggle(); S.jcL.v += 120; S.jcR.v += 110; S.jb.v += 90; }
  } else if (part === 'chest' || part === 'arm' || part === 'pitHint') {
    S.tickle += d * (part === 'chest' ? 1 : 0.6);
    if (S.tickle > rnd(600, 1100)) {
      S.tickle = 0; if (S.pose === 'stand') setFace('happy', 1.4); S.shakeT = 0.45; say('tickle', true); sfx.giggle();
      S.jcL.v += 120; S.jcR.v += 110; S.jb.v += 90;
    }
  }
}

/* ---------- ぷるん！（水をはじく） ---------- */
function purun(x, y) {
  const zs = ZONES[S.pose] || [];
  let z = zs.find((q) => inE(x, y, q, 1.3)) || zs[0];
  if (!z) return;
  S.jb.v += 520; setTimeout(() => { S.jcL.v += 420; S.jcR.v += 390; }, 50);
  sfx.boing(1); if (S.pose === 'stand') setFace('shy', 1.2);
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

/* ---------- 段階を進める ---------- */
function toShower() {
  S.stage = 'shower'; setPose(basePose());
  // 残った少しの汚れは消す。くっついている小物も落とす
  for (const n of ['front', 'back', 'pit']) {
    const sd = SIDES[n]; clr(sd.dirt.x); sd.dirtGrid.fill(0);
    for (const it of sd.items) if (it.stuck) { it.stuck = false; it.vx = rnd(-60, 60); it.vy = -100; it.vr = rnd(-5, 5); }
  }
  // 両面を泡で包む（シャワーで流す楽しみのため）
  for (const n of ['front', 'back']) {
    const sd = SIDES[n];
    for (let i = 0; i < 400; i++) { const x = rnd(90, 560), y = rnd(-20, RIM - 10); if (isOn(sd.pose, x, y)) addFoam(sd, sd.pose, x, y, 26, 3); }
  }
  S.foam0 = Math.max(1, foamOf('front') + foamOf('back'));
  S.foamSide0 = { front: foamOf('front'), back: foamOf('back') };   // まえ・うしろそれぞれの泡の量（もう片方へさそうときに使う）
  compDirty = true;
  say('foam', true); if (S.pose === 'stand') setFace('happy', 1.5); sfx.fanfare();
  setHint('<b>指でなぞると、上からシャワーが出るよ</b><br><span class="sub">泡を流してね。おなかや胸・お尻をタップすると…？</span>');
  updateTurnBtn();
}
function toShake() {
  S.stage = 'shake'; S.showerOn = false; showerSound(false); ptr = null; S.brush = null;
  for (const n of ['front', 'back']) { SIDES[n].foamGrid.fill(0); clr(SIDES[n].foam.x); }
  S.side = 'front'; setPose('shake', 0); S.shakeAll = 1.8;
  compDirty = true;
  say('shake', true);
  hintEl.classList.add('small'); updateTurnBtn();
  sfx.splash();
}
function toClear() {
  S.stage = 'clear'; for (const n of ['front', 'back']) clr(SIDES[n].wet.x);
  setPose('stand'); compDirty = true;
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
  const sd = cur();
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
  if (S.shakeAll > 0) {
    S.shakeAll -= h;
    S.shakeX = Math.sin(S.t * 34) * 7 * Math.min(1, S.shakeAll);
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
  for (const n of ['front', 'back', 'pit']) for (const it of SIDES[n].items) if (!it.stuck && !it.gone) {
    it.vy += 900 * h; it.x += it.vx * h; it.y += it.vy * h; it.rot += it.vr * h;
    if (it.y > RIM + 20) { it.gone = true; if (n === S.side || n === 'pit') events.push(['plop', it]); }
    compDirty = true;
  }
  // シャワーの水
  if (S.stage === 'shower' && S.showerOn && Math.random() < 0.9) {
    for (let i = 0; i < 2; i++) S.drops.push({ x: S.sx + rnd(-16, 16), y: S.sy - 150, vx: rnd(-25, 25), vy: rnd(650, 800), r: rnd(2, 3.5), life: 1.5, target: S.sy + rnd(-30, 20) });
  }
  const zs = ZONES[S.pose] || [];
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
      // おなか・胸・お尻に当たった水は、ぽよんとはねる（半分くらい。残りは体をつたって流れる）
      const z = zs.find((q) => inE(d.x, d.y, q));
      if (z && Math.random() < 0.5) {
        d.free = true; d.vy = -d.vy * rnd(0.35, 0.55); d.vx = (d.x - z.cx) * rnd(1.2, 2.2) + rnd(-60, 60);
        S[z.s].v += z.s === 'jb' ? 14 : 10;
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
  if (S.pose === 'banzai') {   // 脇の汚れ
    x.drawImage(SIDES.pit.dirt.c, 0, -TOP);
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

function drawBackground() {
  const bg = IMG.beach, s = Math.max(W / bg.width, H / bg.height);
  ctx.drawImage(bg, (W - bg.width * s) / 2, (H - bg.height * s) / 2 + H * 0.05, bg.width * s, bg.height * s);
  ctx.fillStyle = 'rgba(255,248,235,.18)'; ctx.fillRect(0, 0, W, H);   // 少しだけ明るく（タヌくんが目立つように）
}
// 大きな木のおけ（お風呂）。back=true は奥のふち、false はお湯と手前
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
  for (const yy of [top + ry + 40, top + ry + 190]) {   // たが（竹の輪）
    ctx.fillStyle = '#6f8f3a'; ctx.beginPath(); ctx.ellipse(cx, yy - ry * 0.7, rx + 2, ry, 0, 0.05, Math.PI - 0.05); ctx.lineTo(cx - rx, yy - ry * 0.7 + 16); ctx.ellipse(cx, yy - ry * 0.7 + 16, rx, ry, 0, Math.PI - 0.05, 0.05, true); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = '#6e4220'; ctx.lineWidth = 9;   // ふち
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
// 竹のシャワー（小物の絵の上の部分＝横の筒と結び目だけ使う）。筒の口（絵の左はし）から水が出る
function drawShower(x, y) {
  const im = IMG.bamboo, sw = im.width, sh = im.height * 0.52, sc = 1.25;
  ctx.drawImage(im, 0, 0, sw, sh, x - 12 * sc, y - 56 * sc, sw * sc, sh * sc);
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
  drawBackground();
  // ここからは、立ち絵の座標で描く
  ctx.setTransform(DPR * K, 0, 0, DPR * K, DPR * OX, DPR * OY);
  drawTub(true);
  const changed = compDirty && recompose();
  warp(changed);
  // くるっと回るときは、横につぶして、ひろげる
  let sx = 1;
  if (S.turn) sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * S.turn.t / 0.36)));
  ctx.save(); ctx.translate(BODY_CX + S.shakeX, 0); ctx.scale(sx, 1); ctx.translate(-BODY_CX, 0);
  ctx.drawImage(outL.c, 0, -TOP);
  ctx.restore();
  ctx.save(); ctx.translate(S.shakeX, 0);
  for (const n of [S.side, 'pit']) for (const it of SIDES[n].items) if (!it.stuck && !it.gone) drawItem(ctx, it);   // 落ちている小物
  ctx.restore();
  drawTub(false);
  // 水のつぶ
  ctx.save(); ctx.translate(S.shakeX, 0);
  ctx.fillStyle = 'rgba(205,235,255,.9)';
  for (const d of S.drops) {
    if (d.dead) continue;
    if (d.run) { ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.ellipse(d.x, d.y, 2, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; continue; }
    ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r * 0.8, d.r * 1.3, Math.atan2(d.vx, d.vy) * -1, 0, Math.PI * 2); ctx.fill();
  }
  for (const p of S.sparks) drawSpark(p);
  if (S.brush && S.stage === 'scrub') drawBrush();
  if (S.stage === 'shower') { if (S.showerOn) drawShower(S.sx, S.sy - 150); else drawShower(560 + Math.sin(S.t * 2) * 6, 120); }
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
      for (let i = 0; i < 6; i++) spark(v.x + rnd(-24, 24), v.y + rnd(-24, 24), 0.9, true);
    } else if (type === 'plop') sfx.plop();
  }
  if (S.face && S.t > S.faceUntil) { S.face = null; compDirty = true; }
  const g = updateGauge();
  if (S.stage === 'scrub' && g <= 30.2) toShower();
  else if (S.stage === 'shower' && g <= 0) toShake();
  // 片方がだいたいきれいになったら、もう片方へさそう（ボタンをゆらす）
  if ((S.stage === 'scrub' || S.stage === 'shower') && !S.turn) {
    const amt = (n) => (S.stage === 'scrub' ? dirtOf(n) / (S.side0[n] || 1) : foamOf(n) / (S.foamSide0[n] || 1));
    const here = S.side, there = here === 'front' ? 'back' : 'front';
    const key = S.stage + here;
    if (amt(here) < 0.18 && amt(there) > 0.25 && !S.asked[key]) {
      S.asked[key] = true; turnBtn.classList.add('ask');
      say(S.stage === 'scrub' ? (here === 'front' ? 'turnBack' : 'turnFront') : (here === 'front' ? 'foamBack' : 'foamFront'), true);
    }
  }
  // しばらくさわらないと、さそう
  if (S.stage === 'scrub' && !ptr && S.t - S.lastInput > 10) { S.lastInput = S.t; say('idle'); }
}

/* ---------- はじめる ---------- */
function start() {
  S.stage = 'scrub'; S.side = 'front'; S.turn = null; setPose('stand'); S.face = null;
  S.drops = []; S.sparks = []; S.ripples = []; S.shakeAll = 0; S.tickle = 0; S.said = {}; S.asked = {};
  for (const n of ['front', 'back', 'pit']) {
    const sd = SIDES[n]; clr(sd.foam.x); clr(sd.wet.x); sd.foamGrid.fill(0);
    makeDirt(n); makeItems(n);
  }
  S.side0 = { front: dirtOf('front') + dirtOf('pit'), back: dirtOf('back') };
  S.dirt0 = Math.max(1, dirtOf('front') + dirtOf('back') + dirtOf('pit'));
  S.foamSide0 = {};
  S.gauge = -1; updateGauge(); updateTurnBtn(); turnBtn.classList.remove('ask');
  compDirty = true; S.lastInput = S.t;
  setHint('<b>よごれている所を、指でこすってね</b><br><span class="sub">脇の下をこすると、ばんざいしてくれるよ。右下のボタンで、うしろも洗えるよ</span>');
  setTimeout(() => say('start', true), 700);
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
