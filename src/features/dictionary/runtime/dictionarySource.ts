import { CHUNK_COUNT, chunkFileName, getChunkIndex, type DictionaryChunk } from '../fullDictionary.ts'
import type { Character, Word } from '../types.ts'
import { createRateLimiter, fetchJson, SourceError, type FetchOptions } from './http.ts'

/*
 * Adapter for the full dictionary (CC-CEDICT with Unihan and Make Me a Hanzi).
 * None of these sources has a public API (see docs/DATA_SOURCES.md), so
 * the data is generated with `npm run data:build` and published to a
 * separate repository, ItsCogo-lab/HanziDict, which jsDelivr serves with CORS
 * from its main branch:
 *
 * - `v1/manifest.json`: which data version is the current one.
 * - `v1/<version>/dictionary/<n>.json`: that version's chunks. Each version
 *   goes in its own folder and is never modified.
 *
 * Updating the dictionary means publishing a new version to that repository:
 * the app doesn't change. If the data format changes, bump DATA_FORMAT (and the
 * new data goes in v2/, without breaking older versions of the app).
 */

export const DATA_REPOSITORY = 'ItsCogo-lab/HanziDict'
/** Major version of the format this app understands. */
export const DATA_FORMAT = 1
const BASE_URL = `https://cdn.jsdelivr.net/gh/${DATA_REPOSITORY}@main/v${DATA_FORMAT}`
const VERSION = /^\d+\.\d+\.\d+$/

// A search requests all 32 chunks at once; this only stops a runaway loop
const limiter = createRateLimiter(120)

export interface DataManifest {
  format: number
  /** Data version, "1.0.0". */
  version: string
  /** Generation date (ISO 8601). */
  generatedAt: string
  chunkCount: number
  /** Sources and their versions, e.g. { "cc-cedict": "2025-12-13" }. */
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
 * Checks a chunk. If it doesn't have the expected shape, it fails; a single
 * malformed entry (or one in a chunk that isn't its own) is dropped, never fixed.
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
  // jsDelivr sends it with a 7-day max-age: without this, the browser wouldn't see a new version for a week
  const json = await limiter.schedule(() => fetchJson(manifestUrl(), { cache: 'no-cache', ...options }))
  const manifest = parseManifest(json)
  return { data: manifest, source: `${DATA_REPOSITORY}@${manifest.version}` }
}

export async function fetchChunk(version: string, index: number, options: FetchOptions = {}) {
  const url = chunkUrl(version, index)
  // A chunk weighs about 600 KB: more leeway than for an entry page
  const json = await limiter.schedule(() => fetchJson(url, { timeoutMs: 30_000, ...options }))
  return parseChunk(json, index)
}
