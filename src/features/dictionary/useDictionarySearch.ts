import { useEffect, useMemo, useState } from 'react'
import { useSearchableItems, type SearchableItems } from './dictionaryContext.ts'
import { searchItems } from './search.ts'
import type { StudyItem } from './studyItem.ts'

/** Espera desde la última tecla antes de buscar. */
export const SEARCH_DEBOUNCE_MS = 200
/** Búsquedas recientes que se recuerdan (por versión del diccionario cargado). */
const CACHED_SEARCHES = 30

const HAN = /\p{Script=Han}/u

/**
 * Longitud mínima de una búsqueda: un hanzi basta; en pinyin o inglés hacen
 * falta dos letras, porque una sola coincide con decenas de miles de entradas.
 */
export function isLongEnough(query: string): boolean {
  const text = query.trim()
  return HAN.test(text) || Array.from(text).length >= 2
}

/** El valor, pero solo cuando lleva `delayMs` sin cambiar. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    // Cada tecla cancela la espera anterior: solo se busca lo último que se escribió
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

// Resultados por lista de elementos (cambia cuando llega el diccionario completo) y búsqueda
const resultCache = new WeakMap<readonly StudyItem[], Map<string, StudyItem[]>>()

/** Busca con caché: repetir una búsqueda reciente (borrar y volver a escribir) no vuelve a recorrer todo. */
export function cachedSearch(items: readonly StudyItem[], query: string, limit: number): StudyItem[] {
  let cache = resultCache.get(items)
  if (!cache) {
    cache = new Map()
    resultCache.set(items, cache)
  }
  const key = `${limit}|${query.trim().toLowerCase()}`
  const cached = cache.get(key)
  if (cached) {
    // Pasa al final: la más reciente
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
   * 'idle': sin búsqueda. 'too-short': falta texto. 'pending': esperando a que
   * se deje de escribir. 'ready': resultados de lo escrito.
   */
  status: 'idle' | 'too-short' | 'pending' | 'ready'
  /** Si ya se busca en todo el diccionario o todavía solo en HSK 1-4. */
  dictionary: SearchableItems['status']
}

/**
 * Búsqueda del diccionario para los buscadores de la app: espera a que se
 * deje de escribir, pide una longitud mínima, recuerda las búsquedas recientes
 * y mantiene el orden de siempre (exactas primero, HSK antes que el resto).
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
