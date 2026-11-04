// 第二章 全忠：奪同州、重逢張惠 → 孟楷扣書、謝瞳勸降 → 殺嚴實 → 降王重榮、賜名 → 赴汴州。
const foeNow = (id, c) => {
  if (id === 'tongzhou') return c.flag('tzDone') ? 'me' : 'foe';
  if (id === 'hezhong') return c.flag('surrendered') ? 'me' : 'foe';
  if (id === 'changan') return 'neutral';
  if (id === 'bianzhou') return c.flag('surrendered') ? 'me' : null;
  return null;
};
export default {
  async begin(c) {
    await c.card({ no: '第二章', name: '全忠', year: '唐・中和二年～中和三年', text: '黃巢占了長安，唐僖宗逃到成都。\n各路節度使把關中圍了起來。\n\n長安城裡開始缺糧。' });
    await c.toWorld('changan');
    c.goal('往東打下同州', 'tongzhou');
    c.G.save();
  },
  noRandom: () => false,
  own: foeNow,
  canLeave: async (map, c) => {
    if (map === 'tongzhou' && c.flag('tzDone') && !c.flag('yanDead')) { await c.say(c.me, '同州的事還沒解決。'); return false; }
    return true;
  },
  npcs(map, add, c) {
    if (map === 'tongzhou') {
      if (!c.flag('tzDone')) add({ key: 'soldier_t', x: 9, y: 3, dir: 'down', auto: true, anim: true, talk: () => michengBoss(c) });
      else if (!c.flag('yanDead')) {
        add({ key: 'zhanghui', x: 5, y: 4, dir: 'right', talk: () => zhangTalk(c) });
        add({ key: 'xietong', x: 13, y: 4, dir: 'left', talk: () => xieTalk(c) });
        add({ key: 'pangshigu', x: 7, y: 5, dir: 'up', talk: async () => { await c.say('pangshigu', '將軍，嚴實的人在城裡到處問話。弟兄們都怕他。'); } });
        add({ key: 'soldier_r', x: 3, y: 12, dir: 'right', talk: () => c.shop('軍需官：現在糧少，還能賣的就這些。') });
        if (c.flag('yanPlan')) add({ key: 'yanshi', x: 9, y: 8, dir: 'down', auto: true, anim: true, talk: () => yanBoss(c) });
      }
    }
    if (map === 'hall' && !c.flag('surrendered')) add({ key: 'wangchongrong', x: 5, y: 3, dir: 'down', auto: true, talk: () => surrender(c) });
  },
  step(map, x, y, c) {
    // the first time you walk into the taken city's hall, the story comes to you
    if (map === 'tongzhou' && c.flag('tzDone') && !c.flag('tzReunion') && y <= 5) return () => reunion(c);
    return null;
  },
  places: {
    changan: async (c) => {
      if (c.flag('surrendered')) { await c.say(c.me, '長安還在黃巢手裡，暫時回不去了。'); return; }
      await c.say('mengkai', '還不去同州？長安的糧不養閒人。');
    },
    tongzhou: async (c) => {
      if (c.flag('yanDead')) return 'menu';
      await c.go('tongzhou', 9, 17, 'up');
    },
    hezhong: async (c) => {
      if (c.flag('surrendered')) return 'menu';
      if (!c.flag('yanDead')) { await c.say('', '河中節度使王重榮的大營。\n對岸的旗子比同州多了十倍。'); return; }
      await c.go('hall', 5, 7, 'up');
    },
    bianzhou: async (c) => {
      if (!c.flag('surrendered')) return 'menu';
      await bianArrive(c);
    },
  },
};

async function michengBoss(c) {
  await c.say('mishen', '賊、賊軍怎麼這麼快！');
  await c.say('mishen', '守住！給我守住！我……我去河中請援兵！');
  const r = await c.fight('tzBoss', { music: 'boss' });
  if (!r) return;
  await c.say('', '同州刺史米誠棄城，逃往河中。\n朱溫占領同州，被黃巢封為同州防禦使。');
  c.set('tzDone');
  c.gain(150);
  c.goal('到後堂去看看');
  c.G.save();
  c.G.field.enter('tongzhou', 9, 6, 'up');
}

