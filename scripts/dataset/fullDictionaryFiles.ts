import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CHUNK_COUNT, chunkFileName, type DictionaryChunk } from '../../src/features/dictionary/fullDictionary.ts'

/** Lee los trozos generados del diccionario completo, en orden. Falla si falta alguno. */
export function readFullDictionary(dir: string): DictionaryChunk[] {
  return Array.from({ length: CHUNK_COUNT }, (_, index) => {
    const path = join(dir, chunkFileName(index))
    if (!existsSync(path)) throw new Error(`Falta ${path}. Ejecuta "npm run data:build" (ver docs/DATA_SOURCES.md).`)
    return JSON.parse(readFileSync(path, 'utf8')) as DictionaryChunk
  })
}
