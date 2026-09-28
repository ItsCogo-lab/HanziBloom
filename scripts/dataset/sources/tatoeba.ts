/**
 * Adaptador de Tatoeba (frases CC BY 2.0 FR).
 *
 * Responsabilidad: elegir frases de ejemplo en chino con traducción al inglés
 * para las palabras del dataset. Lee las exportaciones por idioma de
 * https://downloads.tatoeba.org/exports/per_language/:
 *
 * - cmn_sentences_detailed.tsv y eng_sentences_detailed.tsv:
 *   id, idioma, texto, usuario, fecha de alta, fecha de cambio.
 * - cmn-eng_links.tsv: pares de ids (frase china, traducción inglesa).
 *
 * No se genera ni se modifica ninguna frase: se copian tal cual.
 */
import type { ExampleSentence } from '../../../src/features/dictionary/types.ts'

export interface TatoebaSentence {
  id: number
  text: string
  /** Undefined si la frase es huérfana (sin autor). */
  author?: string
}

/** Tatoeba usa "\N" para los valores vacíos (frases huérfanas, sin autor). */
const NULL_VALUE = '\\N'

/** Frases de ejemplo por palabra como máximo. */
export const MAX_EXAMPLES_PER_WORD = 3

/** Longitud máxima de una frase de ejemplo, en caracteres. Las cortas son más fáciles de leer. */
export const MAX_SENTENCE_LENGTH = 16

const HAN = /\p{Script=Han}/u
/** Letras latinas y dígitos: suelen ser nombres propios o cifras que distraen. */
const LATIN_OR_DIGIT = /[A-Za-z0-9Ａ-Ｚａ-ｚ０-９]/

/** Lee una línea de `*_sentences_detailed.tsv`. */
export function parseSentenceLine(line: string): TatoebaSentence | undefined {
  const [id, , text, author] = line.split('\t')
  const numericId = Number(id)
  if (!text || !Number.isInteger(numericId) || numericId <= 0) return undefined
  return { id: numericId, text, ...(author && author !== NULL_VALUE && { author }) }
}

/** Lee una línea de `cmn-eng_links.tsv`: [id de la frase china, id de la traducción]. */
export function parseLinkLine(line: string): [number, number] | undefined {
  const [from, to] = line.split('\t').map(Number)
  if (!from || !to) return undefined
  return [from, to]
}

/**
 * Si una frase sirve de ejemplo: corta, sin letras latinas ni cifras, y con
 * todos sus caracteres chinos dentro de los que se estudian (así el alumno
 * puede leerla entera). Las frases chinas huérfanas (sin autor) no se usan:
 * nadie responde de ellas en Tatoeba.
 */
export function isUsableSentence(text: string, knownCharacters: ReadonlySet<string>): boolean {
  const symbols = Array.from(text)
  if (symbols.length > MAX_SENTENCE_LENGTH || LATIN_OR_DIGIT.test(text)) return false
  return symbols.every((symbol) => !HAN.test(symbol) || knownCharacters.has(symbol))
}

export interface ExampleInputs {
  /** Palabras del dataset, en su orden. */
  words: readonly string[]
  knownCharacters: ReadonlySet<string>
  chinese: ReadonlyMap<number, TatoebaSentence>
  english: ReadonlyMap<number, TatoebaSentence>
  /** Traducciones inglesas de cada frase china. */
  translations: ReadonlyMap<number, readonly number[]>
}

/**
 * Elige hasta MAX_EXAMPLES_PER_WORD frases por palabra. Criterio
 * determinista: las más cortas primero y, a igual longitud, la de id más
 * bajo. Como traducción se usa la de id más bajo.
 */
export function selectExamples(inputs: ExampleInputs): ExampleSentence[] {
  const { words, knownCharacters, chinese, english, translations } = inputs

  const candidates = [...chinese.values()]
    .filter((sentence) => sentence.author !== undefined && isUsableSentence(sentence.text, knownCharacters))
    .map((sentence) => {
      const translation = [...(translations.get(sentence.id) ?? [])]
        .sort((a, b) => a - b)
        .map((id) => english.get(id))
        .find((found) => found !== undefined)
      return translation && { sentence, translation }
    })
    .filter((candidate) => candidate !== undefined)
    .sort(
      (a, b) =>
        Array.from(a.sentence.text).length - Array.from(b.sentence.text).length || a.sentence.id - b.sentence.id,
    )

  const selected = new Map<number, ExampleSentence>()
  for (const word of words) {
    const examples = candidates.filter(({ sentence }) => sentence.text.includes(word)).slice(0, MAX_EXAMPLES_PER_WORD)
    for (const { sentence, translation } of examples) {
      const existing = selected.get(sentence.id)
      if (existing) {
        existing.words.push(word)
        continue
      }
      selected.set(sentence.id, {
        tatoebaId: sentence.id,
        zh: sentence.text,
        author: sentence.author!,
        en: translation.text,
        translationTatoebaId: translation.id,
        ...(translation.author !== undefined && { translationAuthor: translation.author }),
        words: [word],
      })
    }
  }
  return [...selected.values()].sort((a, b) => a.tatoebaId - b.tatoebaId)
}
