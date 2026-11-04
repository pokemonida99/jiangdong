// 序章 碭山少年：蕭縣劉家莊 → 碭山 → 芒碭山寨 → 回莊、離家。
export default {
  async begin(c) {
    await c.card({ no: '序章', name: '碭山少年', year: '唐・咸通五年～乾符四年', text: '宋州碭山有個塾師叫朱誠，教了一輩子五經，窮到死。\n\n他留下寡妻王氏和三個兒子。王氏帶著孩子投到蕭縣富戶劉崇家幫傭。\n\n老大朱全昱老實，老二朱存力氣大，老三朱溫什麼都不肯做。' });
    await c.say('', '乾符初年。\n關東連年大旱，蝗蟲蓋過了太陽。\n蕭縣，劉家莊。');
    await c.say('liuchong', '朱三！後院的柴呢？我養你們一家，是養來吃白飯的？');
    await c.say('zhuwen_y', '柴會自己長，急什麼。');
    await c.say('liuchong', '你這小子！');
    await c.say('', '劉崇舉起了棍子。');
    await c.say('liumu', '放下。');
    await c.say('liuchong', '娘，他——');
    await c.say('liumu', '朱三不是尋常人。你待他客氣些，將來有你的好處。');
    await c.say('zhuwen_y', '（這莊子裡，只有這位老太太正眼看過我。）');
    c.goal('去找二哥朱存');
    c.G.save();
  },
  canLeave: async (map, c) => {
    if (map === 'liuzhuang' && !c.flag('cunJoin')) { await c.say('zhuwen_y', '二哥說有事要找我。先找到他再出莊。'); return false; }
    return true;
  },
  noRandom: (c) => !c.flag('cunJoin'),
  own: (id) => (id === 'xiaoxian' || id === 'dangshan' ? 'neutral' : id === 'mangdang' ? 'foe' : null),
  npcs(map, add, c) {
    if (map === 'liuzhuang') {
      if (!c.flag('szDone')) add({ key: 'wangshi', x: 2, y: 7, dir: 'down', talk: async () => {
        await c.say('wangshi', '你爹教了一輩子書，沒教出一個肯讀書的。……也好，這年頭讀書人也餓死。');
      } });
      add({ key: 'liumu', x: 9, y: 3, dir: 'down', talk: async () => { await c.say('liumu', '又惹事了？去吧，別讓我兒子看見。'); } });
      add({ key: 'liuchong', x: 6, y: 3, dir: 'down', talk: async () => { await c.say('liuchong', '看什麼看？柴！'); } });
      add({ key: 'peasant', x: 3, y: 10, dir: 'right', talk: async () => { await c.say('peasant', '今年又旱。去年的租還欠著，山裡的賊倒先來收了。'); } });
      add({ key: 'peasant', x: 12, y: 10, dir: 'left', talk: async () => { await c.say('peasant', '聽說濮州那邊有人造反了。賣私鹽的，叫王仙芝。\n連賣鹽的都敢反，這世道是怎麼了。'); } });
      if (!c.flag('cunJoin')) add({ key: 'zhucun', x: 10, y: 8, dir: 'left', talk: async () => {
        await c.say('zhucun', '阿三，莊上運糧的車在芒碭山被劫了。劉崇說要從工錢裡扣。');
        await c.say('zhuwen_y', '咱們哪來的工錢？');
        await c.say('zhucun', '就是說啊。所以我想……');
        await c.say('zhuwen_y', '搶回來。\n不只糧車，那座山寨的人手，我也要了。');
        await c.say('zhucun', '……我本來只是想說去看看。');
        c.join('zhucun');
        c.set('cunJoin');
        c.toast('朱存 加入了隊伍');
        await c.say('', '用十字鍵走路，也可以直接點地圖上的位置。\n碰到人或箱子時按 A。\nB 是軍務，可以看部隊、地圖和道具。');
        c.goal('到西邊的碭山，打聽芒碭山的路', 'dangshan');
        c.G.save();
      } });
      if (c.flag('szDone') && !c.flag('leftHome')) add({ key: 'wangshi', x: 7, y: 5, dir: 'down', auto: true, talk: () => homeEnd(c) });
    }
    if (map === 'dangshan') {
      add({ key: 'peasant', x: 5, y: 5, dir: 'right', talk: async () => { await c.say('peasant', '張家又施粥了。要不是張家，這條街早沒人了。'); } });
      add({ key: 'peasant', x: 10, y: 5, dir: 'left', talk: async () => { await c.say('peasant', '張家小姐親自盛的粥，就是比別家的稠。'); } });
      add({ key: 'zhanghui', x: 7, y: 4, dir: 'down', talk: () => zhangTalk(c) });
    }
    if (map === 'shanzhai' && !c.flag('szBoss')) add({ key: 'bandit', x: 8, y: 2, dir: 'down', auto: true, anim: true, talk: () => szBoss(c) });
  },
  places: {
    xiaoxian: (c) => c.go('liuzhuang', 7, 11, 'up'),
    dangshan: (c) => c.go('dangshan', 7, 9, 'up'),
    mangdang: async (c) => {
      if (!c.flag('zhangMet')) { await c.say('zhuwen_y', '芒碭山這麼大，山寨到底在哪裡？先去碭山問問。'); return; }
      if (c.flag('szBoss')) { await c.say('zhuwen_y', '山寨已經是我們的了。回蕭縣吧。'); return; }
      await c.go('shanzhai', 8, 12, 'up');
    },
  },
};

