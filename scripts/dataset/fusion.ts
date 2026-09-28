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
import { findEntries, readingOf, traditionalOf, usableMeanings, type CedictIndex } from './sources/cedict.ts'
import type { HskWord } from './sources/hsk.ts'
import type { MakeMeAHanziCharacter } from './sources/makemeahanzi.ts'
import type { UnihanCharacter } from './sources/unihan.ts'

/** Qué fuente manda en cada campo. Documentado también en docs/DATA_SOURCES.md. */
export const FIELD_SOURCES = {
  character: {
    hskLevel: 'HSK list',
    pinyin: 'CC-CEDICT (reading used in the HSK words)',
    meanings: 'CC-CEDICT',
    strokeCount: 'Unihan',
    radical: 'Unihan',
    radicalNumber: 'Unihan',
    traditional: 'Unihan',
    decomposition: 'Make Me a Hanzi',
    etymology: 'Make Me a Hanzi',
    strokeOrder: 'hanzi-writer-data (public/strokes/)',
  },
  word: {
    hskLevel: 'HSK list',
    pinyin: 'HSK list',
    meanings: 'CC-CEDICT',
    traditional: 'CC-CEDICT',
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
    const entries = findEntries(cedict, hanzi, pinyin)
    const meanings = usableMeanings(entries)
    if (meanings.length === 0) problems.push(`Palabra ${hanzi} [${pinyin}]: sin entrada en CC-CEDICT`)
    const traditional = traditionalOf(entries)
    return {
      id: hanzi,
      hanzi,
      pinyin,
      meanings: { en: meanings },
      hskLevel: level,
      ...(traditional !== undefined && { traditional }),
    }
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

/** Lo que cada fuente sabe de un carácter. Una fuente sin datos para él queda undefined. */
export interface CharacterSources {
  unihan?: UnihanCharacter
  makeMeAHanzi?: MakeMeAHanziCharacter
  /** Número de trazos según hanzi-writer-data; solo para comprobar el de Unihan. */
  hanziWriterStrokeCount?: number
  /**
   * Número Kangxi (según Unihan) del radical que da Make Me a Hanzi. Sirve
   * para comparar radicales escritos en otra forma: 亻 y 人 son el radical 9.
   */
  makeMeAHanziRadicalNumber?: number
}

/**
 * Añade a un carácter los campos de las demás fuentes, cada uno de su fuente
 * dueña. Solo se copian valores que existen: nunca se escribe undefined ni
 * se toma el dato de otra fuente.
 */
export function enrichCharacter(base: Character, sources: CharacterSources): Character {
  const { unihan, makeMeAHanzi } = sources
  return {
    ...base,
    ...(unihan?.strokeCount !== undefined && { strokeCount: unihan.strokeCount }),
    ...(unihan?.radical !== undefined && { radical: unihan.radical }),
    ...(unihan?.radicalNumber !== undefined && { radicalNumber: unihan.radicalNumber }),
    ...(unihan?.traditional !== undefined && { traditional: unihan.traditional }),
    ...(makeMeAHanzi?.decomposition !== undefined && { decomposition: makeMeAHanzi.decomposition }),
    ...(makeMeAHanzi?.etymology !== undefined && { etymology: makeMeAHanzi.etymology }),
  }
}

/**
 * Compara lo que dicen dos fuentes sobre el mismo dato. No corrige nada: el
 * dataset usa siempre la fuente dueña y aquí solo se avisa del desacuerdo
 * para que una persona lo revise.
 */
export function crossCheckCharacter(hanzi: string, sources: CharacterSources): string[] {
  const { unihan, makeMeAHanzi, hanziWriterStrokeCount, makeMeAHanziRadicalNumber } = sources
  const conflicts: string[] = []
  if (unihan?.strokeCount !== undefined && hanziWriterStrokeCount !== undefined) {
    if (unihan.strokeCount !== hanziWriterStrokeCount) {
      conflicts.push(
        `${hanzi}: Unihan dice ${unihan.strokeCount} trazos y hanzi-writer-data tiene ${hanziWriterStrokeCount}. Se usa el de Unihan.`,
      )
    }
  }
  if (
    unihan?.radical !== undefined &&
    makeMeAHanzi !== undefined &&
    unihan.radical !== makeMeAHanzi.radical &&
    unihan.radicalNumber !== makeMeAHanziRadicalNumber
  ) {
    conflicts.push(
      `${hanzi}: el radical es ${unihan.radical} en Unihan y ${makeMeAHanzi.radical} en Make Me a Hanzi. Se usa el de Unihan.`,
    )
  }
  return conflicts
}
