/* =========================================================
   タヌくんを洗おう の ことば（i18n.js より先に読みこむ）
   画面の文字・セリフは、washing.js の tr('日本語の文') と、index.html の data-i18n の所が切りかわる。
   書き方は i18n.js の TEXT と同じ（{n} などはそのまま残す）。「|」は単数・複数の区切りになるので使わない
   ========================================================= */
window.TANU_TEXT_I18N = window.TANU_TEXT_I18N || {};
window.TANU_TEXT_I18N.en = Object.assign(window.TANU_TEXT_I18N.en || {}, {
  // 画面
  'タヌくんを洗おう｜タヌくん': 'Bath Time – Tanu-kun',
  'おけのお風呂に入ったタヌくん': 'Tanu-kun in a wooden tub bath',
  'よみこみ中…': 'Loading…',
  '‹ タヌくん': '‹ Tanu-kun',
  'よごれ': 'Dirt',
  '音 ON': 'Sound ON',
  '音 OFF': 'Sound OFF',
  'ピカピカ！': 'Squeaky clean!',
  'もう一回': 'Again',
  'ふわふわ、いいにおい〜♪': 'So fluffy and fresh~♪',
  '（ごほうびの絵は、これから入ります）': '(Reward pictures are coming soon)',
  '絵を読みこめませんでした。ページを開き直してください': 'Couldn\'t load the pictures. Please reopen the page.',
  '<b>よごれている所を、指でこすってね</b><br><span class="sub">頭・むね・おなか・腕・しっぽ。貝がらやヒトデもついてるよ</span>':
    '<b>Rub the dirty spots with your finger</b><br><span class="sub">Head, chest, belly, arms, tail. There are shells and starfish stuck on, too</span>',
  '<b>指でなぞると、上からシャワーが出るよ</b><br><span class="sub">泡を流してね。おなかや胸をタップすると…？</span>':
    '<b>Slide your finger to pour the shower from above</b><br><span class="sub">Rinse off the bubbles. And if you tap his belly or chest…?</span>',
  // 小物
  '貝がら': 'Shell',
  'ヒトデ': 'Starfish',
  'コンブ': 'Kelp',
  '{n}、とれた！': '{n} came off!',
  'ぷるん！': 'Jiggle!',
  // タヌくんのひとこと
  '砂だらけになっちゃった〜。洗ってくれる？': 'I\'m all sandy~. Will you wash me?',
  'よごれてる所を、こすってね〜': 'Rub the dirty spots~',
  'まだ砂がついてるよ〜': 'There\'s still sand on me~',
  'きもちいい〜': 'Feels so good~',
  'ふぁ〜、いい気持ち…': 'Haa~, that\'s nice…',
  'くすぐった〜い！': 'That tickles~!',
  'あはは、くすぐったいよ〜': 'Ahaha, it tickles~',
  'ひゃ〜、そこ弱いの〜！': 'Hyaa~, I\'m ticklish there~!',
  'えへへ…': 'Hehe…',
  'おなか、ぽよぽよ〜': 'Belly goes boing boing~',
  'やさしくね〜': 'Gently, okay~',
  'ひゃっ！': 'Eek!',
  'しっぽは、やさしくね〜': 'Be gentle with my tail~',
  'そ、そこは自分で洗うから〜！': 'I-I\'ll wash there myself~!',
  'そ、そこはいいの〜！': 'N-not there, it\'s fine~!',
  'お湯、あったか〜い♪': 'The water\'s nice and warm~♪',
  'とれた〜！': 'It came off~!',
  'あわあわ〜！ シャワーで流して〜': 'So bubbly~! Rinse me with the shower~',
  'あったか〜い♪': 'So warm~♪',
  'ぷるんっ！': 'Jiggle!',
  'えへへ、はじいた〜': 'Hehe, it bounced off~',
  'ぶるぶる〜っ！': 'Shake shake~!',
  'ピカピカになった〜！ ありがと♪': 'I\'m all clean~! Thank you♪'
});
window.TANU_TEXT_I18N.zh = Object.assign(window.TANU_TEXT_I18N.zh || {}, {
  // 画面
  'タヌくんを洗おう｜タヌくん': '给狸君洗澡｜狸君',
  'おけのお風呂に入ったタヌくん': '泡在木桶里的狸君',
  'よみこみ中…': '加载中…',
  '‹ タヌくん': '‹ 狸君',
  'よごれ': '脏污',
  '音 ON': '声音 开',
  '音 OFF': '声音 关',
  'ピカピカ！': '亮晶晶！',
  'もう一回': '再来一次',
  'ふわふわ、いいにおい〜♪': '软乎乎的，好香～♪',
  '（ごほうびの絵は、これから入ります）': '（奖励图片即将加入）',
  '絵を読みこめませんでした。ページを開き直してください': '图片加载失败。请重新打开页面。',
  '<b>よごれている所を、指でこすってね</b><br><span class="sub">頭・むね・おなか・腕・しっぽ。貝がらやヒトデもついてるよ</span>':
    '<b>用手指搓一搓脏的地方吧</b><br><span class="sub">头、胸、肚子、手臂、尾巴。还粘着贝壳和海星哦</span>',
  '<b>指でなぞると、上からシャワーが出るよ</b><br><span class="sub">泡を流してね。おなかや胸をタップすると…？</span>':
    '<b>用手指滑动，上面就会出水哦</b><br><span class="sub">把泡泡冲掉吧。点一点肚子或胸口会…？</span>',
  // 小物
  '貝がら': '贝壳',
  'ヒトデ': '海星',
  'コンブ': '海带',
  '{n}、とれた！': '{n}掉下来了！',
  'ぷるん！': 'Q弹！',
  // タヌくんのひとこと
  '砂だらけになっちゃった〜。洗ってくれる？': '浑身都是沙子～。帮我洗洗好吗？',
  'よごれてる所を、こすってね〜': '搓一搓脏的地方吧～',
  'まだ砂がついてるよ〜': '还有沙子哦～',
  'きもちいい〜': '好舒服～',
  'ふぁ〜、いい気持ち…': '哈～，真舒服…',
  'くすぐった〜い！': '好痒～！',
  'あはは、くすぐったいよ〜': '哈哈，好痒呀～',
  'ひゃ〜、そこ弱いの〜！': '呀～，那里最怕痒了～！',
  'えへへ…': '嘿嘿…',
  'おなか、ぽよぽよ〜': '肚子软软弹弹～',
  'やさしくね〜': '轻一点哦～',
  'ひゃっ！': '呀！',
  'しっぽは、やさしくね〜': '尾巴要轻轻的哦～',
  'そ、そこは自分で洗うから〜！': '那、那里我自己洗啦～！',
  'そ、そこはいいの〜！': '那、那里不用啦～！',
  'お湯、あったか〜い♪': '水暖暖的～♪',
  'とれた〜！': '掉下来了～！',
  'あわあわ〜！ シャワーで流して〜': '全是泡泡～！用淋浴冲掉吧～',
  'あったか〜い♪': '暖暖的～♪',
  'ぷるんっ！': 'Q弹！',
  'えへへ、はじいた〜': '嘿嘿，弹开啦～',
  'ぶるぶる〜っ！': '抖抖抖～！',
  'ピカピカになった〜！ ありがと♪': '变得亮晶晶啦～！谢谢你♪'
});
