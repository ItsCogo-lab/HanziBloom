import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { addSet, createEmptyMyStudies, markSetStudied } from '../features/myStudies/myStudies.ts'
import { saveMyStudies } from '../features/myStudies/storage.ts'
import { createEmptyProgress, recordAnswer } from '../features/progress/progress.ts'
import { getItemStatus } from '../features/progress/progress.ts'
import { loadProgress, saveProgress } from '../features/progress/storage.ts'
import { loadSettings } from '../features/settings/settings.ts'
import { memoryStorage } from '../test/memoryStorage.ts'
import { renderWithProviders } from '../test/renderWithProviders.tsx'
import { ProfilePage } from './ProfilePage.tsx'

describe('ProfilePage', () => {
  it('sin datos invita a elegir un set', () => {
    renderWithProviders(<ProfilePage />)

    expect(screen.getByRole('link', { name: 'Browse HSK levels' })).toBeInTheDocument()
    expect(screen.getByText('No study sessions with a set yet.')).toBeInTheDocument()
  })

  it('resume el progreso guardado, los sets que se estudian y los recientes', () => {
    const storage = memoryStorage()
    const now = new Date()
    let progress = createEmptyProgress()
    progress = recordAnswer(progress, 'char:你', true, now)
    progress = recordAnswer(progress, 'word:你好', false, now)
    saveProgress(progress, storage)
    let myStudies = addSet(createEmptyMyStudies(), 'hsk-1', now)
    myStudies = addSet(myStudies, 'topic-food', now)
    myStudies = markSetStudied(myStudies, 'topic-food', now)
    saveMyStudies(myStudies, storage)

    renderWithProviders(<ProfilePage />, { storage })

    const reviews = screen.getByText('Reviews completed').closest('div')!
    expect(within(reviews).getByText('2')).toBeInTheDocument()
    const studying = screen.getByRole('heading', { name: 'Sets you are studying' }).parentElement!.parentElement!
    expect(within(studying).getByRole('link', { name: 'HSK 1' })).toBeInTheDocument()
    expect(within(studying).getByRole('link', { name: 'Food & drink' })).toBeInTheDocument()
    const recent = screen.getByRole('heading', { name: 'Recently studied' }).parentElement!
    expect(within(recent).getAllByRole('link').map((link) => link.textContent)).toEqual(['Food & drink'])
  })

  it('guardar el nivel HSK marca ese vocabulario como dominado y lo de dos niveles menos como básico', async () => {
    const user = userEvent.setup()
    const storage = memoryStorage()
    renderWithProviders(<ProfilePage />, { storage })

    await user.selectOptions(screen.getByLabelText('Level'), 'HSK 3')
    await user.click(screen.getByRole('button', { name: 'Save level' }))

    expect(screen.getByRole('status')).toHaveTextContent('HSK 3 and below are marked as mastered.')
    expect(loadSettings(storage).hskLevel).toBe(3)
    const progress = loadProgress(storage)
    expect(progress.items['word:认识']?.basic).toBe(true)
    expect(getItemStatus(progress.items['word:经常'])).toBe('mastered')
    expect(progress.items['word:安排']).toBeUndefined()
    expect(screen.getByRole('button', { name: 'Save level' })).toBeDisabled()
  })
})
