import { describe, expect, it } from 'vitest'
import { createFakeFetch, jsonResponse, offlineFetch } from '../../../test/fakeFetch.ts'
import { ningResponse } from '../../../test/tatoebaResponses.ts'
import type { StudyItem } from '../studyItem.ts'
import { ningCharacter, testExampleSet } from '../testData.ts'
import { createMemoryCache, type DictionaryCache } from './dictionaryCache.ts'
import { EXAMPLES_TTL_MS, loadExamples, loadStrokes, pickExamples, type RuntimeSources } from './dictionaryService.ts'
import { createResourceService } from './resourceService.ts'

const strokes = { strokes: ['M 0 0'], medians: [[[0, 0]]] }
const ning: StudyItem = { kind: 'character', entry: ningCharacter }
const { hskLevel: _level, ...ningOutsideHsk } = ningCharacter

function sources(fetchFn: typeof fetch, cache: DictionaryCache = createMemoryCache(), now = () => 0): RuntimeSources {
  return { resources: createResourceService(cache, now), fetchFn }
}

describe('loadStrokes', () => {
  it('usa la caché antes que la red', async () => {
    const cache = createMemoryCache()
    const online = createFakeFetch([[/jsdelivr/, jsonResponse(strokes)]])
    await loadStrokes(sources(online.fetch, cache), '柠', false)
    const result = await loadStrokes(sources(offlineFetch, cache), '柠', false)
    expect(result).toMatchObject({ status: 'ready', data: strokes, source: 'hanzi-writer-data@2.0.1 (jsDelivr)' })
  })

  it('distingue «la fuente no lo tiene» de «no se ha podido consultar»', async () => {
    const notFound = createFakeFetch([[/./, new Response('', { status: 404 })]])
    expect(await loadStrokes(sources(notFound.fetch), '柠', true)).toEqual({ status: 'missing' })
    expect(await loadStrokes(sources(offlineFetch), '柠', false)).toEqual({ status: 'unavailable' })
  })

  it('no inventa trazos: una respuesta mal formada no se muestra', async () => {
    const broken = createFakeFetch([[/./, jsonResponse({ strokes: 'x' })]])
    expect(await loadStrokes(sources(broken.fetch), '柠', true)).toEqual({ status: 'missing' })
  })

  it('cancelar la petición no cae a la copia local', async () => {
    const fake = createFakeFetch([['/strokes/', jsonResponse(strokes)]])
    const controller = new AbortController()
    controller.abort()
    await expect(loadStrokes(sources(fake.fetch), '柠', true, { signal: controller.signal })).rejects.toMatchObject({
      kind: 'aborted',
    })
    expect(fake.requested).toEqual([])
  })
})

describe('loadExamples', () => {
  it('guarda las frases de Tatoeba y las renueva cuando caducan (stale-while-revalidate)', async () => {
    const cache = createMemoryCache()
    let time = 0
    const online = createFakeFetch([['https://api.tatoeba.org/', jsonResponse(ningResponse)]])
    const first = await loadExamples(
      sources(online.fetch, cache, () => time),
      ning,
    )
    expect(first).toMatchObject({ status: 'ready', source: 'Tatoeba API v1', stale: false })

    time = EXAMPLES_TTL_MS + 1
    const updates: unknown[] = []
    const stale = await loadExamples(
      sources(online.fetch, cache, () => time),
      ning,
      {
        onUpdate: (fresh) => updates.push(fresh),
      },
    )
    expect(stale).toMatchObject({ status: 'ready', stale: true })
    await expect.poll(() => updates).toEqual([expect.objectContaining({ status: 'ready', stale: false })])
    expect(online.requested).toHaveLength(2)
  })

  it('sin conexión usa las frases locales de su nivel HSK', async () => {
    const local = createFakeFetch([['/examples/hsk1.json', jsonResponse(testExampleSet)]])
    const result = await loadExamples(sources(local.fetch), ning)
    expect(result).toMatchObject({ status: 'ready', source: 'public/examples (HSK 1-4)' })
  })

  it('sin conexión y fuera de HSK lo dice, sin inventar frases', async () => {
    const outside: StudyItem = { kind: 'character', entry: ningOutsideHsk }
    expect(await loadExamples(sources(offlineFetch), outside)).toEqual({ status: 'unavailable' })
  })
})

describe('pickExamples', () => {
  it('prefiere frases que se pueden leer con los caracteres de HSK 1-4', () => {
    const sentence = (tatoebaId: number, zh: string) => ({
      tatoebaId,
      zh,
      author: 'a',
      en: 'x',
      translationTatoebaId: 1,
      words: ['柠'],
    })
    const picked = pickExamples('柠檬', [sentence(1, '柠檬很龘。'), sentence(2, '我吃了你的柠檬。')])
    expect(picked.map((example) => example.tatoebaId)).toEqual([2, 1])
  })
})
