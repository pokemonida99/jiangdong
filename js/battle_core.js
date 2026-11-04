// The rules of a battle, with no drawing: the page (battle.js) and the bot (tools/sim.js) both play through this.
import { GENERALS, ENEMIES, SKILLS, FORMATIONS, TERRAIN, BEATS, ITEMS, CE_BASE, CE_PER_LEVEL, EXP_BASE, FALLEN_TROOPS } from './data.js';

export function statsOf(m, party) {
  const g = GENERALS[m.id], l = m.lv - 1, up = party.upgrades || {};
  return {
    max: g.troops + g.g.troops * l,
    war: g.war + g.g.war * l + (up.spear ? 6 : 0),
    int: g.int + g.g.int * l,
    lead: g.lead + g.g.lead * l + (up.armor ? 8 : 0),
    spd: g.spd + g.g.spd * l,
  };
}
export const ceMax = (party) => CE_BASE + CE_PER_LEVEL * (party.members[0].lv - 1);
export const needExp = (lv) => EXP_BASE * lv;

export function newMember(id, lv = 1) { const m = { id, lv, exp: 0, troops: 0 }; m.troops = statsOf(m, {}).max; return m; }

export function createBattle(party, foeIds, terrain, opts = {}) {
  const allies = party.members.map((m, i) => {
    const g = GENERALS[m.id], s = statsOf(m, party);
    return { key: 'a' + i, id: m.id, name: g.name, type: g.type, side: 'ally', troops: m.troops, ...s, skills: g.skills, member: m, atkUp: 0, atkTurns: 0, defend: false, stun: 0 };
  });
  const foes = foeIds.map((id, i) => {
    const e = ENEMIES[id];
    return { key: 'f' + i, id, name: e.name, type: e.type, side: 'foe', troops: e.troops, max: e.troops, war: e.war, int: e.int, lead: e.lead, spd: e.spd, skills: e.skills || [],
      general: !!e.general, persuade: !!e.persuade, face: e.face, exp: e.exp, gold: e.gold, atkUp: 0, atkTurns: 0, defend: false, stun: 0, pleaded: 0 };
  });
  return { party, allies, foes, terrain, ce: party.ce, ceMax: ceMax(party), formation: party.formation, turn: 0, over: null, opts };
}

export const alive = (list) => list.filter((u) => u.troops > 0);
const fm = (st, u) => (u.side === 'ally' ? FORMATIONS[st.formation] : { atk: 1, def: 1, spd: 1 });

// fewer soldiers hit softer, but never below about half
export const troopFactor = (u) => 0.45 + 0.55 * Math.sqrt(Math.max(0, u.troops) / u.max);
export const typeMult = (a, d) => (BEATS[a.type] === d.type ? 1.25 : BEATS[d.type] === a.type ? 0.8 : 1);

function physical(st, a, d, rng, power = 1) {
  const T = TERRAIN[st.terrain];
  let v = Math.max(a.war * 0.3, a.war * 1.5 - d.lead * 0.6) * power * troopFactor(a);
  v *= fm(st, a).atk / fm(st, d).def;
  v *= typeMult(a, d) * (T.atk[a.type] || 1) / (T.def[d.type] || 1);
  if (a.atkTurns > 0) v *= a.atkUp;
  if (d.defend) v *= 0.5;
  return Math.max(6, Math.round(v * (0.9 + rng() * 0.2)));
}
function magical(st, a, d, sk, rng) {
  const T = TERRAIN[st.terrain];
  let v = (sk.base + a.int * sk.rate) * (T[sk.el] || 1) * (0.7 + 0.3 * troopFactor(a));
  v /= (1 + d.int / 300);
  if (d.defend) v *= 0.7;
  return Math.max(6, Math.round(v * (0.9 + rng() * 0.2)));
}

export function persuadable(st, u) { return u.persuade && u.troops > 0 && u.troops / u.max <= 0.4; }
export function persuadeChance(st, a, u) {
  return Math.min(0.95, 0.2 + a.lead / 300 + (1 - u.troops / u.max) * 0.35 + u.pleaded * 0.15);
}

