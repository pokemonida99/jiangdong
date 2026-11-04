// The map: drawing, walking (pad, keys or a tap), people and steps. Used for the great map and every town and fortress.
import { tiles, TS, drawActor, flags, pointer, pixelText } from './art.js';
import { WORLD, placeAt } from './world.js';
import { LOCAL, WALK } from './castles.js';
import { lookOf } from './battle_core.js';
import { se } from './audio.js';

const STEP_MS = 150;
const dirOf = (dx, dy) => (dy > 0 ? 'down' : dy < 0 ? 'up' : dx < 0 ? 'left' : 'right');
export const MAPS = { world: WORLD, ...LOCAL };
const ANIM = new Set(['W', 'r', 'q', 'F']);
const CHECKER = (() => {
  // a night shade made of black dots, since the old machines had no transparency
  const c = document.createElement('canvas'); c.width = c.height = 4;
  const x = c.getContext('2d');
  x.fillStyle = '#000000';
  x.fillRect(0, 0, 1, 1); x.fillRect(2, 2, 1, 1); x.fillRect(2, 0, 1, 1); x.fillRect(0, 2, 1, 1); x.fillRect(1, 3, 1, 1); x.fillRect(3, 1, 1, 1);
  return c;
})();

export class Field {
  constructor(G) { this.G = G; this.npcs = []; this.path = []; this.t = 0; this.trail = []; this.keys = new Set(); this.pending = null; this.encounter = 14; this.cam = { x: 0, y: 0 }; this.over = {}; this.flash = 0; this.nextFlash = 3000; }
  get rows() { return MAPS[this.map].rows; }
  tile(x, y) {
    const o = this.over[x + ',' + y];
    if (o) return o;
    const r = this.rows[y];
    return r ? r[x] : undefined;
  }
  blocked(x, y) { return !WALK.has(this.tile(x, y)) || this.npcs.some((n) => n.x === x && n.y === y); }
  enter(map, x, y, dir = 'down') {
    this.map = map; this.x = x; this.y = y; this.dir = dir; this.moving = 0; this.path = []; this.pending = null;
    this.fromX = x; this.fromY = y; this.trail = [];
    this.refresh();
    Object.assign(this.G.s, { map, x, y, dir });
    this.G.renderHud();
  }
  refresh() { this.npcs = this.G.story.npcs(this.map); this.over = this.G.story.overlay(this.map); }

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
  // the A button: whatever you are facing
  action() {
    if (this.G.busy || this.moving) return;
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.dir];
    const n = this.npcs.find((p) => p.x === this.x + d[0] && p.y === this.y + d[1]);
    if (n) { if (n.key && n.dirFace !== false) n.dir = dirOf(-d[0], -d[1]); this.G.run(n.talk); return; }
    const near = this.npcs.find((p) => Math.abs(p.x - this.x) + Math.abs(p.y - this.y) === 1);
    if (near) { this.dir = dirOf(near.x - this.x, near.y - this.y); if (near.key && near.dirFace !== false) near.dir = dirOf(this.x - near.x, this.y - near.y); this.G.run(near.talk); return; }
    if (this.map === 'world') { const p = placeAt(this.x, this.y); if (p) { this.G.run(() => this.G.story.enterPlace(p.id)); return; } }
    se('bump');
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
    G.renderHud();
    // people who stop you as soon as you are next to them
    const auto = this.npcs.find((n) => n.auto && Math.abs(n.x - this.x) + Math.abs(n.y - this.y) === 1);
    if (auto) { this.path = []; this.pending = null; this.dir = dirOf(auto.x - this.x, auto.y - this.y); G.run(auto.talk); return true; }
    const ev = G.story.onStep(this.map, this.x, this.y);
    if (ev) { this.path = []; this.pending = null; G.run(ev); return true; }
    const m = MAPS[this.map];
    const t = this.tile(this.x, this.y);
    if (m.encounter && t !== 'R' && t !== 'B' && t !== 'C' && t !== 'V' && t !== 'A') {
      if (--this.encounter <= 0) {
        this.encounter = 18 + Math.floor(Math.random() * 14);
        const foes = G.story.randomFoes();
        if (foes) {
          this.path = []; this.pending = null;
          G.run(() => G.story.randomFight(t, foes));
          return true;
        }
      }
    }
    return false;
  }
  update(dt) {
    this.t += dt;
    if (this.marker) { this.marker.t -= dt; if (this.marker.t <= 0) this.marker = null; }
    if (MAPS[this.map].rain || this.G.s?.flags?.rainNow) {
      this.nextFlash -= dt;
      if (this.nextFlash <= 0) { this.flash = 180; this.nextFlash = 2600 + Math.random() * 4200; se('thunder'); }
      if (this.flash > 0) this.flash -= dt;
    }
    if (this.G.busy) { if (this.moving > 0) this.finishMove(dt); return; }
    if (this.moving > 0) { this.finishMove(dt); return; }
    let next = null;
    if (this.keys.size) {
      const k = [...this.keys].pop();
      const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[k];
      if (d) {
        this.dir = dirOf(d[0], d[1]);
        if (!this.blocked(this.x + d[0], this.y + d[1])) next = [this.x + d[0], this.y + d[1]];
        else {
          this.bumpT = (this.bumpT || 0) - dt;
          if (this.bumpT <= 0) { this.bumpT = 320; se('bump'); }
        }
      }
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
    c.fillStyle = '#000000'; c.fillRect(0, 0, W, H);
    const wf = Math.floor(this.t / 420) % 2;
    for (let y = Math.max(0, Math.floor(cy / TS)); y <= Math.min(rows.length - 1, Math.floor((cy + H) / TS)); y++) {
      for (let x = Math.max(0, Math.floor(cx / TS)); x <= Math.min(rows[0].length - 1, Math.floor((cx + W) / TS)); x++) {
        const ch = this.tile(x, y), set = tiles[ch] || tiles['.'];
        const v = ANIM.has(ch) ? wf % set.length : 0;
        c.drawImage(set[v], x * TS - cx, y * TS - cy);
      }
    }
    if (this.marker) { c.strokeStyle = '#fcfcfc'; c.strokeRect(this.marker.x * TS - cx + 0.5, this.marker.y * TS - cy + 0.5, TS - 1, TS - 1); }
    const list = [];
    for (const n of this.npcs) if (n.key) list.push({ y: n.y * TS + TS, draw: () => {
      drawActor(c, n.key, n.dir || 'down', n.anim ? (Math.floor(this.t / 300) % 2 ? 1 : 2) : 0, n.x * TS + TS / 2 - cx, n.y * TS + TS - cy);
      if (n.auto) { const b = Math.floor(this.t / 300) % 2; c.fillStyle = '#000000'; c.fillRect(n.x * TS + TS / 2 - cx - 2, n.y * TS - 21 - cy + b, 5, 12); c.fillStyle = '#f83800'; c.fillRect(n.x * TS + TS / 2 - cx - 1, n.y * TS - 20 - cy + b, 3, 7); c.fillRect(n.x * TS + TS / 2 - cx - 1, n.y * TS - 12 - cy + b, 3, 2); }
    } });
    // the rest of the party walks behind, each on the tile the one in front just left
    const party = this.G.s.party, mem = party.members, onWorld = this.map === 'world';
    // the great map shows one small figure for the whole army, the way a map should
    for (let i = 1; i < (onWorld ? 0 : mem.length); i++) {
      const a = this.trail[i - 1], b = this.trail[i];
      const at = a || { x: this.fromX, y: this.fromY, dir: this.dir };
      const prev = b || at;
      const fx = (at.x + (prev.x - at.x) * k) * TS + TS / 2, fy = (at.y + (prev.y - at.y) * k) * TS + TS;
      list.push({ y: fy - 0.5, draw: () => drawActor(c, lookOf(mem[i].id, party), at.dir, this.moving ? (this.frameFlip ? 1 : 2) : 0, fx - cx, fy - cy) });
    }
    const frame = this.moving ? (this.frameFlip ? 1 : 2) : 0;
    list.push({ y: py, draw: () => drawActor(c, lookOf(mem[0].id, party), this.dir, frame, px - cx, py - cy, onWorld ? 0.75 : 1) });
    if (this.map === 'world') this.placeMarks(c, W, H, cx, cy);
    list.sort((a, b) => a.y - b.y).forEach((o) => o.draw());
    if (this.map === 'world') this.goalPointer(c, W, H, cx, cy);
    if (MAPS[this.map].night || this.G.s.flags.rainNow) this.night(c, W, H);
  }
  placeMarks(c, W, H, cx, cy) {
    const G = this.G;
    for (const p of Object.values(WORLD.places)) {
      const x = p.x * TS - cx, y = p.y * TS - cy;
      if (x < -40 || y < -24 || x > W + 40 || y > H + 24) continue;
      const own = G.story.ownerOf(p.id);
      if (own && flags[own]) c.drawImage(flags[own], x + 9, y - 5);
      pixelText(c, p.name, x + 8, y + 27);
    }
  }
  // where to go next: a bouncing arrow over the place, or one at the edge of the screen pointing there
  goalPointer(c, W, H, cx, cy) {
    const id = this.G.s.goalPlace, p = id && WORLD.places[id];
    if (!p || !pointer.c) return;
    const x = p.x * TS - cx + 8, y = p.y * TS - cy;
    const bob = Math.floor(this.t / 240) % 2;
    if (x > 0 && x < W && y > 6 && y < H) { c.drawImage(pointer.c, x - 4, y - 11 - bob); return; }
    const dx = x - W / 2, dy = y - H / 2, k = Math.min((W / 2 - 12) / Math.abs(dx || 1), (H / 2 - 12) / Math.abs(dy || 1));
    const ex = W / 2 + dx * k, ey = H / 2 + dy * k, a = Math.atan2(dy, dx);
    c.save(); c.translate(Math.round(ex), Math.round(ey)); c.rotate(Math.round(a / (Math.PI / 4)) * (Math.PI / 4) - Math.PI / 2);
    c.drawImage(pointer.c, -4, -4 + bob); c.restore();
  }
  night(c, W, H) {
    const pat = c.createPattern(CHECKER, 'repeat');
    if (this.flash > 0) { c.fillStyle = '#fcfcfc'; c.fillRect(0, 0, W, H); return; }
    c.fillStyle = pat; c.fillRect(0, 0, W, H);
    // rain: short white strokes falling on a slant
    c.fillStyle = '#a4e4fc';
    const t = Math.floor(this.t / 32);
    for (let i = 0; i < 46; i++) {
      const x = (i * 53 + t * 3) % (W + 12) - 6, y = (i * 97 + t * 11) % (H + 12) - 6;
      c.fillRect(x, y, 1, 3); c.fillRect(x - 1, y + 3, 1, 2);
    }
  }
}
