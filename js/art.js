// Pictures: GPT art from assets/ (made by tools/import_art.py) and the 8-bit tiles drawn here from the console's colours.
import { NES as N } from './palette.js';
export const FACE_IDS = ['zhuwen_y', 'zhuwen', 'zhanghui', 'likeyong', 'zhucun', 'wangshi', 'liuchong', 'liumu', 'huangchao', 'mengkai', 'yanshi', 'xietong', 'pangshigu', 'zhuzhen', 'gecongzhou', 'jingxiang', 'wangchongrong', 'yangyanhong', 'shangrang', 'liyao', 'mishen', 'envoy', 'peasant', 'soldier_b', 'soldier_r', 'soldier_t', 'bandit'];
const WALKERS = ['zhuwen_y', 'zhuwen', 'zhanghui', 'likeyong', 'zhucun', 'wangshi', 'liuchong', 'liumu', 'huangchao', 'mengkai', 'yanshi', 'xietong', 'pangshigu', 'zhuzhen', 'gecongzhou', 'jingxiang', 'wangchongrong', 'yangyanhong', 'shangrang', 'envoy', 'peasant', 'soldier_b', 'soldier_r', 'soldier_t', 'bandit'];
const FILES = ['title2', 'logo2', 'bg2_plain', 'bg2_forest', 'bg2_ford', 'bg2_gate', 'bg2_hall', 'bg2_night', 'bg2_pass', 'bg2_south', 'troops_red', 'troops_yellow', 'troops_blue', 'troops_black', ...WALKERS.map((k) => 'w_' + k)];
export const ART_V = 2;
export const img = {};
export const TS = 16;
export const faceSrc = (id) => `assets/${id}.png?v=${ART_V}`;

export async function loadArt(onProgress) {
  let n = 0;
  await Promise.all(FILES.map((f) => new Promise((res) => {
    const im = new Image();
    im.onload = () => { img[f] = im; onProgress && onProgress(++n / FILES.length); res(); };
    im.onerror = () => { onProgress && onProgress(++n / FILES.length); res(); };
    im.src = `assets/${f}.png?v=${ART_V}`;
  })));
  makeTiles();
}

export const tiles = {};
function tile(name, fn, variants = 1) {
  tiles[name] = [];
  for (let v = 0; v < variants; v++) {
    const c = document.createElement('canvas'); c.width = c.height = TS;
    const x = c.getContext('2d');
    const px = (col, a, b, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    // art: rows of characters, one per pixel, looked up in the palette; space leaves the pixel alone
    const art = (pal, rows, ox = 0, oy = 0) => rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== ' ') px(pal[ch], ox + i, oy + j); }));
    fn(px, art, v);
    tiles[name].push(c);
  }
}
// a fixed scatter: repeating patterns are what these machines drew, not noise
const dots = (px, col, list) => { for (const [a, b] of list) px(col, a, b); };
const SPECK_A = [[2, 3], [9, 1], [13, 6], [5, 9], [11, 12], [1, 13], [7, 14]];
const SPECK_B = [[4, 1], [12, 3], [7, 6], [2, 8], [14, 10], [9, 11], [4, 14]];

