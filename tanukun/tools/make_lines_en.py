"""タヌくん 英語のセリフ集（lines.en.js）をつくる

使い方（tanukun フォルダで）:
    python3 tools/make_lines_en.py

lines.js（日本語のセリフ）の「出す条件」はそのままで、文だけを tools/lines_en.json の英訳に入れかえて、
lines.en.js（window.TANU_LINES_I18N.en）をつくります。
セリフを足したり変えたりしたら、lines_en.json に英訳を足してから、これを動かしてください。
英訳がないセリフは、日本語のまま入ります（作るときに一覧を表示します）。
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    src = (ROOT / 'lines.js').read_text(encoding='utf8')
    en = json.loads((ROOT / 'tools' / 'lines_en.json').read_text(encoding='utf8'))
    body = src[src.index('window.TANU_LINES = ['):]
    missing = []

    def swap(m):
        ja = m.group(1).replace("\\'", "'")
        if ja not in en:
            missing.append(ja)
            return m.group(0)
        return "{ text: '" + en[ja].replace('\\', '\\\\').replace("'", "\\'") + "'"

    body = re.sub(r"\{ text: '((?:[^'\\]|\\.)*)'", swap, body)
    body = body.replace('window.TANU_LINES = [', '(window.TANU_LINES_I18N = window.TANU_LINES_I18N || {}).en = [', 1)
    head = ('/* =========================================================\n'
            '   タヌくん 英語のセリフ集（tools/make_lines_en.py で lines.js と tools/lines_en.json からつくる。\n'
            '   ここを直接書きかえず、lines_en.json を直してから作り直してください）\n'
            '   ========================================================= */\n')
    (ROOT / 'lines.en.js').write_text(head + body, encoding='utf8')
    n = len(re.findall(r"\{ text: '", body))
    print(f'できました: lines.en.js（{n} 個）')
    if missing:
        print('英訳がないセリフ（日本語のまま）:')
        for m in missing:
            print('  ', m)


if __name__ == '__main__':
    main()
