import { describe, expect, it } from 'vitest'
import { es } from './es.ts'
import { t } from './index.ts'

describe('t', () => {
  it('devuelve el texto en español de una clave', () => {
    expect(t('nav.practice')).toBe('Práctica')
  })

  it('no tiene textos vacíos', () => {
    for (const text of Object.values(es)) {
      expect(text.trim()).not.toBe('')
    }
  })
})
