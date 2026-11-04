// The map: drawing, tap-to-walk, people and steps.
import { img, tiles, TS, drawActor } from './art.js';
import { MAPS, WALK } from './maps.js';
import { se } from './audio.js';

const STEP_MS = 150;
const dirOf = (dx, dy) => (dy > 0 ? 'down' : dy < 0 ? 'up' : dx < 0 ? 'left' : 'right');

export class Field {
  constructor(G) { this.G = G; this.npcs = []; this.path = []; this.t = 0; this.trail = []; this.keys = new Set(); this.pending = null; this.encounter = 18; this.cam = { x: 0, y: 0 }; }
  get rows() { return MAPS[this.map].rows; }
  tile(x, y) { const r = this.rows[y]; return r ? r[x] : undefined; }
  blocked(x, y) { return !WALK.has(this.tile(x, y)) || this.npcs.some((n) => n.x === x && n.y === y); }
  enter(map, x, y, dir = 'down') {
    this.map = map; this.x = x; this.y = y; this.dir = dir; this.moving = 0; this.path = []; this.pending = null;
    this.fromX = x; this.fromY = y; this.trail = [];
    this.refresh();
    Object.assign(this.G.s, { map, x, y, dir });
  }
  refresh() { this.npcs = this.G.story.npcs(this.map); }

