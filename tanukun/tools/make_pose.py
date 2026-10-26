"""ChatGPT で作ったマゼンタ背景の絵を、背景透過・位置合わせして images/<名前>.webp にする

使い方（tanukun フォルダで）:
    python3 tools/make_pose.py <元の絵.png> <名前>
      例）python3 tools/make_pose.py ~/dere2.png dere2
    位置を自分で決めるとき:
    python3 tools/make_pose.py <元の絵.png> <名前> --scale 0.716 --dx -108 --dy 1

・大きさと位置は、腰から下（足・腰みの）が「通常」の絵（images/normal.webp）に
  いちばん重なるように自動で決めます（ポーズで変わりにくい所で合わせるため）
・ふちに残るマゼンタのにじみも取ります
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
MAGENTA = np.array([255, 0, 255.])
W, H = 720, 900


def key(path):
    """マゼンタ背景を透明にする"""
    a = np.asarray(Image.open(path).convert('RGB')).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    al = 1 - np.clip((np.minimum(r, b) - g - 110) / 90, 0, 1)
    safe = np.maximum(al, 1e-3)[..., None]
    col = np.clip(np.where(al[..., None] > 0.02, (a - (1 - al)[..., None] * MAGENTA) / safe, a), 0, 255)
    # ふち（透明の近く 4px）だけ、残ったマゼンタ味を取る
    band = np.asarray(Image.fromarray(((al < 0.5) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
    e = np.clip(np.minimum(col[..., 0], col[..., 2]) - col[..., 1] - 8, 0, None) * band
    col[..., 0] -= e
    col[..., 2] -= e
    al = al * (1 - np.clip((e - 25) / 60, 0, 0.9))   # にじみの強かったふちは少し透明に
    return Image.fromarray(np.dstack([np.clip(col, 0, 255), al * 255]).astype(np.uint8), 'RGBA')


def fit(im):
    """腰から下が「通常」の絵にいちばん重なる大きさと位置をさがす（1/3 の大きさで計算して速くする）"""
    q = 3
    normal = np.asarray(Image.open(ROOT / 'images' / 'normal.webp').convert('RGBA'))[..., 3] > 128
    ys, _ = np.where(normal)
    height, bottom = ys.max() - ys.min(), ys.max()
    n = normal[::q, ::q]
    low = np.zeros_like(n)
    low[650 // q:] = True
    mask = (np.asarray(im)[..., 3] > 128).astype(np.uint8) * 255
    ys, _ = np.where(mask)
    s0 = height / (ys.max() - ys.min())
    best = None
    for s in np.arange(s0 - 0.03, s0 + 0.03, 0.004):
        w, h = round(im.width * s / q), round(im.height * s / q)
        mm = np.asarray(Image.fromarray(mask).resize((w, h))) > 128
        yy, xx = np.where(mm)
        gx, gy = round(n.shape[1] / 2 - (xx.min() + xx.max()) / 2), bottom // q - yy.max()
        for dx in range(gx - 50, gx + 51):
            for dy in range(gy - 8, gy + 9):
                can = np.zeros_like(n)
                sx, sy, tx, ty = max(0, -dx), max(0, -dy), max(0, dx), max(0, dy)
                cw, ch = min(w - sx, n.shape[1] - tx), min(h - sy, n.shape[0] - ty)
                if cw <= 0 or ch <= 0:
                    continue
                can[ty:ty + ch, tx:tx + cw] = mm[sy:sy + ch, sx:sx + cw]
                iou = (can & n & low).sum() / max(1, ((can | n) & low).sum())
                if best is None or iou > best[0]:
                    best = (iou, s, dx * q, dy * q)
    print('腰から下の重なり %.1f%%  scale=%.3f dx=%d dy=%d' % (best[0] * 100, best[1], best[2], best[3]))
    return best[1:]


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='マゼンタ背景の絵を、背景透過・位置合わせする')
    ap.add_argument('src')
    ap.add_argument('name')
    ap.add_argument('--scale', type=float)
    ap.add_argument('--dx', type=int)
    ap.add_argument('--dy', type=int)
    a = ap.parse_args()
    im = key(a.src)
    s, dx, dy = (a.scale, a.dx, a.dy) if a.scale else fit(im)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    out = ROOT / 'images' / (a.name + '.webp')
    im.crop((-dx, -dy, -dx + W, -dy + H)).save(out, quality=92, method=6)
    print('できました:', out)
