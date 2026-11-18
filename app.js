// app.js — boot, events, actions, exports.
import * as db from './db.js';
import * as fx from './fx.js';
import {
  S, defaults, load, saveSettings, upsert, remove, uid, today, curMonth, addMonthsKey, addDays, daysInMonth, monthName,
  fmtDate, parseAmount, round2, money, dispCur, fmtE, toDisp, curToEur, eurToCur, eurOf, cat, catsOf, accounts,
  monthStats, byCategory, topN, hasBudget, totalBudgetEUR, catBudgetEUR, advance, monthlyEquivalentEUR, freqLabel, pad,
  PALETTE, sortTx, acct, joeReset, importName, relabelDefaults, SPRITE_EMOJI,
} from './store.js';
import { t as tr, tn, setLang, lang } from './i18n.js';
import {
  renderTab, renderPage, tabBar, vTxList, sTx, sBudget, sRecurring, sGoal, sGoalAdd, sAccount, sCategory, sFilter,
  sWelcome, sFileReady, I, glyph,
} from './views.js';
import { buildReportPDF } from './report.js';
import { px } from './sprites.js';
import * as magic from './magic.js';
import * as game from './game.js';

const $ = id => document.getElementById(id);
const main = $('main'), tabbar = $('tabbar'), fab = $('fab'), sheetWrap = $('sheetWrap'), sheet = $('sheet'), toastEl = $('toast');
let sheetKind = null, budgetMode = null, pendingFile = null, lastDay = today(), toastTimer = null, promptActive = false;
let importFromWelcome = false;

// Hidden picker for CSV imports (created here so index.html doesn't need to change).
const csvInput = document.createElement('input');
csvInput.type = 'file'; csvInput.accept = '.csv,text/csv,text/comma-separated-values'; csvInput.multiple = true; csvInput.hidden = true;
document.body.appendChild(csvInput);

// ---------------------------------------------------------------- render
function render() {
  joeReset();
  const page = S.stack[S.stack.length - 1];
  main.innerHTML = page ? renderPage(page) : renderTab(S.tab);
  tabbar.innerHTML = tabBar();
  fab.hidden = page ? true : S.tab === 'more';
  if (!page && S.tab === 'more' && navigator.storage && navigator.storage.persisted) {
    navigator.storage.persisted().then(p => { const el = $('persistInfo'); if (el) el.textContent = p ? tr("Storage is marked persistent — iOS won't clear it automatically.") : tr('Tip: keep using the Home Screen icon so iOS keeps your hoard. Make a backup now and then.'); });
  }
}
const top0 = () => window.scrollTo(0, 0);

// ---------------------------------------------------------------- sheets & toasts
function openSheet(html, kind = null) {
  sheetKind = kind;
  sheet.innerHTML = html;
  sheetWrap.hidden = false;
  sheet.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  fitSheet();
}
function closeSheet() {
  sheetWrap.hidden = true; sheet.innerHTML = ''; sheetKind = null; S.draft = null;
  document.body.style.overflow = '';
  sheetWrap.style.top = ''; sheetWrap.style.height = '';
}
// Keep the sheet inside the part of the screen the keyboard doesn't cover,
// so the amount you are typing stays visible at the top.
function fitSheet() {
  const vv = window.visualViewport;
  if (!vv || sheetWrap.hidden) return;
  sheetWrap.style.top = vv.offsetTop + 'px';
  sheetWrap.style.height = vv.height + 'px';
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', fitSheet);
  window.visualViewport.addEventListener('scroll', fitSheet);
}
// Focus a field without iOS scrolling the half-animated sheet to the bottom.
function focusTop(input) {
  if (!input) return;
  try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
  const reset = () => { sheet.scrollTop = 0; window.scrollTo(0, 0); fitSheet(); };
  requestAnimationFrame(reset);
  setTimeout(reset, 320);
  setTimeout(reset, 650);
}
const field = name => sheet.elements[name];
const val = name => (field(name) ? field(name).value : '');

function toast(title, { sub = '', actions = [], persist = false, art = '' } = {}) {
  clearTimeout(toastTimer);
  toastEl.innerHTML = `${art ? `<span class="t-art">${px(art)}</span>` : ''}<span class="grow">${title}${sub ? `<small>${sub}</small>` : ''}</span>${actions.map(([l, a, alt]) => `<button class="tbtn${alt ? ' alt' : ''}" data-a="${a}">${l}</button>`).join('')}<button class="tx" data-a="toastClose" aria-label="Close">${I.x}</button>`;
  toastEl.hidden = false;
  if (!persist) toastTimer = setTimeout(hideToast, 2600);
}
function hideToast() { toastEl.hidden = true; toastEl.innerHTML = ''; }

// ---------------------------------------------------------------- currency conversion
async function convert(t) {
  try {
    const { rate, date } = await fx.rateOn(t.currency, t.date);
    t.rate = rate; t.rateDate = date; t.eur = round2(t.amount / rate); t.ratePending = false;
  } catch (e) {
    t.eur = null; t.ratePending = true;
  }
  return t;
}
async function resolvePending() {
  const pend = S.tx.filter(t => t.ratePending || typeof t.eur !== 'number');
  let fixed = 0;
  for (const t of pend) { await convert(t); if (!t.ratePending) { await upsert('tx', t); fixed++; } }
  return fixed;
}
function updateConvHint() {
  const el = $('convHint'); if (!el) return;
  const amt = parseAmount(val('amount')), cur = val('currency');
  if (!amt || cur === 'EUR') { el.textContent = cur === 'EUR' ? '' : ' '; return; }
  const eur = curToEur(amt, cur);
  const parts = [`≈ ${money(eur, 'EUR')}`];
  if (dispCur() !== 'EUR' && dispCur() !== cur) parts.push(fmtE(eur));
  el.textContent = parts.join(' · ') + (val('date') && val('date') < today() ? ' · ' + tr('exact rate for that day is used on save') : '');
}

// ---------------------------------------------------------------- recurring
async function processRecurring() {
  const t = today();
  let added = 0;
  for (const r of S.recur) {
    if (!r.active || r.type === 'income') continue;
    let guard = 0, changed = false;
    while (r.nextDate <= t && guard++ < 400) {
      const tx = { id: uid(), type: r.type, amount: r.amount, currency: r.currency, categoryId: r.categoryId, accountId: r.accountId, date: r.nextDate, note: r.name, recurringId: r.id, createdAt: Date.now() };
      await convert(tx);
      await upsert('tx', tx);
      r.nextDate = advance(r.nextDate, r.frequency, r.anchorDay);
      added++; changed = true;
    }
    if (changed) await upsert('recur', r);
  }
  return added;
}

