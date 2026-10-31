"""ズーム用の高画質の立ち絵（images/topmenu/normal_hd.webp）をつくる（2026-10-31）

art/hd/normal_hd_src.png … ChatGPT で描き直してもらった「通常」の絵（1159×1358、背景は黒）。
  もとの立ち絵 images/normal.webp（720×900）を約1.508倍にすると、ずれなく重なる。
背景が黒で、足の肉球（黒に近い色）と区別しにくいので、色で抜かずに、
もとの立ち絵の形（透明度）を1.5倍に拡大して、型として使う。
できあがりは 1080×1350（もとの絵のちょうど1.5倍。並べ方はもとの絵と同じ）。
  python3 tools/make_normal_hd.py
"""
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'art' / 'hd' / 'normal_hd_src.png'
BASE = ROOT / 'images' / 'normal.webp'
OUT = ROOT / 'images' / 'topmenu' / 'normal_hd.webp'
K = 1.5


def bbox(mask):
    ys, xs = np.where(mask)
    return xs.min(), ys.min(), xs.max(), ys.max()


def main():
    base = Image.open(BASE).convert('RGBA')
    src = Image.open(SRC).convert('RGB')
    a = bbox(np.array(base)[..., 3] > 128)
    b = bbox(np.array(src).max(axis=2) > 40)
    s = ((b[2] - b[0]) / (a[2] - a[0]) + (b[3] - b[1]) / (a[3] - a[1])) / 2   # もとの絵 → 描き直した絵 の倍率
    ox, oy = b[0] - a[0] * s, b[1] - a[1] * s                                  # もとの絵の (0,0) が来る所
    W, H = round(base.width * K), round(base.height * K)
    # 描き直した絵を、もとの絵の並べ方 × 1.5 に合わせる
    f = s / K
    rgb = src.transform((W, H), Image.AFFINE, (f, 0, ox, 0, f, oy), resample=Image.BICUBIC)
    alpha = base.getchannel('A').resize((W, H), Image.LANCZOS)
    # 型のふちが黒い背景にかからないように、ほんの少し内側へ
    alpha = alpha.filter(ImageFilter.MinFilter(3))
    out = rgb.convert('RGBA')
    out.putalpha(alpha)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, 'WEBP', quality=88, method=6)
    print('倍率', round(s, 4), 'ずれ', round(ox, 2), round(oy, 2), '→', OUT, OUT.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
