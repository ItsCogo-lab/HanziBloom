import { useState, type ReactNode } from 'react'
import { DictionaryStoreContext } from './dictionaryContext.ts'
import { createDictionaryStore, fetchDictionaryChunk, type LoadChunk } from './dictionaryStore.ts'
import { hskDictionary } from './hskDictionary.ts'

type DictionaryProviderProps = {
  children: ReactNode
  /** De dónde salen los trozos del diccionario completo; por defecto, public/dictionary/. */
  loadChunk?: LoadChunk
}

/** Da a toda la app el mismo diccionario: HSK 1-4 más lo que se vaya cargando del completo. */
export function DictionaryProvider({ children, loadChunk = fetchDictionaryChunk }: DictionaryProviderProps) {
  const [store] = useState(() => createDictionaryStore(hskDictionary, loadChunk))
  return <DictionaryStoreContext value={store}>{children}</DictionaryStoreContext>
}
