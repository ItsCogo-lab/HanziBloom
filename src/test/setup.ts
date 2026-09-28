// Añade matchers como toBeInTheDocument() a expect()
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Desmonta los componentes renderizados entre tests
afterEach(() => {
  cleanup()
})
