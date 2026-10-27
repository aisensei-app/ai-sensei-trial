/* =========================================================
   タヌくん おなか・胸の「ぷるん」（Windows版と同じ方式）
   絵を網目のように変形させて（メッシュ変形）、さわった場所だけを
   へこませたり、ふくらませたり、引っぱったりします。
   揺れる場所は3か所：おなか（belly）・左の胸（chestL）・右の胸（chestR）
   ・変形は楕円の中心ほど強く、ふちに向かってなめらかに 0 になる
     → 境目ができず、絵が二重に見えない
   ・動きは「ばね」の計算（ばねの強さ SPRING、止まりやすさ DAMP）
   ・指を置いている間は、その場所がへこみ、指の位置がくぼむ
   ・胸は「肉のかたまりが上下にぷるんぷるん揺れる」動き（bob）。
     中心ほど大きく動き、ふちに向かって弱くなるので、輪郭が折れない
     → はなすと「ぷるん」と戻る
   数値は config.js の bellyJiggle / chestJiggle で調整します。
   ・きせかえパーツ（デベソなど）は、絵に重ねてから変形するので、いっしょに揺れます
   ・おまた（crotch）は、さわっても揺れず、swell で少しの間だけ「むくっ」とふくらむ
   ・しっぽ（tail）は、twitch で付け根を軸に「ビクン」と動く（付け根は動かず、先ほど大きく動く）
   ・opts.extra で、ほかの場所も足せる（ぽんぽこリズムの腕・ネックレス）
       type: 'twist' … twitch で付け根を軸に回る（cutX がなければ、片側を止めない）
       type: 'bob'   … kick で上下に「ぷるん」と揺れる

   ※ PC でファイルを直接開いたとき（file://）は、ブラウザの安全のしくみで
     絵の色を読み取れないため、かんたんな方式（重ね絵の拡大）に切り替わります。
   ========================================================= */
