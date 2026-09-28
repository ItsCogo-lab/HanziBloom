import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../app/AppProviders.tsx'
import { AppRoutes } from '../app/AppRoutes.tsx'
import { addItem, createCustomSet, setMeaning } from '../features/customSets/customSets.ts'
import { annotateSentence } from '../features/customSets/pinyinEngine.ts'
import { getDatasetReadings } from '../features/customSets/sentenceProcessing.ts'
import { addSentence, createSentence } from '../features/customSets/sentences.ts'
import { saveCustomSets } from '../features/customSets/storage.ts'
import { hskDictionary } from '../features/dictionary/hskDictionary.ts'
import { getStudyItem } from '../features/dictionary/studyItem.ts'
import { loadProgress } from '../features/progress/storage.ts'
import type { KeyValueStorage } from '../lib/storage.ts'
import { memoryStorage } from '../test/memoryStorage.ts'

const now = new Date(2026, 8, 28)
const ITEM_IDS = ['word:苹果', 'word:机场', 'word:学习'] as const

/** El set de la verificación final: «My Chinese» con 苹果, 机场 y 学习, un significado y una frase. */
function savedMyChinese(): KeyValueStorage {
  let set = createCustomSet({ name: 'My Chinese', description: '' }, 'custom-mine', now)
  for (const itemId of ITEM_IDS) set = addItem(set, itemId)
  set = setMeaning(set, 'word:机场', 'airport when travelling')
  const chinese = '我每天学习中文。'
  set = addSentence(
    set,
    createSentence({ chinese, tokens: annotateSentence(chinese, getDatasetReadings), itemId: 'word:学习' }, 'sentence-1', now),
  )
  const storage = memoryStorage()
  saveCustomSets([set], storage)
  return storage
}

function renderAt(path: string, storage: KeyValueStorage) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders storage={storage}>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  )
}

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

describe('Learn y Study con un set propio', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('la página del set ofrece Learn con sus 3 elementos y Study vacío', () => {
    renderAt('/study/sets/custom-mine', savedMyChinese())

    expect(screen.getByRole('heading', { level: 1, name: 'My Chinese' })).toBeInTheDocument()
    expect(screen.getByText('3 new items to learn')).toBeInTheDocument()
    expect(screen.getByText("You haven't learned any words from this set yet.")).toBeInTheDocument()
  })

  it('se aprende, se repasa y se repasa igualmente, siempre con los elementos del set', async () => {
    const user = userEvent.setup()
    const storage = savedMyChinese()
    renderAt('/study/practice?set=custom-mine&mode=learn', storage)

    const shown: string[] = []
    for (let i = 1; i <= 3; i++) {
      expect(screen.getByText(`Item ${i} of 3`)).toBeInTheDocument()
      shown.push(document.querySelector('.text-7xl')!.textContent!)
      // Las notas del usuario acompañan a la ficha oficial
      if (shown.at(-1) === '学习') {
        expect(screen.getByRole('heading', { name: 'My notes in My Chinese' })).toBeInTheDocument()
        expect(screen.getByText('wǒ měi tiān xué xí zhōng wén。')).toBeInTheDocument()
      }
      await user.click(screen.getByRole('button', { name: "I've learned it" }))
    }
    expect(shown.toSorted()).toEqual(['学习', '机场', '苹果'].toSorted())
    expect(Object.keys(loadProgress(storage).items).toSorted()).toEqual([...ITEM_IDS].toSorted())

    // Study: lo aprendido toca repasarlo hoy
    await user.click(screen.getByRole('link', { name: 'Review them now' }))
    expect(screen.getByText('Card 1 of 3')).toBeInTheDocument()
    for (let i = 0; i < 3; i++) await answerCurrentExercise(user)
    expect(screen.getByRole('heading', { name: 'Session complete' })).toBeInTheDocument()
    expect(Object.keys(loadProgress(storage).items)).toHaveLength(3)
  })

  it('el diccionario funciona dentro de la sesión del set propio', async () => {
    const user = userEvent.setup()
    renderAt('/study/practice?set=custom-mine&mode=learn', savedMyChinese())

    await user.click(screen.getByRole('button', { name: 'Dictionary' }))
    const panel = screen.getByRole('dialog', { name: 'Dictionary' })
    await user.type(within(panel).getByRole('searchbox', { name: 'Search' }), 'airport')
    expect(within(panel).getByRole('list', { name: 'Results' })).toHaveTextContent('机场')
    await user.click(within(panel).getByRole('button', { name: 'Close' }))

    expect(screen.getByText('Item 1 of 3')).toBeInTheDocument()
  })

  it('la ficha del diccionario lista el set propio y su contenido oficial no cambia', () => {
    renderAt(`/vocabulary/${encodeURIComponent('机场')}`, savedMyChinese())

    const inSets = screen.getByRole('heading', { name: 'In study sets' }).parentElement!
    expect(within(inSets).getByRole('link', { name: 'My Chinese' })).toBeInTheDocument()
    // Sin ?set=, la ficha es la del diccionario sin notas del usuario
    expect(screen.queryByText('airport when travelling')).not.toBeInTheDocument()
    expect(getStudyItem(hskDictionary, 'word:机场')?.entry.meanings.en).not.toContain('airport when travelling')
  })
})
