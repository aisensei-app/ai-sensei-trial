/* =========================================================
   タヌくん 本体プログラム
   ふだん調整するのは config.js（設定）と lines.js（セリフ）だけでOKです。
   ========================================================= */
(function () {
  'use strict';

  const C = window.TANU_CONFIG;
  const I18N = window.TanuI18n || { lang: 'ja', LANGS: { ja: '日本語' }, t: (k, ja) => ja, apply: () => {}, set: () => {}, lines: () => window.TANU_LINES || [] };
  // 画面の文字：tr('日本語の文', { n: 3 }) で、いまの言語に（i18n.js の TEXT。訳がなければ日本語のまま）
  const tr = I18N.tr || ((ja, v) => (v ? Object.keys(v).reduce((s, k) => s.split('{' + k + '}').join(v[k]), ja) : ja));
  I18N.apply();
  if (I18N.lang === 'en') document.title = 'Tanu-kun';
  if (I18N.lang === 'zh') document.title = '狸君';
  // いまの言語のセリフ集（i18n.js。訳がなければ日本語）。公開スイッチがまだの機能のセリフ（feature）は入れない
  const LINES = I18N.lines().filter((l) => !l.feature || feature(l.feature) === 'open');
  const SAVE = window.TanuSave;
  // 遊び方の数え方（stats.js。だれのものかわからない形で、数だけ。本番だけ）。お試し版では数えない
  const STATS = (!window.TANU_DEMO && window.TanuStats) || { ping: () => {}, checkIn: () => {} };
  /* 見たセリフの記録（セリフ図鑑）は、言語に関係なく日本語の文で残す（言語を切りかえても数が合うように）。
     英語・中国語のセリフ集は lines.js と同じ順番なので、同じ番号の日本語の文に置きかえる */
  const JA_OF = new Map();
  {
    const ja = window.TANU_LINES || [];
    I18N.lines().forEach((l, i) => JA_OF.set(l, ja[i] ? ja[i].text : l.text));
    // 前に英語・中国語で見たセリフ（その言語の文で記録されている）を、日本語の文に直しておく
    const back = {};
    const ex = window.TANU_LINES_I18N || {};
    Object.keys(ex).forEach((k) => (ex[k] || []).forEach((l, i) => { if (ja[i]) back[l.text] = ja[i].text; }));
    const seen = (SAVE.data.seenLines || []);
    const fixed = seen.map((t) => back[t] || t).filter((t, i, a) => a.indexOf(t) === i);
    if (fixed.length !== seen.length || fixed.some((t, i) => t !== seen[i])) SAVE.setSeenLines(fixed);
  }
  const jaOf = (l) => JA_OF.get(l) || l.text;
  const DEMO = window.TANU_DEMO || null;   // お試し版のときだけある（demo.js）
  // X アプリの中で開いたとき（UA に Twitter）：画面の下に X の投稿パネルとボタンがかぶさるので、
  // style.css の body.in-x で、下に余白を空けて中身を上に寄せる。確認用に URL の ?inx でも
  if (/Twitter/i.test(navigator.userAgent) || /[?&]inx\b/.test(location.search)) document.body.classList.add('in-x');
  const $ = (id) => document.getElementById(id);

  // 下に続きがあるときの目印（2026-11-02）：スクロールできる枠の下のはしを、背景の色へ うすくぼかして、小さな ︾ を出す。
  // いちばん下まで見たら消える。色は CSS の .scroll-more（--fade・--chev）
  function scrollHint(el) {
    if (!el) return;
    el.classList.add('scroll-more');
    let q = 0;
    const upd = () => { q = 0; el.classList.toggle('more', el.scrollHeight - el.scrollTop - el.clientHeight > 8); };
    const soon = () => { if (!q) q = requestAnimationFrame(upd); };
    el.addEventListener('scroll', soon, { passive: true });
    window.addEventListener('resize', soon);
    if (window.ResizeObserver) new ResizeObserver(soon).observe(el);
    if (window.MutationObserver) new MutationObserver(soon).observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'src'] });
    el.addEventListener('load', soon, true);   // 絵が読みこまれて高さが変わったとき
    soon();
  }
  scrollHint(document.querySelector('#sheet .sheet-box'));
  /* ---- ことばの切りかえ（左上の「🌐 日本語 ▾」。言語が2つ以上のときだけ出す。設定からも変えられる）----
     押すと、使える言語の一覧が出て、選ぶとその言語で開きなおす（i18n.js の bind・menu。ぽんぽこ・ラリーと共通） */
  const LANG_KEYS = Object.keys(I18N.LANGS);
  const langMenu = (el) => (I18N.menu ? I18N.menu(el) : null);
  if (I18N.bind) I18N.bind($('btn-lang'));

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
    tail: C.crotch && C.crotch.tail,
    overlay: partsLayer,
    layers: (src) => wornLayers(faceOfSrc[absUrl(src)])
  });
  const bubble = $('bubble');
  let POST = null;   // タヌくんのポスト（post.js。お手紙）
  let URANAI = null; // 貝がら占い（uranai.js。下の「トップ画面」で作る。お試し版では使わない）
  let HOME = null;   // トップ画面（home.js。下の「トップ画面」で作る。お試し版では使わない）
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
    recentTexts: [],      // 同じセリフが続かないように覚えておく
    crotchWarnAt: 0       // おまたで「次さわったら怒るよ」と注意した時刻（なかよしになる前）
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

  // 新しい機能の公開スイッチ（config.js の features）：'open'・'soon'（🔒 もうすぐ）・'hidden'。書いていなければ 'open'
  function feature(name) { return (C.features && C.features[name]) || 'open'; }
  // 丸太シーソーを一度でも開いたか（seesaw.js が覚える。トップ画面の NEW を消す）
  function seesawSeen() { try { return localStorage.getItem('tanukun.seesawSeen') === '1'; } catch (e) { return false; } }

  /* =========================================================
     時間帯（config.js の timeOfDay）：メニュー画面の立ち絵と、背景が変わる
     ========================================================= */
  const TF = (!DEMO && C.tailFlick && feature('tailFlick') === 'open') ? C.tailFlick : null;   // しっぽをはじく
  const TB = (!DEMO && C.timeOfDay && feature('timeOfDay') === 'open') ? C.timeOfDay : null;
  let testBand = null;   // 確認用：時間帯を切りかえて試す（設定の「確認用」）
  // 確認用：URL の ?time=morning（day・evening・night・late）でも切りかえられる
  { const m = location.search.match(/[?&]time=(\w+)/); if (TB && m && TB.bands.some((b) => b.id === m[1])) testBand = m[1]; }
  function bandNow() {
    if (!TB) return null;
    if (testBand) return TB.bands.filter((b) => b.id === testBand)[0];
    const h = new Date().getHours();
    let cur = TB.bands[TB.bands.length - 1];   // いちばん上より前の時間（夜中）は、いちばん下の時間帯
    TB.bands.forEach((b) => { if (h >= b.from) cur = b; });
    return cur;
  }
  const atHome = () => document.body.classList.contains('mode-home');
  // メニュー画面で出す、時間帯の立ち絵（なければ null。いつもの表情の絵になる）
  function timeStand() {
    const b = bandNow();
    return b && b.image && atHome() && state.phase === 'active' ? b.image : null;
  }
  // 時間帯の立ち絵の名前（きせかえ部品の位置 faces に使う。time_morning など）
  function standKey() {
    const b = bandNow();
    return timeStand() ? 'time_' + b.id : null;
  }
  const sleeping = () => { const b = bandNow(); return !!(b && b.sleep && atHome()); };
  // 時間帯を画面に反映（背景の色・立ち絵・寝ている演出）
  function applyTime() {
    const b = bandNow();
    document.body.dataset.time = b ? b.id : '';
    document.body.classList.toggle('sleeping', sleeping());
    setFace(state.face, true);
  }
  if (TB) {
    TB.bands.forEach((b) => {
      if (!b.image) return;
      new Image().src = b.image;
    });
    const n = TB.nose || { x: 50, y: 33 };
    $('sleep-fx').style.left = n.x + '%';
    $('sleep-fx').style.top = n.y + '%';
    // 開いたまま時間がたったときのために、1分ごとに確かめる
    setInterval(() => { if (atHome()) applyTime(); }, 60 * 1000);
  }

  function setFace(name, force) {
    if (state.face === name && !force) return;
    area.classList.remove('face-' + state.face);
    state.face = name;
    area.classList.add('face-' + name);
    area.classList.toggle('tint-angry', name === 'angry' && !!C.angryTint);
    const stand = timeStand();
    area.classList.toggle('time-stand', !!stand);
    img.src = stand || C.images[name] || C.images.normal;
    bellyImg.src = img.src;
    // 茂みのときは重ね絵を使わない
    bellyLayer.style.display = name === 'bush' ? 'none' : '';
    renderParts();
  }

  /* =========================================================
     きせかえパーツ（config.js の parts）
     ========================================================= */
  const PARTS = C.parts || {};
  const partImgs = {};   // 部品の絵（先に読み込んでおく。お試し版では使わないので読まない）
  if (!DEMO) Object.keys(PARTS).forEach((slot) => {
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
  // 時間帯の立ち絵 → time_＋時間帯の id（揺れの絵にも、その立ち絵の位置で部品を重ねる）
  if (TB) TB.bands.forEach((b) => { if (b.image) faceOfSrc[absUrl(b.image)] = 'time_' + b.id; });

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
      const at = (it.faces && it.faces[face]) || it;   // 絵によって位置がちがうとき
      out.push({ img: partImgs[it.id], x: at.x, y: at.y, width: at.width || it.width });
    });
    return out;
  }

  // ふだんの表示：<img> を絵の上の同じ位置に重ねる
  function renderParts() {
    partsLayer.textContent = '';
    wornLayers(standKey() || state.face).forEach((l) => {
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
    el.setAttribute('aria-label', tr('{p}をさわる', { p: tr(PLACE_LABEL[place] || place) }));
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

  let lastPointer = null;   // さわった場所（画面の位置）。「+1」のハートを飛ばすのに使う
  area.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    lastPointer = { x: e.clientX, y: e.clientY };
    if (mode === 'name') return;
    if (mode === 'home') { enterPlay(); return; }
    if (state.phase === 'hidden') { onHiddenTap(); return; }
    const zone = e.target.closest('[data-place]');
    if (!zone) return;
    const part = zone.dataset.place;
    // しっぽをはじく（公開スイッチ tailFlick）：押さえて指を動かすと曲がる。はなしたときに反応
    if (part === 'tail' && TF && state.phase === 'active' && belly.ready()) {
      press = { id: e.pointerId, part: part, x: e.clientX, y: e.clientY, pulling: false, tail: true, angle: 0 };
      try { area.setPointerCapture(e.pointerId); } catch (err) {}
      return;
    }
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
    if (press.tail) {
      // 付け根を中心に、指が回った角度だけ曲げる
      const r = area.getBoundingClientRect(), T = C.crotch.tail;
      const ox = r.left + r.width * T.pivotX / 100, oy = r.top + r.height * T.pivotY / 100;
      const ax = press.x - ox, ay = press.y - oy, bx = e.clientX - ox, by = e.clientY - oy;
      press.pulling = true;
      press.angle = Math.atan2(ax * by - ay * bx, ax * bx + ay * by) * (TF.bend || 1);
      belly.bend('tail', press.angle);
      return;
    }
    if (!belly.canDrag(press.part)) return;   // 胸は引っぱらない（指をはなすと、ぷるん）
    press.pulling = true;
    belly.drag(press.part, dx, dy, toImg());
  });

  function endPress(e, cancel) {
    if (!press || e.pointerId !== press.id) return;
    const p = press;
    press = null;
    if (p.tail) {
      belly.letGo('tail');
      if (cancel) return;
      if (!p.pulling) { onTap('tail', e); return; }
      // はじいた：大きく曲げてはなしたら「ブワッ」（しっぽが逆立つ）
      const big = Math.abs(p.angle) >= (TF.strong || 0.35);
      if (big) {
        setTimeout(() => {
          belly.puff('tail', TF.puff || 0.2, TF.puffMs || 1400);
          if (TF.shiver) belly.shiver('tail', TF.shiver[0], TF.shiver[1]);
        }, 120);
      }
      onTap('tail', e, big ? 'big' : 'flick');
      return;
    }
    if (cancel) { belly.release(p.part, false); return; }
    if (p.pulling) {
      // 引っぱってはなした：ばねで「びよ〜ん」と戻る。さわった1回として数える（ハート・レポート・セリフ）
      belly.release(p.part, false);
      onTap(p.part, e, true);
      return;
    }
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
  function onTap(zonePlace, ev, pulled) {
    if (state.phase !== 'active') return;
    const place = PLACE_OF[zonePlace] || zonePlace;   // chestL / chestR → chest
    const t = now();
    countReport(place);
    if (place === 'crotch' && C.crotch) { touchCrotch(t); return; }
    const w = C.countWeight[place] != null ? C.countWeight[place] : 1;
    state.taps.push({ time: t, weight: w });

    const mood = moodFromCount(tapCount(t));
    if (mood === 'angry') { getAngry(); return; }
    state.mood = mood;

    track('tap.' + place);
    gainTapPoint();

    let scene = 'tap';
    if (place === 'head')  scene = petHead(t);
    if (place === 'belly') { jiggleBelly(); popWord(ev, pulled ? C.bellyWords.pull : null); }
    if (place === 'tail' && !pulled) wiggleTail();
    if (pulled) scene = 'pull';   // 引っぱったときのセリフ（lines.js の scene: 'pull'）
    // しっぽをはじいたとき（scene: 'flick'、大きくはじいて逆立ったら 'flickBig'）
    if (place === 'tail' && pulled) {
      scene = pulled === 'big' ? 'flickBig' : 'flick';
      popWord(ev, tr(pulled === 'big' ? 'ブワッ！' : 'ぶるるん♪'));
    }

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
    // なかよしになる前：1回目は注意だけ、続けてさわると怒って隠れる
    if (stage === 'angry') {
      if (state.crotchWarnAt && t - state.crotchWarnAt < (CR.warnSeconds || 10) * 1000) {
        state.crotchWarnAt = 0;
        getAngry({ place: 'crotch' });
        return;
      }
      state.crotchWarnAt = t;
      state.faceSeq = null;
      say({ scene: 'tap', place: 'crotch', stage: 'warn' });
      if (!state.faceOverride) {
        state.faceOverride = 'angry';
        state.faceOverrideUntil = now() + C.bubbleSeconds * 1000;
      }
      // ぷいっと、小さく身ぶるい
      body.animate([
        { transform: 'translateX(0)' }, { transform: 'translateX(-1.2%)' },
        { transform: 'translateX(1.2%)' }, { transform: 'translateX(0)' }
      ], { duration: 260, easing: 'ease-in-out' });
      refreshFace();
      return;
    }

    state.taps.push({ time: t, weight: CR.weight[stage] != null ? CR.weight[stage] : 1 });
    const mood = moodFromCount(tapCount(t));
    if (mood === 'angry') { getAngry({ place: 'crotch' }); return; }
    state.mood = mood;
    gainTapPoint();

    const B = CR.bulge;
    const bulge = stage === 'dere' && B && B.amount > 0 && SAVE.hearts() >= B.hearts;
    mojimoji(stage === 'dere' ? 0.6 : 1);
    // しっぽが「ビクン」（反応ごとに大きさがちがう）
    const TT = CR.tail;
    const angle = TT && TT.angles && TT.angles[bulge ? 'bulge' : stage];
    if (angle) setTimeout(() => belly.twitch('tail', angle), (TT.delay || 0) * 1000);
    // ふくらんでいる最中にさわったら「ぷるん」
    if (bulge && B.poke && belly.swelling('crotch')) belly.bounce('crotch', B.amount * B.poke);
    if (bulge) belly.swell('crotch', B.amount, B.seconds * 1000);

    say({ scene: 'tap', place: 'crotch', stage: bulge ? 'bulge' : stage, mood: mood });
    // セリフに絵の指定がないときは、反応ごとの絵にする
    const face = CR.faces[bulge ? 'bulge' : stage] || CR.faces[stage];
    if (!state.faceOverride && face && C.images[face]) {
      state.faceOverride = face;
      // ふくらんでいる間は、その絵のままにする
      state.faceOverrideUntil = now() + Math.max(C.bubbleSeconds, bulge ? B.seconds : 0) * 1000;
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
  function popWord(ev, word) {
    const W = C.bellyWords;
    if (!W || !W.words || !W.words.length) return;
    const t = now();
    if (!word) {
      wordIndex = t - lastWordTime < W.comboSeconds * 1000 ? (wordIndex + 1) % W.words.length : 0;
      lastWordTime = t;
    }
    const r = area.getBoundingClientRect();
    const x = ev ? ev.clientX - r.left : r.width * BJ.x / 100;
    const y = ev ? ev.clientY - r.top  : r.height * BJ.y / 100;
    const el = document.createElement('span');
    el.className = 'pop-word';
    el.textContent = word || W.words[wordIndex];
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
  // 怒る〜隠れる〜戻ってくる の流れの番号。「もどる」でトップ画面へ行ったら番号を進めて、続きを止める（calmDown）
  let hideToken = 0, comeTimer = 0;
  async function getAngry(base) {
    const tk = hideToken;
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

    if (tk !== hideToken) return;
    await hide(tk);
  }

  async function hide(tk) {
    // しゅっと下に引っこむ
    const out = move.animate([
      { transform: 'translateY(0) scale(1)', opacity: 1 },
      { transform: 'translateY(20%) scale(.9, .8)', opacity: 0 }
    ], { duration: 260, easing: 'ease-in', fill: 'forwards' });
    await out.finished;
    if (tk !== hideToken) { out.cancel(); return; }

    state.phase = 'hidden';
    refreshFace();   // 茂みの絵に
    out.cancel();
    move.animate([
      { transform: 'translateY(8%) scale(.9)', opacity: 0 },
      { transform: 'translateY(0) scale(1)', opacity: 1 }
    ], { duration: 320, easing: 'cubic-bezier(.3,1.5,.5,1)' });

    comeTimer = setTimeout(comeBack, rand(C.hide.minSeconds, C.hide.maxSeconds) * 1000);
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
    const tk = hideToken;
    state.phase = 'returning';
    rustle();
    await wait(420);
    if (tk !== hideToken) return;

    const out = move.animate([
      { opacity: 1 }, { opacity: 0 }
    ], { duration: 150, fill: 'forwards' });
    await out.finished;
    if (tk !== hideToken) { out.cancel(); return; }

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

  // セリフの時間帯（config.js の timeOfDay と同じ区切り。夜中 late も night のセリフを使う）
  function timeOfDay(h) {
    const b = bandNow();
    if (b) return b.id === 'late' ? 'night' : b.id;
    if (h >= 5 && h <= 9)   return 'morning';
    if (h >= 10 && h <= 15) return 'day';
    if (h >= 16 && h <= 18) return 'evening';
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

  // セリフを選んで、見たことを記録（表示はしない）。表情の指定があれば、しばらくその絵に
  function takeLine(base) {
    const line = pickLine(base);
    if (!line) return null;
    state.recentTexts.push(line.text);
    if (state.recentTexts.length > 3) state.recentTexts.shift();
    SAVE.seeLine(jaOf(line));
    if (line.face && C.images[line.face]) {
      state.faceOverride = line.face;
      state.faceOverrideUntil = now() + C.bubbleSeconds * 1000;
    } else {
      state.faceOverride = null;
    }
    return line;
  }

  function say(base) {
    // 寝ているあいだのメニュー画面は、あいさつの代わりに寝息
    if (base.scene === 'home' && sleeping()) { showBubble(tr('すぴー… すぴー…')); return null; }
    const line = takeLine(base);
    if (line) showBubble(withName(line.text));
    return line;
  }

  /* セリフの {name} を呼び名に置きかえる。名前がないときは：
     ・呼びかけは消す（「{name}、おかえり」→「おかえり」、「おかえり、{name}！」→「おかえり！」）
     ・文の途中は「きみ」にする（「{name}になでられるの、すき」→「きみになでられるの、すき」） */
  function withName(text) {
    const name = SAVE.data.name;
    if (name) return text.split('{name}').join(name);
    // 中国語：呼びかけ（「{name}，」「，{name}！」）は消して、文の途中は「你」
    if (I18N.lang === 'zh') {
      return text
        .replace(/^\{name\}[，,]\s*/, '').replace(/[，,]\s*\{name\}(?=[！!。？?～~…♪]|$)/g, '')
        .split('{name}').join('你');
    }
    // 英語：呼びかけ（「{name}, 」「, {name}」）は消して、文の途中は you（文のはじめなら You）
    if (I18N.lang === 'en') {
      return text
        .replace(/^\{name\}, /, '').replace(/, \{name\}(?=[!?.~…]|$)/g, '')
        .replace(/^\{name\}/, 'You').split('{name}').join('you')
        .replace(/^./, (c) => c.toUpperCase());
    }
    return text
      .replace(/[、,]\{name\}(?=[！!。〜…？?♪]|$)/g, '')
      .replace(/\{name\}[、,]/g, '')
      .split('{name}').join('きみ');
  }

  let bubbleTimer = null;
  const MOUTH_X = 282 / 720;   // タヌくんの口の横の位置（絵の幅に対する割合）。ふきだしのしっぽを、ここに付ける
  function showBubble(text, keep) {
    // トップ画面では、トップ画面のふきだし（ズーム中は口から、ズーム前は頭の上）
    if (mode === 'home' && HOME) { HOME.say(text, keep); return; }
    bubble.textContent = text;
    bubble.classList.remove('on');
    void bubble.offsetWidth;          // アニメーションを最初からやり直すためのおまじない
    // しっぽ：口がふきだしのまんなかより右なら右下へ、左なら左下へ曲げる
    const ir = $('tanu-img').getBoundingClientRect(), br = bubble.getBoundingClientRect();
    if (ir.width && br.width) {
      const mouth = ir.left + ir.width * MOUTH_X, mid = br.left + br.width / 2, w = bubble.offsetWidth;
      bubble.style.setProperty('--tail', Math.max(22, Math.min(w - 22, mouth - mid + w / 2)) + 'px');
      bubble.classList.toggle('tail-l', mouth < mid);
      bubble.classList.toggle('tail-r', mouth >= mid);
    }
    bubble.classList.add('on');
    clearTimeout(bubbleTimer);
    if (!keep) bubbleTimer = setTimeout(() => bubble.classList.remove('on'), C.bubbleSeconds * 1000);
  }

  /* =========================================================
     メニュー画面（何日目・ハート）と 遊ぶ画面 の切り替え
     ========================================================= */
  let mode = 'home';   // home（メニュー）/ play（遊ぶ）/ name（呼び名を聞く）

  /* ---- 画面を切りかえるときの幕（style.css の .veil。色は時間帯の背景に合わせる） ----
     veilIn：幕がかかりきったら次へ（Promise）／veilOut：幕が明ける／veilArrive：開いたときに、幕がかかった所から明ける */
  const veil = $('veil');
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function veilIn() {
    veil.classList.remove('arrive');
    veil.classList.add('on');
    return new Promise((r) => setTimeout(r, reduced() ? 30 : 450));
  }
  function veilOut() { setTimeout(() => veil.classList.remove('on'), 60); }
  function veilArrive() {
    // ゲームから戻ってきたとき：こげ茶の画面から、丸く開いて明ける（iris.js。ゲームを出るときに丸く閉じたのと対になる）
    if (window.TanuIris) {
      window.TanuIris.cover();
      document.documentElement.classList.remove('arriving');
      requestAnimationFrame(() => requestAnimationFrame(() => window.TanuIris.open()));
      return;
    }
    veil.classList.add('arrive');
    document.documentElement.classList.remove('arriving');
    setTimeout(() => veil.classList.remove('arrive'), 800);
  }

  function setMode(m) {
    mode = m;
    ['home', 'play', 'name'].forEach((x) => document.body.classList.toggle('mode-' + x, m === x));
    applyTime();
    if (m === 'home' && HOME) HOME.layout();   // 見えるようになったので、大きさを測りなおす
  }

  /* ---- はじめての人に呼び名を聞く ---- */
  let pendingHeartUp = false;
  function askName() {
    setMode('name');
    $('name-input').value = '';
    showBubble(tr('はじめまして！タヌくんだよ\nなんて呼んだらいい？'), true);
  }

  function finishName(name) {
    SAVE.setName(name);
    $('name-input').blur();
    setMode('home');
    homeGreet({ scene: 'named' });
    if (pendingHeartUp) { pendingHeartUp = false; holdHome(1200); setTimeout(heartUp, 900); }
  }

  $('name-form').addEventListener('submit', (e) => {
    e.preventDefault();
    finishName($('name-input').value);
  });
  $('name-skip').addEventListener('click', () => finishName(''));

  let waking = false;
  // awake … トップ画面で、もう起こしてある（寝ている時間でも「ふぁ…？」をくり返さない）
  function enterPlay(awake) {
    if (waking) return;
    STATS.ping('p-pet');
    const b = mode === 'home' ? bandNow() : null;
    const go = () => {
      setMode('play');
      const C2 = C.images;
      belly.warm([C2.normal, C2.shy, C2.troubled, C2.ponpoko1, C2.ponpoko2, C2.muni, C2.dere].filter(Boolean));
      // 時間帯のひとことで、メニューの立ち絵から遊ぶ画面へつなぐ（「起こされちゃった」「よし、遊ぼう！」）
      showBubble(b && b.wake ? withName(b.wake) : tr('なにしてあそぶ？'));
    };
    if (b && b.sleep && !awake) {
      // 寝ているとき：「ふぁ…？」と目をさましてから（0.7秒。待たせすぎない）
      waking = true;
      document.body.classList.add('waking');
      showBubble(tr('ふぁ…？'));
      setTimeout(() => { waking = false; document.body.classList.remove('waking'); go(); }, 700);
      return;
    }
    go();
  }

  // 怒っている・隠れている途中で「もどる」を押したとき：続きを止めて、ふつうのタヌくんに戻しておく
  // （2026-11-02 ユーザーの要望で、隠れている間も もどれるように。前は もどれなかった）
  function calmDown() {
    hideToken += 1;
    clearTimeout(comeTimer);
    [body, move].forEach((el) => { if (el.getAnimations) el.getAnimations().forEach((a) => a.cancel()); });
    state.taps = [];
    state.mood = 'normal';
    state.phase = 'active';
    refreshFace();
  }
  let leaving = false;
  function backHome() {
    if (leaving) return;
    const upset = state.phase !== 'active';
    if (upset) { hideToken += 1; clearTimeout(comeTimer); }   // 幕がかかる間に、戻ってくる続きが始まらないように
    // 幕がふわっとかかってから、トップ画面へ（明けるときは、ズームしたおなかの画面）
    leaving = true;
    veilIn().then(() => { leaving = false; if (upset) calmDown(); showHome(); veilOut(); });
  }
  function showHome() {
    endMelt(true);
    setMode('home');
    renderStatus();
    // トップ画面は、あいさつを飛ばして、ズームした画面から（ひとことは「なにしてあそぶ？」など）
    const line = takeLine({ scene: 'home', visit: 'again' });
    if (HOME) HOME.zoomNow(line ? withName(line.text) : '');
    setTimeout(suggestHomeScreen, 1200);
    maybeFeedback();
  }

  $('btn-play').addEventListener('click', () => enterPlay());
  $('back').addEventListener('click', backHome);

  /* ---- なかよし度のハート ----
     もらったハートはピンク、次のハートは下から少しずつピンクに満ちていく、まだのハートは白 */
  const HEART = '<svg viewBox="0 0 24 24"><path d="M12 21.2S2.6 15.6 2.6 8.9C2.6 5.9 4.9 3.6 7.7 3.6c1.9 0 3.4 1 4.3 2.5.9-1.5 2.4-2.5 4.3-2.5 2.8 0 5.1 2.3 5.1 5.3 0 6.7-9.4 12.3-9.4 12.3z"/></svg>';
  function heartsHtml() {
    const n = SAVE.hearts(), max = C.friendship.heartAt.length, frac = SAVE.heartProgress();
    let html = '';
    for (let i = 0; i < max; i++) {
      const fill = i < n ? 100 : (i === n ? Math.round(frac * 100) : 0);
      html += '<span class="hrt' + (i < n ? ' got' : '') + (i === n ? ' next' : '') + '">' + HEART +
        '<span class="fill" style="height:' + fill + '%">' + HEART + '</span></span>';
    }
    return html;
  }

  // さわってポイントが入ったら、さわった場所から「+1」のハートが右上へ飛んでいく
  let capNotified = null;
  const heartsFull = () => SAVE.hearts() >= C.friendship.heartAt.length;
  function gainTapPoint() {
    if (DEMO) return;
    const r = SAVE.addTapPoint();
    if (!r.added) {
      // 今日の上限のあと：ハートの代わりに「💤」（今はためられない）。お知らせがまだなら出す
      if (!heartsFull()) { floatMark('💤'); notifyCap(); }
      return;
    }
    const full = heartsFull() && !r.heartUp;
    if (!full) flyHeart();
    setTimeout(() => {
      renderStatus();
      if (r.heartUp) heartUp();
      // ちょうど上限になったら、その場でお知らせ（ハートが増えたときは、思い出のあとの次のタップで）
      else if (SAVE.tapCapped() && !full) notifyCap();
    }, full ? 0 : 520);
  }

  /* ---- 今日のハートの上限 ----
     お知らせ（1日1回）と、ハートの下の「🌙 あと○時間○分」（次の日付の切りかわり＝午前4時まで） */
  function untilTomorrow() {
    const now = new Date(), next = new Date(now);
    next.setHours(C.days.dayStartHour || 0, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const min = Math.max(1, Math.ceil((next - now) / 60000));
    const h = Math.floor(min / 60), m = min % 60;
    return (h ? tr('{h}時間', { h: h }) : '') + (m || !h ? tr('{m}分', { m: m }) : '');
  }
  function notifyCap() {
    if (capNotified === SAVE.today()) return;
    capNotified = SAVE.today();
    // 明日の予告（いまのハートの数ごと。クリアしていたら最後の文）
    const T = C.friendship.teasers || [];
    const teaser = SAVE.data.cleared ? T[T.length - 1] : T[Math.min(SAVE.hearts(), T.length - 2)];
    toast(tr('今日のハートは ここまで！🌙') + '\n' + (teaser || tr('また明日なかよくしよう')) +
      '\n' + tr('あと {t} で、またためられるよ', { t: untilTomorrow() }), 4200);
  }
  function renderCapNote() {
    const el = $('cap-note');
    const on = !DEMO && SAVE.tapCapped() && !heartsFull();
    el.hidden = !on;
    if (on) el.textContent = tr('🌙 あと{t}', { t: untilTomorrow() });
    $('home-cap').hidden = !on;
    $('home-cap').textContent = el.textContent;
  }
  setInterval(renderCapNote, 30000);

  // さわった所に、小さな印をふわっと出す（💤 など）
  function floatMark(text) {
    if (!lastPointer) return;
    const el = document.createElement('div');
    el.className = 'float-mark';
    el.textContent = text;
    el.style.left = lastPointer.x + 'px';
    el.style.top = lastPointer.y + 'px';
    document.body.appendChild(el);
    el.animate([
      { transform: 'translate(-50%, -50%) scale(.6)', opacity: 0 },
      { transform: 'translate(-50%, -120%) scale(1)', opacity: .9, offset: .25 },
      { transform: 'translate(-30%, -240%) scale(1)', opacity: 0 }
    ], { duration: 900, easing: 'ease-out' }).finished.then(() => el.remove(), () => el.remove());
  }

  function flyHeart() {
    const target = document.querySelector('#play-hearts .next') || $('play-hearts');
    if (!target || !lastPointer) return;
    const t = target.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'fly-heart';
    el.innerHTML = HEART + '<b>+1</b>';
    document.body.appendChild(el);
    const dx = t.left + t.width / 2 - lastPointer.x, dy = t.top + t.height / 2 - lastPointer.y;
    el.style.left = lastPointer.x + 'px';
    el.style.top = lastPointer.y + 'px';
    el.animate([
      { transform: 'translate(-50%, -50%) scale(.6)', opacity: 0 },
      { transform: 'translate(-50%, -120%) scale(1.15)', opacity: 1, offset: .2 },
      { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(.5)', opacity: .9 }
    ], { duration: 520, easing: 'cubic-bezier(.5, 0, .8, .6)' }).finished.then(() => {
      el.remove();
      target.classList.remove('beat'); void target.offsetWidth; target.classList.add('beat');
    });
  }

  // ハートの文字だけの表示（例：💖💖🤍🤍🤍。レポートのポストなどで使う）
  function heartsText() {
    const n = SAVE.hearts();
    const max = C.friendship.heartAt.length;
    return '💖'.repeat(n) + '🤍'.repeat(max - n);
  }

  function renderStatus() {
    const d = SAVE.data;
    $('days-total').textContent = Math.max(1, d.totalDays);
    $('days-streak').textContent = d.streak >= 2 ? tr('れんぞく {n} 日', { n: d.streak }) : '';
    $('menu-hearts').innerHTML = heartsHtml();
    $('play-hearts').innerHTML = heartsHtml();
    $('home-days').textContent = Math.max(1, d.totalDays);
    $('home-hearts').innerHTML = heartsHtml();
    renderCapNote();
  }

  function heartUp() {
    STATS.ping('h' + SAVE.hearts());
    // トップ画面：ハートの演出（思い出・お知らせ）が終わるまで、ズームを待つ
    const release = mode === 'home' ? holdHome() : null;
    renderStatus();
    const msg = (C.friendship.rewards || [])[SAVE.hearts() - 1];
    let gotText = tr('💖 ハートをゲット！') + (msg ? '\n' + msg : '');
    // 💖5（最大）になったら、ひみつの思い出の予告（あと何日来ればよいか）
    let hintMs = 0;
    if (!DEMO && C.clear && SAVE.hearts() >= C.friendship.heartAt.length && !SAVE.data.cleared) {
      const rem = SAVE.clearRemain();
      gotText += '\n' + tr('…まだ、ひみつがあるんだ。あと{n}日、また来てくれる？🌺', { n: rem == null ? (C.clear.afterDays || 0) : rem });
      hintMs = 2400;
    }
    // そのハートの「思い出」があれば、特別イラストと台詞を見せてから、お知らせ
    const m = memoryOf(SAVE.hearts());
    if (m && mode !== 'name') {
      setTimeout(() => playMemory(m, true).then(() => { toast(gotText, 3600 + hintMs); if (release) setTimeout(release, 1800 + hintMs); }), 600);
    } else {
      // タヌくんも、ひとこと（ハートの数ごとのセリフ）
      if (mode !== 'name') say({ scene: 'heartUp' });
      toast(gotText, 3600 + hintMs);
      if (release) setTimeout(release, 2400 + hintMs);
    }
    const h = $('play-hearts');
    h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop');
  }

  /* =========================================================
     思い出（恋愛ゲームのように、特別イラストと台詞）。config.js の memories
     ========================================================= */
  const MEM = C.memories || [];
  const memoryOf = (n) => MEM.filter((m) => m.hearts === n)[0];
  const evEl = $('event');
  function playMemory(m, fresh) {
    return new Promise((resolve) => {
      // 前の思い出で、絵の切りかえ（重ねた絵）が残っていたら、いちばん上の1枚だけにする
      const pics = evEl.querySelectorAll('.ev-pic');
      for (let n = 0; n < pics.length - 1; n++) pics[n].remove();
      let pic = evEl.querySelector('.ev-pic');
      pic.classList.remove('swap', 'in');
      let img = pic.querySelector('.ev-img');
      let bgImg = pic.querySelector('.ev-bg');
      img.style.animation = '';   // 出だしの動き（切りかえで止めた絵を、次の思い出で使うときのために戻す）
      const text = evEl.querySelector('.ev-text');
      // 特別イラストがまだないときは、ふだんの絵を、色の背景の上に仮に出す
      const real = !!m.image;
      img.src = real ? m.image : (C.images[m.stand] || C.images.normal);
      bgImg.src = real ? m.image : '';
      pic.classList.toggle('stand', !real);
      pic.style.background = real ? '' : 'linear-gradient(' + m.bg[0] + ', ' + m.bg[1] + ')';
      evEl.querySelector('.ev-title').textContent = (m.hearts ? '💖' + m.hearts : '🌺') + '　' + m.title;
      // 台詞は文字だけか、{ text, image }（その台詞から絵が切りかわる）
      const lines = m.lines.map((l) => typeof l === 'string' ? { text: l } : l)
        .map((l) => ({ text: withName(l.text), image: l.image }))
        .concat(fresh ? [{ text: tr('📖 思い出アルバムに追加されました') }] : []);
      lines.forEach((l) => { if (l.image) new Image().src = l.image; });   // 切りかわる絵を先に読んでおく
      let i = 0, typing = null, shown = '', lineAt = 0;
      function show() {
        const full = lines[i].text;
        lineAt = performance.now();
        if (lines[i].image && real) swapPic(lines[i].image);
        evEl.classList.toggle('sys', fresh && i === lines.length - 1);
        let k = 0;
        clearInterval(typing);
        text.textContent = '';
        // 1文字ずつ表示（恋愛ゲームの会話のように）
        typing = setInterval(() => {
          k += 1;
          text.textContent = full.slice(0, k);
          if (k >= full.length) { clearInterval(typing); typing = null; }
        }, 45);
        shown = full;
      }
      /* 台詞の途中で絵が切りかわるとき（5つ目の「…だいすき！」など）：
         新しい絵を、いまの絵の上に重ねて、読みこみ（デコード）が終わってから、ふわっと重ねる（約0.7秒）。
         以前は絵をその場で差しかえて、出だしの動き（少し大きく・明るく）をやり直していたので、
         読みこみ待ちとぼかした背景の描き直しが重なって、スマホでカクついて見えた（2026-10-31 ユーザーの指摘） */
      function swapPic(src) {
        const old = pic;
        const neu = old.cloneNode(true);
        const ni = neu.querySelector('.ev-img'), nb = neu.querySelector('.ev-bg');
        neu.classList.add('swap');
        neu.classList.remove('in');
        ni.style.animation = 'none';
        ni.src = src;
        nb.src = src;
        pic = neu; img = ni; bgImg = nb;
        const ready = (el) => (el.decode ? el.decode().catch(() => {}) : Promise.resolve());
        Promise.all([ready(ni), ready(nb)]).then(() => {
          if (!old.parentNode) return;
          old.after(neu);
          void neu.offsetWidth;
          neu.classList.add('in');
          setTimeout(() => { if (old.parentNode) old.remove(); }, 800);
        });
      }
      function next(e) {
        if (e) e.stopPropagation();
        // 合図の最初は、タップしても進まない（連打のまま飛ばしてしまわないように）
        if (introOn) { if (introReady) endIntro(); return; }
        // 台詞が出てから1.1秒は、タップを受けつけない（連打で台詞を飛ばさないように。文字が出きるくらいの長さ）
        if (performance.now() - lineAt < 1100) return;
        if (typing) { clearInterval(typing); typing = null; text.textContent = shown; return; }
        i += 1;
        if (i < lines.length) { show(); return; }
        close();
      }
      function close() {
        clearInterval(typing);
        evEl.removeEventListener('click', next);
        skip.removeEventListener('click', onSkip);
        evEl.classList.remove('on');
        setTimeout(() => { evEl.hidden = true; resolve(); }, 300);
      }
      const skip = evEl.querySelector('.ev-skip');
      const onSkip = (e) => { e.stopPropagation(); if (!introOn || introReady) close(); };
      evEl.addEventListener('click', next);
      skip.addEventListener('click', onSkip);
      // はじめて見るときは、先に「ハートがたまった → 思い出がひらく」の合図を出す（いきなり絵にならないように）
      const intro = evEl.querySelector('.ev-intro');
      let introOn = !!fresh, introTimer = null, introReady = false;
      function endIntro() {
        if (!introOn) return;
        introOn = false;
        clearTimeout(introTimer);
        intro.classList.add('out');
        setTimeout(() => { intro.hidden = true; intro.classList.remove('out'); evEl.classList.remove('intro'); setTimeout(show, 450); }, 450);
      }
      evEl.querySelector('.ev-text').textContent = '';
      if (introOn) {
        intro.querySelector('.ev-i1').textContent = m.hearts ? tr('ハートが {n}こ たまった！', { n: m.hearts }) : tr('ひみつの思い出が ひらいた…！');
        intro.querySelector('.ev-i2').textContent = tr('タヌくんとの思い出「{t}」', { t: m.title });
        intro.hidden = false;
        evEl.classList.add('intro');
        // 「タップしてつづける」が出るまで（約1.8秒）は、タップを受けつけない
        setTimeout(() => { introReady = true; }, 1800);
        introTimer = setTimeout(endIntro, 4000);   // タップしなくても、少し待つと始まる
      }
      evEl.hidden = false;
      void evEl.offsetWidth;
      evEl.classList.add('on');
      if (!introOn) setTimeout(show, 500);
    });
  }

  let toastTimer = null;
  function toast(text, ms) {
    const el = $('toast');
    el.textContent = text;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), ms || 2400);
  }

  // その日はじめてなら記録して、あいさつ
  function checkIn() {
    const r = SAVE.checkIn();
    STATS.checkIn({ lang: I18N.lang, total: SAVE.data.totalDays, firstDay: SAVE.data.firstDay, day: SAVE.today() });
    // 📮 なかよし〇日目・クリアの日は、タヌくんから先にお手紙。日付が変わってお返事が届いたら、ポストの旗を上げる
    if (POST) { POST.checkMilestones(SAVE.data.totalDays, !!SAVE.data.cleared); POST.refresh(); }
    // ぽんぽこリズムのごほうび（預けてあるなかよしポイント）を受け取る
    const pb = DEMO ? { added: 0, heartUp: false } : SAVE.claimPonPoints();
    if (pb.heartUp) r.heartUp = true;
    renderStatus();
    if (!SAVE.data.nameAsked) {
      // 呼び名を聞き終わってから「なかよし度アップ」を出す
      pendingHeartUp = pendingHeartUp || !!r.heartUp;
      if (mode !== 'name') askName();
      return true;
    }
    if (r.heartUp) { holdHome(1200); setTimeout(heartUp, 900); }
    // その日はじめて来てくれたら、ボーナスをお知らせ（ハートが増えたときは、そちらを優先）
    else if (!DEMO && (r.visit !== 'again' || pb.added)) {
      const msg = [];
      if (r.visit !== 'again') msg.push(tr('来てくれてありがとう！ 💗+{n}', { n: C.friendship.visitPoints }));
      if (pb.pon) msg.push(tr('ぽんぽこリズムの ごほうび 💗+{n}', { n: pb.pon }));
      if (pb.rally) msg.push(tr('ぽよんラリーの ごほうび 💗+{n}', { n: pb.rally }));
      setTimeout(() => toast(msg.join('\n')), 900);
    }
    // 今日2回目以降（画面に戻ってきたときなど）でも、ひみつの思い出をまだ見ていなければ流す（2026-11-03 夜）
    if (r.visit === 'again') { if (!r.heartUp) maybeClear(2200); return false; }
    if (mode === 'home') homeGreet({ scene: 'home', visit: r.visit });
    autoUranai();
    // ひみつの思い出（クリア）の日なら、あいさつのあとに流す（トップ画面は、それまでズームを待つ）
    if (!r.heartUp) maybeClear(2200, true);
    return true;
  }

  /* ---- ひみつの思い出（クリア）を流せるときに流す（2026-11-03 夜）----
     以前は「その日はじめて開いたとき」の1回だけで、あいさつの2秒の間に閉じたり、ほかの画面に移ったりすると、次の日まで見られなかった。
     いまは、トップ画面に戻ってきたとき（なでなで・ゲーム・占い・ポストから）や、アプリに戻ってきたときにも、もう一度ためす。
     条件（💖5 になってから2日）は変えない。見終わるまでは cleared にならないので、とちゅうで閉じても、次に戻ってきたときにまた流れる。
     delay … 待つ時間（あいさつのあと）。hold … そのあいだトップ画面のズームを待ってもらう（その日はじめて開いたとき）
     戻り値：流す予定にしたか（そのときは「おたより」を出さない） */
  let clearWait = null;
  function maybeClear(delay, hold) {
    if (DEMO || !C.clear || !SAVE.clearReady()) return false;
    if (clearWait) return true;
    if (hold) holdHome(delay + 400);
    const tryPlay = () => {
      clearWait = null;
      if (!SAVE.clearReady() || mode !== 'home' || document.visibilityState === 'hidden') return;   // 次にトップ画面・アプリに戻ってきたときに、またためす
      // パネル（ホーム画面に追加の案内など）・思い出・占い・ポストが出ている間は、閉じるのを待つ
      if (!sheet.hidden || !$('event').hidden || (URANAI && URANAI.isOpen()) || (POST && POST.isOpen())) { clearWait = setTimeout(tryPlay, 1500); return; }
      playClear();
    };
    clearWait = setTimeout(tryPlay, delay);
    return true;
  }

  /* ---- クリア：ひみつの思い出 → クリア画面（X にポスト） ---- */
  const CLR = C.clear || null;
  function playClear() {
    if (!CLR || !$('event').hidden) return;
    playMemory(CLR.memory, true).then(() => { SAVE.setCleared(); STATS.ping('clear'); showClear(); });
  }
  function showClear() {
    const days = Math.max(1, SAVE.data.clearDay || SAVE.data.totalDays);
    const text = tr('タヌくんと、ずっと一緒の約束をしたよ🌺\n（なかよし{n}日目でクリア！）', { n: days }) +
      '\n' + tr('#タヌくん') + (CLR.hashtag ? ' #' + CLR.hashtag : '');
    openSheet(tr('🌺 クリアおめでとう！'),
      '<img class="res-img clear-img" alt="">' +
      '<p class="res-comment">' + tr('ここまで遊んでくれて、ほんとうにありがとう！') + '</p>' +
      '<p class="note center">' + tr('これからも、タヌくんに会いにきてね。<br>思い出は「実績」のアルバムで見返せるよ') + '</p>' +
      shareButtonsHtml());
    const body = $('sheet-body');
    body.querySelector('.clear-img').src = CLR.memory.image;
    bindShare(body, text, C.report && C.report.url);
  }

  /* ---- 📮 お手紙の届け先（config.js の post.form）----
     prefill（Google フォームの「事前入力した URL」）から、送り先（…/formResponse）と質問の番号（entry.〇〇）を読む。
     事前入力で text・stamp・lang と打ってあれば、その言葉で。なければ質問の順番（お手紙 → 切手 → 言語）で決める。
     action・entry が書いてあれば、そちらが優先。どれもなければ null（お手紙はスマホの中にしまうだけ） */
  let postFormCache;
  function readPrefill(url) {
    try {
      const u = new URL(String(url).trim());
      if (!/\/forms\//.test(u.pathname)) return null;
      const action = u.origin + u.pathname.replace(/\/(viewform|formResponse)?\/?$/, '') + '/formResponse';
      const ents = [];
      u.searchParams.forEach((v, k) => { if (/^entry\.\d+$/.test(k)) ents.push([k, v.trim().toLowerCase()]); });
      if (!ents.length) return null;
      const entry = { text: '', stamp: '', lang: '' };
      const WORDS = { text: ['text', 'お手紙', 'letter'], stamp: ['stamp', '切手'], lang: ['lang', '言語', 'language'] };
      const rest = [];
      ents.forEach(([k, v]) => {
        const key = Object.keys(WORDS).find((w) => !entry[w] && WORDS[w].includes(v));
        if (key) entry[key] = k; else rest.push(k);
      });
      ['text', 'stamp', 'lang'].forEach((w) => { if (!entry[w] && rest.length) entry[w] = rest.shift(); });
      return entry.text ? { action: action, entry: entry } : null;
    } catch (e) { return null; }
  }
  function postFormInfo() {
    if (postFormCache !== undefined) return postFormCache;
    const F = (C.post && C.post.form) || {};
    let r = null;
    if (F.action && F.entry && F.entry.text) r = { action: F.action, entry: F.entry };
    else if (F.prefill) r = readPrefill(F.prefill);
    return (postFormCache = r);
  }

  /* ---- ⓘ お約束と注意（config.js の rules）。focus … 開いたときに目立たせる項目の id（'post' など）----
     お手紙を送らないとき（form が空）は、お手紙の項目を textLocal に、form: true の項目は出さない */
  function showRules(focus) {
    const sending = !!postFormInfo();
    const list = (C.rules || []).filter((r) => !r.form || sending);
    const esc = (t) => String(t).split('\n').join('<br>');
    openSheet(tr('ⓘ お約束と注意'),
      '<div class="rules">' + list.map((r) =>
        '<section class="rule' + (r.id === focus ? ' on' : '') + '" data-id="' + (r.id || '') + '">' +
        '<h3><span>' + (r.icon || '・') + '</span>' + r.title + '</h3>' +
        '<p class="note">' + esc(!sending && r.textLocal ? r.textLocal : r.text) + '</p></section>').join('') + '</div>');
    if (focus) {
      const el = $('sheet-body').querySelector('.rule.on');
      if (el) setTimeout(() => { try { el.scrollIntoView({ block: 'center' }); } catch (e) {} }, 30);
    }
  }

  /* ---- はじめてのお知らせ（config.js の notice）。done は閉じたあとにすること ---- */
  function showNotice(done) {
    const N = C.notice;
    const text = N.text + (N.post && postFormInfo() ? '\n' + N.post : '') + (N.more && C.rules ? '\n\n' + N.more : '');
    openSheet(N.title, '<p class="note notice">' + text.split('\n').join('<br>') + '</p>' +
      (!done && C.rules ? '<button id="notice-rules" class="btn btn-wide" type="button">' + tr('ⓘ お約束と注意') + '</button>' : '') +
      (done ? '<button id="notice-ok" class="btn btn-main" type="button"></button>' : ''));
    if ($('notice-rules')) $('notice-rules').addEventListener('click', () => showRules());
    if (!done) return;
    $('sheet-close').hidden = $('sheet-x').hidden = true;   // OK を押すまで閉じない
    $('notice-ok').textContent = N.ok;
    $('notice-ok').addEventListener('click', () => {
      SAVE.setFlag('noticeOk');
      $('sheet-close').hidden = $('sheet-x').hidden = false;
      closeSheet();
      done();
    });
  }

  /* ---- タヌくんからの「おたより」（感想を聞く。2026-11-03。config.js の feedback）----
     タヌくんが、胸の前で指をちょんちょんしながら「ねえねえ、ちょっとだけ教えて？」。
     ① なくなったら（ひとつ）② 好きな所（いくつでも）をえらんで「おくる」→ 押された数だけを匿名の目印で数える（文は送らない）。
     書きたい人だけ「✉️ もっと書く」で外のフォーム（formUrl）。
     自動で出すのは、なかよし minDays 日目以降かクリアしたあとに、トップ画面に戻ってきたとき1回だけ（「あとで」でも、もう自動では出さない）。
     設定の「💬 タヌくんにおたより」からは、いつでも */
  const FB = C.feedback || null;
  const FB_MISS = [['big', '😭 とても残念'], ['some', '😢 少し残念'], ['no', '🙂 気にならない']];
  const FB_LIKE = [['belly', '🫧 おなかぽよん'], ['tanu', '🦝 タヌくん'], ['art', '🎨 絵'], ['game', '🎮 ミニゲーム'], ['line', '💬 セリフ']];
  const fbForm = () => { const u = FB && FB.formUrl; return (u && (u[I18N.lang] || u.ja)) || ''; };
  function fbMoreHtml() {
    // 📮 ポストがあれば、そちらでお手紙を書いてもらう（タヌくんにとどいて、次の日にお返事）
    if (POST) return '<button class="btn btn-wide fb-post" type="button">' + tr('📮 タヌくんにお手紙を書く') + '</button>';
    return fbForm() ? '<a class="btn btn-wide fb-more" target="_blank" rel="noopener">' + tr('✉️ もっと書く') + '</a>' +
      '<p class="note small center">' + tr('書いた内容は Google フォームに届きます。名前などは書かないでね') + '</p>' : '';
  }
  function bindFbMore(body) {
    const pb = body.querySelector('.fb-post');
    if (pb) pb.addEventListener('click', () => { STATS.ping('f-more'); closeSheet(); POST.write(); });
    const a = body.querySelector('.fb-more');
    if (!a) return;
    a.href = fbForm();
    a.addEventListener('click', () => STATS.ping('f-more'));
  }
  function showFeedback(isAuto) {
    if (!FB) return;
    if (isAuto) { SAVE.setFlag('feedbackAsked'); STATS.ping('f-show'); }
    openSheet(tr('💌 タヌくんからのおたより'),
      '<img class="res-img fb-img" alt="">' +
      '<p class="res-comment">' + tr('ねえねえ、ちょっとだけ教えて？') + '</p>' +
      '<h3>' + tr('タヌくんアプリが なくなったら…') + '</h3>' +
      '<div class="fb-opts fb-miss">' + FB_MISS.map((o) => '<button class="btn fb-opt" type="button" data-v="' + o[0] + '">' + tr(o[1]) + '</button>').join('') + '</div>' +
      '<h3>' + tr('タヌくんの どこが好き？（いくつでも）') + '</h3>' +
      '<div class="fb-opts fb-like">' + FB_LIKE.map((o) => '<button class="btn fb-opt" type="button" data-v="' + o[0] + '">' + tr(o[1]) + '</button>').join('') + '</div>' +
      '<button class="btn btn-main fb-send" type="button" disabled>' + tr('おくる') + '</button>' +
      fbMoreHtml() +
      '<button class="link fb-later" type="button">' + tr('あとで') + '</button>');
    const body = $('sheet-body');
    body.querySelector('.fb-img').src = C.images.dere || C.images.shy || C.images.normal;
    const send = body.querySelector('.fb-send');
    const picked = () => body.querySelectorAll('.fb-opt.on').length > 0;
    body.querySelectorAll('.fb-miss .fb-opt').forEach((b) => b.addEventListener('click', () => {
      body.querySelectorAll('.fb-miss .fb-opt').forEach((x) => x.classList.toggle('on', x === b));
      send.disabled = !picked();
    }));
    body.querySelectorAll('.fb-like .fb-opt').forEach((b) => b.addEventListener('click', () => {
      b.classList.toggle('on');
      send.disabled = !picked();
    }));
    bindFbMore(body);
    body.querySelector('.fb-later').addEventListener('click', () => { if (isAuto) STATS.ping('f-later'); closeSheet(); });
    send.addEventListener('click', () => {
      STATS.ping('f-send');
      body.querySelectorAll('.fb-miss .fb-opt.on').forEach((b) => STATS.ping('f-miss-' + b.dataset.v));
      body.querySelectorAll('.fb-like .fb-opt.on').forEach((b) => STATS.ping('f-like-' + b.dataset.v));
      // お礼のなかよしポイントは、はじめて答えてくれたときだけ
      const first = !SAVE.data.feedbackSent;
      SAVE.setFlag('feedbackSent');
      const up = first && FB.reward ? SAVE.addPoints(FB.reward) : false;
      renderStatus();
      openSheet(tr('💌 タヌくんからのおたより'),
        '<img class="res-img fb-img" alt="">' +
        '<p class="res-comment">' + tr('ありがとう！ すっごく うれしい〜！') + '</p>' +
        (first && FB.reward ? '<p class="note center">' + tr('💗 なかよしポイント +{n}', { n: FB.reward }) + '</p>' : '') +
        fbMoreHtml());
      $('sheet-body').querySelector('.fb-img').src = C.images.happy || C.images.normal;
      bindFbMore($('sheet-body'));
      if (up) setTimeout(heartUp, 600);
    });
  }
  // トップ画面に戻ってきたとき：条件がそろっていれば、1回だけ自動で
  function maybeFeedback() {
    if (maybeClear(1400)) return;   // ひみつの思い出がまだなら、そちらが先（トップ画面に戻ってきたとき）
    if (!FB || DEMO || !FB.minDays || SAVE.data.feedbackAsked || mode !== 'home') return;
    if (SAVE.data.totalDays < FB.minDays && !SAVE.data.cleared) return;
    setTimeout(() => {
      if (mode !== 'home' || !sheet.hidden || !$('event').hidden || (URANAI && URANAI.isOpen()) || (POST && POST.isOpen()) || SAVE.data.feedbackAsked) return;
      showFeedback(true);
    }, 1600);
  }

  // 2日目以降、メニューに戻ったときに一度だけ「ホーム画面に追加」をすすめる（記録を消えにくくするため）
  const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
  function suggestHomeScreen() {
    if (DEMO || SAVE.data.a2hsShown || SAVE.data.totalDays < 2 || standalone() || !$('sheet').hidden) return;
    SAVE.setFlag('a2hsShown');
    openSheet(tr('📱 ホーム画面に追加しよう'),
      '<p class="note">' + tr('タヌくんを<b>ホーム画面に追加</b>すると、すぐ会いにこられて、なかよしの記録も消えにくくなるよ。') + '</p>' +
      '<p class="note">' + tr('iPhone：共有ボタン →「ホーム画面に追加」<br>Android：右上のメニュー →「ホーム画面に追加」') + '</p>');
  }

  // 開いたまま日付が変わったときのために、画面に戻ってきたら確認
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !DEMO) checkIn();
  });

  // ぽんぽこリズム：はじめて開くまでメニューに NEW
  $('pon-new').hidden = DEMO || !!SAVE.data.ponSeen || feature('pon') !== 'open';
  // 公開スイッチ：まだのときは、ボタンを出さない（hidden）か、🔒 もうすぐ（soon）にする
  function gateButton(name, el, soonText) {
    if (feature(name) === 'hidden') el.hidden = true;
    else el.hidden = false;
    if (feature(name) !== 'soon') return;
    el.classList.add('locked');
    el.insertAdjacentHTML('beforeend', '<span class="soon-badge">' + tr('🔒 もうすぐ') + '</span>');
    el.addEventListener('click', (e) => { e.preventDefault(); toast(soonText); });
  }
  gateButton('pon', $('btn-pon'), tr('ぽんぽこリズムは、もうすぐ遊べるよ！\nおたのしみに 🥁'));
  gateButton('rally', $('btn-rally'), tr('ぽよんラリーは、もうすぐ遊べるよ！\nおたのしみに 🏐'));
  gateButton('seesaw', $('btn-seesaw'), tr('丸太シーソーは、もうすぐ遊べるよ！\nおたのしみに 🌴'));
  // ミニゲームが2つ以上出るときは、横に並べる
  $('btn-pon').parentNode.classList.toggle('two', ['btn-pon', 'btn-rally', 'btn-seesaw'].filter((id) => !$(id).hidden).length >= 2);
  // ぽんぽこリズムから「戻る」で帰ってきたとき、ブラウザが前の画面をそのまま出すことがある（記録が古いまま）。
  // そのときは読み直して、ぽんぽこリズムで変わった記録（ごほうび・きせかえ）を取りこむ
  window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });

  /* =========================================================
     実績・設定のパネル
     ========================================================= */
  const sheet = $('sheet');
  function openSheet(title, html) {
    $('sheet-title').textContent = title;
    $('sheet-body').innerHTML = html;
    sheet.hidden = false;
  }
  function closeSheet() {
    sheet.hidden = true;
    if (reportOpen) { reportOpen = false; resetReport(); }
  }

  /* =========================================================
     なでなでレポート（本編だけ。config.js の report）
     さわるごとに葉っぱのゲージが1枚ずつ緑になり、たまるとレポート → X にポスト
     ========================================================= */
  const REP = C.report || null;
  const REP_PLACES = ['head', 'chest', 'belly', 'tail', 'crotch'];
  const repCount = {};
  let repTotal = 0, reportOpen = false;
  const gauge = $('gauge');
  const LEAF = '<svg viewBox="0 0 24 24"><path d="M20 3C10 3 4 8 4 15c0 2 .6 3.8 1.6 5.2L3.5 22.3l1.4 1.4 2.2-2.2C8.4 22.5 10 23 12 23c7 0 10-8 8-20z"/></svg>';
  function resetReport() {
    REP_PLACES.forEach((p) => { repCount[p] = 0; });
    repTotal = 0;
    if (gauge && REP) {
      gauge.classList.remove('full');
      gauge.innerHTML = LEAF.repeat(REP.taps);
    }
  }
  if (REP && !DEMO) resetReport();

  function countReport(place) {
    if (!REP || DEMO || reportOpen || repTotal >= REP.taps || !(place in repCount)) return;
    repCount[place] += 1;
    repTotal += 1;
    const leaf = gauge.children[repTotal - 1];
    if (leaf) leaf.classList.add('on');
    if (repTotal === REP.taps) {
      gauge.classList.add('full');
      // さいごの反応（セリフ・動き）を見てから、レポートを出す
      setTimeout(() => { if (mode === 'play' && sheet.hidden) showReport(); }, 1500);
    }
  }

  function showReport() {
    const days = Math.max(1, SAVE.data.totalDays);
    // いちばん多くさわった場所（同じ数がいくつもあるときは even）
    const max = Math.max.apply(null, REP_PLACES.map((p) => repCount[p]));
    const tops = REP_PLACES.filter((p) => repCount[p] === max);
    const top = tops.length === 1 ? tops[0] : 'even';
    const comment = REP.comments[top] || REP.comments.even;
    const L = REP.labels;
    // 名前の幅をそろえる（日本語は全角で4文字分＋1文字あける。英語は「: 」）
    const pad = (s) => (I18N.lang === 'ja' ? s + '　'.repeat(Math.max(0, 4 - s.length)) : I18N.lang === 'zh' ? s + '：' : s + ': ');
    // ポストの文章：？？？（ひみつの場所）も回数を出す（棒は紫）
    const lines = REP_PLACES.map((p) => pad(L[p]) + (p === 'crotch' ? '🟪' : '🟧').repeat(repCount[p]) + ' ' + repCount[p]);
    const postText = tr('タヌくんと遊んだよ！（なかよし{n}日目）', { n: days }) + '\n' + lines.join('\n') +
      '\n「' + comment + '」' + (REP.hashtag ? '\n#' + REP.hashtag : '');

    reportOpen = true;
    openSheet(tr('なでなでレポート'),
      '<p class="rep-day"></p>' +
      '<div class="rep-pic"><img class="res-img" alt=""></div>' +
      '<table class="rep">' + REP_PLACES.map((p) => '<tr' + (p === 'crotch' ? ' class="secret"' : '') + '>' +
        '<th></th><td class="bar"></td><td class="num"></td></tr>').join('') + '</table>' +
      '<p class="res-comment"></p>' +
      shareButtonsHtml());
    const body = $('sheet-body');
    body.querySelector('.rep-day').textContent = tr('なかよし {n} 日目　', { n: days }) + heartsText();
    const face = C.images[REP.faces[top]] ? REP.faces[top] : 'normal';
    body.querySelector('.res-img').src = C.images[face];
    // 付けているきせかえ（デベソなど）も、レポートの絵に重ねる
    const pic = body.querySelector('.rep-pic');
    wornLayers(face).forEach((l) => {
      const el = document.createElement('img');
      el.src = l.img.src;
      el.alt = '';
      if (l.width != null) Object.assign(el.style, { left: l.x + '%', top: l.y + '%', width: l.width + '%' });
      else el.className = 'full';
      pic.appendChild(el);
    });
    body.querySelector('.res-comment').textContent = '「' + comment + '」';
    body.querySelectorAll('.rep tr').forEach((tr, i) => {
      const p = REP_PLACES[i], n = repCount[p];
      tr.querySelector('th').textContent = L[p];
      if (p === 'crotch') {
        // ひみつの場所：名前は「？？？」のまま、回数は出す（棒は紫）
        tr.querySelector('.bar').textContent = '🟪'.repeat(n);
        tr.querySelector('.num').textContent = window.TanuI18n.tr('{n} 回', { n: n });
      } else {
        tr.querySelector('.bar').textContent = '🟧'.repeat(n);
        tr.querySelector('.num').textContent = window.TanuI18n.tr('{n} 回', { n: n });
      }
    });
    bindShare(body, postText, REP.url);
  }
  $('sheet-close').addEventListener('click', closeSheet);
  $('sheet-x').addEventListener('click', closeSheet);
  sheet.addEventListener('click', (e) => { if (e.target === sheet && !$('sheet-close').hidden) closeSheet(); });

  // 実績（いまは記録の一覧。バッジは次の段階で）
  /* =========================================================
     セリフ図鑑：見たことのあるセリフを、場所ごとに一覧。まだのものは数だけ
     ========================================================= */
  // 見出しは言語ごとに（「なかよし」などは、ほかの所の訳とぶつかるので、ここで書く）
  const ZUKAN_GROUPS = [
    ['greet', { ja: 'あいさつ', en: 'Greetings', zh: '打招呼' }], ['head', { ja: '頭', en: 'Head', zh: '头' }],
    ['chest', { ja: 'むね', en: 'Chest', zh: '胸口' }], ['belly', { ja: 'おなか', en: 'Belly', zh: '肚子' }],
    ['tail', { ja: 'しっぽ', en: 'Tail', zh: '尾巴' }], ['crotch', { ja: 'おまた', en: 'Secret spot', zh: '秘密部位' }],
    ['melt', { ja: 'とろける', en: 'Melting', zh: '融化' }], ['angry', { ja: 'おこる・かくれる', en: 'Angry & hiding', zh: '生气・躲起来' }],
    ['heart', { ja: 'なかよし', en: 'Friendship', zh: '亲密' }], ['wear', { ja: 'きせかえ', en: 'Dress-up', zh: '换装' }]
  ];
  function zukanGroup(l) {
    const w = l.when || {};
    const sc = Array.isArray(w.scene) ? w.scene[0] : w.scene;
    if (sc === 'home' || sc === 'named') return 'greet';
    if (sc === 'pull') return 'belly';
    if (sc === 'tap' || (sc === 'angry' && w.place === 'crotch')) return w.place || 'greet';
    if (sc === 'melt') return 'melt';
    if (sc === 'angry' || sc === 'hiddenTap' || sc === 'return') return 'angry';
    if (sc === 'heartUp') return 'heart';
    if (sc === 'wear') return 'wear';
    return 'greet';
  }
  // セリフを重ならないように集める（同じ文は、最初に出てくる場所だけに入れる）。
  // key は記録に使う日本語の文、text は いまの言語の文
  function zukanLines() {
    const seen = {}, out = [];
    LINES.forEach((l) => { const k = jaOf(l); if (!seen[k]) { seen[k] = true; out.push({ key: k, text: l.text, group: zukanGroup(l) }); } });
    return out;
  }
  // 数えるのは、いまあるセリフだけ（セリフを書きかえて、なくなったものは数えない）
  function zukanCount() {
    const all = zukanLines(), got = SAVE.data.seenLines;
    return { total: all.length, seen: all.filter((l) => got.indexOf(l.key) >= 0).length };
  }
  function openZukan() {
    const all = zukanLines(), got = SAVE.data.seenLines;
    const secret = !SAVE.data.stats.tap.crotch;   // おまたは、さわるまで「？？？」
    const zk = zukanCount();
    let html = '<button id="zukan-back" class="link" type="button">' + tr('‹ 実績にもどる') + '</button>' +
      '<p class="note center">' + tr('見たことのあるセリフ {a} ／ {b}', { a: zk.seen, b: zk.total }) + '</p>';
    ZUKAN_GROUPS.forEach(([key, label]) => {
      const list = all.filter((l) => l.group === key);
      if (!list.length) return;
      const seenList = list.filter((l) => got.indexOf(l.key) >= 0);
      const name = key === 'crotch' && secret ? '？？？' : (label[I18N.lang] || label.en || label.ja);
      html += '<h3>' + name + '（' + seenList.length + ' ／ ' + list.length + '）</h3><div class="zukan">' +
        seenList.map((l, i) => '<p class="zukan-line" data-g="' + key + '" data-i="' + i + '"></p>').join('') +
        (list.length > seenList.length ? '<p class="zukan-rest">' + tr('まだ見ていないセリフが あと {n} こ', { n: list.length - seenList.length }) + '</p>' : '') +
        '</div>';
    });
    openSheet(tr('💬 セリフ図鑑'), html);
    // 文字は、あとから入れる（呼び名を入れて。記号が入っても安全なように）
    const body = $('sheet-body');
    ZUKAN_GROUPS.forEach(([key]) => {
      const seenList = all.filter((l) => l.group === key && got.indexOf(l.key) >= 0);
      body.querySelectorAll('.zukan-line[data-g="' + key + '"]').forEach((el) => {
        el.textContent = withName(seenList[+el.dataset.i].text);
      });
    });
    $('zukan-back').addEventListener('click', openRecord);
  }

  function openRecord() {
    const d = SAVE.data, s = d.stats;
    const zk = zukanCount();
    const rows = [
      [{ ja: 'なかよし', zh: '亲密天数' }[I18N.lang] || 'Days together', tr('{n} 日', { n: d.totalDays })],
      [tr('れんぞく（いま／最高）'), tr('{a} 日 ／ {b} 日', { a: d.streak, b: d.bestStreak })],
      [tr('頭をなでた'), tr('{n} 回', { n: s.tap.head })],
      [tr('むねをさわった'), tr('{n} 回', { n: s.tap.chest || 0 })],
      [tr('おなかをさわった'), tr('{n} 回', { n: s.tap.belly })],
      [tr('しっぽをさわった'), tr('{n} 回', { n: s.tap.tail })],
      // おまたは、さわるまでは「？？？」（ひみつ）
      [tr((s.tap.crotch ? 'おまた' : '？？？') + 'をさわった'), tr('{n} 回', { n: s.tap.crotch || 0 })],
      [tr('とろけさせた'), tr('{n} 回', { n: s.melt })],
      [tr('怒らせちゃった'), tr('{n} 回', { n: s.angry })],
      [tr('セリフ図鑑'), zk.seen + ' ／ ' + zk.total]
    ];
    // 思い出アルバム：ハートの数まで見られる。まだのものは「？」
    // 最後に「ひみつの思い出」（クリアするまで、名前も「？？？」）
    const hearts = SAVE.hearts();
    const all = MEM.concat(CLR ? [Object.assign({ secret: true }, CLR.memory)] : []);
    const open = (m) => m.secret ? SAVE.data.cleared : m.hearts <= hearts;
    // ひみつの思い出：💖5 になったら「🌺 あと○日…」（開いた日の数。ヒント）。それまでは「？？？」
    const remain = SAVE.clearRemain();
    const secretLabel = remain == null ? '？？？' : remain > 0 ? tr('🌺 あと{n}日…', { n: remain }) : tr('🌺 もうすぐ…✨');
    const album = all.length ? '<h3>' + tr('📖 思い出アルバム（{a} ／ {b}）', { a: all.filter(open).length, b: all.length }) + '</h3>' +
      '<div class="album">' + all.map((m, i) => open(m)
        ? '<button class="mem" type="button" data-i="' + i + '"><span class="mem-pic"><img alt=""></span><span class="mem-t"></span></button>'
        : '<div class="mem locked"><span class="mem-pic">' + (m.secret && remain != null ? '🌺' : '？') + '</span><span class="mem-t">' +
          (m.secret ? secretLabel : tr('💖{n}で見られる', { n: m.hearts })) + '</span></div>').join('') +
      '</div>' : '';
    openSheet(tr('実績'),
      album +
      '<button id="btn-zukan" class="btn btn-wide" type="button">' + tr('💬 セリフ図鑑（{a} ／ {b}）', { a: zk.seen, b: zk.total }) + '</button>' +
      '<h3>' + tr('きろく') + '</h3>' +
      '<table class="rec">' + rows.map((r) => '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>').join('') + '</table>' +
      '<p class="note">' + tr('バッジ（実績のごほうび）は準備中だよ') + '</p>');
    $('sheet-body').querySelectorAll('button.mem').forEach((b) => {
      const m = all[+b.dataset.i];
      const pic = b.querySelector('.mem-pic');
      b.querySelector('img').src = m.thumb || m.image || C.images[m.stand] || C.images.normal;
      if (!m.image) { pic.classList.add('stand'); pic.style.background = 'linear-gradient(' + m.bg[0] + ', ' + m.bg[1] + ')'; }
      b.querySelector('.mem-t').textContent = (m.secret ? '🌺 ' : '💖' + m.hearts + ' ') + m.title;
      // 実績の画面は閉じずに、その上に思い出を重ねて流す（トップ画面が一瞬見えないように。見終わると実績の画面に戻る）
      b.addEventListener('click', () => playMemory(m, false));
    });
    $('btn-zukan').addEventListener('click', openZukan);
  }
  $('btn-record').addEventListener('click', openRecord);

  // きせかえ：場所ごとに「なし」と部品を並べる。選ぶとパネルを閉じて、付けた姿を見せる
  $('btn-wear').addEventListener('click', () => {
    const wear = SAVE.data.wear || {};
    const slots = Object.keys(PARTS);
    let html = '';
    slots.forEach((slot) => {
      const S = PARTS[slot];
      html += '<h3>' + S.label + '</h3><div class="wear-grid">' +
        '<button class="wear-item' + (wear[slot] ? '' : ' on') + '" type="button" data-slot="' + slot + '" data-id="">' +
        '<span class="wear-thumb">✖️</span><span>' + tr('なし') + '</span></button>';
      S.items.forEach((it) => {
        const open = unlocked(it);
        html += '<button class="wear-item' + (wear[slot] === it.id ? ' on' : '') + '" type="button"' +
          ' data-slot="' + slot + '" data-id="' + it.id + '"' + (open ? '' : ' disabled') + '>' +
          '<span class="wear-thumb"><img src="' + it.image + '" alt=""></span>' +
          '<span>' + (open ? it.name : '🔒 💖×' + it.hearts) + '</span></button>';
      });
      html += '</div>';
    });
    if (!slots.length) html = '<p class="note">' + tr('まだ部品がないよ') + '</p>';
    openSheet(tr('きせかえ'), html + '<p class="note small">' + tr('なかよし度（💖）が上がると、付けられる部品が増えるよ') + '</p>');
    $('sheet-body').querySelectorAll('.wear-item').forEach((b) => {
      b.addEventListener('click', () => {
        const slot = b.dataset.slot, id = b.dataset.id;
        const changed = (wear[slot] || '') !== id;
        SAVE.setWear(slot, id);
        belly.refresh();
        renderParts();
        if (HOME) HOME.refreshParts();
        closeSheet();
        if (changed) say({ scene: 'wear', part: id || 'none' });
      });
    });
  });

  // 設定
  $('btn-settings').addEventListener('click', () => {
    openSheet(tr('設定'),
      // ことば（使える言語が2つ以上になったら、いちばん上に出る）
      (Object.keys(I18N.LANGS).length > 1 ? '<h3>ことば / Language</h3><div class="set-row"><select id="set-lang" class="name-input">' +
        Object.keys(I18N.LANGS).map((l) => '<option value="' + l + '"' + (l === I18N.lang ? ' selected' : '') + '>' + I18N.LANGS[l] + '</option>').join('') +
        '</select></div>' : '') +
      '<h3>' + tr('呼び名') + '</h3>' +
      '<div class="set-row"><input id="set-name" class="name-input" type="text" maxlength="' + SAVE.NAME_MAX + '" placeholder="' + tr('名前なし') + '">' +
      '<button id="set-name-ok" class="btn" type="button">' + tr('変更') + '</button></div>' +
      '<p class="note small">' + tr('空にすると、名前なしで話しかけます') + '</p>' +
      (URANAI ? '<h3>' + tr('🐚 貝がら占い') + '</h3><button id="set-uranai" class="btn btn-wide" type="button"></button>' +
        '<p class="note small">' + tr('その日はじめて開いたときに、占いを出すか（トップ画面のカードからは、いつでも引けます）') + '</p>' : '') +
      (C.notice ? '<h3>' + tr('このアプリ') + '</h3><button id="btn-about" class="btn btn-wide" type="button">' + tr('このアプリについて') + '</button>' : '') +
      (C.rules ? '<button id="btn-rules" class="btn btn-wide" type="button">' + tr('ⓘ お約束と注意') + '</button>' : '') +
      (FB ? '<button id="btn-feedback" class="btn btn-wide" type="button">' + tr('💬 タヌくんにおたより') + '</button>' : '') +
      '<h3>' + tr('記録') + '</h3>' +
      '<p class="note">' + tr('記録はこのスマホのブラウザの中だけに保存されます。') +
      tr('<b>ホーム画面に追加</b>して使うと、記録が消えにくくなります。') + '</p>' +
      '<p class="note">' + tr('iPhone：共有ボタン →「ホーム画面に追加」<br>Android：右上のメニュー →「ホーム画面に追加」') + '</p>' +
      '<button id="btn-reset" class="btn btn-danger" type="button">' + tr('記録をリセット') + '</button>' +

      (C.testHearts ? '<h3>確認用：なかよし度を切りかえて試す</h3>' +
        '<div class="test-hearts">' +
        ['ふつう', 0, 1, 2, 3, 4, 5].map((n) => '<button class="btn" type="button" data-h="' + (n === 'ふつう' ? '' : n) + '">' +
          (n === 'ふつう' ? n : '💖' + n) + '</button>').join('') + '</div>' +
        '<p class="note small">記録は変わりません。アプリを開き直すと「ふつう」に戻ります</p>' +
        '<button id="btn-test-clear" class="btn btn-wide" type="button">🌺 ひみつの思い出とクリア画面を見る</button>' +
        (URANAI ? '<button id="btn-test-uranai" class="btn btn-wide" type="button">🐚 今日の占いをやり直す（確認用）</button>' : '') +
        (FB ? '<button id="btn-test-feedback" class="btn btn-wide" type="button">💌 おたよりを自動で出たときと同じに見る（確認用）</button>' : '') +
        (POST ? '<button id="btn-test-post" class="btn btn-wide" type="button">📮 書いたお手紙のお返事を、今日とどける（確認用）</button>' : '') +
        (TB ? '<h3>確認用：時間帯を切りかえて試す</h3><div class="test-hearts test-time">' +
          [['', '時計'], ['morning', '🌅朝'], ['day', '☀️昼'], ['evening', '🌇夕'], ['night', '🌙夜'], ['late', '💤深夜']]
            .map((t) => '<button class="btn" type="button" data-t="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' : '') : ''));
    if ($('set-uranai')) {
      const b = $('set-uranai');
      const label = () => { b.textContent = URANAI.autoOn ? tr('自動で出す：オン') : tr('自動で出す：オフ'); };
      label();
      b.addEventListener('click', () => { URANAI.setAuto(!URANAI.autoOn); label(); });
    }
    if (C.testHearts && URANAI && $('btn-test-uranai')) {
      $('btn-test-uranai').addEventListener('click', () => { URANAI.resetToday(); closeSheet(); if (HOME) HOME.refreshIcons(); URANAI.open(true); });
    }
    if ($('btn-about')) $('btn-about').addEventListener('click', () => showNotice(null));
    if ($('btn-rules')) $('btn-rules').addEventListener('click', () => showRules());
    if ($('btn-feedback')) $('btn-feedback').addEventListener('click', () => showFeedback(false));
    if (C.testHearts && $('btn-test-feedback')) $('btn-test-feedback').addEventListener('click', () => showFeedback(true));
    if (C.testHearts && POST && $('btn-test-post')) $('btn-test-post').addEventListener('click', () => { POST.testArrive(); closeSheet(); toast('📮 お返事が とどいたよ（確認用）'); });
    if ($('set-lang')) $('set-lang').addEventListener('change', (e) => I18N.set(e.target.value));
    if (C.testHearts && $('btn-test-clear')) {
      $('btn-test-clear').addEventListener('click', () => {
        closeSheet();
        playMemory(CLR.memory, true).then(showClear);   // 確認用：記録は変えない
      });
    }
    if (C.testHearts && TB) {
      $('sheet-body').querySelectorAll('.test-time .btn').forEach((b) => {
        b.classList.toggle('on', (b.dataset.t || null) === testBand);
        b.addEventListener('click', () => {
          testBand = b.dataset.t || null;
          closeSheet();
          applyTime();
          say({ scene: 'home', visit: 'again' });
        });
      });
    }
    if (C.testHearts) {
      const cur = SAVE.testHearts;
      $('sheet-body').querySelectorAll('.test-hearts .btn').forEach((b) => {
        const h = b.dataset.h === '' ? null : +b.dataset.h;
        b.classList.toggle('on', h === cur);
        b.addEventListener('click', () => {
          SAVE.setTestHearts(h);
          renderStatus();
          closeSheet();
          toast(h == null ? 'なかよし度を元にもどしたよ' : '確認用：ハート' + h + 'で遊べるよ');
        });
      });
    }
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
      if (!btn.dataset.sure) { btn.dataset.sure = '1'; btn.textContent = tr('本当に消す？（もう一度押す）'); return; }
      SAVE.reset();
      if (URANAI) { URANAI.resetAll(); if (HOME) HOME.refreshIcons(); }   // 貝がら占いの記録も消す（2026-11-03）
      if (POST) POST.resetAll();   // お手紙の記録も消す
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
    const postText = DEMO.shareText(r) + (DEMO.hashtag ? '\n#' + DEMO.hashtag : '');
    openSheet('診断結果',
      '<p class="res-lead">きみは…</p>' +
      '<p class="res-title"></p>' +
      '<p class="res-prev" hidden></p>' +
      '<img class="res-img" alt="">' +
      '<p class="res-comment"></p>' +
      shareButtonsHtml() +
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
    bindShare(body, postText, shareUrl(r));
    const follow = body.querySelector('.btn-follow');
    if (follow) {
      follow.textContent = '🔔 @' + DEMO.followId + ' をフォローして待つ';
      follow.href = 'https://twitter.com/intent/follow?screen_name=' + encodeURIComponent(DEMO.followId);
    }
  }

  /* ---- X でポストする・アプリでシェア・文章をコピー（お試し版の診断と、本編のレポートで共通） ---- */
  function shareButtonsHtml() {
    return '<a class="btn btn-main btn-x" target="_blank" rel="noopener">' + tr('𝕏 でポストする') + '</a>' +
      '<div class="share-row">' +
      (navigator.share ? '<button class="btn btn-share" type="button">' + tr('📤 アプリでシェア') + '</button>' : '') +
      '<button class="btn btn-copy" type="button">' + tr('📋 文章をコピー') + '</button>' +
      '</div>' +
      (navigator.share
        ? '<p class="note small center">' + tr('X のログイン画面が出たら、「アプリでシェア」から X アプリを選んでね') + '</p>'
        : '<p class="note small center">' + tr('X のログイン画面が出たら、「文章をコピー」して X アプリに貼りつけてね') + '</p>');
  }

  function bindShare(body, text, url) {
    // ハッシュタグは本文に直接書く（hashtags= で渡すと X アプリで消えることがあるため）
    body.querySelector('.btn-x').href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) +
      (url ? '&url=' + encodeURIComponent(url) : '');
    // スマホの「共有」メニューから X アプリなどで投稿（アプリはログイン済みなので、ログイン画面が出ない）
    const share = body.querySelector('.btn-share');
    if (share) {
      share.addEventListener('click', () => {
        navigator.share(url ? { text: text, url: url } : { text: text }).catch(() => {});
      });
    }
    // 文章と URL をコピー（自分で X に貼りつけて投稿）
    body.querySelector('.btn-copy').addEventListener('click', (e) => {
      const btn = e.currentTarget, all = url ? text + '\n' + url : text;
      const done = () => { btn.textContent = tr('✅ コピーしました'); };
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

  /* =========================================================
     トップ画面（home.js）：あいさつ → おなかにズーム → おなかの上のアイコンで選ぶ
     ========================================================= */
  const HC = C.home || {};
  // ゲームへ行くときに印を付けておき、戻ってきたら、あいさつを飛ばしてズームした画面から
  const BACK_KEY = 'tanukun.homeZoom';
  const store = (fn) => { try { return fn(window.sessionStorage); } catch (err) { return null; } };
  // おなかの上のカード（スワイプでめくる。なでなで → ゲーム → 🔒 もうすぐ。公開スイッチで 遊べる／🔒 もうすぐ／出さない）
  // title はカードの文字（name は読み上げ用で、もうすぐのときは「🔒 もうすぐ」が付く）
  function homeGames() {
    // なでなで：幕がかかってから遊ぶ画面へ（時間帯の背景の色の幕）→ 明ける
    const toPlay = () => veilIn().then(() => { enterPlay(true); veilOut(); });
    const list = [{ id: 'pet', name: tr('タヌくん なでなで'), title: tr('タヌくん なでなで'), img: HC.pet, badge: '🤚', state: 'open', go: toPlay }];
    // 🐚 貝がら占い（今日まだなら NEW。引いたあとは、その日の結果を見返せる）
    if (URANAI && feature('uranai') !== 'hidden') {
      const soon = feature('uranai') === 'soon';
      list.push({ id: 'uranai', name: tr('今日の貝がら占い') + (soon ? ' ' + tr('🔒 もうすぐ') : ''), title: tr('今日の貝がら占い'), icon: '🐚',
        state: soon ? 'soon' : 'open', isNew: !soon && !URANAI.doneToday(),
        go: soon ? () => toast(tr('🔒 もうすぐ 遊べるよ！\nおたのしみに')) : (pt) => URANAI.open(false, pt) });
    }
    [
      { id: 'pon', name: tr('ぽんぽこリズム'), icon: '🥁', href: 'pon/', isNew: !SAVE.data.ponSeen,
        soon: tr('ぽんぽこリズムは、もうすぐ遊べるよ！\nおたのしみに 🥁') },
      { id: 'rally', name: tr('ぽよんラリー'), icon: '🏐', href: 'rally/',
        soon: tr('ぽよんラリーは、もうすぐ遊べるよ！\nおたのしみに 🏐') },
      { id: 'seesaw', name: tr('丸太シーソー'), icon: '🌴', href: 'seesaw/', isNew: !seesawSeen(),
        soon: tr('丸太シーソーは、もうすぐ遊べるよ！\nおたのしみに 🌴') }
    ].forEach((g) => {
      const f = feature(g.id);
      if (f === 'hidden') return;
      list.push(Object.assign(g, {
        state: f === 'soon' ? 'soon' : 'open',
        title: g.name,
        name: f === 'soon' ? g.name + ' ' + tr('🔒 もうすぐ') : g.name,
        isNew: f === 'open' && !!g.isNew,
        // ゲームへ：幕がかかってから、ゲームのページへ（ゲームのページは、同じ幕が明けるところから始まる）
        // ゲームへは、タップしたカードに向かって丸く閉じてから（iris.js。マリオのステージに入るときのように）
        go: f === 'soon' ? () => toast(g.soon) : (pt) => {
          store((ss) => ss.setItem(BACK_KEY, '1'));
          (window.TanuIris ? window.TanuIris.close(pt && pt.x, pt && pt.y) : veilIn()).then(() => { location.href = g.href; });
        }
      }));
    });
    // 最後に「🔒 もうすぐ」（まだ見ぬ新しい遊び。config.js の home.soonSlots 枚。0 なら出さない）
    const more = HC.soonSlots == null ? 1 : HC.soonSlots;
    for (let i = 0; i < more; i++) {
      list.push({ id: 'soon' + i, name: tr('🔒 もうすぐ'), title: tr('もうすぐ'), icon: '🔒', badge: '', state: 'soon', go: () => toast(tr('🔒 もうすぐ 遊べるよ！\nおたのしみに')) });
    }
    return list;
  }
  // ズームを待ってもらう（ms たったら、待つのをやめる。ms がなければ、返ってきた関数を呼ぶまで）
  function holdHome(ms) {
    if (!HOME) return () => {};
    const release = HOME.hold();
    if (ms) setTimeout(release, ms);
    return release;
  }
  // トップ画面のあいさつ：笑顔の絵で、lines.js の scene: 'home'（または 'named'）のセリフ → 少したつとズーム。
  // 起動したときは、先に幕（bootNext）。寝ている時間（時間帯）は、寝ている立ち絵のまま「すぴー…」
  let bootNext = false;
  function homeGreet(base) {
    if (!HOME) { say(base); return; }
    const go = () => {
      const b = bandNow();
      if (sleeping() && b.image) { HOME.sleep(b.image, tr('すぴー… すぴー…')); return; }
      let line = takeLine(base);
      // お手紙が届いている日は、あいさつを「お手紙、とどいてるよ！ 📮」に
      if (POST && POST.unread() && base.visit !== 'again') line = { text: POST.hello() };
      const stand = timeStand();
      HOME.greet(line ? withName(line.text) : '', stand || C.images.happy || C.images.normal, stand ? standKey() : 'happy', base.visit === 'again');
    };
    if (bootNext) { bootNext = false; HOME.boot(go); } else go();
  }
  if (!DEMO && window.TanuUranai && feature('uranai') !== 'hidden') {
    URANAI = window.TanuUranai({
      tr: tr, lang: () => I18N.lang, name: () => SAVE.data.name, today: SAVE.today,
      background: HC.background || '',
      testGold: !!C.testHearts && /[?&]gold\b/.test(location.search),   // 確認用：?gold でまんなかが金の貝
      shareHtml: shareButtonsHtml,
      bindShare: (el, text) => bindShare(el, text, C.report && C.report.url),
      ping: (n) => STATS.ping(n),
      scrollHint: scrollHint,
      iris: window.TanuIris || null,   // ゲームに入るときと同じ「丸く閉じて、丸く開く」
      hold: () => (HOME ? HOME.hold() : null),
      onClose: () => { if (HOME) HOME.refreshIcons(); maybeFeedback(); }
    });
  }
  // 📮 タヌくんのポスト（post.js）：トップ画面の左下にいつも立っている。お手紙を書くと、次の日にお返事
  if (!DEMO && window.TanuPost && feature('post') !== 'hidden' && $('home')) {
    POST = window.TanuPost({
      tr: tr, lang: () => I18N.lang, name: () => SAVE.data.name, today: SAVE.today,
      background: HC.background || '', happy: C.images.happy || C.images.normal,
      iris: window.TanuIris || null,
      hold: () => (HOME ? HOME.hold() : null),
      ping: (n) => STATS.ping(n),
      form: () => !!postFormInfo(),
      rules: C.rules ? () => showRules('post') : null,   // お手紙を書く画面の ⓘ
      // 書いたお手紙を Google フォームへ（画面は切りかえずに、裏で送る。届いたかは確かめられない）
      submit: (d) => {
        const F = postFormInfo();
        if (!F) return;
        try {
          const body = new URLSearchParams();
          if (F.entry.text) body.append(F.entry.text, d.text);
          if (F.entry.stamp) body.append(F.entry.stamp, d.stamp);
          if (F.entry.lang) body.append(F.entry.lang, d.lang);
          fetch(F.action, { method: 'POST', mode: 'no-cors', body: body }).catch(() => {});
        } catch (e) {}
      },
      onClose: () => { maybeFeedback(); }
    });
    POST.makeButton($('home'));
  }
  // その日はじめて開いたとき：あいさつのあとに、貝がら占いを自動で出す（はじめて来た日・クリアの日はのぞく）。
  // ハートの演出・思い出・パネルが出ている間は待つ。出るまでは、ズームも待ってもらう
  function autoUranai() {
    if (!URANAI || feature('uranai') !== 'open' || mode !== 'home' || !URANAI.shouldAuto(SAVE.data.totalDays) || SAVE.clearReady()) return;
    const release = holdHome();
    const t0 = Date.now();
    let calm = 0;
    (function wait() {
      const busy = mode !== 'home' || !sheet.hidden || !$('event').hidden || URANAI.isOpen() || (POST && POST.isOpen());
      calm = busy ? 0 : calm + 1;
      if (mode !== 'home' || Date.now() - t0 > 90000) { release(); return; }
      if (Date.now() - t0 >= 1800 && calm >= 2) { URANAI.open(true); release(); return; }
      setTimeout(wait, 400);
    })();
  }
  if (!DEMO && HC.normal) {
    HOME = window.TanuHome({
      config: C, tr: tr,
      normal: HC.normal, background: HC.background || '',
      games: homeGames,
      layers: (face) => wornLayers(face),
      standKey: standKey,
      nose: TB && TB.nose,
      panel: (name) => { const b = $('btn-' + name); if (b) b.click(); },
      blocked: () => mode !== 'home' || !sheet.hidden || !$('event').hidden,
      // ことばのボタン（いまの言語を短く。押すと一覧）
      // トップ画面の上のバーはせまいので「▾」は省く（なかよし○日目が3けたでも切れないように）
      langLabel: LANG_KEYS.length > 1 && I18N.label ? I18N.label().replace(' ▾', '') : '',
      onLang: () => langMenu($('home-lang')),
      // 寝ている時間に起こしたとき：時間帯のひとこと（「起こされちゃった」など）
      wakeText: () => { const b = bandNow(); return b && b.wake ? withName(b.wake) : ''; }
    });
  }

  /* ---------- 開始 ---------- */
  if (DEMO) {
    document.documentElement.classList.remove('arriving');
    startDemo();
  } else {
    // ゲーム（ぽんぽこ・ラリー）から戻ってきたとき：あいさつを飛ばして、ズームした画面から
    const fromGame = !!store((ss) => { const v = ss.getItem(BACK_KEY); ss.removeItem(BACK_KEY); return v; });
    setMode('home');
    // ゲームの幕が明けるように（index.html の head で、最初から幕をかけてある）
    if (fromGame) veilArrive(); else document.documentElement.classList.remove('arriving');
    refreshFace();
    renderStatus();
    // はじめての人には、先にお知らせ（ちょっぴり大人向け・AI イラスト・記録のこと）
    const start = () => {
      if (fromGame && HOME) {
        const line = takeLine({ scene: 'home', visit: 'again' });
        HOME.zoomNow(line ? withName(line.text) : '');
        checkIn();
        maybeFeedback();
        return;
      }
      bootNext = true;   // 起動の幕から
      if (!checkIn()) homeGreet({ scene: 'home', visit: 'again' });
      bootNext = false;
    };
    if (C.notice && !SAVE.data.noticeOk) showNotice(start); else start();

    /* ---------- ホーム画面に追加して使うための準備（PWA） ----------
       ファイルを直接開いたとき（file://）は動かないので、そのときは何もしません */
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }
})();
