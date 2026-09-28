import { describe, expect, it } from 'vitest'
import { makeMeAHanziFixture } from '../fixtures/makemeahanzi.ts'
import { parseMakeMeAHanzi } from './makemeahanzi.ts'

describe('adaptador de Make Me a Hanzi', () => {
  const data = parseMakeMeAHanzi(makeMeAHanziFixture, new Set(['柠', '木']))

  it('da la descomposición, la etimología pictofonética y el radical de 柠', () => {
    expect(data.get('柠')).toEqual({
      radical: '木',
      decomposition: '⿰木宁',
      etymology: { type: 'pictophonetic', hint: 'tree', semantic: '木', phonetic: '宁' },
    })
  })

  it('no crea campos vacíos cuando la fuente no los tiene', () => {
    expect(data.get('木')?.etymology).toEqual({ type: 'pictographic', hint: 'A tree' })
  })

  it('solo lee los caracteres pedidos', () => {
    expect(data.has('好')).toBe(false)
  })

  it('descarta las descomposiciones desconocidas', () => {
    const line = JSON.stringify({ character: '𠀀', radical: '一', decomposition: '？', etymology: null })
    expect(parseMakeMeAHanzi(line, new Set(['𠀀'])).get('𠀀')).toEqual({ radical: '一' })
  })

  it('falla con un tipo de etimología desconocido', () => {
    const line = JSON.stringify({ character: '𠀀', radical: '一', decomposition: '？', etymology: { type: 'other' } })
    expect(() => parseMakeMeAHanzi(line, new Set(['𠀀']))).toThrow(/other/)
  })
})
