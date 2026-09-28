import { describe, expect, it } from 'vitest'
import { getStudyItemId } from './studyItem.ts'
import { testCharacters, testWords } from './testData.ts'

describe('getStudyItemId', () => {
  it('da ids distintos al carácter y a la palabra 好', () => {
    const character = testCharacters.find((entry) => entry.id === '好')!
    const word = testWords.find((entry) => entry.id === '好')!

    expect(getStudyItemId({ kind: 'character', entry: character })).toBe('char:好')
    expect(getStudyItemId({ kind: 'word', entry: word })).toBe('word:好')
  })
})
