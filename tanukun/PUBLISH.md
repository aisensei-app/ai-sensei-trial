# タヌくん 公開のしかた（Cloudflare の画面でアップロード）

いつもの手順のまとめ（2026-11-02）。コマンドは使わず、Cloudflare の画面に zip をアップロードする。
**いきなり本番に上げず、必ず「① Preview で確認」→「② 本番」の2段階で。**

## 0. 準備（Claude がやること）
- Claude が `python3 tools/build_app.py --base-url https://tanukun.pages.dev/` で **app-dist.zip** を作って渡す
- 中身を変えたら sw.js の版（`tanukun-v○○`）を上げる（上げないと、遊んでいる人のスマホに新しい版が届かない）

## ① Preview（確認用の場所）に上げる
1. パソコンで Cloudflare を開く → https://dash.cloudflare.com/?to=/:account/pages/view/tanukun
   （Workers & Pages の一覧に出ないことがあるので、このリンクから）
2. 右上の **「Create deployment」**（デプロイを作成）を押す
3. **Environment（環境）で「Preview」** を選ぶ → **ブランチ名に `test`** と入れる
4. **app-dist.zip** をドラッグ（または選択）してアップロード
5. **「Save and deploy」** を押して、終わるまで待つ
6. スマホで **https://test.tanukun.pages.dev/** を開いて確認する
   - できれば Android と iPhone、X アプリの中（自分のポストのリンクから）でも
   - 前の版が出るときは、ページを2回ほど読みこみ直す（スマホに古い版が残っているため）

## ② 本番（Production）に上げる
1. もう一度 **「Create deployment」**
2. **Environment は「Production」のまま**
3. **同じ app-dist.zip** をアップロード → **「Save and deploy」**
4. スマホで **https://tanukun.pages.dev/** を開いて確認（読みこみ直しを2回ほど）

## ③ 公開したあと
- X に告知のポスト（URL のカードの絵が出るまで、数分かかることがある）
- 数日たったら、Web Analytics（tanukun →「Metrics」）のスクリーンショットを Claude に見せて分析してもらう

## 困ったとき
- アップロードした zip が古い → チャットで最後に渡された zip か確認（ファイル名が同じなので、ダウンロードの日時で見分ける）
- まちがって本番に上げた → 「Deployments」の一覧から、前の版の「…」→「Rollback」（もとに戻す）で戻せる
- **API トークンやパスワードは、チャット・X・スクリーンショットに出さない**
