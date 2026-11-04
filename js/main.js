// Boot, the save file, the title screen and the frame loop.
import { loadArt, img } from './art.js';
import { Field } from './field.js';
import { makeStory } from './story.js';
import { openMenu } from './menu.js';
import { el, button, onTap, fade, say } from './ui.js';
import { START_PARTY, VERSION, CHANGELOG } from './data.js';
import { newMember, ceMax, restAll, statsOf } from './battle_core.js';
import { unlock, play, se, stop } from './audio.js';
import { FIELD } from './maps.js';

(function noZoomNoSelect() {
  const prevent = (e) => e.preventDefault();
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((t) => document.addEventListener(t, prevent, { passive: false }));
  document.addEventListener('touchmove', (e) => { if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });
  let last = 0;
  document.addEventListener('touchend', (e) => { const now = Date.now(); if (now - last < 320) e.preventDefault(); last = now; }, { passive: false });
  document.addEventListener('dblclick', prevent, { passive: false });
  ['selectstart', 'dragstart', 'contextmenu'].forEach((t) => document.addEventListener(t, prevent));
  addEventListener('wheel', (e) => { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive: false });
  addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0', '_'].includes(e.key)) e.preventDefault(); });
})();

const SAVE = 'jiangdong-save-1';
const qs = new URLSearchParams(location.search);
const view = el('view'), ctx = view.getContext('2d');
let W = 195, H = 422;
function resize() {
  const r = el('stage').getBoundingClientRect();
  // two screen pixels to one game pixel keeps the tiles at a good finger size
  W = Math.ceil(r.width / 2); H = Math.ceil(r.height / 2);
  view.width = W; view.height = H;
  ctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize);
resize();

const G = window.__g = {
  s: null, scene: 'none', busy: false, field: null, battle: null, duel: null,
  newState() {
    const members = START_PARTY.map((id) => newMember(id));
    const party = { members, gold: 120, ce: 0, formation: 'heyi', items: { grain: 3, wine: 1 }, upgrades: {} };
    party.ce = ceMax(party);
    return { map: 'camp', x: 7, y: 15, dir: 'up', party, flags: {}, goal: '', respawn: { map: 'camp', x: 7, y: 15 }, steps: 0 };
  },
  save() { try { localStorage.setItem(SAVE, JSON.stringify(G.s)); } catch (e) { /* private mode */ } },
  load() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch (e) { return null; } },
  clearSave() { try { localStorage.removeItem(SAVE); } catch (e) { /* private mode */ } },
  // one thing at a time: walking stops while a story or a battle runs
  async run(fn) {
    if (G.busy) return;
    G.busy = true;
    try { await fn(); } catch (e) { console.error(e); }
    G.busy = false;
    G.field && G.field.refresh();
    G.renderHud();
  },
  renderHud() { el('goal').textContent = G.s?.goal || ''; },
  async start(state, intro) {
    G.s = state;
    G.story = makeStory(G);
    G.field = new Field(G);
    G.field.enter(state.map, state.x, state.y, state.dir);
    G.scene = 'field';
    el('title').hidden = true;
    el('hud').hidden = false;
    G.renderHud();
    play('field');
    if (intro) await G.run(intro);
  },
  async toTitle() {
    G.scene = 'none';
    el('hud').hidden = true;
    el('battleUi').hidden = true;
    showTitle();
  },
};
function showTitle() {
  const t = el('title');
  t.hidden = false;
  t.style.backgroundImage = img.title ? 'url(assets/title.png?v=1)' : '';
  t.innerHTML = '';
  if (img.logo) { const l = document.createElement('img'); l.className = 'logo'; l.src = 'assets/logo.png?v=1'; l.alt = '江東烽火'; l.draggable = false; t.appendChild(l); }
  else { const l = document.createElement('div'); l.className = 'logoText'; l.textContent = '江東烽火'; t.appendChild(l); }
  const sub = document.createElement('div'); sub.className = 'sub'; sub.textContent = '試玩版'; t.appendChild(sub);
  const btns = document.createElement('div'); btns.className = 'btns';
  const saved = G.load();
  if (saved) btns.appendChild(button('繼續遊戲', 'red', () => G.start(saved), `${saved.map === 'camp' ? '歷陽軍營' : '江東原野'}・孫策 Lv ${saved.party.members[0].lv}`));
  btns.appendChild(button('新的開始', saved ? '' : 'red', () => { G.clearSave(); const s = G.newState(); G.start(s, () => G.story.opening()); }));
  t.appendChild(btns);
  const ver = document.createElement('div'); ver.className = 'ver'; ver.textContent = 'v' + VERSION; t.appendChild(ver);
  play('title');
}