// ---------------------------------------------------------------- files
function download(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function offerFile(blob, name) {
  const file = new File([blob], name, { type: blob.type });
  pendingFile = file;
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; openSheet(sFileReady(name), 'file'); return; }
  }
  download(file);
}
const csvCell = v => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csvBlob = lines => new Blob(['﻿' + lines.map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n'], { type: 'text/csv' });
const appFile = () => tr('Dragons-Hoard');
const monthFileName = mk => `${appFile()}-${monthName(mk).replace(/\s+/g, '-')}.csv`;

// Monthly summary: one column per category, one row with that month's sums (EUR), plus a Total.
async function exportCsv(mk) {
  if (S.tx.some(t => t.date.startsWith(mk) && (t.ratePending || typeof t.eur !== 'number'))) await resolvePending();
  const m = monthStats(mk);
  const cols = catsOf('expense').map(c => [c.name, m.byCat[c.id] || 0]);
  for (const [id, v] of Object.entries(m.byCat)) if (!catsOf('expense').some(c => c.id === id)) cols.push([cat(id).name, v]);
  const head = [...cols.map(c => c[0]), 'Total'];
  const row = [...cols.map(c => c[1].toFixed(2)), m.spent.toFixed(2)];
  await offerFile(csvBlob([head, row]), monthFileName(mk));
  return { count: m.count, spent: m.spent };
}
// Every expense ever recorded, one per row. This is the file that restores everything exactly.
async function exportAllCsv() {
  if (S.tx.some(t => t.ratePending || typeof t.eur !== 'number')) await resolvePending();
  const rows = S.tx.filter(t => t.type === 'expense').sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt || 0) - (b.createdAt || 0));
  const lines = [['Date', 'Amount (EUR)', 'Category', 'Description', 'Account', 'Original amount', 'Original currency']];
  for (const t of rows) lines.push([t.date, eurOf(t).toFixed(2), cat(t.categoryId).name, t.note || '', (acct(t.accountId) || {}).name || '', (+t.amount).toFixed(2), t.currency]);
  await offerFile(csvBlob(lines), `${appFile()}-${tr('All-expenses')}-${today()}.csv`);
}

// ---------------------------------------------------------------- CSV import
function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/, 1)[0];
  const delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim() !== ''));
}
function normDate(v) {
  v = String(v || '').trim();
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = v.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/); // 03/11/2026 — day first, as Excel saves it in the UK/EU
  if (m) return `${m[3]}-${pad(+m[2])}-${pad(+m[1])}`;
  return null;
}
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONATE = ['januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember'];
function monthFromName(name) {
  const n = name.toLowerCase();
  let m = n.match(/(\d{4})-(\d{2})/);
  if (m && +m[2] >= 1 && +m[2] <= 12) return `${m[1]}-${m[2]}`;
  m = n.match(/(january|february|march|april|may|june|july|august|september|october|november|december|januar|februar|märz|maerz|mai|juni|juli|oktober|dezember)[-_ ]?(\d{4})/);
  if (m) { const w = m[1] === 'maerz' ? 'märz' : m[1]; const i = MONTHS.indexOf(w) >= 0 ? MONTHS.indexOf(w) : MONATE.indexOf(w); return `${m[2]}-${pad(i + 1)}`; }
  return null;
}
// Reads detailed files (one expense per row: the "All expenses" CSV, or old v2 monthly CSVs)
// and monthly summary files (category columns + one row of sums).
async function readImportFiles(files) {
  const out = []; let incomeSkipped = 0, badRows = 0;
  for (const f of files) {
    const rows = parseCsv(await f.text());
    if (rows.length < 2) continue;
    const h = rows[0].map(x => x.trim().toLowerCase());
    const iD = h.findIndex(x => x.startsWith('date'));
    const iM = h.findIndex(x => x.startsWith('amount'));
    if (iD >= 0 && iM >= 0) {
      const col = k => h.findIndex(x => x.startsWith(k));
      const iT = col('type'), iC = col('category'), iA = col('account'), iO = col('original amount'), iOC = col('original currency');
      const iN = h.findIndex(x => x.startsWith('description') || x.startsWith('note'));
      for (const r of rows.slice(1)) {
        if (iT >= 0 && /^inc/i.test((r[iT] || '').trim())) { incomeSkipped++; continue; }
        const date = normDate(r[iD]), eur = round2(Math.abs(parseAmount(r[iM])));
        if (!date || !(eur > 0)) { badRows++; continue; }
        const oa = iO >= 0 ? round2(Math.abs(parseAmount(r[iO]))) : 0, oc = iOC >= 0 ? (r[iOC] || '').trim().toUpperCase() : '';
        const hasOrig = oa > 0 && /^[A-Z]{3}$/.test(oc);
        out.push({ date, eur, catName: (iC >= 0 ? r[iC] : '').trim() || 'Other', acctName: (iA >= 0 ? r[iA] : '').trim(), note: (iN >= 0 ? r[iN] : '').trim(), amount: hasOrig ? oa : eur, currency: hasOrig ? oc : 'EUR' });
      }
    } else {
      // monthly summary — the month comes from the file name (Expense-tracker-June-2026.csv)
      let mk = monthFromName(f.name);
      if (!mk) {
        const ans = prompt(tr('Which month is "{f}"? (e.g. 2026-06)', { f: f.name }), addMonthsKey(curMonth(), -1));
        if (ans === null) continue;
        mk = monthFromName(ans.trim());
        if (!mk) throw new Error(tr('"{a}" is not a month like 2026-06', { a: ans }));
      }
      const head = rows[0].map(x => x.trim()), vals = rows[1];
      const date = mk === curMonth() ? today() : `${mk}-${pad(daysInMonth(mk))}`;
      head.forEach((name, i) => {
        if (!name || /^total$/i.test(name)) return;
        const eur = round2(Math.abs(parseAmount(vals[i])));
        if (eur > 0) out.push({ date, eur, catName: name, acctName: '', note: `${monthName(mk)} total`, amount: eur, currency: 'EUR' });
      });
    }
  }
  return { out, incomeSkipped, badRows };
}
async function importCsv(files) {
  const { out, incomeSkipped, badRows } = await readImportFiles(files);
  const low = x => String(x || '').trim().toLowerCase();
  // Names from the plain Expenses app, older versions or the other language map onto the names used now.
  for (const r of out) { r.catName = importName(r.catName, 'cat'); if (r.acctName) r.acctName = importName(r.acctName, 'acct'); }
  // Skip anything already on the device, so importing the same file twice is harmless.
  const have = {};
  const key = (d, c, e, n) => `${d}|${low(c)}|${(+e).toFixed(2)}|${low(n)}`;
  for (const t of S.tx) if (t.type === 'expense') { const k = key(t.date, cat(t.categoryId).name, eurOf(t), t.note); have[k] = (have[k] || 0) + 1; }
  const fresh = out.filter(r => { const k = key(r.date, r.catName, r.eur, r.note); if (have[k] > 0) { have[k]--; return false; } return true; });
  const dupes = out.length - fresh.length;
  if (!fresh.length) {
    toast(out.length ? tr('Nothing new to import') : tr('No expenses found in that scroll'), { sub: out.length ? tr('All {n} entries are already here.', { n: out.length }) : (incomeSkipped ? tr('{n} income rows skipped.', { n: incomeSkipped }) : '') });
    return 0;
  }
  const uniq = list => list.filter((n, i, a) => a.findIndex(x => low(x) === low(n)) === i);
  const catByName = Object.fromEntries(catsOf('expense').map(c => [low(c.name), c]));
  const acctByName = Object.fromEntries(S.accts.map(a => [low(a.name), a]));
  const newCats = uniq(fresh.map(r => r.catName).filter(n => !catByName[low(n)]));
  const newAccts = uniq(fresh.map(r => r.acctName).filter(n => n && !acctByName[low(n)]));
  const extra = [dupes && tr('{n} already here (skipped)', { n: dupes }), incomeSkipped && tr('{n} income rows skipped.', { n: incomeSkipped }), badRows && tr('{n} unreadable rows skipped', { n: badRows }),
    newCats.length && tr('New categories: {l}', { l: newCats.join(', ') }), newAccts.length && tr('New purses: {l}', { l: newAccts.join(', ') })].filter(Boolean);
  if (!confirm(tn(fresh.length, 'Import {n} expense?', 'Import {n} expenses?') + (extra.length ? '\n\n' + extra.join('\n') : ''))) return 0;

  let order = catsOf('expense').length;
  const cats = newCats.map(name => { const c = { id: uid(), name, icon: '🍄', sprite: 'mushroom', color: PALETTE[order % PALETTE.length], type: 'expense', order: order++ }; catByName[low(name)] = c; return c; });
  let ao = S.accts.length;
  const accts = newAccts.map(name => { const a = { id: uid(), name, icon: '👛', sprite: 'pouch', openingEUR: 0, order: ao++ }; acctByName[low(name)] = a; return a; });
  const now = Date.now(), defAcct = S.settings.defaultAccount || (accounts()[0] || {}).id;
  const txs = fresh.map((r, i) => ({
    id: uid(), type: 'expense', amount: r.amount, currency: r.currency, categoryId: catByName[low(r.catName)].id,
    accountId: r.acctName ? acctByName[low(r.acctName)].id : defAcct,
    date: r.date, note: r.note, eur: r.eur, rate: r.currency === 'EUR' ? 1 : Math.round((r.amount / r.eur) * 1e4) / 1e4, rateDate: r.date,
    recurringId: null, imported: true, createdAt: now + i,
  }));
  if (cats.length) { await db.bulkPut('categories', cats); S.cats.push(...cats); }
  if (accts.length) { await db.bulkPut('accounts', accts); S.accts.push(...accts); }
  await db.bulkPut('transactions', txs); S.tx.push(...txs); sortTx();
  magic.sfx('chime');
  toast(tn(txs.length, '{n} expense imported', '{n} expenses imported'), { art: 'scroll', sub: cats.length ? tn(cats.length, '{n} new category added', '{n} new categories added') : '' });
  return txs.length;
}
csvInput.addEventListener('change', async () => {
  const files = [...(csvInput.files || [])];
  csvInput.value = '';
  if (!files.length) return;
  try {
    const n = await importCsv(files);
    if (n && importFromWelcome && sheetKind === 'welcome') await A.finishWelcome();
    else render();
  } catch (err) { console.error(err); toast(tr('Import failed'), { sub: String(err.message || err) }); }
  importFromWelcome = false;
});

