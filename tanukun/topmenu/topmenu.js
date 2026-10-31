/* =========================================================
   トップ画面の試作（2026-10-31）
   ・アプリを開くと、クリーム色の幕から始まり、約0.8秒でふわっと薄くなってトップ画面になる（起動した感じ。文字は入れない）
   ・いつもの大きなタヌくんが笑顔であいさつ（来かたで変わる）
   ・2〜3秒たつと、自動でおなかにズーム（タヌくんをタップすれば、すぐズーム）
   ・大きなおなかの上に、ゲームのアイコン（文字なし）が ぽこぽこ 並ぶ。まんなかの大きいのが「タヌくん なでなで」（タヌくんの顔）
   ・アイコンが並んでいる間は、タヌくんが息をして、おなかとアイコンがゆっくり上下する
   ・アイコンをタップすると、その所がへこんで「ぽよん！」、アイコンもぷるん → ゲームへ（試作では、お知らせだけ）
   ・ズーム中に、おなかの外をタップするか「‹ もどる」で、ズームが戻る
   ========================================================= */
(function () {
  'use strict';

  const C = window.TANU_CONFIG;
  const $ = (id) => document.getElementById(id);
  const IMG = (name) => {
    const src = C.images[name] || name;
    return (/^data:/.test(src) ? '' : '../') + src;
  };

  /* ---------- 調整する数字 ----------
     feet, height … タヌくんの足もとの高さ・絵の高さ（画面の高さに対する割合）
     boot         … 起動の幕が明けて、あいさつが始まるまでの秒数
     greet        … あいさつしてからズームするまでの秒数（同じ日の2回目は again 秒）
     focus        … ズームしたときに画面のまんなかに来る所（絵の 720×900 の位置。おなかのまんなか）
     bellyW       … ズームしたとき、おなかの幅（絵で 250px 分）が画面の横幅のこの割合になる。maxZoom まで
     at           … ズームしたとき、focus が来る画面の高さ（割合）
     iconPx       … ズームしたときのアイコンの大きさ（画面のピクセル）
     mouth        … タヌくんの口（絵の 720×900 の位置）。ズーム中のふきだしのしっぽが、ここを指す */
  const T = {
    feet: 0.86, height: 0.62,
    boot: 0.6, greet: 1.3, again: 0.6,
    focus: { x: 208, y: 410 }, bellyW: 0.86, maxZoom: 3, at: 0.56,
    iconPx: 66,
    mouth: { x: 282, y: 140 }
  };
  // おなかの上のアイコン（x, y は絵の 720×900 の位置。文字は出さず、name は読み上げ・お知らせ用）
  //   main … タヌくん なでなで（タヌくんの顔の絵 images/topmenu/pet.webp。少し大きい）
  const GAMES = [
    { id: 'pet', img: 'images/topmenu/pet.webp', badge: '🤚', name: 'タヌくん なでなで', x: 208, y: 405, cls: 'main' },
    { id: 'pon', icon: '🥁', name: 'ぽんぽこリズム', x: 122, y: 432 },
    { id: 'rally', icon: '🏐', name: 'ぽよんラリー', x: 296, y: 430 },
    { id: 'soon1', icon: '🔒', name: 'もうすぐ', x: 150, y: 345, cls: 'soon' },
    { id: 'soon2', icon: '🔒', name: 'もうすぐ', x: 272, y: 343, cls: 'soon' }
  ];
  // 来かたで変わる、あいさつ（本編では lines.js の scene: 'home' を使う）
  const GREET = {
    first: 'はじめまして！ 来てくれて うれしいな',
    new: '今日も いっしょに あそぼ〜！',
    comeback: 'おかえり〜！ 待ってたよ！',
    again: 'なにしてあそぶ？'
  };

  const root = $('topmenu'), cam = $('cam'), body = $('body'), img = $('tanu-img');
  root.style.backgroundImage = 'url("' + IMG('images/bg/beach_day.webp') + '")';
  img.src = IMG('normal');
  const HAPPY = IMG('images/happy.webp');
  new Image().src = HAPPY;
  const BJ = C.bellyJiggle;
  // おなかの揺れ：揺れる範囲を、見えているおなかのまんなか（x, y）を中心に本編より小さく（rx, ry。腕までゆがまないように）、へこみも控えめに
  const belly = window.TanuBelly({
    config: Object.assign({}, BJ, { x: 30.8, y: 46.1, rx: 17, ry: 11, tapDent: 0.1, damp: 7, reboundBoost: 0.6,
      poke: Object.assign({}, BJ.poke, { size: 0.4, depth: 0.35 }) }),
    img: img, canvas: $('belly-canvas')
  });
  img.addEventListener('load', () => belly.warm([IMG('normal')]), { once: true });

  /* ---------- 配置とズーム ---------- */
  const G = {};
  let zoomed = false;
  function layout() {
    const W = root.clientWidth, H = root.clientHeight;
    const h = Math.min(H * T.height, W * 1.1), w = h * 0.8;
    const left = W / 2 - w / 2, top = H * T.feet - h * 0.96;
    Object.assign(body.style, { left: left + 'px', top: top + 'px', width: w + 'px', height: h + 'px' });
    Object.assign($('ground').style, { left: left + w * 0.12 + 'px', top: top + h * 0.92 + 'px', width: w * 0.76 + 'px', height: h * 0.09 + 'px' });
    const k = w / 720;   // 絵 → 画面
    const Z = Math.min(T.maxZoom, W * T.bellyW / (250 * k));
    Object.assign(G, { W: W, H: H, left: left, top: top, w: w, h: h, k: k, Z: Z });
    $('icons').style.setProperty('--s', T.iconPx / Z / 1);
    applyZoom();
  }
  function applyZoom() {
    if (!zoomed) { cam.style.transform = 'none'; return; }
    const fx = G.left + T.focus.x * G.k, fy = G.top + T.focus.y * G.k;
    cam.style.transform = 'translate(' + (G.W / 2 - G.Z * fx) + 'px,' + (G.H * T.at - G.Z * fy) + 'px) scale(' + G.Z + ')';
  }
  // 絵の位置（720×900）→ 画面の位置（ズームも入れて）
  function toScreen(x, y) {
    const sx = G.left + x * G.k, sy = G.top + y * G.k;
    if (!zoomed) return { x: sx, y: sy };
    return { x: G.W / 2 + (sx - (G.left + T.focus.x * G.k)) * G.Z, y: G.H * T.at + (sy - (G.top + T.focus.y * G.k)) * G.Z };
  }

  // アイコンを並べる
  GAMES.forEach((g, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gi' + (g.cls ? ' ' + g.cls : '');
    b.style.left = g.x / 720 * 100 + '%';
    b.style.top = g.y / 900 * 100 + '%';
    b.style.setProperty('--i', i);
    b.setAttribute('aria-label', g.name);
    b.innerHTML = g.img ? '<i><img src="' + IMG(g.img) + '" alt="" draggable="false"><u>' + g.badge + '</u></i>' : '<i>' + g.icon + '</i>';
    b.addEventListener('click', (e) => { e.stopPropagation(); pick(g, b); });
    $('icons').appendChild(b);
  });

  function zoomIn() {
    if (zoomed) return;
    clearTimeout(timer);
    img.src = IMG('normal');
    zoomed = true;
    root.classList.add('zoomed');
    $('btn-back').hidden = false;
    $('say').hidden = true;
    applyZoom();
    sound.zoom();
    setTimeout(() => { if (zoomed) { const m = toScreen(T.mouth.x, T.mouth.y); say('なにしてあそぶ？', { x: m.x, y: m.y + 26 }, true); } }, 700);
  }
  function zoomOut() {
    if (!zoomed) return;
    zoomed = false;
    root.classList.remove('zoomed');
    $('btn-back').hidden = true;
    $('say').hidden = true;
    applyZoom();
    setTimeout(() => { if (!zoomed) sayHead('おなかを タップしてね！'); }, 750);
  }

  // アイコンを選ぶ：そこがへこんで「ぽよん！」、アイコンもぷるん → ゲームへ
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
    // 終わったら、また息をする動きにもどす
    setTimeout(() => { body.classList.remove('boing'); el.classList.remove('wobble'); }, 520);
    const p = toScreen(g.x, g.y);
    pop(p.x, p.y - 50, 'ぽよん！');
    setTimeout(() => {
      busy = false;
      toast(g.cls === 'soon' ? '🔒 もうすぐ 遊べるよ！' : '▶ ' + g.name + ' へ（試作なので、ここで止まります）');
    }, 550);
  }

  // タップ：ズーム前はタヌくんをタップでズーム。ズーム中は、アイコンの外をタップで戻る
  body.addEventListener('click', (e) => { if (!zoomed) { e.stopPropagation(); zoomIn(); } });
  root.addEventListener('click', (e) => {
    if (e.target.closest('.bar, .proto, .gi')) return;
    if (zoomed) zoomOut();
  });
  $('btn-back').addEventListener('click', (e) => { e.stopPropagation(); zoomOut(); });
  document.querySelectorAll('.ico').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); toast(b.dataset.toast + '（試作）'); }));

  /* ---------- あいさつ → 自動でズーム ---------- */
  let timer = 0;
  function greet(visit) {
    clearTimeout(timer);
    if (zoomed) { zoomed = false; root.classList.remove('zoomed'); $('btn-back').hidden = true; applyZoom(); }
    img.src = visit === 'again' ? IMG('normal') : HAPPY;   // 笑顔であいさつ
    setTimeout(() => sayHead(GREET[visit]), 350);
    timer = setTimeout(zoomIn, ((visit === 'again' ? T.again : T.greet) + 0.35) * 1000);
  }
  // 起動：幕が明けてから、あいさつ
  function boot(visit) {
    clearTimeout(timer);
    if (zoomed) { zoomed = false; root.classList.remove('zoomed'); $('btn-back').hidden = true; applyZoom(); }
    $('say').hidden = true;
    img.src = visit === 'again' ? IMG('normal') : HAPPY;
    root.classList.remove('booting'); void root.offsetWidth; root.classList.add('booting');
    setTimeout(() => root.classList.remove('booting'), 1000);
    timer = setTimeout(() => greet(visit), T.boot * 1000);
  }
  document.querySelectorAll('.proto button').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); boot(b.dataset.visit); }));

  /* ---------- 音 ---------- */
  let ac = null;
  function audio() {
    if (ac) return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
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

  /* ---------- ひとこと・文字・お知らせ ---------- */
  let sayTimer = 0;
  // at の所にふきだし。up なら、ふきだしは at の下に出て、しっぽは上向き。
  // ふきだしが画面のはしで切れないときは横にずらす。しっぽは tx（ふつうは口の横の位置）の所に付けて、
  // 口がふきだしのまんなかより右なら右下へ、左なら左下へ曲げる
  function say(text, at, up, tx) {
    const el = $('say');
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
    sayTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }
  const sayHead = (text) => say(text, { x: G.left + G.w * 0.46, y: G.top + G.h * 0.02 }, false, toScreen(T.mouth.x, T.mouth.y).x);
  function pop(x, y, text) {
    const el = document.createElement('span');
    el.className = 'pop';
    el.textContent = text;
    el.style.top = y + 'px';
    $('pops').appendChild(el);
    const half = el.offsetWidth * 0.62 + 6;   // 画面のはしで切れないように
    el.style.left = Math.max(half, Math.min(G.W - half, x)) + 'px';
    setTimeout(() => el.remove(), 800);
  }
  let toastTimer = 0;
  function toast(text) {
    const el = $('toast');
    el.textContent = text;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 1800);
  }

  window.addEventListener('resize', layout);
  layout();
  boot('first');
})();
