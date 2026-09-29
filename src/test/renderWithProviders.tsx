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

/** Por defecto, el diccionario completo está vacío: los tests no descargan nada. */
const emptyChunks: LoadChunk = async () => EMPTY_CHUNK

interface Options {
  /** Ruta inicial del router. */
  path?: string
  /** Almacenamiento con datos ya guardados; por defecto, vacío. */
  storage?: KeyValueStorage
  /** Trozos del diccionario completo; por defecto, vacíos. */
  loadChunk?: LoadChunk
  /** Respuestas de las fuentes externas; por defecto, sin conexión. */
  fetchFn?: typeof fetch
}

/** Renderiza como en la app: con router y con el estado compartido (progreso, ajustes). */
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
