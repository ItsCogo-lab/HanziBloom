import type { ReactNode } from 'react'
import type { KeyValueStorage } from '../lib/storage.ts'
import { CustomSetsProvider } from '../features/customSets/CustomSetsProvider.tsx'
import { DictionaryProvider } from '../features/dictionary/DictionaryProvider.tsx'
import type { LoadChunk } from '../features/dictionary/dictionaryStore.ts'
import { MyStudiesProvider } from '../features/myStudies/MyStudiesProvider.tsx'
import { ProgressProvider } from '../features/progress/ProgressProvider.tsx'
import { SettingsProvider } from '../features/settings/SettingsProvider.tsx'

type AppProvidersProps = {
  children: ReactNode
  /** Almacenamiento de los datos del usuario; por defecto localStorage. */
  storage?: KeyValueStorage
  /** De dónde salen los trozos del diccionario completo; por defecto, public/dictionary/. */
  loadChunk?: LoadChunk
}

/** Estado compartido por toda la app. Los tests lo usan igual que <App>. */
export function AppProviders({ children, storage, loadChunk }: AppProvidersProps) {
  return (
    <DictionaryProvider loadChunk={loadChunk}>
      <SettingsProvider storage={storage}>
        <ProgressProvider storage={storage}>
          <MyStudiesProvider storage={storage}>
            <CustomSetsProvider storage={storage}>{children}</CustomSetsProvider>
          </MyStudiesProvider>
        </ProgressProvider>
      </SettingsProvider>
    </DictionaryProvider>
  )
}
