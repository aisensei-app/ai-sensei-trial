/* =========================================================
   ぽんぽこリズム（試作）
   ・リズムは 8ビート「ぽん・ぽこ・ぽんぽん・ぽこ」のくり返し
   ・BPM（1分間の拍の数）が 80 → 120 とだんだん速くなる（1ステージ約30秒。上のバーで残りが分かる）
   ・プレイ中は ⏸ で中断できる（つづける・さいしょから・ステージをえらぶ・タヌくんのところへ）
   ・ステージは3つ（はじめる前に選ぶ）
       ステージ2 おなか … ◉ がおなかの上のランダムな場所にふわっと出る。まわりの輪が縮んで、
                      ◉ にぴったり重なったときにたたく（目線がおなかから離れないので、揺れを楽しめる）
       ステージ3 まんぷく … おなかモードの ◉ が食べもの（🍙🍉🍡🌽）になる。吹き出しの「たべたい！」と
                      同じものだけたたく（ちがうものはミス）。正しく食べるほど、おなかがふくらんでいく
       ステージ1 ながれる … ◉ が右から左に流れてきて、左のわくに重なったときにたたく
   ・ピンクの「〜」は、指でおなかをさっとすべらせて「ぷるん」（たたくのとは別のアクション）
   ・タイミングが合うほど点数が高い。続けて合わせると右上のタヌくんが笑顔になる
   ・音はすべてプログラムで作る（Web Audio）。音の素材ファイルは使わない
   ・おなかの「ぷるん」は本編と同じ仕組み（belly.js）
   ・きせかえ（デベソなど）は本編の記録をそのまま使う。はじめる前の画面でも付けはずしできる（本編にも反映）
   ・たたくたびに、タヌくんの腕が「ビクン」、ネックレスが「ぷるん」と反応する
   ========================================================= */
