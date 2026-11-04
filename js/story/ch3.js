// 第三章 上源驛：陳州解圍、遇李克用 → 王滿渡收葛從周 → 上源驛夜襲 → 楊彥洪那一箭 → 黃巢之死。
export default {
  async begin(c, mode) {
    if (mode === 'night') { await c.go('shangyuan', 8, 14, 'up'); await nightStart(c); return; }
    c.party.renamed = true;
    await c.card({ no: '第三章', name: '上源驛', year: '唐・中和四年', text: '黃巢被趕出長安，帶著十幾萬人東走，圍了陳州，一圍就是三百天。\n\n中原的節度使擋不住他，只好向北邊求救。\n\n來的是沙陀人，李克用。' });
    await c.go('bianzhou', 8, 9, 'up');
    c.goal('到南邊的陳州，解黃巢之圍', 'chenzhou');
    c.G.save();
  },
  noRandom: (c) => c.flag('wmDone'),
  own(id, c) {
    if (id === 'bianzhou') return 'me';
    if (id === 'chenzhou') return c.flag('chenDone') ? 'me' : 'foe';
    if (id === 'wangman') return c.flag('wmDone') ? 'me' : 'foe';
    if (id === 'changan' || id === 'hezhong') return 'neutral';
    return null;
  },
  canLeave: async (map, c) => {
    if (map === 'bianzhou' && c.flag('wmDone') && !c.flag('banquetDone')) { await bianTalk(c); return false; }
    return true;
  },
  npcs(map, add, c) {
    if (map === 'bianzhou') {
      add({ key: 'zhanghui', x: 7, y: 4, dir: 'down', talk: () => zhang(c) });
      add({ key: 'pangshigu', x: 2, y: 7, dir: 'right', talk: async () => { await c.say('pangshigu', '汴州的兵，我已經操練起來了。還缺的是糧。'); } });
      add({ key: 'soldier_b', x: 13, y: 7, dir: 'left', talk: () => c.shop('軍需官：汴州剛穩下來，這些都是新打的。') });
      add({ key: 'soldier_b', x: 13, y: 10, dir: 'left', talk: async () => { await c.say('soldier_b', '將軍說要在我們臉上刺字，逃兵才跑不掉。\n……其實沒地方可逃。'); } });
      add({ x: 4, y: 6, talk: () => c.rest('回府休息。兵力與計都補滿了，進度已存檔。') });
    }
    if (map === 'shangyuan' && c.flag('nightOn') && !c.flag('syDone')) {
      if (!c.flag('sy1')) add({ key: 'bandit', x: 8, y: 12, dir: 'down', auto: true, anim: true, talk: () => sy(c, 'sy1', '沙陀親兵', '有人放火！護駕！護將軍！') });
      if (!c.flag('sy2')) add({ key: 'bandit', x: 8, y: 6, dir: 'down', auto: true, anim: true, talk: () => sy(c, 'sy2', '鴉軍騎兵', '門口有汴軍！衝出去！') });
      add({ key: 'likeyong', x: 8, y: 3, dir: 'down', auto: true, anim: true, talk: () => liBoss(c) });
    }
  },
  places: {
    bianzhou: async (c) => {
      if (c.flag('wmDone') && !c.flag('banquetDone')) { await banquet(c); return; }
      await c.go('bianzhou', 8, 10, 'up');
    },
    chenzhou: (c) => chen(c),
    wangman: (c) => wangman(c),
  },
};

async function zhang(c) {
  if (c.flag('wmDone')) { await c.say('zhanghui', '李克用要路過汴州？替你打過黃巢的人，你要好好招待。'); return; }
  await c.say('zhanghui', '陳州被圍了快一年。你真要去救？救了對你有什麼好處？');
  await c.say('zhuwen', '黃巢的兵散了，總得有人收。');
}

async function bianTalk(c) {
  await c.say('zhuwen', '李克用就要到了。去北邊城外的汴州大道，把他迎進來。');
}

async function chen(c) {
  if (c.flag('chenDone')) return 'menu';
  if (!c.flag('chen1')) {
    await c.say('', '陳州城外，黃巢用人肉當軍糧，還蓋了一座「八仙營」，住得像座宮殿。\n軍中缺糧，他們設了「舂磨寨」，把抓來的人當糧食。');
    await c.say('zhuwen', '……當年他吟菊花詩的時候，大概沒想到會有今天。');
    await c.say('soldier_r', '誰敢過來！');
    const r = await c.fight('chen1');
    if (!r) return;
    c.set('chen1');
    c.G.save();
  }
  await c.say('shangrang', '朱溫！你這忘恩負義的東西！主公待你不薄，你竟敢帶著官軍回來打自己人！');
  await c.say('zhuwen', '尚將軍，你也可以投降。我聽說時溥那邊條件不錯。');
  const r = await c.fight('chen2', { music: 'boss' });
  if (!r) return;
  c.set('chenDone');
  c.play('tense');
  await c.say('', '就在這時，北邊煙塵大起。\n一支全身黑甲的騎兵衝垮了黃巢的側翼。\n當地人叫他們「鴉軍」。');
  await c.say('likeyong', '你就是朱全忠？');
  await c.say('zhuwen', '正是。將軍就是獨眼龍？');
  await c.say('likeyong', '你也聽過我？聽說你從前也是黃巢的人。');
  await c.say('zhuwen', '現在我是朝廷的節度使。');
  await c.say('likeyong', '哼。去年我打下長安的時候，你在哪裡？\n走吧，朱三。一起把這老賊打完。');
  await c.say('zhuwen', '（這個人，我記住了。）');
  c.goal('黃巢退往汴河上游。到西北的王滿渡截住他', 'wangman');
  c.G.save();
}

