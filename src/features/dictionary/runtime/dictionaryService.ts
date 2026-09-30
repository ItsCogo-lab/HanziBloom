import { getExamplesFor, loadExampleSet, MAX_EXAMPLES_SHOWN } from '../examples.ts'
import type { DictionaryChunk } from '../fullDictionary.ts'
import { hskDictionary } from '../hskDictionary.ts'
import type { StrokeData } from '../strokeData.ts'
import { strokeFileName } from '../strokes.ts'
import type { StudyItem } from '../studyItem.ts'
import type { ExampleSentence } from '../types.ts'
import type { DictionaryCache } from './dictionaryCache.ts'
import { fetchChunk, fetchManifest } from './dictionarySource.ts'
import { fetchJson, SourceError } from './http.ts'
import type { ResourceService } from './resourceService.ts'
import { fetchStrokeData, parseStrokeData, STROKE_DATA_VERSION } from './strokeSource.ts'
import { fetchTatoebaExamples, TATOEBA_LICENSE } from './tatoebaSource.ts'

/**
 * Servicio del diccionario en tiempo de ejecución: lo único que usan los
 * componentes para pedir datos externos. Decide de dónde sale cada dato, en
 * este orden:
 *
 * 1. Caché (IndexedDB) al día.
 * 2. Caché caducada (se renueva en segundo plano).
 * 3. La API de la fuente.
 * 4. Los datos locales de HSK 1-4 (public/strokes/, public/examples/).
 * 5. «No disponible»: la ficha lo dice y no inventa nada.
 */

/** Los trazos de una versión de hanzi-writer-data no cambian nunca. */
export const STROKE_TTL_MS = 365 * 24 * 60 * 60 * 1000
/** Las frases de Tatoeba se corrigen y se añaden: una semana. */
export const EXAMPLES_TTL_MS = 7 * 24 * 60 * 60 * 1000
/** Cada cuánto se mira si hay una versión nueva del diccionario completo. */
export const MANIFEST_TTL_MS = 24 * 60 * 60 * 1000

export interface RuntimeSources {
  resources: ResourceService
  cache: DictionaryCache
  fetchFn: typeof fetch
}

export type Availability<T> =
  | { status: 'ready'; data: T; source: string; stale: boolean }
  /** La fuente no tiene este dato (p. ej., un carácter sin trazos): no se muestra la sección. */
  | { status: 'missing' }
  /** No se ha podido consultar (sin conexión, límite de peticiones): la ficha lo dice. */
  | { status: 'unavailable' }

export interface LoadOptions<T> {
  signal?: AbortSignal
  /** Llega un dato más nuevo después de haber devuelto uno caducado. */
  onUpdate?: (result: Availability<T>) => void
}

/** Si la fuente dice que no tiene el dato, frente a que no se ha podido preguntar. */
function isMissing(error: unknown): boolean {
  return error instanceof SourceError && (error.kind === 'invalid' || (error.kind === 'http' && error.status === 404))
}

function rethrowAbort(error: unknown) {
  if (error instanceof SourceError && error.kind === 'aborted') throw error
}

/**
 * Trazos de un carácter: hanzi-writer-data desde jsDelivr y, si no se puede,
 * la copia local de public/strokes/ (solo caracteres de HSK 1-4).
 */
export async function loadStrokes(
  sources: RuntimeSources,
  hanzi: string,
  hasLocalCopy: boolean,
  { signal, onUpdate }: LoadOptions<StrokeData> = {},
): Promise<Availability<StrokeData>> {
  let remoteError: unknown
  try {
    const resource = await sources.resources.load({
      key: `strokes:${STROKE_DATA_VERSION}:${hanzi}`,
      ttlMs: STROKE_TTL_MS,
      fetch: (fetchSignal) =>
        fetchStrokeData(hanzi, {
          signal: fetchSignal,
          fetchFn: sources.fetchFn,
        }),
      signal,
      onUpdate: (fresh) => onUpdate?.({ status: 'ready', ...fresh }),
    })
    return { status: 'ready', ...resource }
  } catch (error) {
    rethrowAbort(error)
    remoteError = error
  }
  if (hasLocalCopy) {
    try {
      const url = `${import.meta.env.BASE_URL}strokes/${strokeFileName(hanzi)}`
      const data = parseStrokeData(await fetchJson(url, { signal, fetchFn: sources.fetchFn }))
      return {
        status: 'ready',
        data,
        source: 'public/strokes (HSK 1-4)',
        stale: false,
      }
    } catch (error) {
      rethrowAbort(error)
    }
  }
  return isMissing(remoteError) ? { status: 'missing' } : { status: 'unavailable' }
}

export interface Examples {
  sentences: ExampleSentence[]
  license: string
}

let knownCharacters: Set<string> | undefined

