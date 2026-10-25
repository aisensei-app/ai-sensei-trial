/* =========================================================
   タヌくん お試し版の設定（X から開いてもらう体験版）
   お試し版を作るときだけ読み込まれます（tools/build_demo.py）。
   ・頭なで（とろける）と、おなかぽんぽこ だけ
   ・名前入力・何日目・なかよし度はなし。開いたらすぐ遊べる
   ・遊んだ内容から「診断」して、結果を X にポストできる
   ========================================================= */
window.TANU_DEMO = {

  // 公開する場所の URL（最後は / で終わる）。build_demo.py が書きかえます
  baseUrl: '',

  // この回数さわると「診断」できるようになる
  resultAfter: 5,

  // 結果画面の「フォローしてね」に出す X のアカウント（@ はつけない。空にするとボタンを出さない）
  followId: 'Conchan_AIart',

  // ポストにつけるハッシュタグ（# はつけない）
  hashtag: 'タヌくん',

  /* 診断結果（上から順に、条件に合った最初のものになる）
     c … 遊んだ回数 { head（頭）, melt（とろけ）, belly（おなか）, angry（怒らせた） }
     face … 結果画面に出す絵（config.js の images の名前） */
  results: [
    { id: 'yarisugi', title: 'やりすぎ注意報',   face: 'angry',
      comment: 'さわりすぎ〜！…でも、きらいじゃないよ',
      when: (c) => c.angry >= 1 },
    { id: 'torokeshi', title: 'とろけさせ名人', face: 'melt',
      comment: 'なでるの、じょうずすぎ…ふにゃ〜',
      when: (c) => c.melt >= 2 },
    { id: 'ponpoko', title: 'ぽんぽこ職人',     face: 'ponpoko1',
      comment: 'いい音、出してくれるね〜♪',
      when: (c) => c.belly > c.head },
    { id: 'nadenade', title: 'なでなで上手',    face: 'shy',
      comment: 'なでられるの、すき〜',
      when: () => true }
  ],

  // ポストの文章
  shareText: (r) => 'タヌくんに「' + r.title + '」って言われた！\nさわって遊べるタヌくん、お試し中🦝'
};

/* お試し版では、頭とおなかだけさわれるようにする（胸・しっぽは本編のお楽しみ） */
(function () {
  const C = window.TANU_CONFIG;
  delete C.zones.chestL;
  delete C.zones.chestR;
  delete C.zones.tail;
  delete C.zones.crotch;
  C.crotch = null;   // おまたの反応（ふくらみ）も使わない
  if (C.chestJiggle) C.chestJiggle.gain = 0;
})();
