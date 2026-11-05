# タヌくん スマホ版（Webアプリ）引き継ぎメモ

最終更新：2026-11-05（第2章の絵がそろい、お試し版 matsuri/ ができた。次はセリフ）

## 📂 メモは3つに分けています（2026-11-03〜）
| ファイル | 中身 | いつ読む |
|---|---|---|
| **HANDOFF.md**（これ） | 入口：最初にやること・いまの状況・作業のコツ | **毎回、最初に全部読む** |
| **IDEAS.md** | 進み具合・これからの順番・案・保留・**決めた方針**・見た目のルール・約束 | **毎回読む**（5千字くらいまで） |
| **HANDOFF_LOG.md** | 過去の詳しい記録（倉庫。先頭に 2026-11-05 整理前の IDEAS.md 全文） | 必要なときだけ grep で検索して、その部分を読む |

**メモを書くときのルール（Claude 向け）**
- HANDOFF.md は **150行以内**に保つ。あふれたら、古い「作業ログ」は HANDOFF_LOG.md の先頭（説明の下）へ移す
- アイデアや状態が変わったら IDEAS.md を書きかえる（ログに足すだけにしない）
- 細かい仕様・数字は HANDOFF_LOG.md にあることが多い。分からないときは推測せず検索する

---

## 0. 新しいチャットはここから

**0. 最初にやること**
- ブランチ：**`claude/tanukun-washing-game-illustrations-4aa1g5`**（2026-11-04 夜〜11-05 のチャットは `claude/tanukun-tail-fluffy-redo-cildx2` で作業し、両方に同じ内容を push 済み）。始める前に `git fetch` → `git pull`。セッションごとに別名のブランチを指定されたら、そこにも同じ内容を push。**PR はまだ作っていない**（頼まれたら作る）
- ユーザーへの回答は日本語・専門用語は短く説明。ユーザーは Android でスマホの Claude アプリから確認することが多い
- **🔋 使用量の節約（2026-11-05 ユーザーの希望）**：細かな調整を続けている間は、**コードを直してコミット・push するだけ**。zip・確認用リンクの更新・playwright の画面テストは、**「確認したい」「zip にして」と言われたときだけ**まとめて行う
- **公開のしかたを聞かれたら `tanukun/PUBLISH.md` を見せる**（Cloudflare の画面で zip をアップロード：Preview（ブランチ名 test）→ Production）。**公開はユーザーの時間のあるときに一緒に進める**
- **本編の確認用リンク**：https://claude.ai/artifact/XApM945UdUziQMRXG8AQfH
  作り方：`python3 tools/build_preview.py --public --with-pon --out <scratchpad>/prev/tanukun.html` → Artifact で `read`（url）してから、同じ URL に publish（root＝`<scratchpad>/prev`、files に `pon/index.html`・`nikukyu/index.html`・`shippo/index.html`）。確認用リンクでは、ふれあいのあわが日数に関係なく出る（FR_ALL=true）。更新したら「一度閉じて開き直して」と伝える
- 公開用 zip：`python3 tools/build_app.py --base-url https://tanukun.pages.dev/` → `tanukun/app-dist.zip` を SendUserFile で渡す（「これまでの zip は使わないで」と添える。いまは248ファイル）
- **最初に IDEAS.md も読む**（公開中の中身・これからの順番・**第2章の仕様**・決めた方針はそちら）

