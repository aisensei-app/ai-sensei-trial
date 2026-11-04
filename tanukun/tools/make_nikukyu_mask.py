"""肉球ぷにぷに（nikukyu/）の「肉球の形」の絵をつくる

使い方（tanukun フォルダで）:
    python3 tools/make_nikukyu_mask.py

nikukyu/art/sit_soles_src.png（ユーザーが描いた、切り株に座って足の裏を見せるタヌくん）から、
肉球の所だけを白くした絵 nikukyu/img/pads_mask.png をつくる（ぷにっと沈む・影をつける範囲に使う）。
・肉球はこげ茶（明るさ＋赤み が小さい）。ツヤで白く抜けた所は、外から塗りつぶして穴をうめる
・PADS は肉球のだいたいの場所（だ円。元の絵の座標）。nikukyu/index.html の PADS と同じにする
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PADS = [(322, 995, 35, 41), (370, 935, 37, 42), (439, 907, 33, 42), (512, 945, 34, 42), (443, 1047, 97, 73),
        (760, 953, 36, 42), (837, 917, 37, 42), (910, 947, 37, 40), (940, 1012, 33, 40), (810, 1050, 95, 73)]


def main():
    im = Image.open(ROOT / 'nikukyu' / 'art' / 'sit_soles_src.png').convert('RGB')
    W, H = im.size
    px = im.load()
    out = Image.new('L', (W, H), 0)
    op = out.load()
    for cx, cy, rx, ry in PADS:
        for y in range(int(cy - ry * 1.5), int(cy + ry * 1.5)):
            for x in range(int(cx - rx * 1.5), int(cx + rx * 1.5)):
                d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
                if d > 1.35:   # だ円から遠い所（ほかの影など）は入れない
                    continue
                r, g, b = px[x, y]
                f = 0.299 * r + 0.587 * g + 0.114 * b + (r - b) * 0.8
                # 指の肉球は、ほぼだ円：まんなか（d < 0.8）は、ツヤで明るくても肉球にする
                if f < 132 or (rx < 60 and d < 0.8):
                    op[x, y] = 255
    # 小さなゴミを消す → 外から塗って、塗れなかった所（ツヤの穴）を肉球にする
    out = out.filter(ImageFilter.MedianFilter(5))
    fill = out.copy()
    ImageDraw.floodfill(fill, (0, 0), 128)
    fp, op = fill.load(), out.load()
    for y in range(H):
        for x in range(W):
            if fp[x, y] == 0:
                op[x, y] = 255
    out = out.filter(ImageFilter.GaussianBlur(1.2))
    out.save(ROOT / 'nikukyu' / 'img' / 'pads_mask.png', optimize=True)
    print('できました: nikukyu/img/pads_mask.png')


if __name__ == '__main__':
    main()