window.TanuBelly = function (opts) {
  'use strict';

  const BJ = opts.config;            // おなか
  const CJ = opts.chest || null;     // 胸（なければ胸は揺らさない）
  const BG = opts.bulge || null;     // おまたのふくらみ（なければ、ふくらまない）
  const TT = opts.tail || null;      // しっぽの「ビクン」（なければ、動かさない）
  const baseImg = opts.img;          // ふだん表示している <img>
  const canvas = opts.canvas;        // 変形した絵を描く <canvas>
  const overlay = opts.overlay || null;              // ふだん部品を表示している入れ物
  const layersFor = opts.layers || (() => []);       // その絵に重ねる部品の一覧
  const ctx = canvas.getContext('2d');
  const k = BJ.strength == null ? 1 : BJ.strength;

  /* ---------- 揺らす場所（楕円）----------
     gain … おなかに対する揺れの大きさ（胸はおなかより小さく） */
  const parts = { belly: { def: BJ, gain: 1, canDrag: true } };
  if (CJ && CJ.gain > 0) {
    const cd = !!CJ.drag;
    const bob = CJ.bob || 0;   // 上下に揺れる大きさ（絵の高さの％）
    if (CJ.left)  parts.chestL = { def: CJ.left,  gain: CJ.gain, canDrag: cd, bob: bob };
    if (CJ.right) parts.chestR = { def: CJ.right, gain: CJ.gain, canDrag: cd, bob: bob };
  }
  if (BG && BG.amount > 0) parts.crotch = { def: BG, gain: 1, canDrag: false };
  if (TT && TT.angles) parts.tail = { def: TT, gain: 1, canDrag: false, twist: true };
  const EX = opts.extra || {};
  Object.keys(EX).forEach((key) => {
    parts[key] = { def: EX[key], gain: 1, canDrag: false, twist: EX[key].type === 'twist' };
  });
  const regions = Object.keys(parts).map((key) => {
    const r = parts[key];
    r.key = key;
    r.x = r.v = r.px = r.py = r.pvx = r.pvy = 0;
    r.hold = 0;          // 指で押さえている間の「へこみ」の目標
    r.holdY = 0;         // 指で押さえている間の「沈み」の目標（胸の上下の揺れ用。ピクセル）
    r.dragging = false;
    return r;
  });

  // 「指のくぼみ」（指を置いた場所だけが小さくへこむ。胸は gain の分だけ浅く）
  const PK = BJ.poke || { size: 0.45, depth: 0.2 };
  const poke = { x: 0, v: 0, hold: 0, cx: 0, cy: 0, rx: 1, ry: 1 };

  // 画像の大きさ（すべての絵が同じ大きさの前提）
  let W = 0, H = 0;
  // すべての楕円を囲む四角（ここだけ計算する）
  let bx, by, bw, bh;

  /* ---------- ばね ---------- */
  const SPRING = BJ.spring || 450;
  const DAMP = BJ.damp || 9;

  // 1回のタップで「最初にへこむ量」が tapDent になる初速を計算
  const wd = Math.sqrt(SPRING - (DAMP / 2) * (DAMP / 2));
  const t1 = Math.atan(wd / (DAMP / 2)) / wd;
  const peak = Math.exp(-DAMP / 2 * t1) * Math.sin(wd * t1) / wd;
  const TAP_V = (BJ.tapDent || 0.08) * k / peak;

  /* ---------- きせかえパーツを重ねる ----------
     layersFor(src) は [{ img, x, y, width }]（x, y, width は絵の％。なければ絵全体に重ねる） */
  const ok = (im) => im.complete && im.naturalWidth > 0;
  function drawLayers(c, layers) {
    layers.forEach((l) => {
      if (l.width == null) { c.drawImage(l.img, 0, 0, W, H); return; }
      const w = l.width / 100 * W, h = w * l.img.naturalHeight / l.img.naturalWidth;
      c.drawImage(l.img, l.x / 100 * W - w / 2, l.y / 100 * H - h / 2, w, h);
    });
  }
  const keyOf = (src, layers) => src + '|' + layers.map((l) => l.img.src).join('|');

  /* ---------- 絵の色データ（絵と部品の組み合わせごとに1回だけ読む） ---------- */
  let cache = {};
  const images = {};
  let usable = true;
  function pixels(src) {
    const layers = layersFor(src);
    const key = keyOf(src, layers);
    if (cache[key]) return cache[key];
    // いま表示している絵なら、それをそのまま使う（読み込み待ちをしないため）
    const im = src === baseImg.src && ok(baseImg) ? baseImg : (images[src] || (images[src] = new Image()));
    if (!im.src) im.src = src;
    if (!ok(im) || !layers.every((l) => ok(l.img))) return null;
    if (!W) setup(im.naturalWidth, im.naturalHeight);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const cc = c.getContext('2d');
    cc.drawImage(im, 0, 0, W, H);
    drawLayers(cc, layers);
    try {
      cache[key] = cc.getImageData(0, 0, W, H).data;
    } catch (e) {
      usable = false;   // file:// などで読めない → かんたん方式へ
      return null;
    }
    return cache[key];
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
    // shade がある場所（おまたのふくらみ）は、丸く見せる陰影（上が明るく、下と横が暗い）も計算しておく
    // しっぽ（twist）は、楕円の中ほぼ全体を、付け根（pivot）から遠いほど大きく回す
    const L = [-0.35, -0.75, 0.55], LN = Math.hypot(L[0], L[1], L[2]);
    regions.forEach((r) => {
      r.weight = new Float32Array(bw * bh);
      if (r.def.shade) r.light = new Float32Array(bw * bh);
      // この場所を計算する範囲（四角の中での位置）。動いている場所だけ計算するため
      r.x0 = Math.max(0, Math.floor(r.cx - r.rx) - bx); r.y0 = Math.max(0, Math.floor(r.cy - r.ry) - by);
      r.x1 = Math.min(bw, Math.ceil(r.cx + r.rx) - bx); r.y1 = Math.min(bh, Math.ceil(r.cy + r.ry) - by);
      if (r.twist) {
        // 付け根の位置（pvx, pvy は引っぱりの速さに使っているので、別の名前にする）
        r.pivX = r.def.pivotX / 100 * W; r.pivY = r.def.pivotY / 100 * H;
        r.reach = r.def.reach / 100 * W;
        r.cut = r.def.cutX == null ? -Infinity : r.def.cutX / 100 * W;   // なければ片側を止めない
      }
      for (let y = 0; y < bh; y++) {
        for (let x = 0; x < bw; x++) {
          const u = (x + bx - r.cx) / r.rx, v = (y + by - r.cy) / r.ry;
          const r2 = u * u + v * v;
          if (r.twist) {
            if (r2 >= 1) continue;
            const edge = Math.min(1, (1 - r2) / 0.3);                                  // 楕円のふちだけ弱く
            const cut = clamp((x + bx - r.cut + 15) / 30, 0, 1);                        // 腰みの側（左）は動かさない
            const far = clamp(Math.hypot(x + bx - r.pivX, y + by - r.pivY) / r.reach, 0, 1);  // 付け根から遠いほど大きく
            r.weight[y * bw + x] = edge * cut * far * (2 - far);
            continue;
          }
          r.weight[y * bw + x] = r2 < 1 ? (1 - r2) * (1 - r2) : 0;
          if (r.light && r2 < 1) {
            const nz = Math.sqrt(1 - r2);
            const dot = (u * L[0] + v * L[1] + nz * L[2]) / LN;
            r.light[y * bw + x] = (dot - 0.45) * nz * r.def.shade;
          }
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
    // いま動いている場所だけ計算する（その場所を囲む四角の中だけ）
    const act = regions.filter((r) => r.x || r.px || r.py);
    let ax0 = bw, ay0 = bh, ax1 = 0, ay1 = 0;
    act.forEach((r) => {
      ax0 = Math.min(ax0, r.x0); ay0 = Math.min(ay0, r.y0);
      ax1 = Math.max(ax1, r.x1); ay1 = Math.max(ay1, r.y1);
    });
    if (ax1 <= ax0 || ay1 <= ay0) { ax0 = ay0 = 0; ax1 = ay1 = 1; }
    act.forEach((r) => {
      r.sc = clamp(r.x, -0.35, 0.35);   // 連打でも絵がこわれない範囲に
      // ふくらみ：いまどのくらいふくらんでいるか（0〜1）。陰影と持ち上げに使う
      r.fr = r.def.amount ? clamp(r.x / r.def.amount, 0, 1.2) : 0;
    });
    const pk = poke.x ? clamp(poke.x, -0.5, 0.3) : 0;
    // くぼみの影：へこんでいるときだけ、指の位置をうっすら暗くする（押している感じを出す）
    const shadeK = pk < 0 && PK.depth > 0 ? (PK.shade || 0) * Math.min(1, -pk / PK.depth) : 0;
    for (let y = ay0; y < ay1; y++) {
      for (let x = ax0; x < ax1; x++) {
        const i = y * bw + x;
        const X = x + bx, Y = y + by;
        let sx = X, sy = Y, dark = 0, lit = 0, clear = false;
        for (let n = 0; n < act.length; n++) {
          const r = act[n], f = r.weight[i];
          if (f === 0) continue;
          if (r.twist) {
            // しっぽ：付け根を軸に、角度 r.x（ラジアン）× 強さ だけ回したところの色を取る
            const a = clamp(r.x, -0.6, 0.6) * f, c = Math.cos(a), s = Math.sin(a);
            const dx = X - r.pivX, dy = Y - r.pivY;
            sx += r.pivX + c * dx + s * dy - X;
            sy += r.pivY - s * dx + c * dy - Y;
            // しっぽが動いてあいた所に、足や腰みのの色を持ってこない（透明にする）
            if (r.pivX + c * dx + s * dy < r.cut - 15) clear = true;
            continue;
          }
          // 中心に近い点ほど、ふくらみ（またはへこみ）と引っぱりの分だけずらして色を取る
          sx -= (X - r.cx) * r.sc * f + r.px * f;
          sy -= (Y - r.cy) * r.sc * f + r.py * f;
          if (r.light) {
            sy += (r.def.lift || 0) * f * r.fr;   // 少し持ち上がる
            lit += r.light[i] * r.fr;
          }
        }
        if (pk) {
          // 指のくぼみ：指の位置を中心に、小さくへこませる
          const u = (X - poke.cx) / poke.rx, v = (Y - poke.cy) / poke.ry;
          const r2 = u * u + v * v;
          if (r2 < 1) {
            const f = (1 - r2) * (1 - r2);
            sx -= (X - poke.cx) * pk * f;
            sy -= (Y - poke.cy) * pk * f;
            dark = shadeK * f * f;
          }
        }
        // まわり4点の色をまぜて取る（なめらかにするため）
        const x0 = clamp(sx | 0, 0, W - 2), y0 = clamp(sy | 0, 0, H - 2);
        const fx = clamp(sx - x0, 0, 1), fy = clamp(sy - y0, 0, 1);
        const a = (y0 * W + x0) * 4, b = a + 4, c = a + W * 4, d = c + 4;
        const j = i * 4;
        if (clear) { o[j] = o[j + 1] = o[j + 2] = o[j + 3] = 0; continue; }
        for (let ch = 0; ch < 4; ch++) {
          const top = data[a + ch] + (data[b + ch] - data[a + ch]) * fx;
          const bot = data[c + ch] + (data[d + ch] - data[c + ch]) * fx;
          const v = top + (bot - top) * fy;
          o[j + ch] = ch < 3 && (dark || lit) ? clamp(v * (1 - dark) * (1 + lit), 0, 255) : v;
        }
      }
    }
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(baseImg, 0, 0, W, H);
    drawLayers(ctx, layersFor(baseImg.src));
    ctx.putImageData(out, bx, by, ax0, ay0, ax1 - ax0, ay1 - ay0);
    return true;
  }

  /* ---------- 動かす ---------- */
  let running = false, last = 0;
  function show(on) {
    canvas.style.visibility = on ? 'visible' : 'hidden';
    baseImg.style.visibility = on ? 'hidden' : 'visible';
    if (overlay) overlay.style.visibility = on ? 'hidden' : 'visible';
  }

  // 押さえている間は hold（へこみ）に向かって、はなすと 0 に向かって、ばねが動く
  function stepRegion(r, h) {
    r.v += (-SPRING * (r.x - r.hold) - DAMP * r.v) * h;
    r.x += r.v * h;
    if (!r.dragging) {
      r.pvx += (-SPRING * r.px - DAMP * r.pvx) * h;
      r.pvy += (-SPRING * (r.py - r.holdY) - DAMP * r.pvy) * h;
      r.px += r.pvx * h;
      r.py += r.pvy * h;
    }
  }

  const isStill = (r) => !r.hold && !r.holdY && !r.dragging &&
    Math.abs(r.x) < 0.001 && Math.abs(r.v) < 0.02 &&
    Math.abs(r.px) < 0.3 && Math.abs(r.py) < 0.3 && Math.abs(r.pvx) < 3 && Math.abs(r.pvy) < 3;
  const zero = (r) => { r.x = r.v = r.px = r.py = r.pvx = r.pvy = 0; r.hold = r.holdY = 0; r.dragging = false; };

  function loop(t) {
    let dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    // 細かく分けて計算すると、ばねが安定する
    while (dt > 0) {
      const h = Math.min(dt, 1 / 240);
      regions.forEach((r) => stepRegion(r, h));
      poke.v += (-SPRING * (poke.x - poke.hold) - DAMP * poke.v) * h;
      poke.x += poke.v * h;
      dt -= h;
    }
    if (regions.every(isStill) && isStill(poke)) {
      regions.forEach(zero);
      zero(poke);
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
    return usable && !!W;
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
    has: (part) => !!parts[part],
    // 引っぱれる場所か（胸は config.js の chestJiggle.drag で切りかえ）
    canDrag: (part) => !!(parts[part] && parts[part].canDrag),

    // 指を置いた：その場所がへこむ（imgX, imgY は画像のピクセル位置。指の位置もくぼむ）
    press: function (part, imgX, imgY) {
      const r = parts[part];
      if (!r || !W) return;
      r.hold = -(BJ.pressDent || 0.05) * k * r.gain;
      // 胸：押さえている間は少し下に沈む
      if (r.bob) r.holdY = r.bob / 100 * H * k * 0.5;
      if (PK.depth > 0 && imgX != null) {
        // 指の位置を、楕円の内側におさめる
        const u = (imgX - r.cx) / r.rx, v = (imgY - r.cy) / r.ry;
        const d = Math.hypot(u, v), m = d > 0.75 ? 0.75 / d : 1;
        poke.cx = r.cx + u * m * r.rx; poke.cy = r.cy + v * m * r.ry;
        poke.rx = r.rx * PK.size; poke.ry = r.ry * PK.size;
        poke.hold = -PK.depth * k * Math.sqrt(r.gain);
      }
      start();
    },

    // 指をはなした：tapped が true なら「ぷるん」（連打すると揺れが足し算される）
    release: function (part, tapped) {
      const r = parts[part];
      if (!r) return;
      const target = (BJ.pressDent || 0.05) * k * r.gain;
      r.hold = 0;
      r.holdY = 0;
      r.dragging = false;
      poke.hold = 0;
      // 胸：下にぷるんと沈んでから、上下に揺れて戻る（沈む深さが bob になる勢いをつける）
      if (tapped && r.bob) r.pvy += r.bob / 100 * H * k / peak;
      if (tapped) {
        if (r.x < -target * 0.5) {
          // しっかり押していた：へこみから「ぷるん」と強めに戻す
          r.v += TAP_V * r.gain * (BJ.reboundBoost == null ? 0.5 : BJ.reboundBoost);
        } else {
          // ちょんと触っただけ：Windows版と同じく、まずへこんでから戻る
          r.v -= TAP_V * r.gain;
        }
      }
      start();
    },

    // 引っぱる（dx, dy は画面上の移動量。scale は画面→画像の倍率）
    drag: function (part, dx, dy, scale) {
      const r = parts[part];
      if (!r || !W || !r.canDrag) return;
      r.dragging = true;
      r.hold = 0;
      poke.hold = 0;
      const max = (BJ.pullMax || 8.6) / 100 * W * k * r.gain;
      let px = dx * scale, py = dy * scale;
      const len = Math.hypot(px, py);
      if (len > max) { px *= max / len; py *= max / len; }
      r.px = px; r.py = py; r.pvx = r.pvy = 0;
      start();
    },

    // 付けている部品が変わったとき：古い組み合わせの色データを捨てる
    refresh: function () { cache = {}; },

    // ふくらむ：amount（0.1 で1割）まで「むくっ」とふくらんで、ms ミリ秒後に戻る
    swell: function (part, amount, ms) {
      const r = parts[part];
      if (!r || !ready()) return;
      r.hold = amount;
      clearTimeout(r.swellTimer);
      r.swellTimer = setTimeout(() => { r.hold = 0; start(); }, ms);
      start();
    },

    // しっぽを「ビクン」：angle 度だけ、はねるように動いて、ばねで戻る（正の数で、先が上に）
    twitch: function (part, angle) {
      const r = parts[part];
      if (!r || !ready()) return;
      r.v -= angle * Math.PI / 180 / peak;
      start();
    },

    // 上下に「ぷるん」：px ピクセルだけ下に沈んでから、ばねで揺れて戻る（extra の type: 'bob'）
    kick: function (part, px) {
      const r = parts[part];
      if (!r || !ready()) return;
      r.pvy += px / peak;
      start();
    },

    // ふくらんでいる最中か
    swelling: (part) => !!(parts[part] && parts[part].hold > 0),

    // ふくらんでいる所を指で「ぷるん」：size だけへこんで、ばねで揺れて戻る
    bounce: function (part, size) {
      const r = parts[part];
      if (!r || !ready()) return;
      r.v -= size / peak;
      start();
    },

    stop: function () {
      regions.forEach(zero);
      zero(poke);
    }
  };
};
