// Añade matchers como toBeInTheDocument() a expect()
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  // Desmonta los componentes renderizados entre tests
  cleanup()
  // Cada test empieza sin progreso guardado
  localStorage.clear()
})
