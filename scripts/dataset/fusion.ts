/**
 * Fusión: combina lo que devuelve cada adaptador en las entradas del dataset.
 *
 * Reglas:
 * - Cada campo tiene UNA fuente dueña (FIELD_SOURCES). Ninguna otra fuente
 *   lo rellena, ni siquiera cuando la dueña no tiene el dato: entonces el
 *   campo se queda vacío.
 * - Todo es determinista: mismo orden de entrada, mismo resultado.
 */
import type { Character, HskLevel, Word } from '../../src/features/dictionary/types.ts'
import { findEntries, readingOf, usableMeanings, type CedictIndex } from './sources/cedict.ts'
import type { HskWord } from './sources/hsk.ts'

/** Qué fuente manda en cada campo. Documentado también en docs/DATA_SOURCES.md. */
export const FIELD_SOURCES = {
  character: {
    hskLevel: 'HSK list',
    pinyin: 'CC-CEDICT (reading used in the HSK words)',
    meanings: 'CC-CEDICT',
  },
  word: {
    hskLevel: 'HSK list',
    pinyin: 'HSK list',
    meanings: 'CC-CEDICT',
  },
} as const

export interface BaseEntries {
  characters: Character[]
  words: Word[]
  problems: string[]
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Palabras y caracteres de un nivel a partir de la lista HSK y CC-CEDICT.
 *
 * - Palabras: las de la lista, con los significados de CC-CEDICT para ese
 *   mismo hanzi y pinyin.
 * - Caracteres: todos los que aparecen en las palabras, con la lectura con
 *   la que se usan en ellas.
 */
export function buildBaseEntries(hskList: readonly HskWord[], cedict: CedictIndex, level: HskLevel): BaseEntries {
  const problems: string[] = []

  const words: Word[] = hskList.map(({ hanzi, pinyin }) => {
    const meanings = usableMeanings(findEntries(cedict, hanzi, pinyin))
    if (meanings.length === 0) problems.push(`Palabra ${hanzi} [${pinyin}]: sin entrada en CC-CEDICT`)
    return { id: hanzi, hanzi, pinyin, meanings: { en: meanings }, hskLevel: level }
  })

  const readingsByCharacter = new Map<string, string[]>()
  // Caracteres que aparecen en nombres propios (汉语 Hàn yǔ, 中国 Zhōng guó):
  // para ellos también sirven las entradas en mayúscula (汉 "Han; Chinese").
  const properNounCharacters = new Set<string>()

  for (const { hanzi, pinyin } of hskList) {
    const characters = Array.from(hanzi)
    const syllables = pinyin.split(/\s+/)
    if (characters.length !== syllables.length) {
      problems.push(`Palabra ${hanzi} [${pinyin}]: no hay una sílaba por carácter`)
      continue
    }
    characters.forEach((character, index) => {
      const syllable = syllables[index]!
      if (syllable !== syllable.toLowerCase()) properNounCharacters.add(character)

      const reading = readingOf(cedict, character, syllable.toLowerCase())
      if (!reading) {
        problems.push(`Carácter ${character} [${syllable}] (en ${hanzi}): sin lectura en CC-CEDICT`)
        return
      }
      const readings = readingsByCharacter.get(character) ?? []
      if (!readings.includes(reading)) readings.push(reading)
      readingsByCharacter.set(character, readings)
    })
  }

  const characters: Character[] = [...readingsByCharacter].map(([hanzi, readings]) => {
    const entries = readings.flatMap((reading) => [
      ...(properNounCharacters.has(hanzi) ? findEntries(cedict, hanzi, capitalize(reading)) : []),
      ...findEntries(cedict, hanzi, reading),
    ])
    return { id: hanzi, hanzi, pinyin: readings, meanings: { en: usableMeanings(entries) }, hskLevel: level }
  })

  return { characters, words, problems }
}
