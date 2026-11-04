# タヌくん スマホ版（Webアプリ）引き継ぎメモ

最終更新：2026-11-05（見た目をそろえた・メモを整理して短くした）

## 📂 メモは3つに分けています（2026-11-03〜）
| ファイル | 中身 | いつ読む |
|---|---|---|
| **HANDOFF.md**（これ） | 入口：最初にやること・いまの状況・作業のコツ | **毎回、最初に全部読む** |
| **IDEAS.md** | 進み具合・これからの順番・案・保留・**決めた方針**・見た目のルール・約束 | **毎回読む**（1万字くらいまで） |
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
- 公開用 zip：`python3 tools/build_app.py --base-url https://tanukun.pages.dev/` → `tanukun/app-dist.zip` を SendUserFile で渡す（「これまでの zip は使わないで」と添える。いまは215ファイル）
- **最初に IDEAS.md も読む**（v32 の中身・これからの順番・決めた方針はそちら）

**1. いまの状況（2026-11-05）**
- **公開中は v31**（tanukun.pages.dev。sw.js=tanukun-v31）。**プレビュー（test）には古い v32**（ラリー open の版）が上がっている
- **📦 v32 はできている・未公開**（sw.js=`tanukun-v32`。中身は IDEAS.md）。最後に渡した zip のあとも変更があるので、**公開の前に build_app.py で作り直して渡す**
- **プレビューで確かめてほしいこと**：ラリーのカードが出ない／なでなでのあわ（日数しだい）→ 肉球・しっぽ → もどると葉っぱ1枚／おなかを何回もタップしてちらつかない／ポストの 💌・✉️／太ももの「ぷにっ」／お股の反応がいつもどおり
- 🎉 2026-11-04 夜：**#タヌくん が X のトレンド入り**。お手紙は約7時間で60通（海外が約6割・ネガティブ0通・大人向けを求める内容が約1割 → 15歳以上の線は今のまま守る）
- お手紙のシート（タヌくん用アカウント）はユーザーに閲覧者で共有済み（Google ドライブで「タヌくんへのお手紙（回答）」）。**中身はリポジトリに書かない**。これからはご意見（opinion）だけが届く
- 🎨 見た目そろえ（ぽんぽこ・ラリー・シーソー・洗う）：2026-11-05 確認用リンク4つ（本編 XApM945…・ラリー SfWedDJpFXQSvHn7qrv5Ku・シーソー 8AqhncfTVjCjYipFd8S4M3・洗う 4HVCCUYvBmFUFg5t5kyMrr）でユーザー OK

**2. 次にやること（まずユーザーと相談）**：IDEAS.md の「🗺️ これからの順番」。いちばん近いのは **v32 の公開**（zip を作り直す → Preview → スマホで確認 → Production）と、11/8ごろの Web Analytics の表

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
