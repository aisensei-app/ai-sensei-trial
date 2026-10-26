/* =========================================================
   タヌくん ことば（多言語）の土台
   いまは日本語だけ。ほかの言語を足すときは：
     1. LANGS に言語を足す（例：en: 'English'）
     2. セリフは lines.en.js をつくり、window.TANU_LINES_I18N.en = [ ... ] と書く
        （書き方は lines.js と同じ。訳がないセリフは、日本語のまま出る）
     3. 画面の文字は、下の TEXT に en: { キー: '訳' } を足す
        （HTML の data-i18n="キー" の所と、app.js の t('キー') の所が切りかわる）
   言語は、スマホの設定から自動で決まる（設定画面から変えることもできる）。
   ========================================================= */
window.TanuI18n = (function () {
  'use strict';

  const KEY = 'tanukun-lang';
  const LANGS = { ja: '日本語' };   // 使える言語（足すときは en: 'English' など）

  // 画面の文字（日本語がもと。ほかの言語にない文字は、日本語が出る）
  const TEXT = {
    ja: {}
  };

  function detect() {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && LANGS[saved]) return saved;
    } catch (e) {}
    const list = (navigator.languages || [navigator.language || 'ja']).map((l) => String(l).slice(0, 2));
    return list.filter((l) => LANGS[l])[0] || 'ja';
  }

  let lang = detect();
  document.documentElement.lang = lang;

  // t('キー', '日本語の文') … いまの言語の文。なければ日本語の文をそのまま返す
  function t(key, ja) {
    const d = TEXT[lang] || {};
    return d[key] != null ? d[key] : ja;
  }

  // HTML の data-i18n="キー" の文字を、いまの言語に入れかえる
  function apply(root) {
    if (lang === 'ja') return;
    (root || document).querySelectorAll('[data-i18n]').forEach((el) => {
      const v = (TEXT[lang] || {})[el.dataset.i18n];
      if (v != null) el.textContent = v;
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

  return { get lang() { return lang; }, LANGS: LANGS, t: t, apply: apply, set: set, lines: lines };
})();
