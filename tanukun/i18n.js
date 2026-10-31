/* =========================================================
   タヌくん ことば（多言語）
   いまは日本語と英語。言語は、スマホの言語の設定から自動で決まる（設定の「ことば / Language」で変えられる）。
   英語は、公開スイッチ（config.js の features.english）が 'open' のときだけ使える（それまでは日本語だけ）。

   ほかの言語を足すときは：
     1. LANGS に言語を足す（例：fr: 'Français'）
     2. セリフは lines.〇〇.js に window.TANU_LINES_I18N.〇〇 = [ ... ]（英語は tools/make_lines_en.py でつくる）
     3. 設定の文（思い出・お知らせなど）は config.〇〇.js に window.TANU_CONFIG_I18N.〇〇 = { ... }（書いた所だけ上書き）
     4. 画面の文字は、下の TEXT に 〇〇: { '日本語の文': '訳' } を足す
        ・app.js では tr('日本語の文') の所、HTML では data-i18n を付けた所（中の日本語で引く）が切りかわる
        ・文の中の数などは {n} のように書く（例：tr('れんぞく {n} 日', { n: 3 })）
        ・訳を「1のとき|それ以外」と書くと、n が 1 のときは左を使う（英語の単数・複数。例：'{n} day|{n} days'）
   訳がない文は、日本語のまま出ます。
   ========================================================= */
