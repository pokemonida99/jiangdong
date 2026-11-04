// All the game's numbers and names live here. After changing them run: node tools/sim.js
export const VERSION = '0.2.0';
export const CHANGELOG = [
  ['0.2.0', '改題材：《奪唐：朱全忠傳》。FC 8-bit 畫面、中國大地圖、章節與城堡關卡，做到第三章上源驛。'],
  ['0.1.0', '第一個試玩版（孫策渡江）。'],
];

// type: inf 步 / cav 騎 / arc 弓. g = growth per level. learn: skills that come with a level.
export const GENERALS = {
  zhuwen: { name: '朱溫', title: '碭山朱三', type: 'cav', troops: 430, war: 84, int: 60, lead: 72, spd: 76, g: { troops: 52, war: 3, int: 2, lead: 2, spd: 2 }, skills: ['charge'], learn: { rally: 9 } },
  zhucun: { name: '朱存', title: '朱家二哥', type: 'inf', troops: 520, war: 76, int: 28, lead: 58, spd: 48, g: { troops: 60, war: 3, int: 1, lead: 2, spd: 1 }, skills: ['lastStand'] },
  pangshigu: { name: '龐師古', title: '沉穩老卒', type: 'inf', troops: 500, war: 70, int: 58, lead: 82, spd: 50, g: { troops: 58, war: 2, int: 2, lead: 3, spd: 1 }, skills: ['regroup'] },
  zhuzhen: { name: '朱珍', title: '衝陣騎將', type: 'cav', troops: 410, war: 88, int: 34, lead: 60, spd: 82, g: { troops: 46, war: 3, int: 1, lead: 2, spd: 2 }, skills: ['raid'] },
  xietong: { name: '謝瞳', title: '落第軍師', type: 'arc', troops: 340, war: 54, int: 90, lead: 62, spd: 68, g: { troops: 38, war: 2, int: 3, lead: 2, spd: 2 }, skills: ['fire', 'water', 'rally'] },
  gecongzhou: { name: '葛從周', title: '分身將軍', type: 'arc', troops: 450, war: 86, int: 66, lead: 76, spd: 78, g: { troops: 50, war: 3, int: 2, lead: 2, spd: 2 }, skills: ['volley', 'charge'] },
};
export const LOOKS = { zhuwen_y: '朱溫', zhuwen: '朱全忠' };

// a tier is how far into the story a soldier belongs; the numbers grow from it, so a chapter only says which tier it uses
function tr(t, type, name, extra = {}) {
  const n = Math.round;
  return { name, type, troops: n(210 + 66 * t), war: n(58 + 7 * t), int: n(20 + 3 * t), lead: n(24 + 5 * t), spd: n(36 + 4 * t + (type === 'cav' ? 18 : type === 'arc' ? 8 : 0)), exp: n(20 + 9 * t), gold: n(6 + 2.5 * t), ...extra };
}
function boss(t, type, name, face, extra = {}) {
  const n = Math.round;
  return { ...tr(t, type, name), troops: n(560 + 150 * t), war: n(66 + 7 * t), lead: n(36 + 5 * t), exp: n(70 + 40 * t), gold: n(30 + 12 * t), face, sprite: face, general: true, ...extra };
}
export const ENEMIES = {
  // 序章
  bandit: tr(0, 'inf', '山賊', { team: 'black', sprite: 'bandit' }),
  banditArc: tr(0, 'arc', '賊弓手', { team: 'black' }),
  banditChief: boss(0.4, 'inf', '賊頭目', 'bandit', { team: 'black', exp: 90, gold: 60 }),
  // 第一章：一路上遇到的唐軍
  tangFoot: tr(2, 'inf', '唐軍步卒', { team: 'blue' }),
  tangArc: tr(2, 'arc', '唐軍弓手', { team: 'blue' }),
  tangCav: tr(2, 'cav', '唐軍騎兵', { team: 'blue' }),
  southFoot: tr(3.2, 'inf', '嶺南守卒', { team: 'blue' }),
  southArc: tr(3.2, 'arc', '城頭弓手', { team: 'blue' }),
  liyao: boss(3.6, 'inf', '李迢', 'liyao', { team: 'blue', sprite: 'soldier_t', skills: ['drum'] }),
  passFoot: tr(5, 'inf', '潼關守卒', { team: 'blue' }),
  passArc: tr(5, 'arc', '潼關弓手', { team: 'blue' }),
  zhangchengfan: boss(5.2, 'inf', '張承範', 'soldier_t', { team: 'blue', sprite: 'soldier_t', skills: ['drum'] }),
  // 第二章
  tongFoot: tr(6.5, 'inf', '同州守軍', { team: 'blue' }),
  tongArc: tr(6.5, 'arc', '同州弓手', { team: 'blue' }),
  micheng: boss(6.5, 'arc', '米誠', 'mishen', { team: 'blue', sprite: 'soldier_t' }),
  rebelGuard: tr(7.5, 'inf', '監軍親兵', { team: 'yellow' }),
  yanshi: boss(7.5, 'arc', '嚴實', 'yanshi', { team: 'yellow', skills: ['volley'] }),
  // 第三章
  chaoFoot: tr(9, 'inf', '巢軍步卒', { team: 'yellow' }),
  chaoArc: tr(9, 'arc', '巢軍弓手', { team: 'yellow' }),
  chaoCav: tr(9, 'cav', '巢軍騎兵', { team: 'yellow' }),
  shangrang: boss(10, 'cav', '尚讓', 'shangrang', { team: 'yellow', skills: ['drum'] }),
  gecongzhou: boss(10.6, 'arc', '葛從周', 'gecongzhou', { team: 'yellow', persuade: true, skills: ['volley'] }),
  shatuoFoot: tr(11.5, 'inf', '沙陀親兵', { team: 'black' }),
  shatuoCav: tr(11.5, 'cav', '鴉軍騎兵', { team: 'black' }),
  likeyong: boss(12.5, 'cav', '李克用', 'likeyong', { team: 'black', flee: 0.4, skills: ['volley', 'drum'] }),
  // 路上的散兵
  stray: tr(1, 'inf', '流寇', { team: 'black' }),
  strayArc: tr(1, 'arc', '流寇弓手', { team: 'black' }),
};

