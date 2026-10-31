"""ぽよんラリーの「レシーブの構え」の絵をつくる（rally/art/receive_fixed.png → images/receive.webp。720×900）

使い方（tanukun フォルダで）:
    python3 tools/make_receive.py

・元の絵（ChatGPT。マゼンタ背景）は、足の指先と手の小さな爪を消したもの（rally/art/receive_fixed.png）
・しっぽが本編の絵と同じ右がわになるように、左右を反転する
・大きさ SCALE、位置は「足の下を通常の絵にそろえ、両手（おなかの前）を通常のおなかの中心の横位置へ」
  両手の位置（720×900 の％）は rally.js の T.receive（必殺の球が当たる所）
"""
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
from make_pose import key   # noqa: E402  マゼンタ背景を透明にする

SCALE = 0.6
HANDS_X = 449        # 反転したあとの、元の絵での両手のまんなか（横）
FEET = 1473          # 元の絵での足の下
NORMAL_FEET = 889    # 通常の絵（images/normal.webp）の足の下
BELLY_X = 255        # 通常の絵のおなかの中心（横。config.js の bellyJiggle）

if __name__ == '__main__':
    im = ImageOps.mirror(key(ROOT / 'rally' / 'art' / 'receive_fixed.png'))
    im = im.resize((round(im.width * SCALE), round(im.height * SCALE)), Image.LANCZOS)
    dx, dy = round(BELLY_X - HANDS_X * SCALE), round(NORMAL_FEET - FEET * SCALE)
    out = Image.new('RGBA', (720, 900), (0, 0, 0, 0))
    out.paste(im, (dx, dy), im)
    out.save(ROOT / 'images' / 'receive.webp', quality=92, method=6)
    print('できました: images/receive.webp  dx=%d dy=%d' % (dx, dy))
