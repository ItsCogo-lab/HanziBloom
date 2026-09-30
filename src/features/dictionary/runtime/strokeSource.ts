import type { StrokeData } from '../strokeData.ts'
import { createRateLimiter, fetchJson, SourceError, type FetchOptions } from './http.ts'

/*
 * Stroke adapter: hanzi-writer-data served by jsDelivr, which is where
 * Hanzi Writer loads them from by default. The version is pinned in the URL: jsDelivr
 * serves those files as immutable and with CORS (verified in GitHub Actions).
 * Data license: Arphic Public License (see docs/DATA_SOURCES.md).
 */

export const STROKE_DATA_VERSION = '2.0.1'
export const STROKE_SOURCE = `hanzi-writer-data@${STROKE_DATA_VERSION} (jsDelivr)`
const BASE_URL = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@${STROKE_DATA_VERSION}/`

// A user opens few entry pages per minute; this only stops a runaway loop or abuse
const limiter = createRateLimiter(60)

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number')
}

/** Checks the hanzi-writer-data format and keeps only what the app uses. */
export function parseStrokeData(json: unknown): StrokeData {
  if (typeof json !== 'object' || json === null) throw new SourceError('invalid', 'Stroke data is not an object')
  const { strokes, medians, radStrokes } = json as Record<string, unknown>
  if (!Array.isArray(strokes) || strokes.length === 0 || !strokes.every((stroke) => typeof stroke === 'string')) {
    throw new SourceError('invalid', 'Stroke data without strokes')
  }
  if (
    !Array.isArray(medians) ||
    medians.length !== strokes.length ||
    !medians.every((median) => Array.isArray(median) && median.every(isNumberArray))
  ) {
    throw new SourceError('invalid', 'Stroke data without medians')
  }
  return {
    strokes: strokes as string[],
    medians: medians as number[][][],
    ...(isNumberArray(radStrokes) && { radStrokes }),
  }
}

/** A character's strokes. A 404 means hanzi-writer-data doesn't have it. */
export async function fetchStrokeData(hanzi: string, options: FetchOptions = {}) {
  if (Array.from(hanzi).length !== 1) throw new SourceError('invalid', 'Expected one character')
  const json = await limiter.schedule(() => fetchJson(`${BASE_URL}${encodeURIComponent(hanzi)}.json`, options))
  return { data: parseStrokeData(json), source: STROKE_SOURCE }
}
