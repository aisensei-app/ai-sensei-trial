/* =========================================================
   タヌくん 遊び方の数え方（2026-11-01。だれのものかわからない形で、数だけを数える）
   ・サーバーは使わない。アプリの中に「目印のページ」（s/〇〇.html。中身は空）を置いて、
     その日はじめての出来事のときに、見えない小さな枠（iframe）で1回だけ開く。
   ・Cloudflare Pages の Web Analytics が、ふつうのページと同じように数える
     → Web Analytics の「Path（ページ別）」で /s/day7.html などの回数を見る
   ・送るのは「どの目印のページを開いたか」だけ。名前・記録の中身・ひとりひとりを見分ける番号は送らない
   ・同じ目印は、1日に1回まで（このスマホの中に、今日開いた目印を覚えておく）
   ・数えるのは本番（config.js の stats.hosts の場所）だけ。手元・確認用リンク・お試し版では数えない

   目印の一覧（s/ の中。tools/build_app.py が作る。名前を足したら NAMES にも足す）
     c1 c2 c3 c7 c14 c30 … はじめて来た日から〇日目（その日に来たときだけ。続けて来てくれる割合を見る）
     d1〜d10 d15 d20 d30 d50 d100 … なかよし〇日目（のべ日数）になった日
     a-ja a-en a-zh … その日に来た（言語ごと。1日に1人1回なので、毎日来る人のおおよその数）
     h1〜h5 clear … ハートが〇個になった・クリアした
     p-pet p-pon p-rally p-seesaw p-wash … その日に、なでなで・ぽんぽこ・ラリー・シーソー・洗うゲームで遊んだ
     u-show u-pick u-later … 貝がら占い：自動で出た・貝を選んだ・「あとで」を押した（2026-11-03）
     m-open m-send m-read … 📮 ポスト：開いた・お手紙を書いた・お返事を読んだ
     f-〇〇 … おたより（感想）：出た・あとで・おくった・もっと書く／なくなったら（とても・少し・気にならない）／好きな所（おなか・タヌくん・絵・ゲーム・セリフ）
   ========================================================= */
window.TanuStats = (function () {
  'use strict';

  const C = window.TANU_CONFIG || {};
  const S = C.stats || {};
  const NAMES = ['c1', 'c2', 'c3', 'c7', 'c14', 'c30',
    'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10', 'd15', 'd20', 'd30', 'd50', 'd100',
    'a-ja', 'a-en', 'a-zh', 'h1', 'h2', 'h3', 'h4', 'h5', 'clear', 'p-pet', 'p-pon', 'p-rally', 'p-seesaw', 'p-wash',
    'u-show', 'u-pick', 'u-later',
    'f-show', 'f-later', 'f-send', 'f-more', 'f-miss-big', 'f-miss-some', 'f-miss-no',
    'f-like-belly', 'f-like-tanu', 'f-like-art', 'f-like-game', 'f-like-line',
    'm-open', 'm-send', 'm-read'];
  const KEY = 'tanukun-stats';
  // 数える場所か（本番の URL のときだけ）
  const on = S.on !== false && /^https?:$/.test(location.protocol) && (S.hosts || []).indexOf(location.hostname) >= 0;
  // ページの場所から見た s/ の場所（本編は 's/'、ぽんぽこ・ラリー・シーソー・洗うゲームは '../s/'）
  // 2026-11-04：シーソー・洗うゲームが抜けていて、p-seesaw・p-wash が /seesaw/s/… を開いて数えられていなかったのを直した
  const base = /\/(pon|rally|seesaw|washing)\//.test(location.pathname) ? '../s/' : 's/';

  // 今日の日付（日付の切りかわりは、本編と同じ午前4時。save.js の today と同じ考え）
  function today() {
    const d = new Date();
    d.setHours(d.getHours() - ((C.days && C.days.dayStartHour) || 0));
    const p = (n) => (n < 10 ? '0' : '') + n;
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }

  // 目印を1つ送る（今日もう送っていれば、何もしない）
  function ping(name) {
    if (!on || NAMES.indexOf(name) < 0) return;
    const t = today(), m = load();
    if (m.day !== t) { m.day = t; m.sent = []; }
    if (m.sent.indexOf(name) >= 0) return;
    m.sent.push(name);
    try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) { return; }   // 覚えられない環境では送らない（何度も送らないように）
    // 見えない小さな枠で目印のページを開く（数え終わるころに片づける）
    const f = document.createElement('iframe');
    f.src = base + name + '.html';
    f.title = '';
    f.setAttribute('aria-hidden', 'true');
    f.tabIndex = -1;
    f.style.cssText = 'position:absolute;width:1px;height:1px;left:-9999px;top:0;border:0;opacity:0;pointer-events:none';
    const add = () => { document.body.appendChild(f); setTimeout(() => f.remove(), 8000); };
    // 画面の動きのじゃまにならないように、少し待ってから
    setTimeout(add, 1500 + Math.random() * 1500);
  }

  // 本編で、その日はじめて開いたとき（app.js の checkIn のあと）：日数・言語の目印
  //   firstDay・day は 'YYYY-MM-DD'、total はなかよし〇日目（のべ日数）
  function checkIn(o) {
    if (!on || !o) return;
    ping('a-' + (o.lang || 'ja'));
    const n = Number(o.total) || 0;
    if (n >= 1 && (n <= 10 || [15, 20, 30, 50, 100].indexOf(n) >= 0)) ping('d' + n);
    if (o.firstDay && o.day) {
      const ms = Date.UTC.apply(null, o.day.split('-').map((v, i) => i === 1 ? v - 1 : +v)) -
        Date.UTC.apply(null, o.firstDay.split('-').map((v, i) => i === 1 ? v - 1 : +v));
      const c = Math.round(ms / 86400000) + 1;   // はじめて来た日が1日目
      if ([1, 2, 3, 7, 14, 30].indexOf(c) >= 0) ping('c' + c);
    }
  }

  return { ping: ping, checkIn: checkIn, NAMES: NAMES, get on() { return on; } };
})();
