import { useState, type ReactNode } from 'react'
import { DictionaryStoreContext } from './dictionaryContext.ts'
import { createDictionaryStore, type LoadChunk } from './dictionaryStore.ts'
import { hskDictionary } from './hskDictionary.ts'
import { loadDictionaryChunk } from './runtime/dictionaryService.ts'
import { useRuntimeSources } from './runtime/runtimeSourcesContext.ts'

type DictionaryProviderProps = {
  children: ReactNode
  /** De dónde salen los trozos del diccionario completo; por defecto, el repositorio de datos. */
  loadChunk?: LoadChunk
}

/** Da a toda la app el mismo diccionario: HSK 1-4 más lo que se vaya cargando del completo. */
export function DictionaryProvider({ children, loadChunk }: DictionaryProviderProps) {
  const sources = useRuntimeSources()
  const [store] = useState(() =>
    createDictionaryStore(hskDictionary, loadChunk ?? ((index) => loadDictionaryChunk(sources, index))),
  )
  return <DictionaryStoreContext value={store}>{children}</DictionaryStoreContext>
}