window.TanuI18n = (function () {
  'use strict';

  const KEY = 'tanukun-lang';
  const C = window.TANU_CONFIG || {};
  // 使える言語。英語は公開スイッチが 'open' のときだけ（書いていなければ 'open'）
  const LANGS = { ja: '日本語' };
  const EN = (C.features && C.features.english) || 'open';
  if (EN === 'open') LANGS.en = 'English';

  /* 画面の文字（日本語の文で引く）。英語のときの訳 */
  const TEXT = {
    en: {
      // メニュー・はじめての名前
      'なかよし': 'Day',
      '日目': '',
      '‹ もどる': '‹ Back',
      '遊ぶ': 'Play',
      '実績': 'Records',
      'きせかえ': 'Dress-up',
      '設定': 'Settings',
      '🥁 ぽんぽこリズム': '🥁 Ponpoko Rhythm',
      '🏐 ぽよんラリー': '🏐 Poyon Rally',
      '🔒 もうすぐ': '🔒 Soon',
      'ぽんぽこリズムは、もうすぐ遊べるよ！\nおたのしみに 🥁': 'Ponpoko Rhythm is coming soon!\nStay tuned 🥁',
      'ぽよんラリーは、もうすぐ遊べるよ！\nおたのしみに 🏐': 'Poyon Rally is coming soon!\nStay tuned 🏐',
      '呼んでほしい名前': 'What should I call you?',
      'これでOK': 'OK!',
      'あとできめる': 'Decide later',
      '名前はこのスマホの中だけに保存されます（ニックネームでOK）': 'Your name is saved only on this device (a nickname is fine)',
      'とじる': 'Close',
      'タップしてつづける': 'Tap to continue',
      'タヌくん': 'Tanu-kun',
      'なかよし度': 'Friendship',
      'はじめまして！タヌくんだよ\nなんて呼んだらいい？': 'Hi there! I\'m Tanu-kun\nWhat should I call you?',
      'なにしてあそぶ？': 'What should we play?',
      'ふぁ…？': 'Fwa…?',
      'すぴー… すぴー…': 'Zzz… zzz…',
      'ブワッ！': 'POOF!',
      'ぶるるん♪': 'Wobble♪',
      '頭': 'head', 'むね': 'chest', 'おなか': 'belly', 'しっぽ': 'tail', 'おまた': 'secret spot',
      '{p}をさわる': 'Touch {p}',
      // ハート・日付
      '{h}時間': '{h}h ', '{m}分': '{m}m',
      '今日のハートは ここまで！🌙': 'That\'s all the hearts for today! 🌙',
      'また明日なかよくしよう': 'Let\'s hang out again tomorrow',
      'あと {t} で、またためられるよ': 'You can earn more in {t}',
      '🌙 あと{t}': '🌙 {t} left',
      'れんぞく {n} 日': '{n}-day streak|{n}-day streak',
      '💖 ハートをゲット！': '💖 You got a heart!',
      '来てくれてありがとう！ 💗+{n}': 'Thanks for coming! 💗+{n}',
      'ぽんぽこリズムの ごほうび 💗+{n}': 'Ponpoko Rhythm reward 💗+{n}',
      'ぽよんラリーの ごほうび 💗+{n}': 'Poyon Rally reward 💗+{n}',
      // 思い出
      '📖 思い出アルバムに追加されました': '📖 Added to your Memory Album',
      'ハートが {n}こ たまった！': 'Heart #{n} unlocked!',
      'ひみつの思い出が ひらいた…！': 'A secret memory has opened…!',
      'タヌくんとの思い出「{t}」': 'A memory with Tanu-kun: "{t}"',
      // クリア・ホーム画面
      'タヌくんと、ずっと一緒の約束をしたよ🌺\n（なかよし{n}日目でクリア！）': 'I promised to stay with Tanu-kun forever🌺\n(Cleared on day {n}!)',
      '#タヌくん': '#Tanukun',
      '🌺 クリアおめでとう！': '🌺 Congratulations, you cleared it!',
      'ここまで遊んでくれて、ほんとうにありがとう！': 'Thank you so much for playing all this way!',
      'これからも、タヌくんに会いにきてね。<br>思い出は「実績」のアルバムで見返せるよ': 'Please keep coming to see Tanu-kun.<br>You can revisit memories in the album under "Records"',
      '📱 ホーム画面に追加しよう': '📱 Add to your Home Screen',
      'タヌくんを<b>ホーム画面に追加</b>すると、すぐ会いにこられて、なかよしの記録も消えにくくなるよ。': 'Add Tanu-kun to your <b>Home Screen</b> to visit anytime — your progress is also less likely to be lost.',
      'iPhone：共有ボタン →「ホーム画面に追加」<br>Android：右上のメニュー →「ホーム画面に追加」': 'iPhone: Share button → "Add to Home Screen"<br>Android: Menu (top right) → "Add to Home screen"',
      // なでなでレポート
      'タヌくんと遊んだよ！（なかよし{n}日目）': 'I played with Tanu-kun! (Day {n})',
      'なでなでレポート': 'Pat Report',
      'なかよし {n} 日目　': 'Day {n}　',
      'ひみつ': 'secret',
      '{n} 回': '{n}×',
      '𝕏 でポストする': 'Post on 𝕏',
      '📤 アプリでシェア': '📤 Share via app',
      '📋 文章をコピー': '📋 Copy text',
      '✅ コピーしました': '✅ Copied',
      'X のログイン画面が出たら、「アプリでシェア」から X アプリを選んでね': 'If the X login screen appears, use "Share via app" and pick the X app',
      'X のログイン画面が出たら、「文章をコピー」して X アプリに貼りつけてね': 'If the X login screen appears, "Copy text" and paste it into the X app',
      // 実績
      '{n} 日': '{n} day|{n} days',
      '{a} 日 ／ {b} 日': '{a} / {b} days',
      'れんぞく（いま／最高）': 'Streak (now / best)',
      '頭をなでた': 'Head pats',
      'むねをさわった': 'Chest touches',
      'おなかをさわった': 'Belly touches',
      'しっぽをさわった': 'Tail touches',
      'おまたをさわった': 'Secret spot touches',
      '？？？をさわった': '??? touches',
      'とろけさせた': 'Times melted',
      '怒らせちゃった': 'Times made angry',
      'セリフ図鑑': 'Line collection',
      '📖 思い出アルバム（{a} ／ {b}）': '📖 Memory Album ({a} / {b})',
      '💖{n}で見られる': 'Unlocks at 💖{n}',
      'きろく': 'Stats',
      'バッジ（実績のごほうび）は準備中だよ': 'Badges (rewards) are coming soon',
      // きせかえ
      'なし': 'None',
      'まだ部品がないよ': 'No items yet',
      'なかよし度（💖）が上がると、付けられる部品が増えるよ': 'More items unlock as your friendship (💖) grows',
      // 設定
      '呼び名': 'Your name',
      '名前なし': 'No name',
      '変更': 'Change',
      '空にすると、名前なしで話しかけます': 'If left empty, Tanu-kun won\'t use a name',
      'このアプリ': 'About',
      'このアプリについて': 'About this app',
      '記録': 'Progress',
      '記録はこのスマホのブラウザの中だけに保存されます。': 'Your progress is saved only in this browser on this device. ',
      '<b>ホーム画面に追加</b>して使うと、記録が消えにくくなります。': 'Adding the app to your <b>Home Screen</b> makes it less likely to be lost.',
      '記録をリセット': 'Reset progress',
      '本当に消す？（もう一度押す）': 'Really delete? (tap again)'
    }
  };

  function detect() {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && LANGS[saved]) return saved;
    } catch (e) {}
    const list = (navigator.languages || [navigator.language || 'ja']).map((l) => String(l).slice(0, 2));
    // 日本語より先に英語が来たら英語。日本語でも英語でもない言語は、英語があれば英語にする
    const hit = list.filter((l) => LANGS[l])[0];
    if (hit) return hit;
    return LANGS.en ? 'en' : 'ja';
  }

  // ほかのページの訳（ぽよんラリーの rally.i18n.js など。i18n.js より先に読みこむ）を足す
  const more = window.TANU_TEXT_I18N || {};
  Object.keys(more).forEach((l) => { TEXT[l] = Object.assign(TEXT[l] || {}, more[l]); });

  let lang = detect();
  document.documentElement.lang = lang;

  // tr('日本語の文', { n: 3 }) … いまの言語の文（なければ日本語のまま）。{n} などを入れかえる
  function tr(ja, vars) {
    const d = TEXT[lang] || {};
    let s = d[ja] != null ? d[ja] : ja;
    if (s.indexOf('|') >= 0 && d[ja] != null) s = s.split('|')[vars && Number(vars.n) === 1 ? 0 : 1];
    if (vars) Object.keys(vars).forEach((k) => { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }
  // 前からある書き方：t('キー', '日本語の文')
  function t(key, ja) {
    const d = TEXT[lang] || {};
    return d[key] != null ? d[key] : tr(ja);
  }

  // HTML の data-i18n を付けた所を、いまの言語に入れかえる（中の日本語の文で引く。
  // data-i18n="キー" と書けばキーで引く）。data-i18n-attr="placeholder aria-label" で属性も
  function apply(root) {
    if (lang === 'ja') return;
    (root || document).querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n || el.textContent.trim();
      el.textContent = tr(key);
    });
    (root || document).querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(/\s+/).forEach((a) => { if (el.hasAttribute(a)) el.setAttribute(a, tr(el.getAttribute(a))); });
    });
  }

  function set(l) {
    if (!LANGS[l]) return;
    try { localStorage.setItem(KEY, l); } catch (e) {}
    location.reload();
  }

  // いまの言語のセリフ集（訳がないときは日本語）
  function lines() {
    const ex = (window.TANU_LINES_I18N || {})[lang];
    return lang !== 'ja' && ex && ex.length ? ex : (window.TANU_LINES || []);
  }

  // 設定の文を、いまの言語で上書きする（config.〇〇.js。書いた所だけ。配列は同じ順番の所に重ねる）
  function overlay(base, over) {
    if (Array.isArray(over)) {
      over.forEach((v, i) => {
        if (v && typeof v === 'object' && base[i] && typeof base[i] === 'object') overlay(base[i], v);
        else if (v != null && !(typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)) base[i] = v;
      });
      return base;
    }
    Object.keys(over).forEach((k) => {
      const v = over[k];
      if (v && typeof v === 'object' && base[k] && typeof base[k] === 'object') overlay(base[k], v);
      else base[k] = v;
    });
    return base;
  }
  const extra = (window.TANU_CONFIG_I18N || {})[lang];
  if (lang !== 'ja' && extra && window.TANU_CONFIG) overlay(window.TANU_CONFIG, extra);

  return { get lang() { return lang; }, LANGS: LANGS, t: t, tr: tr, apply: apply, set: set, lines: lines };
})();
