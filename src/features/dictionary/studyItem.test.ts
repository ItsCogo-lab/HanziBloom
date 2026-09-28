import { describe, expect, it } from 'vitest'
import { createDictionary } from './dictionary.ts'
import { getRelatedItems, getStudyItem, getStudyItemId, listStudyItems } from './studyItem.ts'
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

describe('getStudyItem', () => {
  const dictionary = createDictionary(testCharacters, testWords)

  it('encuentra caracteres y palabras por su id, aunque compartan hanzi', () => {
    expect(getStudyItem(dictionary, 'char:好')).toEqual({ kind: 'character', entry: testCharacters[1] })
    expect(getStudyItem(dictionary, 'word:好')).toEqual({ kind: 'word', entry: testWords[1] })
  })

  it('devuelve undefined si no existe', () => {
    expect(getStudyItem(dictionary, 'word:不存在')).toBeUndefined()
  })
})

describe('getRelatedItems', () => {
  const dictionary = createDictionary(testCharacters, testWords)
  const hanziOf = (items: ReturnType<typeof getRelatedItems>) => items.map((item) => item.entry.hanzi)

  it('de una palabra devuelve sus caracteres', () => {
    expect(hanziOf(getRelatedItems(dictionary, { kind: 'word', entry: testWords[0]! }))).toEqual(['你', '好'])
  })

  it('de un carácter devuelve sus palabras, sin la que tiene el mismo hanzi', () => {
    expect(hanziOf(getRelatedItems(dictionary, { kind: 'character', entry: testCharacters[1]! }))).toEqual(['你好'])
  })
})
