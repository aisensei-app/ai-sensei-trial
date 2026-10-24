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
    ponpoko2: 'images/ponpoko2.webp'   // お腹ぽんぽこ②
  },

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

  /* ---- タップする場所の範囲 ----
     絵の左上を 0、右下を 100 とした「％」で指定します。
     本番の絵に差し替えたら、ここを合わせて調整してください。
     （showZones を true にすると、範囲が画面に表示されます） */
  zones: {
    head:  { left: 20, top: 0,  width: 50, height: 22 },
    belly: { left: 10, top: 22, width: 50, height: 42 },
    tail:  { left: 60, top: 50, width: 40, height: 40 }
  },
  showZones: false,   // URL の最後に ?zones を付けても表示されます

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

  /* ---- その他 ---- */
  bubbleSeconds: 2.6,   // ふきだしを表示しておく秒数
  vibrate: true         // おなかタップで軽く振動（Android のみ対応）
};
