import { describe, expect, it } from 'vitest'
import { createDictionary } from '../dictionary/dictionary.ts'
import { listStudyItems, type StudyItemId } from '../dictionary/studyItem.ts'
import { testCharacters, testWords } from '../dictionary/testData.ts'
import { createEmptyProgress, MASTERED_LEVEL, recordAnswer } from './progress.ts'
import { getAnswerTotals, getMostMissed, getRecentActivity, summarizeItems } from './stats.ts'
import type { ProgressData } from './types.ts'

const items = listStudyItems(createDictionary(testCharacters, testWords)) // 4 characters and 3 words
const monday = new Date(2026, 8, 28, 10, 0)
const tuesday = new Date(2026, 8, 29, 10, 0)

function exampleProgress(): ProgressData {
  let progress = createEmptyProgress()
  progress = recordAnswer(progress, 'char:你', true, monday) // learning, due tomorrow
  progress = recordAnswer(progress, 'char:好', false, monday) // learning, due today
  progress = recordAnswer(progress, 'word:你好', true, monday)
  // 你好 mastered: high level and a distant review
  const mastered = { ...progress.items['word:你好']!, masteryLevel: MASTERED_LEVEL, nextReviewAt: '2026-12-01T00:00:00.000Z' }
  return { ...progress, items: { ...progress.items, 'word:你好': mastered } }
}

describe('summarizeItems', () => {
  it('counts the items in each state and the due ones', () => {
    expect(summarizeItems(items, exampleProgress(), monday)).toEqual({
      total: 7,
      new: 4,
      learning: 2,
      mastered: 1,
      studied: 3,
      due: 1,
    })
  })

  it('due items change with the date', () => {
    expect(summarizeItems(items, exampleProgress(), tuesday).due).toBe(2)
  })

  it('only counts the items passed in', () => {
    const words = items.filter((item) => item.kind === 'word')
    expect(summarizeItems(words, exampleProgress(), monday)).toMatchObject({ total: 3, new: 2, mastered: 1 })
  })

  it('with no progress, everything is new', () => {
    expect(summarizeItems(items, createEmptyProgress(), monday)).toMatchObject({ total: 7, new: 7, studied: 0, due: 0 })
  })
})

describe('getAnswerTotals', () => {
  it('adds up the answers from every day', () => {
    const activity = { '2026-09-27': { answers: 6, correct: 3 }, '2026-09-28': { answers: 4, correct: 4 } }
    expect(getAnswerTotals(activity)).toEqual({ answers: 10, correct: 7, accuracy: 0.7 })
  })

  it('with no answers there is no accuracy', () => {
    expect(getAnswerTotals({})).toEqual({ answers: 0, correct: 0, accuracy: undefined })
  })
})

describe('getRecentActivity', () => {
  it('returns the last days in order, with zeros on days without study', () => {
    const activity = { '2026-09-26': { answers: 5, correct: 4 }, '2026-09-01': { answers: 9, correct: 9 } }

    expect(getRecentActivity(activity, monday, 3)).toEqual([
      { date: '2026-09-26', answers: 5, correct: 4 },
      { date: '2026-09-27', answers: 0, correct: 0 },
      { date: '2026-09-28', answers: 0, correct: 0 },
    ])
  })

  it('defaults to one week', () => {
    expect(getRecentActivity({}, monday)).toHaveLength(7)
  })
})

describe('getMostMissed', () => {
  it('sorts by mistakes and, on ties, by worst accuracy', () => {
    let progress = createEmptyProgress()
    const answers: [StudyItemId, boolean][] = [
      ['char:你', false],
      ['char:你', false],
      ['char:好', false],
      ['char:好', true],
      ['char:谢', false],
      ['char:了', true],
    ]
    for (const [id, correct] of answers) progress = recordAnswer(progress, id, correct, monday)

    expect(getMostMissed(progress).map((item) => item.itemId)).toEqual(['char:你', 'char:谢', 'char:好'])
    expect(getMostMissed(progress, 1)).toHaveLength(1)
  })
})