async function wangman(c) {
  if (c.flag('wmDone')) { await c.say('', '王滿渡的河水又漲了。'); return; }
  if (!c.flag('wm1')) {
    await c.say('', '中和四年五月。\n黃巢渡河到一半，李克用的騎兵追到了王滿渡。\n巢軍一片混亂，一半的人被河水沖走。');
    const r = await c.fight('wm1');
    if (!r) return;
    c.set('wm1');
    c.G.save();
  }
  await c.say('gecongzhou', '我是葛從周。黃王已經走了，留下來的這些弟兄，歸我管。');
  await c.say('zhuwen', '你是黃巢的人，卻這麼沉得住氣。');
  await c.say('gecongzhou', '我不是來拚命的。我想看看，你值不值得我放下弓。');
  await c.say('xietong', '將軍，這個人是難得的將才。把他的兵力壓到四成以下，就能「勸降」。');
  const r = await c.fight('wmBoss', { music: 'boss' });
  if (!r) return;
  if (r === 'persuaded') {
    await c.say('zhuwen', '黃巢走了，連頭都沒回。你們替誰斷後？\n我當年跟你一樣。跟我走，我給弟兄們飯吃。');
    await c.say('gecongzhou', '……你倒是懂這種滋味。');
  } else {
    await c.say('', '葛從周的兵潰散了，他本人被押到朱全忠面前。');
    await c.say('zhuwen', '鬆綁。你打得不錯，比我當年好。');
    await c.say('gecongzhou', '……你要收我？');
  }
  await c.say('gecongzhou', '葛從周，願為將軍效命。');
  c.join('gecongzhou');
  c.toast('葛從周 加入了隊伍');
  c.set('wmDone');
  c.gain(300);
  await c.say('', '葛從周、霍存、張歸霸兄弟都來投了朱全忠。\n而李克用追黃巢追到冤句，人困馬乏，折回了汴州。');
  await c.say('soldier_b', '報！李克用將軍請借道汴州回師。');
  await c.say('zhuwen', '請他進城。在上源驛設宴。\n我親自作陪。');
  c.goal('回汴州。去上源驛赴宴', 'bianzhou');
  c.G.save();
}

// ---- the night of 884
async function banquet(c) {
  c.set('banquetDone');
  c.heal();
  await c.go('shangyuan', 8, 7, 'up', { music: 'town' });
  await c.say('', '中和四年五月十四。\n汴州，上源驛。\n朱全忠在驛館設宴，款待李克用。席上的酒菜都是汴州能找到最好的。');
  await c.say('zhuwen', '將軍此番血戰，汴州上下無不感激。');
  await c.say('likeyong', '感激？（拍桌）你這汴州城，要不是我的沙陀騎兵，早讓黃巢踩平了！');
  await c.say('likeyong', '朱三，你一個賊軍出身，也配坐在這裡當節度使？朝廷真是沒人了！');
  await c.say('pangshigu', '將軍……');
  await c.say('zhuwen', '將軍喝醉了。');
  await c.say('likeyong', '我沒醉！我打退的敵人，你來收功勞！你手下那些降兵，當初見了我跑得比兔子還快！哈哈哈！');
  c.play('tense');
  await c.say('', '朱全忠沒有說話。\n他陪著笑，又倒了一杯酒。');
  await c.say('', '散席之後。\n朱全忠回到府中，一句話也沒說。');
  await c.say('yangyanhong', '節度使，此人不除，日後必為大患。');
  await c.say('yangyanhong', '他的大軍駐在城外，身邊只有三百親兵，今晚醉得不省人事。\n這種機會，一輩子只有一次。');
  await c.say('zhanghui', '你答應過我，要殺人之前先跟我說。');
  await c.say('zhuwen', '我現在跟你說了。');
  await c.say('zhanghui', '他剛幫你解了圍。天下人會怎麼看？');
  await c.say('zhuwen', '天下人只看誰活到最後。');
  await c.say('zhanghui', '……今晚是他。明天呢？');
  await c.say('zhuwen', '明天的事，明天再說。');
  const r = await c.choice(['下令', '再想一想'], '朱全忠要下令嗎？');
  if (r === 1) {
    await c.say('zhuwen', '……');
    await c.say('yangyanhong', '節度使，再過一個時辰他就要醒了。');
    await c.say('zhuwen', '……傳令吧。');
  }
  await nightStart(c);
}

