import { act, cleanup, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { memoryStorage } from '../../test/memoryStorage.ts'
import { useProgress, type ProgressContextValue } from './progressContext.ts'
import { ProgressProvider } from './ProgressProvider.tsx'
import { loadProgress } from './storage.ts'

/** Renderiza el provider y devuelve una función para leer el contexto actual. */
function renderProvider(storage = memoryStorage()) {
  const latest: { value?: ProgressContextValue } = {}
  function Probe() {
    const context = useProgress()
    useEffect(() => {
      latest.value = context
    })
    return <p>{Object.keys(context.progress.items).join(',')}</p>
  }
  render(
    <ProgressProvider storage={storage}>
      <Probe />
    </ProgressProvider>,
  )
  return () => latest.value!
}

describe('ProgressProvider', () => {
  it('registra respuestas y las guarda en el almacenamiento', () => {
    const storage = memoryStorage()
    const getContext = renderProvider(storage)

    act(() => getContext().recordAnswer('char:你', true))

    expect(screen.getByText('char:你')).toBeInTheDocument()
    expect(loadProgress(storage).items['char:你']).toMatchObject({ timesSeen: 1, timesCorrect: 1 })
  })

  it('al arrancar carga el progreso guardado', () => {
    const storage = memoryStorage()
    const first = renderProvider(storage)
    act(() => first().recordAnswer('word:你好', false))
    cleanup()

    const getContext = renderProvider(storage)

    expect(getContext().progress.items['word:你好']).toMatchObject({ timesWrong: 1 })
  })

  it('«resetProgress» lo borra todo', () => {
    const storage = memoryStorage()
    const getContext = renderProvider(storage)
    act(() => getContext().recordAnswer('char:你', true))

    act(() => getContext().resetProgress())

    expect(getContext().progress).toEqual({ items: {}, activity: {} })
    expect(loadProgress(storage)).toEqual({ items: {}, activity: {} })
  })

  it('useProgress fuera del provider da un error claro', () => {
    function Orphan() {
      useProgress()
      return null
    }
    // React también escribe el error en la consola; lo silenciamos en este test
    const originalError = console.error
    console.error = () => {}
    expect(() => render(<Orphan />)).toThrow('useProgress debe usarse dentro de <ProgressProvider>')
    console.error = originalError
  })
})
