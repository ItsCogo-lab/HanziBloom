/**
 * hanzi-writer-data adapter (Arphic Public License), the npm package with
 * each character's strokes used by the Hanzi Writer library.
 *
 * Responsibility: knowing whether there is stroke data for a character, how many
 * strokes it has (to check Unihan's count) and copying it to public/.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface StrokeData {
  /** The JSON as is, to copy it unchanged. */
  json: string
  strokeCount: number
}

/** Counts the strokes in a hanzi-writer-data JSON. */
export function countStrokes(json: string): number {
  const data: { strokes?: unknown } = JSON.parse(json)
  if (!Array.isArray(data.strokes)) throw new Error('hanzi-writer-data: missing the "strokes" list')
  return data.strokes.length
}

/** Reads a character's strokes from the installed package, if they exist. */
export function readStrokeData(packageDir: string, hanzi: string): StrokeData | undefined {
  const path = join(packageDir, `${hanzi}.json`)
  if (!existsSync(path)) return undefined
  const json = readFileSync(path, 'utf8')
  return { json, strokeCount: countStrokes(json) }
}

