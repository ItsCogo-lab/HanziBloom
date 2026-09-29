/**
 * Caché local de lo que se descarga en tiempo de ejecución (trazos, frases,
 * entradas del diccionario). Va en IndexedDB y no en localStorage: puede
 * crecer a varios MB y localStorage está limitado a unos 5 MB para toda la app.
 *
 * Si IndexedDB no está disponible (modo privado de algunos navegadores, tests),
 * se usa una caché en memoria: la app funciona igual, solo que sin recordar
 * nada al recargar.
 */

/** Una respuesta guardada, con de dónde salió y cuándo. */
export interface CacheEntry<T = unknown> {
  key: string
  data: T
  /** Momento de la descarga, en milisegundos (Date.now()). */
  fetchedAt: number
  /** Fuente y versión: "hanzi-writer-data@2.0.1", "tatoeba-api-v1". */
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
/** Si cambia el formato de lo guardado, se sube y la caché empieza de cero. */
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
 * Caché en IndexedDB. Cualquier error de IndexedDB (cuota llena, base de datos
 * bloqueada) se trata como «no está en caché»: nunca rompe una ficha.
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
        // Sin espacio o sin permiso: se sigue sin guardar
      }
    },
  }
}

/** La caché de la app: IndexedDB si existe, memoria si no. */
export function createBrowserCache(): DictionaryCache {
  try {
    if (typeof indexedDB !== 'undefined') return createIndexedDbCache(indexedDB)
  } catch {
    // Acceder a indexedDB puede lanzar en algunos modos privados
  }
  return createMemoryCache()
}
