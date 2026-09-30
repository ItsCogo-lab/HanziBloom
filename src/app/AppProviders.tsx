import type { ReactNode } from 'react'
import type { KeyValueStorage } from '../lib/storage.ts'
import { AccountProvider } from '../features/account/AccountProvider.tsx'
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
  /** Storage for the user's data; localStorage by default. */
  storage?: KeyValueStorage
  /** Where the full dictionary chunks come from; the data repository by default. */
  loadChunk?: LoadChunk
  /** Cache for external sources (strokes, sentences); IndexedDB by default. */
  cache?: DictionaryCache
  /** How external sources are called; the browser's fetch by default. */
  fetchFn?: typeof fetch
}

/** State shared by the whole app. Tests use it just like <App>. */
export function AppProviders({ children, storage, loadChunk, cache, fetchFn }: AppProvidersProps) {
  return (
    <RuntimeSourcesProvider cache={cache} fetchFn={fetchFn}>
      <DictionaryProvider loadChunk={loadChunk}>
        <AccountProvider storage={storage}>
          {(userStorage) => (
            <SettingsProvider storage={userStorage}>
              <ProgressProvider storage={userStorage}>
                <MyStudiesProvider storage={userStorage}>
                  <CustomSetsProvider storage={userStorage}>{children}</CustomSetsProvider>
                </MyStudiesProvider>
              </ProgressProvider>
            </SettingsProvider>
          )}
        </AccountProvider>
      </DictionaryProvider>
    </RuntimeSourcesProvider>
  )
}
