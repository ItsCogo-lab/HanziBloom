import { describe, expect, it } from 'vitest'
import { MAX_MASTERY_LEVEL, isReviewDue, scheduleNextReview } from './srs.ts'

const now = new Date(2026, 8, 28, 18, 30)
const midnight = (day: number, month = 8) => new Date(2026, month, day).toISOString()

describe('scheduleNextReview', () => {
  it('al acertar sube un nivel y espera los días de ese nivel', () => {
    expect(scheduleNextReview(0, true, now)).toEqual({ masteryLevel: 1, nextReviewAt: midnight(29) })
    expect(scheduleNextReview(1, true, now)).toEqual({ masteryLevel: 2, nextReviewAt: midnight(1, 9) })
    expect(scheduleNextReview(3, true, now)).toEqual({ masteryLevel: 4, nextReviewAt: midnight(12, 9) })
  })

  it('al fallar vuelve al nivel 0, pendiente para hoy', () => {
    expect(scheduleNextReview(4, false, now)).toEqual({ masteryLevel: 0, nextReviewAt: midnight(28) })
  })

  it('no pasa del nivel máximo', () => {
    const schedule = scheduleNextReview(MAX_MASTERY_LEVEL, true, now)

    expect(schedule.masteryLevel).toBe(MAX_MASTERY_LEVEL)
    expect(schedule.nextReviewAt).toBe(midnight(28, 9)) // 30 días
  })
})

describe('isReviewDue', () => {
  it('toca repasar desde la fecha indicada', () => {
    const tomorrow = midnight(29)

    expect(isReviewDue(tomorrow, now)).toBe(false)
    expect(isReviewDue(tomorrow, new Date(2026, 8, 29, 0, 0))).toBe(true)
    expect(isReviewDue(tomorrow, new Date(2026, 9, 5))).toBe(true)
  })
})