async function exportPdf(mk) {
  toast(tr('The scribe is writing…'), { art: 'tome' });
  try {
    const blob = await buildReportPDF(reportData(mk));
    hideToast();
    await offerFile(blob, `${tr('hoard-chronicle')}-${mk}.pdf`);
  } catch (e) {
    console.error(e); toast(tr('Could not create the PDF'), { sub: String(e.message || e) });
  }
}
function reportData(mk) {
  const m = monthStats(mk), pk = addMonthsKey(mk, -1), p = monthStats(pk);
  const B = totalBudgetEUR(), hasB = hasBudget(), left = B - m.spent, dim = daysInMonth(mk);
  const isCur = mk === curMonth(), daysUsed = isCur ? +today().slice(8) : dim;
  const chg = p.spent > 0 ? (m.spent - p.spent) / p.spent : null;
  const green = '#248a3d', red = '#d70015';
  const cats = byCategory(mk + '-01', mk + '-31');
  const daily = Array.from({ length: dim }, () => 0);
  for (const t of S.tx) if (t.type === 'expense' && t.date.startsWith(mk)) daily[+t.date.slice(8) - 1] += eurOf(t);
  const busiest = daily.reduce((bi, v, i) => (v > daily[bi] ? i : bi), 0);
  const zero = daily.slice(0, daysUsed).filter(v => v === 0).length;
  const months = Array.from({ length: 6 }, (_, i) => addMonthsKey(mk, i - 5)).map(k => { const v = monthStats(k).spent; return { label: monthName(k, 'short', false), value: v, valueStr: v ? fmtE(v, { compact: true }) : '' }; });
  const monthExp = S.tx.filter(t => t.type === 'expense' && t.date.startsWith(mk)).sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt || 0) - (b.createdAt || 0));
  const all = [];
  for (const t of monthExp) {
    let g = all[all.length - 1];
    if (!g || g.key !== t.date) all.push(g = { key: t.date, label: fmtDate(t.date, { weekday: 'short', day: 'numeric', month: 'short' }), sum: 0, items: [] });
    g.sum += eurOf(t);
    const c = cat(t.categoryId);
    g.items.push({ title: t.note || c.name, cat: `${c.icon} ${c.name}`, acct: (acct(t.accountId) || {}).name || '', value: fmtE(eurOf(t)) + (t.currency !== dispCur() ? ` (${money(t.amount, t.currency)})` : '') });
  }
  all.forEach(g => { g.sumStr = fmtE(g.sum); });
  const top = S.tx.filter(t => t.type === 'expense' && t.date.startsWith(mk)).sort((a, b) => eurOf(b) - eurOf(a)).slice(0, 10)
    .map(t => ({ date: fmtDate(t.date, { day: 'numeric', month: 'short' }), title: t.note || cat(t.categoryId).name, cat: `${cat(t.categoryId).icon} ${cat(t.categoryId).name}`, value: fmtE(eurOf(t)) + (t.currency !== dispCur() ? ` (${money(t.amount, t.currency)})` : '') }));
  const rec = S.recur.filter(r => r.active && r.type === 'expense').sort((a, b) => monthlyEquivalentEUR(b) - monthlyEquivalentEUR(a));
  const recMonthly = rec.reduce((a, r) => a + monthlyEquivalentEUR(r), 0);
  return {
    month: monthName(mk), currency: dispCur(), generated: fmtDate(today(), { day: 'numeric', month: 'long', year: 'numeric' }),
    headline: hasB ? (left >= 0 ? tr('Under the coffer by {a}', { a: fmtE(left) }) : tr('Over the coffer by {a}', { a: fmtE(-left) })) : (chg != null ? tr(chg <= 0 ? 'Down {p}% vs {m}' : 'Up {p}% vs {m}', { p: Math.abs(Math.round(chg * 100)), m: monthName(pk, 'long', false) }) : ''),
    headlineGood: hasB ? left >= 0 : (chg == null || chg <= 0),
    kpis: [
      { label: isCur ? tr('Spent so far') : tr('Total spent'), value: fmtE(m.spent), sub: tn(m.count, '{n} expense', '{n} expenses') },
      hasB ? { label: tr('Monthly coffer'), value: fmtE(B, { whole: true }), sub: left >= 0 ? `${fmtE(left)} ${tr('left')}` : `${fmtE(-left)} ${tr('over')}`, subColor: left >= 0 ? green : red }
        : { label: tr('Average per day'), value: fmtE(m.spent / daysUsed), sub: tn(daysUsed, '{n} day', '{n} days') },
      { label: tr('vs {m}', { m: monthName(pk, 'long', false) }), value: chg == null ? '–' : `${chg <= 0 ? '↓' : '↑'} ${Math.abs(Math.round(chg * 100))}%`, color: chg == null ? undefined : chg <= 0 ? green : red, sub: `${monthName(pk, 'short', false)}: ${fmtE(p.spent, { whole: true })}` },
      cats[0] ? { label: tr('Top category'), value: `${cats[0].cat.icon} ${cats[0].cat.name}`, sub: `${fmtE(cats[0].value)} · ${tr('{p}% of spend', { p: Math.round(cats[0].value / (m.spent || 1) * 100) })}` } : { label: tr('Top category'), value: '–', sub: '' },
    ],
    cats: cats.map(x => ({ name: x.cat.name, icon: x.cat.icon, color: x.cat.color, value: x.value, valueStr: fmtE(x.value), budget: catBudgetEUR(x.cat.id), budgetStr: fmtE(catBudgetEUR(x.cat.id), { whole: true }) })),
    catsDonut: topN(cats, 6).map(x => ({ value: x.value, color: x.cat.color })),
    hasCatBudgets: hasB && S.settings.budget.mode === 'category',
    spentShort: fmtE(m.spent, { compact: true }),
    daily, dailyBudget: hasB ? B / dim : null,
    dailyNote: m.spent ? tr('Busiest day: {d} ({a}).', { d: fmtDate(`${mk}-${pad(busiest + 1)}`, { weekday: 'short', day: 'numeric', month: 'short' }), a: fmtE(daily[busiest]) }) + ' ' + tn(zero, '{n} day with no spending.', '{n} days with no spending.') + (hasB ? ' ' + tr('Dashed line = even daily share of your coffer ({a}).', { a: fmtE(B / dim) }) : '') : tr('No spending recorded this month.'),
    months, budget: hasB ? B : 0, fmtShort: v => fmtE(v, { compact: true }),
    top, all, allTotal: `${tn(monthExp.length, '{n} expense', '{n} expenses')} · ${tr('total {a}', { a: fmtE(m.spent) })}`,
    recurring: rec.map(r => ({ name: r.name, freq: freqLabel(r.frequency) + (r.isSub ? ' · ' + tr('guild due') : ''), amount: money(r.amount, r.currency) })),
    mood: dragonMoodFor(mk),
    recurringTotal: rec.length ? tr('≈ {a} per month · {b} per year', { a: fmtE(recMonthly), b: fmtE(recMonthly * 12, { whole: true }) }) : '',
  };
}

