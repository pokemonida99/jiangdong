// 第一章 衝天：投黃巢 → 南下廣州（朱存戰死）→ 北上潼關 → 入長安。
const held = ['guangzhou', 'tongguan', 'changan', 'luoyang', 'hongzhou', 'ezhou'];
export default {
  async begin(c) {
    await c.card({ no: '第一章', name: '衝天', year: '唐・乾符四年～廣明元年', text: '黃巢，曹州冤句人。家裡賣私鹽，自己考了幾次進士都沒考上。\n\n他在長安落第時寫過一首菊花詩，最後一句是：\n「滿城盡帶黃金甲」。' });
    await c.go('camp', 7, 7, 'up');
    c.goal('去見黃巢');
    c.G.save();
  },
  noRandom: (c) => !c.flag('marchSouth'),
  own(id, c) {
    if (id === 'songzhou') return 'me';
    if (held.includes(id)) {
      if (id === 'guangzhou' && c.flag('gzDone')) return 'me';
      if (id === 'tongguan' && c.flag('tgDone')) return 'me';
      if (id === 'luoyang' && c.flag('tgDone')) return 'me';
      if (id === 'changan' && c.flag('tgDone')) return 'neutral';
      if (id === 'hongzhou' || id === 'ezhou') return 'neutral';
      return 'foe';
    }
    return null;
  },
  canLeave: async (map, c) => {
    if (map === 'camp' && !c.flag('marchSouth')) { await c.say('pangshigu', '將軍還沒見過主帥，就要走？'); return false; }
    if (map === 'guangzhou' && !c.flag('gzDone') && c.flag('gzGate')) { await c.say(c.me, '城門都破了，現在不是回頭的時候。'); return false; }
    return true;
  },
  npcs(map, add, c) {
    if (map === 'camp') {
      if (!c.flag('marchSouth')) add({ key: 'huangchao', x: 7, y: 2, dir: 'down', talk: () => meetChao(c) });
      add({ key: 'shangrang', x: 4, y: 3, dir: 'down', talk: async () => { await c.say('shangrang', '要打仗就別想太多。跟著走，有肉吃。'); } });
      add({ key: 'mengkai', x: 10, y: 3, dir: 'down', talk: async () => { await c.say('mengkai', '碭山來的？一點人馬也敢稱將軍。去當前鋒吧，死了省糧。'); } });
      add({ key: 'soldier_r', x: 3, y: 6, dir: 'right', talk: () => c.shop('軍需官：要打遠路，多帶點糧吧。') });
      add({ key: 'soldier_r', x: 12, y: 6, dir: 'left', talk: async () => { await c.say('soldier_r', '我們打下一城，就有一城的人來投軍。沒飯吃的人太多了。'); } });
    }
    if (map === 'guangzhou') {
      if (!c.flag('gzGate')) add({ key: 'soldier_t', x: 9, y: 15, dir: 'down', auto: true, anim: true, talk: () => gateScene(c) });
      if (!c.flag('gzDone')) add({ key: 'soldier_t', x: 9, y: 3, dir: 'down', auto: true, anim: true, talk: () => liyaoBoss(c) });
    }
    if (map === 'tongguan' && !c.flag('tgDone')) add({ key: 'soldier_t', x: 8, y: 3, dir: 'down', auto: true, anim: true, talk: () => passBoss(c) });
  },
  places: {
    songzhou: (c) => c.go('camp', 7, 7, 'up'),
    guangzhou: async (c) => {
      if (!c.flag('marchSouth')) return 'menu';
      if (c.flag('gzDone')) return 'menu';
      if (!c.flag('gzArrive')) {
        c.set('gzArrive');
        await c.say('', '乾符六年。\n黃巢上表，向朝廷要廣州節度使這個官。\n朝廷只給了一個小小的率府率。');
        await c.say('huangchao', '我帶了幾十萬人走了半個天下，他們給我一個看守倉庫的官。\n……攻城。');
      }
      await c.go('guangzhou', 9, 18, 'up');
    },
    tongguan: async (c) => {
      if (!c.flag('gzDone')) { await c.say('', '潼關守軍森嚴，現在還不是時候。'); return; }
      if (c.flag('tgDone')) return 'menu';
      await c.say('', '廣明元年。\n黃巢軍一路北上，打到了長安的東大門。\n守關的士兵已經餓了好幾天。');
      await c.go('tongguan', 8, 13, 'up');
    },
    changan: async (c) => {
      if (!c.flag('tgDone')) { await c.say('', '長安還在唐軍手裡，要先過潼關。'); return; }
      await enterChangan(c);
    },
  },
};

async function meetChao(c) {
  await c.say('huangchao', '碭山來的？你也是賣鹽的？');
  await c.say('zhuwen_y', '不是。我是沒飯吃的。');
  await c.say('huangchao', '那就對了。');
  await c.say('huangchao', '我考了幾次進士都沒考上。考不上，我就賣鹽。賣鹽也活不下去，我就來殺那些考上的人。');
  await c.say('huangchao', '「待到秋來九月八，我花開後百花殺。」\n你聽得懂嗎？');
  await c.say('zhuwen_y', '聽得懂後面那句。');
  await c.say('huangchao', '哈哈哈！好。你跟著我。尚讓，這兩兄弟撥到前軍。');
  await c.say('pangshigu', '朱將軍是吧？末將龐師古，上面派我跟著你。');
  await c.say('pangshigu', '我不太會說話，但帶兵還行。打仗前記得先看兵種，別讓弟兄白死。');
  c.join('pangshigu');
  c.toast('龐師古 加入了隊伍');
  await c.say('zhuzhen', '我叫朱珍，徐州人！聽說前軍有個姓朱的不怕死，正好，我也不怕！');
  await c.say('zhucun', '阿三，咱們家什麼時候多了一個弟弟？');
  await c.say('zhuwen_y', '管他的，會騎馬就好。');
  await c.say('', '隊伍最多四人上場。');
  c.join('zhuzhen');
  c.toast('朱珍 加入了隊伍');
  await c.say('shangrang', '主帥有令：中原的官軍太多，咱們往南走，過長江，到嶺南去！');
  c.set('marchSouth');
  c.goal('一路往南，打到廣州。走大路不會遇敵', 'guangzhou');
  c.G.save();
}