**1. いまの状況（2026-11-05）**
- **🎉 v32 を公開した（2026-11-05 夜。Preview で確認 → Production。sw.js=tanukun-v32）**。ユーザー「見やすくて素晴らしい！」。中身は IDEAS.md。X のポスト文（3言語を1つのポストに）を渡した
- 🎉 2026-11-04 夜：**#タヌくん が X のトレンド入り**。お手紙は約7時間で60通（海外が約6割・ネガティブ0通・大人向けを求める内容が約1割 → 15歳以上の線は今のまま守る）
- 📊 Web Analytics（ボット除外・日本時間 10/30〜11/4）：訪問 1,550／2,857／**4,024（11/1 ピーク）**／2,880／2,098／2,225。/s/ のページビュー：p-pet 6,052・a-zh 3,046・c1 2,769・d1 2,765・h1 2,324・a-ja 2,296・p-pon 2,181・a-en 1,425・d2 1,174・h2 1,065・d3 1,035・h3 971・c3 967・c2 839・d4 790。**中国語の人がいちばん多い（a-* の約45％）**。目印は1日1台1回なので、ページビュー＝のべ台数・日。11/8〜9 に h4・h5・clear・c7・u-・m-・f-・n- の行と、c1・c2 の日別をもらう
- お手紙のシート（タヌくん用アカウント）はユーザーに閲覧者で共有済み（Google ドライブで「タヌくんへのお手紙（回答）」）。**中身はリポジトリに書かない**。これからはご意見（opinion）だけが届く
- 確認用リンク：本編 XApM945UdUziQMRXG8AQfH・ラリー SfWedDJpFXQSvHn7qrv5Ku・シーソー 8AqhncfTVjCjYipFd8S4M3・洗う 4HVCCUYvBmFUFg5t5kyMrr（どれも claude.ai/artifact/〇〇。`build_preview.py --rally` などで作り、read してから同じ URL に publish）
- 2026-11-05 夜にユーザーと話したこと（チャットで渡した）：アプリの客観的な評価（強み＝広告なしで毎日約1,000台・2日目も来る人約4割・中国語が最多／弱み＝7日目のあとが弱い・集客が X だけ・表現の性質で使えるサービスが限られる）、収益化の順番（0 兼業規程・税金・名前の切り離し → 1 応援〔1月ごろ・見通しは月数千〜1万円〕→ 2 イラストを売る〔本命〕→ 3 グッズ → 4 有料アプリ。アプリ内広告・お金で回すガチャはしない）、判断の目安（D7 10％以上・毎日来る台数1,000以上を1か月・f-miss-big 4割）

- 🏮 **2026-11-05 のチャット**：第2章の絵（14枚）がそろい、お試し版 `matsuri/`（index.html・img/・STORY.md）で最初から最後まで通して見られるようにした。絵の中身・流れ・決めたことは IDEAS.md の「🎯 次に作る」。あわせて、動画はプログラムで作る方針・TikTok と TikTok Shop は保留・国旗は使わない、を IDEAS.md に書いた

**2. 次にやること（新しいチャットはここから）**
1. ✍️ **第2章のセリフを決める**（いまの作業。ユーザーと相談しながら）
   - **2026-11-05 夜に決めたこと**：開き方は「0日目 序章／3日目 屋台／6日目 太鼓・休憩／9日目 夜・花火」の**日数だけ**（IDEAS.md の表）。序章と3日目のセリフは `matsuri/index.html` の `LINES` に反映済み（名前＝{name}、二択＝`choice`／`id`／`go`）。**残り：6日目（太鼓・休憩）と9日目（夜・花火）のセリフ**、名前の回数、9日目での「選んだ味」の思い出し
   - 3日目の新しい絵 `matsuri/img/yatai_cotton.webp`（綿あめ・縦。pic 13）・`yatai_corn.webp`（とうもろこし・横。pic 12）を追加。最初の屋台は必ず `yatai_eat.webp`（チョコバナナ。pic 3）で、そのあと二択。お試し版の右上「名前」ボタンで名前あり／なしを切りかえて確かめられる。確認用リンクの更新は頼まれたときだけ
   - 仮のセリフは `matsuri/index.html` の `LINES`（pic＝絵の番号、x・y＝絵のどこを見せるか、hint／drum／jiggle／sky＝演出）
   - 流れと決めたことは `matsuri/STORY.md`（下に「2026-11-05 ユーザーと決めた」）と IDEAS.md の「🎯 次に作る」
   - **ちゅ〜の場面は「余白」**：直前と分かる言葉・表現を入れない（今は「あ、あのね…！」「……」）。花火のあとのセリフもふれない。不器用さは動きで見せる
   - 決めてほしいこと：贈り物の場面「今日のお礼…と、それから…」を残すか／プレイヤーの呼び方（今は「キミ」）／英語・中国語はあとで
   - 決まったら LINES を書きかえ、お試し版（https://claude.ai/artifact/RBgu1drCUtDaXVCXGxvhnG）を更新
