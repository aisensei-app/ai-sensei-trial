/* =========================================================
   ぽよんラリー（試作。2026-10-30）
   ・手前のビーチボールを、指で上へはじいて投げる（ポケモンGO のように）
   ・タヌくんがおなかで「ぽよん！」とはね返す（おなかの揺れは本編と同じ belly.js）
   ・もどってきたボールが手前に来たときにタップすると、打ち返せる。何回続くか（ラリー）を数える
   ・続くほどボールが速くなり、もどってくる場所も左右に広がる
   ・最初のひと投げがおなかに当たらなかったときは、もう一度投げられる（ゲームオーバーにしない）
   ・きせかえ（デベソなど）は本編の記録をそのまま使う
   ・音はすべてプログラムで作る（Web Audio）
   ・公開スイッチ（config.js の features.rally）が 'open' でないときは、本編へもどす
   ========================================================= */
(function () {
  'use strict';

  // X アプリの中で開いたとき：画面の下に X の投稿パネルがかぶさるので、全体を上に寄せる（?inx でも）
  const IN_X = /Twitter/i.test(navigator.userAgent) || /[?&]inx\b/.test(location.search);
  if (IN_X) document.body.classList.add('in-x');

  const C = window.TANU_CONFIG;
  if (C.features && C.features.rally && C.features.rally !== 'open') { location.replace('../'); return; }
  const $ = (id) => document.getElementById(id);
  // 本編の設定の絵は 'images/…' なので、このページ（rally/）からは '../' を付ける
  const IMG = (name) => {
    const src = C.images[name] || name;
    return (/^data:/.test(src) ? '' : '../') + src;
  };

  /* ---------- 調整する数字 ----------
     feet, height … タヌくんの足もとの高さ・絵の高さ（画面の高さに対する割合）。X アプリの中では上に寄せる
     near         … 手前のボールの高さ（画面の高さに対する割合）
     ballSize     … 手前のボールの大きさ（画面の横幅に対する割合。最大 maxBall ピクセル）
     far          … いちばん奥（タヌくんのおなか）でのボールの大きさ（手前を 1 として）
     flick        … これ以上（ピクセル）上へはじいたら投げたことにする
     returnTime   … もどってくるのにかかる秒数（最初 → ラリーごとに speedUp ずつ短く → 最短 minTime）
     window       … 打ち返せるのは、もどってくる途中のこの割合から（0.55 なら半分すぎから）
     nice         … 手前に着く瞬間から、この割合以内でタップしたら「ナイス！」
     late         … 手前に着いてから、この割合まで待ってくれる（それを過ぎたら落ちてミス）
     hitR         … ボールか、落ちてくる場所の「輪」の中心から、このピクセル以内のタップを当たりにする
     ring         … 落ちてくる場所の輪の、最初の大きさ（ボールの何倍）。縮んでいって、ボールが着く瞬間にボールと同じ大きさ（＝タップの合図） */
  const T = {
    feet: IN_X ? 0.57 : 0.68, height: IN_X ? 0.38 : 0.46,
    near: IN_X ? 0.68 : 0.86,
    ballSize: 0.2, maxBall: 88, far: 0.36,
    flick: 40,
    returnTime: 1.6, speedUp: 0.035, minTime: 0.8,
    window: 0.55, nice: 0.1, late: 0.22,
    hitR: 90, ring: 2.8
  };
  const BJ = C.bellyJiggle;
  // おなかの揺れ：本編より「ぽよん」を強めに（ぽんぽこリズムと同じくらい）
  const JIGGLE = Object.assign({}, BJ, {
    tapDent: 0.16, damp: 6, reboundBoost: 0.9,
    poke: Object.assign({}, BJ.poke, { depth: 0.5 })
  });
  // ラリーの回数で変わる、タヌくんのひとこと（at 回目に1回だけ）
  const SAY = [
    { at: 3, text: 'いいね〜！' },
    { at: 5, text: 'おなかで、ぽよん♪' },
    { at: 10, text: 'まだまだ〜！' },
    { at: 15, text: 'すごい、つづくね！' },
    { at: 20, text: 'おなか、あつくなってきた〜' },
    { at: 30, text: 'でんせつのラリーだ…！' }
  ];
  // 結果のランク（いちばん下から順に、min 回以上）
  const RANKS = [
    { min: 0, title: 'れんしゅう中', line: 'もう一回やろ〜！' },
    { min: 3, title: 'なかなか！', line: 'おなかで返すの、たのしいね♪' },
    { min: 10, title: 'ぽよんマスター', line: 'ぼくたち、いいコンビだね！' },
    { min: 20, title: '伝説のおなか', line: 'こんなに続いたの、はじめて！' }
  ];

  /* ---------- 本編と同じ記録（きせかえ・さいこう記録） ---------- */
  const SAVE_KEY = 'tanukun-save-v1';
  function loadSave() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; }
  }
  function updateSave(change) {
    try {
      const data = loadSave();
      change(data);
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) { /* 保存できない環境では、その回だけ */ }
  }
  const PARTS = C.parts || {};
  const wear = loadSave().wear || {};
  const hearts = () => C.friendship.heartAt.filter((pt) => (loadSave().points || 0) >= pt).length;
  const partImgs = {};
  function wornLayers() {
    const out = [];
    Object.keys(PARTS).forEach((slot) => {
      const it = PARTS[slot].items.filter((x) => x.id === wear[slot])[0];
      if (!it || hearts() < (it.hearts || 0)) return;
      if (!partImgs[it.id]) { partImgs[it.id] = new Image(); partImgs[it.id].src = IMG(it.image); }
      out.push({ img: partImgs[it.id], x: it.x, y: it.y, width: it.width });
    });
    return out;
  }
  const partsLayer = $('parts-layer');
  function renderParts() {
    partsLayer.textContent = '';
    wornLayers().forEach((l) => {
      const el = document.createElement('img');
      el.src = l.img.src;
      el.alt = '';
      el.draggable = false;
      if (l.width != null) Object.assign(el.style, { left: l.x + '%', top: l.y + '%', width: l.width + '%' });
      else el.className = 'full';
      partsLayer.appendChild(el);
    });
  }

  /* ---------- 画面の組み立て ---------- */
  const root = $('rally'), body = $('body'), img = $('tanu-img'), ballEl = $('ball'), shadowEl = $('shadow');
  const targetEl = $('target'), groundEl = $('ground');
  root.style.backgroundImage = 'url("' + IMG('images/bg/beach_day.webp') + '")';
  img.src = IMG('normal');
  const belly = window.TanuBelly({ config: JIGGLE, img: img, canvas: $('belly-canvas'),
    overlay: partsLayer, layers: () => wornLayers() });
  renderParts();
  img.addEventListener('load', () => belly.warm([img.src]), { once: true });

  // 画面の大きさから、タヌくん・おなか・手前のボールの位置を決める
  const G = {};
  function layout() {
    const W = root.clientWidth, H = root.clientHeight;
    const h = H * T.height, w = h * 0.8;                 // 絵は 720×900（4:5）
    const left = W / 2 - w / 2, top = H * T.feet - h * 0.96;   // 足もとは絵の下から4%
    Object.assign(body.style, { left: left + 'px', top: top + 'px', width: w + 'px', height: h + 'px' });
    // タヌくんの足もとの影（本編の .ground と同じ大きさ・位置）
    Object.assign(groundEl.style, { left: left + w * 0.12 + 'px', top: top + h * 0.92 + 'px', width: w * 0.76 + 'px', height: h * 0.09 + 'px' });
    Object.assign(G, {
      W: W, H: H, left: left, top: top, w: w, h: h,
      bx: left + w * BJ.x / 100, by: top + h * BJ.y / 100,      // おなかの中心
      brx: w * BJ.rx / 100, bry: h * BJ.ry / 100,                // おなかの半径
      feetY: H * T.feet,
      nearY: H * T.near,
      size: Math.min(T.maxBall, W * T.ballSize)
    });
    $('hint').style.top = (G.nearY + G.size * 0.75) + 'px';
    if (state === 'ready') placeReady();
  }

  /* ---------- 音（Web Audio でその場で作る） ---------- */
  let ac = null;
  function audio() {
    if (ac) return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    ac = new AC({ latencyHint: 'interactive' });
    return ac;
  }
  function tone(type, f0, f1, dur, vol, f2) {
    const a = audio();
    if (!a) return;
    if (a.state === 'suspended') a.resume();
    const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f2) {
      o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.35);
      o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    } else {
      o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  const sound = {
    throw: () => tone('triangle', 300, 700, 0.18, 0.25),
    poyon: () => tone('sine', 150, 90, 0.45, 0.8, 260),     // おなかで「ぼよ〜ん」
    hit: () => tone('triangle', 520, 260, 0.14, 0.5),       // 手で「ぽんっ」
    nice: () => { tone('triangle', 660, 330, 0.14, 0.5); setTimeout(() => tone('sine', 990, 1320, 0.12, 0.25), 60); },
    miss: () => tone('sine', 400, 120, 0.5, 0.35)
  };

  /* ---------- ボールの動き ----------
     z … 0 が手前、1 がタヌくんのおなか。大きさは z で手前 1 → 奥 T.far に小さくなる
     flight … いま飛んでいる道すじ { from, to, start, dur, arc, kind }（kind：throw / back / return / fall）
     ※ 速さはいつも同じ割合（遠近の厳密な計算はしない）。山なりは sin で */
  let state = 'title';   // title / ready（投げる前）/ fly（飛んでいる）/ over
  let flight = null, raf = 0;
  let rally = 0, best = loadSave().rallyBest || 0, firstHit = false, said = {};
  const ball = { x: 0, y: 0, z: 0 };
  const lerp = (a, b, u) => a + (b - a) * u;
  const scaleAt = (z) => lerp(1, T.far, z);

  function draw() {
    const s = scaleAt(ball.z), d = G.size * s;
    ballEl.style.width = ballEl.style.height = d + 'px';
    ballEl.style.transform = 'translate(' + (ball.x - d / 2) + 'px,' + (ball.y - d / 2) + 'px)';
    // 影：ボールの真下の地面（手前は手前の地面、奥はタヌくんの足もと）
    const gy = lerp(G.nearY + G.size * 0.55, G.feetY, Math.min(1, ball.z));
    const sw = d * 0.9, sh = sw * 0.28;
    shadowEl.style.width = sw + 'px';
    shadowEl.style.height = sh + 'px';
    shadowEl.style.transform = 'translate(' + (ball.x - sw / 2) + 'px,' + (gy - sh / 2) + 'px)';
    shadowEl.style.opacity = Math.max(0.15, 1 - (gy - ball.y) / (G.H * 0.5));
  }
  function placeReady() {
    ball.x = G.W / 2; ball.y = G.nearY; ball.z = 0;
    draw();
  }
  function fly(kind, to, dur, arc) {
    flight = { kind: kind, from: { x: ball.x, y: ball.y, z: ball.z }, to: to, start: performance.now(), dur: dur * 1000, arc: arc };
    state = 'fly';
    ballEl.classList.remove('ready');
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(step);
  }
  // 道すじの u（0〜1。1 より先も少しだけ伸ばせる）での位置
  function at(f, u) {
    return {
      x: lerp(f.from.x, f.to.x, u),
      y: lerp(f.from.y, f.to.y, u) - f.arc * Math.sin(Math.PI * Math.min(1, Math.max(0, u))),
      z: lerp(f.from.z, f.to.z, u)
    };
  }
  function step(now) {
    if (!flight) return;
    const f = flight, u = (now - f.start) / f.dur;
    Object.assign(ball, at(f, u));
    draw();
    if (f.kind === 'return') drawTarget(u);
    if (f.kind === 'return' && u > 1 + T.late) { missed(); return; }
    if (f.kind !== 'return' && u >= 1) { arrive(f); return; }
    raf = requestAnimationFrame(step);
  }

  /* ---------- 投げる（手前のボールを上へはじく） ---------- */
  let swipe = null;
  root.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.sheet, .back')) return;
    audio();
    if (state === 'ready') {
      swipe = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
      return;
    }
    if (state === 'fly' && flight && flight.kind === 'return') tryReturn(e.clientX, e.clientY);
  });
  root.addEventListener('pointerup', (e) => {
    if (!swipe || e.pointerId !== swipe.id) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    const dt = Math.max(60, performance.now() - swipe.t);
    swipe = null;
    if (state !== 'ready' || dy > -T.flick) return;
    // 指の向きでねらう（横にずれた分だけ、おなかの横へ）。速くはじくほど速く飛ぶ
    const aimX = G.bx + dx * 1.3;   // まっすぐ上なら、おなかのまんなか
    const speed = Math.min(1, -dy / dt);   // ピクセル/ミリ秒
    const aimY = G.by - G.bry * 0.15;
    sound.throw();
    $('hint').hidden = true;
    fly('throw', { x: aimX, y: aimY, z: 1 }, lerp(0.95, 0.6, speed), G.H * 0.12);
  });
  root.addEventListener('pointercancel', () => { swipe = null; });

  // おなかの中か（画面の位置）。1 より小さければ中
  const inBelly = (x, y) => Math.hypot((x - G.bx) / G.brx, (y - G.by) / G.bry);

  /* ---------- 奥に着いた：おなかに当たれば「ぽよん！」でもどってくる ---------- */
  function arrive(f) {
    if (f.kind === 'fall') { flight = null; return; }
    const d = inBelly(ball.x, ball.y);
    if (d <= 1.05) {
      poyon(ball.x, ball.y);
      if (f.kind === 'back') {
        rally++;
        $('count').textContent = rally;
        const cnt = $('count').parentNode;
        cnt.classList.remove('bump'); void cnt.offsetWidth; cnt.classList.add('bump');
        const s = SAY.filter((x) => x.at === rally)[0];
        if (s && !said[s.at]) { said[s.at] = true; say(s.text); }
      } else if (!firstHit) {
        firstHit = true;
      }
      setTimeout(sendBack, 140);
      return;
    }
    // おなかに当たらなかった（最初のひと投げだけ）：もう一度投げられる
    pop(ball.x, ball.y - 20, d < 2.2 ? 'おしい！' : 'あれれ？', 'miss');
    say(d < 2.2 ? 'おなかに、なげてね〜' : 'こっちだよ〜');
    fly('fall', { x: ball.x + (ball.x - G.bx) * 0.3, y: G.feetY, z: 1 }, 0.45, -G.H * 0.02);
    setTimeout(resetBall, 1200);
  }
  // おなかで「ぽよん！」：当たった場所がへこんで、ぷるんと戻る
  function poyon(x, y) {
    sound.poyon();
    pop(x, y - 10, 'ぽよん！');
    body.classList.remove('poyon'); void body.offsetWidth; body.classList.add('poyon');
    if (belly.ready()) {
      const k = 720 / G.w;   // 画面 → 絵（720×900）の倍率
      belly.press('belly', (x - G.left) * k, (y - G.top) * k);
      setTimeout(() => belly.release('belly', true), 90);
    }
  }
  // タヌくんが打ち返す：手前のどこかへ、山なりで。落ちてくる場所に「輪」を出す
  function sendBack() {
    const spread = Math.min(0.3, 0.1 + rally * 0.015);   // 続くほど左右に広がる
    const tx = G.W * (0.5 + (Math.random() * 2 - 1) * spread);
    const dur = Math.max(T.minTime, T.returnTime - rally * T.speedUp);
    targetEl.style.left = tx + 'px';
    targetEl.style.top = G.nearY + 'px';
    targetEl.style.width = targetEl.style.height = G.size + 'px';
    targetEl.className = 'target';
    targetEl.hidden = false;
    fly('return', { x: tx, y: G.nearY, z: 0 }, dur, G.H * (0.22 + Math.random() * 0.08));
  }
  // 輪：はじめは大きく、ボールが着く瞬間（u = 1）にボールと同じ大きさまで縮む。打ち返せる間は光る
  function drawTarget(u) {
    const k = lerp(T.ring, 1.12, Math.min(1, Math.max(0, u)));   // 着く瞬間に、ボールのすぐ外がわ
    targetEl.firstChild.style.transform = 'scale(' + k + ')';
    targetEl.classList.toggle('now', u >= T.window);
  }
  const hideTarget = () => { targetEl.hidden = true; };

  /* ---------- もどってきたボールをタップして打ち返す ---------- */
  function tryReturn(px, py) {
    const f = flight, u = (performance.now() - f.start) / f.dur;
    if (u < T.window) return;
    const d = G.size * scaleAt(ball.z), R = Math.max(T.hitR, d * 0.9);
    const to = flight.to;
    if (Math.hypot(px - ball.x, py - ball.y) > R && Math.hypot(px - to.x, py - to.y) > R) return;
    hideTarget();
    const nice = Math.abs(u - 1) <= T.nice;
    if (nice) sound.nice(); else sound.hit();
    pop(ball.x, ball.y - d * 0.6, nice ? 'ナイス！' : 'セーフ', nice ? 'nice' : 'safe');
    // おなかのどこかへ（ナイスなら、おなかのまんなか近く）
    const r = nice ? 0.25 : 0.6, a = Math.random() * Math.PI * 2;
    const aim = { x: G.bx + Math.cos(a) * G.brx * r, y: G.by + Math.sin(a) * G.bry * r, z: 1 };
    const dur = Math.max(T.minTime, T.returnTime - rally * T.speedUp) * 0.8;
    fly('back', aim, dur, G.H * 0.1);
  }

  // 打ち返せなかった：ボールが手前に落ちて、結果へ
  function missed() {
    flight = null;
    state = 'over';
    sound.miss();
    shadowEl.style.visibility = 'hidden';
    hideTarget();
    pop(ball.x, ball.y - 30, 'あっ！', 'miss');
    ballEl.animate([
      { transform: ballEl.style.transform },
      { transform: 'translate(' + (ball.x - G.size / 2) + 'px,' + (G.H + G.size) + 'px)' }
    ], { duration: 500, easing: 'ease-in', fill: 'forwards' });
    say(rally >= 10 ? 'あ〜、おしかった！' : 'あ〜、おとしちゃった');
    setTimeout(showResult, 1100);
  }

  /* ---------- 文字・ひとこと ---------- */
  function pop(x, y, text, cls) {
    const el = document.createElement('span');
    el.className = 'pop' + (cls ? ' ' + cls : '');
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    $('pops').appendChild(el);
    setTimeout(() => el.remove(), 800);
  }
  let sayTimer = 0;
  function say(text) {
    const el = $('say');
    el.textContent = text;
    el.style.left = (G.left + G.w * 0.42) + 'px';
    el.style.top = (G.top + G.h * 0.02) + 'px';
    el.hidden = false;
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => { el.hidden = true; }, 1800);
  }

  /* ---------- はじめる・結果 ---------- */
  function resetBall() {
    flight = null;
    state = 'ready';
    ballEl.getAnimations().forEach((a) => a.cancel());
    ballEl.classList.add('ready');
    shadowEl.style.visibility = '';
    hideTarget();
    placeReady();
    $('hint').textContent = '👆 ボールを 上へ はじいて なげてね';
    $('hint').hidden = false;
  }
  function start() {
    $('start').hidden = true;
    $('result').hidden = true;
    rally = 0; firstHit = false; said = {};
    $('count').textContent = '0';
    resetBall();
  }
  function showResult() {
    const isBest = rally > best;
    if (isBest) {
      best = rally;
      updateSave((d) => { d.rallyBest = best; });
      $('best').textContent = best;
    }
    const rank = RANKS.filter((r) => rally >= r.min).pop();
    $('r-title').textContent = rank.title;
    $('r-count').textContent = rally;
    $('r-best').textContent = isBest && rally > 0 ? '🎉 さいこう記録！' : 'さいこう記録 ' + best + ' ラリー';
    $('r-line').textContent = 'タヌくん「' + rank.line + '」';
    const url = /^https?:/.test(location.href) ? location.href.split(/[?#]/)[0] : 'https://tanukun.pages.dev/rally/';
    const text = '🏐 ぽよんラリー\n' + rally + 'ラリー「' + rank.title + '」\n#タヌくん #ぽよんラリー\n' + url;
    $('btn-post').href = 'https://x.com/intent/post?text=' + encodeURIComponent(text);
    $('result').hidden = false;
  }
  $('btn-start').addEventListener('click', () => { audio(); start(); });
  $('btn-again').addEventListener('click', start);
  $('best').textContent = best;

  window.addEventListener('resize', layout);
  layout();
  placeReady();
  ballEl.classList.add('ready');
})();
