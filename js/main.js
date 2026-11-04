// Boot, the save file, the title screen and the frame loop.
import { loadArt, img, ART_V } from './art.js';
import { Field, MAPS } from './field.js';
import { makeStory } from './story/index.js';
import { openMenu } from './menu.js';
import { el, button, onTap } from './ui.js';
import { VERSION, CHAPTERS } from './data.js';
import { newMember, ceMax, statsOf, restAll } from './battle_core.js';
import { unlock, play, se } from './audio.js';
import { placeAt, WORLD } from './world.js';

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

const SAVE = 'duotang-save-1';
const qs = new URLSearchParams(location.search);
const view = el('view'), ctx = view.getContext('2d');
let W = 195, H = 240;
function resize() {
  const r = el('stage').getBoundingClientRect(), panel = el('bottom').getBoundingClientRect().height;
  // two screen pixels to one game pixel: never a blurry or uneven pixel
  W = Math.ceil(r.width / 2); H = Math.ceil((r.height - panel) / 2);
  view.width = W; view.height = H;
  view.style.width = W * 2 + 'px'; view.style.height = H * 2 + 'px';
  ctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize);
resize();

// the page's test player looks at these
window.__places = WORLD.places; window.__maps = MAPS; window.__stats = statsOf;
const G = window.__g = {
  s: null, scene: 'none', busy: false, field: null, battle: null, duel: null,
  newState() {
    const party = { members: [newMember('zhuwen')], reserve: [], gold: 60, ce: 0, formation: 'heyi', items: { grain: 2, wine: 0 }, upgrades: {}, renamed: false };
    party.ce = ceMax(party);
    return { ch: 0, map: 'liuzhuang', x: 7, y: 8, dir: 'up', party, flags: {}, goal: '', goalPlace: null, respawn: { map: 'liuzhuang', x: 7, y: 8 }, steps: 0 };
  },
  save() { try { localStorage.setItem(SAVE, JSON.stringify(G.s)); } catch (e) { /* private mode */ } },
  load() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch (e) { return null; } },
  clearSave() { try { localStorage.removeItem(SAVE); } catch (e) { /* private mode */ } },
  // one thing at a time: walking stops while a story or a battle runs
  async run(fn) {
    if (G.busy) return;
    G.busy = true;
    if (G.field) G.field.keys.clear();
    try { await fn(); } catch (e) { console.error(e); }
    G.busy = false;
    G.field && G.field.refresh();
    G.renderHud();
  },
  renderHud() {
    if (!G.s) return;
    const chap = CHAPTERS[G.s.ch] || {};
    el('goal').innerHTML = `<b>${chap.no || ''}</b>${G.s.goal || ''}`;
    const tag = el('placeTag');
    if (G.field && G.scene === 'field') {
      const here = G.field.map === 'world' ? nearestName(G.field.x, G.field.y) : MAPS[G.field.map].name;
      tag.textContent = here; tag.hidden = !here;
    } else tag.hidden = true;
  },
  async start(state, intro) {
    G.s = state;
    G.story = makeStory(G);
    G.field = new Field(G);
    G.field.enter(state.map, state.x, state.y, state.dir);
    G.scene = 'field';
    el('title').hidden = true;
    el('pad').hidden = false;
    G.renderHud();
    play(MAPS[state.map].music || 'world');
    if (intro) await G.run(intro);
  },
  async toTitle() {
    G.scene = 'none';
    el('pad').hidden = true; el('placeTag').hidden = true;
    el('battleUi').hidden = true;
    showTitle();
  },
};
function nearestName(x, y) {
  const here = placeAt(x, y);
  if (here) return here.name;
  let best = null, bd = 9;
  for (const p of Object.values(WORLD.places)) { const d = Math.abs(p.x - x) + Math.abs(p.y - y); if (d < bd) { bd = d; best = p; } }
  return best ? best.name + '附近' : '';
}
function showTitle() {
  const t = el('title');
  t.hidden = false;
  t.style.backgroundImage = img.title2 ? `url(assets/title2.png?v=${ART_V})` : '';
  t.innerHTML = '';
  if (img.logo2) { const l = document.createElement('img'); l.className = 'logo'; l.src = `assets/logo2.png?v=${ART_V}`; l.alt = '奪唐'; l.draggable = false; t.appendChild(l); }
  else { const l = document.createElement('div'); l.className = 'logoText'; l.textContent = '奪唐'; t.appendChild(l); }
  const sub = document.createElement('div'); sub.className = 'sub'; sub.textContent = '朱全忠傳'; t.appendChild(sub);
  const btns = document.createElement('div'); btns.className = 'btns';
  const saved = G.load();
  if (saved) btns.appendChild(button('繼續遊戲', 'red', () => G.start(saved), `${CHAPTERS[saved.ch].no} ${CHAPTERS[saved.ch].name}・Lv ${saved.party.members[0].lv}`));
  btns.appendChild(button('新的開始', saved ? '' : 'red', () => { G.clearSave(); const s = G.newState(); G.start(s, () => G.story.begin()); }));
  t.appendChild(btns);
  const ver = document.createElement('div'); ver.className = 'ver'; ver.textContent = 'v' + VERSION; t.appendChild(ver);
  play('title');
}

