/* =========================================================
   ぽよんラリー（試作。2026-10-30）
   ・手前のビーチボールを、指で上へはじいて（スワイプして）投げる（ポケモンGO のように）
   ・タヌくんがおなかで「ぽよん！」とはね返す（おなかの揺れは本編と同じ belly.js）
   ・もどってくる場所の砂の上に「輪」が出る。輪が縮んでボールに重なったら、上へスワイプして打ち返す
   ・ボールは3こ。落とすと1こ減って、手前から投げなおし。3こ落としたら結果（合計ラリー数と、いちばん続いた数）
   ・3ラリー続くごとに、タヌくんが1歩近づいてきて、ボールも速くなる（落とすと、元の場所にもどる）
   ・近づいてくると、ときどき「じゃま」が入る：カモメが横切る／タヌくんが「せーの…」とためてから返す（フェイント）
   ・はじめて遊ぶ人には、指のガイド（👆 が上へすべる見本）を出す。はじめての打ち返しは、ボールが輪の上で止まって待ってくれる
   ・最初のひと投げがおなかに当たらなかったときは、もう一度投げられる（ボールは減らない）
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
     step         … 1歩近づくごとに、絵が大きくなる割合（height に）と、足もとが下がる量（feet に）。maxStep 歩まで
     stepEvery    … この回数ラリーが続くごとに、1歩近づく
     near         … 手前のボールの高さ（画面の高さに対する割合）
     ballSize     … 手前のボールの大きさ（画面の横幅に対する割合。最大 maxBall ピクセル）
     far          … いちばん奥（タヌくんのおなか）でのボールの大きさ（手前を 1 として。近づくと大きくなる）
     flick        … 指をこれだけ（ピクセル）上へすべらせたら、投げた／打ち返したことにする
     returnTime   … もどってくるのにかかる秒数（最初 → ラリーごとに speedUp、1歩ごとに stepSpeed 短く → 最短 minTime）
     window       … 打ち返せるのは、もどってくる途中のこの割合から（0.55 なら半分すぎから）
     nice         … 手前に着く瞬間から、この割合以内で打ち返したら「ナイス！」
     late         … 手前に着いてから、この割合まで待ってくれる（それを過ぎたら落ちてミス）
     ring         … 落ちてくる場所の輪の、最初の大きさ（ボールの何倍）。縮んでいって、ボールが着く瞬間にボールのすぐ外がわ
     balls        … ボールの数（落とせる回数）
     gull, feint  … じゃまが入る割合（1歩以上近づいてから）。feint は「せーの…」でためる秒数 [最短, 最長] も */
  const T = {
    feet: IN_X ? 0.57 : 0.68, height: IN_X ? 0.38 : 0.46,
    step: { grow: 0.11, down: IN_X ? 0.025 : 0.035 }, maxStep: 4, stepEvery: 3,
    near: IN_X ? 0.68 : 0.86,
    ballSize: 0.2, maxBall: 88, far: 0.36,
    flick: 36,
    returnTime: 1.6, speedUp: 0.02, stepSpeed: 0.12, minTime: 0.72,
    window: 0.55, nice: 0.1, late: 0.22,
    ring: 2.8,
    balls: 3,
    gull: 0.35, feint: { rate: 0.3, seconds: [0.45, 0.9] }
  };
  const BJ = C.bellyJiggle;
  // おなかの揺れ：本編より「ぽよん」を強めに（ぽんぽこリズムと同じくらい）
  const JIGGLE = Object.assign({}, BJ, {
    tapDent: 0.16, damp: 6, reboundBoost: 0.9,
    poke: Object.assign({}, BJ.poke, { depth: 0.5 })
  });
  // 続いたラリーの回数で変わる、タヌくんのひとこと（at 回目に1回だけ。近づくときは別に「ちかづくよ〜！」）
  const SAY = [
    { at: 5, text: 'おなかで、ぽよん♪' },
    { at: 10, text: 'まだまだ〜！' },
    { at: 15, text: 'すごい、つづくね！' },
    { at: 20, text: 'おなか、あつくなってきた〜' },
    { at: 30, text: 'でんせつのラリーだ…！' }
  ];
  // 結果のランク（合計ラリー数。いちばん下から順に、min 回以上）
  const RANKS = [
    { min: 0, title: 'れんしゅう中', line: 'もう一回やろ〜！' },
    { min: 5, title: 'なかなか！', line: 'おなかで返すの、たのしいね♪' },
    { min: 15, title: 'ぽよんマスター', line: 'ぼくたち、いいコンビだね！' },
    { min: 30, title: '伝説のおなか', line: 'こんなに続いたの、はじめて！' }
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
  const targetEl = $('target'), groundEl = $('ground'), guideEl = $('guide');
  root.style.backgroundImage = 'url("' + IMG('images/bg/beach_day.webp') + '")';
  img.src = IMG('normal');
  const FEINT_POSE = C.images.ponpoko1 ? IMG('ponpoko1') : null;   // 「せーの…」でためるときのポーズ
  const belly = window.TanuBelly({ config: JIGGLE, img: img, canvas: $('belly-canvas'),
    overlay: partsLayer, layers: () => wornLayers() });
  renderParts();
  img.addEventListener('load', () => belly.warm([img.src]), { once: true });

  // 画面の大きさと、タヌくんが何歩近づいたか（stepNow）から、タヌくん・おなか・手前のボールの位置を決める
  const G = {};
  let stepNow = 0;
  function layout() {
    const W = root.clientWidth, H = root.clientHeight;
    const feet = T.feet + T.step.down * stepNow;
    const h = H * T.height * (1 + T.step.grow * stepNow), w = h * 0.8;   // 絵は 720×900（4:5）
    const left = W / 2 - w / 2, top = H * feet - h * 0.96;               // 足もとは絵の下から4%
    Object.assign(body.style, { left: left + 'px', top: top + 'px', width: w + 'px', height: h + 'px' });
    // タヌくんの足もとの影（本編の .ground と同じ大きさ・位置）
    Object.assign(groundEl.style, { left: left + w * 0.12 + 'px', top: top + h * 0.92 + 'px', width: w * 0.76 + 'px', height: h * 0.09 + 'px' });
    Object.assign(G, {
      W: W, H: H, left: left, top: top, w: w, h: h,
      bx: left + w * BJ.x / 100, by: top + h * BJ.y / 100,      // おなかの中心
      brx: w * BJ.rx / 100, bry: h * BJ.ry / 100,                // おなかの半径
      feetY: H * feet,
      nearY: H * T.near,
      size: Math.min(T.maxBall, W * T.ballSize),
      far: T.far * (1 + T.step.grow * stepNow)                    // 近づくと、奥のボールも大きく
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
     z … 0 が手前、1 がタヌくんのおなか。大きさは z で手前 1 → 奥 G.far に小さくなる
     flight … いま飛んでいる道すじ { from, to, start, dur, arc, kind }（kind：throw / back / return / fall）
     ※ 速さはいつも同じ割合（遠近の厳密な計算はしない）。山なりは sin で */
  let state = 'title';   // title / ready（投げる前）/ fly（飛んでいる）/ wait（フェイント・落としたあと）/ over
  let flight = null, raf = 0;
  let total = 0, streak = 0, longest = 0, lives = T.balls, said = {};
  let best = loadSave().rallyBest || 0;
  // はじめて遊ぶ人へのガイド（本編の記録に、済んだかを残す）
  let guideThrow = !loadSave().rallyGuideThrow, guideReturn = !loadSave().rallyGuideReturn;
  const ball = { x: 0, y: 0, z: 0 };
  const lerp = (a, b, u) => a + (b - a) * u;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const scaleAt = (z) => lerp(1, G.far, z);

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
      y: lerp(f.from.y, f.to.y, u) - f.arc * Math.sin(Math.PI * clamp(u, 0, 1)),
      z: lerp(f.from.z, f.to.z, u)
    };
  }
  // いまの u。はじめての打ち返しのガイド中は、輪の少し上（hold）で止めて待つ
  function progress(f, now) {
    if (f.hold != null) return f.hold;
    const u = (now - f.start) / f.dur;
    if (f.tutorial && u >= 0.93) {
      f.hold = 0.93;
      showGuide(f.to.x, G.nearY - G.size * 0.2, '上へ スワイプして 打ち返そう！');
      return f.hold;
    }
    return u;
  }
  function step(now) {
    if (!flight) return;
    const f = flight, u = progress(f, now);
    Object.assign(ball, at(f, u));
    draw();
    if (f.kind === 'return') drawTarget(u);
    if (f.kind === 'return' && u > 1 + T.late) { missed(); return; }
    if (f.kind !== 'return' && u >= 1) { arrive(f); return; }
    raf = requestAnimationFrame(step);
  }

  /* ---------- 指の動き：上へスワイプで、投げる／打ち返す ----------
     マウスでも同じ（ドラッグ）。指が画面の外に出ても追えるように、動き・はなすは window で受ける */
  let swipe = null;
  root.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.sheet, .back')) return;
    e.preventDefault();
    audio();
    swipe = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
  });
  window.addEventListener('pointermove', (e) => {
    if (!swipe || e.pointerId !== swipe.id) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    if (dy > -T.flick) return;
    const dt = Math.max(30, performance.now() - swipe.t);
    swipe = null;   // 1回のスワイプで1回だけ
    onSwipe(dx, dy, dt);
  });
  const endSwipe = (e) => { if (swipe && e.pointerId === swipe.id) swipe = null; };
  window.addEventListener('pointerup', endSwipe);
  window.addEventListener('pointercancel', endSwipe);

  function onSwipe(dx, dy, dt) {
    if (state === 'ready') { throwBall(dx, dy, dt); return; }
    if (state === 'fly' && flight && flight.kind === 'return') hitBack(dx);
  }

  // 投げる：指の向きでねらう（まっすぐ上なら、おなかのまんなか）。速くはじくほど速く飛ぶ
  function throwBall(dx, dy, dt) {
    const speed = clamp(-dy / dt, 0, 1);   // ピクセル/ミリ秒
    sound.throw();
    $('hint').hidden = true;
    hideGuide();
    if (guideThrow) { guideThrow = false; updateSave((d) => { d.rallyGuideThrow = true; }); }
    fly('throw', { x: G.bx + dx * 1.3, y: G.by - G.bry * 0.15, z: 1 }, lerp(0.95, 0.6, speed), G.H * 0.12);
  }

  // おなかの中か（画面の位置）。1 より小さければ中
  const inBelly = (x, y) => Math.hypot((x - G.bx) / G.brx, (y - G.by) / G.bry);

  /* ---------- 奥に着いた：おなかに当たれば「ぽよん！」でもどってくる ---------- */
  function arrive(f) {
    if (f.kind === 'fall') { flight = null; return; }
    const d = inBelly(ball.x, ball.y);
    if (d <= 1.05) {
      poyon(ball.x, ball.y);
      if (f.kind === 'back') countRally();
      // 3ラリーごとに1歩近づく（近づく間は、少し待ってから返す）
      const next = Math.min(T.maxStep, Math.floor(streak / T.stepEvery));
      if (next > stepNow) { approach(next); setTimeout(sendBack, 750); return; }
      setTimeout(sendBack, 140);
      return;
    }
    // おなかに当たらなかった（最初のひと投げだけ）：もう一度投げられる（ボールは減らない）
    pop(ball.x, ball.y - 20, d < 2.2 ? 'おしい！' : 'あれれ？', 'miss');
    say(d < 2.2 ? 'おなかに、なげてね〜' : 'こっちだよ〜');
    fly('fall', { x: ball.x + (ball.x - G.bx) * 0.3, y: G.feetY, z: 1 }, 0.45, -G.H * 0.02);
    state = 'wait';
    setTimeout(resetBall, 1200);
  }
  function countRally() {
    total++; streak++;
    longest = Math.max(longest, streak);
    $('count').textContent = total;
    const cnt = $('count').parentNode;
    cnt.classList.remove('bump'); void cnt.offsetWidth; cnt.classList.add('bump');
    const s = SAY.filter((x) => x.at === streak)[0];
    if (s && !said[s.at]) { said[s.at] = true; say(s.text); }
  }
  // タヌくんが1歩近づく（絵が大きく、足もとが手前に）。#body・#ground の transition で、なめらかに
  function approach(n) {
    stepNow = n;
    root.classList.add('moving');
    layout();
    setTimeout(() => root.classList.remove('moving'), 700);
    say(n >= T.maxStep ? 'ここからが本番だよ！' : 'ちかづくよ〜！');
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
  // 1歩以上近づいたら、ときどき「せーの…」とためてから（フェイント）。カモメが横切ることも
  function sendBack() {
    if (state === 'over') return;
    if (stepNow >= 1 && Math.random() < T.feint.rate && !flight.feinted) { feint(); return; }
    const spread = Math.min(0.3, 0.1 + streak * 0.015);   // 続くほど左右に広がる
    const tx = G.W * (0.5 + (Math.random() * 2 - 1) * spread);
    const dur = Math.max(T.minTime, T.returnTime - streak * T.speedUp - stepNow * T.stepSpeed);
    targetEl.style.left = tx + 'px';
    targetEl.style.top = G.nearY + 'px';
    targetEl.style.width = targetEl.style.height = G.size + 'px';
    targetEl.className = 'target';
    targetEl.hidden = false;
    fly('return', { x: tx, y: G.nearY, z: 0 }, dur, G.H * (0.22 + Math.random() * 0.08));
    // はじめての打ち返しは、輪の上でボールが止まって待つ（ガイド）
    if (guideReturn) flight.tutorial = true;
    if (stepNow >= 1 && Math.random() < T.gull) seagull(dur);
  }
  // フェイント：おなかにボールをのせたまま「せーの…」（ポーズが変わって、ぷるぷる）→ 返す
  function feint() {
    state = 'wait';
    flight.feinted = true;
    const keep = flight;
    const sec = lerp(T.feint.seconds[0], T.feint.seconds[1], Math.random());
    pop(G.bx, G.top + G.h * 0.08, 'せーの…', 'safe');
    if (FEINT_POSE) img.src = FEINT_POSE;
    body.classList.add('feint');
    setTimeout(() => {
      body.classList.remove('feint');
      img.src = IMG('normal');
      if (state !== 'wait' || flight !== keep) return;
      sendBack();
    }, sec * 1000);
  }
  // カモメが横切る（ボールの道すじの前を、右から左へ。ただの見た目のじゃま）
  function seagull(dur) {
    const el = document.createElement('span');
    el.className = 'gull';
    el.textContent = '🕊️';
    el.style.top = G.H * lerp(0.42, 0.62, Math.random()) + 'px';
    $('pops').appendChild(el);
    const from = Math.random() < 0.5;
    el.animate([
      { transform: 'translateX(' + (from ? G.W + 40 : -60) + 'px) translateY(0) scaleX(' + (from ? 1 : -1) + ')' },
      { transform: 'translateX(' + G.W / 2 + 'px) translateY(-14px) scaleX(' + (from ? 1 : -1) + ')', offset: 0.5 },
      { transform: 'translateX(' + (from ? -60 : G.W + 40) + 'px) translateY(6px) scaleX(' + (from ? 1 : -1) + ')' }
    ], { duration: dur * 1000 * 1.4, easing: 'linear' }).finished.then(() => el.remove(), () => el.remove());
  }

  // 輪：はじめは大きく、ボールが着く瞬間（u = 1）にボールのすぐ外がわまで縮む。打ち返せる間は光る
  function drawTarget(u) {
    const k = lerp(T.ring, 1.12, clamp(u, 0, 1));
    targetEl.firstChild.style.transform = 'scale(' + k + ')';
    targetEl.classList.toggle('now', u >= T.window);
  }
  const hideTarget = () => { targetEl.hidden = true; };

  /* ---------- もどってきたボールを、上へスワイプして打ち返す ---------- */
  function hitBack(dx) {
    const f = flight, u = progress(f, performance.now());
    if (u < T.window) return;   // まだ遠い（光ってから）
    const nice = f.hold != null || Math.abs(u - 1) <= T.nice;
    if (nice) sound.nice(); else sound.hit();
    const d = G.size * scaleAt(ball.z);
    pop(ball.x, ball.y - d * 0.6, nice ? 'ナイス！' : 'セーフ', nice ? 'nice' : 'safe');
    hideTarget();
    if (f.tutorial) {
      hideGuide();
      guideReturn = false;
      updateSave((d2) => { d2.rallyGuideReturn = true; });
    }
    // おなかのどこかへ（ナイスなら、おなかのまんなか近く。指を斜めにすると、少しその向きへ）
    const r = nice ? 0.25 : 0.6, a = Math.random() * Math.PI * 2;
    const aim = {
      x: G.bx + clamp(Math.cos(a) * G.brx * r + dx * 0.4, -G.brx * 0.8, G.brx * 0.8),
      y: G.by + Math.sin(a) * G.bry * r, z: 1
    };
    const dur = Math.max(T.minTime, T.returnTime - streak * T.speedUp - stepNow * T.stepSpeed) * 0.8;
    fly('back', aim, dur, G.H * 0.1);
  }

  // 打ち返せなかった：ボールが手前に落ちる。ボールが残っていれば、タヌくんは元の場所にもどって、投げなおし
  function missed() {
    flight = null;
    state = 'wait';
    sound.miss();
    shadowEl.style.visibility = 'hidden';
    hideTarget();
    pop(ball.x, ball.y - 30, 'あっ！', 'miss');
    ballEl.animate([
      { transform: ballEl.style.transform },
      { transform: 'translate(' + (ball.x - G.size / 2) + 'px,' + (G.H + G.size) + 'px)' }
    ], { duration: 500, easing: 'ease-in', fill: 'forwards' });
    lives--;
    renderLives();
    streak = 0; said = {};
    if (lives <= 0) {
      state = 'over';
      say(total >= 15 ? 'あ〜、おしかった！' : 'あ〜、おとしちゃった');
      setTimeout(showResult, 1200);
      return;
    }
    say('ボール、あと ' + lives + 'こ！');
    setTimeout(() => {
      if (stepNow) { stepNow = 0; root.classList.add('moving'); layout(); setTimeout(() => root.classList.remove('moving'), 700); }
      resetBall();
    }, 1200);
  }
  function renderLives() {
    $('lives').innerHTML = '';
    for (let i = 0; i < T.balls; i++) {
      const el = document.createElement('i');
      if (i >= lives) el.className = 'lost';
      $('lives').appendChild(el);
    }
  }

  /* ---------- 文字・ひとこと・ガイド ---------- */
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
  // 指のガイド：👆 が (x, y) から上へすべる見本を、くり返し見せる
  function showGuide(x, y, text) {
    guideEl.style.left = x + 'px';
    guideEl.style.top = y + 'px';
    guideEl.lastChild.textContent = text;
    guideEl.hidden = false;
    root.classList.add('guiding');
  }
  const hideGuide = () => { guideEl.hidden = true; root.classList.remove('guiding'); };

  /* ---------- はじめる・結果 ---------- */
  function resetBall() {
    if (state === 'over') return;
    flight = null;
    state = 'ready';
    ballEl.getAnimations().forEach((a) => a.cancel());
    ballEl.classList.add('ready');
    shadowEl.style.visibility = '';
    hideTarget();
    placeReady();
    if (guideThrow) {
      $('hint').hidden = true;
      showGuide(ball.x, ball.y, 'ボールを 上へ スワイプして なげてね');
    } else {
      $('hint').textContent = '👆 上へ スワイプして なげてね';
      $('hint').hidden = false;
    }
  }
  function start() {
    $('start').hidden = true;
    $('result').hidden = true;
    total = 0; streak = 0; longest = 0; lives = T.balls; said = {};
    state = 'ready';
    if (stepNow) { stepNow = 0; layout(); }
    $('count').textContent = '0';
    renderLives();
    resetBall();
  }
  function showResult() {
    hideGuide();
    $('hint').hidden = true;
    const isBest = total > best;
    if (isBest) {
      best = total;
      updateSave((d) => { d.rallyBest = best; });
      $('best').textContent = best;
    }
    const rank = RANKS.filter((r) => total >= r.min).pop();
    $('r-title').textContent = rank.title;
    $('r-count').textContent = total;
    $('r-longest').textContent = 'いちばん続いたのは ' + longest + ' ラリー';
    $('r-best').textContent = isBest && total > 0 ? '🎉 さいこう記録！' : 'さいこう記録 ' + best + ' ラリー';
    $('r-line').textContent = 'タヌくん「' + rank.line + '」';
    const url = /^https?:/.test(location.href) ? location.href.split(/[?#]/)[0] : 'https://tanukun.pages.dev/rally/';
    const text = '🏐 ぽよんラリー\n合計' + total + 'ラリー「' + rank.title + '」（いちばん続いたのは' + longest + '）\n#タヌくん #ぽよんラリー\n' + url;
    $('btn-post').href = 'https://x.com/intent/post?text=' + encodeURIComponent(text);
    $('result').hidden = false;
  }
  $('btn-start').addEventListener('click', () => { audio(); start(); });
  $('btn-again').addEventListener('click', start);
  $('best').textContent = best;

  window.addEventListener('resize', layout);
  layout();
  renderLives();
  placeReady();
  ballEl.classList.add('ready');
})();
