import { describe, expect, it } from 'vitest'
import { addDays, fromDateKey, startOfDay, toDateKey } from './dates.ts'

describe('toDateKey', () => {
  it('uses the local day with two digits for month and day', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(toDateKey(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31')
  })
})

describe('fromDateKey', () => {
  it('is the inverse of toDateKey', () => {
    expect(fromDateKey('2026-01-05')).toEqual(new Date(2026, 0, 5))
    expect(toDateKey(fromDateKey('2026-12-31'))).toBe('2026-12-31')
  })
})

describe('startOfDay', () => {
  it('returns 00:00 of the same day', () => {
    expect(startOfDay(new Date(2026, 8, 28, 17, 45))).toEqual(new Date(2026, 8, 28))
  })
})

describe('addDays', () => {
  it('adds and subtracts days across months and years', () => {
    expect(addDays(new Date(2026, 8, 28), 3)).toEqual(new Date(2026, 9, 1))
    expect(addDays(new Date(2026, 0, 1), -1)).toEqual(new Date(2025, 11, 31))
  })

  it('does not modify the original date', () => {
    const date = new Date(2026, 8, 28)
    addDays(date, 1)
    expect(date).toEqual(new Date(2026, 8, 28))
  })
})
