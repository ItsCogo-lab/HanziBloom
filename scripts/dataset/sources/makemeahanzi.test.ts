import { describe, expect, it } from 'vitest'
import { makeMeAHanziFixture } from '../fixtures/makemeahanzi.ts'
import { parseMakeMeAHanzi } from './makemeahanzi.ts'

describe('Make Me a Hanzi adapter', () => {
  const data = parseMakeMeAHanzi(makeMeAHanziFixture, new Set(['柠', '木']))

  it('gives the decomposition, pictophonetic etymology and radical of 柠', () => {
    expect(data.get('柠')).toEqual({
      radical: '木',
      decomposition: '⿰木宁',
      etymology: { type: 'pictophonetic', hint: 'tree', semantic: '木', phonetic: '宁' },
    })
  })

  it('does not create empty fields when the source does not have them', () => {
    expect(data.get('木')?.etymology).toEqual({ type: 'pictographic', hint: 'A tree' })
  })

  it('only reads the requested characters', () => {
    expect(data.has('好')).toBe(false)
  })

  it('discards unknown decompositions', () => {
    const line = JSON.stringify({ character: '𠀀', radical: '一', decomposition: '？', etymology: null })
    expect(parseMakeMeAHanzi(line, new Set(['𠀀'])).get('𠀀')).toEqual({ radical: '一' })
  })

  it('removes the line breaks some entries have in their components', () => {
    const line = JSON.stringify({
      character: '瓣',
      radical: '瓜',
      decomposition: '⿲辛瓜辛',
      etymology: { type: 'pictophonetic', phonetic: '\n\n辡', semantic: '瓜', hint: 'melon' },
    })
    expect(parseMakeMeAHanzi(line, new Set(['瓣'])).get('瓣')?.etymology).toEqual({
      type: 'pictophonetic',
      hint: 'melon',
      semantic: '瓜',
      phonetic: '辡',
    })
  })

  it('fails with an unknown etymology type', () => {
    const line = JSON.stringify({ character: '𠀀', radical: '一', decomposition: '？', etymology: { type: 'other' } })
    expect(() => parseMakeMeAHanzi(line, new Set(['𠀀']))).toThrow(/other/)
  })
})
