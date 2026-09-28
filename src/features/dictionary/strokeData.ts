import { strokeFileName } from './strokes.ts'

/** Datos de trazos de un carácter en el formato de hanzi-writer-data. */
export interface StrokeData {
  strokes: string[]
  medians: number[][][]
  radStrokes?: number[]
}

/**
 * Carga los trazos de un carácter desde public/strokes/ (se generan con
 * `npm run data:build`). Se piden al abrir la ficha, no van en el bundle.
 */
export async function loadStrokeData(hanzi: string, fetchFn: typeof fetch = fetch): Promise<StrokeData> {
  const response = await fetchFn(`${import.meta.env.BASE_URL}strokes/${strokeFileName(hanzi)}`)
  if (!response.ok) throw new Error(`No stroke data for ${hanzi} (HTTP ${response.status})`)
  return (await response.json()) as StrokeData
}
