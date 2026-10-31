"""ズーム用の高画質の立ち絵（images/topmenu/normal_hd.webp）をつくる

art/hd/normal_hd_src.png … ChatGPT で描き直してもらった「通常」の絵（背景は黒）。
  2026-10-31 の2枚目（1122×1402。毛並みが細かい版。ユーザーの希望でこちらに差しかえ）。
  1枚目（1159×1358）は art/hd/normal_hd_src_v1.png に残してある。
できあがりは 1080×1350（もとの立ち絵 images/normal.webp のちょうど1.5倍。並べ方は同じ）。

位置合わせ（FIT）：もとの立ち絵を1.5倍にした絵と、いちばん重なる「倍率（横・縦）とずらし」を探した値。
  できあがりの (x, y) には、描き直した絵の (fx*x + ox, fy*y + oy) の色を使う。絵を差しかえたら探し直す。
透明にする所：背景が黒で、足の肉球（黒に近い色）と区別しにくいので、
  ・もとの立ち絵の形の内側（少し内側）は必ず見せる
  ・ふちのあたりだけ、描き直した絵の明るさで背景（黒）を抜く（もとの形より少し外まで）
  python3 tools/make_normal_hd.py
"""
from pathlib import Path
from PIL import Image, ImageFilter, ImageChops
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'art' / 'hd' / 'normal_hd_src.png'
BASE = ROOT / 'images' / 'normal.webp'
OUT = ROOT / 'images' / 'topmenu' / 'normal_hd.webp'
K = 1.5
FIT = {'fx': 1.034, 'fy': 1.039, 'ox': 3.0, 'oy': 0.0}


def main():
    base = Image.open(BASE).convert('RGBA')
    src = Image.open(SRC).convert('RGB')
    W, H = round(base.width * K), round(base.height * K)
    rgb = src.transform((W, H), Image.AFFINE, (FIT['fx'], 0, FIT['ox'], 0, FIT['fy'], FIT['oy']), resample=Image.BICUBIC)
    shape = base.getchannel('A').resize((W, H), Image.LANCZOS)
    inner = shape.filter(ImageFilter.MinFilter(9))     # 形の少し内側：必ず見せる
    outer = shape.filter(ImageFilter.MaxFilter(7))     # 形の少し外側：ここまでは、明るさで判断
    lum = np.array(rgb.convert('L')).astype(float)
    bright = Image.fromarray(np.clip((lum - 10) / 22 * 255, 0, 255).astype(np.uint8))   # 黒い背景 → 0
    alpha = ImageChops.lighter(inner, ImageChops.multiply(outer, bright))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))
    out = rgb.convert('RGBA')
    out.putalpha(alpha)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, 'WEBP', quality=88, method=6)
    print('→', OUT, OUT.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
