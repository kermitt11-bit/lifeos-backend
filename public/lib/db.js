const DB_NAME = "lifeos";
const DB_VERSION = 2;
const STORES = [
  "entries", "tasks", "habits", "habitLogs", "goals", "moods",
  "pantry", "meals", "workouts", "hobbies", "hobbyLogs",
  "healthLogs", "presetBlocks", "actualBlocks", "reviews",
  "kv",
];

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "id" });
        }
      }
    };
  });
  return dbPromise;
}

async function tx(store, mode = "readonly") {
  const db = await openDB();
  return db.transaction(store, mode).objectStore(store);
}

export async function getAll(store) {
  const s = await tx(store);
  return new Promise((resolve, reject) => {
    const req = s.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function put(store, item) {
  if (!item.id) item.id = crypto.randomUUID();
  const s = await tx(store, "readwrite");
  return new Promise((resolve, reject) => {
    const req = s.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function remove(store, id) {
  const s = await tx(store, "readwrite");
  return new Promise((resolve, reject) => {
    const req = s.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function clearAll() {
  const db = await openDB();
  return Promise.all(
    STORES.map(
      (name) =>
        new Promise((resolve, reject) => {
          const r = db.transaction(name, "readwrite").objectStore(name).clear();
          r.onsuccess = () => resolve(true);
          r.onerror = () => reject(r.error);
        })
    )
  );
}

export async function kvGet(key, fallback = null) {
  const s = await tx("kv");
  return new Promise((resolve, reject) => {
    const req = s.get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : fallback);
    req.onerror = () => reject(req.error);
  });
}

export async function kvSet(key, value) {
  const s = await tx("kv", "readwrite");
  return new Promise((resolve, reject) => {
    const req = s.put({ id: key, value });
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function exportAll() {
  const out = {};
  for (const name of STORES) out[name] = await getAll(name);
  return out;
}