(function () {
  'use strict';

  const C = window.TANU_CONFIG;
  const $ = (id) => document.getElementById(id);
  // 本編の設定の絵は 'images/…' なので、このページ（pon/）からは '../' を付ける
  const IMG = (name) => {
    const src = C.images[name] || name;   // 本編の一覧にない絵は、ファイルの場所をそのまま書く
    return (/^data:/.test(src) ? '' : '../') + src;
  };

  /* ---------- 譜面のもと ----------
     sections … 速さ（bpm）と小節の数。上から順に速くなる
     pattern  … 1小節を8つに分けた位置に、たたく音（pon＝低い音、poko＝高い音）
     purun    … 何小節に1回、どの位置を「ぷるん」（指ですべらせる）にするか */
  const SONG = {
    lead: 0.8,              // はじめるボタンから、音が鳴りはじめるまで（秒）
    countIn: 4,             // 最初の「カッ・カッ・カッ・カッ」（数を数える拍）
    travel: 1.6,            // ◉ が右はしから、わくに着くまでの時間（秒）
    sections: [
      { bpm: 80, bars: 2 },
      { bpm: 90, bars: 2 },
      { bpm: 100, bars: 2 },
      { bpm: 110, bars: 2 },
      { bpm: 120, bars: 2 }
    ],
    pattern: { 0: 'pon', 2: 'poko', 4: 'pon', 5: 'pon', 6: 'poko' },
    purun: { every: 2, at: 6 }
  };
  const SWIPE_PX = 18;

  /* ---------- おなかを映す絵（立ち絵） ----------
     normal  … 本編の「通常」の絵（720×900）を、おなかが大きく見えるように拡大して映す【いま使っている】
     closeup … ChatGPT で作った「おなかのアップ」専用の絵（640×960。tools/make_pon_art.py でつくる）。
               2026-10-28 に試したが、ユーザーの希望で normal に戻した。「まんぷく」などで使うときのために残す
     中身：src … 絵（本編の images の名前か、ファイルの場所）、w, h … 絵の大きさ
           belly … おなかの楕円（絵の％。書かなければ本編の config.js の bellyJiggle）
           armL, armR … 腕の「ビクン」（絵の％。肩 pivot を軸に回る）
           view … 映す範囲（絵のピクセル。cx, cy を画面の横まんなか・高さ at の所に、横幅 w を画面の横幅に）
           mole … ◉ が出る範囲（絵のピクセル）と、続けて出る ◉ どうしの離れ具合 gap
           fat … まんぷくで、ふくらむ範囲（絵の％）
           parts … きせかえ部品の位置（絵の％。書かなければ本編の config.js の位置）
           fade … 映す範囲の上（口もと）を、背景の色でふんわり隠すか */
  const ARTS = {
    normal: {
      src: 'normal', w: 720, h: 900,
      armL: { x: 12.2, y: 44.4, rx: 6.3, ry: 16.7, pivotX: 18.1, pivotY: 30, reach: 38.9 },
      armR: { x: 66.7, y: 44.4, rx: 9.0, ry: 16.7, pivotX: 61.1, pivotY: 30, reach: 38.9 },
      view: { cx: 270, cy: 410, w: 420, at: 0.48 },   // 横幅は、両腕が入るくらい
      mole: { area: { x: 255, y: 405, rx: 112, ry: 80 }, gap: 80 },
      fat: { x: 35.4, y: 46, rx: 27, ry: 18 },   // まんぷくで、ふくらむ範囲（おなかより少し大きく、少し下）
      parts: {},
      fade: true
    },
    closeup: {
      src: 'images/pon/belly0.webp', w: 640, h: 960,
      belly: { x: 50, y: 36.5, rx: 37.5, ry: 16.7 },   // おなか（中心 320, 350、半径 240, 160）
      armL: { x: 7.0, y: 34.4, rx: 7.8, ry: 19.8, pivotX: 14.1, pivotY: 13.5, reach: 59.4 },   // 肩 (90, 130)
      armR: { x: 93.0, y: 34.4, rx: 7.8, ry: 19.8, pivotX: 85.9, pivotY: 13.5, reach: 59.4 },  // 肩 (550, 130)
      view: { cx: 320, cy: 470, w: 640, at: 0.5 },    // 絵の横幅いっぱい（両腕まで）
      mole: { area: { x: 320, y: 345, rx: 170, ry: 105 }, gap: 120 },
      parts: { debeso: { x: 50, y: 42, width: 13.1 } },   // おへそ (320, 403)。おなかが大きく描かれている分、デベソも大きく
      fade: false
    }
  };
  const ART = ARTS.normal;
  /* おなかモード
     appear … ◉ が出てから、たたく時までの秒数（この間に輪が縮む）
     area   … ◉ が出る範囲（絵のピクセルで、おなかの楕円。x, y は中心、rx, ry は半径。ART.mole）
     gap    … 続けて出る ◉ どうしの、最低限の離れ具合（絵のピクセル。ART.mole）
     hitR   … 指が ◉ の中心からこれだけ（画面のピクセル）以内なら当たり */
  const MOLE = { appear: 1.0, area: ART.mole.area, gap: ART.mole.gap, hitR: 56 };
  /* ステージ3 まんぷく
     foods      … 出てくる食べもの（形と色が似ていないものを選ぶ）
     appear     … 食べものが出てから、たたく時までの秒数（吹き出しを切りかえる間をとるため、おなかモードより短く）
     targetRate … 出てくる食べもののうち、「たべたい！」の食べものの割合
     maxFat     … いちばんふくらんだときの大きさ（0.3 で3割。これより大きいと絵がくずれる）
     ※ 吹き出しは、速さが変わるごと（2小節ごと）に変わる。変わる前の半小節は休み（食べものが出ない） */
  const FOOD = { foods: ['🍙', '🍉', '🍡', '🌽'], appear: 0.85, targetRate: 0.6, maxFat: 0.3 };
  const STAGES = {
    lane:  { name: 'ステージ1（ながれる）', next: 'belly' },
    belly: { name: 'ステージ2（おなか）', next: 'food' },
    food:  { name: 'ステージ3（まんぷく）', next: null }
  };
  /* ステージが始まってから最初の ◉ が出るまでの間（数を数えている間）に出す、遊び方の説明
     ◉ や 〜 は、ゲームの中と同じ見た目の小さな絵で出す */
  const NOTE_IC = '<i class="ic-note"></i>', PURUN_IC = '<i class="ic-purun">〜</i>';
  const HOWTO = {
    lane:  [NOTE_IC + ' が わくに来たら <b>タップ</b>', PURUN_IC + ' は さっと <b>すべらせる</b>'],
    belly: [NOTE_IC + ' に 輪が重なったら <b>タップ</b>', PURUN_IC + ' は さっと <b>すべらせる</b>'],
    food:  ['「🍙 たべたい！」なら 🍙 を <b>タップ</b>', 'ちがうものは たたかないでね']
  };
  const onBelly = () => mode !== 'lane';   // ◉ がおなかの上に出るステージ（おなか・まんぷく）
  const appearT = () => (mode === 'food' ? FOOD.appear : MOLE.appear);

  /* ---------- 判定（秒）。音ゲーに慣れていない人向けに、ゆるめ ---------- */
  const JUDGE = [
    { key: 'perfect', label: 'ぴったり！', within: 0.06, point: 100 },
    { key: 'good',    label: 'いいね',     within: 0.11, point: 60 },
    { key: 'ok',      label: 'おしい',     within: 0.16, point: 20 }
  ];
  const MISS_AFTER = 0.16;

  /* ---------- 右上のワイプの表情 ---------- */
  const FACES = {
    normal: IMG('normal'),
    happy: IMG('images/happy.webp'),   // 笑顔（本編の config.js の一覧にはないので、場所を直接）       // 笑顔（いい調子のとき）
    melt: IMG('melt'),         // とろける笑顔（とても長く続いたとき）
    troubled: IMG('troubled'), // ミスしたすぐあと
    full: IMG('images/pon/face_full.webp'),   // まんぷく（顔だけの絵）
    shy: IMG('shy')            // コンボの節目（10ごと）に、一瞬だけ照れる
  };
  const SHY_EVERY = 10, SHY_SECONDS = 0.7;
  const SMILE_COMBO = 8;       // このコンボ以上で笑顔
  const MELT_COMBO = 24;       // このコンボ以上で、とろける笑顔

  /* ---------- 画面の部品 ---------- */
  const stage = $('stage'), body = $('body'), img = $('tanu-img');
  const app = $('pon'), molesEl = $('moles');
  const notesEl = $('notes'), judgeEl = $('judge'), target = document.querySelector('.target');
  const wipe = $('wipe'), wipeFace = $('wipe-face');
  img.src = IMG(ART.src);
  app.classList.toggle('art-fade', ART.fade);
  // ワイプの表情：全部の絵を最初から重ねて置き、見せる絵だけを切りかえる
  // （切りかえのたびに絵を読み直すと、表示されない時間ができるため）
  const faceImgs = {};
  Object.keys(FACES).forEach((name) => {
    const im = document.createElement('img');
    im.src = FACES[name];
    if (name === 'full') im.className = 'face-only';   // 顔だけの絵は、ワイプいっぱいに
    im.alt = '';
    im.draggable = false;
    wipeFace.appendChild(im);
    faceImgs[name] = im;
  });

  /* おなかの揺れ：本編の設定をもとに、このページだけ「ポヨン」を強めにする
     tapDent … たたいたときのへこみ（本編 0.08）、damp … 小さいほど長く揺れる（本編 9）
     pullMax … 「ぷるん」で引っぱられる最大の長さ（本編 8.6） */
  const JIGGLE = Object.assign({}, C.bellyJiggle, ART.belly || {}, {
    tapDent: 0.15, damp: 6, reboundBoost: 0.9, pullMax: 13,
    poke: Object.assign({}, C.bellyJiggle.poke, { depth: 0.45 })
  });
  /* たたいたときのリアクション（位置は ART の絵の％）
     armL / armR … 腕。肩（pivot）を軸に「ビクン」と回る。angle は1回の角度（度）
     ※ ネックレスを上下に揺らすのは、首もとが揺れて不自然だったのでやめた */
  const REACT = {
    armL: Object.assign({ type: 'twist', angle: 4 }, ART.armL),
    armR: Object.assign({ type: 'twist', angle: -4 }, ART.armR),
    purun: 2   // 「ぷるん」のときは、この倍だけ大きく反応する
  };
  /* ---------- きせかえ ----------
     本編と同じ記録（localStorage の tanukun-save-v1）の wear を読み書きする。
     同じサイトの別ページなので、本編で付けた部品がそのまま付く */
  const SAVE_KEY = 'tanukun-save-v1';
  const PARTS = C.parts || {};
  function loadSave() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; }
  }
  let wear = loadSave().wear || {};
  // なかよし度（ハートの数）。部品の解放に使う
  const hearts = () => C.friendship.heartAt.filter((pt) => (loadSave().points || 0) >= pt).length;
  const findPart = (slot, id) => (PARTS[slot] ? PARTS[slot].items : []).filter((it) => it.id === id)[0];
  const unlocked = (it) => hearts() >= (it.hearts || 0);
  const partImgs = {};
  Object.keys(PARTS).forEach((slot) => PARTS[slot].items.forEach((it) => {
    const im = new Image();
    im.src = IMG(it.image);
    partImgs[it.id] = im;
  }));
  // いま付けている部品（位置は ART.parts。書いていなければ本編の config.js の位置。どちらもなければ、絵全体に重ねる）
  function wornLayers() {
    const out = [];
    Object.keys(PARTS).forEach((slot) => {
      const it = findPart(slot, wear[slot]);
      if (!it || !unlocked(it)) return;
      const at = ART.parts[it.id] || it;
      out.push({ img: partImgs[it.id], x: at.x, y: at.y, width: at.width });
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
  function setWear(slot, id) {
    if (id) wear[slot] = id; else delete wear[slot];
    // 本編の記録のほかの項目はそのままにして、wear だけ書きかえる
    try {
      const data = loadSave();
      data.wear = Object.assign({}, wear);
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) { /* 保存できない環境では、その回だけ */ }
    belly.refresh();
    renderParts();
    renderWearMenu();
  }
  // はじめる前の画面の「きせかえ」
  function renderWearMenu() {
    const box = $('wear');
    box.textContent = '';
    Object.keys(PARTS).forEach((slot) => {
      const row = document.createElement('div');
      row.className = 'wear-row';
      row.appendChild(Object.assign(document.createElement('span'), { textContent: PARTS[slot].label }));
      [{ id: '', name: 'なし' }].concat(PARTS[slot].items).forEach((it) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip' + ((wear[slot] || '') === it.id ? ' on' : '');
        const open = !it.id || unlocked(it);
        b.disabled = !open;
        b.textContent = open ? it.name : '🔒 💖×' + it.hearts;
        b.addEventListener('click', () => setWear(slot, it.id));
        row.appendChild(b);
      });
      box.appendChild(row);
    });
    box.hidden = !Object.keys(PARTS).length;
  }

  const belly = window.TanuBelly({ config: JIGGLE, img: img, canvas: $('belly-canvas'),
    overlay: partsLayer, layers: () => wornLayers(),
    extra: { armL: REACT.armL, armR: REACT.armR, fat: Object.assign({ type: 'swell' }, ART.fat) } });
  renderParts();
  renderWearMenu();
  let armSide = 0;
  function react(big) {
    const k = big ? REACT.purun : 1;
    if (big) {
      belly.twitch('armL', REACT.armL.angle * k);
      belly.twitch('armR', REACT.armR.angle * k);
    } else {
      // 腕は左右かわりばんこに
      const arm = (armSide++ % 2) ? 'armR' : 'armL';
      belly.twitch(arm, REACT[arm].angle);
    }
    wipeFace.classList.remove('tick'); void wipeFace.offsetWidth; wipeFace.classList.add('tick');
  }
  img.addEventListener('load', () => belly.warm([img.src]), { once: true });

  /* ---------- おなかのアップ ----------
     ART.view の範囲を画面に映す */
  const VIEW = ART.view;
  let scale = 1, offX = 0, offY = 0;
  function layout() {
    const sw = stage.clientWidth, sh = stage.clientHeight;
    scale = sw / VIEW.w;
    offX = sw / 2 - VIEW.cx * scale;
    offY = sh * VIEW.at - VIEW.cy * scale;
    body.style.width = ART.w * scale + 'px';
    body.style.height = ART.h * scale + 'px';
    body.style.left = offX + 'px';
    body.style.top = offY + 'px';
  }
  window.addEventListener('resize', layout);
  layout();

  /* ---------- 音（Web Audio でその場で作る） ---------- */
  let ac = null, noise = null;
  function makeAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    // iPhone：マナーモードでも鳴るようにする（対応しているブラウザだけ）
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    const a = new AC({ latencyHint: 'interactive' });
    noise = a.createBuffer(1, a.sampleRate * 0.3, a.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return a;
  }
  function env(g, t, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  // ぽん：低い音が「ぼわん」と下がる（おなか太鼓）
  function soundPon(t, vol) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.18);
    env(g, t, 0.9 * vol, 0.38);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + 0.4);
    hitNoise(t, 900, 0.25 * vol, 0.04);
  }
  // ぽこ：少し高く、短く「ぽこっ」
  function soundPoko(t, vol) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(240, t + 0.09);
    env(g, t, 0.7 * vol, 0.16);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + 0.2);
    hitNoise(t, 2200, 0.3 * vol, 0.06);
  }
  // ぷるん：音がふるえながら下がる「ぷるるん」
  function soundPurun(t) {
    const o = ac.createOscillator(), g = ac.createGain();
    const lfo = ac.createOscillator(), depth = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(340, t);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.45);
    lfo.frequency.value = 16;
    depth.gain.value = 45;
    lfo.connect(depth).connect(o.frequency);
    env(g, t, 0.7, 0.55);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + 0.6);
    lfo.start(t); lfo.stop(t + 0.6);
  }
  // まちがえた：「ぶぶっ」
  function soundWrong(t) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'square';
    o.frequency.value = 150;
    env(g, t, 0.18, 0.22);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + 0.25);
  }
  // 「たべたい！」が変わった：「チーン」
  function soundBell(t) {
    [1320, 1980].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      env(g, t, i ? 0.08 : 0.18, 0.6);
      o.connect(g).connect(ac.destination);
      o.start(t); o.stop(t + 0.65);
    });
  }
  // シャカシャカ（ハイハット）。accent は拍の頭
  function soundHat(t, accent) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise;
    f.type = 'highpass'; f.frequency.value = 7000;
    env(g, t, accent ? 0.22 : 0.1, accent ? 0.06 : 0.035);
    s.connect(f).connect(g).connect(ac.destination);
    s.start(t); s.stop(t + 0.08);
  }
  // 数を数える音（カッ）
  function soundClick(t, high) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'square';
    o.frequency.value = high ? 1400 : 1000;
    env(g, t, 0.12, 0.05);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + 0.06);
  }
  function hitNoise(t, freq, vol, dur) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise;
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
    env(g, t, vol, dur);
    s.connect(f).connect(g).connect(ac.destination);
    s.start(t); s.stop(t + dur + 0.02);
  }

  /* ---------- 譜面をつくる（すべて「曲の始まりからの秒」） ---------- */
  function buildChart() {
    const notes = [], hats = [], clicks = [], banners = [], wants = [];
    const food = mode === 'food';
    let want = null;
    let t = 0;
    const first = SONG.sections[0].bpm;
    for (let i = 0; i < SONG.countIn; i++) clicks.push({ t: t + i * 60 / first, high: i === 0 });
    t += SONG.countIn * 60 / first;
    SONG.sections.forEach((sec, si) => {
      const eighth = 30 / sec.bpm;
      banners.push({ t: t, bpm: sec.bpm, first: si === 0 });
      if (food) {
        // まんぷく：この速さの間の「たべたい！」（前と同じ食べものにはしない）
        want = pick(FOOD.foods.filter((f) => f !== want));
        wants.push({ t: t - FOOD.appear - 0.05, food: want });
      }
      let firstInSec = true;
      for (let b = 0; b < sec.bars; b++) {
        for (let e = 0; e < 8; e++) {
          hats.push({ t: t, accent: e % 2 === 0 });
          const purun = !food && b % SONG.purun.every === SONG.purun.every - 1 && e === SONG.purun.at;
          const rest = food && b === sec.bars - 1 && e >= 4;   // 吹き出しが変わる前の半小節は休み
          if (SONG.pattern[e] && !rest) {
            const n = { t: t, kind: purun ? 'purun' : SONG.pattern[e] };
            if (food) {
              n.target = firstInSec || Math.random() < FOOD.targetRate;
              n.food = n.target ? want : pick(FOOD.foods.filter((f) => f !== want));
              firstInSec = false;
            }
            notes.push(n);
          }
          t += eighth;
        }
      }
    });
    // 最後に「ぽん！」で決める
    notes.push(food ? { t: t, kind: 'pon', last: true, target: true, food: want } : { t: t, kind: 'pon', last: true });
    // おなかモード：◉ の出る場所をランダムに（前の2つの ◉ から gap 以上はなす）
    const A = MOLE.area;
    notes.forEach((n, i) => {
      for (let k = 0; k < 30; k++) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
        n.ix = A.x + Math.cos(a) * r * A.rx;
        n.iy = A.y + Math.sin(a) * r * A.ry;
        const near = notes.slice(Math.max(0, i - 2), i).some((m) => Math.hypot(m.ix - n.ix, m.iy - n.iy) < MOLE.gap);
        if (!near) break;
      }
    });
    return { notes: notes, hats: hats, clicks: clicks, banners: banners, wants: wants, end: t + 1.2 };
  }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ---------- 遊んでいる間の状態 ---------- */
  let chart = null, t0 = 0, playing = false, nextNote = 0, nextBanner = 0;
  let paused = false;
  let mode = 'belly';   // 'lane'＝ステージ1 ながれる／'belly'＝ステージ2 おなか／'food'＝ステージ3 まんぷく
  let nextWant = 0, fed = 0, targets = 0, wrongs = 0, wrongUntil = -9;   // まんぷく：食べた数・「たべたい」の数・まちがえた時
  let score = 0, combo = 0, maxCombo = 0, lastMiss = -9, shyUntil = -9;
  let counts = { perfect: 0, good: 0, ok: 0, miss: 0 };

  // いま聞こえている音が「曲の始まりから何秒目か」
  function songTime() {
    if (ac.getOutputTimestamp) {
      const ts = ac.getOutputTimestamp();
      // 中断から戻った直後などで、記録が古い（0.1秒より前）ときは使わない
      if (ts.contextTime > 0 && ts.performanceTime > 0 && performance.now() - ts.performanceTime < 100) {
        return ts.contextTime + (performance.now() - ts.performanceTime) / 1000 - t0;
      }
    }
    return ac.currentTime - (ac.outputLatency || ac.baseLatency || 0) - t0;
  }

  function start(m) {
    if (typeof m === 'string') mode = m;
    app.classList.toggle('mode-belly', onBelly());
    app.classList.toggle('mode-food', mode === 'food');
    app.classList.toggle('mode-lane', mode === 'lane');
    layout();   // モードで、おなかを映す広さが変わる
    // 揺れの準備（絵の色の読み取り・変形の計算表）を、音が鳴り出す前にすませておく
    // （最初にたたいた瞬間にやると、画面が一瞬止まるため）
    belly.ready();
    if (ac) ac.close();
    ac = makeAudio();
    if (!ac) { $('start').querySelector('.small').textContent = 'このブラウザでは音が出せません。別のブラウザで開いてね'; return; }
    ac.resume();
    chart = buildChart();
    t0 = ac.currentTime + SONG.lead;
    chart.clicks.forEach((c) => soundClick(t0 + c.t, c.high));
    chart.hats.forEach((h) => soundHat(t0 + h.t, h.accent));

    notesEl.textContent = '';
    molesEl.textContent = '';
    chart.notes.forEach((n) => {
      n.el = document.createElement('div');
      n.done = false;
      if (onBelly()) {
        n.el.className = 'mole' + (n.kind === 'pon' ? '' : ' ' + n.kind) + (n.food ? ' food' : '');
        if (n.food) n.el.appendChild(Object.assign(document.createElement('span'), { textContent: n.food }));
        n.ring = document.createElement('div');
        n.ring.className = 'ring';
        n.el.appendChild(n.ring);
        molesEl.appendChild(n.el);
      } else {
        n.el.className = 'note' + (n.kind === 'pon' ? '' : ' ' + n.kind);
        n.el.style.transform = 'translateX(-100px)';
        notesEl.appendChild(n.el);
      }
    });
    nextNote = 0; nextBanner = 0;
    // まんぷく
    nextWant = 0; fed = 0; wrongs = 0; wrongUntil = -9;
    targets = chart.notes.filter((n) => n.target).length;
    belly.setBase('fat', 0);
    $('want').hidden = true;
    $('full-fill').style.width = '0%';
    score = 0; combo = 0; maxCombo = 0; lastMiss = -9; shyUntil = -9;
    counts = { perfect: 0, good: 0, ok: 0, miss: 0 };
    $('score').textContent = '0';
    showCombo();
    setFace('normal');
    $('start').hidden = true;
    $('result').hidden = true;
    $('pause').hidden = true;
    $('count').hidden = true;
    $('progress-fill').style.width = '0%';
    paused = false;
    playing = true;
    showBar();
    // 遊び方の説明：最初の ◉ が見えはじめる少し前に消す
    const howto = $('howto');
    howto.innerHTML = HOWTO[mode].map((line) => '<p>' + line + '</p>').join('') + '<p class="howto-sub">8ビート・だんだん速くなるよ</p>';
    howto.classList.remove('out');
    howto.hidden = false;
    howtoUntil = chart.notes[0].t - (mode === 'lane' ? 0.6 : appearT() + 0.1);
    requestAnimationFrame(frame);
  }
  let howtoUntil = 0;

  /* ---------- 毎フレーム：◉ を動かす・見のがしをミスにする ---------- */
  const TARGET_X = 48;
  function frame() {
    if (!playing) return;
    const now = songTime();
    // 遊び方の説明を消す
    const howto = $('howto');
    if (!howto.hidden && !howto.classList.contains('out') && now >= howtoUntil) {
      howto.classList.add('out');
      setTimeout(() => { if (howto.classList.contains('out')) howto.hidden = true; }, 300);
    }
    // クリアまでのバー
    $('progress-fill').style.width = Math.max(0, Math.min(100, now / chart.end * 100)) + '%';
    const laneW = notesEl.clientWidth;
    const speed = (laneW + 20 - TARGET_X) / SONG.travel;   // 1秒に何ピクセル進むか

    // 見のがした ◉ はミス
    while (nextNote < chart.notes.length && chart.notes[nextNote].done) nextNote++;
    for (let i = nextNote; i < chart.notes.length; i++) {
      const n = chart.notes[i];
      if (n.t > now - MISS_AFTER) break;
      if (n.done) continue;
      n.done = true;
      n.el.classList.add('done');
      if (n.food && !n.target) continue;   // 「たべたい」でない食べものは、見のがしてよい
      judge(null, now, n);
    }
    if (onBelly()) {
      // おなかモード：◉ がふわっと出て、まわりの輪が縮み、たたく時に ◉ と重なる
      for (let i = nextNote; i < chart.notes.length; i++) {
        const n = chart.notes[i];
        const dt = n.t - now;
        if (dt > appearT()) break;
        if (n.done) continue;
        const q = 1 - Math.max(0, dt) / appearT();   // 0（出たところ）→ 1（たたく時）
        n.el.style.left = (offX + n.ix * scale) + 'px';
        n.el.style.top = (offY + n.iy * scale) + 'px';
        n.el.style.opacity = Math.min(1, q * 3);
        n.ring.style.transform = 'scale(' + (1 + 1.6 * (1 - q)) + ')';
      }
    } else {
      for (let i = nextNote; i < chart.notes.length; i++) {
        const n = chart.notes[i];
        const dt = n.t - now;
        if (dt > SONG.travel + 0.2) break;
        if (!n.done) n.el.style.transform = 'translateX(' + (TARGET_X + dt * speed) + 'px)';
      }
    }
    // 速さが変わるお知らせ
    if (nextBanner < chart.banners.length && now >= chart.banners[nextBanner].t - 0.4) {
      const b = chart.banners[nextBanner++];
      banner(b.first ? 'スタート！ BPM ' + b.bpm : 'スピードアップ！ BPM ' + b.bpm);
    }
    // まんぷく：吹き出しの「たべたい！」を切りかえる
    if (mode === 'food' && nextWant < chart.wants.length && now >= chart.wants[nextWant].t) {
      showWant(chart.wants[nextWant++].food);
    }
    // ワイプ：ミスのあと少しは困り顔、その後はコンボで笑顔に（まんぷくで、おなかいっぱいに近いときは満足顔）
    if (now - lastMiss < 0.8 || now < wrongUntil) setFace('troubled');
    else if (mode === 'food' && fed / Math.max(1, targets) >= 0.66) setFace('full');
    else if (now < shyUntil) setFace('shy');
    else if (combo >= MELT_COMBO) setFace('melt');
    else if (combo >= SMILE_COMBO) setFace('happy');
    else setFace('normal');

    if (now >= chart.end) { finish(); return; }
    requestAnimationFrame(frame);
  }

  /* ---------- たたいた・すべらせた ----------
     ・ふつうは、指が触れた瞬間に「たたいた」として判定する
     ・いちばん近いのが「ぷるん」のときは、指が動くか離れるまで待つ
       動いた → ぷるん（判定は指が触れた瞬間で行う）／動かずに離れた → たたいた */
  const pointers = {};
  // いちばん近い、まだ判定していない音符（kinds に入っている種類だけ）
  // おなかモードでは、指の位置（p）が ◉ の近くのものだけ
  function nearest(now, kinds, p) {
    let best = null, bestD = 9;
    for (let i = nextNote; i < chart.notes.length; i++) {
      const n = chart.notes[i];
      if (n.t - now > 0.3) break;
      if (n.done || kinds.indexOf(n.kind) < 0) continue;
      if (onBelly() && p &&
          Math.hypot(offX + n.ix * scale - p.sx, offY + n.iy * scale - p.sy) > MOLE.hitR) continue;
      const d = Math.abs(n.t - now);
      if (d < bestD) { best = n; bestD = d; }
    }
    return best ? { note: best, d: bestD } : null;
  }
  function hit(found, now) {
    const j = found && JUDGE.find((x) => found.d <= x.within);
    if (!j) return null;
    found.note.done = true;
    found.note.el.classList.add(onBelly() ? 'hit' : 'done');
    judge(j, now, found.note);
    return j;
  }
  function tap(p) {
    const found = playing ? nearest(p.now, ['pon', 'poko'], p) : null;
    // まんぷく：「たべたい」でない食べものをたたいた → ミス
    if (found && found.note.food && !found.note.target && found.d <= MISS_AFTER) {
      found.note.done = true;
      found.note.el.classList.add('done');
      if (ac) soundWrong(ac.currentTime);
      popWord('それじゃないよ〜', p.sx, p.sy, 'wrong');
      wrongUntil = p.now + 0.8;
      wrongs++;
      judge(null, p.now, found.note);
      return;
    }
    const kind = found && found.d < 0.25 ? found.note.kind : 'pon';
    if (ac) (kind === 'poko' ? soundPoko : soundPon)(ac.currentTime, 1);
    react(false);
    const eat = found && found.note.food;
    popWord(eat ? 'ぱくっ！' : kind === 'poko' ? 'ぽこ！' : 'ぽん！', p.sx, p.sy, kind);
    if (playing && hit(found, p.now) && eat) feed();
  }
  // まんぷく：食べた数に合わせて、おなかをふくらませる
  function feed() {
    fed++;
    const level = Math.min(1, fed / Math.max(1, targets));
    belly.setBase('fat', FOOD.maxFat * level);
    $('full-fill').style.width = level * 100 + '%';
  }
  function showWant(food) {
    const el = $('want');
    el.textContent = '';
    el.appendChild(Object.assign(document.createElement('span'), { className: 'want-food', textContent: food }));
    el.appendChild(document.createTextNode('たべたい！'));
    el.hidden = false;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    if (ac) soundBell(ac.currentTime);
  }
  function purun(p) {
    p.purun = true;
    if (ac) soundPurun(ac.currentTime);
    react(true);
    popWord('ぷるん！', p.sx, p.sy, 'purun');
    if (playing) hit(nearest(p.now, ['purun'], p), p.now);
  }

  stage.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;
    const ix = (sx - offX) / scale, iy = (sy - offY) / scale;
    const p = pointers[e.pointerId] = { sx: sx, sy: sy, x0: e.clientX, y0: e.clientY, now: 0, wait: false, purun: false, pull: false };
    if (belly.ready()) belly.press('belly', ix, iy);
    else { body.classList.remove('bounce'); void body.offsetWidth; body.classList.add('bounce'); }
    if (playing && ac) {
      // 指が触れた瞬間（イベントが届くまでの遅れを差し引く）
      const late = Math.min(0.1, Math.max(0, (performance.now() - e.timeStamp) / 1000));
      p.now = songTime() - late;
      const t = nearest(p.now, ['pon', 'poko'], p), pr = nearest(p.now, ['purun'], p);
      if (pr && pr.d <= MISS_AFTER && (!t || pr.d < t.d)) { p.wait = true; return; }
    }
    p.wait = true;   // 遊んでいないとき：すべらせたら「ぷるん」、離したら「ぽん」
    if (playing && ac) { p.wait = false; tap(p); }
  });

  stage.addEventListener('pointermove', (e) => {
    const p = pointers[e.pointerId];
    if (!p) return;
    const dx = e.clientX - p.x0, dy = e.clientY - p.y0;
    if (!p.pull && Math.hypot(dx, dy) < SWIPE_PX) return;
    if (p.wait) { p.wait = false; purun(p); }
    // すべらせたら、指の動きの2.5倍おなかを引っぱる（短くすべらせても大きく揺れる）
    // 「〜」が近くにないときも引っぱって揺らす（点数には数えない）
    p.pull = true;
    belly.drag('belly', dx * 2.5, dy * 2.5, 1 / scale);
  });

  function lift(e) {
    const p = pointers[e.pointerId];
    if (!p) return;
    delete pointers[e.pointerId];
    if (p.wait && e.type === 'pointerup') tap(p);
    // ぷるん：引っぱった所から、はなすと大きく揺れて戻る
    belly.release('belly', e.type === 'pointerup' && !p.pull);
  }
  stage.addEventListener('pointerup', lift);
  stage.addEventListener('pointercancel', lift);

  function judge(j, now, n) {
    if (!j) {
      counts.miss++;
      combo = 0;
      lastMiss = now;
      showJudge('ミス', 'miss', n);
    } else {
      counts[j.key]++;
      combo++;
      maxCombo = Math.max(maxCombo, combo);
      if (combo % SHY_EVERY === 0) shyUntil = now + SHY_SECONDS;
      // コンボ10ごとに、1回の点数が10点ずつ増える（最大 +50）
      score += j.point + Math.min(50, Math.floor(combo / 10) * 10);
      $('score').textContent = score;
      showJudge(j.label, j.key, n);
      target.classList.remove('hit'); void target.offsetWidth; target.classList.add('hit');
    }
    showCombo();
  }

  function showJudge(text, cls, n) {
    // おなかモード：◉ のあった場所の少し上に出す
    if (onBelly()) {
      if (n) popWord(text, offX + n.ix * scale, offY + n.iy * scale - 44, 'jd ' + cls);
      return;
    }
    judgeEl.textContent = text;
    judgeEl.className = 'judge ' + cls;
    void judgeEl.offsetWidth;
    judgeEl.classList.add('show');
  }
  function showCombo() {
    const el = $('combo');
    el.textContent = combo >= 2 ? combo + ' コンボ' : '';
    if (combo >= 2) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  }
  function banner(text) {
    const el = $('bpm');
    el.textContent = text;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  }
  function popWord(text, x, y, kind) {
    const el = document.createElement('div');
    el.className = 'pop ' + kind;
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    $('pops').appendChild(el);
    setTimeout(() => el.remove(), 600);
  }

  let face = '';
  function setFace(name) {
    if (face === name) return;
    face = name;
    Object.keys(faceImgs).forEach((n) => faceImgs[n].classList.toggle('on', n === name));
    wipe.classList.remove('bump'); void wipe.offsetWidth; wipe.classList.add('bump');
  }

  /* ---------- 結果 ---------- */
  // image … ランク別イラスト（720×1080。tools/make_pon_art.py でつくる）
  const RANKS = [
    { rate: 0.9, title: 'ぽんぽこ名人！', line: 'すごい！おなかが最高の太鼓になったよ！', face: 'melt', image: 'images/pon/rank1.webp' },
    { rate: 0.7, title: 'いいリズム！', line: 'いい音だったね〜。またたたいてね！', face: 'happy', image: 'images/pon/rank2.webp' },
    { rate: 0.4, title: 'なかなか！', line: 'えへへ、だんだん速くなるの、むずかしいよね。', face: 'normal', image: 'images/pon/rank3.webp' },
    { rate: 0, title: 'れんしゅう中', line: 'ぐぬぬ…もう一回！おなかはいつでも貸すからね！', face: 'troubled', image: 'images/pon/rank4.webp' }
  ];
  RANKS.forEach((r) => { r.src = IMG(r.image); new Image().src = r.src; });   // 先に読みこんでおく
  function finish() {
    playing = false;
    $('progress-fill').style.width = '100%';
    showBar();
    // まんぷくは「たべたい」の数＋まちがえてたたいた数（なんでもたたくと、ランクが下がる）
    const total = chart.notes.filter((n) => !n.food || n.target).length + wrongs;
    const rate = (counts.perfect + counts.good * 0.6 + counts.ok * 0.2) / total;
    const rank = RANKS.find((r) => rate >= r.rate);
    setFace(rank.face);
    $('r-title').textContent = rank.title;
    $('r-img').src = rank.src;
    $('result').scrollTop = 0;
    $('r-score').textContent = score;
    ['perfect', 'good', 'ok', 'miss'].forEach((k) => { $('r-' + k).textContent = counts[k]; });
    $('r-combo').textContent = maxCombo;
    $('r-line').textContent = 'タヌくん「' + rank.line + '」';
    const url = /^https?:/.test(location.href) ? location.href.split(/[?#]/)[0] : 'https://tanukun.pages.dev/pon/';
    const text = '🥁 ぽんぽこリズム ' + STAGES[mode].name + '\n' + score + 'てん「' + rank.title + '」さいだい' + maxCombo + 'コンボ\n#タヌくん #ぽんぽこリズム\n' + url;
    $('btn-post').href = 'https://x.com/intent/post?text=' + encodeURIComponent(text);
    // 次のステージへ
    const next = STAGES[mode].next;
    $('btn-next').hidden = !next;
    if (next) $('btn-next').textContent = STAGES[next].name.replace(/（.*/, '') + ' へ ▶';
    if (mode === 'food') $('r-line').textContent = 'タヌくん「ごちそうさま！' + (fed / Math.max(1, targets) >= 0.66 ? 'おなかいっぱい〜！」' : 'もうちょっと食べたかったな〜」');
    $('result').hidden = false;
  }

  /* ---------- 中断・再開 ----------
     中断すると音も止まる（AudioContext を一時停止。予約した音も、止まった所から続く）
     再開は「3・2・1」と数えてから */
  function pause() {
    if (!playing || paused) return;
    paused = true;
    playing = false;   // 中断中は、たたいても判定しない
    if (ac) ac.suspend();
    Object.keys(pointers).forEach((id) => { delete pointers[id]; });
    belly.stop();
    $('count').hidden = true;
    $('pause').hidden = false;
    showBar();
  }
  function resume() {
    if (!paused) return;
    $('pause').hidden = true;
    const el = $('count');
    el.hidden = false;
    let n = 3;
    (function tick() {
      if (!paused) return;
      if (n === 0) {
        el.hidden = true;
        ac.resume().then(() => {
          if (!paused) return;
          paused = false;
          playing = true;
          showBar();
          requestAnimationFrame(frame);
        });
        return;
      }
      el.textContent = n--;
      el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
      setTimeout(tick, 600);
    })();
  }
  // やめて、ステージを選ぶ画面に
  function quit() {
    playing = false;
    paused = false;
    if (ac) { ac.close(); ac = null; }
    notesEl.textContent = '';
    molesEl.textContent = '';
    $('pause').hidden = true;
    $('count').hidden = true;
    $('result').hidden = true;
    $('progress-fill').style.width = '0%';
    $('start').hidden = false;
    $('want').hidden = true;
    $('howto').hidden = true;
    belly.setBase('fat', 0);
    setFace('normal');
    showBar();
  }
  // 上のバー：プレイ中は ⏸、それ以外は「タヌくん」（本編）へのリンク
  // 確認用リンク（本編がない所）では、本編へのリンクは出さない
  const IN_SITE = /\/pon\/(index\.html)?$/.test(location.pathname);
  function showBar() {
    $('btn-pause').hidden = !playing;
    $('back-home').hidden = playing || paused || !IN_SITE;
  }
  $('pause-home').hidden = !IN_SITE;

  // とちゅうで別のアプリに切りかえたら、中断する
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });

  $('btn-pause').addEventListener('click', pause);
  $('btn-resume').addEventListener('click', resume);
  $('btn-retry').addEventListener('click', () => start());
  $('btn-quit').addEventListener('click', quit);
  $('btn-belly').addEventListener('click', () => start('belly'));
  $('btn-lane').addEventListener('click', () => start('lane'));
  $('btn-again').addEventListener('click', () => start());
  $('btn-next').addEventListener('click', () => start(STAGES[mode].next));
  $('btn-food').addEventListener('click', () => start('food'));
  $('btn-mode').addEventListener('click', quit);
  setFace('normal');
  showBar();
})();
