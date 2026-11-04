// Everything you hear is synthesised here: original tunes on a pentatonic scale, plucked strings, a bowed lead, drums.
let ac = null, master = null, muted = false;
try { muted = localStorage.getItem('jd-mute') === '1'; } catch (e) { /* private mode */ }

export function unlock() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume();
  if (want && !song) play(want);
}
export const isMuted = () => muted;
export function setMuted(v) {
  muted = v;
  try { localStorage.setItem('jd-mute', v ? '1' : '0'); } catch (e) { /* private mode */ }
  if (master) master.gain.value = v ? 0 : 0.5;
}

const PENTA = [0, 2, 4, 7, 9];
const hz = (root, deg) => { const o = Math.floor(deg / 5), n = ((deg % 5) + 5) % 5; return 440 * Math.pow(2, (root + o * 12 + PENTA[n] - 69) / 12); };

function pluck(t, f, vol, dur = 0.5) {
  const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain();
  o.type = 'triangle'; o2.type = 'square'; o.frequency.value = f; o2.frequency.value = f * 2;
  const g2 = ac.createGain(); g2.gain.value = 0.12;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(master);
  o.start(t); o2.start(t); o.stop(t + dur); o2.stop(t + dur);
}
function bowed(t, f, vol, dur) {
  const o = ac.createOscillator(), g = ac.createGain(), fl = ac.createBiquadFilter(), l = ac.createOscillator(), lg = ac.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.97, t); o.frequency.linearRampToValueAtTime(f, t + 0.06);
  l.frequency.value = 5.5; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o.frequency);
  fl.type = 'lowpass'; fl.frequency.value = 1500;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.05); g.gain.setValueAtTime(vol, t + Math.max(0.06, dur - 0.08)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(fl); fl.connect(g); g.connect(master);
  o.start(t); l.start(t); o.stop(t + dur); l.stop(t + dur);
}
function bass(t, f, vol, dur) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'triangle'; o.frequency.value = f;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur);
}
let noiseBuf = null;
function noise(t, vol, dur, freq = 1800, type = 'bandpass') {
  if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ac.createBufferSource(), g = ac.createGain(), fl = ac.createBiquadFilter();
  s.buffer = noiseBuf; fl.type = type; fl.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(master); s.start(t); s.stop(t + dur);
}
function taiko(t, vol) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.18);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.36);
  noise(t, vol * 0.25, 0.06, 500);
}

// one token per eighth note: a scale degree, or - for a rest; drums: X taiko, x soft taiko, h rim
const SONGS = {
  title: { bpm: 74, root: 50,
    pluck: '5 7 8 10 8 7 5 - 3 5 7 5 3 2 0 - 5 7 8 10 12 10 8 7 5 7 5 3 2 3 5 -',
    lead: '- - - - 10 - - - - - - - 8 - - - - - - - 12 - - - 10 - - - 7 - - -',
    bass: '0 - - - -2 - - - -3 - - - -2 - - - 0 - - - -2 - - - -3 - - - 0 - - -', drum: 'X - - - - - - - x - - - - - - -' },
  field: { bpm: 104, root: 55,
    lead: '5 - 7 8 7 - 5 3 2 - 3 5 3 - 2 0 5 - 7 8 10 - 8 7 8 - 7 5 7 - - -',
    pluck: '0 5 7 5 0 5 7 5 -2 3 5 3 -2 3 5 3 0 5 7 5 0 5 7 5 -2 3 5 3 0 5 7 5',
    bass: '0 - 0 - 0 - 0 - -2 - -2 - -2 - -2 - 0 - 0 - 0 - 0 - -2 - -2 - 0 - - -', drum: 'x - h - x - h - x - h h x - h -' },
  battle: { bpm: 142, root: 52,
    lead: '10 - 8 10 12 - 10 8 7 - 8 7 5 - 3 5 10 - 12 13 12 - 10 8 10 - - 8 7 - 5 -',
    pluck: '0 5 0 5 2 7 2 7 -2 3 -2 3 0 5 0 5 0 5 0 5 2 7 2 7 3 8 3 8 2 7 0 5',
    bass: '0 0 - 0 0 0 - 0 -2 -2 - -2 -3 -3 - -3 0 0 - 0 0 0 - 0 -2 -2 - -2 0 0 - 0', drum: 'X - x h X - x h X x h - X - x x' },
  boss: { bpm: 156, root: 49,
    lead: '12 12 - 10 12 - 13 12 10 - 8 10 7 - 8 - 12 12 - 10 12 - 15 13 12 - 10 12 10 8 7 -',
    pluck: '0 3 5 3 0 3 5 3 -2 2 3 2 -3 2 3 2 0 3 5 3 0 3 5 3 -2 2 3 2 -3 0 2 3',
    bass: '0 0 0 - 0 0 0 - -2 -2 -2 - -3 -3 -3 - 0 0 0 - 0 0 0 - -2 -2 -2 - -3 -3 -2 -2', drum: 'X x h x X x h h X x h x X X x x' },
  duel: { bpm: 112, root: 47,
    lead: '- - - - 7 - - 8 7 - - - 5 - - - - - - - 8 - - 10 8 - - - 7 - - -',
    bass: '0 - - 0 - - 0 - -2 - - -2 - - -2 - 0 - - 0 - - 0 - -3 - - -3 - - -2 -', drum: 'X - - x - - X - X - - x - x X x' },
  ending: { bpm: 84, root: 55,
    pluck: '5 7 8 10 12 10 8 7 5 7 8 7 5 3 2 3 5 7 8 10 12 13 12 10 8 10 8 7 5 - - -',
    lead: '10 - - - 12 - - - 8 - - - 7 - - - 10 - - - 13 - - - 12 - - - 10 - - -',
    bass: '0 - - - 0 - - - -2 - - - -3 - - - 0 - - - -2 - - - -3 - - - 0 - - -', drum: 'x - - - - - - - x - - - h - - -' },
};
let song = null, want = null, timer = null, step = 0, nextT = 0;
const V = { lead: 0.13, pluck: 0.13, bass: 0.2, drum: 0.3 };

