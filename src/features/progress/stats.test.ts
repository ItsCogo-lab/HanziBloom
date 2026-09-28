import { describe, expect, it } from 'vitest'
import { createDictionary } from '../dictionary/dictionary.ts'
import { listStudyItems } from '../dictionary/studyItem.ts'
import { testCharacters, testWords } from '../dictionary/testData.ts'
import { createEmptyProgress, MASTERED_LEVEL, recordAnswer } from './progress.ts'
import { summarizeItems } from './stats.ts'
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
