"""タヌくん 確認用の1ファイル版をつくる（Claude の確認用リンク＝Artifact に載せるため）

使い方（tanukun フォルダで）:
    python3 tools/build_preview.py            → preview/tanukun.html（本編）
    python3 tools/build_preview.py --demo     → preview/tanukun-demo.html（お試し版）
    python3 tools/build_preview.py --pon      → preview/pon.html（ぽんぽこリズム）
    python3 tools/build_preview.py --rally    → preview/rally.html（ぽよんラリー）
    python3 tools/build_preview.py --topmenu  → preview/topmenu.html（トップ画面の試作）
    python3 tools/build_preview.py --seesaw   → preview/seesaw.html（丸太シーソー）
    python3 tools/build_preview.py --washing  → preview/washing.html（タヌくんを洗おう）
    python3 tools/build_preview.py --public --with-pon
        → 本編を「公開スイッチは config.js のまま」（公開される状態と同じ）で作り、
          ぽんぽこリズムを preview/pon/index.html に作る（本編の 🥁 から入れる。Artifact の files に pon/index.html として載せる）

絵（images/*.webp）を文字データにしてHTMLの中に埋めこみ、1つのファイルにまとめます。
"""
import argparse
import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = False   # True なら、公開スイッチ（features）を config.js のままにする（--public）


def js(name):
    text = (ROOT / name).read_text(encoding='utf8')
    if name == 'config.js' and not PUBLIC:
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
    names = ['config.js', 'config.en.js', 'config.zh.js', 'lines.js', 'lines.en.js', 'lines.zh.js', 'i18n.zh.js', 'i18n.js', 'save.js', 'belly.js', 'home.js', 'app.js']
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
    # ぽよんラリー・ぽんぽこリズムは、ことば（それぞれの訳 〇〇.i18n.js、中国語の共通の文 i18n.zh.js、i18n.js）も入れる
    words = [js(folder + '/' + folder + '.i18n.js'), js('i18n.zh.js'), js('i18n.js')] if folder in ('rally', 'pon', 'seesaw', 'washing') else []
    game = js(folder + '/' + folder + '.js')
    if folder in ('seesaw', 'washing'):
        # シーソー・洗うゲームの絵は seesaw/ からの場所（'img/…' と '../images/…'）で書いてあるので、ここで文字データにする
        game = re.sub(r"'((?:\.\./)?(?:img|images)/[^']+\.webp)'",
                      lambda m: "'data:image/webp;base64," + base64.b64encode((ROOT / folder / m.group(1)).resolve().read_bytes()).decode() + "'", game)
    scripts = ''.join('<script>\n' + text + '\n</script>\n' for text in
                      [js('config.js')] + words + ([] if folder in ('seesaw', 'washing') else [js('belly.js')]) + [game])
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
    ap.add_argument('--topmenu', action='store_true', help='トップ画面の試作をつくる')
    ap.add_argument('--seesaw', action='store_true', help='丸太シーソーをつくる')
    ap.add_argument('--washing', action='store_true', help='タヌくんを洗おうをつくる')
    ap.add_argument('--public', action='store_true', help='公開スイッチを config.js のままにする（公開される状態で確認）')
    ap.add_argument('--with-pon', action='store_true', help='本編といっしょに、ぽんぽこリズムを（出力先のフォルダ）/pon/index.html に作る')
    ap.add_argument('--out', default=None, help='出力先')
    a = ap.parse_args()
    PUBLIC = a.public
    if a.topmenu:
        build_pon(Path(a.out) if a.out else ROOT / 'preview' / 'topmenu.html', 'topmenu', 'トップ画面の試作')
        raise SystemExit
    if a.seesaw:
        build_pon(Path(a.out) if a.out else ROOT / 'preview' / 'seesaw.html', 'seesaw', '丸太シーソー')
        raise SystemExit
    if a.washing:
        build_pon(Path(a.out) if a.out else ROOT / 'preview' / 'washing.html', 'washing', 'タヌくんを洗おう')
        raise SystemExit
    if a.rally:
        build_pon(Path(a.out) if a.out else ROOT / 'preview' / 'rally.html', 'rally', 'ぽよんラリー')
        raise SystemExit
    if a.pon:
        build_pon(Path(a.out) if a.out else ROOT / 'preview' / 'pon.html')
        raise SystemExit
    default = ROOT / 'preview' / ('tanukun-demo.html' if a.demo else 'tanukun.html')
    out = Path(a.out) if a.out else default
    build(a.demo, out)
    if a.with_pon:
        # 確認用リンクでは pon/ がフォルダとして開けないので、pon/index.html を指すように
        text = out.read_text(encoding='utf8')
        text = text.replace("href: 'pon/'", "href: 'pon/index.html'").replace('href="pon/"', 'href="pon/index.html"')
        out.write_text(text, encoding='utf8')
        pon = out.parent / 'pon' / 'index.html'
        build_pon(pon)
        # Artifact では、いっしょに載せるページは そのまま出るので、文字コードと画面の幅の宣言を先頭に付ける
        pon.write_text('<!doctype html>\n<html lang="ja"><head><meta charset="utf-8">'
                       '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>\n'
                       + pon.read_text(encoding='utf8') + '\n</body></html>\n', encoding='utf8')
