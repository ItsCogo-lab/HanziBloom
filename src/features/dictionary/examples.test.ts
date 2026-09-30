import { describe, expect, it, vi } from 'vitest'
import { getExamplesFor, loadExampleSet, tatoebaSentenceUrl } from './examples.ts'
import { ningCharacter, ningmengWord, testCharacters, testExampleSet } from './testData.ts'

describe('example sentences', () => {
  it('loads the level file from public/examples', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(testExampleSet)))
    await expect(loadExampleSet(1, fetchMock)).resolves.toEqual(testExampleSet)
    expect(fetchMock).toHaveBeenCalledWith('/examples/hsk1.json')
  })

  it('fails if the file does not exist', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 404 }))
    await expect(loadExampleSet(1, fetchMock)).rejects.toThrow(/HSK 1/)
  })

  it('gives a word\'s sentences and those of the words containing a character', () => {
    expect(getExamplesFor(testExampleSet, { kind: 'word', entry: ningmengWord })).toHaveLength(1)
    expect(getExamplesFor(testExampleSet, { kind: 'character', entry: ningCharacter })).toHaveLength(1)
    expect(getExamplesFor(testExampleSet, { kind: 'character', entry: testCharacters[0]! })).toEqual([])
  })

  it('links each sentence to its Tatoeba page', () => {
    expect(tatoebaSentenceUrl(8934441)).toBe('https://tatoeba.org/en/sentences/show/8934441')
  })
})
