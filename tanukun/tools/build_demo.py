"""タヌくん お試し版をつくる

使い方（tanukun フォルダで）:
    python3 tools/build_demo.py
    （公開先を変えるときは --base-url https://〜/ を付ける）

つくられるもの（demo-dist フォルダ）:
    index.html など      … お試し版本体（頭なで・おなかぽんぽこ・診断）
    og/main.png          … X に URL を貼ったときに出るカードの絵
    og/<結果>.png        … 診断結果ごとのカードの絵
    r/<結果>.html        … 診断結果をポストしたときのページ（開くとお試し版へ移動）

demo-dist の中身を zip にして、Cloudflare Pages（tanukun-demo）にアップロードすれば完成です。
カードの絵の文字には、日本語フォントが必要です（--font で指定。なければ自動で探します）。
"""
import argparse
import html
import re
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent      # tanukun フォルダ
FILES = ['style.css', 'config.js', 'lines.js', 'save.js', 'belly.js', 'app.js', 'demo.js']

TITLE = 'タヌくん（お試し版）'
DESCRIPTION = 'さわって遊べるタヌくん。頭をなでたり、おなかをぽんぽこしてみてね。'
CARD_W, CARD_H = 1200, 630

FONT_CANDIDATES = [
    '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf',
    '/usr/share/fonts/truetype/fonts-japanese-gothic.ttf',
    'C:/Windows/Fonts/meiryob.ttc',
    'C:/Windows/Fonts/meiryo.ttc',
    '/System/Library/Fonts/ヒラギノ丸ゴ ProN W4.ttc',
]


def find_font(path):
    for p in ([path] if path else []) + FONT_CANDIDATES:
        if p and Path(p).exists():
            return p
    raise SystemExit('日本語フォントが見つかりません。--font でフォントファイルを指定してください。')


def read_results():
    """demo.js から診断結果（id・タイトル・絵・コメント）を読む"""
    src = (ROOT / 'demo.js').read_text(encoding='utf8')
    pat = re.compile(r"id: '([\w-]+)', title: '([^']+)',\s*face: '(\w+)',\s*comment: '([^']+)'")
    return [dict(id=m[0], title=m[1], face=m[2], comment=m[3]) for m in pat.findall(src)]


def image_files():
    """config.js から絵の名前とファイルを読む"""
    src = (ROOT / 'config.js').read_text(encoding='utf8')
    return dict(re.findall(r"(\w+):\s*'(images/[^']+)'", src))


