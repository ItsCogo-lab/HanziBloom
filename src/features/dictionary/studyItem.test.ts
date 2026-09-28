import { describe, expect, it } from 'vitest'
import { createDictionary } from './dictionary.ts'
import { getStudyItemId, listStudyItems } from './studyItem.ts'
import { testCharacters, testWords } from './testData.ts'

describe('getStudyItemId', () => {
  it('da ids distintos al carácter y a la palabra 好', () => {
    const character = testCharacters.find((entry) => entry.id === '好')!
    const word = testWords.find((entry) => entry.id === '好')!

    expect(getStudyItemId({ kind: 'character', entry: character })).toBe('char:好')
    expect(getStudyItemId({ kind: 'word', entry: word })).toBe('word:好')
  })
})

describe('listStudyItems', () => {
  it('devuelve primero los caracteres y después las palabras', () => {
    const items = listStudyItems(createDictionary(testCharacters, testWords))

    expect(items).toHaveLength(testCharacters.length + testWords.length)
    expect(items[0]).toEqual({ kind: 'character', entry: testCharacters[0] })
    expect(items.at(-1)).toEqual({ kind: 'word', entry: testWords.at(-1) })
  })
})
