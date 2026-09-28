import { describe, expect, it } from 'vitest'
import { createEmptyProgress, recordAnswer } from '../progress/progress.ts'
import type { ProgressData } from '../progress/types.ts'
import type { StudyItemId } from '../dictionary/studyItem.ts'
import { getSetProgress } from './setProgress.ts'
import type { StudySet } from './types.ts'

const now = new Date(2026, 8, 28, 12)

function setOf(id: string, itemIds: StudyItemId[]): StudySet {
  return { id, type: 'topic', name: id, description: id, itemIds }
}

/** Responde bien `times` veces: con 4 aciertos seguidos el elemento queda dominado. */
function answerCorrectly(progress: ProgressData, itemId: StudyItemId, times: number): ProgressData {
  let result = progress
  for (let i = 0; i < times; i++) result = recordAnswer(result, itemId, true, now)
  return result
}

describe('getSetProgress', () => {
  it('se calcula con el progreso de cada elemento: dominados, aprendiendo y sin empezar', () => {
    let progress = createEmptyProgress()
    progress = answerCorrectly(progress, 'word:苹果', 4) // dominado (nivel 4)
    progress = answerCorrectly(progress, 'word:米饭', 1) // aprendiendo
    const set = setOf('food', ['word:苹果', 'word:米饭', 'word:茶', 'word:水'])

    expect(getSetProgress(set, progress, now)).toMatchObject({
      total: 4,
      mastered: 1,
      learning: 1,
      new: 2,
      studied: 2,
      ratio: 0.25,
    })
  })

  it('un elemento en dos sets cuenta en los dos a la vez (no hay progreso por set)', () => {
    const progress = answerCorrectly(createEmptyProgress(), 'word:苹果', 4)
    const hsk = setOf('hsk', ['word:苹果', 'word:你好'])
    const food = setOf('food', ['word:苹果'])

    expect(getSetProgress(hsk, progress, now).mastered).toBe(1)
    expect(getSetProgress(food, progress, now).ratio).toBe(1)
  })

  it('un set vacío tiene progreso 0', () => {
    expect(getSetProgress(setOf('empty', []), createEmptyProgress(), now).ratio).toBe(0)
  })
})
