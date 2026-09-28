import { describe, expect, it } from 'vitest'
import { en } from './en.ts'
import { es } from './es.ts'
import { t } from './index.ts'

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
