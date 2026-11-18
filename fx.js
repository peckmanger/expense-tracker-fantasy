// fx.js — exchange rates. All rates are "units of currency per 1 EUR".
// Primary: Frankfurter (free, no key, central-bank reference rates, historical by date).
// Fallback: open.er-api.com (free, latest only) for anything Frankfurter lacks.
import * as db from './db.js';

const FRANK = 'https://api.frankfurter.dev/v2/rates?base=EUR';
const ALT = 'https://open.er-api.com/v6/latest/EUR';

let latest = { EUR: 1 };
let meta = { date: null, fetchedAt: 0, source: '' };

export const rates = () => latest;
export const info = () => meta;

const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function get(url, ms = 9000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return fetch(url, { signal: c.signal, cache: 'no-store' }).finally(() => clearTimeout(t));
}

async function frankfurter(date) {
  const r = await get(FRANK + (date ? `&date=${date}` : ''));
  if (!r.ok) throw new Error('Frankfurter ' + r.status);
  const rows = await r.json();
  const out = { EUR: 1 };
  let d = null;
  for (const row of Array.isArray(rows) ? rows : []) {
    if (row && row.quote && row.rate) {
      out[row.quote] = row.rate;
      if (!d || row.date > d) d = row.date;
    }
  }
  if (Object.keys(out).length < 5) throw new Error('Frankfurter: empty');
  return { date: d || date, rates: out, source: 'Frankfurter' };
}

async function openEr() {
  const r = await get(ALT);
  const j = await r.json();
  if (j.result !== 'success') throw new Error('open.er-api failed');
  return {
    date: ymd(new Date(j.time_last_update_unix * 1000)),
    rates: { ...j.rates, EUR: 1 },
    source: 'open.er-api.com',
  };
}

export async function init(wanted = []) {
  const cached = await db.kvGet('fx:latest');
  if (cached) { latest = cached.rates; meta = cached.meta; }
  const stale = !cached || Date.now() - (cached.meta.fetchedAt || 0) > 3 * 3600e3;
  const missing = wanted.some(c => !latest[c]);
  if (stale || missing) { try { await refresh(wanted); } catch (e) { /* offline: keep cache */ } }
}

export async function refresh(wanted = []) {
  let main = null, alt = null;
  try { main = await frankfurter(); } catch (e) { main = null; }
  const gaps = !main || wanted.some(c => !main.rates[c]);
  if (gaps) { try { alt = await openEr(); } catch (e) { alt = null; } }
  if (!main && !alt) throw new Error('No exchange rates available (offline?)');
  const merged = { ...(alt ? alt.rates : {}), ...(main ? main.rates : {}) };
  latest = merged;
  meta = {
    date: (main || alt).date,
    fetchedAt: Date.now(),
    source: [main && main.source, alt && alt.source].filter(Boolean).join(' + '),
  };
  await db.kvSet('fx:latest', { rates: latest, meta });
  return latest;
}

// Rate (units per EUR) for a currency on a given day.
export async function rateOn(cur, date) {
  if (cur === 'EUR') return { rate: 1, date };
  const today = ymd(new Date());
  if (date >= today) {
    if (!latest[cur] || Date.now() - meta.fetchedAt > 3 * 3600e3) { try { await refresh([cur]); } catch (e) { /* use cache */ } }
    if (latest[cur]) return { rate: latest[cur], date: meta.date || today };
    throw new Error('No rate for ' + cur);
  }
  const key = 'fx:' + date;
  let day = await db.kvGet(key);
  if (!day) {
    try { day = await frankfurter(date); await db.kvSet(key, day); } catch (e) { day = null; }
  }
  if (day && day.rates[cur]) return { rate: day.rates[cur], date: day.date || date };
  if (latest[cur]) return { rate: latest[cur], date: meta.date, approx: true };
  throw new Error('No rate for ' + cur);
}
