// charts.js — tiny dependency-free SVG charts, drawn with hard pixel edges.
let gid = 0;
const r1 = n => Math.round(n * 10) / 10;

export function niceMax(v) {
  if (!(v > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / p;
  const m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return m * p;
}

function frame({ w, h, padL, padR, padT, padB, max, yFmt, xLabels, n, X, grid = true, labelColor = 'var(--text3)', gridColor = 'var(--sep)' }) {
  let s = '';
  if (grid) {
    for (const f of [0, 0.5, 1]) {
      const y = r1(padT + (h - padT - padB) * (1 - f));
      s += `<line x1="${padL}" x2="${w - padR}" y1="${y}" y2="${y}" style="stroke:${gridColor}" stroke-width="1" ${f ? 'stroke-dasharray="3 4"' : ''}/>`;
      if (yFmt) s += `<text x="${padL - 6}" y="${y + 3.5}" text-anchor="end" class="ct" style="fill:${labelColor}">${yFmt(max * f)}</text>`;
    }
  }
  for (const [i, text] of xLabels || []) {
    const x = r1(X(i));
    const anchor = i === 0 ? 'start' : i >= n - 1 ? 'end' : 'middle';
    s += `<text x="${x}" y="${h - 3}" text-anchor="${anchor}" class="ct" style="fill:${labelColor}">${text}</text>`;
  }
  return s;
}

/** series: [{values:[n|null], color, width, dash, fill, dot, opacity}] */
export function lineChart({ series, n, w = 340, h = 170, yMax, yFmt, xLabels = [], padT = 10, padB = 20, padR = 10, labelColor, gridColor, grid = true }) {
  const padL = yFmt ? 40 : 6;
  const vals = series.flatMap(s => s.values.filter(v => v != null));
  const max = yMax || niceMax(Math.max(1, ...vals) * 1.05);
  const iw = w - padL - padR, ih = h - padT - padB;
  const X = i => padL + (n <= 1 ? iw / 2 : (i * iw) / (n - 1));
  const Y = v => padT + ih - (Math.max(0, v) / max) * ih;
  let out = `<svg viewBox="0 0 ${w} ${h}" class="chart" role="img"><defs>`;
  const ids = series.map(() => 'g' + (++gid));
  series.forEach((s, k) => {
    if (s.fill) out += `<linearGradient id="${ids[k]}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${s.color};stop-opacity:.35"/><stop offset="1" style="stop-color:${s.color};stop-opacity:0"/></linearGradient>`;
  });
  out += '</defs>';
  out += frame({ w, h, padL, padR, padT, padB, max, yFmt, xLabels, n, X, labelColor, gridColor, grid });
  series.forEach((s, k) => {
    const segs = [];
    let cur = [];
    s.values.forEach((v, i) => { if (v == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push([X(i), Y(v)]); });
    if (cur.length) segs.push(cur);
    for (const seg of segs) {
      const d = seg.map((p, i) => `${i ? 'L' : 'M'}${r1(p[0])} ${r1(p[1])}`).join('');
      if (s.fill && seg.length > 1) {
        out += `<path d="${d}L${r1(seg[seg.length - 1][0])} ${padT + ih}L${r1(seg[0][0])} ${padT + ih}Z" fill="url(#${ids[k]})"/>`;
      }
      out += `<path d="${d}" fill="none" style="stroke:${s.color};opacity:${s.opacity ?? 1}" stroke-width="${s.width || 2.5}" stroke-linecap="square" stroke-linejoin="miter" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''}/>`;
      if (s.dots) for (const p of seg) out += `<rect x="${r1(p[0] - 3)}" y="${r1(p[1] - 3)}" width="6" height="6" style="fill:${s.color};stroke:var(--ink)" stroke-width="1.2"/>`;
    }
    if (s.dot && segs.length) {
      const last = segs[segs.length - 1].slice(-1)[0];
      out += `<rect x="${r1(last[0] - 7)}" y="${r1(last[1] - 7)}" width="14" height="14" class="pulse" style="fill:${s.color};opacity:.3"/><rect x="${r1(last[0] - 4)}" y="${r1(last[1] - 4)}" width="8" height="8" style="fill:${s.color};stroke:var(--ink)" stroke-width="1.5"/>`;
    }
  });
  return out + '</svg>';
}

/**
 * Bars. groups: array per x-position of [{value,color}] — side by side, or stacked if stacked=true.
 * ref: number | array (dashed reference line, e.g. budget).
 */
export function barChart({ labels, groups, stacked = false, w = 340, h = 170, yFmt, ref, refColor = 'var(--text2)', padT = 10, padB = 20, padR = 6, labelEvery = 1 }) {
  const padL = yFmt ? 40 : 6;
  const n = labels.length;
  const totals = groups.map(g => stacked ? g.reduce((a, x) => a + x.value, 0) : Math.max(0, ...g.map(x => x.value)));
  const refMax = Array.isArray(ref) ? Math.max(0, ...ref.filter(v => v != null)) : (ref || 0);
  const max = niceMax(Math.max(1, ...totals, refMax) * 1.05);
  const iw = w - padL - padR, ih = h - padT - padB;
  const slot = iw / n;
  const X = i => padL + slot * i + slot / 2;
  const Y = v => padT + ih - (v / max) * ih;
  const xl = labels.map((t, i) => [i, t]).filter(([i]) => i % labelEvery === 0 || i === n - 1);
  let out = `<svg viewBox="0 0 ${w} ${h}" class="chart" role="img">`;
  out += frame({ w, h, padL, padR, padT, padB, max, yFmt, xLabels: [], n, X });
  for (const [i, t] of xl) out += `<text x="${r1(X(i))}" y="${h - 3}" text-anchor="middle" class="ct" style="fill:var(--text3)">${t}</text>`;
  groups.forEach((g, i) => {
    const bw = Math.min(26, slot * (stacked ? 0.6 : 0.8) / (stacked ? 1 : g.length));
    if (stacked) {
      let acc = 0;
      g.forEach((seg, k) => {
        if (seg.value <= 0) return;
        const y0 = Y(acc), y1 = Y(acc + seg.value);
        const top = k === g.length - 1 || g.slice(k + 1).every(x => x.value <= 0);
        out += `<rect x="${r1(X(i) - bw / 2)}" y="${r1(y1)}" width="${r1(bw)}" height="${r1(Math.max(0.5, y0 - y1))}" style="fill:${seg.color};stroke:var(--ink)" stroke-width="1"/>`;
        acc += seg.value;
      });
    } else {
      g.forEach((seg, k) => {
        const x = X(i) - (bw * g.length) / 2 + k * bw + 1;
        const y = Y(seg.value);
        out += `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(bw - 2)}" height="${r1(Math.max(seg.value > 0 ? 1.5 : 0, padT + ih - y))}" style="fill:${seg.color};stroke:${seg.value > 0 ? 'var(--ink)' : 'none'}" stroke-width="1"/>`;
      });
    }
  });
  if (ref != null) {
    if (Array.isArray(ref)) {
      const pts = ref.map((v, i) => v == null ? null : [X(i), Y(v)]).filter(Boolean);
      if (pts.length) out += `<path d="${pts.map((p, i) => `${i ? 'L' : 'M'}${r1(p[0] - slot / 2)} ${r1(p[1])}L${r1(p[0] + slot / 2)} ${r1(p[1])}`).join('')}" fill="none" style="stroke:${refColor}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
    } else if (ref > 0) {
      const y = r1(Y(ref));
      out += `<line x1="${padL}" x2="${w - padR}" y1="${y}" y2="${y}" style="stroke:${refColor}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
    }
  }
  return out + '</svg>';
}

/** items: [{value,color}] — a ring of square pixels, coloured by share. */
export function donut({ items, size = 150, center = '', sub = '' }) {
  const N = 23, R = N / 2, outer = R - 0.2, inner = R * 0.52;
  const total = items.reduce((a, x) => a + Math.max(0, x.value), 0);
  const stops = [];
  let acc = 0;
  for (const it of items) { if (it.value <= 0) continue; acc += it.value / total; stops.push([acc, it.color]); }
  let cells = '';
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = x + 0.5 - R, dy = y + 0.5 - R, d = Math.hypot(dx, dy);
      if (d > outer || d < inner) continue;
      let col = 'var(--bg3)';
      if (total > 0) {
        const a = ((Math.atan2(dx, -dy) / (2 * Math.PI)) + 1) % 1;
        col = (stops.find(s => a <= s[0] + 1e-9) || stops[stops.length - 1])[1];
      }
      const edge = d > outer - 1 || d < inner + 1;
      cells += `<rect x="${x}" y="${y}" width="1" height="1" style="fill:${col}"${edge ? ' class="de"' : ''}/>`;
    }
  }
  let out = `<svg viewBox="-1 -1 ${N + 2} ${N + 2}" class="donut" role="img" shape-rendering="crispEdges" style="width:${size}px;height:${size}px">${cells}`;
  if (center) out += `<text x="${R}" y="${R + (sub ? 0.5 : 1.5)}" text-anchor="middle" class="dc">${center}</text>`;
  if (sub) out += `<text x="${R}" y="${R + 4}" text-anchor="middle" class="ds">${sub}</text>`;
  return out + '</svg>';
}
