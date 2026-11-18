// game.js — "Dragon Flight", a tiny tap-to-flap game. Fly between giant mushrooms and hanging
// trees, scoop up gold. Your best flight is kept in settings (it's part of backups, nothing else).
import { draw, dims } from './sprites.js';
import { sfx } from './magic.js';

const W = 180, H = 320, GROUND = 296;
let el, cv, ctx, raf, st, settings, save, last = 0;

const night = () => {
  const t = document.documentElement.dataset.theme;
  return t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
};

export function open(s, saveSettings) {
  if (el) return;
  settings = s; save = saveSettings;
  el = document.createElement('div');
  el.className = 'game';
  el.innerHTML = `<div class="game-box">
      <canvas width="${W}" height="${H}" aria-label="Dragon Flight game"></canvas>
      <button class="game-x" aria-label="Close game">✕</button>
    </div>`;
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';
  cv = el.querySelector('canvas'); ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  el.querySelector('.game-x').addEventListener('click', close);
  cv.addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
  document.addEventListener('keydown', onKey);
  reset();
  last = performance.now();
  raf = requestAnimationFrame(loop);
}

export function close() {
  if (!el) return;
  cancelAnimationFrame(raf);
  document.removeEventListener('keydown', onKey);
  el.remove(); el = null;
  document.body.style.overflow = '';
}

function onKey(e) {
  if (e.key === 'Escape') return close();
  if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); tap(); }
}

function reset() {
  st = {
    mode: 'ready', y: 140, vy: 0, t: 0, score: 0, gold: 0, speed: 1.35, spawn: 0,
    pipes: [], coins: [], flapT: 0, scroll: 0, shake: 0, overT: 0, best: +(settings.gameBest || 0), newBest: false,
  };
}

function tap() {
  if (st.mode === 'ready') { st.mode = 'play'; flap(); return; }
  if (st.mode === 'play') { flap(); return; }
  if (st.mode === 'over' && st.overT > 0.6) {
    // bottom half of the "over" card: back to the hoard; anywhere else: fly again
    reset(); st.mode = 'play'; flap();
  }
}
function flap() { st.vy = -4.4; st.flapT = 0.18; sfx('flap'); }

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  update(dt * 60);
  render();
  raf = requestAnimationFrame(loop);
}

function update(k) {
  st.t += k / 60;
  st.flapT = Math.max(0, st.flapT - k / 60);
  if (st.mode === 'ready') { st.y = 140 + Math.sin(st.t * 3) * 6; st.scroll += 0.6 * k; return; }
  if (st.mode === 'over') {
    st.overT += k / 60;
    if (st.y < GROUND - 16) { st.vy += 0.3 * k; st.y = Math.min(GROUND - 16, st.y + st.vy * k); }
    st.shake = Math.max(0, st.shake - k);
    return;
  }
  st.scroll += st.speed * k;
  st.vy = Math.min(7, st.vy + 0.27 * k);
  st.y += st.vy * k;
  if (st.y < -6) { st.y = -6; st.vy = 0; }
  st.speed = Math.min(2.6, 1.35 + st.score * 0.035);
  // spawn
  st.spawn -= k;
  if (st.spawn <= 0) {
    const gap = Math.max(78, 100 - st.score * 1.2);
    const top = 40 + Math.random() * (GROUND - 80 - gap);
    st.pipes.push({ x: W + 4, top, gap, passed: false });
    if (Math.random() < 0.8) st.coins.push({ x: W + 15, y: top + gap / 2 + (Math.random() * 30 - 15), got: false });
    st.spawn = 88 / (st.speed / 1.35);
  }
  for (const p of st.pipes) {
    p.x -= st.speed * k;
    if (!p.passed && p.x + 22 < 38) { p.passed = true; st.score++; sfx('tick'); }
  }
  for (const c of st.coins) {
    c.x -= st.speed * k;
    if (!c.got && Math.abs(c.x + 3 - 50) < 13 && Math.abs(c.y + 3 - (st.y + 10)) < 13) { c.got = true; st.gold++; sfx('point'); }
  }
  st.pipes = st.pipes.filter(p => p.x > -30);
  st.coins = st.coins.filter(c => c.x > -10 && !c.got);
  // collisions — a forgiving hitbox around the dragon's body
  const bx = 41, by = st.y + 5, bw = 18, bh = 13;
  const hit = st.y + 19 >= GROUND || st.pipes.some(p => bx + bw > p.x + 2 && bx < p.x + 20 && (by < p.top - 2 || by + bh > p.top + p.gap + 4));
  if (hit) gameOver();
}

