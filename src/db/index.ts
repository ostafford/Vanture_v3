/**
 * SQLite (sql.js) with IndexedDB persistence.
 * Load DB from IndexedDB on startup; persist to IndexedDB after writes (debounced + beforeunload).
 */

import initSqlJs, { type Database } from 'sql.js'
import { persistErrorStore } from '@/stores/persistErrorStore'

const INDEXED_DB_NAME = 'vantura-db'
const INDEXED_DB_STORE = 'sqlite'
const INDEXED_DB_KEY = 'sqlite'
const PERSIST_DEBOUNCE_MS = 400

let db: Database | null = null
let persistTimeout: ReturnType<typeof setTimeout> | null = null

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXED_DB_NAME, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(INDEXED_DB_STORE)
    }
  })
}

function readFromIndexedDB(idb: IDBDatabase): Promise<ArrayBuffer | undefined> {
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(INDEXED_DB_STORE, 'readonly')
    const store = tx.objectStore(INDEXED_DB_STORE)
    const request = store.get(INDEXED_DB_KEY)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as ArrayBuffer | undefined)
  })
}

function writeToIndexedDB(idb: IDBDatabase, data: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(INDEXED_DB_STORE, 'readwrite')
    const store = tx.objectStore(INDEXED_DB_STORE)
    store.put(data, INDEXED_DB_KEY)
    tx.onerror = () => reject(tx.error)
    tx.oncomplete = () => resolve()
  })
}

function doPersist(): void {
  if (!db) return
  const data = db.export()
  const idbPromise = openIndexedDB()
  idbPromise
    .then((idb) => writeToIndexedDB(idb, data.buffer))
    .then(() => idbPromise.then((idb) => idb.close()))
    .then(() => persistErrorStore.getState().setPersistError(null))
    .catch((err) => {
      console.error('Failed to persist DB to IndexedDB', err)
      let message =
        'Changes may not be saved. Try freeing space or clear site data.'
      if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
        navigator
          .storage.estimate()
          .then((est) => {
            const usage = est.usage ?? 0
            const quota = est.quota ?? 0
            if (quota > 0 && usage >= quota * 0.95) {
              message = 'Storage is almost full. Changes may not be saved.'
            }
            persistErrorStore.getState().setPersistError(message)
          })
          .catch(() => persistErrorStore.getState().setPersistError(message))
      } else {
        persistErrorStore.getState().setPersistError(message)
      }
    })
}

export function schedulePersist(): void {
  if (persistTimeout) clearTimeout(persistTimeout)
  persistTimeout = setTimeout(() => {
    persistTimeout = null
    doPersist()
  }, PERSIST_DEBOUNCE_MS)
}

export function getDb(): Database | null {
  return db
}

/**
 * Get a value from app_settings. Returns null if key not found.
 */
export function getAppSetting(key: string): string | null {
  if (!db) return null
  const stmt = db.prepare(`SELECT value FROM app_settings WHERE key = ?`)
  stmt.bind([key])
  if (!stmt.step()) {
    stmt.free()
    return null
  }
  const value = String(stmt.get()[0])
  stmt.free()
  return value
}

/**
 * Set a value in app_settings. Persists to IndexedDB after write.
 */
export function setAppSetting(key: string, value: string): void {
  if (!db) return
  db.run(`INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`, [
    key,
    value,
  ])
  schedulePersist()
}

export function isDbReady(): boolean {
  return db !== null
}

/**
 * Initialize the database: load from IndexedDB or create new.
 * Call once before rendering theme-dependent UI.
 */
export async function initDb(): Promise<void> {
  if (db) return

  const SQL = await initSqlJs({
    locateFile: (file) => `/${file}`,
  })

  const idb = await openIndexedDB()
  const existing = await readFromIndexedDB(idb)
  idb.close()

  if (existing && existing.byteLength > 0) {
    db = new SQL.Database(new Uint8Array(existing))
  } else {
    db = new SQL.Database()
    const { runSchema } = await import('./schema')
    runSchema(db)
    schedulePersist()
  }

  window.addEventListener('beforeunload', () => {
    if (persistTimeout) clearTimeout(persistTimeout)
    doPersist()
  })
}
