import { useState, type ReactNode } from 'react'
import { DictionaryStoreContext } from './dictionaryContext.ts'
import { createDictionaryStore, type LoadChunk } from './dictionaryStore.ts'
import { hskDictionary } from './hskDictionary.ts'
import { loadDictionaryChunk } from './runtime/dictionaryService.ts'
import { useRuntimeSources } from './runtime/runtimeSourcesContext.ts'

type DictionaryProviderProps = {
  children: ReactNode
  /** Where the full dictionary chunks come from; by default, the data repository. */
  loadChunk?: LoadChunk
}

/** Gives the whole app the same dictionary: HSK 1-4 plus whatever loads from the full one. */
export function DictionaryProvider({ children, loadChunk }: DictionaryProviderProps) {
  const sources = useRuntimeSources()
  const [store] = useState(() =>
    createDictionaryStore(hskDictionary, loadChunk ?? ((index) => loadDictionaryChunk(sources, index))),
  )
  return <DictionaryStoreContext value={store}>{children}</DictionaryStoreContext>
}