export function play(name) {
  want = name;
  if (!ac) return;
  if (song === SONGS[name]) return;
  stop(); want = name;
  song = SONGS[name]; step = 0; nextT = ac.currentTime + 0.08;
  timer = setInterval(tick, 40);
}
export function stop() { clearInterval(timer); timer = null; song = null; want = null; }

const parsed = new Map();
const parse = (s) => { if (!parsed.has(s)) parsed.set(s, s ? s.split(' ') : []); return parsed.get(s); };
function tick() {
  if (!song || !ac) return;
  const dt = 60 / song.bpm / 2;
  while (nextT < ac.currentTime + 0.18) {
    for (const part of ['lead', 'pluck', 'bass', 'drum']) {
      const seq = parse(song[part]); if (!seq.length) continue;
      const tk = seq[step % seq.length];
      if (tk === '-') continue;
      if (part === 'drum') { if (tk === 'X') taiko(nextT, V.drum); else if (tk === 'x') taiko(nextT, V.drum * 0.55); else noise(nextT, 0.07, 0.04, 4200, 'highpass'); continue; }
      const f = hz(song.root + (part === 'bass' ? -12 : 12), +tk);
      if (part === 'lead') { let n = 1; while (seq[(step + n) % seq.length] === '-' && n < 6) n++; bowed(nextT, f, V.lead, n * dt); }
      else if (part === 'pluck') pluck(nextT, f, V.pluck);
      else bass(nextT, f, V.bass, dt * 1.6);
    }
    step++; nextT += dt;
  }
}

export function se(name) {
  if (!ac) return;
  const t = ac.currentTime;
  switch (name) {
    case 'tap': pluck(t, 880, 0.1, 0.08); break;
    case 'text': noise(t, 0.012, 0.02, 2600); break;
    case 'step': noise(t, 0.015, 0.03, 700); break;
    case 'hit': noise(t, 0.3, 0.12, 1400); taiko(t, 0.2); break;
    case 'clash': noise(t, 0.3, 0.16, 5200, 'highpass'); pluck(t, 1760, 0.1, 0.15); break;
    case 'fire': noise(t, 0.3, 0.6, 900); noise(t + 0.15, 0.2, 0.5, 500); break;
    case 'water': noise(t, 0.25, 0.8, 400, 'lowpass'); noise(t + 0.2, 0.12, 0.6, 2400); break;
    case 'arrow': for (let i = 0; i < 4; i++) noise(t + i * 0.06, 0.12, 0.05, 3400); break;
    case 'buff': [0, 2, 4, 5].forEach((d, i) => pluck(t + i * 0.07, hz(69, d), 0.14, 0.25)); break;
    case 'heal': [5, 7, 8].forEach((d, i) => pluck(t + i * 0.08, hz(69, d), 0.12, 0.3)); break;
    case 'fall': noise(t, 0.08, 0.12, 300, 'lowpass'); break;
    case 'win': [5, 7, 8, 10, 12].forEach((d, i) => pluck(t + i * 0.11, hz(62, d), 0.2, 0.5)); taiko(t, 0.3); taiko(t + 0.44, 0.3); break;
    case 'lose': [5, 3, 2, 0].forEach((d, i) => bowed(t + i * 0.26, hz(50, d), 0.12, 0.3)); break;
    case 'level': [7, 8, 10, 12, 15].forEach((d, i) => pluck(t + i * 0.07, hz(69, d), 0.14, 0.3)); break;
    case 'coin': pluck(t, 1320, 0.12, 0.1); pluck(t + 0.07, 1760, 0.12, 0.18); break;
    case 'alarm': taiko(t, 0.35); taiko(t + 0.16, 0.35); taiko(t + 0.32, 0.4); break;
  }
}
