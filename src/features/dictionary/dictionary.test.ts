import { describe, expect, it } from 'vitest'
import {
  createDictionary,
  formatPinyin,
  getCharacter,
  getCharactersOfWord,
  getMeanings,
  getWord,
  getWordsWithCharacter,
  listCharacters,
  listWords,
} from './dictionary.ts'
import { testCharacters, testWords } from './testData.ts'
import type { Character } from './types.ts'

const dictionary = createDictionary(testCharacters, testWords)

function hanziOf(entries: { hanzi: string }[]): string[] {
  return entries.map((entry) => entry.hanzi)
}

describe('getCharacter / getWord', () => {
  it('finds an entry by its id', () => {
    expect(getCharacter(dictionary, '你')?.pinyin).toEqual(['nǐ'])
    expect(getWord(dictionary, '你好')?.pinyin).toBe('nǐ hǎo')
  })

  it('returns undefined if the id does not exist', () => {
    expect(getCharacter(dictionary, '龙')).toBeUndefined()
    expect(getWord(dictionary, '龙')).toBeUndefined()
  })

  it('tells the character 好 apart from the word 好', () => {
    expect(getCharacter(dictionary, '好')).toBeDefined()
    expect(getWord(dictionary, '好')).toBeDefined()
  })
})

describe('listCharacters / listWords', () => {
  it('lists all entries in dataset order', () => {
    expect(hanziOf(listCharacters(dictionary))).toEqual(['你', '好', '谢', '了'])
    expect(hanziOf(listWords(dictionary))).toEqual(['你好', '好', '谢谢'])
  })

  it('filters by HSK level', () => {
    const level2Character: Character = {
      id: '吃',
      hanzi: '吃',
      pinyin: ['chī'],
      meanings: { en: ['to eat'] },
      hskLevel: 2,
    }
    const mixed = createDictionary([...testCharacters, level2Character], testWords)

    expect(hanziOf(listCharacters(mixed, 2))).toEqual(['吃'])
    expect(listCharacters(mixed, 1)).toHaveLength(testCharacters.length)
    expect(listWords(mixed, 3)).toEqual([])
  })
})

describe('getCharactersOfWord', () => {
  it('returns the word\'s characters in order', () => {
    const word = getWord(dictionary, '你好')!

    expect(hanziOf(getCharactersOfWord(dictionary, word))).toEqual(['你', '好'])
  })

  it('does not repeat characters', () => {
    const word = getWord(dictionary, '谢谢')!

    expect(hanziOf(getCharactersOfWord(dictionary, word))).toEqual(['谢'])
  })
})

describe('getWordsWithCharacter', () => {
  it('returns the words that contain the character', () => {
    expect(hanziOf(getWordsWithCharacter(dictionary, '好'))).toEqual(['你好', '好'])
  })

  it('returns an empty list if no word contains it', () => {
    expect(getWordsWithCharacter(dictionary, '了')).toEqual([])
  })
})

describe('getMeanings', () => {
  it('returns the English meanings by default', () => {
    expect(getMeanings({ en: ['thanks'], es: ['gracias'] })).toEqual(['thanks'])
  })

  it('returns the requested language if it exists', () => {
    expect(getMeanings({ en: ['thanks'], es: ['gracias'] }, 'es')).toEqual(['gracias'])
  })

  it('falls back to English if the requested language is missing', () => {
    expect(getMeanings({ en: ['thanks'] }, 'ca')).toEqual(['thanks'])
  })
})

describe('formatPinyin', () => {
  it('shows a word\'s pinyin as is', () => {
    expect(formatPinyin(getWord(dictionary, '你好')!)).toBe('nǐ hǎo')
  })

  it('separates a character\'s readings with commas', () => {
    expect(formatPinyin(getCharacter(dictionary, '了')!)).toBe('le, liǎo')
  })
})
