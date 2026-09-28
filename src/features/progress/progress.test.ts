import { describe, expect, it } from 'vitest'
import {
  createEmptyProgress,
  getItemStatus,
  introduceItem,
  isDue,
  isLearned,
  MASTERED_LEVEL,
  recordAnswer,
} from './progress.ts'

const monday = new Date(2026, 8, 28, 10, 0)
const tuesday = new Date(2026, 8, 29, 9, 0)

describe('recordAnswer', () => {
  it('crea el progreso de un elemento nuevo', () => {
    const progress = recordAnswer(createEmptyProgress(), 'char:你', true, monday)

    expect(progress.items['char:你']).toEqual({
      itemId: 'char:你',
      timesSeen: 1,
      timesCorrect: 1,
      timesWrong: 0,
      masteryLevel: 1,
      lastReviewedAt: monday.toISOString(),
      nextReviewAt: new Date(2026, 8, 29).toISOString(),
    })
  })

  it('acumula respuestas y aplica la repetición espaciada', () => {
    let progress = recordAnswer(createEmptyProgress(), 'word:你好', true, monday)
    progress = recordAnswer(progress, 'word:你好', true, tuesday)
    expect(progress.items['word:你好']).toMatchObject({ timesSeen: 2, timesCorrect: 2, masteryLevel: 2 })

    progress = recordAnswer(progress, 'word:你好', false, tuesday)
    expect(progress.items['word:你好']).toMatchObject({ timesSeen: 3, timesWrong: 1, masteryLevel: 0 })
  })

  it('suma las respuestas a la actividad de cada día', () => {
    let progress = recordAnswer(createEmptyProgress(), 'char:你', true, monday)
    progress = recordAnswer(progress, 'char:好', false, monday)
    progress = recordAnswer(progress, 'char:你', true, tuesday)

    expect(progress.activity).toEqual({
      '2026-09-28': { answers: 2, correct: 1 },
      '2026-09-29': { answers: 1, correct: 1 },
    })
  })

  it('no modifica el progreso anterior', () => {
    const empty = createEmptyProgress()
    recordAnswer(empty, 'char:你', true, monday)

    expect(empty).toEqual(createEmptyProgress())
  })
})

describe('getItemStatus', () => {
  it('distingue nuevo, en aprendizaje y dominado', () => {
    const progress = recordAnswer(createEmptyProgress(), 'char:你', true, monday)
    const item = progress.items['char:你']!

    expect(getItemStatus(undefined)).toBe('new')
    expect(getItemStatus(item)).toBe('learning')
    expect(getItemStatus({ ...item, masteryLevel: MASTERED_LEVEL })).toBe('mastered')
  })
})

describe('isDue', () => {
  it('un elemento acertado hoy toca mañana; uno fallado, hoy mismo', () => {
    let progress = recordAnswer(createEmptyProgress(), 'char:你', true, monday)
    progress = recordAnswer(progress, 'char:好', false, monday)

    expect(isDue(progress.items['char:你'], monday)).toBe(false)
    expect(isDue(progress.items['char:你'], tuesday)).toBe(true)
    expect(isDue(progress.items['char:好'], monday)).toBe(true)
    expect(isDue(undefined, monday)).toBe(false)
  })
})

describe('introduceItem', () => {
  const now = new Date(2026, 8, 28, 12)

  it('marca el elemento como aprendido, con su primer repaso hoy, sin contar como respuesta', () => {
    const progress = introduceItem(createEmptyProgress(), 'word:你好', now)

    expect(isLearned(progress, 'word:你好')).toBe(true)
    expect(getItemStatus(progress.items['word:你好'])).toBe('learning')
    expect(progress.items['word:你好']).toMatchObject({ masteryLevel: 0, timesSeen: 0 })
    expect(isDue(progress.items['word:你好'], now)).toBe(true)
    expect(progress.activity).toEqual({})
  })

  it('no toca un elemento que ya tenía progreso', () => {
    const progress = recordAnswer(createEmptyProgress(), 'word:你好', true, now)

    expect(introduceItem(progress, 'word:你好', now)).toBe(progress)
  })
})
