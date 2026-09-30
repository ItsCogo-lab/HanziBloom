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

/** Answers correctly `times` times: with 4 correct in a row the item is mastered. */
function answerCorrectly(progress: ProgressData, itemId: StudyItemId, times: number): ProgressData {
  let result = progress
  for (let i = 0; i < times; i++) result = recordAnswer(result, itemId, true, now)
  return result
}

describe('getSetProgress', () => {
  it('is computed from each item\'s progress: mastered, learning and not started', () => {
    let progress = createEmptyProgress()
    progress = answerCorrectly(progress, 'word:苹果', 4) // mastered (level 4)
    progress = answerCorrectly(progress, 'word:米饭', 1) // learning
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

  it('an item in two sets counts in both at once (there is no per-set progress)', () => {
    const progress = answerCorrectly(createEmptyProgress(), 'word:苹果', 4)
    const hsk = setOf('hsk', ['word:苹果', 'word:你好'])
    const food = setOf('food', ['word:苹果'])

    expect(getSetProgress(hsk, progress, now).mastered).toBe(1)
    expect(getSetProgress(food, progress, now).ratio).toBe(1)
  })

  it('an empty set has progress 0', () => {
    expect(getSetProgress(setOf('empty', []), createEmptyProgress(), now).ratio).toBe(0)
  })
})