// ---------------------------------------------------------------- monthly CSV prompt
function maybeMonthlyPrompt() {
  const cm = curMonth(), lm = addMonthsKey(cm, -1);
  if (!S.settings.onboarded || S.settings.lastCsvPromptMonth === cm) return;
  if (!S.tx.some(t => t.date.startsWith(lm))) { S.settings.lastCsvPromptMonth = cm; saveSettings(); return; }
  promptActive = true;
  toast(tr('{m} is complete', { m: monthName(lm, 'long', false) }), { art: 'scroll', sub: tr("Shall the scribe write last month's chronicle (PDF) or summary CSV?"), actions: [['PDF', 'toastPdf', true], ['CSV', 'toastCsv']], persist: true });
}
function markPrompted() {
  if (!promptActive) return;
  promptActive = false; S.settings.lastCsvPromptMonth = curMonth(); saveSettings();
}

// ---------------------------------------------------------------- theme
const DAY = '#dfe8c8', NIGHT = '#0d1a1f';
async function persistRelabel() {
  const ch = relabelDefaults();
  if (ch.cats.length) await db.bulkPut('categories', ch.cats);
  if (ch.accts.length) await db.bulkPut('accounts', ch.accts);
}
function applyTheme() {
  const t = S.settings ? S.settings.theme : 'auto';
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('hoard-theme', t); } catch (e) { /* ignore */ }
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
    const light = (m.media || '').includes('light');
    m.content = t === 'dark' ? NIGHT : t === 'light' ? DAY : light ? DAY : NIGHT;
  });
  magic.refresh();
}
function dragonMoodFor(mk) {
  const m = monthStats(mk), B = totalBudgetEUR();
  if (!hasBudget()) return 'idle';
  return m.spent > B ? 'angry' : 'sleep';
}

