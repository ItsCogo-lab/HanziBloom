// Añade matchers como toBeInTheDocument() a expect()
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { offlineFetch } from './fakeFetch.ts'

beforeEach(() => {
  // Los tests nunca salen a internet: sin un fetch falso, todo está «sin conexión»
  vi.stubGlobal('fetch', offlineFetch)
})

afterEach(() => {
  // Desmonta los componentes renderizados entre tests
  cleanup()
  // Cada test empieza sin progreso guardado
  localStorage.clear()
  vi.unstubAllGlobals()
})
