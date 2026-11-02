/* =========================================================
   タヌくん トップ画面（2026-10-31。試作 topmenu/ を本編に組みこんだもの）
   ・アプリを開くと、クリーム色の幕から始まり、約0.8秒でふわっと薄くなってトップ画面になる
   ・いつもの大きなタヌくんが笑顔であいさつ（セリフは app.js が lines.js の scene: 'home' から選ぶ）
   ・少したつと、自動でおなかにズーム（タヌくんをタップすれば、すぐズーム）
   ・大きなおなかの上に、遊ぶもののカード（アイコン＋タイトル）が1枚。おなかを左右にスワイプしてめくる（2026-11-02〜 スワイプ版）
   ・ズームしている間は、タヌくんが息をして、おなかがゆっくりふくらむ
   ・おなかかカードをタップすると、おなかがへこんで「ぽよん！」、カードもぷるん → 遊ぶ画面へ
   ・ズーム中に、おなかの外をタップするか「‹ もどる」で、ズームが戻る
   ・ハートが増えた・思い出・クリアの演出やパネルが出ている間は、ズームを待つ（hold・blocked）
   画面の文字は app.js からもらう tr()（i18n.js）で、いまの言語に。
   使い方：const home = window.TanuHome({ ...下の opts }) → home.boot(text, img) / greet / zoomNow / say など
   ========================================================= */
