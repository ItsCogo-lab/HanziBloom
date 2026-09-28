import { describe, expect, it } from 'vitest'
import { getSearchRank, matchesSearch, searchItems } from './search.ts'
import { hskStudyItems } from './hskDictionary.ts'
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

describe('searchItems', () => {
  const hanziOf = (query: string, limit = 5) => searchItems(hskStudyItems, query, limit).map((item) => item.entry.hanzi)

  it('con un carácter: primero el carácter, luego las palabras que empiezan por él y luego las que lo contienen', () => {
    const results = searchItems(hskStudyItems, '果')
    expect(results[0]).toMatchObject({ kind: 'character', entry: { hanzi: '果' } })
    const words = results.filter((item) => item.kind === 'word').map((item) => item.entry.hanzi)
    expect(words.indexOf('果汁')).toBeLessThan(words.indexOf('苹果'))
    expect(words).toContain('水果')
  })

  it('busca palabras enteras', () => {
    expect(hanziOf('苹果', 1)).toEqual(['苹果'])
  })

  it('por pinyin sin tonos, lo exacto primero', () => {
    expect(hanziOf('pingguo', 1)).toEqual(['苹果'])
    expect(hanziOf('ping guo', 1)).toEqual(['苹果'])
    expect(searchItems(hskStudyItems, 'hao')[0]).toMatchObject({ kind: 'character', entry: { hanzi: '好' } })
  })

  it('por significado en inglés, la palabra exacta antes que la que solo la contiene', () => {
    expect(hanziOf('apple', 1)).toEqual(['苹果'])
    expect(getSearchRank(testWords[0]!, 'hello')).toBeLessThan(getSearchRank(testWords[0]!, 'hell')!)
  })

  it('sin coincidencias devuelve una lista vacía', () => {
    expect(searchItems(hskStudyItems, 'zzzz')).toEqual([])
    expect(searchItems(hskStudyItems, '   ')).toEqual([])
  })
})