async function gateScene(c) {
  await c.say('soldier_t', '賊軍攻城了！放箭！');
  await c.say('zhucun', '阿三！城頭的弓手瞄著你！快趴下！');
  const r = await c.fight('gz1', { music: 'boss' });
  if (!r) return;
  c.set('gzGate');
  c.play('sad');
  await c.fade(true, 200);
  await c.fade(false, 200);
  await c.say('', '城門打開的時候，朱存沒有跟上來。');
  await c.say('zhuwen_y', '二哥？……二哥！');
  await c.say('zhucun', '阿三……你看，這箭多歪……本來是射你的……');
  await c.say('zhuwen_y', '別說話！軍醫！軍醫在哪裡！');
  await c.say('zhucun', '回去跟娘說……說我是打仗死的。\n別說我是當賊死的。');
  await c.say('zhucun', '那個張家小姐……你要真娶到了……\n跟她說，那些乾糧……我也吃了一口……');
  await c.say('', '朱存死在廣州城下。\n他們出門的時候，他答應過母親要看著弟弟。');
  c.leave('zhucun');
  c.G.field.refresh();
  await c.say('pangshigu', '將軍……');
  await c.say('zhuwen_y', '……把他埋了。立個碑，寫朱家二郎。\n然後，開門。');
  c.goal('攻入廣州內殿');
  c.play('castle');
  c.G.save();
}

async function liyaoBoss(c) {
  await c.say('liyao', '賊子！老夫是朝廷命官，身死事小，大節不可失！');
  await c.say('zhuwen_y', '讓開。我今天心情不好。');
  const r = await c.fight('gzBoss', { music: 'boss' });
  if (!r) return;
  c.set('gzDone');
  await c.say('huangchao', '李迢，你替我寫一份表，就說我願受朝廷招安，給我天平節度使。我放你活路。');
  await c.say('liyao', '我的手可以斷，這表不能寫。');
  await c.say('huangchao', '那就斷吧。');
  await c.say('', '李迢被殺。\n廣州城破之後，黃巢軍屠城。\n後來阿拉伯旅人的記載說，光是海外來的商人就死了十二萬。');
  await c.say('zhuzhen', '將軍，咱們……也要去搶嗎？');
  await c.say('zhuwen_y', '不用。我們的人守住街口，不要動。');
  await c.say('zhuwen_y', '（這不是因為我心善。一支搶瘋了的兵，是帶不動的。）');
  await c.say('', '幾個月後，嶺南的瘴癘開始流行。\n黃巢的軍隊病死了三四成。大家都想回北方。');
  await c.say('huangchao', '傳令：北上！我們不要廣州了，我們去要長安！');
  c.goal('北上，打下潼關。那是長安的大門', 'tongguan');
  c.G.save();
}

async function passBoss(c) {
  await c.say('soldier_t', '我是唐將張承範。\n我的兵連飯都沒吃，朝廷的援軍一個也沒來。\n但這一關，我還是得守。', '張承範');
  await c.say('zhuwen_y', '你替誰守？皇帝早就在收拾行李了。');
  const r = await c.fight('tgBoss', { music: 'boss' });
  if (!r) return;
  c.set('tgDone');
  await c.say('soldier_t', '……陛下，臣盡力了。', '張承範');
  await c.say('', '潼關失守。\n唐僖宗帶著幾百個人，從金光門逃往成都。');
  c.goal('進長安', 'changan');
  c.G.save();
}

async function enterChangan(c) {
  c.play('title');
  await c.say('', '廣明元年十二月。\n黃巢坐著金色的肩輿進了長安。\n他手下的士兵披髮錦衣，夾道的百姓爭著來看。');
  await c.say('shangrang', '黃王起兵，本來就是為了百姓，不像李家那樣不愛惜你們。大家安心住著，不要怕！');
  await c.say('', '街上有人歡呼。\n賊兵把財物扔給路邊的窮人。');
  await c.say('', '過了幾天，他們開始搶了。');
  await c.say('huangchao', '「衝天香陣透長安，滿城盡帶黃金甲。」\n朱溫，當年我在這裡落榜。你看，現在是誰在看誰的榜？');
  await c.say('zhuwen_y', '恭喜主公。');
  await c.say('zhuwen_y', '（他做皇帝了。但城外還是唐朝的節度使。\n他手上有長安，沒有糧。）');
  await c.say('huangchao', '東邊的同州還在唐軍手裡。你去打下來，我讓你當防禦使。');
  await c.say('zhuwen_y', '遵命。');
  c.party.upgrades.spear = true;
  c.toast('黃巢賞賜：鐵矛（全軍武力 +6）');
  await c.nextChapter();
}
