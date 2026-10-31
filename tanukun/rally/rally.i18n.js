/* =========================================================
   ぽよんラリーの ことば（i18n.js より先に読みこむ）
   画面の文字・セリフは、rally.js の tr('日本語の文') と、index.html の data-i18n・data-i18n-html の所が切りかわる。
   書き方は i18n.js の TEXT と同じ（{n} は数、「1のとき|それ以外」で単数・複数）。
   ほかの言語を足すときは、ここに 〇〇: { ... } を足す（i18n.js の LANGS にも）
   ========================================================= */
window.TANU_TEXT_I18N = window.TANU_TEXT_I18N || {};
window.TANU_TEXT_I18N.en = Object.assign(window.TANU_TEXT_I18N.en || {}, {
  // 画面（index.html）
  'ぽよんラリー｜タヌくん': 'Poyon Rally | Tanu-kun',
  '‹ タヌくん': '‹ Tanu-kun',
  'のこりのボール': 'Balls left',
  'ラリー': 'rallies',
  'さいこう': 'Best',
  'ひっさつ': 'Special',
  '💥 ひっさつ': '💥 Special',
  '🔥 かまえ中…': '🔥 Ready…',
  'いまだ！': 'Now!',
  'ボールを <b>上へ スワイプ</b> して なげてね。<br>タヌくんが おなかで はね返すよ！':
    'Swipe the ball <b>upward</b> to throw it.<br>Tanu-kun will bounce it back with his belly!',
  'もどってくるボールに <b>輪</b> が出るよ。<br>輪が ちぢんで ボールに 重なったら<br>また <b>上へ スワイプ</b> して 打ち返そう！':
    'A <b>ring</b> appears around the returning ball.<br>When it shrinks onto the ball,<br><b>swipe up</b> again to hit it back!',
  'スワイプの <b>長さ</b>で ねらう高さが かわるよ。<br>ナイスで ⚡ をためると… 💥<br>ボールは 3こ。何回つづくかな？':
    'The <b>length</b> of your swipe changes how high you aim.<br>Fill up ⚡ with Nice hits… 💥<br>You have 3 balls. How long can you keep it going?',
  'はじめる': 'Start',
  '🔊 音を出して遊んでね': '🔊 Play with the sound on',
  '合計 <b id="r-count">0</b> ラリー': 'Total <b id="r-count">0</b> rallies',
  '𝕏 でポストする': 'Post on 𝕏',
  'もう一回': 'Play again',
  'タヌくんのところへ もどる': 'Back to Tanu-kun',
  // ラリーが続いたときのひとこと
  'おなかで、ぽよん♪': 'Boing, with my belly♪',
  'まだまだ〜！': 'Keep it coming~!',
  'すごい、つづくね！': 'Wow, we\'re on a roll!',
  'おなか、あつくなってきた〜': 'My belly\'s getting warm~',
  'でんせつのラリーだ…！': 'This is a legendary rally…!',
  // 結果のランク
  'れんしゅう中': 'Practicing',
  'もう一回やろ〜！': 'Let\'s go again~!',
  'なかなか！': 'Not bad!',
  'おなかで返すの、たのしいね♪': 'Bouncing it with my belly is fun♪',
  'ぽよんマスター': 'Poyon Master',
  'ぼくたち、いいコンビだね！': 'We make a great team!',
  '伝説のおなか': 'Legendary Belly',
  'こんなに続いたの、はじめて！': 'I\'ve never had a rally this long!',
  // 遊んでいる間
  '上へ スワイプして 打ち返そう！': 'Swipe up to hit it back!',
  '上へ シュッ！': 'Swipe up!',
  'ボールを 上へ スワイプして なげてね': 'Swipe the ball up to throw it',
  '👆 上へ スワイプして なげてね': '👆 Swipe up to throw',
  'おしい！': 'So close!',
  'あれれ？': 'Huh?',
  'おなかに、なげてね〜': 'Aim for my belly~',
  'こっちだよ〜': 'Over here~',
  'ぽよん！': 'Boing!',
  'ヘディング！': 'Header!',
  'ちかづくよ〜！': 'Coming closer~!',
  'ここからが本番だよ！': 'Now it gets real!',
  '⚡ はやい！': '⚡ Fast!',
  '🎈 ふんわり': '🎈 Floaty',
  '🌀 カーブ': '🌀 Curve',
  'せーの…': 'Ready… set…',
  'かぜ！ 💨→': 'Wind! 💨→',
  '←💨 かぜ！': '←💨 Wind!',
  'ナイス！': 'Nice!',
  'セーフ': 'Safe',
  'あっ！': 'Oops!',
  'ボール、あと {n}こ！': '{n} ball left!|{n} balls left!',
  'あ〜、おしかった！': 'Aww, so close!',
  'あ〜、おとしちゃった': 'Aww, I dropped it',
  // おまたに当たったとき（なかよし度で変わる）
  '💢 こらっ！': '💢 Hey!',
  'どこねらってるの！': 'Where are you aiming?!',
  'そこはダメ〜！': 'Not there~!',
  'おかえしだっ！': 'Take that!',
  '🌿 ぱさっ': '🌿 Swish',
  'ひゃっ…！': 'Eep…!',
  'そ、そこは…': 'N-not there…',
  'こしみの ガード！': 'Leaf-skirt guard!',
  '🌿 ぱさっ♡': '🌿 Swish♡',
  'も〜…♡': 'Geez…♡',
  'えへへ、ねらったでしょ〜': 'Hehe, you did that on purpose~',
  'しかたないなぁ♪': 'Oh, fine then♪',
  // ひっさつ
  'ひっさつ…！ くるか〜？': 'A special…! Here it comes~?',
  'ひっさつ！': 'Special!',
  'こい〜っ！': 'Bring it~!',
  'ぽよよ〜ん！！': 'BOIIING!!',
  'ボーナス +{n}': 'Bonus +{n}',
  'すごい球だった〜！': 'What a shot~!',
  // 結果
  'いちばん続いたのは {n} ラリー': 'Longest streak: {n} rally|Longest streak: {n} rallies',
  '🎉 さいこう記録！': '🎉 New best!',
  'さいこう記録 {n} ラリー': 'Best: {n} rally|Best: {n} rallies',
  'タヌくん「{s}」': 'Tanu-kun: "{s}"',
  '💗 なかよしポイント +{n}（タヌくんのところで受け取れるよ）': '💗 Friendship +{n} (collect it at Tanu-kun\'s place)',
  '💗 1回 打ち返せば なかよしポイント +{n}（1日1回）': '💗 Hit it back once for Friendship +{n} (once a day)',
  '💗 {at}ラリーで なかよしポイント +{n}（1日1回）': '💗 Reach {at} rallies for Friendship +{n} (once a day)',
  '💗 {at}ラリーで さらに +{n}（1日1回）': '💗 Reach {at} rallies for +{n} more (once a day)',
  '🏐 ぽよんラリー\n合計{n}ラリー「{rank}」（いちばん続いたのは{m}）\n#タヌくん #ぽよんラリー\n':
    '🏐 Poyon Rally\n{n} rallies total: "{rank}" (longest streak {m})\n#Tanukun #PoyonRally\n'
});
