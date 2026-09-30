/**
 * Adapter for the HSK 2.0 list from clem109/hsk-vocabulary (MIT).
 *
 * Responsibility: which words are in each level and their exam pinyin.
 * This list's translations are not used: the meanings come from CC-CEDICT.
 */
export interface HskWord {
  hanzi: string
  /** Exam pinyin with tone marks, syllables separated by spaces: "nǐ hǎo". */
  pinyin: string
}

/** Reads a level's JSON (`hsk-level-1.json`). */
export function parseHskList(json: string): HskWord[] {
  const entries: unknown = JSON.parse(json)
  if (!Array.isArray(entries)) throw new Error('The HSK list must be a JSON array')
  return entries.map((entry: { hanzi?: unknown; pinyin?: unknown }, index) => {
    if (typeof entry.hanzi !== 'string' || typeof entry.pinyin !== 'string') {
      throw new Error(`HSK list: entry ${index} does not have hanzi and pinyin`)
    }
    return { hanzi: entry.hanzi, pinyin: entry.pinyin }
  })
}
