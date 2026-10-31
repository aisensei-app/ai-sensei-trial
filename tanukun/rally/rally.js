/* =========================================================
   ぽよんラリー（試作。2026-10-30）
   ・手前のビーチボールを、指で上へはじいて（スワイプして）投げる（ポケモンGO のように）
   ・タヌくんがおなかで「ぽよん！」とはね返す（おなかの揺れは本編と同じ belly.js）
   ・もどってくるボールのまわりに「輪」が出て、ボールに向かって縮んでいく。輪が近づくと（打てる間）光る。
     指をはなした瞬間に打てる間ならOK、輪がボールにぴたっと重なる瞬間ならナイス。
     毎回、最初の guideRallies ラリーの間は、ボールから上へのびるスワイプのガイド線（点線の矢印と 👆）がボールについてくる
     輪はボールと一緒に動くので、風やカーブでもずれない。打てる間は、ボールがふわっとゆっくりになる（ビーチボールらしく。打ちやすく）
   ・ボールは3こ。落とすと1こ減って、手前から投げなおし。3こ落としたら結果（合計ラリー数と、いちばん続いた数）
   ・3ラリー続くごとに、タヌくんが1歩近づいてきて、ボールも速くなる（落とすと、元の場所にもどる）
   ・近づくときも、ボールは止めずに返しながら1歩前へ出る
   ・近づいてくると、ときどき「じゃま」が入る（1回に1つまで）：カモメやインコが横切る／タヌくんが「せーの…」とためてから返す（フェイント）
     ／風がふいて、ボールが横に流される（輪はボールと一緒に動く）
   ・スワイプの長さで、ねらう高さが変わる：短く → 低い（おまた）、ふつう → おなか（長いほど上）、とても長く → 頭（ヘディング）
   ・返ってくる球は、こちらの打ち方で変わる（輪の色と文字で予告）：
     頭 → 🎈 ふんわり／おなかのはし → 🌀 カーブ／おなかのまんなかにナイス（近づいてから）→ ⚡ はやい
   ・おまたに当たると、本編のなかよし度（ハートの数）で反応が変わる：
     なかよしになる前 → 💢 怒ってスマッシュ（⚡ はやい）／モジモジ → 腰みので「ぱさっ」（🎈 ふんわり）／デレ → 照れながら、ふつうに返す
   ・打ち返すスワイプは、ボールの近くから（風で流されたら、追いかける）
   ・ナイスでゲージ（⚡ 5つ）がたまる。満タンで「💥 ひっさつ」ボタン → 構えるとボールが光り、次の打ち返しが燃える必殺の球。
     タヌくんはレシーブの構えで受けて、ボーナス
   ・はじめて遊ぶ人には、指のガイド（👆 が上へすべる見本）を出す。はじめての打ち返しは、輪がボールに重なった所で止まって待ってくれる
   ・最初のひと投げがおなかに当たらなかったときは、もう一度投げられる（ボールは減らない）
   ・きせかえ（デベソなど）は本編の記録をそのまま使う
   ・音はすべてプログラムで作る（Web Audio）
   ・本編とのつながり：1日1回、合計ラリー数に応じて、なかよしポイントを本編に預ける（T.bonus。本編を開いたときに受け取る。save.js の claimPonPoints）。
     あとで多い段に届いたら、その日のうちでも差だけ足す
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
     zone         … 打てる間。in は、もどってくる道すじのどこから打てるか（割合。1 で輪がボールにぴたっと重なる）、
                    show は輪が出はじめる所、ring はそのときの輪の大きさ（ボールの何倍）。slow は、打てる間にボールがゆっくりになる割合（0.5 で半分の速さ）
     guideRallies … 毎回、このラリー数まではスワイプのガイド（ボールの横の矢印）を出し、もどってくる球を guideSlow 倍ゆっくりにする
     nice         … 輪が重なる瞬間（1）から、この割合以内で打ち返したら「ナイス！」
     late         … 重なってから、この割合まで待ってくれる（それを過ぎたら落ちてミス）
     balls        … ボールの数（落とせる回数）
     birds, feint, wind … じゃまが入る割合（1歩以上近づいてから。ふつうの球のときだけ、1回に1つまで）。
                    feint は「せーの…」でためる秒数、wind は流される幅（画面の横幅に対する割合）
     kinds        … 返ってくる球の種類。time はもどる秒数の倍率、arc は山の高さ（画面の高さに対する割合）、
                    bend はカーブでふくらむ幅（画面の横幅に対する割合）。edge より外（おなかの半径に対する割合）に当たるとカーブ
     aim          … スワイプの長さ（ピクセル）。short より短いと 低い球（おしり）、long 以上で 頭（その長さで、指をはなす前でも飛ぶ）、
                    そのあいだは おなか（長いほど上）
     head, low    … 頭（髪の上）・低い球（おまた）の当たる所（絵の％。r は半径で、絵の横幅に対する％）
     reach        … 打ち返すスワイプは、ボールから横にこの距離（ピクセル。画面の横幅の reachW 倍のほうが大きければ、そちら）以内で始める
     bonus        … 1日1回のごほうび（なかよしポイント）。合計 at ラリー以上で points（多い段から）
     gauge        … ナイスで nice、セーフで safe たまる。max で満タン（ひっさつ）。bonus は必殺が当たったときに足すラリー数 */
  const T = {
    feet: IN_X ? 0.57 : 0.68, height: IN_X ? 0.38 : 0.46,
    step: { grow: 0.11, down: IN_X ? 0.025 : 0.035 }, maxStep: 4, stepEvery: 3,
    near: IN_X ? 0.66 : 0.8,
    ballSize: 0.2, maxBall: 88, far: 0.36,
    flick: 36,
    returnTime: 1.15, speedUp: 0.015, stepSpeed: 0.08, minTime: 0.55,
    zone: { in: 0.85, show: 0.55, ring: 2.6, slow: 0.5 }, guideRallies: 3, guideSlow: 1.4, nice: 0.08, late: 0.12,
    balls: 3,
    birds: 0.2, feint: { rate: 0.15, seconds: [0.45, 0.9] }, wind: { rate: 0.15, drift: 0.22 },
    kinds: { fast: { time: 0.72, arc: 0.11 }, lob: { time: 1.3, arc: 0.38 }, curve: { time: 1.0, bend: 0.24 }, edge: 0.55 },
    aim: { short: 90, long: 220 },
    head: { x: 44, y: 6, r: 11 }, low: { x: 33, y: 67, r: 16 },
    reach: 110, reachW: 0.3,
    gauge: { nice: 1, safe: 0.4, max: 5, bonus: 3 },
    bonus: [{ at: 15, points: 5 }, { at: 1, points: 3 }]
  };
  T.step.ball = 0.25;   // 1歩近づくごとに、奥（おなか）でのボールの大きさも、この割合で大きく
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

  /* ---------- 本編と同じ記録（きせかえ・さいこう記録・ごほうび） ---------- */
  const SAVE_KEY = 'tanukun-save-v1';
  // 本編と同じ「きょう」（午前4時に切りかわる）
  function today() {
    const d = new Date(Date.now() - ((C.days && C.days.dayStartHour) || 0) * 3600 * 1000);
    const pad = (n) => (n < 10 ? '0' : '') + n;
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
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
  const POSE = {
    receive: IMG('images/happy.webp'),                           // 必殺の球をレシーブ（うでを下ろして、おなかを前に）
    ouch: C.images.troubled ? IMG('troubled') : null,           // 頭に当たった
    angry: C.images.angry ? IMG('angry') : null,                // おまた：なかよしになる前（怒る）
    moji: C.images.mojimoji ? IMG('mojimoji') : null,           // おまた：モジモジ（両手で腰みのの前を押さえる）
    dere: C.images.dere ? IMG('dere') : null                    // おまた：デレ
  };
  // ポーズを ms ミリ秒だけ変える（0 なら、変えたまま）
  let poseTimer = 0;
  function setPose(src, ms) {
    clearTimeout(poseTimer);
    img.src = src || IMG('normal');
    if (ms) poseTimer = setTimeout(() => { img.src = IMG('normal'); }, ms);
  }
  const belly = window.TanuBelly({ config: JIGGLE, img: img, canvas: $('belly-canvas'),
    overlay: partsLayer, layers: () => wornLayers() });
  renderParts();
  // おなかの揺れに使う絵を、先に読んでおく（いつもの絵と、必殺の球を受けるポーズ）
  img.addEventListener('load', () => belly.warm([img.src, POSE.receive]), { once: true });

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
      far: T.far * (1 + T.step.ball * stepNow),                   // 近づくと、奥のボールも大きく（タヌくんより強めに）
      hx: left + w * T.head.x / 100, hy: top + h * T.head.y / 100, hr: w * T.head.r / 100,             // 頭
      lx: left + w * T.low.x / 100, ly: top + h * T.low.y / 100, lr: w * T.low.r / 100               // 低い球（おしりで返す）
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
    miss: () => tone('sine', 400, 120, 0.5, 0.35),
    angry: () => { tone('square', 220, 140, 0.12, 0.18); setTimeout(() => tone('square', 260, 160, 0.14, 0.18), 110); },
    leaf: () => tone('triangle', 900, 1800, 0.12, 0.15, 700),          // 葉っぱで「ぱさっ」
    special: () => { tone('sawtooth', 200, 900, 0.35, 0.3); setTimeout(() => tone('triangle', 880, 1760, 0.2, 0.3), 120); }
  };

  /* ---------- ボールの動き ----------
     z … 0 が手前、1 がタヌくんのおなか。大きさは z で手前 1 → 奥 G.far に小さくなる
     flight … いま飛んでいる道すじ { from, to, start, dur, arc, kind }（kind：throw / back / return / fall）
     ※ 速さはいつも同じ割合（遠近の厳密な計算はしない）。山なりは sin で */
  let state = 'title';   // title / ready（投げる前）/ fly（飛んでいる）/ wait（フェイント・落としたあと）/ over
  let flight = null, raf = 0;
  let total = 0, streak = 0, longest = 0, lives = T.balls, said = {};
  let gauge = 0, armed = false;   // ひっさつのゲージと、構えているか
  let best = loadSave().rallyBest || 0;
  // はじめて遊ぶ人へのガイド（本編の記録に、済んだかを残す）
  let guideThrow = !loadSave().rallyGuideThrow, guideReturn = !loadSave().rallyGuideReturn;
  const ball = { x: 0, y: 0, z: 0 };
  const lerp = (a, b, u) => a + (b - a) * u;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // 奥でのボールの大きさ。近づいている間（0.6秒）は、タヌくんの絵と一緒になめらかに大きくする
  let farAnim = null;
  function farNow() {
    if (!farAnim) return G.far;
    const e = (performance.now() - farAnim.t) / 600;
    if (e >= 1) { farAnim = null; return G.far; }
    return lerp(farAnim.from, G.far, e * e * (3 - 2 * e));
  }
  const scaleAt = (z) => lerp(1, farNow(), z);

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
    const now = performance.now();
    flight = { kind: kind, from: { x: ball.x, y: ball.y, z: ball.z }, to: to, start: now, last: now, u: 0, dur: dur * 1000, arc: arc };
    state = 'fly';
    ballEl.classList.remove('ready');
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(step);
  }
  // 道すじの u（0〜1。1 より先も少しだけ伸ばせる）での位置
  function at(f, u) {
    const w = f.wind ? f.wind * (1 - Math.cos(Math.PI * clamp(u, 0, 1))) / 2 : 0;   // 風：だんだん横に流される
    // カーブ：ふくらんで、打てる間（in）の前に、もとの道すじへもどってくる
    const b = f.bend ? f.bend * Math.sin(Math.PI * clamp(u / T.zone.in, 0, 1)) : 0;
    // 輪が重なる所（u = 1）を過ぎても、同じ速さのまま下へ
    const y = u <= 1 ? lerp(f.from.y, f.to.y, u) - f.arc * Math.sin(Math.PI * Math.max(0, u))
      : f.to.y + (f.to.y - f.from.y + f.arc * Math.PI) * (u - 1);
    return {
      x: lerp(f.from.x, f.to.x, Math.min(u, 1)) + w + b,
      y: y,
      z: Math.max(0, lerp(f.from.z, f.to.z, u))
    };
  }
  // いまの u。もどってくる球は、打てる間はゆっくりになる（ふわっ）。それでも、輪が重なる所に着くのは dur 秒後
  //   rate … u での進む速さ（1 → 打てる間の手前で slow へなめらかに）。SLOW_K で全体を速めて、着く時刻を合わせる
  const rate = (u) => {
    const a = T.zone.in - 0.15;
    return u < a ? 1 : u < T.zone.in ? lerp(1, T.zone.slow, (u - a) / 0.15) : T.zone.slow;
  };
  const SLOW_K = (() => { let t = 0; for (let i = 0; i < 1000; i++) t += 0.001 / rate((i + 0.5) / 1000); return t; })();
  // はじめての打ち返しのガイド中は、輪が重なった所（hold）で止めて待つ
  function progress(f, now) {
    if (f.hold != null) return f.hold;
    if (f.kind !== 'return') return (now - f.start) / f.dur;
    f.u += (now - f.last) / f.dur * SLOW_K * rate(f.u);
    f.last = now;
    if (f.tutorial && f.u >= 1) {
      f.hold = 1;
      showGuide('上へ スワイプして 打ち返そう！');
      return f.hold;
    }
    return f.u;
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
    if (e.target.closest('.sheet, .back, .special-btn')) return;
    e.preventDefault();
    audio();
    swipe = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
  });
  // 指を上へ T.aim.long までのばしたら、はなす前でも飛ぶ（頭）。それより短ければ、はなしたときに飛ぶ
  window.addEventListener('pointermove', (e) => {
    if (!swipe || e.pointerId !== swipe.id) return;
    if (swipe.y - e.clientY >= T.aim.long) finishSwipe(e);
  });
  function finishSwipe(e) {
    const dx = e.clientX - swipe.x, len = swipe.y - e.clientY, x0 = swipe.x;
    swipe = null;   // 1回のスワイプで1回だけ
    if (len < T.flick) return;
    onSwipe(dx, len, x0);
  }
  window.addEventListener('pointerup', (e) => { if (swipe && e.pointerId === swipe.id) finishSwipe(e); });
  window.addEventListener('pointercancel', (e) => { if (swipe && e.pointerId === swipe.id) swipe = null; });

  function onSwipe(dx, len, x0) {
    if (state === 'ready') { throwBall(dx, len); return; }
    if (state === 'fly' && flight && flight.kind === 'return') {
      // ボールの近くから始めたスワイプだけ（風で流されたら、追いかける）
      if (Math.abs(x0 - ball.x) > Math.max(T.reach, G.W * T.reachW)) return;
      hitBack(dx, len);
    }
  }
  // スワイプの長さ（ピクセル）から、ねらう所：短い → 低い（おしり）、ふつう → おなか（長いほど上）、とても長い → 頭
  function aimAt(len, dx) {
    if (len < T.aim.short) return { x: G.lx + dx * 0.5, y: G.ly };
    if (len >= T.aim.long) return { x: G.hx + dx * 0.5, y: G.hy };
    const k = (len - T.aim.short) / (T.aim.long - T.aim.short);
    return { x: G.bx + clamp(dx * 1.3, -G.brx * 1.4, G.brx * 1.4), y: G.by + G.bry * lerp(0.6, -0.6, k) };
  }
  // 当たった所：head（頭）/ belly（おなか）/ low（低い球。おしりで返す）/ null（はずれ）
  function partAt(x, y) {
    if (Math.hypot(x - G.hx, y - G.hy) <= G.hr) return 'head';
    if (inBelly(x, y) <= 1.05) return 'belly';
    if (Math.hypot(x - G.lx, y - G.ly) <= G.lr) return 'low';
    return null;
  }

  // 投げる：指の向きでねらう（まっすぐ上なら、おなかの高さ）。高さはスワイプの長さ
  function throwBall(dx, len) {
    sound.throw();
    $('hint').hidden = true;
    hideGuide();
    if (guideThrow) { guideThrow = false; updateSave((d) => { d.rallyGuideThrow = true; }); }
    const to = aimAt(len, dx);
    fly('throw', { x: to.x, y: to.y, z: 1 }, 0.62, G.H * 0.12);
  }

  // おなかの中か（画面の位置）。1 より小さければ中
  const inBelly = (x, y) => Math.hypot((x - G.bx) / G.brx, (y - G.by) / G.bry);

  /* ---------- 奥に着いた ----------
     おなか → 「ぽよん！」でもどってくる／頭 → ヘディング／低い球 → くるっと回って、おしりで「ぽよん！」／はずれ → 落ちる
     落ちたとき：最初のひと投げなら投げなおし（ボールは減らない）、打ち返した球ならボールが1こ減る */
  function arrive(f) {
    if (f.kind === 'fall') { flight = null; return; }
    if (f.special) { specialHit(); return; }
    const part = partAt(ball.x, ball.y);
    if (part) {
      let kind = 'normal';
      if (part === 'belly') {
        poyon(ball.x, ball.y);
        // おなかのはし → カーブ／まんなかにナイス（近づいてから）→ はやい
        if (Math.abs(ball.x - G.bx) > G.brx * T.kinds.edge) kind = 'curve';
        else if (f.nice && stepNow >= 1) kind = 'fast';
      } else if (part === 'head') { header(ball.x, ball.y); kind = 'lob'; }
      else kind = crotch();
      if (f.kind === 'back') countRally();
      if (f.kind === 'throw' || guideReturn) kind = 'normal';   // 最初のひと投げと、はじめての打ち返しは、ふつうの球
      // 3ラリーごとに1歩近づく（ボールは止めずに、返しながら前へ出る。近づいたときは、じゃまなし）
      const next = Math.min(T.maxStep, Math.floor(streak / T.stepEvery));
      if (next > stepNow) { approach(next); f.feinted = true; }
      setTimeout(() => sendBack(kind), { head: 220, low: 480 }[part] || 80);
      return;
    }
    const d = inBelly(ball.x, ball.y);
    pop(ball.x, ball.y - 20, d < 2.2 ? 'おしい！' : 'あれれ？', 'miss');
    if (f.kind === 'throw') say(d < 2.2 ? 'おなかに、なげてね〜' : 'こっちだよ〜');
    fly('fall', { x: ball.x + (ball.x - G.bx) * 0.3, y: G.feetY, z: 1 }, 0.45, -G.H * 0.02);
    state = 'wait';
    if (f.kind === 'back') { setTimeout(() => loseBall(), 500); return; }
    setTimeout(resetBall, 1200);
  }
  // おまたに当たった：本編のなかよし度（ハートの数）で反応が変わる（ラリーは続く）。返ってくる球の種類を返す
  //   なかよしになる前 → 怒ってスマッシュ（はやい）／モジモジ → 両手で腰みのを押さえて「ぱさっ」（ふんわり）／デレ → 照れて、ふつうに
  function crotch() {
    const n = hearts(), st = C.crotch ? C.crotch.stages : { moji: 2, dere: 4 };
    const stage = n >= st.dere ? 'dere' : n >= st.moji ? 'moji' : 'angry';
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    if (stage === 'angry') {
      sound.angry();
      pop(G.lx, G.ly - 10, '💢 こらっ！', 'miss');
      setPose(POSE.angry, 700);
      body.animate([{ transform: 'none' }, { transform: 'translateX(-2%)' }, { transform: 'translateX(2%)' },
        { transform: 'translateX(-1%)' }, { transform: 'none' }], { duration: 300 });
      say(pick(['どこねらってるの！', 'そこはダメ〜！', 'おかえしだっ！']));
      return 'fast';
    }
    sound.leaf();
    leaves(G.lx, G.ly);
    if (stage === 'moji') {
      pop(G.lx, G.ly - 10, '🌿 ぱさっ', 'safe');
      setPose(POSE.moji, 700);
      say(pick(['ひゃっ…！', 'そ、そこは…', 'こしみの ガード！']));
      return 'lob';
    }
    pop(G.lx, G.ly - 10, '🌿 ぱさっ♡', 'nice');
    setPose(POSE.dere, 800);
    say(pick(['も〜…♡', 'えへへ、ねらったでしょ〜', 'しかたないなぁ♪']));
    return 'normal';
  }
  // 腰みのの葉っぱが、ひらひら舞う
  function leaves(x, y) {
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('span');
      el.className = 'leaf';
      el.textContent = '🍃';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      $('pops').appendChild(el);
      const dx = (Math.random() * 2 - 1) * 70, up = 30 + Math.random() * 40;
      el.animate([
        { transform: 'translate(-50%,-50%) rotate(0)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + dx * 0.6 + 'px), calc(-50% - ' + up + 'px)) rotate(' + dx * 2 + 'deg)', opacity: 1, offset: 0.35 },
        { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + 40px)) rotate(' + dx * 4 + 'deg)', opacity: 0 }
      ], { duration: 900 + Math.random() * 300, easing: 'ease-out' }).finished.then(() => el.remove(), () => el.remove());
    }
  }
  // 頭に当たった：ヘディングで返す（ラリーは続く）
  function header(x, y) {
    sound.hit();
    pop(x, y - 10, 'ヘディング！', 'safe');
    setPose(POSE.ouch, 600);
    body.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(2deg)' }, { transform: 'rotate(0)' }],
      { duration: 350, easing: 'ease-out' });
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
    farAnim = { from: farNow(), t: performance.now() };
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
  // kind：返ってくる球の種類（normal / fast はやい / lob ふんわり / curve カーブ）。輪の色と文字で予告する
  const KIND_LABEL = { fast: '⚡ はやい！', lob: '🎈 ふんわり', curve: '🌀 カーブ' };
  function sendBack(kind) {
    if (state === 'over') return;
    kind = kind || 'normal';
    if (kind === 'normal' && stepNow >= 1 && !armed && Math.random() < T.feint.rate && !flight.feinted) { feint(); return; }
    const spread = Math.min(0.3, 0.1 + streak * 0.015);   // 続くほど左右に広がる
    const tx = G.W * (0.5 + (Math.random() * 2 - 1) * spread);
    const K = T.kinds[kind] || {};
    // ガイドを出している最初のラリーは、ゆっくり（guideSlow 倍の時間）
    const dur = Math.max(T.minTime, T.returnTime - streak * T.speedUp - stepNow * T.stepSpeed) * (K.time || 1)
      * (total < T.guideRallies ? T.guideSlow : 1);
    fly('return', { x: tx, y: G.nearY, z: 0 }, dur, G.H * (K.arc || 0.22 + Math.random() * 0.08));
    flight.type = kind;
    targetEl.className = 'target' + (kind === 'normal' ? '' : ' t-' + kind);
    if (kind !== 'normal') pop(tx, G.nearY - G.size * 2.2, KIND_LABEL[kind], 'kind-' + kind);
    // カーブ：輪と反対がわへふくらんでから、輪にもどってくる
    if (kind === 'curve') flight.bend = (tx < G.W / 2 ? 1 : -1) * G.W * K.bend;
    // はじめての打ち返しは、輪の上でボールが止まって待つ（ガイド）
    if (guideReturn) { flight.tutorial = true; return; }
    if (stepNow < 1 || kind !== 'normal') return;
    // じゃまは1回に1つまで（鳥か風）
    if (Math.random() < T.birds) bird(dur);
    else if (Math.random() < T.wind.rate) {
      // 風：画面のはしを越えないほうへ流す
      const room = tx < G.W / 2 ? 1 : -1;
      flight.wind = room * G.W * T.wind.drift * lerp(0.6, 1, Math.random());
      wind(room);
    }
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
  // 鳥が横切る（カモメかインコ。ボールの道すじの前を。見た目のじゃま）
  function bird(dur) {
    const el = document.createElement('span');
    el.className = 'gull';
    el.textContent = Math.random() < 0.5 ? '🕊️' : '🦜';
    el.style.top = G.H * lerp(0.42, 0.62, Math.random()) + 'px';
    $('pops').appendChild(el);
    const from = Math.random() < 0.5;
    el.animate([
      { transform: 'translateX(' + (from ? G.W + 40 : -60) + 'px) translateY(0) scaleX(' + (from ? 1 : -1) + ')' },
      { transform: 'translateX(' + G.W / 2 + 'px) translateY(-14px) scaleX(' + (from ? 1 : -1) + ')', offset: 0.5 },
      { transform: 'translateX(' + (from ? -60 : G.W + 40) + 'px) translateY(6px) scaleX(' + (from ? 1 : -1) + ')' }
    ], { duration: dur * 1000 * 1.4, easing: 'linear' }).finished.then(() => el.remove(), () => el.remove());
  }

  // 風：「💨 かぜ！」と、横に流れるすじ（dir：1 で右へ、-1 で左へ）
  function wind(dir) {
    pop(G.W / 2, G.H * 0.36, dir > 0 ? 'かぜ！ 💨→' : '←💨 かぜ！', 'wind');
    for (let i = 0; i < 6; i++) {
      const el = document.createElement('i');
      el.className = 'gust';
      el.style.top = G.H * lerp(0.35, 0.8, Math.random()) + 'px';
      el.style.width = lerp(60, 140, Math.random()) + 'px';
      $('pops').appendChild(el);
      el.animate([
        { transform: 'translateX(' + (dir > 0 ? -160 : G.W + 20) + 'px)', opacity: 0 },
        { opacity: 0.9, offset: 0.3 },
        { transform: 'translateX(' + (dir > 0 ? G.W + 20 : -160) + 'px)', opacity: 0 }
      ], { duration: 700 + Math.random() * 500, delay: i * 120, easing: 'ease-in-out' }).finished.then(() => el.remove(), () => el.remove());
    }
  }

  // 輪：ボールのまわりに出て（show から）、ボールに向かって縮み、u = 1 でボールにぴたっと重なる。ボールと一緒に動く。
  //   打てる間（in から）は光って、ボールもぽっと光る。最初の guideRallies ラリーは、スワイプのガイド線もボールについてくる
  function drawTarget(u) {
    if (u < T.zone.show) return;
    const d = G.size * scaleAt(ball.z), k = lerp(T.zone.ring, 1, clamp((u - T.zone.show) / (1 - T.zone.show), 0, 1)), r = d * k;
    Object.assign(targetEl.style, { left: ball.x - r / 2 + 'px', top: ball.y - r / 2 + 'px', width: r + 'px', height: r + 'px' });
    targetEl.style.setProperty('--d', d + 'px');
    targetEl.hidden = false;
    const now = u >= T.zone.in;
    targetEl.classList.toggle('now', now);
    ballEl.classList.toggle('now', now);
    if (total < T.guideRallies && !flight.tutorial) {
      placeGuide(d);
      if (guideEl.hidden) { guideEl.lastChild.textContent = '上へ シュッ！'; guideEl.hidden = false; }
    }
  }
  const hideTarget = () => { targetEl.hidden = true; ballEl.classList.remove('now'); hideGuide(); };

  /* ---------- もどってきたボールを、上へスワイプして打ち返す ----------
     len（スワイプの長さ）でねらう所が変わる（aimAt。頭・おなか・おしり、どれでも返ってくる）
     ひっさつを構えているときは、必殺の球（いつもおなかのまんなかへ、速く） */
  function hitBack(dx, len) {
    const f = flight, u = progress(f, performance.now());
    if (u < T.zone.in) return;   // まだ打てない（輪が光ってから）
    const nice = f.hold != null || Math.abs(u - 1) <= T.nice;
    const d = G.size * scaleAt(ball.z);
    hideTarget();
    if (f.tutorial) {
      hideGuide();
      guideReturn = false;
      updateSave((d2) => { d2.rallyGuideReturn = true; });
    }
    const dur = Math.max(T.minTime, T.returnTime - streak * T.speedUp - stepNow * T.stepSpeed) * 0.7;
    if (armed) {
      armed = false;
      gauge = 0;
      renderGauge();
      sound.special();
      pop(ball.x, ball.y - d * 0.6, 'ひっさつ！', 'nice');
      ballEl.classList.remove('charged');
      ballEl.classList.add('special');
      setPose(POSE.receive, 0);
      body.classList.add('receive');
      say('こい〜っ！');
      fly('back', { x: G.bx, y: G.by, z: 1 }, dur * 0.7, G.H * 0.03);
      flight.special = true;
      return;
    }
    if (nice) sound.nice(); else sound.hit();
    pop(ball.x, ball.y - d * 0.6, nice ? 'ナイス！' : 'セーフ', nice ? 'nice' : 'safe');
    const before = gauge;
    gauge = Math.min(T.gauge.max, gauge + (nice ? T.gauge.nice : T.gauge.safe));
    renderGauge();
    if (gauge > before) gaugePop(nice ? '+1⚡' : '+⚡');
    const to = aimAt(len, dx);
    fly('back', { x: to.x, y: to.y, z: 1 }, dur, G.H * 0.1);
    flight.nice = nice;
  }
  // 必殺の球が当たった：レシーブの構えで受けて「ぽよよ〜ん！！」。画面がゆれて、ボーナス
  function specialHit() {
    ballEl.classList.remove('special');
    sound.poyon();
    setTimeout(sound.poyon, 120);
    pop(G.bx, G.by - 30, 'ぽよよ〜ん！！');
    if (belly.ready()) {
      const k = 720 / G.w;
      belly.press('belly', (G.bx - G.left) * k, (G.by - G.top) * k);
      setTimeout(() => belly.release('belly', true), 160);
    }
    root.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-6px,4px)' }, { transform: 'translate(5px,-3px)' },
      { transform: 'translate(-3px,2px)' }, { transform: 'translate(0,0)' }], { duration: 380 });
    countRally();
    total += T.gauge.bonus;
    $('count').textContent = total;
    setTimeout(() => pop(G.bx, G.by - 70, 'ボーナス +' + T.gauge.bonus, 'safe'), 300);
    setTimeout(() => {
      body.classList.remove('receive');
      setPose(null, 0);
      say('すごい球だった〜！');
      const next = Math.min(T.maxStep, Math.floor(streak / T.stepEvery));
      if (next > stepNow) { approach(next); flight.feinted = true; }
      sendBack();
    }, 900);
  }

  // 打ち返せなかった：ボールが手前に落ちる
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
    loseBall();
  }
  // ボールが1こ減る。残っていれば、タヌくんは元の場所にもどって投げなおし。なくなったら結果
  function loseBall() {
    state = 'wait';
    lives--;
    renderLives();
    streak = 0; said = {};
    if (armed) { armed = false; renderGauge(); }
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
  // ひっさつのゲージ。満タンになったら「💥 ひっさつ」ボタン（押すと構える。次の打ち返しが必殺の球）
  function renderGauge() {
    const pips = $('gauge-pips');
    if (pips.children.length !== T.gauge.max) {
      pips.textContent = '';
      for (let i = 0; i < T.gauge.max; i++) pips.appendChild(document.createElement('b'));
    }
    [...pips.children].forEach((el, i) => { el.style.setProperty('--f', clamp(gauge - i, 0, 1)); });
    const full = gauge >= T.gauge.max;
    ballEl.classList.toggle('charged', armed);   // 構えている間は、ボールが光る
    $('gauge').classList.toggle('full', full);
    $('btn-special').hidden = !full && !armed;
    $('btn-special').classList.toggle('armed', armed);
    $('btn-special').textContent = armed ? '🔥 かまえ中…' : '💥 ひっさつ';
  }
  // ゲージのところに「+1⚡」
  function gaugePop(text) {
    const g = $('gauge').getBoundingClientRect(), r = root.getBoundingClientRect();
    pop(g.left - r.left + g.width / 2, g.bottom - r.top + 12, text, 'gauge-up');
  }
  $('btn-special').addEventListener('click', () => {
    if (gauge < T.gauge.max || armed) return;
    armed = true;
    renderGauge();
    say('ひっさつ…！ くるか〜？');
  });
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
  // 指のガイド：ボールの横（右。画面の右がわでは左）に、太い矢印と、上へすべる 👆 の見本をくり返し見せる（d はボールの大きさ）
  //   右か左かは、出しはじめに決める（ボールが動いても、とちゅうで入れかわらないように）
  let guideSide = 1;
  function placeGuide(d) {
    if (guideEl.hidden) guideSide = ball.x > G.W * 0.6 ? -1 : 1;
    guideEl.style.left = ball.x + guideSide * (d * 0.5 + 36) + 'px';
    guideEl.style.top = ball.y + d * 0.3 + 'px';
  }
  function showGuide(text) {
    placeGuide(G.size * scaleAt(ball.z));
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
    ballEl.classList.remove('special');
    ballEl.classList.toggle('charged', armed);
    body.classList.remove('receive');
    setPose(null, 0);
    shadowEl.style.visibility = '';
    hideTarget();
    placeReady();
    if (guideThrow) {
      $('hint').hidden = true;
      showGuide('ボールを 上へ スワイプして なげてね');
    } else {
      $('hint').textContent = '👆 上へ スワイプして なげてね';
      $('hint').hidden = false;
    }
  }
  function start() {
    $('start').hidden = true;
    $('result').hidden = true;
    total = 0; streak = 0; longest = 0; lives = T.balls; said = {}; gauge = 0; armed = false;
    state = 'ready';
    renderGauge();
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
    // 本編とのつながり：1日1回のごほうび。その日にもらった分より多い段に届いたら、差だけ預ける
    const tier = T.bonus.filter((b) => total >= b.at)[0];
    let add = 0, got = 0;
    updateSave((d) => {
      got = d.rallyBonusDay === today() ? d.rallyBonusGot || 0 : 0;
      add = tier ? Math.max(0, tier.points - got) : 0;
      if (!add) return;
      d.rallyBonusDay = today();
      d.rallyBonusGot = got + add;
      d.rallyPoints = (d.rallyPoints || 0) + add;
    });
    // まだ上の段があれば、次の目標も出す（例：15ラリーで さらに +2）
    const next = T.bonus.slice().reverse().filter((x) => x.at > total && x.points > got + add)[0];
    const lines = [];
    if (add) lines.push('💗 なかよしポイント +' + add + '（タヌくんのところで受け取れるよ）');
    if (next) lines.push('💗 ' + (next.at === 1 ? '1回 打ち返せば' : next.at + 'ラリーで') + (add || got ? ' さらに +' : ' なかよしポイント +') + (next.points - got - add) + '（1日1回）');
    $('r-bonus').innerHTML = lines.join('<br>');
    $('r-bonus').hidden = !lines.length;
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
  renderGauge();
  placeReady();
  ballEl.classList.add('ready');
})();
