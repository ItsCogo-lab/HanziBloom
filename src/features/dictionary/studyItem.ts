import { getCharacter, getCharactersOfWord, getWord, getWordsWithCharacter, type Dictionary } from './dictionary.ts'
import type { Character, Word } from './types.ts'

/**
 * Algo que se puede estudiar: un carácter o una palabra.
 *
 * Es una "unión discriminada": el campo `kind` indica cuál de los dos es, y
 * TypeScript sabe qué tipo tiene `entry` después de comprobar `kind`.
 * Los ejercicios y el progreso trabajarán con StudyItem para no duplicar
 * lógica entre caracteres y palabras.
 */
export type StudyItem = { kind: 'character'; entry: Character } | { kind: 'word'; entry: Word }

/**
 * Identificador único de un elemento de estudio, p. ej. "char:好" o "word:好".
 *
 * Hace falta el prefijo porque 好 es a la vez un carácter y una palabra de
 * HSK 1, y su progreso se registra por separado.
 */
export type StudyItemId = `char:${string}` | `word:${string}`

export function getStudyItemId(item: StudyItem): StudyItemId {
  return item.kind === 'character' ? `char:${item.entry.id}` : `word:${item.entry.id}`
}

/** Todos los caracteres y palabras del diccionario como elementos de estudio. */
export function listStudyItems(dictionary: Dictionary): StudyItem[] {
  return [
    ...[...dictionary.characters.values()].map((entry): StudyItem => ({ kind: 'character', entry })),
    ...[...dictionary.words.values()].map((entry): StudyItem => ({ kind: 'word', entry })),
  ]
}

/** Busca un elemento por su id ("char:好" o "word:你好"). */
export function getStudyItem(dictionary: Dictionary, id: StudyItemId): StudyItem | undefined {
  if (id.startsWith('char:')) {
    const entry = getCharacter(dictionary, id.slice('char:'.length))
    return entry && { kind: 'character', entry }
  }
  const entry = getWord(dictionary, id.slice('word:'.length))
  return entry && { kind: 'word', entry }
}

/**
 * Elementos relacionados: los caracteres de una palabra, o las palabras en
 * las que aparece un carácter. La palabra con el mismo hanzi que el carácter
 * (谁 carácter y 谁 palabra) no se incluye: no aporta nada.
 */
export function getRelatedItems(dictionary: Dictionary, item: StudyItem): StudyItem[] {
  if (item.kind === 'word') {
    return getCharactersOfWord(dictionary, item.entry).map((entry): StudyItem => ({ kind: 'character', entry }))
  }
  return getWordsWithCharacter(dictionary, item.entry.id)
    .filter((word) => word.hanzi !== item.entry.hanzi)
    .map((entry): StudyItem => ({ kind: 'word', entry }))
}
