import { listWords } from '../dictionary/dictionary.ts'
import { hskDictionary } from '../dictionary/hskDictionary.ts'
import { splitSyllables } from '../../lib/tones.ts'
import type { SentenceToken } from './types.ts'

/**
 * Processes a user sentence (already validated) and returns its tokens with
 * pinyin and tone, which are saved with the sentence. The pinyin engine is
 * loaded on demand: only someone who writes a sentence downloads it.
 */
export async function processSentence(chinese: string): Promise<SentenceToken[]> {
  const { annotateSentence } = await import('./pinyinEngine.ts')
  return annotateSentence(chinese, getDatasetReadings)
}

/**
 * Dataset words with a single reading: hanzi → syllables. Homographs
 * (长 cháng / zhǎng) are left out: there the dataset cannot decide.
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
 * Reading of each character according to the dataset: walks the sentence
 * looking for the longest dataset word starting at each point (学习, 中文, 的).
 * Where there is no word, or it is a homograph, there is no reading.
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