function grassy(px, base, dark, light) {
  px(base, 0, 0, TS, TS);
  for (const [a, b] of SPECK_A) { px(dark, a, b); px(dark, a + 1, b); }
  if (light) dots(px, light, SPECK_B);
}
function tree(px, art, base, dark, light) {
  art({ d: dark, l: light, k: N.black, t: N.brown0 }, [
    '     kkkkkk     ',
    '   kkddlldddk   ',
    '  kddlllldddlk  ',
    '  kdlllddddlldk ',
    ' kddllddddlllddk',
    ' kddddddlllddddk',
    ' kddlddddldddddk',
    '  kdddlddddddk  ',
    '   kkdddddkkk   ',
    '     kkttkk     ',
    '      kttk      ',
    '      kttk      ',
    '     kkttkk     ',
  ], 0, 2);
}
function peak(px, art, rock, dark, cap) {
  art({ r: rock, d: dark, c: cap, k: N.black }, [
    '       kk       ',
    '      kcck      ',
    '     kcccrk     ',
    '     kccrrdk    ',
    '    krcrrrdk    ',
    '   krrrrrrddk   ',
    '   krrdrrrddk   ',
    '  krrrrdrrrddk  ',
    '  krrrrrrrdddk  ',
    ' krrrrrrrrrdddk ',
    ' krrdrrrrrrrddk ',
    'krrrrrdrrrrrdddk',
    'krrrrrrrrrrrrddk',
    'kkkkkkkkkkkkkkkk',
  ], 0, 1);
}
const waves = (px, base, foam, v) => {
  px(base, 0, 0, TS, TS);
  const s = v * 4;
  for (const [a, b] of [[1, 3], [9, 6], [3, 11], [11, 13]]) { px(foam, (a + s) % 14, b, 3, 1); px(foam, (a + s + 3) % 15, b - 1, 1, 1); }
};
const brick = (px, base, dark, light) => {
  px(base, 0, 0, TS, TS);
  for (const y of [3, 7, 11, 15]) px(dark, 0, y, TS, 1);
  for (let row = 0; row < 4; row++) for (let i = row % 2 ? 4 : 0; i < TS; i += 8) { px(dark, i, row * 4, 1, 3); }
  if (light) for (let row = 0; row < 4; row++) px(light, row % 2 ? 5 : 1, row * 4, 2, 1);
};

