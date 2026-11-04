// Four channels like the old console: two pulse waves, a triangle bass and a noise drum. All tunes are original, on a pentatonic scale.
let ac = null, master = null, muted = false;
const LEVEL = 0.34;
try { muted = localStorage.getItem('dt-mute') === '1'; } catch (e) { /* private mode */ }

const waves = {};
function pulse(duty) {
  if (waves[duty]) return waves[duty];
  const n = 64, re = new Float32Array(n), im = new Float32Array(n);
  for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  return (waves[duty] = ac.createPeriodicWave(re, im));
}
export function unlock() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : LEVEL;
    master.connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume();
  if (want && !song) play(want);
}
export const isMuted = () => muted;
export function setMuted(v) {
  muted = v;
  try { localStorage.setItem('dt-mute', v ? '1' : '0'); } catch (e) { /* private mode */ }
  if (master) master.gain.value = v ? 0 : LEVEL;
}

const PENTA = [0, 2, 4, 7, 9];
const hz = (root, deg) => { const o = Math.floor(deg / 5), n = ((deg % 5) + 5) % 5; return 440 * Math.pow(2, (root + o * 12 + PENTA[n] - 69) / 12); };

function square(t, f, vol, dur, duty = 0.5, slide = 0) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.setPeriodicWave(pulse(duty));
  o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.linearRampToValueAtTime(f + slide, t + dur);
  // steps down instead of gliding, the way the hardware's envelope does
  const steps = 4;
  for (let i = 0; i < steps; i++) g.gain.setValueAtTime(vol * (1 - i / (steps + 1)), t + dur * i / steps * 0.9);
  g.gain.setValueAtTime(0, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.01);
}
function tri(t, f, vol, dur) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'triangle'; o.frequency.value = f;
  g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(0, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.01);
}
let noiseBuf = null, shortBuf = null;
function noise(t, vol, dur, kind = 'long') {
  if (!noiseBuf) {
    // two lengths of noise: hiss for hats and crashes, a metallic short loop for snares
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0, v = 0; i < d.length; i++) { if (i % 3 === 0) v = Math.random() * 2 - 1; d[i] = v; }
    shortBuf = ac.createBuffer(1, 800, ac.sampleRate);
    const e = shortBuf.getChannelData(0);
    for (let i = 0, v = 0; i < e.length; i++) { if (i % 9 === 0) v = Math.random() < 0.5 ? -1 : 1; e[i] = v; }
  }
  const s = ac.createBufferSource(), g = ac.createGain();
  s.buffer = kind === 'short' ? shortBuf : noiseBuf; s.loop = true;
  g.gain.setValueAtTime(vol, t); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  s.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.01);
}
function kick(t, vol) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.09);
  g.gain.setValueAtTime(vol, t); g.gain.linearRampToValueAtTime(0.0001, t + 0.12);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.13);
}

