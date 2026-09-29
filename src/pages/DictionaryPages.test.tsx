import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../app/AppRoutes.tsx'
import { allCharacters, allWords } from '../data/index.ts'
import { createEmptyProgress, recordAnswer } from '../features/progress/progress.ts'
import { saveProgress } from '../features/progress/storage.ts'
import { memoryStorage } from '../test/memoryStorage.ts'
import { renderWithProviders } from '../test/renderWithProviders.tsx'

describe('DictionaryPage', () => {
  it('sin búsqueda lista todo el diccionario por páginas', () => {
    renderWithProviders(<AppRoutes />, { path: '/dictionary' })

    expect(screen.getByText(`Showing 50 of ${allCharacters.length + allWords.length}`)).toBeInTheDocument()
  })

  it('busca por hanzi, pinyin o inglés y ordena primero lo exacto', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AppRoutes />, { path: '/dictionary' })

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), '果')
    const results = within(await screen.findByRole('list', { name: 'Results' })).getAllByRole('link')
    // Primero el carácter 果, luego las palabras que empiezan por él, luego las que lo contienen
    expect(results[0]).toHaveAttribute('href', '/characters/%E6%9E%9C')
    expect(results.map((link) => link.getAttribute('href'))).toContain('/vocabulary/%E8%8B%B9%E6%9E%9C') // 苹果

    await user.clear(screen.getByRole('searchbox', { name: 'Search' }))
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'xiexie')
    expect(await screen.findByRole('link', { name: /谢谢/ })).toHaveAttribute('href', '/vocabulary/%E8%B0%A2%E8%B0%A2')

    await user.clear(screen.getByRole('searchbox', { name: 'Search' }))
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'apple')
    await waitFor(() =>
      expect(within(screen.getByRole('list', { name: 'Results' })).getAllByRole('link')[0]).toHaveTextContent('苹果'),
    )
  })

  it('guarda la búsqueda en la dirección y filtra por tipo', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AppRoutes />, { path: '/dictionary?q=hao&kind=character' })

    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('hao')
    expect(screen.getByRole('radio', { name: 'Characters' })).toBeChecked()
    expect(within(screen.getByRole('list', { name: 'Results' })).getAllByRole('link').every((link) => link.textContent?.includes('Character'))).toBe(true)

    await user.click(screen.getByRole('radio', { name: 'Words' }))
    expect(within(screen.getByRole('list', { name: 'Results' })).getAllByRole('link').every((link) => link.textContent?.includes('Word'))).toBe(true)
  })

  it('avisa si no hay resultados', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AppRoutes />, { path: '/dictionary' })

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'zzzz')

    expect(await screen.findByText(/No matches/)).toBeInTheDocument()
  })

  it('muestra la leyenda de colores de los tonos', () => {
    renderWithProviders(<AppRoutes />, { path: '/dictionary' })

    expect(screen.getByRole('heading', { name: 'Tone colors' })).toBeInTheDocument()
  })

  it('las direcciones antiguas /vocabulary y /characters llevan al diccionario', () => {
    renderWithProviders(<AppRoutes />, { path: '/characters' })

    expect(screen.getByRole('heading', { level: 1, name: 'Dictionary' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Characters' })).toBeChecked()
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

  it('muestra en qué sets está el elemento (puede estar en varios)', () => {
    renderWithProviders(<AppRoutes />, { path: '/vocabulary/苹果' })

    const sets = screen.getByRole('heading', { name: 'In study sets' }).nextElementSibling as HTMLElement
    expect(within(sets).getByRole('link', { name: 'HSK 1' })).toHaveAttribute('href', '/study/sets/hsk-1')
    expect(within(sets).getByRole('link', { name: 'Food & drink' })).toHaveAttribute('href', '/study/sets/topic-food')
  })

  it('muestra el progreso del elemento', () => {
    const storage = memoryStorage()
    saveProgress(recordAnswer(createEmptyProgress(), 'char:好', false, new Date()), storage)
    renderWithProviders(<AppRoutes />, { path: '/characters/好', storage })

    expect(screen.getByText('Times seen').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Mistakes').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Next review').nextElementSibling).toHaveTextContent('Now')
  })

  it('una entrada que no existe muestra «Page not found» después de buscarla en el diccionario completo', async () => {
    renderWithProviders(<AppRoutes />, { path: '/characters/不存在' })

    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
  })
})
