// magic.js — the living forest: fireflies, drifting leaves, the fairy, coin bursts and 8-bit sounds.
// Nothing here touches your data; it is all decoration. Respects "Reduce Motion" and the
// "Forest creatures" / "Sound effects" switches in the Satchel.
import { px, px2, draw, dims } from './sprites.js';

let getSettings = () => ({});
let layer, top, fairyTimer = null, leafTimer = null, fairyEl = null;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const isNight = () => {
  const t = document.documentElement.dataset.theme;
  return t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
};
const alive = () => getSettings().ambient !== false && !reduced.matches && document.visibilityState === 'visible';

export function init(settingsGetter) {
  getSettings = settingsGetter;
  layer = document.createElement('div'); layer.className = 'fx-back'; layer.setAttribute('aria-hidden', 'true');
  top = document.createElement('div'); top.className = 'fx-top'; top.setAttribute('aria-hidden', 'true');
  document.body.prepend(layer); document.body.appendChild(top);
  paintForest();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refresh);
  reduced.addEventListener('change', refresh);
  document.addEventListener('visibilitychange', refresh);
}

// ---------------------------------------------------------------- forest backdrop
// Paints a strip of pixel pines once (day + night) and hands it to CSS as background images.
function strip(night) {
  const W = 200, H = 34;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const far = night ? 'tree_sd' : 'tree_s', near = night ? 'tree_d' : 'tree';
  ctx.globalAlpha = 0.55;
  for (let x = -6; x < W; x += 11) draw(ctx, far, x, H - dims(far)[1] + ((x * 7) % 5), 1);
  ctx.globalAlpha = 1;
  for (let x = 3; x < W; x += 17) draw(ctx, near, x, H - dims(near)[1] + 4 + ((x * 3) % 6), 1);
  return c.toDataURL();
}
function paintForest() {
  const r = document.documentElement.style;
  r.setProperty('--forest-day', `url(${strip(false)})`);
  r.setProperty('--forest-night', `url(${strip(true)})`);
}

// ---------------------------------------------------------------- ambient life
export function refresh() {
  if (!layer) return;
  layer.innerHTML = '';
  clearTimeout(fairyTimer); clearTimeout(leafTimer);
  if (!alive()) { if (fairyEl) { fairyEl.remove(); fairyEl = null; } return; }
  if (isNight()) {
    for (let i = 0; i < 14; i++) {
      const f = document.createElement('i');
      f.className = 'firefly';
      f.style.cssText = `left:${rand(2, 96)}%;top:${rand(8, 92)}%;animation-duration:${rand(5, 11)}s,${rand(1.6, 3.4)}s;animation-delay:-${rand(0, 9)}s,-${rand(0, 3)}s`;
      layer.appendChild(f);
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const f = document.createElement('i');
      f.className = 'mote';
      f.style.cssText = `left:${rand(2, 96)}%;top:${rand(10, 90)}%;animation-duration:${rand(9, 16)}s;animation-delay:-${rand(0, 12)}s`;
      layer.appendChild(f);
    }
  }
  const nextLeaf = () => { leafTimer = setTimeout(() => { if (alive()) fallingLeaf(); nextLeaf(); }, rand(7000, 16000)); };
  nextLeaf();
  const nextFairy = () => { fairyTimer = setTimeout(() => { if (alive()) fairyFly(); nextFairy(); }, rand(45000, 110000)); };
  nextFairy();
}

function fallingLeaf(x = rand(5, 95), delay = 0, dur = rand(7, 11), size = rand(14, 22)) {
  const el = document.createElement('span');
  el.className = 'fall-leaf';
  el.innerHTML = px('leaf' + Math.floor(rand(0, 3)));
  el.style.cssText = `left:${x}vw;width:${size}px;animation-duration:${dur}s;animation-delay:${delay}s;--sway:${rand(-60, 60)}px`;
  top.appendChild(el);
  setTimeout(() => el.remove(), (dur + delay) * 1000 + 200);
}

/** Joe Mode switched on: a short flurry of leaves. */
export function leafStorm() {
  if (reduced.matches) return;
  for (let i = 0; i < 26; i++) fallingLeaf(rand(-5, 100), rand(0, 0.9), rand(1.6, 2.6), rand(14, 26));
}

/** A few coins hop out of the add button. */
export function coinBurst() {
  if (reduced.matches) return;
  const fab = document.getElementById('fab');
  const r = fab ? fab.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  for (let i = 0; i < 7; i++) {
    const c = document.createElement('span');
    c.className = 'coin-pop';
    c.innerHTML = px('coin');
    c.style.cssText = `left:${r.left + r.width / 2 - 9}px;top:${r.top + r.height / 2 - 9}px;--dx:${rand(-90, 40)}px;--dy:${rand(-150, -70)}px;animation-delay:${i * 0.03}s`;
    top.appendChild(c);
    setTimeout(() => c.remove(), 1100);
  }
}

/** Quest conquered: golden stars. */
export function confetti() {
  if (reduced.matches) return;
  for (let i = 0; i < 22; i++) {
    const c = document.createElement('span');
    c.className = 'coin-pop star';
    c.innerHTML = px(i % 3 ? 'star' : 'coin');
    c.style.cssText = `left:${innerWidth / 2 - 9}px;top:${innerHeight / 2}px;--dx:${rand(-170, 170)}px;--dy:${rand(-260, -60)}px;animation-delay:${rand(0, .2)}s`;
    top.appendChild(c);
    setTimeout(() => c.remove(), 1400);
  }
}