async function reunion(c) {
  c.set('tzReunion');
  c.play('sad');
  await c.say('soldier_r', '將軍，亂軍裡抓到一個女的，說是碭山人，要見將軍。');
  await c.say('zhuwen_y', '碭山？帶上來。');
  await c.say('zhanghui', '……是你。');
  await c.say('zhuwen_y', '你認得我？');
  await c.say('zhanghui', '你說「看哪邊給飯吃」。\n全碭山只有一個人敢這樣跟我說話。');
  await c.say('zhuwen_y', '你爹呢？張家呢？');
  await c.say('zhanghui', '沒了。我從碭山一路逃，碰到的兵有官軍，有賊軍。\n我已經分不清了。');
  await c.say('zhuwen_y', '我二哥死前，還惦記著你那幾張乾糧。');
  await c.say('zhuwen_y', '我要明媒正娶你。不是搶，是娶。\n這亂世我給不了別的，只有這個不騙你。');
  await c.say('zhanghui', '……娶我可以。');
  await c.say('zhanghui', '但有一個條件。\n以後你要殺人之前，先跟我說一聲。');
  await c.say('zhuwen_y', '……好。');
  await c.say('', '朱溫備了婚禮，用夫妻之禮迎娶張惠。\n軍中的人都說，將軍怕老婆。');
  await c.say('', '朱溫確實怕她。\n這是他一生中唯一怕過的人。');
  c.play('town');
  c.goal('河中王重榮大軍壓境。去找謝瞳商量');
  c.G.save();
}

async function zhangTalk(c) {
  if (c.flag('yanPlan')) {
    await c.say('zhanghui', '你要殺嚴實？');
    await c.say('zhuwen_y', '我答應過，先跟你說一聲。');
    await c.say('zhanghui', '他是黃巢派來看著你的人。殺了他，你就再也回不了頭了。\n……你想清楚就去吧。城裡的百姓我來安撫。');
  } else await c.say('zhanghui', '城裡的糧只夠吃兩個月。你寫給長安的求援書，有回音了嗎？');
}

async function xieTalk(c) {
  if (c.flag('yanPlan')) { await c.say('xietong', '嚴實在中庭。別拖，他的信使明天就要走了。'); return; }
  await c.say('zhuwen_y', '謝先生，王重榮打過來了。我寫了十封信求援，長安一個字也沒回。');
  await c.say('xietong', '將軍，那些信沒到主公手裡。');
  await c.say('xietong', '全被孟楷扣了。他早就看你不順眼。');
  await c.say('mengkai', '（信使帶回來的話）碭山小子也配要援兵？\n告訴他，自己想辦法。', '孟楷');
  await c.say('xietong', '將軍是聰明人，我就說了。');
  await c.say('xietong', '黃家起於草莽，只是趁著唐朝衰敗才走到今天，靠的不是功德。這種事，成不了帝業。');
  await c.say('xietong', '現在唐朝天子在蜀地，各鎮都還忠於他，軍隊一天比一天多。\n將軍在外面拚命打仗，裡面的人卻壓著你。');
  await c.say('xietong', '當年章邯為什麼降楚，將軍應該聽過。');
  c.play('tense');
  const r = await c.choice(['殺監軍，降唐', '再等等長安的回音'], '要怎麼做？');
  if (r === 1) {
    await c.say('zhuwen_y', '主公待我不薄。再等等。');
    await c.say('', '半個月過去了。\n長安的回信只有一句話：「同州之事，防禦使自當之。」');
    await c.say('xietong', '將軍，還要再等嗎？');
    await c.say('zhuwen_y', '……不等了。');
  }
  await c.say('zhuwen_y', '但有個麻煩。黃巢派來監軍的嚴實還在城裡，他就是來防這件事的。');
  await c.say('xietong', '所以他要先死。\n在下謝瞳，願隨將軍走這條路。');
  c.join('xietong');
  c.toast('謝瞳 加入了隊伍：會用火攻、決水、鼓舞');
  c.set('yanPlan');
  c.goal('去中庭，除掉監軍嚴實');
  c.G.save();
  c.G.field.refresh();
}

