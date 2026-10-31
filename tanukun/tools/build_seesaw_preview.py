"""丸太シーソー（試作）の確認用の1ファイル版をつくる（Claude の確認用リンク＝Artifact に載せるため）

使い方（tanukun フォルダで）:
    python3 tools/build_seesaw_preview.py   → preview/seesaw.html

seesaw/index.html の <body> の中身を取り出し、絵（'img/…' と '../images/…'）を文字データにして埋めこみます。
"""
import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    page = (ROOT / 'seesaw' / 'index.html').read_text(encoding='utf8')
    body = page[page.index('<body>') + len('<body>'):page.rindex('</body>')]

    def inline(m):
        path = (ROOT / 'seesaw' / m.group(1)).resolve()
        return "'data:image/webp;base64," + base64.b64encode(path.read_bytes()).decode() + "'"

    body = re.sub(r"'((?:\.\./)?(?:img|images)/[^']+\.webp)'", inline, body)
    out = ROOT / 'preview' / 'seesaw.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(body.strip() + '\n', encoding='utf8')
    print('できました:', out, f'({out.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