// ---------------------------------------------------------------- the fairy
const COUNSEL = [
  'A coin unspent is a coin that sleeps soundly.',
  'Even dragons count their gold twice.',
  'The tavern will still be there tomorrow. So will your coin, if you let it.',
  'Small leaks sink great ships — and great hoards.',
  'Write it in the ledger, and the ledger will remember for you.',
  'A full coffer makes for a quiet dragon.',
  'Buy the sword you need, not the sword that sparkles.',
  'Gold spent on friends is seldom gold wasted.',
  'Count the coppers and the crowns will count themselves.',
  'The wise traveller packs light and spends lighter.',
  'Every great quest begins with a single saved coin.',
  'Guild dues you forget are guild dues you still pay.',
  'When the dragon stirs, look at the ledger.',
  'Mushrooms grow slowly. So do savings. Both are worth the wait.',
  'No hoard was ever built in a single night.',
  'Treat yourself — then write it down.',
  'A bargain you did not need is no bargain at all.',
  'Rest is free. The forest asks nothing of you.',
];
let lastCounsel = -1;
export function counsel(toast, fromFairy = false) {
  let i; do { i = Math.floor(Math.random() * COUNSEL.length); } while (i === lastCounsel && COUNSEL.length > 1);
  lastCounsel = i;
  sfx('sparkle');
  toast(fromFairy ? 'You caught the fairy! She whispers…' : 'The fairy whispers…', { art: 'fairy0', sub: COUNSEL[i], persist: false });
  if (fairyEl && fromFairy) { fairyEl.classList.add('caught'); setTimeout(() => { if (fairyEl) { fairyEl.remove(); fairyEl = null; } }, 500); }
}

function fairyFly() {
  if (fairyEl || document.querySelector('.sheet-wrap:not([hidden])') || document.querySelector('.game')) return;
  const el = document.createElement('button');
  el.className = 'fairy';
  el.dataset.a = 'fairy';
  el.setAttribute('aria-label', 'A fairy — tap her for counsel');
  el.innerHTML = px2('fairy0', 'fairy1', 'flutter') + '<i class="dust"></i>';
  document.body.appendChild(el);
  fairyEl = el;
  const fromLeft = Math.random() < 0.5, y0 = rand(innerHeight * 0.18, innerHeight * 0.6), dur = rand(9000, 13000), amp = rand(30, 70);
  const t0 = performance.now();
  const step = now => {
    if (!fairyEl || fairyEl !== el) return;
    const p = (now - t0) / dur;
    if (p >= 1) { el.remove(); fairyEl = null; return; }
    const x = fromLeft ? -40 + p * (innerWidth + 80) : innerWidth + 40 - p * (innerWidth + 80);
    const y = y0 + Math.sin(p * Math.PI * 4) * amp + Math.sin(p * 23) * 6;
    el.style.transform = `translate(${x}px, ${y}px) scaleX(${fromLeft ? 1 : -1})`;
    if (Math.random() < 0.25) sparkle(x + 12, y + 20);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function sparkle(x, y) {
  const s = document.createElement('i');
  s.className = 'sparkle';
  s.style.cssText = `left:${x}px;top:${y}px`;
  top.appendChild(s);
  setTimeout(() => s.remove(), 900);
}

// ---------------------------------------------------------------- 8-bit sounds
let ac = null;
function ctx() {
  if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
function tone(a, freq, t, dur, { type = 'square', vol = 0.06, to = null } = {}) {
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
function noise(a, t, dur, { vol = 0.08, freq = 1200, type = 'bandpass', to = null } = {}) {
  const n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = buf; f.type = type; f.frequency.setValueAtTime(freq, t); if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(a.destination); s.start(t);
}
export function sfx(name, force = false) {
  if (!force && !getSettings().sound) return;
  const a = ctx(); if (!a) return;
  const t = a.currentTime + 0.01;
  switch (name) {
    case 'coin': tone(a, 988, t, 0.07); tone(a, 1319, t + 0.07, 0.18); break;
    case 'tick': tone(a, 880, t, 0.04, { vol: 0.03 }); break;
    case 'chime': [523, 659, 784].forEach((f, i) => tone(a, f, t + i * 0.07, 0.16, { type: 'triangle', vol: 0.08 })); break;
    case 'fanfare': [523, 659, 784, 1047].forEach((f, i) => tone(a, f, t + i * 0.1, i === 3 ? 0.4 : 0.12)); break;
    case 'sparkle': [1568, 2093, 2637].forEach((f, i) => tone(a, f, t + i * 0.05, 0.12, { type: 'triangle', vol: 0.05 })); break;
    case 'burn': noise(a, t, 0.45, { freq: 600, to: 200, type: 'lowpass', vol: 0.12 }); break;
    case 'roar': tone(a, 180, t, 0.4, { type: 'sawtooth', to: 70, vol: 0.05 }); noise(a, t, 0.4, { freq: 400, to: 150, vol: 0.06 }); break;
    case 'rustle': noise(a, t, 0.18, { freq: 4000, type: 'highpass', vol: 0.05 }); break;
    case 'wind': noise(a, t, 0.7, { freq: 300, to: 1800, vol: 0.06 }); break;
    case 'flap': tone(a, 420, t, 0.08, { to: 260, vol: 0.04 }); break;
    case 'point': tone(a, 1175, t, 0.06, { vol: 0.04 }); tone(a, 1568, t + 0.05, 0.1, { vol: 0.04 }); break;
    case 'crash': noise(a, t, 0.35, { freq: 900, to: 120, type: 'lowpass', vol: 0.14 }); tone(a, 150, t, 0.35, { to: 50, vol: 0.06 }); break;
    default: break;
  }
}
