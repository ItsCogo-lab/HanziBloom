import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '../../app/AppProviders.tsx'
import { AppRoutes } from '../../app/AppRoutes.tsx'
import { topicDefinitions } from '../../data/topics.ts'
import { loadMyStudies } from '../../features/myStudies/storage.ts'
import { createEmptyProgress, introduceItem, recordAnswer } from '../../features/progress/progress.ts'
import { saveProgress } from '../../features/progress/storage.ts'
import type { KeyValueStorage } from '../../lib/storage.ts'
import { memoryStorage } from '../../test/memoryStorage.ts'

function renderAt(path: string, storage: KeyValueStorage = memoryStorage()) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders storage={storage}>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  )
}

function getStudyTabs() {
  return screen.getByRole('navigation', { name: 'Study sections' })
}

describe('Study: sets HSK y por temas', () => {
  it('la pestaña HSK lista los niveles 1-4 con su tamaño', () => {
    renderAt('/study/hsk')

    for (const [level, words, characters] of [
      [1, 150, 178],
      [2, 149, 166],
      [3, 299, 272],
      [4, 598, 454],
    ]) {
      const card = screen.getByRole('heading', { name: `HSK ${level}` }).closest('article')!
      expect(within(card).getByText(`${words} words · ${characters} characters`)).toBeInTheDocument()
    }
  })

  it('la pestaña Topics lista todos los temas definidos', () => {
    renderAt('/study/topics')

    expect(screen.getAllByRole('article')).toHaveLength(topicDefinitions.length)
    expect(screen.getByRole('heading', { name: 'Food & drink' })).toBeInTheDocument()
  })

  it('añadir un set lo muestra en My Studies y quitarlo lo saca, sin perder progreso', async () => {
    const user = userEvent.setup()
    const storage = memoryStorage()
    renderAt('/study/hsk', storage)

    await user.click(screen.getByRole('button', { name: 'Add HSK 2 to My Studies' }))
    expect(screen.getByRole('button', { name: 'Remove HSK 2 from My Studies' })).toBeInTheDocument()
    expect(loadMyStudies(storage).sets.map((set) => set.setId)).toEqual(['hsk-2'])

    await user.click(within(getStudyTabs()).getByRole('link', { name: 'My Studies' }))
    expect(screen.getByRole('link', { name: 'HSK 2' })).toBeInTheDocument()
    // Sin nada aprendido solo se puede aprender: Study no aparece
    expect(screen.getByRole('link', { name: 'Learn HSK 2' })).toHaveAttribute('href', '/study/practice?set=hsk-2&mode=learn')
    expect(screen.queryByRole('link', { name: 'Study HSK 2' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove HSK 2 from My Studies' }))
    expect(screen.getByRole('heading', { name: 'No sets yet' })).toBeInTheDocument()
    expect(loadMyStudies(storage).sets).toEqual([])
  })

  it('un mismo elemento cuenta en todos los sets que lo contienen', () => {
    const storage = memoryStorage()
    // 苹果 está en HSK 1 y en Food & drink: dominarlo una vez cuenta en los dos
    let progress = createEmptyProgress()
    for (let day = 1; day <= 6; day++) {
      progress = recordAnswer(progress, 'word:苹果', true, new Date(2026, 0, day * 10))
    }
    saveProgress(progress, storage)

    renderAt('/study/sets/hsk-1', storage)
    expect(screen.getByText(/· 1 of 328 mastered$/)).toBeInTheDocument()
  })
})

describe('Página de un set', () => {
  it('muestra el progreso, el vocabulario enlazado al diccionario y el botón de empezar', () => {
    renderAt('/study/sets/topic-food')

    expect(screen.getByRole('heading', { level: 1, name: 'Food & drink' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Learn Food & drink' })).toHaveAttribute(
      'href',
      '/study/practice?set=topic-food&mode=learn',
    )
    const vocabulary = screen.getByRole('region', { name: 'Vocabulary' })
    expect(within(vocabulary).getByRole('link', { name: /苹果/ })).toHaveAttribute('href', `/vocabulary/${encodeURIComponent('苹果')}`)
    expect(screen.getByText(/· 0 of 51 mastered$/)).toBeInTheDocument()
  })

  it('las acciones Learn y Study cuentan con el progreso real', () => {
    const storage = memoryStorage()
    const now = new Date()
    let progress = createEmptyProgress()
    progress = introduceItem(progress, 'word:苹果', now) // aprendido: toca repasar hoy
    progress = recordAnswer(progress, 'word:米饭', true, now) // aprendido: al día
    saveProgress(progress, storage)
    renderAt('/study/sets/topic-food', storage)

    const learn = screen.getByRole('heading', { name: 'Learn' }).closest('section')!
    expect(within(learn).getByText('49 new items to learn')).toBeInTheDocument()
    const study = screen.getByRole('heading', { name: 'Study' }).closest('section')!
    expect(within(study).getByText('1 item ready to review')).toBeInTheDocument()
    expect(within(study).getByRole('link', { name: 'Study Food & drink' })).toHaveAttribute(
      'href',
      '/study/practice?set=topic-food&mode=study',
    )
  })

  it('sin nada aprendido, Study lo dice y ofrece empezar a aprender', () => {
    renderAt('/study/sets/topic-colors')

    const study = screen.getByRole('heading', { name: 'Study' }).closest('section')!
    expect(within(study).getByText("You haven't learned any words from this set yet.")).toBeInTheDocument()
    expect(within(study).getByRole('link', { name: 'Start learning' })).toHaveAttribute(
      'href',
      '/study/practice?set=topic-colors&mode=learn',
    )
  })

  it('con todo aprendido y al día, Learn está al día y Study ofrece repasar igualmente', () => {
    const storage = memoryStorage()
    const colors = topicDefinitions.find((topic) => topic.id === 'colors')!
    const progress = colors.words.reduce(
      (result, word) => recordAnswer(result, `word:${word}`, true, new Date()),
      createEmptyProgress(),
    )
    saveProgress(progress, storage)
    renderAt('/study/sets/topic-colors', storage)

    expect(screen.getByText("You're caught up. There are no new words to learn in this set.")).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Learn Colors' })).not.toBeInTheDocument()
    expect(screen.getByText('All learned items are currently up to date.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review learned vocabulary anyway' })).toHaveAttribute(
      'href',
      '/study/practice?set=topic-colors&mode=study&scope=all',
    )
  })

  it('un set que no existe muestra la página de no encontrado', () => {
    renderAt('/study/sets/topic-nope')
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
  })
})
