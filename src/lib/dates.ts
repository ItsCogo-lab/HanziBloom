/**
 * Date utilities in the user's local time.
 *
 * Reviews and the streak go by local calendar days: if someone studies at
 * 23:30 and at 00:15, those are two different days for them, even if they
 * were the same day in UTC.
 */

/** Local day key, e.g. "2026-09-28". Sorts correctly as text. */
export type DateKey = string

export function toDateKey(date: Date): DateKey {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Date (00:00 local time) for a "YYYY-MM-DD" key. */
export function fromDateKey(key: DateKey): Date {
  const [year = 0, month = 1, day = 1] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Date at 00:00 (local time) on the day of `date`. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Adds calendar days. Uses setDate rather than "+ 24 h" because on
 * daylight saving changes a day can last 23 or 25 hours.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
