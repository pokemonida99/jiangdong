// Pictures: GPT art from assets/ (made by tools/import_art.py) and the map tiles drawn here.
const FILES = ['sunce', 'zhouyu', 'chengpu', 'huanggai', 'taishici', 'zhangying', 'liuyao', 'soldier', 'bg_plain', 'bg_forest', 'bg_ford', 'bg_gate', 'title', 'logo',
  'w_sunce', 'w_zhouyu', 'w_chengpu', 'w_huanggai', 'w_taishici', 'w_zhangying', 'w_soldier', 'troops_red', 'troops_blue'];
export const img = {};
export const TS = 16;

export async function loadArt(onProgress) {
  let n = 0;
  await Promise.all(FILES.map((f) => new Promise((res) => {
    const im = new Image();
    im.onload = () => { img[f] = im; onProgress && onProgress(++n / FILES.length); res(); };
    im.onerror = () => { onProgress && onProgress(++n / FILES.length); res(); };
    im.src = `assets/${f}.png?v=1`;
  })));
  makePaper();
  makeTiles();
}

// a repeating grain for the panels, instead of a gradient
function makePaper() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  let seed = 7;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 220; i++) { x.fillStyle = r() < 0.5 ? 'rgba(60,40,20,.09)' : 'rgba(255,250,230,.14)'; x.fillRect(Math.floor(r() * 64), Math.floor(r() * 64), 1 + Math.floor(r() * 3), 1); }
  document.documentElement.style.setProperty('--paper', `url(${c.toDataURL()})`);
}

const P = { ink: '#15110d', grass: '#8b9458', grass2: '#7a8449', grass3: '#a0a766', sand: '#dcc08f', sand2: '#c7a874', road: '#c9a979', road2: '#b39163', water: '#2d3a55', water2: '#3d4f70', foam: '#8fa3b5',
  tree: '#2e4a38', tree2: '#3f6b5e', trunk: '#5a3a24', red: '#b5301f', red2: '#7c1f14', silk: '#e8dcc0', silk2: '#cdbd98', stone: '#77806a', stone2: '#5c6452', wood: '#8a6236', wood2: '#5e4023', forest: '#566b44', forest2: '#48593a', gold: '#d9a441' };
export const tiles = {};

