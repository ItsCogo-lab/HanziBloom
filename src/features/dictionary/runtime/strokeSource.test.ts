import { describe, expect, it } from 'vitest'
import { createFakeFetch, jsonResponse } from '../../../test/fakeFetch.ts'
import { fetchStrokeData, parseStrokeData, STROKE_SOURCE } from './strokeSource.ts'

const valid = {
  strokes: ['M 1 2 L 3 4', 'M 5 6'],
  medians: [
    [
      [1, 2],
      [3, 4],
    ],
    [[5, 6]],
  ],
  radStrokes: [0],
}

describe('parseStrokeData', () => {
  it('accepts the hanzi-writer-data format', () => {
    expect(parseStrokeData(valid)).toEqual(valid)
  })

  it('rejects malformed responses', () => {
    for (const malformed of [
      null,
      'M 1 2',
      {},
      { strokes: [], medians: [] },
      { strokes: ['M 1 2'], medians: [] },
      { strokes: [1], medians: [[[1, 2]]] },
      { strokes: ['M 1 2'], medians: [[['a']]] },
    ]) {
      expect(() => parseStrokeData(malformed), JSON.stringify(malformed)).toThrow(
        expect.objectContaining({ kind: 'invalid' }),
      )
    }
  })
})

describe('fetchStrokeData', () => {
  it('requests the character from the pinned hanzi-writer-data version', async () => {
    const fake = createFakeFetch([[/hanzi-writer-data@2\.0\.1\//, jsonResponse(valid)]])
    const result = await fetchStrokeData('柠', { fetchFn: fake.fetch })
    expect(result).toEqual({ data: valid, source: STROKE_SOURCE })
    expect(fake.requested).toEqual([
      `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent('柠')}.json`,
    ])
  })

  it('does not build URLs with text that is not a single character', async () => {
    const fake = createFakeFetch([[/./, jsonResponse(valid)]])
    await expect(fetchStrokeData('../x', { fetchFn: fake.fetch })).rejects.toMatchObject({ kind: 'invalid' })
    expect(fake.requested).toEqual([])
  })

  it('a 404 arrives as an HTTP error (the character has no strokes)', async () => {
    const fake = createFakeFetch([[/./, new Response('', { status: 404 })]])
    await expect(fetchStrokeData('柠', { fetchFn: fake.fetch })).rejects.toMatchObject({ kind: 'http', status: 404 })
  })
})
