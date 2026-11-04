// A battle on screen: the troops, the command panel, and the animation of what battle_core decided.
import { img, drawActor, drawTroop } from './art.js';
import { GENERALS, SKILLS, ITEMS, FORMATIONS, TERRAIN, TYPE_NAME, BEATS, DUEL } from './data.js';
import { createBattle, resolveTurn, finishBattle, alive, autoCommand, persuadable, persuadeChance } from './battle_core.js';
import { el, button, onTap, wait, say } from './ui.js';
import { se, play } from './audio.js';
const view = () => el('view');

const TROOPS_SHOWN = 6;
export class BattleScene {
  constructor(G) { this.G = G; this.anims = []; this.parts = []; this.pops = []; this.dead = []; this.t = 0; this.units = []; this.speed = 1; this.bfH = 200; this.shake = 0; this.flash = 0; }
  animate(ms, fn) { return new Promise((res) => { this.anims.push({ t: 0, ms, fn, res }); }); }
  sleep(ms) { return this.animate(ms, () => {}); }
  update(dt) {
    this.t += dt;
    const d = dt * this.speed * (window.__testSpeed || 1);
    for (const a of [...this.anims]) { a.t += d; const k = Math.min(1, a.t / a.ms); a.fn(k); if (k >= 1) { this.anims.splice(this.anims.indexOf(a), 1); a.res(); } }
    for (const p of this.parts) { p.x += p.vx * d / 16; p.y += p.vy * d / 16; p.vy += (p.g || 0) * d / 16; p.life -= d; }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const p of this.pops) { p.y -= d * 0.018; p.life -= d; }
    this.pops = this.pops.filter((p) => p.life > 0);
    for (const c of this.dead) c.life -= d;
    this.dead = this.dead.filter((c) => c.life > 0);
    if (this.shake > 0) this.shake -= d;
    if (this.flash > 0) this.flash -= d;
  }
  layout(W) {
    const place = (list, x, top, bottom) => list.forEach((u, i) => {
      const y = list.length === 1 ? (top + bottom) / 2 : top + (bottom - top) * i / (list.length - 1);
      // a staggered line, so a name never sits on the head of the one below
      const px = x + (list.length > 2 ? (i % 2 ? 11 : -9) * (u.side === 'ally' ? 1 : -1) : 0);
      const old = this.pos[u.key];
      if (old) { old.x = px; old.y = y; } else this.pos[u.key] = { x: px, y, ox: 0, oy: 0 };
    });
    this.pos = this.pos || {};
    const top = this.bfH * 0.42, bottom = this.bfH - 20;
    place(this.st.foes, W * 0.3, top + 6, bottom);
    place(this.st.allies, W * 0.7, top, bottom);
  }
  shownOf(u) { return u.troops <= 0 ? 0 : Math.max(1, Math.ceil(u.troops / u.max * TROOPS_SHOWN)); }
  // soldiers stand behind the general, away from the middle of the field
  slot(u, i) {
    const dir = u.side === 'ally' ? 1 : -1;
    return { x: dir * (9 + (i % 3) * 11 + (i % 2) * 2), y: (i % 2 ? -5 : 4) + (i >= 3 ? 3 : -3) };
  }
  // names are page text, not canvas text: at this resolution they would cover the generals
  renderTags(W) {
    let box = el('stage').querySelector('.tags');
    if (!box) { box = document.createElement('div'); box.className = 'tags'; el('stage').appendChild(box); }
    const k = view().getBoundingClientRect().width / W;
    box.innerHTML = [...this.st.foes, ...this.st.allies].map((u) => {
      const p = this.pos[u.key];
      return `<span class="${u.side}${u.troops <= 0 ? ' out' : ''}" style="left:${p.x * k}px;top:${(p.y + 11) * k}px">${u.name}</span>`;
    }).join('');
    this.tagW = W; this.tagBf = this.bfH; this.tagDirty = false;
  }
  draw(c, W, H) {
    const bfH = this.bfH = Math.floor(H * 0.53);
    this.layout(W);
    if (this.tagW !== W || this.tagBf !== bfH || this.tagDirty) this.renderTags(W);
    c.fillStyle = '#15110d'; c.fillRect(0, 0, W, H);
    const bg = img[TERRAIN[this.st.terrain].bg];
    const sx = this.shake > 0 ? Math.round(Math.sin(this.t / 22) * 2) : 0;
    if (bg) { const k = Math.max(W / bg.width, bfH / bg.height), w = bg.width * k, h = bg.height * k; c.drawImage(bg, (W - w) / 2 + sx, bfH - h, w, h); }
    const list = [...this.st.foes, ...this.st.allies].map((u) => ({ u, p: this.pos[u.key] })).sort((a, b) => a.p.y - b.p.y);
    for (const d of this.dead) {
      c.save(); c.globalAlpha = Math.min(1, d.life / 200); c.translate(d.x + sx, d.y); c.rotate(d.dir * Math.PI / 2);
      drawTroop(c, d.side, d.type, 0, 0, 8, d.dir < 0 ? false : true); c.restore();
    }
    for (const { u, p } of list) this.drawUnit(c, u, p, sx);
    for (const pt of this.parts) { c.fillStyle = pt.c; c.fillRect(Math.round(pt.x) + sx, Math.round(pt.y), pt.s, pt.s); }
    c.font = '11px Cubic11, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    for (const pt of this.pops) this.label(c, pt.text, pt.x + sx, pt.y, pt.c);
    if (this.flash > 0) { c.fillStyle = `rgba(232,220,192,${Math.min(0.55, this.flash / 240)})`; c.fillRect(0, 0, W, bfH); }
    // terrain and formation in the corner, out of the way of the troops
    c.textAlign = 'left';
    const T = TERRAIN[this.st.terrain], tag = `${T.name}・${FORMATIONS[this.st.formation].name}陣`;
    const tw = c.measureText(tag).width;
    c.fillStyle = '#15110d'; c.fillRect(0, 2, tw + 8, 14); c.fillStyle = '#b5301f'; c.fillRect(0, 2, 2, 14);
    c.fillStyle = '#e8dcc0'; c.fillText(tag, 4, 13);
  }
  label(c, t, x, y, col = '#e8dcc0') {
    c.fillStyle = '#15110d';
    for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) c.fillText(t, x + a, y + b);
    c.fillStyle = col; c.fillText(t, x, y);
  }
  drawUnit(c, u, p, sx) {
    if (u.troops <= 0 && !this.pending?.has(u.key)) { this.fallenLabel(c, u, p, sx); return; }
    const x = p.x + p.ox + sx, y = p.y + p.oy, face = u.side === 'ally' ? 'left' : 'right';
    const step = Math.floor(this.t / 360) % 2, n = this.shownOf(u);
    const hit = u.hitT && this.t < u.hitT;
    const flicker = hit && Math.floor(this.t / 50) % 2;
    if (!flicker) {
      for (let i = TROOPS_SHOWN - 1; i >= 0; i--) {
        if (i >= n) continue;
        const s = this.slot(u, i);
        drawTroop(c, u.side, u.type, p.ox ? 1 : 0, x + s.x, y + s.y + (i % 2 === step ? 0 : -1), u.side === 'ally');
      }
      if (u.side === 'ally' || u.general) drawActor(c, u.side === 'ally' ? u.id : u.id === 'taishici' ? 'taishici' : 'zhangying', face, p.ox ? 1 : 0, x, y + 2);
      else drawTroop(c, u.side, u.type, p.ox ? 1 : 0, x, y + 2, false);
    }
    // name and troops, under the feet
    c.font = '11px Cubic11, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    const active = this.activeKey === u.key, target = this.targetKeys?.includes(u.key);
    if (active && Math.floor(this.t / 300) % 2) { c.fillStyle = '#d9a441'; c.fillRect(x - 3, y - 41, 7, 2); c.fillRect(x - 2, y - 39, 5, 2); c.fillRect(x - 1, y - 37, 3, 2); }
    if (target) { c.strokeStyle = Math.floor(this.t / 200) % 2 ? '#d9a441' : '#e8dcc0'; c.strokeRect(Math.round(x - 26) + 0.5, Math.round(y - 30) + 0.5, 52, 42); }
    const bw = 40, bx = Math.round(p.x - bw / 2), by = Math.round(p.y + 7);
    c.fillStyle = '#15110d'; c.fillRect(bx - 1, by - 1, bw + 2, 5);
    c.fillStyle = u.side === 'ally' ? '#b5301f' : '#5d7396'; c.fillRect(bx, by, Math.ceil(bw * Math.max(0, u.troops) / u.max), 3);
  }
  fallenLabel(c, u, p, sx) {
    c.font = '11px Cubic11, sans-serif'; c.textAlign = 'center';
    this.label(c, '潰', p.x + sx, p.y, '#cdbd98');
  }
  popup(key, text, col) { const p = this.pos[key]; this.pops.push({ x: p.x, y: p.y - 24, text, c: col || '#e8dcc0', life: 800 }); }
  burst(x, y, cols, n = 10, sp = 1.6) {
    for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: (Math.random() - 0.5) * sp * 2, vy: (Math.random() - 0.8) * sp * 2, g: 0.08, life: 300 + Math.random() * 280, c: cols[i % cols.length], s: 1 + (i % 3 === 0 ? 1 : 0) });
  }
  applyHit(h) {
    const u = this.byKey[h.unit], p = this.pos[h.unit];
    const was = this.shown[h.unit], now = h.after <= 0 ? 0 : Math.max(1, Math.ceil(h.after / u.max * TROOPS_SHOWN));
    this.shown[h.unit] = now;
    for (let i = now; i < was; i++) { const s = this.slot(u, i); this.dead.push({ x: p.x + s.x, y: p.y + s.y, side: u.side, type: u.type, dir: u.side === 'ally' ? 1 : -1, life: 700 }); }
    u.hitT = this.t + 280;
    this.shake = 140;
    this.popup(h.unit, String(h.dmg), u.side === 'ally' ? '#ffb39a' : '#ffe08a');
    this.burst(p.x, p.y - 12, ['#e8dcc0', '#b5301f', '#15110d'], 8);
    if (h.fell) { se('fall'); this.log(`${u.name}潰散了！`); this.tagDirty = true; }
  }
  log(text) { const l = el('battleUi').querySelector('.blog'); if (l) l.textContent = text; }

  // ---- what happens on screen for one event
  async playEvent(ev) {
    const a = ev.a ? this.byKey[ev.a] : null;
    const pa = a && this.pos[a.key];
    this.activeKey = a?.key;
    this.renderSquad();
    if (ev.t === 'attack') {
      const d = this.byKey[ev.hits[0].unit], pd = this.pos[d.key];
      const dx = (pd.x - pa.x) * 0.62, dy = (pd.y - pa.y) * 0.62;
      this.log(`${a.name} 攻向 ${d.name}${ev.edge > 1 ? '（兵種克制）' : ev.edge < 1 ? '（兵種不利）' : ''}`);
      await this.animate(190, (k) => { const q = k * k; pa.ox = dx * q; pa.oy = dy * q; });
      se('hit');
      this.applyHit(ev.hits[0]);
      await this.animate(180, (k) => { pa.ox = dx * (1 - k); pa.oy = dy * (1 - k); });
      pa.ox = pa.oy = 0;
      await this.sleep(160);
    } else if (ev.t === 'skill') {
      const sk = SKILLS[ev.skill];
      this.log(`${a.name}：${sk.name}！`);
      a.side === 'foe' && se('alarm');
      await this.skillFx(ev, a, pa, sk);
      await this.sleep(200);
    } else if (ev.t === 'defend') {
      this.log(`${a.name} 列陣防守`);
      this.popup(a.key, '防', '#a9c8bb');
      await this.sleep(320);
    } else if (ev.t === 'item') {
      this.log(`${a.name} 使用${ITEMS[ev.item].name}`);
      se('heal');
      for (const h of ev.heals) this.popup(h.unit, '+' + h.amount, '#a9d8a0');
      if (ev.ce) this.popup(a.key, '計+' + ev.ce, '#a9c8bb');
      for (const h of ev.heals) this.refill(h.unit);
      await this.sleep(420);
    } else if (ev.t === 'persuade') {
      const d = this.byKey[ev.d];
      this.log(`${a.name} 向 ${d.name} 喊話……`);
      await this.sleep(500);
      if (!ev.ok) { this.popup(ev.d, '不為所動', '#e8dcc0'); this.log(`${d.name} 不為所動。再喊一次，機會會更高。`); await this.sleep(600); }
    } else if (ev.t === 'fizzle') { this.log('計 不足，沒有成功。'); await this.sleep(400); }
    this.activeKey = null;
    this.renderSquad();
  }
  refill(key) { const u = this.byKey[key]; this.shown[key] = this.shownOf(u); }
  async skillFx(ev, a, pa, sk) {
    if (ev.ups.length) {
      se('buff');
      for (const k of ev.ups) { const p = this.pos[k]; this.popup(k, '攻↑', '#ffe08a'); for (let i = 0; i < 10; i++) this.parts.push({ x: p.x - 12 + Math.random() * 24, y: p.y, vx: 0, vy: -0.7 - Math.random(), life: 420, c: '#d9a441', s: 1 }); }
      await this.sleep(460);
    }
    if (ev.heals.length) {
      se('heal');
      for (const h of ev.heals) { const p = this.pos[h.unit]; this.refill(h.unit); this.popup(h.unit, '+' + h.amount, '#a9d8a0'); for (let i = 0; i < 12; i++) this.parts.push({ x: p.x - 14 + Math.random() * 28, y: p.y + 4, vx: 0, vy: -0.6 - Math.random(), life: 460, c: i % 2 ? '#a9d8a0' : '#e8dcc0', s: 1 }); }
      await this.sleep(460);
    }
    if (ev.hits.length) {
      if (sk.el === 'fire') {
        se('fire');
        for (const h of ev.hits) { const p = this.pos[h.unit]; for (let i = 0; i < 26; i++) this.parts.push({ x: p.x - 22 + Math.random() * 44, y: p.y + 8 - Math.random() * 6, vx: (Math.random() - 0.5) * 0.4, vy: -0.8 - Math.random() * 1.4, life: 300 + Math.random() * 420, c: ['#b5301f', '#d9a441', '#ffe08a'][i % 3], s: 1 + (i % 4 === 0 ? 1 : 0) }); }
        await this.sleep(420);
      } else if (sk.el === 'water') {
        se('water');
        const left = Math.min(...ev.hits.map((h) => this.pos[h.unit].x)) - 40;
        for (let i = 0; i < 60; i++) { const h = ev.hits[i % ev.hits.length], p = this.pos[h.unit]; this.parts.push({ x: left - 40 - Math.random() * 30, y: p.y - 12 + Math.random() * 22, vx: 3 + Math.random() * 1.5, vy: 0, life: 420 + Math.random() * 120, c: ['#3d4f70', '#8fa3b5', '#e8dcc0'][i % 3], s: 2 }); }
        await this.sleep(460);
      } else if (ev.skill === 'volley') {
        se('arrow');
        for (const h of ev.hits) { const p = this.pos[h.unit]; for (let i = 0; i < 12; i++) { const fx = pa.x, fy = pa.y - 16, tx = p.x - 18 + Math.random() * 36, ty = p.y - 4 + Math.random() * 14, life = 300; this.parts.push({ x: fx, y: fy, vx: (tx - fx) / life * 16, vy: (ty - fy) / life * 16, life, c: '#15110d', s: 1 }); } }
        await this.sleep(300);
      } else {
        const d = this.pos[ev.hits[0].unit];
        const dx = (d.x - pa.x) * 0.72, dy = (d.y - pa.y) * 0.72;
        this.flash = 180;
        await this.animate(170, (k) => { pa.ox = dx * k * k; pa.oy = dy * k * k; });
        se('clash');
        pa.ox = dx; pa.oy = dy;
      }
      se('hit');
      for (const h of ev.hits) this.applyHit(h);
      if (pa.ox || pa.oy) { const dx = pa.ox, dy = pa.oy; await this.animate(170, (k) => { pa.ox = dx * (1 - k); pa.oy = dy * (1 - k); }); pa.ox = pa.oy = 0; }
      await this.sleep(240);
    }
  }

  // ---- the panel
  renderSquad() {
    const box = el('battleUi').querySelector('.squad');
    if (!box) return;
    box.innerHTML = '';
    for (const u of this.st.allies) {
      const d = document.createElement('div');
      d.className = 'u' + (u.troops <= 0 ? ' out' : '') + (this.activeKey === u.key ? ' on' : '') + (this.chosen?.has(u.key) ? ' done' : '');
      d.innerHTML = `<div class="n"><span>${u.name}</span><span>${TYPE_NAME[u.type]}</span></div><div class="t">${Math.max(0, u.troops)}</div><div class="bar"><i style="width:${Math.max(0, u.troops) / u.max * 100}%"></i></div>`;
      box.appendChild(d);
    }
    const ce = el('battleUi').querySelector('.ce');
    if (ce) ce.textContent = `計 ${this.st.ce} / ${this.st.ceMax}`;
  }
  shell() {
    const ui = el('battleUi');
    ui.hidden = false;
    ui.innerHTML = '<div class="bstat"><span class="ce"></span><span class="tip"></span></div><div class="squad"></div><div class="bcard"></div>';
    this.renderSquad();
    this.tip();
  }
  tip() { const t = el('battleUi').querySelector('.tip'); if (t) t.textContent = TERRAIN[this.st.terrain].note; }
  card(head, buttons, opts = {}) {
    const c = el('battleUi').querySelector('.bcard');
    c.innerHTML = '';
    if (head) {
      const h = document.createElement('div'); h.className = 'bhead';
      h.innerHTML = (head.face ? `<img src="assets/${head.face}.png?v=1" draggable="false" alt="">` : '') + `<div class="tx">${head.html}</div>`;
      c.appendChild(h);
    }
    const g = document.createElement('div'); g.className = 'bgrid' + (opts.two ? ' two' : '');
    buttons.forEach((b) => g.appendChild(b));
    c.appendChild(g);
  }
  logCard(text = '') { el('battleUi').querySelector('.bcard').innerHTML = `<div class="blog">${text}</div>`; }

  // resolves with a command, or 'auto' / 'back'
  chooseFor(u, canBack) {
    return new Promise((res) => {
      const st = this.st, g = GENERALS[u.id];
      const main = () => {
        this.targetKeys = null;
        const head = { face: u.id, html: `<b>${u.name}</b>　${TYPE_NAME[u.type]}兵・剋${TYPE_NAME[BEATS[u.type]]}<br>兵力 ${u.troops} / ${u.max}` };
        const bs = [
          button('攻擊', 'red', () => pickFoe((t) => res({ unit: u, kind: 'attack', target: t }))),
          button('計略', 'bronze', skills),
          button('防禦', '', () => res({ unit: u, kind: 'defend' }), '傷害減半'),
          button('道具', '', items),
          button(this.G.s.autoOn ? '自動中' : '全軍自動', '', () => res('auto')),
          canBack ? button('上一位', '', () => res('back')) : button('換陣形', '', forms),
        ];
        const plead = u.id === 'sunce' && alive(st.foes).find((f) => persuadable(st, f));
        if (plead) bs.unshift(button('勸降', 'red', () => res({ unit: u, kind: 'persuade', target: plead }), `${Math.round(persuadeChance(st, u, plead) * 100)}%`));
        this.card(head, bs);
      };
      const back = () => button('返回', '', main);
      const pickFoe = (done) => {
        const foes = alive(st.foes);
        if (foes.length === 1) { done(foes[0]); return; }
        this.targetKeys = foes.map((f) => f.key);
        this.pickUnit = (k) => { const t = foes.find((f) => f.key === k); if (t) { this.pickUnit = null; this.targetKeys = null; done(t); } };
        this.card({ html: '選擇目標（也可以直接點畫面）' }, [...foes.map((f) => button(f.name, BEATS[u.type] === f.type ? 'red' : '', () => { this.pickUnit = null; this.targetKeys = null; done(f); }, `${TYPE_NAME[f.type]}・${f.troops}${BEATS[u.type] === f.type ? '・克制' : ''}`)), back()], { two: true });
      };
      const pickAlly = (done) => {
        const list = alive(st.allies);
        this.targetKeys = list.map((f) => f.key);
        this.pickUnit = (k) => { const t = list.find((f) => f.key === k); if (t) { this.pickUnit = null; this.targetKeys = null; done(t); } };
        this.card({ html: '選擇我方一隊' }, [...list.map((f) => button(f.name, '', () => { this.pickUnit = null; this.targetKeys = null; done(f); }, `${f.troops} / ${f.max}`)), back()], { two: true });
      };
      const skills = () => {
        const bs = (g.skills || []).map((id) => {
          const sk = SKILLS[id], ok = st.ce >= sk.cost;
          return button(sk.name, ok ? 'bronze' : 'dim', ok ? () => {
            if (sk.kind === 'one' || sk.kind === 'self') pickFoe((t) => res({ unit: u, kind: 'skill', skill: id, target: t }));
            else if (sk.kind === 'ally') pickAlly((t) => res({ unit: u, kind: 'skill', skill: id, target: t }));
            else res({ unit: u, kind: 'skill', skill: id });
          } : null, `計 ${sk.cost}　${sk.desc}`);
        });
        this.card(null, [...bs, back()], { two: true });
      };
      const items = () => {
        const p = st.party;
        const bs = Object.entries(ITEMS).map(([id, it]) => {
          const n = p.items[id] || 0;
          return button(`${it.name} ×${n}`, n ? '' : 'dim', n ? () => {
            if (it.kind === 'heal') pickAlly((t) => res({ unit: u, kind: 'item', item: id, target: t }));
            else res({ unit: u, kind: 'item', item: id });
          } : null, it.desc);
        });
        this.card(null, [...bs, back()], { two: true });
      };
      const forms = () => {
        const bs = Object.entries(FORMATIONS).map(([id, f]) => button(f.name + (st.formation === id ? '（現在）' : ''), st.formation === id ? 'red' : '', () => { st.formation = id; st.party.formation = id; main(); }, f.desc));
        this.card(null, [...bs, back()], { two: true });
      };
      main();
    });
  }
  async playerTurn() {
    const st = this.st, list = alive(st.allies), cmds = [];
    this.chosen = new Set();
    for (let i = 0; i < list.length;) {
      const u = list[i];
      this.activeKey = u.key; this.renderSquad();
      const r = this.G.s.autoOn ? 'auto' : await this.chooseFor(u, i > 0);
      if (r === 'back') { i--; cmds.pop(); this.chosen.delete(list[i].key); continue; }
      if (r === 'auto') {
        this.G.s.autoOn = true;
        for (let j = i; j < list.length; j++) cmds.push(autoCommand(st, list[j], Math.random));
        break;
      }
      cmds.push(r); this.chosen.add(u.key); i++;
    }
    this.activeKey = null; this.chosen = null;
    return cmds;
  }
  async run() {
    this.logCard('');
    while (!this.st.over) {
      const cmds = await this.playerTurn();
      this.logCard('');
      const stop = this.G.s.autoOn ? button('停止自動', '', () => { this.G.s.autoOn = false; stop.remove(); }) : null;
      if (stop) el('battleUi').querySelector('.bcard').appendChild(stop);
      this.speed = this.G.s.autoOn ? 1.7 : 1.15;
      this.pending = new Set(alive([...this.st.foes, ...this.st.allies]).map((u) => u.key));
      const snap = this.snapshot();
      const events = resolveTurn(this.st, cmds);
      // show the troops as they were, then let every hit bring them down
      this.restore(snap);
      for (const ev of events) {
        this.applyTroops(ev);
        await this.playEvent(ev);
        const left = el('battleUi').querySelector('.blog'); if (!left) this.logCard('');
      }
      this.restore(null);
      this.renderSquad();
    }
  }
  snapshot() { return { final: null, before: [...this.st.foes, ...this.st.allies].map((u) => [u, u.troops]) }; }
  restore(snap) {
    if (snap) {
      this.finalTroops = [...this.st.foes, ...this.st.allies].map((u) => [u, u.troops]);
      for (const [u, v] of snap.before) u.troops = v;
    } else if (this.finalTroops) { for (const [u, v] of this.finalTroops) u.troops = v; this.finalTroops = null; }
  }
  applyTroops(ev) {
    for (const h of ev.hits || []) this.byKey[h.unit].troops = h.after;
    for (const h of ev.heals || []) { const u = this.byKey[h.unit]; u.troops = Math.min(u.max, u.troops + h.amount); }
  }
  tap(x, y) {
    if (!this.pickUnit || !this.pos) return;
    let best = null, bd = 30;
    for (const k of this.targetKeys || []) { const p = this.pos[k], d = Math.hypot(p.x - x, p.y - 12 - y); if (d < bd) { bd = d; best = k; } }
    if (best) { se('tap'); this.pickUnit(best); }
  }
}

