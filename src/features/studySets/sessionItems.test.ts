import { describe, expect, it } from 'vitest'
import { hskDictionary } from '../dictionary/hskDictionary.ts'
import { getStudyItemId, type StudyItem, type StudyItemId } from '../dictionary/studyItem.ts'
import { createEmptyProgress, introduceItem, recordAnswer } from '../progress/progress.ts'
import type { ProgressData } from '../progress/types.ts'
import { getLearnableItems, getReviewItems, getSetSessionCounts } from './sessionItems.ts'
import type { StudySet } from './types.ts'

const now = new Date(2026, 8, 28, 12)
const yesterday = new Date(2026, 8, 27, 12)
const lastWeek = new Date(2026, 8, 21, 12)

// Un set de 10 palabras reales de HSK 1
const ITEM_IDS: StudyItemId[] = ['你', '好', '我', '是', '谢谢', '不', '他', '她', '我们', '的'].map(
  (hanzi) => `word:${hanzi}` as const,
)
const set: StudySet = { id: 'custom-ten', type: 'custom', name: 'Ten', description: 'Ten words', itemIds: ITEM_IDS }

/** Aprende (Learn) los `count` primeros elementos del set. */
function learnFirst(count: number, progress = createEmptyProgress()): ProgressData {
  return ITEM_IDS.slice(0, count).reduce((result, itemId) => introduceItem(result, itemId, now), progress)
}

const ids = (items: readonly StudyItem[]) => items.map(getStudyItemId)

describe('Learn y Study de un set', () => {
  it('el set de prueba existe entero en el dataset', () => {
    expect(ids(getLearnableItems(set, hskDictionary, createEmptyProgress()))).toEqual(ITEM_IDS)
  })

  it.each([
    [0, 10, 0],
    [3, 7, 3],
    [7, 3, 7],
    [10, 0, 10],
  ])('con %i aprendidos: Learn = %i, Study = %i', (learned, learnable, reviewable) => {
    const progress = learnFirst(learned)

    const learnItems = getLearnableItems(set, hskDictionary, progress)
    const { due, upToDate } = getReviewItems(set, hskDictionary, progress, now)
    expect(learnItems).toHaveLength(learnable)
    expect(due.length + upToDate.length).toBe(reviewable)
    expect(getSetSessionCounts(set, progress, now)).toEqual({ learnable, learned: reviewable, due: reviewable })
    // Learn solo tiene lo no aprendido y Study solo lo aprendido: nunca se solapan
    expect(ids(learnItems)).toEqual(ITEM_IDS.slice(learned))
    expect(ids([...due, ...upToDate]).toSorted()).toEqual(ITEM_IDS.slice(0, learned).toSorted())
  })

  it('cuenta como aprendido lo que ya se respondió en otra sesión, aunque fallara', () => {
    const progress = recordAnswer(createEmptyProgress(), 'word:你', false, now)

    expect(ids(getLearnableItems(set, hskDictionary, progress))).not.toContain('word:你')
    expect(getSetSessionCounts(set, progress, now)).toMatchObject({ learnable: 9, learned: 1 })
  })

  it('Study pone primero lo que toca repasar, empezando por lo más atrasado', () => {
    let progress = createEmptyProgress()
    progress = recordAnswer(progress, 'word:你', true, now) // al día: toca mañana
    progress = recordAnswer(progress, 'word:好', false, yesterday) // toca desde ayer
    progress = recordAnswer(progress, 'word:我', false, lastWeek) // toca desde hace una semana

    const { due, upToDate } = getReviewItems(set, hskDictionary, progress, now)
    expect(ids(due)).toEqual(['word:我', 'word:好'])
    expect(ids(upToDate)).toEqual(['word:你'])
    expect(getSetSessionCounts(set, progress, now)).toMatchObject({ learned: 3, due: 2 })
  })

  it('solo cuenta los elementos del set, aunque se hayan aprendido otros', () => {
    const progress = introduceItem(learnFirst(2), 'word:苹果', now)

    expect(getSetSessionCounts(set, progress, now)).toEqual({ learnable: 8, learned: 2, due: 2 })
    expect(ids(getReviewItems(set, hskDictionary, progress, now).due)).not.toContain('word:苹果')
  })
})
