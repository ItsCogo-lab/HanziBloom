import { describe, expect, it } from 'vitest'
import { cjkRadicalsFixture, unihanIrgSourcesFixture, unihanVariantsFixture } from '../fixtures/unihan.ts'
import { loadUnihan, parseCjkRadicals, toUnihanCharacter } from './unihan.ts'

const radicals = parseCjkRadicals(cjkRadicalsFixture)

describe('Unihan adapter', () => {
  it('gives strokes, radical, radical number and traditional form of 柠', () => {
    const unihan = loadUnihan([unihanIrgSourcesFixture, unihanVariantsFixture], cjkRadicalsFixture, new Set(['柠']))
    expect(unihan.get('柠')).toEqual({ strokeCount: 9, radical: '木', radicalNumber: 75, traditional: ['檸'] })
  })

  it('only reads the requested characters', () => {
    const unihan = loadUnihan([unihanIrgSourcesFixture], cjkRadicalsFixture, new Set(['好']))
    expect(unihan.size).toBe(0)
  })

  it('reads CJKRadicals.txt, including the simplified forms', () => {
    expect(radicals.get('75')).toBe('木')
    expect(radicals.get("149'")).toBe('讠')
    expect(radicals.has('#')).toBe(false)
  })

  it('uses the first value of kRSUnicode and kTotalStrokes', () => {
    const properties = new Map([
      ['kRSUnicode', "149'.6 149.6"],
      ['kTotalStrokes', '8 13'],
    ])
    expect(toUnihanCharacter(properties, radicals)).toEqual({ strokeCount: 8, radical: '讠', radicalNumber: 149 })
  })

  it('leaves empty what Unihan does not have', () => {
    expect(toUnihanCharacter(new Map(), radicals)).toEqual({})
  })
})
