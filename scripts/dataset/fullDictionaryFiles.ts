import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CHUNK_COUNT, chunkFileName, type DictionaryChunk } from '../../src/features/dictionary/fullDictionary.ts'

/** Reads the generated full dictionary chunks, in order. Fails if any is missing. */
export function readFullDictionary(dir: string): DictionaryChunk[] {
  return Array.from({ length: CHUNK_COUNT }, (_, index) => {
    const path = join(dir, chunkFileName(index))
    if (!existsSync(path)) throw new Error(`Missing ${path}. Run "npm run data:build" (see docs/DATA_SOURCES.md).`)
    return JSON.parse(readFileSync(path, 'utf8')) as DictionaryChunk
  })
}
