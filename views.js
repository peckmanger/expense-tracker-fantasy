// views.js — every screen and sheet, rendered as HTML strings from state.
// All visible text goes through tr() / tn() (i18n.js), so it appears in the chosen language.
import {
  S, CURRENCIES, curName, PALETTE, SPRITE_EMOJI, esc, pad, today, parseD, curMonth, addMonthsKey, addDays, daysInMonth,
  monthName, fmtDate, dayLabel, daysBetween, startOfWeek, money, dispCur, fmtE, eurToCur, curToEur, eurOf, rate,
  cat, acct, catsOf, accounts, sumRange, monthStats, byCategory, topN, hasBudget,
  totalBudgetEUR, catBudgetEUR, monthlyEquivalentEUR, occurrences, freqLabel, ymd, fmtT, fmtAxis, joe, spentByAccount,
} from './store.js';
import { lineChart, barChart, donut } from './charts.js';
import { px, px2, ico, SPR, ITEM_SPRITES } from './sprites.js';
import { t as tr, tn, loc, lang } from './i18n.js';
import * as fx from './fx.js';

// ---------- icons ----------
export const I = new Proxy({}, { get: (_, k) => ico(String(k)) });

// ---------- small building blocks ----------
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);
const tint = c => `--c:${c}`;
export const glyph = o => (o && o.sprite && SPR[o.sprite] ? px(o.sprite) : `<span class="emo-t">${esc(o && o.icon)}</span>`);
const icon = (c, cls = '') => `<span class="ic ${cls}" style="${tint(c.color || '#8e8578')}">${glyph(c)}</span>`;
const art = a => (SPR[a] ? px(a, 'art') : `<span class="emo-t">${a}</span>`);
const mon = (k, len = 'long', yr = false) => monthName(k, len, yr);

function header(title, { right = '', back = false, eyebrow = '' } = {}) {
  return `<header class="nav">
    ${back ? `<button class="back" data-a="back">${I.chevL}<span>${tr('Back')}</span></button>` : ''}
    <div class="nav-row"><div class="nav-title">${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}<h1>${title}</h1></div>
    <div class="nav-actions">${right}</div></div></header>`;
}
const iconBtn = (ic, a, attrs = '', badge = false) => `<button class="icon-btn${badge ? ' badge' : ''}" data-a="${a}" ${attrs}>${ic}</button>`;
const seg = (opts, cur, action, cls = '') => `<div class="seg ${cls}">${opts.map(([v, l]) => `<button data-a="${action}" data-v="${v}" class="${v === cur ? 'on' : ''}">${l}</button>`).join('')}</div>`;
const bar = (p, color) => `<div class="bar"><span style="width:${Math.min(100, Math.max(0, p))}%;background:${color}"></span></div>`;
const empty = (a, title, text, btn = '') => `<div class="empty"><div class="empty-e">${art(a)}</div><div class="empty-t">${title}</div><div class="empty-s">${text}</div>${btn}</div>`;
const status = (kind, a, title, text) => `<section class="status ${kind}"><div class="st-e">${art(a)}</div><div><b>${title}</b><p>${text}</p></div></section>`;
const changeBadge = (chg, invert = true, cls = '') => {
  if (chg == null || !isFinite(chg)) return '';
  const good = invert ? chg <= 0 : chg >= 0;
  return `<span class="chg ${good ? 'good' : 'bad'} ${cls}">${chg <= 0 ? '↓' : '↑'} ${Math.abs(Math.round(chg * 100))}%</span>`;
};
const compact = v => fmtAxis(v);
const compactT = v => fmtT(v, { compact: true });
const RANGES = () => [['1M', tr('1M')], ['3M', tr('3M')], ['6M', tr('6M')], ['1Y', tr('1Y')]];

export function txRow(t) {
  const c = cat(t.categoryId), a = acct(t.accountId);
  const title = t.note || c.name;
  const sub = [t.note ? c.name : null, a && a.name].filter(Boolean).join(' • ');
  const orig = t.currency !== dispCur() ? money(t.amount, t.currency) : '';
  return `<button class="row" data-a="editTx" data-id="${t.id}">${icon(c)}
    <span class="grow"><span class="t1">${esc(title)}</span><span class="t2">${esc(sub)}${t.recurringId ? ' • ↻' : ''}</span></span>
    <span class="amt"><span>${fmtE(eurOf(t))}</span>${orig ? `<small>${orig}${t.ratePending ? ' · ' + tr('rate pending') : ''}</small>` : ''}</span></button>`;
}

function dailyTotals(mk) {
  const d = {};
  for (const t of S.tx) if (t.type === 'expense' && t.date.startsWith(mk)) { const k = +t.date.slice(8); d[k] = (d[k] || 0) + eurOf(t); }
  return d;
}
function cumulative(mk, upto) {
  const daily = dailyTotals(mk), dim = daysInMonth(mk), out = [];
  let acc = 0;
  for (let i = 1; i <= dim; i++) { acc += daily[i] || 0; out.push(i <= upto ? acc : null); }
  return out;
}
function legend(items, total) {
  return `<div class="legend">${items.map(x => `<div class="lg"><i style="background:${x.cat.color}"></i><span class="grow">${esc(x.cat.name)}</span><b>${pct(x.value, total)}%</b></div>`).join('')}</div>`;
}

// ---------- tab bar ----------
export function tabBar() {
  const tabs = [['home', tr('Hearth'), 'home'], ['tx', tr('Ledger'), 'list'], ['budgets', tr('Coffers'), 'budget'], ['insights', tr('Oracle'), 'insights'], ['more', tr('Satchel'), 'more']];
  return tabs.map(([id, l, ic]) => `<button data-a="tab" data-v="${id}" class="${S.tab === id ? 'on' : ''}">${I[ic]}<span>${l}</span></button>`).join('');
}

// ---------- the dragon's mood (home scene) ----------
export function dragonState() {
  const mk = curMonth(), m = monthStats(mk), dim = daysInMonth(mk), dayN = +today().slice(8);
  const B = totalBudgetEUR(), hasB = hasBudget(), left = B - m.spent;
  let mood = 'idle', pile = 2, line = tr('Your dragon guards the hoard.');
  if (hasB) {
    const pace = (m.spent / B) / (dayN / dim);
    if (left < 0) { mood = 'angry'; line = tr('The dragon is furious — the coffer is empty!'); }
    else if (pace <= 1.02) { mood = 'sleep'; line = tr('The dragon sleeps soundly. All is well.'); }
    else { mood = 'idle'; line = tr('The dragon stirs… spending is ahead of pace.'); }
    const f = left / B;
    pile = f > 0.66 ? 3 : f > 0.33 ? 2 : f > 0 ? 1 : 0;
  }
  if (joe()) pile = 1; // the pile would give the total away
  return { mood, pile, line };
}
function dragonScene() {
  const { mood, pile, line } = dragonState();
  return `<button class="hero-dragon mood-${mood} pile-${pile}" data-a="poke" aria-label="${esc(line)} ${tr('Tap to play Dragon Flight')}">
    ${mood === 'angry' ? `<span class="breath">${px('fire')}</span>` : ''}
    ${mood === 'sleep' ? '<span class="zzz"><i>z</i><i>z</i><i>Z</i></span>' : ''}
    ${px2(`dragon_up_${mood}`, `dragon_down_${mood}`, 'flap')}
    <span class="hoard">${px('gold' + pile)}</span>
  </button>`;
}

