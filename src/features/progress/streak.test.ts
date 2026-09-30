import { describe, expect, it } from 'vitest'
import type { DailyActivity } from './types.ts'
import { getCurrentStreak, getLongestStreak } from './streak.ts'

/** Activity with one answer on each of the given days. */
function activityOn(...days: string[]): Record<string, DailyActivity> {
  return Object.fromEntries(days.map((day) => [day, { answers: 1, correct: 1 }]))
}

const today = new Date(2026, 8, 28, 21, 0) // September 28

describe('getCurrentStreak', () => {
  it('counts consecutive days up to today', () => {
    expect(getCurrentStreak(activityOn('2026-09-26', '2026-09-27', '2026-09-28'), today)).toBe(3)
  })

  it("if you haven't studied yet today, counts up to yesterday", () => {
    expect(getCurrentStreak(activityOn('2026-09-26', '2026-09-27'), today)).toBe(2)
  })

  it('breaks when a day is skipped', () => {
    expect(getCurrentStreak(activityOn('2026-09-24', '2026-09-26', '2026-09-28'), today)).toBe(1)
    expect(getCurrentStreak(activityOn('2026-09-25', '2026-09-26'), today)).toBe(0)
  })

  it('crosses month boundaries', () => {
    expect(getCurrentStreak(activityOn('2026-08-31', '2026-09-01'), new Date(2026, 8, 1))).toBe(2)
  })

  it("doesn't count days with no answers", () => {
    expect(getCurrentStreak({ '2026-09-28': { answers: 0, correct: 0 } }, today)).toBe(0)
  })
})

describe('getLongestStreak', () => {
  it("finds the longest streak even if it isn't the current one", () => {
    const activity = activityOn('2026-08-30', '2026-08-31', '2026-09-01', '2026-09-10', '2026-09-28')
    expect(getLongestStreak(activity)).toBe(3)
  })

  it('is 0 with no activity', () => {
    expect(getLongestStreak({})).toBe(0)
  })
})
