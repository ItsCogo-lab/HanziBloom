import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../app/AppRoutes.tsx'
import { createEmptyProgress, recordAnswer } from '../features/progress/progress.ts'
import { saveProgress } from '../features/progress/storage.ts'
import { memoryStorage } from '../test/memoryStorage.ts'
import { renderWithProviders } from '../test/renderWithProviders.tsx'

describe('VocabularyPage y CharactersPage', () => {
  it('listan todas las entradas y filtran al buscar', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AppRoutes />, { path: '/vocabulary' })

    expect(screen.getByText('Showing 150 of 150')).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'xiexie')

    expect(screen.getByText('Showing 1 of 150')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /谢谢/ })).toHaveAttribute('href', '/vocabulary/%E8%B0%A2%E8%B0%A2')
  })

  it('avisan si no hay resultados', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AppRoutes />, { path: '/characters' })

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'zzzz')

    expect(screen.getByText(/No matches/)).toBeInTheDocument()
  })

  it('muestran el estado de estudio de cada entrada', () => {
    const storage = memoryStorage()
    saveProgress(recordAnswer(createEmptyProgress(), 'char:你', true, new Date()), storage)
    renderWithProviders(<AppRoutes />, { path: '/characters', storage })

    expect(screen.getByRole('link', { name: /你.*Learning/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /好.*New/ })).toBeInTheDocument()
  })
})

describe('EntryDetailPage', () => {
  it('muestra la ficha de una palabra con sus caracteres', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AppRoutes />, { path: '/vocabulary/谢谢' })

    expect(screen.getByRole('heading', { level: 1, name: '谢谢' })).toHaveAttribute('lang', 'zh-Hans')
    expect(screen.getByText('xiè xie')).toBeInTheDocument()
    expect(screen.getByText(/Not studied yet/)).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /谢/ }))

    expect(screen.getByRole('heading', { level: 1, name: '谢' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Appears in' })).toBeInTheDocument()
  })

  it('muestra el progreso del elemento', () => {
    const storage = memoryStorage()
    saveProgress(recordAnswer(createEmptyProgress(), 'char:好', false, new Date()), storage)
    renderWithProviders(<AppRoutes />, { path: '/characters/好', storage })

    expect(screen.getByText('Times seen').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Mistakes').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Next review').nextElementSibling).toHaveTextContent('Now')
  })

  it('una entrada que no existe muestra «Page not found»', () => {
    renderWithProviders(<AppRoutes />, { path: '/characters/不存在' })

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
  })
})
