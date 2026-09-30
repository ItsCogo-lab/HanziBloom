import { describe, expect, it } from 'vitest'
import { memoryStorage } from '../../test/memoryStorage.ts'
import { createEmptyProgress, recordAnswer } from './progress.ts'
import { loadProgress, saveProgress } from './storage.ts'

const now = new Date(2026, 8, 28, 10, 0)

describe('saveProgress / loadProgress', () => {
  it('saves progress and loads it back unchanged', () => {
    const storage = memoryStorage()
    const progress = recordAnswer(createEmptyProgress(), 'char:你', true, now)

    expect(saveProgress(progress, storage)).toBe(true)
    expect(loadProgress(storage)).toEqual(progress)
  })

  it('saves the format version', () => {
    const storage = memoryStorage()
    saveProgress(createEmptyProgress(), storage)

    expect(JSON.parse(storage.getItem('hanzivocab.progress')!)).toMatchObject({ version: 1 })
  })

  it('starts from scratch with no saved data', () => {
    expect(loadProgress(memoryStorage())).toEqual(createEmptyProgress())
  })

  it.each([
    ['broken JSON', '{oops'],
    ['another version', JSON.stringify({ version: 99, items: {}, activity: {} })],
    ['no items', JSON.stringify({ version: 1, activity: {} })],
  ])('starts from scratch with invalid data (%s)', (_case, saved) => {
    expect(loadProgress(memoryStorage({ 'hanzivocab.progress': saved }))).toEqual(createEmptyProgress())
  })

  it('discards only the bad entries', () => {
    const good = recordAnswer(createEmptyProgress(), 'char:你', true, now)
    const saved = {
      version: 1,
      items: { ...good.items, 'char:好': { itemId: 'char:好', timesSeen: 'many' } },
      activity: { ...good.activity, '2026-09-27': null },
    }

    expect(loadProgress(memoryStorage({ 'hanzivocab.progress': JSON.stringify(saved) }))).toEqual(good)
  })
})
