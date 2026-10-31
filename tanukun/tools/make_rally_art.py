"""ぽよんラリーの結果画面の絵をつくる（rally/art の元の絵 → images/rally。720×1080）

使い方（tanukun フォルダで）:
    python3 tools/make_rally_art.py

元の絵（ChatGPT で作ったもの。プロンプトは pon/ILLUST_PROMPTS.md の⑧）は rally/art に置いてある。公開用のファイルには入れない。
    R1_sweat.webp     … 汗をぬぐう（採用）。R1_sweat_alt.webp はしっぽが左がわ・汗が多すぎるので不採用
    R2_sand.webp      … 砂だらけ（足の指が5本・爪があり不採用）→ R2_sand_v2.webp（直したもの。採用）
    R3_daiji.webp     … 大の字で ひと休み（採用）
    R4_spin.webp      … 指の上でボールをくるくる回して、ウインク（ぽよんマスター。採用）
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / 'rally' / 'art'
OUT = ROOT / 'images' / 'rally'
# 元の絵 → 公開用の名前
PICK = {'R1_sweat.webp': 'clear_sweat.webp', 'R2_sand_v2.webp': 'clear_sand.webp', 'R3_daiji.webp': 'clear_rest.webp',
        'R4_spin.webp': 'clear_spin.webp'}

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for src, dst in PICK.items():
        Image.open(ART / src).convert('RGB').resize((720, 1080), Image.LANCZOS).save(OUT / dst, quality=86, method=6)
        print('できました:', OUT / dst, f'({(OUT / dst).stat().st_size // 1024} KB)')
