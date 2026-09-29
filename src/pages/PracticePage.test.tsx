import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { topicDefinitions } from '../data/topics.ts'
import { loadMyStudies } from '../features/myStudies/storage.ts'
import { createEmptyProgress, introduceItem, recordAnswer } from '../features/progress/progress.ts'
import { loadProgress, saveProgress } from '../features/progress/storage.ts'
import type { ProgressData } from '../features/progress/types.ts'
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

describe('PracticePage: Learn y Study de un set', () => {
  const colorIds = topicDefinitions.find((topic) => topic.id === 'colors')!.words.map((word) => `word:${word}` as const)
  const now = new Date()

  beforeEach(() => {
    // Las fichas piden trazos y frases al abrirse; aquí no hay servidor
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function renderSession(query: string, progress: ProgressData = createEmptyProgress()) {
    const storage = memoryStorage()
    saveProgress(progress, storage)
    renderWithProviders(<PracticePage />, { storage, path: `/study/practice?set=topic-colors&${query}` })
    return storage
  }

  /** El hanzi grande de la ficha que presenta Learn. */
  function currentLearnHanzi() {
    return document.querySelector('.text-7xl')?.textContent
  }

  it('Learn presenta solo elementos sin aprender del set y guarda los que se confirman', async () => {
    const user = userEvent.setup()
    const alreadyLearned = introduceItem(createEmptyProgress(), colorIds[0]!, now)
    const storage = renderSession('mode=learn', alreadyLearned)

    expect(screen.getByText('Learn new vocabulary')).toBeInTheDocument()
    expect(screen.getByText('Item 1 of 6')).toBeInTheDocument()
    const shown: string[] = []
    for (const action of ["I've learned it", 'Skip for now', "I've learned it"]) {
      shown.push(currentLearnHanzi()!)
      await user.click(screen.getByRole('button', { name: action }))
    }

    expect(shown).not.toContain(colorIds[0]!.slice('word:'.length))
    const progress = loadProgress(storage)
    expect(Object.keys(progress.items).toSorted()).toEqual(
      [colorIds[0], `word:${shown[0]}`, `word:${shown[2]}`].toSorted(),
    )
    // Aprender no es responder: no suma a la actividad ni a la racha
    expect(progress.activity).toEqual({})
    expect(Object.keys(loadMyStudies(storage).lastStudied)).toEqual(['topic-colors'])
  })

  it('Learn sin nada nuevo lo dice y no cambia a Study por su cuenta', () => {
    renderSession('mode=learn', colorIds.reduce((result, itemId) => introduceItem(result, itemId, now), createEmptyProgress()))

    expect(screen.getByText("You're caught up. There are no new words to learn in this set.")).toBeInTheDocument()
    expect(screen.queryByText(/^Item 1/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Study' })).toHaveAttribute('href', '/study/practice?set=topic-colors&mode=study')
  })

  it('Study solo pregunta elementos aprendidos, nunca uno nuevo', async () => {
    const user = userEvent.setup()
    const learned = colorIds.slice(0, 3)
    const storage = renderSession('mode=study', learned.reduce((result, itemId) => introduceItem(result, itemId, now), createEmptyProgress()))

    expect(screen.getByText("Review vocabulary you've already learned")).toBeInTheDocument()
    expect(screen.getByText('Card 1 of 3')).toBeInTheDocument()
    for (let i = 0; i < 3; i++) await answerCurrentExercise(user)

    expect(screen.getByRole('heading', { name: 'Session complete' })).toBeInTheDocument()
    expect(Object.keys(loadProgress(storage).items).toSorted()).toEqual(learned.toSorted())
  })

  it('Study sin nada aprendido lo dice y ofrece empezar a aprender', () => {
    renderSession('mode=study')

    expect(screen.getByText("You haven't learned any words from this set yet.")).toBeInTheDocument()
    expect(screen.queryByText(/^Card 1/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start learning' })).toHaveAttribute(
      'href',
      '/study/practice?set=topic-colors&mode=learn',
    )
  })

  it('Study con todo al día ofrece repasar igualmente, y ese repaso solo usa lo aprendido', () => {
    const upToDate = recordAnswer(createEmptyProgress(), colorIds[0]!, true, now) // toca mañana
    renderSession('mode=study', upToDate)

    expect(screen.getByText('All learned items are currently up to date.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review learned vocabulary anyway' })).toHaveAttribute(
      'href',
      '/study/practice?set=topic-colors&mode=study&scope=all',
    )
  })

  it('«Review anyway» repasa lo aprendido aunque no toque', () => {
    renderSession('mode=study&scope=all', recordAnswer(createEmptyProgress(), colorIds[0]!, true, now))

    expect(screen.getByText('Card 1 of 1')).toBeInTheDocument()
  })

  /** Abre el diccionario, busca y cierra: devuelve el texto de la página antes y después. */
  async function openAndCloseDictionary(user: ReturnType<typeof userEvent.setup>) {
    const before = document.body.textContent
    await user.click(screen.getByRole('button', { name: 'Dictionary' }))
    const panel = screen.getByRole('dialog', { name: 'Dictionary' })
    await user.type(within(panel).getByRole('searchbox', { name: 'Search' }), 'red')
    expect(await within(panel).findByRole('list', { name: 'Results' })).toBeInTheDocument()
    await user.click(within(panel).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    return { before, after: document.body.textContent }
  }

  it('en Learn el diccionario funciona y al cerrarlo sigue el mismo elemento y el mismo tipo de sesión', async () => {
    const user = userEvent.setup()
    renderSession('mode=learn')
    await user.click(screen.getByRole('button', { name: "I've learned it" }))
    const hanzi = currentLearnHanzi()

    const { before, after } = await openAndCloseDictionary(user)

    expect(after).toBe(before)
    expect(screen.getByText('Learn new vocabulary')).toBeInTheDocument()
    expect(screen.getByText('Item 2 of 7')).toBeInTheDocument()
    expect(currentLearnHanzi()).toBe(hanzi)
  })

  it('en Study el diccionario funciona y al cerrarlo sigue la misma tarjeta y el mismo tipo de sesión', async () => {
    const user = userEvent.setup()
    renderSession('mode=study', colorIds.reduce((result, itemId) => introduceItem(result, itemId, now), createEmptyProgress()))
    await answerCurrentExercise(user)

    const { before, after } = await openAndCloseDictionary(user)

    expect(after).toBe(before)
    expect(screen.getByText("Review vocabulary you've already learned")).toBeInTheDocument()
    expect(screen.getByText('Card 2 of 7')).toBeInTheDocument()
  })
})
