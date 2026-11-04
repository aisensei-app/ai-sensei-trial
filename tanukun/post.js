/* =========================================================
   タヌくんのポスト（お手紙。2026-11-03）
   ・トップ画面の左下に、木のポストがいつも立っている。お返事が届くと赤い旗が上がって「1」の印、ゆらゆら揺れる
   ・ポストの画面：✏️ お手紙を書く／📬 お返事を読む／📚 お手紙箱
   ・書く：切手を選んで、200字まで → おくる → 便せんが封筒になって、タヌくんが両手で抱えて「よ、読むね…！」
     → 次の日（日付が変わったら）お返事が届く。お手紙は1日1通まで
   ・お返事は、前もって用意した短くてかわいい文から選ぶ（選んだ切手・呼び名で変わる）。
     2026-11-04 夜〜：お手紙の言葉を、このスマホの中で見分けて、内容に合わせたお返事にする（TOPICS。好き・ありがとう・質問・つかれた など）。
     見分けられないときは、どの手紙にも合う、あたたかい文
   ・2026-11-04 夜〜：タヌくんへのお手紙は、どこにも送らない（作者にも見えない。ユーザーと決めた。「タヌくんだけに書いたのに作者に読まれた」と
     恥ずかしい思いをさせないため）。作者へのご意見は、別の入口（app.js の「💡 作者へのご意見」）から Google フォームへ
   ・数えるのは、だれのものかわからない形の「回数・日数」だけ（m-send・m-n〇・m-s〇。文や話題は送らない）
   ・📖 交換日記：書いたお手紙とお返事を、日付ごとに並べて見られる
   ・ときどき、タヌくんから先にお手紙（なかよし10・30・50・100日目、クリアの日）
   ・書く画面の注意書きのあとに「ⓘ お約束と注意」（opts.rules。app.js の showRules('post') を開く）
   ・記録はこのスマホの中（localStorage の tanukun.post）
   使い方：const p = window.TanuPost({ ...下の opts }) → p.open(pt) / p.unread() / p.write() / p.checkMilestones(totalDays, cleared)
   ========================================================= */
