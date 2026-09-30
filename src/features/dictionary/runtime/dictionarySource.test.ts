import { describe, expect, it } from 'vitest'
import { createFakeFetch, jsonResponse } from '../../../test/fakeFetch.ts'
import { getChunkIndex } from '../fullDictionary.ts'
import { chunkUrl, fetchChunk, fetchManifest, manifestUrl, parseChunk, parseManifest } from './dictionarySource.ts'

export const manifest = {
  format: 1,
  version: '1.0.0',
  generatedAt: '2026-09-29T09:00:00Z',
  chunkCount: 32,
  sources: { 'cc-cedict': '2025-12-13', unihan: '18.0.0' },
}

const penguin = getChunkIndex('企')
const qi = { id: '企', hanzi: '企', pinyin: ['qǐ'], meanings: { en: ['to plan a project'] } }
const qie = { id: '企鹅', hanzi: '企鹅', pinyin: 'qǐ é', meanings: { en: ['penguin'] }, traditional: '企鵝' }

describe('parseManifest', () => {
  it('acepta el manifiesto del formato 1', () => {
    expect(parseManifest(manifest)).toEqual(manifest)
  })

  it('rechaza otro formato, versiones raras o manifiestos incompletos', () => {
    for (const malformed of [
      null,
      { ...manifest, format: 2 },
      { ...manifest, version: '2.0.0' },
      { ...manifest, version: '1.0.0/../x' },
      { ...manifest, chunkCount: 16 },
      { ...manifest, sources: undefined },
    ]) {
      expect(() => parseManifest(malformed), JSON.stringify(malformed)).toThrow(
        expect.objectContaining({ kind: 'invalid' }),
      )
    }
  })
})

describe('parseChunk', () => {
  it('se queda con las entradas bien formadas de su trozo', () => {
    const chunk = parseChunk(
      {
        characters: [qi, { ...qi, pinyin: 'qǐ' }, { ...qi, hskLevel: 1 }],
        words: [qie, { ...qie, meanings: { en: 'penguin' } }, { ...qie, hanzi: '好', id: '好' }],
      },
      penguin,
    )
    expect(chunk).toEqual({ characters: [qi], words: [qie] })
  })

  it('rechaza un trozo sin la forma esperada', () => {
    for (const malformed of [null, [], { characters: [] }, { words: [] }]) {
      expect(() => parseChunk(malformed, 0)).toThrow(expect.objectContaining({ kind: 'invalid' }))
    }
  })
})

describe('URLs del repositorio de datos', () => {
  it('pide el manifiesto del formato 1 y los trozos de la carpeta de su versión', () => {
    const base = 'https://cdn.jsdelivr.net/gh/ItsCogo-lab/HanziDict@main/v1'
    expect(manifestUrl()).toBe(`${base}/manifest.json`)
    expect(chunkUrl('1.2.3', 7)).toBe(`${base}/1.2.3/dictionary/7.json`)
  })

  it('no construye URLs con versiones o trozos inválidos', () => {
    for (const [version, index] of [
      ['1.0.0/../../other', 0],
      ['latest', 0],
      ['1.0.0', 32],
      ['1.0.0', -1],
      ['1.0.0', 1.5],
    ] as const) {
      expect(() => chunkUrl(version, index)).toThrow(expect.objectContaining({ kind: 'invalid' }))
    }
  })
})

describe('fetchManifest y fetchChunk', () => {
  it('descargan y validan', async () => {
    const fake = createFakeFetch([
      [manifestUrl(), jsonResponse(manifest)],
      [chunkUrl('1.0.0', penguin), jsonResponse({ characters: [qi], words: [qie] })],
    ])
    expect(await fetchManifest({ fetchFn: fake.fetch })).toEqual({
      data: manifest,
      source: 'ItsCogo-lab/HanziDict@1.0.0',
    })
    expect(await fetchChunk('1.0.0', penguin, { fetchFn: fake.fetch })).toEqual({ characters: [qi], words: [qie] })
  })

  it('el manifiesto se revalida siempre con el servidor (jsDelivr lo manda con max-age de 7 días)', async () => {
    const calls: RequestInit[] = []
    const fetchFn = (async (_url: string, init: RequestInit) => {
      calls.push(init)
      return jsonResponse(manifest)
    }) as unknown as typeof fetch
    await fetchManifest({ fetchFn })
    expect(calls[0]?.cache).toBe('no-cache')
  })

  it('pasan los errores HTTP clasificados', async () => {
    const fake = createFakeFetch([[/./, new Response('', { status: 503 })]])
    await expect(fetchManifest({ fetchFn: fake.fetch })).rejects.toMatchObject({ kind: 'http', status: 503 })
  })
})
