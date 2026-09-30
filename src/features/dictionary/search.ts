import { removeToneMarks } from '../../lib/pinyin.ts'
import { getMeanings } from './dictionary.ts'
import type { StudyItem } from './studyItem.ts'
import type { Character, Word } from './types.ts'

/** Comparable pinyin: no tone marks, no spaces and no tone numbers ("nǐ hǎo", "ni3 hao3" → "nihao"). */
function normalizePinyin(text: string): string {
  return removeToneMarks(text).replace(/[\s\d]/g, '')
}

const HAN = /\p{Script=Han}/u

/**
 * Does the entry match what the user is searching for? You can search by
 * hanzi (好), by pinyin with or without tones (hǎo, hao, hao3) or by English
 * meaning (good).
 */
export function matchesSearch(entry: Character | Word, query: string): boolean {
  return query.trim() === '' || getSearchRank(entry, query) !== undefined
}

/** An entry's texts, prepared for comparison. Computed once per entry. */
interface SearchFields {
  readings: string[]
  meanings: string[]
}

const searchFieldsCache = new WeakMap<Character | Word, SearchFields>()

function getSearchFields(entry: Character | Word): SearchFields {
  let fields = searchFieldsCache.get(entry)
  if (!fields) {
    const readings = typeof entry.pinyin === 'string' ? [entry.pinyin] : entry.pinyin
    fields = {
      readings: readings.map(normalizePinyin),
      meanings: getMeanings(entry.meanings).map((meaning) => meaning.toLowerCase()),
    }
    searchFieldsCache.set(entry, fields)
  }
  return fields
}

/**
 * How well an entry matches the search: the lower, the better.
 * `undefined` if it doesn't match.
 *
 * 0. exact hanzi (果)       1. starts with it (果汁)       2. contains it (苹果)
 * 3. exact pinyin (guo)     4. pinyin starting with it    5. pinyin containing it
 * 6. meaning that is exactly that ("apple") or has it as a whole word
 * 7. meaning that contains it ("apples", "pineapple")
 */
export function getSearchRank(entry: Character | Word, query: string): number | undefined {
  return createMatcher(query)(entry)
}

/**
 * Prepares the search once (normalized text, regular expression) and
 * returns the function that scores each entry. With the full dictionary
 * that's over 100,000 entries per search.
 */
function createMatcher(query: string): (entry: Character | Word) => number | undefined {
  const text = query.trim().toLowerCase()
  if (text === '') return () => undefined

  if (HAN.test(text)) {
    return (entry) => {
      if (entry.hanzi === text) return 0
      if (entry.hanzi.startsWith(text)) return 1
      if (entry.hanzi.includes(text)) return 2
      return undefined
    }
  }

  const pinyin = normalizePinyin(text)
  const wholeWord = new RegExp(`(^|[^a-z])${escapeRegExp(text)}($|[^a-z])`)
  return (entry) => {
    const { readings, meanings } = getSearchFields(entry)
    if (pinyin !== '') {
      if (readings.includes(pinyin)) return 3
      if (readings.some((reading) => reading.startsWith(pinyin))) return 4
      // Containing only counts with 2 or more letters: otherwise "a" would match almost everything
      if (pinyin.length > 1 && readings.some((reading) => reading.includes(pinyin))) return 5
    }
    if (meanings.some((meaning) => meaning === text || wholeWord.test(meaning))) return 6
    if (meanings.some((meaning) => meaning.includes(text))) return 7
    return undefined
  }
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Searches the dictionary and sorts: exact matches first, then partial
 * ones (tier); within each group, HSK 1-4 entries before the rest, then by
 * how well it matches (getSearchRank), characters before words, HSK level
 * (outside HSK, shortest first) and dataset order.
 */
export function searchItems(items: readonly StudyItem[], query: string, limit = Infinity): StudyItem[] {
  const rankOf = createMatcher(query)
  return items
    .map((item, index) => ({ item, index, rank: rankOf(item.entry) }))
    .filter((result) => result.rank !== undefined)
    .sort(
      (a, b) =>
        tier(a.rank!) - tier(b.rank!) ||
        outsideHsk(a.item) - outsideHsk(b.item) ||
        a.rank! - b.rank! ||
        kindOrder(a.item) - kindOrder(b.item) ||
        levelOrder(a.item) - levelOrder(b.item) ||
        lengthOutsideHsk(a.item) - lengthOutsideHsk(b.item) ||
        a.index - b.index,
    )
    .slice(0, limit)
    .map((result) => result.item)
}

/**
 * Exact matches (hanzi, pinyin or whole meaning: 0, 3 and 6) before
 * partial ones. That way "bank" gives 银行 first and not words whose
 * pinyin starts with "bank" (版刻 bǎn kè).
 */
function tier(rank: number): number {
  return rank === 0 || rank === 3 || rank === 6 ? 0 : 1
}

/** HSK 1-4 entries go before the rest of the dictionary. */
function outsideHsk(item: StudyItem): number {
  return item.entry.hskLevel === undefined ? 1 : 0
}

function levelOrder(item: StudyItem): number {
  return item.entry.hskLevel ?? 0
}

/** Outside HSK, short words first: they tend to be the most common. */
function lengthOutsideHsk(item: StudyItem): number {
  return item.entry.hskLevel === undefined ? item.entry.hanzi.length : 0
}

function kindOrder(item: StudyItem): number {
  return item.kind === 'character' ? 0 : 1
}
