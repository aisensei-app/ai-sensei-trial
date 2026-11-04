# タヌくん スマホ版（Webアプリ）引き継ぎメモ

最終更新：2026-11-05 夜（v32 を公開・第2章「島の夜祭り」の形が決まった）

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

**2. 次にやること（新しいチャットはここから）**
- 🏮 2026-11-05：ユーザーが第2章の序章の絵を3枚描いた（matsuri/img：カフェでお誘い cafe_invite・同じ背景でにっこり cafe_happy＝横長1536×1024／昼の会場の入り口 gate_day＝縦長1024×1536）。**昼から始めて、だんだん夜にする**。横長は描き直さず、恋愛ゲームの形（上に絵・下にセリフの枠。セリフごとに見る所がゆっくり動く）でお試し中 → matsuri/index.html。屋台の絵2枚（yatai_eat：チョコバナナ・ほっぺにチョコ／yatai_full：食べ終えて大笑い。どちらも縦長・昼）も入れ、おなかをタップすると「ぷるん」（canvas の網目変形。BELLY の楕円は絵の中の位置）。お話のたたき台は matsuri/STORY.md（確認用リンク https://claude.ai/artifact/RBgu1drCUtDaXVCXGxvhnG 。同じファイルのパスで publish すると同じ URL）。今後の絵は縦長 2:3 でそろえてもらうのがおすすめ、と伝えた
1. 🏮 **第2章「島の夜祭り」**（仕様は IDEAS.md の「🎯 次に作る」）：まず**お祭りの夜の背景**と**①太鼓の練習（はっぴ）**の絵の頼み方の文（プロンプト）を下書きして渡す。絵のコツ＝「今の絵の表情だけ直して」の形・normal.webp を添付・等身を言葉で書く（前の例は pon/ILLUST_PROMPTS.md・uranai/ILLUST_PROMPTS.md・post/ILLUST_PROMPTS.md）
2. 絵を待つ間にプログラム：クリア後の招待状・条件の判定（ぽんぽこの記録の有無を先に調べる）・「お祭りの準備中」・公開した日のお知らせ・なでなでの画面の 🏮・背景の切りかえ・小物のきせかえ・目印。公開スイッチ（features）で隠したまま入れる
3. 11/8〜9：Web Analytics の数字（上の「次にもらう」）を表にする
4. 11月中旬：ラリーを open（v33）

**4. 作業のコツ（このチャットでわかったこと）**
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
