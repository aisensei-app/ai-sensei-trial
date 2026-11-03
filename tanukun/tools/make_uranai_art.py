"""貝がら占い（uranai.js）の絵をつくる（2026-11-03）

使い方（tanukun フォルダで）:
    python3 tools/make_uranai_art.py

もとの絵（uranai/art/。ユーザーが ChatGPT・Gemini で描いたもの）:
    shells_src.png  … U1 貝のまとめ絵（上の段＝閉じた貝4つ、下の段＝開いた貝4つ。マゼンタ背景）
    pick_src.png    … U2 タヌくん「どれにする？」（マゼンタ背景）
    result_src.png  … U3 タヌくん「結果発表！」（マゼンタ背景）
    gold_src.png    … U4 金の貝がらのタヌくん（背景あり。大吉のとき）
つくるもの（images/uranai/）:
    shell_{coral,pearl,blue,gold}_{c,o}.webp … 閉じた貝(c)・開いた貝(o)。背景は透明
    pick.webp, result.webp … 背景を抜いたタヌくん（まわりの余白は切る）
    gold.webp … 大吉の絵（縦 2:3）
"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
from make_pose import key  # マゼンタ背景を透明にする（立ち絵と同じ方法）

SRC = ROOT / 'uranai' / 'art'
OUT = ROOT / 'images' / 'uranai'
COLORS = ['coral', 'pearl', 'blue', 'gold']


def trim(im, pad=6):
    box = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    l, t, r, b = box
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def save(im, name, maxw=None, maxh=None, q=86, scale=1.0):
    s = scale
    if maxw: s = min(s, maxw / im.width)
    if maxh: s = min(s, maxh / im.height)
    if s != 1:
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    im.save(OUT / name, 'WEBP', quality=q, method=6)
    print(name, im.size)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sh = key(SRC / 'shells_src.png')
    a = np.asarray(sh)[..., 3] > 40
    # 貝どうしのすき間（たての列で、色のない所）で切り分ける。どの貝も同じ倍率にして、大きさの差をそのまま残す
    for (r0, r1), kind in zip([(0, sh.height // 2), (sh.height // 2, sh.height)], ['c', 'o']):
        xs = np.where(a[r0:r1].sum(0) > 0)[0]
        runs, s0, p = [], xs[0], xs[0]
        for x in xs[1:]:
            if x - p > 3:
                runs.append((s0, p)); s0 = x
            p = x
        runs.append((s0, p))
        if len(runs) != 4:
            raise SystemExit(f'貝が4つに分けられませんでした（{len(runs)}）')
        for (x0, x1), color in zip(runs, COLORS):
            cell = sh.crop((max(0, x0 - 4), r0, min(sh.width, x1 + 5), r1))
            save(trim(cell), f'shell_{color}_{kind}.webp', scale=0.8)
    save(trim(key(SRC / 'pick_src.png')), 'pick.webp', maxh=1100)
    save(trim(key(SRC / 'result_src.png')), 'result.webp', maxh=1100)
    g = Image.open(SRC / 'gold_src.png').convert('RGB')
    save(g, 'gold.webp', maxw=768, q=82)


if __name__ == '__main__':
    main()