async function zhangTalk(c) {
  if (c.flag('zhangMet')) { await c.say('zhanghui', '芒碭山在南邊。……小心些。'); return; }
  await c.say('zhanghui', '下一位。……你不是災民。');
  await c.say('zhuwen_y', '我是來打聽路的。芒碭山的賊寨怎麼走？');
  await c.say('zhanghui', '往南，看到山就是了。你這身打扮，是去投賊，還是去打賊？');
  await c.say('zhuwen_y', '看哪邊給飯吃。');
  await c.say('zhanghui', '……倒是老實。這些乾糧拿去，打架別空著肚子。');
  c.party.items.grain = (c.party.items.grain || 0) + 2;
  c.se('chest');
  c.toast('得到了 軍糧 ×2');
  await c.say('zhucun', '阿三，你臉紅什麼？');
  await c.say('zhuwen_y', '二哥，總有一天，我要娶這個女人。');
  await c.say('zhucun', '人家是碭山首富的女兒，你是劉家的長工。');
  await c.say('zhuwen_y', '所以才說總有一天。');
  c.set('zhangMet');
  c.goal('往南攻下芒碭山寨', 'mangdang');
  c.G.save();
}

async function szBoss(c) {
  await c.say('bandit', '哪來的兩個毛頭小子？糧車就在後面，有本事來拿！', '賊頭目');
  await c.say('zhucun', '阿三，他們人多。騎兵破弓手、弓手破步卒、步卒破騎兵，別打錯人。');
  const r = await c.fight('szBoss', { music: 'boss' });
  if (!r) return;
  await c.say('bandit', '還、還沒完！手下輸了，我可沒輸！敢不敢跟我一對一？', '賊頭目');
  await c.say('zhuwen_y', '正好。你們這些人，只服打贏的人。');
  await c.say('', '單挑：猜對方下一招。\n他的動作是提示，不過有時候是假的。');
  const d = await c.duel({ foeName: '賊頭目', foeSprite: 'bandit', foeFace: 'bandit', myName: '朱溫', mySprite: 'zhuwen_y', myFace: 'zhuwen_y', bg: 'bg2_forest' });
  await c.say('', d.won ? '朱溫一腳把賊頭目踹下了山坡。' : '兩人從寨門打到溝裡，渾身是泥。最後站起來的是朱溫。');
  d.close();
  c.play('castle');
  await c.say('bandit', '……服了。兄弟們，從今天起，這位是寨主！', '賊頭目');
  await c.say('zhucun', '阿三，咱們是來搶糧車的，你怎麼搶了一座山寨？');
  await c.say('zhuwen_y', '糧車吃得完。人手吃不完。');
  c.set('szBoss'); c.set('szDone');
  c.gain(80);
  c.toast('寨中財物：錢 +80');
  c.goal('把糧車送回蕭縣劉家莊', 'xiaoxian');
  c.G.save();
}

async function homeEnd(c) {
  c.set('leftHome');
  c.play('sad');
  await c.card({ no: '', name: '', year: '三年後　乾符四年', text: '朱溫沒有回劉家當長工。\n他和朱存在黃河與淮河之間做起了盜魁，手下有了幾百人。\n\n同一年，黃巢的大軍打到了宋州。' });
  await c.say('zhuwen_y', '娘，我和二哥要去投黃巢。');
  await c.say('wangshi', '你爹要是活著，會打斷你的腿。');
  await c.say('zhuwen_y', '等我回來，娘就不用再幫人洗衣服了。');
  await c.say('wangshi', '我不要你回來讓我享福。\n你們兄弟倆，都給我活著回來。');
  await c.say('zhucun', '娘，放心，我會看著阿三。');
  await c.say('liumu', '朱三，去吧。老婆子這雙眼睛，還沒看錯過人。');
  await c.nextChapter();
}
