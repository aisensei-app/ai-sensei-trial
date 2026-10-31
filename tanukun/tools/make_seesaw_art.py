"""丸太シーソー用の絵をつくる（マゼンタの背景を抜いて、ゲームで使う大きさの webp にする）

使い方（tanukun フォルダで）:
    python3 tools/make_seesaw_art.py

seesaw/art/*_src.png（ChatGPT で描いた、背景がマゼンタ #FF00FF の絵）
  → seesaw/img/*.webp（背景は透明。横 0.72 倍）
  sit_normal（通常）・sit_happy（わくわく）・sit_wow（びっくり）・sit_ehehe（えへへ）・jump_banzai（ばんざい。海へ飛びこむとき）

・背景の抜き方：「マゼンタらしさ」＝ min(赤, 青) − 緑 が大きい所ほど透明にする。
  毛先などのまざった色は、マゼンタの分を差し引いて元の色にもどす（ピンクのふちが残らないように）
・表情ちがいの絵（sit_happy_src.png など）も、同じ大きさ・同じ並べ方で描かれていれば、そのまま同じ設定で使える
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'seesaw' / 'art'
OUT = ROOT / 'seesaw' / 'img'
BASE = (1122, 1402)   # 元の絵の大きさ。1ピクセルちがう絵（1121×1403 など）は、まずこの大きさにそろえる
SCALE = 0.72          # 1122×1402 → 808×1009（立ち絵 720×900 とおなかの大きさがそろう）
LO, HI = 40, 170      # マゼンタらしさがこの間で、不透明 → 透明 に変わる


def key_out(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b) - g
    alpha = 1 - np.clip((m - LO) / (HI - LO), 0, 1)
    # マゼンタ（255, 0, 255）がまざった分を差し引く
    mag = np.array([255, 0, 255], np.float32)
    k = (1 - alpha)[..., None]
    safe = np.maximum(alpha, 0.05)[..., None]
    rgb = np.clip((a - k * mag) / safe, 0, 255)
    # 残ったピンクみを消す：赤と青の両方が緑より大きい分（マゼンタの成分）を、赤と青から引く
    #（茶色の毛は 青 < 緑、白い毛は ほぼ同じ なので、ここでは変わらない）
    excess = np.clip(np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1], 0, None)
    rgb[..., 0] -= excess
    rgb[..., 2] -= excess
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for src in sorted(SRC.glob('*_src.png')):
        im = Image.open(src).convert('RGB')
        if im.size != BASE:
            im = im.resize(BASE, Image.LANCZOS)
        im = key_out(im)
        w, h = im.size
        im = im.resize((round(w * SCALE), round(h * SCALE)), Image.LANCZOS)
        dst = OUT / (src.name.replace('_src.png', '.webp'))
        im.save(dst, 'WEBP', quality=88, method=6)
        print('できました:', dst.relative_to(ROOT), im.size, f'{dst.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
