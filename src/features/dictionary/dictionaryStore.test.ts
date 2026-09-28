import { describe, expect, it } from 'vitest'
import { createChunkLoader, qieWord } from '../../test/dictionaryChunks.ts'
import { createDictionary } from './dictionary.ts'
import { createDictionaryStore } from './dictionaryStore.ts'
import { CHUNK_COUNT, getChunkIndex } from './fullDictionary.ts'
import { getStudyItem } from './studyItem.ts'
import { testCharacters, testWords } from './testData.ts'

const base = createDictionary(testCharacters, testWords)

describe('createDictionaryStore', () => {
  it('empieza con HSK y no pide nada para elementos de HSK', async () => {
    const load = createChunkLoader()
    const store = createDictionaryStore(base, load)

    await store.loadItems(['char:你', 'word:谢谢'])

    expect(load.requested).toEqual([])
    expect(store.hasItems(['char:你'])).toBe(true)
    expect(store.hasItems(['word:企鹅'])).toBe(false)
  })

  it('carga solo los trozos de la palabra y de sus caracteres, una vez', async () => {
    const load = createChunkLoader()
    const store = createDictionaryStore(base, load)
    const before = store.getSnapshot()

    await Promise.all([store.loadItems(['word:企鹅']), store.loadItems(['word:企鹅'])])

    expect(load.requested).toEqual([getChunkIndex('企'), getChunkIndex('鹅')])
    expect(store.getSnapshot()).not.toBe(before)
    expect(getStudyItem(store.getSnapshot(), 'word:企鹅')?.entry).toEqual(qieWord)
    expect(getStudyItem(store.getSnapshot(), 'char:鹅')?.entry.meanings.en).toEqual(['goose'])
    // El diccionario HSK no cambia
    expect(getStudyItem(base, 'word:企鹅')).toBeUndefined()
  })

  it('avisa a quien escucha cuando llega un trozo', async () => {
    const store = createDictionaryStore(base, createChunkLoader())
    let calls = 0
    const unsubscribe = store.subscribe(() => calls++)
    await store.loadItems(['word:企鹅'])
    unsubscribe()
    expect(calls).toBe(2)
  })

  it('carga todo para buscar: HSK primero y luego los trozos en orden', async () => {
    const load = createChunkLoader()
    const store = createDictionaryStore(base, load)
    expect(store.isComplete()).toBe(false)

    await store.loadAll()

    expect(store.isComplete()).toBe(true)
    expect(load.requested).toHaveLength(CHUNK_COUNT)
    const hanzi = store.getItems().map((item) => item.entry.hanzi)
    expect(hanzi.slice(0, store.baseItems.length)).toEqual(store.baseItems.map((item) => item.entry.hanzi))
    expect(hanzi.slice(store.baseItems.length)).toEqual(['企', '鹅', '企鹅'])
    expect(store.getItems()).toBe(store.getItems())
  })

  it('si un trozo falla, se puede volver a pedir', async () => {
    let fail = true
    const working = createChunkLoader()
    const store = createDictionaryStore(base, async (index) => {
      if (fail) throw new Error('offline')
      return working(index)
    })

    await expect(store.loadItems(['word:企鹅'])).rejects.toThrow('offline')
    fail = false
    await store.loadItems(['word:企鹅'])
    expect(store.hasItems(['word:企鹅'])).toBe(true)
  })
})
