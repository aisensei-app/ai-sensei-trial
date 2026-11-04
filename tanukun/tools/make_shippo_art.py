"""しっぽ ふさふさ（shippo/）の絵をつくる（マゼンタの背景を抜く）

使い方（tanukun フォルダで）:
    python3 tools/make_shippo_art.py

shippo/art/*_src.png（ユーザーが描いた絵。背景はマゼンタ）→ shippo/img/*.webp（背景は透明）
  back      … うしろ姿（ふり返って笑う。しっぽなし）。1024×1536 → 768×1152
  tail      … しっぽ（ふつう）、tail_puff … しっぽ（ボワッ）。1536×1024 → 768×512（2枚は同じ大きさ・同じ位置のまま）
背景の抜き方は丸太シーソーと同じ（tools/make_seesaw_art.py の key_out）
"""
import sys
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_seesaw_art import key_out  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SIZES = {'back': (768, 1152), 'tail': (768, 512), 'tail_puff': (768, 512)}


def main():
    for name, size in SIZES.items():
        im = Image.open(ROOT / 'shippo' / 'art' / (name + '_src.png')).convert('RGB')
        im = key_out(im).resize(size, Image.LANCZOS)
        im.save(ROOT / 'shippo' / 'img' / (name + '.webp'), quality=90, method=6)
        print('できました: shippo/img/' + name + '.webp', im.size, im.getbbox())


if __name__ == '__main__':
    main()
