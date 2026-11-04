// What every chapter shares: fights, walking between maps, chests and levers, entering a city. Each chapter's own events are in its file.
import { LOCAL } from '../castles.js';
import { WORLD, placeAt } from '../world.js';
import { FIGHTS, RANDOM, ITEMS, PARTY_MAX } from '../data.js';
import { say, choice, toast, fade, wait, chapterCard } from '../ui.js';
import { restAll, newMember, statsOf } from '../battle_core.js';
import { runBattle, runDuel } from '../battle.js';
import { play, se } from '../audio.js';
import { openShop } from '../menu.js';
import { MAPS } from '../field.js';
import ch0 from './ch0.js';
import ch1 from './ch1.js';
import ch2 from './ch2.js';
import ch3 from './ch3.js';

export const CHAPTER_LIST = [ch0, ch1, ch2, ch3];

export function makeStory(G) {
  const s = () => G.s;
  const chapter = () => CHAPTER_LIST[s().ch];
  const flag = (k) => !!s().flags[k];
  const set = (k, v = true) => { s().flags[k] = v; };
  const leaderLook = () => (s().party.renamed ? 'zhuwen' : 'zhuwen_y');
  const c = {
    G, say, choice, toast, fade, wait, play, se, flag, set, FIELD_MAPS: MAPS,
    get s() { return G.s; },
    get party() { return G.s.party; },
    get me() { return leaderLook(); },
    goal(text, place = null) { const st = s(); st.goal = text; st.goalPlace = place; G.renderHud(); },
    async fight(key, opts = {}) {
      const f = FIGHTS[key];
      const r = await runBattle(G, { foes: f.foes, terrain: f.terrain, ...opts });
      G.save();
      if (r === 'lose') { await retreat(); return false; }
      play(MAPS[G.field.map].music || 'world');
      return r;
    },
    duel: (opts) => runDuel(G, opts),
    async go(map, x, y, dir = 'up', { quick = false, music = null } = {}) {
      await fade(true, quick ? 120 : 280);
      G.field.enter(map, x, y, dir);
      play(music || MAPS[map].music || 'world');
      await fade(false, quick ? 120 : 280);
    },
    async toWorld(placeId, dir = 'down') {
      const p = WORLD.places[placeId];
      s().respawn = { map: 'world', x: p.x, y: p.y };
      await c.go('world', p.x, p.y, dir, { quick: true });
      G.save();
    },
    join(id) {
      const p = s().party, lead = p.members[0];
      if (p.members.some((m) => m.id === id) || (p.reserve || []).some((m) => m.id === id)) return;
      const m = newMember(id, lead.lv);
      m.troops = statsOf(m, p).max;
      if (p.members.length < PARTY_MAX) p.members.push(m);
      else { (p.reserve ||= []).push(m); toast(`隊伍已滿，編入後備。可在軍務換上場`); }
    },
    leave(id) {
      const p = s().party;
      p.members = p.members.filter((m) => m.id !== id);
      p.reserve = (p.reserve || []).filter((m) => m.id !== id);
    },
    async rest(text) {
      restAll(s().party);
      s().respawn = { map: G.field.map, x: G.field.x, y: G.field.y };
      G.save();
      se('heal');
      await say('', text || '全軍休整，兵力與計都補滿了。進度已存檔。');
    },
    shop: (text) => openShop(G, text),
    card: chapterCard,
    gain(gold) { s().party.gold += gold; se('coin'); },
    heal() { restAll(s().party); },
    // on to the next chapter, or to the end of what's built
    async nextChapter() {
      s().ch++;
      s().goal = ''; s().goalPlace = null;
      restAll(s().party);
      G.save();
      await chapter().begin(c);
      G.save();
    },
  };

  async function retreat() {
    const r = s().respawn;
    await fade(true);
    restAll(s().party);
    G.field.enter(r.map, r.x, r.y, 'down');
    G.save();
    play(MAPS[r.map].music || 'world');
    await fade(false);
    const p = s().party;
    const who = p.members.find((m) => m.id !== 'zhuwen');
    if (who) await say(who.id, '勝敗是兵家常事。重新整隊，這回看準了地形和兵種再打。');
    else await say(leaderLook(), '……嘖。下回看準了再打。');
  }

  // anything on a map that works the same way everywhere
  function localStuff(map, add) {
    const m = LOCAL[map];
    if (!m) return;
    for (const f of m.fires || []) add({ x: f.x, y: f.y, talk: () => c.rest('在烽火台邊歇了一會。兵力與計都補滿了，進度已存檔。') });
    for (const ch of m.chests || []) add({ x: ch.x, y: ch.y, talk: async () => {
      if (flag(ch.id)) { await say('', '箱子是空的。'); return; }
      set(ch.id);
      se('chest');
      if (ch.gold) { s().party.gold += ch.gold; await say('', `打開箱子。\n得到了 ${ch.gold} 錢！`); }
      else { const p = s().party; p.items[ch.item] = (p.items[ch.item] || 0) + ch.n; await say('', `打開箱子。\n得到了 ${ITEMS[ch.item].name} ×${ch.n}！`); }
      G.save();
    } });
    for (const l of m.levers || []) add({ x: l.x, y: l.y, talk: async () => {
      if (flag(l.id)) { await say('', '已經拉過了。'); return; }
      set(l.id);
      se('lever');
      await say('', l.text);
      G.save();
    } });
    for (const g of m.guards || []) if (!flag(g.id)) add({ key: g.sprite, x: g.x, y: g.y, dir: 'down', auto: true, anim: true, talk: async () => {
      await say(g.sprite, g.line);
      if (await c.fight(g.fight)) { set(g.id); G.save(); }
    } });
  }

  return {
    c,
    begin: (mode) => chapter().begin(c, mode),
    npcs(map) {
      const out = [];
      const add = (o) => out.push(o);
      localStuff(map, add);
      chapter().npcs?.(map, add, c);
      return out;
    },
    // tile changes that come from what you did: chests opened, gates raised
    overlay(map) {
      const o = {}, m = LOCAL[map];
      if (!m) return o;
      for (const ch of m.chests || []) if (flag(ch.id)) o[ch.x + ',' + ch.y] = 'X';
      for (const l of m.levers || []) if (flag(l.id)) for (const [x, y] of l.opens) o[x + ',' + y] = 'D';
      return o;
    },
    onStep(map, x, y) {
      const step = chapter().step?.(map, x, y, c);
      if (step) return step;
      const m = LOCAL[map];
      if (m && (m.exits || []).some((e) => e[0] === x && e[1] === y)) {
        return async () => {
          if (chapter().canLeave && !(await chapter().canLeave(map, c))) { G.field.enter(map, G.field.x, G.field.y - 1, 'up'); return; }
          await c.toWorld(m.place);
        };
      }
      if (map === 'world') {
        const p = placeAt(x, y);
        if (p) return () => this.enterPlace(p.id);
      }
      return null;
    },
    async enterPlace(id) {
      const fn = chapter().places?.[id];
      // losing inside a fortress brings you back outside its gate
      { const q = WORLD.places[id]; s().respawn = { map: 'world', x: q.x, y: q.y }; }
      if (fn) { const r = await fn(c); if (r !== 'menu') return; }
      const p = WORLD.places[id], owner = this.ownerOf(id);
      if (owner === 'foe') { await say('', `${p.name}是敵軍的地盤。\n城門緊閉，城頭上全是弓手。`); return; }
      if (p.kind === 'f' && !fn) { await say('', `${p.name}。\n四下沒有人煙。`); return; }
      const pick = await choice(['休息（免費，存檔）', '買軍需', '離開'], `${p.name}。要做什麼？`);
      if (pick === 0) await c.rest(`在${p.name}住了一晚。兵力與計都補滿了，進度已存檔。`);
      else if (pick === 1) await c.shop(`${p.name}的市集，要買什麼？`);
    },
    ownerOf: (id) => chapter().own?.(id, c) ?? null,
    randomFoes() {
      if (chapter().noRandom?.(c)) return null;
      const list = RANDOM[s().ch] || RANDOM[0];
      return list[Math.floor(Math.random() * list.length)];
    },
    async randomFight(tile, foes) {
      const terrain = tile === 'T' ? 'forest' : tile === ',' ? 'pass' : tile === 'o' ? 'south' : 'plain';
      const r = await runBattle(G, { foes, terrain });
      G.save();
      if (r === 'lose') { await retreat(); return; }
      play(MAPS[G.field.map].music || 'world');
    },
  };
}
