# 📮 タヌくんのポストの絵のプロンプト

## P3 机でお返事を書くタヌくん（縦長版。2026-11-03 夜）
今の絵（post/art/writing_src.png。横長 1536×1024）は気に入っている。スマホは縦長なので、左右を切って大きく見せている。
**縦長（2:3）で描き直すと、切らずに画面いっぱいに出せる。**

### 添付するもの
1. 今の机の絵（writing_src.png）… 雰囲気・小物・色をそろえる
2. normal.webp … タヌくんの体つき・顔（デフォルメされないように）

### プロンプト（英語）
```
Redraw the attached illustration as a vertical (portrait) image, aspect ratio 2:3.
Keep the same character, art style, colors, lighting, and mood as the attached illustration.

Character: the same chubby tanuki as in the reference image (normal.webp).
Keep his body proportions exactly as in the reference — NOT chibi, NOT super-deformed, not a small head-heavy mascot.
Fluffy light grey-white hair, warm brown fur, dark brown fur around the eyes (tanuki eye mask), small round ears,
white tribal stripe paint on cheeks, shoulders and arms, a necklace of white fangs with wooden beads, big round soft belly.

Scene: inside a cozy tropical hut, he sits at a wooden desk and writes a reply letter with a white feather quill.
Gentle, happy smile, looking down at the letter with warm eyes, light blush.
On the desk: a sheet of letter paper with a small red hibiscus mark, an envelope with a red hibiscus stamp, a seashell, a small cup.
Background: a window with the sea and palm trees, a shelf with shells and books, a glowing lantern, red hibiscus flowers in a vase.

Composition: the character and desk are in the center of the image.
Show him from the chest up to the desk; his upper body, face, hands, the quill and the letter must be clearly visible.
Leave the top 15% of the image as calm background (ceiling, plants) with no important details — a speech bubble will be placed there.
Keep the bottom part simple (desk surface) — no important details in the bottom 20%.
No text, no letters or words written on the paper (only faint lines), no logo, no watermark.
```

### プロンプト（日本語。日本語で頼むとき）
```
添付したイラストを、縦長（2:3）に描き直してください。
キャラクター・画風・色・光・雰囲気は、添付のイラストと同じにしてください。

キャラクター：添付の normal.webp と同じ、ぽっちゃりしたタヌキ。
体の比率は参考画像のまま。デフォルメ・ちびキャラにしないでください（頭を大きくしない）。
ふわふわの明るい灰白色の髪、あたたかい茶色の毛、目のまわりの濃い茶色の模様、小さな丸い耳、
ほお・肩・腕の白い模様、白い牙と木のビーズの首飾り、丸くて大きなおなか。

場面：南の島の小屋の中。木の机に座って、白い羽ペンでお返事の手紙を書いている。
やさしく うれしそうな笑顔で、手紙を見ている。ほおが少し赤い。
机の上：赤いハイビスカスの印がある便せん、赤いハイビスカスの切手の封筒、貝がら、小さなカップ。
背景：海とヤシの木が見える窓、貝がらと本の棚、光るランプ、花びんの赤いハイビスカス。

構図：タヌくんと机を画面の真ん中に。胸から上と机が見えるように。顔・手・羽ペン・手紙をはっきり。
上の15%は、ふきだしを置くので、天井や葉っぱなど おだやかな背景だけにしてください。
下の20%も机の面だけにして、大事なものは置かないでください。
文字・ロゴ・透かしは入れないでください（便せんの文字は、うすい線だけ）。
```

### うまくいかないとき
- デフォルメされたら：「顔の表情と構図はそのままで、体と顔の比率だけ normal.webp に合わせて」
- 目のまわりの模様が消えたら：「目のまわりの濃い茶色の模様（タヌキの模様）を残して」
- できたら post/art/writing_src.png を差しかえて `python3 tools/make_post_art.py`（縦長なら style.css の .p-desk-img の見せ方も直す）
