"""デベソの絵（背景透過）をつくる：日本の漫画風（丸いでっぱり＋細い輪郭線＋まんなかに「×」）

使い方（tanukun フォルダで）:
    python3 tools/make_debeso.py   → images/parts/debeso.webp

色や大きさを変えたいときは、下の数字を変えて実行しなおしてください。
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

SS = 4                       # なめらかにするため、4倍の大きさで描いてから縮める
W, H = 56, 56                # できあがりの大きさ（ピクセル。720×900 の絵に合わせた大きさ）
R = 19                       # でっぱりの半径
SKIN = np.array([226, 161, 106.])    # まわりのおなかの色
BALL = np.array([236, 174, 120.])    # でっぱりの色（少し明るめ）
LINE = np.array([92, 52, 32.])       # 輪郭線の色（タヌくんの線画に合わせた焦げ茶）
MARK = np.array([172, 86, 60.])      # 「×」の色

w, h = W * SS, H * SS
yy, xx = np.mgrid[0:h, 0:w].astype(float) / SS
cx, cy = W / 2, H / 2 - 1.5

img = np.zeros((h, w, 3)) + SKIN
# 外側：ふちをぼかして、下にある元の「へこみヘソ」を隠す
rr = np.hypot(xx - W / 2, yy - H / 2) / (W * 0.49)
alpha = np.clip((1 - rr) / 0.3, 0, 1)

# でっぱりの下に落ちる影（おなかの上）
sh = np.exp(-(((xx - cx - 1) / (R * 0.95)) ** 2 + ((yy - cy - R * 0.55) / (R * 0.55)) ** 2))
img *= (1 - 0.22 * sh)[..., None]

# でっぱり（丸い玉）
u, v = (xx - cx) / R, (yy - cy) / R
d = np.hypot(u, v)
nz = np.sqrt(np.clip(1 - d * d, 0, 1))
ball = BALL * (0.86 + 0.14 * nz)[..., None]
# 下半分はやわらかい影、上は明るく（水彩っぽく、ぼかし気味に）
ball *= (1 - 0.2 * np.clip(v + 0.15, 0, 1) ** 1.5)[..., None]
hl = np.exp(-(((xx - cx + R * 0.25) / (R * 0.55)) ** 2 + ((yy - cy + R * 0.5) / (R * 0.3)) ** 2))
ball += (np.array([252, 226, 196]) - ball) * (0.45 * hl)[..., None]
m = np.clip((1 - d) * R / 0.8, 0, 1)[..., None]
img = img * (1 - m) + ball * m

# 輪郭線：下側と左上を少し太く、右上は細く切れぎみ（漫画の線っぽく）
ang = np.arctan2(v, u)                       # 下が +π/2
width = 0.3 + 0.9 * np.clip(np.sin(ang), 0, 1) + 0.35 * np.clip(-np.cos(ang + 0.6), 0, 1)
gap = np.clip((np.cos(ang + 0.9) - 0.6) / 0.2, 0, 1)   # 右上の切れ目
line = np.clip(1 - np.abs(d - 1) * R / width, 0, 1) * (1 - gap)
img = img * (1 - 0.75 * line)[..., None] + LINE * (0.75 * line)[..., None]


# まんなかの「×」
def stroke(x0, y0, x1, y1, t):
    px, py = xx - x0, yy - y0
    dx, dy = x1 - x0, y1 - y0
    k = np.clip((px * dx + py * dy) / (dx * dx + dy * dy), 0, 1)
    dist = np.hypot(px - k * dx, py - k * dy)
    return np.clip((t / 2 - dist) / 0.6 + 0.5, 0, 1)


s = R * 0.3
xm = np.maximum(stroke(cx - s, cy - s, cx + s, cy + s, 2.2),
                stroke(cx + s, cy - s, cx - s, cy + s, 2.2)) * (d < 0.95)
img = img * (1 - 0.9 * xm)[..., None] + MARK * (0.9 * xm)[..., None]

out = np.dstack([np.clip(img, 0, 255), alpha * 255]).astype(np.uint8)
dst = ROOT / 'images' / 'parts' / 'debeso.webp'
dst.parent.mkdir(parents=True, exist_ok=True)
Image.fromarray(out, 'RGBA').resize((W, H), Image.LANCZOS).save(dst, lossless=True)
print('できました:', dst)
