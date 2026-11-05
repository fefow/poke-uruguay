import math, random, os, sys
from PIL import Image
OUT=sys.argv[1]
def C(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))+(255,)
K=C('#14502a'); D=C('#2a8a3c'); g=C('#3cb04a'); G=C('#5cd05a'); h=C('#86e866'); H=C('#c4fa9c')
BK=C('#5a2e1a'); BM=C('#8a4a28'); BL=C('#c07a40')
def tree(lobes, trunk=(14,17,4,9), tone=(D,g,G,h,H), flowers=None, seed=1, tcol=(BK,BM,BL)):
    rnd=random.Random(seed); S=32
    owner=[[-1]*S for _ in range(S)]
    for i,(cx,cy,r) in enumerate(lobes):
        for y in range(S):
            for x in range(S):
                if (x+.5-cx)**2+(y+.5-cy)**2<=r*r: owner[y][x]=i
    im=Image.new('RGBA',(S,S),(0,0,0,0)); px=im.load()
    # trunk first
    tx,ty,tw,th=trunk
    for y in range(ty,ty+th):
        for x in range(tx,tx+tw):
            c=tcol[1]
            if x==tx: c=tcol[2]
            if x==tx+tw-1: c=tcol[0]
            px[x,y]=c
    for x in range(tx-1,tx+tw+1):
        for y in range(ty,ty+th+1):
            if (x<tx or x>=tx+tw or y==ty+th) and 0<=x<S: 
                if px[x,y][3]==0: px[x,y]=K
    for y in range(S):
        for x in range(S):
            o=owner[y][x]
            if o<0: continue
            cx,cy,r=lobes[o]
            v=((x+.5-cx)*-0.55+(y+.5-cy)*-0.85)/r
            v+= (rnd.random()-.5)*0.12
            t=tone[0] if v<-0.55 else tone[1] if v<-0.1 else tone[2] if v<0.35 else tone[3] if v<0.72 else tone[4]
            px[x,y]=t
    # darker seams where a front lobe overlaps a back lobe
    for y in range(S):
        for x in range(S):
            o=owner[y][x]
            if o<0: continue
            for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
                nx,ny=x+dx,y+dy
                if 0<=nx<S and 0<=ny<S and owner[ny][nx]>=0 and owner[ny][nx]<o and (dx+dy)>0 and False: pass
            # seam: pixel owned by lobe o whose upper-left neighbour belongs to an earlier lobe -> shade
            nx,ny=x-1,y-1
            if 0<=nx<S and 0<=ny<S and owner[ny][nx]>=0 and owner[ny][nx]!=o and owner[ny][nx]<o:
                px[x,y]=tone[0]
    # outline
    for y in range(S):
        for x in range(S):
            if owner[y][x]<0: continue
            for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
                nx,ny=x+dx,y+dy
                if not(0<=nx<S and 0<=ny<S) or owner[ny][nx]<0:
                    px[x,y]=K
    # outer outline ring pixel outside mask for thickness on bottom edge
    for y in range(S):
        for x in range(S):
            if owner[y][x]>=0: continue
            if y>0 and owner[y-1][x]>=0 and px[x,y][3]==0: px[x,y]=K
    if flowers:
        for _ in range(flowers[1]):
            while True:
                x,y=rnd.randrange(S),rnd.randrange(S)
                if owner[y][x]>=0 and px[x,y]!=K: break
            px[x,y]=flowers[0]; 
            if x+1<S and owner[y][x+1]>=0 and px[x+1,y]!=K: px[x+1,y]=flowers[0]
    return im
