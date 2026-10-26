/* =========================================================
   タヌくん セリフ集
   1行が1つのセリフです。行を増やすだけでセリフが増えます。

   when（出す条件）に書ける項目：
     scene     … 場面   home（メニュー画面のあいさつ）/ named（呼び名を決めたとき）
                        / tap（タップ）/ melt（とろけ）/ angry（怒り）
                        / hiddenTap（隠れ中にタップ）/ return（戻ってくる）
                        / wear（きせかえで部品を付けた・はずした）
                        / heartUp（ハートをゲットしたとき。friendship で何個目かを指定）
     part      … 付けた部品の id（wear のときだけ）。はずしたときは none
     stage     … おまたの反応（place: 'crotch' のときだけ）
                        warn（なかよしになる前の1回目。注意する）/ moji（モジモジ）
                        / dere（デレ）/ bulge（デレて、少しふくらんだ）
                        ※ なかよしになる前に続けてさわると怒る（scene: 'angry', place: 'crotch'）
     visit     … 来かた（home のときだけ）
                        first（はじめて）/ new（今日はじめて・前日も来た）
                        / comeback（2日以上あいて来た）/ again（今日2回目以降）
     place     … 場所   head（頭）/ chest（むね）/ belly（おなか）/ tail（しっぽ）
     mood      … 状態   normal（通常）/ shy（照れ）/ troubled（困り）
     timeOfDay … 時間帯 morning（5〜10時）/ day（11〜16時）
                        / evening（17〜19時）/ night（20〜4時）
     friendship … なかよし度（ハートの数 0〜5） 例 { min: 3 }
     streakDays … 連続日数                     例 { min: 3 }
     totalDays  … のべ日数（なかよし○日目）    例 { min: 7 }

   ・書かなかった項目は「どれでもOK」という意味です。
   ・複数を許すときは配列で： place: ['head', 'belly']
   ・{name} と書くと、そこが呼び名になります（例：'{name}、おかえり〜'）
     名前なしのときは、呼びかけ（「{name}、」「、{name}！」）は消えて「おかえり〜」に、
     文の途中（「{name}の手」など）は「きみ」になります（「きみの手」）。
   ・face を書くと、そのセリフのときだけ絵を変えられます（例：face: 'shy'）
   ・weight を書くと出やすさを変えられます（省略時 1、2 なら2倍出やすい）
   ========================================================= */
