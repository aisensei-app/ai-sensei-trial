/* =========================================================
   タヌくん 設定ファイル
   ここの数字や名前を変えるだけで、動きや絵を調整できます。
   ========================================================= */
window.TANU_CONFIG = {

  /* ---- 絵（画像ファイルの場所） ----
     絵を差し替えるときは、images フォルダにファイルを置いて
     ここのファイル名を書き換えるだけでOKです。（例：'images/normal.png'） */
  images: {
    normal:   'images/normal.webp',    // 通常
    shy:      'images/shy.webp',       // 照れ
    troubled: 'images/troubled.webp',  // 困り
    angry:    'images/angry.webp',     // 怒り
    melt:     'images/melt.webp',      // とろけ
    bush:     'images/bush.webp',      // 茂み
    muni:     'images/muni.webp',      // お腹むにむに
    ponpoko1: 'images/ponpoko1.webp',  // お腹ぽんぽこ①
    ponpoko2: 'images/ponpoko2.webp',  // お腹ぽんぽこ②
    mojimoji: 'images/mojimoji.webp',  // おまた：モジモジ（両手で腰みのの前を押さえる）
    dere:     'images/dere.webp',      // おまた：デレ（胸の前で指をちょんちょん）
    dere2:    'images/dere2.webp'      // おまた：デレ2（目を閉じて照れ笑い・腕を腰の後ろ）
  },
  // ※ きせかえパーツの絵は、下の parts で設定します

  /* 怒りの絵がまだないあいだ、絵を赤っぽくして「💢」を出す。
     専用の angry 画像ができたら false に。 */
  angryTint: false,

  /* おなかをタップしたときに、順番に切り替える絵（気分ごと）。
     ぽんぽこ①②を交互に出して「ぽんぽこ」たたいているように見せます。 */
  bellyFaces: {
    normal:   ['ponpoko1', 'ponpoko2', 'ponpoko1', 'ponpoko2'],
    shy:      ['muni', 'muni', 'muni', 'muni']   // 同じ絵を並べると長く表示されます
  },
  bellyFaceMs: 220,   // 1枚を表示する時間（ミリ秒＝1000分の1秒）

  /* ---- おなかの「ぽよん」（Windows版と同じ、絵を網目状に変形させる方式） ----
     範囲は絵の左上を 0、右下を 100 とした％。 */
  bellyJiggle: {
    x: 35.4, y: 44.7,   // おなかの中心（720×900 の絵で 255, 402）
    rx: 21.7, ry: 13.3, // 横・縦の半径（156, 120）。中心ほど強く、ふちで 0 になる
    strength: 1,        // 揺れの大きさ（1 が標準。0.5 で半分）
    spring: 450,        // ばねの強さ（大きいほど速く揺れる。450 で1往復 約0.3秒）
    damp: 9,            // 止まりやすさ（大きいほど早く止まる。9 で約0.8秒）
    tapDent: 0.08,      // タップで最初にへこむ量（0.08 = 8%）。そのあと約4%ふくらむ
    pullMax: 8.6,       // 引っぱれる最大の長さ（絵の横幅の％。Windows版の18px相当）
    pressDent: 0.08,    // 指を置いている間、全体がへこむ量（押した感）
    reboundBoost: 0.5,  // しっかり押してからはなしたときの「ぷるん」の強さ
    poke: { size: 0.5, depth: 0.35, shade: 0.12 }  // 指の位置だけくぼむ（大きさ＝楕円の何倍、深さ、影の濃さ）
  },

  /* ---- 両胸も、さわると「ぷるん」（おなかと同じ動き方で、おなかより控えめ） ----
     gain … おなかに対する揺れ・へこみ・引っぱりの大きさ（0.45 = おなかの45%。0 で揺らさない）
     left / right … 絵で見て左・右の胸の、揺らす楕円（％） */
  chestJiggle: {
    gain: 0.45,
    drag: false,   // 胸は引っぱれないようにする（小さい範囲を引っぱると形がくずれるため）。true で引っぱれる
    bob: 1.4,      // 胸が上下に「ぷるん」と揺れる大きさ（絵の高さの％。1.4 で約13ピクセル）。0 で上下に揺れない
    // x, y … 動きの中心（いちばん大きく動く所）＝乳輪あたり
    // rx, ry … 動く範囲（胸のふくらみ全体。ふちに行くほど弱く動く）
    left:  { x: 19.4, y: 35.6, rx: 12.5, ry: 7 },   // 絵で見て左（720×900 の絵で中心 140, 320）
    right: { x: 47.2, y: 35.6, rx: 12.5, ry: 7 }    // 絵で見て右（中心 340, 320）
  },

  /* ---- きせかえパーツ（アバターのように、タヌくんに部品を付けられる） ----
     メニューの「きせかえ」から付けはずしできます。付けた部品は絵に重ねてから
     網目の変形をするので、おなかや胸の部品も「ぷるん」といっしょに揺れます。

     slot（付ける場所）ごとに、部品を1つだけ付けられます。
       label … メニューに出る場所の名前
       items … 部品の一覧
         id     … 部品の名前（英数字。記録とセリフの part: に使う）
         name   … メニューに出る名前
         image  … 絵（背景透過。images/parts に置く）
         x, y   … 部品の中心の位置（絵の左上 0・右下 100 の％）
         width  … 部品の横幅（絵の横幅の％。高さは絵の縦横比に合わせて自動）
                  ※ x, y, width を書かなければ、720×900 の絵全体に重ねる部品になります
                    （タヌくんの絵と同じ大きさの透明な絵に、部品だけ描いておく方式）
         hearts … 付けられるようになる、なかよし度（ハートの数）。0 なら最初から
         hideOn … この絵のときは表示しない（茂みに隠れているときなど）。省略時 ['bush']
         faces  … 絵によって位置がちがうときの、その絵での x, y（例：{ dere: { x: 28, y: 51 } }）。width も書ける
                  時間帯の立ち絵は time_＋時間帯の id（time_morning など） */
  parts: {
    navel: {
      label: 'おへそ',
      items: [
        // 720×900 の絵で中心 (192, 461)、横幅 56 ピクセル。もとの表情の絵は、どれもおへその位置が同じ。
        // モジモジ・デレ・デレ2の絵は体が右に寄っているので、位置を別に指定（(236, 463)・(202, 462)・(204, 456)）
        { id: 'debeso', name: 'デベソ', image: 'images/parts/debeso.webp', x: 26.67, y: 51.22, width: 7.78, hearts: 0,
          faces: { mojimoji: { x: 32.78, y: 51.44 }, dere: { x: 28.06, y: 51.33 }, dere2: { x: 28.33, y: 50.67 },
                   // 時間帯の立ち絵（timeOfDay）。すやすやは絵が小さめなので、デベソも小さく（width）
                   time_morning: { x: 42.78, y: 54.0 }, time_evening: { x: 38.61, y: 57.33 },
                   time_night: { x: 41.11, y: 53.0 }, time_late: { x: 48.06, y: 69.78, width: 6.85 } } }
      ]
    }
  },

  /* おなかタップで「ぽん！」「ぽこ！」の文字を出す。
     この秒数以内に続けてタップすると、ぽん→ぽこ→ぽん…と交互になる */
  bellyWords: { words: ['ぽん！', 'ぽこ！'], comboSeconds: 1, pull: 'びよ〜ん！' },   // pull は引っぱってはなしたとき

  /* ---- タップする場所の範囲 ----
     絵の左上を 0、右下を 100 とした「％」で指定します。
     本番の絵に差し替えたら、ここを合わせて調整してください。
     （showZones を true にすると、範囲が画面に表示されます） */
  zones: {
    head:   { left: 20, top: 0,  width: 50, height: 24 },
    chestL: { left: 14, top: 30, width: 12, height: 8 },    // 左の胸（絵で見て左）
    chestR: { left: 41, top: 30, width: 12, height: 8 },    // 右の胸
    belly:  { left: 10, top: 38, width: 52, height: 26 },
    tail:   { left: 62, top: 50, width: 38, height: 40 },
    crotch: { left: 25, top: 61, width: 16, height: 14 }    // おまた（おなかと少し重なるが、こちらが優先）
  },
  showZones: false,   // URL の最後に ?zones を付けても表示されます

  /* ---- おまたをさわったとき ----
     なかよし度（ハートの数）で反応が変わります。
       angry … すぐ怒って隠れる（なかよしになる前）
       moji  … モジモジ（はずかしがる。続けてさわると怒る）
       dere  … デレる（ハートが最大になると、腰みのが少しだけ「むくっ」とふくらむ）
     stages … それぞれの反応になるハートの数（この数以上で切りかえ）
     faces  … それぞれの反応で出す絵（images の名前）。bulge はふくらんだときの絵
     weight … 1回を何回分と数えるか（大きいほど怒りやすい）
     bulge  … ふくらみ。x, y, rx, ry は場所（％）、amount は大きさ（0.1 で1割。0.35 まで）、seconds は戻るまでの秒数
              shade は丸く見せる陰影の濃さ（0 でなし）、lift は持ち上がる量（ピクセル）
              hearts 以上のときだけ。amount を 0 にすると、ふくらまない
              ※ ふくらむ間は faces.bulge の絵（デレ2）になるので、場所はデレ2の腰みのに合わせてある */
  crotch: {
    stages: { angry: 0, moji: 2, dere: 4 },
    faces:  { moji: 'mojimoji', dere: 'dere', bulge: 'dere2' },
    weight: { moji: 2, dere: 0.5 },
    // ふくらむのは、腰みのの前のまんなかの葉っぱの中だけ（太ももは動かさない）。デレ2の絵で中心 (235, 600)
    //   poke … ふくらんでいる間にさわると「ぷるん」と揺れる大きさ（ふくらみの何倍へこむか。0 で揺れない）
    bulge:  { hearts: 5, x: 32.6, y: 66.7, rx: 3.9, ry: 4.0, amount: 0.34, shade: 0.8, lift: 5, seconds: 3.5, poke: 0.7 },
    // しっぽが「ビクン」と動く（モジモジ・デレ・デレ2の絵は、しっぽの位置がほぼ同じ）
    //   angles … 反応ごとのはねる角度（度。0 で動かさない）。bulge はふくらむとき（デレ2）
    //   delay … さわってから動くまでの秒数
    //   pivotX, pivotY … しっぽの付け根（動かない所）、x, y, rx, ry … しっぽ全体をかこむ楕円
    //   reach … 付け根からこの長さで、いちばん大きく動く、cutX … これより左（腰みの）は動かさない（すべて％）
    tail:   { angles: { moji: 10, dere: 5, bulge: 10 }, delay: 0.12, pivotX: 68.75, pivotY: 57.8, x: 79.9, y: 71.1, rx: 16.7, ry: 19.4,
              reach: 34.7, cutX: 65.3 },
    // ハート0〜1のとき：1回目は「次さわったら怒るよ」と注意だけ。この秒数以内にもう一度さわると怒って隠れる
    warnSeconds: 10
  },

  /* ---- 怒るまでのしきい値（回数） ---- */
  mood: {
    windowSeconds: 5,  // 何秒以内のタップを数えるか
    shyAt:         3,  // この回数で「照れ」
    troubledAt:    6,  // この回数で「困り」
    angryAt:       10  // この回数で「怒って隠れる」
  },

  /* 1回のタップを何回分と数えるか（場所ごと）。
     例：頭なでを怒りにくくしたいなら head: 0.5 */
  countWeight: { head: 1, belly: 1, tail: 1 },

  /* ---- 隠れている時間（秒）：この範囲でランダム ---- */
  hide: { minSeconds: 3, maxSeconds: 5 },

  /* ---- 頭なで → とろける ---- */
  melt: {
    comboSeconds: 1.2,  // この秒数以内に頭を続けてタップすると、とろける
    holdSeconds:  1.8   // なでるのをやめてから元に戻るまでの秒数
  },

  /* ---- 日付 ----
     何時に「次の日」に切り替えるか。4 なら午前4時（夜ふかしでも同じ日あつかい） */
  days: { dayStartHour: 4 },

  /* ---- トップ画面（home.js。あいさつ → おなかにズーム → おなかの上のアイコンで選ぶ） ----
     normal     … ズームするときの絵（立ち絵 normal.webp をちょうど1.5倍にした高画質の絵。並べ方は同じ）
     pet        … まんなかの「タヌくん なでなで」のアイコンの絵（タヌくんの顔）
     background … 背景
     soonSlots  … まわりの4つの場所のうち、ゲームが入らない所に出す「🔒 もうすぐ」の数（多くても、空いている所まで）
     ゲーム（ぽんぽこ・ラリー）のアイコンは、下の公開スイッチで 'open'＝遊べる／'soon'＝🔒 付き／'hidden'＝出さない */
  home: {
    normal: 'images/topmenu/normal_hd.webp',
    pet: 'images/topmenu/pet.webp',
    background: 'images/bg/beach_day.webp',
    soonSlots: 4
  },

  /* ---- 新しい機能の公開スイッチ ----
     作り終わった機能を、次のアップデートまで「ロック」しておくためのスイッチです。
       'open'   … 遊べる
       'soon'   … 🔒 もうすぐ（ボタンは見えるが、押すと「もうすぐ遊べるよ」）
       'hidden' … 出さない（ボタンも出さない。時間帯は、いつもの立ち絵と背景のまま）
     公開するときは、ここを 'open' にして、tools/build_app.py で zip を作り直します。
     （確認用リンク tools/build_preview.py では、全部 'open' にして作ります） */
  features: {
    pon:       'soon',     // ぽんぽこリズム
    timeOfDay: 'hidden',   // 時間帯で変わる立ち絵と背景
    tailFlick: 'hidden',   // しっぽをはじく（引っぱって離す・ブワッ）
    rally:     'hidden',   // ぽよんラリー（rally/。ボールを投げて、おなかで返す）
    english:   'open',     // 英語版（スマホが英語なら英語。設定の「ことば / Language」で切りかえ。i18n.js）
    chinese:   'open'      // 中国語版（簡体字。スマホが中国語なら中国語。i18n.zh.js・config.zh.js・lines.zh.js）
  },

  /* ---- しっぽをはじく（features.tailFlick） ----
     しっぽを押さえたまま指を動かすと曲がり、はなすと「ぶるるん」と揺れて戻ります。
     bend   … 指の動きに対する曲がりやすさ（1 で指と同じ角度）
     strong … この角度（ラジアン。0.35 ≒ 20度）以上曲げてはなすと「ブワッ」（しっぽが逆立つ）
     puff   … ブワッのふくらみ（0.2 で2割）、puffMs … ふくらんでいる時間（ミリ秒）
     shiver … ブワッのときの、ぶるぶるっ [角度, 回数] */
  tailFlick: { bend: 1.2, strong: 0.35, puff: 0.22, puffMs: 1400, shiver: [3, 6] },

  /* ---- 時間帯（メニュー画面のタヌくんと背景が、スマホの時計で変わる） ----
     from  … この時から（0〜23 時）。上から順に並べる。いちばん上より前の時間は、いちばん下の時間帯
     image … メニュー画面の立ち絵（なければ、いつもの「通常」の絵）。tools/make_time_stands.py でつくる
     sleep … 寝ている（寝息・鼻ちょうちん・💤。「遊ぶ」で起こす）
     wake  … 「遊ぶ」を押したときのひとこと（{name} は呼び名）
     背景の色・星・ホタルは style.css の body[data-time=…] */
  timeOfDay: {
    bands: [
      { id: 'morning', from: 5,  image: 'images/time_morning.webp', wake: 'もぐもぐ…ごくん！よし、遊ぼう！' },
      { id: 'day',     from: 10, image: null,                       wake: '' },
      { id: 'evening', from: 16, image: 'images/time_evening.webp', wake: 'ん〜っ…よし、遊ぼう！' },
      { id: 'night',   from: 19, image: 'images/time_night.webp',   wake: 'ふぁ〜…まだまだ遊べるよ！' },
      { id: 'late',    from: 23, image: 'images/time_sleep.webp', sleep: true, wake: 'ふぁ…？ あ、{name}だ！\n起こされちゃった' }
    ],
    nose: { x: 48.9, y: 33.6 }   // 寝ている絵の鼻の位置（鼻ちょうちんを出す所。絵の％）
  },

  /* ---- なかよし度（ハート💖） ----
     ポイントがたまるとハートが増えます。 */
  friendship: {
    visitPoints: 10,   // その日はじめて来てくれたときのポイント
    tapPoints:   1,    // 1回タップしたときのポイント
    tapDailyMax: 20,   // タップでもらえるポイントの1日の上限（連打で上がりすぎないように）
    // ハート1〜5個になるポイント（毎日来て、そこそこ遊ぶと2週間弱で5個）
    // しっかり遊ぶと（1日最大30ポイント）💖5 は最短5日目、ゆっくりでも10日目くらい
    // 1つ目は、はじめて来た日に5回ほどさわるともらえる（開いただけではもらえない）
    heartAt: [15, 40, 70, 110, 150],
    // ハートが増えたときのお知らせ（1個目〜5個目）。何が変わるかを、ひみつ感を残して伝える
    rewards: [
      '名前で呼んでくれることが増えるよ',
      'あるところの反応が、変わったみたい…？',
      '新しいセリフが増えたよ',
      'あるところの反応が、もっと変わったみたい…？',
      'とっておきの姿が、見られるかも…？'
    ],
    // 1日のタップの上限に達したときの「明日の予告」（いまのハートの数ごと。最後はクリアのあと）
    teasers: [
      '明日は、もっとなかよくなれるかも…？',
      '明日は、もっとなかよくなれるかも…？',
      '明日は、どんな顔を見せてくれるかな…？',
      'もうすぐ、とっておきの姿が…？',
      'あと少しで、とっておきの姿が見られるかも…？',
      'まだ、ひみつがあるみたい…？',
      'また明日も、会いにきてね'
    ]
  },

  /* ---- その他 ---- */
  bubbleSeconds: 2.6,   // ふきだしを表示しておく秒数
  vibrate: true,        // おなかタップで軽く振動（Android のみ対応）

  /* ---- 思い出（ハートをゲットしたときの特別イラスト。恋愛ゲームのように絵と台詞） ----
     ハートが hearts 個になると、全画面で絵が出て、タヌくんが lines を1行ずつ話す（タップで次へ）。
     見た思い出は、実績の「思い出アルバム」から何度でも見返せる。
     image … 特別イラスト（縦長 2:3。images/memories に置く）。空のあいだは stand（ふだんの絵）で仮に表示
     bg    … 仮の表示のときの背景の色（上・下）
     lines の中で { text: '…', image: '…' } と書くと、その台詞から絵が切りかわる（恋愛ゲームの「差分」）
     thumb … アルバムの小さな絵（なければ image） */
  memories: [
    { hearts: 1, title: 'はじめまして', image: 'images/memories/1.webp', stand: 'happy', bg: ['#FFE9C7', '#B9DFA0'],
      lines: ['…えへへ。{name}の手、やさしいね', 'なんだか、もっとなかよくなれそう', 'これから、よろしくね！'] },
    { hearts: 2, title: 'おやつ半分こ', image: 'images/memories/2.webp', stand: 'ponpoko1', bg: ['#FFE2B8', '#E7B97A'],
      lines: ['これ、森でいちばんおいしい木の実なんだ', '…はい、半分こ！', '{name}と食べると、もっとおいしいね'] },
    { hearts: 3, title: 'ひなたぼっこ', image: 'images/memories/3.webp', stand: 'melt', bg: ['#FFF4C9', '#A8D88A'],
      lines: ['今日はぽかぽかだね〜', 'となり、あいてるよ？', '…{name}といると、ねむくなっちゃう'] },
    { hearts: 4, title: '星空の下で', image: 'images/memories/4.webp', stand: 'shy', bg: ['#2B2F5C', '#5A4B7A'],
      lines: ['見て、星がいっぱい…', 'ねえ、{name}。…ずっと、ここに来てくれる？', '…ううん、なんでもない！'] },
    { hearts: 5, title: 'だいすき', image: 'images/memories/5.webp', thumb: 'images/memories/5b.webp', stand: 'dere2', bg: ['#FFD9E4', '#FFB27A'],
      lines: ['{name}、ちょっといい…？', 'いつも会いに来てくれて、ありがとう',
              { text: '…だいすき！ぎゅってして！', image: 'images/memories/5b.webp' }] }
  ],

  /* ---- クリア（ひみつの思い出） ----
     💖5 になってから afterDays 日あとに来ると、ひみつの思い出が流れて、クリア画面（X にポスト）が出る。
     しっかり遊ぶと最短7日目でクリア */
  clear: {
    afterDays: 2,
    hashtag: 'タヌくんクリア',
    memory: {
      title: 'ずっといっしょ', image: 'images/memories/6.webp', thumb: 'images/memories/6c.webp', stand: 'dere2', bg: ['#2B2F5C', '#FF9A6B'],
      lines: ['{name}、これ…受け取ってくれる？', 'ずっと渡したかったんだ',
              { text: 'ここ、{name}のことでいっぱいなんだ', image: 'images/memories/6b.webp' },
              { text: '…おいで。ずっと一緒にいようね', image: 'images/memories/6c.webp' }]
    }
  },

  /* ---- なでなでレポート（本編だけ） ----
     遊ぶ画面の下に葉っぱのゲージ（taps 枚）。さわるごとに1枚ずつ緑になり、たまるとレポートが出て X にポストできる。
     数えるのは「アプリを開いてから（前のレポートのあとから）」さわった回数。
     labels … レポートでの場所の名前（crotch は名前を「？？？」のまま、回数は出す。棒は紫）
     comments / faces … いちばん多くさわった場所ごとの、タヌくんのひとことと絵（同じ数なら even）
     url … 本編を公開したら、その URL を入れる（ポストに付く。空なら付けない） */
  report: {
    taps: 10,
    url: '',
    hashtag: 'タヌくん',
    labels:   { head: 'あたま', chest: 'むね', belly: 'おなか', tail: 'しっぽ', crotch: '？？？' },
    comments: { head: 'なでなで、ありがと〜♪', chest: 'むね、さわりすぎ…！', belly: 'おなかばっかり〜！',
                tail: 'しっぽ、ふわふわでしょ？', crotch: 'ひ、ひみつの場所ばっかり…！', even: 'いろんな所をさわってくれた〜' },
    faces:    { head: 'melt', chest: 'shy', belly: 'ponpoko1', tail: 'normal', crotch: 'troubled', even: 'happy' }
  },

  /* 確認用：設定画面に「なかよし度を切りかえて試す」と「ひみつの思い出とクリア画面を見る」を出す。
     URL の ?hearts=5 も、これが true のときだけ使える（記録は変わらない。開き直すと元に戻る）
     ※ 公開するファイルでは false のまま。確認用リンク（tools/build_preview.py）では自動で true になる */
  testHearts: false,

  /* はじめて開いたときのお知らせ（一度だけ。設定の「このアプリについて」からも見られる） */
  notice: {
    title: 'タヌくんへようこそ！',
    text: 'このアプリには、<b>ちょっぴり大人向けの表現</b>（ドキッとする反応）があります。\n' +
          '<b>15歳以上</b>の方におすすめしています。\n\n' +
          'イラストは AI で作成しています。\n' +
          '記録はこのスマホの中だけに保存され、どこにも送られません。',
    ok: 'わかった！あそぶ'
  }
};
