import type { StrokeData } from '../strokeData.ts'
import { createRateLimiter, fetchJson, SourceError, type FetchOptions } from './http.ts'

/*
 * Adaptador de trazos: hanzi-writer-data servido por jsDelivr, que es de donde
 * los carga Hanzi Writer por defecto. La versión va fijada en la URL: jsDelivr
 * sirve esos archivos como inmutables y con CORS (comprobado en GitHub Actions).
 * Licencia de los datos: Arphic Public License (ver docs/DATA_SOURCES.md).
 */

export const STROKE_DATA_VERSION = '2.0.1'
export const STROKE_SOURCE = `hanzi-writer-data@${STROKE_DATA_VERSION} (jsDelivr)`
const BASE_URL = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@${STROKE_DATA_VERSION}/`

// Un usuario abre pocas fichas por minuto; esto solo frena un bucle o un abuso
const limiter = createRateLimiter(60)

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number')
}

/** Comprueba el formato de hanzi-writer-data y se queda solo con lo que usa la app. */
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

/** Trazos de un carácter. Un 404 significa que hanzi-writer-data no lo tiene. */
export async function fetchStrokeData(hanzi: string, options: FetchOptions = {}) {
  if (Array.from(hanzi).length !== 1) throw new SourceError('invalid', 'Expected one character')
  const json = await limiter.schedule(() => fetchJson(`${BASE_URL}${encodeURIComponent(hanzi)}.json`, options))
  return { data: parseStrokeData(json), source: STROKE_SOURCE }
}