// =====================================================================
// HEARTH (home)
// =====================================================================
export function vHome() {
  const mk = curMonth(), pk = addMonthsKey(mk, -1), m = monthStats(mk);
  const t = today(), dayN = +t.slice(8), dim = daysInMonth(mk);
  const pSame = sumRange(pk + '-01', pk + '-' + pad(Math.min(dayN, daysInMonth(pk))));
  const chg = pSame > 0 ? (m.spent - pSame) / pSame : null;
  const B = totalBudgetEUR(), hasB = hasBudget(), left = B - m.spent;
  const range = S.ui.homeRange;
  let chart;
  const heroLabel = 'var(--hero-label)';
  if (range === '1M') {
    const series = [];
    if (hasB) series.push({ values: Array.from({ length: dim }, (_, i) => (B * (i + 1)) / dim), color: 'var(--hero-ref)', width: 1.5, dash: '4 4' });
    const last = cumulative(pk, 31).slice(0, dim);
    while (last.length < dim) last.push(null);
    series.push({ values: last, color: 'var(--hero-prev)', width: 1.5 });
    series.push({ values: cumulative(mk, dayN), color: 'var(--gold)', fill: true, dot: true, width: 3 });
    chart = lineChart({ series, n: dim, h: 140, grid: false, labelColor: heroLabel, xLabels: [[0, '1 ' + mon(mk, 'short')], [Math.floor(dim / 2) - 1, String(Math.floor(dim / 2))], [dim - 1, String(dim)]] });
  } else {
    const N = { '3M': 3, '6M': 6, '1Y': 12 }[range];
    const months = Array.from({ length: N }, (_, i) => addMonthsKey(mk, i - N + 1));
    const series = [];
    if (hasB) series.push({ values: months.map(() => B), color: 'var(--hero-ref)', width: 1.5, dash: '4 4' });
    series.push({ values: months.map(k => monthStats(k).spent), color: 'var(--gold)', fill: true, dot: true, width: 3, dots: N <= 6 });
    chart = lineChart({ series, n: N, h: 140, grid: false, labelColor: heroLabel, xLabels: months.map((k, i) => [i, mon(k, 'short')]).filter((_, i) => N <= 6 || i % 3 === 0 || i === N - 1) });
  }
  const daysLeft = dim - dayN + 1;
  const cats = topN(byCategory(mk + '-01', mk + '-31'), 5);

  const horizon = addDays(t, 14);
  const upcoming = S.recur.flatMap(r => occurrences(r, t, horizon).map(d => ({ r, d }))).sort((a, b) => a.d.localeCompare(b.d)).slice(0, 5);
  const byAcct = spentByAccount(mk + '-01', mk + '-31');
  const goals = S.goals.filter(g => g.saved < g.target).slice(0, 2);
  const recent = S.tx.slice(0, 5);
  const chgTxt = chg != null ? tr('{p} vs last month', { p: `${chg <= 0 ? '↓' : '↑'} ${Math.abs(Math.round(chg * 100))}%` }) : '';

  return `
  ${header(tr('My Hoard'), { eyebrow: new Date().toLocaleDateString(loc(), { weekday: 'long', day: 'numeric', month: 'long' }), right: iconBtn(I.gear, 'tab', `data-v="more" aria-label="${tr('Satchel')}"`) })}
  <section class="hero">
    <div class="hero-sky" aria-hidden="true"><i class="orb"></i><i class="s1"></i><i class="s2"></i><i class="s3"></i><i class="s4"></i></div>
    <div class="hero-forest" aria-hidden="true"></div>
    <div class="hero-head">
      <div class="hero-txt">
        <div class="hero-top">${tr('Gold spent in {m}', { m: mon(mk) })}</div>
        <div class="hero-amt">${fmtT(m.spent)}</div>
        ${chg != null ? `<span class="hero-chg ${chg <= 0 ? 'good' : 'bad'}">${chgTxt}</span>` : ''}
      </div>
      ${dragonScene()}
    </div>
    <div class="hero-sub">${hasB ? (left >= 0 ? tr('{a} left of {b} coffer', { a: `<b class="g">${fmtT(left)}</b>`, b: fmtT(B, { whole: true }) }) : tr('{a} beyond your {b} coffer', { a: `<b class="r">${fmtT(-left)}</b>`, b: fmtT(B, { whole: true }) })) : `<button class="link-light" data-a="editBudget">${tr('Set a monthly coffer →')}</button>`}</div>
    <div class="hero-chart">${chart}</div>
    ${seg(RANGES(), range, 'homeRange', 'seg-dark')}
  </section>

  <div class="tiles">
    <div class="tile t-blue"><div class="tile-ic">${px('coins')}</div><div class="tile-l">${tr('Gold spent')}</div><div class="tile-v">${fmtT(m.spent, { whole: m.spent >= 1000 })}</div><div class="tile-s">${tn(m.count, '{n} payment', '{n} payments')} ${chg != null ? changeBadge(chg) : ''}</div></div>
    ${hasB
      ? `<div class="tile ${left >= 0 ? 't-green' : 't-red'}"><div class="tile-ic">${px('pouch')}</div><div class="tile-l">${tr('Per day left')}</div><div class="tile-v">${fmtT(Math.max(0, left) / daysLeft)}</div><div class="tile-s">${tn(daysLeft, 'for {n} day', 'for {n} days')}</div></div>`
      : `<div class="tile t-green"><div class="tile-ic">${px('pouch')}</div><div class="tile-l">${tr('Average / day')}</div><div class="tile-v">${fmtT(m.spent / dayN)}</div><div class="tile-s">${tr('this month')}</div></div>`}
  </div>

  <section class="card">
    <div class="card-h"><h3>${tr('Where the gold went')}</h3>${iconBtn(I.chevR, 'tab', `data-v="insights" aria-label="${tr('Oracle')}"`)}</div>
    ${cats.length ? `<div class="donut-row">${donut({ items: cats.map(x => ({ value: x.value, color: x.cat.color })), size: 132 })}${legend(cats, m.spent)}</div>`
      : empty('chest', tr('The ledger is empty'), tr('Tap the gold coin to record your first expense.'))}
  </section>

  ${upcoming.length ? `<section class="card"><div class="card-h"><h3>${tr('Coming due')}</h3><button class="txt-btn" data-a="push" data-v="subs">${tr('All')}</button></div>
    ${upcoming.map(({ r, d }) => { const c = cat(r.categoryId); const n = daysBetween(t, d);
      return `<button class="row" data-a="editRecurring" data-id="${r.id}">${icon(c)}<span class="grow"><span class="t1">${esc(r.name)}</span><span class="t2">${n === 0 ? tr('Today') : n === 1 ? tr('Tomorrow') : tr('In {n} days', { n })} · ${fmtDate(d, { day: 'numeric', month: 'short' })}</span></span><span class="amt"><span>${money(r.amount, r.currency)}</span></span></button>`; }).join('')}
  </section>` : ''}

  <section class="card">
    <div class="card-h"><h3>${tr('Paid from')}</h3><button class="txt-btn" data-a="push" data-v="accounts">${tr('Manage')}</button></div>
    ${accounts().map(a => `<div class="mini-row"><span class="mini-ic">${glyph(a)} ${esc(a.name)}</span><span>${fmtT(byAcct[a.id] || 0)}</span></div>`).join('')}
  </section>

  ${goals.length ? `<section class="card"><div class="card-h"><h3>${tr('Treasure quests')}</h3><button class="txt-btn" data-a="push" data-v="goals">${tr('All')}</button></div>
    ${goals.map(g => { const p = pct(g.saved, g.target); return `<button class="goal-mini" data-a="push" data-v="goals"><span class="ic" style="${tint(g.color || '#4f6bd8')}">${glyph(g)}</span><span class="grow"><span class="row-sb"><b>${esc(g.name)}</b><span class="muted small">${money(g.saved, g.currency, { whole: true })} / ${money(g.target, g.currency, { whole: true })}</span></span>${bar(p, 'var(--gold)')}</span></button>`; }).join('')}
  </section>` : ''}

  <section class="card">
    <div class="card-h"><h3>${tr('Latest entries')}</h3><button class="txt-btn" data-a="tab" data-v="tx">${tr('See all')}</button></div>
    ${recent.length ? recent.map(txRow).join('') : `<div class="muted small pad">${tr('Nothing written yet.')}</div>`}
  </section>`;
}

// =====================================================================
// LEDGER (transactions)
// =====================================================================
function filteredTx() {
  const u = S.ui;
  let list = S.tx.filter(t => t.type === 'expense');
  if (u.filter.month) list = list.filter(t => t.date.startsWith(u.filter.month));
  if (u.filter.cat) list = list.filter(t => t.categoryId === u.filter.cat);
  if (u.filter.acct) list = list.filter(t => t.accountId === u.filter.acct);
  if (u.search.trim()) {
    const q = u.search.trim().toLowerCase();
    list = list.filter(t => (t.note || '').toLowerCase().includes(q) || cat(t.categoryId).name.toLowerCase().includes(q)
      || ((acct(t.accountId) || {}).name || '').toLowerCase().includes(q) || String(t.amount).includes(q) || t.currency.toLowerCase() === q);
  }
  return list;
}
export function vTxList() {
  const list = filteredTx();
  if (!list.length) return S.tx.some(t => t.type === 'expense') ? empty('map', tr('Nothing found'), tr('Try a different search or filter.')) : empty('scroll', tr('The ledger is blank'), tr('Tap the gold coin to record your first expense.'));
  const out = [];
  const spent = list.reduce((a, t) => a + eurOf(t), 0);
  out.push(`<div class="list-sum muted small">${tn(list.length, '{n} expense', '{n} expenses')} · ${fmtT(spent)}</div>`);
  let shown = 0, curDate = null, group = [];
  const flush = () => {
    if (!group.length) return;
    const sum = group.reduce((a, t) => a + eurOf(t), 0);
    out.push(`<section class="card day"><div class="day-h"><b>${dayLabel(curDate)}</b><span>${fmtT(sum)}</span></div>${group.map(txRow).join('')}</section>`);
    group = [];
  };
  for (const t of list) {
    if (shown >= S.ui.txLimit) break;
    if (t.date !== curDate) { flush(); curDate = t.date; }
    group.push(t); shown++;
  }
  flush();
  if (list.length > shown) out.push(`<button class="btn-secondary" data-a="moreTx">${tr('Turn the page ({n} more)', { n: list.length - shown })}</button>`);
  return out.join('');
}
export function vTx() {
  const f = S.ui.filter;
  const active = [f.month && monthName(f.month, 'short'), f.cat && cat(f.cat).name, f.acct && (acct(f.acct) || {}).name].filter(Boolean);
  return `${header(tr('Ledger'), { right: iconBtn(I.filter, 'openFilter', `aria-label="${tr('Filter')}"`, active.length > 0) })}
  <div class="search">${I.search}<input id="txSearch" type="search" placeholder="${tr('Search the ledger…')}" value="${esc(S.ui.search)}" autocomplete="off"></div>
  ${active.length ? `<div class="chips">${active.map(a => `<span class="fchip">${esc(a)}</span>`).join('')}<button class="txt-btn" data-a="clearFilter">${tr('Clear')}</button></div>` : ''}
  <div id="txList">${vTxList()}</div>`;
}

