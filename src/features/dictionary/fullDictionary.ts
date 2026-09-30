import type { StudyItemId } from './studyItem.ts'
import type { Character, Word } from './types.ts'

/*
 * The full dictionary (all of CC-CEDICT minus what's already in HSK 1-4)
 * isn't in the bundle: it's over 100,000 entries. `npm run data:build`
 * splits it into CHUNK_COUNT files (0.json ... 31.json), which are published
 * to the data repository (runtime/dictionarySource.ts), and the app requests
 * only the ones it needs.
 *
 * Each entry goes in the chunk of its first character. That way, knowing the
 * hanzi tells you which file to request without a separate index, and a
 * character travels together with the words that start with it.
 */

/** Number of chunks in the full dictionary. If it changes, the dataset must be regenerated. */
export const CHUNK_COUNT = 32

/** A chunk of the full dictionary. Its entries have no HSK level. */
export interface DictionaryChunk {
  characters: Character[]
  words: Word[]
}

/** Chunk an entry goes in: the code point of its first character, modulo CHUNK_COUNT. */
export function getChunkIndex(hanzi: string): number {
  return hanzi.codePointAt(0)! % CHUNK_COUNT
}

export function chunkFileName(index: number): string {
  return `${index}.json`
}

/** The hanzi of a study item: "word:长[cháng]" → "长". */
export function getItemHanzi(itemId: StudyItemId): string {
  const id = itemId.slice(itemId.indexOf(':') + 1)
  const bracket = id.indexOf('[')
  return bracket === -1 ? id : id.slice(0, bracket)
}

/**
 * Chunks needed to show an item: its own and those of its characters
 * (a word's entry page shows each character).
 */
export function getChunksFor(itemId: StudyItemId): number[] {
  return [...new Set(Array.from(getItemHanzi(itemId)).map(getChunkIndex))]
}
