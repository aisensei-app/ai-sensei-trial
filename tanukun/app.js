/* =========================================================
   タヌくん 本体プログラム
   ふだん調整するのは config.js（設定）と lines.js（セリフ）だけでOKです。
   ========================================================= */
(function () {
  'use strict';

  const C = window.TANU_CONFIG;
  const LINES = window.TANU_LINES || [];
  const $ = (id) => document.getElementById(id);

  const area   = $('tanu-area');
  const move   = $('tanu-move');    // 隠れる・戻る（スライド）
  const melt   = $('tanu-melt');    // とろけて横に広がる
  const body   = $('tanu-body');    // ぷるん・よじり・震え
  const img    = $('tanu-img');
  const bubble = $('bubble');
  const zonesEl = $('zones');

  const PLACE_LABEL = { head: '頭', belly: 'おなか', tail: 'しっぽ' };

  /* ---------- いまの状態 ---------- */
  const state = {
    phase: 'active',      // active（ふつう）/ angry（怒り中）/ hidden（隠れ中）/ returning（戻り中）
    taps: [],             // 直近のタップ記録 { time, weight }
    mood: 'normal',       // normal / shy / troubled
    melting: false,
    lastHeadTap: 0,
    meltTimer: null,
    face: null,           // いま表示している絵の名前
    faceOverride: null,   // セリフで一時的に指定された絵
    faceOverrideUntil: 0,
    recentTexts: []       // 同じセリフが続かないように覚えておく
  };

  const now = () => performance.now();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (min, max) => min + Math.random() * (max - min);

  /* =========================================================
     絵の切り替え
     ========================================================= */
  // 先に全部読み込んでおく（切り替え時のちらつき防止）
  Object.values(C.images).forEach((src) => { new Image().src = src; });

  img.addEventListener('error', () => {
    showBubble('画像が見つかりません：' + img.getAttribute('src'));
  });

  function setFace(name) {
    if (state.face === name) return;
    state.face = name;
    img.src = C.images[name] || C.images.normal;
  }

  // いまの状態から、出すべき絵を決める（上にあるものほど優先）
  function currentFace() {
    if (state.phase === 'angry')  return 'angry';
    if (state.phase === 'hidden') return 'bush';
    if (state.faceOverride && now() < state.faceOverrideUntil) return state.faceOverride;
    if (state.melting) return 'melt';
    return state.mood;   // normal / shy / troubled
  }
  const refreshFace = () => setFace(currentFace());

  /* =========================================================
     タップ範囲を作る（config.js の zones から）
     ========================================================= */
  Object.keys(C.zones).forEach((place) => {
    const z = C.zones[place];
    const el = document.createElement('button');
    el.className = 'zone';
    el.dataset.place = place;
    el.dataset.label = PLACE_LABEL[place] || place;
    el.setAttribute('aria-label', (PLACE_LABEL[place] || place) + 'をさわる');
    Object.assign(el.style, {
      left: z.left + '%', top: z.top + '%', width: z.width + '%', height: z.height + '%'
    });
    zonesEl.appendChild(el);
  });
  if (C.showZones || /[?&]zones\b/.test(location.search)) {
    document.body.classList.add('show-zones');
  }

  area.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (state.phase === 'hidden') { onHiddenTap(); return; }
    const zone = e.target.closest('[data-place]');
    if (zone) onTap(zone.dataset.place);
  });

  /* =========================================================
     タップ回数 → 気分
     ========================================================= */
  function tapCount(t) {
    const from = t - C.mood.windowSeconds * 1000;
    state.taps = state.taps.filter((x) => x.time >= from);
    return state.taps.reduce((sum, x) => sum + x.weight, 0);
  }

  function moodFromCount(n) {
    if (n >= C.mood.angryAt)    return 'angry';
    if (n >= C.mood.troubledAt) return 'troubled';
    if (n >= C.mood.shyAt)      return 'shy';
    return 'normal';
  }

  // 時間がたつと気分が落ち着く
  setInterval(() => {
    if (state.phase !== 'active') return;
    const m = moodFromCount(tapCount(now()));
    if (m !== 'angry') state.mood = m;
    refreshFace();
  }, 400);

  /* =========================================================
     タップしたとき
     ========================================================= */
  function onTap(place) {
    if (state.phase !== 'active') return;
    const t = now();
    const w = C.countWeight[place] != null ? C.countWeight[place] : 1;
    state.taps.push({ time: t, weight: w });

    const mood = moodFromCount(tapCount(t));
    if (mood === 'angry') { getAngry(); return; }
    state.mood = mood;

    let scene = 'tap';
    if (place === 'head')  scene = petHead(t);
    if (place === 'belly') jiggleBelly();
    if (place === 'tail')  wiggleTail();

    say({ scene: scene, place: place, mood: mood });
    refreshFace();
  }

  /* ---- 頭：続けてなでると、とろける ---- */
  function petHead(t) {
    const combo = t - state.lastHeadTap < C.melt.comboSeconds * 1000;
    state.lastHeadTap = t;
    if (combo || state.melting) {
      startMelt();
      return 'melt';
    }
    // 1回だけのときは、軽くうなずく
    body.animate([
      { transform: 'translateY(0)' },
      { transform: 'translateY(2%) scale(1.02, .98)' },
      { transform: 'translateY(0)' }
    ], { duration: 320, easing: 'ease-out' });
    return 'tap';
  }

  function startMelt() {
    clearTimeout(state.meltTimer);
    state.meltTimer = setTimeout(endMelt, C.melt.holdSeconds * 1000);
    if (state.melting) return;
    state.melting = true;
    melt.animate([
      { transform: 'scale(1, 1)' },
      { transform: 'scale(1.14, .9)' }
    ], { duration: 500, easing: 'cubic-bezier(.3,.8,.4,1)', fill: 'forwards' });
  }

  function endMelt(instant) {
    clearTimeout(state.meltTimer);
    if (!state.melting) return;
    state.melting = false;
    melt.getAnimations().forEach((a) => a.cancel());
    if (!instant) {
      melt.animate([
        { transform: 'scale(1.14, .9)' },
        { transform: 'scale(.97, 1.03)', offset: .6 },
        { transform: 'scale(1, 1)' }
      ], { duration: 600, easing: 'ease-out' });
    }
    refreshFace();
  }

  /* ---- おなか：ぷるん（ぽっちゃりした重さ。ゆっくり戻る） ---- */
  function jiggleBelly() {
    body.animate([
      { transform: 'scale(1, 1)' },
      { transform: 'scale(1.10, .90)', offset: .12 },
      { transform: 'scale(.95, 1.06)', offset: .34 },
      { transform: 'scale(1.04, .97)', offset: .55 },
      { transform: 'scale(.99, 1.01)', offset: .76 },
      { transform: 'scale(1, 1)' }
    ], { duration: 1000, easing: 'cubic-bezier(.25,.6,.4,1)' });
    if (C.vibrate && navigator.vibrate) navigator.vibrate(15);
  }

  /* ---- しっぽ：体をよじるように左右に揺れる ---- */
  function wiggleTail() {
    body.animate([
      { transform: 'rotate(0) skewX(0)' },
      { transform: 'rotate(-6deg) skewX(4deg)' },
      { transform: 'rotate(5deg) skewX(-3deg)' },
      { transform: 'rotate(-4deg) skewX(2deg)' },
      { transform: 'rotate(2deg) skewX(-1deg)' },
      { transform: 'rotate(0) skewX(0)' }
    ], { duration: 800, easing: 'ease-in-out' });
  }

  /* =========================================================
     怒る → 隠れる → 戻ってくる
     ========================================================= */
  async function getAngry() {
    state.phase = 'angry';
    endMelt(true);
    refreshFace();
    say({ scene: 'angry' });

    // プルプル震える
    await body.animate([
      { transform: 'translate(0, 0) rotate(0)' },
      { transform: 'translate(-1.5%, 0) rotate(-1deg)' },
      { transform: 'translate(1.5%, 0) rotate(1deg)' },
      { transform: 'translate(0, 0) rotate(0)' }
    ], { duration: 90, iterations: 13 }).finished;

    await hide();
  }

  async function hide() {
    // しゅっと下に引っこむ
    const out = move.animate([
      { transform: 'translateY(0) scale(1)', opacity: 1 },
      { transform: 'translateY(20%) scale(.9, .8)', opacity: 0 }
    ], { duration: 260, easing: 'ease-in', fill: 'forwards' });
    await out.finished;

    state.phase = 'hidden';
    refreshFace();   // 茂みの絵に
    out.cancel();
    move.animate([
      { transform: 'translateY(8%) scale(.9)', opacity: 0 },
      { transform: 'translateY(0) scale(1)', opacity: 1 }
    ], { duration: 320, easing: 'cubic-bezier(.3,1.5,.5,1)' });

    setTimeout(comeBack, rand(C.hide.minSeconds, C.hide.maxSeconds) * 1000);
  }

  function rustle() {
    body.animate([
      { transform: 'rotate(0)' },
      { transform: 'rotate(-3deg)' },
      { transform: 'rotate(3deg)' },
      { transform: 'rotate(-2deg)' },
      { transform: 'rotate(0)' }
    ], { duration: 380, easing: 'ease-in-out' });
  }

  function onHiddenTap() {
    rustle();
    say({ scene: 'hiddenTap' });
  }

  async function comeBack() {
    state.phase = 'returning';
    rustle();
    await wait(420);

    const out = move.animate([
      { opacity: 1 }, { opacity: 0 }
    ], { duration: 150, fill: 'forwards' });
    await out.finished;

    // 気分をリセット
    state.taps = [];
    state.mood = 'normal';
    state.phase = 'active';
    const line = say({ scene: 'return' });
    refreshFace();
    out.cancel();

    // 下からぴょこっと出てくる
    move.animate([
      { transform: 'translateY(25%) scale(.95, 1.05)', opacity: 0 },
      { transform: 'translateY(-3%) scale(1.02, .98)', opacity: 1, offset: .7 },
      { transform: 'translateY(0) scale(1)', opacity: 1 }
    ], { duration: 560, easing: 'cubic-bezier(.3,.9,.4,1)' });
    return line;
  }

  /* =========================================================
     セリフを選ぶしくみ
     条件を増やしたいときは MATCHERS に1行追加し、
     getContext() でその値を用意すればOKです。
     ========================================================= */
  const listHas = (cond, v) => Array.isArray(cond) ? cond.indexOf(v) >= 0 : cond === v;
  const inRange = (cond, v) =>
    (cond.min == null || v >= cond.min) && (cond.max == null || v <= cond.max);

  const MATCHERS = {
    scene:      (cond, ctx) => listHas(cond, ctx.scene),
    place:      (cond, ctx) => listHas(cond, ctx.place),
    mood:       (cond, ctx) => listHas(cond, ctx.mood),
    timeOfDay:  (cond, ctx) => listHas(cond, ctx.timeOfDay),
    friendship: (cond, ctx) => inRange(cond, ctx.friendship),
    streakDays: (cond, ctx) => inRange(cond, ctx.streakDays)
  };

  const warned = {};
  function matches(line, ctx) {
    const when = line.when || {};
    return Object.keys(when).every((key) => {
      const m = MATCHERS[key];
      if (!m) {
        if (!warned[key]) { console.warn('セリフの条件「' + key + '」は未対応です（無視します）'); warned[key] = true; }
        return true;
      }
      return m(when[key], ctx);
    });
  }

  function timeOfDay(h) {
    if (h >= 5 && h <= 10)  return 'morning';
    if (h >= 11 && h <= 16) return 'day';
    if (h >= 17 && h <= 19) return 'evening';
    return 'night';
  }

  // セリフ選びに使う情報（将来ここに「なかよし度」などの本当の値を入れる）
  function getContext(base) {
    return Object.assign({
      mood: 'normal',
      timeOfDay: timeOfDay(new Date().getHours()),
      friendship: 0,
      streakDays: 0
    }, base);
  }

  function pickLine(base) {
    const ctx = getContext(base);
    let cands = LINES.filter((l) => matches(l, ctx));
    // 条件に合うセリフがないときは、場面だけ合うものから選ぶ
    if (!cands.length) cands = LINES.filter((l) => l.when && listHas(l.when.scene, ctx.scene));
    if (!cands.length) return null;
    // 最近出たセリフはなるべく避ける
    const fresh = cands.filter((l) => state.recentTexts.indexOf(l.text) < 0);
    if (fresh.length) cands = fresh;

    const total = cands.reduce((s, l) => s + (l.weight || 1), 0);
    let r = Math.random() * total;
    for (const l of cands) {
      r -= (l.weight || 1);
      if (r <= 0) return l;
    }
    return cands[cands.length - 1];
  }

  function say(base) {
    const line = pickLine(base);
    if (!line) return null;
    state.recentTexts.push(line.text);
    if (state.recentTexts.length > 3) state.recentTexts.shift();
    if (line.face && C.images[line.face]) {
      state.faceOverride = line.face;
      state.faceOverrideUntil = now() + C.bubbleSeconds * 1000;
    } else {
      state.faceOverride = null;
    }
    showBubble(line.text);
    return line;
  }

  let bubbleTimer = null;
  function showBubble(text) {
    bubble.textContent = text;
    bubble.classList.remove('on');
    void bubble.offsetWidth;          // アニメーションを最初からやり直すためのおまじない
    bubble.classList.add('on');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('on'), C.bubbleSeconds * 1000);
  }

  /* ---------- 開始 ---------- */
  refreshFace();
  setTimeout(() => showBubble('こんにちは！'), 400);

  /* ---------- ホーム画面に追加して使うための準備（PWA） ----------
     ファイルを直接開いたとき（file://）は動かないので、そのときは何もしません */
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
