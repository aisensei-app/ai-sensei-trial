/* =========================================================
   タヌくん おなか・胸の「ぽよん」（Windows版と同じ方式）
   絵を網目のように変形させて（メッシュ変形）、おなか（と両胸）だけを
   へこませたり、ふくらませたり、引っぱったりします。
   ・変形は楕円の中心ほど強く、ふちに向かってなめらかに 0 になる
     → 境目ができず、絵が二重に見えない
   ・動きは「ばね」の計算（ばねの強さ SPRING、止まりやすさ DAMP）
   ・胸は、おなかより少しだけ小さく・少し遅れて揺れる（つられて揺れる感じ）
   数値は config.js の bellyJiggle / chestJiggle で調整します。

   ※ PC でファイルを直接開いたとき（file://）は、ブラウザの安全のしくみで
     絵の色を読み取れないため、かんたんな方式（重ね絵の拡大）に切り替わります。
   ========================================================= */
window.TanuBelly = function (opts) {
  'use strict';

  const BJ = opts.config;            // おなか
  const CJ = opts.chest || null;     // 胸（なければ胸は揺らさない）
  const baseImg = opts.img;          // ふだん表示している <img>
  const canvas = opts.canvas;        // 変形した絵を描く <canvas>
  const ctx = canvas.getContext('2d');
  const k = BJ.strength == null ? 1 : BJ.strength;

  /* ---------- 揺らす場所（楕円）----------
     gain … おなかに対する揺れの大きさ　delay … おなかから何ミリ秒遅れて揺れるか */
  const regions = [{ def: BJ, gain: 1, dragGain: 1, delay: 0 }];
  if (CJ && CJ.gain > 0) {
    const dg = CJ.dragGain == null ? CJ.gain : CJ.dragGain;
    [CJ.left, CJ.right].forEach((d) => {
      if (d) regions.push({ def: d, gain: CJ.gain, dragGain: dg, delay: CJ.delayMs || 0 });
    });
  }
  regions.forEach((r) => { r.x = r.v = r.px = r.py = r.pvx = r.pvy = 0; });

  // 画像の大きさ（すべての絵が同じ大きさの前提）
  let W = 0, H = 0;
  // すべての楕円を囲む四角（ここだけ計算する）
  let bx, by, bw, bh;

  /* ---------- ばね ---------- */
  const SPRING = BJ.spring || 450;
  const DAMP = BJ.damp || 9;
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
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    regions.forEach((r) => {
      r.cx = r.def.x / 100 * W; r.cy = r.def.y / 100 * H;
      r.rx = r.def.rx / 100 * W; r.ry = r.def.ry / 100 * H;
      x0 = Math.min(x0, r.cx - r.rx); y0 = Math.min(y0, r.cy - r.ry);
      x1 = Math.max(x1, r.cx + r.rx); y1 = Math.max(y1, r.cy + r.ry);
    });
    bx = Math.max(0, Math.floor(x0)); by = Math.max(0, Math.floor(y0));
    bw = Math.min(W, Math.ceil(x1)) - bx; bh = Math.min(H, Math.ceil(y1)) - by;
    // 楕円の中の各点の「変形の強さ」を先に計算しておく（中心 1 → ふち 0）
    regions.forEach((r) => {
      r.weight = new Float32Array(bw * bh);
      for (let y = 0; y < bh; y++) {
        for (let x = 0; x < bw; x++) {
          const u = (x + bx - r.cx) / r.rx, v = (y + by - r.cy) / r.ry;
          const r2 = u * u + v * v;
          r.weight[y * bw + x] = r2 < 1 ? (1 - r2) * (1 - r2) : 0;
        }
      }
    });
  }

  /* ---------- 変形して描く ---------- */
  let out = null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function render() {
    const data = pixels(baseImg.src);
    if (!data) return false;
    if (!out) out = ctx.createImageData(bw, bh);
    const o = out.data;
    // いま動いている場所だけ計算する
    const act = regions.filter((r) => r.x || r.px || r.py);
    act.forEach((r) => { r.sc = clamp(r.x, -0.35, 0.35); });   // 連打でも絵がこわれない範囲に
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const i = y * bw + x;
        const X = x + bx, Y = y + by;
        let sx = X, sy = Y;
        for (let n = 0; n < act.length; n++) {
          const r = act[n], f = r.weight[i];
          if (f === 0) continue;
          // 中心に近い点ほど、ふくらみ（またはへこみ）と引っぱりの分だけずらして色を取る
          sx -= (X - r.cx) * r.sc * f + r.px * f;
          sy -= (Y - r.cy) * r.sc * f + r.py * f;
        }
        // まわり4点の色をまぜて取る（なめらかにするため）
        const x0 = clamp(sx | 0, 0, W - 2), y0 = clamp(sy | 0, 0, H - 2);
        const fx = clamp(sx - x0, 0, 1), fy = clamp(sy - y0, 0, 1);
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

  function stepRegion(r, h) {
    r.v += (-SPRING * r.x - DAMP * r.v) * h;
    r.x += r.v * h;
    if (!dragging) {
      r.pvx += (-SPRING * r.px - DAMP * r.pvx) * h;
      r.pvy += (-SPRING * r.py - DAMP * r.pvy) * h;
      r.px += r.pvx * h;
      r.py += r.pvy * h;
    }
  }

  const isStill = (r) => Math.abs(r.x) < 0.001 && Math.abs(r.v) < 0.02 &&
    Math.abs(r.px) < 0.3 && Math.abs(r.py) < 0.3 && Math.abs(r.pvx) < 3 && Math.abs(r.pvy) < 3;
  const zero = (r) => { r.x = r.v = r.px = r.py = r.pvx = r.pvy = 0; };

  let pending = 0;   // 遅れて揺れ始める予定の数
  function loop(t) {
    let dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    // 細かく分けて計算すると、ばねが安定する
    while (dt > 0) {
      const h = Math.min(dt, 1 / 240);
      regions.forEach((r) => stepRegion(r, h));
      dt -= h;
    }
    if (!dragging && !pending && regions.every(isStill)) {
      regions.forEach(zero);
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
      regions.forEach((r) => {
        const kick = () => { r.v -= TAP_V * r.gain; start(); };
        if (!r.delay) { kick(); return; }
        pending++;
        setTimeout(() => { pending--; kick(); }, r.delay);
      });
      start();
    },
    // 引っぱる（dx, dy は画面上の移動量。scale は画面→画像の倍率）
    // 胸は dragGain の分だけ、つられて動く
    drag: function (dx, dy, scale) {
      if (!W) return;
      dragging = true;
      const max = (BJ.pullMax || 8.6) / 100 * W * k;
      let px = dx * scale, py = dy * scale;
      const len = Math.hypot(px, py);
      if (len > max) { px *= max / len; py *= max / len; }
      regions.forEach((r) => {
        r.px = px * r.dragGain; r.py = py * r.dragGain; r.pvx = r.pvy = 0;
      });
      start();
    },
    // はなす：ばねで戻る（半分ずつ行きすぎながら止まる）
    release: function () {
      dragging = false;
      start();
    },
    stop: function () {
      regions.forEach(zero);
      dragging = false;
    }
  };
};
