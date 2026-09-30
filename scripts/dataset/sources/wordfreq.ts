/**
 * Adapter for wordfreq's Chinese word list (data CC BY-SA 4.0), exported
 * as TSV by export-wordfreq.py.
 *
 * Responsibility: `frequencyRank` of words and characters. Only positions
 * in the list are used, never made-up values: a word that isn't in the list
 * has no rank.
 */

/** Frequency ranks by hanzi (1 = the most frequent). */
export interface FrequencyRanks {
  words: ReadonlyMap<string, number>
  characters: ReadonlyMap<string, number>
}

const HAN_ONLY = /^\p{Script=Han}+$/u

/**
 * Reads the TSV ("word<TAB>frequency", most frequent first) and computes
 * the ranks. Entries that aren't only hanzi (English words, numbers) are
 * skipped, so they don't take up positions.
 *
 * - Word rank: position among the Chinese words.
 * - Character rank: by how often the character appears in text, that is,
 *   the sum of the frequencies of every word it is part of. The character
 *   alone as a word would undercount bound ones: 们 is almost always in 我们,
 *   你们, 他们.
 */
export function parseWordfreq(tsv: string): FrequencyRanks {
  const words = new Map<string, number>()
  const characterFrequencies = new Map<string, number>()

  for (const line of tsv.split('\n')) {
    if (line === '') continue
    const [word, value] = line.split('\t')
    const frequency = Number(value)
    if (word === undefined || !Number.isFinite(frequency) || frequency <= 0) {
      throw new Error(`wordfreq: unexpected line "${line}"`)
    }
    if (!HAN_ONLY.test(word) || words.has(word)) continue
    words.set(word, words.size + 1)
    for (const character of word) {
      characterFrequencies.set(character, (characterFrequencies.get(character) ?? 0) + frequency)
    }
  }

  // On equal frequency the character order decides, so the result is always the same
  const sorted = [...characterFrequencies].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
  const characters = new Map(sorted.map(([character], index) => [character, index + 1]))
  return { words, characters }
}

/** The entry with its rank, if the list has it. */
export function withFrequencyRank<T extends { hanzi: string; frequencyRank?: number }>(
  entry: T,
  ranks: ReadonlyMap<string, number>,
): T {
  const frequencyRank = ranks.get(entry.hanzi)
  return frequencyRank === undefined ? entry : { ...entry, frequencyRank }
}
