import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { AppProviders } from '../app/AppProviders.tsx'
import type { DictionaryChunk } from '../features/dictionary/fullDictionary.ts'
import type { LoadChunk } from '../features/dictionary/dictionaryStore.ts'
import type { KeyValueStorage } from '../lib/storage.ts'
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
}

/** Renderiza como en la app: con router y con el estado compartido (progreso, ajustes). */
export function renderWithProviders(
  ui: ReactElement,
  { path = '/', storage = memoryStorage(), loadChunk = emptyChunks }: Options = {},
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders storage={storage} loadChunk={loadChunk}>
        {ui}
      </AppProviders>
    </MemoryRouter>,
  )
}
