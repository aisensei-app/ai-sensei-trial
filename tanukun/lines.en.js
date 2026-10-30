/* =========================================================
   タヌくん 英語のセリフ集（tools/make_lines_en.py で lines.js と tools/lines_en.json からつくる。
   ここを直接書きかえず、lines_en.json を直してから作り直してください）
   ========================================================= */
(window.TANU_LINES_I18N = window.TANU_LINES_I18N || {}).en = [

  /* ---------- 呼び名を決めたとき ---------- */
  { text: 'Nice to meet you, {name}!',       when: { scene: 'named' }, face: 'shy' },

  /* ---------- きせかえ ---------- */
  { text: 'Does my outie bother you…?', when: { scene: 'wear', part: 'debeso' }, face: 'shy' },
  { text: 'Go on, give my belly button a poke!',   when: { scene: 'wear', part: 'debeso' } },
  { text: 'Does the outie suit me?',             when: { scene: 'wear', part: 'debeso' }, face: 'shy' },
  { text: 'Back to normal~',           when: { scene: 'wear', part: 'none' } },

  /* ---------- メニュー画面のあいさつ ----------
     名前入りのセリフは、なかよし度（ハート）が上がるほど出やすくなります */
  { text: 'Hi there! I\'m Tanu-kun!', when: { scene: 'home', visit: 'first' } },
  { text: 'Mornin\'~',                   when: { scene: 'home', visit: 'new', timeOfDay: 'morning' } },
  { text: 'Hello!',               when: { scene: 'home', visit: 'new', timeOfDay: 'day' } },
  { text: 'Good evening~',               when: { scene: 'home', visit: 'new', timeOfDay: 'evening' } },
  { text: 'Staying up late? I\'ll keep you company', when: { scene: 'home', visit: 'new', timeOfDay: 'night' } },
  { text: 'You came again today~!',       when: { scene: 'home', visit: 'new' } },
  { text: 'You come every day… that makes me so happy', when: { scene: 'home', visit: 'new', streakDays: { min: 3 } } },
  { text: 'I feel so calm when I\'m with you', when: { scene: 'home', visit: 'new', friendship: { min: 3 } } },
  { text: 'Welcome back~! I was waiting for you',     when: { scene: 'home', visit: 'comeback' }, face: 'shy' },
  { text: 'It\'s been a while! I missed you',   when: { scene: 'home', visit: 'comeback' }, face: 'shy' },
  { text: '{name}, you came again today~!', when: { scene: 'home', visit: 'new' } },
  { text: 'I was waiting for you, {name}!',       when: { scene: 'home', visit: 'new', friendship: { min: 2 } }, weight: 2 },
  { text: 'Seeing {name} always cheers me up', when: { scene: 'home', visit: 'new', friendship: { min: 4 } }, weight: 3 },
  { text: 'Welcome back, {name}~! I was waiting for you', when: { scene: 'home', visit: 'comeback', friendship: { min: 2 } }, face: 'shy', weight: 2 },
  // again … 今日2回目以降に開いたとき・遊ぶ画面からメニューに戻ったとき（何回目でも不自然にならない言葉に）
  { text: 'What should we play?',           when: { scene: 'home', visit: 'again' } },
  { text: 'Ehehe, let\'s stay together', when: { scene: 'home', visit: 'again' } },
  { text: 'Fwaa~… let\'s just take it easy',    when: { scene: 'home', visit: 'again' } },
  { text: 'What\'s next, {name}?',   when: { scene: 'home', visit: 'again', friendship: { min: 2 } }, weight: 2 },
  { text: 'What should we play?',           when: { scene: 'home', visit: 'again' } },
  { text: 'Yaaawn…',                  when: { scene: 'home', visit: 'again', timeOfDay: 'night' } },

  /* ---------- 頭 ---------- */
  { text: 'Head pats make me happy', when: { scene: 'tap', place: 'head', mood: 'normal' } },
  { text: 'Ehehe',               when: { scene: 'tap', place: 'head', mood: 'normal' } },
  { text: 'My head feels all warm~',   when: { scene: 'tap', place: 'head', mood: 'normal' } },
  { text: 'I love it when {name} pats me', when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 3 } }, weight: 2 },
  { text: 'Th-that\'s embarrassing…',      when: { scene: 'tap', place: 'head', mood: 'shy' } },
  { text: 'If you pat me that much…',    when: { scene: 'tap', place: 'head', mood: 'shy' } },
  { text: 'Geez~!',             when: { scene: 'tap', place: 'head', mood: 'troubled' } },
  { text: 'Too many pats~',       when: { scene: 'tap', place: 'head', mood: 'troubled' } },

  /* ---------- むね ---------- */
  { text: 'Pretty thick chest, huh?',   when: { scene: 'tap', place: 'chest', mood: 'normal' } },
  { text: 'I\'ve been working out~',       when: { scene: 'tap', place: 'chest', mood: 'normal' } },
  { text: 'Did it go boing?',       when: { scene: 'tap', place: 'chest', mood: 'normal' } },
  { text: 'You\'ll hear my heart pounding…', when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 3 } }, face: 'shy', weight: 2 },
  { text: 'Th-that\'s…',           when: { scene: 'tap', place: 'chest', mood: 'shy' } },
  { text: 'My chest is embarrassing…', when: { scene: 'tap', place: 'chest', mood: 'shy' } },
  { text: 'Geez~!',               when: { scene: 'tap', place: 'chest', mood: 'troubled' } },
  { text: 'Always the chest~!',       when: { scene: 'tap', place: 'chest', mood: 'troubled' } },

  /* ---------- おなか ---------- */
  { text: 'Boing!',             when: { scene: 'tap', place: 'belly', mood: 'normal' } },
  { text: 'Ponpoko♪',            when: { scene: 'tap', place: 'belly', mood: 'normal' }, weight: 2 },
  { text: 'Nice sound, right~?',   when: { scene: 'tap', place: 'belly', mood: 'normal' } },
  { text: 'My belly\'s soft, isn\'t it?', when: { scene: 'tap', place: 'belly', mood: 'normal' } },
  { text: 'That tickles~',       when: { scene: 'tap', place: 'belly', mood: 'normal' } },
  { text: 'Wanna drum on it too, {name}?', when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 3 } }, weight: 2 },
  { text: 'I just had a snack', when: { scene: 'tap', place: 'belly', mood: 'normal', timeOfDay: 'day' } },
  { text: 'I\'m getting hungry…',   when: { scene: 'tap', place: 'belly', mood: 'normal', timeOfDay: ['morning', 'evening'] } },
  { text: 'Don\'t stare so much…',    when: { scene: 'tap', place: 'belly', mood: 'shy' } },
  { text: 'Stop squishing me~',   when: { scene: 'tap', place: 'belly', mood: 'shy' } },
  { text: 'All that squishing… is embarrassing',   when: { scene: 'tap', place: 'belly', mood: 'shy' } },
  { text: 'Geez~!',             when: { scene: 'tap', place: 'belly', mood: 'troubled' } },
  { text: 'My belly is precious!',   when: { scene: 'tap', place: 'belly', mood: 'troubled' } },

  /* ---------- しっぽ ---------- */
  /* ---------- しっぽをはじいたとき（公開スイッチ tailFlick が open のときだけ出る） ---------- */
  { text: 'My tail went *wobble wobble*~',      when: { scene: 'flick', mood: 'normal' }, feature: 'tailFlick' },
  { text: 'Boiiing♪',                        when: { scene: 'flick', mood: 'normal' }, feature: 'tailFlick' },
  { text: '{name}, are you playing with my tail?',         when: { scene: 'flick', mood: 'normal' }, feature: 'tailFlick' },
  { text: 'My tail doesn\'t stretch, y\'know~',           when: { scene: 'flick', mood: 'normal' }, feature: 'tailFlick', face: 'shy' },
  { text: 'Don\'t pull my tail~',           when: { scene: 'flick', mood: ['shy', 'troubled'] }, feature: 'tailFlick', face: 'troubled' },
  { text: 'Swaying… I\'m getting dizzy~',             when: { scene: 'flick', mood: ['shy', 'troubled'] }, feature: 'tailFlick', face: 'shy' },
  { text: 'Eek!? My tail just went all poofy!', when: { scene: 'flickBig' }, feature: 'tailFlick', face: 'troubled' },
  { text: 'Y-you startled me~…',               when: { scene: 'flickBig' }, feature: 'tailFlick', face: 'shy' },
  { text: 'Geez~! My fur\'s standing on end',    when: { scene: 'flickBig' }, feature: 'tailFlick', face: 'troubled' },
  { text: '{name}, you little rascal~',             when: { scene: 'flickBig', friendship: { min: 3 } }, feature: 'tailFlick', face: 'shy', weight: 2 },
  { text: 'My tail\'s fluffy, right?', when: { scene: 'tap', place: 'tail', mood: 'normal' } },
  { text: 'Wag wag♪',            when: { scene: 'tap', place: 'tail', mood: 'normal' } },
  { text: 'Only {name} gets to, okay?', when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 4 } }, weight: 2 },
  { text: 'Eep, not my tail…',    when: { scene: 'tap', place: 'tail', mood: 'shy' } },
  { text: 'I said it tickles!',   when: { scene: 'tap', place: 'tail', mood: 'shy' } },
  { text: 'Geez~!',             when: { scene: 'tap', place: 'tail', mood: 'troubled' } },
  { text: 'Don\'t tug my tail~', when: { scene: 'tap', place: 'tail', mood: 'troubled' } },

  /* ---------- おなかを引っぱって、はなしたとき ---------- */
  { text: 'It stretched all the way out~!',          when: { scene: 'pull', mood: 'normal' } },
  { text: 'My belly\'s just like mochi, huh?',        when: { scene: 'pull', mood: 'normal' } },
  { text: 'No pulling~',              when: { scene: 'pull', mood: 'normal' }, face: 'shy' },
  { text: 'It bounced right back♪',               when: { scene: 'pull', mood: 'normal' } },
  { text: 'Stretchy, stretchy~',                  when: { scene: 'pull', mood: ['shy', 'troubled'] }, face: 'troubled' },
  { text: '{name}, you\'re stretching it too much~!',            when: { scene: 'pull', mood: ['shy', 'troubled'] }, face: 'shy' },
  { text: 'For {name}, you can stretch it all you want', when: { scene: 'pull', mood: 'normal', friendship: { min: 4 } }, weight: 2 },

  /* ---------- なかよし度で深まるセリフ（ハート2〜3：だんだん慣れてくる／ハート4〜5：甘えん坊） ---------- */
  // 頭
  { text: 'I think I\'m getting hooked on head pats…',   when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'I know exactly how {name} pats me now',    when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'Just a little more… pat me?',         when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 2, max: 3 } }, face: 'shy', weight: 2 },
  { text: 'Head pats make me feel all warm~',    when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'I think only {name}\'s hands will do now', when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 4 } }, face: 'shy', weight: 3 },
  { text: 'Keep patting me forever… okay?',               when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 4 } }, face: 'melt', weight: 3 },
  { text: 'Pats make me so happy~',          when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 4 } }, face: 'happy', weight: 3 },
  { text: 'I groomed my fur just so {name} would pat me', when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  // むね
  { text: '…Just a little is okay',         when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 2, max: 3 } }, face: 'shy', weight: 2 },
  { text: 'Can you hear my heart thumping…?',       when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'Firm, right? …Wait, you think it\'s soft?',   when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'It tickles… but I don\'t mind',     when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '{name}\'s hands are so warm…',           when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 4 } }, face: 'shy', weight: 3 },
  { text: 'My heart\'s racing, and it\'s {name}\'s fault', when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 4 } }, face: 'dere', weight: 3 },
  { text: 'You can hug me if you want…?',           when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 4 } }, face: 'dere', weight: 3 },
  { text: '{name}\'s hands are so soothing~',            when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  // おなか
  { text: 'Is it making a good sound today?',          when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'You love drumming on my belly, don\'t you~', when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'I ate a lot, so it sounds extra good♪',   when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'Ponpoko, ponpoko♪ Nice rhythm!', when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'It\'s {name}\'s very own drum~♪',           when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  { text: 'I love it most when {name} drums on me', when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  { text: 'My belly\'s gonna take the shape of {name}\'s hand~', when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  { text: 'Let\'s go ponpoko together?',        when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  // しっぽ
  { text: 'My tail moves all on its own…',         when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'Do you like the fluff?',            when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'Only close friends get to touch my tail', when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'If you brush it, it might get even fluffier', when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: 'When I\'m happy, my tail won\'t stop',    when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  { text: 'When {name}\'s here, my tail keeps wagging♪', when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  { text: 'You can use my tail as a pillow, y\'know?',    when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 4 } }, face: 'happy', weight: 3 },
  { text: 'I\'ll let only {name} touch it',    when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 4 } }, face: 'shy', weight: 3 },

  /* ---------- ハートをゲットしたとき（何個目か＝friendship） ---------- */
  { text: 'Let\'s be friends, {name}!',      when: { scene: 'heartUp', friendship: { min: 1, max: 1 } }, face: 'happy' },
  { text: 'I\'m starting to think about you a lot…', when: { scene: 'heartUp', friendship: { min: 1, max: 1 } }, face: 'shy' },
  { text: 'It\'s so fun being with {name}~',      when: { scene: 'heartUp', friendship: { min: 2, max: 2 } }, face: 'happy' },
  { text: 'Will you come again tomorrow?',            when: { scene: 'heartUp', friendship: { min: 2, max: 2 } }, face: 'shy' },
  { text: 'I think I\'d be lonely without {name} now…', when: { scene: 'heartUp', friendship: { min: 3, max: 3 } }, face: 'shy' },
  { text: 'I want to know more about {name}',    when: { scene: 'heartUp', friendship: { min: 3, max: 3 } }, face: 'shy' },
  { text: '{name} is someone special to me',        when: { scene: 'heartUp', friendship: { min: 4, max: 4 } }, face: 'dere' },
  { text: 'Will you stay here… forever?',       when: { scene: 'heartUp', friendship: { min: 4, max: 4 } }, face: 'dere' },
  { text: 'I love you, {name}!',          when: { scene: 'heartUp', friendship: { min: 5 } }, face: 'dere2' },
  { text: 'Let\'s always be together, okay?',    when: { scene: 'heartUp', friendship: { min: 5 } }, face: 'dere2' },

  /* ---------- 記念日・連続のあいさつ（その日だけ、優先して出る） ---------- */
  { text: 'You came back! That\'s day 2',         when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 2, max: 2 } }, face: 'happy', weight: 30 },
  { text: 'Three days in a row! I\'m so happy',       when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 3, max: 3 } }, face: 'happy', weight: 30 },
  { text: 'It\'s our one-week anniversary! Thank you, {name}', when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 7, max: 7 } }, face: 'happy', weight: 30 },
  { text: 'Two weeks…! We\'re best friends now',              when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 14, max: 14 } }, face: 'happy', weight: 30 },
  { text: 'One month together! Let\'s keep going, always',   when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 30, max: 30 } }, face: 'happy', weight: 30 },
  { text: 'Day 50! Every day with {name} is fun', when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 50, max: 50 } }, face: 'happy', weight: 30 },
  { text: '100 days…! Thank you, truly',    when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 100, max: 100 } }, face: 'shy', weight: 30 },
  { text: 'Three days straight! Good job~',           when: { scene: 'home', visit: 'new', streakDays: { min: 3, max: 3 } }, weight: 20 },
  { text: 'I know you come every single day~♪', when: { scene: 'home', visit: 'new', streakDays: { min: 7, max: 7 } }, weight: 20 },
  { text: 'Every day for two weeks… I love you, {name}',        when: { scene: 'home', visit: 'new', streakDays: { min: 14, max: 14 } }, face: 'shy', weight: 20 },

  /* ---------- 時間帯・ひさしぶり ---------- */
  { text: 'Mornin\'… I\'m still half asleep~',          when: { scene: 'home', visit: 'new', timeOfDay: 'morning' }, face: 'melt' },
  { text: 'Seeing you first thing — today\'s gonna be great!', when: { scene: 'home', visit: 'new', timeOfDay: 'morning' } },
  { text: 'Lunch break? Rest here for a bit',  when: { scene: 'home', visit: ['new', 'again'], timeOfDay: 'day' } },
  { text: 'Good work today~! You did your best', when: { scene: 'home', visit: ['new', 'again'], timeOfDay: 'evening' } },
  { text: 'I\'m sleepy, but {name}\'s here, so I\'ll stay up…', when: { scene: 'home', visit: ['new', 'again'], timeOfDay: 'night' }, face: 'melt' },
  { text: 'Welcome, night owl',        when: { scene: 'home', visit: ['new', 'again'], timeOfDay: 'night' } },
  { text: '…I was lonely, you know!',         when: { scene: 'home', visit: 'comeback' }, face: 'shy', weight: 2 },
  { text: '{name}, where were you~! I was waiting', when: { scene: 'home', visit: 'comeback', friendship: { min: 3 } }, face: 'troubled', weight: 2 },

  /* ---------- おまた（なかよし度で反応が変わる） ---------- */
  // 注意（ハート0〜1の1回目。もう一度さわると怒る）
  { text: 'Hey! Touch there again and I\'ll get mad!', when: { scene: 'tap', place: 'crotch', stage: 'warn' } },
  { text: 'Hey! Not there! …Next time I\'ll get mad',  when: { scene: 'tap', place: 'crotch', stage: 'warn' } },
  { text: 'Wh-where are you touching?! No more, okay!', when: { scene: 'tap', place: 'crotch', stage: 'warn' } },
  { text: 'Even for {name}, not there yet!',      when: { scene: 'tap', place: 'crotch', stage: 'warn' } },
  // モジモジ（ハート2〜3）
  { text: 'Th-that\'s… not yet…',       when: { scene: 'tap', place: 'crotch', stage: 'moji' } },
  { text: 'Fidget, fidget…',               when: { scene: 'tap', place: 'crotch', stage: 'moji' } },
  { text: 'I-I said it\'s embarrassing…',       when: { scene: 'tap', place: 'crotch', stage: 'moji' } },
  { text: 'Uuu… where are you touching…',     when: { scene: 'tap', place: 'crotch', stage: 'moji', mood: ['shy', 'troubled'] } },
  { text: 'Any more and I\'ll get mad…!',   when: { scene: 'tap', place: 'crotch', stage: 'moji', mood: 'troubled' }, weight: 2 },
  // デレ（ハート4〜）
  { text: 'Only {name}, just this once…',  when: { scene: 'tap', place: 'crotch', stage: ['dere', 'bulge'] }, weight: 2 },
  { text: 'Ehehe… that tickles',         when: { scene: 'tap', place: 'crotch', stage: ['dere', 'bulge'] } },
  { text: 'Geez… I guess it can\'t be helped',       when: { scene: 'tap', place: 'crotch', stage: ['dere', 'bulge'] } },
  { text: 'If it\'s {name}… it\'s okay…?',     when: { scene: 'tap', place: 'crotch', stage: ['dere', 'bulge'] } },
  // デレて、少しふくらんだ（ハート最大）
  { text: 'Ah… d-don\'t look…!',       when: { scene: 'tap', place: 'crotch', stage: 'bulge' }, weight: 2 },
  { text: 'I-it\'s nothing…!',     when: { scene: 'tap', place: 'crotch', stage: 'bulge' }, weight: 2 },
  { text: 'This is all {name}\'s fault…',       when: { scene: 'tap', place: 'crotch', stage: 'bulge' } },

  /* ---------- 頭を続けてなでる（とろけ） ---------- */
  { text: 'Funyaa~…',            when: { scene: 'melt' } },
  { text: 'I\'m melting~',       when: { scene: 'melt' } },
  { text: 'More~…',            when: { scene: 'melt' } },
  { text: '{name}\'s hands are so warm…', when: { scene: 'melt', friendship: { min: 2 } } },
  { text: 'I\'m getting sleepy…',    when: { scene: 'melt', timeOfDay: 'night' } },

  /* ---------- 怒る ---------- */
  { text: 'Hmph! I don\'t care anymore!',     when: { scene: 'angry' } },
  { text: 'Too much touching!',       when: { scene: 'angry' } },
  { text: 'Hmph hmph!',           when: { scene: 'angry' } },
  // おまたをさわって怒った（なかよしになる前）
  { text: 'Wh-where do you think you\'re touching!',   when: { scene: 'angry', place: 'crotch' }, weight: 4 },
  { text: 'You sneaky rascal!',             when: { scene: 'angry', place: 'crotch' }, weight: 4 },
  { text: 'Not theeere!',         when: { scene: 'angry', place: 'crotch' }, weight: 4 },

  /* ---------- 隠れている間にタップ ---------- */
  { text: 'Nobody\'s here!',           when: { scene: 'hiddenTap' }, weight: 3 },
  { text: 'I said nobody\'s here!',       when: { scene: 'hiddenTap' } },

  /* ---------- 戻ってくる ---------- */
  { text: 'I\'ll forgive you… a little', when: { scene: 'return' }, face: 'shy' },
  { text: 'I-it\'s not like I was waiting or anything…',    when: { scene: 'return' }, face: 'shy' },
  { text: '…You won\'t do it again?',              when: { scene: 'return' }, face: 'angry' },
  { text: 'I\'m still a little mad, you know',  when: { scene: 'return' }, face: 'angry' },
  { text: 'I\'m back~',                  when: { scene: 'return' }, face: 'normal' }
];