// ---------------------------------------------------------------- drafts
function newTxDraft() {
  const st = S.settings;
  return { type: 'expense', amount: '', currency: st.defaultCurrency, categoryId: '', accountId: st.defaultAccount || (accounts()[0] || {}).id, date: today(), note: '' };
}
function captureDraft() {
  const d = S.draft; if (!d) return;
  for (const k of ['amount', 'currency', 'date', 'accountId', 'note', 'categoryId', 'name', 'frequency', 'nextDate', 'repeat']) if (field(k)) d[k] = field(k).value;
  if (field('isSub')) d.isSub = field('isSub').checked;
  if (field('active')) d.active = field('active').checked;
}
function rerenderDraftSheet() {
  const scroll = sheet.scrollTop;
  sheet.innerHTML = sheetKind === 'recurring' ? sRecurring(S.draft) : sTx(S.draft);
  if (S.draft.repeat && field('repeat')) { field('repeat').value = S.draft.repeat; toggleSubRow(); }
  if (S.draft.isSub && field('isSub')) field('isSub').checked = true;
  sheet.scrollTop = scroll;
  updateConvHint();
}
function toggleSubRow() {
  const row = sheet.querySelector('.sub-row');
  if (row) row.hidden = val('repeat') === 'never' || val('repeat') === '';
}

