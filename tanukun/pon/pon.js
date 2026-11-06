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
       ステージ4 おまつり … 第2章「島の夜祭り」の太鼓の絵で。◉ は太鼓の上に出る（ドン＝太鼓・カッ＝ふち）。〜 はおなか。
                      第2章を最後まで見ると開く（features.ponTaiko。2026-11-06 ユーザーと決めた）
   ・ピンクの「〜」は、指でおなかをさっとすべらせて「ぷるん」（たたくのとは別のアクション）
   ・タイミングが合うほど点数が高い。続けて合わせると右上のタヌくんが笑顔になる
   ・音はすべてプログラムで作る（Web Audio）。音の素材ファイルは使わない
   ・おなかの「ぷるん」は本編と同じ仕組み（belly.js）
   ・きせかえ（デベソなど）は本編の記録をそのまま使う（付けはずしは本編の「きせかえ」で。ここでは設定しない）
   ・たたくたびに、タヌくんの腕が「ビクン」、ネックレスが「ぷるん」と反応する
   ========================================================= */
(function () {
  'use strict';

  // X アプリの中で開いたとき：画面の下に X の投稿パネルがかぶさるので、pon.css の body.in-x でよける（?inx でも）
  if (/Twitter/i.test(navigator.userAgent) || /[?&]inx\b/.test(location.search)) document.body.classList.add('in-x');

  const C = window.TANU_CONFIG;
  // 公開スイッチ（config.js の features.pon）が 'open' でないときは、まだ遊べないので本編へ
  if (C.features && C.features.pon && C.features.pon !== 'open') { location.replace('../'); return; }

  /* ---- タヌくんのところへ戻るとき：幕がふわっとかかってから（本編のトップ画面は、同じ幕が明けるところから始まる） ---- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href="../"]');
    if (!a || e.defaultPrevented || document.body.classList.contains('leaving')) return;
    e.preventDefault();
    try { sessionStorage.setItem('tanukun.homeZoom', '1'); } catch (err) {}
    document.body.classList.add('leaving');
    // 「もどる」に向かって丸く閉じてから戻る（iris.js。本編は、こげ茶から丸く開いて始まる）
    if (window.TanuIris) {
      const r = a.getBoundingClientRect();
      window.TanuIris.close(r.left + r.width / 2, r.top + r.height / 2).then(() => { location.href = a.href; });
      return;
    }
    setTimeout(() => { location.href = a.href; }, 430);
  });
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
  scrollHint($('result'));
  /* ことば：本編と同じ i18n.js（ぽんぽこリズムの訳は pon.i18n.js）。tr('日本語の文', { n: 3 }) でいまの言語の文 */
  const I18N = window.TanuI18n || { lang: 'ja', LANGS: { ja: '日本語' }, tr: (s) => s, apply: () => {}, set: () => {} };
  const tr = (ja, vars) => {
    let out = I18N.tr(ja, vars);
    if (vars && out === ja) Object.keys(vars).forEach((k) => { out = out.split('{' + k + '}').join(vars[k]); });
    return out;
  };
  I18N.apply();
  if (I18N.lang !== 'ja') {
    // <b> や <small> を含む文（data-i18n-html）は、中の HTML ごと入れかえる
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = tr(el.innerHTML.trim()); });
    document.title = tr('ぽんぽこリズム｜タヌくん');
  }
  // はじめる前の画面の右上「🌐 日本語 ▾」：押すと、言語の一覧（i18n.js の bind。本編・ラリーと同じ）
  if (I18N.bind) I18N.bind($('btn-lang'));
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
      // たたける場所（絵のピクセル。2026-11-03）：胸（四角）とおなか（楕円）。ここの外（足・腕の外・背景）は「からぶり」＝音も揺れもなし
      // skirt … 腰みのの前。たたくと少し揺れるだけ（点にもミスにもしない）。skirtSway は揺れの楕円（絵の％）
      hit: { chest: { x0: 100, y0: 230, x1: 400, y1: 345 }, belly: { cx: 265, cy: 400, rx: 185, ry: 125 },
             skirt: { cx: 240, cy: 595, rx: 90, ry: 80 } },
      skirtSway: { x: 33.3, y: 67.5, rx: 15, ry: 10 },
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
  /* ステージ4 おまつり（第2章の太鼓の絵 1024×1536。matsuri/img）。hit … たたいたときに一瞬だけ出す絵
     view.cover … 画面いっぱいに映す（左右は少し切れる）。cx … 画面の横まんなかに来る所
     drum … 太鼓（絵のピクセル。ここをたたくと「ドン」＝おなかはへこまず、太鼓をたたく絵が一瞬出る）
     purunArea … 〜 が出る所（おなか） */
  ARTS.taiko = {
    src: 'matsuri/img/taiko_ready.webp', hitSrc: 'matsuri/img/taiko_hit.webp', w: 1024, h: 1536,
    belly: { x: 51.8, y: 41.7, rx: 18.6, ry: 10.4 },   // おなか（中心 530, 640、半径 190, 160）
    view: { cover: true, cx: 600 },
    mole: { area: { x: 745, y: 975, rx: 165, ry: 55 }, gap: 95 },
    purunArea: { x: 525, y: 635, rx: 110, ry: 75 },
    drum: { cx: 750, cy: 1080, rx: 280, ry: 250 },
    drumHead: { cx: 750, cy: 935, rx: 230, ry: 52 },   // 太鼓の面（波紋を出す所）
    hit: { chest: { x0: 380, y0: 330, x1: 700, y1: 470 }, belly: { cx: 530, cy: 640, rx: 200, ry: 165 } },
    parts: {}, noWear: true, fade: false
  };
  const TAIKO_CUTIN_AT = 30;   // カットインの帯の高さ（絵の％。顔の下・おなかの上）
  let ART = ARTS.normal;
  /* おなかモード
     appear … ◉ が出てから、たたく時までの秒数（この間に輪が縮む）
     area   … ◉ が出る範囲（絵のピクセルで、おなかの楕円。x, y は中心、rx, ry は半径。ART.mole）
     gap    … 続けて出る ◉ どうしの、最低限の離れ具合（絵のピクセル。ART.mole）
     hitR   … 指が ◉ の中心からこれだけ（画面のピクセル）以内なら当たり */
  const MOLE = { appear: 1.0, area: ART.mole.area, gap: ART.mole.gap, hitR: 56 };
  const taiko = () => mode === 'taiko';
  // ステージ4 おまつりの譜面：「ドン・ドン・カッカッ・ドン」（pon＝ドン、poko＝カッ）
  const TAIKO_PATTERN = { 0: 'pon', 2: 'pon', 4: 'poko', 5: 'poko', 6: 'pon' };
  /* ステージ3 まんぷく
     foods      … 出てくる食べもの（形と色が似ていないものを選ぶ）
     appear     … 食べものが出てから、たたく時までの秒数（吹き出しを切りかえる間をとるため、おなかモードより短く）
     targetRate … 出てくる食べもののうち、「たべたい！」の食べものの割合
     maxFat     … いちばんふくらんだときの大きさ（0.3 で3割。これより大きいと絵がくずれる）
     ※ 吹き出しは、速さが変わるごと（2小節ごと）に、カットインの「間」の中で変わる
     ※ おなかは、食べるたびではなく、カットインのあとに、それまでに食べた分だけ「ぽよ〜ん！」と一気にふくらむ
        （たたいている最中は、おなかの変化に気づけないため）。最後は「ごちそうさまタイム」（feastSeconds 秒）のあとで結果 */
  // wantAfterCutin … 2つ目からの速さで「たべたい！」を出す時（カットインが始まってから何秒後か）
  const FOOD = { foods: ['🍙', '🍉', '🍡', '🌽'], appear: 0.85, wantAfterCutin: 0.25, targetRate: 0.6, maxFat: 0.3, feastSeconds: 2.6 };
  /* 速さが変わる前のカットイン（音ゲーの「スピードアップ！」）
     速さが変わる前に1小節分の「間」（◉ が出ない。シャカシャカは続く）を入れて、
     タヌくんのがんばる顔と文字の帯が、右から「シュッ！」と入って左へ抜ける
     seconds … 帯が出ている秒数、growAfter … まんぷくで、間のはじめから「ぽよ〜ん！」までの秒数
     at      … 帯のまんなかの高さ（絵の％。おへその上と、おなかの上部のあいだ）
     levels  … 1回目・2回目…のカットイン。速さが上がるほど、色・文字・表情が盛り上がっていく
               face は tools/make_pon_art.py でつくる（4回目は専用の絵がまだなので、仮に「ぐぬぬ」顔） */
  const CUTIN = {
    seconds: 1.0, growAfter: 1.05, at: 43.5,
    levels: [
      { text: 'スピードアップ！', colors: ['#8FD35A', '#3A9A4A'], face: 'images/pon/face_cut1.webp' },   // ウインク（まだ余裕）
      { text: 'もっと はやく！', colors: ['#FFD040', '#F08A1E'], face: 'images/pon/face_cut2.webp' },     // 大笑い（楽しくなってきた）
      { text: 'まだまだ いける！', colors: ['#FF6B5A', '#C8282E'], face: 'images/pon/face_cut3.webp' },   // ぐぬぬ（きつい！）
      { text: 'ラストスパート！', colors: ['#B455FF', '#FF4FA0'], face: 'images/pon/face_cut4.webp' }    // 本気（専用の絵を待っている）
    ]
  };
  const STAGES = {
    lane:  { num: 1, label: 'ながれる', next: 'belly' },
    belly: { num: 2, label: 'おなか', next: 'food' },
    food:  { num: 3, label: 'まんぷく', next: null },
    taiko: { num: 4, label: 'おまつり', next: null }
  };
  /* ステージ4 おまつり：公開スイッチ features.ponTaiko が open で、第2章を最後まで見た（本編の記録 k2Seen[3]）ら遊べる。
     まだの人には 🔒 で見せる（押すと「第2章を最後まで見ると遊べるよ」）。hidden のときはボタンを出さない */
  const TAIKO_ON = !!(C.features && C.features.ponTaiko === 'open');
  const TAIKO_ALL = /[?&]taiko\b/.test(location.search);   // 確認用：?taiko で、第2章を見ていなくても遊べる
  const taikoOpen = () => TAIKO_ON && (TAIKO_ALL || (((loadSave().k2Seen || {})[3]) != null));
  if (TAIKO_ON) STAGES.food.next = 'taiko';
  // 「ステージ1（ながれる）」など（いまの言語で）
  const stageName = (m) => tr('ステージ{n}（{s}）', { n: STAGES[m].num, s: tr(STAGES[m].label) });
  /* ステージが始まってから最初の ◉ が出るまでの間（数を数えている間）に出す、遊び方の説明
     ◉ や 〜 は、ゲームの中と同じ見た目の小さな絵で出す */
  const NOTE_IC = '<i class="ic-note"></i>', PURUN_IC = '<i class="ic-purun">〜</i>';
  const HOWTO = {   // {note} は ◉、{purun} は 〜 の小さな絵に入れかわる
    lane:  ['{note} が わくに来たら <b>タップ</b>', '{purun} は さっと <b>すべらせる</b>'],
    belly: ['{note} に 輪が重なったら <b>タップ</b>', '{purun} は さっと <b>すべらせる</b>'],
    food:  ['「🍙 たべたい！」なら 🍙 を <b>タップ</b>', 'ちがうものは たたかないでね'],
    taiko: ['{note} に 輪が重なったら 太鼓を <b>タップ</b>', '{purun} は おなかを さっと <b>すべらせる</b>']
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
  /* 本編とのつながり：ステージを最後まで遊ぶと、1日1回、なかよしポイント BONUS を本編に預ける
     （本編を開いたときに受け取る。save.js の claimPonPoints）。日付は本編と同じく午前4時に切りかわる */
  const BONUS = 5;
  function today() {
    const d = new Date(Date.now() - ((C.days && C.days.dayStartHour) || 0) * 3600 * 1000);
    const pad = (n) => (n < 10 ? '0' : '') + n;
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  const PARTS = C.parts || {};
  function loadSave() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; }
  }
  const wear = loadSave().wear || {};
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
  // 本編の記録のほかの項目はそのままにして、change で一部だけ書きかえる
  function updateSave(change) {
    try {
      const data = loadSave();
      change(data);
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) { /* 保存できない環境では、その回だけ */ }
  }
  updateSave((d) => { d.ponSeen = true; });   // 本編のメニューの NEW を消す
  const bellyN = window.TanuBelly({ config: JIGGLE, img: img, canvas: $('belly-canvas'),
    overlay: partsLayer, layers: () => wornLayers(),
    extra: Object.assign({ armL: REACT.armL, armR: REACT.armR, fat: Object.assign({ type: 'swell' }, ART.fat) },
      ART.skirtSway ? { skirt: ART.skirtSway } : {}) });
  let belly = bellyN;
  // ステージ4 おまつり：太鼓の絵は別の <img>・<canvas> に描く（絵の大きさがちがうので、揺れの仕組みも別に作る）
  let bellyT = null, tImg = null, tHit = null;
  function taikoSetup() {
    if (bellyT) return;
    const T = ARTS.taiko;
    tImg = Object.assign(document.createElement('img'), { className: 't-img', alt: '', draggable: false });
    const tCanvas = Object.assign(document.createElement('canvas'), { className: 't-canvas' });
    tHit = Object.assign(document.createElement('img'), { className: 't-hit', alt: '', draggable: false });
    tImg.src = IMG(T.src); tHit.src = IMG(T.hitSrc);
    body.appendChild(tImg); body.appendChild(tCanvas); body.appendChild(tHit);
    // drum … 太鼓のまわり（絵の％）。たたくと、ほんの少しだけ沈んで戻る（kick）
    bellyT = window.TanuBelly({ config: Object.assign({}, JIGGLE, T.belly), img: tImg, canvas: tCanvas, layers: () => [],
      extra: { drum: { type: 'bob', x: 73.2, y: 70.3, rx: 27.3, ry: 16.3 } } });
    tImg.addEventListener('load', () => bellyT.warm([tImg.src]), { once: true });
  }
  /* 太鼓をたたいた（2026-11-06 ユーザー「ちかちかして気持ち悪くなる」→ 直した）：
     ① 絵は切りかえない。動くのは太鼓の所だけ（面にやわらかい波紋・太鼓がほんの少し沈む）
     ③ おなかは揺らさない（揺れるのは 〜 をすべらせたときだけ）
     ② たたく絵は「ごほうび」のときだけ（コンボ10ごと・カットイン・最後の一打）、ふわっと重ねて、ふわっと戻す。
        前に出してから HIT_GAP 秒は出さない
     ④ スマホの「動きを減らす」設定の人には、② を出さず、太鼓も沈ませない */
  const CALM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const HIT_SHOW = 650, HIT_GAP = 2.5;
  let hitTimer = 0, hitAt = -9;
  function drumHit() {
    if (!tImg) return;
    const D = ARTS.taiko.drumHead;   // 太鼓の面（絵のピクセル）
    const el = document.createElement('div');
    el.className = 'drum-ripple';
    Object.assign(el.style, { left: offX + D.cx * scale + 'px', top: offY + D.cy * scale + 'px',
      width: D.rx * 2 * scale + 'px', height: D.ry * 2 * scale + 'px' });
    $('pops').appendChild(el);
    setTimeout(() => el.remove(), 520);
    if (!CALM) belly.kick('drum', 5);
  }
  function rewardFrame(now) {
    if (!tHit || CALM || !taiko() || (now != null && now - hitAt < HIT_GAP)) return;
    if (now != null) hitAt = now;
    tHit.classList.add('on');
    clearTimeout(hitTimer);
    hitTimer = setTimeout(() => tHit.classList.remove('on'), HIT_SHOW);
  }
  renderParts();
  let armSide = 0;
  function react(big) {
    const k = big ? REACT.purun : 1;
    if (taiko()) { wipeFace.classList.remove('tick'); void wipeFace.offsetWidth; wipeFace.classList.add('tick'); return; }   // 太鼓の絵には腕の「ビクン」はない
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
  let scale = 1, offX = 0, offY = 0;
  function layout() {
    const sw = stage.clientWidth, sh = stage.clientHeight, VIEW = ART.view;
    if (VIEW.cover) {
      // 画面いっぱいに（すき間ができないように大きいほうに合わせ、cx を横のまんなかに。はみ出さないようにおさめる）
      scale = Math.max(sw / ART.w, sh / ART.h);
      offX = Math.min(0, Math.max(sw - ART.w * scale, sw / 2 - VIEW.cx * scale));
      offY = (sh - ART.h * scale) / 2;
    } else {
      scale = sw / VIEW.w;
      offX = sw / 2 - VIEW.cx * scale;
      offY = sh * VIEW.at - VIEW.cy * scale;
    }
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
  // ドン：お祭りの太鼓（ぽんより低く、長く響く）
  function soundDon(t, vol) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(52, t + 0.3);
    env(g, t, 1.0 * vol, 0.6);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + 0.65);
    hitNoise(t, 500, 0.35 * vol, 0.07);
  }
  // カッ：太鼓のふちをたたく、かわいた短い音
  function soundKa(t, vol) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(1150, t);
    o.frequency.exponentialRampToValueAtTime(800, t + 0.03);
    env(g, t, 0.16 * vol, 0.05);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + 0.07);
    hitNoise(t, 3200, 0.45 * vol, 0.04);
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
  // おなかがふくらんだ：低い音から「ぽよよ〜ん」と上がる
  function soundGrow(t) {
    const o = ac.createOscillator(), g = ac.createGain();
    const lfo = ac.createOscillator(), depth = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(330, t + 0.5);
    lfo.frequency.value = 9;
    depth.gain.value = 30;
    lfo.connect(depth).connect(o.frequency);
    env(g, t, 0.6, 0.7);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + 0.75);
    lfo.start(t); lfo.stop(t + 0.75);
  }
  // カットインの「シュッ！」：ざらざらした音を、低い所から高い所へ
  function soundWhoosh(t) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise;
    f.type = 'bandpass'; f.Q.value = 1.5;
    f.frequency.setValueAtTime(500, t);
    f.frequency.exponentialRampToValueAtTime(4000, t + 0.25);
    env(g, t, 0.5, 0.3);
    s.connect(f).connect(g).connect(ac.destination);
    s.start(t); s.stop(t + 0.3);
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
    const notes = [], hats = [], clicks = [], banners = [], wants = [], grows = [];
    const food = mode === 'food';
    let want = null;
    let t = 0;
    const first = SONG.sections[0].bpm;
    for (let i = 0; i < SONG.countIn; i++) clicks.push({ t: t + i * 60 / first, high: i === 0 });
    t += SONG.countIn * 60 / first;
    SONG.sections.forEach((sec, si) => {
      const eighth = 30 / sec.bpm;
      const gapStart = t;   // カットインの始まり（2つ目からの速さ）
      if (si === 0) {
        banners.push({ t: t, bpm: sec.bpm, first: true });
      } else {
        // 速さが変わる前の「間」（新しい速さで1小節）：カットイン。まんぷくは、そのあとで「ぽよ〜ん！」
        banners.push({ t: t, bpm: sec.bpm, cutin: si - 1 });   // 何回目のカットインか（0 から）
        if (food) grows.push(t + CUTIN.growAfter);
        for (let e = 0; e < 8; e++) {
          hats.push({ t: t, accent: e % 2 === 0 });
          t += eighth;
        }
      }
      if (food) {
        // まんぷく：この速さの間の「たべたい！」（前と同じ食べものにはしない）
        want = pick(FOOD.foods.filter((f) => f !== want));
        // 2つ目からの速さは、カットインが出た直後に出す（2026-11-02 ユーザー「出るのが遅い」。前は最初の ◉ の少し前だった）
        wants.push({ t: si === 0 ? t - FOOD.appear - 0.05 : gapStart + FOOD.wantAfterCutin, food: want });
      }
      let firstInSec = true;
      for (let b = 0; b < sec.bars; b++) {
        for (let e = 0; e < 8; e++) {
          hats.push({ t: t, accent: e % 2 === 0 });
          const purun = !food && b % SONG.purun.every === SONG.purun.every - 1 && e === SONG.purun.at;
          const pat = taiko() ? TAIKO_PATTERN : SONG.pattern;
          if (pat[e]) {
            const n = { t: t, kind: purun ? 'purun' : pat[e] };
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
    notes.forEach((n, i) => {
      // おまつり：〜 はおなかの上、ほかは太鼓の上
      const A = taiko() && n.kind === 'purun' ? ART.purunArea : MOLE.area;
      for (let k = 0; k < 30; k++) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
        n.ix = A.x + Math.cos(a) * r * A.rx;
        n.iy = A.y + Math.sin(a) * r * A.ry;
        const near = notes.slice(Math.max(0, i - 2), i).some((m) => Math.hypot(m.ix - n.ix, m.iy - n.iy) < MOLE.gap);
        if (!near) break;
      }
    });
    return { notes: notes, hats: hats, clicks: clicks, banners: banners, wants: wants, grows: grows, end: t + 1.2 };
  }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ---------- 遊んでいる間の状態 ---------- */
  let chart = null, t0 = 0, playing = false, nextNote = 0, nextBanner = 0;
  let paused = false;
  let mode = 'belly';   // 'lane'＝ステージ1 ながれる／'belly'＝ステージ2 おなか／'food'＝ステージ3 まんぷく
  let nextWant = 0, fed = 0, targets = 0, wrongs = 0, wrongUntil = -9;
  let nextGrow = 0, shownFat = 0;   // まんぷく：次にふくらむ時、いま見せているふくらみ（0〜1）   // まんぷく：食べた数・「たべたい」の数・まちがえた時
  let score = 0, combo = 0, maxCombo = 0, lastMiss = -9, shyUntil = -9;
  let counts = { perfect: 0, good: 0, ok: 0, miss: 0 };

  // 画面に使う「曲の何秒目か」：音の時計（rawSongTime）に、なめらかに合わせる。
  // スマホが重いときなどに音の時計が止まったり飛んだりしても（2026-11-02 実機で「カットインが遅れて、そのあと ◉ がすごい速さ」）、
  // 画面の進み方は ふつうの 0.6〜1.4倍におさめて、少しずつ合わせる。
  // ただし、画面が音より0.1秒以上おくれたとき（始めた直後などに、スマホが一瞬止まったとき）は、一気に追いつく
  // （2026-11-03：少しずつ追いつくと、◉ が1〜2秒ほど 1.4倍の速さで流れて見えた＝「2回目の最初だけ ◉ が猛スピード」）。
  // 音の時計が止まったとき（画面が先に進みすぎ）は、今までどおり ゆっくりにして待つ。ずれが2秒より大きいときは一気に合わせる
  const clock = { song: null, perf: 0 };
  function resetClock() { clock.song = null; }
  function songTime() {
    const raw = rawSongTime(), p = performance.now() / 1000;
    if (clock.song == null || !isFinite(clock.song)) { clock.song = raw; clock.perf = p; return raw; }
    const dt = Math.max(0, Math.min(0.25, p - clock.perf));
    clock.perf = p;
    const pred = clock.song + dt, err = raw - pred;
    if (Math.abs(err) < 0.004 || err > 0.1 || err < -2) clock.song = raw;
    else clock.song = pred + Math.max(-dt * 0.4, Math.min(dt * 0.4, err * 0.15));
    return clock.song;
  }
  // いま聞こえている音が「曲の始まりから何秒目か」（音の時計そのまま）
  function rawSongTime() {
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
    if (taiko() && !taikoOpen()) mode = 'food';   // 念のため（開いていないのに ステージ4 へ来たとき）
    // 映す絵：おまつりは太鼓の絵（揺れの仕組みも切りかえる）
    if (taiko()) taikoSetup();
    ART = taiko() ? ARTS.taiko : ARTS.normal;
    MOLE.area = ART.mole.area; MOLE.gap = ART.mole.gap;
    belly.stop();
    belly = taiko() ? bellyT : bellyN;
    app.classList.toggle('mode-taiko', taiko());
    app.classList.toggle('art-fade', ART.fade);
    app.classList.toggle('mode-belly', onBelly());
    app.classList.toggle('mode-food', mode === 'food');
    app.classList.toggle('mode-lane', mode === 'lane');
    layout();   // モードで、おなかを映す広さが変わる
    // 揺れの準備（絵の色の読み取り・変形の計算表）を、音が鳴り出す前にすませておく
    // （最初にたたいた瞬間にやると、画面が一瞬止まるため）
    belly.ready();
    if (ac) ac.close();
    ac = makeAudio();
    if (!ac) { $('start').querySelector('.small').textContent = tr('このブラウザでは音が出せません。別のブラウザで開いてね'); return; }
    ac.resume();
    chart = buildChart();
    t0 = ac.currentTime + SONG.lead;
    resetClock();
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
    nextGrow = 0; shownFat = 0;
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
    howto.innerHTML = HOWTO[mode].map((line) => '<p>' + tr(line, { note: NOTE_IC, purun: PURUN_IC }) + '</p>').join('') +
      '<p class="howto-sub">' + tr('8ビート・だんだん速くなるよ') + '</p>';
    howto.classList.remove('out', 'top');
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
    const nb = chart.banners[nextBanner];
    if (nb && now >= nb.t - (nb.cutin != null ? 0 : 0.4)) {
      nextBanner++;
      if (nb.cutin != null) cutin(nb.bpm, nb.cutin);
      else banner(tr('スタート！ BPM {n}', { n: nb.bpm }));
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

    // まんぷく：休みのはじめに、食べた分だけ「ぽよ〜ん！」
    if (mode === 'food' && nextGrow < chart.grows.length && now >= chart.grows[nextGrow]) {
      nextGrow++;
      grow(now);
    }

    if (now >= chart.end) {
      if (mode === 'food') feast(); else finish();
      return;
    }
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
      popWord(tr('それじゃないよ〜'), p.sx, p.sy, 'wrong');
      wrongUntil = p.now + 0.8;
      wrongs++;
      judge(null, p.now, found.note);
      return;
    }
    const kind = found && found.d < 0.25 ? found.note.kind : 'pon';
    // おまつり：太鼓をたたいたら「ドン」「カッ」（おなかをたたいたときは、いつもの「ぽん」）
    const drum = taiko() && p.drum;
    if (ac) (drum ? (kind === 'poko' ? soundKa : soundDon) : kind === 'poko' ? soundPoko : soundPon)(ac.currentTime, 1);
    react(false);
    const eat = found && found.note.food;
    popWord(tr(eat ? 'ぱくっ！' : drum ? (kind === 'poko' ? 'カッ！' : 'ドン！') : kind === 'poko' ? 'ぽこ！' : 'ぽん！'), p.sx, p.sy, kind);
    if (playing && hit(found, p.now) && eat) feed();
  }
  // まんぷく：食べた数に合わせて、おなかをふくらませる
  // まんぷく：食べた（ゲージはすぐにたまる。おなかは grow でまとめてふくらむ）
  function feed() {
    fed++;
    $('full-fill').style.width = Math.min(1, fed / Math.max(1, targets)) * 100 + '%';
  }
  // それまでに食べた分だけ、おなかを「ぽよ〜ん！」とふくらませる
  function grow(now) {
    const level = Math.min(1, fed / Math.max(1, targets));
    if (level <= shownFat + 0.001) return;
    shownFat = level;
    belly.setBase('fat', FOOD.maxFat * level);
    belly.bounce('belly', -0.06);   // ふくらむ勢いで、少し大きめに揺れる
    if (ac) soundGrow(ac.currentTime);
    const a = ART.fat;
    // 文字は、おなかにかぶらないように、おなかの上（胸のあたり）に出す
    popWord(tr('ぽよ〜ん！'), offX + a.x / 100 * ART.w * scale, offY + (a.y - a.ry * 0.8) / 100 * ART.h * scale, 'big');
    if (now != null) shyUntil = now + SHY_SECONDS;
  }
  // 最後の「ごちそうさまタイム」：大きくなったおなかを眺めたり、自由にぽんぽこしたりできる時間
  function feast() {
    playing = false;
    showBar();
    grow(null);
    const el = $('howto');
    el.innerHTML = '<p class="feast">' + tr('ごちそうさま！') + '</p><p>' +
      tr(fed / Math.max(1, targets) >= 0.66 ? 'おなか いっぱい〜！' : 'もうちょっと 食べたかったな〜') + '</p>';
    el.classList.remove('out');
    el.classList.add('top');   // おなかが見えるように、画面の上のほうに
    el.hidden = false;
    $('want').hidden = true;
    setFace(fed / Math.max(1, targets) >= 0.66 ? 'full' : 'happy');
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => { el.hidden = true; finish(); }, 300);
    }, FOOD.feastSeconds * 1000);
  }
  function showWant(food) {
    const el = $('want');
    el.textContent = '';
    el.appendChild(Object.assign(document.createElement('span'), { className: 'want-food', textContent: food }));
    el.appendChild(document.createTextNode(tr('たべたい！')));
    el.hidden = false;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    if (ac) soundBell(ac.currentTime);
  }
  function purun(p) {
    p.purun = true;
    if (ac) soundPurun(ac.currentTime);
    react(true);
    popWord(tr('ぷるん！'), p.sx, p.sy, 'purun');
    if (playing) hit(nearest(p.now, ['purun'], p), p.now);
  }

  // たたいた所（絵のピクセル）が、どこか：'body'（胸・おなか）／'skirt'（腰みの）／null（それ以外＝からぶり）
  function areaAt(ix, iy) {
    const H = ART.hit;
    if (!H) return 'body';
    const D = ART.drum;
    if (D && Math.hypot((ix - D.cx) / D.rx, (iy - D.cy) / D.ry) <= 1) return 'drum';
    const c = H.chest, b = H.belly, k = H.skirt;
    if (ix >= c.x0 && ix <= c.x1 && iy >= c.y0 && iy <= c.y1) return 'body';
    if (Math.hypot((ix - b.cx) / b.rx, (iy - b.cy) / b.ry) <= 1) return 'body';
    if (k && Math.hypot((ix - k.cx) / k.rx, (iy - k.cy) / k.ry) <= 1) return 'skirt';
    return null;
  }
  let skirtSide = 0;

  stage.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;
    const ix = (sx - offX) / scale, iy = (sy - offY) / scale;
    // 胸・おなかの外は、点にも音にもしない（2026-11-03。ステージ1で、足や背景をたたいても判定されていたため）。
    // おなかモードで ◉ のすぐ近く（hitR 以内）をたたいたときは、おなかの外にはみ出していても今までどおり
    let area = areaAt(ix, iy);
    if (area !== 'body' && area !== 'drum' && playing && ac && onBelly()) {
      const late = Math.min(0.1, Math.max(0, (performance.now() - e.timeStamp) / 1000));
      if (nearest(songTime() - late, ['pon', 'poko', 'purun'], { sx: sx, sy: sy })) area = 'body';
    }
    if (area === 'skirt') { belly.nudge('skirt', (skirtSide++ % 2 ? 1 : -1) * 5, 2); return; }   // 腰みのが少し揺れるだけ
    if (!area) return;   // からぶり
    const p = pointers[e.pointerId] = { sx: sx, sy: sy, x0: e.clientX, y0: e.clientY, now: 0, wait: false, purun: false, pull: false, drum: area === 'drum' };
    // おまつり：太鼓をたたいたら、たたく絵が一瞬出て、おなかが少しだけ揺れる（ドンの響き）
    if (p.drum) drumHit();
    else if (belly.ready()) belly.press('belly', ix, iy);
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
    if (p.drum) return;   // 太鼓の上では、すべらせても「ぷるん」にしない
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
    if (!p.drum) belly.release('belly', e.type === 'pointerup' && !p.pull);
  }
  stage.addEventListener('pointerup', lift);
  stage.addEventListener('pointercancel', lift);

  function judge(j, now, n) {
    if (!j) {
      counts.miss++;
      combo = 0;
      lastMiss = now;
      showJudge(tr('ミス'), 'miss', n);
    } else {
      counts[j.key]++;
      combo++;
      maxCombo = Math.max(maxCombo, combo);
      if (combo % SHY_EVERY === 0) { shyUntil = now + SHY_SECONDS; rewardFrame(now); }   // おまつり：コンボ10ごとに、たたく絵（ごほうび）
      if (n && n.last) rewardFrame(null);   // 最後の一打
      // コンボ10ごとに、1回の点数が10点ずつ増える（最大 +50）
      score += j.point + Math.min(50, Math.floor(combo / 10) * 10);
      $('score').textContent = score;
      showJudge(tr(j.label), j.key, n);
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
    el.textContent = combo >= 2 ? tr('{n} コンボ', { n: combo }) : '';
    if (combo >= 2) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  }
  // カットイン：がんばる顔と「スピードアップ！」の帯が、右から入って左へ抜ける
  function cutin(bpm, i) {
    rewardFrame(songTime());   // おまつり：速くなる前に、たたく絵（ごほうび）
    const el = $('cutin'), lv = CUTIN.levels[Math.min(i, CUTIN.levels.length - 1)];
    $('cutin-bpm').textContent = 'BPM ' + bpm;
    $('cutin-text').textContent = tr(lv.text);
    $('cutin-face').src = cutFaces[CUTIN.levels.indexOf(lv)];
    const band = el.firstElementChild;
    band.style.setProperty('--c1', lv.colors[0]);
    band.style.setProperty('--c2', lv.colors[1]);
    // 帯の高さ：おへその上と、おなかの上部のあいだ（画面の大きさで変わるので、毎回計算する）
    const y = stage.getBoundingClientRect().top - app.getBoundingClientRect().top + offY + (taiko() ? TAIKO_CUTIN_AT : CUTIN.at) / 100 * ART.h * scale;
    band.style.top = (y - (band.offsetHeight || 136) / 2) + 'px';   // 隠れている間は高さが 0 なので、そのときは 136
    el.hidden = false;
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
    if (ac) soundWhoosh(ac.currentTime);
    clearTimeout(cutin.timer);
    cutin.timer = setTimeout(() => { el.hidden = true; }, CUTIN.seconds * 1000);
  }
  const cutFaces = CUTIN.levels.map((lv) => { const src = IMG(lv.face); new Image().src = src; return src; });
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
    setTimeout(() => el.remove(), kind === 'big' ? 1200 : 600);
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
    $('r-title').textContent = tr(rank.title);
    $('r-img').src = rank.src;
    $('result').scrollTop = 0;
    $('r-score').textContent = score;
    ['perfect', 'good', 'ok', 'miss'].forEach((k) => { $('r-' + k).textContent = counts[k]; });
    $('r-combo').textContent = maxCombo;
    $('r-line').textContent = tr('タヌくん「{s}」', { s: tr(rank.line) });
    const url = /^https?:/.test(location.href) ? location.href.split(/[?#]/)[0] : 'https://tanukun.pages.dev/pon/';
    const text = tr('🥁 ぽんぽこリズム {stage}\n{n}てん「{rank}」さいだい{m}コンボ\n#タヌくん #ぽんぽこリズム\n',
      { stage: stageName(mode), n: score, rank: tr(rank.title), m: maxCombo }) + url;
    $('btn-post').href = 'https://x.com/intent/post?text=' + encodeURIComponent(text);
    // 次のステージへ
    const next = STAGES[mode].next && (STAGES[mode].next !== 'taiko' || taikoOpen()) ? STAGES[mode].next : null;
    $('btn-next').hidden = !next;
    // おまつり：結果の絵は、太鼓をたたく絵（いい結果）か、かまえる絵
    if (taiko()) {
      $('r-img').src = IMG(rate >= 0.7 ? ARTS.taiko.hitSrc : ARTS.taiko.src);
      $('r-line').textContent = tr('タヌくん「{s}」', { s: tr(rate >= 0.7 ? 'お祭りの太鼓、ばっちりだったね！' : 'えへへ、お祭りの太鼓、また いっしょに たたこうね♪') });
    }
    if (next) $('btn-next').textContent = tr('ステージ{n} へ ▶', { n: STAGES[next].num });
    if (mode === 'food') $('r-line').textContent = tr('タヌくん「{s}」',
      { s: tr(fed / Math.max(1, targets) >= 0.66 ? 'ごちそうさま！おなかいっぱい〜！' : 'ごちそうさま！もうちょっと食べたかったな〜') });
    // 本編とのつながり：1日1回のごほうび
    let bonus = false;
    updateSave((d) => {
      if (d.ponBonusDay === today()) return;
      d.ponBonusDay = today();
      d.ponPoints = (d.ponPoints || 0) + BONUS;
      bonus = true;
    });
    $('r-bonus').hidden = !bonus;
    $('r-bonus').textContent = tr('💗 なかよしポイント +{n}（タヌくんのところで受け取れるよ）', { n: BONUS });
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
          resetClock();
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
    $('cutin').hidden = true;
    belly.setBase('fat', 0);
    belly.stop();
    if (taiko()) { mode = 'belly'; ART = ARTS.normal; belly = bellyN; app.classList.remove('mode-taiko'); app.classList.toggle('art-fade', ART.fade); layout(); }
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
  $('r-home').hidden = !IN_SITE;   // 結果の画面からも、タヌくんのところ（トップ画面）へ
  // 本編をまだ遊んだことがない人（X のポストから来た人など）にだけ、本編への入り口を出す
  $('start-home').hidden = !IN_SITE || !!loadSave().lastDay;

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
  // ステージ4 おまつり：開いていれば遊べる。まだなら 🔒 と「第2章を最後まで見ると遊べるよ」
  (function () {
    const b = $('btn-taiko');
    if (!b) return;
    b.hidden = !TAIKO_ON;
    if (!TAIKO_ON) return;
    const open = taikoOpen();
    b.classList.toggle('locked', !open);
    if (!open) b.insertAdjacentHTML('beforeend', '<span class="lock">🔒</span>');
    b.addEventListener('click', () => {
      if (taikoOpen()) return start('taiko');
      const n = $('taiko-note');
      n.hidden = false;
      n.classList.remove('show'); void n.offsetWidth; n.classList.add('show');
    });
  })();
  $('btn-mode').addEventListener('click', quit);
  setFace('normal');
  showBar();
  // 幕を明ける：絵とプログラムの準備ができてから（2026-11-02。開いた直後に、準備中の画面がちらっと見えないように）。
  // ページの読みこみが終わって、2回描いたあと。おそくても 2.5秒で明ける
  (function () {
    let done = false;
    const ready = () => {
      if (done) return;
      done = true;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        // こげ茶の幕（CSS）から、丸く開いて明ける（iris.js。本編のカードから丸く閉じて来たのと対になる）
        if (window.TanuIris) { window.TanuIris.cover(); document.body.classList.add('ready', 'iris'); window.TanuIris.open(); }
        else document.body.classList.add('ready');
      }));
    };
    if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready, { once: true });
    setTimeout(ready, 2500);
  })();
})();
