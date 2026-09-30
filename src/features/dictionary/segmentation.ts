import type { StudyItem } from './studyItem.ts'

/** The dictionary entries by hanzi: what's needed to split a sentence into words. */
export interface WordIndex {
  /** Entries written with exactly these hanzi (a word, a character, homographs), HSK ones first. */
  find: (hanzi: string) => readonly StudyItem[]
  /** Length in characters of the longest entry. */
  longest: () => number
}

/**
 * A piece of a sentence: a dictionary word, or text that isn't one
 * (punctuation, letters, a character that isn't in the dictionary).
 */
export interface SentenceWord {
  text: string
  item?: StudyItem
}

const HAN = /\p{Script=Han}/u

/**
 * Splits a sentence into dictionary words by longest match: at each point,
 * the longest entry that starts there (他被选为市长 → 他 · 被 · 选为 · 市长).
 * It's the simplest segmentation and it gets most sentences right; it can
 * fail where two words overlap, but every piece is still a real entry.
 *
 * `readings` (one syllable per character, like the sentence's pinyin) picks
 * among homographs: 长 in 他长高了 is the entry read "zhǎng".
 */
export function segmentSentence(
  sentence: string,
  index: WordIndex,
  readings: readonly (string | undefined)[] = [],
): SentenceWord[] {
  const symbols = Array.from(sentence)
  const words: SentenceWord[] = []
  let position = 0

  while (position < symbols.length) {
    const match = HAN.test(symbols[position]!) ? findLongest(symbols, position, index) : undefined
    if (match) {
      const syllables = readings.slice(position, position + match.length)
      const reading = syllables.length === match.length && syllables.every(Boolean) ? syllables.join(' ') : undefined
      words.push({
        text: match.hanzi,
        item: pickEntry(match.entries, reading),
      })
      position += match.length
      continue
    }
    // Not a word: joined with the text around it that isn't one either
    const last = words.at(-1)
    if (last && !last.item) last.text += symbols[position]
    else words.push({ text: symbols[position]! })
    position += 1
  }
  return words
}

function findLongest(symbols: readonly string[], start: number, index: WordIndex) {
  for (let length = Math.min(index.longest(), symbols.length - start); length >= 1; length--) {
    const hanzi = symbols.slice(start, start + length).join('')
    const entries = index.find(hanzi)
    if (entries.length > 0) return { hanzi, length, entries }
  }
  return undefined
}

/**
 * The entry a word of the sentence refers to: the word read like the
 * sentence's pinyin; otherwise, for a single character, its character entry
 * (which has all its readings); otherwise the first word (HSK first).
 */
function pickEntry(entries: readonly StudyItem[], reading: string | undefined): StudyItem {
  const words = entries.filter((item) => item.kind === 'word')
  return (
    words.find((item) => reading !== undefined && item.entry.pinyin.toLowerCase() === reading.toLowerCase()) ??
    entries.find((item) => item.kind === 'character') ??
    words[0]!
  )
}
