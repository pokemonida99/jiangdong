// 軍務: the party, formation, items, the chapter list and sound. Also the shop and the map of all China.
import { GENERALS, FORMATIONS, ITEMS, UPGRADES, TYPE_NAME, SKILLS, CHANGELOG, VERSION, CHAPTERS, PARTY_MAX } from './data.js';
import { statsOf, needExp, ceMax, skillsOf, nameOf, lookOf } from './battle_core.js';
import { el, button, toast } from './ui.js';
import { faceSrc, pixelText } from './art.js';
import { WORLD, WW, WH } from './world.js';
import { se, isMuted, setMuted } from './audio.js';

// every map tile as one colour: the whole of China on one screen
const MINI = { '.': '#58d854', ',': '#f8d878', d: '#fce0a8', o: '#00a800', T: '#005800', M: '#ac7c00', H: '#7c7c7c', W: '#0058f8', r: '#3cbcfc', R: '#fcfcfc', B: '#fcfcfc', C: '#f83800', V: '#f8b800', A: '#f8b800' };
function drawBigMap(G) {
  const k = 3, cv = document.createElement('canvas');
  cv.id = 'bigmap'; cv.width = WW * k; cv.height = WH * k;
  const c = cv.getContext('2d');
  WORLD.rows.forEach((r, y) => [...r].forEach((t, x) => { c.fillStyle = MINI[t] || '#58d854'; c.fillRect(x * k, y * k, k, k); }));
  const label = (t, x, y, col) => pixelText(c, t, x, y, col, 'left');
  for (const p of Object.values(WORLD.places)) {
    const own = G.story.ownerOf(p.id);
    c.fillStyle = '#000000'; c.fillRect(p.x * k - 2, p.y * k - 2, 7, 7);
    c.fillStyle = own === 'me' ? '#f83800' : own === 'foe' ? '#3cbcfc' : '#fcfcfc'; c.fillRect(p.x * k - 1, p.y * k - 1, 5, 5);
    if (p.kind === 'c' && ['changan', 'luoyang', 'bianzhou', 'guangzhou', 'taiyuan', 'youzhou', 'yangzhou', 'chengdu', 'caizhou', 'xuzhou', 'hangzhou', 'jingzhou', 'fengxiang'].includes(p.id)) label(p.name, p.x * k + 5, p.y * k + 4, '#fcfcfc');
  }
  const goal = WORLD.places[G.s.goalPlace];
  if (goal) { label(goal.name, goal.x * k + 5, goal.y * k + 4, '#f8b800'); c.strokeStyle = '#f8b800'; c.lineWidth = 2; c.strokeRect(goal.x * k - 4, goal.y * k - 4, 11, 11); }
  if (G.field.map === 'world') { c.fillStyle = '#000000'; c.fillRect(G.field.x * k - 3, G.field.y * k - 3, 9, 9); c.fillStyle = '#f8f8f8'; c.fillRect(G.field.x * k - 2, G.field.y * k - 2, 7, 7); c.fillStyle = '#f83800'; c.fillRect(G.field.x * k, G.field.y * k, 3, 3); }
  return cv;
}