window.TANU_LINES = [

  /* ---------- 呼び名を決めたとき ---------- */
  { text: '{name}、よろしくね！',       when: { scene: 'named' }, face: 'shy' },

  /* ---------- きせかえ ---------- */
  { text: 'でっぱってるの、気になる…？', when: { scene: 'wear', part: 'debeso' }, face: 'shy' },
  { text: 'おへそ、ぽちっとしてみて！',   when: { scene: 'wear', part: 'debeso' } },
  { text: 'デベソ、にあう？',             when: { scene: 'wear', part: 'debeso' }, face: 'shy' },
  { text: 'もとにもどったよ〜',           when: { scene: 'wear', part: 'none' } },

  /* ---------- メニュー画面のあいさつ ----------
     名前入りのセリフは、なかよし度（ハート）が上がるほど出やすくなります */
  { text: 'はじめまして！タヌくんだよ', when: { scene: 'home', visit: 'first' } },
  { text: 'おはよ〜',                   when: { scene: 'home', visit: 'new', timeOfDay: 'morning' } },
  { text: 'こんにちは！',               when: { scene: 'home', visit: 'new', timeOfDay: 'day' } },
  { text: 'こんばんは〜',               when: { scene: 'home', visit: 'new', timeOfDay: 'evening' } },
  { text: '夜ふかし？いっしょにいるね', when: { scene: 'home', visit: 'new', timeOfDay: 'night' } },
  { text: '今日も来てくれた〜！',       when: { scene: 'home', visit: 'new' } },
  { text: '毎日来てくれて、うれしいな', when: { scene: 'home', visit: 'new', streakDays: { min: 3 } } },
  { text: 'きみといると、おちつくなあ', when: { scene: 'home', visit: 'new', friendship: { min: 3 } } },
  { text: 'おかえり〜！待ってたよ',     when: { scene: 'home', visit: 'comeback' }, face: 'shy' },
  { text: 'ひさしぶり！会いたかった',   when: { scene: 'home', visit: 'comeback' }, face: 'shy' },
  { text: '{name}、今日も来てくれた〜！', when: { scene: 'home', visit: 'new' } },
  { text: '{name}、まってたよ！',       when: { scene: 'home', visit: 'new', friendship: { min: 2 } }, weight: 2 },
  { text: '{name}に会えると、元気でるなあ', when: { scene: 'home', visit: 'new', friendship: { min: 4 } }, weight: 3 },
  { text: '{name}、おかえり〜！待ってたよ', when: { scene: 'home', visit: 'comeback', friendship: { min: 2 } }, face: 'shy', weight: 2 },
  { text: 'また来てくれたの？',         when: { scene: 'home', visit: 'again' } },
  { text: 'おかえり、{name}！',         when: { scene: 'home', visit: 'again', friendship: { min: 2 } }, weight: 2 },
  { text: 'なにしてあそぶ？',           when: { scene: 'home', visit: 'again' } },
  { text: 'ふぁ〜あ…',                  when: { scene: 'home', visit: 'again', timeOfDay: 'night' } },

  /* ---------- 頭 ---------- */
  { text: 'なでなで、うれしいな', when: { scene: 'tap', place: 'head', mood: 'normal' } },
  { text: 'えへへ',               when: { scene: 'tap', place: 'head', mood: 'normal' } },
  { text: 'あたま、ぽかぽか〜',   when: { scene: 'tap', place: 'head', mood: 'normal' } },
  { text: '{name}になでられるの、すき', when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 3 } }, weight: 2 },
  { text: 'て、照れるなあ…',      when: { scene: 'tap', place: 'head', mood: 'shy' } },
  { text: 'そんなになでたら…',    when: { scene: 'tap', place: 'head', mood: 'shy' } },
  { text: 'もう〜！',             when: { scene: 'tap', place: 'head', mood: 'troubled' } },
  { text: 'なですぎだよ〜',       when: { scene: 'tap', place: 'head', mood: 'troubled' } },

  /* ---------- むね ---------- */
  { text: 'むね、ぶあついでしょ',   when: { scene: 'tap', place: 'chest', mood: 'normal' } },
  { text: 'きたえてるんだ〜',       when: { scene: 'tap', place: 'chest', mood: 'normal' } },
  { text: 'ぷるんってした？',       when: { scene: 'tap', place: 'chest', mood: 'normal' } },
  { text: 'ドキドキしてるの、ばれちゃう…', when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 3 } }, face: 'shy', weight: 2 },
  { text: 'そ、そこは…',           when: { scene: 'tap', place: 'chest', mood: 'shy' } },
  { text: 'むねは、はずかしいよ…', when: { scene: 'tap', place: 'chest', mood: 'shy' } },
  { text: 'もう〜！',               when: { scene: 'tap', place: 'chest', mood: 'troubled' } },
  { text: 'むねばっかり〜！',       when: { scene: 'tap', place: 'chest', mood: 'troubled' } },

  /* ---------- おなか ---------- */
  { text: 'ぽよん！',             when: { scene: 'tap', place: 'belly', mood: 'normal' } },
  { text: 'ぽんぽこ♪',            when: { scene: 'tap', place: 'belly', mood: 'normal' }, weight: 2 },
  { text: 'いい音するでしょ〜',   when: { scene: 'tap', place: 'belly', mood: 'normal' } },
  { text: 'おなか、やわらかいでしょ', when: { scene: 'tap', place: 'belly', mood: 'normal' } },
  { text: 'くすぐったい〜',       when: { scene: 'tap', place: 'belly', mood: 'normal' } },
  { text: '{name}も、ぽんぽこしてみる？', when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 3 } }, weight: 2 },
  { text: 'さっき、おやつ食べたんだ', when: { scene: 'tap', place: 'belly', mood: 'normal', timeOfDay: 'day' } },
  { text: 'おなか、すいたなあ',   when: { scene: 'tap', place: 'belly', mood: 'normal', timeOfDay: ['morning', 'evening'] } },
  { text: 'あんまり見ないで…',    when: { scene: 'tap', place: 'belly', mood: 'shy' } },
  { text: 'ぷにぷにしないで〜',   when: { scene: 'tap', place: 'belly', mood: 'shy' } },
  { text: 'むにむにされると…照れる',   when: { scene: 'tap', place: 'belly', mood: 'shy' } },
  { text: 'もう〜！',             when: { scene: 'tap', place: 'belly', mood: 'troubled' } },
  { text: 'おなかは大事なの！',   when: { scene: 'tap', place: 'belly', mood: 'troubled' } },

  /* ---------- しっぽ ---------- */
  { text: 'しっぽ、ふわふわでしょ', when: { scene: 'tap', place: 'tail', mood: 'normal' } },
  { text: 'ふりふり♪',            when: { scene: 'tap', place: 'tail', mood: 'normal' } },
  { text: '{name}だけ、とくべつだよ', when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 4 } }, weight: 2 },
  { text: 'ひゃっ、しっぽは…',    when: { scene: 'tap', place: 'tail', mood: 'shy' } },
  { text: 'くすぐったいってば',   when: { scene: 'tap', place: 'tail', mood: 'shy' } },
  { text: 'もう〜！',             when: { scene: 'tap', place: 'tail', mood: 'troubled' } },
  { text: 'しっぽ、引っぱらないで〜', when: { scene: 'tap', place: 'tail', mood: 'troubled' } },

  /* ---------- なかよし度で深まるセリフ（ハート2〜3：だんだん慣れてくる／ハート4〜5：甘えん坊） ---------- */
  // 頭
  { text: 'なでなで、クセになってきたかも…',   when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '{name}のなで方、おぼえちゃった',    when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'もうちょっとだけ…なでて？',         when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 2, max: 3 } }, face: 'shy', weight: 2 },
  { text: '頭なでられると、ぽかぽかする〜',    when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '{name}の手じゃないと、もうダメかも', when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 4 } }, face: 'shy', weight: 3 },
  { text: 'ずっとなでてて…ね？',               when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 4 } }, face: 'melt', weight: 3 },
  { text: 'なでられると、しあわせ〜',          when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 4 } }, face: 'happy', weight: 3 },
  { text: '{name}になでてほしくて、毛づくろいしてきたよ', when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  // むね
  { text: '…ちょっとだけなら、いいよ',         when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 2, max: 3 } }, face: 'shy', weight: 2 },
  { text: 'むね、ドキドキいってない…？',       when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'かたいでしょ？…え、やわらかい？',   when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'くすぐったいけど…いやじゃない',     when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '{name}の手、あったかい…',           when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 4 } }, face: 'shy', weight: 3 },
  { text: 'ドキドキしてるの、{name}のせいだからね', when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 4 } }, face: 'dere', weight: 3 },
  { text: 'ぎゅってしてもいいよ…？',           when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 4 } }, face: 'dere', weight: 3 },
  { text: '{name}の手、おちつく〜',            when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  // おなか
  { text: '今日もいい音、なってる？',          when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'おなか、ぽんぽこするの好きでしょ〜', when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'たくさん食べたから、よく鳴るよ♪',   when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'ぽんぽこ、ぽんぽこ♪ リズムいいね！', when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '{name}専用の太鼓だよ〜♪',           when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  { text: '{name}にぽんぽこされるの、いちばん好き', when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  { text: 'おなか、{name}の手の形になっちゃうよ〜', when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  { text: 'いっしょにぽんぽこ、しよ？',        when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  // しっぽ
  { text: 'しっぽ、勝手に動いちゃう…',         when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'ふわふわ、気に入った？',            when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'しっぽは、なかよしの人にしかさわらせないんだよ', when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'ブラッシングしてくれたら、もっとふわふわになるかも', when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'うれしいと、しっぽ止まんないの',    when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  { text: '{name}がいると、しっぽがずっとふりふり♪', when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  { text: 'しっぽ、まくらにしてもいいよ？',    when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 4 } }, face: 'happy', weight: 3 },
  { text: '{name}にだけ、さわらせてあげる',    when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 4 } }, face: 'shy', weight: 3 },

  /* ---------- ハートをゲットしたとき（何個目か＝friendship） ---------- */
  { text: '{name}、これからよろしくね！',      when: { scene: 'heartUp', friendship: { min: 1, max: 1 } }, face: 'happy' },
  { text: 'きみのこと、ちょっと気になってきた…', when: { scene: 'heartUp', friendship: { min: 1, max: 1 } }, face: 'shy' },
  { text: '{name}といると、たのしいな〜',      when: { scene: 'heartUp', friendship: { min: 2, max: 2 } }, face: 'happy' },
  { text: 'また明日も来てくれる？',            when: { scene: 'heartUp', friendship: { min: 2, max: 2 } }, face: 'shy' },
  { text: 'もう、{name}がいないとさみしいかも…', when: { scene: 'heartUp', friendship: { min: 3, max: 3 } }, face: 'shy' },
  { text: '{name}のこと、もっと知りたいな',    when: { scene: 'heartUp', friendship: { min: 3, max: 3 } }, face: 'shy' },
  { text: '{name}は、とくべつな人だよ',        when: { scene: 'heartUp', friendship: { min: 4, max: 4 } }, face: 'dere' },
  { text: 'ずっと、ここにいてくれる…？',       when: { scene: 'heartUp', friendship: { min: 4, max: 4 } }, face: 'dere' },
  { text: '{name}のこと、だいすき！',          when: { scene: 'heartUp', friendship: { min: 5 } }, face: 'dere2' },
  { text: 'これからも、ずっと一緒にいてね',    when: { scene: 'heartUp', friendship: { min: 5 } }, face: 'dere2' },

  /* ---------- 記念日・連続のあいさつ（その日だけ、優先して出る） ---------- */
  { text: 'また来てくれた！2日目だね',         when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 2, max: 2 } }, face: 'happy', weight: 30 },
  { text: '3日も来てくれた！うれしいな',       when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 3, max: 3 } }, face: 'happy', weight: 30 },
  { text: '1週間記念だね！{name}、ありがとう', when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 7, max: 7 } }, face: 'happy', weight: 30 },
  { text: '2週間…！もう親友だね',              when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 14, max: 14 } }, face: 'happy', weight: 30 },
  { text: '1か月記念！これからも、ずっとね',   when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 30, max: 30 } }, face: 'happy', weight: 30 },
  { text: '50日目！{name}といると、毎日たのしいよ', when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 50, max: 50 } }, face: 'happy', weight: 30 },
  { text: '100日…！ほんとうに、ありがとう',    when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 100, max: 100 } }, face: 'shy', weight: 30 },
  { text: '3日連続！えらいえらい〜',           when: { scene: 'home', visit: 'new', streakDays: { min: 3, max: 3 } }, weight: 20 },
  { text: '毎日来てくれるの、知ってるんだからね〜♪', when: { scene: 'home', visit: 'new', streakDays: { min: 7, max: 7 } }, weight: 20 },
  { text: '2週間毎日…{name}、だいすき',        when: { scene: 'home', visit: 'new', streakDays: { min: 14, max: 14 } }, face: 'shy', weight: 20 },

  /* ---------- 時間帯・ひさしぶり ---------- */
  { text: 'おはよ…まだ半分ねてる〜',          when: { scene: 'home', visit: 'new', timeOfDay: 'morning' }, face: 'melt' },
  { text: '朝から会えるなんて、いい日になりそう！', when: { scene: 'home', visit: 'new', timeOfDay: 'morning' } },
  { text: 'お昼休み？ちょっと休んでいってね',  when: { scene: 'home', visit: ['new', 'again'], timeOfDay: 'day' } },
  { text: 'おつかれさま〜！今日もがんばったね', when: { scene: 'home', visit: ['new', 'again'], timeOfDay: 'evening' } },
  { text: 'ねむいけど、{name}が来たから起きてる…', when: { scene: 'home', visit: ['new', 'again'], timeOfDay: 'night' }, face: 'melt' },
  { text: '夜ふかしさん、いらっしゃい',        when: { scene: 'home', visit: ['new', 'again'], timeOfDay: 'night' } },
  { text: '…さみしかったんだからね！',         when: { scene: 'home', visit: 'comeback' }, face: 'shy', weight: 2 },
  { text: '{name}、どこ行ってたの〜！待ってたんだよ', when: { scene: 'home', visit: 'comeback', friendship: { min: 3 } }, face: 'troubled', weight: 2 },

  /* ---------- おまた（なかよし度で反応が変わる） ---------- */
  // 注意（ハート0〜1の1回目。もう一度さわると怒る）
  { text: 'ちょっと！次さわったら怒るからね！', when: { scene: 'tap', place: 'crotch', stage: 'warn' } },
  { text: 'こらっ！そこはダメ！…次は怒るよ',  when: { scene: 'tap', place: 'crotch', stage: 'warn' } },
  { text: 'ど、どこさわってるの！？もうダメだからね！', when: { scene: 'tap', place: 'crotch', stage: 'warn' } },
  { text: '{name}でも、そこはまだダメ！',      when: { scene: 'tap', place: 'crotch', stage: 'warn' } },
  // モジモジ（ハート2〜3）
  { text: 'そ、そこは…まだダメ…',       when: { scene: 'tap', place: 'crotch', stage: 'moji' } },
  { text: 'も、もじもじ…',               when: { scene: 'tap', place: 'crotch', stage: 'moji' } },
  { text: 'は、はずかしいってば…',       when: { scene: 'tap', place: 'crotch', stage: 'moji' } },
  { text: 'うぅ…どこさわってるの…',     when: { scene: 'tap', place: 'crotch', stage: 'moji', mood: ['shy', 'troubled'] } },
  { text: 'これ以上は、怒るからね…！',   when: { scene: 'tap', place: 'crotch', stage: 'moji', mood: 'troubled' }, weight: 2 },
  // デレ（ハート4〜）
  { text: '{name}だけ、とくべつだよ…',  when: { scene: 'tap', place: 'crotch', stage: ['dere', 'bulge'] }, weight: 2 },
  { text: 'えへへ…くすぐったい',         when: { scene: 'tap', place: 'crotch', stage: ['dere', 'bulge'] } },
  { text: 'もう…しょうがないなぁ',       when: { scene: 'tap', place: 'crotch', stage: ['dere', 'bulge'] } },
  { text: '{name}になら、いいよ…？',     when: { scene: 'tap', place: 'crotch', stage: ['dere', 'bulge'] } },
  // デレて、少しふくらんだ（ハート最大）
  { text: 'あっ…み、見ないで…！',       when: { scene: 'tap', place: 'crotch', stage: 'bulge' }, weight: 2 },
  { text: 'な、なんでもないから…！',     when: { scene: 'tap', place: 'crotch', stage: 'bulge' }, weight: 2 },
  { text: '{name}のせいだからね…',       when: { scene: 'tap', place: 'crotch', stage: 'bulge' } },

  /* ---------- 頭を続けてなでる（とろけ） ---------- */
  { text: 'ふにゃ〜…',            when: { scene: 'melt' } },
  { text: 'とろけちゃう〜',       when: { scene: 'melt' } },
  { text: 'もっと〜…',            when: { scene: 'melt' } },
  { text: '{name}の手、あったかい…', when: { scene: 'melt', friendship: { min: 2 } } },
  { text: 'ねむくなってきた…',    when: { scene: 'melt', timeOfDay: 'night' } },

  /* ---------- 怒る ---------- */
  { text: 'もう知らないっ！',     when: { scene: 'angry' } },
  { text: 'さわりすぎー！',       when: { scene: 'angry' } },
  { text: 'ぷんぷん！',           when: { scene: 'angry' } },
  // おまたをさわって怒った（なかよしになる前）
  { text: 'ど、どこさわってるの！',   when: { scene: 'angry', place: 'crotch' }, weight: 4 },
  { text: 'へんたーい！',             when: { scene: 'angry', place: 'crotch' }, weight: 4 },
  { text: 'そこはダメーっ！',         when: { scene: 'angry', place: 'crotch' }, weight: 4 },

  /* ---------- 隠れている間にタップ ---------- */
  { text: 'いないよ！',           when: { scene: 'hiddenTap' }, weight: 3 },
  { text: 'いないってば！',       when: { scene: 'hiddenTap' } },

  /* ---------- 戻ってくる ---------- */
  { text: 'ちょっとだけ、ゆるしてあげる', when: { scene: 'return' }, face: 'shy' },
  { text: 'べ、べつに待ってないし…',    when: { scene: 'return' }, face: 'shy' },
  { text: '…もうしない？',              when: { scene: 'return' }, face: 'angry' },
  { text: 'まだちょっと怒ってるからね',  when: { scene: 'return' }, face: 'angry' },
  { text: 'ただいま〜',                  when: { scene: 'return' }, face: 'normal' }
];
