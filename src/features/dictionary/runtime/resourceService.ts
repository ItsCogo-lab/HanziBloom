import type { CacheEntry, DictionaryCache } from './dictionaryCache.ts'
import { SourceError } from './http.ts'

/** Lo que devuelve un adaptador: los datos ya normalizados y de dónde salen. */
export interface Fetched<T> {
  data: T
  /** Fuente y versión, p. ej. "hanzi-writer-data@2.0.1 (jsDelivr)". */
  source: string
}

export interface Resource<T> {
  data: T
  source: string
  fetchedAt: number
  /** Viene de la caché y ya pasó su tiempo de vida: se está pidiendo de nuevo. */
  stale: boolean
}

export interface LoadOptions<T> {
  /** Clave de caché, p. ej. "strokes:柠". */
  key: string
  /** Tiempo que un dato guardado se considera al día. */
  ttlMs: number
  /** Pide el dato a la fuente (a través de su adaptador). */
  fetch: (signal: AbortSignal | undefined) => Promise<Fetched<T>>
  signal?: AbortSignal
  /** Se llama si, después de devolver un dato caducado, llega uno nuevo. */
  onUpdate?: (resource: Resource<T>) => void
}

export interface ResourceService {
  load: <T>(options: LoadOptions<T>) => Promise<Resource<T>>
}

/**
 * Carga datos de las fuentes externas con caché «stale-while-revalidate»:
 *
 * 1. En caché y al día: se devuelve sin llamar a nadie.
 * 2. En caché pero caducado: se devuelve al momento y se pide de nuevo en
 *    segundo plano; si llega, se guarda y se avisa con `onUpdate`. Si la
 *    fuente falla, se sigue usando lo guardado.
 * 3. Sin caché: se pide a la fuente, se guarda y se devuelve. Si falla, el
 *    error llega a quien lo pidió, que decide qué enseñar (nunca se inventa).
 *
 * Dos peticiones de la misma clave a la vez comparten una sola descarga.
 */
export function createResourceService(cache: DictionaryCache, now: () => number = Date.now): ResourceService {
  const inFlight = new Map<string, Promise<CacheEntry>>()

  function download<T>(key: string, fetch: LoadOptions<T>['fetch'], signal: AbortSignal | undefined) {
    let request = inFlight.get(key) as Promise<CacheEntry<T>> | undefined
    if (!request) {
      request = fetch(signal).then(async ({ data, source }) => {
        const entry: CacheEntry<T> = { key, data, source, fetchedAt: now() }
        await cache.set(entry)
        return entry
      })
      inFlight.set(key, request)
      const forget = () => inFlight.delete(key)
      request.then(forget, forget)
    }
    return request
  }

  const toResource = <T>(entry: CacheEntry<T>, stale: boolean): Resource<T> => ({
    data: entry.data,
    source: entry.source,
    fetchedAt: entry.fetchedAt,
    stale,
  })

  return {
    load: async <T>({ key, ttlMs, fetch, signal, onUpdate }: LoadOptions<T>) => {
      const cached = await cache.get<T>(key)
      if (signal?.aborted) throw new SourceError('aborted', 'Request cancelled')
      if (cached) {
        const stale = now() - cached.fetchedAt > ttlMs
        if (stale) {
          // En segundo plano, sin la señal de quien pidió: el dato nuevo sirve a la siguiente vez
          download(key, fetch, undefined).then(
            (fresh) => onUpdate?.(toResource(fresh, false)),
            () => {}, // Sin conexión: se sigue con lo guardado
          )
        }
        return toResource(cached, stale)
      }
      return toResource(await download(key, fetch, signal), false)
    },
  }
}
