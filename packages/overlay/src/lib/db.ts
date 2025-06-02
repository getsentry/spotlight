export const MAX_AGE = 30 * 60 * 1000; // 30 minutes
export const MAX_ITEMS = 1000;
export const DB_NAME = "SentrySpotlight";
export const OBJECT_STORE_NAME = "events";
export const DB_VERSION = 2;

function promiseWithResolvers<T = unknown>() {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise((rs, rj) => {
    resolve = rs;
    reject = rj;
  });
  // @ts-expect-error ts2454 -- This is not a valid error as the promise constructor callback is executed immediately
  return { resolve, reject, promise };
}

let _DB: IDBDatabase | null = null;

export function clearDBCache() {
  _DB = null;
}

function createDB(): Promise<IDBDatabase> {
  const { promise, resolve, reject } = promiseWithResolvers();
  const rejectFromErrorEvent = (evt: Event) => reject((evt.target as IDBOpenDBRequest).error);
  const openDBRequest = indexedDB.open(DB_NAME, DB_VERSION);
  openDBRequest.onerror = rejectFromErrorEvent;
  openDBRequest.onupgradeneeded = () => {
    const db = openDBRequest.result;
    try {
      db.deleteObjectStore(OBJECT_STORE_NAME);
    } catch (_err) {
      // just ignore if it is missing
    }
    db.createObjectStore(OBJECT_STORE_NAME, { autoIncrement: true }).createIndex("timestamp", "timestamp", {
      unique: false,
    });
  };

  openDBRequest.onsuccess = () => {
    const db = openDBRequest.result;
    // Clean up expired entries
    const tx = db.transaction([OBJECT_STORE_NAME], "readwrite");
    tx.onerror = rejectFromErrorEvent;
    tx.oncomplete = () => resolve(db);
    const cursorRequest = tx
      .objectStore(OBJECT_STORE_NAME)
      .index("timestamp")
      .openCursor(IDBKeyRange.upperBound(new Date(Date.now() - MAX_AGE)));
    cursorRequest.onerror = rejectFromErrorEvent;
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      cursor.delete();
      cursor.continue();
    };
  };
  return promise as Promise<IDBDatabase>;
}

async function getDB() {
  if (!_DB) {
    _DB = await createDB();
  }
  return _DB;
}

export async function add(value: unknown) {
  const { promise, resolve, reject } = promiseWithResolvers();
  const rejectFromErrorEvent = (evt: Event) => reject((evt.target as IDBOpenDBRequest).error);
  const db = await getDB();
  const tx = db.transaction([OBJECT_STORE_NAME], "readwrite");
  tx.onerror = rejectFromErrorEvent;

  const addRequest = tx.objectStore(OBJECT_STORE_NAME).add({
    value,
    timestamp: new Date(),
  });
  addRequest.onerror = rejectFromErrorEvent;
  addRequest.onsuccess = () => resolve(addRequest.result);
  return promise;
}

export async function getEntries() {
  const { promise, resolve, reject } = promiseWithResolvers();
  const rejectFromErrorEvent = (evt: Event) => reject((evt.target as IDBOpenDBRequest).error);
  const db = await getDB();
  const tx = db.transaction([OBJECT_STORE_NAME], "readwrite");
  tx.onerror = rejectFromErrorEvent;

  const items: unknown[] = [];
  const cursorRequest = tx.objectStore(OBJECT_STORE_NAME).openCursor();
  cursorRequest.onerror = rejectFromErrorEvent;
  cursorRequest.onsuccess = () => {
    const cursor = cursorRequest.result;
    if (!cursor) resolve(items);
    else {
      if (items.length < MAX_ITEMS) {
        items.push(cursor.value.value);
      } else {
        cursor.delete();
      }
      cursor.continue();
    }
  };
  return promise;
}

export async function reset() {
  const { promise, resolve, reject } = promiseWithResolvers();
  const rejectFromErrorEvent = (evt: Event) => reject((evt.target as IDBOpenDBRequest).error);
  const db = await getDB();
  const tx = db.transaction([OBJECT_STORE_NAME], "readwrite");
  tx.onerror = rejectFromErrorEvent;
  const getRequest = tx.objectStore(OBJECT_STORE_NAME).clear();
  getRequest.onerror = rejectFromErrorEvent;
  getRequest.onsuccess = () => resolve(true);
  return promise;
}
