import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { hskStudyItems } from '../features/dictionary/hskDictionary.ts'
import { createEmptyProgress, recordAnswer } from '../features/progress/progress.ts'
import { saveProgress } from '../features/progress/storage.ts'
import type { ProgressData } from '../features/progress/types.ts'
import { memoryStorage } from '../test/memoryStorage.ts'
import { renderWithProviders } from '../test/renderWithProviders.tsx'
import { DashboardPage } from './DashboardPage.tsx'

function renderDashboard(progress: ProgressData = createEmptyProgress()) {
  const storage = memoryStorage()
  saveProgress(progress, storage)
  renderWithProviders(<DashboardPage />, { storage })
}

/** Valor de una cifra del resumen, buscándola por su etiqueta. */
function getStat(label: string) {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling?.textContent
}

describe('DashboardPage', () => {
  it('a un usuario nuevo le da la bienvenida y todo a cero', () => {
    renderDashboard()

    expect(screen.getByText(/Start your first session/)).toBeInTheDocument()
    expect(getStat('Due for review')).toBe('0')
    expect(getStat('Day streak')).toBe('0')
    expect(getStat('Studied')).toBe(`0 of ${hskStudyItems.length}`)
    expect(screen.getByRole('link', { name: 'Start session' })).toHaveAttribute('href', '/practice')
  })

  it('muestra los repasos pendientes, lo estudiado y la racha', () => {
    const now = new Date()
    let progress = recordAnswer(createEmptyProgress(), 'char:你', false, now) // pendiente hoy
    progress = recordAnswer(progress, 'word:谢谢', true, now) // pendiente mañana

    renderDashboard(progress)

    expect(screen.getByText(/ready for review/)).toBeInTheDocument()
    expect(getStat('Due for review')).toBe('1')
    expect(getStat('Studied')).toMatch(/^2 of/)
    expect(getStat('Day streak')).toBe('1')
    expect(screen.getByRole('progressbar', { name: /^Characters: 1 of \d+ studied/ })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: /^Words: 1 of 150 studied/ })).toBeInTheDocument()
  })

  it('sin repasos pendientes propone aprender elementos nuevos', () => {
    renderDashboard(recordAnswer(createEmptyProgress(), 'char:你', true, new Date()))

    expect(screen.getByText(/teach you new items/)).toBeInTheDocument()
  })
})