window.TanuHome = function (opts) {
  'use strict';

  const C = opts.config;
  const tr = opts.tr;
  const $ = (id) => document.getElementById(id);

  /* ---------- 調整する数字（試作 topmenu/ で決めたもの） ----------
     feet, height … タヌくんの足もとの高さ・絵の高さ（画面の高さに対する割合）。X アプリの中（下 25% が隠れる）は inX のほう
     boot         … 起動の幕が明けて、あいさつが始まるまでの秒数
     greet        … あいさつしてからズームするまでの秒数（同じ日の2回目は again 秒）
     focus        … ズームしたときに画面のまんなかに来る所（絵の 720×900 の位置。おなかのまんなか）
     bellyW       … ズームしたとき、おなかの幅（絵で 250px 分）が画面の横幅のこの割合になる。maxZoom まで
     at           … ズームしたとき、focus が来る画面の高さ（割合）
     mouth        … タヌくんの口（絵の 720×900 の位置）。ズーム中のふきだしのしっぽが、ここを指す
     head         … 頭のてっぺん（髪のまんなかの上）。あいさつのふきだしは、しっぽの先がここに届くように出す */
  const T = {
    feet: 0.86, height: 0.62,
    inX: { feet: 0.68, height: 0.46, at: 0.47, bellyW: 0.7 },
    boot: 0.6, greet: 1.3, again: 0.6,
    focus: { x: 208, y: 410 }, bellyW: 0.86, maxZoom: 3, at: 0.56,
    mouth: { x: 282, y: 140 },
    head: { x: 310, y: 26 }
  };
  // ゲームを選んだとき、おなかがへこむ所（絵の 720×900。おなかのまんなか）
  const MAIN = { x: 208, y: 405 };

  const root = $('home'), cam = $('home-cam'), body = $('home-body'), img = $('home-img');
  const NORMAL = opts.normal;   // ズームするときの絵（高画質の立ち絵 images/topmenu/normal_hd.webp）
  root.style.backgroundImage = 'url("' + opts.background + '")';
  img.src = NORMAL;
  let face = 'normal';          // いまの絵の名前（きせかえパーツの位置に使う）

  // おなかの揺れ：揺れる範囲を、見えているおなかのまんなか（x, y）を中心に本編より小さく（rx, ry。腕までゆがまないように）、へこみも控えめに
  const BJ = C.bellyJiggle;
  const belly = window.TanuBelly({
    config: Object.assign({}, BJ, { x: 30.8, y: 46.1, rx: 17, ry: 11, tapDent: 0.1, damp: 7, reboundBoost: 0.6,
      poke: Object.assign({}, BJ.poke, { size: 0.4, depth: 0.35 }) }),
    img: img, canvas: $('home-canvas'),
    overlay: $('home-parts'),
    layers: () => opts.layers('normal')
  });
  img.addEventListener('load', () => belly.warm([NORMAL]), { once: true });

  // きせかえパーツ（デベソなど）を、いまの絵の上に重ねる
  function renderParts() {
    const el = $('home-parts');
    el.textContent = '';
    opts.layers(face).forEach((l) => {
      const p = document.createElement('img');
      p.src = l.img.src;
      p.alt = '';
      p.draggable = false;
      if (l.width != null) Object.assign(p.style, { left: l.x + '%', top: l.y + '%', width: l.width + '%' });
      else p.className = 'full';
      el.appendChild(p);
    });
  }
  function show(src, name) {
    face = name;
    if (img.getAttribute('src') !== src) img.src = src;
    renderParts();
  }

  /* ---------- 配置とズーム ---------- */
  const G = {};
  let zoomed = false;
  const inX = () => document.body.classList.contains('in-x');
  function layout() {
    const W = root.clientWidth, H = root.clientHeight;
    if (!W || !H) return;
    const L = inX() ? Object.assign({}, T, T.inX) : T;
    const h = Math.min(H * L.height, W * 1.1), w = h * 0.8;
    const left = W / 2 - w / 2, top = H * L.feet - h * 0.96;
    Object.assign(body.style, { left: left + 'px', top: top + 'px', width: w + 'px', height: h + 'px' });
    Object.assign($('home-ground').style, { left: left + w * 0.12 + 'px', top: top + h * 0.92 + 'px', width: w * 0.76 + 'px', height: h * 0.09 + 'px' });
    const k = w / 720;   // 絵 → 画面
    const Z = Math.min(T.maxZoom, W * L.bellyW / (250 * k));
    Object.assign(G, { W: W, H: H, left: left, top: top, w: w, h: h, k: k, Z: Z, at: L.at });
    applyZoom();
    layoutCards();
  }
  function applyZoom() {
    if (!zoomed) { cam.style.transform = 'none'; return; }
    const fx = G.left + T.focus.x * G.k, fy = G.top + T.focus.y * G.k;
    cam.style.transform = 'translate(' + (G.W / 2 - G.Z * fx) + 'px,' + (G.H * G.at - G.Z * fy) + 'px) scale(' + G.Z + ')';
  }
  // 絵の位置（720×900）→ 画面の位置（ズームも入れて）
  function toScreen(x, y) {
    const sx = G.left + x * G.k, sy = G.top + y * G.k;
    if (!zoomed) return { x: sx, y: sy };
    return { x: G.W / 2 + (sx - (G.left + T.focus.x * G.k)) * G.Z, y: G.H * G.at + (sy - (G.top + T.focus.y * G.k)) * G.Z };
  }

  /* ---------- ゲームのカード（スワイプ版。2026-11-02。試作 topmenu/swipe.html を組みこんだもの） ----------
     opts.games() … [{ id, name（読み上げ用）, title（カードの文字。なければ name）, icon または img, badge, state: 'open'|'soon', isNew, go() }]
     ・ズームしたおなかの上に、カードを1枚ずつ（左にアイコン、右にタイトル）。輪になっていて、最初の前は最後
     ・おなかを左右にスワイプ（おなかが指につられて横に引っぱられ、はなすと ぷるん＋音）か、‹ › か、下の白い丸でめくる
     ・おなかかカードをタップで、そのゲームへ。おなかの外をタップで、ズームが戻る
     ・次に開いたときは、最後に選んだゲームのカードから（localStorage の tanukun.homeCard）
     ・↔ と 👆 のチュートリアルは、2回めくるまで（tanukun.homeSwiped） */
  const CARD_KEY = 'tanukun.homeCard', SWIPED_KEY = 'tanukun.homeSwiped';
  const ls = (fn) => { try { return fn(window.localStorage); } catch (err) { return null; } };
  const BELLY = { x: 222, y: 415, rx: 127, ry: 100 };   // おなか（絵の 720×900）。タップの当たりと ‹ › の位置
  const cardsEl = $('home-cards'), dotsEl = $('home-dots');
  let games = [], pos = 0, vel = 0, target = 0, SPACING = 240, drag = null, raf = 0, lastT = 0;
  let swiped = +(ls((s) => s.getItem(SWIPED_KEY)) || 0);
  const N = () => games.length || 1;
  const mod = (i) => ((i % N()) + N()) % N();
  // いまの番号 p から見た i 番のずれ（輪になっているので、近い方の向き）
  const near = (i, p) => { const n = N(); let d = ((i - p) % n + n) % n; if (d > n / 2) d -= n; return d; };
  function renderIcons() {
    const keep = games.length ? games[mod(Math.round(target))].id : ls((s) => s.getItem(CARD_KEY));
    games = opts.games();
    cardsEl.textContent = '';
    dotsEl.textContent = '';
    games.forEach((g, i) => {
      const c = document.createElement('div');
      c.className = 'h-card' + (g.state === 'soon' ? ' soon' : '') + (g.id === 'pet' ? ' main' : '');
      c.setAttribute('aria-hidden', 'true');
      const inner = g.img ? '<img src="' + g.img + '" alt="" draggable="false">' : '<span>' + g.icon + '</span>';
      const badge = g.badge != null ? g.badge : (g.state === 'soon' ? '🔒' : '');
      c.innerHTML = '<i>' + inner + (badge ? '<u>' + badge + '</u>' : '') + (g.isNew ? '<em>NEW</em>' : '') + '</i><b></b>';
      c.querySelector('b').textContent = g.title || g.name;
      cardsEl.appendChild(c);
      const d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('aria-label', g.name);
      d.addEventListener('click', (e) => { e.stopPropagation(); go(target + Math.round(near(i, target))); });
      dotsEl.appendChild(d);
    });
    // 遊べるゲームのページを、前もって読みこんでおく（タップしてからの切りかえを速く。2026-11-02）
    if (/^https?:$/.test(location.protocol)) {
      games.forEach((g) => {
        if (!g.href || g.state === 'soon' || document.querySelector('link[rel="prefetch"][href="' + g.href + '"]')) return;
        document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'prefetch', href: g.href }));
      });
    }
    let at = games.findIndex((g) => g.id === keep);
    if (at < 0) at = 0;
    pos = target = at; vel = 0;
    layoutCards();
    renderCards();
  }
  // カード・‹ ›・白い丸・チュートリアルの位置（ズームしたときの画面の位置）
  function layoutCards() {
    if (!G.W) return;
    const kz = G.k * G.Z, fx = G.W / 2, fy = G.H * G.at;
    const cy = fy - 84;
    cardsEl.style.left = fx + 'px';
    cardsEl.style.top = cy + 'px';
    const l = fx + (BELLY.x - BELLY.rx - T.focus.x) * kz + 6, r = fx + (BELLY.x + BELLY.rx - T.focus.x) * kz - 6;
    Object.assign($('home-prev').style, { left: Math.max(28, l) + 'px', top: fy + 'px' });
    Object.assign($('home-next').style, { left: Math.min(G.W - 28, r) + 'px', top: fy + 'px' });
    // おなかが小さく映るとき（X アプリの中など）は、カードが ‹ › にかからないように縮める
    const sc = Math.max(0.82, Math.min(1, (Math.min(G.W - 28, r) - Math.max(28, l) - 16) / 320));
    cardsEl.style.transform = 'scale(' + sc + ')';
    const c0 = cardsEl.firstElementChild;
    dotsEl.style.top = cy + (c0 ? c0.offsetHeight : 92) * sc + 8 + 'px';
    Object.assign($('home-tut').style, { left: fx + 'px', top: fy + 70 * kz + 'px' });
    SPACING = Math.min(G.W * 0.62, 280);
  }
  function renderCards() {
    [...cardsEl.children].forEach((c, i) => {
      const d = near(i, pos), ad = Math.abs(d);
      if (ad > 1.6) { c.style.opacity = 0; c.style.transform = 'translateX(' + d * SPACING + 'px)'; return; }
      c.style.opacity = Math.max(0, 1 - ad * 1.1);
      c.style.transform = 'translateX(' + d * SPACING + 'px) scale(' + (1 - Math.min(1, ad) * 0.25) + ') rotate(' + d * 8 + 'deg)';
    });
    // 白い丸：いまの所を横長に。7こより多いときは、はしを小さくして「まだ続く」を見せる（Instagram と同じ考え方）
    const cur = mod(Math.round(pos)), n = games.length, MAXD = 7;
    let from = 0, to = n - 1;
    if (n > MAXD) { from = Math.max(0, Math.min(cur - 3, n - MAXD)); to = from + MAXD - 1; }
    [...dotsEl.children].forEach((d, i) => {
      d.hidden = i < from || i > to;
      const edge = n > MAXD && ((i === from && from > 0) || (i === to && to < n - 1));
      const edge2 = n > MAXD && ((i === from + 1 && from > 0) || (i === to - 1 && to < n - 1));
      d.className = (i === cur ? 'on' : '') + (edge ? ' s2' : edge2 ? ' s1' : '');
      d.setAttribute('aria-current', i === cur ? 'true' : 'false');
    });
    const g = games[cur];
    if (g) cardsEl.setAttribute('aria-label', g.name);
    root.classList.toggle('tut', swiped < 2 && !drag);
  }
  // めくる：おなかが、めくった向きと逆へ「ぷるん」＋音
  function go(i) {
    if (i === target || !games.length) return;
    const dir = Math.sign(i - target);
    target = i;
    sound.flip(dir);
    kick(-dir * 34);
    loop();
  }
  // おなかを横に少し引っぱって、すぐはなす（ばねで ぷるんと戻る）
  const toImg = () => (img.naturalWidth || 1080) / (G.w * G.Z || 1);
  function kick(dx) {
    if (!belly.ready()) return;
    belly.drag('belly', dx, 0, toImg());
    requestAnimationFrame(() => belly.release('belly', false));
  }
  // カードのめくりの動き（指をはなしたら、target へばねで。少しだけ行きすぎて止まる）
  // ※ 時間の差は performance.now() どうしで測る。requestAnimationFrame の時刻は、少し前の時刻のことがあり、
  //   差がマイナスになると、ばねの揺れが大きくなり続けて止まらなくなる（2026-11-02 実機で発生）。0〜0.05秒におさめる
  function step() {
    raf = 0;
    const now = performance.now();
    const dt = Math.max(0, Math.min(0.05, (now - lastT) / 1000));
    lastT = now;
    if (!drag) {
      for (let s = 0; s < 4; s++) { const h = dt / 4; vel += (140 * (target - pos) - 19 * vel) * h; pos += vel * h; }
      if ((Math.abs(target - pos) < 0.001 && Math.abs(vel) < 0.001) || !isFinite(pos) || !isFinite(vel)) { pos = target; vel = 0; }
    }
    renderCards();
    if (drag || pos !== target || vel) loop();
  }
  function loop() { if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(step); } }

  // 指の操作（ズーム中だけ）：横にスワイプでめくる／タップで、おなかの上ならそのゲームへ、外ならズームを戻す
  root.addEventListener('pointerdown', (e) => {
    if (!zoomed || busy || e.target.closest('.h-bar, .h-nav, .h-dots')) return;
    // 出そろう前のタップは受けつけず、待ち時間を延ばす（連打が続いている間は、ゲームへ進まない。指を止めて 0.5秒たてば選べる）
    if (performance.now() < pickAfter) { pickAfter = Math.max(pickAfter, performance.now() + 500); return; }
    drag = { x: e.clientX, y: e.clientY, start: pos, lastX: e.clientX, lastT: performance.now(), vx: 0, moved: false, id: e.pointerId };
    try { root.setPointerCapture(e.pointerId); } catch (err) {}
    if (belly.ready()) belly.press('belly');
    loop();
  });
  root.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, now = performance.now();
    if (Math.abs(dx) > 8) drag.moved = true;
    drag.vx = 0.7 * drag.vx + 0.3 * ((e.clientX - drag.lastX) / Math.max(1, now - drag.lastT));
    drag.lastX = e.clientX; drag.lastT = now;
    if (!drag.moved) return;
    pos = drag.start - dx / SPACING;
    target = Math.round(pos);
    if (belly.ready()) belly.drag('belly', dx * 0.3, 0, toImg());   // 指につられて、おなかが横に
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (belly.ready()) belly.release('belly', !d.moved);
    if (!d.moved && Math.abs(e.clientY - d.y) < 12) {
      if (e.type === 'pointerup') tapAt(e.clientX, e.clientY);
      loop();
      return;
    }
    let i = Math.round(pos);
    if (Math.abs(d.vx) > 0.35) i = Math.round(d.start) + (d.vx < 0 ? 1 : -1);   // すばやく払ったら、となりへ
    const before = Math.round(d.start);
    target = before;
    if (i !== before) {
      go(i);
      swiped += 1;
      ls((s) => s.setItem(SWIPED_KEY, String(swiped)));
    }
    loop();
  }
  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);
  root.addEventListener('lostpointercapture', endDrag);   // 指の追跡が切れたときも、ちゃんと終わらせる
  function tapAt(x, y) {
    const rect = root.getBoundingClientRect();
    x -= rect.left; y -= rect.top;
    const c = cardsEl.children[mod(target)];
    const cr = c && c.getBoundingClientRect();
    const onCard = cr && x >= cr.left - rect.left && x <= cr.right - rect.left && y >= cr.top - rect.top && y <= cr.bottom - rect.top;
    const b = toScreen(BELLY.x, BELLY.y), kz = G.k * G.Z;
    const u = (x - b.x) / (BELLY.rx * kz * 1.1), v = (y - b.y) / (BELLY.ry * kz * 1.25);
    if (onCard || u * u + v * v <= 1) pickCurrent();
    else zoomOut();
  }
  function pickCurrent() {
    const g = games[mod(target)];
    if (!g) return;
    pick(Object.assign({}, g, MAIN), cardsEl.children[mod(target)]);
  }
  $('home-prev').addEventListener('click', (e) => { e.stopPropagation(); if (performance.now() >= pickAfter) go(target - 1); });
  $('home-next').addEventListener('click', (e) => { e.stopPropagation(); if (performance.now() >= pickAfter) go(target + 1); });
  window.addEventListener('keydown', (e) => {
    if (!zoomed || busy || (opts.blocked && opts.blocked())) return;
    if (e.key === 'ArrowLeft') go(target - 1);
    else if (e.key === 'ArrowRight') go(target + 1);
    else if (e.key === 'Enter' && document.activeElement === document.body) pickCurrent();
  });

  /* ---------- ズーム ---------- */
  let timer = 0;
  // ズームしてから、カードが出そろうまでは、タップ・スワイプを受けつけない（トップ画面で連打したとき、
  // ズーム → そのままゲームへ、と一気に進まないように。2026-11-02 ユーザーの要望）
  let pickAfter = 0;
  function setZoom(on, instant) {
    if (on) pickAfter = performance.now() + (instant ? 400 : 950);
    if (instant) { root.classList.add('instant'); void root.offsetWidth; }
    zoomed = on;
    root.classList.toggle('zoomed', on);
    $('home-back').hidden = !on;
    $('home-lang').hidden = on || !opts.langLabel;
    applyZoom();
    if (on) { layoutCards(); renderCards(); }
    if (instant) { void root.offsetWidth; requestAnimationFrame(() => root.classList.remove('instant')); }
  }
  // text：ズームしたあとに、口から出すひとこと（なければ「なにしてあそぶ？」）
  function zoomIn(text, instant) {
    if (zoomed || waking) return;
    clearTimeout(timer);
    root.classList.remove('sleeping');
    show(NORMAL, 'normal');
    setZoom(true, instant);
    $('home-say').hidden = true;
    if (!instant) sound.zoom();
    setTimeout(() => { if (zoomed) sayMouth(text || tr('なにしてあそぶ？')); }, instant ? 150 : 700);
  }
  function zoomOut() {
    if (!zoomed) return;
    setZoom(false);
    $('home-say').hidden = true;
    setTimeout(() => { if (!zoomed) sayHead(tr('おなかを タップしてね！')); }, 750);
  }
  // 自動でズーム：パネル・思い出・お知らせが出ている間や、ハートの演出を待っている間（hold）は、終わるまで待つ
  let holds = 0;
  const blocked = () => holds > 0 || (opts.blocked && opts.blocked());
  function autoZoom(sec) {
    clearTimeout(timer);
    timer = setTimeout(function tryZoom() {
      if (zoomed || sleeping) return;
      if (blocked()) { timer = setTimeout(tryZoom, 400); return; }
      zoomIn();
    }, sec * 1000);
  }

  // ゲームを選ぶ：おなかがへこんで「ぽよん！」、カードもぷるん → それぞれへ
  let busy = false;
  function pick(g, el) {
    if (!zoomed || busy || performance.now() < pickAfter) return;
    busy = true;
    sound.boing();
    if (g.state !== 'soon') ls((s) => s.setItem(CARD_KEY, g.id));
    if (belly.ready()) {
      const n = (img.naturalWidth || 1080) / 720;   // 絵の 720×900 → 絵のピクセル
      belly.press('belly', g.x * n, g.y * n);
      setTimeout(() => belly.release('belly', true), 130);
    }
    body.classList.remove('boing'); void body.offsetWidth; body.classList.add('boing');
    el.classList.remove('wobble'); void el.offsetWidth; el.classList.add('wobble');
    setTimeout(() => { body.classList.remove('boing'); el.classList.remove('wobble'); }, 520);
    const r = el.getBoundingClientRect(), rr = root.getBoundingClientRect();
    pop(r.left - rr.left + r.width / 2, r.top - rr.top - 16, tr('ぽよん！'));
    setTimeout(() => { busy = false; g.go(); }, 550);
  }

  // タップ：ズーム前はタヌくんをタップでズーム（寝ているときは起こす）。ズーム中のタップ・スワイプは、上の「指の操作」で
  body.addEventListener('click', (e) => {
    if (zoomed) return;
    e.stopPropagation();
    if (sleeping) { wake(); return; }
    zoomIn();
  });
  $('home-back').addEventListener('click', (e) => { e.stopPropagation(); zoomOut(); });
  root.querySelectorAll('[data-panel]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); opts.panel(b.dataset.panel); }));
  if (opts.langLabel) {
    $('home-lang').textContent = opts.langLabel;
    $('home-lang').hidden = false;
    $('home-lang').addEventListener('click', (e) => { e.stopPropagation(); opts.onLang(); });
  }

  /* ---------- 寝ているとき（時間帯。公開スイッチ timeOfDay） ----------
     寝ている立ち絵のまま、自動でズームしない。タップすると「ふぁ…？」と起きて、ズーム */
  let sleeping = false, waking = false;
  function sleep(src, text) {
    clearTimeout(timer);
    if (zoomed) setZoom(false, true);
    sleeping = true;
    root.classList.add('sleeping');
    show(src, opts.standKey ? opts.standKey() : 'normal');
    if (opts.nose) {
      $('home-sleep').style.left = opts.nose.x + '%';
      $('home-sleep').style.top = opts.nose.y + '%';
    }
    setTimeout(() => sayHead(text), 350);
  }
  function wake() {
    if (waking) return;
    waking = true;
    root.classList.add('waking');
    sayHead(tr('ふぁ…？'));
    setTimeout(() => {
      waking = false;
      sleeping = false;
      root.classList.remove('waking', 'sleeping');
      if (opts.onWake) opts.onWake();
      zoomIn(opts.wakeText && opts.wakeText());
    }, 700);
  }

  /* ---------- あいさつ → 自動でズーム ----------
     src, name … あいさつのときの絵（笑顔 happy。時間帯の立ち絵があればそれ）。fast なら同じ日2回目（早めにズーム） */
  function greet(text, src, name, fast) {
    clearTimeout(timer);
    sleeping = false;
    root.classList.remove('sleeping');
    if (zoomed) setZoom(false, true);
    show(src || NORMAL, name || 'normal');
    if (text) setTimeout(() => sayHead(text), 350);
    autoZoom((fast ? T.again : T.greet) + 0.35);
  }
  // 起動：幕が明けてから、あいさつ（または寝ている）
  function boot(next) {
    clearTimeout(timer);
    $('home-say').hidden = true;
    root.classList.remove('booting'); void root.offsetWidth; root.classList.add('booting');
    setTimeout(() => root.classList.remove('booting'), 1000);
    timer = setTimeout(next, T.boot * 1000);
  }

  /* ---------- 音（試作と同じ） ---------- */
  let ac = null;
  function audio() {
    if (ac) return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ac = new AC(); } catch (err) { return null; }
    return ac;
  }
  function tone(type, f0, f1, dur, vol) {
    const a = audio();
    if (!a) return;
    if (a.state === 'suspended') a.resume();
    const t = a.currentTime, o = a.createOscillator(), gn = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  const sound = {
    zoom: () => tone('sine', 400, 900, 0.25, 0.12),
    // カードをめくった「ぷるん」（右へは少し高く）
    flip: (dir) => { const f = dir > 0 ? 300 : 260; tone('sine', f, f * 2, 0.08, 0.22); setTimeout(() => tone('sine', f * 2, f * 1.2, 0.18, 0.12), 80); },
    // おなかの「ぽよ〜ん」（ぽよんラリーと同じ）
    boing: () => {
      const a = audio();
      if (!a) return;
      if (a.state === 'suspended') a.resume();
      const t = a.currentTime, o = a.createOscillator(), gn = a.createGain(), lfo = a.createOscillator(), lg = a.createGain();
      o.frequency.setValueAtTime(330, t);
      o.frequency.exponentialRampToValueAtTime(150, t + 0.45);
      lfo.frequency.setValueAtTime(15, t);
      lg.gain.setValueAtTime(60, t);
      lg.gain.exponentialRampToValueAtTime(2, t + 0.5);
      lfo.connect(lg).connect(o.frequency);
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(0.55, t + 0.012);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(gn).connect(a.destination);
      o.start(t); lfo.start(t); o.stop(t + 0.6); lfo.stop(t + 0.6);
      tone('sine', 120, 50, 0.16, 0.7);
    }
  };

  /* ---------- ひとこと・文字 ---------- */
  let sayTimer = 0;
  // at の所にふきだし。up なら、ふきだしは at の下に出て、しっぽは上向き。
  // ふきだしが画面のはしで切れないときは横にずらす。しっぽは tx（口や頭の横の位置）の所に付けて、
  // 口がふきだしのまんなかより右なら右下へ、左なら左下へ曲げる
  function sayAt(text, at, up, tx, keep) {
    const el = $('home-say');
    el.textContent = text;
    el.classList.toggle('up', !!up);
    el.hidden = false;
    const half = el.offsetWidth / 2, x = Math.max(half + 8, Math.min(G.W - half - 8, at.x));
    el.style.left = x + 'px';
    el.style.top = at.y + 'px';
    const t = tx == null ? at.x : tx;
    el.style.setProperty('--tail', Math.max(22, Math.min(half * 2 - 22, t - x + half)) + 'px');
    el.classList.toggle('tail-l', t < x);
    el.classList.toggle('tail-r', t >= x);
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    clearTimeout(sayTimer);
    if (!keep) sayTimer = setTimeout(() => { el.hidden = true; }, Math.max(2600, (C.bubbleSeconds || 0) * 1000));
  }
  // あいさつ：ふきだしは頭の上。しっぽ（長さ 11px）の先が、髪のまんなかに少しもぐるように
  function sayHead(text, keep) {
    const hd = toScreen(T.head.x, T.head.y);
    sayAt(text, { x: hd.x, y: hd.y - 2 }, false, hd.x, keep);
  }
  // ズーム中：ふきだしは顔の下で、しっぽは上向きに口を指す
  function sayMouth(text, keep) {
    const m = toScreen(T.mouth.x, T.mouth.y);
    // 上のバーとハートに重ならないように（バーの下より上には出さない）
    const bar = root.querySelector('.h-bar').getBoundingClientRect().bottom - root.getBoundingClientRect().top;
    sayAt(text, { x: m.x, y: Math.max(m.y + 26, bar + 14) }, true, m.x, keep);
  }
  function pop(x, y, text) {
    const el = document.createElement('span');
    el.className = 'h-pop';
    el.textContent = text;
    el.style.top = y + 'px';
    $('home-pops').appendChild(el);
    const half = el.offsetWidth * 0.62 + 6;   // 画面のはしで切れないように
    el.style.left = Math.max(half, Math.min(G.W - half, x)) + 'px';
    setTimeout(() => el.remove(), 800);
  }

  window.addEventListener('resize', layout);
  renderIcons();

  return {
    // 画面が見えるようになったとき（mode-home になったとき）に、大きさを測りなおす
    layout: layout,
    boot: boot,
    greet: greet,
    sleep: sleep,
    // あいさつを飛ばして、ズームした画面から（ゲームやなでなでから戻ったとき）
    zoomNow: (text) => { clearTimeout(timer); sleeping = false; root.classList.remove('sleeping'); layout(); if (zoomed) sayMouth(text || tr('なにしてあそぶ？')); else zoomIn(text, true); },
    // ズーム中に、いまのカードのゲームへ（テスト・キーボード用）
    pickCurrent: pickCurrent,
    // いまの所でひとこと（ズーム中は口から、ズーム前は頭の上）
    say: (text, keep) => (zoomed ? sayMouth(text, keep) : sayHead(text, keep)),
    // ズームを待ってもらう（ハートの演出など）。返ってきた関数を呼ぶと、待つのをやめる
    hold: () => { holds += 1; let done = false; return () => { if (!done) { done = true; holds = Math.max(0, holds - 1); } }; },
    refreshIcons: renderIcons,
    refreshParts: () => { belly.refresh(); renderParts(); },
    isZoomed: () => zoomed
  };
};
