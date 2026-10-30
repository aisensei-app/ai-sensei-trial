"""タヌくん 確認用の1ファイル版をつくる（Claude の確認用リンク＝Artifact に載せるため）

使い方（tanukun フォルダで）:
    python3 tools/build_preview.py            → preview/tanukun.html（本編）
    python3 tools/build_preview.py --demo     → preview/tanukun-demo.html（お試し版）
    python3 tools/build_preview.py --pon      → preview/pon.html（ぽんぽこリズム）
    python3 tools/build_preview.py --rally    → preview/rally.html（ぽよんラリー）

絵（images/*.webp）を文字データにしてHTMLの中に埋めこみ、1つのファイルにまとめます。
"""
import argparse
import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def js(name):
    text = (ROOT / name).read_text(encoding='utf8')
    if name == 'config.js':
        # 確認用リンクでは、公開スイッチ（features）をすべて 'open' にして、作った機能を全部見られるように
        text = re.sub(r"(\n  features: \{.*?\n  \})", lambda m: re.sub(r"'(soon|hidden)'", "'open'", m.group(1)), text, count=1, flags=re.S)
    return re.sub(r"'(images/[^']+\.webp)'",
                  lambda m: "'data:image/webp;base64," + base64.b64encode((ROOT / m.group(1)).read_bytes()).decode() + "'",
                  text)


def build(demo, out):
    css = (ROOT / 'style.css').read_text(encoding='utf8')
    # 確認用リンクの画面では 100vh がずれるため、高さを100%に
    css = css.replace('height: 100vh;\n  height: 100dvh;', 'height: 100%;')
    page = (ROOT / 'index.html').read_text(encoding='utf8')
    body = page[page.index('<main id="app">'):page.index('<!-- 読み込む順番')]
    names = ['config.js', 'lines.js', 'i18n.js', 'save.js', 'belly.js', 'app.js']
    title = 'タヌくん'
    if demo:
        names.insert(1, 'demo.js')
        title = 'タヌくん お試し版'
        body = body.replace('<p class="hint">頭・むね・おなか・しっぽをさわってね</p>',
                            '<p class="hint">頭をなでたり、おなかをぽんぽこしてね</p>')
    scripts = ''.join('<script>\n' + js(n) + '\n</script>\n' for n in names)
    # 確認用リンクでは、確認用の機能（ハートの切りかえ・クリア画面を見る）を出す
    scripts = scripts.replace('testHearts: false,', 'testHearts: true,', 1)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text('<title>' + title + '</title>\n'
                   '<meta name="claude:viewport-fit-sides" content="cover">\n'
                   '<style>\nhtml,body{color-scheme:light}\n' + css + '\n</style>\n'
                   + body + scripts, encoding='utf8')
    print('できました:', out, f'({out.stat().st_size // 1024} KB)')


def build_pon(out, folder='pon', title='ぽんぽこリズム'):
    """ぽんぽこリズム（pon/）やぽよんラリー（rally/）の1ファイル版"""
    css = (ROOT / folder / (folder + '.css')).read_text(encoding='utf8')
    css = css.replace('height: 100vh;\n  height: 100dvh;', 'height: 100%;')
    page = (ROOT / folder / 'index.html').read_text(encoding='utf8')
    body = page[page.index('<main id="' + folder + '"'):page.index('<!-- 本編と同じ設定')]
    scripts = ''.join('<script>\n' + text + '\n</script>\n' for text in
                      [js('config.js'), js('belly.js'), js(folder + '/' + folder + '.js')])
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text('<title>' + title + '</title>\n'
                   '<meta name="claude:viewport-fit-sides" content="cover">\n'
                   '<style>\nhtml,body{color-scheme:light}\n' + css + '\n</style>\n'
                   + body + scripts, encoding='utf8')
    print('できました:', out, f'({out.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='確認用の1ファイル版をつくる')
    ap.add_argument('--demo', action='store_true', help='お試し版をつくる')
    ap.add_argument('--pon', action='store_true', help='ぽんぽこリズムをつくる')
    ap.add_argument('--rally', action='store_true', help='ぽよんラリーをつくる')
    ap.add_argument('--out', default=None, help='出力先')
    a = ap.parse_args()
    if a.rally:
        build_pon(Path(a.out) if a.out else ROOT / 'preview' / 'rally.html', 'rally', 'ぽよんラリー')
        raise SystemExit
    if a.pon:
        build_pon(Path(a.out) if a.out else ROOT / 'preview' / 'pon.html')
        raise SystemExit
    default = ROOT / 'preview' / ('tanukun-demo.html' if a.demo else 'tanukun.html')
    build(a.demo, Path(a.out) if a.out else default)