// kind: all / one / ally / allies / self. cost is taken from the shared 計 pool.
export const SKILLS = {
  charge: { name: '破陣衝鋒', kind: 'one', cost: 5, power: 1.7, by: 'war', desc: '單體 1.7 倍猛攻' },
  raid: { name: '突騎', kind: 'all', cost: 7, power: 0.72, by: 'war', desc: '騎兵掃過敵全體' },
  fire: { name: '火攻', kind: 'all', cost: 8, base: 26, rate: 0.9, el: 'fire', desc: '敵全體火計，林地更強' },
  water: { name: '決水', kind: 'all', cost: 8, base: 26, rate: 0.9, el: 'water', desc: '敵全體水計，渡口更強' },
  rally: { name: '鼓舞', kind: 'allies', cost: 6, turns: 3, up: 1.25, desc: '我方全體攻擊 ×1.25，3 回合' },
  regroup: { name: '整軍', kind: 'ally', cost: 5, heal: 3.2, desc: '收攏一隊，回復兵力' },
  lastStand: { name: '死戰', kind: 'self', cost: 4, power: 1.3, by: 'war', desc: '兵越少傷害越高的單體攻擊' },
  volley: { name: '連珠箭', kind: 'all', cost: 6, power: 0.62, by: 'war', desc: '箭雨射向敵全體' },
  drum: { name: '催軍鼓', kind: 'allies', cost: 0, turns: 2, up: 1.2, desc: '' },
};

export const FORMATIONS = {
  fengshi: { name: '鋒矢', atk: 1.2, def: 0.85, spd: 1, desc: '攻擊高，防禦低' },
  fangyuan: { name: '方圓', atk: 0.9, def: 1.25, spd: 0.95, desc: '防禦高，攻擊低' },
  heyi: { name: '鶴翼', atk: 1, def: 1, spd: 1.2, desc: '攻防平均，行動較快' },
};

export const TERRAIN = {
  plain: { name: '平野', bg: 'bg2_plain', fire: 1, water: 0.85, atk: { cav: 1.15 }, def: {}, note: '騎兵較強' },
  forest: { name: '林地', bg: 'bg2_forest', fire: 1.5, water: 0.9, atk: { cav: 0.85, arc: 1.1 }, def: {}, note: '火計 ×1.5，騎兵受限' },
  ford: { name: '渡口', bg: 'bg2_ford', fire: 0.7, water: 1.5, atk: { cav: 0.9 }, def: {}, note: '水計 ×1.5，火計減弱' },
  gate: { name: '城門', bg: 'bg2_gate', fire: 1, water: 1, atk: {}, def: { inf: 1.15 }, note: '步兵防禦較高' },
  hall: { name: '城內', bg: 'bg2_hall', fire: 1.2, water: 0.7, atk: { cav: 0.85 }, def: { inf: 1.1 }, note: '騎兵施展不開' },
  night: { name: '雨夜', bg: 'bg2_night', fire: 0.3, water: 1.4, atk: { arc: 0.8 }, def: {}, note: '大雨：火計幾乎無效，弓兵減弱' },
  pass: { name: '關隘', bg: 'bg2_pass', fire: 1, water: 0.6, atk: { cav: 0.85, arc: 1.15 }, def: {}, note: '弓兵較強，騎兵受限' },
  south: { name: '嶺南', bg: 'bg2_south', fire: 1.2, water: 1.2, atk: {}, def: {}, note: '濕熱之地，水火都強' },
};

export const TYPE_NAME = { inf: '步', cav: '騎', arc: '弓' };
export const BEATS = { cav: 'arc', arc: 'inf', inf: 'cav' };

