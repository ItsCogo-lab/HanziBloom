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

  it('tone 5 (neutral) has no mark', () => {
    expect(numberedSyllableToToneMarks('de5')).toBe('de')
  })

  it("leaves anything that isn't a numbered syllable unchanged", () => {
    expect(numberedSyllableToToneMarks('hǎo')).toBe('hǎo')
  })
})

describe('numberedPinyinToToneMarks', () => {
  it('converts several syllables', () => {
    expect(numberedPinyinToToneMarks('dong1 xi5')).toBe('dōng xi')
  })
})

describe('removeToneMarks', () => {
  it('removes tones and uppercase but keeps the ü', () => {
    expect(removeToneMarks('Nǐ hǎo')).toBe('ni hao')
    expect(removeToneMarks('nǚ ér')).toBe('nü er')
  })
})