async function nightStart(c) {
  c.set('nightOn'); c.set('rainNow');
  c.G.field.enter('shangyuan', 8, 15, 'up');
  c.s.respawn = { map: 'shangyuan', x: 2, y: 13 };
  c.play('battle');
  await c.say('', '三更。\n汴軍把上源驛團團圍住，放起了大火。');
  await c.say('zhuwen', '一個也不能走！');
  c.goal('殺進驛館，別讓李克用跑了');
  c.G.save();
  c.G.field.refresh();
}

async function sy(c, flag, name, line) {
  await c.say('bandit', line, name);
  if (await c.fight(flag)) { c.set(flag); c.G.save(); }
}

async function liBoss(c) {
  await c.say('', '史敬思帶著親兵在門口死戰。\n侍從用冷水潑醒了李克用，他提弓衝了出來。');
  await c.say('likeyong', '朱三！！！\n你這條賊狗，我就知道！');
  await c.say('zhuwen', '將軍酒醒了？');
  await c.say('', '就在這時，雷聲炸開。\n大雨澆滅了整座驛館的火。');
  await c.say('xietong', '將軍！下雨了，火計用不上了！快圍住他！');
  const r = await c.fight('syBoss', { music: 'boss' });
  if (!r) return;
  c.set('syDone');
  c.play('tense');
  await c.say('likeyong', '朱三！今夜的仇，我會要你朱家滿門來還！');
  await c.say('', '一道閃電照亮了院牆。\n李克用用繩子縋下尉氏門，消失在雨裡。\n三百親兵和監軍陳景思全死在驛館。');
  await c.say('yangyanhong', '節度使！胡人急了一定上馬！\n看見騎馬的就射，錯不了！');
  await c.say('zhuwen', '好。');
  await c.say('', '過了一會兒。\n黑暗裡，一個人騎著馬從巷口衝了出來。');
  await c.say('', '朱全忠拉滿了弓。');
  c.se('arrow');
  await c.wait(600);
  c.se('fall');
  await c.say('', '那個人從馬背上掉進積水裡。');
  await c.say('pangshigu', '將軍……那是楊彥洪。');
  await c.say('zhuwen', '……我知道。');
  await c.say('zhuwen', '他是朝廷的人，主意是他出的，事情也是他做的。\n給李克用寫信：今夜之事，全忠一概不知，都是楊彥洪與朝廷使者的主意。我已將他正法。');
  await c.say('xietong', '將軍，李克用不會信的。');
  await c.say('zhuwen', '我知道。但朝廷會信。朝廷也只能信。');
  c.set('rainNow', false);
  await morning(c);
}

async function morning(c) {
  c.play('sad');
  await c.go('bianzhou', 8, 6, 'up', { music: 'sad' });
  await c.say('', '雨停了。');
  await c.say('zhanghui', '聽說那一箭射得很準。');
  await c.say('zhuwen', '……');
  await c.say('zhanghui', '楊彥洪給你出主意的時候，你就想好了吧？');
  await c.say('zhuwen', '……你不是要我殺人前先跟你說嗎。這個是臨時想到的。');
  await c.say('zhanghui', '全忠。');
  await c.say('zhuwen', '嗯。');
  await c.say('zhanghui', '沒什麼。你去睡吧。');
  await c.say('', '李克用回到太原，上書朝廷，要求討伐朱全忠。\n朝廷不敢得罪任何一邊，只是封他做隴西郡王，不再過問。');
  await c.say('', '朱全忠與李克用的仇，從這一夜開始，打了四十年。\n一直打到兩個人都死了，兒子還在打。');
  // Huang Chao's end, told as the news reaches 汴州
  c.play('sad');
  await c.say('', '同年六月。\n泰山東南，狼虎谷。');
  await c.say('huangchao', '我這一輩子，考過科舉，賣過私鹽，做過皇帝。');
  await c.say('huangchao', '林言，把我的頭拿去，獻給時溥。\n你還能換一個富貴。');
  await c.say('', '黃巢死了。\n他的外甥林言提著他的頭下山，半路被沙陀兵搶去，也一起砍了。');
  await c.say('soldier_b', '報！黃巢的人頭已經送往成都！');
  await c.say('zhuwen', '……「待到秋來九月八。」');
  await c.say('pangshigu', '將軍在說什麼？');
  await c.say('zhuwen', '沒什麼。一首爛詩。');
  await c.say('zhuwen', '傳令下去。蔡州的秦宗權下一個就會打過來。準備打仗。');
  c.set('chapter3Clear');
  c.G.save();
  await ending(c);
}

async function ending(c) {
  c.play('ending');
  await c.card({ no: '第三章　完', name: '', year: '', text: '黃巢死了。\n唐朝還在。\n\n汴州城裡，有一個名叫「全忠」的人，已經開始看著長安的方向。' });
  await c.card({ no: '下一章', name: '蔡賊', year: '製作中', text: '秦宗權稱帝，圍攻汴州。\n一位叫敬翔的落魄文人走進了節度使府。\n\n這個版本到第三章為止。謝謝你玩到這裡。' });
  c.goal('第四章製作中。可以繼續在大地圖上走走');
  c.s.ch = 3;
  c.G.save();
}
