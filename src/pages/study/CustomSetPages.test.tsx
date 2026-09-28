import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '../../app/AppProviders.tsx'
import { AppRoutes } from '../../app/AppRoutes.tsx'
import { loadCustomSets } from '../../features/customSets/storage.ts'
import { hskDictionary } from '../../features/dictionary/hskDictionary.ts'
import { getStudyItem } from '../../features/dictionary/studyItem.ts'
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

type User = ReturnType<typeof userEvent.setup>

async function createSet(user: User, name: string) {
  await user.click(screen.getByRole('link', { name: 'Create custom set' }))
  await user.type(screen.getByLabelText('Name'), name)
  await user.click(screen.getByRole('button', { name: 'Create' }))
}

async function addWord(user: User, query: string, hanzi: string) {
  const search = screen.getByRole('searchbox', { name: 'Search' })
  await user.clear(search)
  await user.type(search, query)
  await user.click(screen.getByRole('button', { name: `Add ${hanzi} to this set` }))
}

function getVocabulary() {
  return screen.getByRole('region', { name: 'Vocabulary' })
}

describe('Sets propios', () => {
  it('crea un set y lo lleva a su página, donde se añade vocabulario del diccionario', async () => {
    const user = userEvent.setup()
    const storage = memoryStorage()
    renderAt('/study/custom', storage)
    expect(screen.getByText("You haven't created any sets yet.")).toBeInTheDocument()

    await createSet(user, 'My Chinese')
    expect(screen.getByRole('heading', { level: 1, name: 'My Chinese' })).toBeInTheDocument()
    expect(screen.getByText(/This set is empty/)).toBeInTheDocument()

    await addWord(user, 'apple', '苹果')
    await addWord(user, 'jichang', '机场')
    await addWord(user, '学习', '学习')

    expect(within(getVocabulary()).getAllByRole('listitem')).toHaveLength(3)
    const [saved] = loadCustomSets(storage)
    expect(saved).toMatchObject({ name: 'My Chinese', itemIds: ['word:苹果', 'word:机场', 'word:学习'] })
    // El set solo guarda ids: la palabra del diccionario sigue igual
    expect(getStudyItem(hskDictionary, 'word:苹果')?.entry.meanings.en[0]).toBe('apple')
  })

  it('no deja añadir dos veces el mismo elemento', async () => {
    const user = userEvent.setup()
    renderAt('/study/custom')
    await createSet(user, 'Mine')
    await addWord(user, 'apple', '苹果')

    const results = screen.getByRole('list', { name: 'Results' })
    expect(within(results).queryByRole('button', { name: 'Add 苹果 to this set' })).not.toBeInTheDocument()
    expect(within(results).getByText('In set')).toBeInTheDocument()
  })

  it('quita un elemento del set sin tocar el diccionario', async () => {
    const user = userEvent.setup()
    const storage = memoryStorage()
    renderAt('/study/custom', storage)
    await createSet(user, 'Mine')
    await addWord(user, 'apple', '苹果')

    await user.click(within(getVocabulary()).getByRole('button', { name: 'Remove 苹果 from this set' }))

    expect(loadCustomSets(storage)[0]?.itemIds).toEqual([])
    expect(getStudyItem(hskDictionary, 'word:苹果')).toBeDefined()
  })

  it('renombra el set y no acepta un nombre vacío', async () => {
    const user = userEvent.setup()
    renderAt('/study/custom')
    await createSet(user, 'Mine')

    await user.click(screen.getByRole('button', { name: 'Edit name and description' }))
    await user.clear(screen.getByLabelText('Name'))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Give the set a name.')

    await user.type(screen.getByLabelText('Name'), 'Travel to Beijing')
    await user.type(screen.getByLabelText('Description (optional)'), 'Words for my trip')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Travel to Beijing' })).toBeInTheDocument()
    expect(screen.getByText('Words for my trip')).toBeInTheDocument()
  })

  it('borra el set después de confirmar y vuelve a la lista', async () => {
    const user = userEvent.setup()
    const storage = memoryStorage()
    renderAt('/study/custom', storage)
    await createSet(user, 'Mine')

    await user.click(screen.getByRole('button', { name: 'Delete set' }))
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Yes, delete set' }))

    expect(screen.getByText("You haven't created any sets yet.")).toBeInTheDocument()
    expect(loadCustomSets(storage)).toEqual([])
  })
})
