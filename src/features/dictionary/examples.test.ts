import { describe, expect, it, vi } from 'vitest'
import { getExamplesFor, loadExampleSet, tatoebaSentenceUrl } from './examples.ts'
import { ningCharacter, ningmengWord, testCharacters, testExampleSet } from './testData.ts'

describe('frases de ejemplo', () => {
  it('carga el archivo del nivel desde public/examples', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(testExampleSet)))
    await expect(loadExampleSet(1, fetchMock)).resolves.toEqual(testExampleSet)
    expect(fetchMock).toHaveBeenCalledWith('/examples/hsk1.json')
  })

  it('falla si el archivo no existe', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 404 }))
    await expect(loadExampleSet(1, fetchMock)).rejects.toThrow(/HSK 1/)
  })

  it('da las frases de una palabra y las de las palabras que contienen un carácter', () => {
    expect(getExamplesFor(testExampleSet, { kind: 'word', entry: ningmengWord })).toHaveLength(1)
    expect(getExamplesFor(testExampleSet, { kind: 'character', entry: ningCharacter })).toHaveLength(1)
    expect(getExamplesFor(testExampleSet, { kind: 'character', entry: testCharacters[0]! })).toEqual([])
  })

  it('enlaza cada frase con su página de Tatoeba', () => {
    expect(tatoebaSentenceUrl(8934441)).toBe('https://tatoeba.org/en/sentences/show/8934441')
  })
})
