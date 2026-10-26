"""タヌくん 本編の公開用ファイル一式をつくる

使い方（tanukun フォルダで）:
    python3 tools/build_app.py --base-url https://<プロジェクト名>.pages.dev/

つくられるもの:
    app-dist/      … 公開するファイル（この中身を Cloudflare Pages にアップロードする）
    app-dist.zip   … 上を zip にしたもの（zip の直下に index.html）

・X などに URL を貼ったときのカード（OGP）を index.html に入れます（絵は og/main.jpg）
・なでなでレポートとクリアのポストに付く URL（config.js の report.url）を、公開先の URL にします
・確認用の機能（testHearts）は、config.js のとおり false のまま（公開用では出ない）
・お試し版の設定（demo.js）、メモ、道具、確認用ファイル、元の絵などは入れません
"""
import argparse
import html
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent      # tanukun フォルダ
FILES = ['index.html', 'style.css', 'config.js', 'lines.js', 'i18n.js', 'save.js', 'belly.js', 'app.js',
         'sw.js', 'manifest.webmanifest']
TITLE = 'タヌくん'
DESCRIPTION = 'さわって遊ぶ、なでなでアプリ。なでて、ぽんぽこして、毎日なかよくなろう。'
# 公開してはいけない言葉（身元につながる情報が入っていないかの確認）
NG_WORDS = ['文京', '大学', 'bgu', 'yishimura', 'aisensei', 'ai-sensei']


def og_tags(base):
    e = html.escape
    img = base + 'og/main.jpg'
    return '\n'.join([
        f'<meta name="description" content="{e(DESCRIPTION)}">',
        '<meta property="og:type" content="website">',
        f'<meta property="og:title" content="{e(TITLE)}">',
        f'<meta property="og:description" content="{e(DESCRIPTION)}">',
        f'<meta property="og:image" content="{e(img)}">',
        f'<meta property="og:url" content="{e(base)}">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{e(TITLE)}">',
        f'<meta name="twitter:description" content="{e(DESCRIPTION)}">',
        f'<meta name="twitter:image" content="{e(img)}">',
    ])


def build(base, out):
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    for f in FILES:
        shutil.copy(ROOT / f, out / f)
    shutil.copytree(ROOT / 'images', out / 'images')
    (out / 'og').mkdir()
    shutil.copy(ROOT / 'og' / 'main.jpg', out / 'og' / 'main.jpg')

    # index.html：カード（OGP）の設定を入れる
    page = (out / 'index.html').read_text(encoding='utf8')
    page = page.replace('<title>タヌくん</title>', '<title>' + TITLE + '</title>\n' + og_tags(base), 1)
    (out / 'index.html').write_text(page, encoding='utf8')

    # config.js：ポストに付く URL を公開先に。確認用の機能は必ず false
    cfg = (out / 'config.js').read_text(encoding='utf8')
    cfg, n = re.subn(r"(report: \{\s*taps: \d+,\s*url: )''", lambda m: m.group(1) + "'" + base.replace("'", '') + "'", cfg)
    if not n:
        raise SystemExit('config.js の report.url が見つかりませんでした')
    if 'testHearts: true' in cfg:
        raise SystemExit('config.js の testHearts が true です。false にしてから公開してください')
    (out / 'config.js').write_text(cfg, encoding='utf8')

    # 身元につながる言葉が入っていないか確認
    for p in out.rglob('*'):
        if p.suffix in ('.html', '.js', '.css', '.webmanifest'):
            t = p.read_text(encoding='utf8').lower()
            for w in NG_WORDS:
                if w.lower() in t:
                    raise SystemExit(f'※ {p.relative_to(out)} に「{w}」が入っています。公開前に確認してください')

    zipped = shutil.make_archive(str(out), 'zip', out)
    size = sum(p.stat().st_size for p in out.rglob('*') if p.is_file())
    print(f'できました: {out}（{size // 1024} KB）と {Path(zipped).name}')
    print(f'公開先: {base}')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='タヌくん 本編の公開用ファイルをつくる')
    ap.add_argument('--base-url', required=True, help='公開先の URL（最後は / で終わる）')
    ap.add_argument('--out', default=str(ROOT / 'app-dist'))
    a = ap.parse_args()
    base = a.base_url if a.base_url.endswith('/') else a.base_url + '/'
    build(base, Path(a.out))
