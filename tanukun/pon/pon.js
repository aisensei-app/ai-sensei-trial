/* =========================================================
   ぽんぽこリズム（試作）
   ・リズムは 8ビート「ぽん・ぽこ・ぽんぽん・ぽこ」のくり返し
   ・BPM（1分間の拍の数）が 80 → 120 とだんだん速くなる（約50秒）
   ・ステージは2つ（はじめる前に選ぶ）
       ステージ2 おなか … ◉ がおなかの上のランダムな場所にふわっと出る。まわりの輪が縮んで、
                      ◉ にぴったり重なったときにたたく（目線がおなかから離れないので、揺れを楽しめる）
       ステージ1 ながれる … ◉ が右から左に流れてきて、左のわくに重なったときにたたく
   ・ピンクの「〜」は、指でおなかをさっとすべらせて「ぷるん」（たたくのとは別のアクション）
   ・タイミングが合うほど点数が高い。続けて合わせると右上のタヌくんが笑顔になる
   ・音はすべてプログラムで作る（Web Audio）。音の素材ファイルは使わない
   ・おなかの「ぷるん」は本編と同じ仕組み（belly.js）
   ・たたくたびに、タヌくんの腕が「ビクン」、ネックレスが「ぷるん」と反応する
   ========================================================= */
(function () {
  'use strict';

  const C = window.TANU_CONFIG;
  const $ = (id) => document.getElementById(id);
  // 本編の設定の絵は 'images/…' なので、このページ（pon/）からは '../' を付ける
  const IMG = (name) => (/^data:/.test(C.images[name]) ? '' : '../') + C.images[name];

  /* ---------- 譜面のもと ----------
     sections … 速さ（bpm）と小節の数。上から順に速くなる
     pattern  … 1小節を8つに分けた位置に、たたく音（pon＝低い音、poko＝高い音）
     purun    … 何小節に1回、どの位置を「ぷるん」（指ですべらせる）にするか */
  const SONG = {
    lead: 0.8,              // はじめるボタンから、音が鳴りはじめるまで（秒）
    countIn: 4,             // 最初の「カッ・カッ・カッ・カッ」（数を数える拍）
    travel: 1.6,            // ◉ が右はしから、わくに着くまでの時間（秒）
    sections: [
      { bpm: 80, bars: 4 },
      { bpm: 90, bars: 4 },
      { bpm: 100, bars: 4 },
      { bpm: 110, bars: 4 },
      { bpm: 120, bars: 4 }
    ],
    pattern: { 0: 'pon', 2: 'poko', 4: 'pon', 5: 'pon', 6: 'poko' },
    purun: { every: 2, at: 6 }
  };
  const SWIPE_PX = 18;
  /* おなかモード
     appear … ◉ が出てから、たたく時までの秒数（この間に輪が縮む）
     area   … ◉ が出る範囲（720×900 の絵で、おなかの楕円。x, y は中心、rx, ry は半径）
     gap    … 続けて出る ◉ どうしの、最低限の離れ具合（絵のピクセル）
     hitR   … 指が ◉ の中心からこれだけ（画面のピクセル）以内なら当たり */
  const MOLE = { appear: 1.0, area: { x: 255, y: 405, rx: 112, ry: 80 }, gap: 80, hitR: 56 };   // 指がこれだけ動いたら「すべらせた」とみなす（画面のピクセル）

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
    happy: IMG('happy'),       // 笑顔（いい調子のとき）
    melt: IMG('melt'),         // とろける笑顔（とても長く続いたとき）
    troubled: IMG('troubled'), // ミスしたすぐあと
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
  img.src = IMG('normal');
  Object.values(FACES).forEach((src) => { new Image().src = src; });

  /* おなかの揺れ：本編の設定をもとに、このページだけ「ポヨン」を強めにする
     tapDent … たたいたときのへこみ（本編 0.08）、damp … 小さいほど長く揺れる（本編 9）
     pullMax … 「ぷるん」で引っぱられる最大の長さ（本編 8.6） */
  const JIGGLE = Object.assign({}, C.bellyJiggle, {
    tapDent: 0.15, damp: 6, reboundBoost: 0.9, pullMax: 13,
    poke: Object.assign({}, C.bellyJiggle.poke, { depth: 0.45 })
  });
  /* たたいたときのリアクション（720×900 の絵の％）
     armL / armR … 腕。肩（pivot）を軸に「ビクン」と回る。angle は1回の角度（度）
     neck        … ネックレス。上下に「ぷるん」。kick は沈む深さ（ピクセル） */
  const REACT = {
    armL: { type: 'twist', x: 12.2, y: 44.4, rx: 6.3, ry: 16.7, pivotX: 18.1, pivotY: 30, reach: 38.9, angle: 4 },
    armR: { type: 'twist', x: 66.7, y: 44.4, rx: 9.0, ry: 16.7, pivotX: 61.1, pivotY: 30, reach: 38.9, angle: -4 },
    neck: { type: 'bob', x: 38.2, y: 25.3, rx: 13.9, ry: 4.4, kick: 5 },
    purun: 2   // 「ぷるん」のときは、この倍だけ大きく反応する
  };
  const belly = window.TanuBelly({ config: JIGGLE, img: img, canvas: $('belly-canvas'),
    extra: { armL: REACT.armL, armR: REACT.armR, neck: REACT.neck } });
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
    belly.kick('neck', REACT.neck.kick * k);
    wipeFace.classList.remove('tick'); void wipeFace.offsetWidth; wipeFace.classList.add('tick');
  }
  img.addEventListener('load', () => belly.warm([img.src]), { once: true });

  /* ---------- おなかのアップ ----------
     720×900 の絵のうち、おなか（中心 255, 420）を画面いっぱいに映す */
  const VIEW = { cx: 270, cy: 410, w: 420 };   // 横幅は、両腕が入るくらい
  let scale = 1, offX = 0, offY = 0;
  function layout() {
    const sw = stage.clientWidth, sh = stage.clientHeight;
    scale = sw / VIEW.w;
    offX = sw / 2 - VIEW.cx * scale;
    offY = sh * 0.48 - VIEW.cy * scale;
    body.style.width = 720 * scale + 'px';
    body.style.height = 900 * scale + 'px';
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
    const notes = [], hats = [], clicks = [], banners = [];
    let t = 0;
    const first = SONG.sections[0].bpm;
    for (let i = 0; i < SONG.countIn; i++) clicks.push({ t: t + i * 60 / first, high: i === 0 });
    t += SONG.countIn * 60 / first;
    SONG.sections.forEach((sec, si) => {
      const eighth = 30 / sec.bpm;
      banners.push({ t: t, bpm: sec.bpm, first: si === 0 });
      for (let b = 0; b < sec.bars; b++) {
        for (let e = 0; e < 8; e++) {
          hats.push({ t: t, accent: e % 2 === 0 });
          const purun = b % SONG.purun.every === SONG.purun.every - 1 && e === SONG.purun.at;
          if (SONG.pattern[e]) notes.push({ t: t, kind: purun ? 'purun' : SONG.pattern[e] });
          t += eighth;
        }
      }
    });
    // 最後に「ぽん！」で決める
    notes.push({ t: t, kind: 'pon', last: true });
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
    return { notes: notes, hats: hats, clicks: clicks, banners: banners, end: t + 1.2 };
  }

  /* ---------- 遊んでいる間の状態 ---------- */
  let chart = null, t0 = 0, playing = false, nextNote = 0, nextBanner = 0;
  let mode = 'belly';   // 'belly'＝おなかモード／'lane'＝ながれるモード
  let score = 0, combo = 0, maxCombo = 0, lastMiss = -9, shyUntil = -9;
  let counts = { perfect: 0, good: 0, ok: 0, miss: 0 };

  // いま聞こえている音が「曲の始まりから何秒目か」
  function songTime() {
    if (ac.getOutputTimestamp) {
      const ts = ac.getOutputTimestamp();
      if (ts.contextTime > 0 && ts.performanceTime > 0) {
        return ts.contextTime + (performance.now() - ts.performanceTime) / 1000 - t0;
      }
    }
    return ac.currentTime - (ac.outputLatency || ac.baseLatency || 0) - t0;
  }

  function start(m) {
    if (typeof m === 'string') mode = m;
    app.classList.toggle('mode-belly', mode === 'belly');
    app.classList.toggle('mode-lane', mode === 'lane');
    layout();   // モードで、おなかを映す広さが変わる
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
      if (mode === 'belly') {
        n.el.className = 'mole' + (n.kind === 'pon' ? '' : ' ' + n.kind);
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
    score = 0; combo = 0; maxCombo = 0; lastMiss = -9; shyUntil = -9;
    counts = { perfect: 0, good: 0, ok: 0, miss: 0 };
    $('score').textContent = '0';
    showCombo();
    setFace('normal');
    $('start').hidden = true;
    $('result').hidden = true;
    playing = true;
    requestAnimationFrame(frame);
  }

  /* ---------- 毎フレーム：◉ を動かす・見のがしをミスにする ---------- */
  const TARGET_X = 48;
  function frame() {
    if (!playing) return;
    const now = songTime();
    const laneW = notesEl.clientWidth;
    const speed = (laneW + 20 - TARGET_X) / SONG.travel;   // 1秒に何ピクセル進むか

    // 見のがした ◉ はミス
    while (nextNote < chart.notes.length && chart.notes[nextNote].done) nextNote++;
    for (let i = nextNote; i < chart.notes.length; i++) {
      const n = chart.notes[i];
      if (n.t > now - MISS_AFTER) break;
      if (!n.done) { n.done = true; n.el.classList.add('done'); judge(null, now, n); }
    }
    if (mode === 'belly') {
      // おなかモード：◉ がふわっと出て、まわりの輪が縮み、たたく時に ◉ と重なる
      for (let i = nextNote; i < chart.notes.length; i++) {
        const n = chart.notes[i];
        const dt = n.t - now;
        if (dt > MOLE.appear) break;
        if (n.done) continue;
        const q = 1 - Math.max(0, dt) / MOLE.appear;   // 0（出たところ）→ 1（たたく時）
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
    // ワイプ：ミスのあと少しは困り顔、その後はコンボで笑顔に
    if (now - lastMiss < 0.8) setFace('troubled');
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
      if (mode === 'belly' && p &&
          Math.hypot(offX + n.ix * scale - p.sx, offY + n.iy * scale - p.sy) > MOLE.hitR) continue;
      const d = Math.abs(n.t - now);
      if (d < bestD) { best = n; bestD = d; }
    }
    return best ? { note: best, d: bestD } : null;
  }
  function hit(found, now) {
    const j = found && JUDGE.find((x) => found.d <= x.within);
    if (!j) return;
    found.note.done = true;
    found.note.el.classList.add(mode === 'belly' ? 'hit' : 'done');
    judge(j, now, found.note);
  }
  function tap(p) {
    const found = playing ? nearest(p.now, ['pon', 'poko'], p) : null;
    const kind = found && found.d < 0.25 ? found.note.kind : 'pon';
    if (ac) (kind === 'poko' ? soundPoko : soundPon)(ac.currentTime, 1);
    react(false);
    popWord(kind === 'poko' ? 'ぽこ！' : 'ぽん！', p.sx, p.sy, kind);
    if (playing) hit(found, p.now);
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
    if (mode === 'belly') {
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
    wipeFace.style.backgroundImage = 'url("' + FACES[name] + '")';
    wipe.classList.remove('bump'); void wipe.offsetWidth; wipe.classList.add('bump');
  }

  /* ---------- 結果 ---------- */
  const RANKS = [
    { rate: 0.9, title: 'ぽんぽこ名人！', line: 'すごい！おなかが最高の太鼓になったよ！', face: 'melt' },
    { rate: 0.7, title: 'いいリズム！', line: 'いい音だったね〜。またたたいてね！', face: 'happy' },
    { rate: 0.4, title: 'なかなか！', line: 'だんだん速くなるの、むずかしいよね。', face: 'normal' },
    { rate: 0, title: 'れんしゅう中', line: 'ゆっくりでいいよ。おなかはいつでも貸すからね！', face: 'troubled' }
  ];
  function finish() {
    playing = false;
    const total = chart.notes.length;
    const rate = (counts.perfect + counts.good * 0.6 + counts.ok * 0.2) / total;
    const rank = RANKS.find((r) => rate >= r.rate);
    setFace(rank.face);
    $('r-title').textContent = rank.title;
    $('r-score').textContent = score;
    ['perfect', 'good', 'ok', 'miss'].forEach((k) => { $('r-' + k).textContent = counts[k]; });
    $('r-combo').textContent = maxCombo;
    $('r-line').textContent = 'タヌくん「' + rank.line + '」';
    const url = /^https?:/.test(location.href) ? location.href.split(/[?#]/)[0] : 'https://tanukun.pages.dev/pon/';
    const text = '🥁 ぽんぽこリズム ' + (mode === 'belly' ? 'ステージ2（おなか）' : 'ステージ1（ながれる）') + '\n' + score + 'てん「' + rank.title + '」さいだい' + maxCombo + 'コンボ\n#タヌくん #ぽんぽこリズム\n' + url;
    $('btn-post').href = 'https://x.com/intent/post?text=' + encodeURIComponent(text);
    $('btn-next').hidden = mode !== 'lane';   // ステージ1のあとは「ステージ2へ」
    $('result').hidden = false;
  }

  // とちゅうで別のアプリに切りかえたら、やめて最初の画面に
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) {
      playing = false;
      if (ac) { ac.close(); ac = null; }
      notesEl.textContent = '';
      molesEl.textContent = '';
      $('start').hidden = false;
    }
  });

  $('btn-belly').addEventListener('click', () => start('belly'));
  $('btn-lane').addEventListener('click', () => start('lane'));
  $('btn-again').addEventListener('click', () => start());
  $('btn-next').addEventListener('click', () => start('belly'));
  $('btn-mode').addEventListener('click', () => {
    $('result').hidden = true;
    molesEl.textContent = '';
    notesEl.textContent = '';
    $('start').hidden = false;
  });
  setFace('normal');
})();
