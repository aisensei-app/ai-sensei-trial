/* =========================================================
   タヌくん 本体プログラム
   ふだん調整するのは config.js（設定）と lines.js（セリフ）だけでOKです。
   ========================================================= */
(function () {
  'use strict';

  const C = window.TANU_CONFIG;
  const LINES = window.TANU_LINES || [];
  const SAVE = window.TanuSave;
  const DEMO = window.TANU_DEMO || null;   // お試し版のときだけある（demo.js）
  const $ = (id) => document.getElementById(id);

  const area   = $('tanu-area');
  const move   = $('tanu-move');    // 隠れる・戻る（スライド）
  const melt   = $('tanu-melt');    // とろけて横に広がる
  const body   = $('tanu-body');    // ぷるん・よじり・震え
  const img    = $('tanu-img');
  const bellyLayer = $('belly-layer');
  const bellyImg   = $('belly-img');
  const partsLayer = $('parts-layer');
  const belly = window.TanuBelly({
    config: C.bellyJiggle, chest: C.chestJiggle, img: img, canvas: $('belly-canvas'),
    bulge: C.crotch && C.crotch.bulge,
    overlay: partsLayer,
    layers: (src) => wornLayers(faceOfSrc[absUrl(src)])
  });
  const bubble = $('bubble');
  const zonesEl = $('zones');

  const PLACE_LABEL = { head: '頭', chestL: 'むね', chestR: 'むね', belly: 'おなか', tail: 'しっぽ', crotch: 'おまた' };
  // タップ範囲 → セリフや記録で使う場所の名前（左右の胸はどちらも chest）
  const PLACE_OF = { chestL: 'chest', chestR: 'chest' };
  // ぷるんと揺れる場所（指をはなしたときにタップ。すべらせると引っぱれる）
  const SOFT = { belly: true, chestL: true, chestR: true };

  /* ---------- いまの状態 ---------- */
  const state = {
    phase: 'active',      // active（ふつう）/ angry（怒り中）/ hidden（隠れ中）/ returning（戻り中）
    taps: [],             // 直近のタップ記録 { time, weight }
    mood: 'normal',       // normal / shy / troubled
    melting: false,
    lastHeadTap: 0,
    meltTimer: null,
    face: null,           // いま表示している絵の名前
    faceSeq: null,        // 順番に切り替える絵 { frames, start }
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
    area.classList.remove('face-' + state.face);
    state.face = name;
    area.classList.add('face-' + name);
    area.classList.toggle('tint-angry', name === 'angry' && !!C.angryTint);
    img.src = C.images[name] || C.images.normal;
    bellyImg.src = img.src;
    // 茂みのときは重ね絵を使わない
    bellyLayer.style.display = name === 'bush' ? 'none' : '';
    renderParts();
  }

  /* =========================================================
     きせかえパーツ（config.js の parts）
     ========================================================= */
  const PARTS = C.parts || {};
  const partImgs = {};   // 部品の絵（先に読み込んでおく）
  Object.keys(PARTS).forEach((slot) => {
    PARTS[slot].items.forEach((it) => {
      const im = new Image();
      im.src = it.image;
      partImgs[it.id] = im;
    });
  });
  // 絵の URL → 表情の名前（変形の計算で、その表情に付ける部品を調べるため）
  const absUrl = (src) => new URL(src, location.href).href;
  const faceOfSrc = {};
  Object.keys(C.images).forEach((k) => { faceOfSrc[absUrl(C.images[k])] = k; });

  const findPart = (slot, id) => (PARTS[slot] ? PARTS[slot].items : []).filter((it) => it.id === id)[0];
  const unlocked = (it) => DEMO ? false : SAVE.hearts() >= (it.hearts || 0);

  // いま付けている部品（その表情で見せるものだけ）。お試し版では付けない
  function wornLayers(face) {
    if (DEMO) return [];
    const wear = SAVE.data.wear || {};
    const out = [];
    Object.keys(PARTS).forEach((slot) => {
      const it = findPart(slot, wear[slot]);
      if (!it || !unlocked(it)) return;
      if ((it.hideOn || ['bush']).indexOf(face) >= 0) return;
      out.push({ img: partImgs[it.id], x: it.x, y: it.y, width: it.width });
    });
    return out;
  }

  // ふだんの表示：<img> を絵の上の同じ位置に重ねる
  function renderParts() {
    partsLayer.textContent = '';
    wornLayers(state.face).forEach((l) => {
      const el = document.createElement('img');
      el.src = l.img.src;
      el.alt = '';
      el.draggable = false;
      if (l.width != null) {
        Object.assign(el.style, { left: l.x + '%', top: l.y + '%', width: l.width + '%' });
      } else {
        el.className = 'full';
      }
      partsLayer.appendChild(el);
    });
  }

  // おなかの重ね絵の位置（file:// で網目の変形が使えないときの代わり。config.js の bellyJiggle）
  const BJ = C.bellyJiggle;
  [['--bx', BJ.x], ['--by', BJ.y], ['--brx', BJ.rx * 1.15], ['--bry', BJ.ry * 1.15]].forEach((v) => {
    area.style.setProperty(v[0], v[1] + '%');
  });

  // いまの状態から、出すべき絵を決める（上にあるものほど優先）
  function currentFace() {
    if (state.phase === 'angry')  return 'angry';
    if (state.phase === 'hidden') return 'bush';
    if (state.faceSeq) {
      const i = Math.floor((now() - state.faceSeq.start) / C.bellyFaceMs);
      if (i < state.faceSeq.frames.length) return state.faceSeq.frames[i];
      state.faceSeq = null;
    }
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

  /* 頭・しっぽは、さわった瞬間に反応。
     おなか・胸は Windows版と同じく「指をはなしたとき」にタップ。
     指を置いている間はへこみ、指をすべらせると引っぱれる（はなすと、ばねで戻る） */
  let press = null;   // おなか・胸を押している指 { id, part, x, y, pulling }
  const toImg = () => img.naturalWidth / area.clientWidth;   // 画面 → 画像の倍率
  const DRAG_START = 8;   // この距離（画面のピクセル）以上動いたら「引っぱり」

  area.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (mode === 'name') return;
    if (mode === 'home') { enterPlay(); return; }
    if (state.phase === 'hidden') { onHiddenTap(); return; }
    const zone = e.target.closest('[data-place]');
    if (!zone) return;
    const part = zone.dataset.place;
    if (SOFT[part] && state.phase === 'active') {
      press = { id: e.pointerId, part: part, x: e.clientX, y: e.clientY, pulling: false };
      try { area.setPointerCapture(e.pointerId); } catch (err) {}
      if (belly.ready()) {
        const r = area.getBoundingClientRect();
        belly.press(part, (e.clientX - r.left) * toImg(), (e.clientY - r.top) * toImg());
      }
      return;
    }
    onTap(part);
  });

  area.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.id) return;
    const dx = e.clientX - press.x, dy = e.clientY - press.y;
    if (!press.pulling && Math.hypot(dx, dy) < DRAG_START) return;
    if (!belly.ready() || state.phase !== 'active') return;
    if (!belly.canDrag(press.part)) return;   // 胸は引っぱらない（指をはなすと、ぷるん）
    press.pulling = true;
    belly.drag(press.part, dx, dy, toImg());
  });

  function endPress(e, cancel) {
    if (!press || e.pointerId !== press.id) return;
    const p = press;
    press = null;
    if (p.pulling || cancel) { belly.release(p.part, false); return; }
    belly.release(p.part, state.phase === 'active');
    onTap(p.part, e);
  }
  area.addEventListener('pointerup', (e) => endPress(e, false));
  area.addEventListener('pointercancel', (e) => endPress(e, true));

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
  function onTap(zonePlace, ev) {
    if (state.phase !== 'active') return;
    const place = PLACE_OF[zonePlace] || zonePlace;   // chestL / chestR → chest
    const t = now();
    if (place === 'crotch' && C.crotch) { touchCrotch(t); return; }
    const w = C.countWeight[place] != null ? C.countWeight[place] : 1;
    state.taps.push({ time: t, weight: w });

    const mood = moodFromCount(tapCount(t));
    if (mood === 'angry') { getAngry(); return; }
    state.mood = mood;

    track('tap.' + place);
    if (!DEMO && SAVE.addTapPoint()) heartUp();

    let scene = 'tap';
    if (place === 'head')  scene = petHead(t);
    if (place === 'belly') { jiggleBelly(); popWord(ev); }
    if (place === 'tail')  wiggleTail();

    say({ scene: scene, place: place, mood: mood });
    if (place === 'belly') playFaces(C.bellyFaces && C.bellyFaces[mood]);
    refreshFace();
  }

  /* ---- おまた：なかよし度で反応が変わる（config.js の crotch） ----
     angry（すぐ怒る）→ moji（モジモジ）→ dere（デレる。ハート最大で少しふくらむ） */
  function crotchStage() {
    const h = SAVE.hearts(), S = C.crotch.stages;
    if (h >= S.dere) return 'dere';
    if (h >= S.moji) return 'moji';
    return 'angry';
  }

  function touchCrotch(t) {
    const CR = C.crotch;
    const stage = crotchStage();
    track('tap.crotch');
    // なかよしになる前は、すぐ怒って隠れる
    if (stage === 'angry') { getAngry({ place: 'crotch' }); return; }

    state.taps.push({ time: t, weight: CR.weight[stage] != null ? CR.weight[stage] : 1 });
    const mood = moodFromCount(tapCount(t));
    if (mood === 'angry') { getAngry({ place: 'crotch' }); return; }
    state.mood = mood;
    if (!DEMO && SAVE.addTapPoint()) heartUp();

    const B = CR.bulge;
    const bulge = stage === 'dere' && B && B.amount > 0 && SAVE.hearts() >= B.hearts;
    mojimoji(stage === 'dere' ? 0.6 : 1);
    if (bulge) belly.swell('crotch', B.amount, B.seconds * 1000);

    say({ scene: 'tap', place: 'crotch', stage: bulge ? 'bulge' : stage, mood: mood });
    // セリフに絵の指定がないときは、反応ごとの絵にする
    if (!state.faceOverride && CR.faces[stage] && C.images[CR.faces[stage]]) {
      state.faceOverride = CR.faces[stage];
      state.faceOverrideUntil = now() + C.bubbleSeconds * 1000;
    }
    state.faceSeq = null;
    refreshFace();
  }

  // モジモジ：ひざをすりあわせるように、小さく左右にくねくね（k で大きさ）
  function mojimoji(k) {
    body.animate([
      { transform: 'rotate(0) scale(1, 1)' },
      { transform: 'rotate(' + (-1.6 * k) + 'deg) scale(' + (1 - .012 * k) + ', ' + (1 + .006 * k) + ')' },
      { transform: 'rotate(' + (1.6 * k) + 'deg) scale(' + (1 - .012 * k) + ', ' + (1 + .006 * k) + ')' },
      { transform: 'rotate(' + (-1.2 * k) + 'deg) scale(1, 1)' },
      { transform: 'rotate(' + (0.8 * k) + 'deg) scale(1, 1)' },
      { transform: 'rotate(0) scale(1, 1)' }
    ], { duration: 900, easing: 'ease-in-out' });
  }

  // 絵を順番に切り替える（ぽんぽこ①→②→…）
  let seqTimer = null;
  function playFaces(frames) {
    clearInterval(seqTimer);
    if (!frames || !frames.length) { state.faceSeq = null; return; }
    state.faceSeq = { frames: frames, start: now() };
    seqTimer = setInterval(() => {
      refreshFace();
      if (!state.faceSeq) clearInterval(seqTimer);
    }, Math.max(30, C.bellyFaceMs / 2));
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
      { transform: 'translateY(.8%) scale(1.01, .99)' },
      { transform: 'translateY(0)' }
    ], { duration: 320, easing: 'ease-out' });
    return 'tap';
  }

  function startMelt() {
    clearTimeout(state.meltTimer);
    state.meltTimer = setTimeout(endMelt, C.melt.holdSeconds * 1000);
    if (state.melting) return;
    state.melting = true;
    track('melt');
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

  /* ---- おなか：おなかだけ「ぷるん」
     揺れそのものは、指をはなしたときに belly.js（網目の変形）が出しています ---- */
  function jiggleBelly() {
    if (C.vibrate && navigator.vibrate) navigator.vibrate(15);
    if (!belly.ready()) jiggleBellyLite();
  }

  /* 網目の変形が使えないとき（PC でファイルを直接開いたとき）の代わり：
     おなか部分だけの重ね絵を拡大して揺らす。
     1 より小さくすると下の絵のふちが透けるので、ふくらむ方向だけで揺らします */
  function jiggleBellyLite() {
    const k = BJ.strength == null ? 1 : BJ.strength;
    const s = (x, y) => 'scale(' + (1 + x * k) + ', ' + (1 + y * k) + ')';
    bellyLayer.animate([
      { transform: s(0, 0) },
      { transform: s(.045, .015), offset: .14 },
      { transform: s(.01, .04), offset: .34 },
      { transform: s(.028, .008), offset: .54 },
      { transform: s(.004, .015), offset: .74 },
      { transform: s(0, 0) }
    ], { duration: 900, easing: 'cubic-bezier(.25,.6,.4,1)' });
  }

  /* ---- 「ぽん！」「ぽこ！」：タップした場所から文字がとび出す ---- */
  let wordIndex = 0, lastWordTime = 0;
  function popWord(ev) {
    const W = C.bellyWords;
    if (!W || !W.words || !W.words.length) return;
    const t = now();
    wordIndex = t - lastWordTime < W.comboSeconds * 1000 ? (wordIndex + 1) % W.words.length : 0;
    lastWordTime = t;
    const r = area.getBoundingClientRect();
    const x = ev ? ev.clientX - r.left : r.width * BJ.x / 100;
    const y = ev ? ev.clientY - r.top  : r.height * BJ.y / 100;
    const el = document.createElement('span');
    el.className = 'pop-word';
    el.textContent = W.words[wordIndex];
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    area.appendChild(el);
    const dx = (Math.random() - .5) * 40;
    el.animate([
      { transform: 'translate(-50%, -50%) scale(.6)', opacity: 0 },
      { transform: 'translate(-50%, -110%) scale(1.15)', opacity: 1, offset: .25 },
      { transform: 'translate(calc(-50% + ' + dx + 'px), -220%) scale(1)', opacity: 0 }
    ], { duration: 750, easing: 'ease-out' }).finished.then(() => el.remove(), () => el.remove());
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
  async function getAngry(base) {
    state.phase = 'angry';
    state.faceSeq = null;
    belly.stop();
    track('angry');
    endMelt(true);
    refreshFace();
    say(Object.assign({ scene: 'angry' }, base));

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
    track('hiddenTap');
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
    streakDays: (cond, ctx) => inRange(cond, ctx.streakDays),
    totalDays:  (cond, ctx) => inRange(cond, ctx.totalDays),
    visit:      (cond, ctx) => listHas(cond, ctx.visit),
    part:       (cond, ctx) => listHas(cond, ctx.part),
    stage:      (cond, ctx) => listHas(cond, ctx.stage)
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

  // セリフ選びに使う情報
  function getContext(base) {
    return Object.assign({
      mood: 'normal',
      timeOfDay: timeOfDay(new Date().getHours()),
      friendship: SAVE.hearts(),          // ハートの数
      streakDays: SAVE.data.streak,       // 連続日数
      totalDays: SAVE.data.totalDays      // のべ日数
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
    SAVE.seeLine(line.text);
    if (line.face && C.images[line.face]) {
      state.faceOverride = line.face;
      state.faceOverrideUntil = now() + C.bubbleSeconds * 1000;
    } else {
      state.faceOverride = null;
    }
    showBubble(withName(line.text));
    return line;
  }

  /* セリフの {name} を呼び名に置きかえる。
     名前がないときは「{name}、」「、{name}」ごと消す（例：「{name}、おかえり」→「おかえり」） */
  function withName(text) {
    const name = SAVE.data.name;
    if (name) return text.split('{name}').join(name);
    return text.replace(/[、,]?\{name\}[、,]?/g, '');
  }

  let bubbleTimer = null;
  function showBubble(text, keep) {
    bubble.textContent = text;
    bubble.classList.remove('on');
    void bubble.offsetWidth;          // アニメーションを最初からやり直すためのおまじない
    bubble.classList.add('on');
    clearTimeout(bubbleTimer);
    if (!keep) bubbleTimer = setTimeout(() => bubble.classList.remove('on'), C.bubbleSeconds * 1000);
  }

  /* =========================================================
     メニュー画面（何日目・ハート）と 遊ぶ画面 の切り替え
     ========================================================= */
  let mode = 'home';   // home（メニュー）/ play（遊ぶ）/ name（呼び名を聞く）

  function setMode(m) {
    mode = m;
    ['home', 'play', 'name'].forEach((x) => document.body.classList.toggle('mode-' + x, m === x));
  }

  /* ---- はじめての人に呼び名を聞く ---- */
  let pendingHeartUp = false;
  function askName() {
    setMode('name');
    $('name-input').value = '';
    showBubble('はじめまして！タヌくんだよ\nなんて呼んだらいい？', true);
  }

  function finishName(name) {
    SAVE.setName(name);
    $('name-input').blur();
    setMode('home');
    say({ scene: 'named' });
    if (pendingHeartUp) { pendingHeartUp = false; setTimeout(heartUp, 900); }
  }

  $('name-form').addEventListener('submit', (e) => {
    e.preventDefault();
    finishName($('name-input').value);
  });
  $('name-skip').addEventListener('click', () => finishName(''));

  function enterPlay() {
    setMode('play');
    const C2 = C.images;
    belly.warm([C2.normal, C2.shy, C2.troubled, C2.ponpoko1, C2.ponpoko2, C2.muni].filter(Boolean));
    showBubble('なにしてあそぶ？');
  }

  function backHome() {
    if (state.phase !== 'active') return;   // 怒って隠れている間はもどれない
    endMelt(true);
    setMode('home');
    renderStatus();
    say({ scene: 'home', visit: 'again' });
  }

  $('btn-play').addEventListener('click', enterPlay);
  $('back').addEventListener('click', backHome);

  // ハートの表示（例：💖💖🤍🤍🤍）
  function heartsText() {
    const n = SAVE.hearts();
    const max = C.friendship.heartAt.length;
    return '💖'.repeat(n) + '🤍'.repeat(max - n);
  }

  function renderStatus() {
    const d = SAVE.data;
    $('days-total').textContent = Math.max(1, d.totalDays);
    $('days-streak').textContent = d.streak >= 2 ? 'れんぞく ' + d.streak + ' 日' : '';
    $('menu-hearts').textContent = heartsText();
    $('play-hearts').textContent = heartsText();
  }

  function heartUp() {
    renderStatus();
    toast('💖 なかよし度がアップした！');
    const h = $('play-hearts');
    h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop');
  }

  let toastTimer = null;
  function toast(text) {
    const el = $('toast');
    el.textContent = text;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), 2400);
  }

  // その日はじめてなら記録して、あいさつ
  function checkIn() {
    const r = SAVE.checkIn();
    renderStatus();
    if (!SAVE.data.nameAsked) {
      // 呼び名を聞き終わってから「なかよし度アップ」を出す
      pendingHeartUp = pendingHeartUp || !!r.heartUp;
      if (mode !== 'name') askName();
      return true;
    }
    if (r.heartUp) setTimeout(heartUp, 900);
    if (r.visit === 'again') return false;
    if (mode === 'home') say({ scene: 'home', visit: r.visit });
    return true;
  }

  // 開いたまま日付が変わったときのために、画面に戻ってきたら確認
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !DEMO) checkIn();
  });

  /* =========================================================
     実績・設定のパネル
     ========================================================= */
  const sheet = $('sheet');
  function openSheet(title, html) {
    $('sheet-title').textContent = title;
    $('sheet-body').innerHTML = html;
    sheet.hidden = false;
  }
  function closeSheet() { sheet.hidden = true; }
  $('sheet-close').addEventListener('click', closeSheet);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });

  // 実績（いまは記録の一覧。バッジは次の段階で）
  $('btn-record').addEventListener('click', () => {
    const d = SAVE.data, s = d.stats;
    const total = new Set(LINES.map((l) => l.text)).size;
    const rows = [
      ['なかよし', d.totalDays + ' 日'],
      ['れんぞく（いま／最高）', d.streak + ' 日 ／ ' + d.bestStreak + ' 日'],
      ['頭をなでた', s.tap.head + ' 回'],
      ['むねをさわった', (s.tap.chest || 0) + ' 回'],
      ['おなかをさわった', s.tap.belly + ' 回'],
      ['しっぽをさわった', s.tap.tail + ' 回'],
      ['おまたをさわった', (s.tap.crotch || 0) + ' 回'],
      ['とろけさせた', s.melt + ' 回'],
      ['怒らせちゃった', s.angry + ' 回'],
      ['セリフ図鑑', d.seenLines.length + ' ／ ' + total]
    ];
    openSheet('実績',
      '<table class="rec">' + rows.map((r) => '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>').join('') + '</table>' +
      '<p class="note">バッジ（実績のごほうび）は準備中だよ</p>');
  });

  // きせかえ：場所ごとに「なし」と部品を並べる。選ぶとパネルを閉じて、付けた姿を見せる
  $('btn-wear').addEventListener('click', () => {
    const wear = SAVE.data.wear || {};
    const slots = Object.keys(PARTS);
    let html = '';
    slots.forEach((slot) => {
      const S = PARTS[slot];
      html += '<h3>' + S.label + '</h3><div class="wear-grid">' +
        '<button class="wear-item' + (wear[slot] ? '' : ' on') + '" type="button" data-slot="' + slot + '" data-id="">' +
        '<span class="wear-thumb">✖️</span><span>なし</span></button>';
      S.items.forEach((it) => {
        const open = unlocked(it);
        html += '<button class="wear-item' + (wear[slot] === it.id ? ' on' : '') + '" type="button"' +
          ' data-slot="' + slot + '" data-id="' + it.id + '"' + (open ? '' : ' disabled') + '>' +
          '<span class="wear-thumb"><img src="' + it.image + '" alt=""></span>' +
          '<span>' + (open ? it.name : '🔒 💖×' + it.hearts) + '</span></button>';
      });
      html += '</div>';
    });
    if (!slots.length) html = '<p class="note">まだ部品がないよ</p>';
    openSheet('きせかえ', html + '<p class="note small">なかよし度（💖）が上がると、付けられる部品が増えるよ</p>');
    $('sheet-body').querySelectorAll('.wear-item').forEach((b) => {
      b.addEventListener('click', () => {
        const slot = b.dataset.slot, id = b.dataset.id;
        const changed = (wear[slot] || '') !== id;
        SAVE.setWear(slot, id);
        belly.refresh();
        renderParts();
        closeSheet();
        if (changed) say({ scene: 'wear', part: id || 'none' });
      });
    });
  });

  // 設定
  $('btn-settings').addEventListener('click', () => {
    openSheet('設定',
      '<h3>呼び名</h3>' +
      '<div class="set-row"><input id="set-name" class="name-input" type="text" maxlength="' + SAVE.NAME_MAX + '" placeholder="名前なし">' +
      '<button id="set-name-ok" class="btn" type="button">変更</button></div>' +
      '<p class="note small">空にすると、名前なしで話しかけます</p>' +
      '<h3>記録</h3>' +
      '<p class="note">記録はこのスマホのブラウザの中だけに保存されます。' +
      '<b>ホーム画面に追加</b>して使うと、記録が消えにくくなります。</p>' +
      '<p class="note">iPhone：共有ボタン →「ホーム画面に追加」<br>Android：右上のメニュー →「ホーム画面に追加」</p>' +
      '<button id="btn-reset" class="btn btn-danger" type="button">記録をリセット</button>');
    // 名前は innerHTML に直接入れず、あとから value に入れる（記号が入っても安全なように）
    $('set-name').value = SAVE.data.name;
    $('set-name-ok').addEventListener('click', () => {
      SAVE.setName($('set-name').value);
      closeSheet();
      say({ scene: 'named' });
    });
    const btn = $('btn-reset');
    btn.addEventListener('click', () => {
      // 2回押しで確定（うっかり消さないように）
      if (!btn.dataset.sure) { btn.dataset.sure = '1'; btn.textContent = '本当に消す？（もう一度押す）'; return; }
      SAVE.reset();
      belly.refresh();
      renderParts();
      closeSheet();
      checkIn();
    });
  });

  /* =========================================================
     お試し版（demo.js があるときだけ）
     開いたらすぐ遊べて、遊んだ内容から「診断」→ 結果を X にポストできる
     ========================================================= */
  const demoStats = { head: 0, melt: 0, belly: 0, angry: 0, total: 0 };

  // 遊んだ記録（本編は記録に保存、お試し版はその場だけ数える）
  function track(key) {
    if (!DEMO) { SAVE.count(key); return; }
    const k = key.indexOf('tap.') === 0 ? key.slice(4) : key;
    if (k in demoStats) demoStats[k] += 1;
    if (key.indexOf('tap.') === 0) {
      demoStats.total += 1;
      if (demoStats.total === DEMO.resultAfter) {
        $('btn-result').classList.add('ready');
        toast('🔮 診断できるようになったよ！');
      }
    }
  }

  function demoResult() {
    return DEMO.results.find((r) => r.when(demoStats)) || DEMO.results[DEMO.results.length - 1];
  }

  function shareUrl(r) {
    // 結果ごとのページ（X でカードの絵が結果に合わせて変わる）。公開先が未設定なら今のページ
    if (DEMO.baseUrl) return DEMO.baseUrl + 'r/' + r.id + '.html';
    return location.href.split('?')[0].split('#')[0];
  }

  let lastResult = null;    // 前回の診断結果（結果が変わったことが分かるように）
  let resultOpen = false;

  function showResult() {
    const left = DEMO.resultAfter - demoStats.total;
    if (left > 0) {
      showBubble('もうちょっと遊んでから〜！\n（あと ' + left + ' 回）');
      return;
    }
    const r = demoResult();
    $('toast').classList.remove('on');
    // ハッシュタグは本文に直接書く（hashtags= で渡すと X アプリで消えることがあるため）
    const postText = DEMO.shareText(r) + (DEMO.hashtag ? '\n#' + DEMO.hashtag : '');
    const intent = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(postText) +
      '&url=' + encodeURIComponent(shareUrl(r));
    openSheet('診断結果',
      '<p class="res-lead">きみは…</p>' +
      '<p class="res-title"></p>' +
      '<p class="res-prev" hidden></p>' +
      '<img class="res-img" alt="">' +
      '<p class="res-comment"></p>' +
      '<a class="btn btn-main btn-x" target="_blank" rel="noopener">𝕏 でポストする</a>' +
      '<div class="share-row">' +
      (navigator.share ? '<button class="btn btn-share" type="button">📤 アプリでシェア</button>' : '') +
      '<button class="btn btn-copy" type="button">📋 文章をコピー</button>' +
      '</div>' +
      (navigator.share
        ? '<p class="note small center">X のログイン画面が出たら、「アプリでシェア」から X アプリを選んでね</p>'
        : '<p class="note small center">X のログイン画面が出たら、「文章をコピー」して X アプリに貼りつけてね</p>') +
      '<p class="note small center">タヌくんは、ただいま制作中！<br>完成したら公開するよ。待っててね🦝</p>' +
      (DEMO.followId ? '<a class="btn btn-follow" target="_blank" rel="noopener"></a>' : ''));
    // 文字や URL は、あとから入れる（記号が入っても安全なように）
    const body = $('sheet-body');
    body.querySelector('.res-title').textContent = '「' + r.title + '」';
    body.querySelector('.res-img').src = C.images[r.face] || C.images.normal;
    body.querySelector('.res-comment').textContent = r.comment;
    // 2回目からは、前回とくらべて表示する
    const prev = body.querySelector('.res-prev');
    if (lastResult) {
      prev.hidden = false;
      if (lastResult.id !== r.id) {
        prev.textContent = '🎉 結果が変わったよ！（前回は「' + lastResult.title + '」）';
        prev.classList.add('changed');
      } else {
        prev.textContent = '前回と同じ結果だよ';
      }
    }
    lastResult = r;
    resultOpen = true;
    body.querySelector('.btn-x').href = intent;
    const follow = body.querySelector('.btn-follow');
    if (follow) {
      follow.textContent = '🔔 @' + DEMO.followId + ' をフォローして待つ';
      follow.href = 'https://twitter.com/intent/follow?screen_name=' + encodeURIComponent(DEMO.followId);
    }

    // スマホの「共有」メニューから X アプリなどで投稿（アプリはログイン済みなので、ログイン画面が出ない）
    const text = postText;
    const url = shareUrl(r);
    const share = body.querySelector('.btn-share');
    if (share) {
      share.addEventListener('click', () => {
        navigator.share({ text: text, url: url }).catch(() => {});
      });
    }
    // 文章と URL をコピー（自分で X に貼りつけて投稿）
    body.querySelector('.btn-copy').addEventListener('click', (e) => {
      const btn = e.currentTarget, all = text + '\n' + url;
      const done = () => { btn.textContent = '✅ コピーしました'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(all).then(done, () => copyFallback(all, done));
      } else {
        copyFallback(all, done);
      }
    });
  }

  // 古いブラウザ用のコピー
  function copyFallback(textToCopy, done) {
    const ta = document.createElement('textarea');
    ta.value = textToCopy;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { if (document.execCommand('copy')) done(); } catch (err) {}
    ta.remove();
  }

  function startDemo() {
    document.body.classList.add('demo');
    $('sheet-close').textContent = 'もう一回あそぶ';
    $('btn-result').addEventListener('click', showResult);
    // 診断結果を閉じたら、診断をリセット（もう一度5回さわると、新しく診断できる）
    const resetDemo = () => {
      if (!resultOpen || !$('sheet').hidden) return;
      resultOpen = false;
      Object.keys(demoStats).forEach((k) => { demoStats[k] = 0; });
      $('btn-result').classList.remove('ready');
      showBubble('もう一回、診断してみる？\n（あと ' + DEMO.resultAfter + ' 回さわってね）');
    };
    $('sheet-close').addEventListener('click', resetDemo);
    $('sheet').addEventListener('click', resetDemo);
    const C2 = C.images;
    belly.warm([C2.normal, C2.shy, C2.troubled, C2.ponpoko1, C2.ponpoko2, C2.muni].filter(Boolean));
    setMode('play');
    refreshFace();
    setTimeout(() => showBubble('はじめまして！タヌくんだよ\nさわってみてね'), 400);
  }

  /* ---------- 開始 ---------- */
  if (DEMO) {
    startDemo();
  } else {
    setMode('home');
    refreshFace();
    renderStatus();
    setTimeout(() => { if (!checkIn()) say({ scene: 'home', visit: 'again' }); }, 400);

    /* ---------- ホーム画面に追加して使うための準備（PWA） ----------
       ファイルを直接開いたとき（file://）は動かないので、そのときは何もしません */
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }
})();