2. 🏮 本編につなぐ：クリア後の入り口・開く条件（ぽんぽこの記録の有無を先に調べる）・「お祭りの準備中」・公開した日のお知らせ・思い出アルバムの「第2章」・日英中・目印（k2-）。公開スイッチ（features）で隠したまま入れる。お試し版の作り（恋愛ゲームの形・ぷるん・ドン！・花火）を本編の画面に移す
3. 🎬 お祭りの見せ場15秒の縦長動画（mp4）をプログラムで作る（お試し版を playwright で録画 → ffmpeg。ffmpeg はこの環境にある）
4. 11/8〜9：Web Analytics の数字（上の「次にもらう」）を表にする
5. 11月中旬：ラリーを open（v33）

**4. 作業のコツ（このチャットでわかったこと）**
- お祭りのお試し版（matsuri/index.html）：絵のパスは相対（img/〇〇.webp）。更新は Artifact で同じ file_path を publish（新しい絵は files に `img/〇〇.webp` を足す）。ローカルで試すときは matsuri/ で `python3 -m http.server <ポート>`（ページに meta charset あり）。おなか・太鼓の場所は各絵の data-belly／data-drum（絵の中の px で「中心x,中心y,横半径,たて半径」）。絵の番号（pic）は .layer の並び順
- 新しい絵が届いたら：大きさ・**眉毛の色（白っぽい）**・牙・しま・15歳以上の線（腰みのの下を拡大）を確かめる。差し替え版は ImageChops.difference で、ちがう所がどこかを確かめる
- ローカルで試すとき：scratchpad の小さなサーバー（.html を UTF-8 で返す）を `run_in_background` で動かす（時間切れで止まるので、止まったら起動し直す）。肉球・しっぽのページは doctype がない形（確認用リンク向け）なので、build_app.py が頭を付ける
- playwright でのテスト：最初の「名前」と「お知らせ」を飛ばすには `ctx.addInitScript` で `localStorage['tanukun-save-v1'] = {nameAsked:true, noticeOk:true, totalDays:3}` を入れる。トップ画面はズームまで約3.8秒待つ。カードは y≈425（幅390×高さ844）
- テスト中になでなでを続けるとハートがたまって思い出（#event）が開き、クリックがふさがれる → `.ev-skip` を押すか、JS で click する
- app-dist を `python3 -m http.server <ポート>` で開く（build_app.py を作り直したら、ポートを変えて開き直す）。**`pkill -f "http.server"` は自分のシェルまで止めるので使わない**
- requestAnimationFrame の時刻は performance.now() より前のことがある → 時間の差は必ず 0 以上におさめる（スワイプが止まらなくなった原因）
- X の文字数：日本語・中国語は1文字2、英数字1、URL は23、上限280。scratchpad の小さな Python で数えてから渡す
- playwright でトップ画面を試すとき、占いが自動で出てカードがふさがれる → `localStorage['tanukun.uranai'] = JSON.stringify({autoOff:true})` も入れる。カードは `#home-next` で めくる
- お試し版（nikukyu・shippo）の確認用リンク：index.html の絵のパスを data URI にした1ファイルを scratchpad に作って Artifact に publish（同じファイルのパスで publish すると同じ URL）。絵の背景抜きは tools/make_shippo_art.py（make_seesaw_art の key_out）、肉球の範囲は tools/make_nikukyu_mask.py
- ユーザーの絵の差分（表情ちがい）は、元の絵と大きさが同じか・ちがう所が顔だけかを、PIL の ImageChops.difference で確かめてから使う（色が少しちがうので、重ねるときは顔の所だけ・ふちをぼかす）
- 15歳以上の線引き：新しい絵は、お股・おしりの合わさる所を必ず拡大して確かめる（2026-11-04：座って足の裏を見せるマゼンタ版は、葉っぱの下で内もも・おしりが合わさって見えたので使わなかった）

**5. これまでに決まったこと**：IDEAS.md の「🧭 決めた方針」にまとめた（前の詳しい版は HANDOFF_LOG.md の先頭）
