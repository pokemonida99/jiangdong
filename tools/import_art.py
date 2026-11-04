# 把 work/art 的 GPT 原圖變成遊戲用的 8-bit 圖：去洋紅底、縮小、限色、只用 NES 色。
# python3 tools/import_art.py [名稱…]（不給名稱就全部）
import glob, os, sys
from PIL import Image

SRC, OUT = 'work/art', 'assets'
# 完整的 NES 色盤（不含重複的黑）
NES = ['7c7c7c', '0000fc', '0000bc', '4428bc', '940084', 'a80020', 'a81000', '881400', '503000', '007800', '006800', '005800', '004058', '000000',
       'bcbcbc', '0078f8', '0058f8', '6844fc', 'd800cc', 'e40058', 'f83800', 'e45c10', 'ac7c00', '00b800', '00a800', '00a844', '008888',
       'f8f8f8', '3cbcfc', '6888fc', '9878f8', 'f878f8', 'f85898', 'f87858', 'fca044', 'f8b800', 'b8f818', '58d854', '58f898', '00e8d8', '787878',
       'fcfcfc', 'a4e4fc', 'b8b8f8', 'd8b8f8', 'f8b8f8', 'f8a4c0', 'f0d0b0', 'fce0a8', 'f8d878', 'd8f878', 'b8f8b8', 'b8f8d8', '00fcfc', 'f8d8f8',
       '3c3c3c', '5c5c5c', 'd89868', 'a85c28']  # 原機沒有的暗灰、膚色與馬的棕色：只補這四個，灰甲才不會變藍綠
TABLE = [tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) for h in NES]
FACE = 64            # 頭像邊長，跟 GPT 原圖的大像素差不多，細節不會糊
FACE_COLORS = 16     # 一張頭像最多幾色
only = set(sys.argv[1:])
os.makedirs(OUT, exist_ok=True)


