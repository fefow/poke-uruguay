import random, sys
from PIL import Image
OUT=sys.argv[1]
def C(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))+(255,)
K=C('#14502a'); D=C('#2a8a3c'); g=C('#3cb04a'); G=C('#5cd05a'); h=C('#86e866'); H=C('#c4fa9c')
BASE=C('#70dc58'); TUFT=C('#48b848'); LIGHT=C('#a8f488')
def new(c): return Image.new('RGBA',(16,16),c)
def put(im,x,y,c): im.putpixel((x%16,y%16),c)
def grass(seed,tufts=5):
    r=random.Random(seed); im=new(BASE)
    for _ in range(tufts):
        x,y=r.randrange(16),r.randrange(16)
        put(im,x,y,TUFT); put(im,x+1,y,TUFT); put(im,x,y-1,TUFT)
        put(im,x-1,y-1,LIGHT) 
    for _ in range(4): put(im,r.randrange(16),r.randrange(16),LIGHT)
    return im
def save(im,n): im.save(f'{OUT}/{n}.png')
save(grass(3),'grass'); save(grass(8,7),'flow')
# flowers on grass
def flowers(seed,cols):
    im=grass(seed,3); r=random.Random(seed+1)
    for _ in range(6):
        x,y=r.randrange(1,14),r.randrange(1,13); c=r.choice(cols)
        put(im,x,y,c); put(im,x+1,y,c); put(im,x,y+1,c); put(im,x+1,y+1,c)
        put(im,x,y,C('#ffffff') if c!=C('#ffffff') else c); put(im,x+1,y+2,TUFT)
    return im
save(flowers(21,[C('#ff4c4c'),C('#ffe040')]),'fl_red'); save(flowers(33,[C('#ffffff'),C('#ff9ccc')]),'fl_pink')
# path
def path(seed):
    r=random.Random(seed); im=new(C('#ecc474'))
    for _ in range(9): put(im,r.randrange(16),r.randrange(16),C('#f8dc96'))
    for _ in range(5):
        x,y=r.randrange(16),r.randrange(16); put(im,x,y,C('#c89c54')); put(im,x+1,y,C('#c89c54'))
    return im
save(path(5),'path')
# sand
r=random.Random(9); s=new(C('#fae6ac'))
for y in (3,9,14):
    x0=r.randrange(16)
    for i in range(6): put(s,x0+i,y+(1 if i in(2,3) else 0),C('#ecd08c'))
for _ in range(5): put(s,r.randrange(16),r.randrange(16),C('#fff4cc'))
save(s,'sand')
# water: bright with white ripples
w=new(C('#4cb0fa'))
for (x,y,l) in [(1,2,4),(9,5,5),(3,9,4),(11,12,4),(6,14,3)]:
    for i in range(l): put(w,x+i,y,C('#d8f4ff'))
    put(w,x+1,y+1,C('#2c8ce6')); put(w,x+2,y+1,C('#2c8ce6'))
save(w,'water'); save(w,'water2')
# pavement
p=new(C('#d4d8e4'))
for i in range(16): put(p,i,0,C('#8c94aa')); put(p,i,8,C('#8c94aa')); put(p,0 if i<8 else 8,i,C('#8c94aa')) if False else None
for y in range(0,8): put(p,0,y,C('#8c94aa')); put(p,0,y+8,C('#8c94aa')) if False else None
for y in range(8,16): put(p,8,y,C('#8c94aa'))
for y in range(0,8): put(p,0,y,C('#8c94aa'))
for (x,y) in [(1,1),(2,1),(9,9),(10,9)]: put(p,x,y,C('#f4f6fc'))
save(p,'pave')
# cobbles
c=new(C('#c89c64'))
for (x,y,w_,h_) in [(0,0,7,5),(8,0,8,5),(0,6,5,5),(6,6,6,5),(13,6,3,5),(0,12,7,4),(8,12,8,4)]:
    for yy in range(y,y+h_):
        for xx in range(x,x+w_):
            e=xx in(x,x+w_-1) or yy in(y,y+h_-1)
            put(c,xx,yy,C('#7c5830') if e else C('#e0b878'))
    put(c,x+1,y+1,C('#f8dca0'))
save(c,'cob')
# bridge
b=new(C('#b87838'))
for y in (0,5,10,15):
    for x in range(16): put(b,x,y,C('#5a3014'))
for y in (1,6,11): 
    for x in range(16): put(b,x,y,C('#dc9c58'))
for y in (2,7,12): put(b,1,y,C('#3a2010')); put(b,14,y,C('#3a2010'))
save(b,'bridge')
# tall grass (cartoon blades with outline)
t=new(BASE)
cell=["..k...k.","kgk.kgk.","kGgkkGgk","kGGgkGGg","kgGGgkgG","kDgGGgDk",".kDDDDk.","........"]
col={'k':K,'g':g,'G':G,'D':D}
for oy in (0,8):
    for ox in (0,8):
        for y,row in enumerate(cell):
            for x,ch in enumerate(row):
                if ch in col: put(t,ox+x,oy+y,col[ch])
        put(t,ox+3,oy+3,H)
save(t,'tall')
