import type { CacheEntry, DictionaryCache } from './dictionaryCache.ts'
import { SourceError } from './http.ts'

/** What an adapter returns: the already normalized data and where it comes from. */
export interface Fetched<T> {
  data: T
  /** Source and version, e.g. "hanzi-writer-data@2.0.1 (jsDelivr)". */
  source: string
}

export interface Resource<T> {
  data: T
  source: string
  fetchedAt: number
  /** Comes from the cache and its lifetime has passed: it's being requested again. */
  stale: boolean
}

export interface LoadOptions<T> {
  /** Cache key, e.g. "strokes:柠". */
  key: string
  /** How long stored data is considered up to date. */
  ttlMs: number
  /** Requests the data from the source (through its adapter). */
  fetch: (signal: AbortSignal | undefined) => Promise<Fetched<T>>
  signal?: AbortSignal
  /** Called if, after returning expired data, new data arrives. */
  onUpdate?: (resource: Resource<T>) => void
}

export interface ResourceService {
  load: <T>(options: LoadOptions<T>) => Promise<Resource<T>>
}

/**
 * Loads data from external sources with a "stale-while-revalidate" cache:
 *
 * 1. Cached and up to date: returned without calling anyone.
 * 2. Cached but expired: returned right away and requested again in the
 *    background; if it arrives, it's stored and reported via `onUpdate`. If the
 *    source fails, the stored data keeps being used.
 * 3. Not cached: requested from the source, stored and returned. If it fails, the
 *    error reaches the caller, who decides what to show (nothing is ever made up).
 *
 * Two simultaneous requests for the same key share a single download.
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
          // In the background, without the caller's signal: the new data serves the next time
          download(key, fetch, undefined).then(
            (fresh) => onUpdate?.(toResource(fresh, false)),
            () => {}, // Offline: carry on with the stored data
          )
        }
        return toResource(cached, stale)
      }
      return toResource(await download(key, fetch, signal), false)
    },
  }
}