// ---------------------------------------------------------------- actions
const A = {
  tab(el) { S.tab = el.dataset.v; S.stack = []; render(); top0(); },
  push(el) { S.stack.push(el.dataset.v); render(); top0(); },
  back() { S.stack.pop(); render(); top0(); },
  homeRange(el) { S.ui.homeRange = el.dataset.v; render(); },
  insRange(el) { S.ui.insRange = el.dataset.v; render(); },
  txType(el) { S.ui.txType = el.dataset.v; S.ui.txLimit = 120; render(); },
  moreTx() { S.ui.txLimit += 150; $('txList').innerHTML = vTxList(); },
  goalsTab(el) { S.ui.goalsTab = el.dataset.v; render(); },
  catsType(el) { S.ui.catsType = el.dataset.v; render(); },

  // filter
  openFilter() { openSheet(sFilter(), 'filter'); },
  applyFilter() { S.ui.filter = { month: val('month'), cat: val('cat'), acct: val('acct') }; S.ui.txLimit = 120; closeSheet(); render(); },
  clearFilter() { S.ui.filter = { month: '', cat: '', acct: '' }; S.ui.search = ''; if (sheetKind) closeSheet(); render(); },

  // budgets
  budgetMonth(el) {
    const cur = S.ui.budgetMonth || curMonth();
    const next = addMonthsKey(cur, +el.dataset.v);
    if (next > curMonth()) return;
    S.ui.budgetMonth = next; render();
  },
  editBudget() { budgetMode = S.settings.budget.mode; openSheet(sBudget(), 'budget'); },
  budgetMode(el) {
    budgetMode = el.dataset.v;
    sheet.querySelectorAll('.seg button').forEach(b => b.classList.toggle('on', b.dataset.v === budgetMode));
    $('budTotal').hidden = budgetMode !== 'total'; $('budCats').hidden = budgetMode !== 'category';
  },
  async saveBudget() {
    const per = {};
    sheet.querySelectorAll('[data-cat]').forEach(i => { const n = parseAmount(i.value); if (n > 0) per[i.dataset.cat] = round2(n); });
    const total = round2(parseAmount(val('total')));
    if (budgetMode === 'total' && !(total > 0)) return toast(tr('Enter a monthly amount'));
    if (budgetMode === 'category' && !Object.keys(per).length) return toast(tr('Set at least one category limit'));
    S.settings.budget = { mode: budgetMode, total, perCategory: per, currency: dispCur() };
    await saveSettings(); closeSheet(); render(); magic.sfx('chime'); toast(tr('The coffer is sealed'), { art: 'chest' });
  },
  async clearBudget() {
    if (!confirm(tr('Remove your monthly coffer?'))) return;
    S.settings.budget = { mode: 'total', total: 0, perCategory: {}, currency: dispCur() };
    await saveSettings(); closeSheet(); render();
  },

  // transactions
  addTx() {
    S.draft = newTxDraft();
    openSheet(sTx(S.draft), 'tx');
    focusTop(field('amount'));
  },
  editTx(el) {
    const t = S.tx.find(x => x.id === el.dataset.id); if (!t) return;
    S.draft = { ...t };
    openSheet(sTx(S.draft), 'tx');
    updateConvHint();
  },
  draftType(el) {
    captureDraft();
    if (S.draft.type !== el.dataset.v) { S.draft.type = el.dataset.v; S.draft.categoryId = ''; }
    rerenderDraftSheet();
  },
  pickCat(el) {
    field('categoryId').value = el.dataset.id;
    sheet.querySelectorAll('.cat-grid .chip').forEach(c => c.classList.toggle('on', c === el));
  },
  async saveTx() {
    captureDraft();
    const d = S.draft;
    const amount = round2(Math.abs(parseAmount(d.amount)));
    if (!(amount > 0)) { toast(tr('Enter an amount')); field('amount').focus(); return; }
    if (!d.categoryId) return toast(tr('Pick a category'));
    if (!d.date) return toast(tr('Pick a date'));
    const old = d.id ? S.tx.find(x => x.id === d.id) : null;
    const t = {
      id: d.id || uid(), type: 'expense', amount, currency: d.currency, categoryId: d.categoryId, accountId: d.accountId,
      date: d.date, note: (d.note || '').trim(), createdAt: d.createdAt || Date.now(),
      recurringId: d.recurringId || null, eur: old ? old.eur : null, rate: old ? old.rate : null, rateDate: old ? old.rateDate : null,
    };
    const btn = sheet.querySelector('[data-a="saveTx"]'); if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
    if (!old || old.amount !== t.amount || old.currency !== t.currency || old.date !== t.date || typeof old.eur !== 'number') await convert(t);
    if (!d.id && d.repeat && d.repeat !== 'never') {
      const anchorDay = +t.date.slice(8);
      const r = { id: uid(), name: t.note || cat(t.categoryId).name, type: 'expense', amount, currency: t.currency, categoryId: t.categoryId, accountId: t.accountId, frequency: d.repeat, anchorDay, nextDate: advance(t.date, d.repeat, anchorDay), isSub: !!d.isSub, active: true, createdAt: Date.now() };
      await upsert('recur', r);
      t.recurringId = r.id;
    }
    await upsert('tx', t);
    if (t.accountId) { S.settings.lastAccount = t.accountId; }
    closeSheet();
    const added = d.repeat && d.repeat !== 'never' ? await processRecurring() : 0;
    render();
    magic.sfx('coin'); if (!old) magic.coinBurst();
    toast((old ? tr('Entry amended') : tr('Written in the ledger')) + (t.ratePending ? ' · ' + tr('rate will update when online') : '') + (added ? ' · ' + tn(added, '{n} repeat filled in', '{n} repeats filled in') : ''), { art: 'coin' });
  },
  async deleteTx() {
    if (!confirm(tr('Strike this expense from the ledger?'))) return;
    await remove('tx', S.draft.id); closeSheet(); render(); magic.sfx('burn'); toast(tr('Struck from the ledger'), { art: 'fire' });
  },

  // recurring
  newRecurring() {
    const st = S.settings;
    S.draft = { type: 'expense', name: '', amount: '', currency: st.defaultCurrency, categoryId: '', accountId: st.defaultAccount, frequency: 'monthly', nextDate: today(), isSub: true, active: true };
    openSheet(sRecurring(S.draft), 'recurring');
  },
  editRecurring(el) {
    const r = S.recur.find(x => x.id === el.dataset.id); if (!r) return;
    S.draft = { ...r }; openSheet(sRecurring(S.draft), 'recurring');
  },
  async saveRecurring() {
    captureDraft();
    const d = S.draft, amount = round2(Math.abs(parseAmount(d.amount)));
    if (!d.name.trim()) return toast(tr('Give it a name'));
    if (!(amount > 0)) return toast(tr('Enter an amount'));
    if (!d.categoryId) return toast(tr('Pick a category'));
    if (!d.nextDate) return toast(tr('Pick a date'));
    const r = { ...d, id: d.id || uid(), type: 'expense', name: d.name.trim(), amount, anchorDay: +d.nextDate.slice(8), active: d.id ? !!d.active : true, createdAt: d.createdAt || Date.now() };
    delete r.repeat;
    await upsert('recur', r);
    closeSheet();
    const added = await processRecurring();
    render();
    toast(d.id ? tr('Saved') : tr('Tithe added'), added ? { art: 'scroll', sub: tn(added, '{n} payment up to today written into the ledger', '{n} payments up to today written into the ledger') } : { art: 'scroll' });
  },
  async deleteRecurring() {
    if (!confirm(tr('Delete this recurring payment? Past entries stay.'))) return;
    await remove('recur', S.draft.id); closeSheet(); render();
  },

  // goals
  newGoal() {
    S.draft = { name: '', icon: '🧰', sprite: 'chest', color: '#4f6bd8', target: '', saved: '', currency: dispCur(), targetDate: '' };
    openSheet(sGoal(S.draft), 'goal');
  },
  editGoal(el) {
    const g = S.goals.find(x => x.id === el.dataset.id); if (!g) return;
    S.draft = { ...g }; openSheet(sGoal(S.draft), 'goal');
  },
  pickSprite(el) {
    const n = el.dataset.v;
    field('sprite').value = n;
    if (field('icon')) field('icon').value = SPRITE_EMOJI[n] || field('icon').value;
    sheet.querySelectorAll('.spr').forEach(b => b.classList.toggle('on', b === el));
    const p = $('catPrev'); if (p) p.innerHTML = px(n);
    magic.sfx('tick');
  },
  pickColor(el) {
    field('color').value = el.dataset.v;
    sheet.querySelectorAll('.sw').forEach(b => b.classList.toggle('on', b === el));
    const p = $('catPrev'); if (p) p.style.setProperty('--c', el.dataset.v);
  },
  async saveGoal() {
    const target = round2(parseAmount(val('target')));
    if (!val('name').trim()) return toast(tr('Give your goal a name'));
    if (!(target > 0)) return toast(tr('Enter a goal amount'));
    const d = S.draft;
    const g = { ...d, id: d.id || uid(), name: val('name').trim(), icon: val('icon'), sprite: val('sprite'), color: val('color'), target, saved: Math.max(0, round2(parseAmount(val('saved')))), currency: val('currency'), targetDate: val('targetDate'), createdAt: d.createdAt || Date.now(), history: d.history || [] };
    await upsert('goals', g); closeSheet(); render(); toast(d.id ? tr('Quest updated') : tr('A new quest begins'), { art: g.sprite || 'map' });
  },
  async deleteGoal() {
    if (!confirm(tr('Abandon this quest?'))) return;
    await remove('goals', S.draft.id); closeSheet(); render();
  },
  addToGoal(el) {
    const g = S.goals.find(x => x.id === el.dataset.id); if (!g) return;
    openSheet(sGoalAdd(g), 'goalAdd'); focusTop(field('amount'));
  },
  async saveGoalAdd(el) {
    const g = S.goals.find(x => x.id === el.dataset.id); if (!g) return;
    const n = round2(parseAmount(val('amount')));
    if (!n) return toast(tr('Enter an amount'));
    g.saved = Math.max(0, round2(g.saved + n));
    g.history = [...(g.history || []), { date: today(), amount: n }];
    await upsert('goals', g); closeSheet(); render();
    if (g.saved >= g.target) { magic.sfx('fanfare'); magic.confetti(); } else magic.sfx('coin');
    toast(g.saved >= g.target ? tr('Quest conquered!') : tr('{a} added to the quest', { a: money(n, g.currency) }), { art: g.saved >= g.target ? 'crown' : 'coins' });
  },

  // accounts
  newAccount() { S.draft = { name: '', icon: '👛', sprite: 'pouch', opening: '' }; openSheet(sAccount(S.draft), 'account'); },
  editAccount(el) {
    const a = S.accts.find(x => x.id === el.dataset.id); if (!a) return;
    S.draft = { ...a, opening: a.openingEUR ? round2(eurToCur(a.openingEUR, dispCur())) : '' };
    openSheet(sAccount(S.draft), 'account');
  },
  async saveAccount() {
    if (!val('name').trim()) return toast(tr('Give the purse a name'));
    const d = S.draft;
    const a = { id: d.id || uid(), name: val('name').trim(), icon: val('icon') || '👛', sprite: val('sprite'), openingEUR: d.openingEUR || 0, order: d.order ?? S.accts.length };
    await upsert('accts', a);
    if (field('isDefault').checked) { S.settings.defaultAccount = a.id; await saveSettings(); }
    closeSheet(); render();
  },
  async deleteAccount() {
    const d = S.draft;
    if (S.accts.length <= 1) return toast(tr('You need at least one purse'));
    const other = accounts().find(a => a.id !== d.id);
    const used = S.tx.filter(t => t.accountId === d.id);
    if (!confirm(used.length ? tr('Delete "{a}"? Its {n} expenses move to "{b}".', { a: d.name, n: used.length, b: other.name }) : tr('Delete "{a}"?', { a: d.name }))) return;
    for (const t of used) { t.accountId = other.id; await upsert('tx', t); }
    for (const r of S.recur.filter(r => r.accountId === d.id)) { r.accountId = other.id; await upsert('recur', r); }
    if (S.settings.defaultAccount === d.id) { S.settings.defaultAccount = other.id; await saveSettings(); }
    await remove('accts', d.id); closeSheet(); render();
  },

  // categories
  newCategory() { S.draft = { name: '', icon: '🍄', sprite: 'mushroom', color: PALETTE[catsOf('expense').length % PALETTE.length], type: 'expense' }; openSheet(sCategory(S.draft), 'category'); },
  editCategory(el) {
    const c = S.cats.find(x => x.id === el.dataset.id); if (!c) return;
    S.draft = { ...c }; openSheet(sCategory(S.draft), 'category');
  },
  async saveCategory() {
    if (!val('name').trim()) return toast(tr('Give the category a name'));
    const d = S.draft;
    const c = { ...d, id: d.id || uid(), name: val('name').trim(), icon: val('icon') || '🍄', sprite: val('sprite'), color: val('color'), order: d.order ?? catsOf(d.type).length };
    await upsert('cats', c); closeSheet(); render();
  },
  async deleteCategory() {
    const d = S.draft;
    const others = catsOf(d.type).filter(c => c.id !== d.id);
    if (!others.length) return toast(tr('You need at least one category'));
    const target = others.find(c => /other/i.test(c.name)) || others[others.length - 1];
    const used = S.tx.filter(t => t.categoryId === d.id);
    if (!confirm(used.length ? tr('Delete "{a}"? Its {n} expenses move to "{b}".', { a: d.name, n: used.length, b: target.name }) : tr('Delete "{a}"?', { a: d.name }))) return;
    for (const t of used) { t.categoryId = target.id; await upsert('tx', t); }
    for (const r of S.recur.filter(r => r.categoryId === d.id)) { r.categoryId = target.id; await upsert('recur', r); }
    if (S.settings.budget.perCategory[d.id]) { delete S.settings.budget.perCategory[d.id]; await saveSettings(); }
    await remove('cats', d.id); closeSheet(); render();
  },

  // currencies & theme
  async toggleCur(el) {
    const c = el.dataset.v, st = S.settings;
    if (st.currencies.includes(c)) {
      if (c === st.defaultCurrency) return toast(tr('That is your default currency'));
      st.currencies = st.currencies.filter(x => x !== c);
    } else {
      st.currencies.push(c);
      if (!fx.rates()[c]) fx.refresh([c]).then(render).catch(() => {});
    }
    await saveSettings(); render();
  },
  theme(el) { S.settings.theme = el.dataset.v; applyTheme(); saveSettings(); render(); },

  // calendar
  calMode(el) { S.ui.calMode = el.dataset.v; render(); },
  calNav(el) {
    const n = +el.dataset.v, u = S.ui;
    if (u.calMode === 'month') u.calMonth = addMonthsKey(u.calMonth || curMonth(), n);
    else if (u.calMode === 'week') { const t = today(); const d = new Date(); const w = (d.getDay() + 6) % 7; u.calWeek = addDays(u.calWeek || addDays(t, -w), 7 * n); }
    else u.calYear = (u.calYear || +today().slice(0, 4)) + n;
    render();
  },
  calSel(el) { S.ui.calSel = el.dataset.v; render(); },
  calJump(el) { S.ui.calMode = 'month'; S.ui.calMonth = el.dataset.v.slice(0, 7); S.ui.calSel = el.dataset.v; render(); },
  calSelMonth(el) { S.ui.calSelMonth = el.dataset.v; render(); },
  calGroup(el) {
    S.tab = 'tx'; S.stack = []; S.ui.search = ''; S.ui.txType = 'all';
    S.ui.filter = { month: el.dataset.m, cat: el.dataset.cat, acct: '' };
    render(); top0();
  },

  // data
  async backup() {
    const data = { app: 'dragons-hoard', version: 1, exportedAt: new Date().toISOString(), transactions: S.tx, categories: S.cats, accounts: S.accts, recurring: S.recur, goals: S.goals, settings: S.settings };
    await offerFile(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }), `dragons-hoard-backup-${today()}.json`);
  },
  restore() { $('restoreInput').value = ''; $('restoreInput').click(); },
  async eraseAll() {
    if (!confirm(tr('Burn the whole ledger? ALL data on this device is erased. This cannot be undone.'))) return;
    if (!confirm(tr('Really erase everything? Consider making a backup first.'))) return;
    await db.clearAll();
    try { localStorage.removeItem('hoard-theme'); } catch (e) { /* ignore */ }
    location.reload();
  },
  makeCsv(el) { exportCsv(el.dataset.v); },
  makeAllCsv() { exportAllCsv(); },
  importCsv() { importFromWelcome = sheetKind === 'welcome'; csvInput.value = ''; csvInput.click(); },
  makePdf(el) { exportPdf(el.dataset.v); },
  async shareFile() {
    if (!pendingFile) return closeSheet();
    try { await navigator.share({ files: [pendingFile], title: pendingFile.name }); } catch (e) { if (!e || e.name !== 'AbortError') download(pendingFile); }
    closeSheet();
  },

  // toasts
  toastClose() { markPrompted(); hideToast(); },
  toastCsv() { const lm = addMonthsKey(curMonth(), -1); markPrompted(); hideToast(); exportCsv(lm); },
  toastPdf() { const lm = addMonthsKey(curMonth(), -1); markPrompted(); hideToast(); exportPdf(lm); },

  // welcome
  async finishWelcome() {
    const cur = val('cur') || 'GBP', b = round2(parseAmount(val('budget')));
    const st = S.settings;
    st.defaultCurrency = cur;
    st.currencies = [...new Set([cur, 'EUR', 'GBP', 'USD'])];
    st.budget = { mode: 'total', total: b > 0 ? b : 0, perCategory: {}, currency: cur };
    st.onboarded = true;
    st.lastCsvPromptMonth = curMonth();
    await saveSettings();
    closeSheet();
    if (!fx.rates()[cur]) { try { await fx.refresh([cur]); } catch (e) { /* offline */ } }
    render();
  },

  closeSheet() { if (sheetKind === 'welcome') return; closeSheet(); },

  // language: switches every text, and renames the built-in categories and purses
  async lang(el) {
    const L = el.dataset.v;
    if (L === lang()) return;
    if (sheetKind === 'welcome') { S.draftWelcome = { cur: val('cur'), budget: val('budget') }; }
    setLang(L); S.settings.lang = L;
    await saveSettings();
    await persistRelabel();
    if (sheetKind === 'welcome') {
      openSheet(sWelcome(), 'welcome');
      if (S.draftWelcome) { field('cur').value = S.draftWelcome.cur; field('budget').value = S.draftWelcome.budget; }
    }
    render();
    toast(tr('Language: English'), { art: 'tome' });
  },

  // the forest
  poke(el) { magic.sfx('roar'); el.classList.add('poked'); setTimeout(() => game.open(S.settings, saveSettings), 380); },
  playGame() { game.open(S.settings, saveSettings); },
  counsel() { magic.counsel(toast); },
  fairy() { magic.counsel(toast, true); },
};