function makeTiles() {
  const G = ['#58d854', '#00a800', '#b8f818'];
  // ---- the great map
  tile('.', (px) => grassy(px, G[0], G[1]));
  tile(',', (px) => grassy(px, N.tan === '#f8b800' ? '#f8d878' : '#f8d878', N.brown2));
  tile('d', (px) => { grassy(px, '#fce0a8', '#f8b800'); });
  tile('o', (px) => grassy(px, '#00a800', '#006800', '#58d854'));
  tile('T', (px, art) => { grassy(px, '#00a800', '#006800'); tree(px, art, 0, '#005800', '#00b800'); });
  tile('M', (px, art) => { grassy(px, '#f8d878', '#ac7c00'); peak(px, art, '#ac7c00', '#503000', '#f0d0b0'); });
  tile('H', (px, art) => { px('#bcbcbc', 0, 0, TS, TS); peak(px, art, '#7c7c7c', '#3c3c3c', '#fcfcfc'); });
  tile('W', (px, a, v) => waves(px, '#0058f8', '#3cbcfc', v), 2);
  tile('r', (px, a, v) => waves(px, '#0078f8', '#a4e4fc', v), 2);
  tile('R', (px) => { px('#f0d0b0', 0, 0, TS, TS); dots(px, '#ac7c00', SPECK_A); dots(px, '#fce0a8', SPECK_B); });
  tile('B', (px) => { px('#0058f8', 0, 0, TS, TS); px('#ac7c00', 0, 1, TS, 14); for (let i = 0; i < 16; i += 4) px('#503000', i, 1, 1, 14); px('#000000', 0, 1, TS, 1); px('#000000', 0, 14, TS, 1); px('#f8d878', 1, 3, 2, 1); px('#f8d878', 9, 8, 2, 1); });
  tile('C', (px, art) => {
    grassy(px, '#58d854', '#00a800');
    art({ k: '#000000', w: '#bcbcbc', d: '#7c7c7c', r: '#f83800', R: '#a81000', g: '#503000' }, [
      '      kkkk      ',
      '    kkrrrrkk    ',
      '   krrRRRRrrk   ',
      '  kkkkkkkkkkkk  ',
      '    kwwwwwwk    ',
      'kkkkkkkkkkkkkkkk',
      'kwdwkwdwwkwdwkwk',
      'kwwwwwwwwwwwwwwk',
      'kdwwdwkkkkwdwwdk',
      'kwwwwkggggkwwwwk',
      'kwdwwkggggkwwdwk',
      'kwwwwkggggkwwwwk',
      'kkkkkkkkkkkkkkkk',
    ], 0, 2);
  });
  tile('V', (px, art) => {
    grassy(px, '#58d854', '#00a800');
    art({ k: '#000000', y: '#f8b800', Y: '#ac7c00', w: '#fce0a8', g: '#503000' }, [
      '     kkkk       ',
      '   kkyyyykk     ',
      ' kkyyYYYYyykk   ',
      'kyyYYYYYYYYyyk  ',
      'kkkkkkkkkkkkkk  ',
      ' kwwwwkkwwwwk   ',
      ' kwwwwkgkwwwk   ',
      ' kwwwwkgkwwwk   ',
      ' kkkkkkkkkkkk   ',
    ], 1, 5);
  });
  tile('A', (px, art) => {
    px('#f0d0b0', 0, 0, TS, TS); dots(px, '#ac7c00', SPECK_A);
    art({ k: '#000000', w: '#ac7c00', d: '#503000', r: '#a81000' }, [
      '   kkkkkkkkkk   ',
      '  krrrrrrrrrrk  ',
      '  kkkkkkkkkkkk  ',
      '    kwkwwkwk    ',
      '    kwkwwkwk    ',
      '   kkkkkkkkkk   ',
      '    kdkwwkdk    ',
      '    kwkwwkwk    ',
      '    kwkddkwk    ',
      '   kdkkddkkdk   ',
      '   kkk kk kkk   ',
    ], 0, 3);
  });
  // ---- towns and fortresses
  tile('g', (px) => grassy(px, '#58d854', '#00a800', '#b8f818'));
  tile('p', (px) => { px('#f8d878', 0, 0, TS, TS); dots(px, '#ac7c00', SPECK_A); });
  tile('t', (px, art) => { grassy(px, '#58d854', '#00a800'); tree(px, art, 0, '#005800', '#00b800'); });
  tile('s', (px) => { px('#7c7c7c', 0, 0, TS, TS); px('#3c3c3c', 0, 7, TS, 1); px('#3c3c3c', 0, 15, TS, 1); px('#3c3c3c', 7, 0, 1, 7); px('#3c3c3c', 15, 8, 1, 7); px('#bcbcbc', 1, 1, 2, 1); px('#bcbcbc', 9, 9, 2, 1); });
  tile('w', (px) => brick(px, '#7c7c7c', '#000000', '#bcbcbc'));
  tile('e', (px) => { px('#3c3c3c', 0, 0, TS, TS); px('#7c7c7c', 0, 0, TS, 3); for (let i = 0; i < 16; i += 8) { px('#bcbcbc', i, 0, 5, 1); px('#000000', i + 5, 0, 3, 3); } px('#000000', 0, 15, TS, 1); });
  tile('D', (px) => { px('#000000', 0, 0, TS, TS); px('#3c3c3c', 1, 1, 14, 15); px('#000000', 3, 3, 10, 13); px('#a81000', 1, 1, 2, 15); px('#a81000', 13, 1, 2, 15); });
  tile('L', (px) => { px('#000000', 0, 0, TS, TS); px('#a81000', 1, 1, 14, 15); px('#f83800', 2, 2, 5, 13); px('#f83800', 9, 2, 5, 13); px('#000000', 7, 1, 2, 15); for (const y of [4, 8, 12]) for (const x of [3, 5, 10, 12]) px('#f8b800', x, y); });
  tile('c', (px) => { px('#a81000', 0, 0, TS, TS); px('#f8b800', 1, 0, 1, TS); px('#f8b800', 14, 0, 1, TS); px('#f83800', 5, 3, 6, 1); px('#f83800', 5, 11, 6, 1); });
  tile('f', (px) => { px('#ac7c00', 0, 0, TS, TS); for (const y of [3, 7, 11, 15]) px('#503000', 0, y, TS, 1); px('#503000', 5, 0, 1, 3); px('#503000', 11, 4, 1, 3); px('#503000', 3, 8, 1, 3); px('#503000', 13, 12, 1, 3); });
  tile('P', (px) => { px('#3c3c3c', 0, 0, TS, TS); px('#000000', 3, 0, 10, TS); px('#a81000', 4, 0, 8, TS); px('#f83800', 5, 0, 2, TS); px('#f8b800', 3, 0, 10, 2); px('#f8b800', 3, 13, 10, 3); });
  tile('h', (px) => { px('#fce0a8', 0, 0, TS, TS); px('#503000', 0, 0, TS, 2); px('#503000', 0, 14, TS, 2); px('#503000', 0, 0, 2, TS); px('#503000', 14, 0, 2, TS); px('#000000', 5, 5, 6, 5); px('#ac7c00', 6, 6, 1, 3); px('#ac7c00', 9, 6, 1, 3); });
  tile('i', (px) => { px('#fce0a8', 0, 0, TS, TS); px('#000000', 2, 2, 12, 14); px('#881400', 3, 3, 10, 13); px('#000000', 7, 3, 2, 13); px('#f8b800', 6, 9, 1, 2); px('#f8b800', 9, 9, 1, 2); });
  tile('u', (px) => { px('#0058f8', 0, 0, TS, TS); px('#004058', 0, 0, TS, TS); for (const y of [3, 7, 11]) { px('#000000', 0, y, TS, 1); for (let i = (y === 7 ? 4 : 0); i < TS; i += 8) px('#008888', i + 1, y - 2, 5, 1); } px('#000000', 0, 15, TS, 1); });
  tile('q', (px, a, v) => waves(px, '#0058f8', '#3cbcfc', v), 2);
  tile('b', (px) => { px('#ac7c00', 0, 0, TS, TS); for (let i = 3; i < 16; i += 4) px('#503000', 0, i, TS, 1); px('#000000', 0, 0, 1, TS); px('#000000', 15, 0, 1, TS); });
  const chest = (px, art, open) => {
    art({ k: '#000000', r: '#a81000', R: '#f83800', g: '#f8b800', d: '#3c3c3c' }, open ? [
      '                ',
      '  kkkkkkkkkkkk  ',
      ' kddddddddddddk ',
      ' kddddddddddddk ',
      ' kkkkkkkkkkkkkk ',
      ' kRRRRRRRRRRRRk ',
      ' krrrrrrrrrrrrk ',
      ' krrrrrrrrrrrrk ',
      ' kkkkkkkkkkkkkk ',
    ] : [
      '  kkkkkkkkkkkk  ',
      ' kRRRRRRRRRRRRk ',
      ' krrrrrggrrrrrk ',
      ' kkkkkkggkkkkkk ',
      ' kRRRRRggRRRRRk ',
      ' krrrrrrrrrrrrk ',
      ' krrrrrrrrrrrrk ',
      ' kkkkkkkkkkkkkk ',
    ], 0, 4);
  };
  tile('x', (px, art) => { px('#7c7c7c', 0, 0, TS, TS); px('#3c3c3c', 0, 15, TS, 1); chest(px, art, false); });
  tile('X', (px, art) => { px('#7c7c7c', 0, 0, TS, TS); px('#3c3c3c', 0, 15, TS, 1); chest(px, art, true); });
  tile('l', (px) => { px('#7c7c7c', 0, 0, TS, TS); px('#000000', 3, 11, 10, 4); px('#ac7c00', 4, 12, 8, 2); px('#503000', 7, 3, 2, 9); px('#f83800', 6, 1, 4, 3); px('#000000', 6, 0, 4, 1); });
  tile('F', (px, a, v) => { px('#7c7c7c', 0, 0, TS, TS); px('#000000', 3, 10, 10, 5); px('#503000', 4, 10, 8, 4); px('#f83800', 5, 4 + v, 6, 6 - v); px('#f8b800', 6 + v, 6, 4, 4); px('#fcfcfc', 7, 8, 2, 2); }, 2);
  tile('S', (px) => { for (let i = 0; i < 4; i++) { px(['#000000', '#3c3c3c', '#7c7c7c', '#bcbcbc'][i], 0, i * 4, TS, 4); } });
  tile('K', (px, art) => {
    px('#a81000', 0, 0, TS, TS);
    art({ k: '#000000', g: '#f8b800', G: '#ac7c00', r: '#f83800' }, [
      '   kkkkkkkkkk   ',
      '  kggggggggggk  ',
      '  kgGGGGGGGGgk  ',
      '  kgGrrrrrrGgk  ',
      '  kgGrrrrrrGgk  ',
      '  kgGrrrrrrGgk  ',
      ' kkggggggggggkk ',
      ' kggggggggggggk ',
      ' kGkkkkkkkkkkGk ',
      ' kgk        kgk ',
      ' kkk        kkk ',
    ], 0, 3);
  });
  tile('v', (px) => { px('#7c7c7c', 0, 0, TS, TS); px('#000000', 1, 2, 14, 13); px('#ac7c00', 2, 3, 12, 11); px('#503000', 2, 8, 12, 1); px('#503000', 7, 3, 2, 11); px('#f8d878', 3, 4, 3, 1); });
  tile('n', (px) => { grassy(px, '#f0d0b0', '#ac7c00'); for (let i = 0; i < 7; i++) { px('#000000', 7 - i, 1 + i * 2, 1, 2); px('#000000', 8 + i, 1 + i * 2, 1, 2); px('#f8b800', 8 - i, 1 + i * 2, i * 2, 2); } px('#000000', 6, 9, 4, 6); px('#000000', 1, 15, 14, 1); });
  tile('y', (px) => { grassy(px, '#58d854', '#00a800'); px('#000000', 2, 3, 3, 12); px('#000000', 11, 3, 3, 12); px('#ac7c00', 3, 4, 1, 10); px('#ac7c00', 12, 4, 1, 10); px('#000000', 0, 5, TS, 4); px('#ac7c00', 0, 6, TS, 2); px('#000000', 0, 10, TS, 3); px('#ac7c00', 0, 11, TS, 1); });
  tile('a', (px) => { px('#ac7c00', 0, 0, TS, TS); px('#000000', 0, 3, TS, 10); px('#881400', 0, 4, TS, 7); px('#e45c10', 0, 4, TS, 1); px('#fcfcfc', 3, 6, 3, 3); px('#f8b800', 10, 6, 3, 3); px('#000000', 2, 13, 2, 3); px('#000000', 12, 13, 2, 3); });
  tile('z', (px) => { px('#000000', 0, 0, TS, TS); });
  tile('j', (px) => { px('#3c3c3c', 0, 0, TS, TS); px('#000000', 0, 7, TS, 1); px('#000000', 0, 15, TS, 1); px('#000000', 7, 0, 1, 7); px('#000000', 15, 8, 1, 7); px('#7c7c7c', 2, 2, 2, 1); px('#7c7c7c', 10, 10, 2, 1); });
  // the castle flags on the great map: your red, the enemy's blue
  flags.me = mkFlag('#f83800'); flags.foe = mkFlag('#0058f8'); flags.neutral = mkFlag('#fcfcfc');
  // the pointer that stands over where to go next
  const a = document.createElement('canvas'); a.width = 9; a.height = 9;
  const ax = a.getContext('2d');
  for (const [i, r] of ['kkkkkkkkk', 'kgggggggk', ' kgggggk ', ' kgggggk ', '  kgggk  ', '  kgggk  ', '   kgk   ', '   kgk   ', '    k    '].entries()) [...r].forEach((ch, j) => { if (ch !== ' ') { ax.fillStyle = ch === 'k' ? '#000000' : '#f8b800'; ax.fillRect(j, i, 1, 1); } });
  pointer.c = a;
}
export const flags = {};
export const pointer = {};
function mkFlag(col) {
  const c = document.createElement('canvas'); c.width = 8; c.height = 9;
  const x = c.getContext('2d');
  x.fillStyle = '#000000'; x.fillRect(0, 0, 1, 9); x.fillRect(1, 0, 7, 6);
  x.fillStyle = col; x.fillRect(1, 1, 6, 4);
  return c;
}

