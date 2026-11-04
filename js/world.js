// The great map: China from longitude and latitude, five tiles to the degree, turned into a tile grid.
// . plain  , loess  d desert  o southern green  T forest  M mountain  H high plateau (blocks)
// W sea  r river  R road  B bridge  and the cities sit on top as their own tiles.
const LON0 = 101, LON1 = 123.5, LAT0 = 42.5, LAT1 = 20.5, K = 5;
export const WW = Math.round((LON1 - LON0) * K), WH = Math.round((LAT0 - LAT1) * K);
const tx = (lon) => Math.round((lon - LON0) * K), ty = (lat) => Math.round((LAT0 - lat) * K);

// coast, clockwise from the Liaodong shore; everything east and south of it is sea
const COAST = [[123.5, 40.2], [122.2, 40.6], [121.1, 40.9], [119.7, 39.9], [118.2, 39.2], [117.7, 38.8], [117.7, 38.3], [118.3, 38.0], [119.0, 37.3], [119.9, 37.3], [120.8, 37.8], [122.3, 37.4], [121.0, 36.6], [120.3, 36.0], [119.4, 35.2], [119.3, 34.7], [120.3, 34.1], [120.9, 33.0], [121.7, 32.0], [122.0, 31.4], [121.1, 30.7], [120.5, 30.3], [121.5, 30.0], [122.0, 29.8], [121.6, 28.5], [120.7, 27.8], [120.0, 26.7], [119.6, 25.7], [118.9, 24.9], [118.1, 24.4], [117.1, 23.5], [116.0, 22.9], [114.8, 22.6], [114.0, 22.4], [113.6, 22.2], [112.0, 21.8], [110.6, 21.2], [110.3, 20.5], [109.8, 20.5], [109.8, 21.4], [108.6, 21.7], [108.0, 21.5], [107.0, 20.5]];
const RIVERS = {
  黃河: [[101, 36.0], [103.8, 36.1], [105.2, 37.5], [106.2, 38.5], [106.8, 39.5], [108.0, 40.6], [110.0, 40.6], [111.0, 40.0], [110.9, 38.5], [110.5, 36.5], [110.35, 35.2], [110.4, 34.65], [112.4, 34.9], [113.6, 35.0], [114.7, 35.6], [115.5, 36.6], [116.3, 37.4], [117.5, 37.9], [118.3, 38.0]],
  長江: [[101, 27.9], [104.6, 28.8], [106.5, 29.5], [108.4, 30.8], [110.4, 31.0], [111.3, 30.7], [112.2, 30.2], [113.1, 29.4], [114.3, 30.6], [115.8, 29.8], [117.0, 30.6], [118.4, 31.7], [118.8, 32.1], [119.4, 32.2], [120.8, 32.0], [121.8, 31.6]],
  淮河: [[113.3, 32.4], [114.5, 32.4], [115.6, 32.6], [116.8, 32.7], [117.4, 33.0], [118.6, 33.4], [119.2, 33.5], [120.3, 34.0]],
  汴河: [[114.1, 34.95], [115.6, 34.2], [117.0, 33.7], [118.0, 33.6], [118.8, 33.4]],
  漢水: [[106.8, 33.1], [108.9, 32.7], [110.8, 32.6], [111.8, 32.1], [112.6, 31.0], [114.2, 30.6]],
  渭水: [[105.0, 34.6], [107.2, 34.4], [108.9, 34.5], [110.35, 34.65]],
  汾水: [[112.4, 38.7], [112.5, 37.5], [111.6, 36.3], [110.5, 35.4]],
  西江: [[108.0, 23.4], [111.3, 23.4], [112.8, 23.1], [113.6, 22.5]],
  贛江: [[115.2, 26.0], [115.9, 28.0], [116.2, 29.0], [115.8, 29.8]],
  湘江: [[111.2, 26.0], [112.9, 27.8], [113.0, 29.3]],
};
const LAKES = [[112.9, 29.2, 0.55], [116.2, 29.1, 0.5], [120.2, 31.2, 0.4]];
const RANGES = {
  太行: [[113.2, 35.2], [113.6, 36.5], [114.1, 38.0], [114.8, 39.5]],
  燕山: [[114.8, 40.3], [116.5, 40.6], [118.5, 40.5], [120.0, 40.8]],
  呂梁: [[110.9, 35.9], [111.3, 37.5], [111.9, 39.0]],
  秦嶺: [[104.5, 33.8], [107.0, 33.9], [109.5, 33.9], [111.2, 33.8], [112.4, 33.6]],
  巴山: [[105.0, 32.2], [108.5, 31.9], [110.5, 31.6]],
  大別: [[114.0, 31.5], [116.1, 31.1]],
  南嶺: [[109.0, 25.5], [111.5, 25.2], [113.5, 25.2], [115.5, 25.0], [116.5, 25.6]],
  武夷: [[116.8, 25.5], [117.5, 27.0], [118.5, 28.3]],
  泰山: [[116.8, 36.3], [118.0, 36.1]],
  六盤: [[106.2, 37.0], [106.4, 35.2]],
};

