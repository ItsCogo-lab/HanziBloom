import type { ReactNode } from 'react'
import type { KeyValueStorage } from '../lib/storage.ts'
import { CustomSetsProvider } from '../features/customSets/CustomSetsProvider.tsx'
import { DictionaryProvider } from '../features/dictionary/DictionaryProvider.tsx'
import type { LoadChunk } from '../features/dictionary/dictionaryStore.ts'
import type { DictionaryCache } from '../features/dictionary/runtime/dictionaryCache.ts'
import { RuntimeSourcesProvider } from '../features/dictionary/runtime/RuntimeSourcesProvider.tsx'
import { MyStudiesProvider } from '../features/myStudies/MyStudiesProvider.tsx'
import { ProgressProvider } from '../features/progress/ProgressProvider.tsx'
import { SettingsProvider } from '../features/settings/SettingsProvider.tsx'

type AppProvidersProps = {
  children: ReactNode
  /** Almacenamiento de los datos del usuario; por defecto localStorage. */
  storage?: KeyValueStorage
  /** De dónde salen los trozos del diccionario completo; por defecto, el repositorio de datos. */
  loadChunk?: LoadChunk
  /** Caché de las fuentes externas (trazos, frases); por defecto IndexedDB. */
  cache?: DictionaryCache
  /** Cómo se llama a las fuentes externas; por defecto, el fetch del navegador. */
  fetchFn?: typeof fetch
}

/** Estado compartido por toda la app. Los tests lo usan igual que <App>. */
export function AppProviders({ children, storage, loadChunk, cache, fetchFn }: AppProvidersProps) {
  return (
    <RuntimeSourcesProvider cache={cache} fetchFn={fetchFn}>
      <DictionaryProvider loadChunk={loadChunk}>
        <SettingsProvider storage={storage}>
          <ProgressProvider storage={storage}>
            <MyStudiesProvider storage={storage}>
              <CustomSetsProvider storage={storage}>{children}</CustomSetsProvider>
            </MyStudiesProvider>
          </ProgressProvider>
        </SettingsProvider>
      </DictionaryProvider>
    </RuntimeSourcesProvider>
  )
}
