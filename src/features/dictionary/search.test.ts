import { describe, expect, it } from 'vitest'
import { getSearchRank, matchesSearch, searchItems } from './search.ts'
import { hskStudyItems } from './hskDictionary.ts'
import { testCharacters, testWords } from './testData.ts'

const nihao = testWords[0]! // 你好, nǐ hǎo, hello
const le = testCharacters[3]! // 了, le / liǎo

describe('matchesSearch', () => {
  it('with no text everything matches', () => {
    expect(matchesSearch(nihao, '   ')).toBe(true)
  })

  it('searches by hanzi', () => {
    expect(matchesSearch(nihao, '好')).toBe(true)
    expect(matchesSearch(nihao, '谢')).toBe(false)
  })

  it('searches by pinyin with tone marks, without them or with numbers', () => {
    expect(matchesSearch(nihao, 'nǐ hǎo')).toBe(true)
    expect(matchesSearch(nihao, 'nihao')).toBe(true)
    expect(matchesSearch(nihao, 'ni3 hao3')).toBe(true)
    expect(matchesSearch(nihao, 'HAO')).toBe(true)
  })

  it('for characters it searches all readings', () => {
    expect(matchesSearch(le, 'liao')).toBe(true)
  })

  it('searches by meaning case-insensitively', () => {
    expect(matchesSearch(nihao, 'Hello')).toBe(true)
    expect(matchesSearch(nihao, 'thanks')).toBe(false)
  })
})

describe('searchItems', () => {
  const hanziOf = (query: string, limit = 5) => searchItems(hskStudyItems, query, limit).map((item) => item.entry.hanzi)

  it('with a character: first the character, then words starting with it, then words containing it', () => {
    const results = searchItems(hskStudyItems, '果')
    expect(results[0]).toMatchObject({ kind: 'character', entry: { hanzi: '果' } })
    const words = results.filter((item) => item.kind === 'word').map((item) => item.entry.hanzi)
    expect(words.indexOf('果汁')).toBeLessThan(words.indexOf('苹果'))
    expect(words).toContain('水果')
  })

  it('searches whole words', () => {
    expect(hanziOf('苹果', 1)).toEqual(['苹果'])
  })

  it('by pinyin without tones, exact matches first', () => {
    expect(hanziOf('pingguo', 1)).toEqual(['苹果'])
    expect(hanziOf('ping guo', 1)).toEqual(['苹果'])
    expect(searchItems(hskStudyItems, 'hao')[0]).toMatchObject({ kind: 'character', entry: { hanzi: '好' } })
  })

  it('by English meaning, the exact word before one that only contains it', () => {
    expect(hanziOf('apple', 1)).toEqual(['苹果'])
    expect(getSearchRank(testWords[0]!, 'hello')).toBeLessThan(getSearchRank(testWords[0]!, 'hell')!)
  })

  it('puts HSK entries before the rest of the dictionary', () => {
    const outside = { kind: 'word' as const, entry: { id: '苹果[Píng guǒ]', hanzi: '苹果', pinyin: 'Píng guǒ', meanings: { en: ['Apple (American tech company)'] } } }
    const results = searchItems([outside, ...hskStudyItems], 'apple')
    expect(results.map((item) => item.entry.id).slice(0, 2)).toEqual(['苹果', '苹果[Píng guǒ]'])
  })

  it('an exact match comes before a partial one from outside HSK', () => {
    const banke = { kind: 'word' as const, entry: { id: '版刻', hanzi: '版刻', pinyin: 'bǎn kè', meanings: { en: ['carving'] } } }
    expect(searchItems([banke, ...hskStudyItems], 'bank')[0]?.entry.hanzi).toBe('银行')
  })

  it('with no matches returns an empty list', () => {
    expect(searchItems(hskStudyItems, 'zzzz')).toEqual([])
    expect(searchItems(hskStudyItems, '   ')).toEqual([])
  })
})