// =====================================================================
// COFFERS (budgets)
// =====================================================================
export function vBudgets() {
  const mk = S.ui.budgetMonth || curMonth(), isCur = mk === curMonth();
  const m = monthStats(mk), B = totalBudgetEUR(), hasB = hasBudget(), mode = S.settings.budget.mode;
  const dim = daysInMonth(mk), dayN = isCur ? +today().slice(8) : dim;
  const left = B - m.spent, used = B > 0 ? m.spent / B : 0;
  const barColor = used > 1 ? 'var(--red)' : used > 0.85 ? 'var(--orange)' : 'var(--green)';
  const monthNav = `<div class="month-nav"><button class="icon-btn" data-a="budgetMonth" data-v="-1" aria-label="${tr('Previous month')}">${I.chevL}</button><b>${monthName(mk)}</b><button class="icon-btn" data-a="budgetMonth" data-v="1" aria-label="${tr('Next month')}" ${isCur ? 'disabled' : ''}>${I.chevR}</button></div>`;

  let top;
  if (!hasB) {
    top = `<section class="card">${empty('chest', tr('No coffer set'), tr('Set one total monthly budget, or a limit for each category.'), `<button class="btn-primary" data-a="editBudget">${tr('Fill the coffer')}</button>`)}</section>`;
  } else {
    top = `<section class="card budget-card">
      <div class="row-sb"><span class="muted">${tr('Monthly coffer')}${mode === 'category' ? ' · ' + tr('by category') : ''}</span><button class="txt-btn" data-a="editBudget">${tr('Edit')}</button></div>
      <div class="row-sb baseline"><span class="big">${fmtT(B, { whole: true })}</span><span class="${left >= 0 ? 'g' : 'r'} strong">${fmtT(Math.abs(left))} ${left >= 0 ? tr('left') : tr('over')}</span></div>
      ${bar(used * 100, barColor)}
      <div class="row-sb muted small"><span>${tr('Spent {a}', { a: fmtT(m.spent) })}</span><span>${Math.round(used * 100)}%${isCur ? ' · ' + tr('day {d} of {n}', { d: dayN, n: dim }) : ''}</span></div>
    </section>`;
  }

  const spentBy = m.byCat;
  let rows = catsOf('expense').map(c => ({ c, spent: spentBy[c.id] || 0, limit: catBudgetEUR(c.id) }));
  if (spentBy['']) rows.push({ c: cat(''), spent: spentBy[''], limit: 0 });
  rows = rows.filter(r => r.spent > 0 || r.limit > 0).sort((a, b) => (b.limit ? b.spent / b.limit : 0) - (a.limit ? a.spent / a.limit : 0) || b.spent - a.spent);
  const catHtml = rows.length ? rows.map(({ c, spent, limit }) => {
    const p = limit ? spent / limit : (m.spent ? spent / m.spent : 0);
    const color = limit && spent > limit ? 'var(--red)' : c.color;
    return `<div class="bud-row">${icon(c)}<div class="grow"><div class="row-sb"><b>${esc(c.name)}</b><b class="${limit && spent > limit ? 'r' : ''}">${limit ? Math.round(p * 100) + '%' : tr('{p}% of spend', { p: pct(spent, m.spent) })}</b></div>
      <div class="muted small">${fmtT(spent)}${limit ? ' / ' + fmtT(limit, { whole: true }) : ''}</div>${bar(p * 100, color)}</div></div>`;
  }).join('') : `<div class="muted small pad">${tr('No spending in {m}.', { m: mon(mk) })}</div>`;

  let st = '';
  if (hasB && isCur && m.spent > 0) {
    const pace = used / (dayN / dim);
    const projected = (m.spent / dayN) * dim;
    const pk = addMonthsKey(mk, -1);
    const pSame = sumRange(pk + '-01', pk + '-' + pad(Math.min(dayN, daysInMonth(pk))));
    const vs = pSame > 0 ? (m.spent - pSame) / pSame : null;
    const vsText = vs == null ? '' : ' ' + tr(vs <= 0 ? "You're spending {p}% less than at this point last month." : "You're spending {p}% more than at this point last month.", { p: Math.abs(Math.round(vs * 100)) });
    if (left < 0) st = status('bad', 'fire', tr('The dragon is furious!'), tr("You've spent {a} beyond your coffer.", { a: fmtT(-left) }) + vsText);
    else if (pace <= 1.02) st = status('good', 'dragon_down_sleep', tr('The dragon sleeps soundly'), tr('You can spend {a} a day for the rest of the month.', { a: fmtT(left / (dim - dayN + 1)) }) + vsText);
    else st = status('warn', 'candle', tr('The dragon stirs…'), tr("At this pace you'll spend about {a} this month.", { a: fmtT(projected, { whole: true }) }) + vsText);
  } else if (hasB && !isCur && m.spent > 0) {
    st = left >= 0
      ? status('good', 'crown', tr('Coffer kept!'), tr('You stayed {a} under your coffer in {m}.', { a: fmtT(left), m: mon(mk) }))
      : status('bad', 'fire', tr('The coffer ran dry'), tr('{m} ended {a} over budget.', { a: fmtT(-left), m: mon(mk) }));
  }

  return `${header(tr('Coffers'), { right: iconBtn(I.calendar, 'push', `data-v="calendar" aria-label="${tr('Almanac')}"`) })}
  ${monthNav}
  ${top}
  <h2 class="sec">${tr('By category')}</h2>
  <section class="card">${catHtml}</section>
  ${st}`;
}

// =====================================================================
// ORACLE (insights)
// =====================================================================
function rangeBuckets(range) {
  const t = today();
  if (range === '1M') {
    const from = addDays(t, -29);
    return { kind: 'day', buckets: Array.from({ length: 30 }, (_, i) => { const d = addDays(from, i); return { from: d, to: d, label: String(+d.slice(8)) }; }), from, to: t, prevFrom: addDays(from, -30), prevTo: addDays(from, -1) };
  }
  if (range === '3M') {
    const start = addDays(startOfWeek(t), -7 * 12);
    const b = Array.from({ length: 13 }, (_, i) => { const f = addDays(start, i * 7); return { from: f, to: addDays(f, 6), label: fmtDate(f, { day: 'numeric', month: 'short' }) }; });
    return { kind: 'week', buckets: b, from: start, to: t, prevFrom: addDays(start, -91), prevTo: addDays(start, -1) };
  }
  const N = range === '6M' ? 6 : 12, mk = curMonth();
  const b = Array.from({ length: N }, (_, i) => { const k = addMonthsKey(mk, i - N + 1); return { from: k + '-01', to: k + '-31', label: mon(k, 'short'), mk: k }; });
  const pf = addMonthsKey(mk, -2 * N + 1) + '-01', pt = addMonthsKey(mk, -N) + '-31';
  return { kind: 'month', buckets: b, from: b[0].from, to: t, prevFrom: pf, prevTo: pt };
}
export function vInsights() {
  const range = S.ui.insRange, R = rangeBuckets(range);
  const vals = R.buckets.map(b => sumRange(b.from, b.to));
  const total = sumRange(R.from, R.to), prev = sumRange(R.prevFrom, R.prevTo);
  const chg = prev > 0 ? (total - prev) / prev : null;
  const yf = v => compact(v);
  const trendLabels = R.buckets.map((b, i) => [i, b.label]).filter((_, i, a) => {
    const n = a.length; if (n <= 6) return true; const step = R.kind === 'day' ? 7 : R.kind === 'week' ? 4 : 3; return i % step === 0 || i === n - 1;
  });
  const trend = lineChart({ series: [{ values: vals, color: 'var(--blue)', fill: true, dot: true, dots: R.buckets.length <= 13 }], n: vals.length, yFmt: yf, xLabels: trendLabels });

  const mk = curMonth(), pk = addMonthsKey(mk, -1), dayN = +today().slice(8);
  const thisMTD = monthStats(mk).spent, lastSame = sumRange(pk + '-01', pk + '-' + pad(Math.min(dayN, daysInMonth(pk)))), lastFull = monthStats(pk).spent;
  const mChg = lastSame > 0 ? (thisMTD - lastSame) / lastSame : null;
  const y = +mk.slice(0, 4), md = today().slice(5);
  const ytd = sumRange(`${y}-01-01`, today()), lytd = sumRange(`${y - 1}-01-01`, `${y - 1}-${md}`);
  const yChg = lytd > 0 ? (ytd - lytd) / lytd : null;
  const yBars = barChart({
    labels: Array.from({ length: 12 }, (_, i) => monthName(`${y}-${pad(i + 1)}`, 'narrow', false)),
    groups: Array.from({ length: 12 }, (_, i) => [{ value: monthStats(`${y - 1}-${pad(i + 1)}`).spent, color: 'var(--bar2)' }, { value: monthStats(`${y}-${pad(i + 1)}`).spent, color: 'var(--blue)' }]),
    yFmt: yf, h: 160,
  });
  const B = totalBudgetEUR(), hasB = hasBudget();
  const m6 = Array.from({ length: 6 }, (_, i) => addMonthsKey(mk, i - 5));
  const bva = barChart({ labels: m6.map(k => mon(k, 'short')), groups: m6.map(k => { const s = monthStats(k).spent; return [{ value: s, color: hasB && s > B ? 'var(--red)' : 'var(--green)' }]; }), ref: hasB ? B : null, yFmt: yf, h: 150 });
  const catRows = hasB && S.settings.budget.mode === 'category'
    ? catsOf('expense').filter(c => catBudgetEUR(c.id) > 0).map(c => { const s = monthStats(mk).byCat[c.id] || 0, l = catBudgetEUR(c.id); return `<div class="mini-row"><span class="mini-ic">${glyph(c)} ${esc(c.name)}</span><span class="${s > l ? 'r' : 'muted'}">${fmtT(s, { whole: true })} / ${fmtT(l, { whole: true })}</span></div>`; }).join('')
    : '';
  const catTotals = byCategory(m6[0] + '-01', mk + '-31');
  const top = catTotals.slice(0, 5).map(x => x.cat);
  const stacked = barChart({
    labels: m6.map(k => mon(k, 'short')), stacked: true, yFmt: yf, h: 170,
    groups: m6.map(k => { const bc = monthStats(k).byCat; const segs = top.map(c => ({ value: bc[c.id] || 0, color: c.color })); const other = Object.entries(bc).filter(([id]) => !top.some(c => c.id === id)).reduce((a, [, v]) => a + v, 0); segs.push({ value: other, color: '#8e8578' }); return segs; }),
  });
  const cats = byCategory(R.from, R.to);
  const prevCats = Object.fromEntries(byCategory(R.prevFrom, R.prevTo).map(x => [x.cat.id, x.value]));
  const t5 = topN(cats, 5);
  let insight = '';
  if (prev > 0 && total > 0) {
    const d = prev - total;
    const period = tr(R.kind === 'day' ? 'previous 30 days' : R.kind === 'week' ? 'previous 3 months' : range === '6M' ? 'previous 6 months' : 'previous 12 months');
    insight = d >= 0
      ? status('good', 'star', tr('A thrifty season!'), tr('You spent {a} less than in the {p}.', { a: fmtT(d), p: period }))
      : status('warn', 'candle', tr('Spending has risen'), tr('{a} more than the previous period', { a: fmtT(-d) }) + (cats[0] ? tr(' — {c} is your biggest category', { c: esc(cats[0].cat.name) }) : '') + '.');
  }

  return `${header(tr('Oracle'), { right: iconBtn(I.doc, 'push', `data-v="reports" aria-label="${tr('Chronicles')}"`) })}
  ${seg(RANGES(), range, 'insRange', 'seg-wide seg-blue')}
  <section class="card">
    <div class="muted">${tr('Spending trend')}</div>
    <div class="row-base"><span class="big">${fmtT(total, { whole: total >= 1000 })}</span>${changeBadge(chg)}<span class="muted small">${tr('vs previous period')}</span></div>
    ${total ? trend : empty('gem', tr('The pool is clouded'), tr('Record a few expenses and the trend appears here.'))}
  </section>

  <h2 class="sec">${tr('Comparisons')}</h2>
  <section class="card">
    <div class="card-h"><h3>${tr('This month vs last month')}</h3>${changeBadge(mChg)}</div>
    <div class="cmp">
      <div><span class="muted small">${tr('{m} so far', { m: mon(mk) })}</span><b>${fmtT(thisMTD)}</b>${bar(pct(thisMTD, Math.max(thisMTD, lastSame, lastFull)), 'var(--blue)')}</div>
      <div><span class="muted small">${tr('{m}, same {n} days', { m: mon(pk), n: dayN })}</span><b>${fmtT(lastSame)}</b>${bar(pct(lastSame, Math.max(thisMTD, lastSame, lastFull)), 'var(--bar2)')}</div>
      <div><span class="muted small">${tr('{m}, full month', { m: mon(pk) })}</span><b>${fmtT(lastFull)}</b>${bar(pct(lastFull, Math.max(thisMTD, lastSame, lastFull)), 'var(--bar2)')}</div>
    </div>
  </section>
  <section class="card">
    <div class="card-h"><h3>${tr('This year vs last year')}</h3>${changeBadge(yChg)}</div>
    <div class="ov two"><div><span class="muted small">${tr('{y} to date', { y })}</span><b>${fmtT(ytd, { whole: true })}</b></div><div><span class="muted small">${tr('{y}, same period', { y: y - 1 })}</span><b>${fmtT(lytd, { whole: true })}</b></div></div>
    ${yBars}
    <div class="keys"><span><i style="background:var(--bar2)"></i>${y - 1}</span><span><i style="background:var(--blue)"></i>${y}</span></div>
  </section>
  <section class="card">
    <div class="card-h"><h3>${tr('Actual vs coffer')}</h3>${hasB ? `<span class="muted small">${tr('coffer {a}', { a: fmtT(B, { whole: true }) })}</span>` : `<button class="txt-btn" data-a="editBudget">${tr('Set coffer')}</button>`}</div>
    ${bva}
    ${catRows ? `<div class="mt8"><div class="muted small mb4">${tr('{m} by category', { m: mon(mk) })}</div>${catRows}</div>` : ''}
  </section>
  <section class="card">
    <div class="card-h"><h3>${tr('Categories over time')}</h3><span class="muted small">${tr('6 months')}</span></div>
    ${catTotals.length ? stacked + `<div class="keys">${top.map(c => `<span><i style="background:${c.color}"></i>${esc(c.name)}</span>`).join('')}${catTotals.length > 5 ? `<span><i style="background:#8e8578"></i>${tr('Other')}</span>` : ''}</div>` : `<div class="muted small pad">${tr('No data yet.')}</div>`}
  </section>

  <h2 class="sec">${tr('Top categories')}</h2>
  <section class="card">
    ${cats.length ? `<div class="donut-row">${donut({ items: t5.map(x => ({ value: x.value, color: x.cat.color })), size: 132 })}${legend(t5, total)}</div>
    <div class="mt8">${cats.slice(0, 8).map(x => { const p = prevCats[x.cat.id] || 0; const c = p > 0 ? (x.value - p) / p : null; return `<div class="mini-row"><span class="mini-ic">${glyph(x.cat)} ${esc(x.cat.name)}</span><span>${changeBadge(c, true, 'sm')} ${fmtT(x.value)}</span></div>`; }).join('')}</div>`
      : `<div class="muted small pad">${tr('No spending in this period.')}</div>`}
  </section>
  ${insight}
  <button class="btn-secondary" data-a="push" data-v="reports">${I.doc} ${tr('Monthly chronicle (PDF / CSV)')}</button>`;
}

// =====================================================================
// SATCHEL (more)
// =====================================================================
const moreRow = (ic, title, sub, action, val = '', extra = '') => `<button class="mrow" data-a="${action}" ${extra}><span class="mic">${ic}</span><span class="grow"><span class="t1">${title}</span>${sub ? `<span class="t2">${sub}</span>` : ''}</span>${val ? `<span class="muted small">${val}</span>` : ''}${I.chevR}</button>`;
const toggleRow = (ic, title, sub, key, on) => `<label class="mrow static"><span class="mic">${ic}</span><span class="grow"><span class="t1">${title}</span><span class="t2">${sub}</span></span><input type="checkbox" class="switch" data-change="${key}" ${on ? 'checked' : ''}></label>`;
export function vMore() {
  const st = S.settings;
  const fi = fx.info();
  const standalone = window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  return `${header(tr('Satchel'))}
  ${!standalone ? status('warn', 'scroll', tr('Add to Home Screen'), tr('In Safari tap Share → Add to Home Screen and always open the hoard from that icon. Data saved in a Safari tab is kept separately from the Home Screen app.')) : ''}
  <h2 class="sec">${tr('Planning')}</h2>
  <section class="card list">
    ${moreRow(I.calendar, tr('Almanac'), tr('See exactly when coin leaves'), 'push', '', 'data-v="calendar"')}
    ${moreRow(I.repeat, tr('Tithes & dues'), tr('Rent, guild dues, the bard on retainer…'), 'push', String(S.recur.filter(r => r.active).length), 'data-v="subs"')}
    ${moreRow(I.target, tr('Treasure quests'), tr('Savings goals worth questing for'), 'push', String(S.goals.length || ''), 'data-v="goals"')}
  </section>
  <h2 class="sec">${tr('Manage')}</h2>
  <section class="card list">
    ${moreRow(I.budget, tr('Coffers'), tr('Monthly budgets'), 'editBudget', hasBudget() ? fmtT(totalBudgetEUR(), { whole: true }) : tr('Not set'))}
    ${moreRow(I.wallet, tr('Purses'), tr('Where the coin comes from'), 'push', String(S.accts.length), 'data-v="accounts"')}
    ${moreRow(I.tag, tr('Categories'), tr('Edit, add and recolour'), 'push', String(catsOf('expense').length), 'data-v="categories"')}
  </section>
  <h2 class="sec">${tr('Preferences')}</h2>
  <section class="card list">
    <div class="mrow static"><span class="mic">${I.globe}</span><span class="grow"><span class="t1">${tr('Language')}</span></span>${seg([['en', 'English'], ['de', 'Deutsch']], lang(), 'lang', 'seg-sm')}</div>
    ${moreRow(I.globe, tr('Coinage'), tr('Default and available currencies'), 'push', st.defaultCurrency, 'data-v="currencies"')}
    <div class="mrow static"><span class="mic">${I.moon}</span><span class="grow"><span class="t1">${tr('Time of day')}</span></span>${seg([['auto', tr('Auto')], ['light', tr('Day')], ['dark', tr('Night')]], st.theme, 'theme', 'seg-sm')}</div>
    ${toggleRow(I.eyeOff, tr('Joe Mode'), tr('Leaves fall over every total so you can spend guilt-free. Everything is still tracked and exported.'), 'joeMode', st.joeMode)}
    ${toggleRow(I.sound, tr('Sound effects'), tr('Tiny 8-bit chimes when coins drop'), 'sound', st.sound)}
    ${toggleRow(I.fairy, tr('Forest creatures'), tr('Fireflies, drifting leaves and a fairy now and then'), 'ambient', st.ambient !== false)}
  </section>
  <h2 class="sec">${tr('Tavern')}</h2>
  <section class="card list">
    ${moreRow(I.game, tr('Dragon Flight'), tr('Fly through the forest, collect gold'), 'playGame', st.gameBest ? tr('Best {n}', { n: st.gameBest }) : '')}
    ${moreRow(I.fairy, tr('Ask the fairy'), tr('A word of thrifty counsel'), 'counsel')}
  </section>
  <h2 class="sec">${tr('Chronicles & records')}</h2>
  <section class="card list">
    ${moreRow(I.doc, tr('Monthly chronicles'), tr('PDF summary or CSV export (EUR)'), 'push', '', 'data-v="reports"')}
    ${moreRow(I.up, tr('Import CSV exports'), tr('Bring back entries from CSVs — also from the plain Expenses app'), 'importCsv')}
    ${moreRow(I.down, tr('Back up all data'), tr('Save a .json scroll to Files / iCloud Drive'), 'backup')}
    ${moreRow(I.up, tr('Restore from backup'), tr('Replaces everything on this device'), 'restore')}
  </section>
  <section class="card about muted small">
    <p>${tn(S.tx.filter(t => t.type === 'expense').length, '{n} expense kept on this iPhone only.', '{n} expenses kept on this iPhone only.')} ${tr('Nothing is uploaded — anyone else opening the same link finds an empty hoard.')}</p>
    <p>${tr('Exchange rates: {s}.', { s: esc(fi.source || tr('not loaded yet')) + (fi.date ? `, ${fmtDate(fi.date)}` : '') })} ${tr('Every entry is converted to EUR with the rate for its date.')}</p>
    <p id="persistInfo"></p>
    <button class="txt-btn r" data-a="eraseAll">${I.trash} ${tr('Burn the ledger (erase all data)')}</button>
  </section>`;
}

// =====================================================================
// PUSHED PAGES
// =====================================================================
function catGroups(txs) {
  const g = {};
  for (const t of txs) {
    if (t.type !== 'expense') continue;
    const k = t.type + ':' + t.categoryId;
    (g[k] = g[k] || { type: t.type, c: cat(t.categoryId), items: [] }).items.push(t);
  }
  return Object.values(g).sort((a, b) => b.items.reduce((s, t) => s + eurOf(t), 0) - a.items.reduce((s, t) => s + eurOf(t), 0)).map(({ c, items }) => {
    const sum = items.reduce((s, t) => s + eurOf(t), 0);
    const notes = [...new Set(items.map(t => t.note).filter(Boolean))].slice(0, 3).join(', ');
    const accs = [...new Set(items.map(t => (acct(t.accountId) || {}).name).filter(Boolean))];
    const one = items.length === 1;
    return `<button class="row" ${one ? `data-a="editTx" data-id="${items[0].id}"` : `data-a="calGroup" data-cat="${c.id}" data-m="${items[0].date.slice(0, 7)}"`}>${icon(c)}<span class="grow"><span class="t1">${esc(c.name)}${one ? '' : ` <span class="cnt">${items.length}</span>`}</span><span class="t2">${esc(notes || (one ? '' : tr('Several entries')))}</span></span><span class="amt"><span>${one ? fmtE(sum) : fmtT(sum)}</span><small>${esc(accs.length === 1 ? accs[0] : tr('{n} purses', { n: accs.length }))}</small></span></button>`;
  }).join('');
}
function scheduledRows(dateFrom, dateTo) {
  const items = S.recur.flatMap(r => occurrences(r, dateFrom, dateTo).map(d => ({ r, d })));
  return items.map(({ r, d }) => `<button class="row sched" data-a="editRecurring" data-id="${r.id}">${icon(cat(r.categoryId))}<span class="grow"><span class="t1">${esc(r.name)}</span><span class="t2">${tr('Scheduled')} · ${fmtDate(d, { day: 'numeric', month: 'short' })}</span></span><span class="amt"><span>${money(r.amount, r.currency)}</span></span></button>`).join('');
}
// Day cell: number + one small square.
// filled = spent that day, red = more than the daily share of the coffer, hollow = something is scheduled.
function dailyBudgetEUR(ds) { return hasBudget() ? totalBudgetEUR() / daysInMonth(ds.slice(0, 7)) : 0; }
function dayCell(ds, spent, { t, sel, sched, action }) {
  const lim = dailyBudgetEUR(ds);
  const dot = spent > 0 ? (lim && spent > lim ? 'over' : 'spent') : (sched ? 'sched' : '');
  const cls = ['cday', ds === t && 'today', ds === sel && 'sel', ds > t && 'fut'].filter(Boolean).join(' ');
  return `<button class="${cls}" data-a="${action}" data-v="${ds}"><span class="num">${+ds.slice(8)}</span><i class="dot ${dot}"></i></button>`;
}
function calLegend(ds) {
  const lim = dailyBudgetEUR(ds);
  return `<div class="cal-legend"><span><i class="dot spent"></i>${tr('Spent')}</span>${lim ? `<span><i class="dot over"></i>${tr('Over {a}/day', { a: fmtT(lim) })}</span>` : ''}<span><i class="dot sched"></i>${tr('Scheduled')}</span></div>`;
}
const weekdays = () => `<div class="cal-grid wd">${tr('M,T,W,T,F,S,S').split(',').map(x => `<span>${x}</span>`).join('')}</div>`;

export function vCalendar() {
  const mode = S.ui.calMode, t = today();
  let body = '', title = '', total = 0;
  const exp = (f, to) => S.tx.filter(x => x.type === 'expense' && x.date >= f && x.date <= to);
  const dayHead = d => parseD(d).toLocaleDateString(loc(), { weekday: 'long', day: 'numeric' });
  if (mode === 'month') {
    const mk = S.ui.calMonth || curMonth();
    const dim = daysInMonth(mk), first = (parseD(mk + '-01').getDay() + 6) % 7;
    const daily = dailyTotals(mk);
    const sched = new Set(S.recur.flatMap(r => occurrences(r, addDays(t, 1) > mk + '-01' ? addDays(t, 1) : mk + '-01', mk + '-31')));
    total = Object.values(daily).reduce((a, v) => a + v, 0);
    const sel = S.ui.calSel && S.ui.calSel.startsWith(mk) ? S.ui.calSel : (t.startsWith(mk) ? t : mk + '-01');
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<span class="blank"></span>';
    for (let d = 1; d <= dim; d++) {
      const ds = `${mk}-${pad(d)}`;
      cells += dayCell(ds, daily[d] || 0, { t, sel, sched: sched.has(ds), action: 'calSel' });
    }
    const dayTx = exp(sel, sel), daySum = dayTx.reduce((a, x) => a + eurOf(x), 0);
    title = monthName(mk);
    body = `${calLegend(mk + '-01')}<section class="card cal-card">${weekdays()}
      <div class="cal-grid days">${cells}</div></section>
      <div class="cal-h">${dayHead(sel)} · ${fmtT(daySum)}</div>
      <section class="card">${catGroups(dayTx) || ''}${scheduledRows(sel > t ? sel : addDays(t, 1), sel)}${!dayTx.length && sel <= t ? `<div class="muted small pad">${tr('No coin spent on this day.')}</div>` : ''}</section>`;
  } else if (mode === 'week') {
    const ws = S.ui.calWeek || startOfWeek(t), we = addDays(ws, 6);
    const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
    const per = days.map(d => S.tx.filter(x => x.type === 'expense' && x.date === d).reduce((a, x) => a + eurOf(x), 0));
    const sched = new Set(S.recur.flatMap(r => occurrences(r, addDays(t, 1), we)));
    total = per.reduce((a, v) => a + v, 0);
    title = `${fmtDate(ws, { day: 'numeric', month: 'short' })} – ${fmtDate(we, { day: 'numeric', month: 'short' })}`;
    body = `${calLegend(ws)}<section class="card cal-card">${weekdays()}
      <div class="cal-grid days">${days.map((d, i) => dayCell(d, per[i], { t, sel: null, sched: sched.has(d), action: 'calJump' })).join('')}</div></section>
      ${[...days].reverse().map((d, i) => { const txs = exp(d, d); const sc = d > t ? scheduledRows(d, d) : ''; if (!txs.length && !sc) return ''; const s = per[6 - i];
        return `<div class="cal-h">${dayHead(d)} · ${fmtT(s)}</div><section class="card">${catGroups(txs)}${sc}</section>`; }).join('') || `<div class="muted small pad center">${tr('No coin spent this week.')}</div>`}`;
  } else {
    const y = S.ui.calYear || +t.slice(0, 4);
    const months = Array.from({ length: 12 }, (_, i) => `${y}-${pad(i + 1)}`);
    const per = months.map(k => monthStats(k).spent), B = hasBudget() ? totalBudgetEUR() : 0;
    total = per.reduce((a, v) => a + v, 0);
    const selM = S.ui.calSelMonth && S.ui.calSelMonth.startsWith(String(y)) ? S.ui.calSelMonth : (t.startsWith(String(y)) ? t.slice(0, 7) : `${y}-01`);
    title = String(y);
    body = `<div class="cal-legend"><span><i class="dot spent"></i>${tr('Spent')}</span>${B ? `<span><i class="dot over"></i>${tr('Over coffer')}</span>` : ''}</div><div class="year-grid">${months.map((k, i) => `<button class="ymon${k === t.slice(0, 7) ? ' today' : ''}${k === selM ? ' sel' : ''}${k > t.slice(0, 7) ? ' fut' : ''}" data-a="calSelMonth" data-v="${k}"><b>${mon(k, 'short')}</b><small>${per[i] ? compactT(per[i]) : '–'}</small><i class="dot ${per[i] > 0 ? (B && per[i] > B ? 'over' : 'spent') : ''}"></i></button>`).join('')}</div>
      <div class="cal-h">${monthName(selM)} · ${fmtT(per[+selM.slice(5) - 1])}</div>
      <section class="card">${catGroups(exp(selM + '-01', selM + '-31')) || `<div class="muted small pad">${tr('No coin spent this month.')}</div>`}</section>`;
  }
  return `${header(tr('Almanac'), { back: true })}
    <div class="month-nav"><button class="icon-btn" data-a="calNav" data-v="-1" aria-label="${tr('Previous')}">${I.chevL}</button><div class="center"><b>${title}</b><div class="muted small">${tr('Total {a}', { a: fmtT(total) })}</div></div><button class="icon-btn" data-a="calNav" data-v="1" aria-label="${tr('Next')}">${I.chevR}</button></div>
    ${body}
    <div style="height:64px"></div>
    <div class="float-seg">${seg([['week', tr('Weekly')], ['month', tr('Monthly')], ['year', tr('Yearly')]], mode, 'calMode')}</div>`;
}

