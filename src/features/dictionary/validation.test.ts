import { describe, expect, it } from 'vitest'
import { ningCharacter, ningmengWord, testCharacters, testExampleSet, testWords } from './testData.ts'
import type { Character, ExampleSet, Word } from './types.ts'
import { validateDictionaryData, validateExampleSet } from './validation.ts'

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

describe('validateDictionaryData con los datos de las fuentes', () => {
  const ningmengCharacters = [ningCharacter, { ...ningCharacter, id: '檬', hanzi: '檬' }]

  it('acepta la ficha completa de 柠', () => {
    expect(validateDictionaryData(ningmengCharacters, [ningmengWord])).toEqual([])
  })

  it.each([
    [{ hskLevel: 7 }, 'nivel HSK no válido'],
    [{ radicalNumber: 215 }, 'número de radical no válido'],
    [{ radicalNumber: 0 }, 'número de radical no válido'],
    [{ radical: '木木' }, 'radical no válido'],
    [{ traditional: [] }, 'forma tradicional no válida'],
    [{ decomposition: '⿰木' }, 'descomposición no válida'],
    [{ etymology: { type: 'other' } }, 'tipo de etimología no válido'],
    [{ etymology: { type: 'pictophonetic', semantic: '木木' } }, 'componente de la etimología no válido'],
    [{ strokeCount: 2.5 }, 'número de trazos no válido'],
  ])('detecta %o', (change, problem) => {
    const character = { ...ningCharacter, ...change } as Character
    expect(validateDictionaryData([character], [])).toEqual([`Carácter "柠": ${problem}`])
  })

  it('detecta caracteres que no son chinos', () => {
    expect(validateDictionaryData([{ ...validCharacter, id: 'a', hanzi: 'a' }], [])).toEqual([
      'Carácter "a": no es un carácter chino',
    ])
  })

  it('detecta valores vacíos que no deberían haberse guardado', () => {
    const character = { ...ningCharacter, radical: undefined, decomposition: null } as unknown as Character
    expect(validateDictionaryData([character], [])).toEqual(['Carácter "柠": campos vacíos (radical, decomposition)'])
  })

  it('detecta una forma tradicional de palabra con otra longitud', () => {
    expect(validateDictionaryData(ningmengCharacters, [{ ...ningmengWord, traditional: '檸' }])).toEqual([
      'Palabra "柠檬": forma tradicional no válida',
    ])
  })
})

describe('validateExampleSet', () => {
  const sentence = testExampleSet.sentences[0]!
  const withSentence = (change: object): ExampleSet => ({ ...testExampleSet, sentences: [{ ...sentence, ...change }] })

  it('acepta frases correctas', () => {
    expect(validateExampleSet(testExampleSet, [ningmengWord])).toEqual([])
  })

  it('detecta ids de Tatoeba no válidos y frases repetidas', () => {
    expect(validateExampleSet(withSentence({ tatoebaId: -1 }), [ningmengWord])).toEqual([
      'Frase -1: id de Tatoeba no válido',
    ])
    const repeated = { ...testExampleSet, sentences: [sentence, sentence] }
    expect(validateExampleSet(repeated, [ningmengWord])).toEqual(['Frase 8934441: repetida'])
  })

  it('detecta palabras que no existen o que no están en la frase', () => {
    expect(validateExampleSet(testExampleSet, [])).toEqual(['Frase 8934441: la palabra "柠檬" no está en el dataset'])
    expect(validateExampleSet(withSentence({ zh: '很酸。' }), [ningmengWord])).toEqual([
      'Frase 8934441: no contiene la palabra "柠檬"',
    ])
  })

  it('detecta textos o autores vacíos', () => {
    expect(validateExampleSet(withSentence({ en: '', author: ' ' }), [ningmengWord])).toEqual([
      'Frase 8934441: falta el texto',
      'Frase 8934441: falta el autor',
      'Frase 8934441: campos vacíos (author, en)',
    ])
  })
})
