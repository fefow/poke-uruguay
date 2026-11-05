"""Builds src/data/tile-pack.js from the PNGs in art/pixellab/ (run: python3 -I tools/pixellab-pack.py .).
terreno/*.png  16x16 ground tiles (named)   objetos/t*.png  16x16 scenery   grandes/*.png  32x32 trees drawn over 2x2 tiles."""
import sys, json, os, glob
from PIL import Image
repo = sys.argv[1]
ABC = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
def enc(path):
    im = Image.open(path).convert('RGBA'); w, h = im.size
    pal, idx, out = [], {}, []
    for y in range(h):
        for x in range(w):
            r, g, b, a = im.getpixel((x, y))
            if a < 128: out.append(-1); continue
            col = '#%02x%02x%02x' % (r, g, b)
            if col not in idx: idx[col] = len(pal); pal.append(col)
            out.append(idx[col])
    c = 1 if len(pal) <= 62 else 2
    code = (lambda i: ABC[i]) if c == 1 else (lambda i: ABC[i // 62] + ABC[i % 62])
    d = [''.join(('.' * c) if out[y*w+x] < 0 else code(out[y*w+x]) for x in range(w)) for y in range(h)]
    return {'w': w, 'h': h, 'c': c, 'p': pal, 'd': d}
pack = {}
for f in sorted(glob.glob(f'{repo}/art/pixellab/terreno/*.png')): pack['g_' + os.path.basename(f)[:-4]] = enc(f)
for f in sorted(glob.glob(f'{repo}/art/pixellab/objetos/t*.png')): pack['obj' + os.path.basename(f)[1:-4]] = enc(f)
for f in sorted(glob.glob(f'{repo}/art/pixellab/grandes/*.png')): pack['big_' + os.path.basename(f)[:-4]] = enc(f)
lines = ['// Tiles generated with PixelLab (sources in art/pixellab/), used by the "Nuevo" terrain style (Opciones > Terreno).',
 '// Generated file: run tools/pixellab-pack.py instead of editing by hand.', 'export const TILE_PACK = {']
lines += [f'  {json.dumps(k)}: {json.dumps(v, separators=(",", ":"))},' for k, v in pack.items()]
lines.append('};\n')
open(f'{repo}/src/data/tile-pack.js', 'w').write('\n'.join(lines))
print(len(pack), 'sprites')
