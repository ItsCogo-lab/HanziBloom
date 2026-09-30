/**
 * Local cache of what's downloaded at runtime (strokes, sentences,
 * dictionary entries). It lives in IndexedDB and not localStorage: it can
 * grow to several MB and localStorage is limited to about 5 MB for the whole app.
 *
 * If IndexedDB isn't available (private mode in some browsers, tests),
 * an in-memory cache is used: the app works the same, just without remembering
 * anything on reload.
 */

/** A stored response, with where it came from and when. */
export interface CacheEntry<T = unknown> {
  key: string
  data: T
  /** Time of download, in milliseconds (Date.now()). */
  fetchedAt: number
  /** Source and version: "hanzi-writer-data@2.0.1", "tatoeba-api-v1". */
  source: string
}

export interface DictionaryCache {
  get: <T>(key: string) => Promise<CacheEntry<T> | undefined>
  set: <T>(entry: CacheEntry<T>) => Promise<void>
}

export function createMemoryCache(): DictionaryCache {
  const entries = new Map<string, CacheEntry>()
  return {
    get: async <T>(key: string) => entries.get(key) as CacheEntry<T> | undefined,
    set: async (entry) => {
      entries.set(entry.key, entry)
    },
  }
}

const DATABASE = 'hanzivocab-dictionary'
const STORE = 'cache'
/** If the stored format changes, bump this and the cache starts from scratch. */
const DATABASE_VERSION = 1

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  const open = factory.open(DATABASE, DATABASE_VERSION)
  open.onupgradeneeded = () => {
    const db = open.result
    if (db.objectStoreNames.contains(STORE)) db.deleteObjectStore(STORE)
    db.createObjectStore(STORE, { keyPath: 'key' })
  }
  return request(open)
}

/**
 * IndexedDB cache. Any IndexedDB error (quota full, database
 * blocked) is treated as "not in cache": it never breaks an entry page.
 */
export function createIndexedDbCache(factory: IDBFactory): DictionaryCache {
  let database: Promise<IDBDatabase> | undefined
  const db = () => (database ??= openDatabase(factory))
  return {
    get: async <T>(key: string) => {
      try {
        const store = (await db()).transaction(STORE, 'readonly').objectStore(STORE)
        return (await request(store.get(key))) as CacheEntry<T> | undefined
      } catch {
        return undefined
      }
    },
    set: async (entry) => {
      try {
        const store = (await db()).transaction(STORE, 'readwrite').objectStore(STORE)
        await request(store.put(entry))
      } catch {
        // No space or no permission: carry on without saving
      }
    },
  }
}

/** The app's cache: IndexedDB if it exists, memory if not. */
export function createBrowserCache(): DictionaryCache {
  try {
    if (typeof indexedDB !== 'undefined') return createIndexedDbCache(indexedDB)
  } catch {
    // Accessing indexedDB can throw in some private modes
  }
  return createMemoryCache()
}
