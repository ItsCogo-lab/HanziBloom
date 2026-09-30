import { describe, expect, it } from 'vitest'
import { hskDictionary } from './hskDictionary.ts'
import { getCharacter, getWord } from './dictionary.ts'
import { getCharacterTones } from './tones.ts'
import type { Character, Word } from './types.ts'

function word(hanzi: string, pinyin: string): Word {
  return { id: hanzi, hanzi, pinyin, meanings: { en: ['x'] }, hskLevel: 1 }
}

function character(hanzi: string, pinyin: string[]): Character {
  return { id: hanzi, hanzi, pinyin, meanings: { en: ['x'] }, hskLevel: 1 }
}

describe('getCharacterTones', () => {
  it('in a word, each character takes the tone of its syllable', () => {
    expect(getCharacterTones(word('你好', 'nǐ hǎo'))).toEqual([3, 3])
    expect(getCharacterTones(word('妈妈', 'mā ma'))).toEqual([1, 5])
  })

  it('recognizes the neutral tone', () => {
    expect(getCharacterTones(word('谢谢', 'xiè xie'))).toEqual([4, 5])
    expect(getCharacterTones(character('吗', ['ma']))).toEqual([5])
  })

  it('does not color without reliable info: mismatched syllables or no tone', () => {
    expect(getCharacterTones(word('谢谢', 'xièxie'))).toEqual([undefined, undefined])
    expect(getCharacterTones(word('一会儿', 'yī huì r'))).toEqual([1, 4, undefined])
  })

  it('a character with readings of different tones is not colored (了: le, liǎo)', () => {
    expect(getCharacterTones(character('了', ['le', 'liǎo']))).toEqual([undefined])
    expect(getCharacterTones(character('好', ['hǎo', 'hào']))).toEqual([undefined])
  })

  it('a character with several readings of the same tone is colored', () => {
    expect(getCharacterTones(character('X', ['shì', 'sì']))).toEqual([4])
  })

  it('a polyphonic character takes the tone of each word (长 cháng / zhǎng)', () => {
    expect(getCharacterTones(getCharacter(hskDictionary, '长')!)).toEqual([undefined])
    expect(getCharacterTones(getWord(hskDictionary, '长[cháng]')!)).toEqual([2])
    expect(getCharacterTones(getWord(hskDictionary, '长[zhǎng]')!)).toEqual([3])
    expect(getCharacterTones(getWord(hskDictionary, '校长')!)).toEqual([4, 3])
    expect(getCharacterTones(getWord(hskDictionary, '长城')!)).toEqual([2, 2])
  })

  it('works with every word in the dataset: one syllable per character', () => {
    const words = [...hskDictionary.words.values()]
    const withoutTones = words.filter((entry) => getCharacterTones(entry).every((tone) => tone === undefined))
    expect(withoutTones).toEqual([])
  })
})
