import { addDays, fromDateKey, toDateKey, type DateKey } from '../../lib/dates.ts'
import type { DailyActivity } from './types.ts'

/**
 * Racha actual: días seguidos con alguna respuesta, contando hasta hoy.
 *
 * Si hoy aún no has estudiado, la racha de ayer sigue viva (tienes hasta
 * medianoche para mantenerla), así que se cuenta desde ayer.
 */
export function getCurrentStreak(activity: Record<DateKey, DailyActivity>, today: Date): number {
  const studied = (date: Date) => (activity[toDateKey(date)]?.answers ?? 0) > 0

  let day = studied(today) ? today : addDays(today, -1)
  let streak = 0
  while (studied(day)) {
    streak += 1
    day = addDays(day, -1)
  }
  return streak
}

/** Racha más larga de toda la historia. */
export function getLongestStreak(activity: Record<DateKey, DailyActivity>): number {
  const days = Object.keys(activity)
    .filter((key) => (activity[key]?.answers ?? 0) > 0)
    .toSorted()

  let longest = 0
  let current = 0
  let previous: DateKey | undefined
  for (const day of days) {
    const dayBefore = toDateKey(addDays(fromDateKey(day), -1))
    current = previous === dayBefore ? current + 1 : 1
    longest = Math.max(longest, current)
    previous = day
  }
  return longest
}
