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

/**
 * Id de una palabra: su hanzi o, si la misma palabra aparece con varias
 * pronunciaciones (homógrafos como 长 cháng / zhǎng), el hanzi con su
 * pinyin entre corchetes, como en CC-CEDICT: "长[cháng]".
 */
export function getWordId(hanzi: string, pinyin: string, isHomograph: boolean): string {
  return isHomograph ? `${hanzi}[${pinyin}]` : hanzi
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

/** Significados en un idioma; si no existen en ese idioma, devuelve los de inglés. */
export function getMeanings(translations: Translations, locale: ContentLocale = 'en'): string[] {
  return translations[locale] ?? translations.en
}

/** Pinyin listo para mostrar. Si un carácter tiene varias lecturas, van separadas por comas. */
export function formatPinyin(entry: Character | Word): string {
  return typeof entry.pinyin === 'string' ? entry.pinyin : entry.pinyin.join(', ')
}

/**
 * Formas tradicionales que se escriben distinto del simplificado: 柠 → [檸],
 * 八 → []. Si un carácter se escribe igual en ambos sistemas, no hay nada
 * que enseñar.
 */
export function getTraditionalForms(entry: Character | Word): string[] {
  const forms = typeof entry.traditional === 'string' ? [entry.traditional] : (entry.traditional ?? [])
  return forms.filter((form) => form !== entry.hanzi)
}
