"""洗うゲーム（washing/）の絵をつくる（マゼンタの背景を抜いて、立ち絵 images/normal.webp と同じ並べ方の webp にする）

使い方（tanukun フォルダで）:
    python3 tools/make_washing_art.py

washing/art/*_src（Gemini で描いた、腰みの・ネックレスなしの絵。背景はマゼンタ）
  stand（前向き。848×1264）→ washing/img/stand.webp（720×900。立ち絵 images/normal.webp とぴったり重なる大きさ・位置。背景は透明）
  banzai（ばんざい。1152×1712）・mojimoji（もじもじ）・shake（ぶるぶる）・back（真後ろ）・lookback（うしろでふり返る）（1027×1532）
    → washing/img/*.webp（720×940。上に PAD=40px の余白をつけて、上げた手や頭が切れないように。ゲームでは y=-40 に置く）
  sp_<名前>_src → img/sp_<名前>.webp（ごほうびの特別イラスト。幅 810・縦横比はそのまま。あるものだけ）
  items（小物のまとめ絵）→ washing/img/item_*.webp（1つずつ切り分け。半分の大きさ）

・立ち絵と同じ並べ方にそろえるので、表情は今ある立ち絵（images/happy.webp など）の顔だけを、ゲームの中で上に重ねて使える
・FIT（倍率と、ずらす量）は、立ち絵と形がいちばん重なる値を探して決めた（重なり 96%。残りは腰みのの分）
・背景の抜き方は丸太シーソーと同じ（tools/make_seesaw_art.py の key_out）
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_seesaw_art import key_out  # noqa: E402

SRC = ROOT / 'washing' / 'art'
OUT = ROOT / 'washing' / 'img'
CANVAS = (720, 900)
PAD = 40   # stand 以外の絵は、上にこの余白をつける
ART = {
    # 名前: (元の絵, 倍率, 横にずらす, 縦にずらす, 上の余白)。倍率とずらす量は、立ち絵と下半身の形がいちばん重なる値
    'stand':    ('stand_src.jpg',    0.71,   56,  2, 0),
    'banzai':   ('banzai_src.jpg',   0.557,  28, -57, PAD),   # 描き直し版（2026-11-02。ひじを曲げた拳のばんざい。1152×1712）。足もと優先で合わせた：重なり 87%（足から下）・91%（下半身）
    'mojimoji': ('mojimoji_src.png', 0.5925, 62, -5, PAD),    # 重なり 90%
    'shake':    ('shake_src.png',    0.59,   55, -4, PAD),    # 重なり 91%
    'back':     ('back_src.png',     0.6125, 51, -39, PAD),   # 真後ろ（大きさと足の位置をそろえた。ふり返りの絵は耳の位置が不自然なのでやめた）
    'lookback': ('lookback_src.png', 0.6225, 47, -36, PAD),   # うしろで、ふり返る（体は back と 98% 重なる。顔だけちがう）
}
# 小物のまとめ絵（items_src.png）を切り分けたときの名前（左上から右へ、上の段から順に）
ITEMS = ['conch', 'clam', 'star', 'kelp1', 'kelp2', 'sand1', 'sand2', 'sand3', 'mud1', 'mud2', 'brush', 'dryer', 'bamboo']


# ごほうびの特別イラスト（結果の画面に出す）。washing/art/sp_<名前>_src.（png か jpg）を置くと、img/sp_<名前>.webp になる。
# 名前は washing.js の REWARDS の id と同じ。絵が置いてあるものだけ作る。できたら REWARDS の src を 'img/sp_<名前>.webp' にする
REWARD_IDS = ['towel', 'stumble', 'splash', 'zukan']   # zukan＝ずかんがそろったときのとくべつイラスト（ZK_SPECIAL）
REWARD_WIDTH = 810   # 縦横 3:4 の絵（1086×1448）を、切らずに幅 810（810×1080）に縮める


def make_rewards():
    for name in REWARD_IDS:
        src = next((p for ext in ('png', 'jpg', 'jpeg', 'webp') for p in [SRC / f'sp_{name}_src.{ext}'] if p.exists()), None)
        if not src:
            print('ごほうびの絵はまだありません:', name)
            continue
        im = Image.open(src).convert('RGB')
        im = im.resize((REWARD_WIDTH, round(im.height * REWARD_WIDTH / im.width)), Image.LANCZOS)
        im.save(OUT / f'sp_{name}.webp', 'WEBP', quality=88, method=6)
        print('できました:', OUT / f'sp_{name}.webp', im.size)


def make_cutface():
    """カットインの笑顔：本編の笑い顔（images/happy.webp）の顔まわりを、水色の背景にのせて 320×320 に"""
    im = Image.open(ROOT / 'images' / 'happy.webp').convert('RGBA').crop((208, 4, 442, 238))   # 顔と耳（首かざりより上）
    bg = Image.new('RGBA', im.size, (191, 230, 255, 255))
    bg.alpha_composite(im)
    bg = bg.convert('RGB').resize((320, 320), Image.LANCZOS)
    bg.save(OUT / 'cut_face.webp', 'WEBP', quality=90, method=6)
    print('できました:', OUT / 'cut_face.webp')


def components(mask, step=4):
    """不透明な所のかたまりを、外わくの四角で返す（小さく縮めて数える。scipy なし）"""
    small = mask[::step, ::step]
    h, w = small.shape
    seen = np.zeros_like(small, bool)
    boxes = []
    for y in range(h):
        for x in range(w):
            if not small[y, x] or seen[y, x]:
                continue
            stack = [(y, x)]; seen[y, x] = True
            x0 = x1 = x; y0 = y1 = y; n = 0
            while stack:
                cy, cx = stack.pop(); n += 1
                x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
                for ny in range(cy - 2, cy + 3):          # 少しはなれた点（泥はねのしずく）も同じかたまりに
                    for nx in range(cx - 2, cx + 3):
                        if 0 <= ny < h and 0 <= nx < w and small[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True; stack.append((ny, nx))
            if n > 20:
                boxes.append((x0 * step, y0 * step, (x1 + 1) * step, (y1 + 1) * step))
    # 近くの小さなかたまり（砂よごれのはしの小さな粒など）は、となりのかたまりにまとめる
    merged = True
    while merged:
        merged = False
        for i in range(len(boxes)):
            for j in range(i + 1, len(boxes)):
                a, c = boxes[i], boxes[j]
                if a[0] - 24 < c[2] and c[0] - 24 < a[2] and a[1] - 24 < c[3] and c[1] - 24 < a[3]:
                    boxes[i] = (min(a[0], c[0]), min(a[1], c[1]), max(a[2], c[2]), max(a[3], c[3])); del boxes[j]; merged = True; break
            if merged:
                break
    # 上の段から（行のまんなかの高さで3段に分ける）、左から
    boxes.sort(key=lambda b: (round(((b[1] + b[3]) / 2) / (mask.shape[0] / 3) - 0.5), b[0]))
    return boxes


# うしろの絵の縮め方（倍率・横・縦）。まえの立ち絵と形の重なりがいちばん大きい値（重なり 83%。しっぽの向きがちがう分は残る）。
# washing.js の BACK（座標の変換）と同じ値にすること：新しい位置 = 古い位置 × k ＋ (x0, y0 − PAD + PAD × k)
BACK_FIT = (0.94, 10, 48)
SHOWER_CUT_Y = 472   # シャワーヘッドの元の絵で、これより上（横の管と壁の台）を切りとる


def refit(name, fit):
    """720×940 の絵を k 倍に縮めて、(x0, y0) に置きなおす"""
    k, x0, y0 = fit
    im = Image.open(OUT / (name + '.webp')).convert('RGBA')
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    out = Image.new('RGBA', (CANVAS[0], CANVAS[1] + PAD), (0, 0, 0, 0))
    out.alpha_composite(im, (x0, y0))
    out.save(OUT / (name + '.webp'), 'WEBP', quality=90, method=6)
    print('縮めました:', name, fit)


def match_colors(name, ref, y_from=200):
    """name の絵の色を、ref の絵にそろえる（両方とも不透明な所のうち、y_from より下＝顔をのぞいた体の所で、チャンネルごとに平均と散らばりを合わせる）"""
    a = np.asarray(Image.open(OUT / (name + '.webp')).convert('RGBA')).astype(np.float64)
    r = np.asarray(Image.open(OUT / (ref + '.webp')).convert('RGBA')).astype(np.float64)
    m = (a[..., 3] > 220) & (r[..., 3] > 220)
    m[:y_from + PAD] = False
    for c in range(3):
        sa, sr = a[..., c][m], r[..., c][m]
        a[..., c] = (a[..., c] - sa.mean()) * (sr.std() / max(1e-6, sa.std())) + sr.mean()
    out = Image.fromarray(np.clip(a, 0, 255).round().astype(np.uint8), 'RGBA')
    out.save(OUT / (name + '.webp'), 'WEBP', quality=90, method=6)
    print('色をそろえました:', name, '→', ref)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (src, s, dx, dy, pad) in ART.items():
        img = key_out(Image.open(SRC / src))
        img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
        out = Image.new('RGBA', (CANVAS[0], CANVAS[1] + pad), (0, 0, 0, 0))
        out.alpha_composite(img, (max(dx, 0), max(dy + pad, 0)), (max(-dx, 0), max(-(dy + pad), 0)))
        out.save(OUT / (name + '.webp'), 'WEBP', quality=90, method=6)
        print('できました:', OUT / (name + '.webp'))
    # うしろの絵は、まえより一回り大きかった（ユーザーの指摘「うしろの方がガタイが大きい？」）→ まえの形といちばん重なるように縮める
    for n in ('back', 'lookback'):
        refit(n, BACK_FIT)
    # ふり返りの絵は、真後ろの絵より少し色が薄い（ユーザーの指摘）→ 体の重なる所（首から下）で、色の平均と散らばりを真後ろの絵にそろえる
    match_colors('lookback', 'back')
    make_rewards()
    make_cutface()   # 洗い終わったときのカットインの笑顔
    # シャワールームの背景（2026-11-02。ユーザーが Gemini で描いた絵。そのまま縮めて使う）
    room = Image.open(SRC / 'room_src.png').convert('RGB')
    room = room.resize((900, round(room.height * 900 / room.width)), Image.LANCZOS)
    room.save(OUT / 'room.webp', 'WEBP', quality=86, method=6)
    print('できました:', OUT / 'room.webp', room.size)
    # シャワーヘッド（2026-11-02。指の上を動くので、壁につける横の管と丸い台は切りとって、頭と短い首だけにする）
    sh = key_out(Image.open(SRC / 'showerhead_src.png'))
    sh = sh.crop((0, SHOWER_CUT_Y, sh.width, sh.height))
    sh = sh.crop(sh.getbbox())
    sh = sh.resize((sh.width // 3, sh.height // 3), Image.LANCZOS)
    sh.save(OUT / 'item_showerhead.webp', 'WEBP', quality=90, method=6)
    print('できました:', OUT / 'item_showerhead.webp', sh.size)
    # 小物
    items = key_out(Image.open(SRC / 'items_src.png'))
    boxes = components(np.asarray(items)[..., 3] > 40)
    if len(boxes) != len(ITEMS):
        raise SystemExit(f'小物の数が合いません（見つかった数 {len(boxes)}、名前の数 {len(ITEMS)}）')
    for name, (x0, y0, x1, y1) in zip(ITEMS, boxes):
        m = 6
        part = items.crop((max(0, x0 - m), max(0, y0 - m), min(items.width, x1 + m), min(items.height, y1 + m)))
        part = part.resize((max(1, part.width // 2), max(1, part.height // 2)), Image.LANCZOS)
        part.save(OUT / ('item_' + name + '.webp'), 'WEBP', quality=90, method=6)
        print('できました:', OUT / ('item_' + name + '.webp'), part.size)


if __name__ == '__main__':
    main()
