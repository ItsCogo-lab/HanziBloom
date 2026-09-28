import { describe, expect, it } from 'vitest'
import { cjkRadicalsFixture, unihanIrgSourcesFixture, unihanVariantsFixture } from '../fixtures/unihan.ts'
import { loadUnihan, parseCjkRadicals, toUnihanCharacter } from './unihan.ts'

const radicals = parseCjkRadicals(cjkRadicalsFixture)

describe('adaptador de Unihan', () => {
  it('da trazos, radical, número de radical y tradicional de 柠', () => {
    const unihan = loadUnihan([unihanIrgSourcesFixture, unihanVariantsFixture], cjkRadicalsFixture, new Set(['柠']))
    expect(unihan.get('柠')).toEqual({ strokeCount: 9, radical: '木', radicalNumber: 75, traditional: ['檸'] })
  })

  it('solo lee los caracteres pedidos', () => {
    const unihan = loadUnihan([unihanIrgSourcesFixture], cjkRadicalsFixture, new Set(['好']))
    expect(unihan.size).toBe(0)
  })

  it('lee CJKRadicals.txt, incluidas las formas simplificadas', () => {
    expect(radicals.get('75')).toBe('木')
    expect(radicals.get("149'")).toBe('讠')
    expect(radicals.has('#')).toBe(false)
  })

  it('usa el primer valor de kRSUnicode y de kTotalStrokes', () => {
    const properties = new Map([
      ['kRSUnicode', "149'.6 149.6"],
      ['kTotalStrokes', '8 13'],
    ])
    expect(toUnihanCharacter(properties, radicals)).toEqual({ strokeCount: 8, radical: '讠', radicalNumber: 149 })
  })

  it('deja vacío lo que Unihan no tiene', () => {
    expect(toUnihanCharacter(new Map(), radicals)).toEqual({})
  })
})
