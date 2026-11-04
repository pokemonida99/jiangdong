// A player that plays the whole demo through the real page and taps real buttons. In the browser console:
//   const b = await import('/tools/bot_page.js'); await b.play({ speed: 6 })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fire = (node) => { const r = node.getBoundingClientRect(), o = { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }; node.dispatchEvent(new PointerEvent('pointerdown', o)); node.dispatchEvent(new PointerEvent('pointerup', o)); };
const visible = (id) => !document.getElementById(id).hidden;
const findBtn = (root, text) => [...root.querySelectorAll('button')].find((b) => b.textContent.startsWith(text));

export async function play({ speed = 6, limit = 240000, formation = null } = {}) {
  window.__fastText = true; window.__testSpeed = speed;
  const errors = [], log = [];
  const oe = console.error; console.error = (...a) => { errors.push(a.map(String).join(' ').slice(0, 200)); oe(...a); };
  addEventListener('error', (e) => errors.push(e.message));
  const G = window.__g, st0 = performance.now(), stage = document.getElementById('stage');
  let battles = 0, lastScene = null, duelDone = false, lastTap = 0, shop = 0;
  while (performance.now() - st0 < limit) {
    await sleep(40);
    if (visible('title')) { const b = findBtn(document.getElementById('title'), '新的開始'); if (G.s?.flags?.clear) { log.push('回到標題'); break; } fire(b); await sleep(200); continue; }
    if (G.scene !== lastScene) { lastScene = G.scene; if (G.scene === 'battle') battles++; }
    if (visible('choices')) { fire2(document.querySelector('#choices button')); continue; }
    if (visible('menu')) { const b = findBtn(document.getElementById('menu'), '離開'); if (b) { shop++; fire(b); } continue; }
    if (visible('dialog')) { stage.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); continue; }
    const ui = document.getElementById('battleUi');
    if (G.scene === 'battle') {
      const go = findBtn(ui, '繼續');
      if (go) { const b = G.battle.st; log.push(`第${battles}場 ${b.terrain} ${b.foes.map((f) => f.name).join('/')}：${b.over}，${b.turn} 回合，孫策 Lv${G.s.party.members[0].lv}，剩 ${Math.round(b.allies.reduce((a, u) => a + Math.max(u.troops, 0) / u.max, 0) / b.allies.length * 100)}%`); fire(go); await sleep(120); continue; }
      const auto = findBtn(ui, '全軍自動'); if (auto) fire(auto);
      continue;
    }
    if (G.scene === 'duel') { const bs = [...ui.querySelectorAll('.bgrid button')]; if (bs.length) fire(bs[Math.floor(Math.random() * 3)]); duelDone = true; continue; }
    if (G.scene !== 'field' || G.busy || G.field.path.length || G.field.moving) continue;
    const f = G.field;
    if (!f.cam) continue;
    const tapTile = (x, y) => f.tap((x + 0.5) * 16 - f.cam.x, (y + 0.5) * 16 - f.cam.y);
    if (f.map === 'camp') {
      if (!G.s.flags.zhouyu) tapTile(8, 5); else tapTile(7, 23);
    } else {
      const next = f.npcs.filter((n) => n.auto).sort((a, b) => a.y - b.y)[0];
      if (next) tapTile(next.x, next.y);
    }
    await sleep(100);
  }
  window.__testSpeed = 1;
  return { ms: Math.round(performance.now() - st0), battles, clear: !!G.s?.flags?.clear, flags: Object.keys(G.s?.flags || {}), log, errors, steps: G.s?.steps };
}
function fire2(node) { node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }
