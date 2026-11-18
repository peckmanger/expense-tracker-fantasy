// store.js — app state, defaults, formatting and calculations.
import * as db from './db.js';
import * as fx from './fx.js';
import { px } from './sprites.js';
import { t as tr, loc, lang } from './i18n.js';

export const S = {
  tx: [], cats: [], accts: [], recur: [], goals: [], settings: null,
  tab: 'home', stack: [], draft: null,
  ui: {
    txType: 'all', search: '', filter: { month: '', cat: '', acct: '' }, txLimit: 120,
    budgetMonth: null, homeRange: '1M', insRange: '6M',
    calMode: 'month', calCursor: null, calSel: null,
    goalsTab: 'active', catsType: 'expense', reportMonth: null, curSearch: '',
  },
};

export const CURRENCIES = [
  ['GBP', 'British pound'], ['EUR', 'Euro'], ['USD', 'US dollar'], ['CHF', 'Swiss franc'],
  ['JPY', 'Japanese yen'], ['CAD', 'Canadian dollar'], ['AUD', 'Australian dollar'], ['NZD', 'New Zealand dollar'],
  ['SEK', 'Swedish krona'], ['NOK', 'Norwegian krone'], ['DKK', 'Danish krone'], ['ISK', 'Icelandic króna'],
  ['PLN', 'Polish złoty'], ['CZK', 'Czech koruna'], ['HUF', 'Hungarian forint'], ['RON', 'Romanian leu'],
  ['RSD', 'Serbian dinar'], ['TRY', 'Turkish lira'], ['UAH', 'Ukrainian hryvnia'], ['GEL', 'Georgian lari'],
  ['CNY', 'Chinese yuan'], ['HKD', 'Hong Kong dollar'], ['TWD', 'New Taiwan dollar'], ['KRW', 'South Korean won'],
  ['SGD', 'Singapore dollar'], ['MYR', 'Malaysian ringgit'], ['THB', 'Thai baht'], ['IDR', 'Indonesian rupiah'],
  ['PHP', 'Philippine peso'], ['VND', 'Vietnamese đồng'], ['INR', 'Indian rupee'], ['PKR', 'Pakistani rupee'],
  ['LKR', 'Sri Lankan rupee'], ['BDT', 'Bangladeshi taka'], ['NPR', 'Nepalese rupee'], ['AED', 'UAE dirham'],
  ['SAR', 'Saudi riyal'], ['QAR', 'Qatari riyal'], ['KWD', 'Kuwaiti dinar'], ['BHD', 'Bahraini dinar'],
  ['OMR', 'Omani rial'], ['JOD', 'Jordanian dinar'], ['ILS', 'Israeli shekel'], ['EGP', 'Egyptian pound'],
  ['MAD', 'Moroccan dirham'], ['TND', 'Tunisian dinar'], ['ZAR', 'South African rand'], ['NGN', 'Nigerian naira'],
  ['KES', 'Kenyan shilling'], ['GHS', 'Ghanaian cedi'], ['TZS', 'Tanzanian shilling'], ['MXN', 'Mexican peso'],
  ['BRL', 'Brazilian real'], ['ARS', 'Argentine peso'], ['CLP', 'Chilean peso'], ['COP', 'Colombian peso'],
  ['PEN', 'Peruvian sol'], ['UYU', 'Uruguayan peso'], ['CRC', 'Costa Rican colón'], ['DOP', 'Dominican peso'],
];
export const curName = code => (CURRENCIES.find(c => c[0] === code) || [code, code])[1];

// Earthy, jewel-toned colours that sit well on parchment and in the night forest.
export const PALETTE = ['#4f6bd8', '#5fae4f', '#e08a2e', '#a46bd6', '#d6517a', '#3fa7a0', '#e8b531', '#5b7fc7', '#c94a3b', '#a07a4f', '#8a94a6', '#8e8578'];

// Each pixel sprite has an emoji twin, used wherever plain text is needed (PDF, CSV, pickers).
export const SPRITE_EMOJI = {
  castle: '🏰', bread: '🥖', feast: '🍗', ale: '🍺', horseshoe: '🐎', sack: '💰', scroll: '📜', shield: '🛡️',
  potion: '🧪', lute: '🪕', map: '🗺️', mirror: '🪞', gift: '🎁', tome: '📚', barrel: '🛢️', helmet: '⛑️',
  candle: '🕯️', pouch: '👛', coins: '🪙', seal: '📜', chest: '🧰', egg: '🥚', crown: '👑', gem: '💎', key: '🗝️',
  sword: '⚔️', ring: '💍', mushroom: '🍄', apple: '🍎', house: '🏠', boat: '⛵', paw: '🐾', cog: '⚙️', wand: '🪄', flower: '🌸',
};

// Built-in categories: one short name per language (they must fit on the category buttons).
// "old" lists earlier names — from the plain Expenses app and from v1 of this app — so they are
// renamed automatically and their CSV files import onto the right category.
export const CAT_DEFS = [
  { key: 'hearth', sprite: 'castle', color: '#5b7fc7', en: 'Hearth', de: 'Herd', old: ['Housing', 'Hearth & Home'] },
  { key: 'provisions', sprite: 'bread', color: '#5fae4f', en: 'Provisions', de: 'Proviant', old: ['Groceries'] },
  { key: 'tavern', sprite: 'feast', color: '#e08a2e', en: 'Tavern', de: 'Taverne', old: ['Eating out', 'Tavern Feasts'] },
  { key: 'ale', sprite: 'ale', color: '#e8b531', en: 'Ale', de: 'Met', old: ['Drinks', 'Ale & Mead'] },
  { key: 'steeds', sprite: 'horseshoe', color: '#3fa7a0', en: 'Steeds', de: 'Rösser', old: ['Transport', 'Steeds & Carriages'] },
  { key: 'market', sprite: 'sack', color: '#a46bd6', en: 'Market', de: 'Markt', old: ['Shopping', 'Market Wares'] },
  { key: 'armour', sprite: 'helmet', color: '#8a94a6', en: 'Armour', de: 'Rüstung', old: ['Clothing', 'Armour & Garb'] },
  { key: 'tolls', sprite: 'scroll', color: '#c9a227', en: 'Tolls', de: 'Abgaben', old: ['Bills & utilities', 'Tolls & Tithes'] },
  { key: 'guilds', sprite: 'shield', color: '#4f6bd8', en: 'Guilds', de: 'Gilden', old: ['Subscriptions', 'Guild Dues'] },
  { key: 'potions', sprite: 'potion', color: '#d6517a', en: 'Potions', de: 'Tränke', old: ['Health', 'Potions & Healers'] },
  { key: 'revelry', sprite: 'lute', color: '#2f9e8f', en: 'Revelry', de: 'Gelage', old: ['Entertainment', 'Bards & Revelry'] },
  { key: 'voyages', sprite: 'map', color: '#a07a4f', en: 'Voyages', de: 'Reisen', old: ['Travel', 'Quests & Voyages'] },
  { key: 'bathhouse', sprite: 'mirror', color: '#e47fa4', en: 'Bathhouse', de: 'Badehaus', old: ['Personal care', 'Bathhouse & Barber'] },
  { key: 'gifts', sprite: 'gift', color: '#c94a3b', en: 'Gifts', de: 'Gaben', old: ['Offerings & Gifts'] },
  { key: 'tomes', sprite: 'tome', color: '#6fa8dc', en: 'Tomes', de: 'Bücher', old: ['Education', 'Tomes & Learning'] },
  { key: 'sundries', sprite: 'barrel', color: '#8e8578', en: 'Sundries', de: 'Krimskrams', old: ['Other'] },
];
export const ACCT_DEFS = [
  { key: 'bank', sprite: 'coins', en: 'Guild Bank', de: 'Gildenbank', old: ['Current account'] },
  { key: 'seal', sprite: 'seal', en: 'Credit Seal', de: 'Kreditsiegel', old: ['Credit card'] },
  { key: 'purse', sprite: 'pouch', en: 'Coin Purse', de: 'Münzbeutel', old: ['Cash'] },
  { key: 'chest', sprite: 'chest', en: 'Treasure Chest', de: 'Schatztruhe', old: ['Savings'] },
];
const low = s => String(s || '').trim().toLowerCase();
const namesOf = d => [d.en, d.de, ...d.old].map(low);
const defFor = (defs, name) => defs.find(d => namesOf(d).includes(low(name)));

export function defaults() {
  const id = uid, L = lang();
  const cats = CAT_DEFS.map((d, i) => ({ id: id(), key: d.key, name: d[L], icon: SPRITE_EMOJI[d.sprite], sprite: d.sprite, color: d.color, type: 'expense', order: i }));
  const accts = ACCT_DEFS.map((d, i) => ({ id: id(), key: d.key, name: d[L], icon: SPRITE_EMOJI[d.sprite], sprite: d.sprite, openingEUR: 0, order: i }));
  const settings = {
    defaultCurrency: 'GBP', currencies: ['GBP', 'EUR', 'USD'], theme: 'auto', lang: L,
    budget: { mode: 'total', total: 0, perCategory: {}, currency: 'GBP' },
    lastCsvPromptMonth: null, defaultAccount: accts[0].id, createdAt: Date.now(), joeMode: false,
    sound: false, ambient: true,
  };
  return { cats, accts, settings };
}

/** Give built-in categories and purses the name for the current language (and replace old two-part
 *  names). Anything the user renamed themselves is left alone. Returns what changed, for saving. */
export function relabelDefaults() {
  const L = lang(), changed = { cats: [], accts: [] };
  for (const [list, defs, out] of [[S.cats, CAT_DEFS, changed.cats], [S.accts, ACCT_DEFS, changed.accts]]) {
    const taken = new Set(list.map(x => low(x.name)));
    for (const x of list) {
      const d = defFor(defs, x.name);
      if (!d || x.name === d[L]) continue;
      if (taken.has(low(d[L]))) continue; // never create a duplicate name
      taken.delete(low(x.name)); taken.add(low(d[L]));
      x.name = d[L]; x.key = d.key; out.push(x);
    }
  }
  return changed;
}

/** For CSV import: a category/purse name from any language or older version → the name used here now. */
export function importName(name, kind) {
  const d = defFor(kind === 'acct' ? ACCT_DEFS : CAT_DEFS, name);
  return d ? d[lang()] : name;
}

// ---------- persistence ----------
export async function load() {
  const [tx, cats, accts, recur, goals, settings] = await Promise.all([
    db.getAll('transactions'), db.getAll('categories'), db.getAll('accounts'),
    db.getAll('recurring'), db.getAll('goals'), db.kvGet('settings'),
  ]);
  Object.assign(S, { tx, cats, accts, recur, goals, settings: settings || null });
  sortTx();
}
export const saveSettings = () => db.kvSet('settings', S.settings);
export function sortTx() {
  S.tx.sort((a, b) => (b.date.localeCompare(a.date)) || ((b.createdAt || 0) - (a.createdAt || 0)));
}
const STORE_OF = { tx: 'transactions', cats: 'categories', accts: 'accounts', recur: 'recurring', goals: 'goals' };
export async function upsert(kind, obj) {
  const list = S[kind];
  const i = list.findIndex(x => x.id === obj.id);
  if (i >= 0) list[i] = obj; else list.push(obj);
  if (kind === 'tx') sortTx();
  await db.put(STORE_OF[kind], obj);
  return obj;
}
export async function remove(kind, id) {
  S[kind] = S[kind].filter(x => x.id !== id);
  await db.del(STORE_OF[kind], id);
}

// ---------- utils ----------
export function uid() {
  return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
}
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const pad = n => String(n).padStart(2, '0');
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => ymd(new Date());
export const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d || 1); };
export const curMonth = () => today().slice(0, 7);
export const addMonthsKey = (mk, n) => { const d = parseD(mk + '-01'); d.setMonth(d.getMonth() + n); return ymd(d).slice(0, 7); };
export const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
export const daysInMonth = mk => { const [y, m] = mk.split('-').map(Number); return new Date(y, m, 0).getDate(); };
export const monthName = (mk, month = 'long', year = true) =>
  parseD(mk + '-01').toLocaleDateString(loc(), year ? { month, year: 'numeric' } : { month });
export const fmtDate = (s, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => parseD(s).toLocaleDateString(loc(), opts);
export function dayLabel(s) {
  const t = today();
  if (s === t) return tr('Today');
  if (s === addDays(t, -1)) return tr('Yesterday');
  if (s === addDays(t, 1)) return tr('Tomorrow');
  const sameYear = s.slice(0, 4) === t.slice(0, 4);
  return parseD(s).toLocaleDateString(loc(), sameYear ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}
export const daysBetween = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
export const startOfWeek = s => { const d = parseD(s); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return ymd(d); };
export const round2 = n => Math.round(n * 100) / 100;
export function parseAmount(v) {
  if (typeof v === 'number') return v;
  let s = String(v || '').trim().replace(/\s/g, '');
  if (/,\d{1,2}$/.test(s) && !/\.\d/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); // 12,50 → 12.50
  s = s.replace(/,/g, '');
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

// ---------- money ----------
const nf = {};
export function money(amount, cur, opts = {}) {
  const key = loc() + cur + JSON.stringify(opts);
  if (!nf[key]) {
    const o = { style: 'currency', currency: cur, currencyDisplay: 'narrowSymbol' };
    if (opts.compact) Object.assign(o, { notation: 'compact', maximumFractionDigits: 1 });
    else if (opts.whole) Object.assign(o, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    try { nf[key] = new Intl.NumberFormat(loc(), o); } catch (e) { nf[key] = { format: n => `${cur} ${n.toFixed(2)}` }; }
  }
  return nf[key].format(amount);
}
export const dispCur = () => (S.settings ? S.settings.defaultCurrency : 'EUR');
export const rate = cur => (cur === 'EUR' ? 1 : fx.rates()[cur]);
export function toDisp(eur) { const r = rate(dispCur()); return r ? eur * r : eur; }
export function fmtE(eur, opts) {
  const r = rate(dispCur());
  return r ? money(eur * r, dispCur(), opts) : money(eur, 'EUR', opts);
}
// ---------- Joe Mode ----------
// When on, every *total* is buried under a pile of pixel leaves. The real number is never put
// in the page, so nothing can be peeked at. Single entries stay visible.
export const joe = () => !!(S.settings && S.settings.joeMode);
let joeN = 0;
export const joeReset = () => { joeN = 0; }; // called before each render so piles don't reshuffle
export function fmtT(eur, opts = {}) {
  if (!joe()) return fmtE(eur, opts);
  return `<span class="joe" role="img" aria-label="${tr('Hidden under leaves')}">${px('pile' + (joeN++ % 6))}</span>`;
}
// Plain-text version for chart axis labels (SVG text can't hold the leaf pile).
export const fmtAxis = eur => (joe() ? '❦' : fmtE(eur, { compact: true }));

export function curToEur(amount, cur) {
  if (cur === 'EUR') return amount;
  const r = rate(cur);
  return r ? amount / r : amount;
}
export function eurToCur(eur, cur) { const r = rate(cur); return r ? eur * r : eur; }
export function eurOf(t) {
  if (typeof t.eur === 'number') return t.eur;
  return curToEur(t.amount, t.currency);
}

// ---------- lookups ----------
const UNKNOWN_CAT = { id: '', name: 'Uncategorised', icon: '❔', sprite: 'egg', color: '#8e8578', type: 'expense' };
export const cat = id => S.cats.find(c => c.id === id) || { ...UNKNOWN_CAT, name: tr('Uncategorised') };
export const acct = id => S.accts.find(a => a.id === id) || null;
export const catsOf = type => S.cats.filter(c => c.type === type).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
export const accounts = () => [...S.accts].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

// ---------- aggregates ----------
export function sumRange(from, to, type = 'expense', pred) {
  let s = 0;
  for (const t of S.tx) {
    if (t.type !== type || t.date < from || t.date > to) continue;
    if (pred && !pred(t)) continue;
    s += eurOf(t);
  }
  return s;
}
export function monthStats(mk) {
  let spent = 0, income = 0, count = 0;
  const byCat = {};
  for (const t of S.tx) {
    if (!t.date.startsWith(mk)) continue;
    const e = eurOf(t);
    if (t.type === 'expense') { spent += e; count++; byCat[t.categoryId] = (byCat[t.categoryId] || 0) + e; }
    else income += e;
  }
  return { spent, income, net: income - spent, byCat, count };
}
export function byCategory(from, to) {
  const m = {};
  for (const t of S.tx) {
    if (t.type !== 'expense' || t.date < from || t.date > to) continue;
    m[t.categoryId] = (m[t.categoryId] || 0) + eurOf(t);
  }
  return Object.entries(m).map(([id, v]) => ({ cat: cat(id), value: v })).sort((a, b) => b.value - a.value);
}
export function topN(list, n = 5) {
  if (list.length <= n) return list;
  const head = list.slice(0, n - 1);
  const rest = list.slice(n - 1).reduce((a, x) => a + x.value, 0);
  return [...head, { cat: { id: '_other', name: tr('Other'), icon: '•', color: '#8e8578' }, value: rest }];
}
export function spentByAccount(from, to) {
  const m = {};
  for (const t of S.tx) {
    if (t.type !== 'expense' || t.date < from || t.date > to) continue;
    m[t.accountId] = (m[t.accountId] || 0) + eurOf(t);
  }
  return m;
}
export function accountBalanceEUR(a) {
  let b = a.openingEUR || 0;
  for (const t of S.tx) if (t.accountId === a.id) b += t.type === 'income' ? eurOf(t) : -eurOf(t);
  return b;
}

// ---------- budgets ----------
export function hasBudget() {
  const b = S.settings.budget;
  return b.mode === 'total' ? +b.total > 0 : Object.values(b.perCategory).some(v => +v > 0);
}
export function totalBudgetEUR() {
  const b = S.settings.budget;
  if (b.mode === 'total') return curToEur(+b.total || 0, b.currency);
  return curToEur(Object.values(b.perCategory).reduce((a, v) => a + (+v || 0), 0), b.currency);
}
export function catBudgetEUR(id) {
  const b = S.settings.budget;
  if (b.mode !== 'category') return 0;
  const v = +b.perCategory[id] || 0;
  return v ? curToEur(v, b.currency) : 0;
}

// ---------- recurring ----------
export function advance(dateStr, freq, anchorDay) {
  const d = parseD(dateStr);
  if (freq === 'weekly') { d.setDate(d.getDate() + 7); return ymd(d); }
  if (freq === 'yearly') {
    const y = d.getFullYear() + 1, m = d.getMonth();
    const dim = new Date(y, m + 1, 0).getDate();
    return ymd(new Date(y, m, Math.min(anchorDay || d.getDate(), dim)));
  }
  // monthly
  const y = d.getFullYear(), m = d.getMonth() + 1;
  const dim = new Date(y, m + 1, 0).getDate();
  return ymd(new Date(y, m, Math.min(anchorDay || d.getDate(), dim)));
}
export function monthlyEquivalentEUR(r) {
  const e = curToEur(r.amount, r.currency);
  return r.frequency === 'weekly' ? e * 52 / 12 : r.frequency === 'yearly' ? e / 12 : e;
}
export function occurrences(r, from, to) {
  // future occurrences of rule r between from..to (inclusive), starting at r.nextDate
  const out = [];
  if (!r.active) return out;
  let d = r.nextDate, guard = 0;
  while (d <= to && guard++ < 500) {
    if (d >= from) out.push(d);
    d = advance(d, r.frequency, r.anchorDay);
  }
  return out;
}
export const freqLabel = f => tr({ weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }[f] || f);
