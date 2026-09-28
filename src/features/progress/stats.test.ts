import { describe, expect, it } from 'vitest'
import { createDictionary } from '../dictionary/dictionary.ts'
import { listStudyItems, type StudyItemId } from '../dictionary/studyItem.ts'
import { testCharacters, testWords } from '../dictionary/testData.ts'
import { createEmptyProgress, MASTERED_LEVEL, recordAnswer } from './progress.ts'
import { getAnswerTotals, getMostMissed, getRecentActivity, summarizeItems } from './stats.ts'
import type { ProgressData } from './types.ts'

const items = listStudyItems(createDictionary(testCharacters, testWords)) // 4 caracteres y 3 palabras
const monday = new Date(2026, 8, 28, 10, 0)
const tuesday = new Date(2026, 8, 29, 10, 0)

function exampleProgress(): ProgressData {
  let progress = createEmptyProgress()
  progress = recordAnswer(progress, 'char:你', true, monday) // en aprendizaje, toca mañana
  progress = recordAnswer(progress, 'char:好', false, monday) // en aprendizaje, toca hoy
  progress = recordAnswer(progress, 'word:你好', true, monday)
  // 你好 dominado: nivel alto y repaso lejano
  const mastered = { ...progress.items['word:你好']!, masteryLevel: MASTERED_LEVEL, nextReviewAt: '2026-12-01T00:00:00.000Z' }
  return { ...progress, items: { ...progress.items, 'word:你好': mastered } }
}

describe('summarizeItems', () => {
  it('cuenta los elementos de cada estado y los pendientes', () => {
    expect(summarizeItems(items, exampleProgress(), monday)).toEqual({
      total: 7,
      new: 4,
      learning: 2,
      mastered: 1,
      studied: 3,
      due: 1,
    })
  })

  it('los pendientes cambian con la fecha', () => {
    expect(summarizeItems(items, exampleProgress(), tuesday).due).toBe(2)
  })

  it('solo cuenta los elementos que se le pasan', () => {
    const words = items.filter((item) => item.kind === 'word')
    expect(summarizeItems(words, exampleProgress(), monday)).toMatchObject({ total: 3, new: 2, mastered: 1 })
  })

  it('sin progreso, todo es nuevo', () => {
    expect(summarizeItems(items, createEmptyProgress(), monday)).toMatchObject({ total: 7, new: 7, studied: 0, due: 0 })
  })
})

describe('getAnswerTotals', () => {
  it('suma las respuestas de todos los días', () => {
    const activity = { '2026-09-27': { answers: 6, correct: 3 }, '2026-09-28': { answers: 4, correct: 4 } }
    expect(getAnswerTotals(activity)).toEqual({ answers: 10, correct: 7, accuracy: 0.7 })
  })

  it('sin respuestas no hay porcentaje de acierto', () => {
    expect(getAnswerTotals({})).toEqual({ answers: 0, correct: 0, accuracy: undefined })
  })
})

describe('getRecentActivity', () => {
  it('devuelve los últimos días en orden, con ceros en los días sin estudiar', () => {
    const activity = { '2026-09-26': { answers: 5, correct: 4 }, '2026-09-01': { answers: 9, correct: 9 } }

    expect(getRecentActivity(activity, monday, 3)).toEqual([
      { date: '2026-09-26', answers: 5, correct: 4 },
      { date: '2026-09-27', answers: 0, correct: 0 },
      { date: '2026-09-28', answers: 0, correct: 0 },
    ])
  })

  it('por defecto, una semana', () => {
    expect(getRecentActivity({}, monday)).toHaveLength(7)
  })
})

describe('getMostMissed', () => {
  it('ordena por fallos y, a igualdad, por peor acierto', () => {
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