export function openMenu(G, first = 'party') {
  const m = el('menu');
  m.hidden = false;
  G.busy = true;
  const close = () => { m.hidden = true; G.busy = false; G.save(); G.renderHud(); };
  let tab = first;
  const render = () => {
    const p = G.s.party;
    m.innerHTML = `<h2>軍務<span>錢 ${p.gold}　計 ${p.ce} / ${ceMax(p)}</span></h2>`;
    const tabs = document.createElement('div'); tabs.className = 'tabs';
    for (const [k, n] of [['party', '部隊'], ['form', '陣形'], ['item', '道具'], ['map', '地圖'], ['ch', '章節'], ['sys', '系統']]) tabs.appendChild(button(n, 'small' + (tab === k ? ' on' : ''), () => { tab = k; render(); }));
    m.appendChild(tabs);
    const body = document.createElement('div');
    if (tab === 'party') {
      const card = (mem, reserve) => {
        const g = GENERALS[mem.id], st = statsOf(mem, p);
        const d = document.createElement('div'); d.className = 'gen';
        d.innerHTML = `<img src="${faceSrc(lookOf(mem.id, p))}" alt="" draggable="false"><div><b>${nameOf(mem, p)}</b><em>${g.title}${reserve ? '・後備' : ''}</em></div>
          <div>Lv ${mem.lv}　${TYPE_NAME[g.type]}兵　經驗 ${mem.exp}/${needExp(mem.lv)}</div>
          <div class="bar"><i style="width:${mem.troops / st.max * 100}%"></i></div>
          <div>兵 ${mem.troops}/${st.max}　武 ${st.war}　智 ${st.int}　統 ${st.lead}<br><small>${skillsOf(mem).map((s) => SKILLS[s].name).join('、')}</small></div>`;
        return d;
      };
      p.members.forEach((mem, i) => {
        const d = card(mem, false);
        if (i > 0 && (p.reserve || []).length) d.appendChild(button('下場', 'small', () => { p.members.splice(i, 1); p.reserve.push(mem); render(); }));
        body.appendChild(d);
      });
      for (const mem of p.reserve || []) {
        const d = card(mem, true);
        d.appendChild(button('上場', p.members.length < PARTY_MAX ? 'small red' : 'small dim', () => {
          if (p.members.length >= PARTY_MAX) { toast('上場最多四人，先讓一位下場'); return; }
          p.reserve.splice(p.reserve.indexOf(mem), 1); p.members.push(mem); render();
        }));
        body.appendChild(d);
      }
    }
    if (tab === 'form') {
      for (const [id, f] of Object.entries(FORMATIONS)) body.appendChild(rowWith(`${f.name}陣`, f.desc, button(p.formation === id ? '使用中' : '換上', p.formation === id ? 'small red' : 'small', () => { p.formation = id; render(); })));
      body.insertAdjacentHTML('beforeend', '<p class="note">戰鬥中輪到第一位武將時，也可以按「換陣形」。</p>');
    }
    if (tab === 'item') {
      for (const [id, it] of Object.entries(ITEMS)) body.appendChild(rowWith(`${it.name} ×${p.items[id] || 0}`, it.desc));
      for (const [id, u] of Object.entries(UPGRADES)) if (p.upgrades[id]) body.appendChild(rowWith(u.name, u.desc));
      body.insertAdjacentHTML('beforeend', '<p class="note">軍糧和犒軍酒在戰鬥中用「道具」。到烽火台或進城休息可以免費補滿。</p>');
    }
    if (tab === 'map') {
      body.appendChild(drawBigMap(G));
      body.insertAdjacentHTML('beforeend', '<p class="note">白框紅點是你；黃框是下一個目標。紅點城市屬於我方，藍點是敵軍。走大路不會遇敵。</p>');
    }
    if (tab === 'ch') {
      CHAPTERS.forEach((c, i) => {
        const now = i === G.s.ch, done = i < G.s.ch;
        const r = rowWith(`${c.no}　${c.built || done || now ? c.name : '？？？'}`, c.year);
        r.classList.add(now ? 'now' : done ? 'done' : 'locked');
        const tag = document.createElement('span'); tag.textContent = now ? '進行中' : done ? '完成' : c.built ? '' : '製作中'; r.appendChild(tag);
        body.appendChild(r);
      });
    }
    if (tab === 'sys') {
      body.appendChild(rowWith('聲音', '', button(isMuted() ? '開啟' : '關閉', 'small', () => { setMuted(!isMuted()); render(); })));
      const stack = document.createElement('div'); stack.className = 'stack';
      stack.appendChild(button('存檔', '', () => { G.save(); toast('已存檔'); }));
      stack.appendChild(button('回標題', '', () => { G.save(); m.hidden = true; G.busy = false; G.toTitle(); }));
      body.appendChild(stack);
      body.insertAdjacentHTML('beforeend', `<p class="note">《奪唐：朱全忠傳》v${VERSION}<br>${CHANGELOG.map(([v, t]) => `v${v}：${t}`).join('<br>')}</p>`);
    }
    m.appendChild(body);
    const st = document.createElement('div'); st.className = 'stack';
    st.appendChild(button('關閉', 'red', close));
    m.appendChild(st);
    m.scrollTop = 0;
  };
  render();
}
function rowWith(title, sub, btn) {
  const r = document.createElement('div'); r.className = 'row';
  r.innerHTML = `<div>${title}${sub ? `<small>${sub}</small>` : ''}</div>`;
  if (btn) r.appendChild(btn);
  return r;
}

export function openShop(G, hello) {
  return new Promise((res) => {
    const m = el('menu');
    m.hidden = false;
    const close = () => { m.hidden = true; G.save(); res(); };
    const render = () => {
      const p = G.s.party;
      m.innerHTML = `<h2>軍需<span>錢 ${p.gold}</span></h2><p class="note">${hello}</p>`;
      const buy = (price, fn) => {
        if (p.gold < price) { toast('錢不夠'); return; }
        p.gold -= price; fn(); se('coin'); render();
      };
      for (const [id, it] of Object.entries(ITEMS)) m.appendChild(rowWith(`${it.name}（持有 ${p.items[id] || 0}）`, it.desc, button(`${it.price} 錢`, p.gold >= it.price ? 'small' : 'small dim', () => buy(it.price, () => { p.items[id] = (p.items[id] || 0) + 1; }))));
      for (const [id, u] of Object.entries(UPGRADES)) m.appendChild(rowWith(u.name, u.desc, p.upgrades[id] ? button('已配發', 'small dim') : button(`${u.price} 錢`, p.gold >= u.price ? 'small' : 'small dim', () => buy(u.price, () => { p.upgrades[id] = true; }))));
      const st = document.createElement('div'); st.className = 'stack';
      st.appendChild(button('離開', 'red', close));
      m.appendChild(st);
    };
    render();
  });
}