# ---------- カードの絵 ----------
def draw_card(out, face_path, lines, font_path):
    """左に文字、右にタヌくんの絵。lines は [(文字, 大きさ, 色), ...]"""
    card = Image.new('RGB', (CARD_W, CARD_H))
    top, bottom = (255, 244, 224), (233, 211, 166)
    d = ImageDraw.Draw(card)
    for y in range(CARD_H):
        t = y / CARD_H
        d.line([(0, y), (CARD_W, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(top, bottom)))

    tanu = Image.open(face_path).convert('RGBA')
    h = CARD_H - 30
    tanu = tanu.resize((int(tanu.width * h / tanu.height), h), Image.LANCZOS)
    # 足もとの影
    shadow = Image.new('RGBA', card.size, (0, 0, 0, 0))
    sx = CARD_W - tanu.width // 2 - 40
    ImageDraw.Draw(shadow).ellipse([sx - 170, CARD_H - 48, sx + 170, CARD_H - 12], fill=(74, 46, 22, 45))
    card.paste(shadow, (0, 0), shadow)
    card.paste(tanu, (CARD_W - tanu.width - 40, 22), tanu)

    y = 0
    sized = [(text, ImageFont.truetype(font_path, size), color) for text, size, color in lines]
    total = sum(f.size * 1.35 for _, f, _ in sized)
    y = (CARD_H - total) / 2
    for text, font, color in sized:
        d.text((70, y), text, font=font, fill=color)
        y += font.size * 1.35
    out.parent.mkdir(parents=True, exist_ok=True)
    card.save(out, optimize=True)


# ---------- ページ ----------
def og_tags(base, title, desc, image, url):
    e = html.escape
    return '\n'.join([
        f'<meta name="description" content="{e(desc)}">',
        f'<meta property="og:type" content="website">',
        f'<meta property="og:title" content="{e(title)}">',
        f'<meta property="og:description" content="{e(desc)}">',
        f'<meta property="og:image" content="{e(base + image)}">',
        f'<meta property="og:url" content="{e(url)}">',
        f'<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{e(title)}">',
        f'<meta name="twitter:description" content="{e(desc)}">',
        f'<meta name="twitter:image" content="{e(base + image)}">',
    ])


def build(base, out, font_path):
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    for f in FILES:
        shutil.copy(ROOT / f, out / f)
    # きせかえパーツと思い出のイラストは、お試し版では使わないので入れない
    shutil.copytree(ROOT / 'images', out / 'images', ignore=shutil.ignore_patterns('parts', 'memories'))

    # 公開先の URL を demo.js に書きこむ
    demo = (out / 'demo.js').read_text(encoding='utf8')
    demo = demo.replace("baseUrl: ''", "baseUrl: '" + base.replace("'", '') + "'", 1)
    (out / 'demo.js').write_text(demo, encoding='utf8')

    # index.html：お試し版の設定を読みこみ、ホーム画面追加の設定をはずし、カードの設定を入れる
    page = (ROOT / 'index.html').read_text(encoding='utf8')
    page = page.replace('<title>タヌくん</title>', '<title>' + TITLE + '</title>\n'
                        + og_tags(base, TITLE, DESCRIPTION, 'og/main.png', base), 1)
    page = page.replace('<link rel="manifest" href="manifest.webmanifest">\n', '', 1)
    page = page.replace('<script src="config.js"></script>',
                        '<script src="config.js"></script>\n<script src="demo.js"></script>', 1)
    page = page.replace('<p class="hint">頭・むね・おなか・しっぽをさわってね</p>',
                        '<p class="hint">頭をなでたり、おなかをぽんぽこしてね</p>', 1)
    (out / 'index.html').write_text(page, encoding='utf8')

    imgs = image_files()
    brown, orange = (74, 46, 22), (200, 100, 30)

    # 入り口のカード
    draw_card(out / 'og' / 'main.png', ROOT / imgs['normal'], [
        ('さわって遊べる', 46, brown),
        ('タヌくん', 110, orange),
        ('頭をなでたり、', 38, brown),
        ('おなかをぽんぽこ♪', 38, brown),
        ('お試し版 公開中', 32, orange),
    ], font_path)

    # 診断結果ごとのカードとページ
    for r in read_results():
        draw_card(out / 'og' / (r['id'] + '.png'), ROOT / imgs.get(r['face'], imgs['normal']), [
            ('タヌくん診断', 40, brown),
            ('きみは…', 40, brown),
            ('「' + r['title'] + '」', 74 if len(r['title']) <= 6 else 62, orange),
            (r['comment'], 30 if len(r['comment']) <= 16 else 26, brown),
            ('さわって遊べるタヌくん お試し中', 28, orange),
        ], font_path)
        title = 'タヌくん診断：「' + r['title'] + '」'
        desc = 'きみは「' + r['title'] + '」！ さわって遊べるタヌくん、お試し中。'
        url = base + 'r/' + r['id'] + '.html'
        (out / 'r').mkdir(exist_ok=True)
        (out / 'r' / (r['id'] + '.html')).write_text(f'''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
{og_tags(base, title, desc, 'og/' + r['id'] + '.png', url)}
<meta http-equiv="refresh" content="0; url=../">
</head>
<body>
<p><a href="../">タヌくん（お試し版）を開く</a></p>
</body>
</html>
''', encoding='utf8')

    # GitHub Pages でそのまま公開できるように
    (out / '.nojekyll').write_text('', encoding='utf8')
    print('できました:', out)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='タヌくん お試し版をつくる')
    ap.add_argument('--base-url', default='https://tanukun-demo.pages.dev/',
                    help='公開する場所の URL（最後は / ）')
    ap.add_argument('--out', default=str(ROOT / 'demo-dist'), help='出力先フォルダ')
    ap.add_argument('--font', default=None, help='カードの絵に使う日本語フォント')
    a = ap.parse_args()
    base = a.base_url if a.base_url.endswith('/') else a.base_url + '/'
    build(base, Path(a.out), find_font(a.font))
