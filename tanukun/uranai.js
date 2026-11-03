/* =========================================================
   タヌくん 貝がら占い（2026-11-03。uranai/RESULTS_DRAFT.md で決めた中身）
   ・その日はじめて開いたとき（はじめて来た日はのぞく）、あいさつのあとに、浜辺に貝が3つ「ぽよん」と出る
     → 1つ選ぶと ぱかっ → 運勢・ラッキーカラー・ラッキーアイテム・ラッキーアクション（タヌくんの言葉）→ X にポスト
   ・「あとで」で閉じられる。2回目以降と「あとで」のあとは、トップ画面のカード「🐚 今日の占い」から
   ・「あとで」を3日続けて押したら、自動で出すのをやめる（設定の「占いを自動で出す」で戻せる）
   ・結果は「日付＋選んだ貝＋このスマホだけの番号」で決まる（同じ日は何度開いても同じ。人によってちがう）。
     このスマホの中（localStorage の tanukun.uranai）にだけ保存。どこにも送らない
   ・ときどき（7日に1回くらい）3つのうち1つが金の貝。選ぶと必ず「ぽんぽこ大吉」＋特別な絵
   ・悪い結果は出さない。効果を言い切らない（「〜してみよ？」）
   使い方：const u = window.TanuUranai({ ...下の opts }) → u.shouldAuto(totalDays) / u.open(auto) / u.doneToday()
   ========================================================= */