export function vSubs() {
  const act = S.recur.filter(r => r.active && r.type === 'expense');
  const monthly = act.reduce((a, r) => a + monthlyEquivalentEUR(r), 0);
  const subsMonthly = act.filter(r => r.isSub).reduce((a, r) => a + monthlyEquivalentEUR(r), 0);
  const row = r => {
    const c = cat(r.categoryId);
    return `<button class="row${r.active ? '' : ' paused'}" data-a="editRecurring" data-id="${r.id}">${icon(c)}<span class="grow"><span class="t1">${esc(r.name)}</span><span class="t2">${freqLabel(r.frequency)} · ${r.active ? tr('next {d}', { d: fmtDate(r.nextDate, { day: 'numeric', month: 'short' }) }) : tr('paused')}</span></span>
      <span class="amt"><span>${money(r.amount, r.currency)}</span>${r.frequency !== 'monthly' ? `<small>≈ ${fmtE(monthlyEquivalentEUR(r))}${tr('/mo')}</small>` : ''}</span></button>`;
  };
  const sort = l => l.sort((a, b) => (b.active - a.active) || a.nextDate.localeCompare(b.nextDate));
  const subs = sort(S.recur.filter(r => r.isSub && r.type === 'expense'));
  const bills = sort(S.recur.filter(r => !r.isSub && r.type === 'expense'));
  return `${header(tr('Tithes & dues'), { back: true, right: iconBtn(I.plus, 'newRecurring', `aria-label="${tr('Add')}"`) })}
  <section class="card">
    <div class="ov"><div><span class="muted small">${tr('Per month')}</span><b>${fmtT(monthly)}</b></div><div><span class="muted small">${tr('Per year')}</span><b>${fmtT(monthly * 12, { whole: true })}</b></div><div><span class="muted small">${tr('Guild dues')}</span><b>${fmtT(subsMonthly)}</b></div></div>
  </section>
  ${!S.recur.some(r => r.type === 'expense') ? `<section class="card">${empty('scroll', tr('No tithes yet'), tr('Add rent, streaming, your phone bill or the gym. They are written into your ledger automatically when due.'), `<button class="btn-primary" data-a="newRecurring">${tr('Add a recurring payment')}</button>`)}</section>` : ''}
  ${subs.length ? `<h2 class="sec">${tr('Guild dues (subscriptions)')}</h2><section class="card">${subs.map(row).join('')}</section>` : ''}
  ${bills.length ? `<h2 class="sec">${tr('Tithes & regular payments')}</h2><section class="card">${bills.map(row).join('')}</section>` : ''}`;
}

function goalStatus(g) {
  if (g.saved >= g.target) return { label: '★ ' + tr('conquered'), cls: 'good' };
  if (!g.targetDate) return { label: '', cls: '' };
  const start = ymd(new Date(g.createdAt || Date.now()));
  const total = Math.max(1, daysBetween(start, g.targetDate)), elapsed = Math.max(0, daysBetween(start, today()));
  if (today() > g.targetDate) return { label: tr('overdue'), cls: 'bad' };
  const expected = Math.min(1, elapsed / total);
  return g.saved / g.target >= expected - 0.02 ? { label: tr('on track'), cls: 'good' } : { label: tr('behind'), cls: 'warn' };
}
export function vGoals() {
  const tab = S.ui.goalsTab;
  const active = S.goals.filter(g => g.saved < g.target), done = S.goals.filter(g => g.saved >= g.target);
  const list = (tab === 'active' ? active : done).sort((a, b) => (a.targetDate || '9').localeCompare(b.targetDate || '9'));
  const card = g => {
    const p = pct(g.saved, g.target), st = goalStatus(g);
    const months = g.targetDate ? Math.max(0, Math.round(daysBetween(today(), g.targetDate) / 30.4)) : null;
    const need = months ? (g.target - g.saved) / months : null;
    return `<section class="card goal">
      <div class="row-sb"><div class="goal-h"><span class="ic big" style="${tint(g.color || '#4f6bd8')}">${glyph(g)}</span><div><b>${esc(g.name)}</b>${g.targetDate ? `<div class="muted small">${tr('By {d}', { d: fmtDate(g.targetDate, { day: 'numeric', month: 'long', year: 'numeric' }) })}</div>` : ''}</div></div>${iconBtn(I.gear, 'editGoal', `data-id="${g.id}" aria-label="${tr('Edit')}"`)}</div>
      <div class="row-sb baseline mt12"><span class="big">${money(g.saved, g.currency)}</span><span class="muted">${tr('goal:')} <b class="txt">${money(g.target, g.currency, { whole: true })}</b></span></div>
      <div class="gbar"><span style="width:${Math.min(100, p)}%"></span></div>
      <div class="row-sb muted small"><span>${tr('{p}% gathered', { p })}</span>${months != null && g.saved < g.target ? `<span>${tn(months, '{n} month to go', '{n} months to go').replace(String(months), `<b class="txt">${months}</b>`)}</span>` : ''}</div>
      <div class="row-sb mt12"><span class="muted small">${g.saved < g.target ? `${tr('Still to gather:')} <b class="txt">${money(g.target - g.saved, g.currency, { whole: true })}</b>${need ? ` · ${money(need, g.currency, { whole: true })}${tr('/mo')}` : ''}` : tr('Quest complete!')}</span>${st.label ? `<span class="badge-pill ${st.cls}">${st.label}</span>` : ''}</div>
      ${g.saved < g.target ? `<button class="btn-tonal mt12" data-a="addToGoal" data-id="${g.id}">${I.plus} ${tr('Add gold')}</button>` : ''}
    </section>`;
  };
  return `${header(tr('Treasure quests'), { back: true, right: iconBtn(I.plus, 'newGoal', `aria-label="${tr('New quest')}"`) })}
  <div class="tabs2"><button data-a="goalsTab" data-v="active" class="${tab === 'active' ? 'on' : ''}">${tr('Active')} <b>${active.length}</b></button><button data-a="goalsTab" data-v="done" class="${tab === 'done' ? 'on' : ''}">${tr('Conquered')} <b>${done.length}</b></button></div>
  ${list.length ? list.map(card).join('') : `<section class="card">${tab === 'active' ? empty('map', tr('No quests yet'), tr('Saving for a steed, a voyage or a rainy-day hoard? Start a quest to track it.'), `<button class="btn-primary" data-a="newGoal">${tr('New quest')}</button>`) : empty('crown', tr('Nothing conquered yet'), tr('Completed quests are kept here.'))}</section>`}`;
}

export function vAccounts() {
  const mk = curMonth(), spent = spentByAccount(mk + '-01', mk + '-31');
  return `${header(tr('Purses'), { back: true, right: iconBtn(I.plus, 'newAccount', `aria-label="${tr('Add purse')}"`) })}
  <p class="hint">${tr('How you paid. Amounts are what went out in {m}.', { m: mon(mk) })}</p>
  <section class="card">${accounts().map(a => { const n = S.tx.filter(t => t.type === 'expense' && t.accountId === a.id).length;
    return `<button class="row" data-a="editAccount" data-id="${a.id}"><span class="ic" style="--c:#c9a227">${glyph(a)}</span><span class="grow"><span class="t1">${esc(a.name)}${S.settings.defaultAccount === a.id ? ` <span class="cnt">${tr('default')}</span>` : ''}</span><span class="t2">${tn(n, '{n} expense in total', '{n} expenses in total')}</span></span><span class="amt"><span>${fmtT(spent[a.id] || 0)}</span><small>${tr('this month')}</small></span></button>`; }).join('')}</section>`;
}

export function vCategories() {
  const type = 'expense';
  return `${header(tr('Categories'), { back: true, right: iconBtn(I.plus, 'newCategory', `aria-label="${tr('Add category')}"`) })}
  <section class="card">${catsOf(type).map(c => { const n = S.tx.filter(t => t.categoryId === c.id).length;
    return `<button class="row" data-a="editCategory" data-id="${c.id}">${icon(c)}<span class="grow"><span class="t1">${esc(c.name)}</span><span class="t2">${tn(n, '{n} expense', '{n} expenses')}${catBudgetEUR(c.id) ? ' · ' + tr('limit {a}', { a: fmtT(catBudgetEUR(c.id), { whole: true }) }) : ''}</span></span>${I.chevR}</button>`; }).join('')}</section>`;
}

