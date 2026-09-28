import { describe, expect, it } from 'vitest'
import { createDictionary, getCharacter, getWord } from '../features/dictionary/dictionary.ts'
import { validateDictionaryData } from '../features/dictionary/validation.ts'
import { allCharacters, allWords } from './index.ts'

describe('dataset', () => {
  it('no tiene errores de coherencia', () => {
    expect(validateDictionaryData(allCharacters, allWords)).toEqual([])
  })

  /*
   * Palabras por nivel en la lista de clem109/hsk-vocabulary. No son
   * exactamente las oficiales (150/150/300/600): HSK 2 pierde 打篮球 (no está
   * en CC-CEDICT), HSK 3 viene con 299 y HSK 4 con 601, de las que 3 son
   * repeticiones (等, 对, 过). Ver docs/DATA_CONFLICTS.md.
   */
  it.each([
    [1, 150],
    [2, 149],
    [3, 299],
    [4, 598],
  ])('HSK %i tiene %i palabras', (level, count) => {
    expect(allWords.filter((word) => word.hskLevel === level)).toHaveLength(count)
  })

  it('separa los homógrafos de la lista HSK en palabras distintas', () => {
    const dictionary = createDictionary(allCharacters, allWords)
    expect(getWord(dictionary, '长[cháng]')?.meanings.en[0]).toMatch(/length|long/)
    expect(getWord(dictionary, '长[zhǎng]')).toMatchObject({ pinyin: 'zhǎng', hskLevel: 2 })
    expect(getWord(dictionary, '长')).toBeUndefined()
    expect(getCharacter(dictionary, '长')?.pinyin).toEqual(['cháng', 'zhǎng'])
  })

  it('incluye todos los caracteres de las palabras', () => {
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
