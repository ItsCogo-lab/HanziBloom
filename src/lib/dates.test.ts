import { describe, expect, it } from 'vitest'
import { addDays, startOfDay, toDateKey } from './dates.ts'

describe('toDateKey', () => {
  it('usa el día local con dos cifras en mes y día', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(toDateKey(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31')
  })
})

describe('startOfDay', () => {
  it('devuelve las 00:00 del mismo día', () => {
    expect(startOfDay(new Date(2026, 8, 28, 17, 45))).toEqual(new Date(2026, 8, 28))
  })
})

describe('addDays', () => {
  it('suma y resta días cambiando de mes y de año', () => {
    expect(addDays(new Date(2026, 8, 28), 3)).toEqual(new Date(2026, 9, 1))
    expect(addDays(new Date(2026, 0, 1), -1)).toEqual(new Date(2025, 11, 31))
  })

  it('no modifica la fecha original', () => {
    const date = new Date(2026, 8, 28)
    addDays(date, 1)
    expect(date).toEqual(new Date(2026, 8, 28))
  })
})
