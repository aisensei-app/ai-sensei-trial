/* =========================================================
   タヌくん セリフ集
   1行が1つのセリフです。行を増やすだけでセリフが増えます。

   when（出す条件）に書ける項目：
     scene     … 場面   home（メニュー画面のあいさつ）/ named（呼び名を決めたとき）
                        / tap（タップ）/ melt（とろけ）/ angry（怒り）
                        / hiddenTap（隠れ中にタップ）/ return（戻ってくる）
     visit     … 来かた（home のときだけ）
                        first（はじめて）/ new（今日はじめて・前日も来た）
                        / comeback（2日以上あいて来た）/ again（今日2回目以降）
     place     … 場所   head（頭）/ belly（おなか）/ tail（しっぽ）
     mood      … 状態   normal（通常）/ shy（照れ）/ troubled（困り）
     timeOfDay … 時間帯 morning（5〜10時）/ day（11〜16時）
                        / evening（17〜19時）/ night（20〜4時）
     friendship … なかよし度（ハートの数 0〜5） 例 { min: 3 }
     streakDays … 連続日数                     例 { min: 3 }
     totalDays  … のべ日数（なかよし○日目）    例 { min: 7 }

   ・書かなかった項目は「どれでもOK」という意味です。
   ・複数を許すときは配列で： place: ['head', 'belly']
   ・{name} と書くと、そこが呼び名になります（例：'{name}、おかえり〜'）
     名前なしのときは「{name}、」ごと消えて「おかえり〜」になります。
   ・face を書くと、そのセリフのときだけ絵を変えられます（例：face: 'shy'）
   ・weight を書くと出やすさを変えられます（省略時 1、2 なら2倍出やすい）
   ========================================================= */
window.TANU_LINES = [

  /* ---------- 呼び名を決めたとき ---------- */
  { text: '{name}、よろしくね！',       when: { scene: 'named' }, face: 'shy' },

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
