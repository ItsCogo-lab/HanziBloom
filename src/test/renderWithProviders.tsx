import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { AppProviders } from '../app/AppProviders.tsx'
import type { KeyValueStorage } from '../lib/storage.ts'
import { memoryStorage } from './memoryStorage.ts'

interface Options {
  /** Ruta inicial del router. */
  path?: string
  /** Almacenamiento con datos ya guardados; por defecto, vacío. */
  storage?: KeyValueStorage
}

/** Renderiza como en la app: con router y con el estado compartido (progreso, ajustes). */
export function renderWithProviders(ui: ReactElement, { path = '/', storage = memoryStorage() }: Options = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders storage={storage}>{ui}</AppProviders>
    </MemoryRouter>,
  )
}
