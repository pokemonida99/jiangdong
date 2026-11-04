// Dialogue, choices, chapter cards and small notices. The words live under the picture, never on top of it.
import { se } from './audio.js';
import { faceSrc } from './art.js';
const $ = (id) => document.getElementById(id);
export const FACES = {
  zhuwen_y: '朱溫', zhuwen: '朱全忠', zhanghui: '張惠', likeyong: '李克用', zhucun: '朱存', wangshi: '王氏', liuchong: '劉崇', liumu: '劉母', huangchao: '黃巢', mengkai: '孟楷', yanshi: '嚴實', xietong: '謝瞳',
  pangshigu: '龐師古', zhuzhen: '朱珍', gecongzhou: '葛從周', jingxiang: '敬翔', wangchongrong: '王重榮', yangyanhong: '楊彥洪', shangrang: '尚讓', liyao: '李迢', mishen: '米誠', envoy: '內侍', peasant: '佃農', soldier_b: '士兵', soldier_r: '巢軍士兵', soldier_t: '唐軍士兵', bandit: '山賊',
};
export const el = $;
// a tap that doesn't fire when the finger was scrolling; pointer events also stay clear of the double-tap guard
export function onTap(node, fn) {
  let sx = 0, sy = 0, armed = false;
  node.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; armed = true; });
  node.addEventListener('pointerup', (e) => { if (armed && Math.hypot(e.clientX - sx, e.clientY - sy) < 14) { e.preventDefault(); fn(e); } armed = false; });
  node.addEventListener('pointercancel', () => { armed = false; });
}
export function button(label, cls, fn, sub) {
  const b = document.createElement('button');
  b.className = 'plaque ' + (cls || '');
  b.textContent = label;
  if (sub) { const s = document.createElement('small'); s.textContent = sub; b.appendChild(s); }
  if (fn) onTap(b, () => { se('tap'); fn(); });
  return b;
}
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// say('zhucun', 'text') / say('', 'narration') / say('soldier_b', 'text', '守營老兵'): waits for a tap
export function say(face, text, name) {
  const d = $('dialog'), f = $('face'), who = $('who'), line = $('line'), more = $('more');
  d.hidden = false;
  d.className = face ? '' : 'narr';
  f.hidden = !face;
  if (face) f.src = faceSrc(face);
  who.textContent = name ?? FACES[face] ?? '';
  line.textContent = ''; more.hidden = true;
  return new Promise((res) => {
    let i = 0, done = false, t = null;
    const stage = $('stage');
    const finish = () => { clearInterval(t); done = true; line.textContent = text; more.hidden = false; };
    if (window.__fastText) finish();
    else t = setInterval(() => {
      i++; line.textContent = text.slice(0, i);
      if (i % 2 === 0) se('text');
      if (i >= text.length) finish();
    }, 34);
    const on = (e) => {
      e.preventDefault();
      if (!done) { finish(); return; }
      stage.removeEventListener('pointerdown', on); removeEventListener('keydown', onKey);
      se('tap');
      d.hidden = true;
      res();
    };
    const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'z') on(e); };
    // anywhere on the screen moves the story along
    setTimeout(() => { stage.addEventListener('pointerdown', on); addEventListener('keydown', onKey); }, 60);
  });
}

// choice(['a', 'b']) resolves with the index. Sits in the window below the picture.
export function choice(opts, prompt) {
  const c = $('choices'), d = $('dialog');
  c.innerHTML = '';
  c.hidden = false;
  if (prompt) { d.hidden = false; d.className = 'narr'; $('face').hidden = true; $('who').textContent = ''; $('line').textContent = prompt; $('more').hidden = true; }
  return new Promise((res) => {
    opts.forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'plaque' + (i === 0 ? ' red' : '');
      b.textContent = o;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); se('tap'); c.hidden = true; d.hidden = true; res(i); });
      c.appendChild(b);
    });
  });
}

let toastT = null;
export function toast(text, ms = 2600) {
  const t = $('toast');
  t.textContent = text; t.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { t.hidden = true; }, ms);
}

export async function fade(on, ms = 300) {
  const f = $('fade');
  if (on) { f.hidden = false; f.style.opacity = 0; f.getBoundingClientRect(); f.style.opacity = 1; await wait(ms); }
  else { f.style.opacity = 0; await wait(ms); f.hidden = true; }
}

// the black screen between chapters
export function chapterCard({ no, name, year, text }) {
  const c = $('card');
  c.hidden = false;
  c.innerHTML = '';
  const add = (cls, t) => { if (!t) return; const n = document.createElement('div'); n.className = cls; n.textContent = t; c.appendChild(n); };
  add('no', no); add('nm', name); add('yr', year); add('tx', text); add('go', '點一下繼續');
  return new Promise((res) => {
    setTimeout(() => {
      const on = (e) => { e.preventDefault(); c.removeEventListener('pointerdown', on); se('tap'); c.hidden = true; res(); };
      c.addEventListener('pointerdown', on);
    }, window.__fastText ? 0 : 500);
  });
}
