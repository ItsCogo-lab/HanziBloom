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
  it('acepta el formato de hanzi-writer-data', () => {
    expect(parseStrokeData(valid)).toEqual(valid)
  })

  it('rechaza respuestas mal formadas', () => {
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
  it('pide el carácter a la versión fijada de hanzi-writer-data', async () => {
    const fake = createFakeFetch([[/hanzi-writer-data@2\.0\.1\//, jsonResponse(valid)]])
    const result = await fetchStrokeData('柠', { fetchFn: fake.fetch })
    expect(result).toEqual({ data: valid, source: STROKE_SOURCE })
    expect(fake.requested).toEqual([
      `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent('柠')}.json`,
    ])
  })

  it('no construye URLs con texto que no sea un solo carácter', async () => {
    const fake = createFakeFetch([[/./, jsonResponse(valid)]])
    await expect(fetchStrokeData('../x', { fetchFn: fake.fetch })).rejects.toMatchObject({ kind: 'invalid' })
    expect(fake.requested).toEqual([])
  })

  it('un 404 llega como error HTTP (el carácter no tiene trazos)', async () => {
    const fake = createFakeFetch([[/./, new Response('', { status: 404 })]])
    await expect(fetchStrokeData('柠', { fetchFn: fake.fetch })).rejects.toMatchObject({ kind: 'http', status: 404 })
  })
})