// every place in the story. kind: c city, f fort, v village
export const PLACES = {
  dangshan: { name: '碭山', lon: 116.35, lat: 34.45, kind: 'v' },
  xiaoxian: { name: '蕭縣', lon: 116.95, lat: 34.15, kind: 'v' },
  mangdang: { name: '芒碭山', lon: 116.45, lat: 33.85, kind: 'f' },
  songzhou: { name: '宋州', lon: 115.65, lat: 34.45, kind: 'c' },
  bianzhou: { name: '汴州', lon: 114.35, lat: 34.8, kind: 'c' },
  chenzhou: { name: '陳州', lon: 114.9, lat: 33.75, kind: 'c' },
  caizhou: { name: '蔡州', lon: 114.4, lat: 33.0, kind: 'c' },
  wangman: { name: '王滿渡', lon: 113.9, lat: 34.97, kind: 'f' },
  luoyang: { name: '洛陽', lon: 112.45, lat: 34.6, kind: 'c' },
  tongguan: { name: '潼關', lon: 110.25, lat: 34.5, kind: 'f' },
  tongzhou: { name: '同州', lon: 109.95, lat: 34.9, kind: 'c' },
  hezhong: { name: '河中', lon: 110.75, lat: 35.05, kind: 'c' },
  changan: { name: '長安', lon: 108.9, lat: 34.3, kind: 'c' },
  fengxiang: { name: '鳳翔', lon: 107.4, lat: 34.55, kind: 'c' },
  taiyuan: { name: '太原', lon: 112.55, lat: 37.85, kind: 'c' },
  luzhou: { name: '潞州', lon: 113.0, lat: 36.2, kind: 'c' },
  huazhou: { name: '滑州', lon: 114.65, lat: 35.25, kind: 'c' },
  baima: { name: '白馬驛', lon: 114.85, lat: 35.75, kind: 'f' },
  weizhou: { name: '魏州', lon: 115.3, lat: 36.3, kind: 'c' },
  zhenzhou: { name: '鎮州', lon: 114.5, lat: 38.1, kind: 'c' },
  dingzhou: { name: '定州', lon: 115.0, lat: 38.7, kind: 'c' },
  youzhou: { name: '幽州', lon: 116.4, lat: 39.9, kind: 'c' },
  yunzhou: { name: '鄆州', lon: 116.3, lat: 35.95, kind: 'c' },
  yanzhou: { name: '兗州', lon: 116.85, lat: 35.5, kind: 'c' },
  xuzhou: { name: '徐州', lon: 117.25, lat: 34.3, kind: 'c' },
  qingzhou: { name: '青州', lon: 118.5, lat: 36.7, kind: 'c' },
  langhu: { name: '狼虎谷', lon: 117.7, lat: 35.8, kind: 'f' },
  suzhou: { name: '宿州', lon: 117.0, lat: 33.65, kind: 'c' },
  qingkou: { name: '清口', lon: 118.95, lat: 33.65, kind: 'f' },
  yangzhou: { name: '揚州', lon: 119.45, lat: 32.5, kind: 'c' },
  shouzhou: { name: '壽州', lon: 116.8, lat: 32.45, kind: 'c' },
  xiangzhou: { name: '襄州', lon: 112.1, lat: 32.1, kind: 'c' },
  jingzhou: { name: '荊州', lon: 112.2, lat: 30.45, kind: 'c' },
  ezhou: { name: '鄂州', lon: 114.3, lat: 30.3, kind: 'c' },
  hongzhou: { name: '洪州', lon: 115.9, lat: 28.7, kind: 'c' },
  hangzhou: { name: '杭州', lon: 120.15, lat: 30.1, kind: 'c' },
  fuzhou: { name: '福州', lon: 119.3, lat: 26.1, kind: 'c' },
  guangzhou: { name: '廣州', lon: 113.25, lat: 23.2, kind: 'c' },
  chengdu: { name: '成都', lon: 104.05, lat: 30.65, kind: 'c' },
};
const ROADS = [
  ['xiaoxian', 'dangshan'], ['dangshan', 'mangdang'], ['dangshan', 'songzhou'], ['songzhou', 'bianzhou'], ['xiaoxian', 'xuzhou'], ['bianzhou', 'chenzhou'], ['chenzhou', 'caizhou'], ['bianzhou', 'wangman'], ['wangman', 'luoyang'],
  ['luoyang', 'tongguan'], ['tongguan', 'changan'], ['tongguan', 'tongzhou'], ['tongzhou', 'hezhong'], ['changan', 'fengxiang'], ['tongzhou', 'changan'],
  ['hezhong', 'taiyuan'], ['luoyang', 'luzhou'], ['luzhou', 'taiyuan'], ['bianzhou', 'huazhou'], ['huazhou', 'baima'], ['baima', 'weizhou'], ['weizhou', 'zhenzhou'], ['zhenzhou', 'dingzhou'], ['dingzhou', 'youzhou'], ['zhenzhou', 'taiyuan'],
  ['songzhou', 'yunzhou'], ['yunzhou', 'yanzhou'], ['yanzhou', 'xuzhou'], ['yunzhou', 'weizhou'], ['yanzhou', 'langhu'], ['langhu', 'qingzhou'], ['xuzhou', 'suzhou'], ['suzhou', 'qingkou'], ['qingkou', 'yangzhou'], ['suzhou', 'shouzhou'], ['shouzhou', 'yangzhou'], ['caizhou', 'shouzhou'],
  ['caizhou', 'xiangzhou'], ['luoyang', 'xiangzhou'], ['xiangzhou', 'jingzhou'], ['jingzhou', 'ezhou'], ['caizhou', 'ezhou'], ['ezhou', 'hongzhou'], ['yangzhou', 'hangzhou'], ['hangzhou', 'hongzhou'], ['hangzhou', 'fuzhou'], ['hongzhou', 'guangzhou'], ['jingzhou', 'guangzhou'], ['changan', 'chengdu'], ['xiangzhou', 'changan'],
];

