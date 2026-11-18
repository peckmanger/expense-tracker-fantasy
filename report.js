// report.js — draws the monthly chronicle on A4 parchment canvases and wraps them in a PDF (no libraries).
import { draw } from './sprites.js';
import { t as tr } from './i18n.js';
const PW = 595.28, PH = 841.89;      // A4 in points
const K = 2.6;                        // render scale (~190 dpi)
const M = 36;                         // margin
const FONT = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
const PIXEL = '"Hoard Pixel", "Iowan Old Style", Georgia, serif';
const C = { text: '#2b1d14', muted: '#7a6248', faint: '#a8916f', line: '#dcc9a4', card: '#efe2c4', paper: '#f8f0dc', blue: '#2f6b4f', green: '#2f7f3f', red: '#a8322b', bar2: '#cdb88f', gold: '#c48a1c' };

function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function txt(ctx, s, x, y, { size = 10, weight = 400, color = C.text, align = 'left', max, pixel = false } = {}) {
  ctx.font = pixel ? `400 ${size}px ${PIXEL}` : `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  let str = String(s);
  if (max) while (str.length > 1 && ctx.measureText(str).width > max) str = str.slice(0, -2) + '…';
  ctx.fillText(str, x, y);
}

class Doc {
  constructor() { this.pages = []; this.newPage(); }
  newPage() {
    const c = document.createElement('canvas');
    c.width = Math.round(PW * K); c.height = Math.round(PH * K);
    const ctx = c.getContext('2d');
    ctx.scale(K, K);
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, PW, PH);
    // a pixel border, like the edge of an old map
    ctx.fillStyle = C.line;
    ctx.fillRect(14, 14, PW - 28, 2); ctx.fillRect(14, PH - 16, PW - 28, 2); ctx.fillRect(14, 14, 2, PH - 28); ctx.fillRect(PW - 16, 14, 2, PH - 28);
    for (const [x, y] of [[14, 14], [PW - 22, 14], [14, PH - 22], [PW - 22, PH - 22]]) { ctx.fillStyle = C.gold; ctx.fillRect(x, y, 8, 8); }
    this.pages.push(c); this.ctx = ctx; this.y = M;
  }
  ensure(h) { if (this.y + h > PH - M - 14) { this.newPage(); this.y = M + 6; } }
  section(title, need = 0) { this.ensure(40 + need); txt(this.ctx, title, M, this.y + 14, { size: 14, pixel: true }); this.y += 26; }
}

export async function buildReportPDF(d) {
  try { await document.fonts.load('16px "Hoard Pixel"'); } catch (e) { /* falls back to serif */ }
  const doc = new Doc();
  let ctx = doc.ctx;

  // ---- header ----
  txt(ctx, tr('A CHRONICLE OF THE HOARD'), M, 52, { size: 9, pixel: true, color: C.muted });
  txt(ctx, d.month, M, 86, { size: 28, pixel: true });
  txt(ctx, tr('Shown in {c} · written {d}', { c: d.currency, d: d.generated }), M, 104, { size: 9.5, color: C.muted });
  const mood = d.mood || 'idle';
  draw(ctx, 'gold1', PW - M - 74, 92, 3);
  draw(ctx, `dragon_up_${mood}`, PW - M - 78, 30, 3);
  if (d.headline) {
    ctx.font = `600 10.5px ${FONT}`;
    const hw = ctx.measureText(d.headline).width + 22;
    const hx = PW - M - 96 - hw;
    ctx.fillStyle = d.headlineGood ? '#dfeccd' : '#f3d6c8'; ctx.fillRect(hx, 70, hw, 24);
    ctx.fillStyle = d.headlineGood ? C.green : C.red; ctx.fillRect(hx, 70, hw, 2); ctx.fillRect(hx, 92, hw, 2);
    txt(ctx, d.headline, hx + hw / 2, 86, { size: 10.5, weight: 600, color: d.headlineGood ? C.green : C.red, align: 'center' });
  }
  ctx.fillStyle = C.line; ctx.fillRect(M, 122, PW - 2 * M, .8);
  doc.y = 140;

  // ---- KPI cards ----
  const kw = (PW - 2 * M - 3 * 10) / 4;
  d.kpis.forEach((k, i) => {
    const x = M + i * (kw + 10);
    ctx.fillStyle = C.card; ctx.fillRect(x, doc.y, kw, 70);
    ctx.fillStyle = C.line; ctx.fillRect(x, doc.y + 68, kw, 2);
    txt(ctx, k.label, x + 12, doc.y + 20, { size: 9, color: C.muted, max: kw - 20 });
    txt(ctx, k.value, x + 12, doc.y + 44, { size: 15, weight: 700, color: k.color || C.text, max: kw - 20 });
    txt(ctx, k.sub || '', x + 12, doc.y + 60, { size: 8.5, color: k.subColor || C.muted, max: kw - 20 });
  });
  doc.y += 92;

  // ---- categories ----
  const cats = d.cats.slice(0, 12);
  const rowsH = Math.max(150, cats.length * 22 + 10);
  doc.section(tr('Spending by category'), rowsH);
  doc.ensure(rowsH);
  ctx = doc.ctx;
  const cx = M + 70, cy = doc.y + 72, R = 62, th = 18;
  const total = cats.reduce((a, c) => a + c.value, 0) || 1;
  ctx.lineWidth = th; ctx.strokeStyle = C.line; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  let a0 = -Math.PI / 2;
  for (const c of d.catsDonut) {
    const a1 = a0 + (c.value / (d.catsDonut.reduce((a, x) => a + x.value, 0) || 1)) * Math.PI * 2;
    ctx.strokeStyle = c.color; ctx.beginPath(); ctx.arc(cx, cy, R, a0 + .02, Math.max(a0 + .03, a1 - .02)); ctx.stroke();
    a0 = a1;
  }
  txt(ctx, d.spentShort, cx, cy + 2, { size: 12, pixel: true, align: 'center' });
  txt(ctx, tr('spent'), cx, cy + 15, { size: 8.5, color: C.muted, align: 'center' });
  const tx0 = M + 160, tw = PW - M - tx0;
  txt(ctx, tr('Category'), tx0, doc.y + 8, { size: 8.5, weight: 600, color: C.faint });
  txt(ctx, tr('Share'), tx0 + tw * .52, doc.y + 8, { size: 8.5, weight: 600, color: C.faint, align: 'right' });
  txt(ctx, d.hasCatBudgets ? tr('Spent / limit') : tr('Spent'), PW - M, doc.y + 8, { size: 8.5, weight: 600, color: C.faint, align: 'right' });
  let ry = doc.y + 26;
  for (const c of cats) {
    ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(tx0 + 4, ry - 3.5, 4, 0, Math.PI * 2); ctx.fill();
    txt(ctx, `${c.icon} ${c.name}`, tx0 + 14, ry, { size: 10, max: tw * .38 });
    txt(ctx, Math.round((c.value / total) * 100) + '%', tx0 + tw * .52, ry, { size: 10, color: C.muted, align: 'right' });
    const over = c.budget && c.value > c.budget;
    txt(ctx, c.budget ? `${c.valueStr} / ${c.budgetStr}` : c.valueStr, PW - M, ry, { size: 10, weight: 600, color: over ? C.red : C.text, align: 'right' });
    // share bar
    const bx = tx0 + tw * .56, bw = tw * .12;
    ctx.fillStyle = C.line; rr(ctx, bx, ry - 7, bw, 5, 2.5); ctx.fill();
    const p = c.budget ? Math.min(1, c.value / c.budget) : c.value / total;
    ctx.fillStyle = over ? C.red : c.color; rr(ctx, bx, ry - 7, Math.max(2, bw * p), 5, 2.5); ctx.fill();
    ry += 22;
  }
  doc.y += rowsH + 14;

  // ---- daily chart ----
  doc.section(tr('Daily spending'), 140);
  doc.ensure(140); ctx = doc.ctx;
  bars(ctx, { x: M, y: doc.y, w: PW - 2 * M, h: 120, values: d.daily, labels: d.daily.map((_, i) => (i === 0 || (i + 1) % 5 === 0) ? String(i + 1) : ''), color: C.gold, ref: d.dailyBudget, fmt: d.fmtShort });
  doc.y += 140;
  txt(ctx, d.dailyNote, M, doc.y, { size: 9, color: C.muted }); doc.y += 22;

  // ---- 6 months ----
  doc.section(tr('Last 6 months'), 140);
  doc.ensure(140); ctx = doc.ctx;
  bars(ctx, { x: M, y: doc.y, w: PW - 2 * M, h: 120, values: d.months.map(m => m.value), labels: d.months.map(m => m.label), color: C.blue, colors: d.months.map((m, i) => i === d.months.length - 1 ? C.gold : (d.budget && m.value > d.budget ? '#d98a6c' : '#e2c27a')), ref: d.budget || null, fmt: d.fmtShort, valueLabels: d.months.map(m => m.valueStr) });
  doc.y += 150;

  // ---- top expenses ----
  if (d.top.length) {
    doc.section(tr('Biggest expenses'), 44);
    for (const t of d.top) {
      doc.ensure(22); ctx = doc.ctx;
      txt(ctx, t.date, M, doc.y + 10, { size: 9.5, color: C.muted });
      txt(ctx, t.title, M + 62, doc.y + 10, { size: 10, weight: 500, max: 250 });
      txt(ctx, t.cat, M + 330, doc.y + 10, { size: 9.5, color: C.muted, max: 120 });
      txt(ctx, t.value, PW - M, doc.y + 10, { size: 10, weight: 600, align: 'right' });
      ctx.fillStyle = C.line; ctx.fillRect(M, doc.y + 17, PW - 2 * M, .6);
      doc.y += 22;
    }
    doc.y += 14;
  }

  // ---- recurring ----
  if (d.recurring.length) {
    doc.section(tr('Tithes & dues'), 44);
    for (const r of d.recurring) {
      doc.ensure(22); ctx = doc.ctx;
      txt(ctx, r.name, M, doc.y + 10, { size: 10, weight: 500, max: 230 });
      txt(ctx, r.freq, M + 260, doc.y + 10, { size: 9.5, color: C.muted });
      txt(ctx, r.amount, PW - M, doc.y + 10, { size: 10, weight: 600, align: 'right' });
      ctx.fillStyle = C.line; ctx.fillRect(M, doc.y + 17, PW - 2 * M, .6);
      doc.y += 22;
    }
    doc.ensure(20); ctx = doc.ctx;
    txt(ctx, d.recurringTotal, PW - M, doc.y + 12, { size: 9.5, color: C.muted, align: 'right' });
    doc.y += 26;
  }

  // ---- every expense, by date ----
  if (d.all.length) {
    doc.newPage(); doc.y = M + 6; ctx = doc.ctx;
    txt(ctx, tr('Every entry, by date'), M, doc.y + 14, { size: 14, pixel: true });
    txt(ctx, d.allTotal, PW - M, doc.y + 14, { size: 9.5, color: C.muted, align: 'right' });
    doc.y += 30;
    const colCat = M + 200, colAcct = M + 330;
    for (const g of d.all) {
      doc.ensure(24 + 19); ctx = doc.ctx;
      ctx.fillStyle = C.card; ctx.fillRect(M, doc.y, PW - 2 * M, 20);
      txt(ctx, g.label, M + 8, doc.y + 13.5, { size: 9.5, weight: 700 });
      txt(ctx, g.sumStr, PW - M - 8, doc.y + 13.5, { size: 9.5, weight: 700, align: 'right' });
      doc.y += 24;
      for (const t of g.items) {
        doc.ensure(19); ctx = doc.ctx;
        txt(ctx, t.title, M + 8, doc.y + 10, { size: 9.5, weight: 500, max: colCat - M - 18 });
        txt(ctx, t.cat, colCat, doc.y + 10, { size: 9, color: C.muted, max: colAcct - colCat - 10 });
        txt(ctx, t.acct, colAcct, doc.y + 10, { size: 9, color: C.muted, max: 70 });
        txt(ctx, t.value, PW - M - 8, doc.y + 10, { size: 9.5, weight: 600, align: 'right', max: 105 });
        ctx.fillStyle = C.line; ctx.fillRect(M + 8, doc.y + 16, PW - 2 * M - 16, .5);
        doc.y += 19;
      }
      doc.y += 6;
    }
    doc.y += 10;
  }

  // ---- footers ----
  doc.pages.forEach((c, i) => {
    const x = c.getContext('2d');
    txt(x, `${tr("Dragon's Hoard")} · ${d.month}`, M, PH - 24, { size: 8, color: C.faint });
    txt(x, tr('Page {i} of {n}', { i: i + 1, n: doc.pages.length }), PW - M, PH - 24, { size: 8, color: C.faint, align: 'right' });
  });

  const jpgs = [];
  for (const c of doc.pages) jpgs.push(await canvasJpeg(c));
  return new Blob([pdfFromJpegs(jpgs, c => [c.width, c.height], doc.pages)], { type: 'application/pdf' });
}

function bars(ctx, { x, y, w, h, values, labels, color, colors, ref, fmt, valueLabels }) {
  // If one bar (e.g. rent day) dwarfs the rest, cap the scale and mark that bar as clipped.
  const sorted = [...values].sort((a, b) => b - a);
  let max = Math.max(1, ...values, ref || 0) * 1.12, capped = false;
  if (sorted[1] > 0 && sorted[0] > 2.5 * sorted[1]) { max = Math.max(sorted[1] * 1.4, (ref || 0) * 1.25); capped = true; }
  const n = values.length, slot = w / n, bw = Math.min(30, slot * .62);
  const base = y + h - 14, ih = h - 22;
  ctx.fillStyle = C.line; ctx.fillRect(x, base, w, .8);
  if (!capped) txt(ctx, fmt(max / 1.12), x, y + 6, { size: 8, color: C.faint });
  values.forEach((v, i) => {
    const clip = capped && v > max;
    const bh = Math.min(ih, (v / max) * ih), bx = x + slot * i + (slot - bw) / 2;
    if (v > 0) { ctx.fillStyle = colors ? colors[i] : color; ctx.fillRect(bx, base - bh, bw, Math.max(1, bh)); }
    if (clip) {
      ctx.fillStyle = C.paper; ctx.fillRect(bx - 1, base - ih + 8, bw + 2, 2.5); ctx.fillRect(bx - 1, base - ih + 13, bw + 2, 2.5);
      txt(ctx, fmt(v), bx + bw / 2 + 3, base - ih - 3, { size: 8, weight: 600, color: C.text, align: i > n - 4 ? 'right' : 'left' });
    }
    if (labels[i]) txt(ctx, labels[i], bx + bw / 2, base + 11, { size: 8, color: C.muted, align: 'center' });
    if (valueLabels && v > 0) txt(ctx, valueLabels[i], bx + bw / 2, base - bh - 4, { size: 8, weight: 600, color: C.text, align: 'center' });
  });
  if (ref) {
    const ry = base - (ref / max) * ih;
    ctx.save(); ctx.setLineDash([4, 3]); ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x + w, ry); ctx.stroke(); ctx.restore();
    txt(ctx, tr('coffer'), x + w, ry - 3, { size: 8, color: C.muted, align: 'right' });
  }
}

function canvasJpeg(c) {
  return new Promise((res, rej) => c.toBlob(b => b ? b.arrayBuffer().then(ab => res(new Uint8Array(ab))) : rej(new Error('toBlob failed')), 'image/jpeg', 0.9));
}

// Minimal PDF 1.4 writer: one full-page JPEG per page.
function pdfFromJpegs(jpgs, size, canvases) {
  const enc = new TextEncoder();
  const chunks = []; const offsets = []; let len = 0;
  const push = b => { const u = typeof b === 'string' ? enc.encode(b) : b; chunks.push(u); len += u.length; };
  const obj = (n, body) => { offsets[n] = len; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const n = jpgs.length;
  const pageIds = [], first = 3;
  for (let i = 0; i < n; i++) pageIds.push(first + i * 3);
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => push(`<< /Type /Pages /Count ${n} /Kids [${pageIds.map(id => id + ' 0 R').join(' ')}] >>`));
  jpgs.forEach((jpg, i) => {
    const [w, h] = size(canvases[i]);
    const pid = pageIds[i], iid = pid + 1, cid = pid + 2;
    obj(pid, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im${i} ${iid} 0 R >> >> /Contents ${cid} 0 R >>`));
    obj(iid, () => { push(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`); push(jpg); push('\nendstream'); });
    const content = `q ${PW} 0 0 ${PH} 0 0 cm /Im${i} Do Q`;
    obj(cid, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
  });
  const total = first + n * 3;
  const xref = len;
  push(`xref\n0 ${total}\n0000000000 65535 f \n`);
  for (let i = 1; i < total; i++) push(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
  push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const out = new Uint8Array(len); let p = 0;
  for (const c of chunks) { out.set(c, p); p += c.length; }
  return out;
}
