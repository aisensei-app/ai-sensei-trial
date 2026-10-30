"""タヌくん お試し版（tanukun-demo）を、本編へ案内するだけのページにする

使い方（tanukun フォルダで）:
    python3 tools/build_demo_redirect.py

つくられるもの:
    demo-redirect/      … 公開するファイル
    demo-redirect.zip   … 上を zip にしたもの。Cloudflare Pages の tanukun-demo に Production でアップロードする

・_redirects … お試し版のどのページ（診断結果の r/〜.html なども）を開いても、本編へ自動で移動する（Cloudflare の機能）
・index.html … 念のための予備。開くとすぐ本編へ移動し、移動しないときはリンクを出す。
               X に URL を貼ったときのカードは、本編と同じ絵（本編の og/main.jpg）にする
お試し版の古い投稿のリンクが「ページが見つかりません」にならないように、しばらくこの形で残しておき、
古い投稿から来る人がいなくなったら、Cloudflare の tanukun-demo プロジェクトごと削除する。
"""
import html
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent      # tanukun フォルダ
MAIN = 'https://tanukun.pages.dev/'
TITLE = 'タヌくん'
DESCRIPTION = 'さわって遊ぶ、なでなでアプリ。なでて、ぽんぽこして、毎日なかよくなろう。'


def build(out):
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    (out / '_redirects').write_text(f'/*  {MAIN}  301\n', encoding='utf8')
    e = html.escape
    img = MAIN + 'og/main.jpg'
    (out / 'index.html').write_text(f'''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(TITLE)}</title>
<meta name="robots" content="noindex">
<meta name="description" content="{e(DESCRIPTION)}">
<meta property="og:type" content="website">
<meta property="og:title" content="{e(TITLE)}">
<meta property="og:description" content="{e(DESCRIPTION)}">
<meta property="og:image" content="{e(img)}">
<meta property="og:url" content="{e(MAIN)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{e(img)}">
<meta http-equiv="refresh" content="0; url={e(MAIN)}">
<link rel="canonical" href="{e(MAIN)}">
<script>location.replace({MAIN!r});</script>
<style>
  body {{ margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #FFF4E0; color: #4A2E16; text-align: center; padding: 16px;
    font-family: -apple-system, BlinkMacSystemFont, "Hiragino Maru Gothic ProN", "Noto Sans JP", sans-serif; }}
  a {{ display: inline-block; margin-top: 12px; padding: 14px 28px; border-radius: 18px;
    background: #F08A3C; color: #fff; font-weight: 700; text-decoration: none; }}
</style>
</head>
<body>
<div>
  <p>お試し版は終了しました。<br>本編のタヌくんで遊んでね！</p>
  <a href="{e(MAIN)}">タヌくんで遊ぶ</a>
</div>
</body>
</html>
''', encoding='utf8')
    zipped = shutil.make_archive(str(out), 'zip', out)
    print(f'できました: {out} と {Path(zipped).name}（本編 {MAIN} へ案内）')


if __name__ == '__main__':
    build(ROOT / 'demo-redirect')