function tile(name, fn, variants = 1) {
  tiles[name] = [];
  for (let v = 0; v < variants; v++) {
    const c = document.createElement('canvas'); c.width = c.height = TS;
    const x = c.getContext('2d');
    let seed = 97 + v * 131 + name.charCodeAt(0) * 7;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const px = (col, a, b, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    fn(px, r, v);
    tiles[name].push(c);
  }
}
const speck = (px, r, col, n) => { for (let i = 0; i < n; i++) px(col, Math.floor(r() * TS), Math.floor(r() * TS)); };

function makeTiles() {
  const ground = (px, r) => { px(P.grass, 0, 0, TS, TS); speck(px, r, P.grass2, 12); speck(px, r, P.grass3, 5); };
  tile('.', ground, 4);
  tile(',', (px, r) => { ground(px, r); for (let i = 0; i < 4; i++) { const a = 2 + Math.floor(r() * 11), b = 3 + Math.floor(r() * 10); px(P.tree2, a, b, 1, 3); px(P.tree2, a + 2, b + 1, 1, 2); } }, 3);
  tile('R', (px, r) => { px(P.road, 0, 0, TS, TS); speck(px, r, P.road2, 14); speck(px, r, P.silk2, 4); }, 3);
  tile('S', (px, r) => { px(P.sand, 0, 0, TS, TS); speck(px, r, P.sand2, 14); }, 3);
  tile('F', (px, r) => { px(P.forest, 0, 0, TS, TS); speck(px, r, P.forest2, 18); speck(px, r, P.grass2, 5); }, 3);
  // two frames, the map swaps them for the water's movement
  tile('W', (px, r, v) => { px(P.water, 0, 0, TS, TS); for (let i = 0; i < 5; i++) { const a = (i * 7 + v * 5) % 13, b = (i * 5 + v * 3) % 15; px(P.water2, a, b, 4, 1); } px(P.foam, (3 + v * 6) % 14, (9 + v * 2) % 15, 2, 1); }, 2);
  const crown = (px, c1, c2) => {
    px(P.ink, 3, 1, 10, 1); px(P.ink, 1, 2, 2, 1); px(P.ink, 13, 2, 2, 1); px(P.ink, 0, 3, 1, 7); px(P.ink, 15, 3, 1, 7); px(P.ink, 1, 10, 2, 1); px(P.ink, 13, 10, 2, 1); px(P.ink, 3, 11, 10, 1);
    px(c1, 3, 2, 10, 9); px(c1, 1, 3, 14, 7); px(c2, 3, 3, 5, 2); px(c2, 9, 5, 4, 2); px(c2, 4, 7, 3, 2);
    px(P.trunk, 7, 12, 2, 3); px(P.ink, 6, 12, 1, 3); px(P.ink, 9, 12, 1, 3); px(P.ink, 6, 15, 4, 1);
  };
  tile('T', (px, r) => { ground(px, r); crown(px, P.tree, P.tree2); }, 2);
  tile('P', (px, r) => { px(P.forest, 0, 0, TS, TS); crown(px, '#24392c', P.tree); }, 2);
  tile('H', (px, r) => { ground(px, r); for (let i = 0; i < 7; i++) { px(P.ink, 7 - i, 2 + i * 2, 1, 2); px(P.ink, 8 + i, 2 + i * 2, 1, 2); px(P.red, 8 - i, 2 + i * 2, i * 2, 2); } px(P.silk, 6, 8, 4, 8); px(P.ink, 7, 9, 2, 7); px(P.ink, 1, 15, 14, 1); px(P.silk, 7, 1, 2, 1); }, 1);
  tile('f', (px, r) => { ground(px, r); px(P.wood2, 2, 4, 2, 11); px(P.wood2, 12, 4, 2, 11); px(P.wood, 0, 6, 16, 2); px(P.wood, 0, 11, 16, 2); px(P.ink, 0, 8, 16, 1); px(P.ink, 0, 13, 16, 1); }, 1);
  tile('x', (px, r) => { ground(px, r); px(P.ink, 2, 3, 12, 12); px(P.wood, 3, 4, 10, 10); px(P.wood2, 3, 8, 10, 1); px(P.wood2, 7, 4, 1, 10); px(P.silk2, 4, 5, 2, 1); }, 1);
  tile('c', (px, r, v) => { ground(px, r); px(P.ink, 3, 12, 10, 2); px(P.wood2, 4, 11, 8, 2); px(P.red, 5, 6, 6, 5); px(P.gold, 6 + v, 8 - v, 4, 3); px(P.silk, 7, 9, 2, 2); px(P.red, 7, 4 + v, 2, 2); }, 2);
  tile('b', (px, r) => { ground(px, r); px(P.wood2, 7, 1, 2, 15); px(P.ink, 9, 2, 6, 8); px(P.red, 9, 3, 5, 6); px(P.silk, 11, 5, 1, 2); }, 1);
  tile('B', (px, r) => { px(P.water, 0, 0, TS, TS); px(P.wood, 0, 0, TS, TS); for (let i = 0; i < 4; i++) px(P.wood2, 0, i * 4 + 3, TS, 1); px(P.ink, 0, 0, 1, TS); px(P.ink, 15, 0, 1, TS); }, 1);
  tile('D', (px, r) => { px(P.water, 0, 0, TS, TS); px(P.ink, 0, 7, 16, 7); px(P.wood2, 1, 8, 14, 5); px(P.wood, 1, 8, 14, 2); px(P.wood2, 7, 0, 2, 8); px(P.red, 9, 1, 6, 6); px(P.foam, 2, 14, 12, 1); }, 1);
  tile('C', (px, r) => { px(P.stone, 0, 0, TS, TS); px(P.stone2, 0, 3, TS, 1); px(P.stone2, 0, 8, TS, 1); px(P.stone2, 0, 13, TS, 1); for (let i = 0; i < 4; i++) { px(P.stone2, (i * 8) % 16, 0, 1, 3); px(P.stone2, (i * 8 + 4) % 16, 4, 1, 4); px(P.stone2, (i * 8) % 16, 9, 1, 4); } px(P.ink, 0, 15, TS, 1); }, 1);
  tile('K', (px, r) => { px(P.stone2, 0, 0, TS, TS); speck(px, r, P.stone, 18); px(P.ink, 0, 0, TS, 1); for (let i = 0; i < 2; i++) px(P.ink, 2 + i * 8, 1, 4, 2); }, 1);
  tile('G', (px, r) => { px(P.ink, 0, 0, TS, TS); px(P.red2, 1, 2, 14, 14); px(P.red, 2, 3, 5, 13); px(P.red, 9, 3, 5, 13); px(P.gold, 6, 8, 1, 2); px(P.gold, 9, 8, 1, 2); }, 1);
  tile('A', (px, r) => { px(P.forest, 0, 0, TS, TS); px(P.ink, 2, 3, 12, 2); px(P.red2, 1, 1, 14, 3); px(P.silk, 3, 0, 10, 1); px(P.wood2, 3, 5, 2, 10); px(P.wood2, 11, 5, 2, 10); px(P.ink, 2, 15, 12, 1); px(P.silk2, 6, 9, 4, 6); px(P.ink, 7, 11, 2, 4); }, 1);
}

// walk sheet: 3 columns (still, step, step) by 4 rows (down, left, right, up), 24x32 cells
export const DIRS = { down: 0, left: 1, right: 2, up: 3 };
export function drawActor(c, key, dir, frame, x, y, scale = 1) {
  const im = img['w_' + key];
  const cw = 24, ch = 32, w = cw * scale, h = ch * scale;
  if (!im) { c.fillStyle = '#b5301f'; c.fillRect(x - 6, y - 16, 12, 16); return; }
  c.drawImage(im, frame * cw, DIRS[dir] * ch, cw, ch, Math.round(x - w / 2), Math.round(y - h), w, h);
}

// troop sheet: 3 columns (inf, cav, arc) by 2 rows (standing, attacking), 24x22 cells
const TROOP = { inf: 0, cav: 1, arc: 2 };
export function drawTroop(c, side, type, frame, x, y, flip) {
  const im = img[side === 'ally' ? 'troops_red' : 'troops_blue'];
  if (!im) return;
  c.save();
  c.translate(Math.round(x), Math.round(y));
  if (flip) c.scale(-1, 1);
  c.drawImage(im, TROOP[type] * 24, frame * 22, 24, 22, -12, -22, 24, 22);
  c.restore();
}
