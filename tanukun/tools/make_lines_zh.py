"""タヌくん 中国語（簡体字）のセリフ集（lines.zh.js）をつくる

使い方（tanukun フォルダで）:
    python3 tools/make_lines_zh.py

lines.js（日本語のセリフ）の「出す条件」はそのままで、文だけを tools/lines_zh.json の中国語訳に入れかえて、
lines.zh.js（window.TANU_LINES_I18N.zh）をつくります。
セリフを足したり変えたりしたら、lines_zh.json に中国語訳を足してから、これを動かしてください。
中国語訳がないセリフは、日本語のまま入ります（作るときに一覧を表示します）。
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    src = (ROOT / 'lines.js').read_text(encoding='utf8')
    zh = json.loads((ROOT / 'tools' / 'lines_zh.json').read_text(encoding='utf8'))
    body = src[src.index('window.TANU_LINES = ['):]
    missing = []

    def swap(m):
        ja = m.group(1).replace("\\'", "'")
        if ja not in zh:
            missing.append(ja)
            return m.group(0)
        return "{ text: '" + zh[ja].replace('\\', '\\\\').replace("'", "\\'") + "'"

    body = re.sub(r"\{ text: '((?:[^'\\]|\\.)*)'", swap, body)
    body = body.replace('window.TANU_LINES = [', '(window.TANU_LINES_I18N = window.TANU_LINES_I18N || {}).zh = [', 1)
    head = ('/* =========================================================\n'
            '   タヌくん 中国語（簡体字）のセリフ集（tools/make_lines_zh.py で lines.js と tools/lines_zh.json からつくる。\n'
            '   ここを直接書きかえず、lines_zh.json を直してから作り直してください）\n'
            '   ========================================================= */\n')
    (ROOT / 'lines.zh.js').write_text(head + body, encoding='utf8')
    n = len(re.findall(r"\{ text: '", body))
    print(f'できました: lines.zh.js（{n} 個）')
    if missing:
        print('中国語訳がないセリフ（日本語のまま）:')
        for m in missing:
            print('  ', m)


if __name__ == '__main__':
    main()
