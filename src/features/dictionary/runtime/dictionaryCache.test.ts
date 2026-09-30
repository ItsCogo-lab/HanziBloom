import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { createIndexedDbCache, createMemoryCache } from './dictionaryCache.ts'

const entry = {
  key: 'strokes:柠',
  data: { strokes: ['M 0 0'] },
  fetchedAt: 1000,
  source: 'test@1',
}

describe('dictionary cache', () => {
  it('in memory stores and returns entries', async () => {
    const cache = createMemoryCache()
    expect(await cache.get('strokes:柠')).toBeUndefined()
    await cache.set(entry)
    expect(await cache.get('strokes:柠')).toEqual(entry)
  })

  it('in IndexedDB stores entries that survive reopening the database', async () => {
    const factory = new IDBFactory()
    await createIndexedDbCache(factory).set(entry)
    expect(await createIndexedDbCache(factory).get('strokes:柠')).toEqual(entry)
    expect(await createIndexedDbCache(factory).get('strokes:柚')).toBeUndefined()
  })

  it('if IndexedDB fails, behaves as if nothing were stored', async () => {
    const broken = {
      open: () => {
        throw new Error('blocked')
      },
    } as unknown as IDBFactory
    const cache = createIndexedDbCache(broken)
    await expect(cache.set(entry)).resolves.toBeUndefined()
    await expect(cache.get('strokes:柠')).resolves.toBeUndefined()
  })
})
