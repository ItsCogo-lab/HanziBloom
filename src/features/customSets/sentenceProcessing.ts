import { listWords } from '../dictionary/dictionary.ts'
import { hskDictionary } from '../dictionary/hskDictionary.ts'
import { splitSyllables } from '../../lib/tones.ts'
import type { SentenceToken } from './types.ts'

/**
 * Procesa una frase del usuario (ya validada) y devuelve sus trozos con
 * pinyin y tono, que se guardan con la frase. El motor de pinyin se carga
 * bajo demanda: solo quien escribe una frase lo descarga.
 */
export async function processSentence(chinese: string): Promise<SentenceToken[]> {
  const { annotateSentence } = await import('./pinyinEngine.ts')
  return annotateSentence(chinese, getDatasetReadings)
}

/**
 * Palabras del dataset con una sola lectura: hanzi → sílabas. Los homógrafos
 * (长 cháng / zhǎng) se dejan fuera: ahí el dataset no puede decidir.
 */
const unambiguousWords = (() => {
  const words = new Map<string, string[] | null>()
  for (const word of listWords(hskDictionary)) {
    const syllables = splitSyllables(word.pinyin.toLowerCase())
    const unique = !words.has(word.hanzi) && syllables.length === Array.from(word.hanzi).length
    words.set(word.hanzi, unique ? syllables : null)
  }
  return words
})()

const LONGEST_WORD = Math.max(...[...unambiguousWords.keys()].map((hanzi) => Array.from(hanzi).length))

/**
 * Lectura de cada carácter según el dataset: se recorre la frase buscando
 * la palabra más larga del dataset que empieza en cada punto (学习, 中文, 的).
 * Donde no hay palabra, o es un homógrafo, no hay lectura.
 */
export function getDatasetReadings(chinese: string): (string | undefined)[] {
  const characters = Array.from(chinese)
  const readings: (string | undefined)[] = []
  let index = 0
  while (index < characters.length) {
    let matched = false
    for (let length = Math.min(LONGEST_WORD, characters.length - index); length >= 1; length--) {
      const syllables = unambiguousWords.get(characters.slice(index, index + length).join(''))
      if (syllables) {
        readings.push(...syllables)
        index += length
        matched = true
        break
      }
    }
    if (!matched) {
      readings.push(undefined)
      index += 1
    }
  }
  return readings
}
