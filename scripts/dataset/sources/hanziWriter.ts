/**
 * Adaptador de hanzi-writer-data (Arphic Public License), el paquete npm con
 * los trazos de cada carácter que usa la librería Hanzi Writer.
 *
 * Responsabilidad: saber si hay datos de trazos para un carácter, cuántos
 * trazos tienen (para comprobar el número de Unihan) y copiarlos a public/.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface StrokeData {
  /** El JSON tal cual, para copiarlo sin cambios. */
  json: string
  strokeCount: number
}

/** Cuenta los trazos de un JSON de hanzi-writer-data. */
export function countStrokes(json: string): number {
  const data: { strokes?: unknown } = JSON.parse(json)
  if (!Array.isArray(data.strokes)) throw new Error('hanzi-writer-data: falta la lista "strokes"')
  return data.strokes.length
}

/** Lee los trazos de un carácter del paquete instalado, si existen. */
export function readStrokeData(packageDir: string, hanzi: string): StrokeData | undefined {
  const path = join(packageDir, `${hanzi}.json`)
  if (!existsSync(path)) return undefined
  const json = readFileSync(path, 'utf8')
  return { json, strokeCount: countStrokes(json) }
}

