/* =========================================================
   タヌくん トップ画面（2026-10-31。試作 topmenu/ を本編に組みこんだもの）
   ・アプリを開くと、クリーム色の幕から始まり、約0.8秒でふわっと薄くなってトップ画面になる
   ・いつもの大きなタヌくんが笑顔であいさつ（セリフは app.js が lines.js の scene: 'home' から選ぶ）
   ・少したつと、自動でおなかにズーム（タヌくんをタップすれば、すぐズーム）
   ・大きなおなかの上に、遊ぶもののアイコン（文字なし）が ぽこぽこ 並ぶ。まんなかの大きいのが「タヌくん なでなで」
   ・アイコンが並んでいる間は、タヌくんが息をして、おなかとアイコンがゆっくり上下する
   ・アイコンをタップすると、その所がへこんで「ぽよん！」、アイコンもぷるん → 遊ぶ画面へ
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
     iconPx       … ズームしたときのアイコンの大きさ（画面のピクセル）
     mouth        … タヌくんの口（絵の 720×900 の位置）。ズーム中のふきだしのしっぽが、ここを指す
     head         … 頭のてっぺん（髪のまんなかの上）。あいさつのふきだしは、しっぽの先がここに届くように出す */
  const T = {
    feet: 0.86, height: 0.62,
    inX: { feet: 0.68, height: 0.46, at: 0.47, bellyW: 0.7 },
    boot: 0.6, greet: 1.3, again: 0.6,
    focus: { x: 208, y: 410 }, bellyW: 0.86, maxZoom: 3, at: 0.56,
    iconPx: 66,
    mouth: { x: 282, y: 140 },
    head: { x: 310, y: 26 }
  };
  // アイコンの場所（絵の 720×900）。main はまんなかの「タヌくん なでなで」、slots はそのまわり（並べる順）
  const MAIN = { x: 208, y: 405 };
  const SLOTS = [{ x: 122, y: 432 }, { x: 296, y: 430 }, { x: 150, y: 345 }, { x: 272, y: 343 }];

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
    $('home-icons').style.setProperty('--s', T.iconPx / Z);
    applyZoom();
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

  /* ---------- アイコン ----------
     opts.games() … [{ id, name（読み上げ用）, icon または img, badge（右下の丸。soon でなければ省略可）, state: 'open'|'soon', isNew, go() }]
     まんなか（id: 'pet'）＋まわりの場所に順に並べる */
  let games = [];
  function renderIcons() {
    const box = $('home-icons');
    box.textContent = '';
    games = opts.games();
    let slot = 0;
    games.forEach((g, i) => {
      const at = g.id === 'pet' ? MAIN : SLOTS[slot++];
      if (!at) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'h-gi' + (g.id === 'pet' ? ' main' : '') + (g.state === 'soon' ? ' soon' : '') + (g.isNew ? ' new' : '');
      b.style.left = at.x / 720 * 100 + '%';
      b.style.top = at.y / 900 * 100 + '%';
      b.style.setProperty('--i', i);
      b.setAttribute('aria-label', g.name);
      const inner = g.img ? '<img src="' + g.img + '" alt="" draggable="false">' : '<span>' + g.icon + '</span>';
      const badge = g.badge != null ? g.badge : (g.state === 'soon' ? '🔒' : '');
      b.innerHTML = '<i>' + inner + (badge ? '<u>' + badge + '</u>' : '') + '</i>';
      b.addEventListener('click', (e) => { e.stopPropagation(); pick(Object.assign({}, g, at), b); });
      box.appendChild(b);
    });
  }

  /* ---------- ズーム ---------- */
  let timer = 0;
  function setZoom(on, instant) {
    if (instant) { root.classList.add('instant'); void root.offsetWidth; }
    zoomed = on;
    root.classList.toggle('zoomed', on);
    $('home-back').hidden = !on;
    $('home-lang').hidden = on || !opts.langLabel;
    applyZoom();
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

  // アイコンを選ぶ：そこがへこんで「ぽよん！」、アイコンもぷるん → それぞれへ
  let busy = false;
  function pick(g, el) {
    if (!zoomed || busy) return;
    busy = true;
    sound.boing();
    if (belly.ready()) {
      belly.press('belly', g.x, g.y);
      setTimeout(() => belly.release('belly', true), 130);
    }
    body.classList.remove('boing'); void body.offsetWidth; body.classList.add('boing');
    el.classList.remove('wobble'); void el.offsetWidth; el.classList.add('wobble');
    setTimeout(() => { body.classList.remove('boing'); el.classList.remove('wobble'); }, 520);
    const p = toScreen(g.x, g.y);
    pop(p.x, p.y - 50, tr('ぽよん！'));
    setTimeout(() => { busy = false; g.go(); }, 550);
  }

  // タップ：ズーム前はタヌくんをタップでズーム（寝ているときは起こす）。ズーム中は、アイコンの外をタップで戻る
  body.addEventListener('click', (e) => {
    if (zoomed) return;
    e.stopPropagation();
    if (sleeping) { wake(); return; }
    zoomIn();
  });
  root.addEventListener('click', (e) => {
    if (e.target.closest('.h-bar, .h-gi')) return;
    if (zoomed) zoomOut();
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
    // いまの所でひとこと（ズーム中は口から、ズーム前は頭の上）
    say: (text, keep) => (zoomed ? sayMouth(text, keep) : sayHead(text, keep)),
    // ズームを待ってもらう（ハートの演出など）。返ってきた関数を呼ぶと、待つのをやめる
    hold: () => { holds += 1; let done = false; return () => { if (!done) { done = true; holds = Math.max(0, holds - 1); } }; },
    refreshIcons: renderIcons,
    refreshParts: () => { belly.refresh(); renderParts(); },
    isZoomed: () => zoomed
  };
};
