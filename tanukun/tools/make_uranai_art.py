"""貝がら占い（uranai.js）の絵をつくる（2026-11-03）

使い方（tanukun フォルダで）:
    python3 tools/make_uranai_art.py

もとの絵（uranai/art/。ユーザーが ChatGPT・Gemini で描いたもの）:
    shells_src.png  … U1 貝のまとめ絵（上の段＝閉じた貝4つ、下の段＝開いた貝4つ。マゼンタ背景）
    pick_src.png    … U2 タヌくん「どれにする？」（マゼンタ背景）
    result_src.png  … U3 タヌくん「結果発表！」（マゼンタ背景）
    gold_src.png    … U4 金の貝がらのタヌくん（背景あり。大吉のとき）
    wow_src.png     … C3 タヌくん「びっくり！」（マゼンタ背景・全身。pick と同じ位置に合わせる）
    cave_src.png    … C1 洞窟の背景（横長 3:2。cave2_src.png は使わなかった方）
    altar_src.png   … C2 古代の石の台座（マゼンタ背景）
つくるもの（images/uranai/）:
    shell_{coral,pearl,blue,gold}_{c,o}.webp … 閉じた貝(c)・開いた貝(o)。背景は透明
    pick.webp, result.webp … 背景を抜いたタヌくん（まわりの余白は切る）
    wow.webp … びっくり顔。pick.webp と同じ大きさで、頭のてっぺんとおへそが同じ所に来るように置く
    cave.webp, altar.webp … 背景・台座
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
    # びっくり顔：pick と頭のてっぺん・おへそを合わせる（元の絵で測った位置）
    #   pick_src：頭 y=144、おへそ (535, 885)。trim の余白 6px のあと、1100/1227 倍（pick.webp）
    #   wow_src ：頭 y=21、おへそ (553, 887)
    pick = Image.open(OUT / 'pick.webp')
    pk = key(SRC / 'pick_src.png').getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    ox, oy = pk[0] - 6, pk[1] - 6
    ps = pick.height / (pk[3] + 6 - oy)
    s = (885 - 144) / (887 - 21)
    wow = key(SRC / 'wow_src.png')
    k = s * ps
    w2 = wow.resize((round(wow.width * k), round(wow.height * k)), Image.LANCZOS)
    canvas = Image.new('RGBA', pick.size, (0, 0, 0, 0))
    # wow の (x, y) → pick.webp の ((535 + (x-553)s - ox) ps, (144 + (y-21)s - oy) ps)
    dx = round((535 - 553 * s - ox) * ps)
    dy = round((144 - 21 * s - oy) * ps)
    canvas.alpha_composite(w2, (dx, dy)) if dx >= 0 and dy >= 0 else canvas.paste(w2, (dx, dy), w2)
    save(canvas, 'wow.webp')
    save(Image.open(SRC / 'cave_src.png').convert('RGB'), 'cave.webp', q=80)
    save(trim(key(SRC / 'altar_src.png'), pad=2), 'altar.webp', maxw=1200)
    g = Image.open(SRC / 'gold_src.png').convert('RGB')
    save(g, 'gold.webp', maxw=768, q=82)


if __name__ == '__main__':
    main()
