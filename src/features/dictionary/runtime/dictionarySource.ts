import { CHUNK_COUNT, chunkFileName, getChunkIndex, type DictionaryChunk } from '../fullDictionary.ts'
import type { Character, Word } from '../types.ts'
import { createRateLimiter, fetchJson, SourceError, type FetchOptions } from './http.ts'

/*
 * Adaptador del diccionario completo (CC-CEDICT con Unihan y Make Me a Hanzi).
 * No hay ninguna API pública de estas fuentes (ver docs/DATA_SOURCES.md), así
 * que los datos se generan con `npm run data:build` y se publican en un
 * repositorio aparte, ItsCogo-lab/HanziVocab-Data, que jsDelivr sirve con CORS
 * desde su rama main:
 *
 * - `v1/manifest.json`: qué versión de los datos es la actual.
 * - `v1/<versión>/dictionary/<n>.json`: los trozos de esa versión. Cada versión
 *   va en su propia carpeta y no se modifica nunca.
 *
 * Actualizar el diccionario es publicar una versión nueva en ese repositorio:
 * la app no cambia. Si cambia el formato de los datos, sube DATA_FORMAT (y los
 * datos nuevos van en v2/, sin romper las versiones anteriores de la app).
 */

export const DATA_REPOSITORY = 'ItsCogo-lab/HanziVocab-Data'
/** Versión mayor del formato que entiende esta app. */
export const DATA_FORMAT = 1
const BASE_URL = `https://cdn.jsdelivr.net/gh/${DATA_REPOSITORY}@main/v${DATA_FORMAT}`
const VERSION = /^\d+\.\d+\.\d+$/

// Una búsqueda pide los 32 trozos de golpe; esto solo frena un bucle
const limiter = createRateLimiter(120)

export interface DataManifest {
  format: number
  /** Versión de los datos, "1.0.0". */
  version: string
  /** Fecha de generación (ISO 8601). */
  generatedAt: string
  chunkCount: number
  /** Fuentes y sus versiones, p. ej. { "cc-cedict": "2025-12-13" }. */
  sources: Record<string, string>
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

export function parseManifest(json: unknown): DataManifest {
  if (!isObject(json)) throw new SourceError('invalid', 'Manifest is not an object')
  const { format, version, generatedAt, chunkCount, sources } = json
  if (format !== DATA_FORMAT) throw new SourceError('invalid', `Unsupported data format ${String(format)}`)
  if (typeof version !== 'string' || !VERSION.test(version) || !version.startsWith(`${DATA_FORMAT}.`)) {
    throw new SourceError('invalid', 'Manifest without a valid version')
  }
  if (chunkCount !== CHUNK_COUNT) throw new SourceError('invalid', `Expected ${CHUNK_COUNT} chunks`)
  if (typeof generatedAt !== 'string' || !isObject(sources)) throw new SourceError('invalid', 'Incomplete manifest')
  const sourceVersions = Object.fromEntries(
    Object.entries(sources).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
  return { format, version, generatedAt, chunkCount, sources: sourceVersions }
}

function hasBaseFields(value: unknown, index: number): value is Record<string, unknown> {
  if (!isObject(value)) return false
  const { id, hanzi, meanings, hskLevel } = value
  return (
    typeof id === 'string' &&
    typeof hanzi === 'string' &&
    hanzi !== '' &&
    getChunkIndex(hanzi) === index &&
    hskLevel === undefined &&
    isObject(meanings) &&
    isStringArray(meanings.en)
  )
}

/**
 * Comprueba un trozo. Si no tiene la forma esperada, falla; una entrada suelta
 * mal formada (o en un trozo que no es el suyo) se descarta, nunca se arregla.
 */
export function parseChunk(json: unknown, index: number): DictionaryChunk {
  if (!isObject(json) || !Array.isArray(json.characters) || !Array.isArray(json.words)) {
    throw new SourceError('invalid', 'Dictionary chunk without characters and words')
  }
  const characters = json.characters.filter(
    (value): value is Character => hasBaseFields(value, index) && isStringArray(value.pinyin),
  )
  const words = json.words.filter(
    (value): value is Word => hasBaseFields(value, index) && typeof value.pinyin === 'string',
  )
  return { characters, words }
}

export function manifestUrl(): string {
  return `${BASE_URL}/manifest.json`
}

export function chunkUrl(version: string, index: number): string {
  if (!VERSION.test(version) || !Number.isInteger(index) || index < 0 || index >= CHUNK_COUNT) {
    throw new SourceError('invalid', 'Invalid chunk request')
  }
  return `${BASE_URL}/${version}/dictionary/${chunkFileName(index)}`
}

export async function fetchManifest(options: FetchOptions = {}) {
  // jsDelivr lo manda con max-age de 7 días: sin esto, el navegador no vería una versión nueva en una semana
  const json = await limiter.schedule(() => fetchJson(manifestUrl(), { cache: 'no-cache', ...options }))
  const manifest = parseManifest(json)
  return { data: manifest, source: `${DATA_REPOSITORY}@${manifest.version}` }
}

export async function fetchChunk(version: string, index: number, options: FetchOptions = {}) {
  const url = chunkUrl(version, index)
  // Un trozo pesa unos 600 KB: más margen que para una ficha
  const json = await limiter.schedule(() => fetchJson(url, { timeoutMs: 30_000, ...options }))
  return parseChunk(json, index)
}