export function vCurrencies() {
  const st = S.settings, q = S.ui.curSearch.trim().toLowerCase();
  const list = CURRENCIES.filter(([c, n]) => !q || c.toLowerCase().includes(q) || n.toLowerCase().includes(q));
  return `${header(tr('Coinage'), { back: true })}
  <section class="card list">
    <label class="field"><span>${tr('Default coin')}</span><select data-change="defaultCurrency">${st.currencies.map(c => `<option value="${c}" ${c === st.defaultCurrency ? 'selected' : ''}>${c} · ${esc(curName(c))}</option>`).join('')}</select></label>
  </section>
  <p class="hint">${tr('Everything is shown in your default coin. Behind the scenes each entry is also stored in EUR using the exchange rate of its date, and CSV exports are in EUR.')}</p>
  <h2 class="sec">${tr('Available when adding')}</h2>
  <div class="search">${I.search}<input id="curSearch" type="search" placeholder="${tr('Search currencies…')}" value="${esc(S.ui.curSearch)}"></div>
  <section class="card" id="curList">${list.map(([c, n]) => { const on = st.currencies.includes(c); const r = rate(c);
    return `<button class="row" data-a="toggleCur" data-v="${c}"><span class="ic cur">${c}</span><span class="grow"><span class="t1">${esc(n)}</span><span class="t2">${r ? `1 EUR = ${r.toLocaleString(loc(), { maximumFractionDigits: 4 })} ${c}` : tr('rate loads when online')}</span></span>${on ? `<span class="chk">${I.check}</span>` : '<span class="chk off"></span>'}</button>`; }).join('')}</section>`;
}

export function vReports() {
  const months = [...new Set(S.tx.filter(t => t.type === 'expense').map(t => t.date.slice(0, 7)))].sort().reverse();
  const cm = curMonth();
  if (!months.includes(cm)) months.unshift(cm);
  const mk = S.ui.reportMonth && months.includes(S.ui.reportMonth) ? S.ui.reportMonth : (months.includes(addMonthsKey(cm, -1)) ? addMonthsKey(cm, -1) : months[0]);
  const m = monthStats(mk), days = mk === cm ? +today().slice(8) : daysInMonth(mk);
  return `${header(tr('Chronicles'), { back: true })}
  <section class="card list"><label class="field"><span>${tr('Month')}</span><select data-change="reportMonth">${months.map(k => `<option value="${k}" ${k === mk ? 'selected' : ''}>${monthName(k)}</option>`).join('')}</select></label></section>
  <section class="card">
    <div class="ov"><div><span class="muted small">${tr('Spent')}</span><b>${fmtT(m.spent, { whole: true })}</b></div><div><span class="muted small">${tr('Per day')}</span><b>${fmtT(m.spent / days)}</b></div><div><span class="muted small">${tr('Expenses')}</span><b>${m.count}</b></div></div>
  </section>
  <button class="btn-primary" data-a="makePdf" data-v="${mk}">${I.doc} ${tr('Write PDF chronicle')}</button>
  <button class="btn-secondary" data-a="makeCsv" data-v="${mk}">${I.down} ${tr('Monthly summary CSV')}</button>
  <p class="hint">${tr("The PDF chronicle covers spending, coffer, categories and daily pattern, then lists the biggest expenses and every expense by date. The monthly summary CSV has one column per category and a single row with {m}'s totals in EUR.", { m: monthName(mk) })}</p>
  <h2 class="sec">${tr('All expenses')}</h2>
  <button class="btn-secondary" data-a="makeAllCsv">${I.down} ${tr('All expenses CSV')}</button>
  <p class="hint">${tr('Every expense ever recorded, one per row (date, amount in EUR, category, description, purse, original amount and currency). This is the best file to keep as a backup — importing it under Satchel → Import CSV exports brings everything back exactly. Monthly summary CSVs can be imported too, as one entry per category per month.')}</p>`;
}

export function renderPage(p) {
  return ({ calendar: vCalendar, subs: vSubs, goals: vGoals, accounts: vAccounts, categories: vCategories, currencies: vCurrencies, reports: vReports }[p] || vHome)();
}
export function renderTab(t) {
  return ({ home: vHome, tx: vTx, budgets: vBudgets, insights: vInsights, more: vMore }[t] || vHome)();
}

