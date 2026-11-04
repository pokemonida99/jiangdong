// The demo's events: who stands where, what they say, what happens next.
import { FIELD } from './maps.js';
import { FIGHTS, RANDOM, ITEMS, UPGRADES, GENERALS } from './data.js';
import { say, choice, toast, fade, wait } from './ui.js';
import { restAll, newMember } from './battle_core.js';
import { runBattle, runDuel } from './battle.js';
import { play } from './audio.js';
import { openShop } from './menu.js';

const CAMP_START = { map: 'camp', x: 7, y: 15 };
const spots = FIELD.spots;

export function makeStory(G) {
  const s = () => G.s;
  const flag = (k) => !!s().flags[k];
  const setFlag = (k) => { s().flags[k] = true; };
  const goal = (t) => { s().goal = t; G.renderHud(); };

  async function fight(key, opts = {}) {
    const f = FIGHTS[key];
    const r = await runBattle(G, { foes: f.foes, terrain: f.terrain, ...opts });
    G.save();
    if (r === 'lose') { await retreat(); return false; }
    play('field');
    return r;
  }
  async function retreat() {
    // back to the nearest post you already passed, not all the way to the landing
    const at = G.field.y;
    const post = [FIELD.post2, FIELD.post1].find((p) => G.field.map === 'field' && at >= p.y);
    const r = post ? { map: 'field', x: FIELD.road[post.y + 1], y: post.y + 1 } : s().respawn;
    await fade(true);
    restAll(s().party);
    G.field.enter(r.map, r.x, r.y, 'down');
    s().respawn = r;
    G.save();
    await fade(false);
    play('field');
    await say('chengpu', '勝敗是兵家常事。重新整隊，這回看準了地形和兵種再打。');
  }
  async function rest(x, y, text) {
    restAll(s().party);
    s().respawn = { map: G.field.map, x: G.field.x, y: G.field.y };
    G.save();
    await say('', text || '全軍休整，兵力與計都補滿了。進度已存檔。');
  }

  const opening = async () => {
    await say('', '興平二年。\n天下裂成無數塊，每一塊都有人想當主人。');
    await say('', '長江北岸的歷陽，一支只有千餘人的軍隊正在等船。\n領軍的年輕人才二十一歲。');
    await say('sunce', '父親留下的舊部、跟袁術要回來的幾個老將，就這麼多了。');
    await say('sunce', '程老將軍、黃將軍，你們跟著我父親打過天下。我不敢說一定贏，只敢說這次我不回頭。');
    await say('chengpu', '少主要渡江，老夫這把骨頭就陪你渡。');
    await say('huanggai', '過了江全是劉繇的人。正好，我的鞭子好久沒見血了。');
    await say('sunce', '船呢？糧呢？……聽說有個人從廬江帶著這些來找我。先去營門口看看。');
    goal('到營門口找來訪的人');
    G.save();
  };

  const zhouyuJoin = async () => {
    await say('zhouyu', '伯符，幾年不見，你瘦了。');
    await say('sunce', '公瑾！你真的來了！');
    await say('zhouyu', '船和糧我都帶了。你父親當年待周家如自家人，這趟我不是來幫忙，是來入夥的。');
    await say('zhouyu', '有句話先說：我們人少，不能硬碰。林子裡用火，水邊用水。還有，騎兵破弓手、弓手破步卒、步卒破騎兵，別打錯對手。');
    await say('sunce', '好！有你在，江東可定。');
    s().party.members.push(newMember('zhouyu', s().party.members[0].lv));
    setFlag('zhouyu');
    toast('周瑜 加入了隊伍');
    goal('到南邊碼頭上船渡江');
    G.field.refresh();
    G.save();
  };

  const crossRiver = async () => {
    if (!flag('zhouyu')) { await say('chengpu', '少主，沒有船可渡不了江。不是說有人在營門口等嗎？'); return; }
    await say('', '要渡江嗎？過了江就是戰場。');
    if (await choice(['開船', '再準備一下']) !== 0) return;
    await fade(true, 400);
    await wait(150);
    G.field.enter('field', FIELD.road[4], 4, 'down');
    s().respawn = { map: 'field', x: FIELD.road[4], y: 4 };
    await fade(false, 400);
    await say('', '牛渚渡口。對岸的營壘已經舉起了旗。');
    await say('sunce', '全軍登岸！沿著大路往南打，一路打到曲阿！');
    goal('沿路南下，擊破牛渚守軍');
    G.save();
  };

  const landing = async () => {
    await say('', '守灘的步卒衝了過來！', '');
    const r = await fight('landing', {
      scripted: async (b) => {
        b.logCard('這是渡口：水計 ×1.5，火計減弱。輪到周瑜時用「計略 → 決水」。');
        await wait(window.__fastText ? 10 : 1400);
      },
    });
    if (!r) return;
    setFlag('landing');
    toast('錢和經驗全軍共享；地圖上紅色驚嘆號是擋路的敵人');
    G.field.refresh();
  };

  const boss1 = async () => {
    await say('zhangying', '黃口小兒，也敢來碰我張英的營盤？這渡口你過不去！');
    await say('sunce', '張英是吧。你的旗子不錯，等一下我收下了。');
    await say('zhouyu', '敵將是步兵，帶了騎兵樊能和弓手。先拆掉弓手，再對付主將。');
    const r = await fight('boss1', { music: 'boss' });
    if (!r) return;
    await say('zhangying', '怎、怎麼可能……撤！棄營！快撤！');
    await say('', '牛渚的糧倉全落到孫策手裡。消息傳開，開始有人來投軍。');
    setFlag('boss1');
    s().party.gold += 100;
    toast('繳獲糧倉，錢 +100');
    goal('繼續南下，到路邊營地補給');
    G.field.refresh();
    G.save();
  };

  const roadFight = (key, flagName, before, after) => async () => {
    if (before) await before();
    const r = await fight(key);
    if (!r) return;
    setFlag(flagName);
    if (after) await after();
    G.field.refresh();
    G.save();
  };

  const duel = async () => {
    await say('', '山林深處有座小亭，叫神亭。孫策帶十三騎上山，想看看敵營虛實。');
    await say('taishici', '孫策在哪！');
    await say('sunce', '就在這裡。你是誰？只帶一個人？');
    await say('taishici', '東萊太史慈。我來取孫策的頭，一個人夠了。');
    await say('sunce', '好漢子！大家都別動手，這是我跟他的事。');
    const d = await runDuel(G);
    await say('', d.won ? '兩人從馬上打到地上。孫策搶到太史慈背後的手戟，太史慈也掀走了孫策的頭盔。' : '兩人從馬上打到地上。太史慈掀走了孫策的頭盔，孫策也搶到他背後的手戟。');
    await say('', '兩邊的援兵同時趕到，只好各自退開。');
    d.close();
    play('field');
    await say('sunce', '哈哈哈！痛快！公瑾，這個人我要定了。');
    await say('zhouyu', '要收他，得先打贏他。他守的是曲阿，下一仗就是他。');
    if (d.won) { s().party.items.wine = (s().party.items.wine || 0) + 2; toast('單挑佔了上風，士氣大振：犒軍酒 +2'); }
    setFlag('duel');
    goal('往南攻向曲阿城門');
    G.field.refresh();
    G.save();
  };

  const final = async () => {
    await say('liuyao', '守住！給我守住！……不行，我先去丹徒點兵，這裡交給太史慈！', '劉繇');
    await say('huanggai', '那官兒跑得比我的鞭子還快。');
    await say('taishici', '孫策。頭盔還你之前，先分個勝負。');
    await say('sunce', '我不只要贏。等你兵少了，我還有話跟你說。');
    await say('zhouyu', '他騎射無雙，別讓他拖長。城門前步兵防禦高，鼓舞之後集中打他。兵力壓到四成以下，就能「勸降」。');
    const r = await fight('final', { music: 'boss' });
    if (!r) return;
    if (r === 'persuaded') {
      await say('sunce', '太史子義！劉繇丟下你先跑了，你還替誰守？跟我走，一起把這江東打下來！');
      await say('taishici', '……我這一身本事，確實不該只用來替人斷後。');
    } else {
      await say('', '太史慈的軍隊潰散，他本人被擒，押到了孫策面前。');
      await say('sunce', '還不快鬆綁！');
      await say('sunce', '神亭那天如果是你抓到我，你會怎麼處置？');
      await say('taishici', '不知道。但今天我知道，該跟誰走了。');
    }
    await say('taishici', '太史慈，從今天起聽將軍號令。');
    await ending(r);
  };

  const ending = async (r) => {
    setFlag('clear');
    G.save();
    play('ending');
    await fade(true, 500);
    await fade(false, 200);
    await say('', '曲阿城破。\n孫策進城，不許士兵擾民，不殺降卒。\n十幾天內，投軍的人從四面八方來到兩萬多。');
    await say('', '這段故事才剛開始。');
    await say('', `試玩到這裡結束，謝謝你的遊玩。\n\n孫策 Lv ${s().party.members[0].lv}${r === 'persuaded' ? '・成功勸降太史慈' : '・擒獲太史慈'}`);
    G.clearSave();
    await G.toTitle();
  };

  function npcs(map) {
    const out = [];
    const add = (o) => out.push(o);
    if (map === 'camp') {
      if (!flag('zhouyu')) add({ key: 'zhouyu', x: 8, y: 5, dir: 'down', talk: zhouyuJoin });
      add({ key: 'chengpu', x: 5, y: 12, dir: 'right', talk: async () => {
        await say('chengpu', '陣形要看對手。鋒矢攻得狠但守不住，方圓剛好相反，鶴翼讓全軍動得快。右上角「軍務」可以換。');
      } });
      add({ key: 'huanggai', x: 10, y: 12, dir: 'left', talk: async () => {
        await say('huanggai', '看到下面那排小兵沒？人死得越多，你砍出去的力道就越輕。別等快沒兵了才補。');
      } });
      add({ key: 'soldier', x: 3, y: 6, dir: 'right', talk: () => openShop(G, '要出發了，多帶些糧吧。') });
      add({ key: 'soldier', x: 5, y: 17, dir: 'right', dirFace: false, talk: async () => { await say('soldier', '聽說這次要打劉繇。我家就在曲阿，能回家了。', '士兵'); } });
      add({ key: 'soldier', x: 10, y: 17, dir: 'left', dirFace: false, talk: async () => { await say('soldier', '船在南邊碼頭，一路往下走就到了。', '士兵'); } });
      add({ x: 7, y: 12, talk: async () => { await rest(0, 0, '在營火邊歇了一會。兵力與計都補滿了，進度已存檔。'); } });
      for (const x of [7, 8]) add({ x, y: 23, talk: crossRiver });
    }
    if (map === 'field') {
      const enemy = (spot, key, talk, onlyIf = true) => { if (onlyIf) add({ key, x: spot.x, y: spot.y, dir: 'up', auto: true, anim: true, talk }); };
      enemy(spots.landing, 'zhangying', landing, !flag('landing'));
      enemy(spots.boss1, 'zhangying', boss1, !flag('boss1'));
      enemy(spots.road1, 'zhangying', roadFight('road1', 'road1', async () => { await say('', '追擊的騎兵擋住了去路！'); }, async () => { goal('穿過山林，前往神亭'); }), !flag('road1'));
      enemy(spots.road2, 'zhangying', roadFight('road2', 'road2', async () => { await say('zhouyu', '林子裡埋了伏兵。正好，這裡用火最有效。'); }), !flag('road2'));
      enemy(spots.road3, 'zhangying', roadFight('road3', 'road3', async () => { await say('', '騎兵在林中轉不開身，這是好機會！'); }), !flag('road3'));
      enemy(spots.duel, 'taishici', duel, !flag('duel'));
      enemy(spots.road4, 'zhangying', roadFight('road4', 'road4'), !flag('road4'));
      enemy(spots.road5, 'zhangying', roadFight('road5', 'road5', async () => { await say('', '曲阿城外的守軍列陣出戰！'); }, async () => { goal('攻破曲阿城門'); }), !flag('road5'));
      if (!flag('clear')) add({ x: spots.gate.x, y: spots.gate.y + 1, auto: true, talk: final });
      for (const p of [FIELD.post1, FIELD.post2]) {
        add({ key: 'soldier', x: p.x, y: p.y, dir: 'down', talk: () => openShop(G, '前線補給，要什麼？') });
        add({ x: p.x + 1, y: p.y, talk: async () => { await rest(0, 0, '在營地休整。兵力與計都補滿了，進度已存檔。'); } });
      }
    }
    return out;
  }

  async function randomFight(tile) {
    const foes = RANDOM[Math.floor(Math.random() * RANDOM.length)];
    const terrain = tile === 'F' ? 'forest' : 'plain';
    const r = await runBattle(G, { foes, terrain });
    G.save();
    if (r === 'lose') { await retreat(); return; }
    play('field');
  }

  return { npcs, opening, randomFight, CAMP_START };
}
