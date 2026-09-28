import type { Tone } from '../../lib/tones.ts'
import type { StudyItemId } from '../dictionary/studyItem.ts'

/**
 * Un set creado por el usuario, tal como se guarda. Solo guarda ids de
 * elementos del diccionario: nunca copia ni cambia hanzi, pinyin ni
 * significados, que siguen saliendo del dataset. Es JSON puro, así que se
 * puede exportar o mandar a un servidor más adelante sin cambiarlo.
 */
export interface CustomSet {
  /** "custom-" + un id aleatorio; único entre todos los sets. */
  id: string
  name: string
  /** Opcional: puede estar vacía. */
  description: string
  itemIds: StudyItemId[]
  /**
   * Significados propios del usuario para elementos de este set. Son notas
   * suyas: el significado del diccionario no cambia, y el mismo elemento en
   * otro set tiene sus propias notas.
   */
  meanings: Partial<Record<StudyItemId, string>>
  /** Frases de ejemplo del usuario. Como los significados, solo existen en este set. */
  sentences: CustomSentence[]
  /** Fechas ISO 8601. */
  createdAt: string
  updatedAt: string
}

export interface CustomSetDetails {
  name: string
  description: string
}

/**
 * Un trozo de una frase: un carácter chino con su lectura, o un texto que no
 * es chino (puntuación, espacios, letras), que se muestra tal cual y sin tono.
 */
export interface SentenceToken {
  text: string
  /** Solo en caracteres chinos: la sílaba con marca de tono ("píng"). */
  pinyin?: string
  /** El tono de esa sílaba; falta si no se puede saber. */
  tone?: Tone
  /**
   * El motor de pinyin no puede asegurar la lectura en este contexto (un
   * carácter con varias lecturas fuera de una palabra conocida). Se muestra
   * marcado y sin color hasta que el usuario elige entre `candidates`.
   */
  uncertain?: boolean
  /** Lecturas posibles del carácter, para que el usuario elija. */
  candidates?: string[]
}

/**
 * Una frase del usuario. Solo escribe el chino; el pinyin y los tonos se
 * generan y se guardan aparte (en `tokens`), para no depender del motor al
 * mostrarla.
 */
export interface CustomSentence {
  /** "sentence-" + un id aleatorio. */
  id: string
  /** El elemento del set al que acompaña; si falta, es una frase del set. */
  itemId?: StudyItemId
  chinese: string
  tokens: SentenceToken[]
  createdAt: string
  updatedAt: string
}
