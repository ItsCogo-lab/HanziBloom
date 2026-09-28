import { describe, expect, it } from 'vitest'
import {
  createDictionary,
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
  it('encuentra una entrada por su id', () => {
    expect(getCharacter(dictionary, '你')?.pinyin).toEqual(['nǐ'])
    expect(getWord(dictionary, '你好')?.pinyin).toBe('nǐ hǎo')
  })

  it('devuelve undefined si el id no existe', () => {
    expect(getCharacter(dictionary, '龙')).toBeUndefined()
    expect(getWord(dictionary, '龙')).toBeUndefined()
  })

  it('distingue el carácter 好 de la palabra 好', () => {
    expect(getCharacter(dictionary, '好')).toBeDefined()
    expect(getWord(dictionary, '好')).toBeDefined()
  })
})

describe('listCharacters / listWords', () => {
  it('lista todas las entradas en el orden del dataset', () => {
    expect(hanziOf(listCharacters(dictionary))).toEqual(['你', '好', '谢', '了'])
    expect(hanziOf(listWords(dictionary))).toEqual(['你好', '好', '谢谢'])
  })

  it('filtra por nivel HSK', () => {
    const level2Character: Character = {
      id: '吃',
      hanzi: '吃',
      pinyin: ['chī'],
      meanings: { es: ['comer'] },
      hskLevel: 2,
    }
    const mixed = createDictionary([...testCharacters, level2Character], testWords)

    expect(hanziOf(listCharacters(mixed, 2))).toEqual(['吃'])
    expect(listCharacters(mixed, 1)).toHaveLength(testCharacters.length)
    expect(listWords(mixed, 3)).toEqual([])
  })
})

describe('getCharactersOfWord', () => {
  it('devuelve los caracteres de la palabra en orden', () => {
    const word = getWord(dictionary, '你好')!

    expect(hanziOf(getCharactersOfWord(dictionary, word))).toEqual(['你', '好'])
  })

  it('no repite caracteres', () => {
    const word = getWord(dictionary, '谢谢')!

    expect(hanziOf(getCharactersOfWord(dictionary, word))).toEqual(['谢'])
  })
})

describe('getWordsWithCharacter', () => {
  it('devuelve las palabras que contienen el carácter', () => {
    expect(hanziOf(getWordsWithCharacter(dictionary, '好'))).toEqual(['你好', '好'])
  })

  it('devuelve una lista vacía si ninguna palabra lo contiene', () => {
    expect(getWordsWithCharacter(dictionary, '了')).toEqual([])
  })
})

describe('getMeanings', () => {
  it('devuelve los significados en español por defecto', () => {
    expect(getMeanings({ es: ['gracias'], en: ['thanks'] })).toEqual(['gracias'])
  })

  it('devuelve el idioma pedido si existe', () => {
    expect(getMeanings({ es: ['gracias'], en: ['thanks'] }, 'en')).toEqual(['thanks'])
  })

  it('usa el español si falta el idioma pedido', () => {
    expect(getMeanings({ es: ['gracias'] }, 'ca')).toEqual(['gracias'])
  })
})
