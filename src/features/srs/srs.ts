import { addDays, startOfDay } from '../../lib/dates.ts'

/**
 * Spaced repetition with Leitner boxes.
 *
 * Each item sits at a mastery level from 0 to 5. A correct answer moves it up
 * a level and a miss sends it back to 0. Each level sets how many days to wait
 * until the next review: what you already know shows up less and less, and
 * what you miss, right away.
 *
 * The rest of the app only uses `scheduleNextReview` and `isReviewDue`:
 * switching to another algorithm (SM-2, FSRS) wouldn't affect anything else.
 */
export const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const

export const MAX_MASTERY_LEVEL = REVIEW_INTERVAL_DAYS.length - 1

export interface ReviewSchedule {
  masteryLevel: number
  /** Date (ISO 8601) from which a review is due. */
  nextReviewAt: string
}

/**
 * Level and date of the next review after answering.
 *
 * Reviews go by days: "tomorrow's" review is available from 00:00 tomorrow,
 * not exactly 24 hours later. Level 0 (0 days) stays due for today.
 */
export function scheduleNextReview(masteryLevel: number, wasCorrect: boolean, now: Date): ReviewSchedule {
  const nextLevel = wasCorrect ? Math.min(masteryLevel + 1, MAX_MASTERY_LEVEL) : 0
  const interval = REVIEW_INTERVAL_DAYS[nextLevel] ?? 0
  return {
    masteryLevel: nextLevel,
    nextReviewAt: addDays(startOfDay(now), interval).toISOString(),
  }
}

/** Schedule for a just-learned item: level 0, due for review today. */
export function scheduleFirstReview(now: Date): ReviewSchedule {
  return { masteryLevel: 0, nextReviewAt: addDays(startOfDay(now), REVIEW_INTERVAL_DAYS[0]).toISOString() }
}

/**
 * Schedule for an item the user already knew: it starts at the maximum
 * level, so it comes back after 30 days. If answered correctly it stays at
 * every 30 days; if missed, it goes back to level 0 like any other.
 *
 * `extraDays` delays the first review: when marking many items at once it
 * spreads them out so they aren't all due on the same day.
 */
export function scheduleKnownItem(now: Date, extraDays = 0): ReviewSchedule {
  const interval = (REVIEW_INTERVAL_DAYS[MAX_MASTERY_LEVEL] ?? 0) + extraDays
  return { masteryLevel: MAX_MASTERY_LEVEL, nextReviewAt: addDays(startOfDay(now), interval).toISOString() }
}

export function isReviewDue(nextReviewAt: string, now: Date): boolean {
  return Date.parse(nextReviewAt) <= now.getTime()
}
