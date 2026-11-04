// 軍務: the party, formation, items, sound. Also the shop.
import { GENERALS, FORMATIONS, ITEMS, UPGRADES, TYPE_NAME, SKILLS, CHANGELOG, VERSION } from './data.js';
import { statsOf, needExp, ceMax } from './battle_core.js';
import { el, button, toast } from './ui.js';
import { se, isMuted, setMuted } from './audio.js';

export function openMenu(G) {
  const m = el('menu');
  m.hidden = false;
  G.busy = true;
  const close = () => { m.hidden = true; G.busy = false; G.save(); };
  let tab = 'party';
  const render = () => {
    const p = G.s.party;
    m.innerHTML = `<h2>軍務<span>錢 ${p.gold}　計 ${p.ce} / ${ceMax(p)}</span></h2>`;
    const tabs = document.createElement('div'); tabs.className = 'tabs';
    for (const [k, n] of [['party', '部隊'], ['form', '陣形'], ['item', '道具'], ['sys', '系統']]) tabs.appendChild(button(n, 'small' + (tab === k ? ' on' : ''), () => { tab = k; render(); }));
    m.appendChild(tabs);
    const body = document.createElement('div');
    if (tab === 'party') for (const mem of p.members) {
      const g = GENERALS[mem.id], st = statsOf(mem, p);
      const d = document.createElement('div'); d.className = 'gen';
      d.innerHTML = `<img src="assets/${mem.id}.png?v=1" alt="" draggable="false"><div><b>${g.name}</b><em>${g.title}</em></div>
        <div>Lv ${mem.lv}　${TYPE_NAME[g.type]}兵　經驗 ${mem.exp}/${needExp(mem.lv)}</div>
        <div class="bar"><i style="width:${mem.troops / st.max * 100}%"></i></div>
        <div>兵 ${mem.troops}/${st.max}　武 ${st.war}　智 ${st.int}　統 ${st.lead}<br><small>${g.skills.map((s) => SKILLS[s].name).join('、')}</small></div>`;
      body.appendChild(d);
    }
    if (tab === 'form') {
      for (const [id, f] of Object.entries(FORMATIONS)) body.appendChild(rowWith(`${f.name}陣`, f.desc, button(p.formation === id ? '使用中' : '換上', p.formation === id ? 'small red' : 'small', () => { p.formation = id; render(); })));
      body.insertAdjacentHTML('beforeend', '<p class="note">戰鬥中輪到第一位武將時，也可以按「換陣形」。</p>');
    }
    if (tab === 'item') {
      for (const [id, it] of Object.entries(ITEMS)) body.appendChild(rowWith(`${it.name} ×${p.items[id] || 0}`, it.desc));
      for (const [id, u] of Object.entries(UPGRADES)) if (p.upgrades[id]) body.appendChild(rowWith(u.name, u.desc));
      body.insertAdjacentHTML('beforeend', '<p class="note">軍糧和犒軍酒在戰鬥中用「道具」。到營火或路邊營地休整可免費補滿。</p>');
    }
    if (tab === 'sys') {
      body.appendChild(rowWith('聲音', '', button(isMuted() ? '開啟' : '關閉', 'small', () => { setMuted(!isMuted()); render(); })));
      const stack = document.createElement('div'); stack.className = 'stack';
      stack.appendChild(button('存檔', '', () => { G.save(); toast('已存檔'); }));
      stack.appendChild(button('回標題', '', () => { G.save(); m.hidden = true; G.busy = false; G.toTitle(); }));
      body.appendChild(stack);
      body.insertAdjacentHTML('beforeend', `<p class="note">《江東烽火》試玩版 v${VERSION}<br>${CHANGELOG.map(([v, t]) => `v${v}：${t}`).join('<br>')}</p>`);
    }
    m.appendChild(body);
    const st = document.createElement('div'); st.className = 'stack';
    st.appendChild(button('關閉', 'red', close));
    m.appendChild(st);
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
      m.innerHTML = `<h2>補給官<span>錢 ${p.gold}</span></h2><p class="note">${hello}</p>`;
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