// what a unit does when nobody chooses for it: the foes always, the allies on 自動
export function autoCommand(st, u, rng) {
  const mine = u.side === 'ally' ? st.allies : st.foes, theirs = u.side === 'ally' ? st.foes : st.allies;
  const foes = alive(theirs), friends = alive(mine);
  if (!foes.length) return { unit: u, kind: 'defend' };
  const weakest = [...foes].sort((a, b) => a.troops - b.troops)[0];
  if (u.side === 'foe') {
    if (u.skills.includes('drum') && u.atkTurns <= 0 && rng() < 0.5) return { unit: u, kind: 'skill', skill: 'drum' };
    if (u.skills.includes('volley') && rng() < 0.3) return { unit: u, kind: 'skill', skill: 'volley' };
    const pick = rng() < 0.55 ? weakest : foes[Math.floor(rng() * foes.length)];
    return { unit: u, kind: 'attack', target: pick };
  }
  const can = (s) => u.skills.includes(s) && st.ce >= SKILLS[s].cost;
  const plead = foes.find((f) => persuadable(st, f));
  if (plead && u.id === 'sunce') return { unit: u, kind: 'persuade', target: plead };
  const hurt = [...friends].sort((a, b) => a.troops / a.max - b.troops / b.max)[0];
  if (can('regroup') && hurt.troops / hurt.max < 0.5) return { unit: u, kind: 'skill', skill: 'regroup', target: hurt };
  const T = TERRAIN[st.terrain];
  const strongest = [...foes].sort((a, b) => b.troops - a.troops)[0];
  if (u.id === 'zhouyu' && foes.length >= 2) {
    const el = T.water > T.fire ? 'water' : 'fire';
    if (can(el)) return { unit: u, kind: 'skill', skill: el };
  }
  if (can('rally') && strongest.general && st.turn === 1) return { unit: u, kind: 'skill', skill: 'rally' };
  if (can('volley') && foes.length >= 2) return { unit: u, kind: 'skill', skill: 'volley' };
  if (can('charge') && strongest.troops > 300) return { unit: u, kind: 'skill', skill: 'charge', target: strongest };
  if (can('lastStand') && u.troops / u.max < 0.5) return { unit: u, kind: 'skill', skill: 'lastStand', target: strongest };
  const pick = foes.find((f) => BEATS[u.type] === f.type) || weakest;
  return { unit: u, kind: 'attack', target: pick };
}

function hit(st, d, dmg, ev) {
  const before = d.troops;
  d.troops = Math.max(0, d.troops - dmg);
  ev.push({ unit: d.key, dmg, before, after: d.troops, fell: d.troops <= 0 });
}
function retarget(st, u, t) {
  const pool = alive(u.side === 'ally' ? st.foes : st.allies);
  return t && t.troops > 0 ? t : pool[0];
}

