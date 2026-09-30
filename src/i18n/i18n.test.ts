import { describe, expect, it } from 'vitest'
import { en } from './en.ts'
import { es } from './es.ts'
import { formatDate, formatPercent, formatShortDay, t } from './index.ts'

describe('t', () => {
  it("returns a key's English text", () => {
    expect(t('nav.study')).toBe('Study')
  })

  it('fills placeholders with the parameters', () => {
    expect(t('practice.progress', { current: 3, total: 10 })).toBe('Card 3 of 10')
  })

  it('leaves the placeholder if the parameter is missing', () => {
    expect(t('practice.progress', { current: 3 })).toBe('Card 3 of {total}')
  })

  it.each([
    ['en', en],
    ['es', es],
  ])('has no empty texts in %s', (_locale, messages) => {
    for (const text of Object.values(messages)) {
      expect(text.trim()).not.toBe('')
    }
  })
})

describe('formats', () => {
  it('formats percentages, days and dates in English', () => {
    expect(formatPercent(0.756)).toBe('76%')
    expect(formatShortDay(new Date(2026, 8, 28))).toBe('Mon, Sep 28')
    expect(formatDate(new Date(2026, 8, 28))).toBe('Sep 28, 2026')
  })

  it('Spanish placeholders match the English ones', () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).toSorted()
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(es[key]), key).toEqual(placeholders(en[key]))
    }
  })
})
