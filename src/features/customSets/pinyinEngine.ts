import { OutputFormat, pinyin, polyphonic, segment } from 'pinyin-pro'
import { getSyllableTone } from '../../lib/tones.ts'
import { isChineseCharacter } from './sentences.ts'
import type { SentenceToken } from './types.ts'

/**
 * Pinyin de las frases del usuario con pinyin-pro (MIT), un motor
 * determinista: la misma frase da siempre el mismo resultado. Tiene un
 * diccionario de palabras, así que un carácter con varias lecturas se lee
 * según la palabra en la que está (银行 yínháng, 行长 hángzhǎng).
 *
 * Aplica los cambios de tono de 一 y 不 (一个 yí gè, 不对 bú duì), porque es
 * lo que se pronuncia. La versión está fijada en package.json para que el
 * pinyin generado no cambie solo.
 *
 * Nunca se adivina. Un carácter con varias lecturas solo se da por seguro
 * si el motor lo lee dentro de una de sus palabras (行长), o si su lectura
 * coincide con la del dataset HSK (CC-CEDICT) en ese punto de la frase: la
 * palabra del dataset que empieza ahí (中文 zhōng wén) o el carácter como
 * palabra suelta (的 de). Si no, se marca como dudoso, sin color, y el
 * usuario elige entre las lecturas posibles.
 */

/** Para cada carácter de la frase, su lectura según el dataset si la hay (ver sentenceProcessing.ts). */
export type DatasetReadings = (chinese: string) => readonly (string | undefined)[]

export function annotateSentence(chinese: string, datasetReadings: DatasetReadings): SentenceToken[] {
  const characters = Array.from(chinese)
  const readings = pinyin(chinese, { type: 'array' })
  // Sin cambios de tono de 一/不: la lectura de diccionario, para compararla con el dataset
  const citations = pinyin(chinese, { type: 'array', toneSandhi: false })
  if (readings.length !== characters.length || citations.length !== characters.length) {
    throw new Error('pinyin-pro no ha devuelto una sílaba por carácter')
  }
  const inWord = getCharactersInWords(chinese)
  const fromDataset = datasetReadings(chinese)

  const tokens: SentenceToken[] = []
  characters.forEach((character, index) => {
    const last = tokens.at(-1)
    if (!isChineseCharacter(character)) {
      // Puntuación, espacios y letras: tal cual, sin pinyin ni tono
      if (last && !isChineseCharacter(last.text)) last.text += character
      else tokens.push({ text: character })
      return
    }

    const reading = readings[index] ?? ''
    const tone = getSyllableTone(reading)
    const candidates = getReadings(character)
    const certain =
      tone !== undefined &&
      (candidates.length <= 1 || inWord[index] === true || fromDataset[index] === citations[index])
    tokens.push(
      certain
        ? { text: character, pinyin: reading, tone }
        : { text: character, ...(tone === undefined ? {} : { pinyin: reading }), uncertain: true, candidates },
    )
  })
  return tokens
}

/** Todas las lecturas de un carácter según el motor, sin repetidos. */
function getReadings(character: string): string[] {
  const [readings = ''] = polyphonic(character)
  return [...new Set(readings.split(' ').filter((reading) => getSyllableTone(reading) !== undefined))]
}

/** Para cada carácter de la frase: ¿está dentro de una palabra de varias sílabas del diccionario del motor? */
function getCharactersInWords(chinese: string): boolean[] {
  const result: boolean[] = []
  for (const { origin } of segment(chinese, { format: OutputFormat.AllSegment })) {
    const length = Array.from(origin).length
    for (let i = 0; i < length; i++) result.push(length > 1)
  }
  return result
}
