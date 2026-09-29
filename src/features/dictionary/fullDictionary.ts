import type { StudyItemId } from './studyItem.ts'
import type { Character, Word } from './types.ts'

/*
 * El diccionario completo (todo CC-CEDICT menos lo que ya está en HSK 1-4)
 * no va en el bundle: son más de 100.000 entradas. `npm run data:build` lo
 * reparte en CHUNK_COUNT archivos (0.json ... 31.json), que se publican en el
 * repositorio de datos (runtime/dictionarySource.ts), y la app pide solo los
 * que necesita.
 *
 * Cada entrada va en el trozo de su primer carácter. Así, sabiendo el hanzi,
 * se sabe qué archivo pedir sin ningún índice aparte, y un carácter viaja
 * junto a las palabras que empiezan por él.
 */

/** Número de trozos del diccionario completo. Si cambia, hay que regenerar el dataset. */
export const CHUNK_COUNT = 32

/** Un trozo del diccionario completo. Sus entradas no tienen nivel HSK. */
export interface DictionaryChunk {
  characters: Character[]
  words: Word[]
}

/** Trozo en el que va una entrada: el punto de código de su primer carácter, módulo CHUNK_COUNT. */
export function getChunkIndex(hanzi: string): number {
  return hanzi.codePointAt(0)! % CHUNK_COUNT
}

export function chunkFileName(index: number): string {
  return `${index}.json`
}

/** El hanzi de un elemento de estudio: "word:长[cháng]" → "长". */
export function getItemHanzi(itemId: StudyItemId): string {
  const id = itemId.slice(itemId.indexOf(':') + 1)
  const bracket = id.indexOf('[')
  return bracket === -1 ? id : id.slice(0, bracket)
}

/**
 * Trozos que hacen falta para mostrar un elemento: el suyo y los de sus
 * caracteres (la ficha de una palabra enseña cada carácter).
 */
export function getChunksFor(itemId: StudyItemId): number[] {
  return [...new Set(Array.from(getItemHanzi(itemId)).map(getChunkIndex))]
}
