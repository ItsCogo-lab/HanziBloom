import { describe, expect, it } from 'vitest'
import {
  applyHskLevel,
  createEmptyProgress,
  getItemStatus,
  introduceItem,
  isDue,
  isLearned,
  markItemKnown,
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

describe('markItemKnown', () => {
  const now = new Date(2026, 8, 28, 12)

  it('lo marca como dominado y no toca repasarlo hasta dentro de 30 días', () => {
    const progress = markItemKnown(createEmptyProgress(), 'word:你好', now)
    const item = progress.items['word:你好']

    expect(isLearned(progress, 'word:你好')).toBe(true)
    expect(getItemStatus(item)).toBe('mastered')
    expect(item).toMatchObject({ timesSeen: 0 })
    expect(isDue(item, new Date(2026, 9, 27, 23))).toBe(false)
    expect(isDue(item, new Date(2026, 9, 28))).toBe(true)
    expect(progress.activity).toEqual({})
  })

  it('si luego se falla, vuelve a repasarse como cualquier otro', () => {
    let progress = markItemKnown(createEmptyProgress(), 'word:你好', now)
    progress = recordAnswer(progress, 'word:你好', false, new Date(2026, 9, 28, 9))

    expect(progress.items['word:你好']).toMatchObject({ masteryLevel: 0, timesWrong: 1 })
    expect(getItemStatus(progress.items['word:你好'])).toBe('learning')
  })

  it('no toca un elemento que ya tenía progreso', () => {
    const progress = introduceItem(createEmptyProgress(), 'word:你好', now)

    expect(markItemKnown(progress, 'word:你好', now)).toBe(progress)
  })
})

describe('applyHskLevel', () => {
  const now = new Date(2026, 8, 28, 12)
  const items = [
    { itemId: 'word:你好', hskLevel: 1 },
    { itemId: 'word:认识', hskLevel: 2 },
    { itemId: 'word:经常', hskLevel: 3 },
    { itemId: 'word:安排', hskLevel: 4 },
  ] as const
  const in30Days = new Date(2026, 9, 28)

  it('con HSK 3, marca como dominado hasta HSK 3 y deja HSK 1 como básico', () => {
    const progress = applyHskLevel(createEmptyProgress(), items, 3, now)

    expect(progress.items['word:你好']).toMatchObject({ masteryLevel: 5, basic: true })
    expect(isDue(progress.items['word:你好'], new Date(2027, 0, 1))).toBe(false)
    for (const itemId of ['word:认识', 'word:经常'] as const) {
      expect(getItemStatus(progress.items[itemId])).toBe('mastered')
      expect(progress.items[itemId]?.basic).toBeUndefined()
      expect(isDue(progress.items[itemId], new Date(2026, 9, 27))).toBe(false)
    }
    expect(progress.items['word:安排']).toBeUndefined()
    expect(progress.activity).toEqual({})
  })

  it('reparte los primeros repasos en días distintos a partir de los 30 días', () => {
    const progress = applyHskLevel(createEmptyProgress(), items, 1, now)
    const withTwo = applyHskLevel(createEmptyProgress(), items, 2, now)

    expect(progress.items['word:你好']?.nextReviewAt).toBe(in30Days.toISOString())
    expect(withTwo.items['word:认识']?.nextReviewAt).toBe(new Date(2026, 9, 29).toISOString())
  })

  it('no toca lo que ya se estudiaba dentro del nivel, pero sí lo básico', () => {
    let progress = recordAnswer(createEmptyProgress(), 'word:经常', false, now)
    progress = recordAnswer(progress, 'word:你好', false, now)
    progress = applyHskLevel(progress, items, 3, now)

    expect(progress.items['word:经常']).toMatchObject({ masteryLevel: 0, timesWrong: 1 })
    expect(progress.items['word:你好']).toMatchObject({ masteryLevel: 5, timesWrong: 1, basic: true })
  })

  it('al bajar de nivel, lo que era básico vuelve a repasarse de vez en cuando', () => {
    let progress = applyHskLevel(createEmptyProgress(), items, 3, now)
    progress = applyHskLevel(progress, items, null, now)

    expect(progress.items['word:你好']?.basic).toBeUndefined()
    expect(getItemStatus(progress.items['word:你好'])).toBe('mastered')
    expect(isDue(progress.items['word:你好'], in30Days)).toBe(true)
  })

  it('un básico que se falla pierde la marca y vuelve a la repetición normal', () => {
    let progress = applyHskLevel(createEmptyProgress(), items, 3, now)
    progress = recordAnswer(progress, 'word:你好', false, now)

    expect(progress.items['word:你好']?.basic).toBeUndefined()
    expect(isDue(progress.items['word:你好'], now)).toBe(true)
  })
})
