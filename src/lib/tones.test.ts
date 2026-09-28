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
  ])('%s → tono %i', (syllable, tone) => {
    expect(getSyllableTone(syllable)).toBe(tone)
  })

  it('no adivina si no es una sílaba o tiene dos marcas', () => {
    expect(getSyllableTone('r')).toBeUndefined() // 一会儿 yī huì r
    expect(getSyllableTone('')).toBeUndefined()
    expect(getSyllableTone('mǎà')).toBeUndefined()
    expect(getSyllableTone('ni3')).toBeUndefined()
  })
})

describe('splitSyllables', () => {
  it('separa por espacios', () => {
    expect(splitSyllables(' nǐ  hǎo ')).toEqual(['nǐ', 'hǎo'])
  })
})

describe('toToneNumbers', () => {
  it('pone el número de tono detrás de cada sílaba', () => {
    expect(toToneNumbers('nǐ hǎo')).toBe('ni3 hao3')
    expect(toToneNumbers('xiè xie')).toBe('xie4 xie5')
    expect(toToneNumbers('lǜ')).toBe('lü4')
    expect(toToneNumbers('Běi jīng')).toBe('Bei3 jing1')
  })

  it('deja tal cual lo que no es una sílaba', () => {
    expect(toToneNumbers('yī huì r')).toBe('yi1 hui4 r')
    expect(toToneNumbers('le, liǎo')).toBe('le, liao3')
  })
})
