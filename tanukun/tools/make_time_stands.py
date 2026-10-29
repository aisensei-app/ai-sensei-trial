"""本編トップページの「時間帯の立ち絵」をつくる（art の元の絵 → images/time_*.webp）

使い方（tanukun フォルダで）:
    python3 tools/make_time_stands.py

・ChatGPT で作ったマゼンタ背景の絵を透明にして、「通常」の絵（720×900）と同じ大きさ・位置にそろえる
    朝・夜 … 頭のてっぺんから足もとまでの高さを「通常」の絵と同じにして、足もとをそろえる（横はまんなか）
    夕方（両手を上げる）… 夜と同じ倍率（手の分だけ高くなるため）
    深夜（すやすや・座りポーズ）… 夜と同じ倍率で、足もとをそろえる
・体の色を、本編の表情の絵の平均にそろえる（ほかの絵は変えない）
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
from make_pose import key, W, H                     # noqa: E402
from make_pon_art import target, stats, recolor           # noqa: E402

STANDS = [('N1_morning', 'morning'), ('N2_evening', 'evening'), ('N3_night', 'night'), ('N4_sleep2', 'sleep')]



def place(im, s, dx, dy):   # dx, dy … 拡大縮小したあとの絵を、左・上にずらす量
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    return im.crop((-dx, -dy, -dx + W, -dy + H))


def body_mask(im):
    """体の部分（不透明な所）。背景の消し残りの小さな点は除く（不透明な点が 20 個未満の行・列は無視）"""
    m = np.asarray(im)[..., 3] > 128
    m &= (m.sum(1) >= 20)[:, None]
    m &= (m.sum(0) >= 20)[None, :]
    return m


def bbox(im, s=1):
    ys, xs = np.where(body_mask(im))
    return xs.min() * s, ys.min() * s, xs.max() * s, ys.max() * s


def main():
    goal = target()
    nx0, ny0, nx1, ny1 = bbox(Image.open(ROOT / 'images' / 'normal.webp').convert('RGBA'))
    ims = {name: key(ROOT / 'art' / (src + '.webp')) for src, name in STANDS}
    # 夜の絵で、頭から足もとまでの高さを「通常」に合わせる倍率を決める
    x0, y0, x1, y1 = bbox(ims['night'])
    base = (ny1 - ny0) / (y1 - y0)
    for name, im in ims.items():
        s = base * (0.88 if name == 'sleep' else 1)   # 座りポーズは横に広いので、少し小さく（しっぽが切れないように）
        # 体のまんなか：しっぽをよけるため、足もと（いちばん下から 1 割）の左右のまんなか
        ys, xs = np.where(body_mask(im))
        low = xs[ys > ys.max() - (ys.max() - ys.min()) * 0.1]
        cx = (low.min() + low.max()) / 2 * s
        ncx = 288   # 「通常」の絵の足もとの左右のまんなか（720×900 の絵で）
        if name == 'sleep':   # 座りポーズは横に広いので、体全体（しっぽまで）を画面のまんなかに
            cx = (xs.min() + xs.max()) / 2 * s
            ncx = W / 2
        out = place(im, s, round(ncx - cx), round(ny1 - ys.max() * s))
        out = recolor(out, stats(out), goal)
        path = ROOT / 'images' / f'time_{name}.webp'
        out.save(path, quality=92, method=6)
        print('できました:', path.relative_to(ROOT), ' 倍率 %.3f' % s)


if __name__ == '__main__':
    main()
