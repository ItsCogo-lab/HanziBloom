import { describe, expect, it } from 'vitest'
import { createDictionary, getCharacter, getWord } from '../features/dictionary/dictionary.ts'
import { validateDictionaryData } from '../features/dictionary/validation.ts'
import { allCharacters, allWords } from './index.ts'

describe('dataset', () => {
  it('has no consistency errors', () => {
    expect(validateDictionaryData(allCharacters, allWords)).toEqual([])
  })

  /*
   * Words per level in the clem109/hsk-vocabulary list. They are not
   * exactly the official counts (150/150/300/600): HSK 2 loses 打篮球 (not
   * in CC-CEDICT), HSK 3 comes with 299 and HSK 4 with 601, of which 3 are
   * repeats (等, 对, 过). See docs/DATA_CONFLICTS.md.
   */
  it.each([
    [1, 150],
    [2, 149],
    [3, 299],
    [4, 598],
  ])('HSK %i has %i words', (level, count) => {
    expect(allWords.filter((word) => word.hskLevel === level)).toHaveLength(count)
  })

  it('splits the HSK list homographs into separate words', () => {
    const dictionary = createDictionary(allCharacters, allWords)
    expect(getWord(dictionary, '长[cháng]')?.meanings.en[0]).toMatch(/length|long/)
    expect(getWord(dictionary, '长[zhǎng]')).toMatchObject({ pinyin: 'zhǎng', hskLevel: 2 })
    expect(getWord(dictionary, '长')).toBeUndefined()
    expect(getCharacter(dictionary, '长')?.pinyin).toEqual(['cháng', 'zhǎng'])
  })

  it('gives every entry an HSK level', () => {
    const withoutLevel = [...allCharacters, ...allWords].filter((entry) => entry.hskLevel === undefined)
    expect(withoutLevel.map((entry) => entry.id)).toEqual([])
  })

  it('includes every character of the words', () => {
    const charactersInWords = new Set(allWords.flatMap((word) => Array.from(word.hanzi)))

    expect(allCharacters).toHaveLength(charactersInWords.size)
  })

  it('has the expected data in known entries', () => {
    const dictionary = createDictionary(allCharacters, allWords)

    expect(getWord(dictionary, '谢谢')).toMatchObject({ pinyin: 'xiè xie', meanings: { en: ['to thank', 'thanks', 'thank you'] } })
    expect(getWord(dictionary, '苹果')?.meanings.en).toEqual(['apple'])
    expect(getCharacter(dictionary, '西')?.pinyin).toEqual(['xī'])
    expect(getCharacter(dictionary, '吗')?.pinyin).toEqual(['ma'])
  })
})