// cmds: one per living ally. Returns the list of events to animate; st changes in place.
export function resolveTurn(st, cmds, rng = Math.random) {
  st.turn++;
  const events = [];
  const all = [...cmds];
  for (const f of alive(st.foes)) all.push(autoCommand(st, f, rng));
  for (const c of all) { c.unit.defend = c.kind === 'defend'; c.order = c.unit.spd * fm(st, c.unit).spd * (0.92 + rng() * 0.16); }
  all.sort((a, b) => b.order - a.order);
  for (const c of all) {
    const u = c.unit;
    if (st.over || u.troops <= 0) continue;
    if (c.kind === 'defend') { events.push({ t: 'defend', a: u.key }); continue; }
    if (c.kind === 'attack') {
      const d = retarget(st, u, c.target); if (!d) continue;
      const hits = []; hit(st, d, physical(st, u, d, rng), hits);
      events.push({ t: 'attack', a: u.key, hits, edge: typeMult(u, d) });
    } else if (c.kind === 'skill') {
      const sk = SKILLS[c.skill];
      if (u.side === 'ally') { if (st.ce < sk.cost) { events.push({ t: 'fizzle', a: u.key }); continue; } st.ce -= sk.cost; }
      const foes = alive(u.side === 'ally' ? st.foes : st.allies), mine = alive(u.side === 'ally' ? st.allies : st.foes);
      const ev = { t: 'skill', a: u.key, skill: c.skill, hits: [], heals: [], ups: [] };
      if (sk.kind === 'one' || sk.kind === 'self') {
        const d = retarget(st, u, c.target); if (!d) continue;
        const scale = c.skill === 'lastStand' ? 1 + (1 - u.troops / u.max) : 1;
        hit(st, d, physical(st, u, d, rng, sk.power * scale), ev.hits);
      } else if (sk.kind === 'all') {
        for (const d of foes) hit(st, d, sk.el ? magical(st, u, d, sk, rng) : physical(st, u, d, rng, sk.power), ev.hits);
      } else if (sk.kind === 'ally') {
        const t = c.target && c.target.troops > 0 ? c.target : u;
        const v = Math.round(u.int * sk.heal + 60 * troopFactor(u));
        const before = t.troops; t.troops = Math.min(t.max, t.troops + v);
        ev.heals.push({ unit: t.key, amount: t.troops - before });
      } else if (sk.kind === 'allies') {
        for (const m of mine) { m.atkUp = sk.up; m.atkTurns = sk.turns; ev.ups.push(m.key); }
      }
      events.push(ev);
    } else if (c.kind === 'item') {
      const it = ITEMS[c.item];
      if (!st.party.items[c.item]) { events.push({ t: 'fizzle', a: u.key }); continue; }
      st.party.items[c.item]--;
      if (it.kind === 'heal') {
        const t = c.target && c.target.troops > 0 ? c.target : u;
        const before = t.troops; t.troops = Math.min(t.max, t.troops + it.amount);
        events.push({ t: 'item', a: u.key, item: c.item, heals: [{ unit: t.key, amount: t.troops - before }] });
      } else {
        const before = st.ce; st.ce = Math.min(st.ceMax, st.ce + it.amount);
        events.push({ t: 'item', a: u.key, item: c.item, ce: st.ce - before, heals: [] });
      }
    } else if (c.kind === 'persuade') {
      const d = c.target;
      if (!d || d.troops <= 0) continue;
      const ok = rng() < persuadeChance(st, u, d);
      d.pleaded++;
      events.push({ t: 'persuade', a: u.key, d: d.key, ok });
      if (ok) { st.over = 'persuaded'; break; }
    }
    if (!alive(st.foes).length) st.over = 'win';
    else if (!alive(st.allies).length) st.over = 'lose';
  }
  for (const u of [...st.allies, ...st.foes]) { if (u.atkTurns > 0) u.atkTurns--; u.defend = false; }
  return events;
}

// after a battle: troops go back on the members; a win pays out and may level people up
export function finishBattle(st) {
  const p = st.party;
  p.ce = st.ce;
  const res = { exp: 0, gold: 0, ups: [] };
  const won = st.over === 'win' || st.over === 'persuaded';
  for (const a of st.allies) a.member.troops = a.troops;
  if (!won) return res;
  for (const f of st.foes) { res.exp += f.exp; res.gold += f.gold; }
  p.gold += res.gold;
  for (const a of st.allies) {
    const m = a.member, before = statsOf(m, p).max;
    if (a.troops <= 0) m.troops = Math.ceil(before * FALLEN_TROOPS);
    m.exp += res.exp;
    while (m.exp >= needExp(m.lv)) {
      m.exp -= needExp(m.lv); m.lv++;
      const s = statsOf(m, p);
      m.troops = Math.min(s.max, m.troops + (s.max - statsOf({ ...m, lv: m.lv - 1 }, p).max));
      if (!res.ups.includes(m.id)) res.ups.push(m.id);
    }
  }
  return res;
}

export function restAll(p) {
  for (const m of p.members) m.troops = statsOf(m, p).max;
  p.ce = ceMax(p);
}
