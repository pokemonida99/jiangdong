// Dialogue, choices and small notices, on top of the canvas.
import { se } from './audio.js';
const $ = (id) => document.getElementById(id);
const FACES = { sunce: '孫策', zhouyu: '周瑜', chengpu: '程普', huanggai: '黃蓋', taishici: '太史慈', zhangying: '張英', liuyao: '劉繇', soldier: '補給官' };
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

let skip = 1;
export const setTextSpeed = (v) => { skip = v; };

// say('sunce', 'text') / say('', 'narration') / say('soldier', 'text', '守營老兵'): waits for a tap
export function say(face, text, name) {
  const d = $('dialog'), f = $('face'), who = $('who'), line = $('line'), more = $('more');
  d.hidden = false;
  f.hidden = !face;
  if (face) f.src = `assets/${face}.png?v=1`;
  who.textContent = name ?? FACES[face] ?? '';
  line.textContent = ''; more.hidden = true;
  return new Promise((res) => {
    let i = 0, done = false, t = null;
    const finish = () => { clearInterval(t); done = true; line.textContent = text; more.hidden = false; };
    if (window.__fastText) finish();
    else t = setInterval(() => {
      i += skip; line.textContent = text.slice(0, i);
      if (i % 3 === 0) se('text');
      if (i >= text.length) finish();
    }, 26);
    const on = (e) => {
      e.preventDefault();
      if (!done) { finish(); return; }
      d.removeEventListener('pointerdown', on); document.getElementById('stage').removeEventListener('pointerdown', on);
      se('tap');
      d.hidden = true;
      res();
    };
    // anywhere on the screen moves the story along
    setTimeout(() => { document.getElementById('stage').addEventListener('pointerdown', on); }, 60);
  });
}

// choice(['a', 'b']) resolves with the index
export function choice(opts) {
  const c = $('choices');
  c.innerHTML = '';
  c.hidden = false;
  return new Promise((res) => {
    opts.forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'plaque' + (i === 0 ? ' red' : '');
      b.textContent = o;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); se('tap'); c.hidden = true; res(i); });
      c.appendChild(b);
    });
  });
}

let toastT = null;
export function toast(text, ms = 2200) {
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
