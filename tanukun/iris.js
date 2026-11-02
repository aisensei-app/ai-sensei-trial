/* =========================================================
   タヌくん ゲームに出入りするときの「丸く閉じて、丸く開く」（2026-11-02。マリオのステージに入るときのような演出）
   ・ページが切りかわる間に、アプリやブラウザの暗い背景が一瞬見えてしまう → わざと こげ茶の丸で閉じて、まぎれさせる
   ・閉じる：close(x, y) … (x, y) に向かって丸がしゅっと小さくなり、こげ茶でおおう（そのまま、おおったまま。0.65秒。2026-11-02 ユーザー「気持ち速すぎる」で 0.48→0.65）
   ・開く　：open(x, y)  … こげ茶の画面のまんなかから、丸がぱっと広がって消える
   ・cover() … すぐ、こげ茶でおおう（ページを開いたいちばん最初に。CSS の幕から引きつぐ）
   ・動いている間は、画面のタップを受けつけない（連打で、さらに先へ進まないように）
   使う所：本編のトップ画面 → ゲーム（app.js）、ゲーム → 本編（pon.js・rally.js）、それぞれのページを開いたとき
   なでなでへ行くときは、ページが切りかわらないので、今までどおりクリーム色の幕
   ========================================================= */
window.TanuIris = (function () {
  'use strict';
  const COLOR = '#3A2210';   // こげ茶（タヌくんの毛の濃い色）。index.html・pon・rally の head と CSS の幕も同じ色
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let el = null, token = 0;

  function ensure() {
    if (el && el.isConnected) return el;
    el = document.createElement('div');
    el.className = 'tanu-iris';
    el.setAttribute('aria-hidden', 'true');
    Object.assign(el.style, { position: 'fixed', inset: '0', zIndex: '2147483000', pointerEvents: 'auto', background: COLOR });
    document.body.appendChild(el);
    return el;
  }
  function paint(x, y, r) {
    el.style.background = r <= 0.5 ? COLOR
      : 'radial-gradient(circle at ' + x + 'px ' + y + 'px, rgba(58, 34, 16, 0) ' + r + 'px, ' + COLOR + ' ' + (r + 1.5) + 'px)';
  }
  // (x, y) から、画面のいちばん遠いすみまでの長さ（丸がこれより大きければ、画面はぜんぶ見える）
  const far = (x, y) => Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 4;
  const center = () => ({ x: innerWidth / 2, y: innerHeight / 2 });

  function run(x, y, from, to, ms, ease) {
    const my = ++token;
    return new Promise((done) => {
      const t0 = performance.now();
      (function step() {
        if (my !== token) { done(); return; }
        const k = Math.min(1, (performance.now() - t0) / ms);
        paint(x, y, from + (to - from) * ease(k));
        if (k < 1) requestAnimationFrame(step); else done();
      })();
    });
  }

  // ブラウザの「戻る」で、閉じたままの画面がそのまま復元されたとき（bfcache）は、丸く開いてもどす
  window.addEventListener('pageshow', (e) => { if (e.persisted && el) api.open(); });

  const api = {
    color: COLOR,
    cover: function () { token++; ensure(); el.style.background = COLOR; },
    // 閉じる：丸が (x, y) に向かって小さくなる → こげ茶のまま、少しだけ止まる（マリオのように「ためて」から次へ）
    close: function (x, y, ms) {
      const c = center();
      if (x == null) { x = c.x; y = c.y; }
      ensure();
      if (reduced()) { el.style.background = COLOR; return new Promise((r) => setTimeout(r, 60)); }
      return run(x, y, far(x, y), 0, ms || 650, (k) => k * k * (3 - 2 * k) * k)   // 最初ゆっくり、最後にしゅっ
        .then(() => new Promise((r) => setTimeout(r, 90)));
    },
    // 開く：こげ茶の画面のまんなかから、丸がぱっと広がる → 消える
    open: function (x, y, ms) {
      const c = center();
      if (x == null) { x = c.x; y = c.y; }
      ensure();
      if (reduced()) { token++; el.remove(); el = null; return Promise.resolve(); }
      paint(x, y, 0);
      const p = run(x, y, 0, far(x, y), ms || 560, (k) => 1 - Math.pow(1 - k, 3));   // ぱっと開いて、ゆっくり止まる
      const my = token;
      return p.then(() => { if (my === token && el) { el.remove(); el = null; } });
    }
  };
  return api;
})();
