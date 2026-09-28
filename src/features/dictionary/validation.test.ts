import { describe, expect, it } from 'vitest'
import { testCharacters, testWords } from './testData.ts'
import type { Character, Word } from './types.ts'
import { validateDictionaryData } from './validation.ts'

const validCharacter: Character = {
  id: '你',
  hanzi: '你',
  pinyin: ['nǐ'],
  meanings: { en: ['you'] },
  hskLevel: 1,
}

describe('validateDictionaryData', () => {
  it('no encuentra problemas en datos correctos', () => {
    expect(validateDictionaryData(testCharacters, testWords)).toEqual([])
  })

  it('detecta ids duplicados', () => {
    expect(validateDictionaryData([validCharacter, validCharacter], [])).toEqual([
      'Carácter "你": id duplicado',
    ])
  })

  it('detecta un id distinto del hanzi', () => {
    expect(validateDictionaryData([{ ...validCharacter, id: 'ni' }], [])).toContain(
      'Carácter "ni": el id debe ser igual al hanzi',
    )
  })

  it('detecta un carácter con más de un hanzi', () => {
    expect(validateDictionaryData([{ ...validCharacter, id: '你好', hanzi: '你好' }], [])).toEqual([
      'Carácter "你好": debe ser un solo carácter',
    ])
  })

  it('detecta pinyin y significados vacíos', () => {
    const problems = validateDictionaryData([{ ...validCharacter, pinyin: [], meanings: { en: [' '] } }], [])

    expect(problems).toEqual(['Carácter "你": falta el pinyin', 'Carácter "你": falta el significado en inglés'])
  })

  it('detecta un número de trazos no válido', () => {
    expect(validateDictionaryData([{ ...validCharacter, strokeCount: 0 }], [])).toEqual([
      'Carácter "你": número de trazos no válido',
    ])
  })

  it('detecta palabras con caracteres que no están en el dataset', () => {
    const word: Word = { id: '你们', hanzi: '你们', pinyin: 'nǐmen', meanings: { en: ['you (plural)'] }, hskLevel: 1 }

    expect(validateDictionaryData([validCharacter], [word])).toEqual([
      'Palabra "你们": el carácter "们" no está en el dataset',
    ])
  })
})
