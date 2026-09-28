import { describe, expect, it } from 'vitest'
import { numberedPinyinToToneMarks, numberedSyllableToToneMarks, removeToneMarks } from './pinyin.ts'

describe('numberedSyllableToToneMarks', () => {
  it.each([
    ['ma1', 'mā'],
    ['hao3', 'hǎo'],
    ['xie4', 'xiè'],
    ['gou3', 'gǒu'],
    ['shui3', 'shuǐ'],
    ['liu4', 'liù'],
    ['nü3', 'nǚ'],
    ['lu:4', 'lǜ'],
    ['nv3', 'nǚ'],
    ['er2', 'ér'],
    ['Zhong1', 'Zhōng'],
  ])('%s → %s', (numbered, marked) => {
    expect(numberedSyllableToToneMarks(numbered)).toBe(marked)
  })

  it('el tono 5 (neutro) no lleva marca', () => {
    expect(numberedSyllableToToneMarks('de5')).toBe('de')
  })

  it('deja igual lo que no es una sílaba numerada', () => {
    expect(numberedSyllableToToneMarks('hǎo')).toBe('hǎo')
  })
})

describe('numberedPinyinToToneMarks', () => {
  it('convierte varias sílabas', () => {
    expect(numberedPinyinToToneMarks('dong1 xi5')).toBe('dōng xi')
  })
})

describe('removeToneMarks', () => {
  it('quita tonos y mayúsculas pero conserva la ü', () => {
    expect(removeToneMarks('Nǐ hǎo')).toBe('ni hao')
    expect(removeToneMarks('nǚ ér')).toBe('nü er')
  })
})
