import sys
from PIL import Image
OUT=sys.argv[1]
def C(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))+(255,)
pal={'k':C('#2c2c44'),'r':C('#9098b0'),'R':C('#b8c0d8'),'W':C('#eef2ff'),'s':C('#6c7490'),
 'K':C('#14502a'),'d':C('#2a8a3c'),'g':C('#3cb04a'),'G':C('#5cd05a'),'h':C('#86e866'),'H':C('#c4fa9c'),
 'b':C('#5a2e1a'),'B':C('#8a4a28'),'t':C('#c07a40'),'y':C('#ffe040'),'w':C('#ffffff'),'p':C('#ff9ccc'),'e':C('#ff4c4c')}
def mk(rows):
    im=Image.new('RGBA',(16,16),(0,0,0,0))
    for y,r in enumerate(rows):
        for x,ch in enumerate(r):
            if ch in pal: im.putpixel((x,y),pal[ch])
    return im
rock=["................","................","................","................","................","......kkkk......",".....kRWRrk.....","...kkRWRRrrkk...","..kRRWRRrrrrsk..","..kRRRRrrrrssk..",".kRRRrrrrrrsssk.",".krrrrrrrssssssk",".kssrrrrrsssssk.","..kkssssssskkk..","....kkkkkkkk....","................"]
rocks=["................","................","................","......kkkk......",".....kRWRrk.....","....kRWRRrrk....","..kkkRRrrrsk....",".kRWkkkrrssk.kk.",".kRRrrkkkkk.kRrk","kRRrrrrk..kRRrrk","krrrrsssk.krrrsk",".kssssssk.kssskk","..kkkkkkk..kkk..","................","................","................"]
bush=["................","................","................","....kkkk........","...kHhGGkkk.....","..kHhGGggGGkk...",".kHhGGgggGGgk...",".kHGGgggggggdk..",".kGGgggggggddk..",".kGgggggggdddk..",".kggggggddddk...","..kdgggdddddk...","...kkddddddkk...",".....kkkkkk.....","................","................"]
fbush=[r.replace('g','g') for r in bush]
fb=[list(r) for r in fbush]
for (x,y,c) in [(5,5,'y'),(8,6,'w'),(10,8,'y'),(4,8,'w'),(7,10,'y'),(11,5,'w'),(6,7,'p')]: fb[y][x]=c
fb=[''.join(r) for r in fb]
fence=["................","................","................","................","................","..kk......kk....",".kBBk....kBBk...",".kBtk....kBtk...","kkkkkkkkkkkkkkkk","kBBBBBBBBBBBBBBk","kbbbbbbbbbbbbbbk","kkkkkkkkkkkkkkkk",".kBtk....kBtk...",".kBBk....kBBk...",".kbbk....kbbk...",".kkkk....kkkk..."]
fence=["................","................","................","................","kk.....kk.....kk",".kBBBBBBBBBBBBk.","kkBtBtBtBtBtBtkk","kBBBBBBBBBBBBBBk","kbbbbbbbbbbbbbbk","kkkkkkkkkkkkkkkk","kBtk...kBtk..kBt","kBBk...kBBk..kBB","kbbk...kbbk..kbb","kkkk...kkkk..kkk","................","................"]
sign=["................","................","...kkkkkkkkkk...","..kBBBBBBBBBBk..","..kBttttttttBk..","..kBtbbbbbbtBk..","..kBttttttttBk..","..kBBBBBBBBBBk..","...kkkkBBkkkk...","......kBBk......","......kBBk......","......kBbk......","....kkkkkkkk....","................","................","................"]
for n,rows in dict(t5=rock,t6=rocks,t9=bush,t12=fb,t7=fence,t14=sign).items(): mk(rows).save(f'{OUT}/{n}.png')
