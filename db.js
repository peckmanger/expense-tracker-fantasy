// db.js — tiny IndexedDB wrapper. All data lives only on this device.
// Own database name, so this app never touches the plain Expenses app even on the same github.io domain.
const DB_NAME = 'dragons-hoard';
const DB_VERSION = 1;
export const STORES = ['transactions', 'categories', 'accounts', 'recurring', 'goals', 'kv'];

let dbPromise = null;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const s of STORES) {
        if (!db.objectStoreNames.contains(s)) {
          db.createObjectStore(s, { keyPath: s === 'kv' ? 'key' : 'id' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function run(store, mode, fn) {
  return open().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const os = t.objectStore(store);
    let result;
    const req = fn(os);
    if (req) req.onsuccess = () => { result = req.result; };
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export const getAll = store => run(store, 'readonly', os => os.getAll());
export const put = (store, value) => run(store, 'readwrite', os => os.put(value)).then(() => value);
export const del = (store, id) => run(store, 'readwrite', os => os.delete(id));
export const clear = store => run(store, 'readwrite', os => os.clear());

export function bulkPut(store, values) {
  return run(store, 'readwrite', os => { for (const v of values) os.put(v); return null; });
}

export async function kvGet(key) {
  const row = await run('kv', 'readonly', os => os.get(key));
  return row ? row.value : undefined;
}
export const kvSet = (key, value) => run('kv', 'readwrite', os => os.put({ key, value }));

export async function clearAll() {
  for (const s of STORES) await clear(s);
}
