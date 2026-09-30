import { createContext, use, useEffect, useState, useSyncExternalStore } from 'react'
import type { Dictionary } from './dictionary.ts'
import type { DictionaryStore } from './dictionaryStore.ts'
import type { StudyItem, StudyItemId } from './studyItem.ts'

export const DictionaryStoreContext = createContext<DictionaryStore | null>(null)

export function useDictionaryStore(): DictionaryStore {
  const store = use(DictionaryStoreContext)
  if (!store) throw new Error('useDictionaryStore must be used within <DictionaryProvider>')
  return store
}

/** The dictionary with everything loaded so far. Re-renders when a chunk arrives. */
export function useDictionary(): Dictionary {
  const store = useDictionaryStore()
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}

export type LoadStatus = 'loading' | 'ready' | 'error'

/**
 * Loads what's needed to show these items (a custom set with words from
 * outside HSK, an entry page). With HSK items it's ready right away.
 */
export function useLoadItems(itemIds: readonly StudyItemId[]): LoadStatus {
  const store = useDictionaryStore()
  useDictionary()
  const key = itemIds.join('\n')
  const [result, setResult] = useState<{ key: string; status: LoadStatus }>()

  useEffect(() => {
    let cancelled = false
    store.loadItems(key === '' ? [] : (key.split('\n') as StudyItemId[])).then(
      () => !cancelled && setResult({ key, status: 'ready' }),
      () => !cancelled && setResult({ key, status: 'error' }),
    )
    return () => {
      cancelled = true
    }
  }, [store, key])

  if (store.hasItems(itemIds)) return 'ready'
  return result?.key === key ? result.status : 'loading'
}

export interface SearchableItems {
  items: readonly StudyItem[]
  /** 'partial': only HSK 1-4 for now (loading the rest, or unable to load it). */
  status: 'complete' | 'loading' | 'error'
}

/**
 * Items to search in. While `active` is false (nothing has been typed)
 * nothing is downloaded and the HSK 1-4 items are used. Once searching starts
 * the whole dictionary is loaded; until it arrives, HSK is searched.
 */
export function useSearchableItems(active: boolean): SearchableItems {
  const store = useDictionaryStore()
  useDictionary()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!active) return
    let cancelled = false
    store.loadAll().then(
      () => !cancelled && setFailed(false),
      () => !cancelled && setFailed(true),
    )
    return () => {
      cancelled = true
    }
  }, [store, active])

  if (store.isComplete()) return { items: store.getItems(), status: 'complete' }
  return { items: store.baseItems, status: failed ? 'error' : 'loading' }
}

/**
 * Loads the entries needed to split this text into words (those starting
 * with each of its characters). 'error' means it can only be split with what
 * had loaded, such as HSK 1-4.
 */
export function useLoadText(text: string): LoadStatus {
  const store = useDictionaryStore()
  useDictionary()
  const [result, setResult] = useState<{ text: string; status: LoadStatus }>()

  useEffect(() => {
    let cancelled = false
    store.loadText(text).then(
      () => !cancelled && setResult({ text, status: 'ready' }),
      () => !cancelled && setResult({ text, status: 'error' }),
    )
    return () => {
      cancelled = true
    }
  }, [store, text])

  if (store.hasText(text)) return 'ready'
  return result?.text === text ? result.status : 'loading'
}
