import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { topicDefinitions } from '../data/topics.ts'
import { loadMyStudies } from '../features/myStudies/storage.ts'
import { loadProgress } from '../features/progress/storage.ts'
import { DEFAULT_SETTINGS, saveSettings } from '../features/settings/settings.ts'
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
    saveSettings({ ...DEFAULT_SETTINGS, sessionSize: 5 }, storage)
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

describe('PracticePage con un set', () => {
  const colors = topicDefinitions.find((topic) => topic.id === 'colors')!

  it('solo pregunta elementos del set y lo marca como estudiado', async () => {
    const user = userEvent.setup()
    const storage = memoryStorage()
    renderWithProviders(<PracticePage />, { storage, path: '/study/practice?set=topic-colors' })

    expect(screen.getByRole('heading', { level: 1, name: 'Colors' })).toBeInTheDocument()
    await answerCurrentExercise(user)
    await answerCurrentExercise(user)
    await answerCurrentExercise(user)

    const answered = Object.keys(loadProgress(storage).items)
    expect(answered).toHaveLength(3)
    for (const itemId of answered) expect(colors.words.map((word) => `word:${word}`)).toContain(itemId)
    expect(Object.keys(loadMyStudies(storage).lastStudied)).toEqual(['topic-colors'])
  })

  it('un set que no existe muestra la página de no encontrado', () => {
    renderWithProviders(<PracticePage />, { path: '/study/practice?set=nope' })
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
  })
})
