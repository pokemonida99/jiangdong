// The demo's fights in order, played by the same auto logic as the 自動 button.
// The demo should be winnable on 自動 with a bit of rest, without grinding. Run: node tools/sim.js [runs]
import { FIGHTS, GENERALS, START_PARTY, ITEMS } from '../js/data.js';
import { createBattle, resolveTurn, finishBattle, alive, autoCommand, newMember, restAll, statsOf, ceMax } from '../js/battle_core.js';

const ORDER = [['landing'], ['boss1'], ['rest'], ['road1'], ['road2'], ['road3'], ['rest'], ['road4'], ['road5'], ['rest'], ['final']];
const runs = +process.argv[2] || 400;

function newParty() {
  const p = { members: [...START_PARTY, 'zhouyu'].map((id) => newMember(id)), gold: 120, ce: 0, formation: 'heyi', items: { grain: 3, wine: 1 }, upgrades: {} };
  p.ce = ceMax(p);
  return p;
}
function fight(p, key) {
  const f = FIGHTS[key], st = createBattle(p, f.foes, f.terrain);
  while (!st.over && st.turn < 60) {
    const cmds = alive(st.allies).map((u) => autoCommand(st, u, Math.random));
    resolveTurn(st, cmds);
  }
  const hurt = st.allies.reduce((s, a) => s + a.troops / a.max, 0) / st.allies.length;
  const r = { over: st.over || 'timeout', turns: st.turn, left: hurt };
  finishBattle(st);
  return r;
}
const stats = {};
let clears = 0;
for (let i = 0; i < runs; i++) {
  const p = newParty();
  let ok = true;
  for (const [key] of ORDER) {
    if (key === 'rest') { restAll(p); continue; }
    const r = fight(p, key);
    const s = stats[key] ||= { n: 0, win: 0, turns: 0, left: 0, lv: 0 };
    s.n++; s.turns += r.turns; s.left += r.left; s.lv += p.members[0].lv;
    if (r.over === 'win' || r.over === 'persuaded') s.win++;
    else { ok = false; break; }
  }
  if (ok) clears++;
}
console.log('場次      勝率   回合  剩兵力  孫策等級');
for (const [k, s] of Object.entries(stats)) {
  console.log(k.padEnd(9), String(Math.round(s.win / s.n * 100) + '%').padEnd(6), (s.turns / s.n).toFixed(1).padEnd(5), String(Math.round(s.left / s.n * 100) + '%').padEnd(7), (s.lv / s.n).toFixed(1));
}
console.log(`全程通關（全自動、不練功、不買東西）：${Math.round(clears / runs * 100)}%`);
