import sys, json
from PIL import Image
repo = sys.argv[1]
ABC = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
def enc(path):
    im = Image.open(path).convert('RGBA'); w, h = im.size; px = list(im.getdata())
    pal, idx, out = [], {}, []
    for r, g, b, a in px:
        if a == 0: out.append(-1); continue
        col = '#%02x%02x%02x' % (r, g, b) + ('' if a == 255 else '%02x' % a)
        if col not in idx: idx[col] = len(pal); pal.append(col)
        out.append(idx[col])
    c = 1 if len(pal) <= 62 else 2
    code = (lambda i: ABC[i]) if c == 1 else (lambda i: ABC[i // 62] + ABC[i % 62])
    d = [''.join(('.' * c) if out[y*w+x] < 0 else code(out[y*w+x]) for x in range(w)) for y in range(h)]
    return {'w': w, 'h': h, 'c': c, 'p': pal, 'd': d}
pack = {}
for kind, pre in (('terreno', 'ter'), ('objetos', 'obj')):
    for i in range(16): pack[f'{pre}{i}'] = enc(f'{repo}/art/pixellab/{kind}/t{i}.png')
lines = ['// 16x16 terrain and scenery tiles generated with PixelLab (sources in art/pixellab/).',
 '// Used by the "Nuevo" terrain style (Opciones > Terreno); the "Clásico" style keeps the original art.',
 '// Generated file: re-run the import instead of editing by hand.',
 'export const TILE_PACK = {']
lines += [f'  {json.dumps(k)}: {json.dumps(v, separators=(",", ":"))},' for k, v in pack.items()]
lines.append('};\n')
open(f'{repo}/src/data/tile-pack.js', 'w').write('\n'.join(lines))
print(len(pack), 'tiles')
