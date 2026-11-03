"""タヌくんのポスト（post.js）の絵をつくる（2026-11-03）

使い方（tanukun フォルダで）:
    python3 tools/make_post_art.py

もとの絵（post/art/。ユーザーが描いたもの。どちらもマゼンタ背景）:
    mailbox_src.png … P2 木のポスト（左：旗が下りた／右：赤い旗が上がった）
    receive_src.png … P1 お手紙を両手で抱えるタヌくん（全身・目をあけて にこにこ。2026-11-03 夜に描き直し版へ）
    receive_smile_src.png … 同じポーズで目を閉じて にっこり（2026-11-03 夜：使うのをやめた。目のまわりの模様がなく顔の色がちがうため。いまは作らない）
    writing_src.png … P3 机でお返事を書くタヌくん（縦長 1024×1536・背景あり。2026-11-03 夜に縦長版へ。前の横長は writing_wide_src.png）
つくるもの（images/post/）:
    mailbox_down.webp, mailbox_up.webp … ポスト（同じ倍率。ふだんは down、お返事が届いたら up）
    receive.webp … 背景を抜いたタヌくん（まわりの余白は切る）
    writing.webp … お手紙を送ったあと、フェードで出す「お返事を書くタヌくん」（幅 800）
"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
from make_pose import key  # マゼンタ背景を透明にする（立ち絵と同じ方法）

SRC = ROOT / 'post' / 'art'
OUT = ROOT / 'images' / 'post'


def trim(im, pad=6):
    l, t, r, b = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def save(im, name, scale=1.0, q=86):
    if scale != 1:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    im.save(OUT / name, 'WEBP', quality=q, method=6)
    print(name, im.size)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    mb = key(SRC / 'mailbox_src.png')
    a = np.asarray(mb)[..., 3] > 40
    xs = np.where(a.sum(0) > 0)[0]
    gaps = np.where(np.diff(xs) > 20)[0]
    if len(gaps) != 1:
        raise SystemExit(f'ポストが2つに分けられませんでした（すき間 {len(gaps)}）')
    mid = (xs[gaps[0]] + xs[gaps[0] + 1]) // 2
    # 2つを同じ高さ・同じ大きさの枠にそろえる（旗の分だけ右のほうが高いので、上は共通の高さで切る）
    ys = np.where(a.sum(1) > 0)[0]
    top, bot = ys.min() - 6, ys.max() + 6
    for name, (x0, x1) in [('mailbox_down.webp', (0, mid)), ('mailbox_up.webp', (mid, mb.width))]:
        cols = np.where(a[:, x0:x1].sum(0) > 0)[0]
        save(mb.crop((x0 + cols.min() - 6, top, x0 + cols.max() + 7, bot)), name, scale=0.6)
    save(trim(key(SRC / 'receive_src.png')), 'receive.webp', scale=0.8)
    w = Image.open(SRC / 'writing_src.png').convert('RGB')
    w.resize((800, round(800 * w.height / w.width)), Image.LANCZOS).save(OUT / 'writing.webp', 'WEBP', quality=84, method=6)
    print('writing.webp', (800, round(800 * w.height / w.width)))


if __name__ == '__main__':
    main()
