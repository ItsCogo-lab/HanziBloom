import { describe, expect, it } from 'vitest'
import { MAX_MASTERY_LEVEL, isReviewDue, scheduleKnownItem, scheduleNextReview } from './srs.ts'

const now = new Date(2026, 8, 28, 18, 30)
const midnight = (day: number, month = 8) => new Date(2026, month, day).toISOString()

describe('scheduleNextReview', () => {
  it("on a correct answer goes up a level and waits that level's days", () => {
    expect(scheduleNextReview(0, true, now)).toEqual({ masteryLevel: 1, nextReviewAt: midnight(29) })
    expect(scheduleNextReview(1, true, now)).toEqual({ masteryLevel: 2, nextReviewAt: midnight(1, 9) })
    expect(scheduleNextReview(3, true, now)).toEqual({ masteryLevel: 4, nextReviewAt: midnight(12, 9) })
  })

  it('on a miss goes back to level 0, due today', () => {
    expect(scheduleNextReview(4, false, now)).toEqual({ masteryLevel: 0, nextReviewAt: midnight(28) })
  })

  it("doesn't go past the maximum level", () => {
    const schedule = scheduleNextReview(MAX_MASTERY_LEVEL, true, now)

    expect(schedule.masteryLevel).toBe(MAX_MASTERY_LEVEL)
    expect(schedule.nextReviewAt).toBe(midnight(28, 9)) // 30 days
  })
})

describe('scheduleKnownItem', () => {
  it('starts at the maximum level and comes back after 30 days', () => {
    expect(scheduleKnownItem(now)).toEqual({ masteryLevel: MAX_MASTERY_LEVEL, nextReviewAt: midnight(28, 9) })
  })
})

describe('isReviewDue', () => {
  it('is due from the given date', () => {
    const tomorrow = midnight(29)

    expect(isReviewDue(tomorrow, now)).toBe(false)
    expect(isReviewDue(tomorrow, new Date(2026, 8, 29, 0, 0))).toBe(true)
    expect(isReviewDue(tomorrow, new Date(2026, 9, 5))).toBe(true)
  })
})
