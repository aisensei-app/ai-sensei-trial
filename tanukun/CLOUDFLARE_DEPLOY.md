# タヌくん（Webアプリ）を Cloudflare Pages に公開する手順の引き継ぎメモ

（ChatGPT などに渡して、コマンドで公開・更新するときの案内役をしてもらうためのメモ。2026-10-27 作成）

## あなた（AI）にお願いしたいこと
私が自分のパソコン（Windows）で、コマンドを使って Cloudflare Pages にアプリを公開・更新できるように、1ステップずつ案内してください。
専門用語は短く説明してください。画面のスクリーンショットを貼ったら、一緒に確認してください。

## 前提
- アプリ：「タヌくん」。HTML・CSS・JavaScript・画像だけの静的な Web アプリ（サーバーの処理なし）
- 公開先：Cloudflare Pages。プロジェクト名は `tanukun`（URL は https://tanukun.pages.dev/ の予定）
  - すでに別のプロジェクト `tanukun-demo`（お試し版）が、同じアカウントにある
  - Pages のプロジェクトは「Continue to Pages」（従来の Pages）方式で作る。Workers 方式は使わない
    （Workers 方式だと URL にアカウント由来の文字が入るため）
- 公開するファイル：`app-dist.zip`（`python3 tools/build_app.py --base-url https://tanukun.pages.dev/` で作成）。展開すると `app-dist` フォルダの直下に index.html がある
  - URL が tanukun.pages.dev 以外になった場合は、その URL に合わせて zip を作り直す必要がある（カードの画像の設定と、X へのポストに付く URL が URL ごとにちがうため）
- **身元の扱い**：この活動は所属先・本名とは無関係にしたい。Cloudflare アカウントは、所属先と関係のないメールアドレス（Google ログイン）で作成済み。
  コマンドや設定に、所属先の名前・本名・所属先のメールアドレスを入れないこと

## 方法：Wrangler（Cloudflare の公式コマンドツール）を使う
api.cloudflare.com を直接たたくより、公式ツールの Wrangler を使うほうが簡単で確実です。Wrangler が中で api.cloudflare.com を使います。

### 1. 準備（最初の1回だけ）
1. Node.js（LTS 版）をインストールする（https://nodejs.org/ ）。インストール後、PowerShell で `node -v` が表示されれば OK
2. Cloudflare の画面で **API トークン** を作る
   - 右上のアイコン →「My Profile」→「API Tokens」→「Create Token」→「Create Custom Token」
   - Permissions（権限）：**Account ／ Cloudflare Pages ／ Edit** だけ
   - Account Resources：自分のアカウントだけ
   - 作成したトークンは一度しか表示されないので、安全な場所（パスワード管理アプリなど）に保存する
3. **アカウント ID** を確認する
   - Cloudflare の画面の「Workers & Pages」の右側、または URL（dash.cloudflare.com/ の次の英数字）に出ている

### 2. 公開・更新のたびにやること（PowerShell）
```powershell
# 1) zip を展開したフォルダへ移動（例）
cd $HOME\Downloads

# 2) トークンとアカウント ID を、この画面の間だけ設定（"" の中は自分のもの）
$env:CLOUDFLARE_API_TOKEN = "ここにAPIトークン"
$env:CLOUDFLARE_ACCOUNT_ID = "ここにアカウントID"

# 3) はじめての時だけ：プロジェクトを作る
npx wrangler pages project create tanukun --production-branch main

# 4) 公開（更新のときも同じコマンド）
npx wrangler pages deploy app-dist --project-name tanukun --branch main
```
- 成功すると、公開された URL が表示される
- `--branch main` を付けると「本番（Production）」として公開される

### 3. 公開したあとに画面でやること
- Cloudflare の画面 → Workers & Pages → `tanukun` →「Metrics」→ **Web Analytics を有効にする**（アクセス数の計測。無料・Cookie なし）
- X に URL を貼って、カードの画像が出るか確認する（反映まで数分かかることがある）

## 安全のための約束（必ず守ってください）
- **API トークンを、チャット（AI を含む）・X・GitHub・スクリーンショットに絶対に出さない**
  - AI は、私にトークンを貼るよう求めないでください
  - スクリーンショットを貼るときは、トークンの部分を隠す
- トークンを漏らしてしまったら、すぐに Cloudflare の「API Tokens」でそのトークンを削除（Roll／Delete）して、作り直す
- トークンの権限は「Cloudflare Pages の編集」だけにする（ほかの権限は付けない）

## 困ったとき
- `npx` が見つからない → Node.js のインストールをやり直し、PowerShell を開き直す
- 認証エラー（Authentication error）→ トークンの権限（Cloudflare Pages ／ Edit）と、アカウント ID を確認
- プロジェクト名が使われている → 別の名前で作り、その URL に合わせて zip を作り直す
