import { describe, expect, it } from 'vitest'
import { parseHskList } from './hsk.ts'

describe('parseHskList', () => {
  it('lee hanzi y pinyin e ignora las traducciones de la lista', () => {
    const json = JSON.stringify([{ id: 1, hanzi: '爱', pinyin: 'ài', translations: ['to love'] }])
    expect(parseHskList(json)).toEqual([{ hanzi: '爱', pinyin: 'ài' }])
  })

  it('falla si una entrada no tiene hanzi o pinyin', () => {
    expect(() => parseHskList(JSON.stringify([{ id: 1, hanzi: '爱' }]))).toThrow(/entrada 0/)
  })
})