// =====================================================================
// SHEETS
// =====================================================================
const sheetHead = (title, right = '') => `<div class="sheet-head"><button class="txt-btn" data-a="closeSheet">${tr('Cancel')}</button><h2>${title}</h2><span class="sh-r">${right}</span></div>`;
const curOptions = (sel) => {
  const list = [...new Set([...S.settings.currencies, sel])];
  return list.map(c => `<option value="${c}" ${c === sel ? 'selected' : ''}>${c}</option>`).join('');
};
const acctOptions = sel => accounts().map(a => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${esc(a.icon)} ${esc(a.name)}</option>`).join('');
const catChips = (type, sel, action = 'pickCat') => `<div class="cat-grid">${catsOf(type).map(c => `<button type="button" class="chip${c.id === sel ? ' on' : ''}" data-a="${action}" data-id="${c.id}" style="${tint(c.color)}"><span class="chip-ic">${glyph(c)}</span><small>${esc(c.name)}</small></button>`).join('')}</div>`;
const amtVal = v => (v || v === 0) && v !== '' ? String(v) : '';
const spritePicker = (sel, list = ITEM_SPRITES) => `<div class="sprite-grid">${list.map(n => `<button type="button" class="spr${n === sel ? ' on' : ''}" data-a="pickSprite" data-v="${n}" aria-label="${n}">${px(n)}</button>`).join('')}</div>
  <input type="hidden" name="sprite" value="${esc(sel || '')}">`;
const freqOptions = (sel, never = false) => (never ? [['never', tr('Never')]] : []).concat([['weekly', tr('Every week')], ['monthly', tr('Every month')], ['yearly', tr('Every year')]])
  .map(([v, l]) => `<option value="${v}" ${v === sel ? 'selected' : ''}>${l}</option>`).join('');

export function sTx(d) {
  return `${sheetHead(d.id ? tr('Amend entry') : tr('Record expense'))}
  <div class="amount-wrap"><select name="currency" class="cur-pick" data-change="convHint">${curOptions(d.currency)}</select><input name="amount" class="amount-in" inputmode="decimal" placeholder="0.00" autocomplete="off" value="${esc(amtVal(d.amount))}"></div>
  <div class="conv-hint" id="convHint"></div>
  <input type="hidden" name="categoryId" value="${d.categoryId || ''}">
  ${catChips('expense', d.categoryId)}
  <div class="card list form">
    <label class="field"><span>${tr('Date')}</span><input type="date" name="date" value="${d.date}" data-change="convHint"></label>
    <label class="field"><span>${tr('Purse')}</span><select name="accountId">${acctOptions(d.accountId)}</select></label>
    <label class="field"><span>${tr('Note')}</span><input name="note" placeholder="${tr('e.g. The Prancing Pig, market')}" value="${esc(d.note || '')}" autocomplete="off"></label>
    ${!d.id ? `<label class="field"><span>${tr('Repeat')}</span><select name="repeat" data-change="repeat">${freqOptions('never', true)}</select></label>
    <label class="field sub-row" hidden><span>${tr("It's a guild due (subscription)")}</span><input type="checkbox" name="isSub" class="switch"></label>` : ''}
  </div>
  ${d.id && d.rate && d.currency !== 'EUR' ? `<p class="hint">${tr('Stored as {e} · 1 EUR = {r} {c} ({d})', { e: money(d.eur || 0, 'EUR'), r: d.rate, c: d.currency, d: d.rateDate || d.date })}</p>` : ''}
  <button class="btn-primary" data-a="saveTx">${d.id ? tr('Save changes') : tr('Add to ledger')}</button>
  ${d.id ? `<button class="btn-danger" data-a="deleteTx">${I.trash} ${tr('Strike from ledger')}</button>` : ''}`;
}

export function sBudget() {
  const b = S.settings.budget, dc = dispCur();
  const conv = v => { const n = +v || 0; if (!n) return ''; return Math.round(eurToCur(curToEur(n, b.currency), dc) * 100) / 100; };
  return `${sheetHead(tr('Monthly coffer'))}
  ${seg([['total', tr('One total')], ['category', tr('Per category')]], b.mode, 'budgetMode', 'seg-wide')}
  <div id="budTotal" ${b.mode === 'total' ? '' : 'hidden'}>
    <p class="hint">${tr('One limit for all your spending each month.')}</p>
    <div class="amount-wrap"><span class="cur-static">${dc}</span><input name="total" class="amount-in" inputmode="decimal" placeholder="0" value="${conv(b.total)}"></div>
  </div>
  <div id="budCats" ${b.mode === 'category' ? '' : 'hidden'}>
    <p class="hint">${tr('Set a limit for the categories you care about. Your monthly coffer is the sum. Leave others empty.')}</p>
    <div class="card list form">${catsOf('expense').map(c => `<label class="field"><span class="fl-ic">${glyph(c)} ${esc(c.name)}</span><input class="num" inputmode="decimal" data-cat="${c.id}" placeholder="—" value="${conv(b.perCategory[c.id])}"><em>${dc}</em></label>`).join('')}</div>
  </div>
  <button class="btn-primary" data-a="saveBudget">${tr('Seal the coffer')}</button>
  ${hasBudget() ? `<button class="btn-danger" data-a="clearBudget">${tr('Remove coffer')}</button>` : ''}`;
}

export function sRecurring(d) {
  return `${sheetHead(d.id ? tr('Edit tithe') : tr('New tithe'))}
  <div class="card list form"><label class="field"><span>${tr('Name')}</span><input name="name" placeholder="${tr('e.g. Rent, Lute lessons')}" value="${esc(d.name || '')}"></label></div>
  <div class="amount-wrap"><select name="currency" class="cur-pick">${curOptions(d.currency)}</select><input name="amount" class="amount-in" inputmode="decimal" placeholder="0.00" value="${esc(amtVal(d.amount))}"></div>
  <input type="hidden" name="categoryId" value="${d.categoryId || ''}">
  ${catChips('expense', d.categoryId)}
  <div class="card list form">
    <label class="field"><span>${tr('Repeats')}</span><select name="frequency">${['weekly', 'monthly', 'yearly'].map(f => `<option value="${f}" ${f === d.frequency ? 'selected' : ''}>${freqLabel(f)}</option>`).join('')}</select></label>
    <label class="field"><span>${d.id ? tr('Next payment') : tr('First payment')}</span><input type="date" name="nextDate" value="${d.nextDate}"></label>
    <label class="field"><span>${tr('Purse')}</span><select name="accountId">${acctOptions(d.accountId)}</select></label>
    <label class="field"><span>${tr('Guild due (subscription)')}</span><input type="checkbox" name="isSub" class="switch" ${d.isSub ? 'checked' : ''}></label>
    ${d.id ? `<label class="field"><span>${tr('Active')}</span><input type="checkbox" name="active" class="switch" ${d.active ? 'checked' : ''}></label>` : ''}
  </div>
  <p class="hint">${tr("When a payment is due it's written into your ledger automatically the next time you open the app (past dates are filled in too).")}</p>
  <button class="btn-primary" data-a="saveRecurring">${d.id ? tr('Save') : tr('Add')}</button>
  ${d.id ? `<button class="btn-danger" data-a="deleteRecurring">${tr('Delete (keeps past entries)')}</button>` : ''}`;
}

const GOAL_SPRITES = ['chest', 'castle', 'house', 'crown', 'ring', 'horseshoe', 'boat', 'map', 'egg', 'sword', 'tome', 'gem', 'key', 'potion', 'lute', 'paw', 'gift', 'wand'];
export function sGoal(d) {
  return `${sheetHead(d.id ? tr('Edit quest') : tr('New quest'))}
  ${spritePicker(d.sprite, GOAL_SPRITES)}
  <input type="hidden" name="icon" value="${esc(d.icon)}">
  <div class="card list form">
    <label class="field"><span>${tr('Name')}</span><input name="name" placeholder="${tr('e.g. A new steed')}" value="${esc(d.name || '')}"></label>
    <label class="field"><span>${tr('Goal amount')}</span><input name="target" class="num" inputmode="decimal" placeholder="1500" value="${esc(amtVal(d.target))}"><select name="currency" class="mini-sel">${curOptions(d.currency)}</select></label>
    <label class="field"><span>${tr('Gathered so far')}</span><input name="saved" class="num" inputmode="decimal" placeholder="0" value="${esc(amtVal(d.saved))}"></label>
    <label class="field"><span>${tr('Target date')}</span><input type="date" name="targetDate" value="${d.targetDate || ''}"></label>
  </div>
  <div class="swatches">${PALETTE.map(c => `<button type="button" class="sw${c === d.color ? ' on' : ''}" style="background:${c}" data-a="pickColor" data-v="${c}" aria-label="${c}"></button>`).join('')}</div>
  <input type="hidden" name="color" value="${d.color}">
  <button class="btn-primary" data-a="saveGoal">${d.id ? tr('Save') : tr('Begin quest')}</button>
  ${d.id ? `<button class="btn-danger" data-a="deleteGoal">${tr('Abandon quest')}</button>` : ''}`;
}
export function sGoalAdd(g) {
  return `${sheetHead(tr('Add to {g}', { g: esc(g.name) }))}
  <div class="amount-wrap"><span class="cur-static">${g.currency}</span><input name="amount" class="amount-in" inputmode="decimal" placeholder="0.00"></div>
  <p class="hint center">${tr('Gathered so far: {a} of {b}. Use a negative number to take gold out.', { a: money(g.saved, g.currency), b: money(g.target, g.currency) })}</p>
  <button class="btn-primary" data-a="saveGoalAdd" data-id="${g.id}">${tr('Add gold')}</button>`;
}

const ACCT_SPRITES = ['coins', 'pouch', 'seal', 'chest', 'castle', 'key', 'gem', 'crown', 'sack', 'barrel', 'ring', 'scroll'];
export function sAccount(d) {
  return `${sheetHead(d.id ? tr('Edit purse') : tr('New purse'))}
  <div class="cat-preview"><span class="ic big" style="--c:#c9a227" id="catPrev">${glyph(d)}</span></div>
  ${spritePicker(d.sprite, ACCT_SPRITES)}
  <div class="card list form">
    <label class="field"><span>${tr('Name')}</span><input name="name" placeholder="${tr('e.g. Monzo')}" value="${esc(d.name || '')}"></label>
    <label class="field"><span>${tr('…or an emoji')}</span><input name="icon" class="num" maxlength="4" value="${esc(d.icon || '🏦')}"></label>
    <label class="field"><span>${tr('Default for new entries')}</span><input type="checkbox" name="isDefault" class="switch" ${d.id && S.settings.defaultAccount === d.id ? 'checked' : ''}></label>
  </div>
  <button class="btn-primary" data-a="saveAccount">${d.id ? tr('Save') : tr('Add purse')}</button>
  ${d.id ? `<button class="btn-danger" data-a="deleteAccount">${tr('Delete purse')}</button>` : ''}`;
}

export function sCategory(d) {
  return `${sheetHead(d.id ? tr('Edit category') : tr('New category'))}
  <div class="cat-preview"><span class="ic big" style="${tint(d.color)}" id="catPrev">${glyph(d)}</span></div>
  ${spritePicker(d.sprite)}
  <div class="card list form">
    <label class="field"><span>${tr('Name')}</span><input name="name" value="${esc(d.name || '')}" placeholder="${tr('e.g. Dragon food')}" maxlength="14"></label>
    <label class="field"><span>${tr('…or an emoji')}</span><input name="icon" class="num" maxlength="4" value="${esc(d.icon || '🏷️')}"></label>
  </div>
  <p class="hint">${tr('Keep it to one short word so it fits on the category button.')}</p>
  <div class="swatches">${PALETTE.map(c => `<button type="button" class="sw${c === d.color ? ' on' : ''}" style="background:${c}" data-a="pickColor" data-v="${c}" aria-label="${c}"></button>`).join('')}</div>
  <input type="hidden" name="color" value="${d.color}">
  <button class="btn-primary" data-a="saveCategory">${d.id ? tr('Save') : tr('Add category')}</button>
  ${d.id ? `<button class="btn-danger" data-a="deleteCategory">${tr('Delete category')}</button>` : ''}`;
}

export function sFilter() {
  const f = S.ui.filter;
  const months = [...new Set(S.tx.filter(t => t.type === 'expense').map(t => t.date.slice(0, 7)))].sort().reverse();
  return `${sheetHead(tr('Filter'))}
  <div class="card list form">
    <label class="field"><span>${tr('Month')}</span><select name="month"><option value="">${tr('All time')}</option>${months.map(k => `<option value="${k}" ${k === f.month ? 'selected' : ''}>${monthName(k)}</option>`).join('')}</select></label>
    <label class="field"><span>${tr('Category')}</span><select name="cat"><option value="">${tr('All categories')}</option>${catsOf('expense').map(c => `<option value="${c.id}" ${c.id === f.cat ? 'selected' : ''}>${esc(c.icon)} ${esc(c.name)}</option>`).join('')}</select></label>
    <label class="field"><span>${tr('Purse')}</span><select name="acct"><option value="">${tr('All purses')}</option>${acctOptions(f.acct)}</select></label>
  </div>
  <button class="btn-primary" data-a="applyFilter">${tr('Apply')}</button>
  <button class="btn-secondary" data-a="clearFilter">${tr('Reset filters')}</button>`;
}

export function sWelcome() {
  const standalone = window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  return `<div class="welcome">
    <div class="w-logo">${px2('dragon_up_idle', 'dragon_down_idle', 'flap')}${px('gold2', 'w-gold')}</div>
    <h2>${tr('Welcome, traveller')}</h2>
    ${seg([['en', 'English'], ['de', 'Deutsch']], lang(), 'lang', 'seg-lang')}
    <p class="muted">${tr('A small dragon will guard your ledger. Your expenses stay on this iPhone — nothing is uploaded, so anyone else who opens this link finds an empty hoard.')}</p>
    <div class="card list form">
      <label class="field"><span>${tr('Main coin')}</span><select name="cur">${CURRENCIES.map(([c, n]) => `<option value="${c}" ${c === 'GBP' ? 'selected' : ''}>${c} · ${esc(n)}</option>`).join('')}</select></label>
      <label class="field"><span>${tr('Monthly coffer')}</span><input name="budget" class="num" inputmode="decimal" placeholder="${tr('optional')}"></label>
    </div>
    ${!standalone ? `<p class="hint">${tr('For the best experience: Safari → Share → <b>Add to Home Screen</b>, then open it from the icon. Data saved in a Safari tab is kept separately from the Home Screen app.')}</p>` : ''}
    <button class="btn-primary" data-a="finishWelcome">${tr('Begin the journey')}</button>
    <button class="btn-secondary" data-a="importCsv">${I.up} ${tr('Restore from CSV exports')}</button>
    <p class="hint center">${tr('Coming from the plain Expenses app, or starting over? Pick your CSV files — expenses and any missing categories come back.')}</p>
  </div>`;
}

export function sFileReady(name) {
  return `${sheetHead(tr('Scroll ready'))}
  <div class="empty"><div class="empty-e">${px('scroll', 'art')}</div><div class="empty-t">${esc(name)}</div><div class="empty-s">${tr('Tap below, then choose “Save to Files” (or share it).')}</div></div>
  <button class="btn-primary" data-a="shareFile">${tr('Save / share file')}</button>`;
}

export { SPRITE_EMOJI };
