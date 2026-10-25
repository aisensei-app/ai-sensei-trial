/* =========================================================
   タヌくん おなかの「ぽよん」（Windows版と同じ方式）
   絵を網目のように変形させて（メッシュ変形）、おなかだけを
   へこませたり、ふくらませたり、引っぱったりします。
   ・変形はおなかの中心ほど強く、ふちに向かってなめらかに 0 になる
     → 境目ができず、絵が二重に見えない
   ・動きは「ばね」の計算（ばねの強さ SPRING、止まりやすさ DAMP）
   数値は config.js の bellyJiggle で調整します。

   ※ PC でファイルを直接開いたとき（file://）は、ブラウザの安全のしくみで
     絵の色を読み取れないため、かんたんな方式（重ね絵の拡大）に切り替わります。
   ========================================================= */
window.TanuBelly = function (opts) {
  'use strict';

  const BJ = opts.config;
  const baseImg = opts.img;          // ふだん表示している <img>
  const canvas = opts.canvas;        // 変形した絵を描く <canvas>
  const ctx = canvas.getContext('2d');
  const k = BJ.strength == null ? 1 : BJ.strength;

  // 画像の大きさ（すべての絵が同じ大きさの前提）
  let W = 0, H = 0;
  // おなかの楕円（画像のピクセル単位）
  let cx, cy, rx, ry, bx, by, bw, bh;
  // 楕円の中の各点の「変形の強さ」を先に計算しておく
  let weight = null;

  /* ---------- ばね ---------- */
  const SPRING = BJ.spring || 450;
  const DAMP = BJ.damp || 9;
  const s = { x: 0, v: 0,            // ふくらみ（+ でふくらむ、- でへこむ）
              px: 0, py: 0,          // 引っぱり（ピクセル）
              pvx: 0, pvy: 0 };
  let dragging = false;

  // 1回のタップで「最初にへこむ量」が tapDent になる初速を計算
  const wd = Math.sqrt(SPRING - (DAMP / 2) * (DAMP / 2));
  const t1 = Math.atan(wd / (DAMP / 2)) / wd;
  const peak = Math.exp(-DAMP / 2 * t1) * Math.sin(wd * t1) / wd;
  const TAP_V = (BJ.tapDent || 0.08) * k / peak;

  /* ---------- 絵の色データ（絵ごとに1回だけ読む） ---------- */
  const cache = {}, images = {};
  let usable = true;
  function pixels(src) {
    if (cache[src]) return cache[src];
    const im = images[src] || (images[src] = new Image());
    if (!im.src) im.src = src;
    if (!im.complete || !im.naturalWidth) return null;
    if (!W) setup(im.naturalWidth, im.naturalHeight);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const cc = c.getContext('2d');
    cc.drawImage(im, 0, 0, W, H);
    try {
      cache[src] = cc.getImageData(0, 0, W, H).data;
    } catch (e) {
      usable = false;   // file:// などで読めない → かんたん方式へ
      return null;
    }
    return cache[src];
  }

  function setup(w, h) {
    W = w; H = h;
    canvas.width = W; canvas.height = H;
    cx = BJ.x / 100 * W; cy = BJ.y / 100 * H;
    rx = BJ.rx / 100 * W; ry = BJ.ry / 100 * H;
    bx = Math.max(0, Math.floor(cx - rx)); by = Math.max(0, Math.floor(cy - ry));
    bw = Math.min(W, Math.ceil(cx + rx)) - bx; bh = Math.min(H, Math.ceil(cy + ry)) - by;
    weight = new Float32Array(bw * bh);
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const u = (x + bx - cx) / rx, v = (y + by - cy) / ry;
        const r2 = u * u + v * v;
        weight[y * bw + x] = r2 < 1 ? (1 - r2) * (1 - r2) : 0;
      }
    }
  }

  /* ---------- 変形して描く ---------- */
  let out = null;
  function render() {
    const src = baseImg.src;
    const data = pixels(src);
    if (!data) return false;
    if (!out) out = ctx.createImageData(bw, bh);
    const o = out.data;
    const sc = Math.max(-0.35, Math.min(0.35, s.x));   // 連打でも絵がこわれない範囲に
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const i = y * bw + x, f = weight[i];
        const X = x + bx, Y = y + by;
        let sx = X, sy = Y;
        if (f > 0) {
          // 中心に近い点ほど、ふくらみ（またはへこみ）と引っぱりの分だけずらして色を取る
          sx = cx + (X - cx) * (1 - sc * f) - s.px * f;
          sy = cy + (Y - cy) * (1 - sc * f) - s.py * f;
        }
        // まわり4点の色をまぜて取る（なめらかにするため）
        const x0 = Math.max(0, Math.min(W - 2, sx | 0)), y0 = Math.max(0, Math.min(H - 2, sy | 0));
        const fx = Math.max(0, Math.min(1, sx - x0)), fy = Math.max(0, Math.min(1, sy - y0));
        const a = (y0 * W + x0) * 4, b = a + 4, c = a + W * 4, d = c + 4;
        const j = i * 4;
        for (let ch = 0; ch < 4; ch++) {
          const top = data[a + ch] + (data[b + ch] - data[a + ch]) * fx;
          const bot = data[c + ch] + (data[d + ch] - data[c + ch]) * fx;
          o[j + ch] = top + (bot - top) * fy;
        }
      }
    }
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(baseImg, 0, 0, W, H);
    ctx.putImageData(out, bx, by);
    return true;
  }

  /* ---------- 動かす ---------- */
  let running = false, last = 0;
  function show(on) {
    canvas.style.visibility = on ? 'visible' : 'hidden';
    baseImg.style.visibility = on ? 'hidden' : 'visible';
  }

  function loop(t) {
    let dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    // 細かく分けて計算すると、ばねが安定する
    while (dt > 0) {
      const h = Math.min(dt, 1 / 240);
      s.v += (-SPRING * s.x - DAMP * s.v) * h;
      s.x += s.v * h;
      if (!dragging) {
        s.pvx += (-SPRING * s.px - DAMP * s.pvx) * h;
        s.pvy += (-SPRING * s.py - DAMP * s.pvy) * h;
        s.px += s.pvx * h;
        s.py += s.pvy * h;
      }
      dt -= h;
    }
    const still = Math.abs(s.x) < 0.001 && Math.abs(s.v) < 0.02 &&
                  Math.abs(s.px) < 0.3 && Math.abs(s.py) < 0.3 &&
                  Math.abs(s.pvx) < 3 && Math.abs(s.pvy) < 3 && !dragging;
    if (still) {
      s.x = s.v = s.px = s.py = s.pvx = s.pvy = 0;
      running = false;
      show(false);
      return;
    }
    show(render());
    requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  // 使えるか先に確かめる（file:// では false）
  function ready() {
    if (!usable) return false;
    pixels(baseImg.src);
    return usable;
  }

  // 絵の色を前もって読んでおく（最初のタップで動きが引っかからないように）
  function warm(srcs) {
    let i = 0;
    (function next() {
      if (!usable || i >= srcs.length) return;
      pixels(srcs[i++]);
      setTimeout(next, 60);
    })();
  }

  return {
    ready: ready,
    warm: warm,
    // タップ：まずへこんで、ぽよんと戻る（連打すると揺れが足し算される）
    tap: function () {
      s.v -= TAP_V;
      start();
    },
    // 引っぱる（dx, dy は画面上の移動量。scale は画面→画像の倍率）
    drag: function (dx, dy, scale) {
      dragging = true;
      const max = (BJ.pullMax || 8.6) / 100 * W * k;
      let px = dx * scale, py = dy * scale;
      const len = Math.hypot(px, py);
      if (len > max) { px *= max / len; py *= max / len; }
      s.px = px; s.py = py; s.pvx = s.pvy = 0;
      start();
    },
    // はなす：ばねで戻る（半分ずつ行きすぎながら止まる）
    release: function () {
      dragging = false;
      start();
    },
    stop: function () {
      s.x = s.v = s.px = s.py = s.pvx = s.pvy = 0;
      dragging = false;
    }
  };
};
