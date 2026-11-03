/* =========================================================
   タヌくんのポスト（お手紙。2026-11-03）
   ・トップ画面の左下に、木のポストがいつも立っている。お返事が届くと赤い旗が上がって「1」の印、ゆらゆら揺れる
   ・ポストの画面：✏️ お手紙を書く／📬 お返事を読む／📚 お手紙箱
   ・書く：切手を選んで、200字まで → おくる → 便せんが封筒になって、タヌくんが両手で抱えて「よ、読むね…！」
     → 次の日（日付が変わったら）お返事が届く。お手紙は1日1通まで
   ・お返事は、前もって用意した短くてかわいい文から選ぶ（選んだ切手・呼び名で変わる）。
     書いた内容を読んだふりはしない（どの手紙にも合う、あたたかい文）
   ・ときどき、タヌくんから先にお手紙（なかよし10・30・50・100日目、クリアの日）
   ・書いたお手紙の届け先：config.js の post.form（Google フォーム）。空なら、お手紙はスマホの中にしまうだけ（どこにも送らない）
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
    smile: 'images/post/receive_smile.webp'   // receive の顔だけ「目を閉じて にっこり」（同じ大きさ・同じ位置）
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
    box: { ja: '📚 お手紙箱', en: '📚 Letter box', zh: '📚 信件盒' },
    back: { ja: '‹ もどる', en: '‹ Back', zh: '‹ 返回' },
    hiUnread: { ja: 'お手紙、とどいてるよ！ 📮', en: 'A letter has arrived for you! 📮', zh: '有你的信哦！📮' },
    hiWait: { ja: '明日、お返事を書くね…！', en: 'I\'ll write you back tomorrow…!', zh: '明天给你回信哦…！' },
    hiIdle: { ja: 'お手紙、まってるよ〜', en: 'I\'m waiting for your letter~', zh: '在等你的信哦～' },
    stamp: { ja: 'きってを えらんでね', en: 'Pick a stamp', zh: '选一张邮票吧' },
    place: { ja: 'タヌくんへ', en: 'Dear Tanu-kun,', zh: '给狸君' },
    hint: { ja: 'ここに書いてね（{n}字まで）', en: 'Write here (up to {n} characters)', zh: '写在这里（最多{n}字）' },
    send: { ja: '📮 おくる', en: '📮 Send', zh: '📮 寄出' },
    cancel: { ja: 'やめる', en: 'Cancel', zh: '不写了' },
    noteForm: { ja: 'お手紙は Google フォームを通じて作者に とどき、作者と、集計を手伝う AI が読みます。名前・住所・学校など、あなたがだれか分かることは書かないでね', en: 'Your letter reaches Tanu-kun\'s creator via Google Forms, and is read by the creator and an AI that helps sort the letters. Please don\'t write your name, address, school, or anything that could identify you', zh: '信件会通过 Google 表单送到作者那里，由作者和帮忙整理的 AI 阅读。请不要写名字、地址、学校等能认出你是谁的信息' },
    rules: { ja: 'ⓘ お約束と注意', en: 'ⓘ Promises & notes', zh: 'ⓘ 约定与注意事项' },
    noteLocal: { ja: 'お手紙は、このスマホの中に しまわれます（どこにも送りません）', en: 'Your letter is kept on this phone only (it isn\'t sent anywhere)', zh: '信件只保存在这部手机里（不会发送到任何地方）' },
    got: { ja: 'よ、読むね…！', en: 'I-I\'ll read it…!', zh: '我、我会好好读的…！' },
    tomorrow: { ja: '明日、お返事を書くね 📮', en: 'I\'ll write back tomorrow 📮', zh: '明天给你回信哦 📮' },
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
  function pickReply(stamp) {
    // 切手のお返事（3回に1回）か、ふつうのお返事。前と同じにならないように
    const last = st.letters.length ? st.letters[st.letters.length - 1].reply : '';
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
    root.classList.remove('writing', 'sent', 'smile');
    const n = unread();
    $('.p-box').src = n ? SRC.up : SRC.down;
    $('.p-box').classList.toggle('has', !!n);
    $('.p-tanu').src = opts.happy;
    say(n ? T(UI.hiUnread) : wroteToday() ? T(UI.hiWait) : T(UI.hiIdle));
    const replies = st.letters.filter(arrived);
    const m = $('.p-menu');
    m.innerHTML =
      (n ? '<button class="btn btn-main p-read" type="button">' + T(UI.read) + ' <i>' + n + '</i></button>' : '') +
      '<button class="btn ' + (n ? '' : 'btn-main ') + 'p-write" type="button">' + T(UI.write) + '</button>' +
      '<button class="btn p-open-box" type="button">' + T(UI.box) + (replies.length ? ' (' + replies.length + ')' : '') + '</button>';
    if (n) m.querySelector('.p-read').addEventListener('click', () => readLetter(st.letters.find((l) => arrived(l) && !l.read)));
    m.querySelector('.p-write').addEventListener('click', write);
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
      '<p class="p-note">' + (opts.form && opts.form() ? T(UI.noteForm) : T(UI.noteLocal)) +
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
  function sendLetter(text, stamp) {
    if (!text || wroteToday()) return;
    st.letters.push({ day: today(), stamp: stamp, text: text, reply: pickReply(stamp), read: false });
    save();
    opts.ping && opts.ping('m-send');
    if (opts.submit) opts.submit({ text: text, stamp: stamp, lang: L() });
    // 便せんが封筒になって、タヌくんへ
    const sh = $('.p-sheet');
    const s = STAMPS.find((x) => x.id === stamp) || STAMPS[0];
    sh.className = 'p-sheet p-envelope';
    sh.innerHTML = '<div class="p-env"><i class="p-env-flap"></i><b class="p-env-stamp">' + s.icon + '</b></div>';
    root.classList.remove('writing');
    setTimeout(() => sh.classList.add('fly'), 900);
    setTimeout(() => {
      sh.hidden = true;
      root.classList.add('sent');
      $('.p-tanu').src = SRC.receive;
      say(T(UI.got));
      if (opts.chime) opts.chime();
    }, 1650);
    // 受け取ってうれしくて、目を閉じて にっこり → ぴょんと はねて、ハートがふわっ
    setTimeout(() => {
      if (!root.classList.contains('sent')) return;
      const t = $('.p-tanu');
      t.src = SRC.smile;
      root.classList.add('smile');
      hearts(t);
    }, 2500);
    setTimeout(() => { say(T(UI.tomorrow)); }, 3600);
    setTimeout(() => { if (!root.hidden) showMenu(); }, 6200);
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

  // 📚 お手紙箱
  function showBox() {
    const list = st.letters.filter(arrived).slice().reverse();
    const sh = $('.p-sheet');
    sh.className = 'p-sheet p-paper p-boxlist';
    sh.innerHTML = '<p class="p-stlabel">' + T(UI.box) + '</p>' +
      (list.length ? '<ul></ul>' : '<p class="p-body"></p>') +
      '<div class="p-row"><button class="btn p-close" type="button">' + T(UI.close) + '</button></div>';
    if (!list.length) sh.querySelector('.p-body').textContent = T(UI.empty);
    const ul = sh.querySelector('ul');
    list.forEach((l) => {
      const li = document.createElement('li');
      const s = STAMPS.find((x) => x.id === l.stamp);
      const d = l.day.split('-');
      li.innerHTML = '<button type="button"><b>' + (l.tanu ? '🐾' : (s ? s.icon : '🌺')) + '</b><span></span><em></em></button>';
      li.querySelector('span').textContent = replyText(l).split('\n')[0];
      li.querySelector('em').textContent = (l.tanu ? T(UI.fromTanu) + ' · ' : '') + (+d[1]) + '/' + (+d[2]);
      li.querySelector('button').addEventListener('click', () => readLetter(l));
      ul.appendChild(li);
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
    resetAll: () => { st = { letters: [] }; save(); refreshBadge(); },
    // 確認用：書いたお手紙を「昨日」にして、お返事が届いた状態にする
    testArrive: () => { st.letters.forEach((l) => { if (!l.tanu && l.day === today()) l.day = '2000-01-01'; }); save(); refreshBadge(); }
  };
};
