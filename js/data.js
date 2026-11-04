// All the game's numbers and names live here. After changing them run: node tools/sim.js
export const VERSION = '0.1.0';
export const CHANGELOG = [
  ['0.1.0', '第一個試玩版：歷陽軍營、渡江、牛渚、神亭單挑、曲阿城門。'],
];

// type: inf 步 / cav 騎 / arc 弓. g = growth per level.
export const GENERALS = {
  sunce: { name: '孫策', title: '江東之虎', type: 'cav', troops: 430, war: 88, int: 44, lead: 72, spd: 80, g: { troops: 52, war: 3, int: 1, lead: 2, spd: 2 }, skills: ['charge'] },
  zhouyu: { name: '周瑜', title: '少年軍師', type: 'arc', troops: 340, war: 58, int: 92, lead: 66, spd: 72, g: { troops: 38, war: 2, int: 3, lead: 2, spd: 2 }, skills: ['fire', 'water', 'rally'] },
  chengpu: { name: '程普', title: '三世老將', type: 'inf', troops: 480, war: 72, int: 62, lead: 84, spd: 52, g: { troops: 58, war: 2, int: 2, lead: 3, spd: 1 }, skills: ['regroup'] },
  huanggai: { name: '黃蓋', title: '鐵鞭猛將', type: 'inf', troops: 520, war: 80, int: 40, lead: 70, spd: 48, g: { troops: 62, war: 3, int: 1, lead: 2, spd: 1 }, skills: ['lastStand'] },
  taishici: { name: '太史慈', title: '東萊神射', type: 'arc', troops: 460, war: 94, int: 58, lead: 76, spd: 84, g: { troops: 50, war: 3, int: 2, lead: 2, spd: 2 }, skills: ['volley'] },
};
export const START_PARTY = ['sunce', 'chengpu', 'huanggai'];

export const ENEMIES = {
  foot: { name: '劉繇步卒', type: 'inf', troops: 340, war: 66, int: 20, lead: 30, spd: 38, exp: 24, gold: 12 },
  archer: { name: '劉繇弓手', type: 'arc', troops: 270, war: 70, int: 24, lead: 22, spd: 50, exp: 26, gold: 14 },
  rider: { name: '劉繇騎兵', type: 'cav', troops: 370, war: 74, int: 22, lead: 34, spd: 66, exp: 30, gold: 16 },
  yue: { name: '山中流寇', type: 'inf', troops: 240, war: 60, int: 16, lead: 22, spd: 44, exp: 18, gold: 18 },
  fanneng: { name: '樊能', type: 'cav', troops: 720, war: 84, int: 30, lead: 42, spd: 62, exp: 60, gold: 30, face: 'zhangying', general: true },
  zhangying: { name: '張英', type: 'inf', troops: 1250, war: 92, int: 44, lead: 52, spd: 54, exp: 120, gold: 80, face: 'zhangying', general: true, skills: ['drum'] },
  guard: { name: '曲阿守軍', type: 'inf', troops: 640, war: 92, int: 30, lead: 46, spd: 46, exp: 50, gold: 26 },
  gateArcher: { name: '城頭弓手', type: 'arc', troops: 500, war: 98, int: 30, lead: 36, spd: 58, exp: 52, gold: 28 },
  taishici: { name: '太史慈', type: 'arc', troops: 3200, war: 124, int: 58, lead: 66, spd: 84, exp: 300, gold: 200, face: 'taishici', general: true, persuade: true, skills: ['volley'] },
};

// kind: all / one / ally / allies / self. cost is taken from the shared 計 pool.
export const SKILLS = {
  charge: { name: '破陣衝鋒', kind: 'one', cost: 5, power: 1.7, by: 'war', desc: '單體 1.7 倍猛攻' },
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
  plain: { name: '平野', bg: 'bg_plain', fire: 1, water: 0.85, atk: { cav: 1.15 }, def: {} , note: '騎兵較強' },
  forest: { name: '林地', bg: 'bg_forest', fire: 1.5, water: 0.9, atk: { cav: 0.85, arc: 1.1 }, def: {}, note: '火計 ×1.5，騎兵受限' },
  ford: { name: '渡口', bg: 'bg_ford', fire: 0.7, water: 1.5, atk: { cav: 0.9 }, def: {}, note: '水計 ×1.5，火計減弱' },
  gate: { name: '城門', bg: 'bg_gate', fire: 1, water: 1, atk: {}, def: { inf: 1.15 }, note: '步兵防禦較高' },
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
};

export const CE_BASE = 22;       // the 計 pool at level 1
export const CE_PER_LEVEL = 2;   // ...and per level of the party's leader
export const EXP_BASE = 70;      // exp to next level = EXP_BASE * level
export const FALLEN_TROOPS = 0.15; // a fallen general comes back with this share of their troops after a win

// the fixed fights on the road, in order (the bot in tools/sim.js plays exactly these)
export const FIGHTS = {
  landing: { terrain: 'ford', foes: ['foot', 'foot'] },
  boss1: { terrain: 'ford', foes: ['zhangying', 'fanneng', 'archer'] },
  road1: { terrain: 'plain', foes: ['rider', 'archer', 'foot'] },
  road2: { terrain: 'forest', foes: ['foot', 'foot', 'archer'] },
  road3: { terrain: 'forest', foes: ['rider', 'rider', 'archer'] },
  road4: { terrain: 'plain', foes: ['guard', 'archer', 'rider'] },
  road5: { terrain: 'plain', foes: ['guard', 'gateArcher'] },
  final: { terrain: 'gate', foes: ['taishici', 'guard', 'gateArcher'] },
};
// random ones, only off the road
export const RANDOM = [['yue', 'yue'], ['yue', 'foot'], ['foot', 'archer']];

export const DUEL = { hp: 5, rounds: 7, tellChance: 0.75 };
