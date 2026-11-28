#!/usr/bin/env python3
"""Packs the PixelLab overworld sprites of the gym leaders into src/data/sprite-originals.js.

Sources: tools/leader-sprites/<look>/ as downloaded from PixelLab (rotations/<dir>.png and
animations/walking/<dir>/frame_00N.png, 32x32 canvases, figure about 12x17 px).
Each one becomes the 16 'char:<look>|<dir>|<frame>' entries of the game (16x24 px: a 16x17 body with
room above for hats), as "original"
art: the game shows it, the sprite editor can retouch it and "Restaurar original" goes back to it.

Frames: the game walks 1 (step) -> 3 (passing) -> 2 (other step) -> 0 (standing/passing).
PixelLab's 4-frame walk is f0 step, f1 passing, f2 other step, f3 passing.
West is east mirrored (PixelLab only drew south, east and north).

Run: python3 tools/leader-sprites/build.py
"""
import json, os, re
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ORIG = os.path.join(HERE, '..', '..', 'src', 'data', 'sprite-originals.js')
W, H = 16, 24  # taller than the usual 16x17: hats, plumes and buns stick out above, feet stay on the last row
ABC = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
GAME_FROM_PL = {0: 1, 1: 0, 2: 2, 3: 3}  # game frame -> PixelLab walk frame
DIRS = {'down': 'south', 'up': 'north', 'right': 'east', 'left': 'east'}


def fit(img, mirror):
    """Crops the 32x32 PixelLab canvas to a 16x24 cell, feet on the last row, centred."""
    img = img.convert('RGBA')
    # drop half-transparent fringe: pixel art is opaque or empty
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 255) if a >= 128 else (0, 0, 0, 0)
    if mirror:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    box = img.getbbox()
    x0, y0, x1, y1 = box
    cx = (x0 + x1) // 2
    left = cx - W // 2
    top = y1 - H
    if x1 - x0 > W:
        print('  warning: wider than 16 px, cropped', x1 - x0)
    if y1 - y0 > H:
        print('  warning: taller than %d px, top row(s) cropped' % H, y1 - y0)
    return img.crop((left, top, left + W, top + H))


def encode(img):
    data = img.tobytes()
    pal, index, rows = [], {}, []
    for y in range(H):
        row = []
        for x in range(W):
            r, g, b, a = data[(y * W + x) * 4:(y * W + x) * 4 + 4]
            if a == 0:
                row.append(None)
                continue
            col = '#%02x%02x%02x' % (r, g, b)
            if col not in index:
                index[col] = len(pal)
                pal.append(col)
            row.append(index[col])
        rows.append(row)
    c = 1 if len(pal) <= len(ABC) else 2
    code = (lambda i: ABC[i]) if c == 1 else (lambda i: ABC[i // len(ABC)] + ABC[i % len(ABC)])
    d = [''.join('.' * c if i is None else code(i) for i in row) for row in rows]
    return {'w': W, 'h': H, 'c': c, 'p': pal, 'd': d}


def main():
    looks = sorted(n for n in os.listdir(HERE) if os.path.isdir(os.path.join(HERE, n)))
    entries = {}
    for look in looks:
        src = os.path.join(HERE, look)
        for gdir, pdir in DIRS.items():
            for gf, pf in GAME_FROM_PL.items():
                path = os.path.join(src, 'animations', 'walking', pdir, f'frame_{pf:03d}.png')
                if not os.path.exists(path):
                    path = os.path.join(src, 'rotations', f'{pdir}.png')
                entries[f'char:{look}|{gdir}|{gf}'] = encode(fit(Image.open(path), gdir == 'left'))
        print(look)
    text = open(ORIG, encoding='utf-8').read()
    lines = text.split('\n')
    # drop older leader entries, then add the new ones before the closing brace
    keep = [l for l in lines if not re.match(r'^  "char:(%s)\|' % '|'.join(map(re.escape, looks)), l)]
    end = max(i for i, l in enumerate(keep) if l.startswith('};'))
    new = [f'  {json.dumps(k)}: {json.dumps(v, separators=(",", ":"))},' for k, v in entries.items()]
    if not keep[end - 1].rstrip().endswith(','):
        keep[end - 1] = keep[end - 1].rstrip() + ','
    keep[end:end] = new
    open(ORIG, 'w', encoding='utf-8').write('\n'.join(keep))
    print(f'{len(entries)} sprites from {len(looks)} leaders')


if __name__ == '__main__':
    main()