def save(im,name): im.save(f'{OUT}/{name}.png')
RED=C('#f03c3c'); YEL=C('#ffe040'); WHT=C('#ffffff')
# cute round trees: bumpy canopy lifted so the trunk shows
T1=[(7,13,5),(25,13,5),(10,8,6),(22,8,6),(16,6,7),(6,18,5),(26,18,5),(16,13,10),(11,18,7),(21,18,7)]
tr=(14,21,4,10)
save(tree([(x,y-2,r) for x,y,r in T1],trunk=tr,seed=2),'tree')
save(tree([(x,y-2,r) for x,y,r in T1],trunk=tr,tone=(C('#3a9a2e'),C('#58c040'),C('#78d848'),C('#a4ec60'),C('#dcfc8c')),seed=5),'tree2')
OM=[(6,15,5),(26,15,5),(10,10,7),(22,10,7),(16,8,8),(16,15,9),(9,19,6),(23,19,6)]
save(tree([(x,y-1,r) for x,y,r in OM],trunk=(12,21,8,10),tone=(C('#1e6a3a'),C('#2e9048'),C('#44b058'),C('#6ccc70'),C('#a8ec98')),seed=7),'ombu')
cb=tree([(x,y-2,r) for x,y,r in T1],trunk=tr,seed=9)
cp=cb.load(); import random as _r; rr=_r.Random(4)
for _ in range(14):
    while True:
        x,y=rr.randrange(4,28),rr.randrange(3,22)
        if cp[x,y][3] and cp[x,y]!=K: break
    for dx,dy in((0,0),(1,0),(0,1),(1,1)):
        if cp[x+dx,y+dy][3] and cp[x+dx,y+dy]!=K: cp[x+dx,y+dy]=RED if (dx+dy)%2==0 else C('#ff7a6a')
save(cb,'ceibo')
# willow: tree with hanging strands
w=tree([(8,10,6),(24,10,6),(16,7,8),(16,12,8)],trunk=(14,17,4,13),seed=11)
px=w.load()
for x in range(4,29,3):
    for y in range(14,24):
        if px[x,y][3]==0 or (y>16 and px[x,y]==px[x,y]):
            px[x,y]=G if y%2 else g
        px[x-1,y]=K if px[x-1,y][3]==0 and y>14 else px[x-1,y]
save(w,'willow')
# pine: stacked cartoon triangles
def pine():
    S=32; im=Image.new('RGBA',(S,S),(0,0,0,0)); px=im.load()
    for x in range(14,18):
        for y in range(25,31): px[x,y]=BM; 
    for y in range(25,31): px[14,y]=BL; px[17,y]=BK
    for x in range(13,19): px[x,31]=K
    layers=[(1,12,6),(8,18,9),(15,24,11)]
    for top,bot,half in layers:
        for y in range(top,bot+1):
            wd=(y-top+1)/(bot-top+1)*half
            for x in range(S):
                dx=x+.5-16
                if abs(dx)<=wd:
                    v=(dx*-.6+(y-(top+bot)/2)*-.5)/half
                    px[x,y]=D if v<-.4 else g if v<0 else G if v<.45 else h
        # outline
    mask=[[px[x,y][3]>0 and px[x,y]!=BM and px[x,y]!=BL and px[x,y]!=BK for x in range(S)] for y in range(S)]
    for y in range(S):
        for x in range(S):
            if mask[y][x]:
                for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
                    nx,ny=x+dx,y+dy
                    if not(0<=nx<S and 0<=ny<S) or not mask[ny][nx]: px[x,y]=K
    # layer skirts
    for top,bot,half in layers[1:]:
        for x in range(S):
            if mask[top][x] if top<S else False: px[x,top]=K
    return im
save(pine(),'pine')
# palm
def palm():
    S=32; im=Image.new('RGBA',(S,S),(0,0,0,0)); px=im.load()
    for y in range(12,31):
        for x in range(15,18): px[x,y]=BM
        px[15,y]=BL; px[17,y]=BK; px[14,y]=K; px[18,y]=K
        if y%4==0:
            for x in range(15,18): px[x,y]=BK
    for x in range(14,19): px[x,31]=K
    def frond(dx,dy):
        for i in range(0,13):
            x=int(16+dx*i*0.9); y=int(10+dy*i*0.9+ (i*i)*0.02*(1 if dy>=0 else -0) + (i*i*0.025 if dx else 0)*0)
            y=int(10+dy*i*0.8+i*i*0.03)
            for ox,oy in((0,0),(0,1),(1,0)):
                X,Y=x+ox,y+oy
                if 0<=X<S and 0<=Y<S: px[X,Y]=g if (i%2) else G
            for ox,oy in((-1,0),(2,0),(0,-1),(1,2),(0,2)):
                X,Y=x+ox,y+oy
                if 0<=X<S and 0<=Y<S and px[X,Y][3]==0: px[X,Y]=K
    for d in((-1,-.3),(1,-.3),(-.8,-.8),(.8,-.8),(0,-1),(-1,.1),(1,.1)): frond(*d)
    for (x,y) in((16,10),(17,10),(16,11),(17,11)): px[x,y]=BM
    return im
save(palm(),'palm')
