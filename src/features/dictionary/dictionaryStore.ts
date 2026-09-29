import type { Dictionary } from './dictionary.ts'
import { CHUNK_COUNT, getChunksFor, type DictionaryChunk } from './fullDictionary.ts'
import { getStudyItem, listStudyItems, type StudyItem, type StudyItemId } from './studyItem.ts'

export type LoadChunk = (index: number) => Promise<DictionaryChunk>

/**
 * El diccionario que usa la interfaz: HSK 1-4 (en el bundle) más los trozos
 * del diccionario completo que ya se han cargado. Empieza solo con HSK y
 * crece a medida que se piden trozos; nunca descarga uno dos veces.
 *
 * Sigue el contrato de useSyncExternalStore: `getSnapshot` devuelve el mismo
 * objeto mientras no cambie nada, y uno nuevo cuando llega un trozo.
 */
export interface DictionaryStore {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => Dictionary
  /** Los elementos de HSK 1-4, que están siempre. */
  baseItems: readonly StudyItem[]
  /** Todos los elementos cargados, calculados una vez por versión del diccionario. */
  getItems: () => readonly StudyItem[]
  /** Si ya se pueden mostrar todos estos elementos. */
  hasItems: (itemIds: readonly StudyItemId[]) => boolean
  /** Si ya están cargados todos los trozos. */
  isComplete: () => boolean
  /** Carga lo necesario para mostrar estos elementos (los de HSK ya están). */
  loadItems: (itemIds: readonly StudyItemId[]) => Promise<void>
  /** Carga todo el diccionario, para buscar en él. */
  loadAll: () => Promise<void>
}

export function createDictionaryStore(base: Dictionary, loadChunk: LoadChunk): DictionaryStore {
  // Copias: el diccionario HSK del bundle no se toca
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
          // Se puede volver a intentar más tarde
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
    // HSK primero y luego los trozos en orden, llegue antes el que llegue: los resultados no cambian de orden
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
    // Lo de HSK no necesita nada; de lo demás, su trozo y los de sus caracteres
    loadItems: (itemIds) =>
      loadChunks(itemIds.filter((itemId) => !getStudyItem(base, itemId)).flatMap(getChunksFor)),
    loadAll: () => loadChunks(Array.from({ length: CHUNK_COUNT }, (_, index) => index)),
  }
}