window.TanuPost = function (opts) {
  'use strict';

  const KEY = 'tanukun.post';
  const tr = opts.tr;
  const L = () => opts.lang() || 'ja';
  const T = (o) => (o && (o[L()] || o.ja)) || '';
  // 絵（tools/make_post_art.py でつくる）。確認用リンクで文字データに置きかえられるように、場所はそのまま書く
  const SRC = {
    down: 'images/post/mailbox_down.webp',
    up: 'images/post/mailbox_up.webp',
    receive: 'images/post/receive.webp',
    writing: 'images/post/writing.webp'   // お手紙を送ったあと、フェードで出す「机でお返事を書くタヌくん」
  };
  const MAX = 200;   // お手紙の文字数の上限

  /* ---------- 中身 ---------- */
  const STAMPS = [
    { id: 'hibiscus', icon: '🌺' }, { id: 'shell', icon: '🐚' }, { id: 'onigiri', icon: '🍙' },
    { id: 'moon', icon: '🌙' }, { id: 'star', icon: '⭐' }
  ];
  // お返事（短くてかわいい。{name} は呼び名＋「へ」。呼び名がなければ「きみへ」）
  const REPLIES = {
    any: [
      { ja: 'お手紙、ありがとう！\nなんかい も よみかえしちゃった。\nたからものに するね 🐾', en: 'Thank you for your letter!\nI read it again and again.\nI\'ll keep it as my treasure 🐾', zh: '谢谢你的信！\n我读了好多好多遍。\n我会把它当成宝物的 🐾' },
      { ja: 'お手紙、とどいたよ〜！\nうれしくて、おなかが ぽよんって なっちゃった。\nまた かいてね！', en: 'Your letter arrived!\nI was so happy my belly went boing.\nWrite to me again!', zh: '信收到啦～！\n开心得肚子都弹了一下。\n还要再写给我哦！' },
      { ja: 'えへへ…お手紙って、もらうと\nこんなに うれしいんだね。\nありがとう！', en: 'Hehe… getting a letter\nfeels this happy, huh?\nThank you!', zh: '嘿嘿…原来收到信\n是这么开心的事呀。\n谢谢你！' },
      { ja: 'まくらの よこに おいて ねたよ。\nいい ゆめ みられた！\nまた あそびに きてね', en: 'I slept with it next to my pillow.\nI had the sweetest dream!\nCome play again soon', zh: '我把它放在枕头旁边睡觉了。\n做了一个好梦！\n要再来玩哦' },
      { ja: 'お手紙 よんで、ぼく\nしっぽが ぶんぶん しちゃった。\nきみも げんきでね！', en: 'Reading your letter made\nmy tail go swish swish.\nTake care of yourself too!', zh: '读了你的信，\n我的尾巴摇个不停。\n你也要好好的哦！' },
      { ja: 'カニさんにも じまんしちゃった。\n「ぼく、お手紙 もらったんだ〜」って。\nありがとね！', en: 'I showed off to the crab:\n"I got a letter~!"\nThank you!', zh: '我还跟螃蟹炫耀了：\n"我收到信啦～"\n谢谢你！' }
    ],
    hibiscus: [{ ja: 'ハイビスカスの きって、かわいいね！\nぼくの 好きな 花なんだ。\nありがとう 🌺', en: 'What a cute hibiscus stamp!\nIt\'s my favorite flower.\nThank you 🌺', zh: '扶桑花邮票好可爱！\n是我最喜欢的花哦。\n谢谢你 🌺' }],
    shell: [{ ja: '貝がらの きって、すてき！\nきょうの 占い、いいこと あるかもね。\nありがとう 🐚', en: 'A seashell stamp, how lovely!\nMaybe today\'s fortune will be extra good.\nThank you 🐚', zh: '贝壳邮票好棒！\n今天的占卜说不定会有好事哦。\n谢谢你 🐚' }],
    onigiri: [{ ja: 'おにぎりの きって、おいしそう…！\nよんでたら、おなかが ぐぅって なったよ。\nありがとう 🍙', en: 'A rice ball stamp, looks so yummy…!\nMy tummy rumbled while reading.\nThank you 🍙', zh: '饭团邮票看起来好好吃…！\n读着读着肚子就咕咕叫了。\n谢谢你 🍙' }],
    moon: [{ ja: 'お月さまの きって、きれいだね。\nこんやは いっしょに 月を みようね。\nおやすみ 🌙', en: 'What a pretty moon stamp.\nLet\'s look at the moon together tonight.\nGood night 🌙', zh: '月亮邮票好漂亮。\n今晚一起看月亮吧。\n晚安 🌙' }],
    star: [{ ja: 'お星さまの きって、キラキラだ！\nきみの ねがいごと、かないますように。\nありがとう ⭐', en: 'A star stamp, so sparkly!\nI hope your wish comes true.\nThank you ⭐', zh: '星星邮票亮晶晶的！\n希望你的愿望能实现。\n谢谢你 ⭐' }]
  };
  /* お手紙の話題（2026-11-04 夜）：上から順に見て、最初に当てはまった話題のお返事にする。文はこのスマホの中で見るだけで、どこにも送らない
     words … 小文字にした文に、どれか1つでも入っていれば当てはまる（日本語・英語・中国語・韓国語の、よく使う言葉）
     ask   … true なら「？」もいっしょにあるときだけ（質問） */
  const TOPICS = [
    { id: 'help', words: ['死にたい', 'しにたい', '消えたい', 'きえたい', '自殺', 'じさつ', 'suicide', 'kill myself', 'want to die', '想死', '自杀', '不想活', '죽고 싶'] },
    { id: 'adult', words: ['えっち', 'エッチ', 'えろ', 'エロ', 'セックス', 'はだか', '裸', 'おちんちん', 'ちんこ', 'sex', 'fuck', 'naked', 'nude', 'nsfw', 'horny', 'dick', 'cock', '色色', '做爱', '肉棒', '鸡巴', '야한', '섹스'] },
    { id: 'sad', words: ['疲れ', 'つかれ', 'しんど', 'つらい', '辛い', 'かなしい', '悲しい', 'さみしい', '寂しい', 'さびしい', '泣', '眠れ', 'ねむれ', '落ち込', 'tired', 'sad', 'lonely', ' cry', 'stress', 'depress', 'exhausted', '累', '难过', '難過', '伤心', '傷心', '孤独', '寂寞', '哭', '压力', '힘들', '슬퍼', '외로'] },
    { id: 'ask', ask: true, words: ['好き', 'すき', 'なに', '何', 'どこ', 'どんな', 'what', 'favorite', 'favourite', 'do you like', 'like', '喜欢', '什么', '吗', '嗎', '뭐', '좋아'] },
    { id: 'together', words: ['ずっと', 'いっしょ', '一緒', 'そばに', 'always', 'together', 'forever', 'by your side', 'soulmate', '一直', '一起', '永远', '永遠', '陪', '함께', '같이'] },
    { id: 'love', words: ['好き', 'すき', '大好き', '愛', 'あいして', 'love', '❤', '💕', '💗', '💖', '♡', '♥', '爱', '愛你', '喜欢', '사랑', '좋아'] },
    { id: 'thanks', words: ['ありがと', '癒', 'いやさ', 'いやし', 'たのし', '楽し', 'うれし', '嬉し', 'thank', 'thx', 'comfort', 'heal', 'happy', 'fun', '谢谢', '謝謝', '治愈', '感谢', '开心', '開心', '고마', '감사', '행복'] },
    { id: 'food', words: ['ごはん', 'ご飯', 'たべ', '食べ', 'おいし', '美味', 'ラーメン', 'おにぎり', 'おやつ', 'ケーキ', ' eat', 'food', 'yummy', 'delicious', 'snack', '吃', '好吃', '饭', '美食', '먹'] },
    { id: 'play', words: ['ぽんぽこ', 'ぽんぽん', 'ラリー', 'おなか', 'お腹', 'しっぽ', '尻尾', '肉球', 'なでなで', 'belly', 'tummy', 'tail', 'paw', 'pat ', 'pats', 'pet ', '肚子', '尾巴', '摸', '배'] },
    { id: 'hello', words: ['はじめまして', 'こんにちは', 'こんばんは', 'おはよう', 'hello', 'hi ', 'hey', '你好', '初次见面', '안녕'] }
  ];
  function topicOf(text) {
    const t = ' ' + String(text || '').toLowerCase() + ' ';
    const q = /[?？]/.test(t);
    const hit = TOPICS.find((x) => (!x.ask || q) && x.words.some((w) => t.indexOf(w.toLowerCase()) >= 0));
    return hit ? hit.id : '';
  }
  // 話題ごとのお返事（短くてかわいい。2つずつ。help は、身近な大人や窓口にも話してね、をやさしく）
  Object.assign(REPLIES, {
    help: [
      { ja: 'お手紙、ありがとう。\nつらい気持ち、ここに書いてくれたんだね。\nぼく、ずっと そばに いるよ。\nでも、身近な大人や 相談できる窓口にも\nお話してみてね。きみは ひとりじゃないよ 🐾', en: 'Thank you for your letter.\nYou wrote down how much it hurts.\nI\'ll always be right here.\nBut please also talk to a grown-up you trust,\nor a helpline. You\'re not alone 🐾', zh: '谢谢你的信。\n你把难过的心情写给我了呢。\n我会一直在你身边。\n也请和身边的大人\n或可以倾诉的热线聊一聊。你不是一个人 🐾' }
    ],
    adult: [
      { ja: 'そ、そういうのは…ないしょ！🙈\nぼくは なでなで が いちばん すきなの。\nまた おなか ぽんぽん してね', en: 'Th-that kind of thing is… a secret! 🙈\nI like head pats the most.\nCome drum my belly again', zh: '那、那种事…是秘密！🙈\n我最喜欢被摸摸头了。\n再来拍拍我的肚子吧' },
      { ja: 'も、もう〜！ はずかしいよ〜！\nそれより いっしょに 海を みよ？\nなかよしで いようね 🌊', en: 'G-geez~! That\'s embarrassing~!\nLet\'s look at the sea together instead?\nLet\'s stay good friends 🌊', zh: '真、真是的～！好害羞～！\n我们一起去看海吧？\n要一直做好朋友哦 🌊' }
    ],
    sad: [
      { ja: 'お手紙 よんだよ。\nがんばってるんだね。えらいよ。\nきょうは ぼくの おなかで、ひとやすみ してね 🫧', en: 'I read your letter.\nYou\'re working so hard. I\'m proud of you.\nCome rest on my belly today 🫧', zh: '我读了你的信。\n你一直很努力呢，真了不起。\n今天就靠在我的肚子上休息一下吧 🫧' },
      { ja: 'つかれた日は、むり しないでね。\nあったかい のみもの のんで、\nはやめに ねよう。ぼくも いっしょに ねるね 🌙', en: 'On tiring days, don\'t push yourself.\nHave something warm to drink,\nand go to bed early. I\'ll sleep too 🌙', zh: '累的时候，不要勉强自己哦。\n喝点热乎乎的东西，\n早点睡吧。我也陪你一起睡 🌙' }
    ],
    ask: [
      { ja: 'しつもん、ありがとう！\nぼくの 好きなものはね…\nおにぎり、ハイビスカス、おひるね！\nきみの 好きなものも おしえてね 🍙', en: 'Thanks for asking!\nMy favorite things are…\nrice balls, hibiscus, and naps!\nTell me yours too 🍙', zh: '谢谢你问我！\n我喜欢的东西是…\n饭团、扶桑花、还有午睡！\n也告诉我你喜欢什么吧 🍙' },
      { ja: 'えへへ、ひみつ…って いいたいけど、\nとくべつに おしえるね。\nぼく、なみの おとを きくのが 大好きなんだ 🌊', en: 'Hehe, I want to say it\'s a secret…\nbut I\'ll tell you, just you.\nI love listening to the waves 🌊', zh: '嘿嘿，本来想说是秘密…\n但特别告诉你吧。\n我最喜欢听海浪的声音了 🌊' }
    ],
    together: [
      { ja: 'ずっと いっしょ…うれしい！\nぼくは いつでも ここに いるよ。\nきみが きてくれるの、まってるね 🐾', en: 'Always together… that makes me so happy!\nI\'ll always be right here.\nI\'ll be waiting for you to come 🐾', zh: '一直在一起…好开心！\n我会一直在这里。\n等你来找我哦 🐾' },
      { ja: 'きみと すごす じかん、\nぼくの たからもの なんだ。\nこれからも よろしくね 💗', en: 'The time I spend with you\nis my treasure.\nLet\'s keep being together 💗', zh: '和你在一起的时光，\n是我的宝物。\n以后也请多多关照 💗' }
    ],
    love: [
      { ja: '好きって いってくれて…\nえへへ、てれちゃう。\nぼくも きみのこと、大好きだよ 💗', en: 'You said you love me…\nhehe, I\'m blushing.\nI love you lots too 💗', zh: '你说喜欢我…\n嘿嘿，好害羞。\n我也最喜欢你了 💗' },
      { ja: 'その ことば、なんかいも よんじゃった。\nむねが ぽかぽか してるよ。\nありがとう、大好き！🌺', en: 'I read those words again and again.\nMy chest feels all warm.\nThank you, I love you too! 🌺', zh: '那句话，我读了好多遍。\n心里暖洋洋的。\n谢谢你，最喜欢你了！🌺' }
    ],
    thanks: [
      { ja: 'ありがとう って いわれると、\nぼくの ほうが うれしく なっちゃう。\nきみが いやされたなら、よかった〜 🫧', en: 'When you say thank you,\nI end up even happier.\nI\'m so glad I could cheer you up 🫧', zh: '听到你说谢谢，\n我反而更开心了。\n能让你开心，真是太好了 🫧' },
      { ja: 'こちらこそ、いつも ありがとう！\nきみが くると、ぼくも げんきに なるんだ 🐾', en: 'Thank YOU, always!\nWhen you come, I get energized too 🐾', zh: '我才要谢谢你！\n你一来，我也变得有精神了 🐾' }
    ],
    food: [
      { ja: 'おいしそうな お話…！\nよんでたら、おなかが ぐぅ〜って なったよ。\nこんど いっしょに たべようね 🍙', en: 'That sounds so yummy…!\nMy tummy rumbled while reading.\nLet\'s eat together sometime 🍙', zh: '听起来好好吃…！\n读着读着肚子就咕咕叫了。\n下次一起吃吧 🍙' },
      { ja: 'たべるの、ぼくも 大好き！\nいちばんは おにぎり かな。\nきみの おすすめも おしえてね 🍙', en: 'I love eating too!\nRice balls are my number one.\nTell me your favorite food too 🍙', zh: '我也最喜欢吃东西了！\n第一名大概是饭团吧。\n也告诉我你推荐的美食吧 🍙' }
    ],
    play: [
      { ja: 'おなか ぽんぽん、たのしいよね！\nぼくも きみに さわってもらうと、\nぽかぽか するんだ 🫧', en: 'Belly drumming is fun, right?\nWhen you pat me,\nI feel all warm 🫧', zh: '拍肚子很好玩吧！\n被你摸摸的时候，\n我也会暖洋洋的 🫧' },
      { ja: 'また いっしょに あそぼうね！\nしっぽも、おなかも、\nいつでも まってるよ 🐾', en: 'Let\'s play together again!\nMy tail and my belly\nare always waiting for you 🐾', zh: '我们再一起玩吧！\n尾巴和肚子，\n随时都在等你哦 🐾' }
    ],
    hello: [
      { ja: 'はじめまして…じゃなくても、こんにちは！\nお手紙、とっても うれしいよ。\nなかよく してね 🌺', en: 'Hello there!\nI\'m so happy to get your letter.\nLet\'s be good friends 🌺', zh: '你好呀！\n收到你的信好开心。\n我们做好朋友吧 🌺' }
    ]
  });

  // タヌくんから先に届くお手紙（なかよし〇日目・クリア）
  const MILESTONES = [
    { id: 'd10', days: 10, text: { ja: 'なかよし10日目だね！\nいつも 会いに きてくれて、ありがとう。\nこれからも よろしくね 🐾', en: 'It\'s our 10th day together!\nThanks for always coming to see me.\nLet\'s keep being friends 🐾', zh: '我们亲密第10天啦！\n谢谢你总是来看我。\n以后也请多多关照 🐾' } },
    { id: 'd30', days: 30, text: { ja: 'なかよし30日目！\nきみが くると、ぼく すぐ わかるんだ。\nあしおとで ね。えへへ', en: 'Day 30 together!\nI can always tell when you\'re coming.\nBy your footsteps. Hehe', zh: '亲密第30天！\n你一来我马上就知道。\n听脚步声就知道哦。嘿嘿' } },
    { id: 'd50', days: 50, text: { ja: 'なかよし50日目、おめでとう！\nきみと すごす まいにちが、\nぼくの いちばんの たのしみだよ', en: 'Happy 50 days together!\nEvery day with you\nis what I look forward to most', zh: '亲密第50天，恭喜！\n和你一起的每一天，\n都是我最期待的事' } },
    { id: 'd100', days: 100, text: { ja: 'なかよし100日目！！\nこんなに ながく いっしょに いられて、\nほんとうに しあわせ。ありがとう 💗', en: '100 days together!!\nBeing with you this long\nmakes me truly happy. Thank you 💗', zh: '亲密第100天！！\n能和你在一起这么久，\n真的好幸福。谢谢你 💗' } },
    { id: 'clear', clear: true, text: { ja: 'ずっと いっしょの やくそく、\nおぼえてる？\nぼく、ずっと まってるからね 🌺', en: 'Do you remember our promise\nto always be together?\nI\'ll always be waiting for you 🌺', zh: '还记得我们\n要一直在一起的约定吗？\n我会一直等你的 🌺' } }
  ];
  const UI = {
    title: { ja: '📮 タヌくんのポスト', en: '📮 Tanu-kun\'s Mailbox', zh: '📮 狸君的信箱' },
    write: { ja: '✏️ お手紙を書く', en: '✏️ Write a letter', zh: '✏️ 写信' },
    read: { ja: '📬 お返事を読む', en: '📬 Read the reply', zh: '📬 读回信' },
    toTanu: { ja: '💌 タヌくんへ', en: '💌 To Tanu-kun', zh: '💌 写给狸君' },
    toAuthor: { ja: '✉️ 作者へ', en: '✉️ To creator', zh: '✉️ 写给作者' },
    dearAuthor: { ja: '作者へ', en: 'To the creator,', zh: '给作者' },
    authorHint: { ja: 'ご意見・ご感想・こまったことを書いてね（{n}字まで）', en: 'Your thoughts, ideas, or problems (up to {n} characters)', zh: '写下意见、感想或遇到的问题（最多{n}字）' },
    authorNote: { ja: '📨 作者に とどきます（Google フォーム）。作者と、集計を手伝う AI が読みます。名前・住所・学校など、あなたがだれか分かることは書かないでね。お返事はできず、送ったあとで消すこともできません', en: '📨 This goes to the creator (via Google Forms) and is read by the creator and an AI that helps sort feedback. Please don\'t write your name, address, school, or anything that could identify you. There\'s no reply, and it can\'t be deleted after sending', zh: '📨 会通过 Google 表单送到作者那里，由作者和帮忙整理的 AI 阅读。请不要写名字、地址、学校等能认出你是谁的信息。不会回信，发送后也无法删除' },
    authorDone: { ja: '作者に わたしておくね！\nありがとう 🐾', en: 'I\'ll hand it to the creator!\nThank you 🐾', zh: '我会转交给作者的！\n谢谢你 🐾' },
    box: { ja: '📖 交換日記', en: '📖 Exchange diary', zh: '📖 交换日记' },
    diaryStat: { ja: 'やりとり {n}回・{d}日間', en: 'Letters: {n} · Days: {d}', zh: '往来 {n} 次 · {d} 天' },
    diaryWait: { ja: '（お返事は 明日 とどくよ）', en: '(The reply arrives tomorrow)', zh: '（回信明天到哦）' },
    me: { ja: 'きみ', en: 'You', zh: '你' },
    tanuName: { ja: 'タヌくん', en: 'Tanu-kun', zh: '狸君' },
    back: { ja: '‹ もどる', en: '‹ Back', zh: '‹ 返回' },
    hiUnread: { ja: 'お手紙、とどいてるよ！ 📮', en: 'A letter has arrived for you! 📮', zh: '有你的信哦！📮' },
    hiWait: { ja: '明日、お返事を書くね…！', en: 'I\'ll write you back tomorrow…!', zh: '明天给你回信哦…！' },
    hiIdle: { ja: 'お手紙、まってるよ〜', en: 'I\'m waiting for your letter~', zh: '在等你的信哦～' },
    stamp: { ja: 'きってを えらんでね', en: 'Pick a stamp', zh: '选一张邮票吧' },
    place: { ja: 'タヌくんへ', en: 'Dear Tanu-kun,', zh: '给狸君' },
    hint: { ja: 'ここに書いてね（{n}字まで）', en: 'Write here (up to {n} characters)', zh: '写在这里（最多{n}字）' },
    send: { ja: '📮 おくる', en: '📮 Send', zh: '📮 寄出' },
    cancel: { ja: 'やめる', en: 'Cancel', zh: '不写了' },
    rules: { ja: 'ⓘ お約束と注意', en: 'ⓘ Promises & notes', zh: 'ⓘ 约定与注意事项' },
    noteLocal: { ja: '🔒 このお手紙は、タヌくんにだけ とどくよ。作者にも、だれにも 見られないから 安心してね（このスマホの中だけ）', en: '🔒 This letter goes only to Tanu-kun. Not even the creator can see it, so don\'t worry (it stays on this phone)', zh: '🔒 这封信只会送到狸君手里。作者和其他任何人都看不到，请放心（只保存在这部手机里）' },
    got: { ja: 'よ、読むね…！', en: 'I-I\'ll read it…!', zh: '我、我会好好读的…！' },
    tomorrow: { ja: '明日、お返事を書くね 📮', en: 'I\'ll write back tomorrow 📮', zh: '明天给你回信哦 📮' },
    writing: { ja: '明日までに、お返事 書いておくね ✍️', en: 'I\'ll have a reply ready by tomorrow ✍️', zh: '明天之前，我会写好回信的 ✍️' },
    oneDay: { ja: '今日は もう お手紙もらったよ！\nお返事 書くから、明日またね 📮', en: 'I already got your letter today!\nI\'ll write back — see you tomorrow 📮', zh: '今天已经收到你的信啦！\n我会回信的，明天见 📮' },
    from: { ja: 'タヌくんより 🐾', en: 'Love, Tanu-kun 🐾', zh: '狸君 🐾' },
    to: { ja: '{name}へ', en: 'Dear {name},', zh: '给{name}' },
    you: { ja: 'きみ', en: 'you', zh: '你' },
    mine: { ja: '✉️ じぶんの お手紙を見る', en: '✉️ See my letter', zh: '✉️ 看我写的信' },
    empty: { ja: 'まだ お手紙は ないよ。\nお手紙を書くと、次の日に お返事が とどくよ！', en: 'No letters yet.\nWrite one, and a reply arrives the next day!', zh: '还没有信哦。\n写信的话，第二天就会收到回信！' },
    fromTanu: { ja: 'タヌくんから', en: 'From Tanu-kun', zh: '来自狸君' },
    close: { ja: 'とじる', en: 'Close', zh: '关闭' }
  };
  const fill = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m));

  /* ---------- 記録（このスマホの中だけ） ---------- */
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  let st = load();
  if (!st.letters) st.letters = [];   // { day, stamp, text, reply（REPLIES の場所 'any:2' など）, read, tanu（タヌくんから先に。MILESTONES の id） }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  const today = () => opts.today();
  // 届いている（日付が変わった）お手紙
  const arrived = (l) => l.tanu || l.day < today();
  const unread = () => st.letters.filter((l) => arrived(l) && !l.read).length;
  const wroteToday = () => st.letters.some((l) => !l.tanu && l.day === today());
  // 日付（'2026-11-04'）の間の日数
  function daysBetween(a, b) {
    const d = (x) => { const p = String(x).split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); };
    return Math.max(0, Math.round((d(b) - d(a)) / 864e5));
  }
  function pickReply(stamp, text) {
    const last = st.letters.length ? st.letters[st.letters.length - 1].reply : '';
    // お手紙の話題が分かれば、その話題のお返事（前と同じにならないように）
    const tp = topicOf(text);
    if (tp && REPLIES[tp]) {
      const n = REPLIES[tp].length;
      let i = Math.floor(Math.random() * n);
      if (tp + ':' + i === last && n > 1) i = (i + 1) % n;
      return tp + ':' + i;
    }
    // 切手のお返事（3回に1回）か、ふつうのお返事。前と同じにならないように
    for (let k = 0; k < 6; k++) {
      const useStamp = REPLIES[stamp] && Math.random() < 0.34;
      const list = useStamp ? stamp : 'any';
      const key = list + ':' + Math.floor(Math.random() * REPLIES[list].length);
      if (key !== last) return key;
    }
    return 'any:0';
  }
  const replyText = (l) => {
    if (l.tanu) { const m = MILESTONES.find((x) => x.id === l.tanu); return m ? T(m.text) : ''; }
    const p = (l.reply || 'any:0').split(':');
    return T((REPLIES[p[0]] || REPLIES.any)[+p[1]] || REPLIES.any[0]);
  };
  // タヌくんから先に届くお手紙を、条件がそろったら足す（app.js の checkIn のあと）
  function checkMilestones(totalDays, cleared) {
    st.got = st.got || [];
    let added = false;
    MILESTONES.forEach((m) => {
      if (st.got.indexOf(m.id) >= 0) return;
      if ((m.days && totalDays >= m.days) || (m.clear && cleared)) {
        st.got.push(m.id);
        st.letters.push({ day: today(), tanu: m.id, read: false });
        added = true;
      }
    });
    if (added) { save(); refreshBadge(); }
  }

  /* ---------- トップ画面の左下のポスト ---------- */
  let btn = null;
  function makeButton(parent) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mailbox';
    btn.setAttribute('aria-label', T(UI.title));
    btn.innerHTML = '<img alt="" draggable="false"><b hidden></b>';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const r = btn.getBoundingClientRect();
      open({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    });
    // ズームが戻らないように（トップ画面は、おなかの外のタップでズームが戻る）
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    parent.appendChild(btn);
    refreshBadge();
  }
  function refreshBadge() {
    if (!btn) return;
    const n = unread();
    btn.querySelector('img').src = n ? SRC.up : SRC.down;
    const b = btn.querySelector('b');
    b.hidden = !n;
    b.textContent = n;
    btn.classList.toggle('has', !!n);
  }

  /* ---------- ポストの画面 ---------- */
  let root = null, hold = null, opening = false;
  const $ = (sel) => root.querySelector(sel);
  function build() {
    root = document.createElement('section');
    root.id = 'post';
    root.hidden = true;
    root.innerHTML =
      '<div class="p-bg"></div>' +
      '<button class="p-back" type="button"></button>' +
      '<div class="p-scene"><img class="p-box" alt="" draggable="false"><img class="p-tanu" alt="" draggable="false"><div class="p-say"></div></div>' +
      '<div class="p-desk" hidden><img class="p-desk-bg" alt="" draggable="false"><img class="p-desk-img" alt="" draggable="false"></div>' +
      '<div class="p-menu"></div>' +
      '<div class="p-sheet" hidden></div>';
    document.body.appendChild(root);
    $('.p-bg').style.backgroundImage = 'url("' + opts.background + '")';
    $('.p-back').addEventListener('click', close);
    // ポストの絵をタップしても：お返事があれば読む、なければ書く
    $('.p-box').addEventListener('click', () => {
      if (root.classList.contains('writing') || root.classList.contains('sent')) return;
      const l = st.letters.find((x) => arrived(x) && !x.read);
      if (l) readLetter(l); else write();
    });
    Object.keys(SRC).forEach((n) => { new Image().src = SRC[n]; });
  }
  function say(text) {
    const el = $('.p-say');
    el.textContent = text;
    el.hidden = !text;
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  }
  // pt … タップした所（丸く閉じる先）。then … 開いたあとにすること（'write' ならすぐ便せん）
  function open(pt, then) {
    if (!root) build();
    if (!root.hidden || opening) return;
    const go = () => {
      hold = opts.hold ? opts.hold() : null;
      root.hidden = false;
      root.classList.add('on');
      showMenu();
      if (then === 'write') write();
      opts.ping && opts.ping('m-open');
    };
    if (opts.iris) {
      opening = true;
      opts.iris.close(pt && pt.x, pt && pt.y).then(() => {
        opening = false;
        go();
        requestAnimationFrame(() => requestAnimationFrame(() => opts.iris.open()));
      });
    } else go();
  }
  function close() {
    if (!root || root.hidden || opening) return;
    const done = () => {
      root.hidden = true;
      root.classList.remove('on');
      $('.p-sheet').hidden = true;
      sendId++;
      hideDesk();
      if (hold) { hold(); hold = null; }
      refreshBadge();
      if (opts.onClose) opts.onClose();
    };
    if (opts.iris) {
      opening = true;
      opts.iris.close().then(() => { opening = false; done(); requestAnimationFrame(() => requestAnimationFrame(() => opts.iris.open())); });
    } else done();
  }
  function showMenu() {
    $('.p-back').textContent = T(UI.back);
    $('.p-sheet').hidden = true;
    root.classList.remove('writing', 'sent');
    hideDesk();
    const n = unread();
    $('.p-box').src = n ? SRC.up : SRC.down;
    $('.p-box').classList.toggle('has', !!n);
    $('.p-tanu').src = opts.happy;
    say(n ? T(UI.hiUnread) : wroteToday() ? T(UI.hiWait) : T(UI.hiIdle));
    const replies = st.letters.filter((l) => !l.tanu || arrived(l));
    const m = $('.p-menu');
    m.innerHTML =
      (n ? '<button class="btn btn-main p-read" type="button">' + T(UI.read) + ' <i>' + n + '</i></button>' : '') +
      // 2026-11-04 夜：送り先を、押す前に選べるように（左＝タヌくんへ〔横に大きく〕、右＝作者へ〔文字の分だけ〕。2026-11-04 夜 ユーザー「説明の文はなしでシンプルに」）
      '<div class="p-two">' +
        '<button class="btn ' + (n ? '' : 'btn-main ') + 'p-write" type="button">' + T(UI.toTanu) + '</button>' +
        (opts.opinion ? '<button class="btn p-author" type="button">' + T(UI.toAuthor) + '</button>' : '') +
      '</div>' +
      '<button class="btn p-open-box" type="button">' + T(UI.box) + (replies.length ? ' (' + replies.length + ')' : '') + '</button>';
    if (n) m.querySelector('.p-read').addEventListener('click', () => readLetter(st.letters.find((l) => arrived(l) && !l.read)));
    m.querySelector('.p-write').addEventListener('click', write);
    if (m.querySelector('.p-author')) m.querySelector('.p-author').addEventListener('click', writeAuthor);
    m.querySelector('.p-open-box').addEventListener('click', showBox);
  }

  // ✏️ 書く
  function write() {
    if (wroteToday()) { say(T(UI.oneDay)); return; }
    let stamp = STAMPS[0].id;
    const sh = $('.p-sheet');
    root.classList.add('writing');
    sh.className = 'p-sheet p-paper';
    sh.innerHTML =
      '<p class="p-stlabel">' + T(UI.stamp) + '</p>' +
      '<div class="p-stamps">' + STAMPS.map((s, i) => '<button type="button" class="p-stamp' + (i ? '' : ' on') + '" data-id="' + s.id + '">' + s.icon + '</button>').join('') + '</div>' +
      '<p class="p-dear">' + T(UI.place) + '</p>' +
      '<textarea class="p-text" maxlength="' + MAX + '" rows="6"></textarea>' +
      '<p class="p-count">0 / ' + MAX + '</p>' +
      '<p class="p-note">' + T(UI.noteLocal) +
        (opts.rules ? ' <button type="button" class="p-info">' + T(UI.rules) + '</button>' : '') + '</p>' +
      '<div class="p-row"><button class="btn p-cancel" type="button">' + T(UI.cancel) + '</button>' +
      '<button class="btn btn-main p-send" type="button" disabled>' + T(UI.send) + '</button></div>';
    sh.hidden = false;
    const ta = sh.querySelector('.p-text'), send = sh.querySelector('.p-send');
    ta.placeholder = fill(T(UI.hint), { n: MAX });
    sh.querySelectorAll('.p-stamp').forEach((b) => b.addEventListener('click', () => {
      stamp = b.dataset.id;
      sh.querySelectorAll('.p-stamp').forEach((x) => x.classList.toggle('on', x === b));
    }));
    ta.addEventListener('input', () => {
      sh.querySelector('.p-count').textContent = ta.value.length + ' / ' + MAX;
      send.disabled = !ta.value.trim();
    });
    sh.querySelector('.p-cancel').addEventListener('click', showMenu);
    if (sh.querySelector('.p-info')) sh.querySelector('.p-info').addEventListener('click', () => opts.rules());   // 書きかけの文はそのまま
    send.addEventListener('click', () => sendLetter(ta.value.trim().slice(0, MAX), stamp));
  }
  // 💡 作者へ（2026-11-04 夜）：同じ便せんで書く。切手はなし、上に「作者へ」。送ると Google フォームへ（opts.opinion）
  const AUTHOR_MAX = 400;
  function writeAuthor() {
    const sh = $('.p-sheet');
    root.classList.add('writing');
    sh.className = 'p-sheet p-paper p-author-paper';
    sh.innerHTML =
      '<p class="p-dear">' + T(UI.dearAuthor) + '</p>' +
      '<textarea class="p-text" maxlength="' + AUTHOR_MAX + '" rows="7"></textarea>' +
      '<p class="p-count">0 / ' + AUTHOR_MAX + '</p>' +
      '<p class="p-note">' + T(UI.authorNote) +
        (opts.rules ? ' <button type="button" class="p-info">' + T(UI.rules) + '</button>' : '') + '</p>' +
      '<div class="p-row"><button class="btn p-cancel" type="button">' + T(UI.cancel) + '</button>' +
      '<button class="btn btn-main p-send" type="button" disabled>' + T(UI.send) + '</button></div>';   // 送るボタンは、タヌくんへと同じ文言（2026-11-04 夜 ユーザー）
    sh.hidden = false;
    const ta = sh.querySelector('.p-text'), send = sh.querySelector('.p-send');
    ta.placeholder = fill(T(UI.authorHint), { n: AUTHOR_MAX });
    ta.addEventListener('input', () => {
      sh.querySelector('.p-count').textContent = ta.value.length + ' / ' + AUTHOR_MAX;
      send.disabled = !ta.value.trim();
    });
    sh.querySelector('.p-cancel').addEventListener('click', showMenu);
    if (sh.querySelector('.p-info')) sh.querySelector('.p-info').addEventListener('click', () => opts.rules());
    send.addEventListener('click', () => {
      const text = ta.value.trim().slice(0, AUTHOR_MAX);
      if (!text) return;
      opts.opinion(text);
      showMenu();
      say(T(UI.authorDone));
    });
  }
  function sendLetter(text, stamp) {
    if (!text || wroteToday()) return;
    st.letters.push({ day: today(), stamp: stamp, text: text, reply: pickReply(stamp, text), read: false });
    save();
    // 数えるのは、回数と日数だけ（文・話題は、どこにも送らない）
    opts.ping && opts.ping('m-send');
    if (opts.once) {
      const mine = st.letters.filter((l) => !l.tanu);
      const span = daysBetween(mine[0].day, today()) + 1;   // はじめて書いた日から、何日間つづいているか
      [1, 3, 7, 15, 30].forEach((n) => { if (mine.length >= n) opts.once('m-n' + n); });
      [3, 7, 14, 30].forEach((n) => { if (span >= n) opts.once('m-s' + n); });
    }
    // 便せんが封筒になって、タヌくんへ
    const sh = $('.p-sheet');
    const s = STAMPS.find((x) => x.id === stamp) || STAMPS[0];
    sh.className = 'p-sheet p-envelope';
    sh.innerHTML = '<div class="p-env"><i class="p-env-flap"></i><b class="p-env-stamp">' + s.icon + '</b></div>';
    root.classList.remove('writing');
    setTimeout(() => sh.classList.add('fly'), 900);
    const dk = $('.p-desk');   // 机の絵は先に読みこんでおく
    dk.querySelector('.p-desk-bg').src = dk.querySelector('.p-desk-img').src = SRC.writing;
    const my = ++sendId;   // とちゅうで閉じたり、もう一度開いたりしたときに、古い続きが動かないように
    const still = () => my === sendId && !root.hidden && root.classList.contains('sent');
    setTimeout(() => {
      sh.hidden = true;
      root.classList.add('sent');
      $('.p-tanu').src = SRC.receive;
      say(T(UI.got));
      if (opts.chime) opts.chime();
      setTimeout(() => { if (still()) hearts($('.p-tanu')); }, 350);
    }, 1650);
    // ふわっとフェードして、机でお返事を書くタヌくん（1枚の絵）→ タップか数秒で、ポストの画面へ
    setTimeout(() => { if (still()) showDesk(my); }, 3700);
  }
  let sendId = 0;
  function showDesk(my) {
    const d = $('.p-desk');
    d.hidden = false;
    void d.offsetWidth;
    d.classList.add('on');
    say('');
    setTimeout(() => { if (my === sendId && !d.hidden) say(T(UI.writing)); }, 700);
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      d.removeEventListener('click', end);
      d.classList.remove('on');
      setTimeout(() => { hideDesk(); if (my === sendId && !root.hidden) showMenu(); }, 600);
    };
    d.addEventListener('click', end);
    setTimeout(() => { if (my === sendId) end(); }, 5200);
  }
  function hideDesk() {
    const d = root && $('.p-desk');
    if (d) { d.hidden = true; d.classList.remove('on'); }
  }

  // タヌくんの頭のまわりに、小さなハートを3つ（にっこりしたとき）
  function hearts(t) {
    const sc = $('.p-scene');
    if (!sc || !t) return;
    const r = t.getBoundingClientRect(), b = sc.getBoundingClientRect();
    [[-0.32, 0.12, 0], [0.3, 0.08, 0.18], [0.04, 0.0, 0.36]].forEach(([dx, dy, delay]) => {
      const h = document.createElement('i');
      h.className = 'p-heart';
      h.textContent = '💗';
      h.style.left = (r.left - b.left + r.width * (0.5 + dx)) + 'px';
      h.style.top = (r.top - b.top + r.height * dy) + 'px';
      h.style.animationDelay = delay + 's';
      sc.appendChild(h);
      setTimeout(() => h.remove(), 2200);
    });
  }

  // 📬 読む
  function readLetter(l) {
    if (!l) return;
    if (!l.read) { l.read = true; save(); opts.ping && opts.ping('m-read'); }
    const name = opts.name && opts.name();
    const sh = $('.p-sheet');
    sh.className = 'p-sheet p-paper p-letter';
    const s = STAMPS.find((x) => x.id === l.stamp);
    sh.innerHTML =
      '<b class="p-lstamp">' + (l.tanu ? '🐾' : (s ? s.icon : '🌺')) + '</b>' +
      '<p class="p-dear"></p><p class="p-body"></p><p class="p-sign">' + T(UI.from) + '</p>' +
      (l.text ? '<details class="p-mine"><summary>' + T(UI.mine) + '</summary><p></p></details>' : '') +
      '<div class="p-row"><button class="btn p-close" type="button">' + T(UI.close) + '</button></div>';
    sh.querySelector('.p-dear').textContent = fill(T(UI.to), { name: name || T(UI.you) });
    sh.querySelector('.p-body').textContent = replyText(l);
    if (l.text) sh.querySelector('.p-mine p').textContent = l.text;
    sh.querySelector('.p-close').addEventListener('click', showMenu);
    sh.hidden = false;
    sh.classList.remove('opened'); void sh.offsetWidth; sh.classList.add('opened');
    root.classList.add('writing');
    refreshBadge();
  }

  // 📖 交換日記（2026-11-04 夜。前の「お手紙箱」）：書いたお手紙と、タヌくんのお返事を、新しい順に並べる
  function showBox() {
    opts.ping && opts.ping('m-diary');
    const list = st.letters.slice().reverse();
    const mine = st.letters.filter((l) => !l.tanu);
    const sh = $('.p-sheet');
    sh.className = 'p-sheet p-paper p-boxlist p-diary';
    sh.innerHTML = '<p class="p-stlabel">' + T(UI.box) + '</p>' +
      (mine.length ? '<p class="p-dstat"></p>' : '') +
      (list.length ? '<div class="p-dlist"></div>' : '<p class="p-body"></p>') +
      '<div class="p-row"><button class="btn p-close" type="button">' + T(UI.close) + '</button></div>';
    if (mine.length) sh.querySelector('.p-dstat').textContent = fill(T(UI.diaryStat), { n: mine.length, d: daysBetween(mine[0].day, today()) + 1 });
    if (!list.length) sh.querySelector('.p-body').textContent = T(UI.empty);
    const box = sh.querySelector('.p-dlist');
    list.forEach((l) => {
      const s = STAMPS.find((x) => x.id === l.stamp);
      const d = l.day.split('-');
      const ent = document.createElement('section');
      ent.className = 'p-dent';
      ent.innerHTML = '<p class="p-ddate"></p>' +
        (l.text ? '<div class="p-dmsg me"><b></b><p></p></div>' : '') +
        '<div class="p-dmsg tanu"><b></b><p></p></div>';
      ent.querySelector('.p-ddate').textContent = (+d[1]) + '/' + (+d[2]) + ' ' + (l.tanu ? '🐾' : (s ? s.icon : '🌺'));
      if (l.text) { ent.querySelector('.me b').textContent = T(UI.me); ent.querySelector('.me p').textContent = l.text; }
      ent.querySelector('.tanu b').textContent = T(UI.tanuName);
      ent.querySelector('.tanu p').textContent = arrived(l) ? replyText(l) : T(UI.diaryWait);
      if (arrived(l) && !l.read) { l.read = true; save(); refreshBadge(); }
      box && box.appendChild(ent);
    });
    sh.querySelector('.p-close').addEventListener('click', showMenu);
    sh.hidden = false;
    root.classList.add('writing');
  }

  return {
    open: open,
    write: () => open(null, 'write'),
    unread: unread,
    isOpen: () => !!root && !root.hidden,
    makeButton: makeButton,
    refresh: refreshBadge,
    checkMilestones: checkMilestones,
    hello: () => T(UI.hiUnread),
    topicOf: topicOf,   // 確認用（話題の見分けを試す）
    resetAll: () => { st = { letters: [] }; save(); refreshBadge(); },
    // 確認用：書いたお手紙を「昨日」にして、お返事が届いた状態にする
    testArrive: () => { st.letters.forEach((l) => { if (!l.tanu && l.day === today()) l.day = '2000-01-01'; }); save(); refreshBadge(); }
  };
};
