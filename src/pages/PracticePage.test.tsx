import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { loadProgress } from '../features/progress/storage.ts'
import { saveSettings } from '../features/settings/settings.ts'
import { memoryStorage } from '../test/memoryStorage.ts'
import { renderWithProviders } from '../test/renderWithProviders.tsx'
import { PracticePage } from './PracticePage.tsx'

/** Responde el ejercicio actual, sea del tipo que sea (el tipo es aleatorio). */
async function answerCurrentExercise(user: ReturnType<typeof userEvent.setup>) {
  const showAnswer = screen.queryByRole('button', { name: 'Show answer' })
  if (showAnswer) {
    await user.click(showAnswer)
    await user.click(screen.getByRole('button', { name: 'I knew it' }))
    return
  }
  const [firstOption] = within(screen.getByRole('list', { name: 'Options' })).getAllByRole('button')
  await user.click(firstOption!)
  await user.click(screen.getByRole('button', { name: 'Continue' }))
}

describe('PracticePage', () => {
  it('usa el tamaño de sesión de los ajustes', () => {
    const storage = memoryStorage()
    saveSettings({ sessionSize: 5 }, storage)
    renderWithProviders(<PracticePage />, { storage })

    expect(screen.getByText('Card 1 of 5')).toBeInTheDocument()
  })

  it('guarda cada respuesta en el progreso', async () => {
    const user = userEvent.setup()
    const storage = memoryStorage()
    renderWithProviders(<PracticePage />, { storage })

    await answerCurrentExercise(user)
    await answerCurrentExercise(user)

    expect(screen.getByText('Card 3 of 10')).toBeInTheDocument()
    expect(Object.keys(loadProgress(storage).items)).toHaveLength(2)
  })
})
