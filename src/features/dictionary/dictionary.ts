import type { Character, ContentLocale, HskLevel, Translations, Word } from './types.ts'

/**
 * Todos los caracteres y palabras disponibles, indexados por id.
 *
 * Usamos Map para buscar por id en tiempo constante. Un Map mantiene el
 * orden de inserción, así que los listados salen en el orden del dataset.
 */
export interface Dictionary {
  characters: ReadonlyMap<string, Character>
  words: ReadonlyMap<string, Word>
}

export function createDictionary(characters: readonly Character[], words: readonly Word[]): Dictionary {
  return {
    characters: new Map(characters.map((character) => [character.id, character])),
    words: new Map(words.map((word) => [word.id, word])),
  }
}

export function getCharacter(dictionary: Dictionary, id: string): Character | undefined {
  return dictionary.characters.get(id)
}

export function getWord(dictionary: Dictionary, id: string): Word | undefined {
  return dictionary.words.get(id)
}

/** Lista los caracteres, opcionalmente solo los de un nivel HSK. */
export function listCharacters(dictionary: Dictionary, level?: HskLevel): Character[] {
  const all = [...dictionary.characters.values()]
  return level === undefined ? all : all.filter((character) => character.hskLevel === level)
}

/** Lista las palabras, opcionalmente solo las de un nivel HSK. */
export function listWords(dictionary: Dictionary, level?: HskLevel): Word[] {
  const all = [...dictionary.words.values()]
  return level === undefined ? all : all.filter((word) => word.hskLevel === level)
}

/**
 * Caracteres que forman una palabra, en orden y sin repetir (谢谢 → 谢).
 *
 * No guardamos esta lista en los datos porque se deduce de `word.hanzi`:
 * un dato que se puede calcular no puede quedar desincronizado.
 */
export function getCharactersOfWord(dictionary: Dictionary, word: Word): Character[] {
  const uniqueHanzi = new Set(Array.from(word.hanzi))
  return [...uniqueHanzi]
    .map((hanzi) => dictionary.characters.get(hanzi))
    .filter((character) => character !== undefined)
}

/**
 * Palabras que contienen un carácter (las "palabras relacionadas").
 * Recorre todas las palabras: con unos pocos miles de entradas es instantáneo.
 */
export function getWordsWithCharacter(dictionary: Dictionary, characterId: string): Word[] {
  return listWords(dictionary).filter((word) => word.hanzi.includes(characterId))
}

/** Significados en un idioma; si no existen en ese idioma, devuelve los de español. */
export function getMeanings(translations: Translations, locale: ContentLocale = 'es'): string[] {
  return translations[locale] ?? translations.es
}