export async function runBattle(G, { foes, terrain, music = 'battle', scripted }) {
  const b = new BattleScene(G);
  G.battle = b; G.scene = 'battle';
  el('hud').hidden = true;
  const st = createBattle(G.s.party, foes, terrain);
  b.st = st;
  b.byKey = Object.fromEntries([...st.allies, ...st.foes].map((u) => [u.key, u]));
  b.shown = Object.fromEntries([...st.allies, ...st.foes].map((u) => [u.key, b.shownOf(u)]));
  // positions exist from the start: on a throttled tab the first frame can come after the first event
  b.bfH = Math.floor(view().height * 0.53);
  b.layout(view().width);
  G.s.autoOn = false;
  play(music);
  se('alarm');
  b.shell();
  b.logCard(`${TERRAIN[terrain].name}之戰！ ${TERRAIN[terrain].note}`);
  await wait(window.__fastText ? 50 : 500);
  if (scripted) await scripted(b);
  await b.run();
  const res = finishBattle(st);
  const won = st.over === 'win' || st.over === 'persuaded';
  if (won) {
    se('win');
    let html = st.over === 'persuaded' ? '勸降成功！' : '勝利！';
    html += `<br>經驗 +${res.exp}　錢 +${res.gold}`;
    if (res.ups.length) { html += '<br>' + res.ups.map((id) => GENERALS[id].name).join('、') + ' 升級了！兵力上限提高。'; setTimeout(() => se('level'), 500); }
    b.logCard(html);
    await tapToGo(b);
  } else {
    se('lose');
    b.logCard('全軍潰散……退回最後的營地重整，經驗和錢都保留。');
    await tapToGo(b);
  }
  el('battleUi').hidden = true;
  el('stage').querySelector('.tags')?.remove();
  G.scene = 'field'; G.battle = null;
  el('hud').hidden = false;
  return st.over;
}
function tapToGo(b) {
  return new Promise((res) => {
    const g = button('繼續', 'red', res);
    el('battleUi').querySelector('.bcard').appendChild(g);
  });
}

