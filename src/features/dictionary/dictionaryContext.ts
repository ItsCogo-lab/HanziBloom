import { createContext, use, useEffect, useState, useSyncExternalStore } from 'react'
import type { Dictionary } from './dictionary.ts'
import type { DictionaryStore } from './dictionaryStore.ts'
import type { StudyItem, StudyItemId } from './studyItem.ts'

export const DictionaryStoreContext = createContext<DictionaryStore | null>(null)

export function useDictionaryStore(): DictionaryStore {
  const store = use(DictionaryStoreContext)
  if (!store) throw new Error('useDictionaryStore debe usarse dentro de <DictionaryProvider>')
  return store
}

/** El diccionario con todo lo cargado hasta ahora. Se vuelve a pintar cuando llega un trozo. */
export function useDictionary(): Dictionary {
  const store = useDictionaryStore()
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}

export type LoadStatus = 'loading' | 'ready' | 'error'

/**
 * Carga lo necesario para mostrar estos elementos (un set propio con palabras
 * de fuera de HSK, una ficha). Con elementos de HSK está listo al momento.
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
  /** 'partial': de momento solo HSK 1-4 (cargando el resto, o sin poder cargarlo). */
  status: 'complete' | 'loading' | 'error'
}

/**
 * Elementos en los que buscar. Mientras `active` sea falso (no se ha escrito
 * nada) no se descarga nada y se usan los de HSK 1-4. Al empezar a buscar se
 * carga todo el diccionario; hasta que llega, se busca en HSK.
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