// ---------------------------------------------------------------- events
document.addEventListener('click', e => {
  const pile = e.target.closest('.joe');
  if (pile) { pile.classList.remove('rustle'); void pile.offsetWidth; pile.classList.add('rustle'); magic.sfx('rustle'); }
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.a];
  if (!fn) return;
  e.preventDefault();
  Promise.resolve(fn(el, e)).catch(err => { console.error(err); toast(tr('Something went wrong'), { sub: String(err.message || err) }); });
});

document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'txSearch') { S.ui.search = el.value; S.ui.txLimit = 120; $('txList').innerHTML = vTxList(); }
  else if (el.id === 'curSearch') {
    S.ui.curSearch = el.value; const pos = el.selectionStart; render();
    const n = $('curSearch'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (err) { /* ignore */ } }
  }
  else if (el.name === 'amount' && sheet.contains(el)) updateConvHint();
  else if (el.name === 'icon' && (sheetKind === 'category' || sheetKind === 'account')) {
    // typing an emoji replaces the pixel sprite
    if (field('sprite')) field('sprite').value = '';
    sheet.querySelectorAll('.spr').forEach(b => b.classList.remove('on'));
    const p = $('catPrev'); if (p) p.innerHTML = glyph({ icon: el.value || '🍄' });
  }
});

