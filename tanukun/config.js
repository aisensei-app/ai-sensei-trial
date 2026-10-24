/* =========================================================
   タヌくん 設定ファイル
   ここの数字や名前を変えるだけで、動きや絵を調整できます。
   ========================================================= */
window.TANU_CONFIG = {

  /* ---- 絵（画像ファイルの場所） ----
     絵を差し替えるときは、images フォルダにファイルを置いて
     ここのファイル名を書き換えるだけでOKです。（例：'images/normal.png'） */
  images: {
    normal:   'images/normal.svg',  // 通常
    shy:      'images/shy.svg',     // 照れ
    troubled: 'images/shy.svg',     // 困り（専用の絵ができたら差し替え）
    angry:    'images/angry.svg',   // 怒り
    melt:     'images/melt.svg',    // とろけ
    bush:     'images/bush.svg'     // 茂み（しっぽがはみ出た絵）
  },

  /* ---- タップする場所の範囲 ----
     絵の左上を 0、右下を 100 とした「％」で指定します。
     本番の絵に差し替えたら、ここを合わせて調整してください。
     （showZones を true にすると、範囲が画面に表示されます） */
  zones: {
    head:  { left: 10, top: 0,  width: 70, height: 46 },
    belly: { left: 14, top: 46, width: 58, height: 54 },
    tail:  { left: 72, top: 38, width: 28, height: 52 }
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
