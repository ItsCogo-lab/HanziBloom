import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { AppProviders } from '../app/AppProviders.tsx'
import type { DictionaryChunk } from '../features/dictionary/fullDictionary.ts'
import type { LoadChunk } from '../features/dictionary/dictionaryStore.ts'
import { createMemoryCache } from '../features/dictionary/runtime/dictionaryCache.ts'
import type { KeyValueStorage } from '../lib/storage.ts'
import { offlineFetch } from './fakeFetch.ts'
import { memoryStorage } from './memoryStorage.ts'

const EMPTY_CHUNK: DictionaryChunk = { characters: [], words: [] }

/** By default the full dictionary is empty: tests download nothing. */
const emptyChunks: LoadChunk = async () => EMPTY_CHUNK

interface Options {
  /** Initial router path. */
  path?: string
  /** Storage with already-saved data; empty by default. */
  storage?: KeyValueStorage
  /** Full dictionary chunks; empty by default. */
  loadChunk?: LoadChunk
  /** External source responses; offline by default. */
  fetchFn?: typeof fetch
}

/** Renders as in the app: with the router and the shared state (progress, settings). */
export function renderWithProviders(
  ui: ReactElement,
  { path = '/', storage = memoryStorage(), loadChunk = emptyChunks, fetchFn = offlineFetch }: Options = {},
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders storage={storage} loadChunk={loadChunk} cache={createMemoryCache()} fetchFn={fetchFn}>
        {ui}
      </AppProviders>
    </MemoryRouter>,
  )
}