function build() {
  const m = Array.from({ length: WH }, () => Array(WW).fill('.'));
  const set = (x, y, c) => { if (m[y] && m[y][x] !== undefined) m[y][x] = c; };
  // sea: the polygon closed around the south-east corner
  const poly = [...COAST, [107.0, 20.0], [124.0, 20.0], [124.0, 40.2]].map(([a, b]) => [(a - LON0) * K, (LAT0 - b) * K]);
  const inPoly = (x, y) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  let seed = 907;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // what the land looks like, by where it is
  for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) {
    const lon = LON0 + x / K, lat = LAT0 - y / K;
    if (inPoly(x + 0.5, y + 0.5)) { m[y][x] = 'W'; continue; }
    if (lon < 103 && lat > 27) { m[y][x] = 'H'; continue; }        // the Tibetan edge closes the west
    if (lat > 41.2 + Math.sin(lon * 1.3) * 0.4) { m[y][x] = 'd'; continue; } // the northern steppe
    if (lat > 34.4 && lon < 112.2 + Math.sin(lat * 2.1) * 0.5) { m[y][x] = rnd() < 0.06 ? 'M' : ','; continue; } // the loess country
    if (lat < 31.6) { const k = rnd(); m[y][x] = k < 0.2 ? 'T' : k < 0.25 ? 'M' : 'o'; continue; } // the wet south
    if (lat < 33) { m[y][x] = rnd() < 0.14 ? 'T' : 'o'; continue; }
    m[y][x] = rnd() < 0.05 ? 'T' : '.';
  }
  const line = (a, b, fn) => {
    const [x0, y0] = [(a[0] - LON0) * K, (LAT0 - a[1]) * K], [x1, y1] = [(b[0] - LON0) * K, (LAT0 - b[1]) * K];
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2);
    for (let i = 0; i <= n; i++) fn(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n));
  };
  for (const pts of Object.values(RANGES)) for (let i = 0; i < pts.length - 1; i++) line(pts[i], pts[i + 1], (x, y) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (Math.abs(dx) + Math.abs(dy) < 2 || rnd() < 0.5) { if (m[y + dy]?.[x + dx] && m[y + dy][x + dx] !== 'W') set(x + dx, y + dy, 'M'); }
  });
  for (const [lon, lat, r] of LAKES) for (let y = ty(lat + r); y <= ty(lat - r); y++) for (let x = tx(lon - r); x <= tx(lon + r); x++) {
    if (Math.hypot((x - tx(lon)) / (r * K), (y - ty(lat)) / (r * K)) < 1) set(x, y, 'W');
  }
  // rivers join up orthogonally, so they can't be crossed on a diagonal
  const stroke = (pts, c) => {
    let px = null, py = null;
    const put = (x, y) => {
      if (px !== null && x !== px && y !== py) set(x, py, c);
      if (m[y]?.[x] !== 'W') set(x, y, c);
      px = x; py = y;
    };
    for (let i = 0; i < pts.length - 1; i++) line(pts[i], pts[i + 1], put);
  };
  for (const pts of Object.values(RIVERS)) stroke(pts, 'r');
  // roads overwrite mountains (those are the passes) and become bridges on water
  // found by cost, so they follow the land, take the passes and cross a river straight over
  const COST = { R: 0.4, B: 0.4, '.': 1, ',': 1, o: 1, d: 2, T: 2, M: 7, r: 9, W: 40, H: 200 };
  const road = (a, b) => {
    const goal = tx(b.lon) + ty(b.lat) * WW, start = tx(a.lon) + ty(a.lat) * WW;
    const dist = new Float64Array(WW * WH).fill(Infinity), from = new Int32Array(WW * WH).fill(-1);
    const heap = [[0, start]];
    dist[start] = 0;
    const push = (v) => { heap.push(v); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let s = i; if (heap[l] && heap[l][0] < heap[s][0]) s = l; if (heap[r] && heap[r][0] < heap[s][0]) s = r; if (s === i) break; [heap[s], heap[i]] = [heap[i], heap[s]]; i = s; } } return top; };
    while (heap.length) {
      const [d, at] = pop();
      if (at === goal) break;
      if (d > dist[at]) continue;
      const x = at % WW, y = (at / WW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= WW || ny >= WH) continue;
        const n = nx + ny * WW, nd = d + (COST[m[ny][nx]] ?? 1);
        if (nd < dist[n]) { dist[n] = nd; from[n] = at; push([nd, n]); }
      }
    }
    for (let at = goal; at !== -1; at = from[at]) {
      const x = at % WW, y = (at / WW) | 0, t = m[y][x];
      if (t === 'r' || t === 'W') set(x, y, 'B');
      else if (t !== 'B') set(x, y, 'R');
    }
  };
  for (const [a, b] of ROADS) road(PLACES[a], PLACES[b]);
  const places = {};
  for (const [id, p] of Object.entries(PLACES)) {
    const x = tx(p.lon), y = ty(p.lat);
    places[id] = { ...p, id, x, y };
    set(x, y, p.kind === 'c' ? 'C' : p.kind === 'v' ? 'V' : 'A');
  }
  return { rows: m.map((r) => r.join('')), places };
}
const built = build();
export const WORLD = { name: '天下', rows: built.rows, places: built.places, encounter: true };
export const placeAt = (x, y) => Object.values(built.places).find((p) => p.x === x && p.y === y);
export const RIVER_NAMES = Object.keys(RIVERS);
