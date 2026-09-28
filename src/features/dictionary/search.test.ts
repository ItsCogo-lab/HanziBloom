import { describe, expect, it } from 'vitest'
import { matchesSearch } from './search.ts'
import { testCharacters, testWords } from './testData.ts'

const nihao = testWords[0]! // 你好, nǐ hǎo, hello
const le = testCharacters[3]! // 了, le / liǎo

describe('matchesSearch', () => {
  it('sin texto coincide todo', () => {
    expect(matchesSearch(nihao, '   ')).toBe(true)
  })

  it('busca por hanzi', () => {
    expect(matchesSearch(nihao, '好')).toBe(true)
    expect(matchesSearch(nihao, '谢')).toBe(false)
  })

  it('busca por pinyin con tonos, sin tonos o con números', () => {
    expect(matchesSearch(nihao, 'nǐ hǎo')).toBe(true)
    expect(matchesSearch(nihao, 'nihao')).toBe(true)
    expect(matchesSearch(nihao, 'ni3 hao3')).toBe(true)
    expect(matchesSearch(nihao, 'HAO')).toBe(true)
  })

  it('en caracteres busca en todas las lecturas', () => {
    expect(matchesSearch(le, 'liao')).toBe(true)
  })

  it('busca por significado sin distinguir mayúsculas', () => {
    expect(matchesSearch(nihao, 'Hello')).toBe(true)
    expect(matchesSearch(nihao, 'thanks')).toBe(false)
  })
})