// one token per eighth note: a scale degree, or - for a rest. drum: K kick, S snare, h hat
const SONGS = {
  title: { bpm: 96, root: 50,
    lead: '10 - 12 13 12 - 10 8 7 - - 8 10 - - - 12 - 13 15 13 - 12 10 8 - 10 8 7 - - - 10 - 12 13 15 - 13 12 13 - 12 10 8 - 7 - 5 - 7 8 10 - 8 7 5 - - - - - - -',
    arp: '0 5 7 10 0 5 7 10 -2 3 5 8 -2 3 5 8 0 5 7 10 0 5 7 10 -3 2 5 7 -3 2 5 7 0 5 7 10 0 5 7 10 -2 3 5 8 -2 3 5 8 -3 2 5 7 -3 2 5 7 0 5 7 10 0 5 7 10',
    bass: '0 - 0 - 0 - 0 - -2 - -2 - -2 - -2 - 0 - 0 - 0 - 0 - -3 - -3 - -3 - -3 -', drum: 'K - h - S - h - K - h h S - h -' },
  world: { bpm: 120, root: 55,
    lead: '5 - 7 8 7 - 5 3 2 - 3 5 3 - - - 5 - 7 8 10 - 8 7 8 - 7 5 7 - - - 10 - 8 7 5 - 7 8 7 - 5 3 2 - - - 3 - 5 7 5 - 3 2 0 - - - - - - -',
    arp: '0 - 5 - 7 - 5 - -2 - 3 - 5 - 3 - 0 - 5 - 7 - 5 - -2 - 3 - 5 - 3 -',
    bass: '0 - 0 5 0 - 0 5 -2 - -2 3 -2 - -2 3', drum: 'K - h - S - h h' },
  town: { bpm: 104, root: 57,
    lead: '7 - 8 7 5 - 3 - 5 - 7 5 3 - 2 - 3 - 5 3 2 - 0 - 2 3 5 - 3 - - -',
    arp: '0 7 5 7 0 7 5 7 -2 5 3 5 -2 5 3 5 -3 3 2 3 -3 3 2 3 0 7 5 7 0 7 5 7',
    bass: '0 - - - 0 - - - -2 - - - -2 - - - -3 - - - -3 - - - 0 - - - 0 - - -', drum: 'h - - - h - - -' },
  castle: { bpm: 112, root: 48,
    lead: '- - 5 - 3 - 2 - 0 - - - 2 - 3 - 5 - 3 - 2 - 0 - -2 - - - - - - - - - 7 - 5 - 3 - 2 - - - 3 - 5 - 8 - 7 - 5 - 3 - 2 - - - - - - -',
    arp: '0 3 5 3 0 3 5 3 -2 2 3 2 -2 2 3 2',
    bass: '0 0 - 0 0 - 0 - -2 -2 - -2 -2 - -2 -', drum: 'K - - h K - h - K - - h K h S -' },
  battle: { bpm: 158, root: 52,
    lead: '10 - 8 10 12 - 10 8 7 - 8 7 5 - 3 5 10 - 12 13 12 - 10 8 10 - - 8 7 - 5 - 7 7 - 8 10 - 8 7 5 5 - 7 8 - 7 5 3 - 5 7 8 - 10 12 13 - 12 10 8 - 7 -',
    arp: '0 5 0 5 2 7 2 7 -2 3 -2 3 0 5 0 5',
    bass: '0 0 5 0 0 0 5 0 -2 -2 3 -2 -3 -3 2 -3', drum: 'K h S h K K S h' },
  boss: { bpm: 172, root: 49,
    lead: '12 12 - 10 12 - 13 12 10 - 8 10 7 - 8 - 12 12 - 10 12 - 15 13 12 - 10 12 10 8 7 - 5 5 - 7 8 - 7 5 3 3 - 5 7 - 5 3 2 - 3 5 7 - 8 10 12 - 13 15 13 12 10 8',
    arp: '0 3 5 3 0 3 5 3 -2 2 3 2 -3 2 3 2',
    bass: '0 0 0 - 0 0 0 - -2 -2 -2 - -3 -3 -2 -2', drum: 'K S K S K S K h' },
  tense: { bpm: 84, root: 47,
    lead: '- - - - 7 - - 8 7 - - - 5 - - - - - - - 8 - - 10 8 - - - 7 - - -',
    arp: '0 - 3 - 0 - 3 - -2 - 2 - -2 - 2 -',
    bass: '0 - - 0 - - 0 - -2 - - -2 - - -2 -', drum: 'K - - - - - h - K - - - - h - -' },
  sad: { bpm: 66, root: 50,
    lead: '7 - - 8 7 - 5 - 3 - - - 2 - - - 3 - - 5 3 - 2 - 0 - - - - - - - 5 - - 7 8 - 7 - 5 - 3 - 2 - - - 3 - 2 - 0 - -2 - 0 - - - - - - -',
    arp: '0 5 7 5 0 5 7 5 -2 3 5 3 -2 3 5 3',
    bass: '0 - - - 0 - - - -2 - - - -2 - - -' },
  duel: { bpm: 132, root: 47,
    lead: '- - 7 8 7 - 5 - - - 8 10 8 - 7 - - - 7 8 7 - 5 3 5 - 3 2 0 - - -',
    arp: '0 3 0 3 0 3 0 3 -2 2 -2 2 -2 2 -2 2',
    bass: '0 - 0 0 - 0 0 - -2 - -2 -2 - -2 -2 -', drum: 'K - S - K K S -' },
  ending: { bpm: 92, root: 55,
    lead: '10 - - - 12 - - - 8 - - - 7 - - - 10 - - - 13 - - - 12 - - - 10 - - - 8 - 10 - 12 - 13 - 15 - - - 13 - - - 12 - 10 - 8 - 7 - 5 - - - - - - -',
    arp: '5 7 8 10 12 10 8 7 5 7 8 7 5 3 2 3 5 7 8 10 12 13 12 10 8 10 8 7 5 7 8 7',
    bass: '0 - - - 0 - - - -2 - - - -3 - - - 0 - - - -2 - - - -3 - - - 0 - - -', drum: 'K - - - h - - - K - - - h - h -' },
};
let song = null, want = null, timer = null, step = 0, nextT = 0;
const V = { lead: 0.17, arp: 0.07, bass: 0.26 };

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
const parse = (s) => { if (!s) return []; if (!parsed.has(s)) parsed.set(s, s.split(' ')); return parsed.get(s); };
function tick() {
  if (!song || !ac) return;
  const dt = 60 / song.bpm / 2;
  while (nextT < ac.currentTime + 0.18) {
    for (const part of ['lead', 'arp', 'bass', 'drum']) {
      const seq = parse(song[part]); if (!seq.length) continue;
      const tk = seq[step % seq.length];
      if (tk === '-') continue;
      if (part === 'drum') { if (tk === 'K') kick(nextT, 0.3); else if (tk === 'S') noise(nextT, 0.13, 0.09, 'short'); else noise(nextT, 0.05, 0.03); continue; }
      const f = hz(song.root + (part === 'bass' ? -12 : 12), +tk);
      if (part === 'lead') { let n = 1; while (seq[(step + n) % seq.length] === '-' && n < 6) n++; square(nextT, f, V.lead, n * dt * 0.92, 0.25); }
      else if (part === 'arp') square(nextT, f, V.arp, dt * 0.8, 0.125);
      else tri(nextT, f, V.bass, dt * 0.9);
    }
    step++; nextT += dt;
  }
}

