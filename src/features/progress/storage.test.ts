import { describe, expect, it } from 'vitest'
import { memoryStorage } from '../../test/memoryStorage.ts'
import { createEmptyProgress, recordAnswer } from './progress.ts'
import { loadProgress, saveProgress } from './storage.ts'

const now = new Date(2026, 8, 28, 10, 0)

describe('saveProgress / loadProgress', () => {
  it('guarda el progreso y lo recupera igual', () => {
    const storage = memoryStorage()
    const progress = recordAnswer(createEmptyProgress(), 'char:你', true, now)

    expect(saveProgress(progress, storage)).toBe(true)
    expect(loadProgress(storage)).toEqual(progress)
  })

  it('guarda la versión del formato', () => {
    const storage = memoryStorage()
    saveProgress(createEmptyProgress(), storage)

    expect(JSON.parse(storage.getItem('hanzivocab.progress')!)).toMatchObject({ version: 1 })
  })

  it('sin datos guardados empieza de cero', () => {
    expect(loadProgress(memoryStorage())).toEqual(createEmptyProgress())
  })

  it.each([
    ['JSON roto', '{oops'],
    ['otra versión', JSON.stringify({ version: 99, items: {}, activity: {} })],
    ['sin items', JSON.stringify({ version: 1, activity: {} })],
  ])('con datos no válidos (%s) empieza de cero', (_case, saved) => {
    expect(loadProgress(memoryStorage({ 'hanzivocab.progress': saved }))).toEqual(createEmptyProgress())
  })

  it('descarta solo las entradas que están mal', () => {
    const good = recordAnswer(createEmptyProgress(), 'char:你', true, now)
    const saved = {
      version: 1,
      items: { ...good.items, 'char:好': { itemId: 'char:好', timesSeen: 'many' } },
      activity: { ...good.activity, '2026-09-27': null },
    }

    expect(loadProgress(memoryStorage({ 'hanzivocab.progress': JSON.stringify(saved) }))).toEqual(good)
  })
})