// the frame loop keeps running when a preview tab is hidden, or the tests would stall
let lastT = performance.now();
function step(now) {
  const dt = Math.min(60, now - lastT); lastT = now;
  if (G.scene === 'field' && G.field) { G.field.update(dt * (window.__testSpeed || 1)); G.field.draw(ctx, W, H); }
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
addEventListener('keydown', (e) => {
  if (!G.field) return;
  if (e.key.startsWith('Arrow')) { G.field.keys.add(e.key); e.preventDefault(); }
  if ((e.key === 'z' || e.key === 'Enter') && G.scene === 'field' && !G.busy) G.field.action();
  if ((e.key === 'x' || e.key === 'Escape') && G.scene === 'field' && !G.busy) { se('tap'); openMenu(G); }
});
addEventListener('keyup', (e) => { if (G.field) G.field.keys.delete(e.key); });
// the pad: hold a direction to keep walking
for (const b of document.querySelectorAll('#dpad button')) {
  const k = b.dataset.key;
  const on = (e) => { e.preventDefault(); if (G.field && !G.busy) { G.field.path = []; G.field.pending = null; G.field.keys.clear(); G.field.keys.add(k); } b.classList.add('on'); };
  const off = (e) => { e.preventDefault(); if (G.field) G.field.keys.delete(k); b.classList.remove('on'); };
  b.addEventListener('pointerdown', on);
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(t, off);
}
onTap(el('btnA'), () => { if (G.scene === 'field' && G.field) G.field.action(); });
onTap(el('btnB'), () => { if (!G.busy && G.scene === 'field') { se('tap'); openMenu(G); } });
onTap(el('btnMap'), () => { if (!G.busy && G.scene === 'field') { se('tap'); openMenu(G, 'map'); } });
onTap(el('btnCh'), () => { if (!G.busy && G.scene === 'field') { se('tap'); openMenu(G, 'ch'); } });
// iOS needs a touch before any sound
for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, unlock);

function devStart(k) {
  // ?dev=2  jump to the start of a chapter with the levels a normal run has there; ?dev=boss jumps to the last chapter's night
  const LV = { 0: 1, 1: 3, 2: 8, 3: 11 };
  const n = k === 'night' ? 3 : +k;
  const s = G.newState();
  s.ch = n;
  const lv = LV[n] || 1;
  const team = n >= 3 ? ['zhuwen', 'pangshigu', 'zhuzhen', 'xietong'] : n === 2 ? ['zhuwen', 'pangshigu', 'zhuzhen'] : n === 1 ? ['zhuwen', 'zhucun'] : ['zhuwen'];
  s.party.members = team.map((id) => newMember(id, lv));
  s.party.gold = 200 + 200 * n; s.party.ce = ceMax(s.party);
  s.party.items.grain = 4; s.party.renamed = n >= 3;
  if (n >= 1) s.party.upgrades.spear = true;
  if (n >= 2) s.party.upgrades.armor = true;
  restAll(s.party);
  if (k === 'night') s.flags.bianBanquet = true;
  G.start(s, () => G.story.begin(k === 'night' ? 'night' : null));
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
    resize();
    if (dev) devStart(dev); else showTitle();
  });
})();
