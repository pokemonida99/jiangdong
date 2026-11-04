# contact sheet of work/art: python3 tools/contact.py out.png [dir]
import sys,glob,os
from PIL import Image,ImageDraw
d=sys.argv[2] if len(sys.argv)>2 else 'work/art'
fs=sorted(glob.glob(d+'/*.png')); cols=5; cw=300; ch=340
rows=(len(fs)+cols-1)//cols
S=Image.new('RGB',(cols*cw,rows*ch),(40,40,40)); D=ImageDraw.Draw(S)
for i,f in enumerate(fs):
    im=Image.open(f).convert('RGB'); im.thumbnail((cw-8,ch-30)); x,y=(i%cols)*cw+4,(i//cols)*ch+24
    S.paste(im,(x,y)); D.text((x,y-18),os.path.basename(f)+f' {Image.open(f).size}',fill=(255,255,0))
S.save(sys.argv[1])