document.addEventListener('change', async e => {
  const el = e.target, k = el.dataset.change;
  if (!k) return;
  if (k === 'convHint') updateConvHint();
  else if (k === 'repeat') toggleSubRow();
  else if (k === 'defaultCurrency') {
    S.settings.defaultCurrency = el.value;
    if (!S.settings.currencies.includes(el.value)) S.settings.currencies.push(el.value);
    await saveSettings();
    if (!fx.rates()[el.value]) { try { await fx.refresh([el.value]); } catch (err) { /* offline */ } }
    render(); toast(tr('Counting in {c} now', { c: el.value }), { art: 'coins' });
  } else if (k === 'reportMonth') { S.ui.reportMonth = el.value; render(); }
  else if (k === 'joeMode') {
    S.settings.joeMode = el.checked; await saveSettings();
    if (el.checked) { document.body.classList.add('leaf-in'); render(); magic.leafStorm(); setTimeout(() => document.body.classList.remove('leaf-in'), 1600); }
    else { document.body.classList.add('leaf-blow'); await new Promise(r => setTimeout(r, 520)); document.body.classList.remove('leaf-blow'); render(); }
    magic.sfx(el.checked ? 'rustle' : 'wind');
    toast(el.checked ? tr('Joe Mode on — the leaves have fallen') : tr('Joe Mode off — the wind blew the leaves away'), { art: el.checked ? 'leaf0' : 'leaf2', sub: el.checked ? tr('Totals are hidden. Everything is still tracked and exported.') : '' });
  }
  else if (k === 'sound') { S.settings.sound = el.checked; await saveSettings(); magic.sfx('chime'); }
  else if (k === 'ambient') { S.settings.ambient = el.checked; await saveSettings(); magic.refresh(); }
});

$('restoreInput').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    // Backups from the plain Expenses app restore here too.
    if (!['dragons-hoard', 'expense-tracker'].includes(data.app) || !Array.isArray(data.transactions)) throw new Error(tr('This is not a backup from this app.'));
    if (!confirm(tr('Restore backup from {d} with {n} transactions? Everything currently on this device is replaced.', { d: (data.exportedAt || '').slice(0, 10), n: data.transactions.length }))) return;
    await db.clearAll();
    await db.bulkPut('transactions', data.transactions);
    await db.bulkPut('categories', data.categories || []);
    await db.bulkPut('accounts', data.accounts || []);
    await db.bulkPut('recurring', data.recurring || []);
    await db.bulkPut('goals', data.goals || []);
    await db.kvSet('settings', { sound: false, ambient: true, ...data.settings, onboarded: true, lastCsvPromptMonth: curMonth() });
    await load(); setLang(S.settings.lang || lang()); applyTheme(); render(); toast(tr('The hoard is restored'), { art: 'chest' });
  } catch (err) { toast(tr('Restore failed'), { sub: String(err.message || err) }); }
});

document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible' || !S.settings) return;
  if (today() !== lastDay) {
    lastDay = today();
    await fx.init(S.settings.currencies);
    const n = await processRecurring();
    if (!sheetKind) render();
    maybeMonthlyPrompt();
    if (n) toast(tn(n, '{n} tithe written into the ledger', '{n} tithes written into the ledger'), { art: 'scroll' });
  }
});
window.addEventListener('online', async () => { if (await resolvePending()) render(); });

// ---------------------------------------------------------------- boot
async function boot() {
  await load();
  // first visit: follow the phone's language (German phones start in German)
  setLang(S.settings && S.settings.lang ? S.settings.lang : ((navigator.language || 'en').toLowerCase().startsWith('de') ? 'de' : 'en'));
  let first = false;
  if (!S.settings) {
    const d = defaults();
    await db.bulkPut('categories', d.cats); await db.bulkPut('accounts', d.accts);
    S.cats = d.cats; S.accts = d.accts; S.settings = d.settings;
    await saveSettings();
    first = true;
  }
  if (!S.settings.onboarded) first = true;
  if (!S.settings.lang) { S.settings.lang = lang(); await saveSettings(); }
  setLang(S.settings.lang);
  await persistRelabel();
  magic.init(() => S.settings);
  fab.innerHTML = px('bigcoin');
  applyTheme();
  render();
  try { await fx.init(S.settings.currencies); } catch (e) { /* offline */ }
  const added = await processRecurring();
  render();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if (first) openSheet(sWelcome(), 'welcome');
  else {
    maybeMonthlyPrompt();
    if (added && !promptActive) toast(tn(added, '{n} tithe written into the ledger', '{n} tithes written into the ledger'), { art: 'scroll' });
  }
  if (await resolvePending()) render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

boot().catch(err => {
  console.error(err);
  main.innerHTML = `<div class="empty"><div class="empty-e">⚠️</div><div class="empty-t">${tr('The hoard could not be opened')}</div><div class="empty-s">${String(err.message || err)}</div></div>`;
});
