import { isRecord } from '../../lib/storage.ts'
import { numberedSyllableToToneMarks, removeToneMarks } from '../../lib/pinyin.ts'
import type { WordIndex } from '../dictionary/segmentation.ts'
import { getStudyItemId, type StudyItem, type StudyItemId } from '../dictionary/studyItem.ts'
import type { CustomSetDetails } from './types.ts'

/**
 * Importing a set from text: JSON (what an AI is asked to write, see
 * AI_PROMPT) or a plain list, one word per line, optionally followed by its
 * pinyin ("苹果, píng guǒ"). Only hanzi (and pinyin to pick among homographs)
 * are read: meanings always come from the dictionary.
 */

/** A word asked for in the imported text. */
export interface ImportEntry {
  hanzi: string
  /** Optional: only used to pick among entries with the same hanzi (长 cháng / zhǎng). */
  pinyin?: string
}

export interface ParsedImport {
  /** Only in JSON; with a list, the user types the name. */
  details: Partial<CustomSetDetails>
  entries: ImportEntry[]
}

export type ImportProblem = 'empty' | 'invalidJson' | 'noEntries' | 'tooManyEntries'

/** Enough for a big set, and keeps a pasted dictionary from freezing the page. */
export const MAX_IMPORT_ENTRIES = 500

/** Prompt to paste into any AI chat; the user replaces the bracketed parts. */
export const AI_PROMPT = `Create a Chinese vocabulary study set about [TOPIC] for a learner at level [HSK 1-6 or beginner/intermediate/advanced].
Use Simplified Chinese. Choose about 20 useful words.
Reply ONLY with JSON in exactly this format, with no explanations:
{
  "name": "Short set name",
  "description": "One sentence about the set",
  "words": [
    { "hanzi": "苹果", "pinyin": "píng guǒ" }
  ]
}`

const HAN = /\p{Script=Han}/u
const HAN_RUNS = /\p{Script=Han}+/gu

/** Reads the pasted text: JSON if it looks like JSON, otherwise a list. */
export function parseImport(text: string): { parsed: ParsedImport } | { problem: ImportProblem } {
  // AIs often wrap their answer in a ```json code block
  const trimmed = text
    .trim()
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
  if (trimmed === '') return { problem: 'empty' }

  let parsed: ParsedImport
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const fromJson = parseJson(trimmed)
    if (!fromJson) return { problem: 'invalidJson' }
    parsed = fromJson
  } else {
    parsed = { details: {}, entries: parseList(trimmed) }
  }

  if (parsed.entries.length === 0) return { problem: 'noEntries' }
  if (parsed.entries.length > MAX_IMPORT_ENTRIES) return { problem: 'tooManyEntries' }
  return { parsed }
}

/** `{ name, description, words: [...] }` or just the array of words; each word a string or `{ hanzi, pinyin }`. */
function parseJson(text: string): ParsedImport | undefined {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return undefined
  }
  const words = Array.isArray(value) ? value : isRecord(value) ? value.words : undefined
  if (!Array.isArray(words)) return undefined

  const details: Partial<CustomSetDetails> = {}
  if (isRecord(value)) {
    if (typeof value.name === 'string') details.name = value.name.trim()
    if (typeof value.description === 'string') details.description = value.description.trim()
  }

  const entries: ImportEntry[] = []
  for (const word of words) {
    const hanzi = typeof word === 'string' ? word : isRecord(word) ? word.hanzi : undefined
    if (typeof hanzi !== 'string' || !HAN.test(hanzi)) continue
    const pinyin = isRecord(word) && typeof word.pinyin === 'string' ? word.pinyin.trim() : ''
    entries.push({ hanzi: hanzi.trim(), ...(pinyin === '' ? {} : { pinyin }) })
  }
  return { details, entries }
}

/**
 * One or more words per line, separated by commas, tabs, spaces or Chinese
 * punctuation. Text without hanzi right after a word is its pinyin; anything
 * else without hanzi (a CSV header, an English meaning) is ignored.
 */
function parseList(text: string): ImportEntry[] {
  const entries: ImportEntry[] = []
  for (const line of text.split(/\r?\n/)) {
    let last: ImportEntry | undefined
    for (const field of line.split(/[,;\t，；、]/)) {
      const pinyin: string[] = []
      for (const token of field.trim().split(/\s+/)) {
        const hanzi = token.match(HAN_RUNS)
        if (hanzi) {
          if (last && pinyin.length > 0 && !last.pinyin) last.pinyin = pinyin.join(' ')
          pinyin.length = 0
          for (const run of hanzi) {
            last = { hanzi: run }
            entries.push(last)
          }
        } else if (token !== '') {
          pinyin.push(token)
        }
      }
      if (last && pinyin.length > 0 && !last.pinyin) last.pinyin = pinyin.join(' ')
    }
  }
  return entries
}

export interface ImportMatch {
  /** In the order they were asked for, without repeats. */
  itemIds: StudyItemId[]
  /** Words with no dictionary entry: they are not added. */
  notFound: ImportEntry[]
}

/**
 * Finds each word in the dictionary (whose entries for these hanzi must
 * already be loaded, see DictionaryStore.loadText).
 */
export function matchImport(entries: readonly ImportEntry[], index: WordIndex): ImportMatch {
  const itemIds: StudyItemId[] = []
  const notFound: ImportEntry[] = []
  for (const entry of entries) {
    const item = pickItem(index.find(entry.hanzi), entry.pinyin)
    if (!item) notFound.push(entry)
    else if (!itemIds.includes(getStudyItemId(item))) itemIds.push(getStudyItemId(item))
  }
  return { itemIds, notFound }
}

/**
 * The entry read like the given pinyin (with tones, then without them);
 * otherwise the first word (HSK ones come first), then the character. A
 * wrong pinyin does not lose the word: the hanzi is what matters.
 */
function pickItem(items: readonly StudyItem[], pinyin: string | undefined): StudyItem | undefined {
  const ordered = [...items].sort((a, b) => Number(a.kind === 'character') - Number(b.kind === 'character'))
  if (pinyin !== undefined) {
    const wanted = normalizePinyin(pinyin)
    const readings = (item: StudyItem) =>
      (item.kind === 'word' ? [item.entry.pinyin] : item.entry.pinyin).map(normalizePinyin)
    const match =
      ordered.find((item) => readings(item).includes(wanted)) ??
      ordered.find((item) => readings(item).map(removeToneMarks).includes(removeToneMarks(wanted)))
    if (match) return match
  }
  return ordered[0]
}

/** "Píng guǒ", "ping2 guo3" and "ping2guo3" → "píngguǒ". */
export function normalizePinyin(pinyin: string): string {
  return pinyin
    .toLowerCase()
    .replace(/[a-zü:v]+[1-5]/g, numberedSyllableToToneMarks)
    .normalize('NFC')
    .replace(/[^\p{L}]/gu, '')
}