const up = (t, list, root, step2 = 0.07, vol = 0.2, duty = 0.5) => list.forEach((d, i) => square(t + i * step2, hz(root, d), vol, step2 * 1.6, duty));
export function se(name) {
  if (!ac) return;
  const t = ac.currentTime;
  switch (name) {
    case 'tap': square(t, 988, 0.12, 0.05, 0.5); break;
    case 'text': square(t, 1320, 0.022, 0.018, 0.125); break;
    case 'bump': square(t, 110, 0.14, 0.05, 0.5); break;
    case 'hit': noise(t, 0.34, 0.12); kick(t, 0.3); break;
    case 'clash': noise(t, 0.3, 0.1, 'short'); square(t, 1760, 0.1, 0.08, 0.125); break;
    case 'fire': noise(t, 0.3, 0.55); noise(t + 0.18, 0.18, 0.4); break;
    case 'water': noise(t, 0.16, 0.7); square(t, 330, 0.1, 0.5, 0.5, -220); break;
    case 'arrow': for (let i = 0; i < 4; i++) { square(t + i * 0.06, 1500 - i * 200, 0.08, 0.05, 0.125); } break;
    case 'buff': up(t, [0, 2, 4, 5], 69); break;
    case 'heal': up(t, [5, 7, 8], 69, 0.08); break;
    case 'fall': square(t, 300, 0.14, 0.26, 0.5, -240); break;
    case 'win': up(t, [5, 7, 8, 10, 12, 10, 12], 62, 0.1, 0.22); break;
    case 'lose': up(t, [5, 3, 2, 0], 50, 0.24, 0.2); break;
    case 'level': up(t, [7, 8, 10, 12, 15], 69, 0.07, 0.18); break;
    case 'coin': square(t, 988, 0.14, 0.07, 0.5); square(t + 0.07, 1320, 0.14, 0.16, 0.5); break;
    case 'chest': up(t, [5, 8, 10, 13], 69, 0.08, 0.18); break;
    case 'lever': noise(t, 0.16, 0.08, 'short'); noise(t + 0.14, 0.2, 0.14, 'short'); kick(t + 0.14, 0.3); break;
    case 'alarm': square(t, 660, 0.15, 0.1); square(t + 0.14, 880, 0.15, 0.1); square(t + 0.28, 660, 0.15, 0.1); square(t + 0.42, 880, 0.15, 0.16); break;
    case 'thunder': noise(t, 0.4, 0.9); kick(t, 0.4); break;
  }
}
