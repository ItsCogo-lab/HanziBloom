import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
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

  it('añade, edita y borra un significado propio sin cambiar el del diccionario', async () => {
    const user = userEvent.setup()
    const storage = memoryStorage()
    renderAt('/study/custom', storage)
    await createSet(user, 'Travel')
    await addWord(user, 'jichang', '机场')

    await user.click(within(getVocabulary()).getByRole('button', { name: 'Add my meaning' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Write a meaning, or cancel.')
    await user.type(screen.getByLabelText('My meaning for 机场'), 'airport when travelling')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(within(getVocabulary()).getByText('airport when travelling')).toBeInTheDocument()

    await user.click(within(getVocabulary()).getByRole('button', { name: 'Edit my meaning' }))
    await user.clear(screen.getByLabelText('My meaning for 机场'))
    await user.type(screen.getByLabelText('My meaning for 机场'), 'airport')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(loadCustomSets(storage)[0]?.meanings).toEqual({ 'word:机场': 'airport' })
    expect(getStudyItem(hskDictionary, 'word:机场')?.entry.meanings.en).not.toContain('airport when travelling')

    await user.click(within(getVocabulary()).getByRole('button', { name: 'Delete my meaning' }))
    expect(loadCustomSets(storage)[0]?.meanings).toEqual({})
  })

  it('desde el set, la ficha del diccionario es la de siempre y además muestra las notas del set', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })))
    renderAt('/study/custom')
    await createSet(user, 'Travel')
    await addWord(user, 'apple', '苹果')
    await user.click(within(getVocabulary()).getByRole('button', { name: 'Add my meaning' }))
    await user.type(screen.getByLabelText('My meaning for 苹果'), 'apple for the supermarket')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await user.click(within(getVocabulary()).getByRole('link', { name: 'Open 苹果 in the dictionary' }))

    // La ficha oficial sigue ahí, con el significado del diccionario
    const meanings = screen.getByRole('heading', { name: 'Meanings' }).parentElement!
    expect(within(meanings).getByText('apple')).toBeInTheDocument()
    // Y aparte, las notas del set
    expect(screen.getByRole('heading', { name: 'My notes in Travel' })).toBeInTheDocument()
    expect(screen.getByText('apple for the supermarket')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Travel' })).toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  it('añade, edita y borra una frase propia escribiendo solo el chino', async () => {
    const user = userEvent.setup()
    const storage = memoryStorage()
    renderAt('/study/custom', storage)
    await createSet(user, 'Travel')
    await addWord(user, 'jichang', '机场')

    await user.click(within(getVocabulary()).getByRole('button', { name: 'Add a sentence' }))
    await user.type(screen.getByLabelText('Sentence in Chinese'), 'hello')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('alert')).toHaveTextContent('The sentence needs at least one Chinese character.')

    await user.clear(screen.getByLabelText('Sentence in Chinese'))
    await user.type(screen.getByLabelText('Sentence in Chinese'), '我在机场等你。')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await within(getVocabulary()).findByRole('button', { name: 'Edit sentence 我在机场等你。' })).toBeInTheDocument()
    expect(loadCustomSets(storage)[0]?.sentences).toMatchObject([{ chinese: '我在机场等你。', itemId: 'word:机场' }])

    await user.click(within(getVocabulary()).getByRole('button', { name: 'Edit sentence 我在机场等你。' }))
    await user.clear(screen.getByLabelText('Sentence in Chinese'))
    await user.type(screen.getByLabelText('Sentence in Chinese'), '机场很大。')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await within(getVocabulary()).findByRole('button', { name: 'Delete sentence 机场很大。' })).toBeInTheDocument()

    await user.click(within(getVocabulary()).getByRole('button', { name: 'Delete sentence 机场很大。' }))
    expect(loadCustomSets(storage)[0]?.sentences).toEqual([])
  })

  it('genera el pinyin de la frase al guardarla y deja elegir la lectura de un carácter dudoso', async () => {
    const user = userEvent.setup()
    const storage = memoryStorage()
    renderAt('/study/custom', storage)
    await createSet(user, 'My Chinese')
    await addWord(user, '学习', '学习')

    await user.click(within(getVocabulary()).getByRole('button', { name: 'Add a sentence' }))
    await user.type(screen.getByLabelText('Sentence in Chinese'), '我每天学习中文。')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await within(getVocabulary()).findByText('wǒ měi tiān xué xí zhōng wén。')).toBeInTheDocument()
    const [sentence] = loadCustomSets(storage)[0]!.sentences
    expect(sentence?.tokens.map((token) => token.tone ?? '-').join('')).toBe('3312212-')

    await user.click(within(getVocabulary()).getByRole('button', { name: 'Add a sentence' }))
    await user.type(screen.getByLabelText('Sentence in Chinese'), '他长大了。')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await user.click(within(getVocabulary()).getByRole('button', { name: 'Add a sentence' }))
    await user.type(screen.getByLabelText('Sentence in Chinese'), '他长得很高。')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await user.selectOptions(await screen.findByLabelText('Pronunciation of 长'), 'zhǎng')
    const saved = loadCustomSets(storage)[0]!.sentences[2]!
    expect(saved.tokens[1]).toEqual({ text: '长', pinyin: 'zhǎng', tone: 3 })
    // El diccionario no cambia: 长 sigue teniendo sus dos lecturas
    expect(getStudyItem(hskDictionary, 'char:长')?.entry.pinyin).toEqual(['cháng', 'zhǎng'])
  })
})
