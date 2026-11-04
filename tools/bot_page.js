// A player that plays the whole story through the real page and taps real buttons. In the browser console:
//   const b = await import('/tools/bot_page.js'); await b.play({ speed: 8 })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fire = (node) => { const r = node.getBoundingClientRect(), o = { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }; node.dispatchEvent(new PointerEvent('pointerdown', o)); node.dispatchEvent(new PointerEvent('pointerup', o)); };
const visible = (id) => !document.getElementById(id).hidden;
const findBtn = (root, text) => [...root.querySelectorAll('button')].find((b) => b.textContent.startsWith(text));

// the talks the story needs before it moves on, by map
const NEEDED = {
  liuzhuang: (f) => (!f.cunJoin ? 'zhucun' : null),
  dangshan: (f) => (!f.zhangMet ? 'zhanghui' : null),
  camp: (f) => (!f.marchSouth ? 'huangchao' : null),
  tongzhou: (f) => (f.tzReunion && !f.yanPlan ? 'xietong' : null),
};

function bfs(F, goals) {
  const key = (x, y) => x + ',' + y, seen = new Map([[key(F.x, F.y), null]]), q = [[F.x, F.y]];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    if (goals.some((g) => g[0] === x && g[1] === y)) {
      const out = [];
      for (let at = [x, y]; at && !(at[0] === F.x && at[1] === F.y); at = seen.get(key(at[0], at[1]))) out.unshift(at);
      return out;
    }
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (seen.has(k) || F.blocked(nx, ny)) continue;
      seen.set(k, [x, y]); q.push([nx, ny]);
    }
  }
  return null;
}
const beside = (n) => [[n.x, n.y + 1], [n.x, n.y - 1], [n.x - 1, n.y], [n.x + 1, n.y]];

function goBeside(F, n) {
  if (beside(n).some((g) => g[0] === F.x && g[1] === F.y)) { F.dir = n.y > F.y ? 'down' : n.y < F.y ? 'up' : n.x < F.x ? 'left' : 'right'; F.action(); return true; }
  const p = bfs(F, beside(n));
  if (p && p.length) { F.path = p; return true; }
  return false;
}

export async function play({ speed = 8, limit = 480000, lowHp = 0.55, stopAt = null } = {}) {
  window.__fastText = true; window.__testSpeed = speed;
  const errors = [], log = [];
  const oe = console.error; console.error = (...a) => { errors.push(a.map(String).join(' ').slice(0, 300)); oe(...a); };
  addEventListener('error', (e) => errors.push(e.message));
  const G = window.__g, t0 = performance.now(), stage = document.getElementById('stage');
  let battles = 0, losses = 0, lastScene = null, stuck = 0, lastPos = '';
  while (performance.now() - t0 < limit) {
    await sleep(25);
    if (visible('boot')) { const g = document.getElementById('bootGo'); if (!g.hidden) fire(g); continue; }
    if (visible('title')) { const b = findBtn(document.getElementById('title'), '繼續') || findBtn(document.getElementById('title'), '新的開始'); fire(b); await sleep(150); continue; }
    if (visible('card')) { document.getElementById('card').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await sleep(40); continue; }
    if (G.scene !== lastScene) { lastScene = G.scene; if (G.scene === 'battle') battles++; }
    if (visible('choices')) { document.querySelector('#choices button').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); continue; }
    if (visible('menu')) { const m = document.getElementById('menu'); const b = findBtn(m, '離開') || findBtn(m, '關閉'); if (b) fire(b); continue; }
    if (visible('dialog')) { stage.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); continue; }
    const ui = document.getElementById('battleUi');
    if (G.scene === 'battle') {
      const go = findBtn(ui, '繼續');
      if (go) {
        const b = G.battle.st;
        if (b.over === 'lose') losses++;
        log.push(`第${battles}場 ch${G.s.ch} ${b.terrain} ${b.foes.map((f) => f.name).join('/')}：${b.over} ${b.turn}回 Lv${G.s.party.members[0].lv} 剩${Math.round(b.allies.reduce((a, u) => a + Math.max(u.troops, 0) / u.max, 0) / b.allies.length * 100)}%`);
        fire(go); await sleep(60); continue;
      }
      const auto = findBtn(ui, '全軍自動'); if (auto) fire(auto);
      continue;
    }
    if (G.scene === 'duel') { const bs = [...ui.querySelectorAll('.bgrid button')]; if (bs.length) fire(bs[Math.floor(Math.random() * 3)]); continue; }
    if (G.scene !== 'field' || G.busy || G.field.path.length || G.field.moving) continue;
    const F = G.field, f = G.s.flags;
    if (f.chapter3Clear) { log.push('第三章結束'); break; }
    if (stopAt && stopAt(G)) { log.push('stopAt'); break; }
    const pos = `${F.map}:${F.x},${F.y}`;
    if (pos === lastPos) { if (++stuck > 400) { errors.push(`卡住了 ${pos} 目標：${G.s.goal}`); break; } } else { stuck = 0; lastPos = pos; }
    if (F.map === 'world') {
      const id = G.s.goalPlace, p = id && window.__places[id];
      if (!p) { errors.push('大地圖上沒有目標：' + G.s.goal); break; }
      if (p.x === F.x && p.y === F.y) { F.action(); await sleep(60); continue; }
      const route = bfs(F, [[p.x, p.y]]);
      if (!route) { errors.push('走不到 ' + p.name); break; }
      F.path = route;
      continue;
    }
    // a fortress or a town: what must be talked to, then whoever stands in the way, then the gates, then out
    const hurt = G.s.party.members.reduce((a, m) => a + m.troops / window.__stats(m, G.s.party).max, 0) / G.s.party.members.length;
    const fireNpc = F.npcs.find((n) => !n.key && F.tile(n.x, n.y) === 'F');
    if (hurt < lowHp && fireNpc && bfs(F, beside(fireNpc)) && goBeside(F, fireNpc)) { await sleep(60); continue; }
    const need = NEEDED[F.map]?.(f);
    const target = need && F.npcs.find((n) => n.key === need);
    if (target && goBeside(F, target)) { await sleep(60); continue; }
    const auto = F.npcs.filter((n) => n.auto).find((n) => bfs(F, beside(n)));
    if (auto && goBeside(F, auto)) { await sleep(60); continue; }
    const lever = F.npcs.find((n) => !n.key && F.tile(n.x, n.y) === 'l' && !isPulled(F, n));
    if (lever && goBeside(F, lever)) { await sleep(60); continue; }
    if (F.map === 'tongzhou' && f.tzDone && !f.tzReunion) { F.path = bfs(F, [[9, 5]]) || []; continue; }
    const exits = window.__maps[F.map].exits || [];
    const out = bfs(F, exits);
    if (out && out.length) { F.path = out; continue; }
  }
  window.__testSpeed = 1;
  return { ms: Math.round(performance.now() - t0), battles, losses, chapter: G.s?.ch, lv: G.s?.party.members.map((m) => `${m.id} ${m.lv}`), gold: G.s?.party.gold, steps: G.s?.steps, flags: Object.keys(G.s?.flags || {}).length, log, errors };
}
function isPulled(F, n) {
  const m = window.__maps[F.map], l = (m.levers || []).find((v) => v.x === n.x && v.y === n.y);
  return l && window.__g.s.flags[l.id];
}
