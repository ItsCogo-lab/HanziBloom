import { describe, expect, it } from 'vitest'
import { createDictionary, getCharacter, getWord } from '../features/dictionary/dictionary.ts'
import { validateDictionaryData } from '../features/dictionary/validation.ts'
import { allCharacters, allWords } from './index.ts'

describe('dataset', () => {
  it('no tiene errores de coherencia', () => {
    expect(validateDictionaryData(allCharacters, allWords)).toEqual([])
  })

  it('contiene las 150 palabras de HSK 1 (HSK 2.0)', () => {
    expect(allWords.filter((word) => word.hskLevel === 1)).toHaveLength(150)
  })

  it('incluye todos los caracteres de las palabras de HSK 1', () => {
    const charactersInWords = new Set(allWords.flatMap((word) => Array.from(word.hanzi)))

    expect(allCharacters).toHaveLength(charactersInWords.size)
  })

  it('tiene los datos esperados en entradas conocidas', () => {
    const dictionary = createDictionary(allCharacters, allWords)

    expect(getWord(dictionary, '谢谢')).toMatchObject({ pinyin: 'xiè xie', meanings: { en: ['to thank', 'thanks', 'thank you'] } })
    expect(getWord(dictionary, '苹果')?.meanings.en).toEqual(['apple'])
    expect(getCharacter(dictionary, '西')?.pinyin).toEqual(['xī'])
    expect(getCharacter(dictionary, '吗')?.pinyin).toEqual(['ma'])
  })
})
