import { describe, expect, it } from 'vitest'
import { en } from './en.ts'
import { es } from './es.ts'
import { formatDate, formatPercent, formatShortDay, t } from './index.ts'

describe('t', () => {
  it('devuelve el texto en inglés de una clave', () => {
    expect(t('nav.practice')).toBe('Practice')
  })

  it('rellena los huecos con los parámetros', () => {
    expect(t('practice.progress', { current: 3, total: 10 })).toBe('Card 3 of 10')
  })

  it('deja el hueco si falta el parámetro', () => {
    expect(t('practice.progress', { current: 3 })).toBe('Card 3 of {total}')
  })

  it.each([
    ['en', en],
    ['es', es],
  ])('no hay textos vacíos en %s', (_locale, messages) => {
    for (const text of Object.values(messages)) {
      expect(text.trim()).not.toBe('')
    }
  })
})

describe('formatos', () => {
  it('formatea porcentajes, días y fechas en inglés', () => {
    expect(formatPercent(0.756)).toBe('76%')
    expect(formatShortDay(new Date(2026, 8, 28))).toBe('Mon, Sep 28')
    expect(formatDate(new Date(2026, 8, 28))).toBe('Sep 28, 2026')
  })

  it('en español los placeholders coinciden con los del inglés', () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).toSorted()
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(es[key]), key).toEqual(placeholders(en[key]))
    }
  })
})