// the frame loop keeps running when a preview tab is hidden, or the tests would stall
let lastT = performance.now();
function step(now) {
  const dt = Math.min(60, now - lastT); lastT = now;
  if (G.scene === 'field' && G.field) { G.field.update(dt); G.field.draw(ctx, W, H); }
  else if (G.scene === 'battle' && G.battle) { G.battle.update(dt); G.battle.draw(ctx, W, H); }
  else if (G.scene === 'duel' && G.duel) { G.duel.update(dt); G.duel.draw(ctx, W, H); }
}
function frame(now) { try { step(now); } catch (e) { console.error(e); } requestAnimationFrame(frame); }
requestAnimationFrame(frame);
setInterval(() => { const now = performance.now(); if (now - lastT > 150) { try { step(now); } catch (e) { console.error(e); } } }, 33);

view.addEventListener('pointerdown', (e) => {
  const r = view.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
  if (G.scene === 'field' && G.field) G.field.tap(x, y);
  else if (G.scene === 'battle' && G.battle) G.battle.tap(x, y);
});
addEventListener('keydown', (e) => { if (G.field && e.key.startsWith('Arrow')) { G.field.keys.add(e.key); e.preventDefault(); } });
addEventListener('keyup', (e) => { if (G.field) G.field.keys.delete(e.key); });
onTap(el('menuBtn'), () => { if (!G.busy && G.scene === 'field') { se('tap'); openMenu(G); } });
// iOS needs a touch before any sound
for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, unlock);

function devStart(k) {
  // ?dev=field / boss1 / duel / final: jump to a spot with the levels a normal run would have there
  const s = G.newState();
  const lv = { field: 1, boss1: 2, duel: 4, final: 5 }[k] || 1;
  s.party.members = ['sunce', 'chengpu', 'huanggai', 'zhouyu'].map((id) => newMember(id, lv));
  s.party.gold = 500; s.party.ce = ceMax(s.party);
  s.flags.zhouyu = true;
  const f = s.flags, sp = FIELD.spots;
  const pos = (spot, dy = -1) => { s.map = 'field'; s.x = spot.x; s.y = spot.y + dy; s.respawn = { map: 'field', x: FIELD.road[4], y: 4 }; };
  if (k === 'field') pos(sp.landing, -2);
  if (k === 'boss1') { f.landing = 1; pos(sp.boss1, -2); }
  if (k === 'duel') { Object.assign(f, { landing: 1, boss1: 1, road1: 1, road2: 1, road3: 1 }); pos(sp.duel, -2); }
  if (k === 'final') { Object.assign(f, { landing: 1, boss1: 1, road1: 1, road2: 1, road3: 1, duel: 1, road4: 1, road5: 1 }); pos(sp.gate, -2); }
  G.start(s);
}

(async function boot() {
  try { await document.fonts.load('11px Cubic11'); } catch (e) { /* the fallback font is fine */ }
  await loadArt();
  el('boot').querySelector('.bootMsg').hidden = true;
  const go = el('bootGo'); go.hidden = false;
  const dev = qs.get('dev');
  if (dev) window.__fastText = qs.has('fast');
  onTap(go, async () => {
    unlock(); se('tap');
    el('boot').hidden = true;
    if (dev) devStart(dev); else showTitle();
  });
})();
