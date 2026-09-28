/**
 * Fusión: combina lo que devuelve cada adaptador en las entradas del dataset.
 *
 * Reglas:
 * - Cada campo tiene UNA fuente dueña (FIELD_SOURCES). Ninguna otra fuente
 *   lo rellena, ni siquiera cuando la dueña no tiene el dato: entonces el
 *   campo se queda vacío.
 * - Todo es determinista: mismo orden de entrada, mismo resultado.
 */
import { getWordId } from '../../src/features/dictionary/dictionary.ts'
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
    strokeCount: 'hanzi-writer-data',
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
  /** Entradas repetidas en la lista HSK (mismo hanzi y pinyin) que se han juntado en una. */
  duplicates: string[]
  /**
   * Palabras de la lista HSK que no están en CC-CEDICT con ese pinyin. Se
   * dejan fuera (no hay de dónde sacar su significado) y se listan en
   * docs/DATA_CONFLICTS.md.
   */
  leftOut: string[]
}

/** Las palabras de un nivel de la lista HSK. */
export interface HskLevelList {
  level: HskLevel
  words: readonly HskWord[]
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Palabras y caracteres de todos los niveles a partir de la lista HSK y
 * CC-CEDICT. Los niveles se leen en orden (1, 2, 3...).
 *
 * - Palabras: las de la lista, con los significados de CC-CEDICT para ese
 *   mismo hanzi y pinyin. Si la lista repite una palabra con el mismo pinyin
 *   (等 děng en HSK 4, con dos sentidos), se guarda una vez, en su primer
 *   nivel. Si la repite con otro pinyin (长 cháng / zhǎng), son dos palabras
 *   con ids distintos (getWordId).
 * - Caracteres: todos los que aparecen en las palabras, con las lecturas con
 *   las que se usan en ellas. Su nivel es el de la primera palabra en la que
 *   aparecen.
 */
export function buildBaseEntries(levels: readonly HskLevelList[], cedict: CedictIndex): BaseEntries {
  const problems: string[] = []
  const duplicates: string[] = []
  const leftOut: string[] = []

  // Primero se quitan las repeticiones exactas, para saber qué hanzi tienen varias pronunciaciones
  const seen = new Set<string>()
  const entries: (HskWord & { level: HskLevel })[] = []
  for (const { level, words } of levels) {
    for (const { hanzi, pinyin } of words) {
      const key = `${hanzi} ${pinyin}`
      if (seen.has(key)) {
        duplicates.push(`${hanzi} [${pinyin}] (HSK ${level})`)
        continue
      }
      seen.add(key)
      entries.push({ hanzi, pinyin, level })
    }
  }
  const readingsPerHanzi = new Map<string, number>()
  for (const { hanzi } of entries) readingsPerHanzi.set(hanzi, (readingsPerHanzi.get(hanzi) ?? 0) + 1)

  const words: Word[] = []
  for (const { hanzi, pinyin, level } of entries) {
    const cedictEntries = findEntries(cedict, hanzi, pinyin)
    const meanings = usableMeanings(cedictEntries)
    if (meanings.length === 0) {
      leftOut.push(`${hanzi} [${pinyin}] (HSK ${level})`)
      continue
    }
    const traditional = traditionalOf(cedictEntries)
    words.push({
      id: getWordId(hanzi, pinyin, readingsPerHanzi.get(hanzi)! > 1),
      hanzi,
      pinyin,
      meanings: { en: meanings },
      hskLevel: level,
      ...(traditional !== undefined && { traditional }),
    })
  }

  const readingsByCharacter = new Map<string, { level: HskLevel; readings: string[] }>()
  // Caracteres que aparecen en nombres propios (汉语 Hàn yǔ, 中国 Zhōng guó):
  // para ellos también sirven las entradas en mayúscula (汉 "Han; Chinese").
  const properNounCharacters = new Set<string>()

  for (const { hanzi, pinyin, hskLevel: level } of words) {
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
      const known = readingsByCharacter.get(character) ?? { level, readings: [] }
      if (!known.readings.includes(reading)) known.readings.push(reading)
      readingsByCharacter.set(character, known)
    })
  }

  const characters: Character[] = [...readingsByCharacter].map(([hanzi, { level, readings }]) => {
    const cedictEntries = readings.flatMap((reading) => [
      ...(properNounCharacters.has(hanzi) ? findEntries(cedict, hanzi, capitalize(reading)) : []),
      ...findEntries(cedict, hanzi, reading),
    ])
    return { id: hanzi, hanzi, pinyin: readings, meanings: { en: usableMeanings(cedictEntries) }, hskLevel: level }
  })

  return { characters, words, problems, duplicates, leftOut }
}

/** Lo que cada fuente sabe de un carácter. Una fuente sin datos para él queda undefined. */
export interface CharacterSources {
  unihan?: UnihanCharacter
  makeMeAHanzi?: MakeMeAHanziCharacter
  /**
   * Número de trazos según hanzi-writer-data. Manda sobre el de Unihan para
   * que coincida con la animación, que dibuja la forma simplificada.
   */
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
  const { unihan, makeMeAHanzi, hanziWriterStrokeCount } = sources
  return {
    ...base,
    ...(hanziWriterStrokeCount !== undefined && { strokeCount: hanziWriterStrokeCount }),
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
        `${hanzi}: Unihan dice ${unihan.strokeCount} trazos y hanzi-writer-data tiene ${hanziWriterStrokeCount}. Se usa el de hanzi-writer-data.`,
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
