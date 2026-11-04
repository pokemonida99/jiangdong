// The story's fixed fights in order, played by the same auto logic as the 全軍自動 button.
// Should be winnable on 自動 with the rests the story offers, without grinding. Run: node tools/sim.js [runs]
import { FIGHTS } from '../js/data.js';
import { createBattle, resolveTurn, finishBattle, alive, autoCommand, newMember, restAll, statsOf, ceMax, isWin } from '../js/battle_core.js';

// a plan is what the story does between fights: join a general, lose one, rest, hand out a gift
const PLAN = [
  'join:zhucun', 'sz1', 'rest', 'sz2', 'sz3', 'szBoss', 'rest',
  'join:pangshigu', 'join:zhuzhen', 'buy:armor', 'gz1', 'leave:zhucun', 'gz2', 'gz3', 'rest', 'gz4', 'rest', 'gzBoss', 'rest',
  'tg1', 'tg2', 'rest', 'tg3', 'rest', 'tgBoss', 'gift:spear', 'rest',
  'tz1', 'tz2', 'rest', 'tz3', 'rest', 'tzBoss', 'rest', 'join:xietong', 'yan', 'gift:armor', 'rest',
  'chen1', 'rest', 'chen2', 'rest', 'wm1', 'wmBoss', 'join:gecongzhou', 'rest', 'sy1', 'sy2', 'rest', 'syBoss',
];
const runs = +process.argv[2] || 400;
function fight(p, key) {
  const f = FIGHTS[key], st = createBattle(p, f.foes, f.terrain);
  while (!st.over && st.turn < 60) resolveTurn(st, alive(st.allies).map((u) => autoCommand(st, u, Math.random)));
  const left = st.allies.reduce((s, a) => s + a.troops / a.max, 0) / st.allies.length;
  const r = { over: st.over || 'timeout', turns: st.turn, left };
  finishBattle(st);
  return r;
}
const stats = {};
let clears = 0;
for (let i = 0; i < runs; i++) {
  const p = { members: [newMember('zhuwen')], reserve: [], gold: 60, ce: 0, formation: 'heyi', items: {}, upgrades: {} };
  p.ce = ceMax(p);
  let ok = true;
  for (const step of PLAN) {
    if (step === 'rest') { restAll(p); continue; }
    const [k, v] = step.split(':');
    if (k === 'join') { const m = newMember(v, p.members[0].lv); m.troops = statsOf(m, p).max; if (p.members.length < 4) p.members.push(m); else p.reserve.push(m); continue; }
    if (k === 'leave') { p.members = p.members.filter((m) => m.id !== v); continue; }
    if (k === 'gift' || k === 'buy') { p.upgrades[v] = true; continue; }
    const r = fight(p, step);
    const s = stats[step] ||= { n: 0, win: 0, turns: 0, left: 0, lv: 0 };
    s.n++; s.turns += r.turns; s.left += r.left; s.lv += p.members[0].lv;
    if (isWin(r.over)) s.win++;
    else { ok = false; break; }
  }
  if (ok) clears++;
}
console.log('場次      勝率   回合  剩兵力  朱溫等級');
for (const [k, s] of Object.entries(stats)) console.log(k.padEnd(9), String(Math.round(s.win / s.n * 100) + '%').padEnd(6), (s.turns / s.n).toFixed(1).padEnd(5), String(Math.round(s.left / s.n * 100) + '%').padEnd(7), (s.lv / s.n).toFixed(1));
console.log(`全程通關（全自動、不練功）：${Math.round(clears / runs * 100)}%`);
