/* =========================================================
   タヌくん 中国語（簡体字）のセリフ集（tools/make_lines_zh.py で lines.js と tools/lines_zh.json からつくる。
   ここを直接書きかえず、lines_zh.json を直してから作り直してください）
   ========================================================= */
(window.TANU_LINES_I18N = window.TANU_LINES_I18N || {}).zh = [

  /* ---------- 呼び名を決めたとき ---------- */
  { text: '{name}，以后请多关照呀！',       when: { scene: 'named' }, face: 'shy' },

  /* ---------- きせかえ ---------- */
  { text: '鼓出来的地方，很在意吗…？', when: { scene: 'wear', part: 'debeso' }, face: 'shy' },
  { text: '来，戳一下我的肚脐嘛！',   when: { scene: 'wear', part: 'debeso' } },
  { text: '凸肚脐，适合我吗？',             when: { scene: 'wear', part: 'debeso' }, face: 'shy' },
  { text: '变回原样啦～',           when: { scene: 'wear', part: 'none' } },

  /* ---------- メニュー画面のあいさつ ----------
     名前入りのセリフは、なかよし度（ハート）が上がるほど出やすくなります */
  { text: '初次见面！我是狸君哦', when: { scene: 'home', visit: 'first' } },
  { text: '早呀～',                   when: { scene: 'home', visit: 'new', timeOfDay: 'morning' } },
  { text: '你好呀！',               when: { scene: 'home', visit: 'new', timeOfDay: 'day' } },
  { text: '晚上好～',               when: { scene: 'home', visit: 'new', timeOfDay: 'evening' } },
  { text: '要熬夜吗？我陪着你哦', when: { scene: 'home', visit: 'new', timeOfDay: 'night' } },
  { text: '今天也来看我啦～！',       when: { scene: 'home', visit: 'new' } },
  { text: '你每天都来，好开心呀', when: { scene: 'home', visit: 'new', streakDays: { min: 3 } } },
  { text: '和你在一起，好安心呀', when: { scene: 'home', visit: 'new', friendship: { min: 3 } } },
  { text: '欢迎回来～！我一直在等你哦',     when: { scene: 'home', visit: 'comeback' }, face: 'shy' },
  { text: '好久不见！好想你呀',   when: { scene: 'home', visit: 'comeback' }, face: 'shy' },
  { text: '{name}，今天也来看我啦～！', when: { scene: 'home', visit: 'new' } },
  { text: '等你好久啦，{name}！',       when: { scene: 'home', visit: 'new', friendship: { min: 2 } }, weight: 2 },
  { text: '一见到{name}，就元气满满呀', when: { scene: 'home', visit: 'new', friendship: { min: 4 } }, weight: 3 },
  { text: '{name}，欢迎回来～！我一直在等你哦', when: { scene: 'home', visit: 'comeback', friendship: { min: 2 } }, face: 'shy', weight: 2 },
  // again … 今日2回目以降に開いたとき・遊ぶ画面からメニューに戻ったとき（何回目でも不自然にならない言葉に）
  { text: '要玩什么呀？',           when: { scene: 'home', visit: 'again' } },
  { text: '嘿嘿，我们待在一起吧', when: { scene: 'home', visit: 'again' } },
  { text: '呼啊～…我们悠闲一下吧',    when: { scene: 'home', visit: 'again' } },
  { text: '{name}，接下来做什么呀？',   when: { scene: 'home', visit: 'again', friendship: { min: 2 } }, weight: 2 },
  { text: '要玩什么呀？',           when: { scene: 'home', visit: 'again' } },
  { text: '呼啊～啊…',                  when: { scene: 'home', visit: 'again', timeOfDay: 'night' } },

  /* ---------- 頭 ---------- */
  { text: '被摸摸，好开心呀', when: { scene: 'tap', place: 'head', mood: 'normal' } },
  { text: '嘿嘿',               when: { scene: 'tap', place: 'head', mood: 'normal' } },
  { text: '脑袋暖烘烘的～',   when: { scene: 'tap', place: 'head', mood: 'normal' } },
  { text: '最喜欢被{name}摸摸啦', when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 3 } }, weight: 2 },
  { text: '好、好害羞呀…',      when: { scene: 'tap', place: 'head', mood: 'shy' } },
  { text: '一直这样摸的话…',    when: { scene: 'tap', place: 'head', mood: 'shy' } },
  { text: '真是的～！',             when: { scene: 'tap', place: 'head', mood: 'troubled' } },
  { text: '摸太多啦～',       when: { scene: 'tap', place: 'head', mood: 'troubled' } },

  /* ---------- むね ---------- */
  { text: '我的胸口很厚实吧',   when: { scene: 'tap', place: 'chest', mood: 'normal' } },
  { text: '我有在锻炼哦～',       when: { scene: 'tap', place: 'chest', mood: 'normal' } },
  { text: '有没有Q弹一下？',       when: { scene: 'tap', place: 'chest', mood: 'normal' } },
  { text: '心跳得好快，要被发现了…', when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 3 } }, face: 'shy', weight: 2 },
  { text: '那、那里是…',           when: { scene: 'tap', place: 'chest', mood: 'shy' } },
  { text: '胸口什么的，好害羞啦…', when: { scene: 'tap', place: 'chest', mood: 'shy' } },
  { text: '真是的～！',               when: { scene: 'tap', place: 'chest', mood: 'troubled' } },
  { text: '怎么老是摸胸口～！',       when: { scene: 'tap', place: 'chest', mood: 'troubled' } },

  /* ---------- おなか ---------- */
  { text: '噗哟～！',             when: { scene: 'tap', place: 'belly', mood: 'normal' } },
  { text: '嘭嘭♪',            when: { scene: 'tap', place: 'belly', mood: 'normal' }, weight: 2 },
  { text: '声音很好听吧～',   when: { scene: 'tap', place: 'belly', mood: 'normal' } },
  { text: '我的肚子，软软的吧', when: { scene: 'tap', place: 'belly', mood: 'normal' } },
  { text: '好痒呀～',       when: { scene: 'tap', place: 'belly', mood: 'normal' } },
  { text: '{name}也来敲敲肚皮鼓嘛？', when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 3 } }, weight: 2 },
  { text: '我刚刚吃了点心哦', when: { scene: 'tap', place: 'belly', mood: 'normal', timeOfDay: 'day' } },
  { text: '肚子好饿呀',   when: { scene: 'tap', place: 'belly', mood: 'normal', timeOfDay: ['morning', 'evening'] } },
  { text: '不要一直盯着看嘛…',    when: { scene: 'tap', place: 'belly', mood: 'shy' } },
  { text: '不要捏捏我啦～',   when: { scene: 'tap', place: 'belly', mood: 'shy' } },
  { text: '被揉来揉去…好害羞',   when: { scene: 'tap', place: 'belly', mood: 'shy' } },
  { text: '真是的～！',             when: { scene: 'tap', place: 'belly', mood: 'troubled' } },
  { text: '肚子很重要的！',   when: { scene: 'tap', place: 'belly', mood: 'troubled' } },

  /* ---------- しっぽ ---------- */
  /* ---------- しっぽをはじいたとき（公開スイッチ tailFlick が open のときだけ出る） ---------- */
  { text: '尾巴抖了好几下～',      when: { scene: 'flick', mood: 'normal' }, feature: 'tailFlick' },
  { text: '嘣～嘤♪',                        when: { scene: 'flick', mood: 'normal' }, feature: 'tailFlick' },
  { text: '{name}，你在玩我的尾巴吗？',         when: { scene: 'flick', mood: 'normal' }, feature: 'tailFlick' },
  { text: '尾巴可拉不长的哦～',           when: { scene: 'flick', mood: 'normal' }, feature: 'tailFlick', face: 'shy' },
  { text: '不要拽我的尾巴啦～',           when: { scene: 'flick', mood: ['shy', 'troubled'] }, feature: 'tailFlick', face: 'troubled' },
  { text: '晃呀晃…头好晕～',             when: { scene: 'flick', mood: ['shy', 'troubled'] }, feature: 'tailFlick', face: 'shy' },
  { text: '呀！？ 尾巴一下子炸毛了！', when: { scene: 'flickBig' }, feature: 'tailFlick', face: 'troubled' },
  { text: '吓、吓我一跳～…',               when: { scene: 'flickBig' }, feature: 'tailFlick', face: 'shy' },
  { text: '真是的～！ 毛都竖起来啦',    when: { scene: 'flickBig' }, feature: 'tailFlick', face: 'troubled' },
  { text: '{name}真是个小调皮～',             when: { scene: 'flickBig', friendship: { min: 3 } }, feature: 'tailFlick', face: 'shy', weight: 2 },
  { text: '尾巴毛茸茸的吧', when: { scene: 'tap', place: 'tail', mood: 'normal' } },
  { text: '摇呀摇♪',            when: { scene: 'tap', place: 'tail', mood: 'normal' } },
  { text: '只有{name}是特别的哦', when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 4 } }, weight: 2 },
  { text: '呀，尾巴不行…',    when: { scene: 'tap', place: 'tail', mood: 'shy' } },
  { text: '都说了很痒嘛',   when: { scene: 'tap', place: 'tail', mood: 'shy' } },
  { text: '真是的～！',             when: { scene: 'tap', place: 'tail', mood: 'troubled' } },
  { text: '别扯我的尾巴啦～', when: { scene: 'tap', place: 'tail', mood: 'troubled' } },

  /* ---------- おなかを引っぱって、はなしたとき ---------- */
  { text: '嘣～地一下，拉长啦～！',          when: { scene: 'pull', mood: 'normal' } },
  { text: '肚子像年糕一样吧？',        when: { scene: 'pull', mood: 'normal' } },
  { text: '不要拉嘛～',              when: { scene: 'pull', mood: 'normal' }, face: 'shy' },
  { text: '啵嘤一下弹回来了♪',               when: { scene: 'pull', mood: 'normal' } },
  { text: '拉长啦，拉长啦～',                  when: { scene: 'pull', mood: ['shy', 'troubled'] }, face: 'troubled' },
  { text: '{name}，拉太长啦～！',            when: { scene: 'pull', mood: ['shy', 'troubled'] }, face: 'shy' },
  { text: '是{name}的话，怎么拉都可以哦', when: { scene: 'pull', mood: 'normal', friendship: { min: 4 } }, weight: 2 },

  /* ---------- なかよし度で深まるセリフ（ハート2〜3：だんだん慣れてくる／ハート4〜5：甘えん坊） ---------- */
  // 頭
  { text: '摸摸好像会上瘾呢…',   when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '我已经记住{name}摸摸的手法啦',    when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '再摸一下下…好不好？',         when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 2, max: 3 } }, face: 'shy', weight: 2 },
  { text: '被摸摸头，全身暖烘烘的～',    when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '好像不是{name}的手就不行了呢', when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 4 } }, face: 'shy', weight: 3 },
  { text: '要一直摸摸我哦…好吗？',               when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 4 } }, face: 'melt', weight: 3 },
  { text: '被摸摸，好幸福～',          when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 4 } }, face: 'happy', weight: 3 },
  { text: '想让{name}摸摸，我特地梳好毛啦', when: { scene: 'tap', place: 'head', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  // むね
  { text: '…只有一下下的话，可以哦',         when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 2, max: 3 } }, face: 'shy', weight: 2 },
  { text: '我的心，是不是怦怦跳…？',       when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '很结实吧？…诶，你说软软的？',   when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '虽然很痒…但是不讨厌',     when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '{name}的手，好温暖…',           when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 4 } }, face: 'shy', weight: 3 },
  { text: '心跳这么快，都怪{name}啦', when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 4 } }, face: 'dere', weight: 3 },
  { text: '可以抱抱我哦…？',           when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 4 } }, face: 'dere', weight: 3 },
  { text: '{name}的手，好安心～',            when: { scene: 'tap', place: 'chest', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  // おなか
  { text: '今天的声音也好听吗？',          when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '你很喜欢敲我的肚子吧～', when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '吃了好多，所以特别响哦♪',   when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '嘭嘭，嘭嘭♪ 节奏真棒！', when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '这是{name}专属的小鼓哦～♪',           when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  { text: '最喜欢被{name}嘭嘭敲肚子啦', when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  { text: '肚子要变成{name}的手的形状啦～', when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  { text: '一起来嘭嘭敲吧？',        when: { scene: 'tap', place: 'belly', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  // しっぽ
  { text: '尾巴自己动起来了…',         when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '毛茸茸的，喜欢吗？',            when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '尾巴只给好朋友摸哦', when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '帮我梳梳毛的话，会更蓬松哦', when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 2, max: 3 } }, weight: 2 },
  { text: '一开心，尾巴就停不下来嘛',    when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  { text: '有{name}在，尾巴就一直摇呀摇♪', when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 4 } }, weight: 3 },
  { text: '尾巴可以给你当枕头哦？',    when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 4 } }, face: 'happy', weight: 3 },
  { text: '只让{name}摸哦',    when: { scene: 'tap', place: 'tail', mood: 'normal', friendship: { min: 4 } }, face: 'shy', weight: 3 },

  /* ---------- ハートをゲットしたとき（何個目か＝friendship） ---------- */
  { text: '{name}，以后也请多关照呀！',      when: { scene: 'heartUp', friendship: { min: 1, max: 1 } }, face: 'happy' },
  { text: '我开始有点在意你了…', when: { scene: 'heartUp', friendship: { min: 1, max: 1 } }, face: 'shy' },
  { text: '和{name}在一起，好开心呀～',      when: { scene: 'heartUp', friendship: { min: 2, max: 2 } }, face: 'happy' },
  { text: '明天还会来吗？',            when: { scene: 'heartUp', friendship: { min: 2, max: 2 } }, face: 'shy' },
  { text: '没有{name}的话，我会寂寞的吧…', when: { scene: 'heartUp', friendship: { min: 3, max: 3 } }, face: 'shy' },
  { text: '想更了解{name}一点呢',    when: { scene: 'heartUp', friendship: { min: 3, max: 3 } }, face: 'shy' },
  { text: '{name}是我特别的人哦',        when: { scene: 'heartUp', friendship: { min: 4, max: 4 } }, face: 'dere' },
  { text: '你会一直待在这里吗…？',       when: { scene: 'heartUp', friendship: { min: 4, max: 4 } }, face: 'dere' },
  { text: '最喜欢你啦，{name}！',          when: { scene: 'heartUp', friendship: { min: 5 } }, face: 'dere2' },
  { text: '以后也要一直在一起哦',    when: { scene: 'heartUp', friendship: { min: 5 } }, face: 'dere2' },

  /* ---------- 記念日・連続のあいさつ（その日だけ、優先して出る） ---------- */
  { text: '你又来啦！第2天了呢',         when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 2, max: 2 } }, face: 'happy', weight: 30 },
  { text: '已经来了3天啦！好开心',       when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 3, max: 3 } }, face: 'happy', weight: 30 },
  { text: '一周纪念日！谢谢你，{name}', when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 7, max: 7 } }, face: 'happy', weight: 30 },
  { text: '两周了…！我们是好朋友啦',              when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 14, max: 14 } }, face: 'happy', weight: 30 },
  { text: '一个月纪念！以后也要一直在一起哦',   when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 30, max: 30 } }, face: 'happy', weight: 30 },
  { text: '第50天！和{name}在一起，每天都好开心', when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 50, max: 50 } }, face: 'happy', weight: 30 },
  { text: '100天了…！真的，谢谢你',    when: { scene: 'home', visit: ['new', 'comeback'], totalDays: { min: 100, max: 100 } }, face: 'shy', weight: 30 },
  { text: '连续3天！好棒好棒～',           when: { scene: 'home', visit: 'new', streakDays: { min: 3, max: 3 } }, weight: 20 },
  { text: '你每天都来，我可是知道的哦～♪', when: { scene: 'home', visit: 'new', streakDays: { min: 7, max: 7 } }, weight: 20 },
  { text: '两周每天都来…最喜欢你了，{name}',        when: { scene: 'home', visit: 'new', streakDays: { min: 14, max: 14 } }, face: 'shy', weight: 20 },

  /* ---------- 時間帯・ひさしぶり ---------- */
  { text: '早…我还半睡半醒呢～',          when: { scene: 'home', visit: 'new', timeOfDay: 'morning' }, face: 'melt' },
  { text: '一大早就见到你，今天一定是好日子！', when: { scene: 'home', visit: 'new', timeOfDay: 'morning' } },
  { text: '午休吗？在这里歇一会儿吧',  when: { scene: 'home', visit: ['new', 'again'], timeOfDay: 'day' } },
  { text: '辛苦啦～！今天也很努力呢', when: { scene: 'home', visit: ['new', 'again'], timeOfDay: 'evening' } },
  { text: '好困…但{name}来了，我要醒着…', when: { scene: 'home', visit: ['new', 'again'], timeOfDay: 'night' }, face: 'melt' },
  { text: '欢迎你，小夜猫子',        when: { scene: 'home', visit: ['new', 'again'], timeOfDay: 'night' } },
  { text: '…人家很寂寞的啦！',         when: { scene: 'home', visit: 'comeback' }, face: 'shy', weight: 2 },
  { text: '{name}，你去哪儿了嘛～！我一直在等你', when: { scene: 'home', visit: 'comeback', friendship: { min: 3 } }, face: 'troubled', weight: 2 },

  /* ---------- おまた（なかよし度で反応が変わる） ---------- */
  // 注意（ハート0〜1の1回目。もう一度さわると怒る）
  { text: '喂！再摸我就生气了哦！', when: { scene: 'tap', place: 'crotch', stage: 'warn' } },
  { text: '喂喂！那里不行！…下次要生气了哦',  when: { scene: 'tap', place: 'crotch', stage: 'warn' } },
  { text: '你、你在摸哪里呀！？不准再摸了！', when: { scene: 'tap', place: 'crotch', stage: 'warn' } },
  { text: '就算是{name}，那里也还不行！',      when: { scene: 'tap', place: 'crotch', stage: 'warn' } },
  // モジモジ（ハート2〜3）
  { text: '那、那里…还不行啦…',       when: { scene: 'tap', place: 'crotch', stage: 'moji' } },
  { text: '扭、扭扭捏捏…',               when: { scene: 'tap', place: 'crotch', stage: 'moji' } },
  { text: '都、都说了好害羞嘛…',       when: { scene: 'tap', place: 'crotch', stage: 'moji' } },
  { text: '呜…你在摸哪里呀…',     when: { scene: 'tap', place: 'crotch', stage: 'moji', mood: ['shy', 'troubled'] } },
  { text: '再这样，我就生气了哦…！',   when: { scene: 'tap', place: 'crotch', stage: 'moji', mood: 'troubled' }, weight: 2 },
  // デレ（ハート4〜）
  { text: '只有{name}是特别的哦…',  when: { scene: 'tap', place: 'crotch', stage: ['dere', 'bulge'] }, weight: 2 },
  { text: '嘿嘿…好痒',         when: { scene: 'tap', place: 'crotch', stage: ['dere', 'bulge'] } },
  { text: '真是的…拿你没办法呀',       when: { scene: 'tap', place: 'crotch', stage: ['dere', 'bulge'] } },
  { text: '是{name}的话，可以哦…？',     when: { scene: 'tap', place: 'crotch', stage: ['dere', 'bulge'] } },
  // デレて、少しふくらんだ（ハート最大）
  { text: '啊…不、不要看…！',       when: { scene: 'tap', place: 'crotch', stage: 'bulge' }, weight: 2 },
  { text: '没、没什么啦…！',     when: { scene: 'tap', place: 'crotch', stage: 'bulge' }, weight: 2 },
  { text: '都怪{name}啦…',       when: { scene: 'tap', place: 'crotch', stage: 'bulge' } },

  /* ---------- 頭を続けてなでる（とろけ） ---------- */
  { text: '呼喵～…',            when: { scene: 'melt' } },
  { text: '要融化啦～',       when: { scene: 'melt' } },
  { text: '还要～…',            when: { scene: 'melt' } },
  { text: '{name}的手，好温暖…', when: { scene: 'melt', friendship: { min: 2 } } },
  { text: '开始困了…',    when: { scene: 'melt', timeOfDay: 'night' } },

  /* ---------- 怒る ---------- */
  { text: '哼，不理你了！',     when: { scene: 'angry' } },
  { text: '摸太多啦！',       when: { scene: 'angry' } },
  { text: '哼哼！',           when: { scene: 'angry' } },
  // おまたをさわって怒った（なかよしになる前）
  { text: '你、你在摸哪里呀！',   when: { scene: 'angry', place: 'crotch' }, weight: 4 },
  { text: '你这个小坏蛋！',             when: { scene: 'angry', place: 'crotch' }, weight: 4 },
  { text: '那里不行啦～！',         when: { scene: 'angry', place: 'crotch' }, weight: 4 },

  /* ---------- 隠れている間にタップ ---------- */
  { text: '不在哦！',           when: { scene: 'hiddenTap' }, weight: 3 },
  { text: '都说了不在嘛！',       when: { scene: 'hiddenTap' } },

  /* ---------- 戻ってくる ---------- */
  { text: '就稍微原谅你一下吧', when: { scene: 'return' }, face: 'shy' },
  { text: '我、我才没有在等你呢…',    when: { scene: 'return' }, face: 'shy' },
  { text: '…不会再这样了吧？',              when: { scene: 'return' }, face: 'angry' },
  { text: '我还有一点点生气哦',  when: { scene: 'return' }, face: 'angry' },
  { text: '我回来啦～',                  when: { scene: 'return' }, face: 'normal' }
];
