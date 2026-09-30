import { describe, expect, it } from 'vitest'
import type { CustomSet } from '../customSets/types.ts'
import type { ItemProgress } from '../progress/types.ts'
import { mergeCustomSets, mergeMyStudies, mergeProgress } from './merge.ts'

function item(itemId: ItemProgress['itemId'], lastReviewedAt: string, timesSeen = 1): ItemProgress {
  return {
    itemId,
    timesSeen,
    timesCorrect: timesSeen,
    timesWrong: 0,
    masteryLevel: 1,
    lastReviewedAt,
    nextReviewAt: lastReviewedAt,
  }
}

function customSet(id: string, updatedAt: string, name = id): CustomSet {
  return { id, name, description: '', itemIds: [], meanings: {}, sentences: [], createdAt: updatedAt, updatedAt }
}

describe('mergeProgress', () => {
  it('conserva los elementos que solo están en un lado', () => {
    const merged = mergeProgress(
      { items: { 'char:你': item('char:你', '2026-09-28T10:00:00.000Z') }, activity: {} },
      { items: { 'char:好': item('char:好', '2026-09-27T10:00:00.000Z') }, activity: {} },
    )
    expect(Object.keys(merged.items).toSorted()).toEqual(['char:你', 'char:好'])
  })

  it('de un elemento en los dos lados se queda el repasado más tarde', () => {
    const older = item('char:你', '2026-09-28T10:00:00.000Z', 5)
    const newer = item('char:你', '2026-09-29T10:00:00.000Z', 2)
    expect(mergeProgress({ items: { 'char:你': older }, activity: {} }, { items: { 'char:你': newer }, activity: {} }).items['char:你']).toBe(newer)
    expect(mergeProgress({ items: { 'char:你': newer }, activity: {} }, { items: { 'char:你': older }, activity: {} }).items['char:你']).toBe(newer)
  })

  it('si se repasaron a la vez, gana el visto más veces', () => {
    const date = '2026-09-28T10:00:00.000Z'
    const more = item('char:你', date, 4)
    expect(mergeProgress({ items: { 'char:你': item('char:你', date, 1) }, activity: {} }, { items: { 'char:你': more }, activity: {} }).items['char:你']).toBe(more)
  })

  it('de cada día se queda el registro con más respuestas, sin sumarlos', () => {
    const merged = mergeProgress(
      { items: {}, activity: { '2026-09-28': { answers: 10, correct: 8 }, '2026-09-29': { answers: 2, correct: 1 } } },
      { items: {}, activity: { '2026-09-28': { answers: 4, correct: 4 }, '2026-09-27': { answers: 3, correct: 3 } } },
    )
    expect(merged.activity).toEqual({
      '2026-09-27': { answers: 3, correct: 3 },
      '2026-09-28': { answers: 10, correct: 8 },
      '2026-09-29': { answers: 2, correct: 1 },
    })
  })
})

describe('mergeMyStudies', () => {
  it('junta los sets sin repetirlos y guarda la última sesión más reciente', () => {
    const merged = mergeMyStudies(
      {
        sets: [{ setId: 'hsk-1', addedAt: '2026-09-28T00:00:00.000Z' }],
        lastStudied: { 'hsk-1': '2026-09-29T00:00:00.000Z' },
      },
      {
        sets: [
          { setId: 'hsk-1', addedAt: '2026-09-20T00:00:00.000Z' },
          { setId: 'food', addedAt: '2026-09-21T00:00:00.000Z' },
        ],
        lastStudied: { 'hsk-1': '2026-09-25T00:00:00.000Z', food: '2026-09-26T00:00:00.000Z' },
      },
    )
    expect(merged).toEqual({
      sets: [
        { setId: 'hsk-1', addedAt: '2026-09-20T00:00:00.000Z' },
        { setId: 'food', addedAt: '2026-09-21T00:00:00.000Z' },
      ],
      lastStudied: { 'hsk-1': '2026-09-29T00:00:00.000Z', food: '2026-09-26T00:00:00.000Z' },
    })
  })
})

describe('mergeCustomSets', () => {
  it('junta los sets y, si están en los dos lados, se queda el editado más tarde', () => {
    const merged = mergeCustomSets(
      [customSet('custom-a', '2026-09-28T00:00:00.000Z', 'Old name'), customSet('custom-b', '2026-09-28T00:00:00.000Z')],
      [customSet('custom-a', '2026-09-29T00:00:00.000Z', 'New name'), customSet('custom-c', '2026-09-29T00:00:00.000Z')],
    )
    expect(merged.map((set) => [set.id, set.name])).toEqual([
      ['custom-a', 'New name'],
      ['custom-b', 'custom-b'],
      ['custom-c', 'custom-c'],
    ])
  })
})
