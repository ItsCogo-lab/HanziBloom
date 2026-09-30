import { describe, expect, it } from 'vitest'
import { parseHskList } from './hsk.ts'

describe('parseHskList', () => {
  it("reads hanzi and pinyin and ignores the list's translations", () => {
    const json = JSON.stringify([{ id: 1, hanzi: '爱', pinyin: 'ài', translations: ['to love'] }])
    expect(parseHskList(json)).toEqual([{ hanzi: '爱', pinyin: 'ài' }])
  })

  it('fails if an entry has no hanzi or pinyin', () => {
    expect(() => parseHskList(JSON.stringify([{ id: 1, hanzi: '爱' }]))).toThrow(/entry 0/)
  })
})