// 單挑: guess the other side's move. 猛攻 beats 虛招 beats 格擋 beats 猛攻.
const MOVES = { strike: { name: '猛攻', beats: 'feint', tell: '太史慈壓低身子，雙臂蓄滿了力。' }, guard: { name: '格擋', beats: 'strike', tell: '太史慈收回手戟，兩腳踩穩。' }, feint: { name: '虛招', beats: 'guard', tell: '太史慈腳步飄忽，眼神一直游移。' } };
export class DuelScene {
  constructor(G) { this.G = G; this.t = 0; this.a = { ox: 0 }; this.b = { ox: 0 }; this.anims = []; this.parts = []; this.flash = 0; this.pops = []; }
  animate(ms, fn) { return new Promise((res) => { this.anims.push({ t: 0, ms, fn, res }); }); }
  update(dt) {
    this.t += dt;
    for (const a of [...this.anims]) { a.t += dt; const k = Math.min(1, a.t / a.ms); a.fn(k); if (k >= 1) { this.anims.splice(this.anims.indexOf(a), 1); a.res(); } }
    for (const p of this.parts) { p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.vy += 0.1 * dt / 16; p.life -= dt; }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const p of this.pops) { p.y -= dt * 0.02; p.life -= dt; }
    this.pops = this.pops.filter((p) => p.life > 0);
    if (this.flash > 0) this.flash -= dt;
  }
  draw(c, W, H) {
    const bfH = Math.floor(H * 0.53);
    this.W = W; this.bfH = bfH;
    c.fillStyle = '#15110d'; c.fillRect(0, 0, W, H);
    const bg = img.bg_forest;
    if (bg) { const k = Math.max(W / bg.width, bfH / bg.height), w = bg.width * k, h = bg.height * k; c.drawImage(bg, (W - w) / 2, bfH - h, w, h); }
    const y = bfH * 0.92;
    drawActor(c, 'taishici', 'right', this.b.ox ? 1 : 0, W * 0.28 + this.b.ox, y, 2);
    drawActor(c, 'sunce', 'left', this.a.ox ? 1 : 0, W * 0.72 + this.a.ox, y, 2);
    for (const p of this.parts) { c.fillStyle = p.c; c.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }
    c.font = '11px Cubic11, sans-serif'; c.textAlign = 'center';
    for (const p of this.pops) { c.fillStyle = '#15110d'; c.fillText(p.text, p.x + 1, p.y + 1); c.fillStyle = p.c; c.fillText(p.text, p.x, p.y); }
    if (this.flash > 0) { c.fillStyle = `rgba(232,220,192,${Math.min(0.7, this.flash / 200)})`; c.fillRect(0, 0, W, bfH); }
  }
  clashAt(x, y) { for (let i = 0; i < 18; i++) this.parts.push({ x, y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.8) * 3, life: 260 + Math.random() * 260, c: ['#e8dcc0', '#d9a441', '#b5301f'][i % 3], s: 1 + (i % 3 === 0 ? 1 : 0) }); }
}
export async function runDuel(G) {
  const d = new DuelScene(G);
  G.duel = d; G.scene = 'duel';
  el('hud').hidden = true;
  play('duel');
  const ui = el('battleUi');
  ui.hidden = false;
  let me = DUEL.hp, foe = DUEL.hp;
  const pips = (n) => Array.from({ length: DUEL.hp }, (_, i) => `<i class="${i < n ? '' : 'off'}"></i>`).join('');
  const keys = Object.keys(MOVES);
  for (let round = 1; round <= DUEL.rounds && me > 0 && foe > 0; round++) {
    const his = keys[Math.floor(Math.random() * 3)];
    const tell = Math.random() < DUEL.tellChance ? his : keys[Math.floor(Math.random() * 3)];
    const mine = await new Promise((res) => {
      ui.innerHTML = `<div class="duelFaces"><div><img src="assets/taishici.png?v=1" alt="" draggable="false"><div>太史慈<div class="pips">${pips(foe)}</div></div></div><div><img src="assets/sunce.png?v=1" alt="" draggable="false"><div>孫策<div class="pips">${pips(me)}</div></div></div></div>
        <div class="duelTell">第 ${round} 回合：${MOVES[tell].tell}</div><div class="duelHelp">猛攻破虛招　虛招破格擋　格擋破猛攻（對方的動作可能是假的）</div><div class="bgrid"></div>`;
      const g = ui.querySelector('.bgrid');
      for (const k of keys) g.appendChild(button(MOVES[k].name, k === 'strike' ? 'red' : k === 'guard' ? '' : 'bronze', () => res(k)));
    });
    ui.querySelector('.bgrid').innerHTML = '';
    const W = d.W, y = d.bfH * 0.92 - 30;
    await d.animate(170, (k) => { d.a.ox = -W * 0.2 * k * k; d.b.ox = W * 0.2 * k * k; });
    d.clashAt(W / 2, y); d.flash = 150; se('clash');
    let text;
    if (mine === his) text = `兩邊都用了${MOVES[mine].name}，兵刃相撞，誰也沒佔便宜。`;
    else if (MOVES[mine].beats === his) { foe--; se('hit'); d.pops.push({ x: W * 0.28, y, text: '命中', c: '#ffe08a', life: 700 }); text = `你的${MOVES[mine].name}破了他的${MOVES[his].name}！`; }
    else { me--; se('hit'); d.pops.push({ x: W * 0.72, y, text: '受創', c: '#ffb39a', life: 700 }); text = `他的${MOVES[his].name}破了你的${MOVES[mine].name}！`; }
    ui.querySelector('.duelTell').textContent = text;
    await d.animate(200, (k) => { d.a.ox = -W * 0.2 * (1 - k); d.b.ox = W * 0.2 * (1 - k); });
    d.a.ox = d.b.ox = 0;
    await wait(window.__fastText ? 50 : 750);
  }
  const won = me >= foe;
  ui.hidden = true;
  return { won, me, foe, close() { G.scene = 'field'; G.duel = null; el('hud').hidden = false; } };
}
