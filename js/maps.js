// The two maps. Walkable tiles: . , R S F B. Everything else blocks.
export const WALK = new Set(['.', ',', 'R', 'S', 'F', 'B']);

const CAMP = [
  'TTTTTTTTTTTTTTTT',
  'TT..H..TT..H..TT',
  'T..............T',
  'T.H..f....f..H.T',
  'T....f.RR.f....T',
  'T......RR......T',
  'T.x....RR....x.T',
  'T.x....RR....x.T',
  'T..RRRRRRRRRR..T',
  'T..R........R..T',
  'T..R.bH..Hb.R..T',
  'T..R........R..T',
  'T..R...c....R..T',
  'T..R........R..T',
  'T..RRRRRRRRRR..T',
  'T......RR......T',
  'T.H....RR....H.T',
  'T......RR......T',
  'TT,....RR....,TT',
  'SSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSS',
  'WWWWWWWBBWWWWWWW',
  'WWWWWWWBBWWWWWWW',
  'WWWWWWDDDDWWWWWW',
];

// seeded so the field looks the same for everyone
function buildField() {
  const W = 24, H = 62;
  let seed = 4242;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const m = Array.from({ length: H }, () => Array(W).fill('.'));
  const roadX = (y) => Math.round(11 + 3.2 * Math.sin(y / 6.5) + 1.2 * Math.sin(y / 2.7));
  const road = {};
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (y <= 2) m[y][x] = 'W';
      else if (y <= 5) m[y][x] = 'S';
      else if (y <= 8) m[y][x] = r() < 0.5 ? 'S' : '.';
      else if (y >= 25 && y <= 45) m[y][x] = r() < 0.34 ? 'P' : 'F';
      else if (y < 55) { const k = r(); m[y][x] = k < 0.1 ? 'T' : k < 0.2 ? ',' : '.'; }
    }
    // a river down the east side of the first plain
    if (y >= 3 && y <= 23) { const e = 20 + Math.round(1.3 * Math.sin(y / 3)); for (let x = e; x < W; x++) m[y][x] = 'W'; }
  }
  // the road, joined up so the player can always walk it
  let px = roadX(3);
  for (let y = 3; y < 56; y++) {
    const x = roadX(y);
    for (let k = Math.min(px, x); k <= Math.max(px, x); k++) m[y][k] = 'R';
    road[y] = x; px = x;
  }
  m[2][roadX(3)] = 'D'; m[2][roadX(3) + 1] = 'D';
  // tree lines with one gap: every fixed fight stands in a gap you have to pass
  const choke = (y, tile = 'T') => { for (let x = 0; x < W; x++) if (m[y][x] !== 'R' && m[y][x] !== 'W') m[y][x] = tile; };
  const FIGHT_ROWS = [8, 11, 19, 28, 35, 41, 48, 53];
  for (const y of FIGHT_ROWS) {
    // the row above reaches the gap, since this row's own stretch of road is about to close
    for (let k = Math.min(road[y - 1], road[y]); k <= Math.max(road[y - 1], road[y]); k++) m[y - 1][k] = 'R';
    for (let x = 0; x < W; x++) if (m[y][x] === 'R' && x !== road[y]) m[y][x] = 'T';
    choke(y, y >= 25 && y <= 45 ? 'P' : 'T');
  }
  // the wall of 曲阿
  const wallY = 57;
  for (let y = wallY; y < H; y++) for (let x = 0; x < W; x++) m[y][x] = y === wallY ? 'C' : 'K';
  const gateX = road[55];
  for (let y = 55; y < wallY; y++) m[y][gateX] = 'R';
  m[wallY][gateX] = 'G';
  // the two supply posts and the shrine by the road
  const post = (y, side) => {
    const x = road[y] + side * 3;
    for (let j = y - 1; j <= y + 2; j++) for (let i = x - 2; i <= x + 2; i++) if (m[j]?.[i] !== undefined && m[j][i] !== 'R' && m[j][i] !== 'W') m[j][i] = '.';
    for (let i = Math.min(x, road[y]); i <= Math.max(x, road[y]); i++) m[y + 1][i] = 'R';
    m[y][x - 1] = 'H'; m[y][x + 1] = 'c'; m[y - 1][x + 1] = 'b';
    return { x, y };
  };
  const post1 = post(15, -1), post2 = post(50, -1);
  // the clearing around 神亭
  const sy = 39, sx = road[sy];
  for (let j = sy - 1; j <= sy; j++) for (let i = sx - 3; i <= sx + 3; i++) if (m[j][i] !== 'R') m[j][i] = 'F';
  m[sy - 1][sx + 3] = 'A';
  const G = (y) => ({ x: road[y], y });
  return { W, H, rows: m.map((a) => a.join('')), road, post1, post2, spots: { landing: G(8), boss1: G(11), road1: G(19), road2: G(28), road3: G(35), duel: G(41), road4: G(48), road5: G(53), gate: { x: gateX, y: wallY - 1 } } };
}

export const FIELD = buildField();

export const MAPS = {
  camp: { name: '歷陽軍營', rows: CAMP, music: 'field', encounter: false },
  field: { name: '江東原野', rows: FIELD.rows, music: 'field', encounter: true, road: FIELD.road },
};