// walk sheet: 3 columns (still, step, step) by 4 rows (down, left, right, up), 24x32 cells
export const DIRS = { down: 0, left: 1, right: 2, up: 3 };
export function drawActor(c, key, dir, frame, x, y, scale = 1) {
  const im = img['w_' + key];
  const cw = 24, ch = 32, w = cw * scale, h = ch * scale;
  if (!im) { c.fillStyle = '#f83800'; c.fillRect(x - 6, y - 16, 12, 16); return; }
  c.drawImage(im, frame * cw, DIRS[dir] * ch, cw, ch, Math.round(x - w / 2), Math.round(y - h), w, h);
}

// troop sheet: 3 columns (inf, cav, arc) by 2 rows (standing, attacking), 24x22 cells
const TROOP = { inf: 0, cav: 1, arc: 2 };
export function drawTroop(c, team, type, frame, x, y, flip) {
  const im = img['troops_' + team] || img.troops_red;
  if (!im) return;
  c.save();
  c.translate(Math.round(x), Math.round(y));
  if (flip) c.scale(-1, 1);
  c.drawImage(im, TROOP[type] * 24, frame * 22, 24, 22, -12, -22, 24, 22);
  c.restore();
}

// words on the canvas: hard pixels with a black edge, no blur. Cached, since the same few labels draw every frame.
const textCache = new Map();
export function pixelText(c, text, x, y, col = '#fcfcfc', align = 'center') {
  const key = text + '|' + col;
  let im = textCache.get(key);
  if (!im) {
    const m = document.createElement('canvas').getContext('2d');
    m.font = '11px Cubic11, sans-serif';
    const w = Math.ceil(m.measureText(text).width) + 4, h = 15;
    const off = document.createElement('canvas'); off.width = w; off.height = h;
    const o = off.getContext('2d', { willReadFrequently: true });
    o.font = m.font; o.textBaseline = 'alphabetic'; o.fillStyle = '#ffffff';
    o.fillText(text, 2, 12);
    const src = o.getImageData(0, 0, w, h), a = src.data;
    const on = (i, j) => i >= 0 && j >= 0 && i < w && j < h && a[(i + j * w) * 4 + 3] > 110;
    const r = parseInt(col.slice(1, 3), 16), g = parseInt(col.slice(3, 5), 16), b = parseInt(col.slice(5, 7), 16);
    const out = o.createImageData(w, h), d = out.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const p = (i + j * w) * 4;
      if (on(i, j)) { d[p] = r; d[p + 1] = g; d[p + 2] = b; d[p + 3] = 255; }
      else if (on(i + 1, j) || on(i - 1, j) || on(i, j + 1) || on(i, j - 1)) { d[p + 3] = 255; }
    }
    o.putImageData(out, 0, 0);
    im = off;
    textCache.set(key, im);
  }
  const left = align === 'center' ? Math.round(x - im.width / 2) : Math.round(x);
  c.drawImage(im, left, Math.round(y) - 12);
}

// the colour above a background's top edge, for screens taller than the picture
const skyCache = {};
export function skyOf(name) {
  if (skyCache[name]) return skyCache[name];
  const im = img[name];
  if (!im) return '#000000';
  const c = document.createElement('canvas'); c.width = 1; c.height = 1;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0, 1, 1, 0, 0, 1, 1);
  const d = x.getImageData(0, 0, 1, 1).data;
  return (skyCache[name] = `rgb(${d[0]},${d[1]},${d[2]})`);
}
