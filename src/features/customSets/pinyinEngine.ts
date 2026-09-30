import { OutputFormat, pinyin, polyphonic, segment } from 'pinyin-pro'
import { getSyllableTone } from '../../lib/tones.ts'
import { isChineseCharacter } from './sentences.ts'
import type { SentenceToken } from './types.ts'

/**
 * Pinyin for the user's sentences with pinyin-pro (MIT), a deterministic
 * engine: the same sentence always gives the same result. It has a word
 * dictionary, so a character with several readings is read according to
 * the word it is in (银行 yínháng, 行长 hángzhǎng).
 *
 * It applies the tone sandhi of 一 and 不 (一个 yí gè, 不对 bú duì), because
 * that is what is pronounced. The version is pinned in package.json so the
 * generated pinyin does not change on its own.
 *
 * The engine does not know the neutral tones of many words (朋友 péng yǒu):
 * where the HSK dataset reads that same syllable in neutral tone (朋友 péng you),
 * the dataset's one is used.
 *
 * It never guesses. A character with several readings is only considered
 * certain if the engine reads it inside one of its words (行长), or if its
 * reading matches the HSK dataset (CC-CEDICT) at that point of the sentence:
 * the dataset word starting there (中文 zhōng wén) or the character as a
 * standalone word (的 de). Otherwise it is marked as uncertain, without
 * color, and the user picks among the possible readings.
 */

/** For each character of the sentence, its dataset reading if there is one (see sentenceProcessing.ts). */
export type DatasetReadings = (chinese: string) => readonly (string | undefined)[]

export function annotateSentence(chinese: string, datasetReadings: DatasetReadings): SentenceToken[] {
  const characters = Array.from(chinese)
  const readings = pinyin(chinese, { type: 'array' })
  // Without the 一/不 tone sandhi: the dictionary reading, to compare it with the dataset
  const citations = pinyin(chinese, { type: 'array', toneSandhi: false })
  if (readings.length !== characters.length || citations.length !== characters.length) {
    throw new Error('pinyin-pro did not return one syllable per character')
  }
  const inWord = getCharactersInWords(chinese)
  const fromDataset = datasetReadings(chinese)

  const tokens: SentenceToken[] = []
  characters.forEach((character, index) => {
    const last = tokens.at(-1)
    if (!isChineseCharacter(character)) {
      // Punctuation, spaces and letters: as is, without pinyin or tone
      if (last && !isChineseCharacter(last.text)) last.text += character
      else tokens.push({ text: character })
      return
    }

    const reading = neutralFromDataset(readings[index] ?? '', fromDataset[index])
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

/** The dataset syllable if it is the engine's one but in neutral tone; otherwise the engine's. */
function neutralFromDataset(reading: string, datasetReading: string | undefined): string {
  if (datasetReading === undefined || getSyllableTone(datasetReading) !== 5) return reading
  return withoutToneMarks(datasetReading) === withoutToneMarks(reading) ? datasetReading : reading
}

function withoutToneMarks(syllable: string): string {
  return syllable.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

/** All readings of a character according to the engine, without duplicates. */
function getReadings(character: string): string[] {
  const [readings = ''] = polyphonic(character)
  return [...new Set(readings.split(' ').filter((reading) => getSyllableTone(reading) !== undefined))]
}

/** For each character of the sentence: is it inside a multi-syllable word of the engine's dictionary? */
function getCharactersInWords(chinese: string): boolean[] {
  const result: boolean[] = []
  for (const { origin } of segment(chinese, { format: OutputFormat.AllSegment })) {
    const length = Array.from(origin).length
    for (let i = 0; i < length; i++) result.push(length > 1)
  }
  return result
}
