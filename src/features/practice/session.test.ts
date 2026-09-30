import { describe, expect, it } from 'vitest'
import { createDictionary } from '../dictionary/dictionary.ts'
import { getStudyItemId, listStudyItems, type StudyItem } from '../dictionary/studyItem.ts'
import { testCharacters, testWords } from '../dictionary/testData.ts'
import { seededRandom } from '../../test/random.ts'
import type { ExerciseDefinition } from './exerciseDefinitions.ts'
import { applyHskLevel, createEmptyProgress, recordAnswer } from '../progress/progress.ts'
import {
  createSessionExercises,
  createSessionState,
  getCurrentExercise,
  isSessionFinished,
  selectSessionItems,
  sessionReducer,
  summarizeResults,
} from './session.ts'
import type { Exercise } from './types.ts'

const pool = listStudyItems(createDictionary(testCharacters, testWords))

describe('createSessionExercises', () => {
  it('creates as many exercises as the requested size, without repeating items', () => {
    const exercises = createSessionExercises(pool, { size: 5, random: seededRandom(1) })

    expect(exercises).toHaveLength(5)
    expect(new Set(exercises.map((exercise) => exercise.item)).size).toBe(5)
  })

  it('creates fewer exercises if there are not enough items', () => {
    expect(createSessionExercises(pool, { size: 100, random: seededRandom(1) })).toHaveLength(pool.length)
  })

  it('creates the same session with the same seed', () => {
    const first = createSessionExercises(pool, { size: 4, random: seededRandom(3) })
    const second = createSessionExercises(pool, { size: 4, random: seededRandom(3) })

    expect(first).toEqual(second)
  })

  it('skips items for which no exercise can be built', () => {
    const onlyWords: ExerciseDefinition = {
      type: 'flashcard',
      canBuild: (item) => item.kind === 'word',
      build: (item) => ({ type: 'flashcard', item }),
    }
    const exercises = createSessionExercises(pool, { size: 100, random: seededRandom(1), definitions: [onlyWords] })

    expect(exercises).toHaveLength(testWords.length)
    expect(exercises.every((exercise) => exercise.item.kind === 'word')).toBe(true)
  })
})

describe('selectSessionItems', () => {
  const monday = new Date(2026, 8, 28, 10, 0)
  const thursday = new Date(2026, 9, 1, 10, 0)
  const ids = (items: readonly StudyItem[]) => items.map(getStudyItemId).toSorted()

  // 你 and 好 were missed (already due); 谢 and 了 were answered correctly (due from tomorrow)
  let progress = createEmptyProgress()
  for (const [id, correct] of [
    ['char:你', false],
    ['char:好', false],
    ['char:谢', true],
    ['char:了', true],
  ] as const) {
    progress = recordAnswer(progress, id, correct, monday)
  }

  it('puts due reviews first', () => {
    expect(ids(selectSessionItems(pool, progress, monday, 2, seededRandom(1)))).toEqual(['char:你', 'char:好'])
  })

  it('then the new items', () => {
    expect(ids(selectSessionItems(pool, progress, monday, 5, seededRandom(1)))).toEqual(
      ['char:你', 'char:好', 'word:你好', 'word:好', 'word:谢谢'].toSorted(),
    )
  })

  it('and, if still short, the ones not yet due', () => {
    expect(selectSessionItems(pool, progress, monday, 100, seededRandom(1))).toHaveLength(pool.length)
  })

  it('basic items are never due and go after everything else', () => {
    // 你 was a due miss, but with HSK 3 it becomes basic
    const withBasic = applyHskLevel(progress, [{ itemId: 'char:你', hskLevel: 1 }], 3, monday)
    const items = pool.filter((item) => withBasic.items[getStudyItemId(item)] !== undefined)

    expect(ids(selectSessionItems(items, withBasic, thursday, 3, seededRandom(1)))).toEqual(
      ['char:好', 'char:谢', 'char:了'].toSorted(),
    )
  })

  it('when their date arrives, correctly answered items are also due reviews', () => {
    expect(ids(selectSessionItems(pool, progress, thursday, 4, seededRandom(1)))).toEqual(
      ['char:你', 'char:好', 'char:谢', 'char:了'].toSorted(),
    )
  })
})

describe('sessionReducer', () => {
  const exercises: Exercise[] = pool.slice(0, 2).map((item) => ({ type: 'flashcard', item }))

  it('on answering, stores the result and moves to the next exercise', () => {
    const state = sessionReducer(createSessionState(exercises), { type: 'answer', correct: true })

    expect(state.currentIndex).toBe(1)
    expect(state.results).toEqual([{ itemId: 'char:你', exerciseType: 'flashcard', correct: true }])
    expect(getCurrentExercise(state)).toBe(exercises[1])
  })

  it('finishes when all exercises have been answered', () => {
    let state = createSessionState(exercises)
    state = sessionReducer(state, { type: 'answer', correct: true })
    expect(isSessionFinished(state)).toBe(false)

    state = sessionReducer(state, { type: 'answer', correct: false })
    expect(isSessionFinished(state)).toBe(true)
    expect(getCurrentExercise(state)).toBeUndefined()
  })

  it('ignores answers once the session has finished', () => {
    const finished = { ...createSessionState(exercises), currentIndex: 2 }

    expect(sessionReducer(finished, { type: 'answer', correct: true })).toBe(finished)
  })
})

describe('summarizeResults', () => {
  it('counts correct and wrong answers', () => {
    const summary = summarizeResults([
      { itemId: 'char:你', exerciseType: 'flashcard', correct: true },
      { itemId: 'word:好', exerciseType: 'flashcard', correct: false },
      { itemId: 'word:谢谢', exerciseType: 'flashcard', correct: true },
    ])

    expect(summary).toEqual({ total: 3, correct: 2, wrong: 1 })
  })

  it('works with an empty session', () => {
    expect(summarizeResults([])).toEqual({ total: 0, correct: 0, wrong: 0 })
  })
})