async function yanBoss(c) {
  await c.say('yanshi', '朱防禦使，這麼晚，帶這麼多人來見本監軍？');
  await c.say('zhuwen_y', '來還你一樣東西。');
  await c.say('yanshi', '什麼？');
  await c.say('zhuwen_y', '黃巢賞給我的這顆腦袋。今後不勞他費心了。');
  await c.say('yanshi', '你！反了！來人！把這反賊拿下！');
  const r = await c.fight('yan', { music: 'boss' });
  if (!r) return;
  c.set('yanDead');
  c.play('town');
  await c.say('', '中和二年九月。\n朱溫殺嚴實，率部出城。');
  await c.say('xietong', '將軍，現在去河中，見王重榮。\n記住，他也姓王。');
  await c.say('zhuwen_y', '姓王又怎樣？');
  await c.say('xietong', '令堂也姓王。');
  c.goal('到黃河對岸的河中，向王重榮投降', 'hezhong');
  c.G.save();
  await c.toWorld('tongzhou');
}

async function surrender(c) {
  await c.say('wangchongrong', '朱溫！你在同州打我的兵打了半年，現在敢一個人走進我的大堂？');
  await c.say('zhuwen_y', '外甥拜見舅舅！');
  await c.say('wangchongrong', '……什麼？');
  await c.say('zhuwen_y', '家母姓王。舅舅是王家的英雄，外甥有眼無珠，跟著賊寇做了錯事。\n今天帶同州全軍，回到舅舅門下。');
  await c.say('wangchongrong', '……哈哈哈哈！好一張嘴！\n朝廷正缺能打的人。你這個外甥，我認了。');
  await c.say('', '消息傳到成都。\n唐僖宗高興得說：「是天賜予我也！」');
  await c.say('envoy', '奉旨。賜朱溫名，曰全忠。授左金吾衛大將軍、河中行營招討副使。\n望將軍名副其實，永為大唐藩屏。');
  await c.say('zhuwen', '臣朱全忠，領旨謝恩。');
  c.se('level');
  c.party.renamed = true;
  c.set('surrendered');
  c.G.field.refresh();
  await c.say('', '從這天起，朱溫換了名字和衣服。');
  await c.say('zhanghui', '全忠。\n你把這個名字戴在頭上，不重嗎？');
  await c.say('zhuwen', '名字是給別人看的。');
  await c.say('zhanghui', '那你自己看什麼？');
  await c.say('zhuwen', '……看下一步往哪走。');
  await c.say('', '中和三年。長安收復，黃巢東逃。\n朝廷任命朱全忠為宣武軍節度使，治所在汴州。');
  c.party.upgrades.armor = true;
  c.toast('朝廷賞賜：札甲（全軍統率 +8）');
  c.goal('到中原的汴州上任', 'bianzhou');
  c.G.save();
  await c.toWorld('hezhong');
}

async function bianArrive(c) {
  c.play('town');
  await c.go('bianzhou', 8, 10, 'up');
  await c.say('', '中和三年七月。\n朱全忠帶著幾百名親兵進了汴州。\n城裡的兵不到一萬，而且四面都是敵人。');
  await c.say('pangshigu', '將軍，黃巢的殘兵還有十幾萬，就在東邊。\n蔡州的秦宗權也靠不住。這地方沒有山，也沒有險可守。');
  await c.say('zhuwen', '沒有險要，四面都可以出兵。\n這是個好地方。');
  await c.say('zhanghui', '你三十二歲了。八年前你在劉家劈柴。');
  await c.say('zhuwen', '劉家老太太說對了。');
  await c.say('zhanghui', '那現在，你要做什麼？');
  await c.say('zhuwen', '先活下來。然後把這四面的人，一個一個吃掉。');
  await c.nextChapter();
}