function gameOver() {
  st.mode = 'over'; st.overT = 0; st.shake = 10; st.vy = -2;
  sfx('crash');
  if (st.score > st.best) {
    st.best = st.score; st.newBest = st.score > 0;
    settings.gameBest = st.score;
    Promise.resolve(save && save()).catch(() => {});
  }
}

// ---------------------------------------------------------------- drawing
function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function text(s, x, y, size = 8, color = '#fff', align = 'center', shadow = '#1b1426') {
  ctx.font = `${size}px "Hoard Pixel", monospace`;
  ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(s, Math.round(x) + 1, Math.round(y) + 1); }
  ctx.fillStyle = color; ctx.fillText(s, Math.round(x), Math.round(y));
}

function sky(n) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (n) { g.addColorStop(0, '#0d1a2b'); g.addColorStop(1, '#1d4436'); }
  else { g.addColorStop(0, '#8fd0e8'); g.addColorStop(0.7, '#d9efc8'); g.addColorStop(1, '#bfe0a0'); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (n) {
    for (let i = 0; i < 26; i++) { const x = (i * 53 + 11) % W, y = (i * 37) % 160; rect(x, y, 1, 1, i % 4 ? '#ffe9a8' : '#fff'); }
    draw(ctx, 'moon', 140, 18, 2);
  } else {
    rect(144, 20, 16, 16, '#ffe066'); rect(146, 18, 12, 20, '#ffe066'); rect(142, 22, 20, 12, '#ffe066');
    for (const [x, y] of [[20, 40], [90, 26]]) { rect(x, y, 28, 6, '#fff'); rect(x + 6, y - 4, 14, 4, '#fff'); }
  }
}
function forest(n, speed, layerY, sprite, gap, alpha) {
  ctx.globalAlpha = alpha;
  const [tw, th] = dims(sprite);
  const off = -((st.scroll * speed) % gap);
  for (let x = off - gap; x < W + gap; x += gap) draw(ctx, sprite, x, layerY - th, 1);
  ctx.globalAlpha = 1;
}
function ground(n) {
  rect(0, GROUND, W, H - GROUND, n ? '#24391f' : '#6aa84f');
  rect(0, GROUND, W, 2, n ? '#3f6b35' : '#9be36b');
  const off = -(st.scroll % 16);
  for (let x = off; x < W; x += 16) { rect(x, GROUND + 6, 2, 2, n ? '#3f6b35' : '#4e8a3a'); rect(x + 8, GROUND + 14, 2, 2, n ? '#1b2a17' : '#4e8a3a'); }
}
function pipe(p, n) {
  // hanging tree from the top
  const bark = n ? '#4b2e1c' : '#7a4a26', barkD = n ? '#2c1a10' : '#55331d', leaf = n ? '#1f5a33' : '#3f9a45', leafD = n ? '#143a22' : '#2f7f3f';
  rect(p.x + 5, 0, 12, p.top - 10, bark); rect(p.x + 5, 0, 3, p.top - 10, barkD); rect(p.x + 4, 0, 1, p.top - 10, '#1b1426'); rect(p.x + 17, 0, 1, p.top - 10, '#1b1426');
  for (let y = 8; y < p.top - 14; y += 14) rect(p.x + 10, y, 4, 2, barkD);
  rect(p.x - 3, p.top - 14, 28, 14, leaf); rect(p.x - 1, p.top - 2, 24, 3, leaf); rect(p.x - 3, p.top - 14, 28, 1, '#1b1426');
  rect(p.x - 4, p.top - 13, 1, 12, '#1b1426'); rect(p.x + 25, p.top - 13, 1, 12, '#1b1426'); rect(p.x - 1, p.top + 1, 24, 1, '#1b1426');
  rect(p.x + 2, p.top - 6, 3, 3, leafD); rect(p.x + 14, p.top - 10, 3, 3, leafD); rect(p.x + 8, p.top - 3, 3, 2, leafD);
  // giant mushroom from the ground
  const y0 = p.top + p.gap;
  rect(p.x + 5, y0 + 10, 12, GROUND - y0 - 10, '#f4e9d0'); rect(p.x + 14, y0 + 10, 3, GROUND - y0 - 10, '#d9c7a0');
  rect(p.x + 4, y0 + 10, 1, GROUND - y0 - 10, '#1b1426'); rect(p.x + 17, y0 + 10, 1, GROUND - y0 - 10, '#1b1426');
  draw(ctx, 'shroom', p.x - 3, y0 - 1, 2);
}
function render() {
  const n = night();
  ctx.save();
  if (st.shake) ctx.translate(Math.round(Math.random() * 4 - 2), Math.round(Math.random() * 4 - 2));
  sky(n);
  forest(n, 0.25, GROUND + 2, n ? 'tree_sd' : 'tree_s', 13, 0.6);
  forest(n, 0.5, GROUND + 4, n ? 'tree_d' : 'tree', 23, 1);
  for (const p of st.pipes) pipe(p, n);
  for (const c of st.coins) draw(ctx, 'coin', c.x, c.y + Math.round(Math.sin(st.t * 6 + c.x) * 1.5), 1);
  ground(n);
  const frame = st.mode === 'over' ? 'dragon_down_angry' : (st.flapT > 0 || Math.floor(st.t * 8) % 2 ? 'dragon_up_idle' : 'dragon_down_idle');
  draw(ctx, frame, 34, Math.round(st.y), 1);
  if (n && st.mode !== 'over') for (let i = 0; i < 3; i++) rect((i * 61 + st.t * 30) % W, 60 + Math.sin(st.t * 2 + i) * 40 + i * 50, 1, 1, '#ffe066');
  ctx.restore();

  // HUD
  if (st.mode !== 'ready') {
    text(String(st.score), W / 2, 30, 24);
    draw(ctx, 'coin', 6, 6, 1); text(String(st.gold), 16, 12, 8, '#ffe066', 'left');
  }
  if (st.mode === 'ready') {
    panel(24, 64, W - 48, 96);
    text('DRAGON FLIGHT', W / 2, 86, 8, '#ffd54a');
    text('Tap to flap.', W / 2, 106, 8, '#f4e9d0');
    text('Dodge trees & shrooms,', W / 2, 120, 8, '#f4e9d0');
    text('collect gold!', W / 2, 132, 8, '#f4e9d0');
    if (st.best) text(`Best: ${st.best}`, W / 2, 150, 8, '#9be3c0');
  }
  if (st.mode === 'over' && st.overT > 0.35) {
    panel(20, 80, W - 40, 112);
    text('The dragon tumbles!', W / 2, 102, 8, '#ff9e8a');
    text(`Score ${st.score}`, W / 2, 124, 16, '#ffd54a');
    text(`Gold ${st.gold}  ·  Best ${st.best}`, W / 2, 142, 8, '#f4e9d0');
    if (st.newBest) text('A new record!', W / 2, 158, 8, '#9be3c0');
    if (st.overT > 0.6) text('Tap to fly again', W / 2, 180, 8, '#ffffff');
  }
}
function panel(x, y, w, h) {
  rect(x + 2, y + 2, w, h, 'rgba(0,0,0,.35)');
  rect(x, y, w, h, '#3a2a40'); rect(x + 2, y + 2, w - 4, h - 4, '#2a1f30');
  rect(x, y, w, 1, '#1b1426'); rect(x, y + h - 1, w, 1, '#1b1426'); rect(x, y, 1, h, '#1b1426'); rect(x + w - 1, y, 1, h, '#1b1426');
  for (const [cx, cy] of [[x + 3, y + 3], [x + w - 6, y + 3], [x + 3, y + h - 6], [x + w - 6, y + h - 6]]) rect(cx, cy, 3, 3, '#e9a42a');
}