/**
 * Elige las frases que se muestran: primero las que solo usan caracteres de
 * HSK 1-4 (o del propio término), que el alumno puede leer enteras; después,
 * las más cortas. La API ya las da de más corta a más larga.
 */
export function pickExamples(term: string, candidates: readonly ExampleSentence[]): ExampleSentence[] {
  knownCharacters ??= new Set([...hskDictionary.characters.values()].map((character) => character.hanzi))
  const known = knownCharacters
  const readable = (text: string) =>
    Array.from(text).every((symbol) => !/\p{Script=Han}/u.test(symbol) || known.has(symbol) || term.includes(symbol))
  return candidates
    .map((sentence, index) => ({
      sentence,
      index,
      readable: readable(sentence.zh),
    }))
    .sort((a, b) => Number(b.readable) - Number(a.readable) || a.index - b.index)
    .slice(0, MAX_EXAMPLES_SHOWN)
    .map(({ sentence }) => sentence)
}

/**
 * Frases de ejemplo de un carácter o una palabra: Tatoeba en tiempo de
 * ejecución y, si no se puede o no hay, las frases locales de su nivel HSK.
 */
export async function loadExamples(
  sources: RuntimeSources,
  item: StudyItem,
  { signal, onUpdate }: LoadOptions<Examples> = {},
): Promise<Availability<Examples>> {
  const term = item.entry.hanzi
  const toResult = (resource: { data: ExampleSentence[]; source: string; stale: boolean }): Availability<Examples> =>
    resource.data.length === 0
      ? { status: 'missing' }
      : {
          status: 'ready',
          data: {
            sentences: pickExamples(term, resource.data),
            license: TATOEBA_LICENSE,
          },
          source: resource.source,
          stale: resource.stale,
        }

  let remote: Availability<Examples> = { status: 'unavailable' }
  try {
    const resource = await sources.resources.load({
      key: `examples:tatoeba-v1:${term}`,
      ttlMs: EXAMPLES_TTL_MS,
      fetch: (fetchSignal) =>
        fetchTatoebaExamples(term, {
          signal: fetchSignal,
          fetchFn: sources.fetchFn,
        }),
      signal,
      onUpdate: (fresh) => {
        const result = toResult(fresh)
        if (result.status === 'ready') onUpdate?.(result)
      },
    })
    remote = toResult(resource)
    if (remote.status === 'ready') return remote
  } catch (error) {
    rethrowAbort(error)
    if (isMissing(error)) remote = { status: 'missing' }
  }

  const level = item.entry.hskLevel
  if (level !== undefined) {
    try {
      const set = await loadExampleSet(level, sources.fetchFn)
      const sentences = getExamplesFor(set, item)
      if (sentences.length > 0) {
        return {
          status: 'ready',
          data: { sentences, license: set.license },
          source: 'public/examples (HSK 1-4)',
          stale: false,
        }
      }
    } catch {
      // Sin copia local: queda lo que dijo la fuente remota
    }
  }
  return remote
}

/** Un trozo guardado, con la versión de los datos de la que salió. */
interface CachedChunk {
  version: string
  chunk: DictionaryChunk
}

/**
 * Un trozo del diccionario completo (repositorio de datos en jsDelivr). La
 * versión actual sale del manifiesto (con su propia caché de un día); cada
 * trozo se guarda con su versión y se vuelve a pedir solo cuando cambia. Así
 * la caché nunca mezcla versiones ni acumula las antiguas.
 *
 * Sin conexión: un trozo guardado se usa aunque sea de una versión anterior.
 * Si no hay nada guardado, falla y la búsqueda se queda en HSK 1-4, diciéndolo.
 */
export async function loadDictionaryChunk(
  sources: RuntimeSources,
  index: number,
  signal?: AbortSignal,
): Promise<DictionaryChunk> {
  const { resources, cache, fetchFn } = sources
  let version: string | undefined
  let manifestError: unknown
  try {
    const manifest = await resources.load({
      key: 'dictionary:manifest',
      ttlMs: MANIFEST_TTL_MS,
      fetch: (fetchSignal) => fetchManifest({ signal: fetchSignal, fetchFn }),
      signal,
    })
    version = manifest.data.version
  } catch (error) {
    rethrowAbort(error)
    manifestError = error
  }

  const key = `dictionary:chunk:${index}`
  const cached = (await cache.get<CachedChunk>(key))?.data
  if (cached && (version === undefined || cached.version === version)) return cached.chunk
  if (version === undefined) throw manifestError

  try {
    const chunk = await fetchChunk(version, index, { signal, fetchFn })
    await cache.set<CachedChunk>({
      key,
      data: { version, chunk },
      fetchedAt: Date.now(),
      source: `HanziDict@${version}`,
    })
    return chunk
  } catch (error) {
    rethrowAbort(error)
    if (cached) return cached.chunk
    throw error
  }
}
