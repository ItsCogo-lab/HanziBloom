import { describe, expect, it } from 'vitest'
import { createChunkLoader, qieWord } from '../../test/dictionaryChunks.ts'
import { createDictionary } from './dictionary.ts'
import { createDictionaryStore } from './dictionaryStore.ts'
import { CHUNK_COUNT, getChunkIndex } from './fullDictionary.ts'
import { getStudyItem } from './studyItem.ts'
import { testCharacters, testWords } from './testData.ts'

const base = createDictionary(testCharacters, testWords)

describe('createDictionaryStore', () => {
  it('starts with HSK and requests nothing for HSK items', async () => {
    const load = createChunkLoader()
    const store = createDictionaryStore(base, load)

    await store.loadItems(['char:你', 'word:谢谢'])

    expect(load.requested).toEqual([])
    expect(store.hasItems(['char:你'])).toBe(true)
    expect(store.hasItems(['word:企鹅'])).toBe(false)
  })

  it('loads only the chunks of the word and its characters, once', async () => {
    const load = createChunkLoader()
    const store = createDictionaryStore(base, load)
    const before = store.getSnapshot()

    await Promise.all([store.loadItems(['word:企鹅']), store.loadItems(['word:企鹅'])])

    expect(load.requested).toEqual([getChunkIndex('企'), getChunkIndex('鹅')])
    expect(store.getSnapshot()).not.toBe(before)
    expect(getStudyItem(store.getSnapshot(), 'word:企鹅')?.entry).toEqual(qieWord)
    expect(getStudyItem(store.getSnapshot(), 'char:鹅')?.entry.meanings.en).toEqual(['goose'])
    // The HSK dictionary does not change
    expect(getStudyItem(base, 'word:企鹅')).toBeUndefined()
  })

  it('notifies listeners when a chunk arrives', async () => {
    const store = createDictionaryStore(base, createChunkLoader())
    let calls = 0
    const unsubscribe = store.subscribe(() => calls++)
    await store.loadItems(['word:企鹅'])
    unsubscribe()
    expect(calls).toBe(2)
  })

  it('loads everything for search: HSK first, then the chunks in order', async () => {
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

  it('if a chunk fails, it can be requested again', async () => {
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
