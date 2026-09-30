import { useEffect, useMemo, useState } from 'react'
import { useSearchableItems, type SearchableItems } from './dictionaryContext.ts'
import { searchItems } from './search.ts'
import type { StudyItem } from './studyItem.ts'

/** Wait after the last keystroke before searching. */
export const SEARCH_DEBOUNCE_MS = 200
/** Recent searches remembered (per loaded dictionary version). */
const CACHED_SEARCHES = 30

const HAN = /\p{Script=Han}/u

/**
 * Minimum search length: one hanzi is enough; in pinyin or English two
 * letters are needed, because a single one matches tens of thousands of entries.
 */
export function isLongEnough(query: string): boolean {
  const text = query.trim()
  return HAN.test(text) || Array.from(text).length >= 2
}

/** The value, but only once it has gone `delayMs` without changing. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    // Each keystroke cancels the previous wait: only the latest input is searched
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

// Results per item list (changes when the full dictionary arrives) and query
const resultCache = new WeakMap<readonly StudyItem[], Map<string, StudyItem[]>>()

/** Cached search: repeating a recent search (deleting and retyping) doesn't walk through everything again. */
export function cachedSearch(items: readonly StudyItem[], query: string, limit: number): StudyItem[] {
  let cache = resultCache.get(items)
  if (!cache) {
    cache = new Map()
    resultCache.set(items, cache)
  }
  const key = `${limit}|${query.trim().toLowerCase()}`
  const cached = cache.get(key)
  if (cached) {
    // Move to the end: the most recent
    cache.delete(key)
    cache.set(key, cached)
    return cached
  }
  const results = searchItems(items, query, limit)
  cache.set(key, results)
  if (cache.size > CACHED_SEARCHES) cache.delete(cache.keys().next().value!)
  return results
}

export interface DictionarySearch {
  results: StudyItem[]
  /**
   * 'idle': no search. 'too-short': not enough text. 'pending': waiting for
   * typing to stop. 'ready': results for what was typed.
   */
  status: 'idle' | 'too-short' | 'pending' | 'ready'
  /** Whether the whole dictionary is searched yet or still only HSK 1-4. */
  dictionary: SearchableItems['status']
}

/**
 * Dictionary search for the app's search boxes: waits for typing to stop,
 * requires a minimum length, remembers recent searches and keeps the usual
 * order (exact first, HSK before the rest).
 */
export function useDictionarySearch(
  query: string,
  { kind, limit = Infinity }: { kind?: StudyItem['kind']; limit?: number } = {},
): DictionarySearch {
  const hasQuery = query.trim() !== ''
  const searchable = useSearchableItems(hasQuery)
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)
  const items = useMemo(
    () => (kind ? searchable.items.filter((item) => item.kind === kind) : searchable.items),
    [searchable.items, kind],
  )
  const canSearch = isLongEnough(debouncedQuery)
  const results = useMemo(
    () => (canSearch ? cachedSearch(items, debouncedQuery, limit) : []),
    [items, debouncedQuery, limit, canSearch],
  )

  const status = !hasQuery
    ? 'idle'
    : !isLongEnough(query)
      ? 'too-short'
      : debouncedQuery !== query
        ? 'pending'
        : 'ready'
  return { results: status === 'idle' || status === 'too-short' ? [] : results, status, dictionary: searchable.status }
}
