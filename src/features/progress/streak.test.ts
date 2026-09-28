import { describe, expect, it } from 'vitest'
import type { DailyActivity } from './types.ts'
import { getCurrentStreak, getLongestStreak } from './streak.ts'

/** Actividad con una respuesta en cada uno de los días indicados. */
function activityOn(...days: string[]): Record<string, DailyActivity> {
  return Object.fromEntries(days.map((day) => [day, { answers: 1, correct: 1 }]))
}

const today = new Date(2026, 8, 28, 21, 0) // 28 de septiembre

describe('getCurrentStreak', () => {
  it('cuenta los días seguidos hasta hoy', () => {
    expect(getCurrentStreak(activityOn('2026-09-26', '2026-09-27', '2026-09-28'), today)).toBe(3)
  })

  it('si hoy aún no has estudiado, cuenta hasta ayer', () => {
    expect(getCurrentStreak(activityOn('2026-09-26', '2026-09-27'), today)).toBe(2)
  })

  it('se rompe al saltarse un día', () => {
    expect(getCurrentStreak(activityOn('2026-09-24', '2026-09-26', '2026-09-28'), today)).toBe(1)
    expect(getCurrentStreak(activityOn('2026-09-25', '2026-09-26'), today)).toBe(0)
  })

  it('cruza cambios de mes', () => {
    expect(getCurrentStreak(activityOn('2026-08-31', '2026-09-01'), new Date(2026, 8, 1))).toBe(2)
  })

  it('no cuenta días sin respuestas', () => {
    expect(getCurrentStreak({ '2026-09-28': { answers: 0, correct: 0 } }, today)).toBe(0)
  })
})

describe('getLongestStreak', () => {
  it('encuentra la racha más larga aunque no sea la actual', () => {
    const activity = activityOn('2026-08-30', '2026-08-31', '2026-09-01', '2026-09-10', '2026-09-28')
    expect(getLongestStreak(activity)).toBe(3)
  })

  it('es 0 sin actividad', () => {
    expect(getLongestStreak({})).toBe(0)
  })
})
