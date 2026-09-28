import { describe, expect, it } from 'vitest'
import { cedictFixture } from '../fixtures/cedict.ts'
import { cleanMeaning, createCedictIndex, findEntries, readingOf, traditionalOf, usableMeanings } from './cedict.ts'

const index = createCedictIndex(cedictFixture)

describe('adaptador de CC-CEDICT', () => {
  it('agrupa por simplificado y pasa el pinyin a marcas de tono', () => {
    expect(index.get('柠檬')).toEqual([{ traditional: '檸檬', simplified: '柠檬', pinyin: 'níng méng', english: ['lemon'] }])
  })

  it('busca por hanzi y pinyin sin mezclar nombres propios', () => {
    const entries = findEntries(index, '柠檬', 'níng méng')
    expect(usableMeanings(entries)).toEqual(['lemon'])
    expect(traditionalOf(entries)).toBe('檸檬')
  })

  it('respeta la forma tradicional preferida (里 → 裡)', () => {
    expect(findEntries(index, '里', 'lǐ').map((entry) => entry.traditional)).toEqual(['裡'])
  })

  it('ignora las entradas que solo son notas al elegir la forma tradicional', () => {
    const entries = index.get('里')!.filter((entry) => entry.pinyin === 'lǐ')
    expect(entries.map((entry) => entry.traditional)).toEqual(['裏', '裡'])
    expect(traditionalOf(entries)).toBe('裡')
  })

  it('no elige forma tradicional si CC-CEDICT da dos (回 y 迴)', () => {
    expect(traditionalOf(findEntries(index, '回', 'huí'))).toBeUndefined()
  })

  it('conserva las notas si una lectura solo tiene notas (柠: "used in 柠檬")', () => {
    expect(usableMeanings(findEntries(index, '柠', 'níng'))).toEqual(['used in 柠檬'])
  })

  it('limpia la notación interna', () => {
    expect(cleanMeaning('used in 檸檬|柠檬[ning2 meng2]')).toBe('used in 柠檬')
  })

  it('encuentra la lectura de un carácter dentro de una palabra', () => {
    expect(readingOf(index, '好', 'hǎo')).toBe('hǎo')
    expect(readingOf(index, '柠', 'níng')).toBe('níng')
    expect(readingOf(index, '柠', 'nìng')).toBeUndefined()
  })

  it('acepta el tono neutro de CC-CEDICT donde la lista HSK pone el tono (关系 guān xì)', () => {
    expect(usableMeanings(findEntries(index, '关系', 'guān xì'))).toEqual(['relation', 'relationship'])
    expect(findEntries(index, '关系', 'guǎn xì')).toEqual([])
  })

  it('usa las lecturas que CC-CEDICT anota con "also pr." (钥 yào)', () => {
    expect(readingOf(index, '钥', 'yào')).toBe('yào')
    expect(usableMeanings(findEntries(index, '钥', 'yào'))).toEqual(['key'])
    expect(readingOf(index, '钥', 'yǎo')).toBeUndefined()
  })
})
