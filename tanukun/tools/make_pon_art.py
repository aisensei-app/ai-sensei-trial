"""ぽんぽこリズムの絵をつくる（pon/art の元の絵 → images/pon）

使い方（tanukun フォルダで）:
    python3 tools/make_pon_art.py

・おなかのアップ（C1・D2・D3）：マゼンタ背景を透明に → 本編の絵と同じ色味に → 640×960
    images/pon/belly0.webp（ふつう）・belly1.webp（ぽっこり）・belly2.webp（まんまる）
    3枚とも同じ変え方をするので、3枚の間の色はそろったまま
・ランク別イラスト（A1〜A4）：720×1080（2:3）
    images/pon/rank1.webp（ぽんぽこ名人）〜 rank4.webp（れんしゅう中）
・まんぷくの顔（D3b）：マゼンタ背景を透明に → 色味をそろえる → 512×512
    images/pon/face_full.webp
元の絵（ChatGPT で作ったもの）は pon/art に置いてある。公開用のファイルには入れない。
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
from make_pose import key                                         # noqa: E402  マゼンタ背景を透明にする
from match_colors import NAMES, body, to_hsv, to_rgb              # noqa: E402  色をそろえる

ART = ROOT / 'pon' / 'art'
OUT = ROOT / 'images' / 'pon'


def target():
    """本編の絵の「体の色」の平均（色合い・あざやかさ・明るさ）"""
    vals = []
    for n in NAMES:
        f = ROOT / 'images' / (n + '.webp')
        if not f.exists():
            continue
        a = np.asarray(Image.open(f).convert('RGBA')).astype(float)
        h, s, v = to_hsv(a[..., :3])
        m = body(a, h) & (s > 0.15)
        vals.append((h[m].mean(), s[m].mean(), v[m].mean()))
    return np.mean(vals, axis=0)


def stats(im):
    a = np.asarray(im.convert('RGBA')).astype(float)
    h, s, v = to_hsv(a[..., :3])
    m = body(a, h) & (s > 0.15)
    return h[m].mean(), s[m].mean(), v[m].mean()


def recolor(im, ref, goal):
    """ref の体の色が goal になる変え方で、im の色を変える"""
    a = np.asarray(im.convert('RGBA')).astype(float)
    h, s, v = to_hsv(a[..., :3])
    out = a.copy()
    out[..., :3] = np.clip(to_rgb((h + (goal[0] - ref[0])) % 1,
                                  np.clip(s * (goal[1] / ref[1]), 0, 1),
                                  np.clip(v * (goal[2] / ref[2]), 0, 1)), 0, 255)
    return Image.fromarray(out.round().astype(np.uint8), 'RGBA')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    goal = target()
    print('本編の体の色  色合い %.1f°  あざやかさ %.1f%%  明るさ %.1f%%' % (goal[0] * 360, goal[1] * 100, goal[2] * 100))

    bellies = [key(ART / (n + '.webp')) for n in ['C1_belly', 'D2_pokkori', 'D3_manmaru']]
    ref = stats(bellies[0])
    print('おなかのアップ 色合い %.1f°  あざやかさ %.1f%%  明るさ %.1f%%' % (ref[0] * 360, ref[1] * 100, ref[2] * 100))
    for i, im in enumerate(bellies):
        recolor(im, ref, goal).resize((640, 960), Image.LANCZOS).save(OUT / f'belly{i}.webp', quality=90, method=6)

    for i, n in enumerate(['A1_meijin', 'A2_iirhythm', 'A3_nakanaka', 'A4_renshu']):
        im = Image.open(ART / (n + '.webp')).convert('RGB')
        im.resize((720, 1080), Image.LANCZOS).save(OUT / f'rank{i + 1}.webp', quality=86, method=6)

    face = key(ART / 'D3b_face.webp')
    recolor(face, stats(face), goal).resize((512, 512), Image.LANCZOS).save(OUT / 'face_full.webp', quality=90, method=6)

    for f in sorted(OUT.glob('*.webp')):
        print('できました:', f.relative_to(ROOT), f'({f.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
