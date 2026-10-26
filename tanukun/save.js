/* =========================================================
   タヌくん 記録（セーブデータ）
   何日目・なかよし度・遊んだ回数などを、スマホのブラウザの中に保存します。
   サーバーには何も送りません。

   ・ブラウザのデータを消すと記録も消えます。
   ・iPhone の Safari は、しばらく開かないと消すことがあります。
     「ホーム画面に追加」して使うと消えにくくなります。

   動作確認用：URL の最後に ?today=2026-11-03 を付けると、
   その日付に開いたことにできます（日付をまたぐ動きの確認用）。
   ?hearts=5 を付けると、なかよし度（ハートの数）をその数にできます（記録は変わりません）。
   ========================================================= */
window.TanuSave = (function () {
  'use strict';

  const C = window.TANU_CONFIG;
  const KEY = 'tanukun-save-v1';

  function blank() {
    return {
      version: 1,
      name: '',              // 呼んでほしい名前（空なら名前なし）
      nameAsked: false,      // 最初の「なんて呼んだらいい？」を済ませたか
      firstDay: null,        // はじめて開いた日（'2026-10-24' の形）
      lastDay: null,         // 最後に開いた日
      totalDays: 0,          // のべ日数（なかよし○日目）
      streak: 0,             // 連続日数
      bestStreak: 0,         // 連続日数の最高記録
      points: 0,             // なかよしポイント（ハートのもと）
      tapPointsDay: null,    // 今日のタップポイントを数えている日
      tapPointsToday: 0,     // 今日タップでもらったポイント
      stats: {               // 実績用の記録
        tap: { head: 0, chest: 0, belly: 0, tail: 0, crotch: 0 },
        melt: 0,
        angry: 0,
        hiddenTap: 0
      },
      seenLines: [],         // 見たことのあるセリフ（セリフ図鑑用）
      wear: {},              // 付けているきせかえパーツ（場所 → 部品の id。例 { navel: 'debeso' }）
      heart5Day: null,       // ハートが最大になった日（のべ日数）。クリアの計算に使う
      cleared: false,        // ひみつの思い出を見た（クリアした）
      clearDay: null,        // クリアした日（のべ日数）
      a2hsShown: false       // 「ホーム画面に追加」の案内を出した
    };
  }

  // 古い記録に新しい項目が足りなくても動くように、空の記録に重ねる
  function merge(base, saved) {
    Object.keys(saved || {}).forEach((k) => {
      const v = saved[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') {
        merge(base[k], v);
      } else {
        base[k] = v;
      }
    });
    return base;
  }

  let data = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = merge(blank(), JSON.parse(raw));
  } catch (e) { /* 保存できない環境では、その回だけの記録になります */ }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  /* ---------- 日付 ---------- */
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const testDay = (location.search.match(/[?&]today=(\d{4}-\d{2}-\d{2})/) || [])[1];
  let testHearts = (location.search.match(/[?&]hearts=(\d)/) || [])[1];

  // 「今日」を 'YYYY-MM-DD' で返す（config.js の dayStartHour 時に日付が変わる）
  function today() {
    if (testDay) return testDay;
    const d = new Date(Date.now() - (C.days.dayStartHour || 0) * 3600 * 1000);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function daysBetween(a, b) {
    const t = (s) => { const p = s.split('-'); return Date.UTC(+p[0], p[1] - 1, +p[2]); };
    return Math.round((t(b) - t(a)) / 86400000);
  }

  /* ---------- 来てくれた日を記録 ----------
     戻り値の visit：
       first    … はじめて
       new      … 今日はじめて（前日にも来ている）
       comeback … 今日はじめて（2日以上あいた）
       again    … 今日2回目以降 */
  function checkIn() {
    const d = today();
    if (data.lastDay === d) return { visit: 'again' };

    let visit;
    if (!data.lastDay) {
      visit = 'first';
      data.firstDay = d;
      data.streak = 1;
    } else if (daysBetween(data.lastDay, d) === 1) {
      visit = 'new';
      data.streak += 1;
    } else {
      visit = 'comeback';
      data.streak = 1;
    }
    data.lastDay = d;
    data.totalDays += 1;
    data.bestStreak = Math.max(data.bestStreak, data.streak);
    const before = hearts();
    data.points += C.friendship.visitPoints;
    markMax();
    save();
    return { visit: visit, heartUp: hearts() > before };
  }

  /* ---------- なかよしポイント（タップ）----------
     1日の上限つき。戻り値 { added: ポイントが入ったか, heartUp: ハートが増えたか } */
  function addTapPoint() {
    const d = today();
    if (data.tapPointsDay !== d) { data.tapPointsDay = d; data.tapPointsToday = 0; }
    if (data.tapPointsToday >= C.friendship.tapDailyMax) return { added: false, heartUp: false };
    const before = hearts();
    data.tapPointsToday += C.friendship.tapPoints;
    data.points += C.friendship.tapPoints;
    markMax();
    save();
    return { added: true, heartUp: hearts() > before };
  }

  // ハートが最大になった日を覚えておく（確認用のハート切りかえのときは覚えない）
  function markMax() {
    if (data.heart5Day == null && testHearts == null && hearts() >= C.friendship.heartAt.length) data.heart5Day = data.totalDays;
  }

  // ひみつの思い出（クリア）を見られる日か
  function clearReady() {
    const after = (C.clear && C.clear.afterDays) || 0;
    return !data.cleared && data.heart5Day != null && data.totalDays - data.heart5Day >= after;
  }
  function setCleared() {
    if (!data.cleared) { data.cleared = true; data.clearDay = data.totalDays; save(); }
  }
  function setFlag(key) { data[key] = true; save(); }

  // 今日のタップのポイントが上限に達したか
  function tapCapped() {
    return data.tapPointsDay === today() && data.tapPointsToday >= C.friendship.tapDailyMax;
  }

  /* 次のハートまで、どのくらいたまったか（0〜1）。ハートが最大なら 1。
     例：ハート2個（50）と3個（120）のあいだで 85 ポイントなら 0.5 */
  function heartProgress() {
    const at = C.friendship.heartAt, n = hearts();
    if (n >= at.length) return 1;
    if (testHearts != null) return 0;
    const prev = n ? at[n - 1] : 0;
    return Math.max(0, Math.min(1, (data.points - prev) / (at[n] - prev)));
  }

  // ハートの数（0〜最大）
  function hearts() {
    if (testHearts != null) return Math.min(+testHearts, C.friendship.heartAt.length);
    return C.friendship.heartAt.filter((p) => data.points >= p).length;
  }

  /* ---------- 実績用の記録 ---------- */
  function count(path) {
    if (path.indexOf('tap.') === 0) {
      const p = path.slice(4);
      data.stats.tap[p] = (data.stats.tap[p] || 0) + 1;
    }
    else data.stats[path] = (data.stats[path] || 0) + 1;
    save();
  }

  function seeLine(text) {
    if (data.seenLines.indexOf(text) >= 0) return;
    data.seenLines.push(text);
    save();
  }

  /* ---------- 呼び名 ---------- */
  const NAME_MAX = 10;
  function setName(name) {
    data.name = String(name || '').trim().slice(0, NAME_MAX);
    data.nameAsked = true;
    save();
  }

  /* ---------- きせかえ ----------
     id が空なら、その場所の部品をはずす */
  function setWear(slot, id) {
    if (id) data.wear[slot] = id;
    else delete data.wear[slot];
    save();
  }

  /* 確認用：なかよし度（ハートの数）を一時的に変える。null で元に戻す（記録は変わらない） */
  function setTestHearts(n) { testHearts = n == null ? undefined : n; }

  function reset() {
    data = blank();
    save();
  }

  return {
    get data() { return data; },
    today: today,
    checkIn: checkIn,
    addTapPoint: addTapPoint,
    tapCapped: tapCapped,
    clearReady: clearReady,
    setCleared: setCleared,
    setFlag: setFlag,
    heartProgress: heartProgress,
    hearts: hearts,
    count: count,
    seeLine: seeLine,
    setName: setName,
    NAME_MAX: NAME_MAX,
    setWear: setWear,
    setTestHearts: setTestHearts,
    get testHearts() { return testHearts == null ? null : +testHearts; },
    reset: reset
  };
})();
