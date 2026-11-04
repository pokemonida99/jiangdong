# 把 work/art 的 GPT 原圖變成遊戲用的真像素圖：去洋紅底、縮小、減色。
# python3 tools/import_art.py [名稱…]（不給名稱就全部）
import os, sys
from PIL import Image

SRC, OUT = 'work/art', 'assets'
PORTRAITS = ['sunce', 'zhouyu', 'chengpu', 'huanggai', 'taishici', 'zhangying', 'liuyao', 'soldier']
BGS = ['bg_plain', 'bg_forest', 'bg_ford', 'bg_gate']
WALKS = ['w_sunce', 'w_zhouyu', 'w_chengpu', 'w_huanggai', 'w_taishici', 'w_zhangying', 'w_soldier']
only = set(sys.argv[1:])
os.makedirs(OUT, exist_ok=True)


def is_key(p):
    r, g, b = p[:3]
    return r > 170 and b > 170 and g < 110


def key_mask(im):
    # magenta background (and the pink fringe around it) becomes transparent
    im = im.convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if is_key(px[x, y]):
                px[x, y] = (0, 0, 0, 0)
    return im


def shrink(im, size, colors):
    # box-filter down so one output pixel is one chunky source pixel, then cut the colours and harden the edge
    a = im.getchannel('A').resize(size, Image.BOX).point(lambda v: 255 if v > 110 else 0)
    # the colour of the transparent part must not bleed into the edge
    rgb = Image.new('RGB', im.size, (21, 17, 13))
    rgb.paste(im.convert('RGB'), mask=im.getchannel('A'))
    q = rgb.resize(size, Image.BOX).quantize(colors, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGBA')
    q.putalpha(a)
    return q


def runs(flags, want):
    # contiguous True runs; when there are too many, the narrowest gaps are closed until `want` remain
    r, start = [], None
    for i, f in enumerate(flags + [False]):
        if f and start is None:
            start = i
        elif not f and start is not None:
            r.append([start, i])
            start = None
    while len(r) > want:
        k = min(range(len(r) - 1), key=lambda i: r[i + 1][0] - r[i][1])
        r[k:k + 2] = [[r[k][0], r[k + 1][1]]]
    return r


def grid(im, cols, rows):
    # finds the figures on a sheet: rows from the horizontal projection, cells from each row's vertical one
    a = im.getchannel('A')
    w, h = im.size
    data = a.load()
    rowf = [any(data[x, y] for x in range(0, w, 2)) for y in range(h)]
    cells = []
    for y0, y1 in runs(rowf, rows):
        colf = [any(data[x, y] for y in range(y0, y1, 2)) for x in range(w)]
        row = []
        for x0, x1 in runs(colf, cols):
            box = a.crop((x0, y0, x1, y1)).getbbox()
            row.append((x0 + box[0], y0 + box[1], x0 + box[2], y0 + box[3]))
        cells.append(row)
    return cells


def sheet(name, out, cols, rows, cw, ch, colors):
    im = key_mask(Image.open(f'{SRC}/{name}.png'))
    cells = grid(im, cols, rows)
    if len(cells) != rows or any(len(r) != cols for r in cells):
        print('  !! grid', name, [len(r) for r in cells])
    tallest = max(c[3] - c[1] for r in cells for c in r)
    widest = max(c[2] - c[0] for r in cells for c in r)
    k = min(ch / tallest, cw / widest)
    S = Image.new('RGBA', (cw * cols, ch * rows), (0, 0, 0, 0))
    for j, r in enumerate(cells):
        for i, c in enumerate(r[:cols]):
            f = im.crop(c)
            size = (max(1, round(f.width * k)), max(1, round(f.height * k)))
            f = shrink(f, size, colors)
            S.paste(f, (i * cw + (cw - size[0]) // 2, j * ch + ch - size[1]))  # feet on the cell's bottom
    S.save(f'{OUT}/{out}.png')
    return S


def recolor(S, out):
    # the red troops, in the enemy's indigo
    T = S.copy()
    px = T.load()
    for y in range(T.height):
        for x in range(T.width):
            r, g, b, a = px[x, y]
            if a and r > g * 1.5 and r > b * 1.5 and r > 70:
                px[x, y] = (int(r * 0.32), int(r * 0.42), int(r * 0.72), a)
    T.save(f'{OUT}/{out}.png')


def want(n):
    return (not only or n in only) and os.path.exists(f'{SRC}/{n}.png')


for n in PORTRAITS:
    if want(n):
        im = key_mask(Image.open(f'{SRC}/{n}.png'))
        shrink(im, (96, 96), 40).save(f'{OUT}/{n}.png')
for n in BGS:
    if want(n):
        im = Image.open(f'{SRC}/{n}.png').convert('RGB')
        im.resize((320, 240), Image.BOX).quantize(40, method=Image.MEDIANCUT, dither=Image.NONE).save(f'{OUT}/{n}.png')
if want('title'):
    im = Image.open(f'{SRC}/title.png').convert('RGB')
    im.resize((300, 533), Image.BOX).quantize(48, method=Image.MEDIANCUT, dither=Image.NONE).save(f'{OUT}/title.png')
if want('logo'):
    im = key_mask(Image.open(f'{SRC}/logo.png'))
    box = im.getbbox()
    im = im.crop(box)
    w = 240
    shrink(im, (w, round(im.height * w / im.width)), 16).save(f'{OUT}/logo.png')
for n in WALKS:
    if want(n):
        sheet(n, n, 3, 4, 24, 32, 24)
if want('troops'):
    recolor(sheet('troops', 'troops_red', 3, 2, 24, 22, 20), 'troops_blue')
print('ok')
