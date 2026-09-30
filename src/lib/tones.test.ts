import { describe, expect, it } from 'vitest'
import { getSyllableTone, splitSyllables, toToneNumbers } from './tones.ts'

describe('getSyllableTone', () => {
  it.each([
    ['mā', 1],
    ['má', 2],
    ['mǎ', 3],
    ['mà', 4],
    ['ma', 5],
    ['lǜ', 4],
    ['nǚ', 3],
    ['lü', 5],
    ['Běi', 3],
    ['xiè', 4],
  ])('%s → tone %i', (syllable, tone) => {
    expect(getSyllableTone(syllable)).toBe(tone)
  })

  it("doesn't guess if it isn't a syllable or has two marks", () => {
    expect(getSyllableTone('r')).toBeUndefined() // 一会儿 yī huì r
    expect(getSyllableTone('')).toBeUndefined()
    expect(getSyllableTone('mǎà')).toBeUndefined()
    expect(getSyllableTone('ni3')).toBeUndefined()
  })
})

describe('splitSyllables', () => {
  it('splits on spaces', () => {
    expect(splitSyllables(' nǐ  hǎo ')).toEqual(['nǐ', 'hǎo'])
  })
})

describe('toToneNumbers', () => {
  it('puts the tone number after each syllable', () => {
    expect(toToneNumbers('nǐ hǎo')).toBe('ni3 hao3')
    expect(toToneNumbers('xiè xie')).toBe('xie4 xie5')
    expect(toToneNumbers('lǜ')).toBe('lü4')
    expect(toToneNumbers('Běi jīng')).toBe('Bei3 jing1')
  })

  it("leaves anything that isn't a syllable as is", () => {
    expect(toToneNumbers('yī huì r')).toBe('yi1 hui4 r')
    expect(toToneNumbers('le, liǎo')).toBe('le, liao3')
  })
})