window.TanuUranai = function (opts) {
  'use strict';

  const KEY = 'tanukun.uranai';
  // 絵（tools/make_uranai_art.py でつくる）。確認用リンクで文字データに置きかえられるように、場所はそのまま書く
  const SRC = {
    pick: 'images/uranai/pick.webp',
    result: 'images/uranai/result.webp',
    gold: 'images/uranai/gold.webp',
    shell_coral_c: 'images/uranai/shell_coral_c.webp',
    shell_pearl_c: 'images/uranai/shell_pearl_c.webp',
    shell_blue_c: 'images/uranai/shell_blue_c.webp',
    shell_gold_c: 'images/uranai/shell_gold_c.webp',
    shell_coral_o: 'images/uranai/shell_coral_o.webp',
    shell_pearl_o: 'images/uranai/shell_pearl_o.webp',
    shell_blue_o: 'images/uranai/shell_blue_o.webp',
    shell_gold_o: 'images/uranai/shell_gold_o.webp'
  };
  const tr = opts.tr;
  const L = () => opts.lang() || 'ja';
  const T = (o) => (o && (o[L()] || o.ja)) || '';

  /* ---------- 中身 ---------- */
  // 運勢（w は出やすさ）。gold は金の貝で必ずこれ
  const FORTUNES = [
    { id: 'daikichi', w: 5, icon: '🌟', ja: 'ぽんぽこ大吉', en: 'Ponpoko Great Luck', zh: '嘭嘭大吉' },
    { id: 'hokahoka', w: 15, icon: '☀️', ja: 'ほかほか吉', en: 'Warm & Cozy Luck', zh: '暖洋洋吉' },
    { id: 'wakuwaku', w: 15, icon: '🎵', ja: 'わくわく吉', en: 'Exciting Luck', zh: '兴冲冲吉' },
    { id: 'nikoniko', w: 15, icon: '😊', ja: 'にこにこ吉', en: 'Smiley Luck', zh: '笑眯眯吉' },
    { id: 'nonbiri', w: 15, icon: '🍃', ja: 'のんびり吉', en: 'Easygoing Luck', zh: '悠哉哉吉' },
    { id: 'mofumofu', w: 15, icon: '☁️', ja: 'もふもふ吉', en: 'Fluffy Luck', zh: '毛茸茸吉' },
    { id: 'manpuku', w: 10, icon: '🍖', ja: 'まんぷく吉', en: 'Full-Tummy Luck', zh: '饱饱吉' },
    { id: 'suyasuya', w: 10, icon: '🌙', ja: 'すやすや吉', en: 'Sweet Dreams Luck', zh: '香甜梦吉' }
  ];
  // ラッキーカラー（南の島の言い方。マゼンタに近い色・紫は入れない）
  const COLORS = [
    { c: '#E8453C', ja: 'ハイビスカスの赤', en: 'Hibiscus Red', zh: '扶桑花红' },
    { c: '#FFF8EC', ja: 'ココナッツの白', en: 'Coconut White', zh: '椰子白' },
    { c: '#3FA34D', ja: 'ヤシの葉の緑', en: 'Palm Leaf Green', zh: '椰叶绿' },
    { c: '#1E88C8', ja: '南の海の青', en: 'Tropical Sea Blue', zh: '南海蓝' },
    { c: '#8FD8F0', ja: 'ラムネの水色', en: 'Soda Pop Sky Blue', zh: '汽水浅蓝' },
    { c: '#FF9A2E', ja: 'マンゴーのオレンジ', en: 'Mango Orange', zh: '芒果橙' },
    { c: '#FFD23F', ja: 'バナナの黄色', en: 'Banana Yellow', zh: '香蕉黄' },
    { c: '#FF7F6A', ja: '夕焼けのコーラル', en: 'Sunset Coral', zh: '晚霞珊瑚色' },
    { c: '#6B3E1E', ja: 'たき火のこげ茶（タヌくんとおそろい）', en: 'Campfire Brown (just like Tanu-kun!)', zh: '篝火深棕（和狸君一样）' },
    { c: '#D9A931', ja: 'お月さまの金色', en: 'Moonlight Gold', zh: '月光金' }
  ];
  // ラッキーアイテム（身の回りの物）
  const ITEMS = [
    ['マグカップ', 'a mug', '马克杯'], ['ハンカチ', 'a handkerchief', '手帕'], ['くつした', 'socks', '袜子'],
    ['まくら', 'a pillow', '枕头'], ['おにぎり', 'a rice ball', '饭团'], ['あたたかいお茶', 'a warm cup of tea', '一杯热茶'],
    ['えんぴつ', 'a pencil', '铅笔'], ['傘', 'an umbrella', '雨伞'], ['ばんそうこう', 'a bandage', '创可贴'],
    ['手帳', 'a planner', '记事本'], ['イヤホン', 'earphones', '耳机'], ['丸いクッキー', 'a round cookie', '圆圆的饼干'],
    ['タオル', 'a towel', '毛巾'], ['鏡', 'a mirror', '镜子'], ['水筒', 'a water bottle', '水壶'],
    ['ふせん', 'sticky notes', '便利贴'], ['リップクリーム', 'lip balm', '润唇膏'], ['ぬいぐるみ', 'a plush toy', '毛绒玩偶'],
    ['好きな本', 'a favorite book', '喜欢的书'], ['スニーカー', 'sneakers', '运动鞋'], ['キーホルダー', 'a keychain', '钥匙扣'],
    ['ブランケット', 'a blanket', '毯子'], ['チョコレート', 'chocolate', '巧克力'], ['植物', 'a plant', '植物']
  ].map((a) => ({ ja: a[0], en: a[1], zh: a[2] }));
  // ラッキーアクション（心理学・行動経済学をもとに。考え方は uranai/RESULTS_DRAFT.md ⑦。画面には根拠を出さない）
  const ACTIONS = [
    { ja: 'ねる前に、今日のよかったこと3つ、思い出してみて？', en: 'Before bed, try to remember 3 good things from today?', zh: '睡前，回想一下今天的3件好事吧？' },
    { ja: '『ありがとう』って、ひとつ言ってみよ？', en: 'How about saying one "thank you" today?', zh: '今天试着说一声"谢谢"吧？' },
    { ja: 'だれかに、ちいさな親切しちゃお！', en: 'Let\'s do one small kindness for someone!', zh: '为别人做一件小小的好事吧！' },
    { ja: '2分だけやってみよ？ 始めたら、けっこう続くよ', en: 'Try it for just 2 minutes? Once you start, you might keep going!', zh: '只做2分钟试试？开始了就停不下来哦' },
    { ja: '『ごはんのあとに◯◯する』って決めてみて！', en: 'Try deciding: "After lunch, I\'ll do ___!"', zh: '试着决定"吃完饭就做◯◯"吧！' },
    { ja: '好きな音楽をききながら、おかたづけ♪', en: 'Tidy up while listening to your favorite music♪', zh: '一边听喜欢的音乐，一边收拾♪' },
    { ja: 'できたこと、ひとつメモしよ！ ちいさくてOK', en: 'Write down one thing you did! Small things count!', zh: '记下一件做到的事吧！小事也可以' },
    { ja: 'きんちょうしたら『わくわくしてきた！』って言ってみて', en: 'Feeling nervous? Try saying "I\'m getting excited!"', zh: '紧张的时候，试着说"我开始兴奋了！"' },
    { ja: '5分だけ、おさんぽしよ？ 空を見るの、気持ちいいよ', en: 'How about a 5-minute walk? Looking at the sky feels nice!', zh: '散步5分钟吧？看看天空很舒服哦' },
    { ja: 'すって〜、はいて〜。ゆっくり3回ね', en: 'Breathe in… breathe out… slowly, 3 times!', zh: '吸气～呼气～慢慢地做3次哦' },
    { ja: 'お水を、目に入る所に置いておこ！', en: 'Put a glass of water where you can see it!', zh: '把水放在看得见的地方吧！' },
    { ja: '机の上、ひとすみだけ、きれいにしよ？', en: 'Let\'s tidy just one corner of your desk?', zh: '把桌子的一个角落收拾干净吧？' },
    { ja: '自分に『よくがんばってるね』って言ってあげて', en: 'Tell yourself, "You\'re doing great."', zh: '对自己说一声"你很努力了"吧' },
    { ja: 'だれかのいい所、ひとつ見つけて伝えよ！', en: 'Find one good thing about someone and tell them!', zh: '找到别人的一个优点，告诉他吧！' },
    { ja: '明日の自分に、ちいさなプレゼントを用意しよ♪', en: 'Prepare a little gift for tomorrow\'s you♪', zh: '为明天的自己准备一份小礼物吧♪' },
    { ja: '今日を『はじまりの日』にしちゃお！', en: 'Let\'s make today a "fresh start" day!', zh: '把今天当作"新的开始"吧！' },
    { ja: '10分だけスマホをおいて、ぼーっとしよ？', en: 'Put your phone down for 10 minutes and just relax?', zh: '放下手机10分钟，发发呆吧？' },
    { ja: 'おいしいもの、ゆっくり味わって食べてね', en: 'Take your time and really savor something tasty!', zh: '慢慢品尝好吃的东西吧' },
    { w: 0.5, ja: 'しばらく話してない人に、ひとこと送ってみよ？', en: 'Send a quick hello to someone you haven\'t talked to in a while?', zh: '给好久没联系的人发一句问候吧？' },
    { ja: '『できない』じゃなくて『まだ、これから』だよ！', en: 'Not "I can\'t" — it\'s "not yet"!', zh: '不是"做不到"，是"还没到时候"哦！' }
  ];
  const SHELLS = ['coral', 'pearl', 'blue'];
  const UI = {
    pick: { ja: '今日の貝を ひとつ えらんでね！', en: 'Pick one shell for today!', zh: '选一个今天的贝壳吧！' },
    later: { ja: 'あとで', en: 'Later', zh: '稍后' },
    title: { ja: '🐚 今日のタヌくん占い', en: '🐚 Tanu-kun\'s Shell Fortune', zh: '🐚 狸君的今日贝壳占卜' },
    color: { ja: '🎨 ラッキーカラー', en: '🎨 Lucky color', zh: '🎨 幸运色' },
    item: { ja: '🎁 ラッキーアイテム', en: '🎁 Lucky item', zh: '🎁 幸运物品' },
    action: { ja: '✨ ラッキーアクション', en: '✨ Lucky action', zh: '✨ 幸运行动' },
    close: { ja: 'とじる', en: 'Close', zh: '关闭' },
    next: { ja: 'また明日、貝をえらびにきてね 🐚', en: 'Come back tomorrow to pick another shell 🐚', zh: '明天再来选贝壳吧 🐚' },
    gold: { ja: '金の貝がら！！', en: 'A golden shell!!', zh: '金色贝壳！！' },
    tag: { ja: '#タヌくん占い', en: '#TanukunFortune', zh: '#狸君占卜' },
    post: { ja: '🐚今日のタヌくん占いは【{f}】でした！\n🎨{c}／🎁{i}\n✨「{a}」', en: '🐚 Today\'s Tanu-kun fortune: [{f}]!\n🎨 {c} / 🎁 {i}\n✨ "{a}"', zh: '🐚今天的狸君占卜是【{f}】！\n🎨{c}／🎁{i}\n✨「{a}」' }
  };
  const fill = (s, v) => s.replace(/\{(\w)\}/g, (m, k) => (v[k] != null ? v[k] : m));

  /* ---------- 記録（このスマホの中だけ） ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  let st = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  if (!st.seed) { st.seed = Math.floor(Math.random() * 1e9) + 1; save(); }

  /* ---------- 結果の決め方（同じ日・同じ貝なら同じ結果） ---------- */
  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(s) {
    let a = hash(s);
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const weighted = (list, r) => {
    const sum = list.reduce((s, x) => s + (x.w == null ? 1 : x.w), 0);
    let v = r() * sum;
    for (let i = 0; i < list.length; i++) { v -= list[i].w == null ? 1 : list[i].w; if (v < 0) return i; }
    return list.length - 1;
  };
  // その日の貝のならび（3つ）。7日に1回くらい、1つが金
  function lineup(day) {
    const r = rng('line|' + day + '|' + st.seed);
    const a = SHELLS.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    if (r() < 1 / 7 || opts.testGold) a[opts.testGold ? 1 : Math.floor(r() * 3)] = 'gold';
    return a;
  }
  function draw(day, pos, color) {
    const r = rng('fortune|' + day + '|' + st.seed + '|' + pos);
    const f = color === 'gold' ? 0 : weighted(FORTUNES, r);
    return { f: f, c: Math.floor(r() * COLORS.length), i: Math.floor(r() * ITEMS.length), a: weighted(ACTIONS, r), gold: color === 'gold' };
  }

  const today = () => opts.today();
  const doneToday = () => st.day === today() && !!st.res;
  // 自動で出すか：はじめて来た日ではない・今日まだ引いていない・今日まだ自動で出していない・自動が止まっていない
  function shouldAuto(totalDays) {
    return totalDays >= 2 && !st.autoOff && !doneToday() && st.autoDay !== today();
  }

  /* ---------- 画面 ---------- */
  let root = null, hold = null, busy = false, auto = false;
  const $ = (sel) => root.querySelector(sel);
  function build() {
    root = document.createElement('section');
    root.id = 'uranai';
    root.hidden = true;
    root.innerHTML =
      '<div class="u-bg"></div><img class="u-gold" alt="" draggable="false">' +
      '<div class="u-stage"><img class="u-tanu" alt="" draggable="false"><div class="u-say"></div>' +
      '<div class="u-shells"></div></div>' +
      '<button class="u-later" type="button"></button>' +
      '<div class="u-card scroll-more" hidden></div>' +
      '<div class="u-flash"></div>';
    document.body.appendChild(root);
    if (opts.scrollHint) opts.scrollHint($('.u-card'));
    $('.u-bg').style.backgroundImage = 'url("' + opts.background + '")';
    $('.u-later').addEventListener('click', () => {
      if (busy) return;
      if (auto) {
        st.later = (st.later || 0) + 1;
        if (st.later >= 3) st.autoOff = true;   // 3日続けて「あとで」→ 自動で出すのをやめる
        save();
        opts.ping('u-later');
      }
      close();
    });
    // 先に絵を読みこんでおく
    Object.keys(SRC).forEach((n) => { new Image().src = SRC[n]; });
  }

  // auto … あいさつのあとに自動で出したとき（「あとで」を数える）
  function open(isAuto) {
    if (!root) build();
    if (!root.hidden) return;
    auto = !!isAuto;
    busy = false;
    hold = opts.hold ? opts.hold() : null;
    const day = today();
    if (auto) { st.autoDay = day; save(); opts.ping('u-show'); }
    root.className = '';
    $('.u-card').hidden = true;
    $('.u-gold').removeAttribute('src');
    if (doneToday()) { reveal(true); }
    else {
      $('.u-tanu').src = SRC.pick;
      $('.u-say').textContent = withName(T(UI.pick));
      $('.u-later').textContent = T(UI.later);
      const box = $('.u-shells');
      box.textContent = '';
      lineup(day).forEach((color, pos) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'u-shell' + (color === 'gold' ? ' gold' : '');
        b.style.animationDelay = (0.25 + pos * 0.12) + 's';
        b.setAttribute('aria-label', (pos + 1) + '');
        b.innerHTML = '<img src="' + SRC['shell_' + color + '_c'] + '" alt="" draggable="false">';
        b.addEventListener('click', () => pick(b, pos, color));
        box.appendChild(b);
      });
    }
    root.hidden = false;
    void root.offsetWidth;
    root.classList.add('on');
  }
  function withName(s) { const n = opts.name && opts.name(); return n && L() === 'ja' ? n + '、' + s : s; }

  function pick(btn, pos, color) {
    if (busy || doneToday()) return;
    busy = true;
    const day = today();
    st.day = day; st.pos = pos; st.color = color; st.res = draw(day, pos, color);
    st.later = 0;
    save();
    opts.ping('u-pick');
    root.classList.add('picked');
    btn.classList.add('chosen');
    chime(color === 'gold');
    // ぷるぷる → ぱかっ
    setTimeout(() => {
      btn.querySelector('img').src = SRC['shell_' + color + '_o'];
      btn.classList.add('open');
      if (color === 'gold') { $('.u-say').textContent = T(UI.gold); root.classList.add('flash'); }
    }, 650);
    setTimeout(() => reveal(false), color === 'gold' ? 1900 : 1500);
  }

  // 結果を出す（again … 今日すでに引いていて、カードから見返すとき）
  function reveal(again) {
    const r = st.res, gold = !!r.gold;
    $('.u-later').textContent = '';
    if (gold) {
      $('.u-gold').src = SRC.gold;
      root.classList.add('gold');
    } else {
      $('.u-tanu').src = SRC.result;
    }
    if (again) {
      const box = $('.u-shells');
      box.innerHTML = '<span class="u-shell open chosen still"><img src="' + SRC['shell_' + (st.color || 'coral') + '_o'] + '" alt="" draggable="false"></span>';
      root.classList.add('picked');
    }
    const F = FORTUNES[r.f], Cl = COLORS[r.c], It = ITEMS[r.i], Ac = ACTIONS[r.a];
    $('.u-say').textContent = F.icon + ' ' + T(F);
    const p = (st.day || today()).split('-'), mo = +p[1], da = +p[2];
    const md = L() === 'en' ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][mo - 1] + ' ' + da : mo + '月' + da + '日';
    const card = $('.u-card');
    card.innerHTML =
      '<p class="u-date">' + T(UI.title) + '　' + md + '</p>' +
      '<p class="u-fortune' + (gold ? ' big' : '') + '">' + F.icon + ' <span></span></p>' +
      '<dl class="u-list"><dt>' + T(UI.color) + '</dt><dd><i class="u-sw"></i><span class="u-c"></span></dd>' +
      '<dt>' + T(UI.item) + '</dt><dd class="u-i"></dd></dl>' +
      '<div class="u-act"><b>' + T(UI.action) + '</b><p><span class="u-who"></span>' + (L() === 'en' ? ': "' : '「') + '<span class="u-a"></span>' + (L() === 'en' ? '"' : '」') + '</p></div>' +
      opts.shareHtml() +
      '<button class="btn btn-wide u-close" type="button"></button>' +
      '<p class="u-next">' + T(UI.next) + '</p>';
    card.querySelector('.u-fortune span').textContent = T(F);
    card.querySelector('.u-sw').style.background = Cl.c;
    card.querySelector('.u-c').textContent = T(Cl);
    card.querySelector('.u-i').textContent = T(It);
    card.querySelector('.u-who').textContent = tr('タヌくん');
    card.querySelector('.u-a').textContent = T(Ac);
    card.querySelector('.u-close').textContent = T(UI.close);
    card.querySelector('.u-close').addEventListener('click', close);
    const text = fill(T(UI.post), { f: T(F), c: T(Cl).replace(/[（(].*[）)]/, ''), i: T(It), a: T(Ac) }) + '\n' + T(UI.tag) + ' ' + tr('#タヌくん');
    opts.bindShare(card, text);
    setTimeout(() => {
      card.hidden = false;
      void card.offsetWidth;
      root.classList.add('result');
      card.scrollTop = 0;
      busy = false;
    }, again ? 50 : 350);
  }

  function close() {
    if (!root || root.hidden) return;
    root.classList.remove('on');
    setTimeout(() => {
      root.hidden = true;
      if (hold) { hold(); hold = null; }
      if (opts.onClose) opts.onClose();
    }, 320);
  }

  // 「ちりん♪」（金の貝は2回）
  function chime(gold) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ac = chime.ac || (chime.ac = new AC());
      ac.resume();
      const t0 = ac.currentTime + 0.02;
      (gold ? [0, 0.12, 0.24] : [0, 0.1]).forEach((dt, k) => {
        [1568, 2349].forEach((f, i) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = 'sine';
          o.frequency.value = f * (1 + k * 0.125);
          const t = t0 + dt;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(i ? 0.05 : 0.12, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
          o.connect(g).connect(ac.destination);
          o.start(t); o.stop(t + 0.75);
        });
      });
    } catch (e) {}
  }

  return {
    open: open,
    close: close,
    doneToday: doneToday,
    shouldAuto: shouldAuto,
    isOpen: () => !!root && !root.hidden,
    get autoOn() { return !st.autoOff; },
    setAuto: (on) => { st.autoOff = !on; if (on) st.later = 0; save(); },
    // 確認用：今日の結果を消して、もう一度引けるようにする
    resetToday: () => { delete st.res; delete st.day; delete st.autoDay; save(); }
  };
};
