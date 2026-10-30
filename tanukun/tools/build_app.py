"""タヌくん 本編の公開用ファイル一式をつくる

使い方（tanukun フォルダで）:
    python3 tools/build_app.py --base-url https://<プロジェクト名>.pages.dev/

つくられるもの:
    app-dist/      … 公開するファイル（この中身を Cloudflare Pages にアップロードする）
    app-dist.zip   … 上を zip にしたもの（zip の直下に index.html）

・X などに URL を貼ったときのカード（OGP）を index.html に入れます（絵は og/main.jpg）
・なでなでレポートとクリアのポストに付く URL（config.js の report.url）を、公開先の URL にします
・確認用の機能（testHearts）は、config.js のとおり false のまま（公開用では出ない）
・新しい機能の公開スイッチ（config.js の features）は、そのままの状態で入ります（作るときに表示します）
・ぽんぽこリズム（pon/ → 公開先の /pon/）も入れます。カードの絵は og/pon.jpg
  （pon/art の元の絵・プロンプト集、使っていない「おなかのアップ」の絵 images/pon/belly*.webp は入れない）
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
PON_FILES = ['index.html', 'pon.css', 'pon.js']
PON_TITLE = 'ぽんぽこリズム｜タヌくん'
PON_DESCRIPTION = 'タヌくんのおなかをたたく音ゲー。8ビートに合わせて、ぽんっ！ぷるん！だんだん速くなるよ。'
# 公開してはいけない言葉（身元につながる情報が入っていないかの確認）
NG_WORDS = ['文京', '大学', 'bgu', 'yishimura', 'aisensei', 'ai-sensei']


def og_tags(url, img, title=TITLE, desc=DESCRIPTION):
    e = html.escape
    return '\n'.join([
        f'<meta name="description" content="{e(desc)}">',
        '<meta property="og:type" content="website">',
        f'<meta property="og:title" content="{e(title)}">',
        f'<meta property="og:description" content="{e(desc)}">',
        f'<meta property="og:image" content="{e(img)}">',
        f'<meta property="og:url" content="{e(url)}">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{e(title)}">',
        f'<meta name="twitter:description" content="{e(desc)}">',
        f'<meta name="twitter:image" content="{e(img)}">',
    ])


def build(base, out):
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    for f in FILES:
        shutil.copy(ROOT / f, out / f)
    # images/pon/belly*.webp は、使っていない「おなかのアップ」の絵（ARTS.closeup）なので入れない
    shutil.copytree(ROOT / 'images', out / 'images', ignore=lambda d, names: [
        n for n in names if Path(d).name == 'pon' and n.startswith('belly')])
    (out / 'og').mkdir()
    shutil.copy(ROOT / 'og' / 'main.jpg', out / 'og' / 'main.jpg')
    shutil.copy(ROOT / 'og' / 'pon.jpg', out / 'og' / 'pon.jpg')
    (out / 'pon').mkdir()
    for f in PON_FILES:
        shutil.copy(ROOT / 'pon' / f, out / 'pon' / f)

    # index.html：カード（OGP）の設定を入れる
    page = (out / 'index.html').read_text(encoding='utf8')
    page = page.replace('<title>タヌくん</title>', '<title>' + TITLE + '</title>\n' + og_tags(base, base + 'og/main.jpg'), 1)
    (out / 'index.html').write_text(page, encoding='utf8')
    # pon/index.html：ぽんぽこリズムのカード
    page = (out / 'pon' / 'index.html').read_text(encoding='utf8')
    tag = '<title>' + PON_TITLE + '</title>'
    if tag not in page:
        raise SystemExit('pon/index.html の <title> が見つかりませんでした')
    page = page.replace(tag, tag + '\n' + og_tags(base + 'pon/', base + 'og/pon.jpg', PON_TITLE, PON_DESCRIPTION), 1)
    (out / 'pon' / 'index.html').write_text(page, encoding='utf8')

    # config.js：ポストに付く URL を公開先に。確認用の機能は必ず false
    cfg = (out / 'config.js').read_text(encoding='utf8')
    cfg, n = re.subn(r"(report: \{\s*taps: \d+,\s*url: )''", lambda m: m.group(1) + "'" + base.replace("'", '') + "'", cfg)
    if not n:
        raise SystemExit('config.js の report.url が見つかりませんでした')
    if 'testHearts: true' in cfg:
        raise SystemExit('config.js の testHearts が true です。false にしてから公開してください')
    (out / 'config.js').write_text(cfg, encoding='utf8')
    # 公開スイッチ（features）の状態を表示する（open＝遊べる、soon＝🔒 もうすぐ、hidden＝出さない）
    m = re.search(r"\n  features: \{(.*?)\n  \}", cfg, re.S)
    if m:
        print('公開スイッチ:', ', '.join(f'{k}={v}' for k, v in re.findall(r"(\w+):\s*'(\w+)'", m.group(1))))

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