export const ITEMS = {
  grain: { name: '軍糧', price: 30, kind: 'heal', amount: 320, desc: '一隊回復 320 兵力' },
  wine: { name: '犒軍酒', price: 50, kind: 'ce', amount: 12, desc: '計 回復 12' },
};
export const UPGRADES = {
  spear: { name: '鐵矛', price: 180, stat: 'war', amount: 6, desc: '全軍武力 +6' },
  armor: { name: '札甲', price: 200, stat: 'lead', amount: 8, desc: '全軍統率 +8' },
  blade: { name: '陌刀', price: 620, stat: 'war', amount: 10, desc: '全軍武力再 +10' },
  plate: { name: '鐵甲', price: 680, stat: 'lead', amount: 12, desc: '全軍統率再 +12' },
};

export const CE_BASE = 22;       // the 計 pool at level 1
export const CE_PER_LEVEL = 2;   // ...and per level of the party's leader
export const EXP_BASE = 70;      // exp to next level = EXP_BASE * level
export const FALLEN_TROOPS = 0.15; // a fallen general comes back with this share of their troops after a win
export const PARTY_MAX = 4;

// every fixed fight in the order the story plays them (tools/sim.js plays exactly these)
export const FIGHTS = {
  // 序章
  sz1: { terrain: 'forest', foes: ['bandit'] },
  sz2: { terrain: 'forest', foes: ['bandit', 'banditArc'] },
  sz3: { terrain: 'forest', foes: ['bandit', 'bandit'] },
  szBoss: { terrain: 'forest', foes: ['banditChief', 'banditArc'] },
  // 第一章
  gz1: { terrain: 'south', foes: ['southFoot', 'southArc'] },
  gz2: { terrain: 'south', foes: ['southFoot', 'southFoot', 'southArc'] },
  gz3: { terrain: 'hall', foes: ['southArc', 'southFoot'] },
  gz4: { terrain: 'hall', foes: ['southFoot', 'southFoot', 'southArc'] },
  gzBoss: { terrain: 'hall', foes: ['liyao', 'southArc', 'southFoot'] },
  tg1: { terrain: 'pass', foes: ['passFoot', 'passArc'] },
  tg2: { terrain: 'pass', foes: ['passFoot', 'passFoot', 'passArc'] },
  tg3: { terrain: 'pass', foes: ['passArc', 'passArc', 'passFoot'] },
  tgBoss: { terrain: 'gate', foes: ['zhangchengfan', 'passArc', 'passFoot'] },
  // 第二章
  tz1: { terrain: 'gate', foes: ['tongFoot', 'tongArc'] },
  tz2: { terrain: 'hall', foes: ['tongFoot', 'tongFoot', 'tongArc'] },
  tz3: { terrain: 'hall', foes: ['tongArc', 'tongFoot'] },
  tzBoss: { terrain: 'hall', foes: ['micheng', 'tongFoot', 'tongArc'] },
  yan: { terrain: 'hall', foes: ['yanshi', 'rebelGuard', 'rebelGuard'] },
  // 第三章
  chen1: { terrain: 'plain', foes: ['chaoFoot', 'chaoArc', 'chaoCav'] },
  chen2: { terrain: 'plain', foes: ['shangrang', 'chaoCav', 'chaoArc'] },
  wm1: { terrain: 'ford', foes: ['chaoFoot', 'chaoFoot', 'chaoArc'] },
  wmBoss: { terrain: 'ford', foes: ['gecongzhou', 'chaoArc', 'chaoFoot'] },
  sy1: { terrain: 'night', foes: ['shatuoFoot', 'shatuoFoot'] },
  sy2: { terrain: 'night', foes: ['shatuoCav', 'shatuoFoot', 'shatuoFoot'] },
  syBoss: { terrain: 'night', foes: ['likeyong', 'shatuoCav', 'shatuoFoot'] },
};
// stray fights on the great map, off the road, by chapter
export const RANDOM = {
  0: [['bandit'], ['bandit', 'banditArc']],
  1: [['stray', 'stray'], ['stray', 'strayArc'], ['tangFoot', 'tangArc'], ['tangFoot', 'tangCav']],
  2: [['tangFoot', 'tangArc', 'tangCav'], ['tangCav', 'tangCav'], ['tangFoot', 'tangFoot', 'tangArc']],
  3: [['chaoFoot', 'chaoArc'], ['chaoCav', 'chaoFoot'], ['chaoFoot', 'chaoFoot']],
};

export const DUEL = { hp: 5, rounds: 7, tellChance: 0.75 };

// the whole road, shown in the 章節 list; only what's built can be played
export const CHAPTERS = [
  { no: '序章', name: '碭山少年', year: '864～877', built: true },
  { no: '第一章', name: '衝天', year: '877～881', built: true },
  { no: '第二章', name: '全忠', year: '882～883', built: true },
  { no: '第三章', name: '上源驛', year: '884', built: true },
  { no: '第四章', name: '蔡賊', year: '885～889' },
  { no: '第五章', name: '二朱', year: '889～897' },
  { no: '第六章', name: '清口', year: '897' },
  { no: '第七章', name: '河北', year: '898～902' },
  { no: '第八章', name: '天子', year: '901～904' },
  { no: '第九章', name: '奪唐', year: '905～907' },
  { no: '終幕', name: '五代十國', year: '908～912' },
];