def lab(c):
    # the eye's idea of colour distance, so a green robe stays green and skin stays skin
    def f(v):
        v /= 255
        return ((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92
    r, g, b = f(c[0]), f(c[1]), f(c[2])
    x, y, z = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.9505, 0.2126 * r + 0.7152 * g + 0.0722 * b, (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.089
    g3 = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    return (116 * g3(y) - 16, 500 * (g3(x) - g3(y)), 200 * (g3(y) - g3(z)))


LABS = [(t, lab(t)) for t in TABLE]
GRAYS = [e for e in LABS if (e[1][1] ** 2 + e[1][2] ** 2) ** 0.5 < 4]
CACHE = {}


def nearest(c):
    key = (c[0] >> 3, c[1] >> 3, c[2] >> 3)
    if key not in CACHE:
        L = lab(c)
        # a near-gray stays gray: the nearest colour on this palette is often a loud purple or teal
        pool = GRAYS if (L[1] ** 2 + L[2] ** 2) ** 0.5 < 13 else LABS
        CACHE[key] = min(pool, key=lambda e: (e[1][0] - L[0]) ** 2 + (e[1][1] - L[1]) ** 2 + (e[1][2] - L[2]) ** 2)[0]
    return CACHE[key]


def is_key(p):
    r, g, b = p[:3]
    return r > 165 and b > 165 and g < 120


def key_mask(im):
    im = im.convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if is_key(px[x, y]):
                px[x, y] = (0, 0, 0, 0)
    return im


def sample(im, size):
    # each output pixel takes the commonest console colour in the middle of its cell, not an average:
    # GPT's big pixels stay crisp instead of blurring together
    w, h = size
    src = im.convert('RGBA')
    px = src.load()
    sw, sh = src.size
    out = Image.new('RGBA', size, (0, 0, 0, 0))
    o = out.load()
    for y in range(h):
        y0, y1 = int((y + 0.2) * sh / h), max(int((y + 0.8) * sh / h), int((y + 0.2) * sh / h) + 1)
        for x in range(w):
            x0, x1 = int((x + 0.2) * sw / w), max(int((x + 0.8) * sw / w), int((x + 0.2) * sw / w) + 1)
            count, solid, total = {}, 0, 0
            for j in range(y0, y1):
                for i in range(x0, x1):
                    p = px[i, j]
                    total += 1
                    if p[3] < 128:
                        continue
                    solid += 1
                    t = nearest(p)
                    count[t] = count.get(t, 0) + 1
            if solid * 2 >= total:
                c = max(count, key=count.get)
                o[x, y] = (c[0], c[1], c[2], 255)
    return out


def limit(im, colors):
    # keep the colours that matter; a rare one moves to the closest that stays
    px = im.load()
    count = {}
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]
            if p[3]:
                count[p[:3]] = count.get(p[:3], 0) + 1
    keep = sorted(count, key=count.get, reverse=True)[:colors]
    move = {}
    for c in count:
        if c not in keep:
            L = lab(c)
            move[c] = min(keep, key=lambda t: sum((u - v) ** 2 for u, v in zip(lab(t), L)))
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]
            if p[3] and p[:3] in move:
                px[x, y] = (*move[p[:3]], 255)
    return im


def despeckle(im):
    # a lone pixel on a patch of skin or cloth reads as a rash at this size: it takes the colour around it. Black lines stay.
    src = im.copy()
    a, b = src.load(), im.load()
    for y in range(1, im.height - 1):
        for x in range(1, im.width - 1):
            p = a[x, y]
            if not p[3] or sum(p[:3]) < 60:
                continue
            around = [a[x + 1, y], a[x - 1, y], a[x, y + 1], a[x, y - 1]]
            if p in around:
                continue
            counts = {}
            for q in around:
                counts[q] = counts.get(q, 0) + 1
            q, n = max(counts.items(), key=lambda e: e[1])
            if n >= 3 and q[3]:
                b[x, y] = q
    return im


def shrink(im, size, colors):
    return limit(despeckle(sample(im, size)), colors)


def portrait(n):
    im = key_mask(Image.open(f'{SRC}/{n}.png'))
    box = im.getbbox()
    # frame on the head and shoulders, and keep it square
    w, h = box[2] - box[0], box[3] - box[1]
    side = max(w, h)
    cx = (box[0] + box[2]) // 2
    crop = im.crop((cx - side // 2, box[1], cx - side // 2 + side, box[1] + side))
    shrink(crop, (FACE, FACE), FACE_COLORS).save(f'{OUT}/{n}.png')


NO_PURPLE = {'940084', 'd800cc', '6844fc', '9878f8', 'f878f8', 'f8b8f8', 'd8b8f8', 'f8d8f8', 'e40058', 'f85898', 'f8a4c0', 'b8b8f8', '6888fc'}


def scene(n, size, colors):
    global LABS, GRAYS
    im = Image.open(f'{SRC}/{n}.png').convert('RGB')
    if n == 'title2':
        # the title is red, gold and iron: purples on this palette turn the city into noise
        banned = {tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) for h in NO_PURPLE}
        keep = LABS
        LABS = [e for e in LABS if e[0] not in banned]
        CACHE.clear()
    # cover: keep the aspect, cut what sticks out
    k = max(size[0] / im.width, size[1] / im.height)
    w, h = round(size[0] / k), round(size[1] / k)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    limit(despeckle(despeckle(sample(im.crop((x, y, x + w, y + h)), size))), colors).convert('RGB').save(f'{OUT}/{n}.png')
    if n == 'title2':
        LABS = keep
        CACHE.clear()


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


def sheet(name, out, cols, rows, cw, ch, colors, prep=None):
    im = key_mask(Image.open(f'{SRC}/{name}.png'))
    if prep:
        prep(im)
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
            S.paste(sample(f, size), (i * cw + (cw - size[0]) // 2, j * ch + ch - size[1]))  # feet on the cell's bottom
    limit(S, colors).save(f'{OUT}/{out}.png')
    return S


def team(col):
    # the troops are drawn in pure red, the horses in brown: only the clothes change, and before any shrinking
    def prep(im):
        px = im.load()
        for y in range(im.height):
            for x in range(im.width):
                r, g, b, a = px[x, y]
                if a and r > 110 and g < 72 and b < 72:
                    px[x, y] = (*(col[1] if r > 190 else col[0]), 255)
    return prep


# 敵我三色：暗、亮
TEAMS = {'troops_red': ((0xa8, 0x10, 0x00), (0xf8, 0x38, 0x00)), 'troops_yellow': ((0xac, 0x7c, 0x00), (0xf8, 0xb8, 0x00)), 'troops_blue': ((0x00, 0x00, 0xbc), (0x00, 0x78, 0xf8)), 'troops_black': ((0x00, 0x00, 0x00), (0x40, 0x40, 0x48))}
SCENES = {'title2': ((195, 422), 28)}
for b in ['plain', 'forest', 'ford', 'gate', 'hall', 'night', 'pass', 'south']:
    SCENES['bg2_' + b] = ((240, 180), 24)
NOT_FACES = set(SCENES) | {'logo2', 'troops2'}
LEGACY = {'sunce', 'zhouyu', 'chengpu', 'huanggai', 'taishici', 'zhangying', 'liuyao', 'soldier', 'title', 'logo', 'troops'}

for f in sorted(glob.glob(f'{SRC}/*.png')):
    n = os.path.splitext(os.path.basename(f))[0]
    if only and n not in only:
        continue
    if n in LEGACY or n.startswith('bg_'):
        continue
    if n.startswith('w_'):
        if n in {'w_sunce', 'w_zhouyu', 'w_chengpu', 'w_huanggai', 'w_taishici', 'w_zhangying', 'w_soldier'}:
            continue
        sheet(n, n, 3, 4, 24, 32, 12)
    elif n == 'troops2':
        for t, col in TEAMS.items():
            sheet(n, t, 3, 2, 24, 22, 10, team(col))
    elif n in SCENES:
        scene(n, *SCENES[n])
    elif n == 'logo2':
        im = key_mask(Image.open(f))
        im = im.crop(im.getbbox())
        shrink(im, (170, round(im.height * 170 / im.width)), 6).save(f'{OUT}/logo2.png')
    elif n not in NOT_FACES:
        portrait(n)
print('ok')
