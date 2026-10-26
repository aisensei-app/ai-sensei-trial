"""タヌくんの絵の色味をそろえる（ChatGPT で1枚ずつ描いた絵は、少しずつ色が違うため）

使い方（tanukun フォルダで）:
    python3 tools/match_colors.py            → images/ のタヌくんの絵を、色をそろえて上書き
    python3 tools/match_colors.py --check    → 色の違いを表示するだけ（上書きしない）

しくみ:
・それぞれの絵から「体」の部分（肌と毛＝オレンジ〜茶色の所）を取り出し、
  全部の絵の「色合い・あざやかさ・明るさ」の平均を目標にする
・それぞれの絵の色を、体の色が目標と同じになるように、絵全体で同じように変える
  （色合いは少し回す、あざやかさと明るさは何倍かにする）
・透明な部分はそのまま。何回実行しても、ほぼ同じ結果になる
・新しい表情の絵を足したら、NAMES に名前を足して、もう一度実行する
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
# 色をそろえる絵（茂み・アイコン・部品は除く）
NAMES = ['normal', 'shy', 'troubled', 'angry', 'melt', 'muni', 'ponpoko1', 'ponpoko2',
         'happy', 'mojimoji', 'dere', 'dere2']


def to_hsv(rgb):
    """RGB（0〜255）→ 色合い（0〜1）・あざやかさ（0〜1）・明るさ（0〜1）"""
    c = rgb / 255
    mx, mn = c.max(-1), c.min(-1)
    d = mx - mn
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    h = np.zeros_like(mx)
    nz = d > 1e-6
    rm = nz & (mx == r)
    gm = nz & (mx == g) & ~rm
    bm = nz & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = (b - r)[gm] / d[gm] + 2
    h[bm] = (r - g)[bm] / d[bm] + 4
    h /= 6
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    return h, s, mx


def to_rgb(h, s, v):
    i = np.floor(h * 6) % 6
    f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    out = np.zeros(h.shape + (3,))
    for k, (r, g, b) in enumerate([(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]):
        m = i == k
        out[m] = np.stack([r[m], g[m], b[m]], -1)
    return out * 255


def body(a, h):
    """体（肌と毛）：不透明で、オレンジ〜茶色の所（葉っぱ・白い模様は除く）"""
    return (a[..., 3] > 250) & (h * 360 < 45)


def main():
    ap = argparse.ArgumentParser(description='タヌくんの絵の色味をそろえる')
    ap.add_argument('--check', action='store_true', help='表示するだけ（上書きしない）')
    args = ap.parse_args()

    data = {}
    for n in NAMES:
        f = ROOT / 'images' / (n + '.webp')
        if not f.exists():
            continue
        a = np.asarray(Image.open(f).convert('RGBA')).astype(float)
        h, s, v = to_hsv(a[..., :3])
        m = body(a, h) & (s > 0.15)
        data[n] = (a, h, s, v, (h[m].mean(), s[m].mean(), v[m].mean()))
    th = np.mean([d[4][0] for d in data.values()])
    ts = np.mean([d[4][1] for d in data.values()])
    tv = np.mean([d[4][2] for d in data.values()])
    print('目標  色合い %.1f°  あざやかさ %.1f%%  明るさ %.1f%%' % (th * 360, ts * 100, tv * 100))

    for n, (a, h, s, v, (mh, ms, mv)) in data.items():
        print(f'{n:9s} 色合い {mh * 360:5.1f}°  あざやかさ {ms * 100:5.1f}%  明るさ {mv * 100:5.1f}%')
        if args.check:
            continue
        h2 = (h + (th - mh)) % 1
        s2 = np.clip(s * (ts / ms), 0, 1)
        v2 = np.clip(v * (tv / mv), 0, 1)
        out = a.copy()
        out[..., :3] = np.clip(to_rgb(h2, s2, v2), 0, 255)
        Image.fromarray(out.round().astype(np.uint8), 'RGBA').save(
            ROOT / 'images' / (n + '.webp'), quality=92, method=6)
    if not args.check:
        print('色をそろえました')


if __name__ == '__main__':
    main()
