"""洗うゲーム（washing/）の絵をつくる（マゼンタの背景を抜いて、立ち絵 images/normal.webp と同じ並べ方の webp にする）

使い方（tanukun フォルダで）:
    python3 tools/make_washing_art.py

washing/art/stand_src.jpg（Gemini で描いた、腰みの・ネックレスなしの前向きの立ち絵。848×1264、背景はマゼンタ）
  → washing/img/stand.webp（720×900。立ち絵 images/normal.webp とぴったり重なる大きさ・位置。背景は透明）

・立ち絵と同じ並べ方にそろえるので、表情は今ある立ち絵（images/happy.webp など）の顔だけを、ゲームの中で上に重ねて使える
・FIT（倍率と、ずらす量）は、立ち絵と形がいちばん重なる値を探して決めた（重なり 96%。残りは腰みのの分）
・背景の抜き方は丸太シーソーと同じ（tools/make_seesaw_art.py の key_out）
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_seesaw_art import key_out  # noqa: E402

SRC = ROOT / 'washing' / 'art'
OUT = ROOT / 'washing' / 'img'
CANVAS = (720, 900)
ART = {
    # 名前: (元の絵, 倍率, 横にずらす, 縦にずらす)
    'stand': ('stand_src.jpg', 0.71, 56, 2),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (src, s, dx, dy) in ART.items():
        img = key_out(Image.open(SRC / src))
        img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
        out = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
        out.alpha_composite(img, (dx, dy))
        out.save(OUT / (name + '.webp'), 'WEBP', quality=90, method=6)
        print('できました:', OUT / (name + '.webp'))


if __name__ == '__main__':
    main()
