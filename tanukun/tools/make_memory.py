"""思い出アルバム用の特別イラストを取りこむ（images/memories/<ハート数>.webp にする）

使い方（tanukun フォルダで）:
    python3 tools/make_memory.py <元の絵.png> <ハートの数 1〜5>
      例）python3 tools/make_memory.py ~/hajimemashite.png 1

・背景ありの絵なので、透明化はしません（make_pose.py は使わない）
・縦長 2:3 になるように、はみ出した分を上下（左右）均等に切って、720×1080 に縮小します
・config.js の memories の image と、sw.js のファイル一覧も書きかえます
"""
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
W, H = 720, 1080


def main():
    if len(sys.argv) != 3 or sys.argv[2] not in '12345' or len(sys.argv[2]) != 1:
        sys.exit(__doc__)
    src, n = Path(sys.argv[1]).expanduser(), sys.argv[2]
    im = Image.open(src).convert('RGB')
    w, h = im.size
    # 2:3 に切りそろえる（ずれが大きいときはお知らせ）
    if w * 3 > h * 2:
        cw = round(h * 2 / 3)
        box = ((w - cw) // 2, 0, (w - cw) // 2 + cw, h)
    else:
        ch = round(w * 3 / 2)
        box = (0, (h - ch) // 2, w, (h - ch) // 2 + ch)
    cut = 1 - (box[2] - box[0]) * (box[3] - box[1]) / (w * h)
    if cut > 0.05:
        print(f'※ 2:3 ではなかったので、{cut:.0%} を切りました（元は {w}×{h}）')
    im = im.crop(box).resize((W, H), Image.LANCZOS)

    rel = f'images/memories/{n}.webp'
    out = ROOT / rel
    out.parent.mkdir(exist_ok=True)
    im.save(out, 'WEBP', quality=86, method=6)
    print(f'{rel} をつくりました（{out.stat().st_size // 1024} KB）')

    # config.js：hearts: n の行の image を書きかえる
    cfg = ROOT / 'config.js'
    t = cfg.read_text(encoding='utf-8')
    t2 = re.sub(r"(\{ hearts: %s, title: '[^']*', image: )'[^']*'" % n, r"\1'%s'" % rel, t)
    if t2 == t and f"image: '{rel}'" not in t:
        print('※ config.js の memories が見つかりませんでした。手で image を書いてください')
    cfg.write_text(t2, encoding='utf-8')

    # sw.js：オフライン用のファイル一覧に足す
    sw = ROOT / 'sw.js'
    s = sw.read_text(encoding='utf-8')
    if f"'./{rel}'" not in s:
        s = s.replace("'./images/parts/debeso.webp'", f"'./images/parts/debeso.webp', './{rel}'")
        sw.write_text(s, encoding='utf-8')
        print('sw.js に足しました（CACHE の番号は、まとめて上げてください）')


if __name__ == '__main__':
    main()