  // shortest way to one of the goal tiles, or as near as we can get
  route(goals) {
    const key = (x, y) => x + ',' + y, seen = new Map([[key(this.x, this.y), null]]), q = [[this.x, this.y]];
    const isGoal = (x, y) => goals.some((g) => g[0] === x && g[1] === y);
    let best = [this.x, this.y], bestD = Infinity;
    for (let i = 0; i < q.length; i++) {
      const [x, y] = q[i];
      if (isGoal(x, y)) { best = [x, y]; bestD = -1; break; }
      const d = Math.min(...goals.map((g) => Math.abs(g[0] - x) + Math.abs(g[1] - y)));
      if (d < bestD) { bestD = d; best = [x, y]; }
      if (i > 2500) break;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (seen.has(k) || this.blocked(nx, ny)) continue;
        seen.set(k, [x, y]); q.push([nx, ny]);
      }
    }
    const out = [];
    for (let at = best; at && !(at[0] === this.x && at[1] === this.y); at = seen.get(key(at[0], at[1]))) out.unshift(at);
    return out;
  }
  tap(cx, cy) {
    if (this.G.busy) return;
    const tx = Math.floor((cx + this.cam.x) / TS), ty = Math.floor((cy + this.cam.y + TS * 0.1) / TS);
    const n = this.npcs.find((p) => p.x === tx && p.y === ty);
    if (n) {
      this.pending = n;
      const around = [[n.x, n.y + 1], [n.x, n.y - 1], [n.x - 1, n.y], [n.x + 1, n.y]];
      if (around.some((g) => g[0] === this.x && g[1] === this.y) && !this.moving) { this.path = []; this.arrive(); return; }
      this.path = this.route(around.filter((g) => !this.blocked(g[0], g[1])));
    } else { this.pending = null; this.path = this.route([[tx, ty]]); }
    this.marker = { x: tx, y: ty, t: 400 };
  }
  arrive() {
    const n = this.pending; this.pending = null;
    if (n && Math.abs(n.x - this.x) + Math.abs(n.y - this.y) === 1) {
      this.dir = dirOf(n.x - this.x, n.y - this.y);
      if (n.dirFace !== false && n.key) n.dir = dirOf(this.x - n.x, this.y - n.y);
      this.G.run(n.talk);
    }
  }
  afterStep() {
    const G = this.G, s = G.s;
    Object.assign(s, { x: this.x, y: this.y, dir: this.dir });
    s.steps = (s.steps || 0) + 1;
    // people who stop you as soon as you are next to them
    const auto = this.npcs.find((n) => n.auto && Math.abs(n.x - this.x) + Math.abs(n.y - this.y) === 1);
    if (auto) { this.path = []; this.pending = null; this.dir = dirOf(auto.x - this.x, auto.y - this.y); G.run(auto.talk); return true; }
    const ev = G.story.onStep && G.story.onStep(this.map, this.x, this.y);
    if (ev) { this.path = []; this.pending = null; G.run(ev); return true; }
    const m = MAPS[this.map];
    if (m.encounter && this.tile(this.x, this.y) !== 'R' && this.tile(this.x, this.y) !== 'S') {
      if (--this.encounter <= 0) {
        this.encounter = 16 + Math.floor(Math.random() * 12);
        this.path = []; this.pending = null;
        G.run(() => G.story.randomFight(this.tile(this.x, this.y)));
        return true;
      }
    }
    return false;
  }
  update(dt) {
    this.t += dt;
    if (this.marker) { this.marker.t -= dt; if (this.marker.t <= 0) this.marker = null; }
    if (this.G.busy) { if (this.moving > 0) this.finishMove(dt); return; }
    if (this.moving > 0) { this.finishMove(dt); return; }
    let next = null;
    if (this.keys.size) {
      const k = [...this.keys].pop();
      const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[k];
      if (d) { this.dir = dirOf(d[0], d[1]); if (!this.blocked(this.x + d[0], this.y + d[1])) next = [this.x + d[0], this.y + d[1]]; }
      this.path = [];
    } else if (this.path.length) {
      next = this.path.shift();
      if (this.blocked(next[0], next[1])) { this.path = []; next = null; }
    } else if (this.pending) { this.arrive(); return; }
    if (next) {
      this.dir = dirOf(next[0] - this.x, next[1] - this.y);
      this.trail.unshift({ x: this.x, y: this.y, dir: this.dir });
      if (this.trail.length > 6) this.trail.length = 6;
      this.fromX = this.x; this.fromY = this.y; this.x = next[0]; this.y = next[1]; this.moving = STEP_MS;
      this.frameFlip = !this.frameFlip;
    }
  }
  finishMove(dt) {
    this.moving -= dt;
    if (this.moving <= 0) { this.moving = 0; this.fromX = this.x; this.fromY = this.y; this.afterStep(); }
  }
  draw(c, W, H) {
    const k = this.moving / STEP_MS;
    const px = (this.x + (this.fromX - this.x) * k) * TS + TS / 2, py = (this.y + (this.fromY - this.y) * k) * TS + TS;
    const rows = this.rows, mw = rows[0].length * TS, mh = rows.length * TS;
    const clamp = (v, lo, hi) => (hi < lo ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)));
    this.cam = { x: Math.round(clamp(px - W / 2, 0, mw - W)), y: Math.round(clamp(py - H * 0.5, 0, mh - H)) };
    const { x: cx, y: cy } = this.cam;
    c.fillStyle = '#15110d'; c.fillRect(0, 0, W, H);
    const wf = Math.floor(this.t / 420) % 2;
    for (let y = Math.max(0, Math.floor(cy / TS)); y <= Math.min(rows.length - 1, Math.floor((cy + H) / TS)); y++) {
      for (let x = Math.max(0, Math.floor(cx / TS)); x <= Math.min(rows[0].length - 1, Math.floor((cx + W) / TS)); x++) {
        const ch = rows[y][x], set = tiles[ch] || tiles['.'];
        const v = ch === 'W' || ch === 'c' ? wf % set.length : (x * 31 + y * 17) % set.length;
        c.drawImage(set[v], x * TS - cx, y * TS - cy);
      }
    }
    if (this.marker) { c.strokeStyle = '#e8dcc0'; c.strokeRect(this.marker.x * TS - cx + 0.5, this.marker.y * TS - cy + 0.5, TS - 1, TS - 1); }
    const list = [];
    for (const n of this.npcs) if (n.key) list.push({ y: n.y * TS + TS, draw: () => {
      drawActor(c, n.key, n.dir || 'down', n.anim ? (Math.floor(this.t / 300) % 2 ? 1 : 2) : 0, n.x * TS + TS / 2 - cx, n.y * TS + TS - cy);
      if (n.auto) { c.fillStyle = '#b5301f'; c.fillRect(n.x * TS + TS / 2 - cx - 1, n.y * TS - 20 - cy + (Math.floor(this.t / 300) % 2), 3, 7); c.fillRect(n.x * TS + TS / 2 - cx - 1, n.y * TS - 11 - cy + (Math.floor(this.t / 300) % 2), 3, 2); }
    } });
    // the rest of the party walks behind, each on the tile the one in front just left
    const mem = this.G.s.party.members;
    for (let i = 1; i < mem.length; i++) {
      const a = this.trail[i * 1 - 1], b = this.trail[i];
      const at = a || { x: this.fromX, y: this.fromY, dir: this.dir };
      const prev = b || at;
      const fx = (at.x + (prev.x - at.x) * k) * TS + TS / 2, fy = (at.y + (prev.y - at.y) * k) * TS + TS;
      list.push({ y: fy - 0.5, draw: () => drawActor(c, mem[i].id, at.dir, this.moving ? (this.frameFlip ? 1 : 2) : 0, fx - cx, fy - cy) });
    }
    const frame = this.moving ? (this.frameFlip ? 1 : 2) : 0;
    list.push({ y: py, draw: () => drawActor(c, 'sunce', this.dir, frame, px - cx, py - cy) });
    list.sort((a, b) => a.y - b.y).forEach((o) => o.draw());
  }
}
