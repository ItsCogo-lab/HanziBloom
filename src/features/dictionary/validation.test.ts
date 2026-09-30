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
  it('finds no problems in correct data', () => {
    expect(validateDictionaryData(testCharacters, testWords)).toEqual([])
  })

  it('detects duplicate ids', () => {
    expect(validateDictionaryData([validCharacter, validCharacter], [])).toEqual([
      'Character "你": duplicate id',
    ])
  })

  it('detects an id different from the hanzi', () => {
    expect(validateDictionaryData([{ ...validCharacter, id: 'ni' }], [])).toContain(
      'Character "ni": the id must equal the hanzi',
    )
  })

  it('detects a character with more than one hanzi', () => {
    expect(validateDictionaryData([{ ...validCharacter, id: '你好', hanzi: '你好' }], [])).toEqual([
      'Character "你好": must be a single character',
    ])
  })

  it('detects empty pinyin and meanings', () => {
    const problems = validateDictionaryData([{ ...validCharacter, pinyin: [], meanings: { en: [' '] } }], [])

    expect(problems).toEqual(['Character "你": missing pinyin', 'Character "你": missing English meaning'])
  })

  it('detects an invalid stroke count', () => {
    expect(validateDictionaryData([{ ...validCharacter, strokeCount: 0 }], [])).toEqual([
      'Character "你": invalid stroke count',
    ])
  })

  it('detects words with characters that are not in the dataset', () => {
    const word: Word = { id: '你们', hanzi: '你们', pinyin: 'nǐmen', meanings: { en: ['you (plural)'] }, hskLevel: 1 }

    expect(validateDictionaryData([validCharacter], [word])).toEqual([
      'Word "你们": the character "们" is not in the dataset',
    ])
  })
})

describe('validateDictionaryData with the source data', () => {
  const ningmengCharacters = [ningCharacter, { ...ningCharacter, id: '檬', hanzi: '檬' }]

  it('accepts the full entry for 柠', () => {
    expect(validateDictionaryData(ningmengCharacters, [ningmengWord])).toEqual([])
  })

  it.each([
    [{ hskLevel: 7 }, 'invalid HSK level'],
    [{ radicalNumber: 215 }, 'invalid radical number'],
    [{ radicalNumber: 0 }, 'invalid radical number'],
    [{ radical: '木木' }, 'invalid radical'],
    [{ traditional: [] }, 'invalid traditional form'],
    [{ decomposition: '⿰木' }, 'invalid decomposition'],
    [{ etymology: { type: 'other' } }, 'invalid etymology type'],
    [{ etymology: { type: 'pictophonetic', semantic: '木木' } }, 'invalid etymology component'],
    [{ strokeCount: 2.5 }, 'invalid stroke count'],
  ])('detects %o', (change, problem) => {
    const character = { ...ningCharacter, ...change } as Character
    expect(validateDictionaryData([character], [])).toEqual([`Character "柠": ${problem}`])
  })

  it('detects characters that are not Chinese', () => {
    expect(validateDictionaryData([{ ...validCharacter, id: 'a', hanzi: 'a' }], [])).toEqual([
      'Character "a": not a Chinese character',
    ])
  })

  it('detects empty values that should not have been saved', () => {
    const character = { ...ningCharacter, radical: undefined, decomposition: null } as unknown as Character
    expect(validateDictionaryData([character], [])).toEqual(['Character "柠": empty fields (radical, decomposition)'])
  })

  it('detects a word traditional form with a different length', () => {
    expect(validateDictionaryData(ningmengCharacters, [{ ...ningmengWord, traditional: '檸' }])).toEqual([
      'Word "柠檬": invalid traditional form',
    ])
  })
})

describe('validateExampleSet', () => {
  const sentence = testExampleSet.sentences[0]!
  const withSentence = (change: object): ExampleSet => ({ ...testExampleSet, sentences: [{ ...sentence, ...change }] })

  it('accepts correct sentences', () => {
    expect(validateExampleSet(testExampleSet, [ningmengWord])).toEqual([])
  })

  it('detects invalid Tatoeba ids and repeated sentences', () => {
    expect(validateExampleSet(withSentence({ tatoebaId: -1 }), [ningmengWord])).toEqual([
      'Sentence -1: invalid Tatoeba id',
    ])
    const repeated = { ...testExampleSet, sentences: [sentence, sentence] }
    expect(validateExampleSet(repeated, [ningmengWord])).toEqual(['Sentence 8934441: repeated'])
  })

  it('detects words that do not exist or are not in the sentence', () => {
    expect(validateExampleSet(testExampleSet, [])).toEqual(['Sentence 8934441: the word "柠檬" is not in the dataset'])
    expect(validateExampleSet(withSentence({ zh: '很酸。' }), [ningmengWord])).toEqual([
      'Sentence 8934441: does not contain the word "柠檬"',
    ])
  })

  it('detects empty texts or authors', () => {
    expect(validateExampleSet(withSentence({ en: '', author: ' ' }), [ningmengWord])).toEqual([
      'Sentence 8934441: missing text',
      'Sentence 8934441: missing author',
      'Sentence 8934441: empty fields (author, en)',
    ])
  })
})
