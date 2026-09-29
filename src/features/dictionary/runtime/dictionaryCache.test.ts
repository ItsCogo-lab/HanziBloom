import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { createIndexedDbCache, createMemoryCache } from './dictionaryCache.ts'

const entry = {
  key: 'strokes:柠',
  data: { strokes: ['M 0 0'] },
  fetchedAt: 1000,
  source: 'test@1',
}

describe('caché del diccionario', () => {
  it('en memoria guarda y devuelve entradas', async () => {
    const cache = createMemoryCache()
    expect(await cache.get('strokes:柠')).toBeUndefined()
    await cache.set(entry)
    expect(await cache.get('strokes:柠')).toEqual(entry)
  })

  it('en IndexedDB guarda entradas que sobreviven a abrir la base de datos de nuevo', async () => {
    const factory = new IDBFactory()
    await createIndexedDbCache(factory).set(entry)
    expect(await createIndexedDbCache(factory).get('strokes:柠')).toEqual(entry)
    expect(await createIndexedDbCache(factory).get('strokes:柚')).toBeUndefined()
  })

  it('si IndexedDB falla, se comporta como si no hubiera nada guardado', async () => {
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
