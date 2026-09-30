import type { Dictionary } from './dictionary.ts'
import { CHUNK_COUNT, getChunksFor, type DictionaryChunk } from './fullDictionary.ts'
import { getStudyItem, listStudyItems, type StudyItem, type StudyItemId } from './studyItem.ts'

export type LoadChunk = (index: number) => Promise<DictionaryChunk>

/**
 * The dictionary the UI uses: HSK 1-4 (in the bundle) plus the chunks of
 * the full dictionary that have already loaded. Starts with just HSK and
 * grows as chunks are requested; never downloads one twice.
 *
 * Follows the useSyncExternalStore contract: `getSnapshot` returns the same
 * object while nothing changes, and a new one when a chunk arrives.
 */
export interface DictionaryStore {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => Dictionary
  /** The HSK 1-4 items, which are always there. */
  baseItems: readonly StudyItem[]
  /** All loaded items, computed once per dictionary version. */
  getItems: () => readonly StudyItem[]
  /** Whether all these items can be shown yet. */
  hasItems: (itemIds: readonly StudyItemId[]) => boolean
  /** Whether all chunks have been loaded. */
  isComplete: () => boolean
  /** Loads what's needed to show these items (HSK ones are already there). */
  loadItems: (itemIds: readonly StudyItemId[]) => Promise<void>
  /** Loads the whole dictionary, to search in it. */
  loadAll: () => Promise<void>
}

export function createDictionaryStore(base: Dictionary, loadChunk: LoadChunk): DictionaryStore {
  // Copies: the bundled HSK dictionary is left untouched
  const characters = new Map(base.characters)
  const words = new Map(base.words)
  let snapshot: Dictionary = { characters, words }
  const baseItems = listStudyItems(base)
  let items: { for: Dictionary; list: StudyItem[] } | undefined
  const requests = new Map<number, Promise<void>>()
  const loaded = new Map<number, DictionaryChunk>()
  const listeners = new Set<() => void>()

  function load(index: number): Promise<void> {
    let request = requests.get(index)
    if (!request) {
      request = loadChunk(index).then(
        (chunk) => {
          for (const character of chunk.characters) characters.set(character.id, character)
          for (const word of chunk.words) words.set(word.id, word)
          loaded.set(index, chunk)
          snapshot = { characters, words }
          for (const listener of listeners) listener()
        },
        (error: unknown) => {
          // Can be retried later
          requests.delete(index)
          throw error
        },
      )
      requests.set(index, request)
    }
    return request
  }

  const loadChunks = async (indexes: Iterable<number>) => {
    await Promise.all([...new Set(indexes)].map(load))
  }

  return {
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => snapshot,
    baseItems,
    // HSK first, then the chunks in order, whichever arrives first: results don't change order
    getItems: () => {
      if (items?.for !== snapshot) {
        const chunks = [...loaded].sort(([a], [b]) => a - b).map(([, chunk]) => chunk)
        items = {
          for: snapshot,
          list: [
            ...baseItems,
            ...chunks.flatMap((chunk) => chunk.characters.map((entry): StudyItem => ({ kind: 'character', entry }))),
            ...chunks.flatMap((chunk) => chunk.words.map((entry): StudyItem => ({ kind: 'word', entry }))),
          ],
        }
      }
      return items.list
    },
    hasItems: (itemIds) => itemIds.every((itemId) => getStudyItem(snapshot, itemId) !== undefined),
    isComplete: () => loaded.size === CHUNK_COUNT,
    // HSK items need nothing; for the rest, their chunk and those of their characters
    loadItems: (itemIds) =>
      loadChunks(itemIds.filter((itemId) => !getStudyItem(base, itemId)).flatMap(getChunksFor)),
    loadAll: () => loadChunks(Array.from({ length: CHUNK_COUNT }, (_, index) => index)),
  }
}
